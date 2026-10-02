#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod app;
mod auth;
mod instance;
mod notify;
mod places;
mod store;
mod sync;
mod ui;
mod update;

use fastframe_shell::{Shell, Waker};

use crate::app::{App, Window};
use crate::store::Dirs;

fn main() -> eframe::Result<()> {
    let Some(dirs) = Dirs::new() else {
        return Err(eframe::Error::AppCreation("no home directory".into()));
    };
    let _ = std::fs::create_dir_all(&dirs.data);
    if let Err(error) = fastframe_log::Logging::new("penombre-sync", env!("CARGO_PKG_VERSION"))
        .filter("warn,penombre_sync=info")
        .file(dirs.log_file())
        .init()
    {
        eprintln!("no logger: {error}");
    }
    let claim = if std::env::args().any(|arg| arg == update::RESTARTED) {
        instance::claim_when_free(&dirs.data, std::time::Duration::from_secs(15))
    } else {
        instance::claim(&dirs.data)
    };
    let instance = match claim {
        Ok(instance::Claim::First(instance)) => instance,
        Ok(instance::Claim::Second) => {
            log::info!("already running; showed that one instead");
            return Ok(());
        }
        Err(error) => {
            return Err(eframe::Error::AppCreation(
                format!("cannot claim the single-instance lock: {error}").into(),
            ));
        }
    };
    store::init_keyring();
    #[cfg(target_os = "macos")]
    notify::ask();

    let waker = Waker::default();
    let app = App::new(&waker, dirs, instance);
    Shell::new(app, &waker)
        .idle(fastframe_tray::idle)
        .run(|lease| {
            let hidden = lease.peek(App::starts_hidden);
            let mut viewport = egui::ViewportBuilder::default()
                .with_title("Penombre Sync")
                .with_visible(!hidden);
            if let Some(icon) = ui::app_icon() {
                viewport = viewport.with_icon(icon);
            }
            let options = eframe::NativeOptions {
                viewport: viewport
                    .with_inner_size([520.0, 680.0])
                    .with_min_inner_size([380.0, 420.0]),
                // The default app menu's Quit is `terminate:`, which exits the
                // process on the spot: tray and sync included. ⌘Q only closes
                // the window instead (`Window::ui`); the tray's Quit quits.
                // Only the first window's options make the event loop, so
                // only a hidden start begins out of the Dock and unfocused.
                #[cfg(target_os = "macos")]
                event_loop_builder: Some(Box::new(move |builder| {
                    use winit::platform::macos::{ActivationPolicy, EventLoopBuilderExtMacOS};
                    builder
                        .with_default_menu(false)
                        .with_activation_policy(if hidden {
                            ActivationPolicy::Accessory
                        } else {
                            ActivationPolicy::Regular
                        })
                        .with_activate_ignoring_other_apps(!hidden);
                })),
                ..Default::default()
            };
            let result = eframe::run_native(
                "Penombre Sync",
                options,
                Box::new(move |cc| {
                    ui::install(&cc.egui_ctx);
                    if !hidden {
                        in_dock(true);
                    }
                    let mut app = lease.take(&cc.egui_ctx);
                    app.attach_tray();
                    Ok(Box::new(Window::new(app)))
                }),
            );
            in_dock(false);
            result
        })
}

/// In the Dock and the app switcher only while the window is open; the tray
/// is the way back. Never before the first window: winit makes the
/// application object itself and refuses one made earlier.
#[cfg(target_os = "macos")]
fn in_dock(shown: bool) {
    use objc2_app_kit::{NSApplication, NSApplicationActivationPolicy};
    let Some(main) = objc2::MainThreadMarker::new() else {
        return;
    };
    let app = NSApplication::sharedApplication(main);
    app.setActivationPolicy(if shown {
        NSApplicationActivationPolicy::Regular
    } else {
        NSApplicationActivationPolicy::Accessory
    });
    if shown {
        #[allow(deprecated)]
        app.activateIgnoringOtherApps(true);
    }
}

#[cfg(not(target_os = "macos"))]
fn in_dock(_shown: bool) {}
