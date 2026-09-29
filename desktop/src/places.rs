//! The places a folder can sync to: `PROPFIND /dav/` lists My drive, the shared
//! drives and the writable volumes.

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Place {
    /// Under `/dav/`: `me`, `drives/<id>`, `volumes/<name>`.
    pub path: String,
    pub name: String,
}

pub fn fetch(server: &str, key: &str) -> Result<Vec<Place>, String> {
    let method = reqwest::Method::from_bytes(b"PROPFIND").map_err(|e| e.to_string())?;
    let response = reqwest::blocking::Client::new()
        .request(method, format!("{server}/dav/"))
        .basic_auth("penombre-sync", Some(key))
        .header("Depth", "1")
        .timeout(std::time::Duration::from_secs(15))
        .send()
        .map_err(|e| format!("Could not reach the server: {e}"))?;
    if response.status().as_u16() != 207 {
        return Err(format!(
            "The server did not list its places (HTTP {}).",
            response.status().as_u16()
        ));
    }
    Ok(parse(&response.text().map_err(|e| e.to_string())?))
}

/// Penombre's own multistatus, so plain string slicing is enough.
pub fn parse(xml: &str) -> Vec<Place> {
    xml.split("<d:response>")
        .skip(1)
        .filter_map(|response| {
            let href = between(response, "<d:href>", "</d:href>")?;
            let path = decode(&unescape(href))
                .trim_start_matches("/dav/")
                .trim_end_matches('/')
                .to_owned();
            let name = unescape(between(response, "<d:displayname>", "</d:displayname>")?);
            (!path.is_empty()).then_some(Place { path, name })
        })
        .collect()
}

fn between<'a>(text: &'a str, start: &str, end: &str) -> Option<&'a str> {
    let from = text.find(start)? + start.len();
    let to = from + text[from..].find(end)?;
    Some(&text[from..to])
}

fn unescape(text: &str) -> String {
    text.replace("&lt;", "<")
        .replace("&gt;", ">")
        .replace("&quot;", "\"")
        .replace("&amp;", "&")
}

fn decode(text: &str) -> String {
    let bytes = text.as_bytes();
    let mut out = Vec::with_capacity(bytes.len());
    let mut i = 0;
    while i < bytes.len() {
        let hex = |b: u8| (b as char).to_digit(16);
        if bytes[i] == b'%'
            && let (Some(hi), Some(lo)) = (
                bytes.get(i + 1).copied().and_then(hex),
                bytes.get(i + 2).copied().and_then(hex),
            )
        {
            out.push((hi * 16 + lo) as u8);
            i += 3;
        } else {
            out.push(bytes[i]);
            i += 1;
        }
    }
    String::from_utf8_lossy(&out).into_owned()
}

#[cfg(test)]
mod tests {
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
}
