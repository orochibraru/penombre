package dev.penombre.app

import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.request.post
import io.ktor.client.request.setBody
import io.ktor.http.ContentType
import io.ktor.http.URLBuilder
import io.ktor.http.Url
import io.ktor.http.contentType
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.serialization.Serializable
import kotlin.io.encoding.Base64
import kotlin.uuid.Uuid

private val base64url = Base64.UrlSafe.withPadding(Base64.PaddingOption.ABSENT)

fun pkceChallenge(verifier: String): String = base64url.encode(sha256(verifier.encodeToByteArray()))

/** Authorization code grant with PKCE; the server answers with a regular session. */
object Auth {
    internal class Pending(val server: String, val verifier: String)

    internal class Claim(val server: String, val verifier: String, val code: String)

    // Every attempt in flight, by its `state`. One slot was not enough: a
    // second tap on Sign in replaced the first attempt while its browser sheet
    // was the one on screen, and its answer was then refused.
    private val pending = mutableMapOf<String, Pending>()

    /** The `penombre://auth?…` URL the platform received, if any. */
    val callbacks = MutableStateFlow<String?>(null)

    /** Records a new attempt and returns the page to open in the browser. */
    internal fun begin(server: String, device: String): String {
        val base = server.trim().trimEnd('/').let { if ("://" in it) it else "https://$it" }
        // Uuid.random() is backed by a CSPRNG on every platform.
        val verifier = Uuid.random().toHexString() + Uuid.random().toHexString()
        val state = Uuid.random().toHexString()
        pending[state] = Pending(base, verifier)
        return URLBuilder("$base/auth/mobile/authorize").apply {
            parameters.append("code_challenge", pkceChallenge(verifier))
            parameters.append("state", state)
            parameters.append("redirect_uri", "penombre://auth")
            parameters.append("device", device)
        }.buildString()
    }

    /** Matches a redirect to the attempt that asked for it; each answers once. */
    internal fun claim(callback: String): Claim {
        val url = Url(callback)
        val request = url.parameters["state"]?.let(pending::remove)
            ?: error("Sign-in answer did not match the request.")
        val code = url.parameters["code"] ?: error("The server sent no code.")
        return Claim(request.server, request.verifier, code)
    }

    fun start(server: String) = openAuthBrowser(begin(server, deviceName))

    /**
     * What a pairing link or QR code says, or null when it is not one. The
     * web app makes it (profile menu, Connect the mobile app); a link naming
     * anything but an http(s) server is refused.
     */
    fun pairing(link: String): Pairing? {
        val url = runCatching { Url(link) }.getOrNull() ?: return null
        if (url.protocol.name != "penombre" || url.host != "pair") return null
        val server = url.parameters["server"]?.trimEnd('/') ?: return null
        val code = url.parameters["code"]?.takeIf { it.isNotBlank() } ?: return null
        if (!server.startsWith("https://") && !server.startsWith("http://")) return null
        return Pairing(server, code)
    }

    /** Trades the code for a session: no browser, the code is the proof. */
    suspend fun pair(pairing: Pairing, device: String = deviceName, client: HttpClient = httpClient()): Session {
        val token = client.post("${pairing.server}/api/v1/mobile/token") {
            contentType(ContentType.Application.Json)
            setBody(PairRequest(pairing.code, device))
        }.body<Envelope<TokenResponse>>().data
        pending.clear()
        return Session(pairing.server, token.token, token.cookie.name, token.cookie.value, token.user.name)
    }

    suspend fun complete(callback: String): Session {
        val claim = claim(callback)
        val token = httpClient().post("${claim.server}/api/v1/mobile/token") {
            contentType(ContentType.Application.Json)
            setBody(TokenRequest(claim.code, claim.verifier))
        }.body<Envelope<TokenResponse>>().data
        // Signed in: whatever else was started is abandoned.
        pending.clear()
        return Session(claim.server, token.token, token.cookie.name, token.cookie.value, token.user.name)
    }
}

/** A server and the single-use code that signs in to it. */
data class Pairing(val server: String, val code: String) {
    /** The server as a person reads it, for the question asked before signing in. */
    val host get() = server.substringAfter("://")
}

@Serializable
private data class PairRequest(val code: String, val device: String)

@Serializable
private data class TokenRequest(val code: String, val code_verifier: String)

@Serializable
internal data class TokenResponse(val token: String, val cookie: Cookie, val user: User) {
    @Serializable
    data class Cookie(val name: String, val value: String)

    @Serializable
    data class User(val name: String)
}
