//! One app per user: two would bisync the same folders at once. The first
//! holds an exclusive lock on a file naming a loopback port; a second launch
//! connects to it, which shows the first one's window, and exits.

use std::fs::{File, OpenOptions, TryLockError};
use std::io::{Read, Seek, Write};
use std::net::{Ipv4Addr, TcpListener, TcpStream};
use std::path::Path;
use std::time::Duration;

pub struct Instance {
    _lock: File,
    pub listener: TcpListener,
}

pub enum Claim {
    First(Instance),
    /// Another instance runs; it was asked to show itself.
    Second,
}

pub fn claim(dir: &Path) -> std::io::Result<Claim> {
    claim_with(dir, true)
}

/// After an update the old instance is still quitting: wait for its lock
/// rather than knocking on it and exiting.
pub fn claim_when_free(dir: &Path, within: Duration) -> std::io::Result<Claim> {
    let deadline = std::time::Instant::now() + within;
    while std::time::Instant::now() < deadline {
        if let Claim::First(instance) = claim_with(dir, false)? {
            return Ok(Claim::First(instance));
        }
        std::thread::sleep(Duration::from_millis(100));
    }
    claim(dir)
}

fn claim_with(dir: &Path, knock: bool) -> std::io::Result<Claim> {
    std::fs::create_dir_all(dir)?;
    let mut file = OpenOptions::new()
        .read(true)
        .write(true)
        .create(true)
        .truncate(false)
        .open(dir.join("instance.lock"))?;
    match file.try_lock() {
        Ok(()) => {}
        Err(TryLockError::WouldBlock) if !knock => return Ok(Claim::Second),
        Err(TryLockError::WouldBlock) => {
            let mut port = String::new();
            file.read_to_string(&mut port)?;
            if let Ok(port) = port.trim().parse::<u16>() {
                let address = (Ipv4Addr::LOCALHOST, port).into();
                let _ = TcpStream::connect_timeout(&address, Duration::from_secs(1));
            }
            return Ok(Claim::Second);
        }
        Err(TryLockError::Error(error)) => return Err(error),
    }
    let listener = TcpListener::bind((Ipv4Addr::LOCALHOST, 0))?;
    file.set_len(0)?;
    file.rewind()?;
    write!(file, "{}", listener.local_addr()?.port())?;
    file.flush()?;
    Ok(Claim::First(Instance {
        _lock: file,
        listener,
    }))
}

#[cfg(test)]
#[path = "../tests/instance.rs"]
mod tests;
