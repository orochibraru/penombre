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

## Editing

Opening one of these files from the drive opens its editor rather than a
preview. Changes **save themselves** two seconds after you stop typing, and
again when you navigate away; the header shows whether a save is in flight and
when the last one landed. If a save fails it is retried rather than dropped, and
leaving the page with unsaved text prompts you first.

Because these are ordinary files, everything else in Penombre applies to them
unchanged: they can be shared, starred, moved, trashed and searched like
anything else.

## Presenting

A presentation has a **Present** button. It fills the window; arrow keys and the
space bar move between slides, and `Escape` returns to editing. The slide rail
on the left of the editor jumps to any slide.

## Notes

Any file can carry notes — see [Sharing and collaboration](sharing.md#notes)
and, for notes pinned to a moment in a track or video,
[Media and notes](media.md#notes-pinned-to-a-moment).
