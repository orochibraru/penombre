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
