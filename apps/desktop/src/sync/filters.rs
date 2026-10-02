use crate::store::Pair;

/// OS and editor litter, and rclone's own interrupted downloads: never synced.
/// `Icon\r` appears as `Icon␍`, rclone's encoding of the carriage return.
pub const JUNK: &[&str] = &[
    "- .DS_Store",
    "- ._*",
    "- .Spotlight-V100/**",
    "- .Trashes/**",
    "- .fseventsd/**",
    "- .TemporaryItems/**",
    "- .DocumentRevisions-V100/**",
    "- Icon\u{240d}",
    "- Thumbs.db",
    "- ehthumbs.db",
    "- desktop.ini",
    "- $RECYCLE.BIN/**",
    "- ~$*",
    "- .~lock.*#",
    "- *.????????.partial",
    // A Penombre instance's internals, in a folder Syncthing mirrored off one.
    "- .versions/**",
    "- .thumbnails/**",
    "- .tmp/**",
];

/// Every filter line a pair syncs with, which is also what its resync key hashes.
pub fn lines(excludes: &[String]) -> Vec<String> {
    JUNK.iter()
        .map(|line| (*line).to_owned())
        .chain(excludes.iter().cloned())
        .collect()
}

/// A user's exclusion as an rclone rule: `dir/` is a folder anywhere, a
/// leading `/` anchors to the synced folder. None for what rclone would read
/// as a comment, a rule of its own, or `!`, which clears every rule.
pub fn rule(pattern: &str) -> Option<String> {
    let pattern = pattern.trim();
    let refused = pattern.is_empty()
        || pattern == "!"
        || pattern.starts_with(['#', ';'])
        || pattern.starts_with("+ ")
        || pattern.starts_with("- ");
    if refused {
        None
    } else if pattern.ends_with('/') {
        Some(format!("- {pattern}**"))
    } else {
        Some(format!("- {pattern}"))
    }
}

/// Another pair inside this one, on either side, is left to that pair: the
/// drive mirror must not download `Documents` a second time.
pub fn excludes(pairs: &[Pair], index: usize) -> Vec<String> {
    let this = &pairs[index];
    let mut lines: Vec<String> = pairs
        .iter()
        .enumerate()
        .filter(|(other, _)| *other != index)
        .filter_map(|(_, pair)| {
            let remote = pair
                .remote
                .strip_prefix(&format!("{}/", this.remote))
                .map(str::to_owned);
            let local = pair
                .local
                .strip_prefix(&this.local)
                .ok()
                .filter(|rest| !rest.as_os_str().is_empty())
                .map(|rest| rest.to_string_lossy().replace('\\', "/"));
            remote.or(local)
        })
        .map(|rest| format!("- /{rest}/**"))
        .chain(this.ignored.iter().filter_map(|pattern| rule(pattern)))
        .collect();
    lines.sort();
    lines.dedup();
    lines
}

#[cfg(test)]
mod tests {
    use super::*;

    fn pair(local: &str, remote: &str) -> Pair {
        Pair {
            local: local.into(),
            remote: remote.into(),
            label: String::new(),
            ignored: Vec::new(),
        }
    }

    #[test]
    fn the_drive_mirror_leaves_nested_pairs_to_themselves() {
        let pairs = [
            pair("/h/Penombre", "me"),
            pair("/h/Documents", "me/Documents"),
            pair("/h/Penombre/Music", "volumes/music"),
            pair("/h/Reaper", "volumes/music/Reaper"),
        ];
        assert_eq!(excludes(&pairs, 0), vec!["- /Documents/**", "- /Music/**"]);
        assert!(excludes(&pairs, 1).is_empty());
        assert_eq!(excludes(&pairs, 2), vec!["- /Reaper/**"]);
        assert!(excludes(&pairs, 3).is_empty());
        // `me/Docs` is not inside `me/Documents`.
        assert!(excludes(&[pair("/a", "me/Documents"), pair("/b", "me/Docs")], 0).is_empty());
    }

    #[test]
    fn every_pair_filters_junk_and_its_nested_pairs() {
        let all = lines(&["- /Documents/**".to_owned()]);
        for line in [
            "- .DS_Store",
            "- ._*",
            "- $RECYCLE.BIN/**",
            "- /Documents/**",
        ] {
            assert!(all.iter().any(|l| l == line), "{line}");
        }
        assert!(all.iter().any(|l| l == "- Icon\u{240d}"));
        // Office's safe save goes through `*.tmp` files; only the folder goes.
        assert!(!all.iter().any(|l| l.contains("*.tmp")));
        assert!(all.iter().any(|l| l == "- .versions/**"));
    }

    #[test]
    fn a_pattern_becomes_one_rclone_rule() {
        assert_eq!(rule("*.bak").as_deref(), Some("- *.bak"));
        assert_eq!(
            rule(" node_modules/ ").as_deref(),
            Some("- node_modules/**")
        );
        assert_eq!(rule("/Renders/").as_deref(), Some("- /Renders/**"));
        assert_eq!(rule("/Mix/final.wav").as_deref(), Some("- /Mix/final.wav"));
        // Blank, or read by rclone as a comment or a rule of its own.
        for bad in ["", "  ", "# x", "; x", "+ x", "- x", "!"] {
            assert_eq!(rule(bad), None, "{bad:?}");
        }
    }

    #[test]
    fn a_pairs_own_exclusions_join_its_filters() {
        let mut music = pair("/h/Music", "me/Music");
        music.ignored = vec!["*.reapeaks".into(), "/Renders/".into(), "# x".into()];
        assert_eq!(excludes(&[music], 0), vec!["- *.reapeaks", "- /Renders/**"]);
    }
}
