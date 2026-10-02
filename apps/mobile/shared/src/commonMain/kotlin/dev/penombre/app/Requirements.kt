package dev.penombre.app

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBars
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBars
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Fingerprint
import androidx.compose.material.icons.outlined.Security
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.launch
import org.jetbrains.compose.resources.pluralStringResource
import org.jetbrains.compose.resources.stringResource

/** One step of setting up two-factor from this screen. */
private sealed interface Enrolling {
    data object Password : Enrolling

    data object Start : Enrolling

    data class Verify(val enrolment: Enrolment) : Enrolling

    data class Codes(val codes: List<String>) : Enrolling
}

/**
 * What stands between the account and the app when the administrator
 * requires a strong way to sign in that it has not set up: the same gate the
 * web interface puts before every page. Nothing else of the app is reachable
 * from here but signing out.
 */
@Composable
fun RequirementsView(host: Host, account: Overview, checked: Boolean, onCheck: () -> Unit, onSignOut: () -> Unit) {
    val scope = rememberCoroutineScope()
    var enrolling by remember { mutableStateOf<Enrolling?>(null) }
    var refusal by remember { mutableStateOf<String?>(null) }

    /** Runs one step; a failure keeps its dialog open with the reason. */
    fun step(block: suspend () -> Enrolling?) {
        scope.launch {
            host.attempt({ refusal = it }) {
                val next = block()
                refusal = null
                enrolling = next
                if (next == null) onCheck()
            }
        }
    }

    val close = {
        enrolling = null
        refusal = null
    }
    when (val current = enrolling) {
        null -> Unit

        Enrolling.Password -> Ask(
            stringResource(Res.string.password_set),
            listOf(Field(stringResource(Res.string.password_new), secret = true), Field(stringResource(Res.string.password_again), secret = true)),
            stringResource(Res.string.save),
            refusal ?: account.passwordRules.minLength.let { pluralStringResource(Res.plurals.secure_password_note, it, it) },
            onDismiss = close,
        ) { (new, again) ->
            step {
                host.api.savePassword(null, new, again)
                Enrolling.Start
            }
        }

        Enrolling.Start -> Ask(
            stringResource(Res.string.two_factor_setup),
            listOf(Field(stringResource(Res.string.your_password), secret = true)),
            stringResource(Res.string.continue_),
            refusal ?: stringResource(Res.string.two_factor_setup_note),
            onDismiss = close,
        ) { (password) -> step { Enrolling.Verify(host.api.enableTwoFactor(password)) } }

        is Enrolling.Verify -> VerifyTwoFactor(current.enrolment, refusal, close) { code ->
            step {
                host.api.verifyTwoFactor(code)?.let(host.renew)
                Enrolling.Codes(current.enrolment.backupCodes)
            }
        }

        is Enrolling.Codes -> Reveal(
            stringResource(Res.string.backup_codes_keep),
            current.codes.joinToString("\n"),
            stringResource(Res.string.backup_codes_note),
        ) {
            enrolling = null
            onCheck()
        }
    }

    Column(
        Modifier.fillMaxSize().windowInsetsPadding(WindowInsets.statusBars).windowInsetsPadding(WindowInsets.navigationBars)
            .verticalScroll(rememberScrollState()).padding(vertical = 24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Moon(56.dp)
        Spacer(Modifier.height(16.dp))
        Text(
            stringResource(Res.string.secure_title),
            color = brand.ink,
            style = MaterialTheme.typography.headlineMedium,
            fontWeight = FontWeight.SemiBold,
            textAlign = TextAlign.Center,
        )
        Spacer(Modifier.height(8.dp))
        Text(
            stringResource(Res.string.secure_text),
            Modifier.padding(horizontal = 28.dp),
            color = brand.muted,
            style = MaterialTheme.typography.bodyLarge,
            textAlign = TextAlign.Center,
        )
        Spacer(Modifier.height(20.dp))
        if ("twoFactor" in account.requirements) {
            CardLink(
                stringResource(Res.string.two_factor),
                stringResource(if (account.hasPassword) Res.string.secure_two_factor_hint else Res.string.secure_two_factor_hint_password),
                Icons.Outlined.Security,
            ) { enrolling = if (account.hasPassword) Enrolling.Start else Enrolling.Password }
        }
        if ("passkey" in account.requirements) {
            // A passkey belongs to the server's web address, which this app
            // cannot claim for a server it does not know in advance.
            CardLink(stringResource(Res.string.secure_passkey), stringResource(Res.string.secure_passkey_hint), Icons.Outlined.Fingerprint) {
                openAuthBrowser("${host.server}/account/security")
            }
        }
        Spacer(Modifier.height(24.dp))
        Column(Modifier.fillMaxWidth().padding(horizontal = 16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            // A passkey added in the browser is only known by asking again.
            if (checked) {
                Text(
                    stringResource(Res.string.secure_not_done),
                    Modifier.fillMaxWidth(),
                    color = brand.muted,
                    style = MaterialTheme.typography.bodySmall,
                    textAlign = TextAlign.Center,
                )
            }
            GradientButton(stringResource(Res.string.continue_), enabled = true, onClick = onCheck)
            TextButton(onClick = onSignOut, modifier = Modifier.fillMaxWidth()) { Text(stringResource(Res.string.sign_out), color = brand.muted) }
        }
    }
}
