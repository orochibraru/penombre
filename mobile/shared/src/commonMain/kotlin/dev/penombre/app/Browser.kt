package dev.penombre.app

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.outlined.DriveFileMove
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.MoreVert
import androidx.compose.material.icons.outlined.ContentCopy
import androidx.compose.material.icons.outlined.CreateNewFolder
import androidx.compose.material.icons.outlined.Delete
import androidx.compose.material.icons.outlined.DocumentScanner
import androidx.compose.material.icons.outlined.Download
import androidx.compose.material.icons.outlined.Edit
import androidx.compose.material.icons.outlined.Folder
import androidx.compose.material.icons.outlined.FolderCopy
import androidx.compose.material.icons.outlined.FolderOpen
import androidx.compose.material.icons.outlined.Group
import androidx.compose.material.icons.outlined.History
import androidx.compose.material.icons.outlined.PhotoCamera
import androidx.compose.material.icons.outlined.Star
import androidx.compose.material.icons.outlined.StarBorder
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.launch
import org.jetbrains.compose.resources.stringResource

private data class Crumb(val path: String, val title: String)

/**
 * A drive, folder by folder: the account's own, or a shared one. `onExit`
 * leaves it from its root; a drive with none is the app's home.
 */
@Composable
fun Browser(
    host: Host,
    place: Place,
    root: String,
    canWrite: Boolean = true,
    /** Where it starts: a shared folder is browsed from its own path. */
    rootPath: String = "",
    onExit: (() -> Unit)? = null,
    /** At the root, the title opens this: Home's place selector. */
    onTitle: (() -> Unit)? = null,
    actions: @Composable RowScope.() -> Unit = {},
    bottomBar: @Composable () -> Unit,
) {
    val scope = rememberCoroutineScope()
    val stack = remember(place, rootPath) { mutableStateListOf(Crumb(rootPath, root)) }
    val folder = stack.last()
    val nested = stack.size > 1
    // Bumped after a change: the listing is keyed on it and starts over.
    var refresh by remember { mutableStateOf(0) }
    var status by remember { mutableStateOf<String?>(null) }
    var choosing by remember { mutableStateOf(false) }
    var selected by remember { mutableStateOf<Item?>(null) }
    var naming by remember { mutableStateOf(false) }
    var renaming by remember { mutableStateOf<Item?>(null) }
    // The item on its way somewhere, and whether it leaves where it is.
    var sending by remember { mutableStateOf<Pair<Item, Boolean>?>(null) }

    /** Runs a change, says why if it failed, and lists the folder again. */
    fun change(block: suspend () -> Unit) {
        scope.launch {
            host.attempt({ status = it }) {
                block()
                status = null
            }
            refresh++
        }
    }

    val up: () -> Unit = { stack.removeAt(stack.lastIndex) }
    PlatformBack(enabled = nested && LocalShown.current, onBack = up)

    val pick = rememberFilePicker { files ->
        if (files.isEmpty()) return@rememberFilePicker
        val into = folder.path
        scope.launch {
            var failed = 0
            var reason = ""
            files.forEachIndexed { index, file ->
                status = if (files.size == 1) {
                    Words(Res.string.uploading_one, file.name).load()
                } else {
                    Words(Res.string.uploading_many, index + 1, files.size).load()
                }
                host.attempt({
                    failed++
                    reason = it
                }) {
                    if (file.size > MAX_UPLOAD_BYTES) throw Failure(Words(Res.string.upload_too_big, file.name))
                    host.api.upload(place, into, file)
                }
            }
            status = when {
                failed == 0 -> null
                files.size == 1 -> Words(Res.string.upload_failed_one, files.first().name, reason).load()
                else -> Words(Res.string.upload_failed_many, failed, files.size, reason).load()
            }
            refresh++
        }
    }
    if (choosing) {
        AddSheet(onDismiss = { choosing = false }, onFolder = {
            choosing = false
            naming = true
        }) { source ->
            choosing = false
            pick(source)
        }
    }
    if (naming) {
        Prompt(stringResource(Res.string.new_folder), "", stringResource(Res.string.create), onDismiss = { naming = false }) { name ->
            naming = false
            change { host.api.createFolder(place, folder.path, name) }
        }
    }
    renaming?.let { item ->
        Prompt(stringResource(Res.string.rename), item.title, stringResource(Res.string.rename), onDismiss = { renaming = null }) { name ->
            renaming = null
            change { host.api.rename(place, item, childPath(folder.path, item.key), name) }
        }
    }
    sending?.let { (item, move) ->
        DestinationSheet(
            host,
            stringResource(if (move) Res.string.move_title else Res.string.copy_title, item.title),
            stringResource(if (move) Res.string.move_here else Res.string.copy_here),
            { sending = null },
        ) { to, into ->
            sending = null
            change { host.api.transfer(place, item, childPath(folder.path, item.key), to, into, move) }
        }
    }
    selected?.let { item ->
        val path = childPath(folder.path, item.key)
        ItemSheet(item, canWrite, onDismiss = { selected = null }) { action ->
            selected = null
            when (action) {
                ItemAction.Versions -> host.push(VersionsScreen(place, item))

                ItemAction.Rename -> renaming = item

                ItemAction.Move -> sending = item to true

                ItemAction.Copy -> sending = item to false

                ItemAction.Download -> saveToDevice(
                    rawUrl(host.server, place, item.metadata.id),
                    host.api.session.token,
                    item.title,
                ) { done -> scope.launch { status = done?.load() } }

                // A copy into the folder it is already in.
                ItemAction.Duplicate -> change { host.api.transfer(place, item, path, place, folder.path, move = false) }

                ItemAction.Star -> change { host.api.setStarred(place, item, path, !item.metadata.isStarred) }

                ItemAction.Trash -> change { host.api.setTrashed(place, item, path, true) }
            }
        }
    }

    Scaffold(
        containerColor = Color.Transparent,
        topBar = {
            Header(
                // The root's own name, not the crumb's: it follows the language.
                title = if (nested) folder.title else root,
                onBack = if (nested) up else onExit,
                moon = !nested && onExit == null,
                onTitle = onTitle.takeIf { !nested },
                actions = actions,
            )
        },
        floatingActionButton = {
            if (canWrite) {
                val shape = RoundedCornerShape(20.dp)
                Box(
                    Modifier.size(58.dp).shadow(14.dp, shape, ambientColor = brand.glow, spotColor = brand.glow)
                        .clip(shape).background(brand.gradient)
                        .clickable(role = Role.Button, onClickLabel = stringResource(Res.string.add_files)) { choosing = true },
                    contentAlignment = Alignment.Center,
                ) { Icon(Icons.Default.Add, stringResource(Res.string.add_files), tint = Color.White) }
            }
        },
        bottomBar = bottomBar,
    ) { padding ->
        Box(Modifier.padding(padding)) {
            Listing(
                source = Triple(place, folder, refresh),
                empty = stringResource(Res.string.empty_folder),
                modifier = Modifier,
                host = host,
                load = { host.api.list(place, folder.path, it, host.sort) },
            ) { item, all ->
                ItemEntry(
                    item,
                    place,
                    host,
                    trailing = {
                        IconButton(onClick = { selected = item }) {
                            Icon(Icons.Default.MoreVert, stringResource(Res.string.options_for, item.title), tint = brand.muted)
                        }
                    },
                ) {
                    if (item.isFolder) {
                        stack.add(Crumb(childPath(folder.path, item.key), item.title))
                    } else {
                        host.open(place, all, item)
                    }
                }
            }
            status?.let {
                Text(
                    it,
                    Modifier.align(Alignment.BottomStart).padding(start = 20.dp, end = 96.dp, bottom = 22.dp)
                        .clip(Corner).background(brand.panel.copy(alpha = 0.94f))
                        .clickable { status = null }.padding(horizontal = 14.dp, vertical = 10.dp),
                    color = brand.ink,
                    style = MaterialTheme.typography.bodyMedium,
                )
            }
        }
    }
}

@Composable
fun SheetTitle(text: String) {
    Text(
        text,
        Modifier.padding(horizontal = 20.dp, vertical = 8.dp),
        color = brand.ink,
        style = MaterialTheme.typography.titleMedium,
        fontWeight = FontWeight.SemiBold,
    )
}

/** Where the new files come from; only what this device can do is offered. */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun AddSheet(onDismiss: () -> Unit, onFolder: () -> Unit, onChoose: (Source) -> Unit) {
    ModalBottomSheet(onDismissRequest = onDismiss, containerColor = brand.panel) {
        SheetTitle(stringResource(Res.string.add_title))
        availableSources().forEach { source ->
            when (source) {
                Source.Files -> Entry(Icons.Outlined.FolderOpen, stringResource(Res.string.add_choose), stringResource(Res.string.add_choose_hint)) { onChoose(source) }
                Source.Camera -> Entry(Icons.Outlined.PhotoCamera, stringResource(Res.string.add_photo), stringResource(Res.string.add_photo_hint)) { onChoose(source) }
                Source.Scan -> Entry(Icons.Outlined.DocumentScanner, stringResource(Res.string.add_scan), stringResource(Res.string.add_scan_hint)) { onChoose(source) }
            }
        }
        Entry(Icons.Outlined.CreateNewFolder, stringResource(Res.string.new_folder), onClick = onFolder)
        Spacer(Modifier.height(24.dp))
    }
}

private enum class ItemAction { Star, Versions, Rename, Duplicate, Move, Copy, Download, Trash }

/** What can be done with one file or folder; a read-only drive changes nothing. */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun ItemSheet(item: Item, canWrite: Boolean, onDismiss: () -> Unit, onChoose: (ItemAction) -> Unit) {
    ModalBottomSheet(onDismissRequest = onDismiss, containerColor = brand.panel) {
        LazyColumn {
            item {
                SheetTitle(item.title)
                if (!item.isFolder) {
                    Entry(Icons.Outlined.Download, stringResource(Res.string.download), stringResource(Res.string.download_hint)) { onChoose(ItemAction.Download) }
                    Entry(Icons.Outlined.History, stringResource(Res.string.versions), stringResource(Res.string.versions_hint)) { onChoose(ItemAction.Versions) }
                }
                if (item.metadata.isStarred) {
                    Entry(Icons.Outlined.Star, stringResource(Res.string.unstar)) { onChoose(ItemAction.Star) }
                } else {
                    Entry(Icons.Outlined.StarBorder, stringResource(Res.string.star)) { onChoose(ItemAction.Star) }
                }
                if (canWrite) {
                    Entry(Icons.Outlined.Edit, stringResource(Res.string.rename)) { onChoose(ItemAction.Rename) }
                    Entry(Icons.AutoMirrored.Outlined.DriveFileMove, stringResource(Res.string.move_to)) { onChoose(ItemAction.Move) }
                    Entry(Icons.Outlined.ContentCopy, stringResource(Res.string.duplicate)) { onChoose(ItemAction.Duplicate) }
                }
                Entry(Icons.Outlined.FolderCopy, stringResource(Res.string.copy_to), stringResource(Res.string.copy_to_hint)) { onChoose(ItemAction.Copy) }
                if (canWrite) {
                    Entry(Icons.Outlined.Delete, stringResource(Res.string.move_to_trash), tint = MaterialTheme.colorScheme.error) { onChoose(ItemAction.Trash) }
                }
                Spacer(Modifier.height(24.dp))
            }
        }
    }
}

/** A place to put something: your drive or a shared one you can write to, then a folder in it. */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun DestinationSheet(host: Host, title: String, action: String, onDismiss: () -> Unit, onChoose: (Place, String) -> Unit) {
    // Null until a drive is picked; then the folders opened, innermost last.
    var place by remember { mutableStateOf<Place?>(null) }
    val stack = remember { mutableStateListOf<Crumb>() }
    // Null until known: skeleton rows stand for them meanwhile.
    var drives by remember { mutableStateOf<List<Drive>?>(null) }
    LaunchedEffect(Unit) { host.attempt({ drives = emptyList() }) { drives = host.api.drives().filter { it.canWrite } } }

    ModalBottomSheet(onDismissRequest = onDismiss, containerColor = brand.panel) {
        SheetTitle(title)
        val chosen = place
        if (chosen == null) {
            val mine = stringResource(Res.string.my_drive)
            Entry(Icons.Outlined.Folder, mine) {
                place = Place()
                stack.add(Crumb("", mine))
            }
            if (drives == null) SkeletonRow()
            drives.orEmpty().forEach { drive ->
                Entry(Icons.Outlined.Group, drive.name, stringResource(Res.string.shared_drive)) {
                    place = Place(drive.id)
                    stack.add(Crumb("", drive.name))
                }
            }
            Spacer(Modifier.height(24.dp))
        } else {
            val folder = stack.last()
            Entry(Icons.AutoMirrored.Filled.ArrowBack, folder.title, stringResource(Res.string.back), tint = brand.muted) {
                stack.removeAt(stack.lastIndex)
                if (stack.isEmpty()) place = null
            }
            Listing(
                source = chosen to folder,
                empty = stringResource(Res.string.no_folders),
                modifier = Modifier.height(280.dp),
                host = host,
                // Folders only: a file is not somewhere to put things.
                load = { cursor -> host.api.list(chosen, folder.path, cursor).let { page -> page.copy(list = page.list.filter { it.isFolder }) } },
            ) { item, _ ->
                ItemEntry(item, chosen, host) { stack.add(Crumb(childPath(folder.path, item.key), item.title)) }
            }
            Box(Modifier.padding(horizontal = 20.dp, vertical = 12.dp)) {
                GradientButton(action, enabled = true) { onChoose(chosen, folder.path) }
            }
            Spacer(Modifier.height(16.dp))
        }
    }
}
