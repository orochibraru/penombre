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

/** A file the person chose; `read` loads its bytes, off the main thread. */
class PickedFile(val name: String, val size: Long, val read: () -> ByteArray)

/** Where an upload can come from. */
enum class Source { Files, Camera, Scan }

/** The sources this device has: no camera on a simulator, for one. */
expect fun availableSources(): List<Source>

/** The system's pickers. Returns what opens one; nothing picked is an empty list. */
@Composable
expect fun rememberFilePicker(onPicked: (List<PickedFile>) -> Unit): (Source) -> Unit

/** Streams one audio or video file with the session; the platform's own player. */
expect class MediaEngine() {
    fun load(url: String, token: String)
    fun play()
    fun pause()
    fun seek(seconds: Double)
    fun stop()

    /** Seconds; zero until the file's length is known. */
    val position: Double
    val duration: Double

    /** A video's width over its height; zero for audio, or until known. */
    val aspect: Float

    /** The player gave up on the file: a format it cannot read, usually. */
    val failed: Boolean
}

/**
 * Where an engine's video shows, fitted whole inside `modifier` at `aspect`
 * (zero until known). No controls: the app draws its own.
 */
@Composable
expect fun VideoSurface(engine: MediaEngine, aspect: Float, modifier: Modifier)

/** Whether this device can read a QR code itself: a simulator has no camera. */
expect fun canScanCodes(): Boolean

/** The system's QR scanner. Returns what opens it; a cancel reads nothing. */
@Composable
expect fun rememberCodeScanner(onCode: (String) -> Unit): () -> Unit

/**
 * Hands a file's bytes to the device: into Downloads on Android, to the share
 * sheet (Save to Files, AirDrop) on iOS. `done` says how it went, in words.
 */
expect fun saveToDevice(url: String, token: String, name: String, done: (String) -> Unit)
