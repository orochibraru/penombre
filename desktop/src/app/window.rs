use std::sync::atomic::Ordering;
use std::time::{Duration, SystemTime};

use fastframe_shell::Held;

use super::App;
use crate::sync::{self, Cmd};
use crate::ui;

pub struct Window {
    app: Held<App>,
}

impl Window {
    pub fn new(app: Held<App>) -> Self {
        Self { app }
    }
}

impl eframe::App for Window {
    fn ui(&mut self, ui: &mut egui::Ui, _frame: &mut eframe::Frame) {
        let ctx = ui.ctx().clone();
        self.app.tick();
        // ponytail: the window flashes once on a configured start; macOS only makes the tray item with a window.
        if std::mem::take(&mut self.app.hide_on_first_frame) || self.app.quit {
            ctx.send_viewport_cmd(egui::ViewportCommand::Close);
        }
        if std::mem::take(&mut self.app.show) {
            ctx.send_viewport_cmd(egui::ViewportCommand::Focus);
        }
        let focused = ctx.input(|i| i.focused);
        if focused && !std::mem::replace(&mut self.app.focused, focused) {
            self.app.checks = None;
            self.app.login = super::login::state();
        }
        self.app.focused = focused;
        egui::CentralPanel::default()
            .frame(egui::Frame::new().fill(ui.visuals().panel_fill))
            .show(ui, |ui| self.app.settings(ui));
        ctx.request_repaint_after(Duration::from_secs(30));
    }
}

impl App {
    fn settings(&mut self, ui: &mut egui::Ui) {
        if self.tab == ui::Tab::Settings && self.checks.is_none() {
            self.checks = Some(super::permissions::checks(
                &self.config.pairs(),
                &self.config.server,
                self.key.is_some(),
            ));
        }
        let key_name = self
            .config
            .key_name
            .clone()
            .unwrap_or_else(|| "Penombre Sync".into());
        let phase = if self.key.is_some() {
            ui::Phase::SignedIn
        } else if let Some(sign_in) = &self.sign_in {
            ui::Phase::Waiting(sign_in.user_code.as_deref())
        } else {
            ui::Phase::SignedOut
        };
        let state = match (&self.last, self.running, self.key.is_some()) {
            (_, _, false) => ui::SyncState::Off,
            _ if self.config.paused => ui::SyncState::Paused,
            _ if self.down.is_some() => ui::SyncState::Failed,
            (_, true, _) => ui::SyncState::Running,
            (Some((_, Err(_))), ..) => ui::SyncState::Failed,
            (Some((_, Ok(()))), ..) => ui::SyncState::Ok,
            (None, ..) => ui::SyncState::Off,
        };
        let error = match &self.last {
            Some((_, Err(error))) if !self.config.paused => Some(error.as_str()),
            _ => None,
        };
        let pairs = self.config.pairs();
        let action = ui::draw(
            ui,
            ui::View {
                tab: self.tab,
                server: &mut self.server_input,
                key_name: &key_name,
                login: self.login,
                login_error: self.login_error.as_deref(),
                checks: self.checks.as_deref().unwrap_or_default(),
                phase,
                auth_error: self.auth_error.as_deref(),
                pairs: &pairs,
                adding: self.adding.as_mut().map(|add| ui::Adding {
                    local: &add.local,
                    places: add
                        .places
                        .as_ref()
                        .map(|result| result.as_deref().map_err(String::as_str)),
                    choice: &mut add.choice,
                    subfolder: &mut add.subfolder,
                    error: add.error.as_deref(),
                }),
                rclone_missing: sync::find_rclone().is_none(),
                status: if state == ui::SyncState::Failed && self.down.is_none() {
                    "Sync failed"
                } else {
                    &self.tray_label
                },
                state,
                error,
                progress: self
                    .progress
                    .as_ref()
                    .map(|(label, progress)| (label.as_str(), progress)),
                recent: self.recent.make_contiguous(),
                failures: &self.failures,
                down: self.down.as_ref(),
                now: SystemTime::now(),
            },
        );
        match action {
            Some(ui::Action::Tab(tab)) => {
                self.tab = tab;
                self.checks = None;
            }
            Some(ui::Action::ChangeServer) => self.change_server(),
            Some(ui::Action::StartAtLogin(on)) => self.set_start_at_login(on),
            Some(ui::Action::Open(url)) => {
                if let Err(error) = open::that(&url) {
                    log::warn!("could not open {url}: {error}");
                }
            }
            Some(ui::Action::SignIn) => self.start_sign_in(),
            Some(ui::Action::Cancel) => {
                if let Some(sign_in) = self.sign_in.take() {
                    sign_in.cancel.store(true, Ordering::Relaxed);
                }
            }
            Some(ui::Action::SignOut) => self.sign_out(),
            Some(ui::Action::AddFolder) => self.start_adding(),
            Some(ui::Action::ConfirmAdd) => self.confirm_adding(),
            Some(ui::Action::CancelAdd) => self.adding = None,
            Some(ui::Action::Remove(index)) => self.remove_pair(index),
            Some(ui::Action::SyncNow) => {
                let _ = self.sync.send(Cmd::SyncNow);
            }
            Some(ui::Action::Pause(paused)) => self.set_paused(paused),
            None => {}
        }
    }
}
