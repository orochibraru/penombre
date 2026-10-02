package dev.penombre.app

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.InsertDriveFile
import androidx.compose.material.icons.outlined.Cancel
import androidx.compose.material.icons.outlined.ChatBubbleOutline
import androidx.compose.material.icons.outlined.Draw
import androidx.compose.material.icons.outlined.Folder
import androidx.compose.material.icons.outlined.Info
import androidx.compose.material.icons.outlined.Link
import androidx.compose.material.icons.outlined.Notifications
import androidx.compose.material.icons.outlined.Person
import androidx.compose.material.icons.outlined.Share
import androidx.compose.material.icons.outlined.WarningAmber
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.launch
import org.jetbrains.compose.resources.pluralStringResource
import org.jetbrains.compose.resources.stringResource

/**
 * The notifications, newest first. Opening the screen reads them all; a
 * shared item goes to Shared with me, a note or a signature to the file on
 * the web.
 */
@Composable
fun NotificationsView(host: Host, onUnread: (Int) -> Unit) {
    val scope = rememberCoroutineScope()
    var notices by remember { mutableStateOf<List<Notice>?>(null) }
    var error by remember { mutableStateOf<String?>(null) }
    LaunchedEffect(Unit) {
        host.attempt({ error = it }) {
            val loaded = host.api.notices(100)
            notices = loaded.notifications
            if (loaded.unread > 0) onUnread(host.api.markRead())
        }
    }
    Scaffold(
        containerColor = Color.Transparent,
        topBar = { Header(stringResource(Res.string.notifications), onBack = host.back) },
        bottomBar = host.bar,
    ) { padding ->
        Box(Modifier.padding(padding).fillMaxSize()) {
            val list = notices
            when {
                error != null -> Note(error!!, Modifier.align(Alignment.Center), MaterialTheme.colorScheme.error)

                list == null -> SkeletonList()

                list.isEmpty() -> Note(stringResource(Res.string.notifications_empty), Modifier.align(Alignment.Center))

                else -> LazyColumn(Modifier.fillMaxSize()) {
                    items(list, key = { it.id }) { notice ->
                        Entry(
                            when (notice.type) {
                                "share" -> Icons.Outlined.Share
                                "signature_completed" -> Icons.Outlined.Draw
                                "signature_declined" -> Icons.Outlined.Cancel
                                else -> Icons.Outlined.ChatBubbleOutline
                            },
                            notice.words.text(),
                            shortDate(notice.createdAt),
                            // What was unread when the screen opened keeps its accent.
                            tint = if (notice.read) brand.muted else brand.accent,
                            onClick = notice.link?.let { link -> { scope.launch { host.attempt({ error = it }) { follow(host, link) } } } },
                        )
                    }
                }
            }
        }
    }
}

/** Where a notification's link leads: natively where the app has the place. */
private suspend fun follow(host: Host, link: String) {
    val drive = link.removePrefix("/drives/").takeIf { it != link }?.substringBefore('/')
    when {
        link.startsWith("/shared-with-me") -> host.goHome(Home.Shared)

        drive != null -> host.api.places().drives.find { it.id == drive }?.let { host.goHome(Home.Team(it)) }
            ?: host.push(WebScreen("${host.server}$link"))

        else -> host.push(WebScreen("${host.server}$link"))
    }
}

/** "My links": every public link the account made, to copy or revoke. */
@Composable
fun LinksView(host: Host) {
    val scope = rememberCoroutineScope()
    var links by remember { mutableStateOf<List<ShareLink>?>(null) }
    var status by remember { mutableStateOf<String?>(null) }
    var revoking by remember { mutableStateOf<ShareLink?>(null) }
    var reload by remember { mutableIntStateOf(0) }

    @Suppress("DEPRECATION")
    val clipboard = LocalClipboardManager.current
    LaunchedEffect(reload) { host.attempt({ status = it }) { links = host.api.links() } }
    revoking?.let { link ->
        Confirm(
            stringResource(Res.string.revoke_title, link.resourceName),
            stringResource(Res.string.revoke_text),
            stringResource(Res.string.revoke),
            { revoking = null },
        ) {
            revoking = null
            scope.launch {
                host.attempt({ status = it }) {
                    host.api.revokeLink(link.id)
                    reload++
                }
            }
        }
    }
    Scaffold(
        containerColor = Color.Transparent,
        topBar = { Header(stringResource(Res.string.my_links), onBack = host.back) },
        bottomBar = host.bar,
    ) { padding ->
        Box(Modifier.padding(padding).fillMaxSize()) {
            val list = links
            when {
                list == null && status == null -> SkeletonList()

                list.isNullOrEmpty() -> Note(status ?: stringResource(Res.string.links_none), Modifier.align(Alignment.Center))

                else -> LazyColumn(Modifier.fillMaxSize()) {
                    status?.let { item { Note(it, colour = MaterialTheme.colorScheme.error) } }
                    items(list, key = { it.id }) { link ->
                        val url = "${host.server}/s/${link.token}"
                        Column {
                            Entry(
                                if (link.resourceType == "folder") Icons.Outlined.Folder else Icons.AutoMirrored.Outlined.InsertDriveFile,
                                link.resourceName,
                                listOfNotNull(
                                    stringResource(Res.string.link_made, shortDate(link.createdAt)),
                                    link.expiresAt?.let { stringResource(Res.string.expires, shortDate(it)) },
                                    pluralStringResource(Res.plurals.downloads_count, link.downloadCount, link.downloadCount),
                                    stringResource(Res.string.link_password).takeIf { link.hasPassword },
                                    stringResource(Res.string.link_accounts_only).takeIf { link.requiresAuth },
                                ).joinToString(" · "),
                                trailing = {
                                    TextButton(onClick = {
                                        clipboard.setText(AnnotatedString(url))
                                        status = null
                                    }) { Text(stringResource(Res.string.copy), color = brand.accent) }
                                    TextButton(onClick = { revoking = link }) { Text(stringResource(Res.string.revoke), color = MaterialTheme.colorScheme.error) }
                                },
                            )
                        }
                    }
                }
            }
        }
    }
}

/** The account's activity log, as the web's Activity page. */
@Composable
fun ActivityView(host: Host) {
    var entries by remember { mutableStateOf<List<ActivityEntry>?>(null) }
    var error by remember { mutableStateOf<String?>(null) }
    LaunchedEffect(Unit) { host.attempt({ error = it }) { entries = host.api.activity() } }
    Scaffold(
        containerColor = Color.Transparent,
        topBar = { Header(stringResource(Res.string.activity), onBack = host.back) },
        bottomBar = host.bar,
    ) { padding ->
        Box(Modifier.padding(padding).fillMaxSize()) {
            val list = entries
            when {
                error != null -> Note(error!!, Modifier.align(Alignment.Center), MaterialTheme.colorScheme.error)

                list == null -> SkeletonList()

                list.isEmpty() -> Note(stringResource(Res.string.activity_none), Modifier.align(Alignment.Center))

                else -> LazyColumn(Modifier.fillMaxSize()) {
                    items(list, key = { it.id }) { entry ->
                        Entry(
                            if (entry.level == "info") Icons.Outlined.Info else Icons.Outlined.WarningAmber,
                            entry.message,
                            "${entry.action} · ${entry.createdAt.take(16).replace('T', ' ')}",
                            tint = if (entry.level == "info") brand.muted else MaterialTheme.colorScheme.error,
                        )
                    }
                }
            }
        }
    }
}
