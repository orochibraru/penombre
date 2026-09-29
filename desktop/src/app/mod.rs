mod actions;
mod login;
mod permissions;
mod status;
mod tray;
mod window;

use std::collections::VecDeque;
use std::path::PathBuf;
use std::sync::Arc;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::mpsc::{Receiver, Sender, channel};
use std::time::{Duration, SystemTime};

use fastframe_shell::{Closed, Headless, Resident, Waker};
use fastframe_tray::Tray;

use crate::auth::AuthEvent;
use crate::instance::Instance;
use crate::places::Place;
use crate::store::{self, Config, Dirs};
use crate::sync::{self, Cmd, Control, Failure, Progress, Status, Synced};
use crate::ui;

pub use login::Login;
pub use window::Window;

struct SignIn {
    cancel: Arc<AtomicBool>,
    events: Receiver<AuthEvent>,
    user_code: Option<String>,
}

type LastSync = (SystemTime, Result<(), String>);

const RECENT: usize = 20;
/// How long rclone gets to stop on its own after SIGTERM.
const GRACE: Duration = Duration::from_secs(3);

struct AddState {
    local: PathBuf,
    places: Option<Result<Vec<Place>, String>>,
    reply: Receiver<Result<Vec<Place>, String>>,
    choice: usize,
    subfolder: String,
    error: Option<String>,
}

pub struct App {
    dirs: Dirs,
    tab: ui::Tab,
    /// Recomputed when Settings shows or the window regains focus.
    checks: Option<Vec<ui::Check>>,
    login: Login,
    login_error: Option<String>,
    focused: bool,
    /// Set by a second launch knocking.
    knocked: Arc<AtomicBool>,
    _instance: Instance,
    config: Config,
    server_input: String,
    key: Option<String>,
    sign_in: Option<SignIn>,
    auth_error: Option<String>,
    adding: Option<AddState>,
    sync: Sender<Cmd>,
    status: Receiver<Status>,
    control: Arc<Control>,
    running: bool,
    /// The pair syncing now, and how far along it is.
    progress: Option<(String, Progress)>,
    recent: VecDeque<Synced>,
    failures: Vec<Failure>,
    last: Option<LastSync>,
    tray: Option<Tray>,
    tray_label: String,
    waker: Waker,
    show: bool,
    quit: bool,
    hide_on_first_frame: bool,
}

impl App {
    pub fn new(waker: &Waker, dirs: Dirs, instance: Instance) -> Self {
        let config = Config::load(&dirs);
        let key = store::read_key(&config.server);
        let (sync_tx, sync_rx) = channel();
        let (status_tx, status_rx) = channel();
        let worker_dirs = dirs.clone();
        let wake = waker.clone();
        let self_tx = sync_tx.clone();
        let control = Arc::new(Control::default());
        control.halt(config.paused);
        let _ = sync_tx.send(Cmd::Pause(config.paused));
        let worker_control = control.clone();
        std::thread::Builder::new()
            .name("sync".into())
            .spawn(move || {
                sync::worker(
                    sync_rx,
                    self_tx,
                    status_tx,
                    move || wake.wake(),
                    worker_dirs,
                    worker_control,
                )
            })
            .expect("spawn the sync thread");
        let knocked = Arc::new(AtomicBool::new(false));
        let (flag, wake) = (knocked.clone(), waker.clone());
        let knocks = (instance.listener.try_clone())
            .inspect_err(|e| log::warn!("a second launch cannot show this one: {e}"));
        std::thread::spawn(move || {
            for _ in knocks.iter().flat_map(std::net::TcpListener::incoming) {
                flag.store(true, Ordering::Relaxed);
                wake.wake();
            }
        });
        let wake = waker.clone();
        let tray = Tray::spawn(tray::config(), move || wake.wake());
        let mut app = Self {
            dirs,
            tab: if key.is_some() {
                ui::Tab::Sync
            } else {
                ui::Tab::Settings
            },
            checks: None,
            login: login::state(),
            login_error: None,
            focused: false,
            knocked,
            _instance: instance,
            server_input: config.server.clone(),
            hide_on_first_frame: key.is_some() && tray.is_some(),
            config,
            key,
            sign_in: None,
            auth_error: None,
            adding: None,
            sync: sync_tx,
            status: status_rx,
            control,
            running: false,
            progress: None,
            recent: VecDeque::new(),
            failures: Vec::new(),
            last: None,
            tray,
            tray_label: String::new(),
            waker: waker.clone(),
            show: false,
            quit: false,
        };
        app.push_target();
        app.update_pause_label();
        app
    }

    fn push_target(&self) {
        let target = self.key.as_ref().map(|key| {
            let pairs = self.config.pairs();
            let server = self.config.server.clone();
            let targets = (0..pairs.len())
                .map(|index| {
                    let mut target = sync::PairTarget {
                        pair: pairs[index].clone(),
                        excludes: sync::excludes(&pairs, index),
                        resynced: false,
                    };
                    target.resynced = self.config.resynced.contains(&target.key(&server));
                    target
                })
                .collect();
            sync::Target {
                server,
                key: key.clone(),
                pairs: targets,
            }
        });
        let _ = self.sync.send(Cmd::Target(target));
    }

    /// Everything a frame does whether or not a window exists.
    fn tick(&mut self) {
        while let Ok(status) = self.status.try_recv() {
            match status {
                Status::Started => {
                    self.running = true;
                    self.progress = None;
                }
                Status::Pair(label) => self.progress = Some((label, Progress::default())),
                Status::Progress(progress) => {
                    if let Some((_, current)) = &mut self.progress {
                        *current = progress;
                    }
                }
                Status::Synced(file) => {
                    self.recent.push_front(file);
                    self.recent.truncate(RECENT);
                }
                Status::Failures(failures) => self.failures = failures,
                Status::Finished {
                    at,
                    result,
                    resynced,
                } => {
                    self.running = false;
                    self.progress = None;
                    let mut changed = false;
                    for (pair, done) in resynced {
                        changed |= if done {
                            self.config.resynced.insert(pair)
                        } else {
                            self.config.resynced.remove(&pair)
                        };
                    }
                    if changed {
                        self.config.save(&self.dirs);
                    }
                    if let Some(result) = result {
                        self.last = Some((at, result));
                    }
                }
            }
        }
        if self.knocked.swap(false, Ordering::Relaxed) {
            self.show = true;
        }
        self.poll_sign_in();
        self.poll_adding();
        self.tray_events();
        let label = status::status_line(
            self.key.is_some(),
            self.config.paused,
            self.running,
            self.last.as_ref(),
            SystemTime::now(),
        );
        self.update_tray_label(label);
    }
}

impl Resident for App {
    fn closed(&self) -> Closed {
        if self.quit || self.tray.is_none() {
            Closed::Quit
        } else {
            Closed::Hide
        }
    }

    fn window_gone(&mut self) {
        self.show = false;
    }

    fn headless_frame(&mut self, _ctx: &egui::Context) -> Headless {
        self.tick();
        if self.quit {
            Headless::Quit
        } else if self.show {
            Headless::Show
        } else {
            Headless::Wait
        }
    }

    fn shutdown(&mut self) {
        if let Some(sign_in) = &self.sign_in {
            sign_in.cancel.store(true, Ordering::Relaxed);
        }
        self.control.halt(true);
        let _ = self.sync.send(Cmd::Quit);
        self.control.stop(GRACE);
    }
}
