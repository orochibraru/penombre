//! The settings window: Penombre's palette and type, drawn from a plain view
//! so every state can be rendered without the tray, the network or rclone.

mod account;
mod folders;
mod settings;
mod sync;
mod theme;
mod widgets;

use std::path::Path;

use egui::{CornerRadius, Frame, Margin, RichText, Stroke, Ui, Vec2};
use fastframe_fonts::Weight;

pub use folders::home_relative;
use theme::{Icon, Palette, RADIUS, palette};
pub use theme::{app_icon, install};
use widgets::card;

use crate::app::Login;
use crate::update::{Channel, Found};

#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum Tab {
    Sync,
    Settings,
}

#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum Level {
    Ok,
    Neutral,
    Problem,
}

/// One line of the permissions list.
#[derive(Clone, Debug)]
pub struct Check {
    pub label: String,
    pub detail: String,
    pub level: Level,
    /// A button, and the URL it opens.
    pub action: Option<(&'static str, String)>,
}

pub enum Phase<'a> {
    SignedOut,
    /// The user code, once the server has handed one out.
    Waiting(Option<&'a str>),
    SignedIn,
}

#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum SyncState {
    Off,
    Paused,
    Running,
    Ok,
    Failed,
}

/// A folder being added: where it is, and where it should go.
pub struct Adding<'a> {
    pub local: &'a Path,
    /// None while the server is being asked.
    pub places: Option<Result<&'a [crate::places::Place], &'a str>>,
    pub choice: &'a mut usize,
    pub subfolder: &'a mut String,
    pub error: Option<&'a str>,
}

/// A folder's exclusions, open for editing.
pub struct Excluding<'a> {
    pub index: usize,
    pub pattern: &'a mut String,
    pub error: Option<&'a str>,
}

pub struct View<'a> {
    pub tab: Tab,
    pub server: &'a mut String,
    /// The API key's name on the server.
    pub key_name: &'a str,
    pub login: Login,
    pub login_error: Option<&'a str>,
    pub checks: &'a [Check],
    pub phase: Phase<'a>,
    pub auth_error: Option<&'a str>,
    pub pairs: &'a [crate::store::Pair],
    pub adding: Option<Adding<'a>>,
    pub excluding: Option<Excluding<'a>>,
    pub rclone_missing: bool,
    pub status: &'a str,
    pub state: SyncState,
    pub error: Option<&'a str>,
    /// The pair syncing now, and how far along it is.
    pub progress: Option<(&'a str, &'a crate::sync::Progress)>,
    /// Newest first.
    pub recent: &'a [crate::sync::Synced],
    pub failures: &'a [crate::sync::Failure],
    /// The server stopped answering.
    pub down: Option<&'a crate::sync::Down>,
    pub updates: Updates<'a>,
    pub now: std::time::SystemTime,
}

pub struct Updates<'a> {
    pub version: &'a str,
    pub channel: Channel,
    pub found: &'a Found,
    /// The Homebrew formula that installed this build.
    pub brew: Option<&'a str>,
    pub installing: bool,
    pub install_error: Option<&'a str>,
}

#[derive(Clone, PartialEq, Eq, Debug)]
pub enum Action {
    Tab(Tab),
    SignIn,
    Cancel,
    SignOut,
    ChangeServer,
    StartAtLogin(bool),
    Open(String),
    AddFolder,
    ConfirmAdd,
    CancelAdd,
    Remove(usize),
    ToggleExclusions(usize),
    AddExclusion,
    ExcludeFolder,
    RemoveExclusion(usize),
    SyncNow,
    Pause(bool),
    Channel(Channel),
    InstallUpdate,
}

pub fn draw(ui: &mut Ui, mut view: View<'_>) -> Option<Action> {
    let p = palette(ui);
    let mut action = None;
    egui::ScrollArea::vertical().show(ui, |ui| {
        Frame::new()
            .inner_margin(Margin::symmetric(20, 18))
            .show(ui, |ui| {
                ui.spacing_mut().item_spacing.y = 12.0;
                header(ui, p, view.tab, &mut action);
                if view.rclone_missing {
                    callout(ui, p);
                }
                match view.tab {
                    Tab::Sync => {
                        if let Some(down) = view.down.filter(|_| view.state != SyncState::Paused) {
                            unreachable(ui, p, &view, down, &mut action);
                        }
                        card(ui, p, "Folders", |ui| {
                            folders::folders(ui, p, &mut view, &mut action)
                        });
                        card(ui, p, "Sync", |ui| sync::sync(ui, p, &view, &mut action));
                    }
                    Tab::Settings => settings::settings(ui, p, &mut view, &mut action),
                }
            });
    });
    action
}

fn header(ui: &mut Ui, p: &Palette, tab: Tab, action: &mut Option<Action>) {
    ui.horizontal(|ui| {
        let logo = if ui.visuals().dark_mode {
            egui::include_image!("../../assets/logo-dark.svg")
        } else {
            egui::include_image!("../../assets/logo-light.svg")
        };
        ui.add(egui::Image::new(logo).fit_to_exact_size(Vec2::splat(32.0)));
        ui.label(
            RichText::new("Penombre Sync")
                .font(Weight::SemiBold.font_id(18.0))
                .color(p.text),
        );
        ui.with_layout(egui::Layout::right_to_left(egui::Align::Center), |ui| {
            if let Some(chosen) = widgets::segmented(
                ui,
                p,
                tab,
                &[(Tab::Settings, "Settings"), (Tab::Sync, "Sync")],
            ) {
                *action = Some(Action::Tab(chosen));
            }
        });
    });
}

fn unreachable(
    ui: &mut Ui,
    p: &Palette,
    view: &View<'_>,
    down: &crate::sync::Down,
    action: &mut Option<Action>,
) {
    let host = crate::sync::host(view.server);
    let minutes = view
        .now
        .duration_since(down.since)
        .unwrap_or_default()
        .as_secs()
        / 60;
    let since = match minutes {
        0 => "just now".to_owned(),
        1 => "for 1 minute".to_owned(),
        n => format!("for {n} minutes"),
    };
    Frame::new()
        .fill(p.danger.linear_multiply(0.12))
        .stroke(Stroke::new(1.0, p.danger.linear_multiply(0.5)))
        .corner_radius(CornerRadius::same(RADIUS))
        .inner_margin(Margin::symmetric(12, 10))
        .show(ui, |ui| {
            ui.set_width(ui.available_width());
            ui.horizontal(|ui| {
                ui.add(Icon::Alert.image(p.danger, 16.0));
                ui.label(
                    RichText::new(format!("Can't reach {host}"))
                        .font(Weight::Medium.font_id(14.0))
                        .color(p.text),
                );
                ui.with_layout(egui::Layout::right_to_left(egui::Align::Center), |ui| {
                    if widgets::secondary(ui, p, "Retry now", Some(Icon::Refresh)) {
                        *action = Some(Action::SyncNow);
                    }
                });
            });
            ui.add(
                egui::Label::new(
                    RichText::new(format!(
                        "Not answering {since}: {}. Syncing resumes on its own once it's back.",
                        down.reason
                    ))
                    .small()
                    .color(p.subtle),
                )
                .wrap(),
            );
        });
}

fn callout(ui: &mut Ui, p: &Palette) {
    Frame::new()
        .fill(p.danger.linear_multiply(0.12))
        .stroke(Stroke::new(1.0, p.danger.linear_multiply(0.5)))
        .corner_radius(CornerRadius::same(RADIUS))
        .inner_margin(Margin::symmetric(12, 10))
        .show(ui, |ui| {
            ui.set_width(ui.available_width());
            ui.horizontal(|ui| {
                ui.add(Icon::Alert.image(p.danger, 16.0));
                ui.label(RichText::new("rclone is not installed.").color(p.text));
                ui.hyperlink_to("Install it", "https://rclone.org/install/");
            });
        });
}

#[cfg(test)]
#[path = "../../tests/ui/mod.rs"]
mod tests;
