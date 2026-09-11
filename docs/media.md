# Media and notes

Images, video and audio get more than a download link.

## The music player

Opening a track loads it into a player pinned to the bottom of the window; it
keeps playing while you browse. Its progress bar is the track's own waveform,
filling with your accent colour as it plays — click anywhere on it to seek.

The waveform is **peak data, not a picture**. The server analyses the file once
and caches a JSON array of peaks; the browser draws it as inline SVG. That is
why it re-colours instantly when you change your accent, and why it looks right
in both light and dark: a baked-in image could do neither.

A file the server cannot analyse falls back to a plain progress bar.

## Notes, pinned to a moment

Every file has a notes thread — right-click → **Notes**, or the panel beside any
preview.

In a preview the thread is hidden until you ask for it — **Notes** in the
dialog's header opens it, and right-click → **Notes** opens the dialog with it
already showing.

On a track or a video, a note can carry a timestamp. Open the notes for a track
and the player comes up with it; with the thread open, clicking a point on the
waveform stops playback, moves the playhead there and lands the caret in the
note box. Save, and the note is stamped with that moment. Clicking a timestamp
in the thread later jumps back to it. With the thread closed, a click on the
waveform is only a seek.

Notes are per-instance, not per-share: they are visible to accounts that can see
the file, and they are never included in a share link.

## Opening media full screen

**Open full screen** on an image, a video or a track navigates to Penombre's own
viewer rather than the browser's bare built-in player. It is the same tab, so
the back button returns you to the folder. You get the file's name, its size, a
download button, real transport controls, and the notes thread beside it — the
same timestamped notes as in the dialog.

A video additionally has a **Full screen** button that hands the player to the
browser's own full-screen mode, controls included.

Playback carries across. Open the viewer from a track at 1:12 and it opens at
1:12, still playing; go back and the bottom player picks it up where the viewer
left it. Some browsers refuse to start audio on a page you have not yet touched,
in which case the position is kept and one tap resumes.

Anything else (a PDF, a text file) still opens as the raw file, which is what
the browser handles better than we would.

## Thumbnails

Previews are generated when a file is written — on upload, and during the
[library scan](simple-mode.md#files-already-on-the-volume) — not lazily on first
view, so opening a folder of videos does not start a hundred `ffmpeg` runs at
once.

| Kind  | Preview                                 |
| ----- | --------------------------------------- |
| Image | A resized still                         |
| Video | A frame, via `ffmpeg`                   |
| PDF   | The first page, via `pdftoppm`          |
| Audio | Waveform peak data, drawn as inline SVG |

Sizes are three fixed names (`small`, `medium`, `large`) rather than arbitrary
pixel counts, which keeps the on-disk cache bounded. A thumbnail request never
falls back to serving the original file: a grid of audio tiles must not pull a
hundred megabytes of WAV.

## Documents

The three editable kinds are colour-coded wherever they appear — a document is
blue, a spreadsheet green, a presentation orange — so a folder of mixed files
reads at a glance. See [Documents](documents.md).
