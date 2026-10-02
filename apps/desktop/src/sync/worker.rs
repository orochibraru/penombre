use std::collections::BTreeMap;
use std::path::Path;
use std::sync::Arc;
use std::sync::mpsc::{Receiver, RecvTimeoutError, Sender};
use std::time::{Duration, Instant, SystemTime};

use notify::Watcher;

use super::progress::Line;
use super::rclone::{Control, bisync};
use super::reach::{self, Outage};
use super::retries::{Failure, Retries, notice};
use super::schedule::{PERIOD, Schedule};
use super::{Cmd, Status, Synced, Target};

/// The sync thread: one rclone run at a time. Local changes seen during a run
/// queue in `commands` and schedule one more run after it.
pub fn worker(
    commands: Receiver<Cmd>,
    self_tx: Sender<Cmd>,
    status: Sender<Status>,
    wake: impl Fn(),
    dirs: crate::store::Dirs,
    control: Arc<Control>,
) {
    let mut target: Option<Target> = None;
    // Kept alive for as long as it should watch.
    let mut _watchers: Vec<notify::RecommendedWatcher> = Vec::new();
    let mut schedule = Schedule::new(Instant::now());
    let mut retries = Retries::default();
    let mut outage = Outage::default();
    let mut wake = Throttled { wake, last: None };
    loop {
        let timeout = schedule.next().saturating_duration_since(Instant::now());
        let timeout = if target.is_some() && !schedule.paused() {
            timeout
        } else {
            PERIOD
        };
        match commands.recv_timeout(timeout) {
            Ok(Cmd::SyncNow) => schedule.sync_now(Instant::now()),
            Ok(Cmd::Changed) => schedule.changed(Instant::now()),
            Ok(Cmd::Pause(paused)) => schedule.pause(paused, Instant::now()),
            Ok(Cmd::Target(new)) => {
                _watchers = new
                    .iter()
                    .flat_map(|t| &t.pairs)
                    .filter_map(|p| watch(&p.pair.local, self_tx.clone()))
                    .collect();
                let keys: Vec<String> = new
                    .iter()
                    .flat_map(|t| t.pairs.iter().map(|p| p.key(&t.server)))
                    .collect();
                retries.keep_pairs(&keys);
                let _ = status.send(Status::Failures(retries.failures()));
                target = new;
                schedule.sync_now(Instant::now());
            }
            Ok(Cmd::Quit) | Err(RecvTimeoutError::Disconnected) => return,
            Err(RecvTimeoutError::Timeout) => {}
        }
        let Some(current) = target.as_mut() else {
            continue;
        };
        if !schedule.due(Instant::now()) {
            continue;
        }
        // Without a server every file would fail, count toward a notification
        // and could send each pair back to a full resync.
        if !reachable(&current.server, &mut outage, &status, &mut wake) {
            schedule.unreachable(Instant::now());
            continue;
        }
        let _ = status.send(Status::Started);
        wake.now();
        let mut result = Ok(());
        let mut halted = false;
        let mut lost = false;
        let mut twice = Vec::new();
        let mut stuck = Vec::new();
        for pair in &mut current.pairs {
            if control.halted() {
                halted = true;
                break;
            }
            let label = pair.pair.label.clone();
            let _ = status.send(Status::Pair(label.clone()));
            wake.now();
            let mut synced = Vec::new();
            let mut failed = BTreeMap::new();
            let outcome = bisync(
                &current.server,
                &current.key,
                pair,
                &dirs,
                &control,
                &mut |line| match line {
                    Line::Stats(progress) => {
                        let _ = status.send(Status::Progress(progress));
                        wake.soon();
                    }
                    Line::Done { name, change } => {
                        synced.push(name.clone());
                        let _ = status.send(Status::Synced(Synced {
                            pair: label.clone(),
                            name,
                            change,
                            at: SystemTime::now(),
                        }));
                        wake.soon();
                    }
                    // rclone retries within a run: the last word per file stands.
                    Line::Failed { name, message } => {
                        failed.insert(name, message);
                    }
                    Line::Said(_) | Line::Other => {}
                },
            );
            if control.halted() {
                halted = true;
                break;
            }
            if outcome.is_err() && !reachable(&current.server, &mut outage, &status, &mut wake) {
                lost = true;
                break;
            }
            if outcome.is_ok() {
                pair.resynced = true;
            } else if outcome
                .as_ref()
                .is_err_and(|e| e.contains("Must run --resync"))
            {
                pair.resynced = false;
            }
            let failed: Vec<_> = failed
                .into_iter()
                .filter(|(name, _)| !synced.contains(name))
                .map(|(name, message)| Failure {
                    pair: label.clone(),
                    name,
                    message,
                    at: SystemTime::now(),
                })
                .collect();
            let key = pair.key(&current.server);
            let blameless = failed.is_empty();
            twice.extend(retries.record(&key, outcome.is_ok(), &synced, failed));
            if let (Err(error), true) = (&outcome, blameless) {
                stuck.extend(retries.run_failed(&key, &label, error));
            }
            match outcome {
                Ok(()) => log::info!("synced {label}"),
                Err(error) => {
                    log::warn!("sync of {label} failed: {error}");
                    if result.is_ok() {
                        result = Err(format!("{label}: {error}"));
                    }
                }
            }
        }
        let _ = status.send(Status::Failures(retries.failures()));
        let _ = status.send(Status::Finished {
            at: SystemTime::now(),
            result: (!halted && !lost).then_some(result),
            resynced: current
                .pairs
                .iter()
                .map(|p| (p.key(&current.server), p.resynced))
                .collect(),
        });
        wake.now();
        if !halted {
            for text in stuck.iter().cloned().chain(notice(&twice)) {
                crate::notify::show(&text);
            }
        }
        if lost {
            schedule.unreachable(Instant::now());
        } else {
            schedule.synced(Instant::now(), retries.retry_soon());
        }
    }
}

/// Probes the server, tells the window, and notifies once per outage.
fn reachable<F: Fn()>(
    server: &str,
    outage: &mut Outage,
    status: &Sender<Status>,
    wake: &mut Throttled<F>,
) -> bool {
    let answer = reach::probe(server);
    let up = answer.is_ok();
    let change = outage.record(answer, SystemTime::now());
    if change != reach::Change::Same || !up {
        let _ = status.send(Status::Reach(outage.down().cloned()));
        wake.now();
    }
    match change {
        reach::Change::Notify => crate::notify::show(&format!(
            "Can't reach {} — syncing resumes when it's back.",
            host(server)
        )),
        reach::Change::WentDown => log::warn!("{server} is not answering"),
        reach::Change::CameBack => log::info!("{server} answers again"),
        reach::Change::Same => {}
    }
    up
}

pub fn host(server: &str) -> &str {
    server
        .trim_start_matches("https://")
        .trim_start_matches("http://")
        .trim_end_matches('/')
}

/// A run can log thousands of files a second; the window redraws a few times.
struct Throttled<F: Fn()> {
    wake: F,
    last: Option<Instant>,
}

impl<F: Fn()> Throttled<F> {
    fn now(&mut self) {
        (self.wake)();
        self.last = Some(Instant::now());
    }

    fn soon(&mut self) {
        if self
            .last
            .is_none_or(|last| last.elapsed() >= Duration::from_millis(250))
        {
            self.now();
        }
    }
}

fn watch(folder: &Path, tx: Sender<Cmd>) -> Option<notify::RecommendedWatcher> {
    let _ = std::fs::create_dir_all(folder);
    let mut watcher = notify::recommended_watcher(move |event: notify::Result<notify::Event>| {
        if event.is_ok_and(|e| !e.kind.is_access()) {
            let _ = tx.send(Cmd::Changed);
        }
    })
    .map_err(|e| log::warn!("cannot watch the folder: {e}"))
    .ok()?;
    watcher
        .watch(folder, notify::RecursiveMode::Recursive)
        .map_err(|e| log::warn!("cannot watch {}: {e}", folder.display()))
        .ok()?;
    Some(watcher)
}

#[cfg(test)]
#[path = "../../tests/sync/worker.rs"]
mod tests;
