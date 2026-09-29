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
];

/// Every filter line a pair syncs with, which is also what its resync key hashes.
pub fn lines(excludes: &[String]) -> Vec<String> {
    JUNK.iter()
        .map(|line| (*line).to_owned())
        .chain(excludes.iter().cloned())
        .collect()
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
        assert!(!all.iter().any(|l| l.contains(".tmp")));
    }
}
