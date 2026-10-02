use super::*;

fn failure(name: &str) -> Failure {
    Failure {
        pair: "My drive".into(),
        name: name.into(),
        message: "Failed to copy: unchunked simple update failed: 413 Request Entity Too Large"
            .into(),
        at: SystemTime::UNIX_EPOCH,
    }
}

#[test]
fn a_file_is_retried_once_then_reported_once() {
    let mut r = Retries::default();
    assert!(r.record("k", false, &[], vec![failure("a.bin")]).is_empty());
    assert!(r.retry_soon(), "a first failure retries early");
    assert!(!r.retry_soon());
    let told = r.record("k", false, &[], vec![failure("a.bin")]);
    assert_eq!(told, vec![failure("a.bin")]);
    assert!(!r.retry_soon(), "back to the normal period");
    assert!(r.record("k", false, &[], vec![failure("a.bin")]).is_empty());
    assert_eq!(r.failures().len(), 1);
}

#[test]
fn a_success_clears_a_file_so_it_can_be_reported_again() {
    let mut r = Retries::default();
    r.record("k", false, &[], vec![failure("a.bin")]);
    r.record("k", false, &["a.bin".into()], vec![]);
    assert!(r.failures().is_empty());
    r.record("k", false, &[], vec![failure("a.bin")]);
    assert_eq!(r.record("k", false, &[], vec![failure("a.bin")]).len(), 1);
    r.record("k", true, &[], vec![]);
    assert!(r.failures().is_empty(), "a clean run clears its pair");
}

#[test]
fn notices_name_one_file_or_count_them() {
    assert_eq!(
        notice(&[failure("docs/report.docx")]).unwrap(),
        "Couldn't sync report.docx — 413 Request Entity Too Large"
    );
    assert_eq!(
        notice(&[failure("a"), failure("b")]).unwrap(),
        "Couldn't sync 2 files — 413 Request Entity Too Large"
    );
    assert_eq!(notice(&[]), None);
}

#[test]
fn a_pair_that_cannot_start_is_reported_once_per_streak() {
    let error = r#"CRITICAL: Failed to create file system: read metadata failed: {"error":"Too many failed attempts"}: 429 Too Many Requests"#;
    let mut r = Retries::default();
    assert_eq!(r.run_failed("k", "Music", error), None);
    assert_eq!(
        r.run_failed("k", "Music", error).unwrap(),
        "Music can't sync — 429 Too Many Requests"
    );
    assert_eq!(r.run_failed("k", "Music", error), None);
    r.record("k", true, &[], vec![]);
    assert_eq!(r.run_failed("k", "Music", error), None);
    assert!(r.run_failed("k", "Music", error).is_some(), "a new streak");
}
