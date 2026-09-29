package dev.penombre.app

import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.plugins.ClientRequestException
import io.ktor.client.plugins.contentnegotiation.ContentNegotiation
import io.ktor.client.request.bearerAuth
import io.ktor.client.request.get
import io.ktor.client.request.header
import io.ktor.client.request.parameter
import io.ktor.client.request.post
import io.ktor.client.request.setBody
import io.ktor.http.ContentType
import io.ktor.http.HttpStatusCode
import io.ktor.http.contentType
import io.ktor.http.encodeURLPathPart
import io.ktor.serialization.kotlinx.json.json
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json

fun httpClient() = HttpClient {
    expectSuccess = true
    install(ContentNegotiation) { json(Json { ignoreUnknownKeys = true }) }
}

@Serializable
data class Meta(val id: String, val name: String? = null, val category: String? = null)

@Serializable
data class Item(val key: String, val type: String, val size: Long? = null, val metadata: Meta) {
    val isFolder get() = type == "folder"
    val title get() = metadata.name ?: key
}

@Serializable
data class Page(val list: List<Item>, val nextCursor: String? = null)

class Unauthorized : Exception("Signed out")

class Api(private val session: Session) {
    private val client = httpClient()

    /** `path` is the folder's path chain, "" for the drive's root. */
    suspend fun list(path: String, cursor: String?): Page = call {
        val route = if (path.isEmpty()) "" else "/" + path.split('/').joinToString("/") { it.encodeURLPathPart() }
        client.get("${session.server}/api/v1/storage/list$route") {
            bearerAuth(session.token)
            cursor?.let { parameter("cursor", it) }
        }.body()
    }

    suspend fun signOut() {
        runCatching {
            client.post("${session.server}/api/v1/auth/sign-out") {
                bearerAuth(session.token)
                header("Origin", session.server)
                contentType(ContentType.Application.Json)
                setBody("{}")
            }
        }
    }

    private suspend fun <T> call(block: suspend () -> T): T = try {
        block()
    } catch (e: ClientRequestException) {
        if (e.response.status == HttpStatusCode.Unauthorized) throw Unauthorized() else throw e
    }
}
