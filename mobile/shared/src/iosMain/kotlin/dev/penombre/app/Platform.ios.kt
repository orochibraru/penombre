package dev.penombre.app

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.viewinterop.UIKitView
import kotlinx.cinterop.ExperimentalForeignApi
import kotlinx.cinterop.addressOf
import kotlinx.cinterop.convert
import kotlinx.cinterop.readValue
import kotlinx.cinterop.usePinned
import platform.AuthenticationServices.ASPresentationAnchor
import platform.AuthenticationServices.ASWebAuthenticationPresentationContextProvidingProtocol
import platform.AuthenticationServices.ASWebAuthenticationSession
import platform.CoreCrypto.CC_SHA256
import platform.CoreCrypto.CC_SHA256_DIGEST_LENGTH
import platform.CoreGraphics.CGRectZero
import platform.Foundation.NSHTTPCookie
import platform.Foundation.NSHTTPCookieDomain
import platform.Foundation.NSHTTPCookieName
import platform.Foundation.NSHTTPCookiePath
import platform.Foundation.NSHTTPCookieSecure
import platform.Foundation.NSHTTPCookieValue
import platform.Foundation.NSURL
import platform.Foundation.NSURLRequest
import platform.Foundation.NSUserDefaults
import platform.UIKit.UIApplication
import platform.UIKit.UIDevice
import platform.UIKit.UIWindow
import platform.WebKit.WKWebView
import platform.WebKit.WKWebViewConfiguration
import platform.WebKit.WKWebsiteDataStore
import platform.darwin.NSObject

@OptIn(ExperimentalForeignApi::class)
actual fun sha256(bytes: ByteArray): ByteArray {
    val digest = UByteArray(CC_SHA256_DIGEST_LENGTH)
    bytes.usePinned { input ->
        digest.usePinned { output ->
            CC_SHA256(input.addressOf(0), bytes.size.convert(), output.addressOf(0))
        }
    }
    return digest.toByteArray()
}

actual val deviceName: String get() = UIDevice.currentDevice.model

private object Anchor : NSObject(), ASWebAuthenticationPresentationContextProvidingProtocol {
    override fun presentationAnchorForWebAuthenticationSession(session: ASWebAuthenticationSession): ASPresentationAnchor =
        UIApplication.sharedApplication.keyWindow ?: UIWindow()
}

// Held so the session is not collected while the sheet is up.
private var authSession: ASWebAuthenticationSession? = null

actual fun openAuthBrowser(url: String) {
    val session = ASWebAuthenticationSession(NSURL(string = url), "penombre") { callback, _ ->
        callback?.absoluteString?.let { Auth.callbacks.value = it }
        authSession = null
    }
    session.presentationContextProvider = Anchor
    authSession = session
    session.start()
}

actual object Prefs {
    private val defaults get() = NSUserDefaults.standardUserDefaults

    actual fun get(key: String): String? = defaults.stringForKey(key)

    actual fun set(key: String, value: String?) {
        if (value == null) defaults.removeObjectForKey(key) else defaults.setObject(value, key)
    }
}

@OptIn(ExperimentalForeignApi::class)
@Composable
actual fun WebPage(url: String, session: Session, modifier: Modifier) {
    UIKitView(
        modifier = modifier,
        factory = {
            val config = WKWebViewConfiguration().apply { websiteDataStore = WKWebsiteDataStore.defaultDataStore() }
            val view = WKWebView(frame = CGRectZero.readValue(), configuration = config)
            val properties = mutableMapOf<Any?, Any?>(
                NSHTTPCookieName to session.cookieName,
                NSHTTPCookieValue to session.cookieValue,
                NSHTTPCookieDomain to NSURL(string = session.server).host,
                NSHTTPCookiePath to "/",
            )
            if (session.server.startsWith("https://")) properties[NSHTTPCookieSecure] = "TRUE"
            val cookie = NSHTTPCookie.cookieWithProperties(properties)
            val load = { view.loadRequest(NSURLRequest(uRL = NSURL(string = url))) }
            if (cookie == null) load() else config.websiteDataStore.httpCookieStore.setCookie(cookie) { load() }
            view
        },
    )
}

@Composable
actual fun PlatformBack(enabled: Boolean, onBack: () -> Unit) = Unit
