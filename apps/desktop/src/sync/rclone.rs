use std::collections::VecDeque;
use std::ffi::OsString;
use std::io::{BufRead, BufReader, Write};
use std::path::{Path, PathBuf};
use std::process::{Child, Command, Stdio};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Mutex, MutexGuard, PoisonError};
use std::time::{Duration, Instant};

use super::PairTarget;
use super::progress::{self, Line};

pub const RCLONE_MISSING: &str =
    "rclone was not found. Install rclone: https://rclone.org/install/";

/// The rclone running now, reachable from outside the sync thread so a pause
/// or a quit can stop it.
#[derive(Default)]
pub struct Control {
    child: Mutex<Option<Child>>,
    halt: AtomicBool,
}

impl Control {
    pub fn halt(&self, halt: bool) {
        self.halt.store(halt, Ordering::Relaxed);
    }

    pub fn halted(&self) -> bool {
        self.halt.load(Ordering::Relaxed)
    }

    fn slot(&self) -> MutexGuard<'_, Option<Child>> {
        self.child.lock().unwrap_or_else(PoisonError::into_inner)
    }

    /// SIGTERM (kill on Windows), then a kill if rclone outlives `grace`.
    /// `--recover` picks an interrupted bisync up on the next run.
    pub fn stop(&self, grace: Duration) {
        let Some(pid) = self.terminate() else {
            return;
        };
        // Only the rclone signalled: a resume may already have started another.
        let still = |slot: &mut Option<Child>| {
            slot.as_mut()
                .filter(|child| child.id() == pid)
                .is_some_and(|child| matches!(child.try_wait(), Ok(None)))
        };
        let end = Instant::now() + grace;
        while Instant::now() < end {
            std::thread::sleep(Duration::from_millis(100));
            if !still(&mut self.slot()) {
                return;
            }
        }
        let mut slot = self.slot();
        if still(&mut slot)
            && let Some(child) = slot.as_mut()
        {
            log::warn!("rclone ignored SIGTERM; killing it");
            let _ = child.kill();
        }
    }

    /// The pid signalled, if an rclone was running. The slot stays locked
    /// while it is signalled, so that pid cannot have been reaped and reused.
    fn terminate(&self) -> Option<u32> {
        let mut slot = self.slot();
        let child = slot.as_mut()?;
        // A signal, not the `kill` program: minimal systems do not ship it.
        #[cfg(unix)]
        if let Ok(pid) = libc::pid_t::try_from(child.id()) {
            // SAFETY: plain kill(2) on a child still held in the slot, so not reaped.
            unsafe {
                libc::kill(pid, libc::SIGTERM);
            }
        }
        #[cfg(not(unix))]
        let _ = child.kill();
        Some(child.id())
    }
}

pub fn bisync(
    server: &str,
    key: &str,
    target: &PairTarget,
    dirs: &crate::store::Dirs,
    control: &Control,
    on_line: &mut dyn FnMut(Line),
) -> Result<(), String> {
    let rclone = find_rclone().ok_or(RCLONE_MISSING)?;
    let local = &target.pair.local;
    std::fs::create_dir_all(local)
        .and_then(|()| std::fs::create_dir_all(dirs.workdir()))
        .and_then(|()| std::fs::create_dir_all(&dirs.config))
        .map_err(|e| format!("Cannot create folders: {e}"))?;
    if !dirs.rclone_conf().exists() {
        std::fs::write(dirs.rclone_conf(), "").map_err(|e| e.to_string())?;
    }
    let filters = dirs
        .workdir()
        .join(format!("filters-{}.txt", fingerprint(&target.key(server))));
    std::fs::write(
        &filters,
        super::filters::lines(&target.excludes).join("\n") + "\n",
    )
    .map_err(|e| e.to_string())?;
    let obscured = obscure(&rclone, key)?;
    let env = rclone_env(server, &obscured, &dirs.rclone_conf());
    let remote = format!("penombre:{}", target.pair.remote);
    if !target.resynced {
        // bisync will not start against a folder that is not there yet.
        run(
            &rclone,
            &[OsString::from("mkdir"), remote.clone().into()],
            &env,
        )?;
    }
    let mut pid = None;
    let result = stream(
        &rclone,
        &bisync_args(local, &remote, &dirs.workdir(), !target.resynced, &filters),
        &env,
        control,
        &mut pid,
        on_line,
    );
    if let Some(pid) = pid.filter(|_| control.halted()) {
        release_lock(&dirs.workdir(), pid);
    }
    result
}

/// A killed bisync leaves its lock behind, and the next run would refuse to
/// start for as long as `--max-lock`. Only the lock of the rclone we stopped.
fn release_lock(workdir: &Path, pid: u32) {
    let owned = format!("\"PID\":\"{pid}\"");
    let Ok(entries) = std::fs::read_dir(workdir) else {
        return;
    };
    for path in entries.flatten().map(|entry| entry.path()) {
        if path.extension().is_some_and(|ext| ext == "lck")
            && std::fs::read_to_string(&path).is_ok_and(|text| text.contains(&owned))
        {
            let _ = std::fs::remove_file(&path);
        }
    }
}

fn run(rclone: &Path, args: &[OsString], env: &[(String, OsString)]) -> Result<(), String> {
    let output = Command::new(rclone)
        .args(args)
        .envs(env.iter().map(|(k, v)| (k, v)))
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .output()
        .map_err(|e| format!("Could not run rclone: {e}"))?;
    if output.status.success() {
        Ok(())
    } else {
        Err(tail(String::from_utf8_lossy(&output.stderr).lines(), 15))
    }
}

/// Runs rclone with its JSON log read line by line as it comes. The error is
/// the last lines worth reading: warnings, errors, anything not JSON.
fn stream(
    rclone: &Path,
    args: &[OsString],
    env: &[(String, OsString)],
    control: &Control,
    pid: &mut Option<u32>,
    on_line: &mut dyn FnMut(Line),
) -> Result<(), String> {
    let mut child = Command::new(rclone)
        .args(args)
        .envs(env.iter().map(|(k, v)| (k, v)))
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("Could not run rclone: {e}"))?;
    let stderr = child.stderr.take().expect("stderr is piped");
    *pid = Some(child.id());
    *control.slot() = Some(child);
    if control.halted() {
        control.terminate();
    }
    let mut said = VecDeque::new();
    let mut reader = BufReader::new(stderr);
    let mut buf = Vec::new();
    while reader.read_until(b'\n', &mut buf).is_ok_and(|n| n > 0) {
        match progress::parse(String::from_utf8_lossy(&buf).trim_end()) {
            Line::Said(text) => {
                if said.len() == 15 {
                    said.pop_front();
                }
                said.push_back(text);
            }
            line => on_line(line),
        }
        buf.clear();
    }
    let status = control.slot().take().map(|mut child| child.wait());
    match status {
        Some(Ok(status)) if status.success() => Ok(()),
        Some(Err(error)) => Err(format!("Could not wait for rclone: {error}")),
        _ => Err(tail(said.iter().map(String::as_str), 15)),
    }
}

/// A short stable name for per-pair files.
fn fingerprint(text: &str) -> String {
    use std::hash::{Hash, Hasher};
    let mut hasher = std::collections::hash_map::DefaultHasher::new();
    text.hash(&mut hasher);
    format!("{:016x}", hasher.finish())
}

/// The key goes in on stdin, never on argv where `ps` would show it.
fn obscure(rclone: &Path, key: &str) -> Result<String, String> {
    let mut child = Command::new(rclone)
        .args(["obscure", "-"])
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("Could not run rclone: {e}"))?;
    if let Some(mut stdin) = child.stdin.take() {
        stdin.write_all(key.as_bytes()).map_err(|e| e.to_string())?;
    }
    let output = child.wait_with_output().map_err(|e| e.to_string())?;
    if !output.status.success() {
        return Err(format!(
            "rclone obscure failed: {}",
            String::from_utf8_lossy(&output.stderr).trim()
        ));
    }
    Ok(String::from_utf8_lossy(&output.stdout).trim().to_owned())
}

pub fn rclone_env(server: &str, obscured: &str, config: &Path) -> Vec<(String, OsString)> {
    vec![
        ("RCLONE_CONFIG".into(), config.as_os_str().to_owned()),
        ("RCLONE_CONFIG_PENOMBRE_TYPE".into(), "webdav".into()),
        (
            "RCLONE_CONFIG_PENOMBRE_URL".into(),
            format!("{}/dav", server.trim_end_matches('/')).into(),
        ),
        // owncloud is what makes rclone send modtimes.
        ("RCLONE_CONFIG_PENOMBRE_VENDOR".into(), "owncloud".into()),
        ("RCLONE_CONFIG_PENOMBRE_USER".into(), "penombre-sync".into()),
        ("RCLONE_CONFIG_PENOMBRE_PASS".into(), obscured.into()),
    ]
}

pub fn bisync_args(
    local: &Path,
    remote: &str,
    workdir: &Path,
    resync: bool,
    filters: &Path,
) -> Vec<OsString> {
    let mut args: Vec<OsString> = vec![
        "bisync".into(),
        local.into(),
        remote.into(),
        "--workdir".into(),
        workdir.into(),
        "--resilient".into(),
        "--recover".into(),
        "--max-lock".into(),
        "2m".into(),
        "--color".into(),
        "NEVER".into(),
        "--filters-file".into(),
        filters.into(),
        "--use-json-log".into(),
        "-v".into(),
        "--stats".into(),
        "1s".into(),
        "--stats-log-level".into(),
        "NOTICE".into(),
    ];
    if resync {
        args.push("--resync".into());
    }
    args
}

/// PATH, then where Homebrew and user installs put it: an app started by
/// Finder or launchd gets a PATH without them.
pub fn find_rclone() -> Option<PathBuf> {
    find_on_path("rclone").or_else(|| {
        let home = directories::BaseDirs::new().map(|d| d.home_dir().join(".local/bin/rclone"));
        ["/opt/homebrew/bin/rclone", "/usr/local/bin/rclone"]
            .into_iter()
            .map(PathBuf::from)
            .chain(home)
            .find(|path| path.is_file())
    })
}

fn find_on_path(name: &str) -> Option<PathBuf> {
    let exe = format!("{name}{}", std::env::consts::EXE_SUFFIX);
    std::env::split_paths(&std::env::var_os("PATH")?)
        .map(|dir| dir.join(&exe))
        .find(|path| path.is_file())
}

fn tail<'a>(lines: impl Iterator<Item = &'a str>, count: usize) -> String {
    let all: Vec<&str> = lines.collect();
    let tail = all[all.len().saturating_sub(count)..].join("\n");
    if tail.trim().is_empty() {
        "rclone failed without saying why.".into()
    } else {
        tail
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::sync::excludes;

    fn pair(local: &str, remote: &str) -> crate::store::Pair {
        crate::store::Pair {
            local: local.into(),
            remote: remote.into(),
            label: String::new(),
            ignored: Vec::new(),
        }
    }

    #[test]
    fn env_points_rclone_at_the_dav_root_without_the_users_config() {
        let env = rclone_env("https://f.example.com/", "OBS", Path::new("/c/rclone.conf"));
        let get = |k: &str| env.iter().find(|(key, _)| key == k).map(|(_, v)| v.clone());
        assert_eq!(
            get("RCLONE_CONFIG_PENOMBRE_URL"),
            Some("https://f.example.com/dav".into())
        );
        assert_eq!(
            get("RCLONE_CONFIG_PENOMBRE_VENDOR"),
            Some("owncloud".into())
        );
        assert_eq!(get("RCLONE_CONFIG_PENOMBRE_PASS"), Some("OBS".into()));
        assert_eq!(get("RCLONE_CONFIG"), Some("/c/rclone.conf".into()));
    }

    #[test]
    fn resync_only_when_asked_and_filters_and_json_always() {
        let args = |resync| {
            bisync_args(
                Path::new("/l"),
                "penombre:me",
                Path::new("/w"),
                resync,
                Path::new("/f"),
            )
        };
        let (first, later) = (args(true), args(false));
        assert!(first.contains(&"--resync".into()));
        assert!(!later.contains(&"--resync".into()));
        assert_eq!(
            &later[..3],
            &["bisync".into(), "/l".into(), "penombre:me".into()] as &[OsString]
        );
        assert!(
            later
                .windows(2)
                .any(|w| w == [OsString::from("--filters-file"), "/f".into()])
        );
        assert!(later.contains(&"--use-json-log".into()));
        assert!(
            later
                .windows(2)
                .any(|w| w == [OsString::from("--stats"), "1s".into()])
        );
    }

    #[cfg(unix)]
    #[test]
    fn stop_asks_then_insists() {
        let control = Control::default();
        let spawn = |script: &str| {
            *control.slot() = Some(Command::new("sh").args(["-c", script]).spawn().unwrap());
        };
        spawn("exec sleep 30");
        let started = Instant::now();
        control.stop(Duration::from_secs(5));
        assert!(!control.slot().take().unwrap().wait().unwrap().success());
        assert!(
            started.elapsed() < Duration::from_secs(5),
            "SIGTERM was enough"
        );

        spawn("trap '' TERM; exec sleep 30");
        let started = Instant::now();
        control.stop(Duration::from_millis(300));
        assert!(!control.slot().take().unwrap().wait().unwrap().success());
        assert!(
            started.elapsed() < Duration::from_secs(5),
            "killed after the grace"
        );
        control.stop(Duration::from_secs(5));
    }

    #[test]
    fn live_pairs_sync_where_they_say_and_nest_cleanly() {
        let (Ok(server), Ok(key)) = (
            std::env::var("PENOMBRE_TEST_URL"),
            std::env::var("PENOMBRE_TEST_KEY"),
        ) else {
            return;
        };
        let root = std::env::temp_dir().join(format!("penombre-live-{}", std::process::id()));
        let dirs = crate::store::Dirs {
            config: root.join("config"),
            data: root.join("data"),
        };
        let id = std::process::id();
        let pairs = vec![
            pair(root.join("mirror").to_str().unwrap(), "me"),
            pair(
                root.join("docs").to_str().unwrap(),
                &format!("me/Documents-{id}"),
            ),
            pair(
                root.join("takes").to_str().unwrap(),
                &format!("volumes/music/Reaper-{id}"),
            ),
        ];
        for (dir, file) in [
            ("mirror", "a.txt"),
            ("docs", "doc.txt"),
            ("takes", "take.txt"),
        ] {
            std::fs::create_dir_all(root.join(dir)).unwrap();
            std::fs::write(root.join(dir).join(format!("{id}-{file}")), file).unwrap();
        }
        std::fs::write(root.join("docs/.DS_Store"), "junk").unwrap();
        std::fs::create_dir_all(root.join("docs/sub")).unwrap();
        std::fs::write(root.join("docs/sub/.DS_Store"), "junk").unwrap();
        let mut targets: Vec<PairTarget> = (0..pairs.len())
            .map(|i| PairTarget {
                pair: pairs[i].clone(),
                excludes: excludes(&pairs, i),
                resynced: false,
            })
            .collect();
        let rclone = find_rclone().unwrap();
        let env = rclone_env(
            &server,
            &obscure(&rclone, &key).unwrap(),
            &dirs.rclone_conf(),
        );
        let control = Control::default();
        let mut seen = Vec::new();
        for round in 0..2 {
            if round == 1 {
                let from = root.join("from-server.txt");
                std::fs::write(&from, "down").unwrap();
                let to = format!("penombre:me/Documents-{id}/{id}-down.txt");
                run(&rclone, &["copyto".into(), from.into(), to.into()], &env).unwrap();
            }
            for target in &mut targets {
                bisync(&server, &key, target, &dirs, &control, &mut |line| {
                    seen.push(line)
                })
                .unwrap_or_else(|e| panic!("round {round}: {e}"));
                target.resynced = true;
            }
        }
        let listing = |path: &str| {
            let out = Command::new(&rclone)
                .args(["lsf", "-R", &format!("penombre:{path}")])
                .envs(env.clone())
                .output()
                .unwrap();
            String::from_utf8_lossy(&out.stdout).into_owned()
        };
        let docs = listing(&format!("me/Documents-{id}"));
        assert!(
            !docs.contains(".DS_Store"),
            "junk reached the server: {docs}"
        );
        assert!(root.join(format!("docs/{id}-down.txt")).exists());
        let done = |name: String, change| Line::Done { name, change };
        use super::progress::Change;
        assert!(seen.contains(&done(format!("{id}-doc.txt"), Change::Uploaded)));
        assert!(seen.contains(&done(format!("{id}-down.txt"), Change::Downloaded)));
        assert!(seen.iter().any(|l| matches!(l, Line::Stats(_))));
        assert!(
            !seen.iter().any(|l| matches!(l, Line::Failed { .. })),
            "{seen:?}"
        );
        assert!(listing("me").contains(&format!("{id}-a.txt")));
        assert!(listing(&format!("me/Documents-{id}")).contains(&format!("{id}-doc.txt")));
        assert!(listing(&format!("volumes/music/Reaper-{id}")).contains(&format!("{id}-take.txt")));
        assert!(
            !root.join("mirror").join(format!("Documents-{id}")).exists(),
            "the drive mirror downloaded a folder another pair owns"
        );
        let _ = std::fs::remove_dir_all(&root);
    }

    #[test]
    fn only_the_stopped_rclones_lock_is_released() {
        let dir = std::env::temp_dir().join(format!("penombre-lock-{}", std::process::id()));
        std::fs::create_dir_all(&dir).unwrap();
        let lock = |name: &str, pid: u32| {
            let path = dir.join(name);
            std::fs::write(&path, format!(r#"{{"Session":"s","PID":"{pid}"}}"#)).unwrap();
            path
        };
        let ours = lock("a..b.lck", 26319);
        let theirs = lock("c..d.lck", 2631);
        release_lock(&dir, 26319);
        assert!(!ours.exists());
        assert!(theirs.exists());
        let _ = std::fs::remove_dir_all(&dir);
    }

    #[test]
    fn tail_keeps_the_last_lines() {
        assert_eq!(tail("a\nb\nc".lines(), 2), "b\nc");
        assert_eq!(tail("".lines(), 2), "rclone failed without saying why.");
    }
}
