package dev.penombre.app

import androidx.compose.runtime.Composable
import androidx.compose.runtime.staticCompositionLocalOf
import org.jetbrains.compose.resources.StringResource
import org.jetbrains.compose.resources.getString
import org.jetbrains.compose.resources.stringResource

/** The web app's languages (`project.inlang/settings.json`), each named in itself. */
val LANGUAGES = linkedMapOf(
    "en" to "English",
    "fr" to "Français",
    "de" to "Deutsch",
    "es" to "Español",
    "it" to "Italiano",
    "nl" to "Nederlands",
    "sv" to "Svenska",
    "fi" to "Suomi",
    "pl" to "Polski",
    "ru" to "Русский",
    "ja" to "日本語",
    "ko" to "한국어",
    "zh" to "中文",
)

/**
 * The app's language, null following the phone's. Static: a change recomposes
 * everything under it, so every string is read again and nothing remembered
 * is lost.
 */
val LocalLanguage = staticCompositionLocalOf<String?> { null }

/**
 * Makes `tag` the locale the platform reports, which is what Compose resources
 * read; null gives the phone's back.
 */
expect fun speak(tag: String?)

/** The phone's own language, as a two-letter code. */
expect fun phoneLanguage(): String

/** What the app speaks for `tag`: the phone's language when the app has it, else English. */
fun spoken(tag: String?): String = tag ?: phoneLanguage().takeIf { it in LANGUAGES } ?: "en"

/** The language chosen on this phone, kept so the first frame is already in it. */
fun savedLanguage(): String? = Prefs.get("language")?.takeIf { it in LANGUAGES }

/** A string and what fills it in, worded where it is shown: in the app's language then. */
class Words(val res: StringResource, vararg val args: Any)

@Composable
fun Words.text(): String = stringResource(res, *args)

/** The same, outside a composable: a status set from a callback, a notification. */
suspend fun Words.load(): String = getString(res, *args)

/** A failure the app words itself; the server's own words come as `Refused`. */
class Failure(val words: Words) : Exception()

/** The web app's language cookie (paraglide's), planted in its pages shown here. */
const val LANGUAGE_COOKIE = "PARAGLIDE_LOCALE"
