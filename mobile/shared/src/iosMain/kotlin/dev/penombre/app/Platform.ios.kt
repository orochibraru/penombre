package dev.penombre.app

import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.ui.Modifier
import androidx.compose.ui.viewinterop.UIKitInteropProperties
import androidx.compose.ui.viewinterop.UIKitView
import androidx.compose.ui.viewinterop.UIKitViewController
import kotlinx.cinterop.CValue
import kotlinx.cinterop.ExperimentalForeignApi
import kotlinx.cinterop.addressOf
import kotlinx.cinterop.convert
import kotlinx.cinterop.readValue
import kotlinx.cinterop.useContents
import kotlinx.cinterop.usePinned
import platform.AVFAudio.AVAudioSession
import platform.AVFAudio.AVAudioSessionCategoryPlayback
import platform.AVFAudio.setActive
import platform.AVFoundation.AVCaptureConnection
import platform.AVFoundation.AVCaptureDevice
import platform.AVFoundation.AVCaptureDeviceInput
import platform.AVFoundation.AVCaptureMetadataOutput
import platform.AVFoundation.AVCaptureMetadataOutputObjectsDelegateProtocol
import platform.AVFoundation.AVCaptureOutput
import platform.AVFoundation.AVCaptureSession
import platform.AVFoundation.AVCaptureVideoPreviewLayer
import platform.AVFoundation.AVLayerVideoGravityResizeAspectFill
import platform.AVFoundation.AVMediaTypeVideo
import platform.AVFoundation.AVMetadataMachineReadableCodeObject
import platform.AVFoundation.AVMetadataObjectTypeQRCode
import platform.AVFoundation.AVPlayerItemStatusFailed
import platform.Foundation.NSHTTPURLResponse
import platform.Foundation.NSMutableURLRequest
import platform.Foundation.NSTemporaryDirectory
import platform.Foundation.NSURLSession
import platform.Foundation.downloadTaskWithRequest
import platform.Foundation.setValue
import platform.UIKit.UIActivityViewController
import platform.UIKit.UIColor
import platform.UIKit.popoverPresentationController
import platform.darwin.dispatch_async
import platform.darwin.dispatch_get_global_queue
import platform.darwin.dispatch_get_main_queue
import platform.AVFoundation.AVPlayer
import platform.AVFoundation.AVPlayerItem
import platform.AVFoundation.AVPlayerLayer
import platform.AVFoundation.AVURLAsset
import platform.AVFoundation.currentItem
import platform.AVFoundation.currentTime
import platform.AVFoundation.duration
import platform.AVFoundation.pause
import platform.AVFoundation.play
import platform.AVFoundation.presentationSize
import platform.AVFoundation.replaceCurrentItemWithPlayerItem
import platform.AVFoundation.seekToTime
import platform.AuthenticationServices.ASPresentationAnchor
import platform.AuthenticationServices.ASWebAuthenticationPresentationContextProvidingProtocol
import platform.AuthenticationServices.ASWebAuthenticationSession
import platform.CoreCrypto.CC_SHA256
import platform.CoreCrypto.CC_SHA256_DIGEST_LENGTH
import platform.CoreGraphics.CGRectMake
import platform.CoreMedia.CMTime
import platform.CoreMedia.CMTimeGetSeconds
import platform.CoreMedia.CMTimeMakeWithSeconds
import platform.CoreGraphics.CGRectZero
import platform.QuartzCore.CATransaction
import platform.Foundation.NSData
import platform.Foundation.create
import platform.PDFKit.kPDFDisplaySinglePageContinuous
import platform.PDFKit.PDFView
import platform.PDFKit.PDFDocument
import platform.Foundation.NSDate
import platform.Foundation.NSDateFormatter
import platform.Foundation.NSError
import platform.Foundation.NSFileManager
import platform.Foundation.NSFileSize
import platform.Foundation.NSHTTPCookie
import platform.Foundation.NSMutableData
import platform.Foundation.NSHTTPCookieDomain
import platform.Foundation.NSHTTPCookieName
import platform.Foundation.NSHTTPCookiePath
import platform.Foundation.NSHTTPCookieSecure
import platform.Foundation.NSHTTPCookieValue
import platform.Foundation.NSURL
import platform.Foundation.NSURLRequest
import platform.Foundation.NSUserDefaults
import platform.Foundation.NSNumber
import platform.Foundation.dataWithContentsOfURL
import platform.UIKit.UIApplication
import platform.UIKit.UIDevice
import platform.UIKit.UIDocumentPickerDelegateProtocol
import platform.UIKit.UIDocumentPickerViewController
import platform.UIKit.UIGraphicsBeginPDFContextToData
import platform.UIKit.UIGraphicsBeginPDFPageWithInfo
import platform.UIKit.UIGraphicsEndPDFContext
import platform.UIKit.UIImage
import platform.UIKit.UIImageJPEGRepresentation
import platform.UIKit.UIImagePickerController
import platform.UIKit.UIImagePickerControllerDelegateProtocol
import platform.UIKit.UIImagePickerControllerOriginalImage
import platform.UIKit.UIImagePickerControllerSourceType
import platform.UIKit.UINavigationControllerDelegateProtocol
import platform.UIKit.UIView
import platform.UIKit.UIViewController
import platform.UIKit.UIWindow
import platform.UniformTypeIdentifiers.UTTypeItem
import platform.VisionKit.VNDocumentCameraScan
import platform.VisionKit.VNDocumentCameraViewController
import platform.VisionKit.VNDocumentCameraViewControllerDelegateProtocol
import platform.WebKit.WKWebView
import platform.WebKit.WKWebViewConfiguration
import platform.WebKit.WKWebsiteDataStore
import platform.darwin.NSObject
import platform.posix.memcpy

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

// A class, not an object: Kotlin/Native cannot make a singleton of an Obj-C subclass.
private class Anchor : NSObject(), ASWebAuthenticationPresentationContextProvidingProtocol {
    override fun presentationAnchorForWebAuthenticationSession(session: ASWebAuthenticationSession): ASPresentationAnchor =
        UIApplication.sharedApplication.keyWindow ?: UIWindow()
}

// Held so neither is collected while the sheet is up.
private var authSession: ASWebAuthenticationSession? = null
private val anchor = Anchor()

actual fun openAuthBrowser(url: String) {
    val session = ASWebAuthenticationSession(NSURL(string = url), "penombre") { callback, _ ->
        callback?.absoluteString?.let { Auth.callbacks.value = it }
        authSession = null
    }
    session.presentationContextProvider = anchor
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
        // Off by default: the page would be invisible to VoiceOver.
        properties = UIKitInteropProperties(isNativeAccessibilityEnabled = true),
        factory = {
            val config = WKWebViewConfiguration().apply {
                websiteDataStore = WKWebsiteDataStore.defaultDataStore()
                // The site knows its own app by this: no "get the app" banner in here.
                applicationNameForUserAgent = "PenombreApp"
            }
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

@OptIn(ExperimentalForeignApi::class)
private fun NSData.toBytes(): ByteArray = ByteArray(length.toInt()).also { out ->
    if (out.isNotEmpty()) out.usePinned { memcpy(it.addressOf(0), bytes, length) }
}

private fun stamp() = NSDateFormatter().apply { dateFormat = "yyyy-MM-dd HH.mm.ss" }.stringFromDate(NSDate())

private fun present(controller: UIViewController) {
    UIApplication.sharedApplication.keyWindow?.rootViewController?.presentViewController(controller, true, null)
}

actual fun availableSources(): List<Source> = buildList {
    add(Source.Files)
    // Neither exists on a simulator.
    if (UIImagePickerController.isSourceTypeAvailable(UIImagePickerControllerSourceType.UIImagePickerControllerSourceTypeCamera)) {
        add(Source.Camera)
    }
    if (VNDocumentCameraViewController.supported) add(Source.Scan)
}

@OptIn(ExperimentalForeignApi::class)
private class PickerDelegate(val onPicked: (List<PickedFile>) -> Unit) :
    NSObject(),
    UIDocumentPickerDelegateProtocol,
    UIImagePickerControllerDelegateProtocol,
    UINavigationControllerDelegateProtocol,
    VNDocumentCameraViewControllerDelegateProtocol {

    override fun documentPicker(controller: UIDocumentPickerViewController, didPickDocumentsAtURLs: List<*>) {
        onPicked(
            didPickDocumentsAtURLs.filterIsInstance<NSURL>().map { url ->
                val size = url.path
                    ?.let { NSFileManager.defaultManager.attributesOfItemAtPath(it, null)?.get(NSFileSize) as? NSNumber }
                    ?.longLongValue ?: 0L
                PickedFile(url.lastPathComponent ?: "file", size) {
                    (NSData.dataWithContentsOfURL(url) ?: error("Could not read ${url.lastPathComponent}.")).toBytes()
                }
            },
        )
    }

    override fun imagePickerController(picker: UIImagePickerController, didFinishPickingMediaWithInfo: Map<Any?, *>) {
        val photo = (didFinishPickingMediaWithInfo[UIImagePickerControllerOriginalImage] as? UIImage)
            ?.let { UIImageJPEGRepresentation(it, 0.9) }
        picker.dismissViewControllerAnimated(true, null)
        onPicked(if (photo == null) emptyList() else listOf(PickedFile("Photo ${stamp()}.jpg", photo.length.toLong()) { photo.toBytes() }))
    }

    override fun imagePickerControllerDidCancel(picker: UIImagePickerController) {
        picker.dismissViewControllerAnimated(true, null)
        onPicked(emptyList())
    }

    // The scanned pages, one PDF page each.
    override fun documentCameraViewController(controller: VNDocumentCameraViewController, didFinishWithScan: VNDocumentCameraScan) {
        val pdf = NSMutableData()
        UIGraphicsBeginPDFContextToData(pdf, CGRectZero.readValue(), null)
        for (index in 0 until didFinishWithScan.pageCount.toInt()) {
            val page = didFinishWithScan.imageOfPageAtIndex(index.toULong())
            val bounds = page.size.useContents { CGRectMake(0.0, 0.0, width, height) }
            UIGraphicsBeginPDFPageWithInfo(bounds, null)
            page.drawInRect(bounds)
        }
        UIGraphicsEndPDFContext()
        controller.dismissViewControllerAnimated(true, null)
        onPicked(listOf(PickedFile("Scan ${stamp()}.pdf", pdf.length.toLong()) { pdf.toBytes() }))
    }

    override fun documentCameraViewControllerDidCancel(controller: VNDocumentCameraViewController) {
        controller.dismissViewControllerAnimated(true, null)
        onPicked(emptyList())
    }

    override fun documentCameraViewController(controller: VNDocumentCameraViewController, didFailWithError: NSError) {
        controller.dismissViewControllerAnimated(true, null)
        onPicked(emptyList())
    }
}

@Composable
actual fun rememberFilePicker(onPicked: (List<PickedFile>) -> Unit): (Source) -> Unit {
    // The latest callback: the folder on screen may have changed since.
    val picked by rememberUpdatedState(onPicked)
    // Held: each picker keeps only a weak reference to its delegate.
    val delegate = remember { PickerDelegate { picked(it) } }
    return { source ->
        when (source) {
            Source.Files -> present(
                // Copies, so the bytes stay readable once the picker is gone.
                UIDocumentPickerViewController(forOpeningContentTypes = listOf(UTTypeItem), asCopy = true).apply {
                    allowsMultipleSelection = true
                    this.delegate = delegate
                },
            )
            Source.Camera -> present(
                UIImagePickerController().apply {
                    sourceType = UIImagePickerControllerSourceType.UIImagePickerControllerSourceTypeCamera
                    this.delegate = delegate
                },
            )
            Source.Scan -> present(VNDocumentCameraViewController().apply { this.delegate = delegate })
        }
    }
}

@OptIn(ExperimentalForeignApi::class)
actual class MediaEngine actual constructor() {
    // One player for the engine's life: the video surface holds on to it.
    internal val player = AVPlayer()

    actual fun load(url: String, token: String) {
        // Playback, not ambient: it keeps going with the screen off or the switch on silent.
        AVAudioSession.sharedInstance().apply {
            setCategory(AVAudioSessionCategoryPlayback, null)
            setActive(true, null)
        }
        val asset = AVURLAsset(
            uRL = NSURL(string = url),
            options = mapOf("AVURLAssetHTTPHeaderFieldsKey" to mapOf("Authorization" to "Bearer $token")),
        )
        player.replaceCurrentItemWithPlayerItem(AVPlayerItem(asset = asset))
    }

    actual fun play() {
        player.play()
    }

    actual fun pause() {
        player.pause()
    }

    actual fun seek(seconds: Double) {
        player.seekToTime(CMTimeMakeWithSeconds(seconds, 600))
    }

    actual fun stop() {
        player.pause()
        player.replaceCurrentItemWithPlayerItem(null)
    }

    private fun seconds(time: CValue<CMTime>?): Double =
        time?.let { CMTimeGetSeconds(it) }?.takeIf { it.isFinite() && it > 0 } ?: 0.0

    actual val position: Double get() = seconds(player.currentTime())
    actual val duration: Double get() = seconds(player.currentItem?.duration)
    actual val aspect: Float
        get() = player.currentItem?.presentationSize?.useContents { if (height > 0) (width / height).toFloat() else 0f } ?: 0f
    actual val failed: Boolean get() = player.currentItem?.status == AVPlayerItemStatusFailed
}

/** The picture and nothing else; its layer follows the view's bounds. */
@OptIn(ExperimentalForeignApi::class)
private class PlayerView(player: AVPlayer) : UIView(frame = CGRectZero.readValue()) {
    private val picture = AVPlayerLayer.playerLayerWithPlayer(player)

    init {
        // Opaque: with no picture yet, the view showed the screen underneath.
        backgroundColor = UIColor.blackColor
        layer.addSublayer(picture)
    }

    override fun layoutSubviews() {
        super.layoutSubviews()
        // No implicit animation: the picture must not slide into place.
        CATransaction.begin()
        CATransaction.setDisableActions(true)
        picture.frame = bounds
        CATransaction.commit()
    }
}

@Composable
actual fun VideoSurface(engine: MediaEngine, aspect: Float, modifier: Modifier) {
    // The layer fits the picture itself: the view only has to fill its box.
    UIKitView(
        factory = { PlayerView(engine.player) },
        modifier = modifier,
        // Touches go to the app's controls drawn over it.
        properties = UIKitInteropProperties(interactionMode = null),
    )
}

actual fun canScanCodes(): Boolean = AVCaptureDevice.defaultDeviceWithMediaType(AVMediaTypeVideo) != null

/** The camera, full sheet, until it reads one QR code; slid down, it reads none. */
@OptIn(ExperimentalForeignApi::class)
private class CodeScanner(val onCode: (String) -> Unit) :
    UIViewController(nibName = null, bundle = null),
    AVCaptureMetadataOutputObjectsDelegateProtocol {
    private val capture = AVCaptureSession()
    private val picture = AVCaptureVideoPreviewLayer(session = capture)
    private var read = false

    override fun viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = UIColor.blackColor
        val camera = AVCaptureDevice.defaultDeviceWithMediaType(AVMediaTypeVideo) ?: return
        val input = AVCaptureDeviceInput.deviceInputWithDevice(camera, null) ?: return
        if (!capture.canAddInput(input)) return
        capture.addInput(input)
        val output = AVCaptureMetadataOutput()
        if (!capture.canAddOutput(output)) return
        capture.addOutput(output)
        // Only after it is added: the types it can read depend on the session.
        output.setMetadataObjectsDelegate(this, dispatch_get_main_queue())
        output.metadataObjectTypes = listOf(AVMetadataObjectTypeQRCode)
        picture.videoGravity = AVLayerVideoGravityResizeAspectFill
        view.layer.addSublayer(picture)
    }

    override fun viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()
        picture.frame = view.bounds
    }

    override fun viewDidAppear(animated: Boolean) {
        super.viewDidAppear(animated)
        // Starting blocks: off the main thread.
        dispatch_async(dispatch_get_global_queue(0, 0u)) { capture.startRunning() }
    }

    override fun viewDidDisappear(animated: Boolean) {
        super.viewDidDisappear(animated)
        capture.stopRunning()
    }

    override fun captureOutput(output: AVCaptureOutput, didOutputMetadataObjects: List<*>, fromConnection: AVCaptureConnection) {
        val text = didOutputMetadataObjects.filterIsInstance<AVMetadataMachineReadableCodeObject>().firstOrNull()?.stringValue
        if (read || text == null) return
        read = true
        dismissViewControllerAnimated(true) { onCode(text) }
    }
}

@Composable
actual fun rememberCodeScanner(onCode: (String) -> Unit): () -> Unit {
    val read by rememberUpdatedState(onCode)
    return { present(CodeScanner { read(it) }) }
}

@OptIn(ExperimentalForeignApi::class)
actual fun saveToDevice(url: String, token: String, name: String, done: (String) -> Unit) {
    val request = NSMutableURLRequest(uRL = NSURL(string = url)).apply {
        setValue("Bearer $token", forHTTPHeaderField = "Authorization")
    }
    NSURLSession.sharedSession.downloadTaskWithRequest(request) { location, response, error ->
        val ok = (response as? NSHTTPURLResponse)?.statusCode?.toInt() in 200..299
        // Moved before this block returns: the system deletes `location` after it.
        val kept = NSURL.fileURLWithPath(NSTemporaryDirectory() + name)
        NSFileManager.defaultManager.removeItemAtURL(kept, null)
        val moved = error == null && ok && location != null &&
            NSFileManager.defaultManager.moveItemAtURL(location, kept, null)
        dispatch_async(dispatch_get_main_queue()) {
            if (!moved) {
                done("$name could not be downloaded.")
            } else {
                val root = UIApplication.sharedApplication.keyWindow?.rootViewController
                val sheet = UIActivityViewController(activityItems = listOf(kept), applicationActivities = null)
                // An iPad shows it as a popover, which needs somewhere to point.
                sheet.popoverPresentationController?.sourceView = root?.view
                root?.presentViewController(sheet, true, null)
                done("")
            }
        }
    }.resume()
}

@OptIn(ExperimentalForeignApi::class)
@Composable
actual fun PdfPages(bytes: ByteArray, modifier: Modifier) {
    UIKitView(
        factory = {
            PDFView(frame = CGRectZero.readValue()).apply {
                autoScales = true
                displayMode = kPDFDisplaySinglePageContinuous
                document = PDFDocument(data = bytes.toNSData())
            }
        },
        modifier = modifier,
    )
}

@OptIn(ExperimentalForeignApi::class)
private fun ByteArray.toNSData(): NSData =
    if (isEmpty()) NSData() else usePinned { NSData.create(bytes = it.addressOf(0), length = size.convert()) }
