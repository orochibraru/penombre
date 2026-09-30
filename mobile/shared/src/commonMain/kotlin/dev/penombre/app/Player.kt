package dev.penombre.app

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectHorizontalDragGestures
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.gestures.detectVerticalDragGestures
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Pause
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.SkipNext
import androidx.compose.material.icons.filled.SkipPrevious
import androidx.compose.material.icons.outlined.MusicNote
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableDoubleStateOf
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.delay

/** One engine and where it is in its file: what a track and a video share. */
open class Transport(protected val session: Session) {
    val engine = MediaEngine()

    var playing by mutableStateOf(false)
        protected set
    var position by mutableDoubleStateOf(0.0)
        protected set
    var duration by mutableDoubleStateOf(0.0)
        protected set
    var aspect by mutableFloatStateOf(0f)
        protected set

    /** The platform's player refused the file: its format, usually. */
    var failed by mutableStateOf(false)
        protected set

    // Where to pick up once the next file's length is known.
    private var resumeAt = 0.0

    /** Nothing known of the file yet: what a loader waits on. */
    val loading get() = duration <= 0 && !failed

    val done get() = if (duration > 0) (position / duration).toFloat().coerceIn(0f, 1f) else 0f

    /** `from` seconds in: another rendition of the same file carries on. */
    protected fun begin(url: String, from: Double = 0.0) {
        position = from
        duration = 0.0
        aspect = 0f
        failed = false
        resumeAt = from
        engine.load(url, session.token)
        engine.play()
        playing = true
    }

    protected fun halt() {
        engine.stop()
        playing = false
    }

    fun toggle() {
        // Played to its end, it starts over.
        if (!playing && duration > 0 && position >= duration - 0.3) seek(0f)
        if (playing) engine.pause() else engine.play()
        playing = !playing
    }

    /** `fraction` of the file, 0..1. */
    fun seek(fraction: Float) {
        if (duration <= 0) return
        position = duration * fraction.coerceIn(0f, 1f)
        engine.seek(position)
        settling = 4
    }

    // Samples left before the end is looked for again: a seek lands late, and
    // until it does the engine still reads as at the end it was sent away from.
    private var settling = 0

    fun skip(seconds: Double) {
        if (duration > 0) seek(((position + seconds) / duration).toFloat())
    }

    /** Reads the engine; true when the file has just played to its end. */
    protected fun sample(): Boolean {
        duration = engine.duration
        failed = engine.failed
        if (duration > 0 && resumeAt > 0) {
            val to = resumeAt
            resumeAt = 0.0
            seek((to / duration).toFloat())
        }
        if (settling == 0 && resumeAt == 0.0) position = engine.position
        aspect = engine.aspect
        if (settling > 0) {
            settling--
            return false
        }
        return playing && duration > 0 && position >= duration - 0.3
    }
}

/** The tracks in play: one queue for the whole signed-in app. */
class Playback(session: Session) : Transport(session) {
    private var place = Place()

    var queue by mutableStateOf<List<Item>>(emptyList())
        private set
    var index by mutableIntStateOf(0)
        private set

    val current get() = queue.getOrNull(index)
    val location get() = place

    fun start(from: Place, tracks: List<Item>, at: Int) {
        place = from
        queue = tracks
        load(at)
    }

    private fun load(at: Int) {
        index = at
        val track = current ?: return stop()
        begin(rawUrl(session.server, place, track.metadata.id))
    }

    fun next() = if (index < queue.lastIndex) load(index + 1) else stop()

    fun jump(to: Int) = load(to)

    fun previous() = load((index - 1).coerceAtLeast(0))

    fun stop() {
        halt()
        queue = emptyList()
    }

    /** Follows the engine while a track is loaded; the next starts when one ends. */
    suspend fun follow() {
        while (true) {
            if (current != null && sample()) next()
            delay(250)
        }
    }
}

/** The video in play: the preview drawer and the full screen share it. */
class Screening(session: Session) : Transport(session) {
    private var place = Place()

    var item by mutableStateOf<Item?>(null)
        private set

    /** The rendition in play; null is the original. */
    var quality by mutableStateOf<Int?>(null)
        private set

    /** The rendition being rendered, which is not yet what plays. */
    var preparing by mutableStateOf<Int?>(null)
        private set

    /** This drive renders nothing (its files are sealed). */
    var unavailable by mutableStateOf(false)
        private set

    /**
     * The original will not play on this device. Either the player said so, or
     * it found a length and never a picture: iOS reads an AVI's sound and
     * plays that alone. Kept once known, until another video is opened.
     */
    var refused by mutableStateOf(false)
        private set

    // Samples with a length and no picture.
    private var blind = 0

    /** Nothing to show for the original: a rendition is the way to watch it. */
    val blocked get() = refused && quality == null

    fun open(from: Place, video: Item) {
        if (item?.metadata?.id == video.metadata.id) return
        place = from
        item = video
        quality = null
        preparing = null
        refused = false
        blind = 0
        begin(rawUrl(session.server, place, video.metadata.id))
    }

    fun close() {
        halt()
        item = null
        preparing = null
    }

    /**
     * Switches to `height` (null for the original) at the same moment of the
     * video, once the server has it. Returns why not, or null when it did.
     */
    suspend fun choose(api: Api, height: Int?): String? {
        val video = item ?: return null
        if (height != null) {
            preparing = height
            try {
                while (true) {
                    val state = api.ensureRendition(place, video.metadata.id, height)
                    if (state.status == "ready") break
                    if (state.status == "unavailable") unavailable = true
                    if (state.status != "preparing") {
                        return if (unavailable) "Lower qualities are not available on this drive." else "The video could not be converted."
                    }
                    // The server already waited; this only spares one that did not.
                    delay(1500)
                }
            } finally {
                preparing = null
            }
        }
        // Closed, or another video, while it was rendering.
        if (item?.metadata?.id != video.metadata.id) return null
        val at = if (blocked) 0.0 else position
        // A paused video stays paused; one that never played starts.
        val resume = playing || blocked
        quality = height
        begin(rawUrl(session.server, place, video.metadata.id, height), at)
        if (!resume) {
            engine.pause()
            playing = false
        }
        return null
    }

    /** Follows the engine; at the end the video rests there, paused. */
    suspend fun follow() {
        while (true) {
            if (item != null) {
                val ended = sample()
                if (quality == null && !refused) {
                    blind = if (duration > 0 && aspect == 0f) blind + 1 else 0
                    // A second and a half of sound with nothing to look at.
                    if (failed || blind >= 6) {
                        refused = true
                        halt()
                    }
                }
                if (ended) {
                    engine.pause()
                    playing = false
                }
            }
            delay(250)
        }
    }
}

/** The track in play, above the screen's bottom edge; a tap opens the player. */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MiniPlayer(playback: Playback, host: Host) {
    val track = playback.current ?: return
    var open by remember { mutableStateOf(false) }
    var peaks by remember(track.metadata.id) { mutableStateOf<List<Float>>(emptyList()) }
    LaunchedEffect(track.metadata.id) { host.attempt { peaks = host.api.peaks(playback.location, track.metadata.id) } }

    val done = playback.done
    val shape = RoundedCornerShape(20.dp)
    Column(
        Modifier.padding(horizontal = 16.dp, vertical = 6.dp).fillMaxWidth().clip(shape)
            .background(brand.panel.copy(alpha = 0.94f)).clickable(onClickLabel = "Open the player") { open = true }
            // Slid upwards, it opens too.
            .pointerInput(Unit) { detectVerticalDragGestures { _, drag -> if (drag < -6f) open = true } },
    ) {
        Row(Modifier.padding(start = 12.dp, end = 4.dp, top = 6.dp, bottom = 6.dp), verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Outlined.MusicNote, null, tint = Color(0xFFF472B6))
            Spacer(Modifier.width(10.dp))
            Text(
                track.title,
                Modifier.weight(1f),
                color = brand.ink,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = FontWeight.Medium,
            )
            IconButton(onClick = playback::toggle) {
                Icon(if (playback.playing) Icons.Default.Pause else Icons.Default.PlayArrow, if (playback.playing) "Pause" else "Play", tint = brand.ink)
            }
            IconButton(onClick = playback::stop) { Icon(Icons.Default.Close, "Stop playback", tint = brand.muted) }
        }
        Box(Modifier.fillMaxWidth().height(2.dp).background(brand.muted.copy(alpha = 0.2f))) {
            Box(Modifier.fillMaxWidth(done.coerceIn(0f, 1f)).height(2.dp).background(brand.accent))
        }
    }

    if (open) {
        // The whole screen; sliding it down brings the mini player back.
        ModalBottomSheet(
            onDismissRequest = { open = false },
            sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true),
            containerColor = brand.ground,
        ) {
            Column(Modifier.fillMaxHeight().padding(horizontal = 24.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                Spacer(Modifier.height(12.dp))
                Box(
                    Modifier.size(200.dp).clip(RoundedCornerShape(36.dp)).background(brand.gradient),
                    contentAlignment = Alignment.Center,
                ) { Icon(Icons.Outlined.MusicNote, null, Modifier.size(88.dp), tint = Color.White) }
                Spacer(Modifier.height(28.dp))
                Text(
                    track.title,
                    color = brand.ink,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis,
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.SemiBold,
                )
                if (playback.queue.size > 1) {
                    Text(
                        "Track ${playback.index + 1} of ${playback.queue.size}",
                        color = brand.muted,
                        style = MaterialTheme.typography.bodySmall,
                    )
                }
                Spacer(Modifier.height(24.dp))
                Waveform(peaks, done, playback::seek)
                Row(Modifier.fillMaxWidth().padding(top = 6.dp), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text(clock(playback.position), color = brand.muted, style = MaterialTheme.typography.bodySmall)
                    Text(clock(playback.duration), color = brand.muted, style = MaterialTheme.typography.bodySmall)
                }
                Spacer(Modifier.height(16.dp))
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(24.dp)) {
                    IconButton(onClick = playback::previous) { Icon(Icons.Default.SkipPrevious, "Previous track", Modifier.size(32.dp), tint = brand.ink) }
                    Box(
                        Modifier.size(76.dp).clip(RoundedCornerShape(28.dp)).background(brand.gradient).clickable(onClick = playback::toggle),
                        contentAlignment = Alignment.Center,
                    ) {
                        Icon(
                            if (playback.playing) Icons.Default.Pause else Icons.Default.PlayArrow,
                            if (playback.playing) "Pause playback" else "Resume playback",
                            Modifier.size(38.dp),
                            tint = Color.White,
                        )
                    }
                    IconButton(onClick = playback::next) { Icon(Icons.Default.SkipNext, "Next track", Modifier.size(32.dp), tint = brand.ink) }
                }
                if (playback.queue.size > 1) {
                    Spacer(Modifier.height(20.dp))
                    LazyColumn(Modifier.fillMaxWidth().weight(1f)) {
                        itemsIndexed(playback.queue) { position, queued ->
                            Entry(
                                Icons.Outlined.MusicNote,
                                queued.title,
                                tint = if (position == playback.index) brand.accent else brand.muted,
                            ) { playback.jump(position) }
                        }
                    }
                }
            }
        }
    }
}

private const val BARS = 56

/** The track's loudness as bars, and its scrubber: tap or drag to seek. */
@Composable
fun Waveform(peaks: List<Float>, done: Float, onSeek: (Float) -> Unit) {
    val accent = brand.accent
    val rest = brand.muted.copy(alpha = 0.35f)
    // The loudest of each slice; a flat line until the peaks arrive.
    val bars = remember(peaks) {
        List(BARS) { bar ->
            if (peaks.isEmpty()) {
                0.12f
            } else {
                peaks.subList(bar * peaks.size / BARS, ((bar + 1) * peaks.size / BARS).coerceAtLeast(bar * peaks.size / BARS + 1).coerceAtMost(peaks.size))
                    .maxOrNull() ?: 0f
            }
        }
    }
    val tallest = bars.maxOrNull()?.takeIf { it > 0f } ?: 1f
    Canvas(
        Modifier.fillMaxWidth().height(72.dp)
            .semantics { contentDescription = "Position in the track" }
            .pointerInput(Unit) { detectTapGestures { onSeek(it.x / size.width) } }
            .pointerInput(Unit) { detectHorizontalDragGestures { change, _ -> onSeek(change.position.x / size.width) } },
    ) {
        val slot = size.width / BARS
        bars.forEachIndexed { bar, peak ->
            val tall = (peak / tallest).coerceIn(0.06f, 1f) * size.height
            drawRoundRect(
                color = if ((bar + 0.5f) / BARS <= done) accent else rest,
                topLeft = Offset(bar * slot + slot * 0.2f, (size.height - tall) / 2),
                size = Size(slot * 0.6f, tall),
                cornerRadius = CornerRadius(slot * 0.3f),
            )
        }
    }
}
