package dev.penombre.app

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier

expect fun sha256(bytes: ByteArray): ByteArray

expect val deviceName: String

/** Opens the sign-in page in the system browser; the redirect lands in [Auth.callbacks]. */
expect fun openAuthBrowser(url: String)

/** Small key-value store for the session. */
expect object Prefs {
    fun get(key: String): String?
    fun set(key: String, value: String?)
}

/** The instance's own web UI, signed in with the app's session cookie. */
@Composable
expect fun WebPage(url: String, session: Session, modifier: Modifier)

@Composable
expect fun PlatformBack(enabled: Boolean, onBack: () -> Unit)
