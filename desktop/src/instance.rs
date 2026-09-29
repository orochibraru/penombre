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
    std::fs::create_dir_all(dir)?;
    let mut file = OpenOptions::new()
        .read(true)
        .write(true)
        .create(true)
        .truncate(false)
        .open(dir.join("instance.lock"))?;
    match file.try_lock() {
        Ok(()) => {}
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
mod tests {
    use super::*;

    #[test]
    fn a_second_claim_knocks_on_the_first() {
        let dir = std::env::temp_dir().join(format!("penombre-instance-{}", std::process::id()));
        let Ok(Claim::First(first)) = claim(&dir) else {
            panic!("the first claim should win");
        };
        assert!(matches!(claim(&dir), Ok(Claim::Second)));
        first.listener.set_nonblocking(true).unwrap();
        let knocked = (0..100).any(|_| {
            std::thread::sleep(Duration::from_millis(10));
            first.listener.accept().is_ok()
        });
        assert!(knocked, "the second one knocked");
        drop(first);
        assert!(matches!(claim(&dir), Ok(Claim::First(_))));
        let _ = std::fs::remove_dir_all(&dir);
    }
}
