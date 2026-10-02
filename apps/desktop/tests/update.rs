use super::*;

#[test]
fn a_release_outranks_its_canaries_and_numbers_compare_as_numbers() {
    assert!(rank("1.9.0") > rank("1.9.0-canary.4"));
    assert!(rank("1.9.0-canary.10") > rank("1.9.0-canary.9"));
    assert!(rank("1.10.0") > rank("1.9.9"));
    assert!(rank("1.9.1-canary.1") > rank("1.9.0"));
    assert_eq!(rank("1.9"), None);
    assert_eq!(rank("1.9.0-beta.1"), None);
}

#[test]
fn each_channel_lists_what_is_newer_newest_first() {
    // As the feed has them: an entry names its tag twice, id and link.
    let feed = r#"<id>tag:github.com,2008:Repository/1/v1.9.1-canary.2</id>
        <link href="https://github.com/o/p/releases/tag/v1.9.1-canary.2"/>
        <link href="https://github.com/o/p/releases/tag/v1.9.0"/>
        <link href="https://github.com/o/p/releases/tag/v1.9.1-canary.1"/>
        <link href="https://github.com/o/p/releases/tag/v1.9.0-canary.3"/>
        <link href="https://github.com/o/p/releases/tag/vnext"/>"#;
    assert_eq!(
        newer(feed, Channel::Canary, "1.9.0-canary.3"),
        ["1.9.1-canary.2", "1.9.1-canary.1", "1.9.0"]
    );
    assert_eq!(newer(feed, Channel::Stable, "1.8.0"), ["1.9.0"]);
    assert!(newer(feed, Channel::Canary, "1.9.1-canary.2").is_empty());
    assert_eq!(Channel::of("1.9.1-canary.1"), Channel::Canary);
    assert_eq!(Channel::of("1.9.0"), Channel::Stable);
}

#[test]
fn the_stable_channel_reads_where_latest_redirects() {
    let location = "https://github.com/orochibraru/penombre/releases/tag/v1.8.59";
    assert_eq!(newer(location, Channel::Stable, "1.8.58"), ["1.8.59"]);
    assert!(newer(location, Channel::Stable, "1.8.59").is_empty());
}

#[test]
fn a_download_must_match_its_checksum() {
    // sha256("abc")
    let sum = "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad";
    assert!(verify(b"abc", &format!("{sum}  penombre-sync.tar.gz\n")).is_ok());
    assert!(verify(b"xyz", sum).is_err());
    assert!(verify(b"abc", "").is_err());
}

#[test]
fn replacing_leaves_the_new_binary_at_the_old_path() {
    let dir = std::env::temp_dir().join(format!("penombre-replace-{}", std::process::id()));
    std::fs::create_dir_all(&dir).unwrap();
    let (new, exe) = (dir.join("new"), dir.join("penombre-sync"));
    std::fs::write(&new, "new").unwrap();
    std::fs::write(&exe, "old").unwrap();
    replace(&new, &exe).unwrap();
    assert_eq!(std::fs::read_to_string(&exe).unwrap(), "new");
    assert!(!new.exists());
    let _ = std::fs::remove_dir_all(&dir);
}

#[cfg(unix)]
#[test]
fn a_release_archive_unpacks_over_the_binary() {
    let dir = std::env::temp_dir().join(format!("penombre-unpack-{}", std::process::id()));
    let built = dir.join("built");
    std::fs::create_dir_all(&built).unwrap();
    std::fs::write(built.join("penombre-sync"), "v2").unwrap();
    std::fs::write(built.join("LICENSE"), "MIT").unwrap();
    let archive = dir.join("a.tar.gz");
    // The shape desktop.yaml packages.
    let packed = std::process::Command::new("tar")
        .arg("-czf")
        .arg(&archive)
        .arg("-C")
        .arg(&built)
        .args(["penombre-sync", "LICENSE"])
        .status()
        .unwrap();
    assert!(packed.success());
    let exe = dir.join("installed");
    std::fs::write(&exe, "v1").unwrap();

    let stage = dir.join("stage");
    let binary = unpack_into(&stage, "a.tar.gz", &std::fs::read(&archive).unwrap()).unwrap();
    replace(&binary, &exe).unwrap();

    assert_eq!(std::fs::read_to_string(&exe).unwrap(), "v2");
    use std::os::unix::fs::PermissionsExt;
    assert_eq!(
        std::fs::metadata(&exe).unwrap().permissions().mode() & 0o111,
        0o111
    );
    let _ = std::fs::remove_dir_all(&dir);
}

#[test]
fn switching_formula_under_homebrew_reinstalls() {
    assert_eq!(
        brew_command("penombre-sync", Channel::Stable),
        "brew upgrade penombre-sync"
    );
    assert_eq!(
        brew_command("penombre-sync", Channel::Canary),
        "brew uninstall penombre-sync && brew install orochibraru/tap/penombre-sync-canary"
    );
}
