use std::time::{Duration, SystemTime};

use egui::Theme;

use super::*;
use crate::sync::progress::Transfer;
use crate::sync::{Change, Failure, Progress, Synced};

struct Case {
    name: &'static str,
    tab: Tab,
    login: Login,
    checks: &'static str,
    phase: fn() -> Phase<'static>,
    state: SyncState,
    status: &'static str,
    error: bool,
    missing: bool,
    progress: bool,
    recent: bool,
    failures: bool,
    down: bool,
}

const BASE: Case = Case {
    name: "",
    tab: Tab::Sync,
    login: Login::Off,
    checks: "ok",
    phase: || Phase::SignedIn,
    state: SyncState::Ok,
    status: "Synced 2 min ago",
    error: false,
    missing: false,
    progress: false,
    recent: false,
    failures: false,
    down: false,
};

/// `PENOMBRE_SYNC_SNAPSHOTS=<dir> cargo test snapshots` writes every state, in both themes.
#[test]
fn snapshots() {
    let Some(dir) = std::env::var_os("PENOMBRE_SYNC_SNAPSHOTS") else {
        return;
    };
    let dir = std::path::PathBuf::from(dir);
    std::fs::create_dir_all(&dir).unwrap();
    let now = SystemTime::now();
    let pairs = vec![
        crate::store::Pair {
            local: "/Users/me/Penombre".into(),
            remote: "me".into(),
            label: "My drive".into(),
            ignored: Vec::new(),
        },
        crate::store::Pair {
            local: "/Users/me/Documents".into(),
            remote: "me/Documents".into(),
            label: "My drive / Documents".into(),
            ignored: vec!["node_modules/".into(), "/Archive/".into()],
        },
    ];
    let places = vec![
        crate::places::Place {
            path: "me".into(),
            name: "My drive".into(),
        },
        crate::places::Place {
            path: "volumes/music".into(),
            name: "Music".into(),
        },
    ];
    let synced = |name: &str, change, minutes: u64| Synced {
        pair: "My drive".into(),
        name: name.into(),
        change,
        at: now - Duration::from_secs(minutes * 60),
    };
    let recent = vec![
        synced("Mixes/final master v3.wav", Change::Uploaded, 0),
        synced(
            "Invoices/2026-09 Penombre hosting.pdf",
            Change::Downloaded,
            1,
        ),
        synced("notes.md", Change::Uploaded, 4),
        synced("old draft.docx", Change::DeletedOnServer, 12),
        synced("Photos/IMG_2291.HEIC", Change::DeletedHere, 75),
    ];
    let failures = vec![
        Failure {
            pair: "My drive".into(),
            name: "Stems/drums bounce 24bit.wav".into(),
            message: "Failed to copy: unchunked simple update failed: 413 Request Entity Too Large"
                .into(),
            at: now,
        },
        Failure {
            pair: "My drive / Documents".into(),
            name: "report.docx".into(),
            message: "Failed to copy: open report.docx: permission denied".into(),
            at: now,
        },
    ];
    let progress = Progress {
        bytes: 18_400_000,
        total_bytes: 52_000_000,
        transfers: 3,
        total_transfers: 11,
        errors: 0,
        eta: Some(94),
        transferring: vec![
            Transfer {
                name: "Mixes/final master v3.wav".into(),
                percentage: 64,
                size: 31_000_000,
            },
            Transfer {
                name: "Photos/2026/September/a very long file name from a phone.HEIC".into(),
                percentage: 12,
                size: 4_200_000,
            },
        ],
    };
    let error = "ERROR: Bisync critical error: couldn't list remote: 401 Unauthorized\n\
        NOTICE: Failed to bisync: bisync aborted";
    let ok = |label: &str, detail: &str| Check {
        label: label.into(),
        detail: detail.into(),
        level: Level::Ok,
        action: None,
    };
    let notifications = Check {
        label: "Notifications".into(),
        detail: "Allowed.".into(),
        level: Level::Ok,
        action: Some(("Open settings", String::new())),
    };
    let fine = vec![
        notifications.clone(),
        ok("~/Penombre", "Readable."),
        ok("~/Documents", "Readable."),
        ok("rclone", "/opt/homebrew/bin/rclone"),
        ok("Keychain", "The API key reads back."),
    ];
    let broken = vec![
        notifications.clone(),
        ok("~/Penombre", "Readable."),
        Check {
            label: "~/Documents".into(),
            detail:
                "Blocked by macOS privacy settings. Allow Files and Folders or Full Disk Access."
                    .into(),
            level: Level::Problem,
            action: Some(("Open settings", String::new())),
        },
        Check {
            label: "rclone".into(),
            detail: "Not found on PATH or in the usual places.".into(),
            level: Level::Problem,
            action: Some(("Install", String::new())),
        },
        ok("Keychain", "The API key reads back."),
    ];
    let signed_out = vec![
        notifications,
        ok("~/Penombre", "Readable."),
        Check {
            label: "Keychain".into(),
            detail: "Nothing stored: not signed in.".into(),
            level: Level::Neutral,
            action: None,
        },
    ];
    let cases = [
        Case {
            name: "adding",
            ..BASE
        },
        Case {
            name: "excluding",
            ..BASE
        },
        Case {
            name: "settings",
            tab: Tab::Settings,
            login: Login::Homebrew("brew services stop penombre-sync"),
            ..BASE
        },
        Case {
            name: "settings-problem",
            tab: Tab::Settings,
            login: Login::On,
            checks: "broken",
            ..BASE
        },
        Case {
            name: "signed-out",
            tab: Tab::Settings,
            checks: "signed-out",
            phase: || Phase::SignedOut,
            state: SyncState::Off,
            status: "Not signed in",
            ..BASE
        },
        Case {
            name: "waiting",
            tab: Tab::Settings,
            checks: "signed-out",
            phase: || Phase::Waiting(Some("HMT5YHZR")),
            state: SyncState::Off,
            status: "Not signed in",
            ..BASE
        },
        Case {
            name: "synced",
            recent: true,
            ..BASE
        },
        Case {
            name: "syncing",
            state: SyncState::Running,
            status: "Syncing…",
            progress: true,
            recent: true,
            ..BASE
        },
        Case {
            name: "failed",
            state: SyncState::Failed,
            status: "Sync failed",
            error: true,
            missing: true,
            ..BASE
        },
        Case {
            name: "failed-files",
            state: SyncState::Failed,
            status: "Sync failed",
            recent: true,
            failures: true,
            ..BASE
        },
        Case {
            name: "unreachable",
            state: SyncState::Failed,
            status: "Can't reach server",
            recent: true,
            down: true,
            ..BASE
        },
        Case {
            name: "paused",
            state: SyncState::Paused,
            status: "Paused",
            recent: true,
            failures: true,
            ..BASE
        },
    ];
    for case in cases {
        for theme in [Theme::Light, Theme::Dark] {
            let mut server = if matches!((case.phase)(), Phase::SignedOut) {
                String::new()
            } else {
                "https://files.example.com".to_owned()
            };
            let pairs = pairs.clone();
            let places = places.clone();
            let recent = if case.recent { recent.clone() } else { vec![] };
            let failures = if case.failures {
                failures.clone()
            } else {
                vec![]
            };
            let progress = progress.clone();
            let checks = match case.checks {
                "broken" => broken.clone(),
                "signed-out" => signed_out.clone(),
                _ => fine.clone(),
            };
            let (tab, login) = (case.tab, case.login);
            let adding = case.name == "adding";
            let excluding = case.name == "excluding";
            let mut pattern = "*.reapeaks".to_owned();
            let mut choice = 1;
            let mut subfolder = "Reaper".to_owned();
            let mut installed = false;
            let Case {
                phase,
                state,
                status,
                ..
            } = case;
            let (show_error, missing, show_progress) = (case.error, case.missing, case.progress);
            let down = case.down.then(|| crate::sync::Down {
                since: now - Duration::from_secs(3 * 60),
                reason: "the connection was refused or the host is unknown".into(),
            });
            let found = Found::Newer(crate::update::Release {
                version: "1.8.59".into(),
                url: String::new(),
            });
            let mut harness = egui_kittest::Harness::builder()
                .with_size(Vec2::new(440.0, 720.0))
                // As a Retina screen shows it: these end up in the docs.
                .with_pixels_per_point(2.0)
                .build_ui(move |ui| {
                    // Fonts land on the frame after `set_fonts`.
                    if !std::mem::replace(&mut installed, true) {
                        install(ui.ctx());
                        ui.ctx().set_theme(theme);
                        return;
                    }
                    egui::CentralPanel::default()
                        .frame(Frame::new().fill(ui.visuals().panel_fill))
                        .show(ui, |ui| {
                            draw(
                                ui,
                                View {
                                    tab,
                                    server: &mut server,
                                    key_name: "Penombre Sync on Nicolass-Mac-mi",
                                    login,
                                    login_error: None,
                                    checks: &checks,
                                    phase: phase(),
                                    auth_error: None,
                                    pairs: &pairs,
                                    excluding: excluding.then_some(Excluding {
                                        index: 1,
                                        pattern: &mut pattern,
                                        error: None,
                                    }),
                                    adding: adding.then(|| Adding {
                                        local: std::path::Path::new("/Users/me/Music/Reaper"),
                                        places: Some(Ok(&places)),
                                        choice: &mut choice,
                                        subfolder: &mut subfolder,
                                        error: None,
                                    }),
                                    rclone_missing: missing,
                                    status,
                                    state,
                                    error: show_error.then_some(error),
                                    progress: show_progress.then_some(("My drive", &progress)),
                                    recent: &recent,
                                    failures: &failures,
                                    down: down.as_ref(),
                                    updates: Updates {
                                        version: "1.8.58",
                                        channel: Channel::Stable,
                                        found: &found,
                                        brew: None,
                                        installing: false,
                                        install_error: None,
                                    },
                                    now,
                                },
                            );
                        });
                });
            harness.run_steps(10);
            let image = harness.render().expect("render");
            let suffix = if theme == Theme::Dark { "-dark" } else { "" };
            image
                .save(dir.join(format!("{}{suffix}.png", case.name)))
                .unwrap();
        }
    }
}
