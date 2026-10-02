use std::sync::Arc;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::mpsc::Sender;
use std::time::{Duration, Instant};

use reqwest::blocking::Client;
use serde::Deserialize;
use serde_json::json;

const CLIENT_ID: &str = "penombre-sync";
const DEVICE_GRANT: &str = "urn:ietf:params:oauth:grant-type:device_code";

pub enum AuthEvent {
    Code { user_code: String },
    Done { key: String, name: String },
    Failed(String),
}

#[derive(Debug, PartialEq)]
pub enum Poll {
    Token(String),
    Pending,
    SlowDown,
    Stop(String),
}

#[derive(Deserialize)]
struct DeviceCode {
    device_code: String,
    user_code: String,
    verification_uri_complete: String,
    expires_in: u64,
    interval: u64,
}

/// Maps one `/device/token` answer to what the poll loop does next.
pub fn poll_outcome(status: u16, body: &str) -> Poll {
    let json: serde_json::Value = serde_json::from_str(body).unwrap_or_default();
    if (200..300).contains(&status) {
        return match json["access_token"].as_str() {
            Some(token) => Poll::Token(token.to_owned()),
            None => Poll::Stop("The server answered without a token.".into()),
        };
    }
    match json["error"].as_str() {
        Some("authorization_pending") => Poll::Pending,
        Some("slow_down") => Poll::SlowDown,
        Some("access_denied") => Poll::Stop("Sign-in was denied.".into()),
        Some("expired_token") => Poll::Stop("The code expired. Sign in again.".into()),
        Some(other) => Poll::Stop(
            json["error_description"]
                .as_str()
                .unwrap_or(other)
                .to_owned(),
        ),
        None => Poll::Stop(format!(
            "Unexpected answer from the server (HTTP {status})."
        )),
    }
}

/// Runs the whole device flow and reports through `events`; `wake` after each.
pub fn sign_in(
    server: String,
    cancel: Arc<AtomicBool>,
    events: Sender<AuthEvent>,
    wake: impl Fn(),
) {
    let result = run(&server, &cancel, &|event| {
        let _ = events.send(event);
        wake();
    });
    if cancel.load(Ordering::Relaxed) {
        return;
    }
    let _ = events.send(match result {
        Ok((key, name)) => AuthEvent::Done { key, name },
        Err(error) => AuthEvent::Failed(error),
    });
    wake();
}

fn run(
    server: &str,
    cancel: &AtomicBool,
    report: &dyn Fn(AuthEvent),
) -> Result<(String, String), String> {
    let client = Client::builder()
        .timeout(Duration::from_secs(30))
        .build()
        .map_err(|e| e.to_string())?;

    let code: DeviceCode = client
        .post(format!("{server}/api/v1/auth/device/code"))
        .json(&json!({ "client_id": CLIENT_ID }))
        .send()
        .and_then(|r| r.error_for_status())
        .and_then(|r| r.json())
        .map_err(|e| format!("Could not start sign-in: {e}"))?;
    report(AuthEvent::Code {
        user_code: code.user_code.clone(),
    });
    let mut page = code.verification_uri_complete;
    if page.starts_with('/') {
        page = format!("{server}{page}");
    }
    if let Err(error) = open::that(&page) {
        log::warn!("could not open the browser: {error}");
    }

    let deadline = Instant::now() + Duration::from_secs(code.expires_in);
    let mut interval = Duration::from_secs(code.interval.max(1));
    let token = loop {
        if !wait(interval, cancel) {
            return Err("Cancelled.".into());
        }
        if Instant::now() > deadline {
            return Err("The code expired. Sign in again.".into());
        }
        let response = client
            .post(format!("{server}/api/v1/auth/device/token"))
            .json(&json!({
                "grant_type": DEVICE_GRANT,
                "device_code": code.device_code,
                "client_id": CLIENT_ID,
            }))
            .send()
            .map_err(|e| format!("Could not reach the server: {e}"))?;
        let status = response.status().as_u16();
        let body = response.text().unwrap_or_default();
        match poll_outcome(status, &body) {
            Poll::Token(token) => break token,
            Poll::Pending => {}
            Poll::SlowDown => interval += Duration::from_secs(5),
            Poll::Stop(error) => return Err(error),
        }
    };

    let name = key_name(&hostname());
    let created: serde_json::Value = client
        .post(format!("{server}/api/v1/auth/api-key/create"))
        .bearer_auth(&token)
        .header("Origin", server)
        .json(&json!({ "name": name }))
        .send()
        .and_then(|r| r.error_for_status())
        .and_then(|r| r.json())
        .map_err(|e| format!("Could not create an API key: {e}"))?;
    let key = created["key"]
        .as_str()
        .ok_or("The server returned no API key.")?
        .to_owned();

    let signed_out = client
        .post(format!("{server}/api/v1/auth/sign-out"))
        .bearer_auth(&token)
        .header("Origin", server)
        .json(&json!({}))
        .send();
    if let Err(error) = signed_out {
        log::warn!("could not end the temporary session: {error}");
    }

    crate::store::write_key(server, &key)?;
    Ok((key, name))
}

/// Sleeps `total` unless cancelled; whether it ran to the end.
fn wait(total: Duration, cancel: &AtomicBool) -> bool {
    let end = Instant::now() + total;
    while Instant::now() < end {
        if cancel.load(Ordering::Relaxed) {
            return false;
        }
        std::thread::sleep(Duration::from_millis(200));
    }
    !cancel.load(Ordering::Relaxed)
}

fn hostname() -> String {
    std::process::Command::new("hostname")
        .output()
        .ok()
        .and_then(|out| String::from_utf8(out.stdout).ok())
        .map(|name| name.trim().to_owned())
        .filter(|name| !name.is_empty())
        .unwrap_or_else(|| "this computer".into())
}

/// better-auth caps key names at 32 characters.
fn key_name(hostname: &str) -> String {
    let host = hostname.split('.').next().unwrap_or_default();
    let host = if host.is_empty() {
        "this computer"
    } else {
        host
    };
    format!("Penombre Sync on {host}")
        .chars()
        .take(32)
        .collect()
}

#[cfg(test)]
mod tests {
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
}
