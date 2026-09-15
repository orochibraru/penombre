# Documents, sheets and presentations

Penombre can create and edit three kinds of document in the browser, from the
**New** button in the sidebar.

| Kind             | Saved as | Colour | Editor                                    |
| ---------------- | -------- | ------ | ----------------------------------------- |
| **Document**     | `.html`  | Blue   | Rich text — headings, lists, bold, italic |
| **Sheet**        | `.csv`   | Green  | A grid of cells                           |
| **Presentation** | `.md`    | Orange | Slides, with a full-screen present mode   |

The colour is the same everywhere the kind appears — the New menu, the file
list, the grid tiles — so a folder of mixed documents can be read without
squinting at extensions. It is the one place a fixed colour is used rather than
your accent, because it identifies the kind, not the object.

## Why those formats

Each one stores a format other software already opens. A document is an HTML
file any browser renders, a sheet is a CSV that every spreadsheet imports, a
deck is Markdown that reveal.js and Marp already understand. There is no
Penombre-only container and no export step: if you stop using Penombre you keep
files, not an archive to convert.

That choice has a cost, and it is worth stating plainly:

- Sheets hold **values, not formulas**. A CSV has nowhere to put a formula, and
  inventing a place for one would either be lost by every other tool that opens
  the file or stop it being a CSV.
- Documents keep the formatting the editor offers — headings, lists, emphasis,
  code, quotes, links. Anything richer is not represented.
- Slides render a practical subset of Markdown: headings, bullets, bold, italic
  and inline code.

## Word, Excel and PowerPoint files

`.docx`, `.xlsx` and `.pptx` files open in the same three editors, and saving
writes them back as themselves. They are not converted to HTML, CSV or Markdown
on disk and there is no import or export step: a `.docx` you upload is still the
same `.docx` afterwards, in the same place, under the same name.

| Uploaded | Opens in            |
| -------- | ------------------- |
| `.docx`  | The document editor |
| `.xlsx`  | The sheet grid      |
| `.pptx`  | The slide editor    |

In a file list these keep their Word, Excel and PowerPoint icons rather than the
three Penombre colours — they are Office files that Penombre can edit, not
Penombre documents.

### What a save keeps

Saving rewrites only the part of the file that holds the text you edited and
puts everything else back untouched. That covers rather more than the editor can
show you:

- **Spreadsheets** — a cell you did not change keeps its formula, number format,
  style and shared-string entry exactly as they were. Editing one cell never
  disturbs another. Charts, images, named ranges and **every sheet after the
  first** are left alone.
- **Documents** — headings, list numbering, bold, italic, underline,
  strikethrough, links, tables and the images already in the document all
  survive, as do page size, margins, headers, footers and the document's own
  style definitions.
- **Presentations** — text is written into the shapes the slide already has, so
  each slide keeps its layout, its placeholders' position and size, its theme
  and its pictures. Adding a slide copies the layout of the one before it.

### What a save does not keep

The editors are plain by design, and formatting they have no way to show cannot
be put back on text you rewrote. On the paragraphs, cells and slides you
actually edit, expect to lose:

- character formatting with no editor counterpart — fonts, sizes, colours,
  highlighting, superscript;
- anything anchored inside text you replaced, such as a comment, a footnote
  reference or a tracked change;
- in a spreadsheet, a formula in a cell whose value you typed over — the new
  value replaces it, because a stale cached result is worse than no formula;
- an image added in the editor, which has no bytes for Penombre to store.

Untouched content is not affected by any of this. If a document matters and its
formatting is elaborate, edit it in Word — Penombre is for fixing a figure,
correcting a sentence or adding a bullet without leaving the browser.

### Limits worth knowing

- A spreadsheet shows its **first sheet only**. The others are preserved
  exactly, but cannot be seen or edited here.
- A presentation matches slides to the editor by position, so deleting a slide
  from the middle of a deck keeps the text right but shifts the layouts of the
  slides after it.
- The older `.doc`, `.xls` and `.ppt` formats are not OOXML and do not open in
  an editor; they download like any other file.
- A file that cannot be read as an Office document reports an error rather than
  opening empty, and a save that cannot be written reports one rather than
  writing a broken file. In both cases the file on disk is left exactly as it
  was.

## Editing

Opening any of these files from the drive opens its editor rather than a
preview. Changes **save themselves** two seconds after you stop typing, and
again when you navigate away; the header shows whether a save is in flight and
when the last one landed. If a save fails it is retried rather than dropped, and
leaving the page with unsaved text prompts you first.

Because these are ordinary files, everything else in Penombre applies to them
unchanged: they can be shared, starred, moved, trashed and searched like
anything else.

A new document is created in the folder you are browsing, not at the root.

## The name follows the title

A document's file name tracks its own heading: retitle the `<h1>` of a document
or the heading of a deck's first slide and the file is renamed to match, keeping
its extension, the next time it saves. A sheet has no heading and is never
renamed this way.

This stops the moment you rename the file yourself. Once the name and the
heading disagree, the name is yours and editing the heading no longer touches
it. Characters a file name cannot hold (`/`, `:`, `?`, `*`, `"`, `<`, `>`, `|`)
become spaces, and a very long heading is cut to 120 characters.

## Presenting

A presentation has a **Present** button. It fills the window; arrow keys and the
space bar move between slides, and `Escape` returns to editing. The slide rail
on the left of the editor jumps to any slide.

## Notes

Any file can carry notes — see [Sharing and collaboration](sharing.md#notes)
and, for notes pinned to a moment in a track or video,
[Media and notes](media.md#notes-pinned-to-a-moment).
