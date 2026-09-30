package dev.penombre.app

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.gestures.rememberTransformableState
import androidx.compose.foundation.gestures.transformable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBars
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.MoreVert
import androidx.compose.material.icons.outlined.CheckCircle
import androidx.compose.material.icons.outlined.Delete
import androidx.compose.material.icons.outlined.DeleteForever
import androidx.compose.material.icons.outlined.Group
import androidx.compose.material.icons.outlined.History
import androidx.compose.material.icons.outlined.Language
import androidx.compose.material.icons.outlined.PlayCircle
import androidx.compose.material.icons.outlined.RestoreFromTrash
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

/** A place's trash: what was removed, to put back or to delete for good. */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TrashView(host: Host, place: Place) {
    val scope = rememberCoroutineScope()
    var refresh by remember { mutableIntStateOf(0) }
    var size by remember { mutableStateOf<Long?>(null) }
    var selected by remember { mutableStateOf<Item?>(null) }
    var deleting by remember { mutableStateOf<Item?>(null) }
    var emptying by remember { mutableStateOf(false) }
    var status by remember { mutableStateOf<String?>(null) }

    fun act(block: suspend () -> Unit) {
        scope.launch {
            host.attempt({ status = it }) {
                block()
                status = null
                refresh++
            }
        }
    }

    selected?.let { item ->
        ModalBottomSheet(onDismissRequest = { selected = null }, containerColor = brand.panel) {
            SheetTitle(item.title)
            Entry(Icons.Outlined.RestoreFromTrash, "Restore", "Puts it back where it was") {
                selected = null
                // A trashed item's key is its full path.
                act { host.api.setTrashed(place, item, item.key, false) }
            }
            Entry(Icons.Outlined.DeleteForever, "Delete forever", tint = MaterialTheme.colorScheme.error) {
                selected = null
                deleting = item
            }
            Spacer(Modifier.height(24.dp))
        }
    }
    deleting?.let { item ->
        Confirm("Delete ${item.title} forever?", "This cannot be undone.", "Delete forever", { deleting = null }) {
            deleting = null
            act { host.api.delete(place, item, item.key) }
        }
    }
    if (emptying) {
        Confirm(
            "Empty the trash?",
            "Everything in it is deleted forever${size?.let { ", freeing ${formatSize(it)}" } ?: ""}.",
            "Empty trash",
            { emptying = false },
        ) {
            emptying = false
            act { host.api.emptyTrash(place) }
        }
    }

    Scaffold(
        containerColor = Color.Transparent,
        topBar = {
            Header("Trash", onBack = host.back) {
                // Nothing to empty until a page says there is something.
                if ((size ?: 0) > 0) TextButton(onClick = { emptying = true }) { Text("Empty", color = brand.accent) }
            }
        },
        bottomBar = host.bar,
    ) { padding ->
        Column(Modifier.padding(padding)) {
            status?.let { Note(it, colour = MaterialTheme.colorScheme.error) }
            Listing(
                source = place to refresh,
                empty = "The trash is empty",
                modifier = Modifier,
                host = host,
                load = { host.api.trash(place, it) },
                onPage = { size = it.totalSize },
            ) { item, _ ->
                ItemEntry(
                    item,
                    place,
                    host,
                    trailing = { Icon(Icons.Default.MoreVert, "Options for ${item.title}", tint = brand.muted) },
                ) { selected = item }
            }
        }
    }
}

/** The shared drives the account is on. */
@Composable
fun DrivesView(host: Host) {
    var drives by remember { mutableStateOf<List<Drive>?>(null) }
    var error by remember { mutableStateOf<String?>(null) }
    LaunchedEffect(Unit) { host.attempt({ error = it }) { drives = host.api.drives() } }

    Scaffold(
        containerColor = Color.Transparent,
        topBar = { Header("Shared drives", onBack = host.back) },
        bottomBar = host.bar,
    ) { padding ->
        Box(Modifier.padding(padding).fillMaxSize()) {
            val list = drives
            when {
                error != null -> Note(error!!, Modifier.align(Alignment.Center), MaterialTheme.colorScheme.error)

                list == null -> CircularProgressIndicator(Modifier.align(Alignment.Center), color = brand.accent)

                list.isEmpty() -> Note("You are not on any shared drive yet.", Modifier.align(Alignment.Center))

                else -> LazyColumn(Modifier.fillMaxSize()) {
                    items(list, key = { it.id }) { drive ->
                        Entry(Icons.Outlined.Group, drive.name, drive.role.replaceFirstChar { it.uppercase() }) {
                            host.push(DriveScreen(drive))
                        }
                    }
                }
            }
        }
    }
}

/** One shared drive: the same browser as the account's own, with its own trash. */
@Composable
fun DriveView(host: Host, drive: Drive) {
    val place = Place(drive.id)
    Browser(
        host = host,
        place = place,
        root = drive.name,
        canWrite = drive.canWrite,
        onExit = host.back,
        actions = {
            IconButton(onClick = { host.push(TrashScreen(place)) }) {
                Icon(Icons.Outlined.Delete, "Trash of ${drive.name}", tint = brand.ink)
            }
        },
        bottomBar = host.bar,
    )
}

/** A file's earlier copies, newest first, each one a tap from current again. */
@Composable
fun VersionsView(host: Host, place: Place, item: Item) {
    val scope = rememberCoroutineScope()
    var versions by remember { mutableStateOf<Versions?>(null) }
    var status by remember { mutableStateOf<String?>(null) }
    var reload by remember { mutableIntStateOf(0) }
    LaunchedEffect(reload) { host.attempt({ status = it }) { versions = host.api.versions(place, item.metadata.id) } }

    Scaffold(
        containerColor = Color.Transparent,
        topBar = { Header("Versions", onBack = host.back) },
        bottomBar = host.bar,
    ) { padding ->
        Column(Modifier.padding(padding).fillMaxSize()) {
            Text(
                item.title,
                Modifier.padding(horizontal = 20.dp),
                color = brand.muted,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )
            status?.let { Note(it, colour = MaterialTheme.colorScheme.error) }
            val loaded = versions
            if (loaded == null) {
                if (status == null) Box(Modifier.fillMaxSize()) { CircularProgressIndicator(Modifier.align(Alignment.Center), color = brand.accent) }
                return@Column
            }
            val earlier = loaded.versions.sortedByDescending { it.seq }
            // A track's versions play, newest first, as one queue: comparing
            // takes is what they are kept for.
            val audio = item.metadata.category == "MUSIC"
            val takes = remember(loaded) {
                listOf(item.copy(metadata = item.metadata.copy(name = "${item.title} · v${loaded.current.nextSeq}"))) +
                    earlier.map { version ->
                        Item(
                            version.id,
                            "file",
                            version.size,
                            Meta(versionId(item.metadata.id, version.id), "${item.title} · v${version.seq}", "MUSIC"),
                        )
                    }
            }
            val play = { index: Int -> if (audio) host.play(place, takes, index) }
            LazyColumn(Modifier.fillMaxSize()) {
                item {
                    Entry(
                        if (audio) Icons.Outlined.PlayCircle else Icons.Outlined.CheckCircle,
                        "v${loaded.current.nextSeq}, current",
                        "${shortDate(loaded.current.updatedAt)}, ${formatSize(loaded.current.size)}",
                        onClick = if (audio) ({ play(0) }) else null,
                    )
                }
                if (earlier.isEmpty()) item { Note("No earlier version is kept for this file.") }
                itemsIndexed(earlier, key = { _, version -> version.id }) { index, version ->
                    Entry(
                        if (audio) Icons.Outlined.PlayCircle else Icons.Outlined.History,
                        "v${version.seq}",
                        listOfNotNull(shortDate(version.createdAt), formatSize(version.size), version.authorName).joinToString(", "),
                        tint = brand.muted,
                        onClick = if (audio) ({ play(index + 1) }) else null,
                        trailing = {
                            TextButton(
                                onClick = {
                                    scope.launch {
                                        host.attempt({ status = it }) {
                                            host.api.restoreVersion(place, item.metadata.id, version.id)
                                            status = null
                                            reload++
                                        }
                                    }
                                },
                            ) { Text("Restore v${version.seq}", color = brand.accent) }
                        },
                    )
                }
            }
        }
    }
}

/** What this app can set itself; the account's accent follows it everywhere. */
@Composable
fun SettingsView(host: Host, accent: String, onAccent: (String) -> Unit) {
    val scope = rememberCoroutineScope()
    var status by remember { mutableStateOf<String?>(null) }
    Scaffold(
        containerColor = Color.Transparent,
        topBar = { Header("Settings", onBack = host.back) },
        bottomBar = host.bar,
    ) { padding ->
        Column(Modifier.padding(padding).fillMaxSize()) {
            SheetTitle("Accent")
            Text(
                "Colours the app and the web interface, on every device you use.",
                Modifier.padding(horizontal = 20.dp),
                color = brand.muted,
                style = MaterialTheme.typography.bodySmall,
            )
            Row(
                Modifier.fillMaxWidth().padding(horizontal = 20.dp, vertical = 16.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
            ) {
                ACCENTS.forEach { (name, colours) ->
                    val chosen = name == accent
                    Box(
                        Modifier.size(40.dp).clip(CircleShape)
                            .background(Brush.linearGradient(listOf(Color(colours.light), Color(colours.glow))))
                            .then(if (chosen) Modifier.border(3.dp, brand.ink, CircleShape) else Modifier)
                            .semantics { contentDescription = "$name accent${if (chosen) ", selected" else ""}" }
                            .clickable(role = Role.RadioButton) {
                                val before = accent
                                onAccent(name)
                                scope.launch {
                                    host.attempt({
                                        status = it
                                        onAccent(before)
                                    }) {
                                        host.api.setAccent(name)
                                        status = null
                                    }
                                }
                            },
                    )
                }
            }
            status?.let { Note(it, colour = MaterialTheme.colorScheme.error) }
            SheetTitle("Account")
            Entry(Icons.Outlined.CheckCircle, host.api.session.userName, host.server, tint = brand.muted)
            Entry(Icons.Outlined.Language, "Language and other settings", "On the web interface") {
                host.push(WebScreen("${host.server}/settings"))
            }
        }
    }
}

/**
 * Photos, one a page: swipe between them, pinch or double-tap to look closer.
 * A page opens on a render of the photo, a fraction of its bytes; **Original**
 * fetches the file itself.
 */
@Composable
fun PhotoView(host: Host, place: Place, photos: List<Item>, start: Int) {
    val pager = rememberPagerState(initialPage = start) { photos.size }
    // The pages whose original was asked for.
    val originals = remember { mutableStateMapOf<Int, Boolean>() }
    val raw = { page: Int -> rawUrl(host.server, place, photos[page].metadata.id) }
    val look = { page: Int -> lookUrl(host.server, place, photos[page]) }
    Box(Modifier.fillMaxSize().background(Color.Black)) {
        HorizontalPager(pager, Modifier.fillMaxSize()) { page ->
            var scale by remember { mutableFloatStateOf(1f) }
            var offset by remember { mutableStateOf(Offset.Zero) }
            val zoom = rememberTransformableState { change, pan, _ ->
                scale = (scale * change).coerceIn(1f, 5f)
                offset = if (scale == 1f) Offset.Zero else offset + pan
            }
            val original = originals[page] == true
            Picture(
                if (original) raw(page) else look(page),
                host,
                photos[page].title,
                Modifier.fillMaxSize()
                    .pointerInput(Unit) {
                        detectTapGestures(onDoubleTap = {
                            scale = if (scale > 1f) 1f else 2.5f
                            offset = Offset.Zero
                        })
                    }
                    // Panning only once zoomed: a swipe still turns the page.
                    .transformable(zoom, canPan = { scale > 1f })
                    .graphicsLayer {
                        scaleX = scale
                        scaleY = scale
                        translationX = offset.x
                        translationY = offset.y
                    },
                ContentScale.Fit,
                // What was on screen stays while the next quality comes in.
                placeholder = if (original) look(page) else thumbnailUrl(host.server, place, photos[page].metadata.id, "small"),
                fallback = if (original) null else raw(page),
            )
        }
        val current = pager.currentPage
        Row(
            Modifier.fillMaxWidth().background(Brush.verticalGradient(listOf(Color.Black.copy(alpha = 0.6f), Color.Transparent)))
                .windowInsetsPadding(WindowInsets.statusBars).padding(end = 8.dp, bottom = 16.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            IconButton(onClick = host.back) { Icon(Icons.AutoMirrored.Filled.ArrowBack, "Back", tint = Color.White) }
            Column(Modifier.weight(1f)) {
                Text(
                    photos[current].title,
                    color = Color.White,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    style = MaterialTheme.typography.titleMedium,
                )
                if (photos.size > 1) {
                    Text("${current + 1} of ${photos.size}", color = Color.White.copy(alpha = 0.8f), style = MaterialTheme.typography.bodySmall)
                }
            }
            // Nothing to offer where the first look already was the file.
            if (originals[current] != true && look(current) != raw(current)) {
                TextButton(onClick = { originals[current] = true }) {
                    Text("Original" + (photos[current].size?.let { " · ${formatSize(it)}" } ?: ""), color = Color.White)
                }
            }
        }
    }
}

/** Files and folders by name, in every drive and mount: typed, then listed. */
@Composable
fun SearchView(host: Host) {
    var typed by remember { mutableStateOf("") }
    // What is searched: the text, once typing has paused.
    var query by remember { mutableStateOf("") }
    LaunchedEffect(typed) {
        delay(350)
        query = typed.trim()
    }
    val focus = remember { FocusRequester() }
    LaunchedEffect(Unit) { focus.requestFocus() }
    Scaffold(
        containerColor = Color.Transparent,
        topBar = {
            Row(
                Modifier.fillMaxWidth().windowInsetsPadding(WindowInsets.statusBars).padding(start = 4.dp, end = 16.dp, top = 8.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                IconButton(onClick = host.back) { Icon(Icons.AutoMirrored.Filled.ArrowBack, "Back", tint = brand.ink) }
                OutlinedTextField(
                    value = typed,
                    onValueChange = { typed = it },
                    placeholder = { Text("Search everywhere") },
                    singleLine = true,
                    shape = Corner,
                    modifier = Modifier.weight(1f).focusRequester(focus),
                )
            }
        },
        bottomBar = host.bar,
    ) { padding ->
        if (query.length < 2) {
            Box(Modifier.padding(padding).fillMaxSize(), contentAlignment = Alignment.Center) { Note("Type a name, or part of one.") }
        } else {
            Listing(query, "Nothing by that name, in any of your drives", Modifier.padding(padding), host, { host.api.search(query) }) { item, all ->
                val place = item.place?.place ?: Place()
                SearchEntry(item, place, host) {
                    // A result carries its folder's id, not the path a listing needs.
                    if (item.isFolder) {
                        host.push(WebScreen("${host.server}/go/folder/${item.metadata.id}"))
                    } else {
                        // What it is opened among: the results from the same place.
                        host.open(place, all.filter { it.place == item.place }, item)
                    }
                }
            }
        }
    }
}

/** A result, and where it is: its drive or mount, then its folder. */
@Composable
private fun SearchEntry(item: Item, place: Place, host: Host, onClick: () -> Unit) {
    val (icon, colour) = iconFor(item)
    Entry(
        icon = icon,
        title = item.title,
        detail = listOfNotNull(item.place?.name, item.parent).joinToString(" / ").ifEmpty { null },
        tint = colour ?: if (item.isFolder) brand.accent else brand.muted,
        picture = if (!item.isFolder && item.metadata.category in setOf("IMAGES", "VIDEO")) {
            { Remote(thumbnailUrl(host.server, place, item.metadata.id, "small"), host, null, Modifier.fillMaxSize()) }
        } else {
            null
        },
        onClick = onClick,
    )
}

/** A PDF, every page, scrolled; the platform draws it (`PdfPages`). */
@Composable
fun PdfView(host: Host, place: Place, item: Item) {
    var bytes by remember { mutableStateOf<ByteArray?>(null) }
    var failed by remember { mutableStateOf<String?>(null) }
    LaunchedEffect(item.metadata.id) {
        host.attempt({ failed = it }) { bytes = host.api.bytes(rawUrl(host.server, place, item.metadata.id)) }
    }
    Scaffold(
        containerColor = brand.ground,
        topBar = { Header(item.title, onBack = host.back, compact = true) },
    ) { padding ->
        Box(Modifier.padding(padding).fillMaxSize(), contentAlignment = Alignment.Center) {
            val loaded = bytes
            when {
                failed != null -> Note(failed!!, colour = MaterialTheme.colorScheme.error)
                loaded == null -> CircularProgressIndicator(color = brand.accent)
                else -> PdfPages(loaded, Modifier.fillMaxSize())
            }
        }
    }
}
