package dev.penombre.app

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyListScope
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.AlternateEmail
import androidx.compose.material.icons.outlined.Badge
import androidx.compose.material.icons.outlined.DeleteForever
import androidx.compose.material.icons.outlined.Devices
import androidx.compose.material.icons.outlined.Download
import androidx.compose.material.icons.outlined.Fingerprint
import androidx.compose.material.icons.outlined.Key
import androidx.compose.material.icons.outlined.Password
import androidx.compose.material.icons.outlined.PhoneIphone
import androidx.compose.material.icons.outlined.Security
import androidx.compose.material.icons.outlined.VpnKey
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.launch
import org.jetbrains.compose.resources.StringResource
import org.jetbrains.compose.resources.pluralStringResource
import org.jetbrains.compose.resources.stringResource

/** One field of an [Ask] dialog. */
class Field(val label: String, val initial: String = "", val secret: Boolean = false, val number: Boolean = false)

/**
 * A dialog of a few fields: a password, a name, a code. `onConfirm` gets the
 * values in order; `note` says what is asked for or why it failed.
 */
@Composable
fun Ask(
    title: String,
    fields: List<Field>,
    action: String,
    note: String? = null,
    danger: Boolean = false,
    onDismiss: () -> Unit,
    /** Under the fields: another way to answer, say. */
    footer: (@Composable () -> Unit)? = null,
    onConfirm: (List<String>) -> Unit,
) {
    val values = remember { mutableStateListOf(*fields.map { it.initial }.toTypedArray()) }
    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = brand.panel,
        title = { Text(title) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                note?.let { Text(it, color = brand.muted, style = MaterialTheme.typography.bodyMedium) }
                fields.forEachIndexed { index, field ->
                    OutlinedTextField(
                        value = values[index],
                        onValueChange = { values[index] = it },
                        label = { Text(field.label) },
                        singleLine = true,
                        shape = Corner,
                        visualTransformation = if (field.secret) PasswordVisualTransformation() else androidx.compose.ui.text.input.VisualTransformation.None,
                        keyboardOptions = KeyboardOptions(
                            keyboardType = when {
                                field.secret -> KeyboardType.Password
                                field.number -> KeyboardType.NumberPassword
                                else -> KeyboardType.Text
                            },
                        ),
                        modifier = Modifier.fillMaxWidth(),
                    )
                }
                footer?.invoke()
            }
        },
        confirmButton = {
            TextButton(enabled = values.all { it.isNotBlank() } || fields.isEmpty(), onClick = { onConfirm(values.toList()) }) {
                Text(action, color = if (danger) MaterialTheme.colorScheme.error else brand.accent)
            }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text(stringResource(Res.string.cancel), color = brand.muted) } },
    )
}

/** Shows something once, to copy: a new API key, backup codes. */
@Composable
fun Reveal(title: String, text: String, note: String, onDone: () -> Unit) {
    @Suppress("DEPRECATION")
    val clipboard = LocalClipboardManager.current
    AlertDialog(
        onDismissRequest = onDone,
        containerColor = brand.panel,
        title = { Text(title) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Text(note, color = brand.muted, style = MaterialTheme.typography.bodyMedium)
                Text(
                    text,
                    Modifier.fillMaxWidth().clip(Corner).background(brand.ground).padding(12.dp),
                    color = brand.ink,
                    fontFamily = FontFamily.Monospace,
                    style = MaterialTheme.typography.bodyMedium,
                )
            }
        },
        confirmButton = { TextButton(onClick = onDone) { Text(stringResource(Res.string.done), color = brand.accent) } },
        dismissButton = { TextButton(onClick = { clipboard.setText(AnnotatedString(text)) }) { Text(stringResource(Res.string.copy), color = brand.accent) } },
    )
}

/** What a dialog on this screen is asking, one at a time. */
private sealed interface Asking {
    data object Name : Asking
    data class Address(val verify: Boolean) : Asking
    data object Password : Asking
    data object EnableTwoFactor : Asking
    data class Verify(val enrolment: Enrolment) : Asking
    data class Codes(val codes: List<String>, val title: StringResource) : Asking
    data object DisableTwoFactor : Asking
    data object BackupCodes : Asking
    data class RenamePasskey(val passkey: Passkey) : Asking
    data class DeletePasskey(val passkey: Passkey) : Asking
    data object NewKey : Asking
    data class ShowKey(val key: CreatedKey) : Asking
    data class DeleteKey(val key: ApiKey) : Asking
    data class Revoke(val session: DeviceSession) : Asking
    data object DeleteAccount : Asking
}

/** The web's account tabs, one screen each under "My profile". */
enum class ProfileSection(val title: StringResource) {
    Details(Res.string.profile_details),
    Security(Res.string.profile_security),
    Sessions(Res.string.profile_sessions),
}

/** One of the account's tabs; they share the dialogs and what they load. */
@Composable
fun ProfileView(host: Host, section: ProfileSection) {
    val scope = rememberCoroutineScope()
    var overview by remember { mutableStateOf<Overview?>(null) }
    var passkeys by remember { mutableStateOf<List<Passkey>>(emptyList()) }
    var keys by remember { mutableStateOf<List<ApiKey>>(emptyList()) }
    var sessions by remember { mutableStateOf<List<DeviceSession>>(emptyList()) }
    var reload by remember { mutableIntStateOf(0) }
    var asking by remember { mutableStateOf<Asking?>(null) }
    // Why the open dialog's last try failed, shown in it.
    var refusal by remember { mutableStateOf<String?>(null) }
    var status by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(reload) {
        host.attempt({ status = it }) {
            overview = host.api.overview()
            passkeys = host.api.passkeys()
            keys = host.api.apiKeys()
            sessions = host.api.sessions()
        }
    }

    /**
     * Runs a dialog's call. It answers the dialog that comes next (the codes
     * after an enrolment, a new key), or null to close; a failure stays open
     * and says why.
     */
    fun change(block: suspend () -> Asking?) {
        scope.launch {
            host.attempt({ refusal = it }) {
                val next = block()
                refusal = null
                asking = next
                reload++
            }
        }
    }

    val open = { ask: Asking ->
        refusal = null
        asking = ask
    }

    overview?.let { account ->
        Dialogs(host, account, asking, refusal, { asking = null }, ::change) { said ->
            asking = null
            reload++
            scope.launch { status = said.load() }
        }
    }

    Scaffold(
        containerColor = Color.Transparent,
        topBar = { Header(stringResource(section.title), onBack = host.back) },
        bottomBar = host.bar,
    ) { padding ->
        val account = overview
        if (account == null) {
            Box(Modifier.padding(padding).fillMaxSize(), contentAlignment = Alignment.Center) {
                if (status == null) SkeletonList(6, Modifier.align(Alignment.TopCenter)) else Note(status!!, colour = MaterialTheme.colorScheme.error)
            }
            return@Scaffold
        }
        LazyColumn(Modifier.padding(padding).fillMaxSize()) {
            // On top, where it is seen: what the last action did.
            status?.let { said -> item { Note(said) } }
            when (section) {
                ProfileSection.Details -> details(host, account, open) { said -> scope.launch { status = said?.load() } }

                ProfileSection.Security -> security(account, passkeys, keys, host, open) { method ->
                    change {
                        host.api.setSignInMethod(method)
                        null
                    }
                }

                ProfileSection.Sessions -> devices(sessions, open)
            }
            item { Spacer(Modifier.height(96.dp)) }
        }
    }
}

private fun LazyListScope.details(host: Host, account: Overview, open: (Asking) -> Unit, onStatus: (Words?) -> Unit) {
    item {
        Identity(account)
        Section(stringResource(Res.string.profile))
        Entry(Icons.Outlined.Badge, stringResource(Res.string.name), account.user.name) { open(Asking.Name) }
        Address(account, open)
        Section(stringResource(Res.string.your_data))
        Entry(Icons.Outlined.Download, stringResource(Res.string.export_files), stringResource(Res.string.export_files_hint)) {
            saveToDevice("${host.server}/api/v1/account/export", host.api.session.token, "penombre-files.zip", onStatus)
        }
        Entry(Icons.Outlined.Download, stringResource(Res.string.export_data), stringResource(Res.string.export_data_hint)) {
            saveToDevice("${host.server}/api/v1/account/data", host.api.session.token, "penombre-account.json", onStatus)
        }
        Section(stringResource(Res.string.danger_zone))
        Entry(
            Icons.Outlined.DeleteForever,
            stringResource(Res.string.delete_account),
            stringResource(Res.string.delete_account_hint),
            tint = MaterialTheme.colorScheme.error,
        ) { open(Asking.DeleteAccount) }
    }
}

private fun LazyListScope.security(
    account: Overview,
    passkeys: List<Passkey>,
    keys: List<ApiKey>,
    host: Host,
    open: (Asking) -> Unit,
    onMethod: (String?) -> Unit,
) {
    item { SigningIn(account, open, onMethod) }
    item { Section(stringResource(Res.string.passkeys)) }
    items(passkeys, key = { it.id }) { passkey ->
        Entry(
            Icons.Outlined.Fingerprint,
            passkey.name ?: stringResource(Res.string.method_passkey),
            listOfNotNull(
                passkey.deviceType?.let { stringResource(if (it == "multiDevice") Res.string.passkey_synced else Res.string.passkey_device_only) },
                passkey.createdAt?.let(::shortDate),
            ).joinToString(" · "),
            trailing = {
                TextButton(onClick = { open(Asking.RenamePasskey(passkey)) }) { Text(stringResource(Res.string.rename), color = brand.accent) }
                TextButton(onClick = { open(Asking.DeletePasskey(passkey)) }) { Text(stringResource(Res.string.remove), color = MaterialTheme.colorScheme.error) }
            },
        )
    }
    item {
        if (passkeys.isEmpty()) Note(stringResource(Res.string.passkeys_none))
        if (account.passkeySignInEnabled) {
            // A passkey belongs to the server's web address, which this
            // app cannot claim for a server it does not know in advance.
            Entry(Icons.Outlined.Fingerprint, stringResource(Res.string.passkey_add), stringResource(Res.string.passkey_add_hint), tint = brand.muted) {
                openAuthBrowser("${host.server}/account/security")
            }
        }
        Section(stringResource(Res.string.api_keys))
    }
    items(keys, key = { it.id }) { key ->
        Entry(
            Icons.Outlined.Key,
            key.name ?: stringResource(Res.string.api_key),
            listOfNotNull(
                key.start?.let { "$it…" },
                key.createdAt?.let(::shortDate),
                key.expiresAt?.let { stringResource(Res.string.expires, shortDate(it)) },
            ).joinToString(" · "),
            trailing = {
                TextButton(onClick = { open(Asking.DeleteKey(key)) }) { Text(stringResource(Res.string.delete), color = MaterialTheme.colorScheme.error) }
            },
        )
    }
    item {
        Entry(Icons.Outlined.VpnKey, stringResource(Res.string.api_key_create), stringResource(Res.string.api_key_create_hint)) { open(Asking.NewKey) }
    }
}

private fun LazyListScope.devices(sessions: List<DeviceSession>, open: (Asking) -> Unit) {
    item { Note(stringResource(Res.string.sessions_note)) }
    items(sessions, key = { it.id }) { session ->
        val device = deviceOf(session.userAgent)
        Entry(
            if (session.userAgent.orEmpty().contains("Mobile", true) || session.userAgent.orEmpty().contains("Android", true)) Icons.Outlined.PhoneIphone else Icons.Outlined.Devices,
            if (session.current) stringResource(Res.string.session_this_one, device) else device,
            listOfNotNull(session.ipAddress?.ifBlank { null }, stringResource(Res.string.session_active, shortDate(session.updatedAt))).joinToString(" · "),
            tint = if (session.current) brand.accent else brand.muted,
            trailing = {
                if (!session.current) TextButton(onClick = { open(Asking.Revoke(session)) }) { Text(stringResource(Res.string.sign_out), color = brand.accent) }
            },
        )
    }
}

@Composable
private fun Identity(account: Overview) {
    Row(Modifier.padding(horizontal = 20.dp, vertical = 12.dp), verticalAlignment = Alignment.CenterVertically) {
        Box(Modifier.size(64.dp).clip(CircleShape).background(brand.gradient), contentAlignment = Alignment.Center) {
            Text(initials(account.user.name), color = Color.White, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.SemiBold)
        }
        Spacer(Modifier.width(16.dp))
        Column {
            Text(account.user.name, color = brand.ink, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.SemiBold)
            Text(account.user.email, color = brand.muted, style = MaterialTheme.typography.bodyMedium)
            if (account.user.role == "admin") Text(stringResource(Res.string.administrator), color = brand.accent, style = MaterialTheme.typography.labelMedium)
        }
    }
}

@Composable
private fun SigningIn(account: Overview, open: (Asking) -> Unit, onMethod: (String?) -> Unit) {
    Section(stringResource(Res.string.signing_in))
    if (account.hasPassword || account.emailSignInEnabled) {
        val min = account.passwordRules.minLength
        Entry(
            Icons.Outlined.Password,
            stringResource(if (account.hasPassword) Res.string.password_change else Res.string.password_set),
            pluralStringResource(if (account.passwordRules.requireStrong) Res.plurals.password_min_mixed else Res.plurals.password_min, min, min),
        ) { open(Asking.Password) }
    }
    val methods = account.signInMethods
    if (methods.size > 1) {
        Text(
            stringResource(Res.string.method_preferred),
            Modifier.padding(start = 20.dp, end = 20.dp, top = 12.dp),
            color = brand.muted,
            style = MaterialTheme.typography.bodySmall,
        )
        Choices(
            listOf("" to stringResource(Res.string.no_preference)) + methods.map { it to (METHOD_NAMES[it]?.let { name -> stringResource(name) } ?: it) },
            account.preferredSignInMethod.orEmpty(),
        ) {
            onMethod(it.ifEmpty { null })
        }
    }
    val on = account.user.twoFactorEnabled
    Entry(
        Icons.Outlined.Security,
        stringResource(Res.string.two_factor),
        stringResource(
            when {
                on -> Res.string.two_factor_on
                account.twoFactorRequired -> Res.string.two_factor_required
                else -> Res.string.two_factor_off
            },
        ),
        tint = if (on) brand.accent else brand.muted,
        trailing = {
            TextButton(onClick = { open(if (on) Asking.DisableTwoFactor else Asking.EnableTwoFactor) }) {
                Text(stringResource(if (on) Res.string.turn_off else Res.string.set_up), color = brand.accent)
            }
        },
    )
    if (on) {
        Entry(Icons.Outlined.Key, stringResource(Res.string.backup_codes_new), stringResource(Res.string.backup_codes_new_hint), tint = brand.muted) {
            open(Asking.BackupCodes)
        }
    }
    if (!account.hasPassword && !on) Note(stringResource(Res.string.two_factor_needs_password))
}

/**
 * The address, verified or not as the web's badge says, and the two ways to
 * act on it; both send codes, so neither works without the server's mail.
 */
@Composable
private fun Address(account: Overview, open: (Asking) -> Unit) {
    val verified = account.user.emailVerified
    Entry(
        Icons.Outlined.AlternateEmail,
        stringResource(Res.string.email_address),
        account.user.email,
        badge = {
            Text(
                stringResource(if (verified) Res.string.email_verified else Res.string.email_unverified),
                Modifier.clip(RoundedCornerShape(50))
                    .background(if (verified) brand.accent.copy(alpha = 0.16f) else Color.Transparent)
                    .border(1.dp, if (verified) Color.Transparent else brand.muted.copy(alpha = 0.5f), RoundedCornerShape(50))
                    .padding(horizontal = 8.dp, vertical = 1.dp),
                color = if (verified) brand.accent else brand.muted,
                style = MaterialTheme.typography.labelSmall,
                fontWeight = FontWeight.SemiBold,
            )
        },
    )
    Row(Modifier.padding(start = 70.dp, end = 12.dp)) {
        if (!verified) {
            TextButton(enabled = account.smtpAvailable, onClick = { open(Asking.Address(verify = true)) }) {
                Text(stringResource(Res.string.email_verify), color = if (account.smtpAvailable) brand.accent else brand.muted)
            }
        }
        TextButton(enabled = account.smtpAvailable, onClick = { open(Asking.Address(verify = false)) }) {
            Text(stringResource(Res.string.email_change), color = if (account.smtpAvailable) brand.accent else brand.muted)
        }
    }
    if (!account.smtpAvailable) {
        Text(
            stringResource(Res.string.email_no_smtp),
            Modifier.padding(start = 78.dp, end = 20.dp, bottom = 8.dp),
            color = brand.muted,
            style = MaterialTheme.typography.bodySmall,
        )
    }
}

private enum class AddressStep { Start, Current, New, Confirm }

/**
 * The web's address dialog: a code from the current address, then, for a
 * change, one from the new. A refused code says so in the app's words; the
 * current address's code is spent by asking for the new one, so a refusal
 * there starts that step over.
 */
@Composable
private fun AddressDialog(host: Host, email: String, verify: Boolean, onClose: () -> Unit, onDone: (Words) -> Unit) {
    val scope = rememberCoroutineScope()
    var step by remember { mutableStateOf(AddressStep.Start) }
    var currentCode by remember { mutableStateOf("") }
    var newEmail by remember { mutableStateOf("") }
    var newCode by remember { mutableStateOf("") }
    var busy by remember { mutableStateOf(false) }
    var note by remember { mutableStateOf<String?>(null) }

    fun run(failed: StringResource, onCodeRefused: () -> Unit = {}, block: suspend () -> Unit) {
        scope.launch {
            busy = true
            note = null
            host.attempt({ note = it }) {
                try {
                    block()
                } catch (e: Refused) {
                    if (!e.isCodeError) throw e
                    onCodeRefused()
                    throw Failure(Words(failed))
                }
            }
            busy = false
        }
    }
    val sendCurrent = { run(Res.string.email_send_error) { host.api.sendAddressCode(email).also { step = AddressStep.Current } } }

    @Composable
    fun CodeField(value: String, onValue: (String) -> Unit, sentTo: String) {
        OutlinedTextField(
            value = value,
            onValueChange = onValue,
            label = { Text(stringResource(Res.string.email_code_sent, sentTo)) },
            singleLine = true,
            shape = Corner,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
            modifier = Modifier.fillMaxWidth(),
        )
    }

    val trimmed = newEmail.trim()
    AlertDialog(
        onDismissRequest = onClose,
        containerColor = brand.panel,
        title = { Text(stringResource(if (verify) Res.string.email_verify_title else Res.string.email_change_title)) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                when (step) {
                    AddressStep.Start -> Text(stringResource(Res.string.email_step_current, email), color = brand.muted)

                    AddressStep.Current -> {
                        CodeField(currentCode, { currentCode = it }, email)
                        TextButton(enabled = !busy, onClick = sendCurrent) { Text(stringResource(Res.string.email_resend), color = brand.accent) }
                    }

                    AddressStep.New -> {
                        Text(stringResource(Res.string.email_step_new), color = brand.muted)
                        OutlinedTextField(
                            value = newEmail,
                            onValueChange = { newEmail = it },
                            label = { Text(stringResource(Res.string.email_new_label)) },
                            singleLine = true,
                            shape = Corner,
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                            modifier = Modifier.fillMaxWidth(),
                        )
                    }

                    AddressStep.Confirm -> CodeField(newCode, { newCode = it }, trimmed)
                }
                note?.let { Text(it, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodyMedium) }
            }
        },
        confirmButton = {
            val (label, ready, act) = when (step) {
                AddressStep.Start -> Triple(Res.string.email_send_code, true, sendCurrent)

                AddressStep.Current -> Triple(if (verify) Res.string.email_verify else Res.string.email_next, currentCode.isNotBlank()) {
                    if (verify) {
                        run(Res.string.email_code_error) {
                            host.api.verifyAddress(email, currentCode.trim())
                            onDone(Words(Res.string.email_done_verified))
                        }
                    } else {
                        note = null
                        step = AddressStep.New
                    }
                }

                AddressStep.New -> Triple(Res.string.email_send_code, "@" in trimmed) {
                    run(Res.string.email_code_error, onCodeRefused = {
                        currentCode = ""
                        step = AddressStep.Current
                    }) {
                        host.api.requestAddressChange(trimmed, currentCode.trim())
                        step = AddressStep.Confirm
                    }
                }

                AddressStep.Confirm -> Triple(Res.string.email_change, newCode.isNotBlank()) {
                    run(Res.string.email_code_error) {
                        host.api.changeAddress(trimmed, newCode.trim())
                        onDone(Words(Res.string.email_done_changed, trimmed))
                    }
                }
            }
            TextButton(enabled = ready && !busy, onClick = act) { Text(stringResource(label), color = brand.accent) }
        },
        dismissButton = { TextButton(onClick = onClose) { Text(stringResource(Res.string.cancel), color = brand.muted) } },
    )
}

/** The one open dialog; `change` runs its call and moves on to `next`. */
@Composable
private fun Dialogs(
    host: Host,
    account: Overview,
    asking: Asking?,
    refusal: String?,
    close: () -> Unit,
    change: (suspend () -> Asking?) -> Unit,
    done: (Words) -> Unit,
) {
    when (asking) {
        null -> Unit

        Asking.Name -> Ask(
            stringResource(Res.string.your_name),
            listOf(Field(stringResource(Res.string.name), account.user.name)),
            stringResource(Res.string.save),
            refusal,
            onDismiss = close,
        ) { (name) ->
            change { host.api.updateProfile(name.trim()).let { null } }
        }

        is Asking.Address -> AddressDialog(host, account.user.email, asking.verify, close, done)

        Asking.Password -> Ask(
            stringResource(if (account.hasPassword) Res.string.password_change else Res.string.password_set),
            listOfNotNull(
                Field(stringResource(Res.string.password_current), secret = true).takeIf { account.hasPassword },
                Field(stringResource(Res.string.password_new), secret = true),
                Field(stringResource(Res.string.password_again), secret = true),
            ),
            stringResource(Res.string.save),
            refusal ?: account.passwordRules.minLength.let {
                pluralStringResource(if (account.passwordRules.requireStrong) Res.plurals.password_rules_strong else Res.plurals.password_rules, it, it)
            },
            onDismiss = close,
        ) { values ->
            val (current, new, again) = if (account.hasPassword) values else listOf(null) + values
            change {
                host.api.savePassword(current, new!!, again!!)
                null
            }
        }

        Asking.EnableTwoFactor -> Ask(
            stringResource(Res.string.two_factor_setup),
            listOf(Field(stringResource(Res.string.your_password), secret = true)),
            stringResource(Res.string.continue_),
            refusal ?: stringResource(Res.string.two_factor_setup_note),
            onDismiss = close,
        ) { (password) -> change { Asking.Verify(host.api.enableTwoFactor(password)) } }

        is Asking.Verify -> VerifyTwoFactor(asking.enrolment, refusal, close) { code ->
            change {
                host.api.verifyTwoFactor(code)?.let(host.renew)
                Asking.Codes(asking.enrolment.backupCodes, Res.string.backup_codes_keep)
            }
        }

        is Asking.Codes -> Reveal(
            stringResource(asking.title),
            asking.codes.joinToString("\n"),
            stringResource(Res.string.backup_codes_note),
            onDone = close,
        )

        Asking.DisableTwoFactor -> Ask(
            stringResource(Res.string.two_factor_disable),
            listOf(Field(stringResource(Res.string.your_password), secret = true)),
            stringResource(Res.string.turn_off),
            refusal,
            danger = true,
            onDismiss = close,
        ) { (password) ->
            change {
                host.api.disableTwoFactor(password)?.let(host.renew)
                null
            }
        }

        Asking.BackupCodes -> Ask(
            stringResource(Res.string.backup_codes_new),
            listOf(Field(stringResource(Res.string.your_password), secret = true)),
            stringResource(Res.string.create),
            refusal,
            onDismiss = close,
        ) { (password) ->
            change { Asking.Codes(host.api.newBackupCodes(password), Res.string.backup_codes_yours) }
        }

        is Asking.RenamePasskey -> Ask(
            stringResource(Res.string.passkey_rename),
            listOf(Field(stringResource(Res.string.name), asking.passkey.name.orEmpty())),
            stringResource(Res.string.rename),
            refusal,
            onDismiss = close,
        ) { (name) ->
            change {
                host.api.renamePasskey(asking.passkey.id, name.trim())
                null
            }
        }

        is Asking.DeletePasskey -> Ask(
            asking.passkey.name?.let { stringResource(Res.string.remove_title, it) } ?: stringResource(Res.string.passkey_remove_this),
            emptyList(),
            stringResource(Res.string.remove),
            refusal ?: stringResource(Res.string.passkey_remove_note),
            danger = true,
            onDismiss = close,
        ) {
            change {
                host.api.deletePasskey(asking.passkey.id)
                null
            }
        }

        Asking.NewKey -> Ask(
            stringResource(Res.string.api_key_new),
            listOf(Field(stringResource(Res.string.name))),
            stringResource(Res.string.create),
            refusal,
            onDismiss = close,
        ) { (name) ->
            change { Asking.ShowKey(host.api.createApiKey(name.trim())) }
        }

        is Asking.ShowKey -> Reveal(
            asking.key.name ?: stringResource(Res.string.api_key_yours),
            asking.key.key,
            stringResource(Res.string.api_key_note),
            onDone = close,
        )

        is Asking.DeleteKey -> Ask(
            asking.key.name?.let { stringResource(Res.string.delete_title, it) } ?: stringResource(Res.string.api_key_delete_this),
            emptyList(),
            stringResource(Res.string.delete),
            refusal ?: stringResource(Res.string.api_key_delete_note),
            danger = true,
            onDismiss = close,
        ) {
            change {
                host.api.deleteApiKey(asking.key.id)
                null
            }
        }

        is Asking.Revoke -> Ask(
            stringResource(Res.string.session_sign_out_title, deviceOf(asking.session.userAgent)),
            emptyList(),
            stringResource(Res.string.sign_out),
            refusal ?: stringResource(Res.string.session_sign_out_note),
            onDismiss = close,
        ) {
            change {
                host.api.revokeSession(asking.session.id)
                null
            }
        }

        Asking.DeleteAccount -> Ask(
            stringResource(Res.string.delete_account_title),
            listOfNotNull(Field(stringResource(Res.string.your_password), secret = true).takeIf { account.hasPassword }),
            stringResource(Res.string.delete_for_good),
            refusal ?: stringResource(Res.string.delete_account_note),
            danger = true,
            onDismiss = close,
        ) { values ->
            change {
                host.api.deleteAccount(values.firstOrNull())
                host.signedOut()
                null
            }
        }
    }
}

@Composable
internal fun VerifyTwoFactor(enrolment: Enrolment, refusal: String?, close: () -> Unit, onCode: (String) -> Unit) {
    val secret = enrolment.totpURI.substringAfter("secret=", "").substringBefore('&')
    Ask(
        stringResource(Res.string.two_factor_add),
        listOf(Field(stringResource(Res.string.two_factor_code), number = true)),
        stringResource(Res.string.verify),
        refusal ?: stringResource(Res.string.two_factor_key_note, secret),
        onDismiss = close,
    ) { (code) -> onCode(code.trim()) }
    LaunchedEffect(enrolment) { openExternal(enrolment.totpURI) }
}

/** A session's device, in a word or two, from its user agent. */
@Composable
fun deviceOf(agent: String?): String {
    val ua = agent.orEmpty()
    val system = when {
        "iPhone" in ua || "iPad" in ua -> "iPhone"
        "Android" in ua -> "Android"
        "Mac OS" in ua || "Macintosh" in ua -> "Mac"
        "Windows" in ua -> "Windows"
        "Linux" in ua -> "Linux"
        "Ktor" in ua || "okhttp" in ua || "Darwin" in ua -> stringResource(Res.string.device_app)
        else -> null
    }
    val browser = when {
        "Firefox" in ua -> "Firefox"
        "Edg/" in ua -> "Edge"
        "Chrome" in ua -> "Chrome"
        "Safari" in ua -> "Safari"
        "rclone" in ua -> stringResource(Res.string.device_sync)
        "curl" in ua -> "curl"
        else -> null
    }
    // A script or a tool: its own name, `Bun/1.4.2` as "Bun 1.4.2".
    if (browser != null && system != null) return stringResource(Res.string.device_on, browser, system)
    return browser ?: system ?: ua.substringBefore(' ').replace('/', ' ').ifBlank { stringResource(Res.string.device_unknown) }
}
