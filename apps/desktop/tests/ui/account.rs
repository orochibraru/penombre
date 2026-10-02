use super::*;

#[test]
fn codes_are_split_for_reading() {
    assert_eq!(spaced("ABCDEFGH"), "ABCD-EFGH");
    assert_eq!(spaced("ABC"), "ABC");
    assert_eq!(host("https://files.example.com/"), "files.example.com");
}
