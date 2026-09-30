package dev.penombre.app

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectHorizontalDragGestures
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBars
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBars
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Forward10
import androidx.compose.material.icons.filled.Pause
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Replay10
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

/** What the web app opens in one of its editors (`documents.ts`, Office files). */
private val EDITABLE = setOf("docx", "xlsx", "pptx", "html", "htm", "csv", "md", "markdown")

/** A file opened from a list, and the list it came from. */
data class Preview(val place: Place, val siblings: List<Item>, val item: Item) {
    val isVideo get() = item.metadata.category == "VIDEO"
    val isImage get() = item.metadata.category == "IMAGES"
    val isPdf get() = extension == "pdf"
    val isEditable get() = extension in EDITABLE
    private val extension get() = item.title.substringAfterLast('.', "").lowercase()
}

/** A file's first stop: a look at it in a drawer, and the way to the full screen. */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PreviewSheet(preview: Preview, host: Host, onDismiss: () -> Unit) {
    val item = preview.item
    val (icon, colour) = iconFor(item)
    val tint = colour ?: brand.muted
    ModalBottomSheet(onDismissRequest = onDismiss, containerColor = brand.panel) {
        Column(Modifier.padding(horizontal = 20.dp)) {
            Text(
                item.title,
                color = brand.ink,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold,
            )
            item.size?.let { Text(formatSize(it), color = brand.muted, style = MaterialTheme.typography.bodySmall) }
            Spacer(Modifier.height(14.dp))
            val stage = Modifier.fillMaxWidth().clip(RoundedCornerShape(20.dp))
            when {
                preview.isVideo -> VideoStage(host, stage.aspectRatio(host.screening.aspect.takeIf { it > 0 } ?: (16f / 9f)), pinned = true)

                preview.isImage -> Picture(
                    lookUrl(host.server, preview.place, item),
                    host,
                    item.title,
                    // Cropped to the drawer: the whole picture is one tap away.
                    stage.height(240.dp).background(tint.copy(alpha = 0.14f)),
                    ContentScale.Crop,
                    placeholder = thumbnailUrl(host.server, preview.place, item.metadata.id, "small"),
                    fallback = rawUrl(host.server, preview.place, item.metadata.id),
                )

                else -> Box(stage.height(200.dp).background(tint.copy(alpha = 0.14f)), contentAlignment = Alignment.Center) {
                    Icon(icon, null, Modifier.size(72.dp), tint = tint)
                    // Over the icon: a file with no render leaves it showing.
                    Remote(thumbnailUrl(host.server, preview.place, item.metadata.id, "large"), host, null, Modifier.fillMaxSize())
                }
            }
            Spacer(Modifier.height(16.dp))
            // Nothing to fill the screen with while the video cannot play.
            val ready = !preview.isVideo || !host.screening.blocked
            GradientButton(if (preview.isVideo || preview.isImage) "Full screen" else "Open", enabled = ready) {
                host.push(
                    when {
                        preview.isVideo -> VideoScreen(preview.place, item)

                        preview.isImage -> preview.siblings.filter { it.metadata.category == "IMAGES" }
                            .let { PhotoScreen(preview.place, it, it.indexOf(item).coerceAtLeast(0)) }

                        // A WebView shows no PDF on Android: a black page. Native instead.
                        preview.isPdf -> PdfScreen(preview.place, item)

                        // The web app edits these; the WebView is signed in.
                        preview.isEditable -> WebScreen(editUrl(host.server, preview.place, item.metadata.id))

                        else -> WebScreen(rawUrl(host.server, preview.place, item.metadata.id))
                    },
                )
                onDismiss()
            }
            Spacer(Modifier.height(28.dp))
        }
    }
}

/**
 * The video and the app's own controls over it. A tap shows or hides them;
 * `pinned`, they stay. Left alone while playing, they fade. A video this
 * device cannot play shows why instead, and the way to watch it anyway.
 */
@Composable
fun VideoStage(host: Host, modifier: Modifier, pinned: Boolean = false, top: @Composable BoxScope.() -> Unit = {}) {
    val screening = host.screening
    val scope = rememberCoroutineScope()
    var shown by remember { mutableStateOf(true) }
    // Counts touches: each one restarts the wait before the controls fade.
    var touched by remember { mutableStateOf(0) }
    var picking by remember { mutableStateOf(false) }
    var note by remember { mutableStateOf<String?>(null) }
    val choose: (Int?) -> Unit = { height ->
        picking = false
        note = null
        scope.launch { host.attempt({ note = it }) { note = screening.choose(host.api, height) } }
    }
    LaunchedEffect(shown, touched, screening.playing, pinned, picking) {
        if (shown && screening.playing && !pinned && !picking) {
            delay(3000)
            shown = false
        }
    }
    val visible = shown || pinned || !screening.playing || screening.blocked
    Box(
        modifier.background(Color.Black)
            .clickable(remember { MutableInteractionSource() }, indication = null, onClickLabel = "Show or hide the controls") { shown = !shown },
        contentAlignment = Alignment.Center,
    ) {
        if (screening.blocked) {
            Column(Modifier.padding(20.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                if (screening.preparing != null) {
                    CircularProgressIndicator(color = Color.White)
                    Spacer(Modifier.height(12.dp))
                    Text("Converting the video…", color = Color.White, fontWeight = FontWeight.Medium)
                    Text(
                        "A long one can take a few minutes. It only happens once.",
                        color = Color.White.copy(alpha = 0.7f),
                        style = MaterialTheme.typography.bodySmall,
                        textAlign = TextAlign.Center,
                    )
                } else {
                    Text("This video's format does not play on this device", color = Color.White, fontWeight = FontWeight.Medium, textAlign = TextAlign.Center)
                    Spacer(Modifier.height(12.dp))
                    if (screening.unavailable) {
                        Text("Download it to watch it in another app.", color = Color.White.copy(alpha = 0.7f), style = MaterialTheme.typography.bodySmall)
                    } else {
                        Box(Modifier.width(220.dp)) { GradientButton("Convert and play", enabled = true) { choose(RENDITIONS.first()) } }
                    }
                    note?.let { Text(it, Modifier.padding(top = 10.dp), color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall) }
                }
            }
        } else {
            VideoSurface(screening.engine, screening.aspect, Modifier.fillMaxSize())
            if (screening.loading) CircularProgressIndicator(color = Color.White)
        }
        AnimatedVisibility(visible, Modifier.matchParentSize(), enter = fadeIn(), exit = fadeOut()) {
            Box(Modifier.fillMaxSize()) {
                top()
                if (!screening.loading && !screening.blocked) {
                    Row(Modifier.align(Alignment.Center), horizontalArrangement = Arrangement.spacedBy(20.dp), verticalAlignment = Alignment.CenterVertically) {
                        IconButton(onClick = {
                            touched++
                            screening.skip(-10.0)
                        }) { Icon(Icons.Default.Replay10, "Back 10 seconds", Modifier.size(30.dp), tint = Color.White) }
                        Box(
                            Modifier.size(64.dp).clip(CircleShape).background(Color.Black.copy(alpha = 0.5f))
                                .clickable {
                                    touched++
                                    screening.toggle()
                                },
                            contentAlignment = Alignment.Center,
                        ) {
                            Icon(
                                if (screening.playing) Icons.Default.Pause else Icons.Default.PlayArrow,
                                if (screening.playing) "Pause video" else "Play video",
                                Modifier.size(36.dp),
                                tint = Color.White,
                            )
                        }
                        IconButton(onClick = {
                            touched++
                            screening.skip(10.0)
                        }) { Icon(Icons.Default.Forward10, "Forward 10 seconds", Modifier.size(30.dp), tint = Color.White) }
                    }
                }
                if (!screening.blocked) {
                    Row(
                        Modifier.align(Alignment.BottomCenter).fillMaxWidth()
                            .background(Brush.verticalGradient(listOf(Color.Transparent, Color.Black.copy(alpha = 0.7f))))
                            .then(if (pinned) Modifier else Modifier.windowInsetsPadding(WindowInsets.navigationBars))
                            .padding(start = 14.dp, end = 4.dp),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Text(clock(screening.position), color = Color.White, style = MaterialTheme.typography.labelMedium)
                        Scrubber(screening.done, Modifier.weight(1f).padding(horizontal = 12.dp)) {
                            touched++
                            screening.seek(it)
                        }
                        Text(clock(screening.duration), color = Color.White, style = MaterialTheme.typography.labelMedium)
                        if (!screening.unavailable) {
                            Box {
                                TextButton(onClick = {
                                    touched++
                                    picking = true
                                }) {
                                    val now = screening.preparing?.let { "${it}p…" } ?: screening.quality?.let { "${it}p" } ?: "Original"
                                    Text(now, Modifier.semantics { contentDescription = "Quality: $now" }, color = Color.White, style = MaterialTheme.typography.labelMedium)
                                }
                                DropdownMenu(picking, onDismissRequest = { picking = false }, containerColor = brand.panel) {
                                    (listOf<Int?>(null) + RENDITIONS).forEach { height ->
                                        // The original is not offered once it has failed to play.
                                        if (height != null || !screening.refused) {
                                            DropdownMenuItem(
                                                text = { Text(height?.let { "${it}p" } ?: "Original", color = if (height == screening.quality) brand.accent else brand.ink) },
                                                onClick = { choose(height) },
                                            )
                                        }
                                    }
                                }
                            }
                        } else {
                            Spacer(Modifier.width(10.dp))
                        }
                    }
                }
                if (!screening.blocked) {
                    note?.let {
                        Text(it, Modifier.align(Alignment.TopCenter).padding(top = 56.dp, start = 16.dp, end = 16.dp), color = Color.White, style = MaterialTheme.typography.bodySmall)
                    }
                }
            }
        }
    }
}

/** A thin line and a dot: tap or drag along it to seek. Tall enough for a thumb. */
@Composable
private fun Scrubber(done: Float, modifier: Modifier, onSeek: (Float) -> Unit) {
    val accent = brand.accent
    Canvas(
        modifier.height(44.dp)
            .semantics { contentDescription = "Position in the video" }
            .pointerInput(Unit) { detectTapGestures { onSeek(it.x / size.width) } }
            .pointerInput(Unit) { detectHorizontalDragGestures { change, _ -> onSeek(change.position.x / size.width) } },
    ) {
        val line = 4.dp.toPx()
        val middle = (size.height - line) / 2
        val round = CornerRadius(line / 2)
        drawRoundRect(Color.White.copy(alpha = 0.3f), Offset(0f, middle), Size(size.width, line), round)
        drawRoundRect(accent, Offset(0f, middle), Size(size.width * done, line), round)
        drawCircle(Color.White, 7.dp.toPx(), Offset(size.width * done, size.height / 2))
    }
}

/** The video over the whole screen. What plays is the app's one screening. */
@Composable
fun VideoView(host: Host) {
    val screening = host.screening
    VideoStage(host, Modifier.fillMaxSize()) {
        Row(
            Modifier.fillMaxWidth().background(Brush.verticalGradient(listOf(Color.Black.copy(alpha = 0.7f), Color.Transparent)))
                .windowInsetsPadding(WindowInsets.statusBars).padding(end = 20.dp, bottom = 16.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            IconButton(onClick = host.back) { Icon(Icons.AutoMirrored.Filled.ArrowBack, "Back", tint = Color.White) }
            Spacer(Modifier.width(4.dp))
            Text(
                screening.item?.title ?: "",
                color = Color.White,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
                style = MaterialTheme.typography.titleMedium,
            )
        }
    }
}
