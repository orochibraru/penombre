package dev.penombre.app

import android.annotation.SuppressLint
import android.app.Activity
import android.content.Context
import android.os.Build
import android.webkit.CookieManager
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.compose.BackHandler
import androidx.browser.customtabs.CustomTabsIntent
import androidx.compose.material3.ColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.net.toUri
import java.security.MessageDigest

/** Set by the host activity before the first composition. */
object AndroidHost {
    lateinit var activity: Activity
}

actual fun sha256(bytes: ByteArray): ByteArray = MessageDigest.getInstance("SHA-256").digest(bytes)

actual val deviceName: String get() = Build.MODEL

actual fun openAuthBrowser(url: String) {
    CustomTabsIntent.Builder().build().launchUrl(AndroidHost.activity, url.toUri())
}

actual object Prefs {
    private val prefs get() = AndroidHost.activity.getSharedPreferences("penombre", Context.MODE_PRIVATE)

    actual fun get(key: String): String? = prefs.getString(key, null)

    actual fun set(key: String, value: String?) {
        prefs.edit().apply { if (value == null) remove(key) else putString(key, value) }.apply()
    }
}

@SuppressLint("SetJavaScriptEnabled")
@Composable
actual fun WebPage(url: String, session: Session, modifier: Modifier) {
    AndroidView(modifier = modifier, factory = { context ->
        WebView(context).apply {
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            webViewClient = WebViewClient()
            val secure = if (session.server.startsWith("https://")) "; Secure" else ""
            val cookies = CookieManager.getInstance()
            cookies.setCookie(session.server, "${session.cookieName}=${session.cookieValue}; Path=/; HttpOnly$secure") {
                cookies.flush()
                loadUrl(url)
            }
        }
    })
}

@Composable
actual fun PlatformBack(enabled: Boolean, onBack: () -> Unit) = BackHandler(enabled, onBack)

// Wallpaper colours exist from Android 12.
@Composable
actual fun systemColorScheme(dark: Boolean): ColorScheme? {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) return null
    val context = LocalContext.current
    return if (dark) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
}
