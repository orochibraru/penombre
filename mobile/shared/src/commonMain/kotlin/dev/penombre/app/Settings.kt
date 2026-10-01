package dev.penombre.app

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Check
import androidx.compose.material.icons.outlined.Language
import androidx.compose.material.icons.outlined.NotificationsActive
import androidx.compose.material.icons.outlined.PhoneIphone
import androidx.compose.material.icons.outlined.Translate
import androidx.compose.material3.Checkbox
import androidx.compose.material3.CheckboxDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import kotlinx.serialization.json.JsonPrimitive
import org.jetbrains.compose.resources.StringResource
import org.jetbrains.compose.resources.pluralStringResource
import org.jetbrains.compose.resources.stringResource

/** The web's Settings tabs, one screen each under Settings. */
enum class SettingsSection(val title: StringResource) {
    General(Res.string.settings_general),
    Appearance(Res.string.settings_appearance),
    Storage(Res.string.settings_storage),
}

/** What the settings screens read and change; held by the app, shared by all three. */
class SettingsState(
    val look: Look,
    val onMode: (String) -> Unit,
    /** The app's language; null follows the phone's. */
    val language: String?,
    val prefs: Preferences?,
    val onPreference: (String, JsonPrimitive) -> Unit,
    /** One notification type on one channel, saved with all the others. */
    val onChannel: (type: String, channel: String, on: Boolean) -> Unit,
    val phoneAlerts: Boolean,
    val onPhoneAlerts: (Boolean) -> Unit,
)

/**
 * One of the web's Settings tabs, plus what only this device decides (light
 * or dark, notifications on the phone). A change to the account's
 * preferences shows at once and is undone if the server refuses it.
 */
@Composable
fun SettingsView(host: Host, section: SettingsSection, state: SettingsState) {
    var overview by remember { mutableStateOf<Overview?>(null) }
    var usage by remember { mutableStateOf<Usage?>(null) }
    var failed by remember { mutableStateOf<String?>(null) }
    LaunchedEffect(section) {
        host.attempt({ failed = it }) {
            overview = host.api.overview()
            if (section == SettingsSection.Storage) usage = host.api.usage()
        }
    }
    Scaffold(
        containerColor = Color.Transparent,
        topBar = { Header(stringResource(section.title), onBack = host.back) },
        bottomBar = host.bar,
    ) { padding ->
        LazyColumn(Modifier.padding(padding).fillMaxSize()) {
            item {
                when (section) {
                    SettingsSection.General -> General(overview, state)

                    SettingsSection.Appearance -> Appearance(overview, state)

                    SettingsSection.Storage -> when {
                        usage != null -> Storage(usage!!)
                        failed != null -> Note(failed!!)
                        overview?.driveOnly == true -> Note(stringResource(Res.string.storage_drive_only))
                        else -> StorageSkeleton()
                    }
                }
                Spacer(Modifier.height(96.dp))
            }
        }
    }
}

@Composable
private fun General(overview: Overview?, state: SettingsState) {
    Section(stringResource(Res.string.language))
    var choosing by remember { mutableStateOf(false) }
    Entry(
        Icons.Outlined.Language,
        state.language?.let { LANGUAGES[it] } ?: stringResource(Res.string.language_automatic),
        stringResource(Res.string.language_hint),
    ) { choosing = true }
    if (choosing) {
        LanguageSheet(state.language, onDismiss = { choosing = false }) {
            choosing = false
            state.onPreference("language", JsonPrimitive(it))
        }
    }
    Section(stringResource(Res.string.notifications))
    Toggle(
        Icons.Outlined.NotificationsActive,
        stringResource(Res.string.alerts_phone),
        stringResource(Res.string.alerts_phone_hint),
        state.phoneAlerts,
        onChange = state.onPhoneAlerts,
    )
    state.prefs?.let { NotificationGrid(it, smtp = overview?.smtpAvailable == true, state.onChannel) }
}

private val NOTIFICATION_NAMES = listOf(
    Res.string.notif_type_note,
    Res.string.notif_type_share,
    Res.string.notif_type_signature_completed,
    Res.string.notif_type_signature_declined,
)

private val CHANNEL_NAMES = listOf(
    "inApp" to Res.string.notif_channel_in_app,
    "email" to Res.string.notif_channel_email,
    "phone" to Res.string.notif_channel_phone,
)

/**
 * The web's grid: each kind of notification on each channel. Email needs the
 * server's mail; the phone only shows what the bell keeps.
 */
@Composable
private fun NotificationGrid(prefs: Preferences, smtp: Boolean, onChannel: (String, String, Boolean) -> Unit) {
    Text(
        stringResource(Res.string.notif_settings_hint),
        Modifier.padding(start = 20.dp, end = 20.dp, top = 12.dp),
        color = brand.muted,
        style = MaterialTheme.typography.bodySmall,
    )
    Column(Modifier.fillMaxWidth().padding(horizontal = 20.dp, vertical = 8.dp).clip(Corner).background(brand.panel.copy(alpha = 0.7f)).padding(vertical = 4.dp)) {
        Row(Modifier.padding(horizontal = 12.dp, vertical = 6.dp), verticalAlignment = Alignment.Bottom) {
            Spacer(Modifier.weight(1.4f))
            CHANNEL_NAMES.forEach { (_, name) ->
                Text(
                    stringResource(name),
                    Modifier.weight(1f),
                    color = brand.muted,
                    style = MaterialTheme.typography.labelSmall,
                    textAlign = TextAlign.Center,
                )
            }
        }
        NOTIFICATION_TYPES.forEachIndexed { index, type ->
            val channels = prefs.channels(type)
            val name = stringResource(NOTIFICATION_NAMES[index])
            Row(Modifier.padding(horizontal = 12.dp), verticalAlignment = Alignment.CenterVertically) {
                Text(name, Modifier.weight(1.4f), color = brand.ink, style = MaterialTheme.typography.bodyMedium)
                CHANNEL_NAMES.forEach { (channel, label) ->
                    val on = when (channel) {
                        "inApp" -> channels.inApp
                        "email" -> channels.email
                        else -> channels.phone
                    }
                    val described = "$name · ${stringResource(label)}"
                    Box(Modifier.weight(1f), contentAlignment = Alignment.Center) {
                        Checkbox(
                            checked = on,
                            onCheckedChange = { onChannel(type, channel, it) },
                            enabled = when (channel) {
                                "email" -> smtp
                                "phone" -> channels.inApp
                                else -> true
                            },
                            colors = CheckboxDefaults.colors(checkedColor = brand.accent),
                            modifier = Modifier.semantics { contentDescription = described },
                        )
                    }
                }
            }
        }
    }
    Text(
        if (smtp) {
            stringResource(Res.string.notif_phone_hint)
        } else {
            stringResource(Res.string.notif_no_smtp) + " " + stringResource(Res.string.notif_phone_hint)
        },
        Modifier.padding(start = 20.dp, end = 20.dp, bottom = 8.dp),
        color = brand.muted,
        style = MaterialTheme.typography.bodySmall,
    )
}

/**
 * The phone's language or one of the web's, each named in itself: someone
 * lost in the wrong one still finds theirs.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun LanguageSheet(chosen: String?, onDismiss: () -> Unit, onChoose: (String?) -> Unit) {
    val phone = spoken(null)
    ModalBottomSheet(onDismissRequest = onDismiss, containerColor = brand.panel) {
        LazyColumn {
            item {
                SheetTitle(stringResource(Res.string.language))
                LanguageOption(Icons.Outlined.PhoneIphone, stringResource(Res.string.language_automatic), LANGUAGES[phone], chosen == null) { onChoose(null) }
            }
            items(LANGUAGES.entries.toList(), key = { it.key }) { (tag, name) ->
                LanguageOption(Icons.Outlined.Translate, name, null, chosen == tag) { onChoose(tag) }
            }
            item { Spacer(Modifier.height(24.dp)) }
        }
    }
}

@Composable
private fun LanguageOption(icon: androidx.compose.ui.graphics.vector.ImageVector, name: String, detail: String?, on: Boolean, onClick: () -> Unit) {
    Entry(
        icon,
        name,
        detail,
        tint = if (on) brand.accent else brand.muted,
        trailing = { if (on) Icon(Icons.Outlined.Check, null, Modifier.padding(end = 8.dp), tint = brand.accent) },
        onClick = if (on) null else onClick,
    )
}

@Composable
private fun Appearance(overview: Overview?, state: SettingsState) {
    val look = state.look
    val choose = state.onPreference
    Section(stringResource(Res.string.theme))
    Label(stringResource(Res.string.theme_mode), stringResource(Res.string.theme_mode_hint))
    Choices(
        listOf(
            "system" to stringResource(Res.string.mode_system),
            "light" to stringResource(Res.string.mode_light),
            "dark" to stringResource(Res.string.mode_dark),
        ),
        look.mode,
        state.onMode,
    )
    Label(stringResource(Res.string.accent), stringResource(Res.string.accent_hint))
    Accents(look.accent) { choose("accent", JsonPrimitive(it)) }
    Label(stringResource(Res.string.font), stringResource(Res.string.font_hint))
    Choices(listOf("sans" to stringResource(Res.string.font_sans), "mono" to stringResource(Res.string.font_mono)), look.font) {
        choose("fontFamily", JsonPrimitive(it))
    }
    Label(stringResource(Res.string.corners), stringResource(Res.string.corners_hint))
    Choices(listOf("rounded" to stringResource(Res.string.corners_rounded), "boxy" to stringResource(Res.string.corners_boxy)), look.corners) {
        choose("corners", JsonPrimitive(it))
    }
    val p = state.prefs ?: return
    Section(stringResource(Res.string.files))
    Label(stringResource(Res.string.sort_by), stringResource(Res.string.sort_by_hint))
    Choices(
        listOf(
            "updatedAt" to stringResource(Res.string.sort_modified),
            "name" to stringResource(Res.string.name),
            "size" to stringResource(Res.string.sort_size),
            "type" to stringResource(Res.string.sort_type),
        ),
        p.sortColumn ?: "updatedAt",
    ) { choose("sortColumn", JsonPrimitive(it)) }
    Choices(listOf("asc" to stringResource(Res.string.sort_asc), "desc" to stringResource(Res.string.sort_desc)), p.sortDirection) {
        choose("sortDirection", JsonPrimitive(it))
    }
    Label(stringResource(Res.string.web_layout), stringResource(Res.string.web_layout_hint))
    Choices(listOf("list" to stringResource(Res.string.layout_list), "grid" to stringResource(Res.string.layout_grid)), p.layout) {
        choose("layout", JsonPrimitive(it))
    }
    Label(stringResource(Res.string.load_mode), stringResource(Res.string.load_mode_hint))
    Choices(listOf("scroll" to stringResource(Res.string.load_scroll), "pages" to stringResource(Res.string.load_pages)), p.listingLoadMode) {
        choose("listingLoadMode", JsonPrimitive(it))
    }
    if (overview?.versioning == true) {
        Label(stringResource(Res.string.version_names), stringResource(Res.string.version_names_hint))
        Choices(
            listOf("sequential" to stringResource(Res.string.version_names_sequential), "date" to stringResource(Res.string.version_names_date)),
            p.versionNaming,
        ) { choose("versionNaming", JsonPrimitive(it)) }
    }
}

@Composable
fun Section(title: String) {
    Text(
        title,
        Modifier.padding(start = 20.dp, end = 20.dp, top = 24.dp, bottom = 4.dp),
        color = brand.accent,
        style = MaterialTheme.typography.labelLarge,
        fontWeight = FontWeight.SemiBold,
    )
}

@Composable
private fun Label(title: String, detail: String) {
    Column(Modifier.padding(start = 20.dp, end = 20.dp, top = 12.dp)) {
        Text(title, color = brand.ink, style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.Medium)
        Text(detail, color = brand.muted, style = MaterialTheme.typography.bodySmall)
    }
}

/** A row of mutually exclusive choices, the chosen one filled with the accent. */
@Composable
fun Choices(options: List<Pair<String, String>>, chosen: String, onChoose: (String) -> Unit) {
    Row(
        Modifier.fillMaxWidth().padding(horizontal = 20.dp, vertical = 8.dp).clip(Corner)
            .background(brand.panel.copy(alpha = 0.7f)).padding(4.dp),
        horizontalArrangement = Arrangement.spacedBy(4.dp),
    ) {
        options.forEach { (value, label) ->
            val on = value == chosen
            Box(
                Modifier.weight(1f).clip(Corner)
                    .background(if (on) brand.accent.copy(alpha = 0.18f) else Color.Transparent)
                    .semantics { selected = on }
                    .clickable(role = Role.RadioButton) { if (!on) onChoose(value) }
                    .padding(vertical = 10.dp),
                contentAlignment = Alignment.Center,
            ) {
                Text(
                    label,
                    color = if (on) brand.accent else brand.ink,
                    style = MaterialTheme.typography.labelLarge,
                    fontWeight = if (on) FontWeight.SemiBold else FontWeight.Normal,
                    maxLines = 1,
                )
            }
        }
    }
}

@Composable
private fun Accents(chosen: String, onChoose: (String) -> Unit) {
    Row(
        Modifier.fillMaxWidth().padding(horizontal = 20.dp, vertical = 12.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
    ) {
        ACCENTS.forEach { (name, colours) ->
            val on = name == chosen
            val said = stringResource(if (on) Res.string.accent_option_selected else Res.string.accent_option, ACCENT_NAMES[name]?.let { stringResource(it) } ?: name)
            Box(
                Modifier.size(40.dp).clip(CircleShape)
                    .background(Brush.linearGradient(listOf(Color(colours.light), Color(colours.glow))))
                    .then(if (on) Modifier.border(3.dp, brand.ink, CircleShape) else Modifier)
                    .semantics { contentDescription = said }
                    .clickable(role = Role.RadioButton) { if (!on) onChoose(name) },
            )
        }
    }
}

@Composable
fun Toggle(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    title: String,
    detail: String,
    checked: Boolean,
    enabled: Boolean = true,
    onChange: (Boolean) -> Unit,
) {
    Entry(
        icon,
        title,
        detail,
        tint = if (enabled) brand.accent else brand.muted,
        trailing = {
            Switch(
                checked = checked,
                onCheckedChange = onChange,
                enabled = enabled,
                colors = SwitchDefaults.colors(checkedTrackColor = brand.accent),
            )
        },
        onClick = if (enabled) ({ onChange(!checked) }) else null,
    )
}

private val ACCENT_NAMES = mapOf(
    "bordeaux" to Res.string.accent_bordeaux,
    "purple" to Res.string.accent_purple,
    "blue" to Res.string.accent_blue,
    "teal" to Res.string.accent_teal,
    "green" to Res.string.accent_green,
    "amber" to Res.string.accent_amber,
    "rose" to Res.string.accent_rose,
)

private val CATEGORY_NAMES = mapOf(
    "MUSIC" to Res.string.kind_music,
    "DOCUMENTS" to Res.string.kind_documents,
    "IMAGES" to Res.string.kind_images,
    "CODE" to Res.string.kind_code,
    "VIDEO" to Res.string.kind_video,
    "ARCHIVES" to Res.string.kind_archives,
    "3D" to Res.string.kind_3d,
    "OTHER" to Res.string.kind_other,
)

/** Stands for the storage summary while the drive is measured. */
@Composable
private fun StorageSkeleton() {
    Column(Modifier.padding(horizontal = 20.dp, vertical = 8.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        SkeletonLine(0.55f, height = 18.dp)
        SkeletonLine(0.8f)
        SkeletonLine(1f, height = 8.dp)
        repeat(4) { SkeletonLine(0.9f - it * 0.15f, height = 10.dp) }
    }
}

/** What the drive holds, of what the disk behind it has. */
@Composable
private fun Storage(usage: Usage) {
    val disk = usage.disk.total.takeIf { it > 0 }
    Column(Modifier.padding(horizontal = 20.dp, vertical = 8.dp)) {
        Text(
            pluralStringResource(Res.plurals.storage_summary, usage.fileCount, formatSize(usage.used), usage.fileCount),
            color = brand.ink,
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.SemiBold,
        )
        // The disk is shared with everything else on the server, so it gets
        // its own line rather than standing as this drive's quota.
        disk?.let {
            Spacer(Modifier.height(10.dp))
            Text(
                stringResource(Res.string.storage_disk, formatSize(it - usage.disk.available), formatSize(it), formatSize(usage.disk.available)),
                color = brand.muted,
                style = MaterialTheme.typography.bodySmall,
            )
            Spacer(Modifier.height(6.dp))
            LinearProgressIndicator(
                progress = { ((it - usage.disk.available).toFloat() / it).coerceIn(0f, 1f) },
                modifier = Modifier.fillMaxWidth().height(8.dp).clip(RoundedCornerShape(4.dp)),
                color = brand.accent,
                trackColor = brand.muted.copy(alpha = 0.2f),
            )
        }
        Spacer(Modifier.height(12.dp))
        val biggest = usage.byCategory.maxOfOrNull { it.bytes }?.takeIf { it > 0 } ?: 1L
        usage.byCategory.sortedByDescending { it.bytes }.forEach { part ->
            Row(Modifier.fillMaxWidth().padding(vertical = 4.dp), verticalAlignment = Alignment.CenterVertically) {
                Text(
                    CATEGORY_NAMES[part.category]?.let { stringResource(it) } ?: part.category,
                    Modifier.width(96.dp),
                    color = brand.ink,
                    style = MaterialTheme.typography.bodyMedium,
                )
                Box(Modifier.weight(1f).height(6.dp).clip(RoundedCornerShape(3.dp)).background(brand.muted.copy(alpha = 0.15f))) {
                    Box(Modifier.fillMaxWidth(part.bytes.toFloat() / biggest).height(6.dp).background(brand.accent))
                }
                Text(formatSize(part.bytes), Modifier.padding(start = 10.dp).width(72.dp), color = brand.muted, style = MaterialTheme.typography.bodySmall)
            }
        }
        if (usage.trashedCount > 0 || usage.versionCount > 0) {
            Spacer(Modifier.height(8.dp))
            Text(
                listOfNotNull(
                    usage.trashedCount.takeIf { it > 0 }?.let { pluralStringResource(Res.plurals.storage_trash, it, it, formatSize(usage.trashedBytes)) },
                    usage.versionCount.takeIf { it > 0 }?.let { pluralStringResource(Res.plurals.storage_versions, it, it, formatSize(usage.versionBytes)) },
                ).joinToString("\n"),
                color = brand.muted,
                style = MaterialTheme.typography.bodySmall,
            )
        }
    }
}
