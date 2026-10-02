use super::*;

fn ids() -> Vec<&'static str> {
    config()
        .menu
        .iter()
        .filter_map(|item| match item {
            MenuItem::Action { id, .. } => Some(*id),
            MenuItem::Separator => None,
        })
        .collect()
}

#[test]
fn the_menu_opens_on_the_status_and_ends_on_quit() {
    let ids = ids();
    assert_eq!(ids.first(), Some(&STATUS));
    assert_eq!(ids.last(), Some(&"quit"));
    let mut unique = ids.clone();
    unique.sort_unstable();
    unique.dedup();
    assert_eq!(unique.len(), ids.len(), "an id twice: {ids:?}");
    // One entry cannot open several synced folders.
    assert!(!ids.contains(&"open-folder"));
    for handled in ["sync", PAUSE, "open-web", "settings"] {
        assert!(ids.contains(&handled), "{handled}");
    }
}

#[test]
fn the_icon_is_a_disc_lit_on_its_left_half() {
    let size = 32;
    let pixels = icon(size, [10, 20, 30]);
    assert_eq!(pixels.len(), size * size * 4);
    let alpha = |x: usize, y: usize| pixels[(y * size + x) * 4 + 3];
    assert_eq!(alpha(0, 0), 0, "outside the disc");
    assert_eq!(alpha(8, size / 2), 255, "left half");
    assert_eq!(alpha(size - 8, size / 2), 90, "right half");
    assert_eq!(&pixels[(size / 2 * size + 8) * 4..][..3], &[10, 20, 30]);
}
