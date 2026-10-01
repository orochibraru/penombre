package dev.penombre.app

import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.request.HttpRequestBuilder
import io.ktor.client.request.header
import io.ktor.client.request.post
import io.ktor.client.request.setBody
import io.ktor.client.statement.HttpResponse
import io.ktor.http.ContentType
import io.ktor.http.HttpHeaders
import io.ktor.http.URLBuilder
import io.ktor.http.Url
import io.ktor.http.contentType
import io.ktor.http.encodeURLParameter
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
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
        val base = address(server)
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
            ?: throw Failure(Words(Res.string.signin_mismatch))
        val code = url.parameters["code"] ?: throw Failure(Words(Res.string.signin_no_code))
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

    /** Mails a sign-in code; a 403 means the server has that way of signing in off. */
    suspend fun sendCode(server: String, email: String, client: HttpClient = httpClient()) {
        answered(signedOut = false) {
            client.post("${address(server)}/api/v1/auth/email-otp/send-verification-otp") {
                fields("email" to email, "type" to "sign-in")
            }
        }
    }

    /** Signs in with the mailed code: a session, or a two-factor account's challenge. */
    suspend fun signInWithCode(server: String, email: String, otp: String, client: HttpClient = httpClient()): CodeSignIn {
        val base = address(server)
        val answer = answered(signedOut = false) {
            client.post("$base/api/v1/auth/sign-in/email-otp") { fields("email" to email, "otp" to otp) }
        }
        val challenge = cookiesOf(answer).entries.firstOrNull { "two_factor" in it.key }
        if (challenge != null && answer.body<TwoFactorAnswer>().twoFactorRedirect) {
            return CodeSignIn.TwoFactor(base, "${challenge.key}=${challenge.value}")
        }
        return CodeSignIn.Done(signedIn(base, answer))
    }

    /** Answers the challenge with the authenticator's code, or a backup code. */
    suspend fun answerTwoFactor(challenge: CodeSignIn.TwoFactor, code: String, backup: Boolean, client: HttpClient = httpClient()): Session {
        val answer = answered(signedOut = false) {
            client.post("${challenge.server}/api/v1/auth/two-factor/${if (backup) "verify-backup-code" else "verify-totp"}") {
                // The challenge travels as a cookie, so better-auth checks the origin.
                header(HttpHeaders.Cookie, challenge.cookie)
                header("Origin", challenge.server)
                fields("code" to code)
            }
        }
        return signedIn(challenge.server, answer)
    }

    /** The session an answer carries: its token in `set-auth-token`, the web views' cookie beside it. */
    private suspend fun signedIn(server: String, answer: HttpResponse): Session {
        val token = answer.headers["set-auth-token"] ?: throw Failure(Words(Res.string.signin_failed))
        val cookie = cookiesOf(answer).entries.firstOrNull { it.key.endsWith("session_token") && it.value.isNotEmpty() }
        val secure = if (server.startsWith("https://")) "__Secure-" else ""
        pending.clear()
        return Session(
            server,
            token,
            cookie?.key ?: "${secure}better-auth.session_token",
            cookie?.value ?: token.encodeURLParameter(),
            answer.body<SignedIn>().user.name,
        )
    }

    private fun HttpRequestBuilder.fields(vararg values: Pair<String, String>) {
        contentType(ContentType.Application.Json)
        setBody(JsonObject(values.associate { (name, value) -> name to JsonPrimitive(value) }))
    }

    private fun address(server: String) = server.trim().trimEnd('/').let { if ("://" in it) it else "https://$it" }

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

/**
 * The cookies an answer sets, by name. Darwin's engine hands every
 * `Set-Cookie` over as one header joined by commas, so they are split again.
 */
internal fun cookiesOf(answer: HttpResponse): Map<String, String> = answer.headers.getAll(HttpHeaders.SetCookie).orEmpty()
    .flatMap { it.split(Regex(""",\s*(?=[^;,=\s]+=)""")) }
    .associate { it.substringBefore(';').let { pair -> pair.substringBefore('=').trim() to pair.substringAfter('=') } }

/** Where an emailed-code sign-in stands. */
sealed interface CodeSignIn {
    class Done(val session: Session) : CodeSignIn

    /** A two-factor account: `cookie` is better-auth's challenge, to send back with the code. */
    class TwoFactor(val server: String, val cookie: String) : CodeSignIn
}

@Serializable
private class TwoFactorAnswer(val twoFactorRedirect: Boolean = false)

@Serializable
private class SignedIn(val user: TokenResponse.User)

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
