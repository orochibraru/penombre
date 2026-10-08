# AI assistants (MCP)

Penombre speaks the [Model Context Protocol](https://modelcontextprotocol.io),
so an AI assistant can browse, search, read and write your files, and move
videos, photos and code in and out to work on them. The server is built in:
there is nothing to install or turn on.

## Connecting

The address is `https://files.example.com/mcp`. Create an API key under
**Settings → API keys** and send it as a bearer token. The assistant acts as the
key's account and sees exactly what that account sees.

With Claude Code:

```bash
claude mcp add --transport http penombre https://files.example.com/mcp \
  --header "Authorization: Bearer <key>"
```

Any client that connects to a remote MCP server over HTTP and lets you set a
header works the same way. Penombre does not offer OAuth sign-in, so clients
that only connect through OAuth cannot use it yet.

## Paths

Every tool takes a path of display names under a place, the same addresses
[WebDAV](webdav.md#addresses) uses without the `/dav` prefix:

| Tree             | Path                       |
| ---------------- | -------------------------- |
| Your drive       | `/me/Music/demo.wav`       |
| A shared drive   | `/drives/<id>/Contracts`   |
| A mounted volume | `/volumes/<name>/Projects` |

Names are matched without regard to case. Items shared _with_ you are not
reachable.

## Tools

| Tool            | What it does                                                 |
| --------------- | ------------------------------------------------------------ |
| `list_places`   | Your drive, your shared drives and the mounted volumes.      |
| `list_folder`   | What a folder holds, folders first.                          |
| `search`        | Files and folders by name, across every place.               |
| `read_file`     | A file's content (see below).                                |
| `download_link` | A link that serves one file's bytes.                         |
| `write_file`    | Creates a file, or replaces its content: text or base64.     |
| `edit_file`     | Replaces one exact passage of a text file.                   |
| `upload_link`   | A link that takes one file's bytes.                          |
| `create_folder` | Creates one folder inside an existing one.                   |
| `move`          | Moves or renames within one place; never overwrites.         |
| `trash`         | Sends a file or folder to the trash, where it can be undone. |

`read_file` returns text files as text (the first megabyte of a larger one),
PNG, JPEG, GIF and WebP pictures as images the assistant can look at, Word
documents as HTML and spreadsheets and presentations as JSON. Anything else is
described rather than returned.

Replacing a file, by `write_file`, `edit_file` or an upload link, keeps it the
same file, with its notes and shares, and its previous content becomes a version
when the folder keeps versions (see [File versioning](versioning.md)).
`write_file` refuses to write text into a Word, Excel or PowerPoint file, which
text would corrupt; upload the file itself instead.

## Video, photos and code

An assistant with a shell, such as Claude Code, works on big files the way you
would: it downloads them, works on them with its own tools, and uploads the
result. Their bytes never pass through the conversation.

1. `download_link` gives a URL the assistant fetches with `curl`.
2. It edits the file locally: cuts a video with `ffmpeg`, retouches a photo,
   runs and fixes code.
3. `upload_link` gives a URL it sends the result to with `curl -T`, as a new
   file or over the original.

A link works for 15 minutes for one file and one direction, and needs no other
credential: whoever holds it can use it, so it never belongs in a chat
transcript you share. It stops working early if the account is removed or
banned, or loses access to the place; revoking the API key does not cancel links
already handed out.

Small binary files the assistant makes itself, a chart or an icon, go straight
through `write_file` with `encoding: "base64"`, up to 10 MB.

## Limitations

- Read-only volumes refuse writes, as they do everywhere else.
- Moving between two places is not supported: download and upload instead.
- An upload is held in memory while it is written, so a very large file needs
  that much free memory on the server.
- Your reverse proxy must pass `POST /mcp` with its `Authorization` header, and
  `GET` and `PUT` on `/mcp/transfer`. See [Reverse proxy](reverse-proxy.md).
