package dev.penombre.app

import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.graphics.Color
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlin.math.abs
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNull
import kotlin.test.assertTrue

class PdfTest {
    private val letter = PageBox(0.0, 0.0, 600.0, 800.0)

    private fun near(expected: Pair<Double, Double>, actual: Pair<Double, Double>) {
        assertTrue(abs(expected.first - actual.first) < 1e-9 && abs(expected.second - actual.second) < 1e-9, "$expected != $actual")
    }

    // Shown y runs down, PDF y runs up from the box's own origin.
    @Test
    fun anUnturnedPageFlipsTheVerticalAndKeepsItsOrigin() {
        near(0.0 to 800.0, letter.toPdf(0.0, 0.0))
        near(600.0 to 0.0, letter.toPdf(1.0, 1.0))
        near(150.0 to 600.0, letter.toPdf(0.25, 0.25))
        val cropped = PageBox(36.0, 18.0, 540.0, 760.0)
        near(36.0 to 778.0, cropped.toPdf(0.0, 0.0))
    }

    // Shown turned a quarter clockwise, the box's bottom left is the screen's top left.
    @Test
    fun aTurnedPageMapsItsCornersWhereTheyAreShown() {
        val quarter = letter.copy(rotation = 90)
        assertEquals(800.0, quarter.shownWidth)
        assertEquals(600.0, quarter.shownHeight)
        near(0.0 to 0.0, quarter.toPdf(0.0, 0.0))
        near(0.0 to 800.0, quarter.toPdf(1.0, 0.0))
        near(600.0 to 0.0, quarter.toPdf(0.0, 1.0))
        val half = letter.copy(rotation = 180)
        near(600.0 to 0.0, half.toPdf(0.0, 0.0))
        val threeQuarters = letter.copy(rotation = 270)
        near(600.0 to 800.0, threeQuarters.toPdf(0.0, 0.0))
        near(0.0 to 0.0, threeQuarters.toPdf(1.0, 1.0))
    }

    @Test
    fun everyRotationRoundTrips() {
        for (rotation in listOf(0, 90, 180, 270)) {
            val box = PageBox(10.0, 20.0, 300.0, 500.0, rotation)
            for ((u, v) in listOf(0.1 to 0.9, 0.5 to 0.5, 0.73 to 0.02)) {
                val (x, y) = box.toPdf(u, v)
                near(u to v, box.toShown(x, y))
            }
        }
    }

    @Test
    fun aRectangleComesBackTheSameWhateverTheRotation() {
        for (rotation in listOf(0, 90, 180, 270)) {
            val box = letter.copy(rotation = rotation)
            val shown = Rect(0.1f, 0.2f, 0.4f, 0.3f)
            val pdf = box.rectToPdf(shown)
            assertTrue(pdf[2] > 0 && pdf[3] > 0, "$rotation: $pdf")
            val back = box.rectToShown(pdf)
            listOf(shown.left to back.left, shown.top to back.top, shown.right to back.right, shown.bottom to back.bottom).forEach { (a, b) ->
                assertTrue(abs(a - b) < 1e-5, "$rotation: $shown != $back")
            }
        }
    }

    // A form widget's box from the server lands where the page shows it.
    @Test
    fun aFieldsBoxIsShownWhereItSits() {
        val shown = letter.rectToShown(listOf(50.0, 700.0, 200.0, 24.0))
        assertTrue(abs(shown.left - 50f / 600) < 1e-5)
        assertTrue(abs(shown.top - 76f / 800) < 1e-5)
        assertTrue(abs(shown.bottom - 100f / 800) < 1e-5)
    }

    // Zoom scales the page and what is drawn on it together: marks are kept in
    // 0..1 of the page, so a mark made at any zoom maps to the same point.
    @Test
    fun theRequestCarriesUserSpaceWhateverTheZoom() {
        val pages = listOf(letter, letter.copy(rotation = 90))
        val marks = listOf(
            Mark.Ink(0, listOf(Offset(0.5f, 0.5f), Offset(0.75f, 0.5f)), Color.Black, 3f),
            Mark.Highlight(0, Rect(0f, 0f, 0.5f, 0.1f), Color.Yellow),
            Mark.Sticky(1, Offset(0f, 0f), "Check", Color.Yellow),
        )
        val body = pdfEdits(pages, marks, mapOf("name" to "Ada"), "rev1")
        val tree = json.encodeToJsonElement(PdfEditBody.serializer(), body).jsonObject
        assertEquals("rev1", tree["base"]!!.jsonPrimitive.content)
        assertEquals("Ada", tree["fields"]!!.jsonObject["name"]!!.jsonPrimitive.content)
        val (ink, highlight, note) = tree["annotations"]!!.jsonArray.map { it.jsonObject }
        assertEquals("ink", ink["type"]!!.jsonPrimitive.content)
        assertEquals(listOf(300.0, 400.0, 450.0, 400.0), ink["strokes"]!!.jsonArray[0].jsonArray.map { it.jsonPrimitive.content.toDouble() })
        // Nothing a kind does not use is sent: the server's schema is strict about types.
        assertNull(ink["rects"])
        assertEquals(listOf(0.0, 720.0, 300.0, 80.0), highlight["rects"]!!.jsonArray[0].jsonArray.map { it.jsonPrimitive.content.toDouble() })
        assertEquals("note", note["type"]!!.jsonPrimitive.content)
        // Page two is turned: its shown top left is the box's bottom left.
        assertEquals(0.0, note["x"]!!.jsonPrimitive.content.toDouble())
        assertEquals(0.0, note["y"]!!.jsonPrimitive.content.toDouble())
        val stamp = signatureBody(letter, 0, Rect(0.5f, 0.5f, 1f, 0.6f), byteArrayOf(1, 2, 3))
        assertEquals(listOf(300.0, 320.0, 300.0, 80.0), stamp.rect)
        assertEquals("data:image/png;base64,AQID", stamp.image)
    }

    @Test
    fun aLayoutAnswerDecodes() {
        val layout = json.decodeFromString<Envelope<PdfLayout>>(
            """{"data":{"revision":"r","canWrite":true,"pages":[{"x":0,"y":0,"width":612,"height":792,"rotation":90}],
               "fields":[{"name":"agree","kind":"checkbox","value":"false","options":[],"readOnly":false,"multiline":false,
               "widgets":[{"page":0,"rect":[50,650,16,16],"option":null}]}]}}""",
        ).data
        assertEquals(90, layout.pages[0].rotation)
        assertTrue(layout.fields[0].fillable)
        assertEquals(listOf(50.0, 650.0, 16.0, 16.0), layout.fields[0].widgets[0].rect)
    }

    @Test
    fun signingLinksAreReadFromTheAppLinkAndFromANotification() {
        assertEquals(
            SigningLink("https://files.example.com", "abc_DEF-1"),
            signingLink("penombre://sign?server=https%3A%2F%2Ffiles.example.com%2F&token=abc_DEF-1"),
        )
        assertNull(signingLink("penombre://pair?server=https%3A%2F%2Fx&code=1"))
        assertNull(signingLink("penombre://sign?server=javascript%3Aalert(1)&token=a"))
        assertEquals(SigningLink("https://x", signer = "s1"), signingLink("penombre://sign?server=https%3A%2F%2Fx&signer=s1"))
        assertNull(signingLink("penombre://sign?server=https%3A%2F%2Fx&token=a&signer=b"))
        // A notification names the signer; a raw token there is not followed.
        assertEquals(SigningLink("https://x", signer = "s1"), signingLinkOf("https://x", "/sign/signer/s1"))
        assertNull(signingLinkOf("https://x", "/sign/tok"))
        assertNull(signingLinkOf("https://x", "/signatures"))
    }

    @Test
    fun theEditorOpensEmbeddedInTheAppsLightOrDark() {
        assertEquals("https://x/edit/f1?embed=1&theme=dark", embedUrl("https://x", Place(), "f1", dark = true))
        assertEquals("https://x/edit/f1?drive=d1&embed=1&theme=light", embedUrl("https://x", Place("d1"), "f1", dark = false))
    }

    @Test
    fun aDrawnSignatureIsCroppedToItsStrokes() {
        val frame = signatureFrame(listOf(listOf(Offset(100f, 100f), Offset(300f, 140f))), 4f, 900)!!
        assertEquals(92f, frame.left)
        assertEquals(216, frame.width)
        assertEquals(56, frame.height)
        // A wide pad on a big phone is scaled down: the server takes only a small picture.
        assertEquals(108, signatureFrame(listOf(listOf(Offset(100f, 100f), Offset(300f, 140f))), 4f, 108)!!.width)
        assertNull(signatureFrame(emptyList(), 4f, 900))
    }
}
