use std::time::{Duration, Instant};

pub const PERIOD: Duration = Duration::from_secs(5 * 60);
pub const SETTLE: Duration = Duration::from_secs(5);
pub const RETRY: Duration = Duration::from_secs(60);

/// When the next sync is due: periodically, once local changes settle, or
/// early to retry failed files. Never while paused.
pub struct Schedule {
    periodic: Instant,
    settle: Option<Instant>,
    paused: bool,
}

impl Schedule {
    pub fn new(now: Instant) -> Self {
        Self {
            periodic: now,
            settle: None,
            paused: false,
        }
    }

    /// Resuming syncs at once: whatever changed meanwhile is waiting.
    pub fn pause(&mut self, paused: bool, now: Instant) {
        self.paused = paused;
        if !paused {
            self.periodic = now;
        }
    }

    pub fn paused(&self) -> bool {
        self.paused
    }

    pub fn sync_now(&mut self, now: Instant) {
        self.periodic = now;
    }

    pub fn changed(&mut self, now: Instant) {
        self.settle = Some(now + SETTLE);
    }

    pub fn next(&self) -> Instant {
        self.settle.map_or(self.periodic, |s| s.min(self.periodic))
    }

    pub fn due(&self, now: Instant) -> bool {
        !self.paused && self.next() <= now
    }

    pub fn synced(&mut self, now: Instant, retry: bool) {
        self.periodic = now + if retry { RETRY } else { PERIOD };
        self.settle = None;
    }
}

#[cfg(test)]
mod tests {
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
}
