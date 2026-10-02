use super::*;

#[test]
fn changes_settle_before_a_sync_and_periodic_runs_follow() {
    let t0 = Instant::now();
    let mut s = Schedule::new(t0);
    assert!(s.due(t0), "syncs on start");
    s.synced(t0, false);
    assert!(!s.due(t0 + Duration::from_secs(60)));
    s.changed(t0 + Duration::from_secs(60));
    s.changed(t0 + Duration::from_secs(62));
    assert!(
        !s.due(t0 + Duration::from_secs(66)),
        "debounced by the last change"
    );
    assert!(s.due(t0 + Duration::from_secs(67)));
    s.synced(t0 + Duration::from_secs(67), false);
    assert_eq!(s.next(), t0 + Duration::from_secs(67) + PERIOD);
    s.sync_now(t0 + Duration::from_secs(70));
    assert!(s.due(t0 + Duration::from_secs(70)));
}

#[test]
fn an_unreachable_server_is_asked_again_soon_and_sync_now_asks_at_once() {
    let t0 = Instant::now();
    let mut s = Schedule::new(t0);
    s.changed(t0);
    s.unreachable(t0);
    assert_eq!(s.next(), t0 + super::super::reach::PROBE);
    s.changed(t0 + Duration::from_secs(1));
    assert!(
        s.due(t0 + Duration::from_secs(6)),
        "a local change still asks"
    );
    s.unreachable(t0 + Duration::from_secs(6));
    s.sync_now(t0 + Duration::from_secs(7));
    assert!(s.due(t0 + Duration::from_secs(7)), "Retry now asks at once");
}

#[test]
fn a_pause_holds_everything_and_resuming_syncs_at_once() {
    let t0 = Instant::now();
    let mut s = Schedule::new(t0);
    s.synced(t0, true);
    assert_eq!(s.next(), t0 + RETRY, "failed files retry early");
    s.pause(true, t0);
    s.changed(t0);
    s.sync_now(t0);
    assert!(!s.due(t0 + PERIOD * 2), "nothing runs while paused");
    s.pause(false, t0 + PERIOD * 2);
    assert!(s.due(t0 + PERIOD * 2));
}
