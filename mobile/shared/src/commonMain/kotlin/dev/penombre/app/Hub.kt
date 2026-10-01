package dev.penombre.app

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowRight
import androidx.compose.material.icons.automirrored.filled.Logout
import androidx.compose.material.icons.automirrored.outlined.ListAlt
import androidx.compose.material.icons.outlined.Add
import androidx.compose.material.icons.outlined.Badge
import androidx.compose.material.icons.outlined.Delete
import androidx.compose.material.icons.outlined.Devices
import androidx.compose.material.icons.outlined.FolderShared
import androidx.compose.material.icons.outlined.Group
import androidx.compose.material.icons.outlined.Link
import androidx.compose.material.icons.outlined.Notifications
import androidx.compose.material.icons.outlined.Palette
import androidx.compose.material.icons.outlined.Security
import androidx.compose.material.icons.outlined.Settings
import androidx.compose.material.icons.outlined.Storage
import androidx.compose.material.icons.outlined.Tune
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
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
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.launch
import org.jetbrains.compose.resources.pluralStringResource
import org.jetbrains.compose.resources.stringResource

/**
 * The top right of every tab: the bell, with what is unread on it, and the
 * account's avatar, which opens the Account page.
 */
@Composable
fun AccountButtons(scope: RowScope, name: String, unread: Int, onBell: () -> Unit, onAccount: () -> Unit) {
    with(scope) {
        IconButton(onClick = onBell) {
            Box {
                Icon(
                    Icons.Outlined.Notifications,
                    if (unread > 0) pluralStringResource(Res.plurals.notifications_unread, unread, unread) else stringResource(Res.string.notifications),
                    tint = brand.ink,
                )
                if (unread > 0) {
                    Box(
                        Modifier.align(Alignment.TopEnd).offset(x = 6.dp, y = (-4).dp).size(16.dp).clip(CircleShape).background(brand.accent),
                        contentAlignment = Alignment.Center,
                    ) {
                        Text(if (unread > 9) "9+" else "$unread", color = Color.White, fontSize = 9.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
        val account = stringResource(Res.string.your_account)
        Avatar(name, 34.dp, Modifier.padding(horizontal = 6.dp).clip(CircleShape).clickable(onClickLabel = account, role = Role.Button, onClick = onAccount))
    }
}

/** The account's initials on the logo's gradient. */
@Composable
fun Avatar(name: String, size: androidx.compose.ui.unit.Dp, modifier: Modifier = Modifier) {
    Box(modifier.size(size).clip(CircleShape).background(brand.gradient), contentAlignment = Alignment.Center) {
        Text(
            initials(name),
            color = Color.White,
            fontSize = (size.value * 0.38f).sp,
            fontWeight = FontWeight.SemiBold,
        )
    }
}

/** A card that leads somewhere: a tile, a title, what is inside, a chevron. */
@Composable
fun CardLink(
    title: String,
    detail: String?,
    icon: ImageVector? = null,
    tint: Color = brand.accent,
    leading: (@Composable () -> Unit)? = null,
    onClick: () -> Unit,
) {
    Row(
        Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 6.dp).clip(Corner)
            .background(brand.panel.copy(alpha = 0.72f))
            .border(1.dp, brand.muted.copy(alpha = 0.14f), Corner)
            .clickable(role = Role.Button, onClick = onClick)
            .padding(horizontal = 16.dp, vertical = 14.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        if (leading != null) {
            leading()
        } else if (icon != null) {
            Box(Modifier.size(44.dp).clip(Corner).background(tint.copy(alpha = 0.14f)), contentAlignment = Alignment.Center) {
                Icon(icon, null, tint = tint)
            }
        }
        Spacer(Modifier.width(14.dp))
        Column(Modifier.weight(1f)) {
            Text(title, color = brand.ink, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold, maxLines = 1, overflow = TextOverflow.Ellipsis)
            detail?.let { Text(it, color = brand.muted, style = MaterialTheme.typography.bodySmall, maxLines = 2, overflow = TextOverflow.Ellipsis) }
        }
        Icon(Icons.AutoMirrored.Filled.KeyboardArrowRight, null, tint = brand.muted)
    }
}

/** A page of card links under a back arrow. */
@Composable
private fun CardPage(host: Host, title: String, content: @Composable () -> Unit) {
    Scaffold(
        containerColor = Color.Transparent,
        topBar = { Header(title, onBack = host.back) },
        bottomBar = host.bar,
    ) { padding ->
        LazyColumn(Modifier.padding(padding).fillMaxSize()) {
            item {
                Spacer(Modifier.height(8.dp))
                content()
                Spacer(Modifier.height(96.dp))
            }
        }
    }
}

/**
 * What the avatar opens: the profile, the settings, and the way out, with the
 * app's version under it.
 */
@Composable
fun AccountView(host: Host, onSignOut: () -> Unit) {
    val session = host.api.session
    CardPage(host, stringResource(Res.string.account)) {
        CardLink(
            stringResource(Res.string.my_profile),
            stringResource(Res.string.my_profile_hint, session.userName),
            leading = { Avatar(session.userName, 44.dp) },
        ) { host.push(ProfileHubScreen) }
        CardLink(stringResource(Res.string.settings), stringResource(Res.string.settings_hint), Icons.Outlined.Settings) { host.push(SettingsHubScreen) }
        Spacer(Modifier.height(20.dp))
        Row(
            Modifier.fillMaxWidth().padding(horizontal = 16.dp).clip(Corner)
                .border(1.dp, MaterialTheme.colorScheme.error.copy(alpha = 0.4f), Corner)
                .clickable(role = Role.Button, onClick = onSignOut)
                .padding(vertical = 14.dp),
            horizontalArrangement = Arrangement.Center,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Icon(Icons.AutoMirrored.Filled.Logout, null, tint = MaterialTheme.colorScheme.error)
            Spacer(Modifier.width(10.dp))
            Text(stringResource(Res.string.sign_out), color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
        }
        Spacer(Modifier.height(24.dp))
        Text(
            "Penombre $appVersion\n${host.server}",
            Modifier.fillMaxWidth(),
            color = brand.muted,
            style = MaterialTheme.typography.bodySmall,
            textAlign = androidx.compose.ui.text.style.TextAlign.Center,
        )
    }
}

/** "My profile": one card per account tab of the web interface. */
@Composable
fun ProfileHubView(host: Host) {
    CardPage(host, stringResource(Res.string.my_profile)) {
        CardLink(
            stringResource(ProfileSection.Details.title),
            stringResource(Res.string.profile_details_hint),
            Icons.Outlined.Badge,
        ) { host.push(ProfileScreen(ProfileSection.Details)) }
        CardLink(
            stringResource(ProfileSection.Security.title),
            stringResource(Res.string.profile_security_hint),
            Icons.Outlined.Security,
        ) { host.push(ProfileScreen(ProfileSection.Security)) }
        CardLink(
            stringResource(ProfileSection.Sessions.title),
            stringResource(Res.string.profile_sessions_hint),
            Icons.Outlined.Devices,
        ) { host.push(ProfileScreen(ProfileSection.Sessions)) }
        CardLink(stringResource(Res.string.activity), stringResource(Res.string.activity_hint), Icons.AutoMirrored.Outlined.ListAlt) { host.push(ActivityScreen) }
    }
}

/** Settings: one card per settings tab of the web interface. */
@Composable
fun SettingsHubView(host: Host) {
    CardPage(host, stringResource(Res.string.settings)) {
        CardLink(
            stringResource(SettingsSection.General.title),
            stringResource(Res.string.settings_general_hint),
            Icons.Outlined.Tune,
        ) { host.push(SettingsScreen(SettingsSection.General)) }
        CardLink(
            stringResource(SettingsSection.Appearance.title),
            stringResource(Res.string.settings_appearance_hint),
            Icons.Outlined.Palette,
        ) { host.push(SettingsScreen(SettingsSection.Appearance)) }
        CardLink(
            stringResource(SettingsSection.Storage.title),
            stringResource(Res.string.settings_storage_hint),
            Icons.Outlined.Storage,
        ) { host.push(SettingsScreen(SettingsSection.Storage)) }
    }
}

/** The Shared tab: the links you made, what others shared, and the shared drives. */
@Composable
fun SharedTab(host: Host) {
    val scope = rememberCoroutineScope()
    var places by remember { mutableStateOf<Places?>(null) }
    var error by remember { mutableStateOf<String?>(null) }
    var naming by remember { mutableStateOf(false) }
    var reload by remember { mutableIntStateOf(0) }
    LaunchedEffect(reload) { host.attempt({ error = it }) { places = host.api.places() } }
    if (naming) {
        Prompt(stringResource(Res.string.new_shared_drive), "", stringResource(Res.string.create), onDismiss = { naming = false }) { name ->
            naming = false
            scope.launch {
                host.attempt({ error = it }) {
                    host.api.createDrive(name)
                    reload++
                }
            }
        }
    }
    Scaffold(
        containerColor = Color.Transparent,
        topBar = { Header(stringResource(Res.string.tab_shared), onBack = null, actions = host.top) },
        bottomBar = host.bar,
    ) { padding ->
        val loaded = places
        LazyColumn(Modifier.padding(padding).fillMaxSize()) {
            item {
                Spacer(Modifier.height(8.dp))
                CardLink(stringResource(Res.string.my_links), stringResource(Res.string.my_links_hint), Icons.Outlined.Link) { host.push(LinksScreen) }
                if (loaded?.simpleMode != true) {
                    CardLink(
                        stringResource(Res.string.shared_with_me),
                        loaded?.sharedWithMe?.size?.let {
                            if (it == 0) stringResource(Res.string.nothing_yet) else pluralStringResource(Res.plurals.items_count, it, it)
                        },
                        Icons.Outlined.FolderShared,
                    ) { host.push(GrantsScreen) }
                }
                Section(stringResource(Res.string.shared_drives))
                error?.let { Note(it, colour = MaterialTheme.colorScheme.error) }
                if (loaded == null && error == null) SkeletonList(2)
                if (loaded != null && loaded.drives.isEmpty()) Note(stringResource(Res.string.drives_none))
            }
            items(loaded?.drives.orEmpty(), key = { it.id }) { drive ->
                Entry(Icons.Outlined.Group, drive.name, roleName(drive.role)) { host.push(DriveScreen(drive)) }
            }
            item {
                if (loaded != null && !loaded.simpleMode && !loaded.driveOnly) {
                    Entry(
                        Icons.Outlined.Add,
                        stringResource(Res.string.new_shared_drive),
                        stringResource(Res.string.new_shared_drive_hint),
                        tint = brand.muted,
                    ) { naming = true }
                }
                Spacer(Modifier.height(96.dp))
            }
        }
    }
}

/** One shared drive, opened from the Shared tab: its own browser and trash. */
@Composable
fun DriveView(host: Host, drive: Drive) {
    val place = Place(drive = drive.id)
    Browser(
        host = host,
        place = place,
        root = drive.name,
        canWrite = drive.canWrite,
        onExit = host.back,
        actions = {
            IconButton(onClick = { host.push(TrashScreen(place)) }) {
                Icon(Icons.Outlined.Delete, stringResource(Res.string.trash_of, drive.name), tint = brand.ink)
            }
        },
        bottomBar = host.bar,
    )
}

/** Something shared with this account, opened from the Shared tab. */
@Composable
fun GrantView(host: Host, grant: Grant) {
    Browser(
        host = host,
        place = Place(share = grant.id),
        root = grant.name,
        rootPath = grant.root.orEmpty(),
        canWrite = grant.permission != "read",
        onExit = host.back,
        bottomBar = host.bar,
    )
}
