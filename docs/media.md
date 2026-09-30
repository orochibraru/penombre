# Media and notes

Images, video and audio get more than a download link.

## File dates

A file's **Modified** date is the one it had on your computer, not the moment it
reached Penombre. Uploads keep it, and so do files the library scan finds on a
volume. Browsers do not share a file's creation date, so that one is not kept.

## The music player

Opening a track loads it into a player pinned to the bottom of the window; it
keeps playing while you browse. Its progress bar is the track's own waveform,
filling with your accent colour as it plays — click anywhere on it to seek.

The waveform is **peak data, not a picture**. The server analyses the file once
and caches a JSON array of peaks; the browser draws it as inline SVG. That is
why it re-colours instantly when you change your accent, and why it looks right
in both light and dark: a baked-in image could do neither.

A file the server cannot analyse falls back to a plain progress bar.

Beside play, **Start from the top** jumps back to 0:00 and plays, and the two
arrows skip back or forward five seconds. **Speed** (0.5× to 2×) changes the
tempo without changing the pitch, and **Pitch** transposes by up to an octave
either way without changing the tempo, for playing along in another key. Both
stay set when you switch tracks or versions, so takes are compared at the same
settings. On a phone they sit behind the gauge button.

Pitch runs in the browser's audio engine, which browsers only allow over HTTPS
(or on `localhost`); on an instance reached over plain HTTP the pitch control is
disabled and says so. Speed works either way.

A track with [earlier versions](versioning.md) gets a version picker beside the
time. Switching keeps the playhead where it is, so two mixes can be compared at
the same bar; image and video previews have the same picker.

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

Timestamped notes are drawn on the waveform itself — a dot at each moment
someone wrote about, in the bottom player, in the preview and in the full-screen
viewer alike. Hover one to read the note without opening the thread; click it to
jump to that moment. Notes with no timestamp are about the file as a whole and
appear only in the thread.

The player has its own **Notes** button, which opens the thread inside the
player itself. That is the quickest way to write one while listening: you keep
the page you are on, and the note is stamped with wherever the playhead is. With
the thread open there, clicking the waveform behaves as it does everywhere else
— it stops the track at that moment and puts the caret in the box.

Notes are per-instance, not per-share: they are visible to accounts that can see
the file, and they are never included in a share link.

## Pictures load in steps

A photo from a phone is several megabytes; what a screen needs to show it is a
fraction of that. Opening a picture shows the listing's thumbnail at once,
blurred, then a preview rendered by the server (1600 pixels on its long side),
and **Show original** fetches the file itself, with its size on the button. A
picture under 400 KB, a GIF or an SVG is simply shown as it is.

## Video quality

A video plays straight from its file, and only the part being watched is
fetched: opening one does not download it. What decides how long it takes to
start, and whether it stutters, is its bitrate against your connection. A
phone's 4K clip is 40 to 50 Mbit/s, more than most home connections can send.

The **Quality** button in the player offers **720p** and **480p** beside
**Original**. The first time one is chosen for a video the server renders it (an
H.264 MP4, capped at about 2.5 and 1.7 Mbit/s), which takes from a few seconds
to a few minutes depending on the video's length and the machine; the player
keeps playing meanwhile and switches at the same moment of the video once it is
ready. It is rendered once: the next viewer gets it at once.

Renditions are stored beside thumbnails, in the storage root's `.thumbnails`
folder, and are removed with the file or when its bytes change. Each is roughly
the video's length times its bitrate: about 19 MB a minute at 720p.

### Formats a browser cannot play

Browsers play MP4, WebM and little else. For an AVI, WMV, FLV or an MKV with a
codec the browser lacks, the player is replaced by a message saying so, with two
buttons: **Convert and play**, which renders the 720p version described above
and plays that, and **Download**.

Converting in the browser itself was considered and rejected: it means fetching
the whole file first and decoding it in software, which a phone cannot do for a
full-length video.

On a drive whose files are [sealed](encryption.md), nothing is rendered: the
quality button is absent and an unplayable format can only be downloaded.

## Opening media full screen

**Open full screen** on an image, a video or a track navigates to Penombre's own
viewer rather than the browser's bare built-in player. A track has no picture to
fill a screen with, so it gets a now-playing panel instead: its name, its
length, and a waveform given the room the artwork would have had. It is the same
tab, so the back button returns you to the folder. You get the file's name, its
size, a download button, real transport controls, and the notes thread beside it
— the same timestamped notes as in the dialog.

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
