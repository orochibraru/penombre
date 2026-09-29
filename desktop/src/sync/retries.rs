use std::collections::BTreeMap;
use std::time::SystemTime;

#[derive(Clone, Debug, PartialEq)]
pub struct Failure {
    /// The pair's label.
    pub pair: String,
    pub name: String,
    pub message: String,
    pub at: SystemTime,
}

/// Files that failed, per pair key: a first failure earns an early retry, a
/// second one a notification, a success forgets them.
#[derive(Default)]
pub struct Retries {
    files: BTreeMap<(String, String), (Failure, u32)>,
    fresh: bool,
}

impl Retries {
    /// One pair's finished run. Returns the files to tell the user about now.
    pub fn record(
        &mut self,
        key: &str,
        clean: bool,
        synced: &[String],
        failed: Vec<Failure>,
    ) -> Vec<Failure> {
        if clean {
            self.files.retain(|(k, _), _| k != key);
            return Vec::new();
        }
        for name in synced {
            self.files.remove(&(key.to_owned(), name.clone()));
        }
        let mut notify = Vec::new();
        for failure in failed {
            let entry = self
                .files
                .entry((key.to_owned(), failure.name.clone()))
                .or_insert((failure.clone(), 0));
            entry.0 = failure;
            entry.1 += 1;
            match entry.1 {
                1 => self.fresh = true,
                2 => notify.push(entry.0.clone()),
                _ => {}
            }
        }
        notify
    }

    /// Whether the run just recorded failed a file for the first time; clears it.
    pub fn retry_soon(&mut self) -> bool {
        std::mem::take(&mut self.fresh)
    }

    pub fn keep_pairs(&mut self, keys: &[String]) {
        self.files.retain(|(k, _), _| keys.contains(k));
    }

    pub fn failures(&self) -> Vec<Failure> {
        self.files.values().map(|(f, _)| f.clone()).collect()
    }
}

/// One notification for everything that just failed twice.
pub fn notice(failed: &[Failure]) -> Option<String> {
    let first = failed.first()?;
    let reason = first
        .message
        .rsplit(": ")
        .next()
        .unwrap_or_default()
        .lines()
        .next()
        .unwrap_or_default();
    let reason: String = reason.chars().take(80).collect();
    let what = match failed {
        [one] => one.name.rsplit('/').next().unwrap_or(&one.name).to_owned(),
        many => format!("{} files", many.len()),
    };
    Some(format!("Couldn't sync {what} — {reason}"))
}

#[cfg(test)]
mod tests {
    use super::*;

    fn failure(name: &str) -> Failure {
        Failure {
            pair: "My drive".into(),
            name: name.into(),
            message: "Failed to copy: unchunked simple update failed: 413 Request Entity Too Large"
                .into(),
            at: SystemTime::UNIX_EPOCH,
        }
    }

    #[test]
    fn a_file_is_retried_once_then_reported_once() {
        let mut r = Retries::default();
        assert!(r.record("k", false, &[], vec![failure("a.bin")]).is_empty());
        assert!(r.retry_soon(), "a first failure retries early");
        assert!(!r.retry_soon());
        let told = r.record("k", false, &[], vec![failure("a.bin")]);
        assert_eq!(told, vec![failure("a.bin")]);
        assert!(!r.retry_soon(), "back to the normal period");
        assert!(r.record("k", false, &[], vec![failure("a.bin")]).is_empty());
        assert_eq!(r.failures().len(), 1);
    }

    #[test]
    fn a_success_clears_a_file_so_it_can_be_reported_again() {
        let mut r = Retries::default();
        r.record("k", false, &[], vec![failure("a.bin")]);
        r.record("k", false, &["a.bin".into()], vec![]);
        assert!(r.failures().is_empty());
        r.record("k", false, &[], vec![failure("a.bin")]);
        assert_eq!(r.record("k", false, &[], vec![failure("a.bin")]).len(), 1);
        r.record("k", true, &[], vec![]);
        assert!(r.failures().is_empty(), "a clean run clears its pair");
    }

    #[test]
    fn notices_name_one_file_or_count_them() {
        assert_eq!(
            notice(&[failure("docs/report.docx")]).unwrap(),
            "Couldn't sync report.docx — 413 Request Entity Too Large"
        );
        assert_eq!(
            notice(&[failure("a"), failure("b")]).unwrap(),
            "Couldn't sync 2 files — 413 Request Entity Too Large"
        );
        assert_eq!(notice(&[]), None);
    }
}
