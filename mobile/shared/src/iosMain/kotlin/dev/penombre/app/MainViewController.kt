package dev.penombre.app

import androidx.compose.ui.window.ComposeUIViewController

fun MainViewController() = ComposeUIViewController { App() }

/** A `penombre://` link the system handed the app: a scanned pairing code. */
fun openLink(url: String) {
    Auth.callbacks.value = url
}
