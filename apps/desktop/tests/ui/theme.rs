#[test]
fn the_app_icon_is_the_moon_on_a_tile() {
    for (dark, ground) in [(false, 255), (true, 0)] {
        let icon = super::app_icon_for(dark).expect("the icon renders");
        assert_eq!((icon.width, icon.height), (512, 512));
        assert_eq!(icon.rgba.len(), 512 * 512 * 4);
        let at = |x: usize, y: usize| &icon.rgba[(y * 512 + x) * 4..][..4];
        assert_eq!(at(4, 4)[3], 0, "the margin is transparent");
        assert_eq!(at(256, 70), [ground, ground, ground, 255], "the tile");
        let lit = at(180, 340);
        assert!(
            lit[3] > 200 && lit[0] > lit[2] && lit[0] > lit[1],
            "bordeaux in the crescent: {lit:?}"
        );
        if let Some(dir) = std::env::var_os("PENOMBRE_SYNC_SNAPSHOTS") {
            let name = if dark {
                "app-icon-dark.png"
            } else {
                "app-icon-light.png"
            };
            image::RgbaImage::from_raw(512, 512, icon.rgba)
                .unwrap()
                .save(std::path::Path::new(&dir).join(name))
                .unwrap();
        }
    }
}
