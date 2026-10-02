package dev.penombre.app

import io.ktor.client.call.body
import io.ktor.client.request.HttpRequestBuilder
import io.ktor.client.request.bearerAuth
import io.ktor.client.request.delete
import io.ktor.client.request.get
import io.ktor.client.request.header
import io.ktor.client.request.parameter
import io.ktor.client.request.patch
import io.ktor.client.request.post
import io.ktor.client.request.put
import io.ktor.client.request.setBody
import io.ktor.client.statement.HttpResponse
import io.ktor.http.ContentType
import io.ktor.http.contentType
import io.ktor.http.encodeURLParameter
import io.ktor.http.encodeURLPathPart
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive

@Serializable
data class AccountUser(
    val id: String,
    val name: String,
    val email: String,
    val image: String? = null,
    val role: String = "user",
    val emailVerified: Boolean = false,
    val twoFactorEnabled: Boolean = false,
    val createdAt: String = "",
)

@Serializable
data class PasswordRules(val minLength: Int = 8, val requireStrong: Boolean = false)

/** `/account/overview`: the account and what its settings screens may offer. */
@Serializable
data class Overview(
    val user: AccountUser,
    val hasPassword: Boolean,
    val passwordRules: PasswordRules = PasswordRules(),
    val signInMethods: List<String> = emptyList(),
    val preferredSignInMethod: String? = null,
    val passkeySignInEnabled: Boolean = false,
    val emailSignInEnabled: Boolean = true,
    val twoFactorRequired: Boolean = false,
    /** What the administrator requires that the account has not set up: `twoFactor`, `passkey`. */
    val requirements: List<String> = emptyList(),
    val smtpAvailable: Boolean = false,
    val simpleMode: Boolean = false,
    val driveOnly: Boolean = false,
    val versioning: Boolean = false,
)

@Serializable
data class DevicePlace(val name: String, val label: String, val readOnly: Boolean = false)

@Serializable
data class Grant(
    val id: String,
    val resourceType: String,
    val resourceId: String,
    val name: String,
    val category: String = "",
    /** Where browsing it starts, in its owner's tree. */
    val root: String? = null,
    val ownerName: String = "",
    val permission: String = "read",
)

@Serializable
data class Counts(val trash: Int = 0, val starred: Int = 0)

/** `/places`: everywhere the account can browse, as the web sidebar lists it. */
@Serializable
data class Places(
    val drives: List<Drive> = emptyList(),
    val volumes: List<DevicePlace> = emptyList(),
    val sharedWithMe: List<Grant> = emptyList(),
    val counts: Counts = Counts(),
    val simpleMode: Boolean = false,
    val driveOnly: Boolean = false,
)

@Serializable
data class Notice(
    val id: String,
    /** `note`, `share`, `signature_completed` or `signature_declined`. */
    val type: String,
    val actorName: String? = null,
    val resourceName: String? = null,
    val link: String? = null,
    val read: Boolean = false,
    val createdAt: String,
) {
    /** A note on a document the web edits is a comment made in its editor. */
    val isComment get() = type == "comment" || (type == "note" && resourceName?.substringAfterLast('.', "")?.lowercase() in EDITABLE)

    /** The sentence the web renders from the same row, in the app's language. */
    val words: Words get() {
        val item = resourceName.orEmpty()
        val actor = actorName
        return when {
            type == "signature_completed" -> Words(Res.string.notice_signed, item)
            type == "signature_declined" -> actor?.let { Words(Res.string.notice_declined, it, item) } ?: Words(Res.string.notice_declined_generic, item)
            isComment -> actor?.let { Words(Res.string.notice_comment, it, item) } ?: Words(Res.string.notice_comment_generic, item)
            type == "note" -> actor?.let { Words(Res.string.notice_note, it, item) } ?: Words(Res.string.notice_note_generic, item)
            else -> actor?.let { Words(Res.string.notice_share, it, item) } ?: Words(Res.string.notice_share_generic, item)
        }
    }
}

@Serializable
data class Notices(val notifications: List<Notice> = emptyList(), val unread: Int = 0)

@Serializable
private class ReadCount(val unread: Int = 0)

@Serializable
data class ShareLink(
    val id: String,
    val token: String,
    val resourceType: String,
    val resourceId: String,
    val resourceName: String,
    val hasPassword: Boolean = false,
    val requiresAuth: Boolean = false,
    val expiresAt: String? = null,
    val downloadCount: Int = 0,
    val createdAt: String,
)

@Serializable
data class DeviceSession(
    val id: String,
    val current: Boolean = false,
    val userAgent: String? = null,
    val ipAddress: String? = null,
    val createdAt: String,
    val updatedAt: String,
    val expiresAt: String,
)

@Serializable
data class CategoryUsage(val category: String, val bytes: Long, val count: Int)

@Serializable
data class LargeFile(val id: String, val name: String, val size: Long, val updatedAt: String)

@Serializable
data class Disk(val total: Long = 0, val available: Long = 0)

@Serializable
data class Usage(
    val used: Long,
    val fileCount: Int,
    val trashedBytes: Long,
    val trashedCount: Int,
    val versionBytes: Long,
    val versionCount: Int,
    val byCategory: List<CategoryUsage> = emptyList(),
    val largestFiles: List<LargeFile> = emptyList(),
    val disk: Disk = Disk(),
)

@Serializable
data class ActivityEntry(
    val id: String,
    val action: String,
    val message: String,
    val level: String = "info",
    val createdAt: String,
)

@Serializable
data class ApiKey(
    val id: String,
    val name: String? = null,
    val start: String? = null,
    val createdAt: String? = null,
    val expiresAt: String? = null,
)

@Serializable
private class ApiKeys(val apiKeys: List<ApiKey> = emptyList())

/** A new key: the only time its secret is shown. */
@Serializable
data class CreatedKey(val id: String, val key: String, val name: String? = null)

@Serializable
data class Passkey(
    val id: String,
    val name: String? = null,
    val deviceType: String? = null,
    val createdAt: String? = null,
)

/** Two-factor enrolment: the authenticator's URI and the backup codes. */
@Serializable
data class Enrolment(val totpURI: String, val backupCodes: List<String> = emptyList())

@Serializable
private class BackupCodes(val backupCodes: List<String> = emptyList())

private fun HttpRequestBuilder.json(vararg fields: Pair<String, JsonElement>) {
    contentType(ContentType.Application.Json)
    setBody(JsonObject(fields.toMap()))
}

private fun String?.json(): JsonElement = this?.let(::JsonPrimitive) ?: JsonNull

// better-auth's own endpoints answer without the `data` envelope, and want
// the server as the origin of a change.
private fun Api.betterAuth(builder: HttpRequestBuilder) = builder.apply {
    bearerAuth(session.token)
    header("Origin", session.server)
}

suspend fun Api.overview(): Overview = call { client.get("$base/account/overview") { auth() }.body<Envelope<Overview>>().data }

suspend fun Api.updateProfile(name: String): Overview = call {
    client.patch("$base/account/profile") {
        auth()
        json("name" to JsonPrimitive(name))
    }.body<Envelope<Overview>>().data
}

suspend fun Api.savePassword(current: String?, new: String, confirm: String) {
    call {
        client.post("$base/account/password") {
            auth()
            json(
                *listOfNotNull(
                    current?.let { "currentPassword" to JsonPrimitive(it) },
                    "newPassword" to JsonPrimitive(new),
                    "confirm" to JsonPrimitive(confirm),
                ).toTypedArray(),
            )
        }
    }
}

suspend fun Api.setSignInMethod(method: String?) {
    call {
        client.put("$base/account/sign-in-method") {
            auth()
            json("method" to method.json())
        }
    }
}

suspend fun Api.places(): Places = call { client.get("$base/places") { auth() }.body<Envelope<Places>>().data }

suspend fun Api.createDrive(name: String) {
    call {
        client.post("$base/drives") {
            auth()
            json("name" to JsonPrimitive(name))
        }
    }
}

suspend fun Api.notices(limit: Int = 50): Notices = call {
    client.get("$base/notifications") {
        auth()
        parameter("limit", limit)
    }.body<Envelope<Notices>>().data
}

/** Marks these read, or every one when `ids` is null; answers what is left unread. */
suspend fun Api.markRead(ids: List<String>? = null): Int = call {
    client.post("$base/notifications/read") {
        auth()
        contentType(ContentType.Application.Json)
        setBody(
            JsonObject(
                ids?.let { mapOf("ids" to kotlinx.serialization.json.JsonArray(it.map(::JsonPrimitive))) } ?: emptyMap(),
            ),
        )
    }.body<Envelope<ReadCount>>().data.unread
}

suspend fun Api.links(): List<ShareLink> = call { client.get("$base/shares") { auth() }.body<Envelope<List<ShareLink>>>().data }

suspend fun Api.revokeLink(id: String) {
    call { client.delete("$base/shares/${id.encodeURLPathPart()}") { auth() } }
}

suspend fun Api.sessions(): List<DeviceSession> = call { client.get("$base/account/sessions") { auth() }.body<Envelope<List<DeviceSession>>>().data }

suspend fun Api.revokeSession(id: String) {
    call { client.delete("$base/account/sessions/${id.encodeURLPathPart()}") { auth() } }
}

suspend fun Api.usage(): Usage = call { client.get("$base/account/storage") { auth() }.body<Envelope<Usage>>().data }

suspend fun Api.activity(): List<ActivityEntry> = call { client.get("$base/activity") { auth() }.body<Envelope<List<ActivityEntry>>>().data }

suspend fun Api.apiKeys(): List<ApiKey> = call { client.get("$base/auth/api-key/list") { betterAuth(this) }.body<ApiKeys>().apiKeys }

suspend fun Api.createApiKey(name: String): CreatedKey = call {
    client.post("$base/auth/api-key/create") {
        betterAuth(this)
        json("name" to JsonPrimitive(name))
    }.body()
}

suspend fun Api.deleteApiKey(id: String) {
    call {
        client.post("$base/auth/api-key/delete") {
            betterAuth(this)
            json("keyId" to JsonPrimitive(id))
        }
    }
}

suspend fun Api.passkeys(): List<Passkey> = call { client.get("$base/auth/passkey/list-user-passkeys") { betterAuth(this) }.body() }

suspend fun Api.renamePasskey(id: String, name: String) {
    call {
        client.post("$base/auth/passkey/update-passkey") {
            betterAuth(this)
            json("id" to JsonPrimitive(id), "name" to JsonPrimitive(name))
        }
    }
}

suspend fun Api.deletePasskey(id: String) {
    call {
        client.post("$base/auth/passkey/delete-passkey") {
            betterAuth(this)
            json("id" to JsonPrimitive(id))
        }
    }
}

/** Starts enrolment; it only takes once a code from the authenticator is verified. */
suspend fun Api.enableTwoFactor(password: String): Enrolment = call {
    client.post("$base/auth/two-factor/enable") {
        betterAuth(this)
        json("password" to JsonPrimitive(password))
    }.body()
}

/**
 * The session that replaced this one. better-auth issues a new session when
 * two-factor is switched on or off and ends the old one at once: the next
 * call with the old token is a 401, which signed the app out. The signed
 * token comes in `set-auth-token`, the web views' cookie in `Set-Cookie`.
 */
internal fun Session.renewedBy(response: HttpResponse): Session? {
    val token = response.headers["set-auth-token"] ?: return null
    val cookie = cookiesOf(response)[cookieName]?.takeIf { it.isNotEmpty() }
    return copy(token = token, cookieValue = cookie ?: token.encodeURLParameter())
}

/** Completes enrolment; answers the session the server replaced this one with. */
suspend fun Api.verifyTwoFactor(code: String): Session? = call {
    session.renewedBy(
        client.post("$base/auth/two-factor/verify-totp") {
            betterAuth(this)
            json("code" to JsonPrimitive(code))
        },
    )
}

/** Answers the session the server replaced this one with. */
suspend fun Api.disableTwoFactor(password: String): Session? = call {
    session.renewedBy(
        client.post("$base/auth/two-factor/disable") {
            betterAuth(this)
            json("password" to JsonPrimitive(password))
        },
    )
}

suspend fun Api.newBackupCodes(password: String): List<String> = call {
    client.post("$base/auth/two-factor/generate-backup-codes") {
        betterAuth(this)
        json("password" to JsonPrimitive(password))
    }.body<BackupCodes>().backupCodes
}

/** For good. A password is asked when the account has one. */
suspend fun Api.deleteAccount(password: String?) {
    call {
        client.post("$base/auth/delete-user") {
            betterAuth(this)
            json(*listOfNotNull(password?.let { "password" to JsonPrimitive(it) }).toTypedArray())
        }
    }
}

/** Sign-in methods by their API names, in the web's words. */
val METHOD_NAMES = linkedMapOf(
    "password" to Res.string.method_password,
    "passkey" to Res.string.method_passkey,
    "magicLink" to Res.string.method_link,
    "emailOtp" to Res.string.method_code,
)

/** The kinds of notification, in the web's order (`#lib/notification-prefs.ts`). */
val NOTIFICATION_TYPES = listOf("note", "share", "signature_completed", "signature_declined")

/** Addressed by someone to someone, or the outcome of their own request. */
private val MAILED_BY_DEFAULT = setOf("share", "signature_completed", "signature_declined")

/** Where one kind of notification goes: the bell, the mailbox, the phone. */
data class Channels(val inApp: Boolean, val email: Boolean, val phone: Boolean)

/**
 * The web's `resolveChannels`: what was chosen wins; otherwise the bell and
 * the phone are on, and email follows the older `emailNotifications` switch,
 * except for what is always mailed.
 */
fun Preferences.channels(type: String): Channels {
    val chosen = notifications[type].orEmpty()
    val inApp = chosen["inApp"] ?: true
    return Channels(
        inApp = inApp,
        email = chosen["email"] ?: (type in MAILED_BY_DEFAULT || emailNotifications),
        // Without the row there is nothing for the phone to find.
        phone = inApp && (chosen["phone"] ?: true),
    )
}

/**
 * Every type's channels with one changed, as the web's settings page saves
 * them: the whole object, since a partial one resets the rest to defaults.
 */
fun Preferences.choosing(type: String, channel: String, on: Boolean): Map<String, Map<String, Boolean>> = NOTIFICATION_TYPES.associateWith { kind ->
    val now = channels(kind)
    val all = mapOf("inApp" to now.inApp, "email" to now.email, "phone" to now.phone)
    if (kind == type) all + (channel to on) else all
}

/** better-auth refused the code itself: wrong, too old, or tried too often. */
val Refused.isCodeError get() = code in setOf("INVALID_OTP", "OTP_EXPIRED", "TOO_MANY_ATTEMPTS")

private suspend fun Api.addressCall(path: String, vararg fields: Pair<String, String>) {
    call {
        client.post("$base/auth/email-otp/$path") {
            betterAuth(this)
            json(*fields.map { (name, value) -> name to JsonPrimitive(value) }.toTypedArray())
        }
    }
}

/** A code to the account's current address: the first step of verifying or changing it. */
suspend fun Api.sendAddressCode(email: String) = addressCall("send-verification-otp", "email" to email, "type" to "email-verification")

suspend fun Api.verifyAddress(email: String, otp: String) = addressCall("verify-email", "email" to email, "otp" to otp)

/** Spends the current address's code and mails one to the new address. */
suspend fun Api.requestAddressChange(newEmail: String, otp: String) = addressCall("request-email-change", "newEmail" to newEmail, "otp" to otp)

suspend fun Api.changeAddress(newEmail: String, otp: String) = addressCall("change-email", "newEmail" to newEmail, "otp" to otp)

/** Names this session as the app's under Sessions (`Penombre mobile · <device>`). */
suspend fun Api.labelSession(device: String) {
    call {
        client.put("$base/mobile/session") {
            auth()
            json("device" to JsonPrimitive(device.take(100)))
        }
    }
}
