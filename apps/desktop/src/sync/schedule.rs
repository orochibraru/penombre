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

    /// Ask the server again soon; local changes wait for it to answer.
    pub fn unreachable(&mut self, now: Instant) {
        self.periodic = now + super::reach::PROBE;
        self.settle = None;
    }

    pub fn synced(&mut self, now: Instant, retry: bool) {
        self.periodic = now + if retry { RETRY } else { PERIOD };
        self.settle = None;
    }
}

#[cfg(test)]
#[path = "../../tests/sync/schedule.rs"]
mod tests;
