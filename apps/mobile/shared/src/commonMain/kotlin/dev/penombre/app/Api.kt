package dev.penombre.app

import io.ktor.client.HttpClient
import io.ktor.client.HttpClientConfig
import io.ktor.client.call.body
import io.ktor.client.engine.HttpClientEngine
import io.ktor.client.plugins.ClientRequestException
import io.ktor.client.plugins.contentnegotiation.ContentNegotiation
import io.ktor.client.request.HttpRequestBuilder
import io.ktor.client.request.bearerAuth
import io.ktor.client.request.delete
import io.ktor.client.request.get
import io.ktor.client.request.header
import io.ktor.client.request.parameter
import io.ktor.client.request.post
import io.ktor.client.request.put
import io.ktor.client.request.setBody
import io.ktor.client.statement.bodyAsText
import io.ktor.http.ContentType
import io.ktor.http.HttpStatusCode
import io.ktor.http.content.ByteArrayContent
import io.ktor.http.contentType
import io.ktor.http.encodeURLParameter
import io.ktor.http.encodeURLPathPart
import io.ktor.serialization.kotlinx.json.json
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.NonCancellable
import kotlinx.coroutines.withContext
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive

private val configure: HttpClientConfig<*>.() -> Unit = {
    expectSuccess = true
    install(ContentNegotiation) { json(json) }
}

/** The platform's engine, or the one a test hands in. */
fun httpClient(engine: HttpClientEngine? = null) = if (engine == null) HttpClient(configure) else HttpClient(engine, configure)

@Serializable
data class Meta(
    val id: String,
    val name: String? = null,
    val category: String? = null,
    val isStarred: Boolean = false,
    /** The highest kept version; the current bytes are one more. */
    val versionSeq: Int? = null,
    val music: Media? = null,
    val video: Media? = null,
) {
    /** Seconds, once the server has probed the file. */
    val duration get() = (music ?: video)?.duration?.takeIf { it > 0 }
}

@Serializable
data class Media(val duration: Double? = null)

/** Where a search result was found: the account's drive, a shared drive or a mount. */
@Serializable
data class Found(val kind: String, val id: String? = null, val name: String) {
    val place get() = when (kind) {
        "drive" -> Place(drive = id)
        "volume" -> Place(volume = id)
        else -> Place()
    }
}

@Serializable
data class Item(
    val key: String,
    val type: String,
    val size: Long? = null,
    val metadata: Meta,
    /** The folder it sits in: its name and path. Search results carry them. */
    val parent: String? = null,
    val parentKey: String? = null,
    val place: Found? = null,
) {
    val isFolder get() = type == "folder"
    val title get() = metadata.name ?: key
}

/** `totalSize` comes with the trash only: what emptying it frees. */
@Serializable
data class Page(val list: List<Item>, val nextCursor: String? = null, val totalSize: Long? = null)

@Serializable
data class Drive(val id: String, val name: String, val role: String = "viewer") {
    val canWrite get() = role != "viewer"
}

@Serializable
data class Version(
    val id: String,
    val seq: Int,
    val size: Long,
    val name: String? = null,
    val authorName: String? = null,
    val createdAt: String,
)

@Serializable
data class Versions(val current: Current, val versions: List<Version>) {
    /** The current bytes are `v{nextSeq}`. */
    @Serializable
    data class Current(val size: Long, val updatedAt: String, val nextSeq: Int)
}

/** `ready`, `preparing`, `failed`, or `unavailable` where nothing is rendered. */
@Serializable
data class Rendition(val status: String, val error: String? = null)

@Serializable
private class Transferred(val failCount: Int = 0, val results: List<Result> = emptyList()) {
    @Serializable
    class Result(val success: Boolean = true, val error: String? = null)
}

/** The account's preferences, as the web keeps them; the app applies what it can. */
@Serializable
data class Preferences(
    val accent: String = "bordeaux",
    val layout: String = "list",
    val sortColumn: String? = "updatedAt",
    val sortDirection: String = "desc",
    val fontFamily: String = "sans",
    val corners: String = "rounded",
    val emailNotifications: Boolean = false,
    val listingLoadMode: String = "scroll",
    val versionNaming: String = "sequential",
    /** One of `LANGUAGES`, or null to follow the phone's (the browser's, on the web). */
    val language: String? = null,
    /** Each notification type on each channel, as chosen; `channels` fills in the rest. */
    val notifications: Map<String, Map<String, Boolean>> = emptyMap(),
) {
    val sort get() = Sort(sortColumn ?: "updatedAt", sortDirection)
}

/** A listing's order: `name`, `size`, `updatedAt` or `type`, then `asc` or `desc`. */
data class Sort(val column: String, val direction: String)

/** Every API answer is `{ "data": … }` (`Http.Ok` on the server). */
@Serializable
internal class Envelope<T>(val data: T)

class Unauthorized : Exception("Signed out")

/** The server said no, and why; better-auth adds a `code` (`INVALID_OTP`). */
class Refused(message: String, val code: String? = null, val status: Int = 0) : Exception(message)

@Serializable
private class Refusal(val message: String? = null, val error: String? = null, val code: String? = null)

private fun parseRefusal(body: String) = runCatching { json.decodeFromString<Refusal>(body) }.getOrNull()

/** What an error answer says: `{ "message": … }`, sometimes `{ "error": … }`. */
internal fun refusal(body: String): String? = parseRefusal(body)?.let { it.message ?: it.error }

/**
 * Runs a request; a refusal comes out as the server's own words, not Ktor's
 * dump of the request. `signedOut` turns a 401 into `Unauthorized`.
 */
internal suspend fun <T> answered(signedOut: Boolean = true, block: suspend () -> T): T = try {
    block()
} catch (e: ClientRequestException) {
    if (signedOut && e.response.status == HttpStatusCode.Unauthorized) throw Unauthorized()
    val body = e.response.bodyAsText()
    val status = e.response.status.value
    throw refusal(body)?.let { Refused(it, parseRefusal(body)?.code, status) } ?: Failure(Words(Res.string.server_refused, status))
}

/**
 * Whose tree a request acts on: the account's own drive, a shared one, a
 * mount, or something another account shared (`share`, the grant's id).
 */
data class Place(val drive: String? = null, val volume: String? = null, val share: String? = null)

/** `path` is the folder's path chain, "" for the drive's root. */
internal fun listingUrl(server: String, path: String): String {
    val route = if (path.isEmpty()) "" else "/" + path.split('/').joinToString("/") { it.encodeURLPathPart() }
    return "$server/api/v1/storage/list$route"
}

/** The folder routes take the whole path as one segment, slashes escaped. */
internal fun folderUrl(server: String, path: String): String = "$server/api/v1/storage/folder/${path.encodeURLParameter()}"

/**
 * A folder's path is its parent's plus its own key, the last segment. A
 * folder's key ends in a slash, which a path must not carry: nested, it made
 * `a//b/`, a folder the server has never heard of.
 */
internal fun childPath(parent: String, key: String): String = key.trimEnd('/').let { if (parent.isEmpty()) it else "$parent/$it" }

private fun drive(place: Place) = place.drive?.let { "&drive=${it.encodeURLParameter()}" }
    ?: place.volume?.let { "&volume=${it.encodeURLParameter()}" }
    ?: place.share?.let { "&share=${it.encodeURLParameter()}" }
    ?: ""

/**
 * An earlier version stands in a list as `<file id>:v:<version id>`, as on the
 * web: its bytes and renders come from the versions routes.
 */
internal fun versionId(file: String, version: String) = "$file:v:$version"

private fun versionUrl(server: String, place: Place, id: String, endpoint: String, query: String = ""): String? {
    val parts = id.split(":v:").takeIf { it.size == 2 } ?: return null
    val params = listOf(query, drive(place).removePrefix("&")).filter { it.isNotEmpty() }.joinToString("&")
    return "$server/api/v1/storage/file/${parts[0]}/versions/${parts[1]}/$endpoint" + if (params.isEmpty()) "" else "?$params"
}

/** A file's own bytes, or those of a video's rendition of this height. */
internal fun rawUrl(server: String, place: Place, id: String, rendition: Int? = null) = versionUrl(server, place, id, "raw")
    ?: "$server/api/v1/storage/file/$id?raw=true${drive(place)}${rendition?.let { "&rendition=$it" } ?: ""}"

/** The web app's editor for a document, where the file lives. */
internal fun editUrl(server: String, place: Place, id: String) = "$server/edit/$id" + drive(place).replaceFirst("&", "?")

/** The heights a video can be asked for below its original. */
val RENDITIONS = listOf(720, 480)

/** Its thumbnail, in one of the server's named sizes; `preview` is one to look at. */
internal fun thumbnailUrl(server: String, place: Place, id: String, size: String) = versionUrl(server, place, id, "thumbnail", "size=$size")
    ?: "$server/api/v1/storage/file/$id?thumbnail=true&size=$size${drive(place)}"

internal val json = Json { ignoreUnknownKeys = true }

@Serializable
private class NewFile(val name: String, val size: Long)

@Serializable
private class Created(val metadata: Meta)

/**
 * One `file` part. Written here because Ktor's form writer sends the field as
 * `name=file`, unquoted, which the server's parser does not read as a field:
 * every upload answered "No file provided".
 */
internal fun multipart(boundary: String, name: String, bytes: ByteArray): ByteArray {
    val safe = name.replace("\"", "").replace("\r", "").replace("\n", "")
    val head = "--$boundary\r\nContent-Disposition: form-data; name=\"file\"; filename=\"$safe\"\r\n" +
        "Content-Type: application/octet-stream\r\n\r\n"
    return head.encodeToByteArray() + bytes + "\r\n--$boundary--\r\n".encodeToByteArray()
}

// ponytail: the file is read whole into memory, so it is capped. Stream it
// from a background queue (the spec's upload queue) when real uploads matter.
const val MAX_UPLOAD_BYTES = 200L * 1024 * 1024

class Api(val session: Session, internal val client: HttpClient = httpClient()) {
    internal val base = "${session.server}/api/v1"

    internal fun HttpRequestBuilder.auth(place: Place = Place()) {
        bearerAuth(session.token)
        place.drive?.let { parameter("drive", it) }
        place.volume?.let { parameter("volume", it) }
        place.share?.let { parameter("share", it) }
    }

    internal fun HttpRequestBuilder.fields(vararg fields: Pair<String, Boolean>) {
        contentType(ContentType.Application.Json)
        setBody(JsonObject(fields.associate { (name, value) -> name to JsonPrimitive(value) }))
    }

    internal fun HttpRequestBuilder.text(vararg fields: Pair<String, String?>) {
        contentType(ContentType.Application.Json)
        setBody(JsonObject(fields.filter { it.second != null }.associate { (name, value) -> name to JsonPrimitive(value) }))
    }

    suspend fun list(place: Place, path: String, cursor: String?, sort: Sort? = null): Page = call {
        client.get(listingUrl(session.server, path)) {
            auth(place)
            cursor?.let { parameter("cursor", it) }
            sort?.let {
                parameter("sort", it.column)
                parameter("dir", it.direction)
            }
        }.body<Envelope<Page>>().data
    }

    /** One of the server's categories, every drive the account owns. */
    suspend fun category(name: String, cursor: String?, sort: Sort? = null): Page = call {
        client.get("$base/storage/file/category/${name.encodeURLPathPart()}") {
            auth()
            cursor?.let { parameter("cursor", it) }
            sort?.let {
                parameter("sort", it.column)
                parameter("dir", it.direction)
            }
        }.body<Envelope<Page>>().data
    }

    /** The most recent files; one page, the server sends no cursor. */
    suspend fun recent(): Page = call { client.get("$base/storage/list/recent") { auth() }.body<Envelope<Page>>().data }

    suspend fun starred(cursor: String?): Page = call {
        client.get("$base/storage/file/starred") {
            auth()
            cursor?.let { parameter("cursor", it) }
        }.body<Envelope<Page>>().data
    }

    /** Top-level trashed items; their keys are full paths. */
    suspend fun trash(place: Place, cursor: String?): Page = call {
        client.get("$base/storage/file/trash") {
            auth(place)
            cursor?.let { parameter("cursor", it) }
        }.body<Envelope<Page>>().data
    }

    suspend fun emptyTrash(place: Place) {
        call { client.delete("$base/storage/trash") { auth(place) } }
    }

    /** `path` is the folder's own full path; a file is addressed by its id. */
    suspend fun setTrashed(place: Place, item: Item, path: String, trashed: Boolean) {
        call {
            if (item.isFolder) {
                client.post("${folderUrl(session.server, path)}/${if (trashed) "trash" else "restore"}") {
                    auth(place)
                    fields()
                }
            } else {
                client.put("$base/storage/file/${item.metadata.id}") {
                    auth(place)
                    fields("isTrashed" to trashed)
                }
            }
        }
    }

    suspend fun setStarred(place: Place, item: Item, path: String, starred: Boolean) {
        call {
            val url = if (item.isFolder) folderUrl(session.server, path) else "$base/storage/file/${item.metadata.id}"
            client.put(url) {
                auth(place)
                fields("isStarred" to starred)
            }
        }
    }

    /** For good: the bytes go too. */
    suspend fun delete(place: Place, item: Item, path: String) {
        call {
            val url = if (item.isFolder) folderUrl(session.server, path) else "$base/storage/file/${item.metadata.id}"
            client.delete(url) {
                auth(place)
                fields()
            }
        }
    }

    /** A file is renamed by id, a folder by its path. */
    suspend fun rename(place: Place, item: Item, path: String, name: String) {
        call {
            if (item.isFolder) {
                client.put(folderUrl(session.server, path)) {
                    auth(place)
                    text("name" to name)
                }
            } else {
                client.put("$base/storage/file/${item.metadata.id}") {
                    auth(place)
                    text("key" to name)
                }
            }
        }
    }

    /** `parent` is the folder's path, "" for the root. */
    suspend fun createFolder(place: Place, parent: String, name: String) {
        call {
            client.post("$base/storage/folder") {
                auth(place)
                text("name" to name, "parent" to parent.ifEmpty { null })
            }
        }
    }

    /**
     * Copies or moves one item to `folder` of `to`, which may be another
     * drive. A copy into the folder it is already in is a duplicate.
     */
    suspend fun transfer(from: Place, item: Item, path: String, to: Place, folder: String, move: Boolean) {
        call {
            val done = client.post("$base/storage/transfer") {
                auth(from)
                contentType(ContentType.Application.Json)
                setBody(
                    JsonObject(
                        mapOf(
                            "items" to JsonArray(
                                listOf(JsonObject(mapOf("path" to JsonPrimitive(path), "type" to JsonPrimitive(item.type)))),
                            ),
                            "destination" to JsonObject(
                                buildMap {
                                    to.drive?.let { put("drive", JsonPrimitive(it)) }
                                    put("folder", JsonPrimitive(folder))
                                },
                            ),
                            "mode" to JsonPrimitive(if (move) "move" else "copy"),
                        ),
                    ),
                )
            }.body<Envelope<Transferred>>().data
            if (done.failCount > 0) {
                throw done.results.firstNotNullOfOrNull { it.error }?.let(::Refused) ?: Failure(Words(Res.string.transfer_failed))
            }
        }
    }

    /** Files and folders by name, in every drive and mount the account can open. */
    suspend fun search(query: String): Page = call {
        client.get("$base/search") {
            auth()
            parameter("q", query)
        }.body<Envelope<Page>>().data
    }

    /**
     * Asks for a video's rendition; the server waits up to 20 seconds for it,
     * so calling again while it says `preparing` is the whole protocol.
     */
    suspend fun ensureRendition(place: Place, id: String, height: Int): Rendition = call {
        client.post("$base/storage/file/$id/renditions/$height") {
            auth(place)
            fields()
        }.body<Envelope<Rendition>>().data
    }

    /** A file's bytes, whole: for a viewer that needs all of it, like a PDF's. */
    suspend fun bytes(url: String): ByteArray = call {
        client.get(url) { bearerAuth(session.token) }.body()
    }

    suspend fun drives(): List<Drive> = call { client.get("$base/drives") { auth() }.body<Envelope<List<Drive>>>().data }

    suspend fun versions(place: Place, id: String): Versions = call { client.get("$base/storage/file/$id/versions") { auth(place) }.body<Envelope<Versions>>().data }

    suspend fun restoreVersion(place: Place, id: String, version: String) {
        call {
            client.post("$base/storage/file/$id/versions/$version/restore") {
                auth(place)
                fields()
            }
        }
    }

    /** A track's waveform, up to 400 values in 0..1. Not wrapped in `data`. */
    suspend fun peaks(place: Place, id: String): List<Float> = call {
        // The URL names the drive already; `auth` would add it twice.
        client.get(thumbnailUrl(session.server, place, id, "medium")) { bearerAuth(session.token) }.body()
    }

    suspend fun preferences(): Preferences = call { client.get("$base/preferences") { auth() }.body<Envelope<Preferences>>().data }

    suspend fun setAccent(accent: String) = setPreference("accent", JsonPrimitive(accent))

    /**
     * Preferences by name, spelled out: a whole `Preferences` would drop its
     * defaults from the JSON, and choosing a default would save nothing.
     */
    suspend fun setPreferences(fields: Map<String, JsonElement>): Preferences = call {
        client.put("$base/preferences") {
            auth()
            contentType(ContentType.Application.Json)
            setBody(JsonObject(fields))
        }.body<Envelope<Preferences>>().data
    }

    suspend fun setPreference(name: String, value: JsonPrimitive): Preferences = setPreferences(mapOf(name to value))

    /** The web uploader's two calls: the file's entry, then its bytes. */
    suspend fun upload(place: Place, folder: String, file: PickedFile) {
        call {
            val created = client.post("$base/storage/file") {
                auth(place)
                if (folder.isNotEmpty()) parameter("folder", folder)
                contentType(ContentType.Application.Json)
                setBody(NewFile(file.name, file.size))
            }.body<Envelope<Created>>().data
            val id = created.metadata.id
            try {
                val bytes = withContext(Dispatchers.Default) { file.read() }
                val boundary = "penombre-$id"
                client.post("$base/storage/file/$id/upload") {
                    auth(place)
                    setBody(
                        ByteArrayContent(
                            multipart(boundary, file.name, bytes),
                            ContentType.MultiPart.FormData.withParameter("boundary", boundary),
                        ),
                    )
                }
            } catch (e: Throwable) {
                // The entry without its bytes is a file that opens as nothing.
                withContext(NonCancellable) {
                    runCatching { client.delete("$base/storage/file/$id") { auth(place) } }
                }
                throw e
            }
        }
    }

    suspend fun signOut() {
        runCatching {
            client.post("$base/auth/sign-out") {
                bearerAuth(session.token)
                header("Origin", session.server)
                contentType(ContentType.Application.Json)
                setBody("{}")
            }
        }
    }

    internal suspend fun <T> call(block: suspend () -> T): T = answered(block = block)
}
