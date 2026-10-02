use std::time::SystemTime;

use super::LastSync;

pub(super) fn status_line(
    signed_in: bool,
    paused: bool,
    down: bool,
    running: bool,
    percent: Option<u8>,
    last: Option<&LastSync>,
    now: SystemTime,
) -> String {
    if !signed_in {
        return "Not signed in".into();
    }
    if paused {
        return "Paused".into();
    }
    if down {
        return "Can't reach server".into();
    }
    if running {
        return percent.map_or_else(|| "Syncing…".into(), |p| format!("Syncing… {p}%"));
    }
    match last {
        None => "Waiting to sync".into(),
        Some((_, Err(_))) => "Error — open Penombre Sync".into(),
        Some((at, Ok(()))) => {
            let minutes = now.duration_since(*at).unwrap_or_default().as_secs() / 60;
            match minutes {
                0 => "Synced just now".into(),
                1 => "Synced 1 min ago".into(),
                n => format!("Synced {n} min ago"),
            }
        }
    }
}

#[cfg(test)]
#[path = "../../tests/app/status.rs"]
mod tests;
