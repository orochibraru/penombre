use std::time::{Duration, SystemTime};

/// How often a server that stopped answering is asked again.
pub const PROBE: Duration = Duration::from_secs(30);

/// The server stopped answering: since when, and why.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Down {
    pub since: SystemTime,
    pub reason: String,
}

/// Any answer below 500 is Penombre alive (before setup it redirects). A
/// refused connection, a timeout or a proxy's 502 is not.
pub fn probe(server: &str) -> Result<(), String> {
    let response = reqwest::blocking::Client::builder()
        .redirect(reqwest::redirect::Policy::none())
        .timeout(Duration::from_secs(10))
        .build()
        .map_err(|e| e.to_string())?
        .get(format!("{server}/api/health"))
        .send()
        .map_err(|e| reason(&e))?;
    let status = response.status();
    if status.is_server_error() {
        Err(format!("the server answered {status}"))
    } else {
        Ok(())
    }
}

fn reason(error: &reqwest::Error) -> String {
    if error.is_timeout() {
        "no answer within 10 seconds".into()
    } else if error.is_connect() {
        "the connection was refused or the host is unknown".into()
    } else {
        error.to_string()
    }
}

/// One failed probe can be a restart; two in a row is an outage worth a
/// notification, once, until the server answers again.
#[derive(Default)]
pub struct Outage {
    down: Option<Down>,
    misses: u32,
}

#[derive(Debug, PartialEq, Eq)]
pub enum Change {
    Same,
    WentDown,
    Notify,
    CameBack,
}

impl Outage {
    pub fn record(&mut self, result: Result<(), String>, now: SystemTime) -> Change {
        match result {
            Ok(()) => {
                self.misses = 0;
                if self.down.take().is_some() {
                    Change::CameBack
                } else {
                    Change::Same
                }
            }
            Err(reason) => {
                self.misses += 1;
                let first = self.down.is_none();
                let down = self.down.get_or_insert(Down {
                    since: now,
                    reason: reason.clone(),
                });
                down.reason = reason;
                match (first, self.misses) {
                    (true, _) => Change::WentDown,
                    (false, 2) => Change::Notify,
                    _ => Change::Same,
                }
            }
        }
    }

    pub fn down(&self) -> Option<&Down> {
        self.down.as_ref()
    }
}

#[cfg(test)]
#[path = "../../tests/sync/reach.rs"]
mod tests;
