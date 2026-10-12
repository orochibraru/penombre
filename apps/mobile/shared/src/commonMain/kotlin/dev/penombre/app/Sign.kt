package dev.penombre.app

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.navigationBars
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.selection.toggleable
import androidx.compose.material3.Checkbox
import androidx.compose.material3.CheckboxDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.launch
import org.jetbrains.compose.resources.stringResource

/**
 * A signature request, answered here: the frozen PDF, then a signature drawn
 * with a finger. The same service as the link's web page; signed in to that
 * server, the signature is recorded as the account's.
 */
@Composable
fun SignView(link: SigningLink, session: Session?, onBack: () -> Unit) {
    val scope = rememberCoroutineScope()
    val signing = remember(link) { Signing(link, session) }
    var view by remember { mutableStateOf<SigningView?>(null) }
    var bytes by remember { mutableStateOf<ByteArray?>(null) }
    var failed by remember { mutableStateOf<String?>(null) }
    var consent by remember { mutableStateOf(false) }
    var drawing by remember { mutableStateOf(false) }
    var declining by remember { mutableStateOf(false) }
    var busy by remember { mutableStateOf(false) }

    suspend fun attempt(block: suspend () -> Unit) {
        try {
            block()
        } catch (e: CancellationException) {
            throw e
        } catch (e: Failure) {
            failed = e.words.load()
        } catch (e: Exception) {
            failed = e.message ?: Words(Res.string.error_generic).load()
        }
    }
    LaunchedEffect(link) {
        attempt {
            view = signing.view()
            bytes = signing.document()
        }
    }
    val source = remember(bytes) { bytes?.let { PdfSource(it) } }
    DisposableEffect(source) { onDispose { source?.close() } }
    PlatformBack(enabled = true, onBack = onBack)

    if (drawing) {
        SignaturePad(onDismiss = { drawing = false }) { drawn ->
            drawing = false
            busy = true
            scope.launch {
                attempt {
                    failed = null
                    view = signing.sign(drawn.png, timeZone())
                }
                busy = false
            }
        }
    }
    val current = view
    if (declining && current != null) {
        Confirm(
            stringResource(Res.string.sign_request_decline_title, current.documentName),
            stringResource(Res.string.sign_request_decline_text, current.requesterName),
            stringResource(Res.string.sign_request_decline),
            { declining = false },
        ) {
            declining = false
            busy = true
            scope.launch {
                attempt { view = signing.decline(null) }
                busy = false
            }
        }
    }

    Scaffold(
        containerColor = Color.Transparent,
        topBar = { Header(current?.documentName ?: "", onBack = onBack, compact = true) },
        bottomBar = {
            if (current?.canSign == true) {
                Column(
                    Modifier.fillMaxWidth().background(brand.panel.copy(alpha = 0.96f))
                        .windowInsetsPadding(WindowInsets.navigationBars).padding(horizontal = 16.dp, vertical = 10.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    Row(
                        Modifier.fillMaxWidth().toggleable(consent, role = Role.Checkbox) { consent = it },
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Checkbox(consent, onCheckedChange = null, colors = CheckboxDefaults.colors(checkedColor = brand.accent))
                        Text(stringResource(Res.string.sign_request_consent), Modifier.padding(start = 8.dp), color = brand.ink, style = MaterialTheme.typography.bodyMedium)
                    }
                    GradientButton(stringResource(Res.string.sign_request_sign), enabled = consent && !busy) { drawing = true }
                    TextButton(onClick = { declining = true }, enabled = !busy, modifier = Modifier.fillMaxWidth()) {
                        Text(stringResource(Res.string.sign_request_decline), color = MaterialTheme.colorScheme.error)
                    }
                }
            }
        },
    ) { padding ->
        Column(Modifier.padding(padding).fillMaxSize()) {
            if (current != null) {
                Column(Modifier.padding(horizontal = 20.dp, vertical = 6.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text(stringResource(Res.string.sign_request_asks, current.requesterName), color = brand.ink, fontWeight = FontWeight.Medium)
                    current.message?.let { Text(it, color = brand.muted, style = MaterialTheme.typography.bodyMedium) }
                    val state = when {
                        current.signer.status == "signed" -> stringResource(Res.string.sign_request_signed)
                        current.status != "pending" || current.signer.status != "pending" -> stringResource(Res.string.sign_request_closed)
                        current.waitingFor != null -> stringResource(Res.string.sign_request_waiting, current.waitingFor)
                        else -> stringResource(Res.string.sign_request_honest)
                    }
                    Text(state, color = if (current.canSign) brand.muted else brand.accent, style = MaterialTheme.typography.bodySmall)
                }
            }
            failed?.let { Note(it, colour = MaterialTheme.colorScheme.error) }
            Box(Modifier.weight(1f).fillMaxWidth(), contentAlignment = Alignment.Center) {
                when {
                    source != null -> PdfPages(source, Modifier.fillMaxSize())
                    failed == null -> BreathingMoon()
                }
            }
        }
    }
}
