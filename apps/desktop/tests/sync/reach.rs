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
