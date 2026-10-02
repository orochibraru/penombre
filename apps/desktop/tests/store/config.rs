use super::*;

#[test]
fn an_old_config_keeps_its_folder_as_the_drive_mirror() {
    let old: Config =
        serde_json::from_str(r#"{"server":"s","folder":"/x/Sync","resynced":[]}"#).unwrap();
    assert_eq!(
        old.pairs(),
        vec![Pair {
            local: "/x/Sync".into(),
            remote: "me".into(),
            label: "My drive".into(),
            ignored: Vec::new(),
        }]
    );
    let emptied = Config {
        pairs: Some(vec![]),
        ..Config::default()
    };
    assert!(emptied.pairs().is_empty());
}

#[test]
fn a_folder_or_a_place_is_used_once() {
    let pair = |l: &str, r: &str| Pair {
        local: l.into(),
        remote: r.into(),
        label: String::new(),
        ignored: Vec::new(),
    };
    let pairs = [pair("/h/Penombre", "me")];
    assert!(conflict(&pairs, &pair("/h/Penombre", "me/X")).is_some());
    assert!(conflict(&pairs, &pair("/h/Docs", "me")).is_some());
    assert!(conflict(&pairs, &pair("/h/Docs", "me/Docs")).is_none());
}

#[test]
fn server_urls_are_normalized() {
    assert_eq!(
        normalize_server(" files.example.com/ "),
        "https://files.example.com"
    );
    assert_eq!(
        normalize_server("http://localhost:5173/"),
        "http://localhost:5173"
    );
    assert_eq!(normalize_server(""), "");
}
