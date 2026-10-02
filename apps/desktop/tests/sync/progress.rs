use super::*;

/// Real lines from rclone v1.75.1 bisyncing against Penombre's WebDAV.
const SAMPLES: &str = include_str!("fixtures/bisync.jsonl");

#[test]
fn real_rclone_lines_parse() {
    let lines: Vec<Line> = SAMPLES.lines().map(parse).collect();
    let done = |name: &str, change| Line::Done {
        name: name.into(),
        change,
    };
    assert_eq!(lines[0], done("keep1.txt", Change::Uploaded));
    let Line::Stats(stats) = &lines[1] else {
        panic!("{:?}", lines[1]);
    };
    assert_eq!((stats.transfers, stats.total_transfers), (4, 5));
    assert_eq!((stats.bytes, stats.total_bytes), (163_849, 409_609));
    assert_eq!(stats.eta, None);
    assert_eq!(stats.transferring.len(), 1);
    assert_eq!(stats.transferring[0].name, "mid.bin");
    assert_eq!(stats.transferring[0].size, 409_600);
    assert_eq!(stats.transferring[0].percentage, 40);
    assert_eq!(lines[2], done("sub/rem.txt", Change::Downloaded));
    assert_eq!(lines[3], done("mid.bin", Change::Uploaded));
    assert_eq!(lines[4], done("new.txt", Change::DeletedOnServer));
    assert_eq!(lines[5], done("big.bin", Change::DeletedHere));
    assert_eq!(
        lines[6],
        Line::Failed {
            name: "huge.bin".into(),
            message: "Failed to copy: unchunked simple update failed: 413 Request Entity Too Large"
                .into()
        }
    );
    assert!(matches!(&lines[7], Line::Said(s) if s.starts_with("ERROR: not deleting")));
    assert!(matches!(&lines[8], Line::Said(s) if s.contains("Must run --resync")));
    assert!(matches!(&lines[9], Line::Said(s) if s.starts_with("NOTICE: Failed to bisync")));
    assert_eq!(
        parse("Error: unknown flag: --x"),
        Line::Said("Error: unknown flag: --x".into())
    );
}
