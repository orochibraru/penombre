//! Start at login, read from the system every time rather than remembered:
//! a LaunchAgent on macOS, an XDG autostart entry on Linux, the HKCU Run key
//! on Windows. A Homebrew service already does the job, and a second launcher
//! beside it would start the app twice.

use std::path::{Path, PathBuf};

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Login {
    Off,
    On,
    /// `brew services` starts it; this is the command that stops that.
    Homebrew(&'static str),
    Unsupported,
}

const LABEL: &str = "dev.penombre.sync";
const BREW_STOP: &str = "brew services stop penombre-sync";

pub fn state() -> Login {
    let Some(home) = home() else {
        return Login::Unsupported;
    };
    state_in(&home)
}

pub fn set(on: bool) -> Result<(), String> {
    let home = home().ok_or("No home directory.")?;
    if matches!(state_in(&home), Login::Homebrew(_) | Login::Unsupported) {
        return Err("Start at login is managed elsewhere.".into());
    }
    let exe = std::env::current_exe().map_err(|e| e.to_string())?;
    set_in(&home, &exe, on).map_err(|e| format!("Could not change start at login: {e}"))
}

fn home() -> Option<PathBuf> {
    directories::BaseDirs::new().map(|d| d.home_dir().to_path_buf())
}

fn brew_service(home: &Path) -> PathBuf {
    if cfg!(target_os = "macos") {
        home.join("Library/LaunchAgents/homebrew.mxcl.penombre-sync.plist")
    } else {
        home.join(".config/systemd/user/homebrew.penombre-sync.service")
    }
}

fn launcher(home: &Path) -> Option<PathBuf> {
    if cfg!(target_os = "macos") {
        Some(home.join(format!("Library/LaunchAgents/{LABEL}.plist")))
    } else if cfg!(target_os = "linux") {
        Some(home.join(".config/autostart/penombre-sync.desktop"))
    } else {
        None
    }
}

fn state_in(home: &Path) -> Login {
    if brew_service(home).exists() {
        return Login::Homebrew(BREW_STOP);
    }
    match launcher(home) {
        Some(path) if path.exists() => Login::On,
        Some(_) => Login::Off,
        None if cfg!(windows) => windows::state(),
        None => Login::Unsupported,
    }
}

fn set_in(home: &Path, exe: &Path, on: bool) -> std::io::Result<()> {
    let Some(path) = launcher(home) else {
        return windows::set(exe, on);
    };
    if !on {
        return match std::fs::remove_file(&path) {
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(()),
            other => other,
        };
    }
    if let Some(dir) = path.parent() {
        std::fs::create_dir_all(dir)?;
    }
    let content = if cfg!(target_os = "macos") {
        plist(exe)
    } else {
        desktop_entry(exe)
    };
    std::fs::write(path, content)
}

fn plist(exe: &Path) -> String {
    let exe = xml_escape(&exe.to_string_lossy());
    format!(
        r#"<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>Label</key>
	<string>{LABEL}</string>
	<key>ProgramArguments</key>
	<array>
		<string>{exe}</string>
	</array>
	<key>RunAtLoad</key>
	<true/>
	<key>KeepAlive</key>
	<false/>
	<key>ProcessType</key>
	<string>Interactive</string>
</dict>
</plist>
"#
    )
}

fn desktop_entry(exe: &Path) -> String {
    // The Exec field quotes with double quotes and escapes `"`, `` ` ``, `$` and `\`.
    let exe: String = exe
        .to_string_lossy()
        .chars()
        .flat_map(|c| {
            let escape = matches!(c, '"' | '`' | '$' | '\\');
            escape.then_some('\\').into_iter().chain([c])
        })
        .collect();
    format!(
        "[Desktop Entry]\nType=Application\nName=Penombre Sync\nExec=\"{exe}\"\nX-GNOME-Autostart-enabled=true\n"
    )
}

fn xml_escape(text: &str) -> String {
    text.replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
}

mod windows {
    use std::path::Path;
    use std::process::Command;

    use super::Login;

    const KEY: &str = r"HKCU\Software\Microsoft\Windows\CurrentVersion\Run";
    const VALUE: &str = "Penombre Sync";

    pub fn state() -> Login {
        let found = Command::new("reg")
            .args(["query", KEY, "/v", VALUE])
            .output()
            .is_ok_and(|out| out.status.success());
        if found { Login::On } else { Login::Off }
    }

    pub fn set(exe: &Path, on: bool) -> std::io::Result<()> {
        let quoted = format!("\"{}\"", exe.display());
        let args: Vec<&str> = if on {
            vec!["add", KEY, "/v", VALUE, "/t", "REG_SZ", "/d", &quoted, "/f"]
        } else {
            vec!["delete", KEY, "/v", VALUE, "/f"]
        };
        let status = Command::new("reg").args(args).status()?;
        if status.success() || !on {
            Ok(())
        } else {
            Err(std::io::Error::other(format!("reg.exe failed: {status}")))
        }
    }
}

#[cfg(test)]
mod tests {
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
        let brew = brew_service(&home);
        std::fs::create_dir_all(brew.parent().unwrap()).unwrap();
        std::fs::write(&brew, "").unwrap();
        assert_eq!(state_in(&home), Login::Homebrew(BREW_STOP));
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
}
