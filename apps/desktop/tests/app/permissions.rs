use super::*;

fn pair(local: std::path::PathBuf) -> Pair {
    Pair {
        local,
        remote: "me".into(),
        label: "My drive".into(),
        ignored: Vec::new(),
    }
}

#[test]
fn a_folder_reads_as_readable_missing_or_blocked() {
    let root = std::env::temp_dir().join(format!("penombre-perm-{}", std::process::id()));
    std::fs::create_dir_all(&root).unwrap();
    assert_eq!(folder(&pair(root.clone())).level, Level::Ok);

    let missing = folder(&pair(root.join("not yet")));
    assert_eq!(missing.level, Level::Neutral);
    assert_eq!(missing.detail, "Created on the next sync.");

    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let locked = root.join("locked");
        std::fs::create_dir(&locked).unwrap();
        std::fs::set_permissions(&locked, std::fs::Permissions::from_mode(0o000)).unwrap();
        let blocked = folder(&pair(locked.clone()));
        std::fs::set_permissions(&locked, std::fs::Permissions::from_mode(0o755)).unwrap();
        // Root reads anything, so the check is only meaningful as a user.
        if unsafe { libc::geteuid() } != 0 {
            assert_eq!(blocked.level, Level::Problem);
            assert_eq!(blocked.action.is_some(), cfg!(target_os = "macos"));
        }
    }
    let _ = std::fs::remove_dir_all(&root);
}

#[cfg(target_os = "macos")]
#[test]
fn notifications_are_green_only_when_the_app_is_allowed_them() {
    let unbundled = notification_check(false, Some(true));
    assert_eq!(
        unbundled.level,
        Level::Neutral,
        "a bare binary has no permission"
    );
    assert!(unbundled.detail.contains("Script Editor"));

    assert_eq!(notification_check(true, Some(true)).level, Level::Ok);
    assert_eq!(notification_check(true, Some(false)).level, Level::Problem);
    assert_eq!(notification_check(true, None).level, Level::Neutral);
    // The bundled rows open the app's own pane, not the list of every app.
    let own = notification_check(true, Some(false)).action.unwrap().1;
    assert!(own.ends_with("?id=dev.penombre.sync"), "{own}");
}
