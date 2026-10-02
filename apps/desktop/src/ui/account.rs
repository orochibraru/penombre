use egui::{Align, CornerRadius, Frame, Layout, Margin, RichText, Ui};
use fastframe_fonts::Weight;

use super::theme::{Icon, Palette, RADIUS};
use super::widgets::{error_line, primary, secondary};
use super::{Action, Phase, View};

pub(super) fn account(ui: &mut Ui, p: &Palette, view: &mut View<'_>, action: &mut Option<Action>) {
    match &view.phase {
        Phase::SignedOut => {
            ui.add(
                egui::TextEdit::singleline(&mut *view.server)
                    .hint_text("https://files.example.com")
                    .margin(Margin::symmetric(10, 8))
                    .desired_width(f32::INFINITY),
            );
            let ready = !view.server.trim().is_empty();
            if primary(
                ui,
                p,
                "Sign in with browser",
                Some(Icon::External),
                ready,
                true,
            ) {
                *action = Some(Action::SignIn);
            }
        }
        Phase::Waiting(code) => {
            ui.label(RichText::new("Approve this code in your browser.").color(p.subtle));
            let text = code.map_or_else(|| "········".to_owned(), spaced);
            Frame::new()
                .fill(p.muted)
                .corner_radius(CornerRadius::same(RADIUS))
                .inner_margin(Margin::symmetric(12, 12))
                .show(ui, |ui| {
                    ui.set_width(ui.available_width());
                    ui.vertical_centered(|ui| {
                        ui.label(
                            RichText::new(text)
                                .font(Weight::SemiBold.font_id(28.0))
                                .color(p.text),
                        );
                    });
                });
            ui.horizontal(|ui| {
                ui.add(egui::Spinner::new().size(14.0).color(p.primary));
                ui.label(RichText::new("Waiting for approval…").color(p.subtle));
                ui.with_layout(Layout::right_to_left(Align::Center), |ui| {
                    if secondary(ui, p, "Cancel", None) {
                        *action = Some(Action::Cancel);
                    }
                });
            });
        }
        Phase::SignedIn => {
            ui.horizontal(|ui| {
                ui.add(Icon::Check.image(p.success, 18.0));
                ui.vertical(|ui| {
                    ui.spacing_mut().item_spacing.y = 1.0;
                    ui.label(
                        RichText::new(host(view.server))
                            .font(Weight::Medium.font_id(14.0))
                            .color(p.text),
                    );
                    ui.add(
                        egui::Label::new(
                            RichText::new(format!("Signed in at {}", view.server))
                                .small()
                                .color(p.subtle),
                        )
                        .truncate(),
                    );
                    ui.add(
                        egui::Label::new(
                            RichText::new(format!("API key “{}”", view.key_name))
                                .small()
                                .color(p.subtle),
                        )
                        .truncate(),
                    );
                });
            });
            ui.horizontal(|ui| {
                if secondary(ui, p, "Change server", None) {
                    *action = Some(Action::ChangeServer);
                }
                if secondary(ui, p, "Sign out", Some(Icon::LogOut)) {
                    *action = Some(Action::SignOut);
                }
            });
        }
    }
    if let Some(error) = view.auth_error {
        error_line(ui, p, error);
    }
}

/// `ABCD-EFGH` reads better than `ABCDEFGH` when copied by eye.
fn spaced(code: &str) -> String {
    let chars: Vec<char> = code.chars().collect();
    if chars.len() == 8 {
        let (a, b) = chars.split_at(4);
        format!(
            "{}-{}",
            a.iter().collect::<String>(),
            b.iter().collect::<String>()
        )
    } else {
        code.to_owned()
    }
}

fn host(server: &str) -> &str {
    server
        .trim_start_matches("https://")
        .trim_start_matches("http://")
        .trim_end_matches('/')
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn codes_are_split_for_reading() {
        assert_eq!(spaced("ABCDEFGH"), "ABCD-EFGH");
        assert_eq!(spaced("ABC"), "ABC");
        assert_eq!(host("https://files.example.com/"), "files.example.com");
    }
}
