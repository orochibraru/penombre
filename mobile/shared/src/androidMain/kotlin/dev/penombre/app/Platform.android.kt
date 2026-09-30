package dev.penombre.app

import android.annotation.SuppressLint
import android.app.Activity
import android.app.DownloadManager
import android.content.Context
import android.content.pm.PackageManager
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.FileProvider
import androidx.core.net.toUri
import com.google.mlkit.vision.barcode.common.Barcode
import com.google.mlkit.vision.codescanner.GmsBarcodeScannerOptions
import com.google.mlkit.vision.codescanner.GmsBarcodeScanning
import com.google.mlkit.vision.documentscanner.GmsDocumentScannerOptions
import com.google.mlkit.vision.documentscanner.GmsDocumentScanning
import com.google.mlkit.vision.documentscanner.GmsDocumentScanningResult
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext
import java.io.File
import java.security.MessageDigest
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

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
            // The site knows its own app by this: no "get the app" banner in here.
            settings.userAgentString = "${settings.userAgentString} PenombreApp"
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

actual fun saveToDevice(url: String, token: String, name: String, done: (String) -> Unit) {
    val request = DownloadManager.Request(url.toUri())
        .addRequestHeader("Authorization", "Bearer $token")
        .setTitle(name)
        .setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
        .setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, name)
    val manager = AndroidHost.activity.getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
    manager.enqueue(request)
    done("Downloading $name to Downloads")
}

@Composable
actual fun PdfPages(bytes: ByteArray, modifier: Modifier) {
    val context = LocalContext.current
    // PdfRenderer reads a file, and renders one page at a time.
    val renderer = remember(bytes) {
        val file = File.createTempFile("view", ".pdf", context.cacheDir).apply { writeBytes(bytes) }
        file.deleteOnExit()
        PdfRenderer(ParcelFileDescriptor.open(file, ParcelFileDescriptor.MODE_READ_ONLY))
    }
    val lock = remember(renderer) { Mutex() }
    DisposableEffect(renderer) { onDispose { renderer.close() } }
    var scale by remember { mutableFloatStateOf(1f) }
    var offset by remember { mutableStateOf(Offset.Zero) }
    val zoom = rememberTransformableState { change, pan, _ ->
        scale = (scale * change).coerceIn(1f, 4f)
        offset = if (scale == 1f) Offset.Zero else offset + pan
    }
    BoxWithConstraints(modifier.background(Color(0xFF2A2830)).transformable(zoom, canPan = { scale > 1f })) {
        val width = constraints.maxWidth.coerceAtLeast(1)
        LazyColumn(
            Modifier.fillMaxSize().graphicsLayer {
                scaleX = scale
                scaleY = scale
                translationX = offset.x
                translationY = offset.y
            },
            verticalArrangement = Arrangement.spacedBy(8.dp),
            contentPadding = PaddingValues(vertical = 8.dp),
        ) {
            items(renderer.pageCount) { index ->
                var page by remember(index) { mutableStateOf<ImageBitmap?>(null) }
                LaunchedEffect(renderer, index) {
                    page = withContext(Dispatchers.Default) {
                        lock.withLock {
                            renderer.openPage(index).use { pdf ->
                                // Twice the screen's width: sharp once zoomed in a little.
                                val w = width * 2
                                val h = (w.toFloat() * pdf.height / pdf.width).toInt().coerceAtLeast(1)
                                val bitmap = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888)
                                bitmap.eraseColor(android.graphics.Color.WHITE)
                                pdf.render(bitmap, null, null, PdfRenderer.Page.RENDER_MODE_FOR_DISPLAY)
                                bitmap.asImageBitmap()
                            }
                        }
                    }
                }
                val shown = page
                if (shown == null) {
                    Box(Modifier.fillMaxWidth().aspectRatio(0.707f).background(Color.White.copy(alpha = 0.06f)))
                } else {
                    Image(shown, "Page ${index + 1}", Modifier.fillMaxWidth(), contentScale = ContentScale.FillWidth)
                }
            }
        }
    }
}
