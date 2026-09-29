use std::path::Path;

use egui::{Align, CornerRadius, Frame, Layout, Margin, RichText, Ui};
use fastframe_fonts::Weight;

use super::theme::{Icon, Palette, RADIUS};
use super::widgets::{error_line, primary, secondary};
use super::{Action, Adding, Phase, View};

pub(super) fn folders(ui: &mut Ui, p: &Palette, view: &mut View<'_>, action: &mut Option<Action>) {
    if view.pairs.is_empty() && view.adding.is_none() {
        ui.label(RichText::new("No folder syncs yet.").color(p.subtle));
    }
    for (index, pair) in view.pairs.iter().enumerate() {
        ui.horizontal(|ui| {
            ui.add(Icon::Folder.image(p.subtle, 18.0));
            ui.with_layout(Layout::right_to_left(Align::Center), |ui| {
                let remove = ui
                    .add(egui::Button::image(Icon::Remove.image(p.subtle, 14.0)).frame(false))
                    .on_hover_text("Stop syncing this folder. Nothing is deleted.");
                if remove.clicked() {
                    *action = Some(Action::Remove(index));
                }
                ui.with_layout(Layout::top_down(Align::Min), |ui| {
                    ui.spacing_mut().item_spacing.y = 0.0;
                    ui.add(
                        egui::Label::new(
                            RichText::new(home_relative(&pair.local))
                                .font(Weight::Medium.font_id(14.0))
                                .color(p.text),
                        )
                        .truncate(),
                    )
                    .on_hover_text(pair.local.display().to_string());
                    ui.add(
                        egui::Label::new(
                            RichText::new(format!("→ {}", pair.label))
                                .small()
                                .color(p.subtle),
                        )
                        .truncate(),
                    );
                });
            });
        });
    }
    let signed_in = matches!(view.phase, Phase::SignedIn);
    match &mut view.adding {
        Some(adding) => adding_form(ui, p, adding, action),
        None => {
            let add = egui::Button::image_and_text(Icon::Plus.image(p.text, 15.0), "Add folder…");
            if ui
                .add_enabled(signed_in, add)
                .on_disabled_hover_text("Sign in first.")
                .clicked()
            {
                *action = Some(Action::AddFolder);
            }
        }
    }
}

fn adding_form(ui: &mut Ui, p: &Palette, adding: &mut Adding<'_>, action: &mut Option<Action>) {
    Frame::new()
        .fill(p.muted)
        .corner_radius(CornerRadius::same(RADIUS))
        .inner_margin(Margin::same(12))
        .show(ui, |ui| {
            ui.set_width(ui.available_width());
            ui.horizontal(|ui| {
                ui.add(Icon::Folder.image(p.subtle, 18.0));
                ui.label(
                    RichText::new(home_relative(adding.local))
                        .font(Weight::Medium.font_id(14.0))
                        .color(p.text),
                );
            });
            let ready = match adding.places {
                None => {
                    ui.horizontal(|ui| {
                        ui.add(egui::Spinner::new().size(14.0).color(p.primary));
                        ui.label(
                            RichText::new("Asking the server where it can go…").color(p.subtle),
                        );
                    });
                    false
                }
                Some(Err(error)) => {
                    error_line(ui, p, error);
                    false
                }
                Some(Ok(places)) => {
                    ui.label(RichText::new("Sync to").small().color(p.subtle));
                    let chosen = places
                        .get(*adding.choice)
                        .map_or("", |place| place.name.as_str());
                    egui::ComboBox::from_id_salt("place")
                        .selected_text(chosen)
                        .width(ui.available_width())
                        .show_ui(ui, |ui| {
                            for (index, place) in places.iter().enumerate() {
                                ui.selectable_value(&mut *adding.choice, index, &place.name);
                            }
                        });
                    ui.label(RichText::new("In the folder").small().color(p.subtle));
                    ui.add(
                        egui::TextEdit::singleline(&mut *adding.subfolder)
                            .hint_text("Leave empty for the whole place")
                            .margin(Margin::symmetric(10, 8))
                            .desired_width(f32::INFINITY),
                    );
                    !places.is_empty()
                }
            };
            if let Some(error) = adding.error {
                error_line(ui, p, error);
            }
            ui.horizontal(|ui| {
                ui.with_layout(Layout::right_to_left(Align::Center), |ui| {
                    if primary(ui, p, "Add", None, ready, false) {
                        *action = Some(Action::ConfirmAdd);
                    }
                    if secondary(ui, p, "Cancel", None) {
                        *action = Some(Action::CancelAdd);
                    }
                });
            });
        });
}

pub fn home_relative(path: &Path) -> String {
    match directories::BaseDirs::new() {
        Some(dirs) => match path.strip_prefix(dirs.home_dir()) {
            Ok(rest) => format!("~/{}", rest.display()),
            Err(_) => path.display().to_string(),
        },
        None => path.display().to_string(),
    }
}
