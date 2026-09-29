use std::sync::Arc;
use std::sync::atomic::AtomicBool;
use std::sync::mpsc::channel;

use super::{AddState, App, GRACE, SignIn};
use crate::auth::{self, AuthEvent};
use crate::places;
use crate::store::{self, Pair};
use crate::sync::Cmd;

impl App {
    pub(super) fn set_pairs(&mut self, pairs: Vec<Pair>) {
        self.config.pairs = Some(pairs);
        self.config.save(&self.dirs);
        self.checks = None;
        self.push_target();
    }

    pub(super) fn remove_pair(&mut self, index: usize) {
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
            }
        } else {
            Pair {
                local: add.local.clone(),
                remote: format!("{}/{sub}", place.path),
                label: format!("{} / {sub}", place.name),
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
}
