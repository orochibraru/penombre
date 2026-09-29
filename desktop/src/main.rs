#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod app;
mod auth;
mod instance;
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

    let waker = Waker::default();
    let app = App::new(&waker, dirs, instance);
    Shell::new(app, &waker)
        .idle(fastframe_tray::idle)
        .run(|lease| {
            let mut viewport = egui::ViewportBuilder::default().with_title("Penombre Sync");
            if let Some(icon) = ui::app_icon() {
                viewport = viewport.with_icon(icon);
            }
            let options = eframe::NativeOptions {
                viewport: viewport
                    .with_inner_size([440.0, 520.0])
                    .with_min_inner_size([380.0, 420.0]),
                // The default app menu's Quit is `terminate:`, which exits the
                // process on the spot: tray and sync included. ⌘Q only closes
                // the window instead (`Window::ui`); the tray's Quit quits.
                #[cfg(target_os = "macos")]
                event_loop_builder: Some(Box::new(|builder| {
                    use winit::platform::macos::EventLoopBuilderExtMacOS;
                    builder.with_default_menu(false);
                })),
                ..Default::default()
            };
            eframe::run_native(
                "Penombre Sync",
                options,
                Box::new(move |cc| {
                    ui::install(&cc.egui_ctx);
                    let mut app = lease.take(&cc.egui_ctx);
                    app.attach_tray();
                    Ok(Box::new(Window::new(app)))
                }),
            )
        })
}
