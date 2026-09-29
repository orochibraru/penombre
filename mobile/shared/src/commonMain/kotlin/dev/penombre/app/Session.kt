package dev.penombre.app

import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json

@Serializable
data class Session(
    val server: String,
    val token: String,
    val cookieName: String,
    val cookieValue: String,
    val userName: String,
)

// ponytail: plain app-private prefs; Keychain / Keystore when the Files provider needs a shared credential.
object SessionStore {
    private const val KEY = "session"

    fun load(): Session? = Prefs.get(KEY)?.let { runCatching { Json.decodeFromString<Session>(it) }.getOrNull() }

    fun save(session: Session?) = Prefs.set(KEY, session?.let { Json.encodeToString(it) })
}
