use std::time::SystemTime;

use egui::{Align, CornerRadius, Frame, Layout, Margin, RichText, Ui, Vec2};
use fastframe_fonts::Weight;

use super::theme::{Icon, Palette, RADIUS};
use super::widgets::{bar, dot, primary};
use super::{Action, Phase, SyncState, View};
use crate::sync::{Change, Failure, Progress, Synced};

const TRANSFERS_SHOWN: usize = 5;
const FAILURES_SHOWN: usize = 8;

pub(super) fn sync(ui: &mut Ui, p: &Palette, view: &View<'_>, action: &mut Option<Action>) {
    let signed_in = matches!(view.phase, Phase::SignedIn);
    let paused = view.state == SyncState::Paused;
    ui.horizontal(|ui| {
        ui.with_layout(Layout::right_to_left(Align::Center), |ui| {
            let enabled = signed_in && !paused && view.state != SyncState::Running;
            if primary(ui, p, "Sync now", Some(Icon::Refresh), enabled, false) {
                *action = Some(Action::SyncNow);
            }
            let (hint, icon) = if paused {
                ("Resume syncing", Icon::Play)
            } else {
                ("Pause syncing", Icon::Pause)
            };
            if signed_in
                && ui
                    .add(egui::Button::image(icon.image(p.text, 15.0)).min_size(Vec2::splat(32.0)))
                    .on_hover_text(hint)
                    .clicked()
            {
                *action = Some(Action::Pause(!paused));
            }
            ui.with_layout(Layout::left_to_right(Align::Center), |ui| {
                if view.state == SyncState::Running {
                    ui.add(egui::Spinner::new().size(14.0).color(p.primary));
                } else {
                    dot(ui, p, view.state);
                }
                ui.add(egui::Label::new(RichText::new(view.status).color(p.text)).truncate());
            });
        });
    });
    if let Some((label, progress)) = view.progress {
        running(ui, p, label, progress);
    }
    if let Some(error) = view.error {
        Frame::new()
            .fill(p.muted)
            .corner_radius(CornerRadius::same(RADIUS))
            .inner_margin(Margin::same(10))
            .show(ui, |ui| {
                ui.set_width(ui.available_width());
                egui::ScrollArea::vertical()
                    .id_salt("error")
                    .max_height(110.0)
                    .show(ui, |ui| {
                        ui.add(
                            egui::Label::new(
                                RichText::new(error).monospace().small().color(p.subtle),
                            )
                            .wrap(),
                        );
                    });
            });
    }
    if !view.failures.is_empty() {
        failed(ui, p, view.failures);
    }
    if !view.recent.is_empty() {
        recent(ui, p, view.recent, view.now);
    }
}

fn running(ui: &mut Ui, p: &Palette, label: &str, progress: &Progress) {
    ui.add(
        egui::Label::new(
            RichText::new(label)
                .font(Weight::Medium.font_id(14.0))
                .color(p.text),
        )
        .truncate(),
    );
    let fraction = if progress.total_bytes > 0 {
        progress.bytes as f32 / progress.total_bytes as f32
    } else if progress.total_transfers > 0 {
        progress.transfers as f32 / progress.total_transfers as f32
    } else {
        0.0
    };
    bar(ui, p, fraction, 6.0);
    let mut line = format!(
        "{} of {} · {} of {} files",
        bytes(progress.bytes),
        bytes(progress.total_bytes),
        progress.transfers,
        progress.total_transfers
    );
    if let Some(eta) = progress.eta.filter(|s| *s > 0) {
        line += &format!(" · {} left", duration(eta));
    }
    ui.label(RichText::new(line).small().color(p.subtle));
    for transfer in progress.transferring.iter().take(TRANSFERS_SHOWN) {
        ui.scope(|ui| {
            ui.spacing_mut().item_spacing.y = 3.0;
            ui.horizontal(|ui| {
                ui.with_layout(Layout::right_to_left(Align::Center), |ui| {
                    ui.label(
                        RichText::new(format!("{}%", transfer.percentage))
                            .small()
                            .color(p.subtle),
                    );
                    ui.with_layout(Layout::left_to_right(Align::Center), |ui| {
                        ui.add(
                            egui::Label::new(RichText::new(&transfer.name).small().color(p.text))
                                .truncate(),
                        )
                        .on_hover_text(format!(
                            "{} · {}",
                            transfer.name,
                            bytes(transfer.size)
                        ));
                    });
                });
            });
            bar(ui, p, f32::from(transfer.percentage) / 100.0, 3.0);
        });
    }
}

fn subtitle(ui: &mut Ui, p: &Palette, text: &str) {
    ui.add_space(2.0);
    ui.label(
        RichText::new(text)
            .font(Weight::SemiBold.font_id(12.0))
            .color(p.subtle),
    );
}

fn failed(ui: &mut Ui, p: &Palette, failures: &[Failure]) {
    subtitle(ui, p, &format!("Failed · {}", failures.len()));
    for failure in failures.iter().take(FAILURES_SHOWN) {
        ui.horizontal(|ui| {
            ui.add(Icon::Alert.image(p.danger, 14.0));
            ui.vertical(|ui| {
                ui.spacing_mut().item_spacing.y = 0.0;
                ui.add(egui::Label::new(RichText::new(&failure.name).color(p.text)).truncate())
                    .on_hover_text(format!("{} / {}", failure.pair, failure.name));
                ui.add(
                    egui::Label::new(RichText::new(&failure.message).small().color(p.danger))
                        .truncate(),
                )
                .on_hover_text(&failure.message);
            });
        });
    }
    if failures.len() > FAILURES_SHOWN {
        ui.label(
            RichText::new(format!("and {} more", failures.len() - FAILURES_SHOWN))
                .small()
                .color(p.subtle),
        );
    }
}

fn recent(ui: &mut Ui, p: &Palette, recent: &[Synced], now: SystemTime) {
    subtitle(ui, p, "Recent");
    egui::ScrollArea::vertical()
        .id_salt("recent")
        .max_height(150.0)
        .min_scrolled_height(150.0)
        .show(ui, |ui| {
            ui.spacing_mut().interact_size.y = 20.0;
            for file in recent {
                let (icon, color, what) = match file.change {
                    Change::Uploaded => (Icon::Up, p.primary, "Uploaded"),
                    Change::Downloaded => (Icon::Down, p.success, "Downloaded"),
                    Change::DeletedOnServer => (Icon::Trash, p.subtle, "Deleted on the server"),
                    Change::DeletedHere => (Icon::Trash, p.subtle, "Deleted here"),
                };
                ui.horizontal(|ui| {
                    ui.add(icon.image(color, 14.0));
                    ui.with_layout(Layout::right_to_left(Align::Center), |ui| {
                        ui.label(RichText::new(ago(file.at, now)).small().color(p.subtle));
                        ui.with_layout(Layout::left_to_right(Align::Center), |ui| {
                            ui.add(
                                egui::Label::new(RichText::new(&file.name).color(p.text))
                                    .truncate(),
                            )
                            .on_hover_text(format!("{what} · {} / {}", file.pair, file.name));
                        });
                    });
                });
            }
        });
}

fn bytes(n: u64) -> String {
    const UNITS: [&str; 4] = ["KB", "MB", "GB", "TB"];
    if n < 1000 {
        return format!("{n} B");
    }
    let mut value = n as f64 / 1000.0;
    let mut unit = 0;
    while value >= 1000.0 && unit < UNITS.len() - 1 {
        value /= 1000.0;
        unit += 1;
    }
    format!("{value:.1} {}", UNITS[unit])
}

fn duration(seconds: u64) -> String {
    match seconds {
        0..60 => format!("{seconds} s"),
        60..3600 => format!("{} min", seconds.div_ceil(60)),
        _ => format!("{} h {} min", seconds / 3600, seconds % 3600 / 60),
    }
}

fn ago(at: SystemTime, now: SystemTime) -> String {
    match now.duration_since(at).unwrap_or_default().as_secs() / 60 {
        0 => "just now".into(),
        m @ 1..60 => format!("{m} min ago"),
        m => format!("{} h ago", m / 60),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn sizes_and_times_read_short() {
        assert_eq!(bytes(999), "999 B");
        assert_eq!(bytes(409_600), "409.6 KB");
        assert_eq!(bytes(6_291_456), "6.3 MB");
        assert_eq!(duration(42), "42 s");
        assert_eq!(duration(61), "2 min");
        let now = SystemTime::now();
        assert_eq!(ago(now, now), "just now");
        assert_eq!(
            ago(now - std::time::Duration::from_secs(7200), now),
            "2 h ago"
        );
    }
}
