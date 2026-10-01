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
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.MoreVert
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.outlined.CheckCircle
import androidx.compose.material.icons.outlined.Delete
import androidx.compose.material.icons.outlined.DeleteForever
import androidx.compose.material.icons.outlined.Group
import androidx.compose.material.icons.outlined.History
import androidx.compose.material.icons.outlined.Language
import androidx.compose.material.icons.outlined.PlayCircle
import androidx.compose.material.icons.outlined.RestoreFromTrash
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
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.platform.LocalSoftwareKeyboardController
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import org.jetbrains.compose.resources.stringResource

/** A place's trash: what was removed, to put back or to delete for good. */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TrashView(host: Host, place: Place, onTitle: (() -> Unit)? = null) {
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
            Entry(Icons.Outlined.RestoreFromTrash, stringResource(Res.string.trash_restore), stringResource(Res.string.trash_restore_hint)) {
                selected = null
                // A trashed item's key is its full path.
                act { host.api.setTrashed(place, item, item.key, false) }
            }
            Entry(Icons.Outlined.DeleteForever, stringResource(Res.string.delete_forever), tint = MaterialTheme.colorScheme.error) {
                selected = null
                deleting = item
            }
            Spacer(Modifier.height(24.dp))
        }
    }
    deleting?.let { item ->
        Confirm(
            stringResource(Res.string.delete_forever_title, item.title),
            stringResource(Res.string.cannot_undo),
            stringResource(Res.string.delete_forever),
            { deleting = null },
        ) {
            deleting = null
            act { host.api.delete(place, item, item.key) }
        }
    }
    if (emptying) {
        Confirm(
            stringResource(Res.string.empty_trash_title),
            size?.let { stringResource(Res.string.empty_trash_freeing, formatSize(it)) } ?: stringResource(Res.string.empty_trash_text),
            stringResource(Res.string.empty_trash),
            { emptying = false },
        ) {
            emptying = false
            act { host.api.emptyTrash(place) }
        }
    }

    Scaffold(
        containerColor = Color.Transparent,
        topBar = {
            // On Home it is a place like any other: no way back, the selector instead.
            Header(stringResource(Res.string.trash), onBack = if (onTitle == null) host.back else null, onTitle = onTitle) {
                // Nothing to empty until a page says there is something.
                if ((size ?: 0) > 0) TextButton(onClick = { emptying = true }) { Text(stringResource(Res.string.trash_empty_action), color = brand.accent) }
                if (onTitle != null) host.top(this)
            }
        },
        bottomBar = host.bar,
    ) { padding ->
        Column(Modifier.padding(padding)) {
            status?.let { Note(it, colour = MaterialTheme.colorScheme.error) }
            Listing(
                source = place to refresh,
                empty = stringResource(Res.string.trash_is_empty),
                modifier = Modifier,
                host = host,
                load = { host.api.trash(place, it) },
                onPage = { size = it.totalSize },
            ) { item, _ ->
                ItemEntry(
                    item,
                    place,
                    host,
                    trailing = { Icon(Icons.Default.MoreVert, stringResource(Res.string.options_for, item.title), tint = brand.muted) },
                ) { selected = item }
            }
        }
    }
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
        topBar = { Header(stringResource(Res.string.versions), onBack = host.back) },
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
                if (status == null) SkeletonList(4)
                return@Column
            }
            val earlier = loaded.versions.sortedByDescending { it.seq }
            // A track's versions play, newest first, as one queue: comparing
            // takes is what they are kept for.
            val audio = item.metadata.category == "MUSIC"
            val current = stringResource(Res.string.version_label, loaded.current.nextSeq)
            val labels = earlier.map { stringResource(Res.string.version_label, it.seq) }
            val takes = remember(loaded, current) {
                listOf(item.copy(metadata = item.metadata.copy(name = "${item.title} · $current"))) +
                    earlier.mapIndexed { index, version ->
                        Item(
                            version.id,
                            "file",
                            version.size,
                            Meta(versionId(item.metadata.id, version.id), "${item.title} · ${labels[index]}", "MUSIC"),
                        )
                    }
            }
            val play = { index: Int -> if (audio) host.play(place, takes, index) }
            LazyColumn(Modifier.fillMaxSize()) {
                item {
                    Entry(
                        if (audio) Icons.Outlined.PlayCircle else Icons.Outlined.CheckCircle,
                        stringResource(Res.string.version_current, current),
                        "${shortDate(loaded.current.updatedAt)}, ${formatSize(loaded.current.size)}",
                        onClick = if (audio) ({ play(0) }) else null,
                    )
                }
                if (earlier.isEmpty()) item { Note(stringResource(Res.string.versions_none)) }
                itemsIndexed(earlier, key = { _, version -> version.id }) { index, version ->
                    Entry(
                        if (audio) Icons.Outlined.PlayCircle else Icons.Outlined.History,
                        labels[index],
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
                            ) { Text(stringResource(Res.string.version_restore, labels[index]), color = brand.accent) }
                        },
                    )
                }
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
            IconButton(onClick = host.back) { Icon(Icons.AutoMirrored.Filled.ArrowBack, stringResource(Res.string.back), tint = Color.White) }
            Column(Modifier.weight(1f)) {
                Text(
                    photos[current].title,
                    color = Color.White,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    style = MaterialTheme.typography.titleMedium,
                )
                if (photos.size > 1) {
                    Text(stringResource(Res.string.count_of, current + 1, photos.size), color = Color.White.copy(alpha = 0.8f), style = MaterialTheme.typography.bodySmall)
                }
            }
            // Nothing to offer where the first look already was the file.
            if (originals[current] != true && look(current) != raw(current)) {
                TextButton(onClick = { originals[current] = true }) {
                    val size = photos[current].size
                    Text(
                        if (size == null) stringResource(Res.string.original) else stringResource(Res.string.original_size, formatSize(size)),
                        color = Color.White,
                    )
                }
            }
        }
    }
}

/** How many past searches the Search tab offers. */
private const val REMEMBERED_SEARCHES = 10

/** `query` first among the past searches: no duplicate, whatever its case. */
fun rememberSearch(past: List<String>, query: String): List<String> {
    val text = query.trim()
    if (text.length < 2) return past
    return (listOf(text) + past.filterNot { it.equals(text, ignoreCase = true) }).take(REMEMBERED_SEARCHES)
}

/** Past searches, newest first, on this phone only. */
private object Searches {
    private const val KEY = "recent-searches"

    fun load(): List<String> = Prefs.get(KEY)?.split('\n')?.filter { it.isNotBlank() }.orEmpty()

    fun save(list: List<String>) = Prefs.set(KEY, list.joinToString("\n").ifEmpty { null })
}

/** Results for what was typed; they stay on screen while the next ones come. */
private class Live(val query: String, val items: List<Item>)

/**
 * The Search tab: the field, then the recent searches, or, from two letters
 * on, live results for what is typed. Submitted, a search runs on its own
 * page (`SearchResultsScreen`), so going back finds the field as it was.
 * `focus` changes when the tab is tapped again, which is when the keyboard
 * comes up, as on Android.
 */
@Composable
fun SearchView(host: Host, focus: Int) {
    var typed by remember { mutableStateOf("") }
    var recent by remember { mutableStateOf(Searches.load()) }
    val field = remember { FocusRequester() }
    val keyboard = LocalSoftwareKeyboardController.current
    val focusManager = LocalFocusManager.current
    LaunchedEffect(focus) {
        if (focus > 0) {
            field.requestFocus()
            keyboard?.show()
        }
    }
    // Under a pushed screen, the field lets go: its keyboard stayed over the next one.
    val shown = LocalShown.current
    LaunchedEffect(shown) { if (!shown) focusManager.clearFocus() }
    val keep = { text: String ->
        recent = rememberSearch(recent, text)
        Searches.save(recent)
    }
    val search = { text: String ->
        val query = text.trim()
        if (query.length >= 2) {
            keep(query)
            focusManager.clearFocus()
            host.push(SearchResultsScreen(query))
        }
    }
    val query = typed.trim()
    var live by remember { mutableStateOf<Live?>(null) }
    var searching by remember { mutableStateOf(false) }
    var failed by remember { mutableStateOf<String?>(null) }
    // Keyed on the query: the next key cancels this wait or this request, so
    // only the latest query's results ever land.
    LaunchedEffect(query) {
        if (query.length < 2) {
            live = null
            failed = null
            searching = false
            return@LaunchedEffect
        }
        searching = true
        delay(300)
        host.attempt({ failed = it }) {
            live = Live(query, host.api.search(query).list)
            failed = null
        }
        searching = false
    }
    Scaffold(
        containerColor = Color.Transparent,
        topBar = { Header(stringResource(Res.string.tab_search), onBack = null, actions = host.top) },
        bottomBar = host.bar,
    ) { padding ->
        Column(Modifier.padding(padding).fillMaxSize()) {
            OutlinedTextField(
                value = typed,
                onValueChange = { typed = it },
                placeholder = { Text(stringResource(Res.string.search_placeholder)) },
                leadingIcon = { Icon(Icons.Default.Search, null, tint = brand.muted) },
                trailingIcon = {
                    if (typed.isNotEmpty()) {
                        IconButton(onClick = { typed = "" }) { Icon(Icons.Default.Close, stringResource(Res.string.clear), tint = brand.muted) }
                    }
                },
                singleLine = true,
                shape = Corner,
                keyboardOptions = KeyboardOptions(imeAction = ImeAction.Search),
                keyboardActions = KeyboardActions(onSearch = { search(typed) }),
                modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 4.dp).focusRequester(field),
            )
            val results = live
            when {
                query.length < 2 -> RecentSearches(
                    recent,
                    Modifier.weight(1f),
                    onPick = {
                        typed = it
                        search(it)
                    },
                    onForget = { text ->
                        recent = recent - text
                        Searches.save(recent)
                    },
                ) {
                    recent = emptyList()
                    Searches.save(recent)
                }

                results == null && failed != null -> Note(failed.orEmpty(), colour = MaterialTheme.colorScheme.error)

                results == null -> SkeletonList(6)

                else -> Box(Modifier.weight(1f)) {
                    when {
                        results.items.isEmpty() -> Note(failed ?: stringResource(Res.string.search_nothing), Modifier.align(Alignment.Center))

                        else -> LazyColumn(Modifier.fillMaxSize()) {
                            items(results.items, key = { it.metadata.id }) { item ->
                                SearchEntry(item, host) {
                                    keep(results.query)
                                    openFound(host, item, results.items)
                                }
                            }
                        }
                    }
                    if (searching) SkeletonHint(Modifier.align(Alignment.TopCenter).padding(horizontal = 16.dp))
                }
            }
        }
    }
}

/** One search's results, on a page of their own. */
@Composable
fun SearchResultsView(host: Host, query: String) {
    Scaffold(
        containerColor = Color.Transparent,
        topBar = { Header(stringResource(Res.string.search_quoted, query), onBack = host.back) },
        bottomBar = host.bar,
    ) { padding ->
        Listing(query, stringResource(Res.string.search_nothing), Modifier.padding(padding), host, { host.api.search(query) }) { item, all ->
            SearchEntry(item, host) { openFound(host, item, all) }
        }
    }
}

/** Opens a search result among those from the same place. */
private fun openFound(host: Host, item: Item, all: List<Item>) {
    // A result carries its folder's id, not the path a listing needs.
    if (item.isFolder) {
        host.push(WebScreen("${host.server}/go/folder/${item.metadata.id}"))
    } else {
        host.open(item.place?.place ?: Place(), all.filter { it.place == item.place }, item)
    }
}

@Composable
private fun RecentSearches(recent: List<String>, modifier: Modifier, onPick: (String) -> Unit, onForget: (String) -> Unit, onClear: () -> Unit) {
    if (recent.isEmpty()) {
        Box(modifier.fillMaxSize(), contentAlignment = Alignment.Center) { Note(stringResource(Res.string.search_hint)) }
        return
    }
    LazyColumn(modifier.fillMaxSize()) {
        item {
            Row(Modifier.fillMaxWidth().padding(start = 20.dp, end = 8.dp, top = 12.dp), verticalAlignment = Alignment.CenterVertically) {
                Text(
                    stringResource(Res.string.search_recent),
                    Modifier.weight(1f),
                    color = brand.accent,
                    style = MaterialTheme.typography.labelLarge,
                    fontWeight = FontWeight.SemiBold,
                )
                TextButton(onClick = onClear) { Text(stringResource(Res.string.clear), color = brand.accent) }
            }
        }
        items(recent, key = { it }) { text ->
            Entry(
                Icons.Outlined.History,
                text,
                tint = brand.muted,
                trailing = {
                    IconButton(onClick = { onForget(text) }) { Icon(Icons.Default.Close, stringResource(Res.string.search_forget, text), tint = brand.muted) }
                },
            ) { onPick(text) }
        }
    }
}

/** A result, and where it is: its drive or mount, then its folder. */
@Composable
private fun SearchEntry(item: Item, host: Host, onClick: () -> Unit) {
    val place = item.place?.place ?: Place()
    val (icon, colour) = iconFor(item)
    Entry(
        icon = icon,
        title = item.title,
        detail = listOfNotNull(
            // The server names the account's own drive in English.
            item.place?.let { if (it.kind == "drive" || it.kind == "volume") it.name else stringResource(Res.string.my_drive) },
            item.parent,
        ).joinToString(" / ").ifEmpty { null },
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
                loaded == null -> BreathingMoon()
                else -> PdfPages(loaded, Modifier.fillMaxSize())
            }
        }
    }
}
