use std::collections::BTreeSet;
use std::path::PathBuf;

use serde::{Deserialize, Serialize};

use super::Dirs;
use crate::update::{self, Channel};

/// One local folder kept in sync with one place on the server.
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct Pair {
    pub local: PathBuf,
    /// Under `/dav/`: `me`, `me/Documents`, `volumes/music/Reaper`.
    pub remote: String,
    /// Where it lands, for people: `My drive / Documents`.
    pub label: String,
    /// What the user keeps out of it: `*.bak`, `node_modules/`, `/Renders/`.
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub ignored: Vec<String>,
}

#[derive(Default, Serialize, Deserialize)]
#[serde(default)]
pub struct Config {
    pub server: String,
    /// Before several folders: the one folder, mirroring the whole drive.
    #[serde(skip_serializing)]
    pub folder: Option<PathBuf>,
    /// None until the list is first edited, so an old config keeps its folder.
    pub pairs: Option<Vec<Pair>>,
    /// `pair_key`s whose first `--resync` succeeded.
    pub resynced: BTreeSet<String>,
    pub paused: bool,
    /// What the server calls this app's API key.
    pub key_name: Option<String>,
    /// None follows the channel this build came from.
    pub channel: Option<Channel>,
    /// The newest version a notification already announced.
    pub announced: Option<String>,
}

impl Config {
    pub fn load(dirs: &Dirs) -> Self {
        std::fs::read(dirs.config_file())
            .ok()
            .and_then(|bytes| serde_json::from_slice(&bytes).ok())
            .unwrap_or_default()
    }

    pub fn save(&self, dirs: &Dirs) {
        let result = std::fs::create_dir_all(&dirs.config).and_then(|()| {
            let json = serde_json::to_vec_pretty(self).map_err(std::io::Error::other)?;
            std::fs::write(dirs.config_file(), json)
        });
        if let Err(error) = result {
            log::error!("could not save the config: {error}");
        }
    }

    pub fn channel(&self) -> Channel {
        self.channel.unwrap_or_else(|| Channel::of(update::VERSION))
    }

    pub fn pairs(&self) -> Vec<Pair> {
        self.pairs.clone().unwrap_or_else(|| {
            vec![Pair {
                local: self.folder.clone().unwrap_or_else(default_folder),
                remote: "me".into(),
                label: "My drive".into(),
                ignored: Vec::new(),
            }]
        })
    }
}

fn default_folder() -> PathBuf {
    directories::UserDirs::new()
        .map(|dirs| dirs.home_dir().to_path_buf())
        .unwrap_or_default()
        .join("Penombre")
}

/// Why `pair` cannot join `pairs`: one folder has one place, one place one folder.
pub fn conflict(pairs: &[Pair], pair: &Pair) -> Option<&'static str> {
    if pairs.iter().any(|p| p.local == pair.local) {
        Some("This folder already syncs.")
    } else if pairs.iter().any(|p| p.remote == pair.remote) {
        Some("Another folder already syncs there.")
    } else {
        None
    }
}

/// What a bisync state belongs to. A new server, place or exclusion needs its
/// own `--resync`: bisync refuses a changed filter without one.
pub fn pair_key(server: &str, pair: &Pair, filters: &[String]) -> String {
    format!(
        "{server}|{}|{}|{}",
        pair.local.display(),
        pair.remote,
        filters.join(",")
    )
}

/// `files.example.com/` → `https://files.example.com`.
pub fn normalize_server(input: &str) -> String {
    let trimmed = input.trim().trim_end_matches('/');
    if trimmed.is_empty() || trimmed.contains("://") {
        trimmed.to_owned()
    } else {
        format!("https://{trimmed}")
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn an_old_config_keeps_its_folder_as_the_drive_mirror() {
        let old: Config =
            serde_json::from_str(r#"{"server":"s","folder":"/x/Sync","resynced":[]}"#).unwrap();
        assert_eq!(
            old.pairs(),
            vec![Pair {
                local: "/x/Sync".into(),
                remote: "me".into(),
                label: "My drive".into(),
                ignored: Vec::new(),
            }]
        );
        let emptied = Config {
            pairs: Some(vec![]),
            ..Config::default()
        };
        assert!(emptied.pairs().is_empty());
    }

    #[test]
    fn a_folder_or_a_place_is_used_once() {
        let pair = |l: &str, r: &str| Pair {
            local: l.into(),
            remote: r.into(),
            label: String::new(),
            ignored: Vec::new(),
        };
        let pairs = [pair("/h/Penombre", "me")];
        assert!(conflict(&pairs, &pair("/h/Penombre", "me/X")).is_some());
        assert!(conflict(&pairs, &pair("/h/Docs", "me")).is_some());
        assert!(conflict(&pairs, &pair("/h/Docs", "me/Docs")).is_none());
    }

    #[test]
    fn server_urls_are_normalized() {
        assert_eq!(
            normalize_server(" files.example.com/ "),
            "https://files.example.com"
        );
        assert_eq!(
            normalize_server("http://localhost:5173/"),
            "http://localhost:5173"
        );
        assert_eq!(normalize_server(""), "");
    }
}
