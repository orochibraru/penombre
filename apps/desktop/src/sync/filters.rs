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
#[path = "../../tests/sync/filters.rs"]
mod tests;
