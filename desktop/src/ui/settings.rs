use egui::{Align, Layout, RichText, Ui, Vec2};
use fastframe_fonts::Weight;

use super::theme::Palette;
use super::widgets::{card, error_line, primary, secondary, segmented, switch};
use super::{Action, Check, Level, Updates, View, account};
use crate::app::Login;
use crate::update::{self, Channel, Found};

pub(super) fn settings(ui: &mut Ui, p: &Palette, view: &mut View<'_>, action: &mut Option<Action>) {
    card(ui, p, "Account", |ui| account::account(ui, p, view, action));
    card(ui, p, "Start at login", |ui| login(ui, p, view, action));
    card(ui, p, "Updates", |ui| updates(ui, p, &view.updates, action));
    card(ui, p, "Permissions", |ui| {
        for check in view.checks {
            row(ui, p, check, action);
        }
    });
}

fn login(ui: &mut Ui, p: &Palette, view: &View<'_>, action: &mut Option<Action>) {
    let (on, enabled) = match view.login {
        Login::On => (true, true),
        Login::Off => (false, true),
        Login::Homebrew(_) => (true, false),
        Login::Unsupported => (false, false),
    };
    ui.horizontal(|ui| {
        ui.label(RichText::new("Open Penombre Sync when you log in").color(p.text));
        ui.with_layout(Layout::right_to_left(Align::Center), |ui| {
            if let Some(on) = switch(ui, p, on, enabled) {
                *action = Some(Action::StartAtLogin(on));
            }
        });
    });
    match view.login {
        Login::Homebrew(command) => {
            ui.label(
                RichText::new("Started at login by Homebrew (brew services). To stop that:")
                    .small()
                    .color(p.subtle),
            );
            ui.label(RichText::new(command).monospace().small().color(p.text));
        }
        Login::Unsupported => {
            ui.label(
                RichText::new("Not available on this system.")
                    .small()
                    .color(p.subtle),
            );
        }
        Login::On | Login::Off => {}
    }
    if let Some(error) = view.login_error {
        error_line(ui, p, error);
    }
}

fn row(ui: &mut Ui, p: &Palette, check: &Check, action: &mut Option<Action>) {
    let color = match check.level {
        Level::Ok => p.success,
        Level::Neutral => p.subtle,
        Level::Problem => p.danger,
    };
    ui.horizontal(|ui| {
        ui.with_layout(Layout::right_to_left(Align::Min), |ui| {
            if let Some((label, url)) = &check.action
                && ui.small_button(*label).clicked()
            {
                *action = Some(Action::Open(url.clone()));
            }
            ui.with_layout(Layout::left_to_right(Align::Min), |ui| {
                let (rect, _) = ui.allocate_exact_size(Vec2::new(8.0, 18.0), egui::Sense::hover());
                ui.painter().circle_filled(rect.center(), 4.0, color);
                ui.vertical(|ui| {
                    ui.spacing_mut().item_spacing.y = 1.0;
                    ui.add(
                        egui::Label::new(
                            RichText::new(&check.label)
                                .font(Weight::Medium.font_id(14.0))
                                .color(p.text),
                        )
                        .truncate(),
                    );
                    ui.add(
                        egui::Label::new(RichText::new(&check.detail).small().color(p.subtle))
                            .wrap(),
                    );
                });
            });
        });
    });
}

fn updates(ui: &mut Ui, p: &Palette, view: &Updates<'_>, action: &mut Option<Action>) {
    ui.horizontal(|ui| {
        ui.label(RichText::new(format!("Version {}", view.version)).color(p.text));
        ui.with_layout(Layout::right_to_left(Align::Center), |ui| {
            let options = [(Channel::Canary, "Canary"), (Channel::Stable, "Stable")];
            if let Some(channel) = segmented(ui, p, view.channel, &options) {
                *action = Some(Action::Channel(channel));
            }
        });
    });
    let note = |ui: &mut Ui, text: &str| {
        ui.label(RichText::new(text).small().color(p.subtle));
    };
    match view.found {
        Found::Off => note(ui, "Built from source: no update checks."),
        Found::Checking => note(ui, "Checking for updates…"),
        Found::Current => note(ui, "Up to date."),
        Found::Failed(error) => error_line(ui, p, &format!("Could not check for updates: {error}")),
        Found::Newer(release) => match view.brew {
            Some(installed) => {
                note(
                    ui,
                    &format!("Version {} is out. To install it:", release.version),
                );
                ui.label(
                    RichText::new(update::brew_command(installed, view.channel))
                        .monospace()
                        .small()
                        .color(p.text),
                );
            }
            None => {
                note(ui, &format!("Version {} is out.", release.version));
                ui.horizontal(|ui| {
                    if view.installing {
                        ui.add(egui::Spinner::new().size(14.0).color(p.primary));
                        note(ui, "Downloading and installing…");
                        return;
                    }
                    if primary(ui, p, "Install and restart", None, true, false) {
                        *action = Some(Action::InstallUpdate);
                    }
                    if secondary(ui, p, "Release notes", None) {
                        *action = Some(Action::Open(release.url.clone()));
                    }
                });
                if let Some(error) = view.install_error {
                    error_line(ui, p, error);
                }
            }
        },
    }
}
