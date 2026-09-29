package dev.penombre.app

import androidx.compose.foundation.clickable
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.InsertDriveFile
import androidx.compose.material.icons.filled.Folder
import androidx.compose.material.icons.filled.Language
import androidx.compose.material.icons.filled.Logout
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.ListItem
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.derivedStateOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.launch

// Bordeaux, the web app's default accent (app.css).
private val light = lightColorScheme(primary = Color(0xFF911F43))
private val dark = darkColorScheme(primary = Color(0xFFD8516A))

private val VIEWABLE = setOf("IMAGES", "VIDEO", "MUSIC")

@Composable
fun App() {
    MaterialTheme(colorScheme = if (isSystemInDarkTheme()) dark else light) {
        var session by remember { mutableStateOf(SessionStore.load()) }
        var error by remember { mutableStateOf<String?>(null) }
        val callback by Auth.callbacks.collectAsState()

        LaunchedEffect(callback) {
            val url = callback ?: return@LaunchedEffect
            Auth.callbacks.value = null
            runCatching { Auth.complete(url) }
                .onSuccess { SessionStore.save(it); session = it; error = null }
                .onFailure { error = it.message ?: "Sign-in failed." }
        }

        val current = session
        if (current == null) {
            SignIn(error) { error = null; Auth.start(it) }
        } else {
            Signed(current) { SessionStore.save(null); session = null }
        }
    }
}

@Composable
private fun SignIn(error: String?, onSubmit: (String) -> Unit) {
    var server by remember { mutableStateOf(Prefs.get("server") ?: "") }
    Column(
        Modifier.fillMaxSize().padding(24.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp, Alignment.CenterVertically),
    ) {
        Text("Penombre", style = MaterialTheme.typography.headlineLarge, color = MaterialTheme.colorScheme.primary)
        OutlinedTextField(
            value = server,
            onValueChange = { server = it },
            label = { Text("Server address") },
            placeholder = { Text("https://files.example.com") },
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
        )
        error?.let { Text(it, color = MaterialTheme.colorScheme.error) }
        Button(
            onClick = { Prefs.set("server", server.trim()); onSubmit(server) },
            enabled = server.isNotBlank(),
            modifier = Modifier.fillMaxWidth(),
        ) { Text("Sign in") }
    }
}

private data class Folder(val path: String, val title: String)

@Composable
private fun Signed(session: Session, onSignedOut: () -> Unit) {
    val api = remember(session) { Api(session) }
    val scope = rememberCoroutineScope()
    val stack = remember { mutableStateListOf(Folder("", "My Drive")) }
    var web by remember { mutableStateOf<String?>(null) }

    val signOut: () -> Unit = { scope.launch { api.signOut(); onSignedOut() } }

    PlatformBack(enabled = web != null || stack.size > 1) {
        if (web != null) web = null else stack.removeAt(stack.lastIndex)
    }

    val page = web
    if (page != null) {
        Chrome(title = "Penombre", onBack = { web = null }) {
            WebPage(page, session, Modifier.fillMaxSize().padding(it))
        }
        return
    }

    val folder = stack.last()
    Chrome(
        title = folder.title,
        onBack = if (stack.size > 1) ({ stack.removeAt(stack.lastIndex) }) else null,
        actions = {
            IconButton(onClick = { web = session.server + "/" }) { Icon(Icons.Default.Language, "Open web app") }
            IconButton(onClick = signOut) { Icon(Icons.Default.Logout, "Sign out") }
        },
    ) { padding ->
        Listing(api, folder, Modifier.padding(padding), onUnauthorized = onSignedOut) { item ->
            if (item.isFolder) {
                val child = if (folder.path.isEmpty()) item.key else "${folder.path}/${item.key}"
                stack.add(Folder(child, item.title))
            } else {
                val id = item.metadata.id
                web = if (item.metadata.category in VIEWABLE) {
                    "${session.server}/view/$id"
                } else {
                    "${session.server}/api/v1/storage/file/$id?raw=true"
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun Chrome(
    title: String,
    onBack: (() -> Unit)?,
    actions: @Composable () -> Unit = {},
    content: @Composable (androidx.compose.foundation.layout.PaddingValues) -> Unit,
) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(title, maxLines = 1, overflow = TextOverflow.Ellipsis) },
                navigationIcon = {
                    onBack?.let { IconButton(onClick = it) { Icon(Icons.AutoMirrored.Filled.ArrowBack, "Back") } }
                },
                actions = { actions() },
            )
        },
        content = content,
    )
}

@Composable
private fun Listing(
    api: Api,
    folder: Folder,
    modifier: Modifier,
    onUnauthorized: () -> Unit,
    onOpen: (Item) -> Unit,
) {
    val items = remember(folder) { mutableStateListOf<Item>() }
    var cursor by remember(folder) { mutableStateOf<String?>(null) }
    var done by remember(folder) { mutableStateOf(false) }
    var loading by remember(folder) { mutableStateOf(false) }
    var error by remember(folder) { mutableStateOf<String?>(null) }
    val list = rememberLazyListState()
    val nearEnd by remember { derivedStateOf { (list.layoutInfo.visibleItemsInfo.lastOrNull()?.index ?: 0) >= items.size - 10 } }

    LaunchedEffect(folder, nearEnd, done, loading) {
        if (done || loading || !nearEnd) return@LaunchedEffect
        loading = true
        try {
            val page = api.list(folder.path, cursor)
            items.addAll(page.list)
            cursor = page.nextCursor
            done = page.nextCursor == null
        } catch (e: Unauthorized) {
            onUnauthorized()
        } catch (e: Exception) {
            error = e.message
            done = true
        } finally {
            loading = false
        }
    }

    Box(modifier.fillMaxSize()) {
        LazyColumn(state = list, modifier = Modifier.fillMaxSize()) {
            items(items, key = { it.metadata.id }) { item ->
                ListItem(
                    headlineContent = { Text(item.title, maxLines = 1, overflow = TextOverflow.Ellipsis) },
                    supportingContent = item.size?.takeIf { !item.isFolder }?.let { { Text(formatSize(it)) } },
                    leadingContent = {
                        Icon(
                            if (item.isFolder) Icons.Default.Folder else Icons.AutoMirrored.Filled.InsertDriveFile,
                            null,
                            tint = MaterialTheme.colorScheme.primary,
                        )
                    },
                    modifier = Modifier.clickable { onOpen(item) },
                )
            }
        }
        when {
            loading && items.isEmpty() -> CircularProgressIndicator(Modifier.align(Alignment.Center))
            error != null -> Text(error!!, Modifier.align(Alignment.Center).padding(24.dp), color = MaterialTheme.colorScheme.error)
            done && items.isEmpty() -> Text("Empty folder", Modifier.align(Alignment.Center))
        }
    }
}

private fun formatSize(bytes: Long): String {
    val units = listOf("B", "KB", "MB", "GB", "TB")
    var value = bytes.toDouble()
    var unit = 0
    while (value >= 1024 && unit < units.lastIndex) {
        value /= 1024
        unit++
    }
    return if (unit == 0) "$bytes B" else "${(value * 10).toLong() / 10.0} ${units[unit]}"
}
