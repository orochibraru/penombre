package dev.penombre.app

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Shapes
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.ReadOnlyComposable
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.BlendMode
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.CompositingStrategy
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

/**
 * One of the web app's themes (`app.css`), as colours: its ground, its text,
 * its accent and the two fields of its aurora.
 */
class Brand(
    val ground: Color,
    val ink: Color,
    val muted: Color,
    val panel: Color,
    val accent: Color,
    /** The accent at its light-mode depth: where the gradient starts. */
    val deep: Color,
    val glow: Color,
    val ember: Color,
    /** How strongly the aurora shows: the night carries more of it. */
    val sky: Float,
) {
    /** The logo's and the primary button's gradient. */
    val gradient get() = Brush.linearGradient(listOf(deep, glow))
}

/** `--primary` in light and in dark, then `--brand-2` and `--brand-3`. */
class Accent(val light: Long, val dark: Long, val glow: Long, val ember: Long)

/** The accents a person can pick, in the web app's order and colours. */
val ACCENTS = linkedMapOf(
    "bordeaux" to Accent(0xFF911F43, 0xFFD8516A, 0xFFB94082, 0xFFD67D5E),
    "purple" to Accent(0xFF8047E1, 0xFFB58DFF, 0xFFD25BCB, 0xFF00AFDF),
    "blue" to Accent(0xFF1F5ED9, 0xFF6CA2FF, 0xFF00A0CE, 0xFF00B7B7),
    "teal" to Accent(0xFF00787A, 0xFF25C2C2, 0xFF00AD8D, 0xFF28ACDF),
    "green" to Accent(0xFF00792F, 0xFF62C37A, 0xFF64A737, 0xFF08B6AF),
    "amber" to Accent(0xFFAE5700, 0xFFF0A646, 0xFFEA6F2F, 0xFFBEA333),
    "rose" to Accent(0xFFC7054A, 0xFFFB7188, 0xFFDF539F, 0xFFED7665),
)

private fun brandFor(accent: String, dark: Boolean): Brand {
    val colours = ACCENTS[accent] ?: ACCENTS.getValue("bordeaux")
    return Brand(
        ground = if (dark) Color(0xFF0C0B13) else Color(0xFFFAFAFD),
        ink = if (dark) Color(0xFFF5F5F8) else Color(0xFF13131C),
        muted = if (dark) Color(0xFFA3A2B7) else Color(0xFF616174),
        panel = if (dark) Color(0xFF201F2B) else Color(0xFFFFFFFF),
        accent = Color(if (dark) colours.dark else colours.light),
        deep = Color(colours.light),
        glow = Color(colours.glow),
        ember = Color(colours.ember),
        sky = if (dark) 0.42f else 0.3f,
    )
}

private val LocalBrand = staticCompositionLocalOf { brandFor("bordeaux", dark = true) }

val brand: Brand
    @Composable @ReadOnlyComposable
    get() = LocalBrand.current

/** The web's `--radius`. */
val Corner = RoundedCornerShape(12.dp)

@Composable
fun PenombreTheme(accent: String, content: @Composable () -> Unit) {
    val dark = isSystemInDarkTheme()
    val colors = brandFor(accent, dark)
    val scheme = (if (dark) darkColorScheme() else lightColorScheme()).copy(
        primary = colors.accent,
        onPrimary = Color.White,
        background = colors.ground,
        onBackground = colors.ink,
        surface = colors.ground,
        onSurface = colors.ink,
        onSurfaceVariant = colors.muted,
        surfaceVariant = colors.panel,
        surfaceContainer = colors.panel,
        outline = colors.muted.copy(alpha = 0.5f),
        outlineVariant = colors.muted.copy(alpha = 0.22f),
    )
    CompositionLocalProvider(LocalBrand provides colors) {
        // Material tracks its body text out; the web's type is set tight.
        val type = Typography().run {
            copy(
                bodyLarge = bodyLarge.copy(letterSpacing = 0.sp),
                bodyMedium = bodyMedium.copy(letterSpacing = 0.sp),
                bodySmall = bodySmall.copy(letterSpacing = 0.sp),
                titleMedium = titleMedium.copy(letterSpacing = 0.sp),
                labelMedium = labelMedium.copy(letterSpacing = 0.sp),
            )
        }
        MaterialTheme(colorScheme = scheme, typography = type, shapes = Shapes(small = Corner, medium = Corner, large = Corner)) {
            Aurora(content)
        }
    }
}

/** Two colour fields on opposite corners, behind every screen, as on the web. */
@Composable
private fun Aurora(content: @Composable () -> Unit) {
    val colors = brand
    Box(
        Modifier.fillMaxSize().background(colors.ground).drawBehind {
            val reach = maxOf(size.width, size.height)
            drawRect(
                Brush.radialGradient(
                    listOf(colors.glow.copy(alpha = colors.sky), Color.Transparent),
                    center = Offset(size.width * 0.92f, size.height * 0.06f),
                    radius = reach * 0.55f,
                ),
            )
            drawRect(
                Brush.radialGradient(
                    listOf(colors.ember.copy(alpha = colors.sky * 0.7f), Color.Transparent),
                    center = Offset(size.width * 0.14f, size.height * 0.96f),
                    radius = reach * 0.5f,
                ),
            )
        },
    ) { content() }
}

/** The logo (`assets/logo-light.svg`): a disc eclipsed from the upper right. */
@Composable
fun Moon(size: Dp, modifier: Modifier = Modifier) {
    val colors = brand
    // Offscreen, so the eclipse erases the disc and not what is behind it.
    Canvas(modifier.size(size).graphicsLayer { compositingStrategy = CompositingStrategy.Offscreen }) {
        val unit = this.size.minDimension / 48f
        val center = Offset(24f * unit, 24f * unit)
        drawCircle(
            Brush.linearGradient(
                listOf(colors.deep, colors.glow),
                start = Offset(0f, 48f * unit),
                end = Offset(48f * unit, 0f),
            ),
            radius = 21f * unit,
            center = center,
        )
        val shadow = Offset(31f * unit, 17f * unit)
        drawCircle(
            Brush.radialGradient(
                0.72f to Color.Black,
                1f to Color.Transparent,
                center = shadow,
                radius = 20f * unit,
            ),
            radius = 20f * unit,
            center = shadow,
            blendMode = BlendMode.DstOut,
        )
        drawCircle(
            colors.deep.copy(alpha = 0.3f),
            radius = 20f * unit,
            center = center,
            style = Stroke(2f * unit),
        )
    }
}
