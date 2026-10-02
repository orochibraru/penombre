use std::path::Path;

use super::macos::in_app_bundle;

#[test]
fn only_the_binary_of_an_app_bundle_counts_as_bundled() {
    assert!(in_app_bundle(Path::new(
        "/Applications/Penombre Sync.app/Contents/MacOS/penombre-sync"
    )));
    for bare in [
        "/opt/homebrew/bin/penombre-sync",
        "/Users/me/Dev/penombre/apps/desktop/target/debug/penombre-sync",
        "/tmp/Penombre Sync.app/penombre-sync",
        "/tmp/Contents/MacOS/penombre-sync",
        "/tmp/Penombre.app/Contents/Resources/penombre-sync",
    ] {
        assert!(!in_app_bundle(Path::new(bare)), "{bare}");
    }
}
