package dev.penombre.app

import io.ktor.client.call.body
import io.ktor.client.request.post
import io.ktor.client.request.setBody
import io.ktor.http.ContentType
import io.ktor.http.URLBuilder
import io.ktor.http.Url
import io.ktor.http.contentType
import kotlin.io.encoding.Base64
import kotlin.uuid.Uuid
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.serialization.Serializable

private val base64url = Base64.UrlSafe.withPadding(Base64.PaddingOption.ABSENT)

fun pkceChallenge(verifier: String): String = base64url.encode(sha256(verifier.encodeToByteArray()))

/** Authorization code grant with PKCE; the server answers with a regular session. */
object Auth {
    private class Pending(val server: String, val verifier: String, val state: String)

    private var pending: Pending? = null

    /** The `penombre://auth?…` URL the platform received, if any. */
    val callbacks = MutableStateFlow<String?>(null)

    fun start(server: String) {
        val base = server.trim().trimEnd('/').let { if ("://" in it) it else "https://$it" }
        // Uuid.random() is backed by a CSPRNG on every platform.
        val verifier = Uuid.random().toHexString() + Uuid.random().toHexString()
        val state = Uuid.random().toHexString()
        pending = Pending(base, verifier, state)
        val url = URLBuilder("$base/auth/mobile/authorize").apply {
            parameters.append("code_challenge", pkceChallenge(verifier))
            parameters.append("state", state)
            parameters.append("redirect_uri", "penombre://auth")
            parameters.append("device", deviceName)
        }.buildString()
        openAuthBrowser(url)
    }

    suspend fun complete(callback: String): Session {
        val request = pending ?: error("No sign-in in progress.")
        val url = Url(callback)
        check(url.parameters["state"] == request.state) { "Sign-in answer did not match the request." }
        val code = url.parameters["code"] ?: error("The server sent no code.")
        pending = null

        val token: TokenResponse = httpClient().post("${request.server}/api/v1/mobile/token") {
            contentType(ContentType.Application.Json)
            setBody(TokenRequest(code, request.verifier))
        }.body()
        return Session(request.server, token.token, token.cookie.name, token.cookie.value, token.user.name)
    }
}

@Serializable
private data class TokenRequest(val code: String, val code_verifier: String)

@Serializable
private data class TokenResponse(val token: String, val cookie: Cookie, val user: User) {
    @Serializable
    data class Cookie(val name: String, val value: String)

    @Serializable
    data class User(val name: String)
}
