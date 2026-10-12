package dev.penombre.app

import android.Manifest
import android.animation.ValueAnimator
import android.annotation.SuppressLint
import android.app.Activity
import android.app.DownloadManager
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.content.res.Configuration
import android.content.res.Resources
import android.graphics.Bitmap
import android.graphics.pdf.PdfRenderer
import android.media.AudioAttributes
import android.media.MediaPlayer
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.os.ParcelFileDescriptor
import android.provider.OpenableColumns
import android.view.SurfaceHolder
import android.view.SurfaceView
import android.webkit.CookieManager
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.compose.BackHandler
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.IntentSenderRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.browser.customtabs.CustomTabsIntent
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.rememberTransformableState
import androidx.compose.foundation.gestures.transformable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.graphics.asAndroidBitmap
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.FileProvider
import androidx.core.net.toUri
import androidx.work.Constraints
import androidx.work.CoroutineWorker
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.NetworkType
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import com.google.mlkit.vision.barcode.common.Barcode
import com.google.mlkit.vision.codescanner.GmsBarcodeScannerOptions
import com.google.mlkit.vision.codescanner.GmsBarcodeScanning
import com.google.mlkit.vision.documentscanner.GmsDocumentScannerOptions
import com.google.mlkit.vision.documentscanner.GmsDocumentScanning
import com.google.mlkit.vision.documentscanner.GmsDocumentScanningResult
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext
import org.jetbrains.compose.resources.getString
import org.jetbrains.compose.resources.stringResource
import java.io.ByteArrayOutputStream
import java.io.File
import java.security.MessageDigest
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.concurrent.TimeUnit

/** Set by the host activity before the first composition. */
object AndroidHost {
    lateinit var activity: Activity

    /** The application's: a background job has no activity. */
    lateinit var context: Context
}

actual fun sha256(bytes: ByteArray): ByteArray = MessageDigest.getInstance("SHA-256").digest(bytes)

actual val deviceName: String get() = Build.MODEL

actual fun openAuthBrowser(url: String) {
    CustomTabsIntent.Builder().build().launchUrl(AndroidHost.activity, url.toUri())
}

actual object Prefs {
    private val prefs get() = AndroidHost.context.getSharedPreferences("penombre", Context.MODE_PRIVATE)

    actual fun get(key: String): String? = prefs.getString(key, null)

    actual fun set(key: String, value: String?) {
        prefs.edit().apply { if (value == null) remove(key) else putString(key, value) }.apply()
    }
}

@SuppressLint("SetJavaScriptEnabled")
@Composable
actual fun WebPage(url: String, session: Session, modifier: Modifier, transparent: Boolean, controller: WebController?) {
    val language = spoken(LocalLanguage.current)
    AndroidView(modifier = modifier, factory = { context ->
        WebView(context).apply {
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            // The site knows its own app by this: no "get the app" banner in here.
            settings.userAgentString = "${settings.userAgentString} PenombreApp"
            webViewClient = WebViewClient()
            if (transparent) setBackgroundColor(android.graphics.Color.TRANSPARENT)
            val view = this
            // evaluateJavascript does not wait for a promise: its answer is polled for.
            controller?.settle = {
                val asked = CompletableDeferred<String?>()
                view.evaluateJavascript(
                    "window.__penombreSettled = undefined;" +
                        "window.penombreSettle ? (window.penombreSettle().then(v => window.__penombreSettled = String(v)," +
                        " () => window.__penombreSettled = 'false'), 'waiting') : 'none'",
                ) { asked.complete(it) }
                if (asked.await()?.contains("none") == true) {
                    null
                } else {
                    var answer: String? = null
                    while (answer == null) {
                        delay(100)
                        val read = CompletableDeferred<String?>()
                        view.evaluateJavascript("window.__penombreSettled || ''") { read.complete(it) }
                        answer = read.await()?.trim('"')?.takeIf { it.isNotEmpty() }
                    }
                    answer == "true"
                }
            }
            val secure = if (session.server.startsWith("https://")) "; Secure" else ""
            val cookies = CookieManager.getInstance()
            // The web's own language cookie (paraglide's): its pages open in the app's.
            cookies.setCookie(session.server, "$LANGUAGE_COOKIE=$language; Path=/$secure")
            cookies.setCookie(session.server, "${session.cookieName}=${session.cookieValue}; Path=/; HttpOnly$secure") {
                cookies.flush()
                loadUrl(url)
            }
        }
    })
}

@Composable
actual fun PlatformBack(enabled: Boolean, onBack: () -> Unit) = BackHandler(enabled, onBack)

actual fun availableSources(): List<Source> = buildList {
    add(Source.Files)
    if (AndroidHost.activity.packageManager.hasSystemFeature(PackageManager.FEATURE_CAMERA_ANY)) {
        add(Source.Camera)
        add(Source.Scan)
    }
}

private fun stamp() = SimpleDateFormat("yyyy-MM-dd HH.mm.ss", Locale.US).format(Date())

@Composable
actual fun rememberFilePicker(onPicked: (List<PickedFile>) -> Unit): (Source) -> Unit {
    val context = LocalContext.current
    val resolver = context.contentResolver
    // The latest callback: the folder on screen may have changed since.
    val picked by rememberUpdatedState(onPicked)

    fun from(uri: Uri, named: String? = null): PickedFile {
        var name = named ?: uri.lastPathSegment ?: "file"
        var size = 0L
        if (uri.scheme == "file") {
            size = File(uri.path!!).length()
        } else {
            resolver.query(uri, arrayOf(OpenableColumns.DISPLAY_NAME, OpenableColumns.SIZE), null, null, null)?.use {
                if (it.moveToFirst()) {
                    if (named == null) name = it.getString(0) ?: name
                    size = it.getLong(1)
                }
            }
        }
        return PickedFile(name, size) { resolver.openInputStream(uri)!!.use { stream -> stream.readBytes() } }
    }

    val files = rememberLauncherForActivityResult(ActivityResultContracts.OpenMultipleDocuments()) { uris ->
        picked(uris.map { from(it) })
    }
    // Saved: the camera can push this app out of memory while it is open.
    var photo by rememberSaveable { mutableStateOf<String?>(null) }
    val camera = rememberLauncherForActivityResult(ActivityResultContracts.TakePicture()) { saved ->
        val file = photo?.let(::File)
        picked(if (saved && file != null) listOf(PickedFile(file.name, file.length()) { file.readBytes() }) else emptyList())
    }
    val scanner = rememberLauncherForActivityResult(ActivityResultContracts.StartIntentSenderForResult()) { result ->
        val pdf = GmsDocumentScanningResult.fromActivityResultIntent(result.data)?.pdf
        picked(if (result.resultCode == Activity.RESULT_OK && pdf != null) listOf(from(pdf.uri, "Scan ${stamp()}.pdf")) else emptyList())
    }

    return { source ->
        when (source) {
            Source.Files -> files.launch(arrayOf("*/*"))

            Source.Camera -> {
                val file = File(context.cacheDir, "camera/Photo ${stamp()}.jpg").also { it.parentFile?.mkdirs() }
                photo = file.path
                camera.launch(FileProvider.getUriForFile(context, "${context.packageName}.files", file))
            }

            Source.Scan -> {
                val options = GmsDocumentScannerOptions.Builder()
                    .setGalleryImportAllowed(true)
                    .setResultFormats(GmsDocumentScannerOptions.RESULT_FORMAT_PDF)
                    .setScannerMode(GmsDocumentScannerOptions.SCANNER_MODE_FULL)
                    .build()
                // Google Play services does the scanning; without it, nothing opens.
                GmsDocumentScanning.getClient(options).getStartScanIntent(AndroidHost.activity)
                    .addOnSuccessListener { scanner.launch(IntentSenderRequest.Builder(it).build()) }
                    .addOnFailureListener { picked(emptyList()) }
            }
        }
    }
}

actual class MediaEngine actual constructor() {
    private var player: MediaPlayer? = null
    private var ready = false
    private var wanted = false
    private var shape = 0f
    private var broken = false

    // The surface may come before the file, or after.
    internal var display: SurfaceHolder? = null
        set(value) {
            field = value
            runCatching { player?.setDisplay(value) }
        }

    actual fun load(url: String, token: String) {
        stop()
        player = MediaPlayer().apply {
            setAudioAttributes(
                AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_MEDIA)
                    .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC).build(),
            )
            setDataSource(AndroidHost.activity, url.toUri(), mapOf("Authorization" to "Bearer $token"))
            display?.let(::setDisplay)
            setOnVideoSizeChangedListener { _, width, height -> if (height > 0) shape = width.toFloat() / height }
            setOnErrorListener { _, _, _ ->
                broken = true
                true
            }
            setOnPreparedListener {
                ready = true
                if (wanted) it.start()
            }
            prepareAsync()
        }
    }

    actual fun play() {
        wanted = true
        if (ready) player?.start()
    }

    actual fun pause() {
        wanted = false
        if (ready) player?.pause()
    }

    actual fun seek(seconds: Double) {
        if (ready) player?.seekTo((seconds * 1000).toInt())
    }

    actual fun stop() {
        player?.release()
        player = null
        ready = false
        wanted = false
        shape = 0f
        broken = false
    }

    actual val position: Double get() = if (ready) (player?.currentPosition ?: 0) / 1000.0 else 0.0
    actual val duration: Double get() = if (ready) (player?.duration ?: 0).coerceAtLeast(0) / 1000.0 else 0.0
    actual val aspect: Float get() = shape
    actual val failed: Boolean get() = broken
}

@Composable
actual fun VideoSurface(engine: MediaEngine, aspect: Float, modifier: Modifier) {
    // A surface stretches what it is given: it takes the picture's own shape.
    val fitted = if (aspect > 0) Modifier.aspectRatio(aspect) else modifier
    AndroidView(modifier = fitted, factory = { context ->
        SurfaceView(context).apply {
            holder.addCallback(object : SurfaceHolder.Callback {
                override fun surfaceCreated(holder: SurfaceHolder) {
                    engine.display = holder
                }

                override fun surfaceChanged(holder: SurfaceHolder, format: Int, width: Int, height: Int) = Unit

                override fun surfaceDestroyed(holder: SurfaceHolder) {
                    // The full screen's surface may already have taken over.
                    if (engine.display === holder) engine.display = null
                }
            })
        }
    })
}

actual fun canScanCodes(): Boolean = AndroidHost.activity.packageManager.hasSystemFeature(PackageManager.FEATURE_CAMERA_ANY)

@Composable
actual fun rememberCodeScanner(onCode: (String) -> Unit): () -> Unit {
    val read by rememberUpdatedState(onCode)
    return {
        // Google Play services' own scanner: its screen, and no camera permission.
        val options = GmsBarcodeScannerOptions.Builder().setBarcodeFormats(Barcode.FORMAT_QR_CODE).build()
        GmsBarcodeScanning.getClient(AndroidHost.activity, options).startScan()
            .addOnSuccessListener { code -> code.rawValue?.let { read(it) } }
    }
}

actual fun saveToDevice(url: String, token: String, name: String, done: (Words?) -> Unit) {
    val request = DownloadManager.Request(url.toUri())
        .addRequestHeader("Authorization", "Bearer $token")
        .setTitle(name)
        .setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
        .setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, name)
    val manager = AndroidHost.activity.getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
    manager.enqueue(request)
    done(Words(Res.string.download_started, name))
}

actual class PdfSource actual constructor(bytes: ByteArray) {
    // PdfRenderer reads a file, and renders one page at a time.
    private val file = File.createTempFile("view", ".pdf", AndroidHost.context.cacheDir).apply { writeBytes(bytes) }
    private val renderer = PdfRenderer(ParcelFileDescriptor.open(file, ParcelFileDescriptor.MODE_READ_ONLY))
    private val lock = Mutex()
    private var closed = false

    @Volatile private var closing = false

    // Turned already: pdfium swaps a rotated page's sides.
    private val sizes = (0 until renderer.pageCount).map { index -> renderer.openPage(index).use { Size(it.width.toFloat(), it.height.toFloat()) } }

    actual val pageCount: Int get() = sizes.size

    actual fun pageSize(index: Int): Size = sizes[index]

    actual suspend fun render(index: Int, width: Int): ImageBitmap = withContext(Dispatchers.Default) {
        lock.withLock {
            check(!closed) { "closed" }
            try {
                renderer.openPage(index).use { page ->
                    val height = (width.toFloat() * page.height / page.width).toInt().coerceAtLeast(1)
                    val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
                    bitmap.eraseColor(android.graphics.Color.WHITE)
                    page.render(bitmap, null, null, PdfRenderer.Page.RENDER_MODE_FOR_DISPLAY)
                    bitmap.asImageBitmap()
                }
            } finally {
                // Closed while this page rendered: the last one out shuts it.
                if (closing) shut()
            }
        }
    }

    private fun shut() {
        if (closed) return
        closed = true
        renderer.close()
        file.delete()
    }

    actual fun close() {
        closing = true
        if (lock.tryLock()) {
            try {
                shut()
            } finally {
                lock.unlock()
            }
        }
    }
}

actual fun pngOf(picture: ImageBitmap): ByteArray = ByteArrayOutputStream().also { picture.asAndroidBitmap().compress(Bitmap.CompressFormat.PNG, 100, it) }.toByteArray()

actual fun openExternal(url: String) {
    runCatching {
        AndroidHost.activity.startActivity(Intent(Intent.ACTION_VIEW, url.toUri()))
    }
}

private const val NOTICES = "notices"

actual object NoticeWatch {
    actual fun enable(on: Boolean) {
        val work = WorkManager.getInstance(AndroidHost.context)
        if (!on) {
            work.cancelUniqueWork(NOTICES)
            return
        }
        if (Build.VERSION.SDK_INT >= 33 &&
            AndroidHost.context.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED
        ) {
            AndroidHost.activity.requestPermissions(arrayOf(Manifest.permission.POST_NOTIFICATIONS), 1)
        }
        // Fifteen minutes is the shortest Android allows for a periodic job.
        val request = PeriodicWorkRequestBuilder<NoticeWorker>(15, TimeUnit.MINUTES)
            .setConstraints(Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build())
            .build()
        work.enqueueUniquePeriodicWork(NOTICES, ExistingPeriodicWorkPolicy.KEEP, request)
    }
}

/** Fetches what is new and posts one system notification each. */
class NoticeWorker(context: Context, params: WorkerParameters) : CoroutineWorker(context, params) {
    override suspend fun doWork(): Result {
        AndroidHost.context = applicationContext
        // No activity here: the words come in the app's language all the same.
        speak(savedLanguage())
        val fresh = try {
            freshNotices()
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            return Result.retry()
        }
        val manager = applicationContext.getSystemService(NotificationManager::class.java)
        manager.createNotificationChannel(NotificationChannel(NOTICES, getString(Res.string.notice_channel), NotificationManager.IMPORTANCE_DEFAULT))
        val open = applicationContext.packageManager.getLaunchIntentForPackage(applicationContext.packageName)
        val tap = PendingIntent.getActivity(applicationContext, 0, open, PendingIntent.FLAG_IMMUTABLE)
        val icon = applicationContext.resources.getIdentifier("ic_notify", "drawable", applicationContext.packageName)
        fresh.forEach { notice ->
            val notification = Notification.Builder(applicationContext, NOTICES)
                .setSmallIcon(icon.takeIf { it != 0 } ?: applicationContext.applicationInfo.icon)
                .setContentTitle("Penombre")
                .setContentText(notice.words.load())
                .setContentIntent(tap)
                .setAutoCancel(true)
                .build()
            manager.notify(notice.id.hashCode(), notification)
        }
        return Result.success()
    }
}

actual fun timeZone(): String? = java.util.TimeZone.getDefault().id

actual val appVersion: String
    get() = runCatching {
        AndroidHost.context.packageManager.getPackageInfo(AndroidHost.context.packageName, 0).versionName
    }.getOrNull() ?: "?"

actual fun phoneLanguage(): String = Resources.getSystem().configuration.locales[0].language

actual fun speak(tag: String?) {
    val locale = tag?.let(Locale::forLanguageTag) ?: Resources.getSystem().configuration.locales[0]
    Locale.setDefault(locale)
    // Material's own words (a sheet's "Dismiss") come from the activity's resources.
    runCatching {
        val resources = AndroidHost.activity.resources
        @Suppress("DEPRECATION")
        resources.updateConfiguration(Configuration(resources.configuration).apply { setLocale(locale) }, resources.displayMetrics)
    }
}

actual fun reducedMotion(): Boolean = !ValueAnimator.areAnimatorsEnabled()
