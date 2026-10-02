package dev.penombre.app

import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.InsertDriveFile
import androidx.compose.material.icons.outlined.Archive
import androidx.compose.material.icons.outlined.Code
import androidx.compose.material.icons.outlined.Delete
import androidx.compose.material.icons.outlined.Description
import androidx.compose.material.icons.outlined.Folder
import androidx.compose.material.icons.outlined.FolderShared
import androidx.compose.material.icons.outlined.Group
import androidx.compose.material.icons.outlined.History
import androidx.compose.material.icons.outlined.Image
import androidx.compose.material.icons.outlined.Movie
import androidx.compose.material.icons.outlined.MusicNote
import androidx.compose.material.icons.outlined.StarBorder
import androidx.compose.material.icons.outlined.Storage
import androidx.compose.material.icons.outlined.ViewInAr
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import org.jetbrains.compose.resources.StringResource
import org.jetbrains.compose.resources.pluralStringResource
import org.jetbrains.compose.resources.stringResource

/** What the Home tab shows; its title is the menu that switches between them. */
sealed interface Home {
    @get:Composable
    val title: String

    data object Mine : Home {
        override val title @Composable get() = stringResource(Res.string.my_drive)
    }

    data object Recent : Home {
        override val title @Composable get() = stringResource(Res.string.recent)
    }

    data object Starred : Home {
        override val title @Composable get() = stringResource(Res.string.starred)
    }

    data object Trash : Home {
        override val title @Composable get() = stringResource(Res.string.trash)
    }

    /** Everything other accounts shared with this one. */
    data object Shared : Home {
        override val title @Composable get() = stringResource(Res.string.shared_with_me)
    }

    /** A shared drive. */
    data class Team(val drive: Drive) : Home {
        override val title @Composable get() = drive.name
    }

    /** A mounted volume. */
    data class Mount(val volume: DevicePlace) : Home {
        override val title @Composable get() = volume.label
    }

    /** Something another account shared with this one. */
    data class Given(val grant: Grant) : Home {
        override val title @Composable get() = grant.name
    }

    /** One of the server's categories, across the account's drive. */
    data class Kind(val category: String, val label: StringResource) : Home {
        override val title @Composable get() = stringResource(label)
    }
}

/** The web sidebar's categories, in its order. */
private class Kind(val category: String, val label: StringResource, val icon: ImageVector, val colour: Color)

// The web sidebar's categories, in its order and its colours (`(app)/+layout.svelte`).
private val KINDS = listOf(
    Kind("MUSIC", Res.string.kind_music, Icons.Outlined.MusicNote, Color(0xFFEC4899)),
    Kind("DOCUMENTS", Res.string.kind_documents, Icons.Outlined.Description, Color(0xFF6366F1)),
    Kind("IMAGES", Res.string.kind_images, Icons.Outlined.Image, Color(0xFFF97316)),
    Kind("CODE", Res.string.kind_code, Icons.Outlined.Code, Color(0xFF22C55E)),
    Kind("VIDEO", Res.string.kind_video, Icons.Outlined.Movie, Color(0xFFA855F7)),
    Kind("ARCHIVES", Res.string.kind_archives, Icons.Outlined.Archive, Color(0xFF14B8A6)),
    Kind("3D", Res.string.kind_3d, Icons.Outlined.ViewInAr, Color(0xFFF43F5E)),
)

/** A drive role, in the web's words. */
@Composable
fun roleName(role: String): String = when (role) {
    "manager" -> stringResource(Res.string.role_manager)
    "editor" -> stringResource(Res.string.role_editor)
    "viewer" -> stringResource(Res.string.role_viewer)
    else -> role.replaceFirstChar { it.uppercase() }
}

@Composable
fun HomeView(host: Host, home: Home, onChoose: (Home) -> Unit) {
    var choosing by remember { mutableStateOf(false) }
    // Read again each time the menu opens: a drive joined on the web shows up.
    var places by remember { mutableStateOf<Places?>(null) }
    var asked by remember { mutableIntStateOf(0) }
    LaunchedEffect(asked) { host.attempt { places = host.api.places() } }
    val pick = {
        asked++
        choosing = true
    }
    if (choosing) {
        PlaceSheet(places, home, onDismiss = { choosing = false }) {
            choosing = false
            onChoose(it)
        }
    }
    when (home) {
        Home.Mine -> Browser(host, Place(), home.title, onTitle = pick, actions = host.top, bottomBar = host.bar)

        is Home.Team -> {
            val place = Place(drive = home.drive.id)
            Browser(host, place, home.title, canWrite = home.drive.canWrite, onTitle = pick, actions = {
                TrashButton(host, place, home.title)
                host.top(this)
            }, bottomBar = host.bar)
        }

        is Home.Mount -> {
            val place = Place(volume = home.volume.name)
            Browser(host, place, home.title, canWrite = !home.volume.readOnly, onTitle = pick, actions = {
                TrashButton(host, place, home.title)
                host.top(this)
            }, bottomBar = host.bar)
        }

        is Home.Given -> Browser(
            host,
            Place(share = home.grant.id),
            home.title,
            rootPath = home.grant.root.orEmpty(),
            canWrite = home.grant.permission != "read",
            onTitle = pick,
            actions = host.top,
            bottomBar = host.bar,
        )

        Home.Trash -> TrashView(host, Place(), onTitle = pick)

        Home.Shared -> GrantsView(host, { Header(Home.Shared.title, onBack = null, onTitle = pick, actions = host.top) }) { onChoose(Home.Given(it)) }

        Home.Recent -> FlatList(host, home, pick, stringResource(Res.string.empty_recent)) { host.api.recent() }

        Home.Starred -> FlatList(host, home, pick, stringResource(Res.string.empty_starred)) { host.api.starred(it) }

        is Home.Kind -> FlatList(host, home, pick, stringResource(Res.string.empty_category, home.title)) { host.api.category(home.category, it, host.sort) }
    }
}

/** A drive's or a mount's own trash. */
@Composable
private fun TrashButton(host: Host, place: Place, title: String) {
    IconButton(onClick = { host.push(TrashScreen(place)) }) {
        Icon(Icons.Outlined.Delete, stringResource(Res.string.trash_of, title), tint = brand.ink)
    }
}

/** A list across folders: a folder in it opens where it lives, on the web. */
@Composable
fun FlatList(host: Host, home: Home, onTitle: (() -> Unit)?, empty: String, load: suspend (String?) -> Page) {
    val personal = Place()
    Scaffold(
        containerColor = Color.Transparent,
        topBar = { Header(home.title, onBack = null, onTitle = onTitle, actions = host.top) },
        bottomBar = host.bar,
    ) { padding ->
        Listing(home, empty, Modifier.padding(padding), host, load) { item, all ->
            ItemEntry(item, personal, host) {
                if (item.isFolder) host.push(WebScreen("${host.server}/go/folder/${item.metadata.id}")) else host.open(personal, all, item)
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun PlaceSheet(places: Places?, current: Home, onDismiss: () -> Unit, onChoose: (Home) -> Unit) {
    val choose = { home: Home -> { onChoose(home) } }
    val open = stringResource(Res.string.open_now)
    fun mark(home: Home) = if (home == current) open else null
    ModalBottomSheet(onDismissRequest = onDismiss, containerColor = brand.panel) {
        LazyColumn {
            if (places?.driveOnly != true) {
                item {
                    Entry(Icons.Outlined.Folder, Home.Mine.title, mark(Home.Mine), onClick = choose(Home.Mine))
                    Entry(Icons.Outlined.History, Home.Recent.title, mark(Home.Recent), onClick = choose(Home.Recent))
                    Entry(
                        Icons.Outlined.StarBorder,
                        Home.Starred.title,
                        mark(Home.Starred) ?: places?.counts?.starred?.takeIf { it > 0 }?.toString(),
                        onClick = choose(Home.Starred),
                    )
                    Entry(
                        Icons.Outlined.Delete,
                        Home.Trash.title,
                        mark(Home.Trash) ?: places?.counts?.trash?.takeIf { it > 0 }?.let { pluralStringResource(Res.plurals.items_count, it, it) },
                        onClick = choose(Home.Trash),
                    )
                }
            }
            // What is shared, mounted or given: rows stand for it until it is known.
            if (places == null) item { SkeletonList(3) }
            group(Res.string.shared_drives, places?.drives.orEmpty()) { drive ->
                val home = Home.Team(drive)
                Entry(Icons.Outlined.Group, drive.name, mark(home) ?: roleName(drive.role), onClick = choose(home))
            }
            group(Res.string.volumes, places?.volumes.orEmpty()) { volume ->
                val home = Home.Mount(volume)
                Entry(
                    Icons.Outlined.Storage,
                    volume.label,
                    mark(home) ?: if (volume.readOnly) stringResource(Res.string.read_only) else null,
                    onClick = choose(home),
                )
            }
            if (places?.sharedWithMe?.isNotEmpty() == true) {
                item {
                    Entry(
                        Icons.Outlined.FolderShared,
                        Home.Shared.title,
                        mark(Home.Shared) ?: stringResource(Res.string.shared_everything),
                        onClick = choose(Home.Shared),
                    )
                }
            }
            group(null, places?.sharedWithMe.orEmpty()) { grant ->
                val home = Home.Given(grant)
                val icon: ImageVector = if (grant.resourceType == "folder") Icons.Outlined.FolderShared else Icons.AutoMirrored.Outlined.InsertDriveFile
                Entry(icon, grant.name, mark(home) ?: stringResource(Res.string.from_owner, grant.ownerName), onClick = choose(home))
            }
            if (places?.driveOnly != true) {
                item { SheetTitle(stringResource(Res.string.categories)) }
                items(KINDS, key = { it.category }) { kind ->
                    val home = Home.Kind(kind.category, kind.label)
                    Entry(kind.icon, stringResource(kind.label), mark(home), tint = kind.colour, onClick = choose(home))
                }
            }
            item { Spacer(Modifier.height(24.dp)) }
        }
    }
}

private fun <T> androidx.compose.foundation.lazy.LazyListScope.group(title: StringResource?, entries: List<T>, row: @Composable (T) -> Unit) {
    if (entries.isEmpty()) return
    if (title != null) item { SheetTitle(stringResource(title)) }
    items(entries) { row(it) }
}

/** What others shared with this account; one opens as a place of its own. */
@Composable
fun GrantsView(host: Host, header: @Composable () -> Unit, onOpen: (Grant) -> Unit) {
    var grants by remember { mutableStateOf<List<Grant>?>(null) }
    var error by remember { mutableStateOf<String?>(null) }
    LaunchedEffect(Unit) { host.attempt({ error = it }) { grants = host.api.places().sharedWithMe } }
    Scaffold(
        containerColor = Color.Transparent,
        topBar = header,
        bottomBar = host.bar,
    ) { padding ->
        androidx.compose.foundation.layout.Box(Modifier.padding(padding).fillMaxSize()) {
            val list = grants
            when {
                error != null -> Note(error!!, Modifier.align(androidx.compose.ui.Alignment.Center), MaterialTheme.colorScheme.error)

                list == null -> SkeletonList(6)

                list.isEmpty() -> Note(stringResource(Res.string.shared_none), Modifier.align(androidx.compose.ui.Alignment.Center))

                else -> LazyColumn(Modifier.fillMaxSize()) {
                    items(list, key = { it.id }) { grant ->
                        Entry(
                            if (grant.resourceType == "folder") Icons.Outlined.FolderShared else Icons.AutoMirrored.Outlined.InsertDriveFile,
                            grant.name,
                            stringResource(if (grant.permission == "read") Res.string.from_owner_view_only else Res.string.from_owner, grant.ownerName),
                        ) { onOpen(grant) }
                    }
                }
            }
        }
    }
}
