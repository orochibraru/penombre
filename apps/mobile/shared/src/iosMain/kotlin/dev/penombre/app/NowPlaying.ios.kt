package dev.penombre.app

import platform.MediaPlayer.MPChangePlaybackPositionCommandEvent
import platform.MediaPlayer.MPMediaItemPropertyArtist
import platform.MediaPlayer.MPMediaItemPropertyPlaybackDuration
import platform.MediaPlayer.MPMediaItemPropertyTitle
import platform.MediaPlayer.MPNowPlayingInfoCenter
import platform.MediaPlayer.MPNowPlayingInfoPropertyElapsedPlaybackTime
import platform.MediaPlayer.MPNowPlayingInfoPropertyPlaybackRate
import platform.MediaPlayer.MPRemoteCommandCenter
import platform.MediaPlayer.MPRemoteCommandHandlerStatusCommandFailed
import platform.MediaPlayer.MPRemoteCommandHandlerStatusSuccess

actual object NowPlaying {
    private var controls: RemoteControls? = null
    private var playing = false
    private var wired = false

    actual suspend fun show(info: NowPlayingInfo, controls: RemoteControls) {
        this.controls = controls
        playing = info.playing
        if (!wired) wire()
        val commands = MPRemoteCommandCenter.sharedCommandCenter()
        commands.nextTrackCommand.enabled = info.hasNext
        MPNowPlayingInfoCenter.defaultCenter().nowPlayingInfo = mapOf<Any?, Any?>(
            MPMediaItemPropertyTitle to info.title,
            MPMediaItemPropertyArtist to info.subtitle,
            MPMediaItemPropertyPlaybackDuration to info.duration,
            MPNowPlayingInfoPropertyElapsedPlaybackTime to info.position,
            MPNowPlayingInfoPropertyPlaybackRate to if (info.playing) 1.0 else 0.0,
        )
    }

    actual fun clear() {
        controls = null
        MPNowPlayingInfoCenter.defaultCenter().nowPlayingInfo = null
    }

    // Once: a handler added twice would answer every press twice.
    private fun wire() {
        wired = true
        val commands = MPRemoteCommandCenter.sharedCommandCenter()
        fun on(command: platform.MediaPlayer.MPRemoteCommand, act: (RemoteControls) -> Unit) {
            command.enabled = true
            command.addTargetWithHandler {
                val target = controls
                if (target == null) {
                    MPRemoteCommandHandlerStatusCommandFailed
                } else {
                    act(target)
                    MPRemoteCommandHandlerStatusSuccess
                }
            }
        }
        on(commands.playCommand) { it.play() }
        on(commands.pauseCommand) { it.pause() }
        on(commands.togglePlayPauseCommand) { if (playing) it.pause() else it.play() }
        on(commands.nextTrackCommand) { it.next() }
        on(commands.previousTrackCommand) { it.previous() }
        commands.changePlaybackPositionCommand.enabled = true
        commands.changePlaybackPositionCommand.addTargetWithHandler { event ->
            val at = (event as? MPChangePlaybackPositionCommandEvent)?.positionTime
            val target = controls
            if (at == null || target == null) {
                MPRemoteCommandHandlerStatusCommandFailed
            } else {
                target.seekTo(at)
                MPRemoteCommandHandlerStatusSuccess
            }
        }
    }
}
