package dev.penombre.app

import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ImageBitmap
import io.ktor.client.call.body
import io.ktor.client.request.bearerAuth
import io.ktor.client.request.get
import io.ktor.client.request.post
import io.ktor.client.request.setBody
import io.ktor.http.ContentType
import io.ktor.http.Url
import io.ktor.http.contentType
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlin.io.encoding.Base64

/**
 * A page's crop box in PDF points, and how far it is turned when shown. The
 * app keeps every mark in shown coordinates, 0..1 of the page as drawn, so
 * zoom changes nothing; PDF user space is for the server.
 */
@Serializable
data class PageBox(val x: Double, val y: Double, val width: Double, val height: Double, val rotation: Int = 0) {
    private val turned get() = rotation == 90 || rotation == 270

    /** Width and height in points, as shown. */
    val shownWidth get() = if (turned) height else width
    val shownHeight get() = if (turned) width else height

    /** A point of the page as shown (0..1, y down) in PDF user space. */
    fun toPdf(u: Double, v: Double): Pair<Double, Double> = when (rotation) {
        90 -> (x + v * width) to (y + u * height)
        180 -> (x + width - u * width) to (y + v * height)
        270 -> (x + width - v * width) to (y + height - u * height)
        else -> (x + u * width) to (y + (1 - v) * height)
    }

    /** A point in PDF user space, as shown (0..1, y down). */
    fun toShown(px: Double, py: Double): Pair<Double, Double> {
        val a = (px - x) / width
        val b = (py - y) / height
        return when (rotation) {
            90 -> b to a
            180 -> (1 - a) to b
            270 -> (1 - b) to (1 - a)
            else -> a to (1 - b)
        }
    }

    /** A shown rectangle (0..1) as `[x, y, width, height]` in user space. */
    fun rectToPdf(rect: Rect): List<Double> {
        val (x1, y1) = toPdf(rect.left.toDouble(), rect.top.toDouble())
        val (x2, y2) = toPdf(rect.right.toDouble(), rect.bottom.toDouble())
        return listOf(minOf(x1, x2), minOf(y1, y2), kotlin.math.abs(x2 - x1), kotlin.math.abs(y2 - y1))
    }

    /** `[x, y, width, height]` in user space, as a shown rectangle (0..1). */
    fun rectToShown(rect: List<Double>): Rect {
        val (u1, v1) = toShown(rect[0], rect[1])
        val (u2, v2) = toShown(rect[0] + rect[2], rect[1] + rect[3])
        return Rect(minOf(u1, u2).toFloat(), minOf(v1, v2).toFloat(), maxOf(u1, u2).toFloat(), maxOf(v1, v2).toFloat())
    }
}

@Serializable
data class PdfWidget(val page: Int, val rect: List<Double>, val option: String? = null)

/** An AcroForm field: `text`, `checkbox`, `radio`, `dropdown`, `list`, `button` or `signature`. */
@Serializable
data class PdfField(
    val name: String,
    val kind: String,
    val value: String? = null,
    val options: List<String> = emptyList(),
    val readOnly: Boolean = false,
    val multiline: Boolean = false,
    val widgets: List<PdfWidget> = emptyList(),
) {
    val fillable get() = !readOnly && kind in setOf("text", "checkbox", "radio", "dropdown", "list")
}

@Serializable
data class PdfLayout(
    val revision: String,
    val canWrite: Boolean = false,
    val pages: List<PageBox> = emptyList(),
    val fields: List<PdfField> = emptyList(),
)

/** Something drawn on a page and not saved yet; positions are shown (0..1). */
sealed interface Mark {
    val page: Int

    data class Ink(override val page: Int, val points: List<Offset>, val color: Color, val width: Float) : Mark

    data class Highlight(override val page: Int, val rect: Rect, val color: Color) : Mark

    data class Sticky(override val page: Int, val at: Offset, val text: String, val color: Color) : Mark

    /** A signature image; `png` is what the server draws. */
    data class Stamp(override val page: Int, val rect: Rect, val png: ByteArray, val picture: ImageBitmap) : Mark {
        override fun equals(other: Any?) = this === other

        override fun hashCode() = png.contentHashCode()
    }
}

@Serializable
class AnnotationBody(
    val type: String,
    val page: Int,
    val color: List<Double>,
    val rects: List<List<Double>>? = null,
    val strokes: List<List<Double>>? = null,
    val width: Double? = null,
    val x: Double? = null,
    val y: Double? = null,
    val text: String? = null,
)

@Serializable
class SignatureBody(val page: Int, val rect: List<Double>, val image: String)

@Serializable
class PdfEditBody(
    val base: String? = null,
    val annotations: List<AnnotationBody> = emptyList(),
    val fields: Map<String, String> = emptyMap(),
    val signatures: List<SignatureBody> = emptyList(),
)

private fun Color.parts() = listOf(red, green, blue).map { (it * 1000).toInt() / 1000.0 }

private fun round(value: Double) = kotlin.math.round(value * 100) / 100

/** A PNG as the server takes it. */
fun pngDataUrl(png: ByteArray) = "data:image/png;base64," + Base64.encode(png)

/** A signature placed at `rect` (shown, 0..1) of page `index`. */
fun signatureBody(page: PageBox, index: Int, rect: Rect, png: ByteArray) = SignatureBody(index, page.rectToPdf(rect).map(::round), pngDataUrl(png))

/** What the app sends for its marks and field values, in user space. */
fun pdfEdits(pages: List<PageBox>, marks: List<Mark>, fields: Map<String, String>, base: String?): PdfEditBody {
    val annotations = mutableListOf<AnnotationBody>()
    val signatures = mutableListOf<SignatureBody>()
    for (mark in marks) {
        val page = pages.getOrNull(mark.page) ?: continue
        when (mark) {
            is Mark.Ink -> annotations += AnnotationBody(
                "ink",
                mark.page,
                mark.color.parts(),
                strokes = listOf(
                    mark.points.flatMap {
                        val (x, y) = page.toPdf(it.x.toDouble(), it.y.toDouble())
                        listOf(round(x), round(y))
                    },
                ),
                width = mark.width.toDouble(),
            )

            is Mark.Highlight -> annotations += AnnotationBody("highlight", mark.page, mark.color.parts(), rects = listOf(page.rectToPdf(mark.rect).map(::round)))

            is Mark.Sticky -> {
                val (x, y) = page.toPdf(mark.at.x.toDouble(), mark.at.y.toDouble())
                annotations += AnnotationBody("note", mark.page, mark.color.parts(), x = round(x), y = round(y), text = mark.text)
            }

            is Mark.Stamp -> signatures += signatureBody(page, mark.page, mark.rect, mark.png)
        }
    }
    return PdfEditBody(base, annotations, fields, signatures)
}

/** The file changed since it was read: `revision` is what is there now. */
class Changed(val revision: String?) : Exception("changed")

@Serializable
private class Saved(val revision: String)

suspend fun Api.pdfLayout(place: Place, id: String): PdfLayout = call {
    client.get("$base/storage/file/$id/pdf") { auth(place) }.body<Envelope<PdfLayout>>().data
}

/** Writes the edits; the new revision, or `Changed` when someone saved first. */
suspend fun Api.editPdf(place: Place, id: String, edits: PdfEditBody): String {
    try {
        return call {
            client.post("$base/storage/file/$id/pdf") {
                auth(place)
                contentType(ContentType.Application.Json)
                setBody(edits)
            }.body<Envelope<Saved>>().data.revision
        }
    } catch (e: Refused) {
        if (e.status == 409) throw Changed(null)
        throw e
    }
}

/** What a signing link shows (`SigningView` on the server). */
@Serializable
data class SigningView(
    val requestId: String,
    val documentName: String,
    val message: String? = null,
    val requesterName: String,
    val status: String,
    val pageCount: Int = 0,
    val expiresAt: String,
    val signer: Signer,
    val waitingFor: String? = null,
    val signers: List<Signer> = emptyList(),
) {
    @Serializable
    data class Signer(val name: String, val email: String? = null, val status: String, val you: Boolean = false)

    val canSign get() = status == "pending" && signer.status == "pending" && waitingFor == null
}

/**
 * A signature request to answer: by its link's token
 * (`penombre://sign?server=…&token=…`), or by the signer's row, which only
 * that account signed in opens (a notification's `/sign/signer/<id>`).
 */
data class SigningLink(val server: String, val token: String? = null, val signer: String? = null)

fun signingLink(link: String): SigningLink? {
    val url = runCatching { Url(link) }.getOrNull() ?: return null
    if (url.protocol.name != "penombre" || url.host != "sign") return null
    val server = url.parameters["server"]?.trimEnd('/')?.takeIf { it.startsWith("http://") || it.startsWith("https://") } ?: return null
    val token = url.parameters["token"]?.takeIf { it.isNotBlank() }
    val signer = url.parameters["signer"]?.takeIf { it.isNotBlank() }
    if ((token == null) == (signer == null)) return null
    return SigningLink(server, token, signer)
}

/** A notification's `/sign/signer/<id>`, as a request on this server. */
fun signingLinkOf(server: String, path: String): SigningLink? = path.removePrefix("/sign/signer/").takeIf { it != path && it.isNotBlank() && '/' !in it }
    ?.let { SigningLink(server, signer = it) }

/**
 * A signer's side of a request. The token is the credential; a session, when
 * there is one on that server, records the signature as the account's.
 */
class Signing(val link: SigningLink, private val session: Session?) {
    private val client = httpClient()
    private val base = "${link.server}/api/v1/signing"

    private suspend inline fun <reified T> send(path: String, body: JsonObject): T = answered(signedOut = false) {
        client.post("$base/$path") {
            session?.takeIf { it.server == link.server }?.let { bearerAuth(it.token) }
            contentType(ContentType.Application.Json)
            val key = link.token?.let { "token" to JsonPrimitive(it) } ?: ("signer" to JsonPrimitive(link.signer))
            setBody(JsonObject(body + key))
        }.body()
    }

    suspend fun view(): SigningView = send<Envelope<SigningView>>("view", JsonObject(emptyMap())).data

    suspend fun document(): ByteArray = send("document", JsonObject(emptyMap()))

    suspend fun sign(png: ByteArray, timeZone: String?): SigningView = send<Envelope<SigningView>>(
        "sign",
        JsonObject(
            buildMap {
                put("signature", JsonPrimitive(pngDataUrl(png)))
                put("consent", JsonPrimitive(true))
                timeZone?.let { put("timeZone", JsonPrimitive(it)) }
            },
        ),
    ).data

    suspend fun decline(reason: String?): SigningView = send<Envelope<SigningView>>(
        "decline",
        JsonObject(buildMap { reason?.takeIf { it.isNotBlank() }?.let { put("reason", JsonPrimitive(it)) } }),
    ).data
}
