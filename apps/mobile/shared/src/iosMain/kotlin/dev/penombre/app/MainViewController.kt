package dev.penombre.app

import androidx.compose.ui.window.ComposeUIViewController

// Swift calls it by this name.
@Suppress("ktlint:standard:function-naming")
fun MainViewController() = ComposeUIViewController { App() }

/** A `penombre://` link the system handed the app: a scanned pairing code. */
fun openLink(url: String) {
    Auth.callbacks.value = url
}

/** At launch, before it finishes: where notifications are checked in the background. */
fun registerNoticeChecks() = registerChecks()
