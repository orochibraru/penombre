use egui::{CornerRadius, Frame, Margin, RichText, Stroke, Ui, Vec2};
use fastframe_fonts::Weight;

use super::SyncState;
use super::theme::{Icon, Palette, RADIUS};

pub(super) fn dot(ui: &mut Ui, p: &Palette, state: SyncState) {
    let color = match state {
        SyncState::Off | SyncState::Paused => p.subtle,
        SyncState::Running => p.primary,
        SyncState::Ok => p.success,
        SyncState::Failed => p.danger,
    };
    let (rect, _) = ui.allocate_exact_size(Vec2::splat(8.0), egui::Sense::hover());
    ui.painter().circle_filled(rect.center(), 4.0, color);
}

pub(super) fn card(ui: &mut Ui, p: &Palette, title: &str, add: impl FnOnce(&mut Ui)) {
    Frame::new()
        .fill(p.card)
        .stroke(Stroke::new(1.0, p.border))
        .corner_radius(CornerRadius::same(12))
        .inner_margin(Margin::same(16))
        .show(ui, |ui| {
            ui.set_width(ui.available_width());
            ui.spacing_mut().item_spacing.y = 10.0;
            ui.label(
                RichText::new(title)
                    .font(Weight::SemiBold.font_id(13.0))
                    .color(p.subtle),
            );
            add(ui);
        });
}

pub(super) fn primary(
    ui: &mut Ui,
    p: &Palette,
    text: &str,
    icon: Option<Icon>,
    enabled: bool,
    wide: bool,
) -> bool {
    let label = RichText::new(text).color(p.on_primary);
    let button = match icon {
        Some(icon) => egui::Button::image_and_text(icon.image(p.on_primary, 15.0), label),
        None => egui::Button::new(label),
    }
    .fill(p.primary)
    .stroke(Stroke::NONE)
    .corner_radius(CornerRadius::same(RADIUS));
    let button = if wide {
        button.min_size(Vec2::new(ui.available_width(), 34.0))
    } else {
        button
    };
    ui.add_enabled(enabled, button).clicked()
}

pub(super) fn secondary(ui: &mut Ui, p: &Palette, text: &str, icon: Option<Icon>) -> bool {
    let button = match icon {
        Some(icon) => egui::Button::image_and_text(icon.image(p.text, 15.0), text),
        None => egui::Button::new(text),
    };
    ui.add(button).clicked()
}

pub(super) fn error_line(ui: &mut Ui, p: &Palette, error: &str) {
    ui.horizontal_wrapped(|ui| {
        ui.add(Icon::Alert.image(p.danger, 15.0));
        ui.label(RichText::new(error).color(p.danger));
    });
}

/// A thin rounded progress track, `fraction` of it filled.
pub(super) fn bar(ui: &mut Ui, p: &Palette, fraction: f32, height: f32) {
    let (rect, _) = ui.allocate_exact_size(
        Vec2::new(ui.available_width(), height),
        egui::Sense::hover(),
    );
    let radius = CornerRadius::same((height / 2.0) as u8);
    ui.painter().rect_filled(rect, radius, p.muted);
    let mut filled = rect;
    filled.set_width(rect.width() * fraction.clamp(0.0, 1.0));
    ui.painter().rect_filled(filled, radius, p.primary);
}

/// A pill of options, the chosen one raised. Laid out right to left, so
/// `options` come last first. Returns a newly chosen option.
pub(super) fn segmented<T: Copy + PartialEq>(
    ui: &mut Ui,
    p: &Palette,
    chosen: T,
    options: &[(T, &str)],
) -> Option<T> {
    let mut picked = None;
    Frame::new()
        .fill(p.muted)
        .stroke(Stroke::new(1.0, p.border))
        .corner_radius(CornerRadius::same(RADIUS))
        .inner_margin(Margin::same(3))
        .show(ui, |ui| {
            ui.spacing_mut().item_spacing.x = 2.0;
            ui.spacing_mut().button_padding = Vec2::new(12.0, 3.0);
            ui.spacing_mut().interact_size.y = 26.0;
            for (value, label) in options {
                let on = *value == chosen;
                let text = RichText::new(*label)
                    .font(Weight::Medium.font_id(13.0))
                    .color(if on { p.text } else { p.subtle });
                let button = egui::Button::new(text)
                    .fill(if on { p.card } else { p.muted })
                    .stroke(if on {
                        Stroke::new(1.0, p.border)
                    } else {
                        Stroke::NONE
                    })
                    .corner_radius(CornerRadius::same(RADIUS - 2));
                if ui.add(button).clicked() && !on {
                    picked = Some(*value);
                }
            }
        });
    picked
}

/// An on/off switch. Returns the new value when clicked.
pub(super) fn switch(ui: &mut Ui, p: &Palette, on: bool, enabled: bool) -> Option<bool> {
    let size = Vec2::new(36.0, 20.0);
    let sense = if enabled {
        egui::Sense::click()
    } else {
        egui::Sense::hover()
    };
    let (rect, response) = ui.allocate_exact_size(size, sense);
    let t = ui.ctx().animate_bool(response.id, on);
    let track = if on { p.primary } else { p.border };
    let track = if enabled {
        track
    } else {
        track.linear_multiply(0.5)
    };
    ui.painter()
        .rect_filled(rect, CornerRadius::same(10), track);
    let x = egui::lerp(rect.left() + 10.0..=rect.right() - 10.0, t);
    ui.painter()
        .circle_filled(egui::pos2(x, rect.center().y), 8.0, p.on_primary);
    response.clicked().then_some(!on)
}
