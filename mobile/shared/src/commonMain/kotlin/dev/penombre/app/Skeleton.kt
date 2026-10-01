package dev.penombre.app

import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import org.jetbrains.compose.resources.stringResource

/** The platform asks for less motion: skeletons and the moon hold still. */
expect fun reducedMotion(): Boolean

/** A band of the accent sweeping across the muted ground; flat when motion is reduced. */
@Composable
private fun shimmer(): Brush {
    val ground = brand.muted.copy(alpha = 0.14f)
    if (remember { reducedMotion() }) return SolidColor(ground)
    val shine = brand.accent.copy(alpha = 0.26f)
    val sweep by rememberInfiniteTransition().animateFloat(0f, 1f, infiniteRepeatable(tween(1400, easing = LinearEasing)))
    val band = 480f
    val x = -band + sweep * band * 4
    return Brush.linearGradient(listOf(ground, shine, ground), start = Offset(x, 0f), end = Offset(x + band, 0f))
}

@Composable
private fun Bone(modifier: Modifier, brush: Brush, shape: Shape = RoundedCornerShape(6.dp)) {
    Box(modifier.clip(shape).background(brush))
}

// Title and detail lengths, varied so a column of rows reads as a list.
private val LENGTHS = listOf(0.62f to 0.32f, 0.45f to 0.24f, 0.74f to 0.4f, 0.54f to 0.28f)

/** Stands for an `Entry` while it loads: the tile, a title, a detail, at its height. */
@Composable
fun SkeletonRow(index: Int = 0) {
    val brush = shimmer()
    val (title, detail) = LENGTHS[index % LENGTHS.size]
    Row(
        Modifier.fillMaxWidth().padding(start = 20.dp, end = 20.dp, top = 10.dp, bottom = 10.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Bone(Modifier.size(44.dp), brush, Corner)
        Spacer(Modifier.width(14.dp))
        Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Bone(Modifier.fillMaxWidth(title).height(14.dp), brush)
            Bone(Modifier.fillMaxWidth(detail).height(10.dp), brush)
        }
    }
}

/** A list that is on its way: `rows` skeleton rows, read out as loading. */
@Composable
fun SkeletonList(rows: Int = 8, modifier: Modifier = Modifier) {
    val loading = stringResource(Res.string.loading)
    Column(modifier.fillMaxWidth().semantics { contentDescription = loading }) {
        repeat(rows) { SkeletonRow(it) }
    }
}

/** A line of text on its way, as wide as `fraction` of the row. */
@Composable
fun SkeletonLine(fraction: Float, modifier: Modifier = Modifier, height: Dp = 12.dp) {
    Bone(modifier.fillMaxWidth(fraction).height(height), shimmer())
}

/**
 * A thin sweeping line: something newer is on its way while what is shown
 * stays, as live search results do between two keystrokes.
 */
@Composable
fun SkeletonHint(modifier: Modifier = Modifier) {
    Bone(modifier.fillMaxWidth().height(2.dp), shimmer(), RoundedCornerShape(1.dp))
}

/**
 * The logo, breathing: for a wait with no content to sketch, a whole screen,
 * a picture, a video, a sign-in.
 */
@Composable
fun BreathingMoon(size: Dp = 56.dp, modifier: Modifier = Modifier) {
    val loading = stringResource(Res.string.loading)
    val described = modifier.semantics { contentDescription = loading }
    if (remember { reducedMotion() }) {
        Moon(size, described)
        return
    }
    // In and out over 1.6 s.
    val breath by rememberInfiniteTransition().animateFloat(
        0f,
        1f,
        infiniteRepeatable(tween(800, easing = FastOutSlowInEasing), RepeatMode.Reverse),
    )
    Moon(
        size,
        described.graphicsLayer {
            scaleX = 0.9f + 0.12f * breath
            scaleY = 0.9f + 0.12f * breath
            alpha = 0.5f + 0.5f * breath
        },
    )
}
