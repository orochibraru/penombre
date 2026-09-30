package dev.penombre.app

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNull
import kotlin.test.assertTrue

class LogicTest {
    // The server's own test uses this pair (`auth/mobile.test.ts`): if the two
    // sides disagree, no phone can sign in.
    @Test
    fun pkceChallengeMatchesTheServer() {
        assertEquals(
            "ngF5GsXcbwljx6u133FFr3Xht9xooA_DuaX_3QwODtc",
            pkceChallenge("dBjftJeZ4CVP-mJ92K27uhbUJU1p1r_wW1gFWFOEjXk"),
        )
    }

    @Test
    fun listingUrlEncodesEachSegmentAndKeepsTheSlashes() {
        assertEquals("https://x.test/api/v1/storage/list", listingUrl("https://x.test", ""))
        assertEquals(
            "https://x.test/api/v1/storage/list/Live%20sets/a%23b",
            listingUrl("https://x.test", "Live sets/a#b"),
        )
    }

    @Test
    fun childPathAppendsTheKeyToItsParent() {
        assertEquals("a", childPath("", "a"))
        assertEquals("a/b", childPath("a", "b"))
    }

    @Test
    fun mediaOpensInTheViewerAndTheRestRaw() {
        val item = { category: String -> Item("k", "file", 1, Meta("id1", "n", category)) }
        assertEquals("https://x.test/view/id1", fileUrl("https://x.test", item("MUSIC")))
        assertEquals("https://x.test/api/v1/storage/file/id1?raw=true", fileUrl("https://x.test", item("DOCUMENTS")))
    }

    @Test
    fun aListingPageDecodesAndIgnoresFieldsTheAppDoesNotKnow() {
        val page = json.decodeFromString<Page>(
            """{"list":[{"key":"Mixes","type":"folder","metadata":{"id":"f1","name":"Mixes","owner":"u"},"extra":1},
               {"key":"a.wav","type":"file","size":2048,"metadata":{"id":"f2","category":"MUSIC"}}],
               "count":2,"total":2,"nextCursor":null}""",
        )
        assertEquals(2, page.list.size)
        assertTrue(page.list[0].isFolder)
        assertEquals("Mixes", page.list[0].title)
        // No name: the key stands in.
        assertEquals("a.wav", page.list[1].title)
        assertNull(page.nextCursor)
    }

    @Test
    fun sizesAreHumanReadable() {
        assertEquals("512 B", formatSize(512))
        assertEquals("2.0 KB", formatSize(2048))
        assertEquals("1.5 MB", formatSize(1_572_864))
    }
}
