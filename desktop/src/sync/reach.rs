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
mod tests {
    use super::*;

    #[test]
    fn a_blip_is_shown_but_only_an_outage_notifies_and_only_once() {
        let t = SystemTime::UNIX_EPOCH;
        let mut o = Outage::default();
        assert_eq!(o.record(Ok(()), t), Change::Same);
        assert_eq!(o.record(Err("refused".into()), t), Change::WentDown);
        assert_eq!(o.down().map(|d| d.since), Some(t), "shown at once");
        assert_eq!(o.record(Err("refused".into()), t + PROBE), Change::Notify);
        assert_eq!(o.record(Err("timeout".into()), t + PROBE * 2), Change::Same);
        assert_eq!(o.down().map(|d| d.reason.as_str()), Some("timeout"));
        assert_eq!(o.down().map(|d| d.since), Some(t), "since the first miss");
        assert_eq!(o.record(Ok(()), t + PROBE * 3), Change::CameBack);
        assert!(o.down().is_none());
        assert_eq!(
            o.record(Err("refused".into()), t + PROBE * 4),
            Change::WentDown
        );
        assert_eq!(
            o.record(Ok(()), t + PROBE * 5),
            Change::CameBack,
            "a blip never notified"
        );
    }

    #[test]
    fn a_stopped_server_is_down_and_a_running_one_up() {
        let listener = std::net::TcpListener::bind("127.0.0.1:0").unwrap();
        let port = listener.local_addr().unwrap().port();
        drop(listener);
        assert!(probe(&format!("http://127.0.0.1:{port}")).is_err());

        let listener = std::net::TcpListener::bind("127.0.0.1:0").unwrap();
        let port = listener.local_addr().unwrap().port();
        let serve = |status: &'static str| {
            let listener = listener.try_clone().unwrap();
            std::thread::spawn(move || {
                use std::io::{Read, Write};
                let (mut stream, _) = listener.accept().unwrap();
                let mut buf = [0; 1024];
                let _ = stream.read(&mut buf);
                let _ = write!(
                    stream,
                    "HTTP/1.1 {status}\r\ncontent-length: 0\r\nconnection: close\r\n\r\n"
                );
            })
        };
        let server = format!("http://127.0.0.1:{port}");
        let answered = serve("302 Found");
        assert!(probe(&server).is_ok(), "a redirect is an answer");
        answered.join().unwrap();
        let answered = serve("502 Bad Gateway");
        assert!(probe(&server).is_err(), "a proxy with nothing behind it");
        answered.join().unwrap();
    }
}
