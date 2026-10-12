package dev.penombre.app

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.awaitEachGesture
import androidx.compose.foundation.gestures.awaitFirstDown
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.gestures.rememberTransformableState
import androidx.compose.foundation.gestures.transformable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBars
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyListState
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.StickyNote2
import androidx.compose.material.icons.automirrored.outlined.Undo
import androidx.compose.material.icons.filled.ArrowDropDown
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.outlined.BorderColor
import androidx.compose.material.icons.outlined.Draw
import androidx.compose.material.icons.outlined.Gesture
import androidx.compose.material.icons.outlined.HighlightOff
import androidx.compose.material.icons.outlined.PanTool
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.clipToBounds
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.BlendMode
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.graphics.Paint
import androidx.compose.ui.graphics.PaintingStyle
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.launch
import org.jetbrains.compose.resources.stringResource
import kotlin.math.roundToInt

/** What a finger does on a page. */
enum class Tool { Hand, Highlight, Pen, Eraser, Note }

private val PENS = listOf(Color(0xFF1B1B1F), Color(0xFF1F5ED9), Color(0xFFD12C3D), Color(0xFF168A3F))
private val HIGHLIGHTS = listOf(Color(0xFFFFE34D), Color(0xFF7DE38F), Color(0xFFFF8FC1))

/** Pen widths, in PDF points. */
private val WIDTHS = listOf(1.5f, 3f, 6f)
private val NOTE_COLOUR = Color(0xFFFFD54F)

/** A note's icon: 20 points square, its top left where it was put. */
private const val NOTE_POINTS = 20f

/**
 * A PDF's pages, rendered by the platform, scrolled and pinch-zoomed here.
 * `overlay` draws over each page in that page's own pixels; zoom scales both
 * together, so whatever is drawn stays where it was put. `panning` off, one
 * finger is the overlay's; two still zoom.
 */
@Composable
fun PdfPages(
    source: PdfSource,
    modifier: Modifier,
    list: LazyListState = rememberLazyListState(),
    panning: Boolean = true,
    overlay: @Composable BoxScope.(page: Int, size: IntSize) -> Unit = { _, _ -> },
) {
    var scale by remember { mutableFloatStateOf(1f) }
    var offset by remember { mutableStateOf(Offset.Zero) }
    val zoom = rememberTransformableState { change, pan, _ ->
        scale = (scale * change).coerceIn(1f, 4f)
        offset = if (scale == 1f) Offset.Zero else offset + pan
    }
    BoxWithConstraints(modifier.clipToBounds().transformable(zoom, canPan = { panning && scale > 1f })) {
        // Twice the screen: still sharp zoomed in a little.
        val pixels = (constraints.maxWidth * 2).coerceIn(600, 2400)
        LazyColumn(
            Modifier.fillMaxSize().graphicsLayer {
                scaleX = scale
                scaleY = scale
                translationX = offset.x
                translationY = offset.y
            },
            state = list,
            userScrollEnabled = panning,
            verticalArrangement = Arrangement.spacedBy(12.dp),
            contentPadding = PaddingValues(12.dp),
        ) {
            items(source.pageCount) { index ->
                val shown = remember(source, index) { source.pageSize(index) }
                var picture by remember(source, index) { mutableStateOf<ImageBitmap?>(null) }
                LaunchedEffect(source, index) {
                    picture = try {
                        source.render(index, pixels)
                    } catch (e: CancellationException) {
                        throw e
                    } catch (_: Exception) {
                        null
                    }
                }
                var box by remember { mutableStateOf(IntSize.Zero) }
                val label = stringResource(Res.string.pdf_page, index + 1)
                Box(
                    Modifier.fillMaxWidth().aspectRatio(shown.width / shown.height)
                        .shadow(6.dp, RoundedCornerShape(2.dp)).background(Color.White)
                        .onSizeChanged { box = it }
                        .semantics { contentDescription = label },
                ) {
                    picture?.let { Image(it, null, Modifier.fillMaxSize(), contentScale = ContentScale.FillBounds) }
                    if (box != IntSize.Zero) overlay(index, box)
                }
            }
        }
    }
}

private fun DrawScope.drawMark(mark: Mark, size: IntSize, pointsWide: Float) {
    val width = size.width.toFloat()
    val height = size.height.toFloat()
    fun at(point: Offset) = Offset(point.x * width, point.y * height)
    when (mark) {
        is Mark.Ink -> {
            val stroke = mark.width * width / pointsWide
            if (mark.points.size == 1) {
                drawCircle(mark.color, stroke / 2, at(mark.points[0]))
            } else {
                val path = Path()
                mark.points.forEachIndexed { index, point ->
                    val p = at(point)
                    if (index == 0) path.moveTo(p.x, p.y) else path.lineTo(p.x, p.y)
                }
                drawPath(path, mark.color, style = Stroke(stroke, cap = StrokeCap.Round, join = StrokeJoin.Round))
            }
        }

        is Mark.Highlight -> drawRect(
            mark.color.copy(alpha = 0.45f),
            at(mark.rect.topLeft),
            Size(mark.rect.width * width, mark.rect.height * height),
            blendMode = BlendMode.Multiply,
        )

        is Mark.Sticky -> {
            val side = NOTE_POINTS * width / pointsWide
            val corner = at(mark.at)
            drawRect(mark.color, corner, Size(side, side))
            drawRect(Color(0xFF333333), corner, Size(side, side), style = Stroke(1f))
            listOf(0.3f, 0.5f, 0.7f).forEach {
                drawLine(Color(0xFF404040), Offset(corner.x + side * 0.2f, corner.y + side * it), Offset(corner.x + side * 0.8f, corner.y + side * it), 1.5f)
            }
        }

        is Mark.Stamp -> {
            val topLeft = at(mark.rect.topLeft)
            val dst = IntSize((mark.rect.width * width).roundToInt().coerceAtLeast(1), (mark.rect.height * height).roundToInt().coerceAtLeast(1))
            drawImage(mark.picture, dstOffset = IntOffset(topLeft.x.roundToInt(), topLeft.y.roundToInt()), dstSize = dst)
        }
    }
}

/** A finger's path on a page, in 0..1 of it. */
private class Trace(val points: MutableList<Offset>)

/**
 * The tool's gesture: a drag draws, highlights or erases, a tap drops a dot
 * or a note. A second finger before the first has moved leaves the gesture
 * to the zoom.
 */
private fun Modifier.drawing(tool: Tool, size: IntSize, onLive: (List<Offset>?) -> Unit, onTap: (Offset) -> Unit, onDone: (List<Offset>) -> Unit, onErase: (Offset) -> Unit) = pointerInput(tool, size) {
    fun normal(point: Offset) = Offset(point.x / size.width, point.y / size.height)
    awaitEachGesture {
        val down = awaitFirstDown(requireUnconsumed = false)
        val stroke = Trace(mutableListOf(normal(down.position)))
        var moving = false
        while (true) {
            val event = awaitPointerEvent()
            if (event.changes.count { it.pressed } > 1) {
                if (moving) onLive(null)
                return@awaitEachGesture
            }
            val change = event.changes.firstOrNull { it.id == down.id } ?: break
            if (!change.pressed) break
            if (!moving && (change.position - down.position).getDistance() > viewConfiguration.touchSlop) moving = true
            if (moving) {
                change.consume()
                val point = normal(change.position)
                if (tool == Tool.Eraser) onErase(point) else stroke.points += point
                onLive(stroke.points.toList())
            }
        }
        onLive(null)
        if (moving) onDone(stroke.points) else onTap(stroke.points.first())
    }
}

private fun Rect.normalised() = Rect(minOf(left, right), minOf(top, bottom), maxOf(left, right), maxOf(top, bottom))

private fun nearInk(mark: Mark, point: Offset, reach: Float) = mark is Mark.Ink && mark.points.any { (it - point).getDistance() < reach }

/** A PDF, its pages drawn by the platform; marks, fields and signatures are the app's. */
@Composable
fun PdfView(host: Host, place: Place, item: Item) {
    val scope = rememberCoroutineScope()
    var bytes by remember { mutableStateOf<ByteArray?>(null) }
    var layout by remember { mutableStateOf<PdfLayout?>(null) }
    var failed by remember { mutableStateOf<String?>(null) }
    var reload by remember { mutableIntStateOf(0) }
    val marks = remember { mutableStateListOf<Mark>() }
    val values = remember { mutableStateMapOf<String, String>() }
    var tool by remember { mutableStateOf(Tool.Hand) }
    var pen by remember { mutableStateOf(PENS[0]) }
    var marker by remember { mutableStateOf(HIGHLIGHTS[0]) }
    var thickness by remember { mutableStateOf(WIDTHS[1]) }
    var noting by remember { mutableStateOf<Pair<Int, Offset>?>(null) }
    var signingInto by remember { mutableStateOf<Pair<Int, Rect?>?>(null) }
    var leaving by remember { mutableStateOf(false) }
    var changed by remember { mutableStateOf(false) }
    var saving by remember { mutableStateOf(false) }
    var status by remember { mutableStateOf<String?>(null) }
    val list = rememberLazyListState()

    LaunchedEffect(item.metadata.id, reload) {
        host.attempt({ failed = it }) {
            bytes = host.api.bytes(rawUrl(host.server, place, item.metadata.id))
            // Protected or damaged for pdf-lib: still shown, not editable.
            layout = try {
                host.api.pdfLayout(place, item.metadata.id)
            } catch (e: CancellationException) {
                throw e
            } catch (e: Unauthorized) {
                throw e
            } catch (_: Exception) {
                null
            }
        }
    }
    val source = remember(bytes) { bytes?.let { PdfSource(it) } }
    DisposableEffect(source) { onDispose { source?.close() } }

    val editable = layout?.canWrite == true
    val dirty = marks.isNotEmpty() || values.isNotEmpty()
    val back = { if (dirty) leaving = true else host.back() }
    PlatformBack(enabled = dirty && LocalShown.current) { leaving = true }

    fun save() {
        val known = layout ?: return
        saving = true
        status = null
        scope.launch {
            host.attempt({ status = it }) {
                try {
                    host.api.editPdf(place, item.metadata.id, pdfEdits(known.pages, marks.toList(), values.toMap(), known.revision))
                    marks.clear()
                    values.clear()
                    tool = Tool.Hand
                    reload++
                } catch (e: Changed) {
                    changed = true
                }
            }
            saving = false
        }
    }

    if (leaving) {
        Confirm(stringResource(Res.string.pdf_discard_title), stringResource(Res.string.pdf_discard_text), stringResource(Res.string.editor_leave), { leaving = false }) {
            leaving = false
            marks.clear()
            values.clear()
            host.back()
        }
    }
    if (changed) {
        AlertDialog(
            onDismissRequest = { changed = false },
            containerColor = brand.panel,
            text = { Text(stringResource(Res.string.pdf_changed)) },
            confirmButton = {
                TextButton(onClick = {
                    changed = false
                    marks.clear()
                    values.clear()
                    reload++
                }) { Text(stringResource(Res.string.pdf_reload), color = brand.accent) }
            },
            dismissButton = { TextButton(onClick = { changed = false }) { Text(stringResource(Res.string.cancel), color = brand.muted) } },
        )
    }
    noting?.let { (page, at) ->
        NoteDialog(onDismiss = { noting = null }) { text ->
            marks += Mark.Sticky(page, at, text, NOTE_COLOUR)
            noting = null
        }
    }
    signingInto?.let { (page, into) ->
        SignaturePad(onDismiss = { signingInto = null }) { drawn ->
            val shown = source?.pageSize(page) ?: Size(612f, 792f)
            // Into a signature field's box, else a third of the page wide, centred.
            val rect = into ?: run {
                val wide = 0.36f
                val tall = wide * shown.width / shown.height / drawn.aspect
                Rect(0.5f - wide / 2, 0.5f - tall / 2, 0.5f + wide / 2, 0.5f + tall / 2)
            }
            marks += Mark.Stamp(page, rect, drawn.png, drawn.picture)
            signingInto = null
            tool = Tool.Hand
        }
    }

    Scaffold(
        containerColor = Color.Transparent,
        topBar = {
            Header(item.title, onBack = back, compact = true) {
                if (dirty && editable) {
                    TextButton(enabled = !saving, onClick = ::save) {
                        Text(stringResource(if (saving) Res.string.pdf_saving else Res.string.pdf_save), color = brand.accent)
                    }
                }
            }
        },
        bottomBar = {
            if (editable && source != null) {
                Toolbar(
                    tool,
                    onTool = { tool = it },
                    colours = if (tool == Tool.Highlight) {
                        HIGHLIGHTS
                    } else if (tool == Tool.Pen) {
                        PENS
                    } else {
                        emptyList()
                    },
                    colour = if (tool == Tool.Highlight) marker else pen,
                    onColour = { if (tool == Tool.Highlight) marker = it else pen = it },
                    thickness = thickness.takeIf { tool == Tool.Pen },
                    onThickness = { thickness = it },
                    canUndo = marks.isNotEmpty(),
                    onUndo = { marks.removeAt(marks.lastIndex) },
                    onSign = { signingInto = list.firstVisibleItemIndex to null },
                )
            }
        },
    ) { padding ->
        Column(Modifier.padding(padding).fillMaxSize()) {
            status?.let { Note(it, colour = MaterialTheme.colorScheme.error) }
            Box(Modifier.weight(1f).fillMaxWidth(), contentAlignment = Alignment.Center) {
                when {
                    failed != null -> Note(failed!!, colour = MaterialTheme.colorScheme.error)

                    source == null -> BreathingMoon()

                    else -> PdfPages(source, Modifier.fillMaxSize(), list, panning = tool == Tool.Hand) { page, size ->
                        val pointsWide = source.pageSize(page).width
                        var live by remember { mutableStateOf<List<Offset>?>(null) }
                        val mine = marks.filter { it.page == page }
                        Canvas(Modifier.matchParentSize()) {
                            mine.forEach { drawMark(it, size, pointsWide) }
                            live?.let { points ->
                                when (tool) {
                                    Tool.Pen -> drawMark(Mark.Ink(page, points, pen, thickness), size, pointsWide)
                                    Tool.Highlight -> drawMark(Mark.Highlight(page, Rect(points.first(), points.last()).normalised(), marker), size, pointsWide)
                                    else -> Unit
                                }
                            }
                        }
                        val box = layout?.pages?.getOrNull(page)
                        // Under the drawing layer: with a tool chosen, they show and do not take touches.
                        if (editable && box != null) {
                            Fields(layout?.fields.orEmpty(), page, box, size, values) { rect -> signingInto = page to rect }
                        }
                        if (editable && tool != Tool.Hand) {
                            Box(
                                Modifier.matchParentSize().drawing(
                                    tool,
                                    size,
                                    onLive = { live = it },
                                    onTap = { at ->
                                        when (tool) {
                                            Tool.Note -> noting = page to at
                                            Tool.Pen -> marks += Mark.Ink(page, listOf(at), pen, thickness)
                                            else -> Unit
                                        }
                                    },
                                    onDone = { points ->
                                        when (tool) {
                                            Tool.Pen -> marks += Mark.Ink(page, points, pen, thickness)

                                            Tool.Highlight -> Rect(points.first(), points.last()).normalised()
                                                .takeIf { it.width > 0.005f && it.height > 0.003f }
                                                ?.let { marks += Mark.Highlight(page, it, marker) }

                                            else -> Unit
                                        }
                                    },
                                    onErase = { at -> marks.removeAll { it.page == page && nearInk(it, at, 0.02f) } },
                                ),
                            )
                        }
                        if (tool == Tool.Hand) {
                            mine.filterIsInstance<Mark.Stamp>().forEach { stamp ->
                                StampHandles(stamp, size) { moved ->
                                    val index = marks.indexOf(stamp)
                                    if (index >= 0) marks[index] = moved
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

/** The tools along the bottom, with the chosen one's colours and widths over them. */
@Composable
private fun Toolbar(
    tool: Tool,
    onTool: (Tool) -> Unit,
    colours: List<Color>,
    colour: Color,
    onColour: (Color) -> Unit,
    thickness: Float?,
    onThickness: (Float) -> Unit,
    canUndo: Boolean,
    onUndo: () -> Unit,
    onSign: () -> Unit,
) {
    Column(Modifier.fillMaxWidth().background(brand.panel.copy(alpha = 0.96f)).windowInsetsPadding(WindowInsets.navigationBars).padding(horizontal = 8.dp, vertical = 6.dp)) {
        if (colours.isNotEmpty()) {
            Row(Modifier.fillMaxWidth().padding(bottom = 4.dp), horizontalArrangement = Arrangement.Center, verticalAlignment = Alignment.CenterVertically) {
                val said = stringResource(Res.string.pdf_colour)
                colours.forEach { swatch ->
                    Box(
                        Modifier.padding(6.dp).size(30.dp).clip(CircleShape).background(swatch)
                            .border(if (swatch == colour) 3.dp else 1.dp, if (swatch == colour) brand.accent else brand.muted.copy(alpha = 0.4f), CircleShape)
                            .clickable(onClickLabel = said) { onColour(swatch) },
                    )
                }
                thickness?.let { chosen ->
                    Spacer(Modifier.width(12.dp))
                    WIDTHS.forEachIndexed { index, width ->
                        val label = stringResource(Res.string.pdf_thickness, index + 1)
                        Box(
                            Modifier.padding(4.dp).size(36.dp).clip(CircleShape)
                                .background(if (width == chosen) brand.accent.copy(alpha = 0.16f) else Color.Transparent)
                                .clickable(onClickLabel = label) { onThickness(width) },
                            contentAlignment = Alignment.Center,
                        ) { Box(Modifier.size((4 + index * 4).dp).clip(CircleShape).background(brand.ink)) }
                    }
                }
            }
        }
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceEvenly) {
            listOf(
                Triple(Tool.Hand, Icons.Outlined.PanTool, Res.string.pdf_tool_hand),
                Triple(Tool.Highlight, Icons.Outlined.BorderColor, Res.string.pdf_tool_highlight),
                Triple(Tool.Pen, Icons.Outlined.Gesture, Res.string.pdf_tool_pen),
                Triple(Tool.Eraser, Icons.Outlined.HighlightOff, Res.string.pdf_tool_eraser),
                Triple(Tool.Note, Icons.AutoMirrored.Outlined.StickyNote2, Res.string.pdf_tool_note),
            ).forEach { (entry, icon, label) ->
                val selected = entry == tool
                IconButton(onClick = { onTool(entry) }, Modifier.clip(RoundedCornerShape(14.dp)).background(if (selected) brand.accent.copy(alpha = 0.16f) else Color.Transparent)) {
                    Icon(icon, stringResource(label), tint = if (selected) brand.accent else brand.muted)
                }
            }
            IconButton(onClick = onSign) { Icon(Icons.Outlined.Draw, stringResource(Res.string.pdf_tool_sign), tint = brand.muted) }
            IconButton(onClick = onUndo, enabled = canUndo) {
                Icon(Icons.AutoMirrored.Outlined.Undo, stringResource(Res.string.pdf_undo), tint = if (canUndo) brand.muted else brand.muted.copy(alpha = 0.35f))
            }
        }
    }
}

/** A field's box on the page, in its pixels. */
private fun placeOf(box: PageBox, rect: List<Double>, size: IntSize): Rect {
    val shown = box.rectToShown(rect)
    return Rect(shown.left * size.width, shown.top * size.height, shown.right * size.width, shown.bottom * size.height)
}

/**
 * Native inputs over the form's widgets: what is typed or ticked is kept in
 * `values` until saved. A signature field takes a drawn signature in its box.
 */
@Composable
private fun BoxScope.Fields(fields: List<PdfField>, page: Int, box: PageBox, size: IntSize, values: MutableMap<String, String>, onSignHere: (Rect) -> Unit) {
    val density = LocalDensity.current
    val focus = LocalFocusManager.current
    // A tap beside the fields puts the keyboard away.
    Box(Modifier.matchParentSize().pointerInput(Unit) { detectTapGestures { focus.clearFocus() } })
    // Opaque: the page under it already shows the field's old value.
    val fill = Color(0xFFDDE9FF)
    val reach = with(density) { 40.dp.toPx() }
    val edge = Color(0xFF4A78D0)
    for (field in fields) {
        val value = values[field.name] ?: field.value.orEmpty()
        fun set(next: String) {
            if (next == field.value.orEmpty()) values.remove(field.name) else values[field.name] = next
        }
        for (widget in field.widgets.filter { it.page == page }) {
            val place = placeOf(box, widget.rect, size)
            if (place.width < 2 || place.height < 2) continue
            val at = Modifier.offset { IntOffset(place.left.roundToInt(), place.top.roundToInt()) }
                .size(with(density) { place.width.toDp() }, with(density) { place.height.toDp() })
            val enabled = field.fillable
            val inner = Modifier.size(with(density) { place.width.toDp() }, with(density) { place.height.toDp() })
            // A box or a button smaller than a finger takes the touches around it too.
            val grown = Rect(place.center - Offset(maxOf(place.width, reach) / 2, maxOf(place.height, reach) / 2), Size(maxOf(place.width, reach), maxOf(place.height, reach)))
            val target = Modifier.offset { IntOffset(grown.left.roundToInt(), grown.top.roundToInt()) }
                .size(with(density) { grown.width.toDp() }, with(density) { grown.height.toDp() })
            when (field.kind) {
                "text" -> {
                    val lines = if (field.multiline) 6 else 1
                    val fontSize = with(density) { (place.height / lines * 0.62f).coerceIn(9f * density.density, 18f * density.density).toSp() }
                    BasicTextField(
                        value = value,
                        onValueChange = { set(it) },
                        enabled = enabled,
                        singleLine = !field.multiline,
                        textStyle = TextStyle(color = Color.Black, fontSize = fontSize, lineHeight = fontSize),
                        keyboardOptions = KeyboardOptions(imeAction = if (field.multiline) ImeAction.Default else ImeAction.Done),
                        keyboardActions = KeyboardActions(onDone = { focus.clearFocus() }),
                        modifier = at.background(fill).border(1.dp, edge).padding(horizontal = 3.dp, vertical = 1.dp)
                            .semantics { contentDescription = field.name },
                    )
                }

                "checkbox" -> Box(
                    target.semantics { contentDescription = field.name }
                        .clickable(enabled = enabled) { set(if (value == "true") "false" else "true") },
                    contentAlignment = Alignment.Center,
                ) {
                    Box(inner.background(fill).border(1.dp, edge), contentAlignment = Alignment.Center) {
                        if (value == "true") Icon(Icons.Default.Check, null, Modifier.fillMaxSize(), tint = Color.Black)
                    }
                }

                "radio" -> Box(
                    target.semantics { contentDescription = "${field.name}: ${widget.option}" }
                        .clickable(enabled = enabled) { widget.option?.let { set(it) } },
                    contentAlignment = Alignment.Center,
                ) {
                    Box(inner.clip(CircleShape).background(fill).border(1.dp, edge, CircleShape), contentAlignment = Alignment.Center) {
                        if (value.isNotEmpty() && value == widget.option) Box(Modifier.fillMaxSize(0.5f).clip(CircleShape).background(Color.Black))
                    }
                }

                "dropdown", "list" -> {
                    var open by remember { mutableStateOf(false) }
                    Box(at) {
                        Row(
                            Modifier.fillMaxSize().background(fill).border(1.dp, edge).semantics { contentDescription = field.name }
                                .clickable(enabled = enabled) { open = true }
                                .padding(horizontal = 3.dp),
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Text(
                                value.ifEmpty { stringResource(Res.string.pdf_choose) },
                                Modifier.weight(1f),
                                color = if (value.isEmpty()) Color.DarkGray else Color.Black,
                                style = with(density) { (place.height * 0.55f).coerceIn(9f * density.density, 16f * density.density).toSp() }.let { TextStyle(fontSize = it, lineHeight = it) },
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis,
                            )
                            Icon(Icons.Default.ArrowDropDown, null, tint = Color.Black)
                        }
                        DropdownMenu(open, onDismissRequest = { open = false }, containerColor = brand.panel) {
                            field.options.forEach { option ->
                                DropdownMenuItem(text = { Text(option, color = if (option == value) brand.accent else brand.ink) }, onClick = {
                                    set(option)
                                    open = false
                                })
                            }
                        }
                    }
                }

                "signature" -> Box(
                    at.background(fill).border(1.dp, edge).clickable(onClickLabel = stringResource(Res.string.pdf_tool_sign)) {
                        onSignHere(Rect(place.left / size.width, place.top / size.height, place.right / size.width, place.bottom / size.height))
                    },
                    contentAlignment = Alignment.Center,
                ) { Icon(Icons.Outlined.Draw, null, tint = edge) }
            }
        }
    }
}

/** A sticky note's text; the field has the keyboard from the start. */
@Composable
private fun NoteDialog(onDismiss: () -> Unit, onAdd: (String) -> Unit) {
    var text by remember { mutableStateOf("") }
    val focus = remember { FocusRequester() }
    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = brand.panel,
        title = { Text(stringResource(Res.string.pdf_tool_note)) },
        text = {
            OutlinedTextField(
                value = text,
                onValueChange = { text = it },
                label = { Text(stringResource(Res.string.pdf_note_field)) },
                shape = Corner,
                minLines = 2,
                modifier = Modifier.fillMaxWidth().focusRequester(focus),
            )
            LaunchedEffect(Unit) { focus.requestFocus() }
        },
        confirmButton = {
            TextButton(enabled = text.isNotBlank(), onClick = { onAdd(text.trim()) }) { Text(stringResource(Res.string.pdf_note_add), color = brand.accent) }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text(stringResource(Res.string.cancel), color = brand.muted) } },
    )
}

/** A signature not saved yet: drag it to move it, drag its corner to resize it. */
@Composable
private fun StampHandles(stamp: Mark.Stamp, size: IntSize, onMove: (Mark.Stamp) -> Unit) {
    val density = LocalDensity.current
    val width = size.width.toFloat()
    val height = size.height.toFloat()
    var rect by remember(stamp) { mutableStateOf(stamp.rect) }
    val place = Rect(rect.left * width, rect.top * height, rect.right * width, rect.bottom * height)
    val handle = 28.dp
    val moveLabel = stringResource(Res.string.pdf_place_hint)
    Box(
        Modifier.offset { IntOffset(place.left.roundToInt(), place.top.roundToInt()) }
            .size(with(density) { place.width.toDp() }, with(density) { place.height.toDp() })
            .border(1.5.dp, brand.accent, RoundedCornerShape(2.dp))
            .semantics { contentDescription = moveLabel }
            .pointerInput(stamp) {
                detectDragGestures(onDragEnd = { onMove(stamp.copy(rect = rect)) }) { change, drag ->
                    change.consume()
                    val dx = (drag.x / width).coerceIn(-rect.left, 1 - rect.right)
                    val dy = (drag.y / height).coerceIn(-rect.top, 1 - rect.bottom)
                    rect = rect.translate(dx, dy)
                }
            },
    )
    Box(
        Modifier.offset { IntOffset((place.right - with(density) { handle.toPx() } / 2).roundToInt(), (place.bottom - with(density) { handle.toPx() } / 2).roundToInt()) }
            .size(handle).clip(CircleShape).background(brand.accent)
            .pointerInput(stamp) {
                detectDragGestures(onDragEnd = { onMove(stamp.copy(rect = rect)) }) { change, drag ->
                    change.consume()
                    // Resized keeping its shape: a signature must not stretch.
                    val aspect = rect.width / rect.height
                    val wider = (rect.width + drag.x / width).coerceIn(0.05f, 1 - rect.left)
                    val taller = (wider / aspect).coerceAtMost(1 - rect.top)
                    rect = Rect(rect.left, rect.top, rect.left + taller * aspect, rect.top + taller)
                }
            },
    )
}

/** A drawn signature: its PNG for the server, the picture for the screen, its width over its height. */
class Drawn(val png: ByteArray, val picture: ImageBitmap, val aspect: Float)

/** Where the strokes sit, padded for the line: left, top, and the picture's size once scaled to `maxWidth`. */
class Frame(val left: Float, val top: Float, val scale: Float, val width: Int, val height: Int)

fun signatureFrame(strokes: List<List<Offset>>, width: Float, maxWidth: Int): Frame? {
    val all = strokes.flatten()
    if (all.isEmpty()) return null
    val pad = width * 2
    val left = all.minOf { it.x } - pad
    val top = all.minOf { it.y } - pad
    val wide = (all.maxOf { it.x } + pad - left).coerceAtLeast(1f)
    val tall = (all.maxOf { it.y } + pad - top).coerceAtLeast(1f)
    val scale = minOf(1f, maxWidth / wide)
    return Frame(left, top, scale, (wide * scale).roundToInt().coerceAtLeast(1), (tall * scale).roundToInt().coerceAtLeast(1))
}

/** The strokes, cropped to what was drawn, in dark ink on nothing. */
fun renderSignature(strokes: List<List<Offset>>, ink: Color = Color(0xFF14142B), width: Float = 5f, maxWidth: Int = 900): ImageBitmap? {
    val frame = signatureFrame(strokes, width, maxWidth) ?: return null
    val left = frame.left
    val top = frame.top
    val scale = frame.scale
    val picture = ImageBitmap(frame.width, frame.height)
    val canvas = androidx.compose.ui.graphics.Canvas(picture)
    val line = Paint().apply {
        color = ink
        style = PaintingStyle.Stroke
        strokeWidth = width * scale
        strokeCap = StrokeCap.Round
        strokeJoin = StrokeJoin.Round
        isAntiAlias = true
    }
    val dot = Paint().apply {
        color = ink
        isAntiAlias = true
    }
    fun at(point: Offset) = Offset((point.x - left) * scale, (point.y - top) * scale)
    for (stroke in strokes) {
        if (stroke.size == 1) {
            canvas.drawCircle(at(stroke[0]), width * scale / 2, dot)
            continue
        }
        val path = Path()
        stroke.forEachIndexed { index, point ->
            val p = at(point)
            if (index == 0) path.moveTo(p.x, p.y) else path.lineTo(p.x, p.y)
        }
        canvas.drawPath(path, line)
    }
    return picture
}

/** A white card to sign on with a finger. */
@Composable
fun SignaturePad(onDismiss: () -> Unit, onDone: (Drawn) -> Unit) {
    val strokes = remember { mutableStateListOf<List<Offset>>() }
    var current by remember { mutableStateOf<List<Offset>?>(null) }
    val ink = Color(0xFF14142B)
    val said = stringResource(Res.string.pad_title)
    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = brand.panel,
        title = { Text(stringResource(Res.string.pad_title)) },
        text = {
            Box(
                Modifier.fillMaxWidth().height(200.dp).clip(Corner).background(Color.White)
                    .semantics { contentDescription = said }
                    .pointerInput(Unit) {
                        awaitEachGesture {
                            val down = awaitFirstDown()
                            val points = mutableListOf(down.position)
                            current = points.toList()
                            while (true) {
                                val event = awaitPointerEvent()
                                val change = event.changes.firstOrNull { it.id == down.id } ?: break
                                if (!change.pressed) break
                                change.consume()
                                points += change.position
                                current = points.toList()
                            }
                            strokes += points.toList()
                            current = null
                        }
                    },
            ) {
                Canvas(Modifier.fillMaxSize()) {
                    val line = Stroke(5f, cap = StrokeCap.Round, join = StrokeJoin.Round)
                    (strokes + listOfNotNull(current)).forEach { stroke ->
                        if (stroke.size == 1) {
                            drawCircle(ink, 2.5f, stroke[0])
                        } else {
                            val path = Path()
                            stroke.forEachIndexed { index, p -> if (index == 0) path.moveTo(p.x, p.y) else path.lineTo(p.x, p.y) }
                            drawPath(path, ink, style = line)
                        }
                    }
                    val y = size.height * 0.75f
                    drawLine(Color(0xFFB0B0C0), Offset(24f, y), Offset(size.width - 24f, y), 1.5f, pathEffect = PathEffect.dashPathEffect(floatArrayOf(10f, 8f)))
                }
            }
        },
        confirmButton = {
            TextButton(enabled = strokes.isNotEmpty(), onClick = {
                renderSignature(strokes.toList(), ink)?.let { picture ->
                    onDone(Drawn(pngOf(picture), picture, picture.width.toFloat() / picture.height))
                }
            }) { Text(stringResource(Res.string.pad_done), color = brand.accent) }
        },
        dismissButton = {
            Row {
                TextButton(enabled = strokes.isNotEmpty(), onClick = { strokes.clear() }) { Text(stringResource(Res.string.pad_clear), color = brand.muted) }
                TextButton(onClick = onDismiss) { Text(stringResource(Res.string.cancel), color = brand.muted) }
            }
        },
    )
}
