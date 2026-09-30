package dev.penombre.app

import io.ktor.client.engine.mock.MockEngine
import io.ktor.client.engine.mock.respond
import io.ktor.client.request.HttpRequestData
import io.ktor.http.ContentType
import io.ktor.http.HttpHeaders
import io.ktor.http.HttpMethod
import io.ktor.http.HttpStatusCode
import io.ktor.http.Url
import io.ktor.http.content.OutgoingContent
import io.ktor.http.headersOf
import kotlinx.coroutines.test.runTest
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
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
        // As a listing gives a folder's key.
        assertEquals("a/b", childPath("a", "b/"))
        assertEquals("a", childPath("", "a/"))
    }

    // Every URL handed to an image or an audio player names its drive too.
    @Test
    fun bytesAndThumbnailsCarryTheirDrive() {
        assertEquals("https://x.test/api/v1/storage/file/f1?raw=true", rawUrl("https://x.test", Place(), "f1"))
        assertEquals("https://x.test/api/v1/storage/file/f1?raw=true&drive=d1", rawUrl("https://x.test", Place("d1"), "f1"))
        assertEquals(
            "https://x.test/api/v1/storage/file/f1?thumbnail=true&size=small&drive=d1",
            thumbnailUrl("https://x.test", Place("d1"), "f1", "small"),
        )
    }

    // The folder routes take one segment: a nested path's slashes are escaped.
    @Test
    fun aFolderPathIsOneEscapedSegment() {
        assertEquals("https://x.test/api/v1/storage/folder/a%2Fb%20c", folderUrl("https://x.test", "a/b c"))
    }

    // The shapes the server really sends: everything sits under `data`.
    @Test
    fun aListingAnswerDecodesAndIgnoresFieldsTheAppDoesNotKnow() {
        val page = json.decodeFromString<Envelope<Page>>(
            """{"data":{"list":[{"key":"Mixes","type":"folder","metadata":{"id":"f1","name":"Mixes","owner":"u"},"extra":1},
               {"key":"a.wav","type":"file","size":2048,"metadata":{"id":"f2","category":"MUSIC"}}],
               "count":2,"total":2,"nextCursor":null}}""",
        ).data
        assertEquals(2, page.list.size)
        assertTrue(page.list[0].isFolder)
        assertEquals("Mixes", page.list[0].title)
        // No name: the key stands in.
        assertEquals("a.wav", page.list[1].title)
        assertNull(page.nextCursor)
    }

    @Test
    fun aTokenAnswerDecodes() {
        val token = json.decodeFromString<Envelope<TokenResponse>>(
            """{"data":{"token":"t","expiresAt":"2026-10-07T00:00:00.000Z",
               "cookie":{"name":"better-auth.session_token","value":"t.sig"},
               "user":{"id":"u1","name":"Ada","email":"a@x.test"}}}""",
        ).data
        assertEquals("t", token.token)
        assertEquals("better-auth.session_token", token.cookie.name)
        assertEquals("Ada", token.user.name)
    }

    private fun stateOf(authorizeUrl: String) = Url(authorizeUrl).parameters["state"]!!

    // Two taps on Sign in: the browser on screen belongs to the first.
    @Test
    fun eachSignInAttemptIsAnsweredByItsOwnRedirect() {
        val first = Auth.begin("x.test/", "Pixel")
        val second = Auth.begin("https://x.test", "Pixel")
        assertTrue(first.startsWith("https://x.test/auth/mobile/authorize?"))

        val claim = Auth.claim("penombre://auth?code=c1&state=${stateOf(first)}")
        assertEquals("c1", claim.code)
        assertEquals("https://x.test", claim.server)
        assertEquals(Url(first).parameters["code_challenge"], pkceChallenge(claim.verifier))

        // Once only, and the second attempt is still its own.
        assertFailsWith<IllegalStateException> { Auth.claim("penombre://auth?code=c1&state=${stateOf(first)}") }
        assertEquals("c2", Auth.claim("penombre://auth?code=c2&state=${stateOf(second)}").code)
    }

    @Test
    fun aRedirectTheAppNeverAskedForIsRefused() {
        Auth.begin("https://x.test", "Pixel")
        assertFailsWith<IllegalStateException> { Auth.claim("penombre://auth?code=c&state=forged") }
        assertFailsWith<IllegalStateException> { Auth.claim("penombre://auth?code=c") }
    }

    // The web uploader's two calls, in its order: the entry, then the bytes.
    @Test
    fun anUploadCreatesTheEntryThenSendsTheBytes() = runTest {
        val requests = mutableListOf<HttpRequestData>()
        val engine = MockEngine { request ->
            requests += request
            respond(
                """{"data":{"id":"f9","finalName":"Take 1.wav","metadata":{"id":"f9","category":"MUSIC"}}}""",
                headers = headersOf(HttpHeaders.ContentType, ContentType.Application.Json.toString()),
            )
        }
        val api = Api(Session("https://x.test", "tok", "c", "v", "Ada"), httpClient(engine))

        api.upload(Place("d1"), "Live sets", PickedFile("Take 1.wav", 3) { byteArrayOf(1, 2, 3) })

        assertEquals(2, requests.size)
        val (create, send) = requests
        assertEquals(HttpMethod.Post, create.method)
        assertEquals("/api/v1/storage/file", create.url.encodedPath)
        assertEquals("Live sets", create.url.parameters["folder"])
        assertEquals("d1", create.url.parameters["drive"])
        assertEquals("d1", send.url.parameters["drive"])
        assertEquals("Bearer tok", create.headers[HttpHeaders.Authorization])
        assertEquals("/api/v1/storage/file/f9/upload", send.url.encodedPath)
        assertEquals("Bearer tok", send.headers[HttpHeaders.Authorization])
        assertTrue(send.body.contentType.toString().startsWith("multipart/form-data"))
        val body = (send.body as OutgoingContent.ByteArrayContent).bytes().decodeToString()
        // Quoted: the server does not read `name=file` as a field at all.
        assertTrue("name=\"file\"; filename=\"Take 1.wav\"" in body)
        assertTrue(body.endsWith("--\r\n"))
    }

    // Bytes that never arrive must not leave an entry that opens as nothing.
    @Test
    fun aFailedUploadRemovesItsEntry() = runTest {
        val calls = mutableListOf<String>()
        val engine = MockEngine { request ->
            calls += "${request.method.value} ${request.url.encodedPath}"
            if (request.url.encodedPath.endsWith("/upload")) {
                respond("{\"message\":\"No file provided\"}", HttpStatusCode.BadRequest)
            } else {
                respond(
                    """{"data":{"finalName":"a.txt","metadata":{"id":"f1"}}}""",
                    headers = headersOf(HttpHeaders.ContentType, ContentType.Application.Json.toString()),
                )
            }
        }
        val api = Api(Session("https://x.test", "tok", "c", "v", "Ada"), httpClient(engine))

        assertFailsWith<Exception> { api.upload(Place(), "", PickedFile("a.txt", 1) { byteArrayOf(1) }) }
        assertEquals(
            listOf("POST /api/v1/storage/file", "POST /api/v1/storage/file/f1/upload", "DELETE /api/v1/storage/file/f1"),
            calls,
        )
    }

    @Test
    fun anUploadAtTheRootNamesNoFolder() = runTest {
        var folder: String? = "unset"
        val engine = MockEngine { request ->
            if (request.url.encodedPath == "/api/v1/storage/file") folder = request.url.parameters["folder"]
            respond(
                """{"data":{"finalName":"a.txt","metadata":{"id":"f1"}}}""",
                headers = headersOf(HttpHeaders.ContentType, ContentType.Application.Json.toString()),
            )
        }
        Api(Session("https://x.test", "tok", "c", "v", "Ada"), httpClient(engine))
            .upload(Place(), "", PickedFile("a.txt", 1) { byteArrayOf(1) })
        assertNull(folder)
    }

    private val ada = Session("https://x.test", "tok", "c", "v", "Ada")

    /** Records each request as `METHOD path?query` and answers `body`. */
    private fun recording(calls: MutableList<String>, body: String = "{\"data\":{\"message\":\"ok\"}}") = MockEngine { request ->
        calls += "${request.method.value} ${request.url.encodedPath}${request.url.encodedQuery.let { if (it.isEmpty()) "" else "?$it" }}"
        respond(body, headers = headersOf(HttpHeaders.ContentType, ContentType.Application.Json.toString()))
    }

    // A file is addressed by id, a folder by its path; a trashed folder's key
    // is already its full path.
    @Test
    fun trashingAndRestoringAddressFilesAndFoldersDifferently() = runTest {
        val calls = mutableListOf<String>()
        val api = Api(ada, httpClient(recording(calls)))
        val file = Item("a.txt", "file", 1, Meta("f1"))
        val folder = Item("Mixes", "folder", null, Meta("d9"))

        api.setTrashed(Place(), file, "Live/a.txt", true)
        api.setTrashed(Place("d1"), folder, "Live/Mixes", true)
        api.setTrashed(Place(), folder, "Live/Mixes", false)
        api.delete(Place(), folder, "Live/Mixes")
        api.emptyTrash(Place("d1"))

        assertEquals(
            listOf(
                "PUT /api/v1/storage/file/f1",
                "POST /api/v1/storage/folder/Live%2FMixes/trash?drive=d1",
                "POST /api/v1/storage/folder/Live%2FMixes/restore",
                "DELETE /api/v1/storage/folder/Live%2FMixes",
                "DELETE /api/v1/storage/trash?drive=d1",
            ),
            calls,
        )
    }

    @Test
    fun drivesVersionsAndPeaksDecodeAsTheServerSendsThem() = runTest {
        val drives = Api(ada, httpClient(recording(mutableListOf(), """{"data":[{"id":"d1","name":"The band","owner":true,"role":"manager"},{"id":"d2","name":"Label","owner":false,"role":"viewer"}]}""")))
            .drives()
        assertEquals(listOf("The band", "Label"), drives.map { it.name })
        assertTrue(drives[0].canWrite)
        assertTrue(!drives[1].canWrite)

        val versions = Api(ada, httpClient(recording(mutableListOf(), """{"data":{"current":{"size":355,"updatedAt":"2026-09-30T13:36:16.944Z","nextSeq":2},"versions":[{"id":"v1","seq":1,"size":125,"contentType":"text/plain","name":null,"authorName":"Test user","createdAt":"2026-09-30T13:36:16.940Z"}],"versioning":{"enabled":true,"max":1000}}}""")))
            .versions(Place(), "f1")
        assertEquals(2, versions.current.nextSeq)
        assertEquals("Test user", versions.versions.single().authorName)

        // A bare array: the one answer that is not wrapped in `data`.
        val peaks = Api(ada, httpClient(recording(mutableListOf(), "[0.011,0.5,1]"))).peaks(Place(), "f1")
        assertEquals(listOf(0.011f, 0.5f, 1f), peaks)
    }

    // Search is one call across every place; each hit says where it lives.
    @Test
    fun searchAsksEverywhereAndKnowsWhereEachHitLives() = runTest {
        val calls = mutableListOf<String>()
        val found = Api(ada, httpClient(recording(calls, """{"data":{"list":[{"key":"a.wav","type":"file","metadata":{"id":"f1","name":"a.wav","category":"MUSIC"},"parent":"Live","parentKey":"Live","place":{"kind":"volume","id":"music","name":"Music"}},{"key":"b.wav","type":"file","metadata":{"id":"f2","name":"b.wav","category":"MUSIC"},"place":{"kind":"drive","id":"d1","name":"The band"}}],"total":2}}""")))
            .search("wav")
        assertEquals(listOf("GET /api/v1/search?q=wav"), calls)
        assertEquals(listOf(Place(volume = "music"), Place("d1")), found.list.map { it.place?.place })
        assertEquals("Live", found.list[0].parent)
    }

    @Test
    fun aDocumentOpensInTheWebEditorWhereItLives() {
        assertEquals("https://x.test/edit/f1", editUrl("https://x.test", Place(), "f1"))
        assertEquals("https://x.test/edit/f1?volume=music", editUrl("https://x.test", Place(volume = "music"), "f1"))
    }

    // Bordeaux is the default, and the default must still be sent: leaving it
    // out saved nothing and the account kept its previous accent.
    @Test
    fun choosingTheDefaultAccentIsStillSent() = runTest {
        var sent = ""
        val engine = MockEngine { request ->
            sent = (request.body as OutgoingContent.ByteArrayContent).bytes().decodeToString()
            respond("{\"data\":{}}", headers = headersOf(HttpHeaders.ContentType, ContentType.Application.Json.toString()))
        }
        Api(ada, httpClient(engine)).setAccent("bordeaux")
        assertEquals("{\"accent\":\"bordeaux\"}", sent)
    }

    @Test
    fun timesAndDatesReadPlainly() {
        assertEquals("0:00", clock(0.0))
        assertEquals("1:05", clock(65.4))
        assertEquals("0:00", clock(Double.NaN))
        assertEquals("2026-09-30", shortDate("2026-09-30T13:36:16.940Z"))
        assertEquals("TU", initials("test  user"))
    }

    @Test
    fun sizesAreHumanReadable() {
        assertEquals("512 B", formatSize(512))
        assertEquals("2.0 KB", formatSize(2048))
        assertEquals("1.5 MB", formatSize(1_572_864))
    }

    private fun file(name: String, category: String) = Item(name, "file", metadata = Meta("id", name, category))

    @Test
    fun officeFilesAreToldApartByExtension() {
        val kinds = listOf("Rider.docx", "Merch stock.XLSX", "Pitch deck.pptx", "Contract.pdf", "notes.txt")
            .map { iconFor(file(it, "DOCUMENTS")).second }
        // A document, a sheet, a deck, a PDF and plain text: five colours.
        assertEquals(5, kinds.toSet().size)
        assertEquals(iconFor(file("budget.csv", "OTHER")).second, kinds[1])
    }

    @Test
    fun aCategoryWinsOverAnExtension() {
        assertEquals(iconFor(file("a.ts", "CODE")), iconFor(file("b.md", "CODE")))
    }

    /** Records each request with its JSON body. */
    private fun bodies(calls: MutableList<String>, answer: String = "{\"data\":{\"message\":\"ok\"}}") = MockEngine { request ->
        val body = (request.body as? OutgoingContent.ByteArrayContent)?.bytes()?.decodeToString() ?: ""
        calls += "${request.method.value} ${request.url.encodedPath}${request.url.encodedQuery.let { if (it.isEmpty()) "" else "?$it" }} $body".trim()
        respond(answer, headers = headersOf(HttpHeaders.ContentType, ContentType.Application.Json.toString()))
    }

    // What the web app's QR code says, and nothing that only looks like it.
    @Test
    fun aPairingLinkNamesItsServerAndCode() {
        val link = "penombre://pair?server=https%3A%2F%2Ffiles.example.com%3A8443&code=abc_-123"
        assertEquals(Pairing("https://files.example.com:8443", "abc_-123"), Auth.pairing(link))
        assertEquals("files.example.com:8443", Auth.pairing(link)!!.host)
        assertNull(Auth.pairing("penombre://auth?code=abc&state=x"))
        assertNull(Auth.pairing("penombre://pair?server=https%3A%2F%2Fa.test"))
        assertNull(Auth.pairing("penombre://pair?server=javascript%3Aalert(1)&code=abc"))
        assertNull(Auth.pairing("https://files.example.com/?code=abc"))
        assertNull(Auth.pairing("not a link at all"))
    }

    // No verifier: the server tells the two kinds of code apart by its absence.
    @Test
    fun aScannedCodeIsTradedWithTheDeviceName() = runTest {
        val calls = mutableListOf<String>()
        val answer = """{"data":{"token":"t1","expiresAt":"2026-10-01T00:00:00.000Z","cookie":{"name":"c","value":"v"},"user":{"id":"u1","name":"Ada","email":"a@x.test"}}}"""
        val session = Auth.pair(Pairing("https://x.test", "abc"), "Pixel 9", httpClient(bodies(calls, answer)))

        assertEquals(Session("https://x.test", "t1", "c", "v", "Ada"), session)
        assertEquals(listOf("""POST /api/v1/mobile/token {"code":"abc","device":"Pixel 9"}"""), calls)
    }

    @Test
    fun aRenditionIsTheSameFileAtAHeight() {
        assertEquals(
            "https://x.test/api/v1/storage/file/f1?raw=true&drive=d1&rendition=480",
            rawUrl("https://x.test", Place("d1"), "f1", 480),
        )
    }

    // A file is renamed by id with `key`, a folder by path with `name`.
    @Test
    fun changesSayWhatTheServerExpects() = runTest {
        val calls = mutableListOf<String>()
        val api = Api(ada, httpClient(bodies(calls, """{"data":{"status":"preparing","failCount":0,"results":[]}}""")))
        val file = Item("a.txt", "file", 1, Meta("f1"))
        val folder = Item("Mixes", "folder", null, Meta("d9"))

        api.rename(Place(), file, "Live/a.txt", "b.txt")
        api.rename(Place("d1"), folder, "Live/Mixes", "Masters")
        api.createFolder(Place(), "", "New")
        api.createFolder(Place(), "Live", "New")
        api.transfer(Place("d1"), folder, "Live/Mixes", Place(), "Archive", move = true)
        api.transfer(Place(), file, "Live/a.txt", Place("d2"), "", move = false)
        assertEquals("preparing", api.ensureRendition(Place("d1"), "f1", 720).status)

        assertEquals(
            listOf(
                """PUT /api/v1/storage/file/f1 {"key":"b.txt"}""",
                """PUT /api/v1/storage/folder/Live%2FMixes?drive=d1 {"name":"Masters"}""",
                """POST /api/v1/storage/folder {"name":"New"}""",
                """POST /api/v1/storage/folder {"name":"New","parent":"Live"}""",
                """POST /api/v1/storage/transfer?drive=d1 {"items":[{"path":"Live/Mixes","type":"folder"}],"destination":{"folder":"Archive"},"mode":"move"}""",
                """POST /api/v1/storage/transfer {"items":[{"path":"Live/a.txt","type":"file"}],"destination":{"drive":"d2","folder":""},"mode":"copy"}""",
                """POST /api/v1/storage/file/f1/renditions/720?drive=d1 {}""",
            ),
            calls,
        )
    }

    @Test
    fun aTransferTheServerRefusedIsAnError() = runTest {
        val refused = """{"data":{"failCount":1,"successCount":0,"results":[{"path":"a","success":false,"error":"This drive is read-only"}]}}"""
        val api = Api(ada, httpClient(bodies(mutableListOf(), refused)))
        val error = assertFailsWith<IllegalStateException> {
            api.transfer(Place(), Item("a", "file", 1, Meta("f1")), "a", Place("d2"), "", move = true)
        }
        assertEquals("This drive is read-only", error.message)
    }

    // A photo opens on a render; a tiny file or one that moves is shown as it is.
    @Test
    fun aPictureIsLookedAtBeforeItIsDownloaded() {
        val big = Item("Poster.jpg", "file", 8_000_000, Meta("p1", "Poster.jpg", "IMAGES"))
        val tiny = big.copy(size = 20_000)
        val moving = big.copy(metadata = big.metadata.copy(name = "Loop.GIF"))
        assertEquals("https://x.test/api/v1/storage/file/p1?thumbnail=true&size=preview", lookUrl("https://x.test", Place(), big))
        assertEquals("https://x.test/api/v1/storage/file/p1?raw=true", lookUrl("https://x.test", Place(), tiny))
        assertEquals("https://x.test/api/v1/storage/file/p1?raw=true", lookUrl("https://x.test", Place(), moving))
    }

    @Test
    fun aRefusalIsReadFromTheAnswer() {
        assertEquals("Folder not found", refusal("""{"message":"Folder not found"}"""))
        assertEquals("Rate limit exceeded", refusal("""{"error":"Rate limit exceeded"}"""))
        assertNull(refusal("<html>502</html>"))
    }

    // A version in a list is `<file>:v:<version>`; its bytes and waveform come
    // from the versions routes, with the drive as a query of its own.
    @Test
    fun aVersionIsServedByTheVersionsRoutes() {
        val id = versionId("f1", "v9")
        assertEquals("https://x.test/api/v1/storage/file/f1/versions/v9/raw", rawUrl("https://x.test", Place(), id))
        assertEquals(
            "https://x.test/api/v1/storage/file/f1/versions/v9/thumbnail?size=medium&drive=d1",
            thumbnailUrl("https://x.test", Place("d1"), id, "medium"),
        )
        assertEquals("https://x.test/api/v1/storage/file/f1?raw=true&drive=d1", rawUrl("https://x.test", Place("d1"), "f1"))
    }

    @Test
    fun aRowKnowsItsDurationAndItsVersion() {
        val item = json.decodeFromString<Item>(
            """{"key":"a.wav","type":"file","metadata":{"id":"f1","music":{"duration":271.4},"versionSeq":14}}""",
        )
        assertEquals(271.4, item.metadata.duration)
        assertEquals(14, item.metadata.versionSeq)
        assertNull(json.decodeFromString<Item>("""{"key":"a.wav","type":"file","metadata":{"id":"f1","music":{"duration":0}}}""").metadata.duration)
    }

    @Test
    fun aVersionsWaveformIsAskedOfItsOwnRoute() = runTest {
        val calls = mutableListOf<String>()
        Api(ada, httpClient(recording(calls, "[0.5,1.0]"))).peaks(Place("d1"), versionId("f1", "v9"))
        assertEquals(listOf("GET /api/v1/storage/file/f1/versions/v9/thumbnail?size=medium&drive=d1"), calls)
    }
}
