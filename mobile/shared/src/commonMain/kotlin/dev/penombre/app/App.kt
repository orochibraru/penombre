package dev.penombre.app

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.navigationBars
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBars
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Logout
import androidx.compose.material.icons.filled.Language
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.outlined.Delete
import androidx.compose.material.icons.outlined.Folder
import androidx.compose.material.icons.outlined.FolderShared
import androidx.compose.material.icons.outlined.Group
import androidx.compose.material.icons.outlined.History
import androidx.compose.material.icons.outlined.StarBorder
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.key
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.layout
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.filterNotNull
import kotlinx.coroutines.launch
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.boolean
import kotlinx.serialization.json.contentOrNull
import org.jetbrains.compose.resources.StringResource
import org.jetbrains.compose.resources.stringResource

@Composable
fun App() {
    // Remembered, so the first frame is already in the account's look.
    var look by remember { mutableStateOf(Look.saved()) }
    val setLook: (Look) -> Unit = {
        look = it
        it.save()
    }
    // The same for its language, spoken before anything reads a string.
    var language by remember { mutableStateOf(savedLanguage().also(::speak)) }
    val setLanguage: (String?) -> Unit = {
        if (it != language) {
            speak(it)
            Prefs.set("language", it)
            language = it
        }
    }
    CompositionLocalProvider(LocalLanguage provides language) {
        PenombreTheme(look) { Root(look, setLook, setLanguage) }
    }
}

@Composable
private fun Root(look: Look, setLook: (Look) -> Unit, setLanguage: (String?) -> Unit) {
    var session by remember { mutableStateOf(SessionStore.load()) }
    var error by remember { mutableStateOf<String?>(null) }
    // A sign-in on its way: the moon breathes until it lands.
    var busy by remember { mutableStateOf(false) }
    // A scanned code waits for a yes: a link alone must not sign the app in.
    var pairing by remember { mutableStateOf<Pairing?>(null) }
    val scope = rememberCoroutineScope()
    val signedIn: (Session) -> Unit = {
        SessionStore.save(it)
        Prefs.set("server", it.server)
        session = it
        error = null
    }
    // One collector for the app's life. Keyed on the callback itself, the
    // effect restarted when it cleared the value and cancelled its own
    // token request.
    LaunchedEffect(Unit) {
        Auth.callbacks.filterNotNull().collect { url ->
            Auth.callbacks.value = null
            val scanned = Auth.pairing(url)
            if (scanned != null) {
                // Already signed in: the code is for a phone that is not.
                if (session == null) pairing = scanned
                return@collect
            }
            busy = true
            try {
                signedIn(Auth.complete(url))
            } catch (e: CancellationException) {
                throw e
            } catch (e: Failure) {
                error = e.words.load()
            } catch (e: Exception) {
                error = e.message ?: Words(Res.string.signin_failed).load()
            } finally {
                busy = false
            }
        }
    }

    val current = session
    if (current == null) {
        SignIn(
            error,
            busy,
            onSignedIn = signedIn,
            onCode = { text ->
                pairing = Auth.pairing(text)
                scope.launch { error = if (pairing == null) Words(Res.string.signin_not_a_code).load() else null }
            },
        ) {
            error = null
            Prefs.set("server", it.trim())
            Auth.start(it)
        }
        pairing?.let { asked ->
            AlertDialog(
                onDismissRequest = { pairing = null },
                containerColor = brand.panel,
                title = { Text(stringResource(Res.string.pair_title, asked.host)) },
                text = { Text(stringResource(Res.string.pair_text)) },
                confirmButton = {
                    TextButton(onClick = {
                        pairing = null
                        scope.launch {
                            busy = true
                            try {
                                signedIn(Auth.pair(asked))
                            } catch (e: CancellationException) {
                                throw e
                            } catch (e: Exception) {
                                // A code is refused once used or two minutes old.
                                error = Words(Res.string.pair_expired).load()
                            } finally {
                                busy = false
                            }
                        }
                    }) { Text(stringResource(Res.string.pair_connect), color = brand.accent) }
                },
                dismissButton = { TextButton(onClick = { pairing = null }) { Text(stringResource(Res.string.cancel), color = brand.muted) } },
            )
        }
    } else {
        Signed(current, look, setLook, setLanguage, onRenew = signedIn) {
            SessionStore.save(null)
            session = null
        }
    }
}

/**
 * Scanning the web app's code is the way in: it names the server and signs in
 * at once. Typing the address is kept behind a link, for a device with no
 * camera or a server reached some other way.
 */
@Composable
private fun SignIn(error: String?, busy: Boolean, onSignedIn: (Session) -> Unit, onCode: (String) -> Unit, onSubmit: (String) -> Unit) {
    val scans = remember { canScanCodes() }
    val scan = rememberCodeScanner(onCode)
    // Saveable: a recreated activity must not wipe a half-typed address.
    var server by rememberSaveable { mutableStateOf(Prefs.get("server") ?: "") }
    var typing by rememberSaveable { mutableStateOf(!scans) }
    var byCode by rememberSaveable { mutableStateOf(false) }
    var mailing by remember { mutableStateOf(false) }
    val submit = { if (server.isNotBlank()) onSubmit(server) }
    Column(
        // Above the keyboard: centred on the whole screen, the button sat under it.
        Modifier.fillMaxSize().windowInsetsPadding(WindowInsets.statusBars).imePadding().padding(horizontal = 28.dp),
        verticalArrangement = Arrangement.Center,
    ) {
        if (busy || mailing) BreathingMoon(72.dp) else Moon(72.dp)
        Spacer(Modifier.height(20.dp))
        Text(
            "Penombre",
            style = TextStyle(brush = brand.gradient, fontSize = 40.sp, fontWeight = FontWeight.SemiBold, letterSpacing = (-1).sp),
        )
        Text(
            stringResource(Res.string.signin_tagline),
            style = MaterialTheme.typography.bodyLarge,
            color = brand.muted,
        )
        Spacer(Modifier.height(36.dp))
        if (scans) {
            GradientButton(stringResource(Res.string.signin_scan), enabled = !busy, onClick = scan)
            Spacer(Modifier.height(12.dp))
            Text(
                stringResource(Res.string.signin_scan_hint),
                style = MaterialTheme.typography.bodyMedium,
                color = brand.muted,
            )
        }
        error?.let {
            Spacer(Modifier.height(10.dp))
            Text(it, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodyMedium)
        }
        if (typing) {
            Spacer(Modifier.height(if (scans) 28.dp else 0.dp))
            OutlinedTextField(
                value = server,
                onValueChange = { server = it },
                label = { Text(stringResource(Res.string.signin_server)) },
                placeholder = { Text("https://files.example.com") },
                singleLine = true,
                // The keyboard's own key signs in too.
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Uri, imeAction = ImeAction.Go),
                keyboardActions = KeyboardActions(onGo = { submit() }),
                shape = Corner,
                colors = OutlinedTextFieldDefaults.colors(
                    focusedContainerColor = brand.panel.copy(alpha = 0.6f),
                    unfocusedContainerColor = brand.panel.copy(alpha = 0.6f),
                ),
                modifier = Modifier.fillMaxWidth(),
            )
            Spacer(Modifier.height(16.dp))
            if (byCode) {
                EmailCode(server.trim(), mailing, { mailing = it }, onSignedIn)
                TextButton(onClick = { byCode = false }, modifier = Modifier.fillMaxWidth()) {
                    Text(stringResource(Res.string.signin_browser_instead), color = brand.muted)
                }
            } else {
                if (scans) {
                    TextButton(enabled = server.isNotBlank() && !busy, onClick = submit, modifier = Modifier.fillMaxWidth()) {
                        Text(stringResource(Res.string.signin), color = brand.accent)
                    }
                } else {
                    GradientButton(stringResource(Res.string.signin), enabled = server.isNotBlank() && !busy, onClick = submit)
                }
                TextButton(enabled = server.isNotBlank() && !busy, onClick = { byCode = true }, modifier = Modifier.fillMaxWidth()) {
                    Text(stringResource(Res.string.signin_email_code), color = brand.muted)
                }
            }
        } else {
            Spacer(Modifier.height(20.dp))
            TextButton(onClick = { typing = true }, modifier = Modifier.fillMaxWidth()) {
                Text(stringResource(Res.string.signin_type_address), color = brand.muted)
            }
        }
    }
}

/**
 * Signing in with a code mailed to the address, with no browser: for a
 * server that allows it (a 403 says it does not). A two-factor account is
 * then asked for its authenticator's code, or a backup code.
 */
@Composable
private fun EmailCode(server: String, working: Boolean, onWorking: (Boolean) -> Unit, onSignedIn: (Session) -> Unit) {
    val scope = rememberCoroutineScope()
    var email by rememberSaveable { mutableStateOf("") }
    var code by rememberSaveable { mutableStateOf("") }
    var sent by rememberSaveable { mutableStateOf(false) }
    var note by remember { mutableStateOf<String?>(null) }
    var challenge by remember { mutableStateOf<CodeSignIn.TwoFactor?>(null) }
    var backup by remember { mutableStateOf(false) }
    var refusal by remember { mutableStateOf<String?>(null) }

    /** Runs one call; `refused` words what the server refused, or leaves its own words. */
    fun run(onNote: (String) -> Unit, refused: (Refused) -> StringResource?, block: suspend () -> Unit) {
        scope.launch {
            onWorking(true)
            try {
                block()
            } catch (e: CancellationException) {
                throw e
            } catch (e: Refused) {
                onNote(refused(e)?.let { Words(it).load() } ?: e.message.orEmpty())
            } catch (e: Failure) {
                onNote(e.words.load())
            } catch (e: Exception) {
                onNote(e.message ?: Words(Res.string.signin_failed).load())
            } finally {
                onWorking(false)
            }
        }
    }
    val refused = { e: Refused ->
        when {
            e.status == 403 -> Res.string.signin_code_off
            e.isCodeError -> Res.string.email_code_error
            else -> null
        }
    }
    val done: suspend (Session) -> Unit = { session ->
        // Named like the app's other sessions; a server without the route keeps the client's name.
        try {
            Api(session).labelSession(deviceName)
        } catch (e: CancellationException) {
            throw e
        } catch (_: Exception) {
        }
        onSignedIn(session)
    }
    val send = {
        note = null
        run({ note = it }, refused) {
            Auth.sendCode(server, email.trim())
            code = ""
            sent = true
        }
    }
    val signIn = {
        note = null
        run({ note = it }, refused) {
            when (val answer = Auth.signInWithCode(server, email.trim(), code.trim())) {
                is CodeSignIn.Done -> done(answer.session)

                is CodeSignIn.TwoFactor -> {
                    refusal = null
                    backup = false
                    challenge = answer
                }
            }
        }
    }
    val field = OutlinedTextFieldDefaults.colors(
        focusedContainerColor = brand.panel.copy(alpha = 0.6f),
        unfocusedContainerColor = brand.panel.copy(alpha = 0.6f),
    )
    if (!sent) {
        OutlinedTextField(
            value = email,
            onValueChange = { email = it },
            label = { Text(stringResource(Res.string.signin_email)) },
            singleLine = true,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email, imeAction = ImeAction.Send),
            keyboardActions = KeyboardActions(onSend = { if ("@" in email && !working) send() }),
            shape = Corner,
            colors = field,
            modifier = Modifier.fillMaxWidth(),
        )
        Spacer(Modifier.height(12.dp))
        GradientButton(stringResource(Res.string.email_send_code), enabled = "@" in email && !working, onClick = send)
    } else {
        OutlinedTextField(
            value = code,
            onValueChange = { code = it },
            label = { Text(stringResource(Res.string.signin_code)) },
            supportingText = { Text(stringResource(Res.string.signin_code_hint, email.trim())) },
            singleLine = true,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number, imeAction = ImeAction.Go),
            keyboardActions = KeyboardActions(onGo = { if (code.isNotBlank() && !working) signIn() }),
            shape = Corner,
            colors = field,
            modifier = Modifier.fillMaxWidth(),
        )
        Spacer(Modifier.height(12.dp))
        GradientButton(stringResource(Res.string.signin), enabled = code.isNotBlank() && !working, onClick = signIn)
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            TextButton(enabled = !working, onClick = send) { Text(stringResource(Res.string.email_resend), color = brand.accent) }
            TextButton(onClick = {
                sent = false
                note = null
            }) { Text(stringResource(Res.string.signin_other_address), color = brand.muted) }
        }
    }
    note?.let { Text(it, Modifier.padding(top = 8.dp), color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodyMedium) }
    challenge?.let { asked ->
        // A dialog per kind of code: the field starts empty.
        key(backup) {
            Ask(
                stringResource(Res.string.tf_title),
                listOf(Field(stringResource(if (backup) Res.string.tf_backup_code else Res.string.tf_code), number = !backup)),
                stringResource(Res.string.tf_verify),
                refusal ?: stringResource(if (backup) Res.string.tf_backup_description else Res.string.tf_description),
                onDismiss = { challenge = null },
                footer = {
                    TextButton(onClick = {
                        refusal = null
                        backup = !backup
                    }) { Text(stringResource(if (backup) Res.string.tf_use_app else Res.string.tf_use_backup), color = brand.accent) }
                },
            ) { (answer) ->
                run({ refusal = it }, { Res.string.tf_invalid }) {
                    done(Auth.answerTwoFactor(asked, answer.trim(), backup))
                    challenge = null
                }
            }
        }
    }
}

private enum class Tab(val label: StringResource, val icon: ImageVector) {
    Home(Res.string.tab_home, Icons.Outlined.Folder),
    Search(Res.string.tab_search, Icons.Default.Search),
    Starred(Res.string.starred, Icons.Outlined.StarBorder),
    Shared(Res.string.tab_shared, Icons.Outlined.FolderShared),
}

/** A preference changed by name, as the API takes it. */
private fun Preferences.with(name: String, value: JsonPrimitive): Preferences = when (name) {
    "accent" -> copy(accent = value.content)
    "layout" -> copy(layout = value.content)
    "sortColumn" -> copy(sortColumn = value.content)
    "sortDirection" -> copy(sortDirection = value.content)
    "fontFamily" -> copy(fontFamily = value.content)
    "corners" -> copy(corners = value.content)
    "emailNotifications" -> copy(emailNotifications = value.boolean)
    "listingLoadMode" -> copy(listingLoadMode = value.content)
    "versionNaming" -> copy(versionNaming = value.content)
    "language" -> copy(language = value.contentOrNull)
    else -> this
}

private fun Look.following(prefs: Preferences) = copy(accent = prefs.accent, font = prefs.fontFamily, corners = prefs.corners)

@Composable
private fun Signed(
    session: Session,
    look: Look,
    onLook: (Look) -> Unit,
    onLanguage: (String?) -> Unit,
    onRenew: (Session) -> Unit,
    onSignedOut: () -> Unit,
) {
    val api = remember(session) { Api(session) }
    val scope = rememberCoroutineScope()
    val playback = remember(session) { Playback(session) }
    // What is pushed over the tabs; the last one shows.
    val screens = remember { mutableStateListOf<Screen>() }
    var tab by rememberSaveable { mutableStateOf(Tab.Home) }
    var home by remember { mutableStateOf<Home>(Home.Mine) }
    // Bumped on every tab tap: the tab starts over, so Home is the drive's root.
    var tapped by remember { mutableIntStateOf(0) }
    // Bumped by a second tap on Search: the field takes the keyboard.
    var findFocus by remember { mutableIntStateOf(0) }
    var prefs by remember { mutableStateOf<Preferences?>(null) }
    var unread by remember { mutableIntStateOf(0) }
    var alerts by remember { mutableStateOf(Prefs.get("alerts") == "on") }
    // What the administrator requires and the account lacks, once known.
    var gate by remember { mutableStateOf<Overview?>(null) }
    var gateKnown by remember { mutableStateOf(false) }
    var recheck by remember { mutableIntStateOf(0) }
    var asked by remember { mutableStateOf(false) }

    val screening = remember(session) { Screening(session) }
    var preview by remember { mutableStateOf<Preview?>(null) }

    val leave: () -> Unit = {
        playback.stop()
        screening.close()
        NoticeWatch.enable(false)
        onSignedOut()
    }
    lateinit var host: Host
    host = Host(
        api = api,
        push = { screens.add(it) },
        back = { if (screens.isNotEmpty()) screens.removeAt(screens.lastIndex) },
        play = playback::start,
        preview = { place, siblings, item -> preview = Preview(place, siblings, item) },
        screening = screening,
        signedOut = leave,
        bar = {
            Column {
                MiniPlayer(playback, host)
                // From inside a pushed screen too: a tab is always one tap away.
                BottomBar(tab) {
                    val again = it == tab
                    // Search again, on Search itself: the keyboard, as on Android.
                    if (again && it == Tab.Search && screens.isEmpty()) {
                        findFocus++
                        return@BottomBar
                    }
                    screens.clear()
                    // Home again from Home: back to the account's own drive.
                    if (again && it == Tab.Home) home = Home.Mine
                    // Back on Search from a screen over it keeps what was typed.
                    if (!(again && it == Tab.Search)) {
                        findFocus = 0
                        tapped++
                    }
                    tab = it
                }
            }
        },
        top = {
            AccountButtons(
                this,
                session.userName,
                unread,
                onBell = { screens.add(NotificationsScreen) },
                onAccount = { screens.add(AccountScreen) },
            )
        },
        goHome = {
            screens.clear()
            home = it
            tab = Tab.Home
            tapped++
        },
        sort = prefs?.sort,
        renew = onRenew,
    )

    /** Shows the change at once; the server's refusal puts it back. */
    val setPreference: (String, JsonPrimitive) -> Unit = { name, value ->
        val before = prefs
        val after = (before ?: Preferences()).with(name, value)
        prefs = after
        onLook(look.following(after))
        if (name == "language") onLanguage(after.language)
        scope.launch {
            host.attempt({
                prefs = before
                before?.let {
                    onLook(look.following(it))
                    if (name == "language") onLanguage(it.language)
                }
            }) { prefs = api.setPreference(name, value) }
        }
    }

    val settings = SettingsState(
        look = look,
        onMode = { onLook(look.copy(mode = it)) },
        language = LocalLanguage.current,
        prefs = prefs,
        onPreference = setPreference,
        onChannel = { type, channel, on ->
            val before = prefs
            val chosen = (before ?: Preferences()).choosing(type, channel, on)
            // Older clients read the single switch: it stays truthful.
            val mailed = chosen.values.any { it["email"] == true }
            prefs = (before ?: Preferences()).copy(notifications = chosen, emailNotifications = mailed)
            scope.launch {
                host.attempt({ prefs = before }) {
                    prefs = api.setPreferences(
                        mapOf(
                            "notifications" to JsonObject(chosen.mapValues { (_, channels) -> JsonObject(channels.mapValues { JsonPrimitive(it.value) }) }),
                            "emailNotifications" to JsonPrimitive(mailed),
                        ),
                    )
                }
            }
        },
        phoneAlerts = alerts,
        onPhoneAlerts = {
            alerts = it
            Prefs.set("alerts", if (it) "on" else null)
            NoticeWatch.enable(it)
        },
    )

    // The one video in play is whichever the drawer or the full screen shows;
    // going from the first to the second is the same video, so it plays on.
    val top = screens.lastOrNull() as? VideoScreen
    val watching = preview?.takeIf { it.isVideo }?.let { it.place to it.item } ?: top?.let { it.place to it.item }
    LaunchedEffect(watching?.second?.metadata?.id) {
        if (watching == null) {
            screening.close()
        } else {
            // One sound at a time: a video takes over from a track.
            playback.stop()
            screening.open(watching.first, watching.second)
        }
    }
    LaunchedEffect(screening) { screening.follow() }
    DisposableEffect(screening) { onDispose { screening.close() } }
    LaunchedEffect(playback) { playback.follow() }
    DisposableEffect(playback) { onDispose { playback.stop() } }
    // The account's look, which the web interface may have changed since.
    LaunchedEffect(api) {
        host.attempt {
            val loaded = api.preferences()
            prefs = loaded
            onLook(look.following(loaded))
            // The account's language, which the web may have changed since.
            onLanguage(loaded.language?.takeIf { it in LANGUAGES })
        }
    }
    // The bell's count, while the app is open; the phone's own notifications
    // come from `NoticeWatch` when it is not. While the account is held at the
    // gate, the same beat asks again: a passkey added in the browser shows up.
    LaunchedEffect(api) {
        while (true) {
            host.attempt { unread = api.notices(1).unread }
            delay(60_000)
            if (gate != null) recheck++
        }
    }
    // The web interface's enrolment gate, for the app: what the administrator
    // requires comes before anything else. Unknown (offline) lets the app open.
    LaunchedEffect(api, recheck) {
        host.attempt({ gateKnown = true }) {
            gate = api.overview().takeIf { it.requirements.isNotEmpty() }
            gateKnown = true
        }
    }
    if (!gateKnown) {
        Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) { BreathingMoon(72.dp) }
        return
    }
    gate?.let { account ->
        RequirementsView(
            host,
            account,
            checked = asked,
            onCheck = {
                asked = true
                recheck++
            },
        ) {
            scope.launch {
                api.signOut()
                leave()
            }
        }
        return
    }

    PlatformBack(enabled = screens.isNotEmpty() || tab != Tab.Home || home != Home.Mine) {
        when {
            screens.isNotEmpty() -> host.back()
            tab != Tab.Home -> tab = Tab.Home
            else -> home = Home.Mine
        }
    }

    // Every screen under the top one stays alive, unseen: coming back from a
    // viewer must find the folder, the list and the scroll as they were left.
    Layer(screens.isEmpty()) {
        key(tapped) {
            when (tab) {
                Tab.Home -> HomeView(host, home) { home = it }
                Tab.Search -> SearchView(host, findFocus)
                Tab.Starred -> FlatList(host, Home.Starred, null, stringResource(Res.string.empty_starred)) { api.starred(it) }
                Tab.Shared -> SharedTab(host)
            }
        }
    }
    screens.forEachIndexed { index, screen ->
        key(index, screen) {
            Layer(index == screens.lastIndex) {
                when (screen) {
                    is WebScreen -> Scaffold(
                        // A solid bar: the page under it brings its own background.
                        containerColor = brand.ground,
                        topBar = { Header("Penombre", onBack = host.back, compact = true) },
                    ) { WebPage(screen.url, session, Modifier.fillMaxSize().padding(it)) }

                    is TrashScreen -> TrashView(host, screen.place)

                    is PhotoScreen -> PhotoView(host, screen.place, screen.photos, screen.index)

                    is VideoScreen -> VideoView(host)

                    is VersionsScreen -> VersionsView(host, screen.place, screen.item)

                    is PdfScreen -> PdfView(host, screen.place, screen.item)

                    AccountScreen -> AccountView(host) {
                        scope.launch {
                            api.signOut()
                            leave()
                        }
                    }

                    ProfileHubScreen -> ProfileHubView(host)

                    is ProfileScreen -> ProfileView(host, screen.section)

                    SettingsHubScreen -> SettingsHubView(host)

                    is SettingsScreen -> SettingsView(host, screen.section, settings)

                    GrantsScreen -> GrantsView(host, { Header(stringResource(Res.string.shared_with_me), onBack = host.back) }) { host.push(GrantScreen(it)) }

                    is GrantScreen -> GrantView(host, screen.grant)

                    is DriveScreen -> DriveView(host, screen.drive)

                    is SearchResultsScreen -> SearchResultsView(host, screen.query)

                    LinksScreen -> LinksView(host)

                    NotificationsScreen -> NotificationsView(host) { unread = it }

                    ActivityScreen -> ActivityView(host)
                }
            }
        }
    }
    preview?.let { PreviewSheet(it, host) { preview = null } }
}

/** A screen in the stack; only the top one is placed, so drawn and touched. */
@Composable
private fun Layer(shown: Boolean, content: @Composable () -> Unit) {
    CompositionLocalProvider(LocalShown provides shown) {
        Box(
            Modifier.fillMaxSize().layout { measurable, constraints ->
                val placeable = measurable.measure(constraints)
                layout(placeable.width, placeable.height) { if (shown) placeable.place(0, 0) }
            },
        ) { content() }
    }
}

/** Floats over the sky, inset from the edges; the accent marks where you are. */
@Composable
private fun BottomBar(current: Tab, onSelect: (Tab) -> Unit) {
    val shape = RoundedCornerShape(28.dp)
    Row(
        Modifier.windowInsetsPadding(WindowInsets.navigationBars).padding(horizontal = 16.dp, vertical = 10.dp)
            .fillMaxWidth().shadow(18.dp, shape, ambientColor = brand.glow, spotColor = brand.glow)
            .clip(shape).background(brand.panel.copy(alpha = 0.94f))
            .border(1.dp, brand.muted.copy(alpha = 0.18f), shape)
            .padding(horizontal = 8.dp, vertical = 8.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
    ) {
        Tab.entries.forEach { entry ->
            val selected = entry == current
            val tint = if (selected) brand.accent else brand.muted
            Column(
                Modifier.weight(1f).clip(RoundedCornerShape(20.dp))
                    .selectable(selected, role = Role.Tab) { onSelect(entry) }
                    .padding(vertical = 6.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                Box(
                    Modifier.clip(RoundedCornerShape(14.dp))
                        .background(if (selected) brand.accent.copy(alpha = 0.16f) else Color.Transparent)
                        .padding(horizontal = 18.dp, vertical = 4.dp),
                ) { Icon(entry.icon, null, tint = tint) }
                Text(
                    stringResource(entry.label),
                    color = tint,
                    style = MaterialTheme.typography.labelMedium,
                    fontWeight = if (selected) FontWeight.SemiBold else FontWeight.Normal,
                )
            }
        }
    }
}
