package dev.penombre.app

import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import kotlinx.coroutines.launch
import org.jetbrains.compose.resources.stringResource

/** The web editor's address for the app: its chrome left out, in the app's light or dark. */
internal fun embedUrl(server: String, place: Place, id: String, dark: Boolean): String {
    val url = editUrl(server, place, id)
    return url + (if ('?' in url) "&" else "?") + "embed=1&theme=" + if (dark) "dark" else "light"
}

/**
 * A document, sheet or deck in the web app's editor, inside a native screen:
 * the app's header and sky, the page transparent over them. Going back first
 * has the page save what was typed.
 */
@Composable
fun EditorView(host: Host, place: Place, item: Item) {
    val scope = rememberCoroutineScope()
    val controller = remember { WebController() }
    var closing by remember { mutableStateOf(false) }
    var unsaved by remember { mutableStateOf(false) }
    val dark = brand.dark
    val url = remember(item.metadata.id) { embedUrl(host.server, place, item.metadata.id, dark) }
    val leave: () -> Unit = {
        if (!closing) {
            closing = true
            scope.launch {
                if (controller.settle()) host.back() else unsaved = true
                closing = false
            }
        }
    }
    PlatformBack(enabled = LocalShown.current, onBack = leave)
    if (unsaved) {
        Confirm(stringResource(Res.string.editor_unsaved_title), stringResource(Res.string.editor_unsaved_text), stringResource(Res.string.editor_leave), { unsaved = false }) {
            unsaved = false
            host.back()
        }
    }
    Scaffold(
        containerColor = Color.Transparent,
        topBar = { Header(item.title, onBack = leave, compact = true) },
    ) { padding ->
        WebPage(url, host.api.session, Modifier.fillMaxSize().padding(padding), transparent = true, controller = controller)
    }
}
