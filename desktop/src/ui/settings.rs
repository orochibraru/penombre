use egui::{Align, Layout, RichText, Ui, Vec2};
use fastframe_fonts::Weight;

use super::theme::Palette;
use super::widgets::{card, error_line, switch};
use super::{Action, Check, Level, View, account};
use crate::app::Login;

pub(super) fn settings(ui: &mut Ui, p: &Palette, view: &mut View<'_>, action: &mut Option<Action>) {
    card(ui, p, "Account", |ui| account::account(ui, p, view, action));
    card(ui, p, "Start at login", |ui| login(ui, p, view, action));
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
