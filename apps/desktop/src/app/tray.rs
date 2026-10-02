use std::path::PathBuf;

use fastframe_tray::{Event, MenuItem};

use super::App;
use crate::sync::Cmd;

pub(super) const STATUS: &str = "status";
const PAUSE: &str = "pause";

impl App {
    pub fn attach_tray(&mut self) {
        if let Some(tray) = &mut self.tray {
            tray.attach();
        }
    }

    pub(super) fn tray_events(&mut self) {
        let events = self
            .tray
            .as_ref()
            .map(fastframe_tray::Tray::events)
            .unwrap_or_default();
        for event in events {
            match event {
                Event::Toggle | Event::Show | Event::Menu(STATUS | "settings") => self.show = true,
                Event::Menu("sync") if !self.config.paused => {
                    let _ = self.sync.send(Cmd::SyncNow);
                }
                Event::Menu(PAUSE) => self.set_paused(!self.config.paused),
                Event::Menu("open-web") if !self.config.server.is_empty() => {
                    open_logged(PathBuf::from(&self.config.server));
                }
                Event::Menu("quit") => self.quit = true,
                Event::Menu(_) => {}
            }
        }
    }

    pub(super) fn update_pause_label(&mut self) {
        let label = if self.config.paused {
            "Resume syncing"
        } else {
            "Pause syncing"
        };
        if let Some(tray) = &mut self.tray {
            tray.set_label(PAUSE, label);
        }
    }

    /// Beside the icon in the menu bar (the tooltip elsewhere): only while
    /// syncing.
    pub(super) fn update_tray_status(&mut self, status: Option<String>) {
        if let Some(tray) = &mut self.tray
            && status != self.tray_status
        {
            tray.set_status(status.clone());
            self.tray_status = status;
        }
    }

    pub(super) fn update_tray_label(&mut self, label: String) {
        if let Some(tray) = &mut self.tray
            && label != self.tray_label
        {
            tray.set_label(STATUS, &label);
            self.tray_label = label;
        }
    }
}

fn open_logged(target: PathBuf) {
    if let Err(error) = open::that(&target) {
        log::warn!("could not open {}: {error}", target.display());
    }
}

pub(super) fn config() -> fastframe_tray::Config {
    fastframe_tray::Config {
        id: "penombre-sync",
        title: "Penombre Sync".into(),
        icon: |size| icon(size, [122, 31, 61]),
        template_icon: Some(|size| icon(size, [0, 0, 0])),
        menu: vec![
            MenuItem::action(STATUS, "Not signed in"),
            MenuItem::Separator,
            MenuItem::action("sync", "Sync now"),
            MenuItem::action(PAUSE, "Pause syncing"),
            MenuItem::action("open-web", "Open Penombre in browser"),
            MenuItem::action("settings", "Settings…"),
            MenuItem::Separator,
            MenuItem::action("quit", "Quit"),
        ],
    }
}

/// A disc lit on its left half, in shade on its right.
fn icon(size: usize, rgb: [u8; 3]) -> Vec<u8> {
    let r = size as f32 / 2.0;
    let mut pixels = Vec::with_capacity(size * size * 4);
    for y in 0..size {
        for x in 0..size {
            let (dx, dy) = (x as f32 + 0.5 - r, y as f32 + 0.5 - r);
            let inside = dx * dx + dy * dy <= (r - 1.0) * (r - 1.0);
            let alpha = match (inside, dx < 0.0) {
                (false, _) => 0,
                (true, true) => 255,
                (true, false) => 90,
            };
            pixels.extend_from_slice(&[rgb[0], rgb[1], rgb[2], alpha]);
        }
    }
    pixels
}

#[cfg(test)]
#[path = "../../tests/app/tray.rs"]
mod tests;
