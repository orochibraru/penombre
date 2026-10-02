use super::*;

#[cfg(any(target_os = "macos", target_os = "linux"))]
#[test]
fn toggling_writes_and_removes_one_launcher_and_yields_to_homebrew() {
    let home = std::env::temp_dir().join(format!("penombre-login-{}", std::process::id()));
    let exe = Path::new("/opt/homebrew/bin/penombre-sync");
    assert_eq!(state_in(&home), Login::Off);
    set_in(&home, exe, true).unwrap();
    assert_eq!(state_in(&home), Login::On);
    let written = std::fs::read_to_string(launcher(&home).unwrap()).unwrap();
    assert!(written.contains("/opt/homebrew/bin/penombre-sync"));
    set_in(&home, exe, false).unwrap();
    set_in(&home, exe, false).unwrap();
    assert_eq!(state_in(&home), Login::Off);
    // Both names Homebrew has written, each on its own.
    for brew in brew_services(&home, BREW[1].0) {
        std::fs::create_dir_all(brew.parent().unwrap()).unwrap();
        std::fs::write(&brew, "").unwrap();
        assert_eq!(
            state_in(&home),
            Login::Homebrew(BREW[1].1),
            "{}",
            brew.display()
        );
        std::fs::remove_file(&brew).unwrap();
    }
    let _ = std::fs::remove_dir_all(&home);
}

#[test]
fn launchers_quote_the_path() {
    let exe = Path::new("/Apps/A & B/penombre-sync");
    assert!(plist(exe).contains("<string>/Apps/A &amp; B/penombre-sync</string>"));
    assert!(plist(exe).contains("<key>RunAtLoad</key>\n\t<true/>"));
    assert!(plist(exe).contains("<key>KeepAlive</key>\n\t<false/>"));
    assert!(desktop_entry(Path::new("/a/$x")).contains("Exec=\"/a/\\$x\""));
}
