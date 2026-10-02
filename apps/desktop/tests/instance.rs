use super::*;

#[test]
fn a_second_claim_knocks_on_the_first() {
    let dir = std::env::temp_dir().join(format!("penombre-instance-{}", std::process::id()));
    let Ok(Claim::First(first)) = claim(&dir) else {
        panic!("the first claim should win");
    };
    assert!(matches!(claim(&dir), Ok(Claim::Second)));
    first.listener.set_nonblocking(true).unwrap();
    let knocked = (0..100).any(|_| {
        std::thread::sleep(Duration::from_millis(10));
        first.listener.accept().is_ok()
    });
    assert!(knocked, "the second one knocked");
    drop(first);
    // A child forked by a parallel test keeps the lock's file description
    // until it execs, so the release can lag by a moment.
    let reclaimed = (0..100).any(|_| {
        std::thread::sleep(Duration::from_millis(20));
        matches!(claim(&dir), Ok(Claim::First(_)))
    });
    assert!(reclaimed, "the lock outlived the first instance");
    let _ = std::fs::remove_dir_all(&dir);
}

#[test]
fn a_relaunch_waits_for_the_old_instance_instead_of_knocking() {
    let dir = std::env::temp_dir().join(format!("penombre-relaunch-{}", std::process::id()));
    let Ok(Claim::First(old)) = claim(&dir) else {
        panic!("no first claim");
    };
    let quitting = std::thread::spawn(move || {
        std::thread::sleep(Duration::from_millis(300));
        drop(old);
    });
    let claimed = claim_when_free(&dir, Duration::from_secs(5)).unwrap();
    quitting.join().unwrap();
    assert!(matches!(claimed, Claim::First(_)));
    let _ = std::fs::remove_dir_all(&dir);
}
