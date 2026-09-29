use std::sync::Arc;
use std::sync::atomic::AtomicBool;
use std::sync::mpsc::channel;

use super::{AddState, App, Excluding, GRACE, SignIn};
use crate::auth::{self, AuthEvent};
use crate::places;
use crate::store::{self, Pair};
use crate::sync::{self, Cmd};
use crate::update::{self, Channel, Found};

impl App {
    pub(super) fn set_pairs(&mut self, pairs: Vec<Pair>) {
        self.config.pairs = Some(pairs);
        self.config.save(&self.dirs);
        self.checks = None;
        self.push_target();
    }

    pub(super) fn remove_pair(&mut self, index: usize) {
        self.excluding = None;
        let mut pairs = self.config.pairs();
        if index < pairs.len() {
            pairs.remove(index);
            self.set_pairs(pairs);
        }
    }

    pub(super) fn start_adding(&mut self) {
        let (Some(key), Some(local)) = (self.key.clone(), rfd::FileDialog::new().pick_folder())
        else {
            return;
        };
        let (tx, reply) = channel();
        let (server, wake) = (self.config.server.clone(), self.waker.clone());
        std::thread::spawn(move || {
            let _ = tx.send(places::fetch(&server, &key));
            wake.wake();
        });
        self.adding = Some(AddState {
            subfolder: local
                .file_name()
                .map(|name| name.to_string_lossy().into_owned())
                .unwrap_or_default(),
            local,
            places: None,
            reply,
            choice: 0,
            error: None,
        });
    }

    pub(super) fn confirm_adding(&mut self) {
        let Some(add) = &mut self.adding else {
            return;
        };
        let Some(Ok(places)) = &add.places else {
            return;
        };
        let Some(place) = places.get(add.choice) else {
            return;
        };
        let sub = add.subfolder.trim().trim_matches('/');
        let pair = if sub.is_empty() {
            Pair {
                local: add.local.clone(),
                remote: place.path.clone(),
                label: place.name.clone(),
                ignored: Vec::new(),
            }
        } else {
            Pair {
                local: add.local.clone(),
                remote: format!("{}/{sub}", place.path),
                label: format!("{} / {sub}", place.name),
                ignored: Vec::new(),
            }
        };
        let mut pairs = self.config.pairs();
        if let Some(error) = store::conflict(&pairs, &pair) {
            add.error = Some(error.into());
            return;
        }
        pairs.push(pair);
        self.adding = None;
        self.set_pairs(pairs);
    }

    pub(super) fn poll_adding(&mut self) {
        if let Some(add) = &mut self.adding
            && add.places.is_none()
            && let Ok(places) = add.reply.try_recv()
        {
            add.places = Some(places);
        }
    }

    pub(super) fn poll_sign_in(&mut self) {
        let Some(sign_in) = &mut self.sign_in else {
            return;
        };
        while let Ok(event) = sign_in.events.try_recv() {
            match event {
                AuthEvent::Code { user_code } => sign_in.user_code = Some(user_code),
                AuthEvent::Done { key, name } => {
                    self.key = Some(key);
                    self.config.key_name = Some(name);
                    self.sign_in = None;
                    self.checks = None;
                    self.tab = crate::ui::Tab::Sync;
                    self.config.save(&self.dirs);
                    self.push_target();
                    return;
                }
                AuthEvent::Failed(error) => {
                    self.auth_error = Some(error);
                    self.sign_in = None;
                    return;
                }
            }
        }
    }

    pub(super) fn start_sign_in(&mut self) {
        self.config.server = store::normalize_server(&self.server_input);
        self.server_input.clone_from(&self.config.server);
        self.auth_error = None;
        let cancel = Arc::new(AtomicBool::new(false));
        let (tx, rx) = channel();
        let (server, flag, wake) = (
            self.config.server.clone(),
            cancel.clone(),
            self.waker.clone(),
        );
        std::thread::spawn(move || auth::sign_in(server, flag, tx, move || wake.wake()));
        self.sign_in = Some(SignIn {
            cancel,
            events: rx,
            user_code: None,
        });
    }

    /// A pause stops the running rclone the way quitting does.
    pub(super) fn set_paused(&mut self, paused: bool) {
        self.config.paused = paused;
        self.config.save(&self.dirs);
        self.control.halt(paused);
        let _ = self.sync.send(Cmd::Pause(paused));
        if paused {
            let control = self.control.clone();
            std::thread::spawn(move || control.stop(GRACE));
        }
        self.update_pause_label();
    }

    pub(super) fn sign_out(&mut self) {
        store::delete_key(&self.config.server);
        self.key = None;
        self.down = None;
        self.config.key_name = None;
        self.config.save(&self.dirs);
        self.checks = None;
        self.push_target();
    }

    pub(super) fn change_server(&mut self) {
        self.sign_out();
        self.server_input.clear();
    }

    pub(super) fn set_start_at_login(&mut self, on: bool) {
        self.login_error = super::login::set(on).err();
        self.login = super::login::state();
    }

    pub(super) fn set_channel(&mut self, channel: Channel) {
        self.config.channel = Some(channel);
        self.config.save(&self.dirs);
        self.found = Found::Checking;
        let _ = self.channel_tx.send(channel);
    }

    /// Once per version, across restarts.
    pub(super) fn announce(&mut self, found: &Found) {
        let Found::Newer(release) = found else {
            return;
        };
        if self.config.announced.as_ref() == Some(&release.version) {
            return;
        }
        let how = match self.brew {
            Some(installed) => format!(
                "Run: {}",
                update::brew_command(installed, self.config.channel())
            ),
            None => "Install it from Settings.".into(),
        };
        sync::show(&format!("Penombre Sync {} is out. {how}", release.version));
        self.config.announced = Some(release.version.clone());
        self.config.save(&self.dirs);
    }

    pub(super) fn install_update(&mut self) {
        let Found::Newer(release) = &self.found else {
            return;
        };
        let (tx, rx) = channel();
        let (release, wake) = (release.clone(), self.waker.clone());
        std::thread::spawn(move || {
            let _ = tx.send(update::install(&release));
            wake.wake();
        });
        self.installing = Some(rx);
        self.install_error = None;
    }

    pub(super) fn poll_install(&mut self) {
        let Some(result) = self.installing.as_ref().and_then(|rx| rx.try_recv().ok()) else {
            return;
        };
        self.installing = None;
        match result.and_then(|exe| update::relaunch(&exe)) {
            Ok(()) => {
                log::info!("updated; restarting");
                self.quit = true;
            }
            Err(error) => {
                log::warn!("update failed: {error}");
                self.install_error = Some(error);
            }
        }
    }

    pub(super) fn toggle_exclusions(&mut self, index: usize) {
        self.excluding = match &self.excluding {
            Some(open) if open.index == index => None,
            _ => Some(Excluding {
                index,
                pattern: String::new(),
                error: None,
            }),
        };
    }

    pub(super) fn add_exclusion(&mut self) {
        let Some(open) = &mut self.excluding else {
            return;
        };
        let pattern = open.pattern.trim().to_owned();
        if sync::rule(&pattern).is_none() {
            open.error = Some("Not a pattern: try *.bak, node_modules/ or /Renders/.".into());
            return;
        }
        let index = open.index;
        open.pattern.clear();
        open.error = None;
        self.exclude(index, pattern);
    }

    pub(super) fn exclude_folder(&mut self) {
        let Some(open) = &mut self.excluding else {
            return;
        };
        let pairs = self.config.pairs();
        let Some(pair) = pairs.get(open.index) else {
            return;
        };
        let Some(folder) = rfd::FileDialog::new()
            .set_directory(&pair.local)
            .pick_folder()
        else {
            return;
        };
        let inside = folder
            .strip_prefix(&pair.local)
            .ok()
            .filter(|rest| !rest.as_os_str().is_empty());
        let Some(rest) = inside else {
            open.error = Some(format!(
                "Pick a folder inside {}.",
                crate::ui::home_relative(&pair.local)
            ));
            return;
        };
        let pattern = format!("/{}/", rest.to_string_lossy().replace('\\', "/"));
        open.error = None;
        let index = open.index;
        self.exclude(index, pattern);
    }

    pub(super) fn remove_exclusion(&mut self, which: usize) {
        let Some(index) = self.excluding.as_ref().map(|open| open.index) else {
            return;
        };
        let mut pairs = self.config.pairs();
        if let Some(pair) = pairs.get_mut(index)
            && which < pair.ignored.len()
        {
            pair.ignored.remove(which);
            self.set_pairs(pairs);
        }
    }

    /// A changed filter makes the pair's next run a `--resync`: its key says so.
    fn exclude(&mut self, index: usize, pattern: String) {
        let mut pairs = self.config.pairs();
        if let Some(pair) = pairs.get_mut(index)
            && !pair.ignored.contains(&pattern)
        {
            pair.ignored.push(pattern);
            self.set_pairs(pairs);
        }
    }
}
