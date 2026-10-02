use super::*;

#[test]
fn sizes_and_times_read_short() {
    assert_eq!(bytes(999), "999 B");
    assert_eq!(bytes(409_600), "409.6 KB");
    assert_eq!(bytes(6_291_456), "6.3 MB");
    assert_eq!(duration(42), "42 s");
    assert_eq!(duration(61), "2 min");
    let now = SystemTime::now();
    assert_eq!(ago(now, now), "just now");
    assert_eq!(
        ago(now - std::time::Duration::from_secs(7200), now),
        "2 h ago"
    );
}
