package dev.penombre.app

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBars
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.lazy.LazyListState
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.outlined.Article
import androidx.compose.material.icons.automirrored.outlined.InsertDriveFile
import androidx.compose.material.icons.outlined.Code
import androidx.compose.material.icons.outlined.Description
import androidx.compose.material.icons.outlined.Folder
import androidx.compose.material.icons.outlined.FolderZip
import androidx.compose.material.icons.outlined.Image
import androidx.compose.material.icons.outlined.Movie
import androidx.compose.material.icons.outlined.MusicNote
import androidx.compose.material.icons.outlined.PictureAsPdf
import androidx.compose.material.icons.outlined.Slideshow
import androidx.compose.material.icons.outlined.TableChart
import androidx.compose.material.icons.outlined.ViewInAr
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.runtime.Composable
import androidx.compose.runtime.compositionLocalOf
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.derivedStateOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.runtime.snapshotFlow
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.blur
import androidx.compose.ui.draw.clip
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.TextRange
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.input.TextFieldValue
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil3.compose.AsyncImage
import coil3.compose.LocalPlatformContext
import coil3.compose.SubcomposeAsyncImage
import coil3.network.NetworkHeaders
import coil3.network.httpHeaders
import coil3.request.ImageRequest
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.flow.first

/** False in a screen that lies under another: it must not answer Back. */
val LocalShown = compositionLocalOf { true }

/** A screen pushed over the tabs. */
sealed interface Screen

data class WebScreen(val url: String) : Screen

data class TrashScreen(val place: Place) : Screen

data object DrivesScreen : Screen

data class DriveScreen(val drive: Drive) : Screen

data class PhotoScreen(val place: Place, val photos: List<Item>, val index: Int) : Screen

data class VideoScreen(val place: Place, val item: Item) : Screen

data class VersionsScreen(val place: Place, val item: Item) : Screen

data object SettingsScreen : Screen

data object SearchScreen : Screen

data class PdfScreen(val place: Place, val item: Item) : Screen

/** What a screen can ask of the app around it. */
class Host(
    val api: Api,
    val push: (Screen) -> Unit,
    val back: () -> Unit,
    val play: (Place, List<Item>, Int) -> Unit,
    /** Opens a file's preview drawer; `siblings` are what it sits among. */
    val preview: (Place, List<Item>, Item) -> Unit,
    val screening: Screening,
    val signedOut: () -> Unit,
    /** The bottom of every screen: the mini player over the tab bar. */
    val bar: @Composable () -> Unit,
) {
    val server get() = api.session.server

    /** Runs `block`; a revoked session signs out, anything else is `failed`. */
    suspend fun attempt(failed: (String) -> Unit = {}, block: suspend () -> Unit) {
        try {
            block()
        } catch (e: CancellationException) {
            throw e
        } catch (e: Unauthorized) {
            signedOut()
        } catch (e: Exception) {
            failed(e.message ?: "Something went wrong.")
        }
    }

    /** A track goes to the player; anything else opens as a preview first. */
    fun open(place: Place, siblings: List<Item>, item: Item) {
        if (item.metadata.category == "MUSIC") {
            siblings.filter { it.metadata.category == "MUSIC" }.let { play(place, it, it.indexOf(item).coerceAtLeast(0)) }
        } else {
            preview(place, siblings, item)
        }
    }
}

/** An image fetched with the session, as the API wants it. */
@Composable
fun Remote(url: String, host: Host, description: String?, modifier: Modifier, scale: ContentScale = ContentScale.Crop) {
    AsyncImage(
        model = ImageRequest.Builder(LocalPlatformContext.current)
            .data(url)
            .httpHeaders(NetworkHeaders.Builder().set("Authorization", "Bearer ${host.api.session.token}").build())
            .build(),
        contentDescription = description,
        contentScale = scale,
        modifier = modifier,
    )
}

/**
 * The same, for an image shown large. Until it is in, `placeholder` (a
 * thumbnail the list already fetched) stands blurred under a loader; if it
 * cannot be had at all, `fallback` is tried before giving up.
 */
@Composable
fun Picture(
    url: String,
    host: Host,
    description: String?,
    modifier: Modifier,
    scale: ContentScale = ContentScale.Fit,
    placeholder: String? = null,
    fallback: String? = null,
) {
    SubcomposeAsyncImage(
        model = ImageRequest.Builder(LocalPlatformContext.current)
            .data(url)
            .httpHeaders(NetworkHeaders.Builder().set("Authorization", "Bearer ${host.api.session.token}").build())
            .build(),
        contentDescription = description,
        contentScale = scale,
        modifier = modifier,
        loading = {
            Box(contentAlignment = Alignment.Center) {
                placeholder?.let { Remote(it, host, null, Modifier.fillMaxSize().blur(12.dp), scale) }
                CircularProgressIndicator(color = brand.accent)
            }
        },
        error = {
            if (fallback != null) {
                Picture(fallback, host, description, Modifier.fillMaxSize(), scale, placeholder)
            } else {
                Box(contentAlignment = Alignment.Center) { Note("This image could not be loaded.") }
            }
        },
    )
}

/** Below this, a picture's preview saves nothing worth a second request. */
private const val SMALL_PICTURE = 400 * 1024L

/** What a viewer shows first for a picture: a render, unless the file is tiny or moves. */
fun lookUrl(server: String, place: Place, item: Item): String {
    val still = !item.title.endsWith(".gif", ignoreCase = true) && !item.title.endsWith(".svg", ignoreCase = true)
    return if (still && (item.size ?: Long.MAX_VALUE) >= SMALL_PICTURE) {
        thumbnailUrl(server, place, item.metadata.id, "preview")
    } else {
        rawUrl(server, place, item.metadata.id)
    }
}

/** The screen's title, large and on the sky; the moon marks the drive's root. */
@Composable
fun Header(
    title: String,
    onBack: (() -> Unit)?,
    moon: Boolean = false,
    compact: Boolean = false,
    actions: @Composable RowScope.() -> Unit = {},
) {
    Row(
        Modifier.fillMaxWidth().windowInsetsPadding(WindowInsets.statusBars)
            .padding(start = if (onBack == null) 20.dp else 4.dp, end = 8.dp, top = if (compact) 0.dp else 12.dp, bottom = if (compact) 0.dp else 8.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        onBack?.let { IconButton(onClick = it) { Icon(Icons.AutoMirrored.Filled.ArrowBack, "Back", tint = brand.ink) } }
        if (moon) {
            Moon(30.dp)
            Spacer(Modifier.width(12.dp))
        }
        Text(
            title,
            Modifier.weight(1f),
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
            color = brand.ink,
            style = if (compact) {
                MaterialTheme.typography.titleMedium
            } else {
                TextStyle(fontSize = 30.sp, fontWeight = FontWeight.SemiBold, letterSpacing = (-0.6).sp)
            },
        )
        actions()
    }
}

/** The web app's primary button: the logo's gradient. */
@Composable
fun GradientButton(label: String, enabled: Boolean, onClick: () -> Unit) {
    Box(
        Modifier.fillMaxWidth().height(52.dp).alpha(if (enabled) 1f else 0.4f).clip(Corner)
            .background(brand.gradient)
            .clickable(enabled = enabled, role = Role.Button, onClick = onClick),
        contentAlignment = Alignment.Center,
    ) {
        Text(label, color = Color.White, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
    }
}

/** A row on the sky: a tile, a name, one quiet detail, and what follows them. */
@Composable
fun Entry(
    icon: ImageVector,
    title: String,
    detail: String? = null,
    tint: Color = brand.accent,
    picture: (@Composable () -> Unit)? = null,
    /** Beside the detail: the version chip on a file that has earlier ones. */
    badge: (@Composable () -> Unit)? = null,
    trailing: @Composable RowScope.() -> Unit = {},
    onClick: (() -> Unit)? = null,
) {
    Row(
        Modifier.fillMaxWidth().then(if (onClick != null) Modifier.clickable(onClick = onClick) else Modifier)
            .padding(start = 20.dp, end = 8.dp, top = 10.dp, bottom = 10.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Box(
            Modifier.size(44.dp).clip(Corner).background(tint.copy(alpha = 0.14f)),
            contentAlignment = Alignment.Center,
        ) {
            Icon(icon, null, tint = tint)
            // Over the icon: a picture that fails to load leaves it showing.
            picture?.invoke()
        }
        Spacer(Modifier.width(14.dp))
        Column(Modifier.weight(1f)) {
            Text(
                title,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
                color = brand.ink,
                style = MaterialTheme.typography.bodyLarge,
                fontWeight = FontWeight.Medium,
            )
            if (badge == null) {
                detail?.let { Text(it, color = brand.muted, style = MaterialTheme.typography.bodySmall) }
            } else {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    badge()
                    detail?.let { Text(it, color = brand.muted, style = MaterialTheme.typography.bodySmall) }
                }
            }
        }
        trailing()
        Spacer(Modifier.width(12.dp))
    }
}

/** A file or folder as a row; a photo or video shows its thumbnail. */
@Composable
fun ItemEntry(item: Item, place: Place, host: Host, trailing: @Composable RowScope.() -> Unit = {}, onClick: () -> Unit) {
    val (icon, colour) = iconFor(item)
    val pictured = !item.isFolder && item.metadata.category in setOf("IMAGES", "VIDEO")
    val seq = item.metadata.versionSeq?.takeIf { !item.isFolder && it > 0 }
    Entry(
        icon = icon,
        title = item.title,
        detail = listOfNotNull(
            item.metadata.duration?.let(::clock),
            item.size?.takeIf { !item.isFolder }?.let(::formatSize),
        ).joinToString(" · ").ifEmpty { null },
        // The current bytes' number; a tap lists the earlier ones.
        badge = seq?.let {
            {
                Text(
                    "v${it + 1}",
                    Modifier.clip(RoundedCornerShape(50)).background(brand.accent.copy(alpha = 0.16f))
                        .clickable(onClickLabel = "Versions of ${item.title}") { host.push(VersionsScreen(place, item)) }
                        .padding(horizontal = 8.dp, vertical = 1.dp),
                    color = brand.accent,
                    style = MaterialTheme.typography.labelSmall,
                    fontWeight = FontWeight.SemiBold,
                )
            }
        },
        tint = colour ?: if (item.isFolder) brand.accent else brand.muted,
        picture = if (pictured) {
            { Remote(thumbnailUrl(host.server, place, item.metadata.id, "small"), host, null, Modifier.fillMaxSize()) }
        } else {
            null
        },
        trailing = trailing,
        onClick = onClick,
    )
}

private val DOCUMENT = setOf("doc", "docx", "odt", "rtf", "html", "htm")
private val SHEET = setOf("xls", "xlsx", "ods", "csv", "tsv")
private val DECK = setOf("ppt", "pptx", "odp", "key", "md")

// The web app's file colours (`file/prefix.svelte`, `documents.ts`): a kind
// keeps its colour under every accent, a folder takes the accent. Documents,
// sheets and decks are told apart by extension, as there.
fun iconFor(item: Item): Pair<ImageVector, Color?> = when {
    item.isFolder -> Icons.Outlined.Folder to null
    else -> when (item.metadata.category) {
        "IMAGES" -> Icons.Outlined.Image to Color(0xFFFB923C)
        "VIDEO" -> Icons.Outlined.Movie to Color(0xFF60A5FA)
        "MUSIC" -> Icons.Outlined.MusicNote to Color(0xFFF472B6)
        "ARCHIVES" -> Icons.Outlined.FolderZip to Color(0xFF0D9488)
        "CODE" -> Icons.Outlined.Code to Color(0xFF4ADE80)
        "3D" -> Icons.Outlined.ViewInAr to Color(0xFFE11D48)
        else -> when (item.title.substringAfterLast('.', "").lowercase()) {
            "pdf" -> Icons.Outlined.PictureAsPdf to Color(0xFFEF4444)
            in DOCUMENT -> Icons.AutoMirrored.Outlined.Article to Color(0xFF3B82F6)
            in SHEET -> Icons.Outlined.TableChart to Color(0xFF22C55E)
            in DECK -> Icons.Outlined.Slideshow to Color(0xFFF97316)
            else -> if (item.metadata.category == "DOCUMENTS") {
                Icons.Outlined.Description to Color(0xFF2563EB)
            } else {
                Icons.AutoMirrored.Outlined.InsertDriveFile to null
            }
        }
    }
}

/**
 * One paged list. `source` is what it lists: a new one starts from nothing.
 * Pulled down, it fetches its first page again and keeps what it shows until
 * that page is in.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun Listing(
    source: Any,
    empty: String,
    modifier: Modifier,
    host: Host,
    load: suspend (cursor: String?) -> Page,
    onPage: (Page) -> Unit = {},
    row: @Composable (item: Item, all: List<Item>) -> Unit,
) {
    val items = remember(source) { mutableStateListOf<Item>() }
    var cursor by remember(source) { mutableStateOf<String?>(null) }
    var done by remember(source) { mutableStateOf(false) }
    var loading by remember(source) { mutableStateOf(false) }
    var error by remember(source) { mutableStateOf<String?>(null) }
    var pulls by remember(source) { mutableIntStateOf(0) }
    var refreshing by remember(source) { mutableStateOf(false) }
    val list = remember(source) { LazyListState() }
    val nearEnd by remember(source) {
        derivedStateOf { (list.layoutInfo.visibleItemsInfo.lastOrNull()?.index ?: 0) >= items.size - 10 }
    }

    // One loop per source and per pull, keyed on nothing it writes: keyed on
    // `loading`, it restarted on its own first line and cancelled the request
    // it had made.
    LaunchedEffect(source, pulls) {
        // A pull starts over, and its first page replaces what is shown.
        var fresh = pulls > 0
        if (fresh) {
            cursor = null
            done = false
            error = null
        }
        while (!done) {
            if (!fresh) snapshotFlow { nearEnd }.first { it }
            loading = true
            host.attempt({ error = it; done = true }) {
                val page = load(cursor)
                onPage(page)
                if (fresh) items.clear()
                items.addAll(page.list)
                cursor = page.nextCursor
                done = page.nextCursor == null
            }
            fresh = false
            refreshing = false
            loading = false
        }
        refreshing = false
    }

    PullToRefreshBox(
        isRefreshing = refreshing,
        onRefresh = {
            refreshing = true
            pulls++
        },
        modifier = modifier.fillMaxSize(),
    ) {
        LazyColumn(state = list, modifier = Modifier.fillMaxSize(), contentPadding = PaddingValues(top = 4.dp, bottom = 88.dp)) {
            items(items, key = { it.metadata.id }) { item -> row(item, items) }
        }
        when {
            loading && items.isEmpty() && !refreshing -> CircularProgressIndicator(Modifier.align(Alignment.Center), color = brand.accent)
            error != null -> Note(error!!, Modifier.align(Alignment.Center), MaterialTheme.colorScheme.error)
            done && items.isEmpty() -> Note(empty, Modifier.align(Alignment.Center), brand.muted)
        }
    }
}

@Composable
fun Note(text: String, modifier: Modifier = Modifier, colour: Color = brand.muted) {
    Text(text, modifier.padding(28.dp), color = colour, textAlign = TextAlign.Center)
}

/** Asks before something that cannot be undone. */
@Composable
fun Confirm(title: String, text: String, action: String, onDismiss: () -> Unit, onConfirm: () -> Unit) {
    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = brand.panel,
        title = { Text(title) },
        text = { Text(text) },
        confirmButton = { TextButton(onClick = onConfirm) { Text(action, color = MaterialTheme.colorScheme.error) } },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancel", color = brand.muted) } },
    )
}

/**
 * Asks for one line of text: a name, mostly. The field has the keyboard from
 * the start, with what is there selected, so typing replaces it.
 */
@Composable
fun Prompt(title: String, initial: String, action: String, onDismiss: () -> Unit, onConfirm: (String) -> Unit) {
    var field by remember { mutableStateOf(TextFieldValue(initial, TextRange(0, initial.length))) }
    val focus = remember { FocusRequester() }
    val text = field.text.trim()
    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = brand.panel,
        title = { Text(title) },
        text = {
            OutlinedTextField(
                value = field,
                onValueChange = { field = it },
                singleLine = true,
                shape = Corner,
                label = { Text("Name") },
                modifier = Modifier.focusRequester(focus),
            )
            // In here: asked before the field exists, the focus goes nowhere.
            LaunchedEffect(Unit) { focus.requestFocus() }
        },
        confirmButton = {
            TextButton(enabled = text.isNotEmpty() && text != initial, onClick = { onConfirm(text) }) {
                Text(action, color = brand.accent)
            }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancel", color = brand.muted) } },
    )
}

fun formatSize(bytes: Long): String {
    val units = listOf("B", "KB", "MB", "GB", "TB")
    var value = bytes.toDouble()
    var unit = 0
    while (value >= 1024 && unit < units.lastIndex) {
        value /= 1024
        unit++
    }
    return if (unit == 0) "$bytes B" else "${(value * 10).toLong() / 10.0} ${units[unit]}"
}

fun initials(name: String): String =
    name.trim().split(Regex("\\s+")).filter { it.isNotEmpty() }.take(2).joinToString("") { it.first().uppercase() }

/** The day of an ISO timestamp. No time: it is UTC, and would read as local. */
fun shortDate(iso: String): String = iso.take(10)

/** Seconds as `m:ss`. */
fun clock(seconds: Double): String {
    val whole = seconds.takeIf { it.isFinite() && it > 0 }?.toLong() ?: 0L
    return "${whole / 60}:${(whole % 60).toString().padStart(2, '0')}"
}
