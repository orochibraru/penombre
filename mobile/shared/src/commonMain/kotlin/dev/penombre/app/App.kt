package dev.penombre.app

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.navigationBars
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBars
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Logout
import androidx.compose.material.icons.filled.Language
import androidx.compose.material.icons.filled.Menu
import androidx.compose.material.icons.outlined.Delete
import androidx.compose.material.icons.outlined.Folder
import androidx.compose.material.icons.outlined.FolderShared
import androidx.compose.material.icons.outlined.Group
import androidx.compose.material.icons.outlined.History
import androidx.compose.material.icons.outlined.Settings
import androidx.compose.material.icons.outlined.StarBorder
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.key
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.layout
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.flow.filterNotNull
import kotlinx.coroutines.launch

@Composable
fun App() {
    // The account's accent, remembered so the first frame is already in it.
    var accent by remember { mutableStateOf(Prefs.get("accent") ?: "bordeaux") }
    val setAccent: (String) -> Unit = {
        accent = it
        Prefs.set("accent", it)
    }
    PenombreTheme(accent) {
        var session by remember { mutableStateOf(SessionStore.load()) }
        var error by remember { mutableStateOf<String?>(null) }
        // A scanned code waits for a yes: a link alone must not sign the app in.
        var pairing by remember { mutableStateOf<Pairing?>(null) }
        val scope = rememberCoroutineScope()
        val signedIn: (Session) -> Unit = {
            SessionStore.save(it)
            Prefs.set("server", it.server)
            session = it
            error = null
        }
        // One collector for the app's life. Keyed on the callback itself, the
        // effect restarted when it cleared the value and cancelled its own
        // token request.
        LaunchedEffect(Unit) {
            Auth.callbacks.filterNotNull().collect { url ->
                Auth.callbacks.value = null
                val scanned = Auth.pairing(url)
                if (scanned != null) {
                    // Already signed in: the code is for a phone that is not.
                    if (session == null) pairing = scanned
                    return@collect
                }
                try {
                    signedIn(Auth.complete(url))
                } catch (e: CancellationException) {
                    throw e
                } catch (e: Exception) {
                    error = e.message ?: "Sign-in failed."
                }
            }
        }

        val current = session
        if (current == null) {
            SignIn(
                error,
                onCode = { text ->
                    pairing = Auth.pairing(text)
                    error = if (pairing == null) "That is not a Penombre sign-in code." else null
                },
            ) {
                error = null
                Prefs.set("server", it.trim())
                Auth.start(it)
            }
            pairing?.let { asked ->
                AlertDialog(
                    onDismissRequest = { pairing = null },
                    containerColor = brand.panel,
                    title = { Text("Sign in to ${asked.host}?") },
                    text = { Text("This phone will use the account that showed the code.") },
                    confirmButton = {
                        TextButton(onClick = {
                            pairing = null
                            scope.launch {
                                try {
                                    signedIn(Auth.pair(asked))
                                } catch (e: CancellationException) {
                                    throw e
                                } catch (e: Exception) {
                                    // A code is refused once used or two minutes old.
                                    error = "That code no longer works. Show a new one and scan it again."
                                }
                            }
                        }) { Text("Connect", color = brand.accent) }
                    },
                    dismissButton = { TextButton(onClick = { pairing = null }) { Text("Cancel", color = brand.muted) } },
                )
            }
        } else {
            Signed(current, accent, setAccent) {
                SessionStore.save(null)
                session = null
            }
        }
    }
}

/**
 * Scanning the web app's code is the way in: it names the server and signs in
 * at once. Typing the address is kept behind a link, for a device with no
 * camera or a server reached some other way.
 */
@Composable
private fun SignIn(error: String?, onCode: (String) -> Unit, onSubmit: (String) -> Unit) {
    val scans = remember { canScanCodes() }
    val scan = rememberCodeScanner(onCode)
    // Saveable: a recreated activity must not wipe a half-typed address.
    var server by rememberSaveable { mutableStateOf(Prefs.get("server") ?: "") }
    var typing by rememberSaveable { mutableStateOf(!scans) }
    val submit = { if (server.isNotBlank()) onSubmit(server) }
    Column(
        // Above the keyboard: centred on the whole screen, the button sat under it.
        Modifier.fillMaxSize().windowInsetsPadding(WindowInsets.statusBars).imePadding().padding(horizontal = 28.dp),
        verticalArrangement = Arrangement.Center,
    ) {
        Moon(72.dp)
        Spacer(Modifier.height(20.dp))
        Text(
            "Penombre",
            style = TextStyle(brush = brand.gradient, fontSize = 40.sp, fontWeight = FontWeight.SemiBold, letterSpacing = (-1).sp),
        )
        Text(
            "Your files, on your own server.",
            style = MaterialTheme.typography.bodyLarge,
            color = brand.muted,
        )
        Spacer(Modifier.height(36.dp))
        if (scans) {
            GradientButton("Scan the code", enabled = true, onClick = scan)
            Spacer(Modifier.height(12.dp))
            Text(
                "On your server's web page, open the profile menu, choose Get the apps, then Connect the mobile app.",
                style = MaterialTheme.typography.bodyMedium,
                color = brand.muted,
            )
        }
        error?.let {
            Spacer(Modifier.height(10.dp))
            Text(it, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodyMedium)
        }
        if (typing) {
            Spacer(Modifier.height(if (scans) 28.dp else 0.dp))
            OutlinedTextField(
                value = server,
                onValueChange = { server = it },
                label = { Text("Server address") },
                placeholder = { Text("https://files.example.com") },
                singleLine = true,
                // The keyboard's own key signs in too.
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Uri, imeAction = ImeAction.Go),
                keyboardActions = KeyboardActions(onGo = { submit() }),
                shape = Corner,
                colors = OutlinedTextFieldDefaults.colors(
                    focusedContainerColor = brand.panel.copy(alpha = 0.6f),
                    unfocusedContainerColor = brand.panel.copy(alpha = 0.6f),
                ),
                modifier = Modifier.fillMaxWidth(),
            )
            Spacer(Modifier.height(16.dp))
            if (scans) {
                TextButton(enabled = server.isNotBlank(), onClick = submit, modifier = Modifier.fillMaxWidth()) {
                    Text("Sign in", color = brand.accent)
                }
            } else {
                GradientButton("Sign in", enabled = server.isNotBlank(), onClick = submit)
            }
        } else {
            Spacer(Modifier.height(20.dp))
            TextButton(onClick = { typing = true }, modifier = Modifier.fillMaxWidth()) {
                Text("Enter the server address instead", color = brand.muted)
            }
        }
    }
}

// The web app's own bar: the same four, in the same order.
private enum class Tab(val label: String, val icon: ImageVector) {
    Home("Home", Icons.Outlined.Folder),
    Recent("Recent", Icons.Outlined.History),
    Starred("Starred", Icons.Outlined.StarBorder),
    Menu("Menu", Icons.Default.Menu),
}

@Composable
private fun Signed(session: Session, accent: String, onAccent: (String) -> Unit, onSignedOut: () -> Unit) {
    val api = remember(session) { Api(session) }
    val scope = rememberCoroutineScope()
    val playback = remember(session) { Playback(session) }
    // What is pushed over the tabs; the last one shows.
    val screens = remember { mutableStateListOf<Screen>() }
    var tab by rememberSaveable { mutableStateOf(Tab.Home) }
    // Bumped on every tab tap: the tab starts over, so Home is the drive's root.
    var tapped by remember { mutableStateOf(0) }

    val screening = remember(session) { Screening(session) }
    var preview by remember { mutableStateOf<Preview?>(null) }

    val leave: () -> Unit = {
        playback.stop()
        screening.close()
        onSignedOut()
    }
    lateinit var host: Host
    host = Host(
        api = api,
        push = { screens.add(it) },
        back = { if (screens.isNotEmpty()) screens.removeAt(screens.lastIndex) },
        play = playback::start,
        preview = { place, siblings, item -> preview = Preview(place, siblings, item) },
        screening = screening,
        signedOut = leave,
        bar = {
            Column {
                MiniPlayer(playback, host)
                // From inside a pushed screen too: a tab is always one tap away.
                BottomBar(tab) {
                    screens.clear()
                    tab = it
                    tapped++
                }
            }
        },
    )

    // The one video in play is whichever the drawer or the full screen shows;
    // going from the first to the second is the same video, so it plays on.
    val top = screens.lastOrNull() as? VideoScreen
    val watching = preview?.takeIf { it.isVideo }?.let { it.place to it.item } ?: top?.let { it.place to it.item }
    LaunchedEffect(watching?.second?.metadata?.id) {
        if (watching == null) {
            screening.close()
        } else {
            // One sound at a time: a video takes over from a track.
            playback.stop()
            screening.open(watching.first, watching.second)
        }
    }
    LaunchedEffect(screening) { screening.follow() }
    DisposableEffect(screening) { onDispose { screening.close() } }
    LaunchedEffect(playback) { playback.follow() }
    DisposableEffect(playback) { onDispose { playback.stop() } }
    // The account's accent, which the web interface may have changed since.
    LaunchedEffect(api) { host.attempt { onAccent(api.preferences().accent) } }

    PlatformBack(enabled = screens.isNotEmpty() || tab != Tab.Home) {
        if (screens.isNotEmpty()) host.back() else tab = Tab.Home
    }

    // Every screen under the top one stays alive, unseen: coming back from a
    // viewer must find the folder, the list and the scroll as they were left.
    Layer(screens.isEmpty()) {
        key(tapped) {
            Tabs(host, tab) {
                scope.launch {
                    api.signOut()
                    leave()
                }
            }
        }
    }
    screens.forEachIndexed { index, screen ->
        key(index, screen) {
            Layer(index == screens.lastIndex) {
                when (screen) {
                    is WebScreen -> Scaffold(
                        // A solid bar: the page under it brings its own background.
                        containerColor = brand.ground,
                        topBar = { Header("Penombre", onBack = host.back, compact = true) },
                    ) { WebPage(screen.url, session, Modifier.fillMaxSize().padding(it)) }

                    is TrashScreen -> TrashView(host, screen.place)

                    DrivesScreen -> DrivesView(host)

                    is DriveScreen -> DriveView(host, screen.drive)

                    is PhotoScreen -> PhotoView(host, screen.place, screen.photos, screen.index)

                    is VideoScreen -> VideoView(host)

                    is VersionsScreen -> VersionsView(host, screen.place, screen.item)

                    SettingsScreen -> SettingsView(host, accent, onAccent)

                    SearchScreen -> SearchView(host)

                    is PdfScreen -> PdfView(host, screen.place, screen.item)
                }
            }
        }
    }
    preview?.let { PreviewSheet(it, host) { preview = null } }
}

/** A screen in the stack; only the top one is placed, so drawn and touched. */
@Composable
private fun Layer(shown: Boolean, content: @Composable () -> Unit) {
    CompositionLocalProvider(LocalShown provides shown) {
        Box(
            Modifier.fillMaxSize().layout { measurable, constraints ->
                val placeable = measurable.measure(constraints)
                layout(placeable.width, placeable.height) { if (shown) placeable.place(0, 0) }
            },
        ) { content() }
    }
}

@Composable
private fun Tabs(host: Host, tab: Tab, onSignOut: () -> Unit) {
    val bar = host.bar
    val personal = Place()
    // Outside Home a folder opens on the web: those lists carry its id, not
    // the path the native listing needs.
    val row: @Composable (Item, List<Item>) -> Unit = { item, all ->
        ItemEntry(item, personal, host) {
            if (item.isFolder) host.push(WebScreen("${host.server}/go/folder/${item.metadata.id}")) else host.open(personal, all, item)
        }
    }
    when (tab) {
        Tab.Home -> Browser(host, personal, "My Drive", bottomBar = bar)

        else -> Scaffold(
            containerColor = Color.Transparent,
            topBar = { Header(tab.label, onBack = null) },
            bottomBar = bar,
        ) { padding ->
            val modifier = Modifier.padding(padding)
            when (tab) {
                Tab.Recent -> Listing(Tab.Recent, "Nothing recent", modifier, host, { host.api.recent() }, row = row)
                Tab.Starred -> Listing(Tab.Starred, "Nothing starred", modifier, host, { host.api.starred(it) }, row = row)
                else -> Menu(host, modifier, onSignOut)
            }
        }
    }
}

/** Floats over the sky, inset from the edges; the accent marks where you are. */
@Composable
private fun BottomBar(current: Tab, onSelect: (Tab) -> Unit) {
    val shape = RoundedCornerShape(28.dp)
    Row(
        Modifier.windowInsetsPadding(WindowInsets.navigationBars).padding(horizontal = 16.dp, vertical = 10.dp)
            .fillMaxWidth().shadow(18.dp, shape, ambientColor = brand.glow, spotColor = brand.glow)
            .clip(shape).background(brand.panel.copy(alpha = 0.94f))
            .border(1.dp, brand.muted.copy(alpha = 0.18f), shape)
            .padding(horizontal = 8.dp, vertical = 8.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
    ) {
        Tab.entries.forEach { entry ->
            val selected = entry == current
            val tint = if (selected) brand.accent else brand.muted
            Column(
                Modifier.weight(1f).clip(RoundedCornerShape(20.dp))
                    .selectable(selected, role = Role.Tab) { onSelect(entry) }
                    .padding(vertical = 6.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                Box(
                    Modifier.clip(RoundedCornerShape(14.dp))
                        .background(if (selected) brand.accent.copy(alpha = 0.16f) else Color.Transparent)
                        .padding(horizontal = 18.dp, vertical = 4.dp),
                ) { Icon(entry.icon, null, tint = tint) }
                Text(
                    entry.label,
                    color = tint,
                    style = MaterialTheme.typography.labelMedium,
                    fontWeight = if (selected) FontWeight.SemiBold else FontWeight.Normal,
                )
            }
        }
    }
}

@Composable
private fun Menu(host: Host, modifier: Modifier, onSignOut: () -> Unit) {
    val session = host.api.session
    LazyColumn(modifier.fillMaxSize()) {
        item {
            Row(Modifier.padding(horizontal = 20.dp, vertical = 12.dp), verticalAlignment = Alignment.CenterVertically) {
                Box(
                    Modifier.size(52.dp).clip(CircleShape).background(brand.gradient),
                    contentAlignment = Alignment.Center,
                ) {
                    Text(
                        initials(session.userName),
                        color = Color.White,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.SemiBold,
                    )
                }
                Spacer(Modifier.width(14.dp))
                Column {
                    Text(session.userName, color = brand.ink, style = MaterialTheme.typography.titleMedium)
                    Text(session.server, color = brand.muted, style = MaterialTheme.typography.bodySmall)
                }
            }
            HorizontalDivider(Modifier.padding(horizontal = 20.dp, vertical = 8.dp))
            Entry(Icons.Outlined.Group, "Shared drives") { host.push(DrivesScreen) }
            Entry(Icons.Outlined.Delete, "Trash") { host.push(TrashScreen(Place())) }
            Entry(Icons.Outlined.Settings, "Settings") { host.push(SettingsScreen) }
            HorizontalDivider(Modifier.padding(horizontal = 20.dp, vertical = 8.dp))
            // No native screen yet: these open in the web interface.
            Entry(Icons.Outlined.FolderShared, "Shared with me", "On the web interface", tint = brand.muted) {
                host.push(WebScreen("${host.server}/shared-with-me"))
            }
            Entry(Icons.Default.Language, "Open web app", tint = brand.muted) { host.push(WebScreen("${host.server}/")) }
            HorizontalDivider(Modifier.padding(horizontal = 20.dp, vertical = 8.dp))
            Entry(Icons.AutoMirrored.Filled.Logout, "Sign out", tint = brand.muted, onClick = onSignOut)
        }
    }
}
