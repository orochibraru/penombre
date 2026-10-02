use super::*;

#[test]
fn reads_the_servers_listing() {
    let xml = r#"<?xml version="1.0" encoding="utf-8"?>
<d:multistatus xmlns:d="DAV:"><d:response><d:href>/dav/</d:href><d:propstat><d:prop><d:displayname>Penombre</d:displayname></d:prop></d:propstat></d:response><d:response><d:href>/dav/me/</d:href><d:propstat><d:prop><d:displayname>My drive</d:displayname></d:prop></d:propstat></d:response><d:response><d:href>/dav/volumes/music%20lib/</d:href><d:propstat><d:prop><d:displayname>Music &amp; stems</d:displayname></d:prop></d:propstat></d:response></d:multistatus>"#;
    assert_eq!(
        parse(xml),
        vec![
            Place {
                path: "me".into(),
                name: "My drive".into()
            },
            Place {
                path: "volumes/music lib".into(),
                name: "Music & stems".into()
            },
        ]
    );
}
