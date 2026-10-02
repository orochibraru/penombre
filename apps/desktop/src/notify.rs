//! The system's notifications. On macOS only the signed `.app` shows its own:
//! UserNotifications aborts any process outside a bundle and refuses an ad-hoc
//! signature. Everything else goes through Script Editor.

pub fn show(text: &str) {
    log::warn!("{text}");
    if let Err(error) = native(text) {
        log::warn!("could not show a notification: {error}");
    }
}

#[cfg(not(target_os = "macos"))]
fn native(text: &str) -> Result<(), String> {
    notify_rust::Notification::new()
        .summary("Penombre Sync")
        .body(text)
        .show()
        .map(drop)
        .map_err(|e| e.to_string())
}

#[cfg(target_os = "macos")]
fn native(text: &str) -> Result<(), String> {
    macos::send(text).or_else(|_| script_editor(text))
}

#[cfg(target_os = "macos")]
fn script_editor(text: &str) -> Result<(), String> {
    std::process::Command::new("osascript")
        .args([
            "-e",
            "on run argv",
            "-e",
            "display notification (item 2 of argv) with title (item 1 of argv)",
            "-e",
            "end run",
            "Penombre Sync",
            text,
        ])
        .status()
        .map_err(|e| e.to_string())
        .and_then(|s| s.success().then_some(()).ok_or(s.to_string()))
}

#[cfg(target_os = "macos")]
pub use macos::{allowed, ask, bundled};

#[cfg(target_os = "macos")]
mod macos {
    use std::ptr::NonNull;
    use std::sync::mpsc::channel;
    use std::time::{Duration, SystemTime};

    use block2::RcBlock;
    use objc2::rc::Retained;
    use objc2::runtime::Bool;
    use objc2_foundation::{NSError, NSString};
    use objc2_user_notifications::{
        UNAuthorizationOptions, UNAuthorizationStatus, UNMutableNotificationContent,
        UNNotificationRequest, UNNotificationSettings, UNUserNotificationCenter,
    };

    const WAIT: Duration = Duration::from_secs(2);

    pub fn bundled() -> bool {
        std::env::current_exe().is_ok_and(|exe| {
            exe.parent()
                .is_some_and(|dir| dir.ends_with("Contents/MacOS"))
                && exe
                    .ancestors()
                    .nth(3)
                    .and_then(|app| app.extension())
                    .is_some_and(|ext| ext == "app")
        })
    }

    fn center() -> Option<Retained<UNUserNotificationCenter>> {
        bundled().then(UNUserNotificationCenter::currentNotificationCenter)
    }

    /// The first time, macOS asks the person; after that it answers alone.
    pub fn ask() {
        let Some(center) = center() else {
            return;
        };
        let reply = RcBlock::new(|granted: Bool, error: *mut NSError| {
            if !granted.as_bool() {
                // SAFETY: null or a live error, for the length of the call.
                let reason = unsafe { error.as_ref() }.map(|e| e.localizedDescription());
                log::info!("notifications not allowed: {reason:?}");
            }
        });
        center.requestAuthorizationWithOptions_completionHandler(
            UNAuthorizationOptions::Alert | UNAuthorizationOptions::Sound,
            &reply,
        );
    }

    /// `None` while undecided, or outside the `.app`.
    pub fn allowed() -> Option<bool> {
        let center = center()?;
        let (tx, rx) = channel();
        let reply = RcBlock::new(move |settings: NonNull<UNNotificationSettings>| {
            // SAFETY: the system hands the block a live settings object.
            let _ = tx.send(unsafe { settings.as_ref() }.authorizationStatus());
        });
        center.getNotificationSettingsWithCompletionHandler(&reply);
        match rx.recv_timeout(WAIT).ok()? {
            UNAuthorizationStatus::Denied => Some(false),
            UNAuthorizationStatus::NotDetermined => None,
            _ => Some(true),
        }
    }

    pub fn send(text: &str) -> Result<(), String> {
        let center = center().ok_or("not running as the app")?;
        let content = UNMutableNotificationContent::new();
        content.setTitle(&NSString::from_str("Penombre Sync"));
        content.setBody(&NSString::from_str(text));
        let id = NSString::from_str(&format!("{:?}", SystemTime::now()));
        let request =
            UNNotificationRequest::requestWithIdentifier_content_trigger(&id, &content, None);
        let (tx, rx) = channel();
        let done = RcBlock::new(move |error: *mut NSError| {
            // SAFETY: null or a live error, for the length of the call.
            let error = unsafe { error.as_ref() }.map(|e| e.localizedDescription().to_string());
            let _ = tx.send(error);
        });
        center.addNotificationRequest_withCompletionHandler(&request, Some(&done));
        match rx.recv_timeout(WAIT) {
            Ok(None) => Ok(()),
            Ok(Some(error)) => Err(error),
            Err(_) => Err("no answer from the notification center".into()),
        }
    }
}
