//! What the app is allowed to do, checked when the Settings view is shown or
//! the window regains focus.

use std::io::ErrorKind;

use crate::store::{self, Pair};
use crate::sync;
use crate::ui::{Check, Level, home_relative};

const PRIVACY_FILES: &str =
    "x-apple.systempreferences:com.apple.preference.security?Privacy_AllFiles";

pub fn checks(pairs: &[Pair], server: &str, signed_in: bool) -> Vec<Check> {
    let mut checks = vec![notifications()];
    checks.extend(pairs.iter().map(folder));
    checks.push(match sync::find_rclone() {
        Some(path) => check("rclone", path.display().to_string(), Level::Ok, None),
        None => check(
            "rclone",
            "Not found on PATH or in the usual places.".into(),
            Level::Problem,
            Some(("Install", "https://rclone.org/install/".into())),
        ),
    });
    checks.push(if !signed_in {
        check(
            "Keychain",
            "Nothing stored: not signed in.".into(),
            Level::Neutral,
            None,
        )
    } else if store::read_key(server).is_some() {
        check(
            "Keychain",
            "The API key reads back.".into(),
            Level::Ok,
            None,
        )
    } else {
        check(
            "Keychain",
            "The API key could not be read. Sign in again.".into(),
            Level::Problem,
            None,
        )
    });
    checks
}

fn check(
    label: &str,
    detail: String,
    level: Level,
    action: Option<(&'static str, String)>,
) -> Check {
    Check {
        label: label.into(),
        detail,
        level,
        action,
    }
}

fn folder(pair: &Pair) -> Check {
    let label = home_relative(&pair.local);
    match std::fs::read_dir(&pair.local) {
        Ok(_) => check(&label, "Readable.".into(), Level::Ok, None),
        Err(e) if e.kind() == ErrorKind::NotFound => check(
            &label,
            "Created on the next sync.".into(),
            Level::Neutral,
            None,
        ),
        Err(e) if e.kind() == ErrorKind::PermissionDenied && cfg!(target_os = "macos") => check(
            &label,
            "Blocked by macOS privacy settings. Allow Files and Folders or Full Disk Access."
                .into(),
            Level::Problem,
            Some(("Open settings", PRIVACY_FILES.into())),
        ),
        Err(e) => check(&label, format!("Cannot be read: {e}"), Level::Problem, None),
    }
}

#[cfg(target_os = "macos")]
fn notifications() -> Check {
    let bundled = crate::notify::bundled();
    notification_check(bundled, bundled.then(crate::notify::allowed).flatten())
}

/// Only the `.app` has a permission to read: elsewhere Script Editor shows
/// them, and `allowed` is `None` while the person has not decided.
#[cfg(target_os = "macos")]
fn notification_check(bundled: bool, allowed: Option<bool>) -> Check {
    if !bundled {
        return check(
            "Notifications",
            "Shown through Script Editor: only the app from the .dmg shows its own.".into(),
            Level::Neutral,
            Some((
                "Open settings",
                "x-apple.systempreferences:com.apple.preference.notifications".into(),
            )),
        );
    }
    let (level, detail) = match allowed {
        Some(true) => (Level::Ok, "Allowed."),
        Some(false) => (
            Level::Problem,
            "Turned off in System Settings: a sync that keeps failing goes unnoticed.",
        ),
        None => (Level::Neutral, "Not decided yet in System Settings."),
    };
    check(
        "Notifications",
        detail.into(),
        level,
        Some((
            "Open settings",
            "x-apple.systempreferences:com.apple.Notifications-Settings.extension?id=dev.penombre.sync"
                .into(),
        )),
    )
}

#[cfg(target_os = "linux")]
fn notifications() -> Check {
    match notify_rust::get_server_information() {
        Ok(server) => check("Notifications", server.name, Level::Ok, None),
        Err(e) => check(
            "Notifications",
            format!("No notification service answers: {e}"),
            Level::Problem,
            None,
        ),
    }
}

#[cfg(not(any(target_os = "macos", target_os = "linux")))]
fn notifications() -> Check {
    check(
        "Notifications",
        "Windows notifications.".into(),
        Level::Ok,
        None,
    )
}

#[cfg(test)]
#[path = "../../tests/app/permissions.rs"]
mod tests;
