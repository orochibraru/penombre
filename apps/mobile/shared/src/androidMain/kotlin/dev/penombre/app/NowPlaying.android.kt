package dev.penombre.app

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.graphics.drawable.Icon
import android.media.MediaMetadata
import android.media.session.MediaSession
import android.media.session.PlaybackState
import android.os.IBinder
import org.jetbrains.compose.resources.getString

private const val CHANNEL = "playback"
private const val NOTIFICATION = 7

actual object NowPlaying {
    private var session: MediaSession? = null
    internal var controls: RemoteControls? = null

    // Kept after a stop: a service already asked to start must still show one.
    internal var notification: Notification? = null
    internal var playing = false
    private var started = false

    actual suspend fun show(info: NowPlayingInfo, controls: RemoteControls) {
        val context = AndroidHost.context
        this.controls = controls
        playing = info.playing
        val media = session ?: MediaSession(context, "penombre").apply {
            setCallback(object : MediaSession.Callback() {
                override fun onPlay() {
                    NowPlaying.controls?.play()
                }

                override fun onPause() {
                    NowPlaying.controls?.pause()
                }

                override fun onSkipToNext() {
                    NowPlaying.controls?.next()
                }

                override fun onSkipToPrevious() {
                    NowPlaying.controls?.previous()
                }

                override fun onSeekTo(pos: Long) {
                    NowPlaying.controls?.seekTo(pos / 1000.0)
                }

                override fun onStop() {
                    NowPlaying.controls?.stop()
                }
            })
            isActive = true
        }.also { this.session = it }

        media.setMetadata(
            MediaMetadata.Builder()
                .putString(MediaMetadata.METADATA_KEY_TITLE, info.title)
                .putString(MediaMetadata.METADATA_KEY_ARTIST, info.subtitle)
                .putLong(MediaMetadata.METADATA_KEY_DURATION, (info.duration * 1000).toLong())
                .build(),
        )
        var actions = PlaybackState.ACTION_PLAY or PlaybackState.ACTION_PAUSE or PlaybackState.ACTION_PLAY_PAUSE or
            PlaybackState.ACTION_SEEK_TO or PlaybackState.ACTION_STOP or PlaybackState.ACTION_SKIP_TO_PREVIOUS
        if (info.hasNext) actions = actions or PlaybackState.ACTION_SKIP_TO_NEXT
        media.setPlaybackState(
            PlaybackState.Builder()
                .setActions(actions)
                .setState(
                    if (info.playing) PlaybackState.STATE_PLAYING else PlaybackState.STATE_PAUSED,
                    (info.position * 1000).toLong(),
                    if (info.playing) 1f else 0f,
                )
                .build(),
        )

        val manager = context.getSystemService(NotificationManager::class.java)
        manager.createNotificationChannel(NotificationChannel(CHANNEL, getString(Res.string.playback_channel), NotificationManager.IMPORTANCE_LOW))
        notification = build(context, media, info)
        if (started) {
            manager.notify(NOTIFICATION, notification)
        } else {
            // First track from the app on screen: allowed to start a foreground service.
            started = runCatching { context.startForegroundService(Intent(context, PlaybackService::class.java)) }.isSuccess
        }
    }

    private suspend fun build(context: Context, session: MediaSession, info: NowPlayingInfo): Notification {
        fun action(icon: Int, label: String, command: String) = Notification.Action.Builder(
            Icon.createWithResource(context, icon),
            label,
            PendingIntent.getService(
                context,
                command.hashCode(),
                Intent(context, PlaybackService::class.java).setAction(command),
                PendingIntent.FLAG_IMMUTABLE,
            ),
        ).build()
        val open = context.packageManager.getLaunchIntentForPackage(context.packageName)
        val icon = context.resources.getIdentifier("ic_notify", "drawable", context.packageName)
        val toggle = if (info.playing) {
            action(android.R.drawable.ic_media_pause, getString(Res.string.pause), PlaybackService.TOGGLE)
        } else {
            action(android.R.drawable.ic_media_play, getString(Res.string.play), PlaybackService.TOGGLE)
        }
        val actions = listOfNotNull(
            action(android.R.drawable.ic_media_previous, getString(Res.string.player_previous), PlaybackService.PREVIOUS),
            toggle,
            if (info.hasNext) action(android.R.drawable.ic_media_next, getString(Res.string.player_next), PlaybackService.NEXT) else null,
        )
        return Notification.Builder(context, CHANNEL)
            .setSmallIcon(icon.takeIf { it != 0 } ?: context.applicationInfo.icon)
            .setContentTitle(info.title)
            .setContentText(info.subtitle)
            .setContentIntent(PendingIntent.getActivity(context, 0, open, PendingIntent.FLAG_IMMUTABLE))
            .setVisibility(Notification.VISIBILITY_PUBLIC)
            .setOngoing(true)
            .setShowWhen(false)
            .setStyle(
                Notification.MediaStyle()
                    .setMediaSession(session.sessionToken)
                    .setShowActionsInCompactView(*actions.indices.toList().toIntArray()),
            )
            .apply { actions.forEach(::addAction) }
            .build()
    }

    actual fun clear() {
        controls = null
        session?.run {
            isActive = false
            release()
        }
        session = null
        if (started) {
            started = false
            AndroidHost.context.stopService(Intent(AndroidHost.context, PlaybackService::class.java))
        }
    }
}

/**
 * Holds the track queue's notification in the foreground: without it Android
 * stops a backgrounded app's process, and the music with it.
 */
class PlaybackService : Service() {
    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        NowPlaying.notification?.let { startForeground(NOTIFICATION, it, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK) }
        val controls = NowPlaying.controls
        if (controls == null) {
            stopSelf()
            return START_NOT_STICKY
        }
        when (intent?.action) {
            TOGGLE -> if (NowPlaying.playing) controls.pause() else controls.play()
            NEXT -> controls.next()
            PREVIOUS -> controls.previous()
        }
        return START_NOT_STICKY
    }

    // Swiped away from the recent apps: the screens that drove the queue are gone.
    override fun onTaskRemoved(rootIntent: Intent?) {
        NowPlaying.controls?.stop()
        stopSelf()
    }

    override fun onDestroy() {
        stopForeground(STOP_FOREGROUND_REMOVE)
        super.onDestroy()
    }

    companion object {
        const val TOGGLE = "dev.penombre.app.playback.TOGGLE"
        const val NEXT = "dev.penombre.app.playback.NEXT"
        const val PREVIOUS = "dev.penombre.app.playback.PREVIOUS"
    }
}
