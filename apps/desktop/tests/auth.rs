use super::*;

#[test]
fn key_name_fits_better_auth() {
    assert_eq!(
        key_name("Nicolass-Mac-mini.local"),
        "Penombre Sync on Nicolass-Mac-mi"
    );
    assert_eq!(key_name("box"), "Penombre Sync on box");
    assert_eq!(key_name(""), "Penombre Sync on this computer");
}

#[test]
fn token_answers_map_to_poll_outcomes() {
    assert_eq!(
        poll_outcome(200, r#"{"access_token":"t","token_type":"Bearer"}"#),
        Poll::Token("t".into())
    );
    assert_eq!(
        poll_outcome(400, r#"{"error":"authorization_pending"}"#),
        Poll::Pending
    );
    assert_eq!(
        poll_outcome(400, r#"{"error":"slow_down"}"#),
        Poll::SlowDown
    );
    assert_eq!(
        poll_outcome(400, r#"{"error":"access_denied"}"#),
        Poll::Stop("Sign-in was denied.".into())
    );
    assert_eq!(
        poll_outcome(400, r#"{"error":"expired_token"}"#),
        Poll::Stop("The code expired. Sign in again.".into())
    );
    assert_eq!(
        poll_outcome(
            400,
            r#"{"error":"invalid_grant","error_description":"Bad code"}"#
        ),
        Poll::Stop("Bad code".into())
    );
    assert!(matches!(poll_outcome(502, "<html>"), Poll::Stop(_)));
    assert!(matches!(poll_outcome(200, "{}"), Poll::Stop(_)));
}
