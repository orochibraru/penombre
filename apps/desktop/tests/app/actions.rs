use super::*;

fn place() -> Place {
    Place {
        path: "me".into(),
        name: "My drive".into(),
    }
}

#[test]
fn a_pair_without_a_subfolder_is_the_place_itself() {
    for blank in ["", "  ", "/", " // "] {
        let pair = new_pair("/Users/me/Penombre".into(), &place(), blank);
        assert_eq!(pair.remote, "me", "{blank:?}");
        assert_eq!(pair.label, "My drive", "{blank:?}");
        assert!(pair.ignored.is_empty());
    }
}

#[test]
fn a_subfolder_is_trimmed_into_the_remote_path_and_the_label() {
    let pair = new_pair("/Users/me/Music".into(), &place(), " /Music/Reaper/ ");
    assert_eq!(pair.local, PathBuf::from("/Users/me/Music"));
    assert_eq!(pair.remote, "me/Music/Reaper");
    assert_eq!(pair.label, "My drive / Music/Reaper");
}

#[test]
fn only_a_folder_strictly_inside_the_pair_can_be_excluded() {
    let root = Path::new("/Users/me/Penombre");
    assert_eq!(
        folder_pattern(root, &root.join("Renders")).as_deref(),
        Some("/Renders/")
    );
    assert_eq!(
        folder_pattern(root, &root.join("Mixes/old takes")).as_deref(),
        Some("/Mixes/old takes/")
    );
    assert_eq!(folder_pattern(root, root), None, "the pair itself");
    assert_eq!(
        folder_pattern(root, Path::new("/Users/me")),
        None,
        "above it"
    );
    assert_eq!(
        folder_pattern(root, Path::new("/Users/me/Penombre2/x")),
        None,
        "a sibling sharing its name's start"
    );
}
