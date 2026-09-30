//! Updates from GitHub releases, per channel: checked every six hours, and
//! installed over the running binary on request. Homebrew installs are left
//! to Homebrew.

use std::path::{Path, PathBuf};
use std::sync::mpsc::{Receiver, RecvTimeoutError, Sender, channel};
use std::time::Duration;

use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};

pub const VERSION: &str = env!("CARGO_PKG_VERSION");
/// `desktop/Cargo.toml`'s version until a release build stamps the real one.
const UNSTAMPED: &str = "0.1.0";
// github.com's own pages, never api.github.com: the API allows an address 60
// anonymous requests an hour, shared with everything else behind it, and then
// answers 403. These are what a browser reads, and have no such budget.
/// Redirects to the newest stable release's page.
const LATEST: &str = "https://github.com/orochibraru/penombre/releases/latest";
/// The ten newest releases of any kind.
const FEED: &str = "https://github.com/orochibraru/penombre/releases.atom";
const PAGES: &str = "https://github.com/orochibraru/penombre/releases/tag";
const EVERY: Duration = Duration::from_secs(6 * 60 * 60);
const DOWNLOADS: &str = "https://github.com/orochibraru/penombre/releases/download";
/// Passed to the new binary, which then waits for this one to let go.
pub const RESTARTED: &str = "--updated";

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Channel {
    Stable,
    Canary,
}

impl Channel {
    /// The channel this build was released on.
    pub fn of(version: &str) -> Self {
        if version.contains('-') {
            Self::Canary
        } else {
            Self::Stable
        }
    }

    pub fn formula(self) -> &'static str {
        match self {
            Self::Stable => "penombre-sync",
            Self::Canary => "penombre-sync-canary",
        }
    }
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Release {
    pub version: String,
    pub url: String,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum Found {
    /// Built from source, or for a platform no release ships.
    Off,
    Checking,
    Current,
    Newer(Release),
    Failed(String),
}

const APPIMAGE: &str = "penombre-sync-x86_64.AppImage";

/// Set by the AppImage runtime: the binary then runs from a read-only mount,
/// so an update replaces the `.AppImage` file itself.
fn appimage() -> Option<PathBuf> {
    std::env::var_os("APPIMAGE").map(PathBuf::from)
}

fn asset() -> Option<&'static str> {
    if appimage().is_some() {
        return Some(APPIMAGE);
    }
    match (std::env::consts::OS, std::env::consts::ARCH) {
        ("macos", "aarch64") => Some("penombre-sync-aarch64-apple-darwin.tar.gz"),
        ("macos", "x86_64") => Some("penombre-sync-x86_64-apple-darwin.tar.gz"),
        ("linux", "x86_64") => Some("penombre-sync-x86_64-unknown-linux-gnu.tar.gz"),
        ("windows", "x86_64") => Some("penombre-sync-x86_64-pc-windows-msvc.zip"),
        _ => None,
    }
}

/// Checks now, then every six hours or whenever the channel changes.
pub fn watch(
    mut chosen: Channel,
    wake: impl Fn() + Send + 'static,
) -> (Sender<Channel>, Receiver<(Channel, Found)>) {
    let (channel_tx, channel_rx) = channel();
    let (found_tx, found_rx) = channel();
    std::thread::spawn(move || {
        loop {
            if found_tx.send((chosen, check(chosen))).is_err() {
                return;
            }
            wake();
            match channel_rx.recv_timeout(EVERY) {
                Ok(new) => chosen = new,
                Err(RecvTimeoutError::Timeout) => {}
                Err(RecvTimeoutError::Disconnected) => return,
            }
        }
    });
    (channel_tx, found_rx)
}

fn check(channel: Channel) -> Found {
    let Some(asset) = asset().filter(|_| VERSION != UNSTAMPED) else {
        return Found::Off;
    };
    let listed = match listed(channel) {
        Ok(listed) => listed,
        Err(error) => {
            log::warn!("update check failed: {error}");
            return Found::Failed(error);
        }
    };
    // A release counts once its build for this platform is attached; one
    // whose build failed is passed over for the next newest.
    newer(&listed, channel, VERSION)
        .into_iter()
        .find(|version| built(version, asset))
        .map_or(Found::Current, |version| {
            Found::Newer(Release {
                url: format!("{PAGES}/v{version}"),
                version,
            })
        })
}

fn client(redirects: reqwest::redirect::Policy) -> Result<reqwest::blocking::Client, String> {
    reqwest::blocking::Client::builder()
        .user_agent(concat!("penombre-sync/", env!("CARGO_PKG_VERSION")))
        .timeout(Duration::from_secs(15))
        .redirect(redirects)
        .build()
        .map_err(|e| e.to_string())
}

/// The text naming the releases a channel follows: the stable channel's is
/// where `LATEST` redirects, the canary's is the feed.
fn listed(channel: Channel) -> Result<String, String> {
    match channel {
        Channel::Stable => {
            let response = client(reqwest::redirect::Policy::none())?
                .get(LATEST)
                .send()
                .map_err(|e| e.to_string())?;
            response
                .headers()
                .get(reqwest::header::LOCATION)
                .and_then(|to| to.to_str().ok())
                .map(str::to_owned)
                .ok_or_else(|| format!("no release to follow ({})", response.status()))
        }
        Channel::Canary => client(reqwest::redirect::Policy::default())?
            .get(FEED)
            .send()
            .and_then(reqwest::blocking::Response::error_for_status)
            .and_then(reqwest::blocking::Response::text)
            .map_err(|e| e.to_string()),
    }
}

fn built(version: &str, asset: &str) -> bool {
    client(reqwest::redirect::Policy::default())
        .and_then(|client| {
            client
                .head(format!("{DOWNLOADS}/v{version}/{asset}"))
                .send()
                .map_err(|e| e.to_string())
        })
        .is_ok_and(|response| response.status().is_success())
}

/// Every version a release page or feed names, as `…/releases/tag/v<version>`.
fn versions_in(text: &str) -> Vec<String> {
    text.split("/releases/tag/v")
        .skip(1)
        .map(|rest| {
            rest.chars()
                .take_while(|c| c.is_ascii_alphanumeric() || matches!(c, '.' | '-'))
                .collect::<String>()
        })
        .filter(|version| rank(version).is_some())
        .collect()
}

/// The versions in `listed` above `current`, newest first. Canary follows
/// stable releases too: 1.9.0 is newer than 1.9.0-canary.4.
fn newer(listed: &str, channel: Channel, current: &str) -> Vec<String> {
    let mut versions = versions_in(listed);
    versions.retain(|v| {
        (channel == Channel::Canary || Channel::of(v) == Channel::Stable) && rank(v) > rank(current)
    });
    versions.sort_by_key(|v| std::cmp::Reverse(rank(v)));
    versions.dedup();
    versions
}

/// `X.Y.Z` or `X.Y.Z-canary.N`; a release outranks its canaries.
fn rank(version: &str) -> Option<(u64, u64, u64, u64)> {
    let (core, pre) = match version.split_once('-') {
        Some((core, pre)) => (core, Some(pre)),
        None => (version, None),
    };
    let mut parts = core.split('.').map(|n| n.parse().ok());
    let rank = (parts.next()??, parts.next()??, parts.next()??);
    if parts.next().is_some() {
        return None;
    }
    let pre = match pre {
        None => u64::MAX,
        Some(pre) => pre.strip_prefix("canary.")?.parse().ok()?,
    };
    Some((rank.0, rank.1, rank.2, pre))
}

/// Downloads `release`'s build, checks it against its published checksum
/// and puts it in place of this binary. Returns the path to relaunch.
pub fn install(release: &Release) -> Result<PathBuf, String> {
    if let Some(formula) = installed_formula() {
        let command = brew_command(formula, Channel::of(&release.version));
        return Err(format!("Installed by Homebrew: run {command}"));
    }
    let asset = asset().ok_or("No build is published for this system.")?;
    let url = format!("{DOWNLOADS}/v{}/{asset}", release.version);
    let client = reqwest::blocking::Client::builder()
        .user_agent(concat!("penombre-sync/", env!("CARGO_PKG_VERSION")))
        .timeout(Duration::from_secs(600))
        .build()
        .map_err(|e| e.to_string())?;
    let get = |url: &str| {
        client
            .get(url)
            .send()
            .and_then(reqwest::blocking::Response::error_for_status)
            .and_then(reqwest::blocking::Response::bytes)
            .map_err(|e| format!("Download failed: {e}"))
    };
    let archive = get(&url)?;
    let sums = get(&format!("{url}.sha256"))?;
    verify(&archive, &String::from_utf8_lossy(&sums))?;

    let appimage = appimage();
    let exe = match &appimage {
        Some(file) => file.clone(),
        None => std::env::current_exe()
            .and_then(|p| p.canonicalize())
            .map_err(|e| e.to_string())?,
    };
    let dir = exe.parent().ok_or("The app has no folder.")?;
    // Beside the binary, so the final rename stays on one filesystem.
    let stage = dir.join(format!(".penombre-sync-update-{}", std::process::id()));
    let staged = if appimage.is_some() {
        stage_file(&stage, asset, &archive)
    } else {
        unpack_into(&stage, asset, &archive)
    };
    let result = staged.and_then(|binary| replace(&binary, &exe));
    let _ = std::fs::remove_dir_all(&stage);
    result.map(|()| exe)
}

fn verify(archive: &[u8], sums: &str) -> Result<(), String> {
    let expected = sums
        .split_whitespace()
        .next()
        .ok_or("The checksum file is empty.")?;
    let actual: String = Sha256::digest(archive)
        .iter()
        .map(|b| format!("{b:02x}"))
        .collect();
    if actual.eq_ignore_ascii_case(expected) {
        Ok(())
    } else {
        Err("The download does not match its checksum.".into())
    }
}

fn stage_file(stage: &Path, asset: &str, bytes: &[u8]) -> Result<PathBuf, String> {
    let cannot = |e: std::io::Error| format!("Cannot write to {}: {e}", stage.display());
    std::fs::create_dir_all(stage).map_err(cannot)?;
    let file = stage.join(asset);
    std::fs::write(&file, bytes).map_err(cannot)?;
    Ok(file)
}

/// `tar` reads both archives: Windows ships bsdtar since 10.
fn unpack_into(stage: &Path, asset: &str, archive: &[u8]) -> Result<PathBuf, String> {
    let file = stage_file(stage, asset, archive)?;
    let status = std::process::Command::new("tar")
        .arg("-xf")
        .arg(&file)
        .arg("-C")
        .arg(stage)
        .status()
        .map_err(|e| format!("Cannot run tar: {e}"))?;
    if !status.success() {
        return Err(format!("Could not unpack the download ({status})."));
    }
    let binary = stage.join(if cfg!(windows) {
        "penombre-sync.exe"
    } else {
        "penombre-sync"
    });
    binary
        .exists()
        .then_some(binary)
        .ok_or_else(|| "The download holds no penombre-sync.".into())
}

/// A rename, so the path always holds a whole binary. Windows cannot replace
/// a running `.exe`, only move it aside.
fn replace(new: &Path, exe: &Path) -> Result<(), String> {
    let failed = |e: std::io::Error| format!("Cannot replace {}: {e}", exe.display());
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        std::fs::set_permissions(new, std::fs::Permissions::from_mode(0o755)).map_err(failed)?;
    }
    if cfg!(windows) {
        let old = exe.with_extension("old");
        let _ = std::fs::remove_file(&old);
        std::fs::rename(exe, &old).map_err(failed)?;
        if let Err(error) = std::fs::rename(new, exe) {
            let _ = std::fs::rename(&old, exe);
            return Err(failed(error));
        }
        return Ok(());
    }
    std::fs::rename(new, exe).map_err(failed)
}

/// Starts the installed binary; this one must quit so it can take the lock.
pub fn relaunch(exe: &Path) -> Result<(), String> {
    std::process::Command::new(exe)
        .arg(RESTARTED)
        .spawn()
        .map(drop)
        .map_err(|e| format!("Installed, but could not restart: {e}"))
}

/// The formula that installed this binary, when Homebrew did.
pub fn installed_formula() -> Option<&'static str> {
    let exe = std::env::current_exe().ok()?.canonicalize().ok()?;
    let path = exe.to_string_lossy().replace('\\', "/");
    [Channel::Stable, Channel::Canary]
        .map(Channel::formula)
        .into_iter()
        .find(|f| path.contains(&format!("/Cellar/{f}/")))
}

/// What to run to get `channel`'s latest under Homebrew.
pub fn brew_command(installed: &str, channel: Channel) -> String {
    let wanted = channel.formula();
    if installed == wanted {
        format!("brew upgrade {wanted}")
    } else {
        format!("brew uninstall {installed} && brew install orochibraru/tap/{wanted}")
    }
}

#[cfg(test)]
mod tests {
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
}
