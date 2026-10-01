package dev.penombre.app

/** How many shown ids are remembered: enough to never show one twice. */
private const val REMEMBERED = 200

/**
 * The unread notifications not shown on this phone yet, remembered as shown,
 * of the kinds the account wants on its phone. Empty when signed out: the job
 * outlives a sign-out until it is cancelled.
 */
suspend fun freshNotices(): List<Notice> {
    val session = SessionStore.load() ?: return emptyList()
    val api = Api(session)
    val unread = api.notices(20).notifications.filter { !it.read }
    val shown = Prefs.get("shown-notices")?.split(',')?.toSet().orEmpty()
    val fresh = unread.filter { it.id !in shown }
    if (fresh.isEmpty()) return fresh
    Prefs.set("shown-notices", (fresh.map { it.id } + shown).take(REMEMBERED).joinToString(","))
    val prefs = api.preferences()
    // A kind the app does not know yet resolves to on.
    return fresh.filter { prefs.channels(it.type).phone }
}
