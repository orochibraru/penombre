use std::sync::mpsc::channel;

use super::*;
use crate::store::Pair;

#[test]
fn a_server_that_does_not_answer_gets_no_sync_only_a_warning() {
    let listener = std::net::TcpListener::bind("127.0.0.1:0").unwrap();
    let server = format!("http://127.0.0.1:{}", listener.local_addr().unwrap().port());
    drop(listener);
    let root = std::env::temp_dir().join(format!("penombre-down-{}", std::process::id()));
    let dirs = crate::store::Dirs {
        config: root.join("config"),
        data: root.join("data"),
    };
    let (tx, rx) = channel();
    let (status_tx, status) = channel();
    let worker_tx = tx.clone();
    let handle =
        std::thread::spawn(move || worker(rx, worker_tx, status_tx, || {}, dirs, Arc::default()));
    tx.send(Cmd::Target(Some(Target {
        server,
        key: "unused".into(),
        pairs: vec![super::super::PairTarget {
            pair: Pair {
                local: root.join("local"),
                remote: "me".into(),
                label: "My drive".into(),
                ignored: Vec::new(),
            },
            excludes: vec![],
            resynced: true,
        }],
    })))
    .unwrap();
    let deadline = Instant::now() + Duration::from_secs(5);
    let mut down = false;
    while Instant::now() < deadline && !down {
        match status.recv_timeout(Duration::from_millis(200)) {
            Ok(Status::Reach(Some(_))) => down = true,
            Ok(Status::Started) => panic!("synced against a server that is not there"),
            _ => {}
        }
    }
    tx.send(Cmd::Quit).unwrap();
    handle.join().unwrap();
    let _ = std::fs::remove_dir_all(&root);
    assert!(down, "the window was never told");
}
