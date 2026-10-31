package dev.penombre.app

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ExpandLess
import androidx.compose.material.icons.filled.ExpandMore
import androidx.compose.material.icons.outlined.CheckCircle
import androidx.compose.material.icons.outlined.Close
import androidx.compose.material.icons.outlined.ErrorOutline
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch
import org.jetbrains.compose.resources.stringResource

enum class UploadState { Waiting, Sending, Done, Failed }

/** One file on its way up. */
class Upload(val name: String, val size: Long, val place: Place, val folder: String, internal val file: PickedFile) {
    var sent by mutableLongStateOf(0L)
    var state by mutableStateOf(UploadState.Waiting)
    var error by mutableStateOf<String?>(null)
}

/** Where the last finished upload landed: a browser showing that folder lists it again. */
data class Landed(val place: Place, val folder: String, val serial: Int)

/**
 * The session's upload queue, one file at a time. It lives with the session,
 * not the screen, so leaving the folder does not cancel what is being sent.
 */
class Uploads(private val scope: CoroutineScope) {
    val list = mutableStateListOf<Upload>()
    var landed by mutableStateOf<Landed?>(null)
        private set
    var expanded by mutableStateOf(true)
    private var worker: Job? = null

    val pending get() = list.count { it.state == UploadState.Waiting || it.state == UploadState.Sending }

    fun add(host: Host, place: Place, folder: String, files: List<PickedFile>) {
        files.forEach { list.add(Upload(it.name, it.size, place, folder, it)) }
        expanded = true
        drain(host)
    }

    fun retry(host: Host, upload: Upload) {
        upload.sent = 0
        upload.error = null
        upload.state = UploadState.Waiting
        drain(host)
    }

    /** Drops what is finished; nothing still waiting is lost. */
    fun clear() {
        list.removeAll { it.state == UploadState.Done || it.state == UploadState.Failed }
    }

    private fun drain(host: Host) {
        if (worker?.isActive == true) return
        worker = scope.launch {
            while (true) {
                val next = list.firstOrNull { it.state == UploadState.Waiting } ?: break
                next.state = UploadState.Sending
                var sent = false
                host.attempt({ next.error = it }) {
                    if (next.size > MAX_UPLOAD_BYTES) throw Failure(Words(Res.string.upload_too_big, next.name))
                    host.api.upload(next.place, next.folder, next.file) { next.sent = it }
                    sent = true
                }
                if (sent) {
                    next.sent = next.size
                    next.state = UploadState.Done
                    landed = Landed(next.place, next.folder, (landed?.serial ?: 0) + 1)
                } else {
                    next.state = UploadState.Failed
                }
            }
        }
    }
}

/** The queue as a card over the bottom bar, on every screen, like the web's upload panel. */
@Composable
fun UploadPanel(uploads: Uploads, host: Host) {
    val list = uploads.list
    if (list.isEmpty()) return
    val pending = uploads.pending
    val failed = list.count { it.state == UploadState.Failed }
    val total = list.sumOf { it.size }.coerceAtLeast(1)
    val sent = list.sumOf { if (it.state == UploadState.Done) it.size else it.sent }
    val colors = brand

    Column(
        Modifier.fillMaxWidth().padding(horizontal = 12.dp, vertical = 6.dp)
            .shadow(16.dp, Corner, ambientColor = colors.glow.copy(alpha = 0.35f), spotColor = colors.glow.copy(alpha = 0.35f))
            .clip(Corner).background(colors.panel),
    ) {
        Row(
            Modifier.fillMaxWidth().clickable(onClickLabel = stringResource(Res.string.uploads_toggle)) { uploads.expanded = !uploads.expanded }
                .padding(start = 14.dp, end = 4.dp, top = 6.dp, bottom = 6.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Box(Modifier.size(32.dp), contentAlignment = Alignment.Center) {
                when {
                    pending > 0 -> CircularProgressIndicator(
                        progress = { (sent.toFloat() / total).coerceIn(0f, 1f) },
                        modifier = Modifier.size(26.dp),
                        color = colors.accent,
                        trackColor = colors.accent.copy(alpha = 0.15f),
                        strokeWidth = 3.dp,
                        strokeCap = StrokeCap.Round,
                    )

                    failed > 0 -> Icon(Icons.Outlined.ErrorOutline, null, tint = MaterialTheme.colorScheme.error)

                    else -> Icon(Icons.Outlined.CheckCircle, null, tint = colors.accent)
                }
            }
            Spacer(Modifier.width(12.dp))
            Column(Modifier.weight(1f)) {
                Text(
                    when {
                        pending > 0 -> stringResource(Res.string.uploading_many, list.size - pending + 1, list.size)
                        failed > 0 -> stringResource(Res.string.uploads_some_failed, failed, list.size)
                        else -> stringResource(Res.string.uploads_done)
                    },
                    color = colors.ink,
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.SemiBold,
                )
                Text(
                    stringResource(Res.string.size_of, formatSize(sent), formatSize(total)),
                    color = colors.muted,
                    style = MaterialTheme.typography.bodySmall,
                )
            }
            Icon(if (uploads.expanded) Icons.Default.ExpandMore else Icons.Default.ExpandLess, null, tint = colors.muted)
            if (pending == 0) {
                IconButton(onClick = uploads::clear) { Icon(Icons.Outlined.Close, stringResource(Res.string.clear), tint = colors.muted) }
            } else {
                Spacer(Modifier.width(12.dp))
            }
        }
        AnimatedVisibility(uploads.expanded) {
            LazyColumn(Modifier.heightIn(max = 220.dp).padding(bottom = 6.dp)) {
                items(list) { upload -> UploadRow(upload) { uploads.retry(host, upload) } }
            }
        }
    }
}

@Composable
private fun UploadRow(upload: Upload, onRetry: () -> Unit) {
    val colors = brand
    val (icon, tint) = iconFor(Item(key = upload.name, type = "file", metadata = Meta(id = "", name = upload.name)))
    Row(
        Modifier.fillMaxWidth().padding(start = 14.dp, end = 8.dp, top = 6.dp, bottom = 6.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Box(
            Modifier.size(32.dp).clip(Corner).background((tint ?: colors.muted).copy(alpha = 0.12f)),
            contentAlignment = Alignment.Center,
        ) { Icon(icon, null, Modifier.size(18.dp), tint = tint ?: colors.muted) }
        Spacer(Modifier.width(12.dp))
        Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
            Text(upload.name, maxLines = 1, overflow = TextOverflow.Ellipsis, color = colors.ink, style = MaterialTheme.typography.bodyMedium)
            when (upload.state) {
                UploadState.Sending -> LinearProgressIndicator(
                    progress = { if (upload.size > 0) (upload.sent.toFloat() / upload.size).coerceIn(0f, 1f) else 0f },
                    modifier = Modifier.fillMaxWidth().height(4.dp).clip(Corner),
                    color = colors.accent,
                    trackColor = colors.accent.copy(alpha = 0.15f),
                    strokeCap = StrokeCap.Round,
                    drawStopIndicator = {},
                )

                UploadState.Waiting -> Text(stringResource(Res.string.upload_waiting), color = colors.muted, style = MaterialTheme.typography.bodySmall)

                UploadState.Done -> Text(formatSize(upload.size), color = colors.muted, style = MaterialTheme.typography.bodySmall)

                UploadState.Failed -> Text(
                    upload.error.orEmpty(),
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis,
                    color = MaterialTheme.colorScheme.error,
                    style = MaterialTheme.typography.bodySmall,
                )
            }
        }
        when (upload.state) {
            UploadState.Failed -> TextButton(onClick = onRetry) { Text(stringResource(Res.string.upload_retry), color = colors.accent) }
            UploadState.Done -> Icon(Icons.Outlined.CheckCircle, null, Modifier.padding(horizontal = 8.dp).size(20.dp), tint = colors.accent)
            else -> Spacer(Modifier.width(8.dp))
        }
    }
}
