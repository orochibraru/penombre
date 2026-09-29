//! rclone's `--use-json-log` lines: one JSON object per stderr line.

use serde_json::Value;

#[derive(Clone, Debug, Default, PartialEq)]
pub struct Progress {
    pub bytes: u64,
    pub total_bytes: u64,
    pub transfers: u64,
    pub total_transfers: u64,
    pub errors: u64,
    /// Seconds.
    pub eta: Option<u64>,
    pub transferring: Vec<Transfer>,
}

impl Progress {
    /// None until rclone has counted what there is to move.
    pub fn percent(&self) -> Option<u8> {
        (self.total_bytes > 0)
            .then(|| (self.bytes.min(self.total_bytes) * 100 / self.total_bytes) as u8)
    }
}

#[derive(Clone, Debug, PartialEq)]
pub struct Transfer {
    pub name: String,
    pub percentage: u8,
    pub size: u64,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Change {
    Uploaded,
    Downloaded,
    DeletedOnServer,
    DeletedHere,
}

#[derive(Debug, PartialEq)]
pub enum Line {
    Stats(Progress),
    Done {
        name: String,
        change: Change,
    },
    Failed {
        name: String,
        message: String,
    },
    /// Worth keeping for the run's error: a warning, an error, or not JSON at all.
    Said(String),
    Other,
}

pub fn parse(line: &str) -> Line {
    let Ok(json) = serde_json::from_str::<Value>(line) else {
        return if line.trim().is_empty() {
            Line::Other
        } else {
            Line::Said(line.to_owned())
        };
    };
    let level = json["level"].as_str().unwrap_or_default();
    let msg = json["msg"].as_str().unwrap_or_default();
    if let Some(stats) = json.get("stats") {
        return Line::Stats(progress(stats));
    }
    // Only an `*.Object` is a file; `*webdav.Fs` or `string` name the run.
    let file = json["object"].as_str().filter(|_| {
        json["objectType"]
            .as_str()
            .is_some_and(|t| t.ends_with(".Object"))
    });
    let local = json["objectType"]
        .as_str()
        .is_some_and(|t| t.contains("local"));
    match (level, file) {
        ("error", Some(name)) => Line::Failed {
            name: name.to_owned(),
            message: msg.to_owned(),
        },
        ("info", Some(name)) if msg.starts_with("Copied") => Line::Done {
            name: name.to_owned(),
            change: if local {
                Change::Uploaded
            } else {
                Change::Downloaded
            },
        },
        ("info", Some(name)) if msg == "Deleted" => Line::Done {
            name: name.to_owned(),
            change: if local {
                Change::DeletedHere
            } else {
                Change::DeletedOnServer
            },
        },
        ("info" | "debug", _) => Line::Other,
        _ => Line::Said(format!("{}: {msg}", level.to_uppercase())),
    }
}

fn progress(stats: &Value) -> Progress {
    let n = |key: &str| stats[key].as_u64().unwrap_or_default();
    Progress {
        bytes: n("bytes"),
        total_bytes: n("totalBytes"),
        transfers: n("transfers"),
        total_transfers: n("totalTransfers"),
        errors: n("errors"),
        eta: stats["eta"].as_u64(),
        transferring: stats["transferring"]
            .as_array()
            .map(|list| {
                list.iter()
                    .map(|t| Transfer {
                        name: t["name"].as_str().unwrap_or_default().to_owned(),
                        percentage: t["percentage"].as_u64().unwrap_or_default().min(100) as u8,
                        size: t["size"].as_u64().unwrap_or_default(),
                    })
                    .collect()
            })
            .unwrap_or_default(),
    }
}

#[cfg(test)]
mod tests {
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
                message:
                    "Failed to copy: unchunked simple update failed: 413 Request Entity Too Large"
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
}
