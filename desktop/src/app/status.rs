use std::time::SystemTime;

use super::LastSync;

pub(super) fn status_line(
    signed_in: bool,
    paused: bool,
    down: bool,
    running: bool,
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
        return "Syncing…".into();
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
mod tests {
    use std::time::Duration;

    use super::*;

    #[test]
    fn the_status_line_follows_the_last_sync() {
        let now = SystemTime::now();
        let ok = (now - Duration::from_secs(150), Ok(()));
        let failed = (now, Err("boom".to_owned()));
        assert_eq!(
            status_line(false, false, false, false, None, now),
            "Not signed in"
        );
        assert_eq!(
            status_line(true, false, false, true, Some(&ok), now),
            "Syncing…"
        );
        assert_eq!(
            status_line(true, false, false, false, Some(&ok), now),
            "Synced 2 min ago"
        );
        assert_eq!(
            status_line(true, false, false, false, Some(&failed), now),
            "Error — open Penombre Sync"
        );
        assert_eq!(
            status_line(true, false, false, false, None, now),
            "Waiting to sync"
        );
        assert_eq!(
            status_line(true, true, false, true, Some(&failed), now),
            "Paused"
        );
        assert_eq!(
            status_line(true, false, true, true, Some(&ok), now),
            "Can't reach server"
        );
        assert_eq!(
            status_line(true, true, true, false, Some(&ok), now),
            "Paused",
            "a pause outranks an outage"
        );
    }
}
