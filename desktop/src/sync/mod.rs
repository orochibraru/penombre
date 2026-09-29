mod filters;
pub mod progress;
mod rclone;
mod reach;
mod retries;
mod schedule;
mod worker;

use std::time::SystemTime;

use crate::store::Pair;

pub use filters::excludes;
pub use progress::{Change, Progress};
pub use rclone::{Control, find_rclone};
pub use reach::Down;
pub use retries::Failure;
pub use worker::{host, worker};

#[derive(Clone)]
pub struct Target {
    pub server: String,
    pub key: String,
    pub pairs: Vec<PairTarget>,
}

#[derive(Clone)]
pub struct PairTarget {
    pub pair: Pair,
    /// rclone filter lines keeping out the pairs nested inside this one.
    pub excludes: Vec<String>,
    pub resynced: bool,
}

impl PairTarget {
    pub fn key(&self, server: &str) -> String {
        crate::store::pair_key(server, &self.pair, &filters::lines(&self.excludes))
    }
}

pub enum Cmd {
    SyncNow,
    Changed,
    Target(Option<Target>),
    Pause(bool),
    Quit,
}

/// One file a run moved.
#[derive(Clone, Debug)]
pub struct Synced {
    pub pair: String,
    pub name: String,
    pub change: Change,
    pub at: SystemTime,
}

pub enum Status {
    /// Whether the server answers: None once it does again.
    Reach(Option<Down>),
    Started,
    /// The label of the pair now syncing.
    Pair(String),
    Progress(Progress),
    Synced(Synced),
    /// Every file still failing, after each run.
    Failures(Vec<Failure>),
    Finished {
        at: SystemTime,
        /// None when a pause or a quit cut the run short.
        result: Option<Result<(), String>>,
        /// Each pair's key, and whether its resync is behind it.
        resynced: Vec<(String, bool)>,
    },
}
