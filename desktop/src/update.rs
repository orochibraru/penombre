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
const RELEASES: &str = "https://api.github.com/repos/orochibraru/penombre/releases?per_page=30";
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

#[derive(Deserialize)]
struct GitHubRelease {
    tag_name: String,
    html_url: String,
    draft: bool,
    prerelease: bool,
    assets: Vec<Asset>,
}

#[derive(Deserialize)]
struct Asset {
    name: String,
}

fn asset() -> Option<&'static str> {
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
    match fetch() {
        Ok(releases) => newest(&releases, channel, asset)
            .filter(|r| rank(&r.version) > rank(VERSION))
            .map_or(Found::Current, Found::Newer),
        Err(error) => {
            log::warn!("update check failed: {error}");
            Found::Failed(error)
        }
    }
}

fn fetch() -> Result<Vec<GitHubRelease>, String> {
    reqwest::blocking::Client::new()
        .get(RELEASES)
        .header(
            reqwest::header::USER_AGENT,
            concat!("penombre-sync/", env!("CARGO_PKG_VERSION")),
        )
        .header(reqwest::header::ACCEPT, "application/vnd.github+json")
        .timeout(Duration::from_secs(15))
        .send()
        .and_then(reqwest::blocking::Response::error_for_status)
        .and_then(reqwest::blocking::Response::json)
        .map_err(|e| e.to_string())
}

/// Canary follows stable releases too: 1.9.0 is newer than 1.9.0-canary.4.
/// A release counts once its desktop builds are attached, minutes after it.
fn newest(releases: &[GitHubRelease], channel: Channel, asset: &str) -> Option<Release> {
    releases
        .iter()
        .filter(|r| !r.draft && (channel == Channel::Canary || !r.prerelease))
        .filter(|r| r.assets.iter().any(|a| a.name == asset))
        .filter_map(|r| {
            let version = r.tag_name.strip_prefix('v')?;
            rank(version)?;
            Some(Release {
                version: version.to_owned(),
                url: r.html_url.clone(),
            })
        })
        .max_by_key(|r| rank(&r.version))
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

    let exe = std::env::current_exe()
        .and_then(|p| p.canonicalize())
        .map_err(|e| e.to_string())?;
    let dir = exe.parent().ok_or("The app has no folder.")?;
    // Beside the binary, so the final rename stays on one filesystem.
    let stage = dir.join(format!(".penombre-sync-update-{}", std::process::id()));
    let result = unpack_into(&stage, asset, &archive).and_then(|binary| replace(&binary, &exe));
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

/// `tar` reads both archives: Windows ships bsdtar since 10.
fn unpack_into(stage: &Path, asset: &str, archive: &[u8]) -> Result<PathBuf, String> {
    let cannot = |e: std::io::Error| format!("Cannot write to {}: {e}", stage.display());
    std::fs::create_dir_all(stage).map_err(cannot)?;
    let file = stage.join(asset);
    std::fs::write(&file, archive).map_err(cannot)?;
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

    fn release(tag: &str, prerelease: bool, built: bool) -> GitHubRelease {
        GitHubRelease {
            tag_name: tag.into(),
            html_url: format!("https://example.com/{tag}"),
            draft: false,
            prerelease,
            assets: built
                .then(|| Asset {
                    name: "a.tar.gz".into(),
                })
                .into_iter()
                .collect(),
        }
    }

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
    fn each_channel_picks_its_newest_built_release() {
        let releases = [
            release("v1.9.1-canary.2", true, false),
            release("v1.9.1-canary.1", true, true),
            release("v1.9.0", false, true),
            release("v1.9.0-canary.3", true, true),
        ];
        let version = |c| newest(&releases, c, "a.tar.gz").map(|r| r.version);
        assert_eq!(version(Channel::Stable).as_deref(), Some("1.9.0"));
        assert_eq!(
            version(Channel::Canary).as_deref(),
            Some("1.9.1-canary.1"),
            "canary.2 has no desktop build yet"
        );
        assert_eq!(Channel::of("1.9.1-canary.1"), Channel::Canary);
        assert_eq!(Channel::of("1.9.0"), Channel::Stable);
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
