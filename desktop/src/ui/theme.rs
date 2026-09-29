use egui::{Color32, CornerRadius, FontId, Stroke, Theme, ThemePreference, Ui, Vec2};
use fastframe_fonts::{FontSetup, Weight};

fastframe_icons::icons! {
    pub enum Icon {
        prefix: "penombre-sync-icon-",
        directory: "../../assets/icons/",
        Folder => "folder",
        Check => lucide "circle-check",
        Alert => lucide "circle-alert",
        Refresh => lucide "refresh-cw",
        LogOut => lucide "log-out",
        External => lucide "external-link",
        Remove => lucide "x",
        Plus => lucide "plus",
        Up => "arrow-up",
        Down => "arrow-down",
        Trash => lucide "trash-2",
        Pause => lucide "pause",
        Play => lucide "play",
    }
}

/// Penombre's tokens (`src/app.css`), bordeaux accent, translucent ones
/// flattened onto the base surface: a window has no aurora behind it.
pub struct Palette {
    pub base: Color32,
    pub card: Color32,
    pub muted: Color32,
    pub border: Color32,
    pub text: Color32,
    pub subtle: Color32,
    pub primary: Color32,
    pub on_primary: Color32,
    pub danger: Color32,
    pub success: Color32,
}

const LIGHT: Palette = Palette {
    base: Color32::from_rgb(0xf3, 0xf3, 0xf7),
    card: Color32::from_rgb(0xff, 0xff, 0xff),
    muted: Color32::from_rgb(0xee, 0xee, 0xf4),
    border: Color32::from_rgb(0xdc, 0xdb, 0xe4),
    text: Color32::from_rgb(0x13, 0x13, 0x1c),
    subtle: Color32::from_rgb(0x61, 0x61, 0x74),
    primary: Color32::from_rgb(0x91, 0x1f, 0x43),
    on_primary: Color32::WHITE,
    danger: Color32::from_rgb(0xd4, 0x12, 0x33),
    success: Color32::from_rgb(0x3b, 0x95, 0x55),
};

const DARK: Palette = Palette {
    base: Color32::from_rgb(0x0c, 0x0b, 0x13),
    card: Color32::from_rgb(0x16, 0x15, 0x1f),
    muted: Color32::from_rgb(0x1e, 0x1c, 0x27),
    border: Color32::from_rgb(0x2c, 0x2b, 0x38),
    text: Color32::from_rgb(0xf5, 0xf5, 0xf8),
    subtle: Color32::from_rgb(0xa3, 0xa2, 0xb7),
    primary: Color32::from_rgb(0xd8, 0x51, 0x6a),
    on_primary: Color32::WHITE,
    danger: Color32::from_rgb(0xff, 0x63, 0x67),
    success: Color32::from_rgb(0x5b, 0xbd, 0x74),
};

pub(super) fn palette(ui: &Ui) -> &'static Palette {
    if ui.visuals().dark_mode {
        &DARK
    } else {
        &LIGHT
    }
}

pub(super) const RADIUS: u8 = 8;

/// Once per egui context: fonts, icons, and both themes, following the system.
pub fn install(ctx: &egui::Context) {
    egui_extras::install_image_loaders(ctx);
    fastframe_icons::install::<Icon>(ctx);
    FontSetup::default()
        .weights(&[Weight::Medium, Weight::SemiBold])
        .install(ctx);
    for (theme, p) in [(Theme::Light, &LIGHT), (Theme::Dark, &DARK)] {
        ctx.set_visuals_of(theme, visuals(theme, p));
        ctx.style_mut_of(theme, |style| {
            style.spacing.item_spacing = Vec2::new(8.0, 8.0);
            style.spacing.button_padding = Vec2::new(14.0, 7.0);
            style.spacing.interact_size.y = 32.0;
            style
                .text_styles
                .insert(egui::TextStyle::Body, FontId::proportional(14.0));
            style
                .text_styles
                .insert(egui::TextStyle::Button, Weight::Medium.font_id(14.0));
            style
                .text_styles
                .insert(egui::TextStyle::Small, FontId::proportional(12.0));
            style
                .text_styles
                .insert(egui::TextStyle::Monospace, FontId::monospace(13.0));
        });
    }
    ctx.set_theme(ThemePreference::System);
}

fn visuals(theme: Theme, p: &Palette) -> egui::Visuals {
    let mut v = match theme {
        Theme::Light => egui::Visuals::light(),
        Theme::Dark => egui::Visuals::dark(),
    };
    let corner = CornerRadius::same(RADIUS);
    v.panel_fill = p.base;
    v.window_fill = p.card;
    v.extreme_bg_color = p.card;
    v.faint_bg_color = p.muted;
    v.code_bg_color = p.muted;
    v.hyperlink_color = p.primary;
    v.error_fg_color = p.danger;
    v.warn_fg_color = p.danger;
    v.selection.bg_fill = p.primary.linear_multiply(0.25);
    v.selection.stroke = Stroke::new(1.0, p.primary);
    v.text_cursor.stroke = Stroke::new(2.0, p.primary);
    v.window_corner_radius = CornerRadius::same(12);
    v.widgets.noninteractive.bg_stroke = Stroke::new(1.0, p.border);
    v.widgets.noninteractive.fg_stroke = Stroke::new(1.0, p.text);
    for (w, fill, stroke) in [
        (&mut v.widgets.inactive, p.card, p.border),
        (&mut v.widgets.hovered, p.muted, p.subtle),
        (&mut v.widgets.active, p.muted, p.primary),
        (&mut v.widgets.open, p.muted, p.primary),
    ] {
        w.bg_fill = fill;
        w.weak_bg_fill = fill;
        w.bg_stroke = Stroke::new(1.0, stroke);
        w.fg_stroke = Stroke::new(1.0, p.text);
        w.corner_radius = corner;
        w.expansion = 0.0;
    }
    v
}
