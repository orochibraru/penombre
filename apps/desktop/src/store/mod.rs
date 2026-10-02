mod config;
mod keyring;

use std::path::PathBuf;

pub use config::{Config, Pair, conflict, normalize_server, pair_key};
pub use keyring::{delete_key, init_keyring, read_key, write_key};

#[derive(Clone)]
pub struct Dirs {
    pub config: PathBuf,
    pub data: PathBuf,
}

impl Dirs {
    pub fn new() -> Option<Self> {
        let dirs = directories::ProjectDirs::from("dev", "Penombre", "Penombre Sync")?;
        Some(Self {
            config: dirs.config_dir().to_path_buf(),
            data: dirs.data_dir().to_path_buf(),
        })
    }

    fn config_file(&self) -> PathBuf {
        self.config.join("config.json")
    }

    pub fn rclone_conf(&self) -> PathBuf {
        self.config.join("rclone.conf")
    }

    pub fn workdir(&self) -> PathBuf {
        self.data.join("bisync")
    }

    pub fn log_file(&self) -> PathBuf {
        self.data.join("penombre-sync.log")
    }
}
