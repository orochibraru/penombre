# Documents, sheets and presentations

Penombre creates and edits three kinds of document in the browser, from the
**New** button in the sidebar.

| Kind             | Saved as | Colour | Editor                                            |
| ---------------- | -------- | ------ | ------------------------------------------------- |
| **Document**     | `.docx`  | Blue   | Rich text, tables, pictures and code blocks       |
| **Sheet**        | `.xlsx`  | Green  | A workbook of sheets, with formulas               |
| **Presentation** | `.pptx`  | Orange | Slides you design and draw on, from ten templates |

The colour is the same everywhere the kind appears — the New menu, the file
list, the grid tiles — so a folder of mixed documents can be read without
squinting at extensions. It is the one place a fixed colour is used rather than
your accent, because it identifies the kind, not the object.

In grid layout, a tile shows the file's first page instead of its icon: a
document's opening paragraphs, a sheet's top-left corner with formulas worked
out, a deck's first slide. That covers `.docx`, `.xlsx`, `.pptx` and `.csv`
files, wherever they came from; `.html` documents and Markdown decks keep their
icon. The page is drawn the first time a tile asks for it rather than at upload,
and again after each save, since an editor saves every few seconds.

## Why those formats

A document is a Word file, a sheet an Excel file and a presentation a PowerPoint
file: Microsoft Office, LibreOffice, Google's apps, Keynote and every phone open
them as they are. There is no Penombre-only container and no export step: if you
stop using Penombre you keep files, not an archive to convert.

Documents, sheets and decks made by earlier versions (`.html`, `.csv`, `.md`)
still open and save as themselves. A Markdown deck keeps its own simpler editor
and cannot be downloaded as PDF or PowerPoint; a new presentation is always a
`.pptx`.

## Word, Excel and PowerPoint files

A `.docx`, `.xlsx` or `.pptx` from anywhere else opens in the same editors, and
saving writes it back as itself: same file, same place, same name.

### What a save keeps

Saving rewrites only the part of the file that holds what you edited and puts
everything else back untouched, which covers more than the editor can show:

- **Spreadsheets** — a cell you did not change keeps its formula, number format,
  style and shared-string entry exactly as they were. Editing one cell never
  disturbs another. Charts, images and named ranges are left alone.
- **Documents** — headings, list numbering, bold, italic, underline,
  strikethrough, fonts, sizes, colours, highlighting, superscript and subscript,
  links, tables, pictures and code blocks all survive, as do page size, margins,
  headers, footers and the document's own style definitions.
- **Presentations** — a shape you did not touch is written back exactly as it
  was, and one you changed keeps everything but what you changed. See
  [PowerPoint compatibility](#powerpoint-compatibility).

### What a save does not keep

On the paragraphs and cells you actually edit, expect to lose:

- anything anchored inside text you replaced, such as a Word comment, a footnote
  reference or a tracked change;
- in a spreadsheet, a formula in a cell whose value you typed over — the new
  value replaces it, because a stale cached result is worse than no formula.

A formula you type into an `.xlsx` cell is written as a real formula, which
Excel and LibreOffice calculate when they open the file. Pictures added in the
editor are stored as PNG, JPEG or GIF, the formats every Word since 2007 draws.

Untouched content is not affected by any of this. If a document's formatting is
elaborate, edit it in Word — Penombre is for fixing a figure, correcting a
sentence or adding a bullet without leaving the browser.

### Limits worth knowing

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

Autosave never makes a version. With [file versioning](versioning.md) on, **File
→ Save as version** keeps what is on screen right now; use it before a change
you may want to undo.

Because these are ordinary files, everything else in Penombre applies to them
unchanged: they can be shared, starred, moved, trashed and searched like
anything else. A new document is created in the folder you are browsing, not at
the root.

### The File menu

Every editor opens its menu bar with the same **File** menu:

| Entry           | What it does                                       |
| --------------- | -------------------------------------------------- |
| Share           | Opens the **Share** dialog for this file           |
| Rename          | Renames the file; its extension stays              |
| Make a copy     | Copies it into the same folder and opens the copy  |
| Download        | The file as it is saved                            |
| Download as     | The file converted, in each format its kind offers |
| Print           | Documents and presentations                        |
| Save as version | Keeps what is on screen now as a version           |
| Version history | Lists the versions, to download or restore         |

Clicking the file name in the header renames it too. Downloads, copies and
versions save first, so they carry what is on screen. **Share**, **Rename**,
**Make a copy** and **Save as version** only show for someone who may change the
file, and the two version entries only while [file versioning](versioning.md) is
on. Restoring a version keeps the current text as a version first, then reloads
the editor. In the mobile app, which has no downloads or printing, the menu
leaves those out.

**Download as** offers, for a document, PDF, Word, a web page, Markdown and
plain text; for a sheet, Excel, CSV (the first sheet) and PDF; for a
presentation, PowerPoint and PDF.

### Viewing and editing

The switch in the header puts the editor in **Viewing** or **Editing**. Viewing
hides the toolbar and every menu that changes the file, so nothing is changed by
accident; searching, copying, printing, downloading and commenting still work.
The choice is remembered per file, in this browser.

Someone who may not change the file gets **View only** instead of the switch: a
person the file was shared with at **Can view**, a viewer of a
[shared drive](shared-drives.md), or anyone on a read-only [volume](volumes.md).
The server refuses their saves whatever the page does.

### Comments

**Add comment** starts a comment on:

- the selected text, in a document (the speech bubble in the toolbar, **Insert →
  Add comment**, or `Ctrl`/`⌘` + `Alt` + `M`);
- the selected cell, in a sheet (**Insert → Add comment**, or the cell's
  right-click menu);
- the slide on screen, in a presentation (the speech bubble beside **Present**).

Comments open in a panel beside the editor, and in a sheet that slides up from
the bottom on a phone. The speech bubble in the header shows how many are open
and shows or hides the panel. Commented text is tinted, with a marker in the
page's margin; a commented cell has a flag in its corner; a commented slide a
dot in the slide rail. Clicking one brings up its thread, and clicking a thread
shows what it is about.

Each comment starts a thread. Reply in it, **Resolve** it once it is dealt with,
**Reopen** it if it was not, and edit or delete your own comments. Deleting a
thread's first comment deletes its replies. Resolved threads move to the
**Resolved** tab.

A comment on text finds its words again after the document changes, so it
follows the passage as text is added or removed around it. If the passage itself
is deleted, the thread stays and says, in red, that its text is gone, rather
than pointing at the wrong words.

Everyone who can open the file sees its comments and may add, reply to and
resolve them, including people it was shared with at **Can view**: a file shared
for review has to be reviewable. The file's owner and the people already in a
thread are told of a new comment, as long as they can still open the file; the
link in the notification opens it the way each of them reaches it (see
[Notifications](notifications.md)).

### Who else is here

The header shows the initials of the other people who have the file open, each
in their own colour; pointing at one says whether they are viewing or editing.
Someone drops off about half a minute after closing the file. Only people who
can open the file appear, and only to each other.

Two people editing at once do not see each other's typing, and the last save
wins. When someone else shows as **editing**, agree on who writes, or switch to
**Viewing** and comment instead.

### Documents

The menu bar holds everything (**Edit**, **Insert**, **Format**, **Table**) and
the toolbar under it the common part: undo, headings, fonts and sizes, bold,
italic, underline, strikethrough, colours, links, alignment, bulleted, numbered
and check lists, quotes, code blocks, dividers, tables and pictures. The usual
shortcuts work: `Ctrl`/`⌘` + `B`, `I`, `U`, `Z`. With the caret in a table, the
toolbar also offers adding and removing rows and columns.

Type ` ``` ` at the start of a line for a code block, or ` ```python ` to name
its language; the block is highlighted and its language can be changed from the
block itself. Three `Enter`s at its end, or `↓` on its last line, leave it.

### Sheets

Click a cell to select it. Drag, `Shift`+click or `Shift`+arrow keys select a
range, and the box left of the formula bar names it (`B2`, `A1:C4`); type a cell
or a range there and press `Enter` to go to it. Click a column letter or a row
number to select the whole column or row.

Typing on a selected cell replaces what it holds; `Enter`, `F2` or a
double-click edits it in place instead. `Enter` writes the cell and moves down,
`Tab` moves right, and `Escape` leaves the cell as it was. On a phone, tap a
cell to select it and tap it again to edit it.

Type `=` to start a formula. The cell shows its result and the bar above the
grid shows what you typed. While you type, the functions matching the name so
far are listed with their arguments, and `Tab` or `Enter` picks one. Right after
`=`, `(`, a comma or an operator, clicking a cell, or dragging across a range,
puts its reference into the formula.

A formula can refer to a cell (`A1`), a range (`A1:B10`), a whole column or row
(`A:A`, `3:3`), and in a workbook to another sheet (`Sheet2!A1`,
`'Q1 figures'!B2:B9`). A `$` keeps a column or row fixed when the formula is
copied: `$A$1`, `$A1`, `A$1`. Arithmetic, comparisons, `&` for joining text and
these functions work:

`ABS`, `AND`, `AVERAGE`, `AVERAGEIF`, `AVERAGEIFS`, `CEILING`, `CHOOSE`,
`CONCAT`, `CONCATENATE`, `COUNT`, `COUNTA`, `COUNTBLANK`, `COUNTIF`, `COUNTIFS`,
`DATE`, `DATEVALUE`, `DAY`, `DAYS`, `EDATE`, `EOMONTH`, `EXACT`, `EXP`, `FALSE`,
`FIND`, `FLOOR`, `HLOOKUP`, `HOUR`, `IF`, `IFERROR`, `IFNA`, `IFS`, `INDEX`,
`INT`, `ISBLANK`, `ISERR`, `ISERROR`, `ISLOGICAL`, `ISNA`, `ISNUMBER`, `ISTEXT`,
`LARGE`, `LEFT`, `LEN`, `LN`, `LOG`, `LOG10`, `LOWER`, `MATCH`, `MAX`, `MAXIFS`,
`MEDIAN`, `MID`, `MIN`, `MINIFS`, `MINUTE`, `MOD`, `MONTH`, `NA`, `NOT`, `NOW`,
`OR`, `PI`, `POWER`, `PRODUCT`, `PROPER`, `RAND`, `RANDBETWEEN`, `RANK`,
`RANK.EQ`, `REPLACE`, `REPT`, `RIGHT`, `ROUND`, `ROUNDDOWN`, `ROUNDUP`,
`SEARCH`, `SECOND`, `SIGN`, `SMALL`, `SQRT`, `STDEV`, `STDEV.P`, `STDEV.S`,
`SUBSTITUTE`, `SUM`, `SUMIF`, `SUMIFS`, `SUMPRODUCT`, `SWITCH`, `TEXT`,
`TEXTJOIN`, `TODAY`, `TRIM`, `TRUE`, `TRUNC`, `UPPER`, `VALUE`, `VAR`, `VAR.P`,
`VAR.S`, `VLOOKUP`, `WEEKDAY`, `XLOOKUP`, `XOR` and `YEAR`.

Dates are numbers of days, as in Excel: a cell holding `2026-03-14` is a date,
`=A1+7` is a week later and shows as a date too. `TEXT` writes a number or a
date with a format code such as `0.00`, `#,##0`, `0%`, `yyyy-mm-dd`,
`dd/mm/yyyy`, `d mmm yyyy` or `hh:mm AM/PM`. The conditions of `COUNTIF`,
`SUMIFS` and the like are written as in Excel: `">5"`, `"<>done"`, `"ap*"`.

Errors read as they do elsewhere: `#DIV/0!`, `#VALUE!`, `#REF!`, `#NAME?` for an
unknown function or name, `#N/A`, `#NUM!`, and `#CYCLE!` for a formula that
depends on itself.

Copy, cut and paste go through the clipboard as tab-separated text, so cells
move between Penombre, Excel, Google Sheets and LibreOffice. Copying takes the
values; pasting cells copied in the same sheet keeps their formulas, with their
references shifted to where they land, while a cut moves them unchanged. One
copied cell pasted over a selection fills all of it, and a paste that runs past
the last row or column grows the sheet. **Fill down** and **Fill right** copy
the first row or column of the selection over the rest the same way.

Inserting or deleting rows and columns rewrites every formula that points past
them, on every sheet, as Excel does; a reference to a deleted cell becomes
`#REF!`. Sorting moves formulas as they are written.

**Data** sorts by the selected column, numbers first, then text, blanks last;
the first row stays put while **Header row** is on, and it stays on screen as
you scroll. **Freeze first column** keeps column A on screen too. Each column
letter opens sorting and the column commands; drag its right edge to resize it,
or double-click the edge to fit its contents. Right-click the grid, or
long-press it on a phone, for cutting, copying, pasting, inserting and deleting.
**Find** jumps to the next cell holding the text, results included. **Edit**
undoes and redoes every change, up to a hundred steps back.

| Keys                                   | What they do                      |
| -------------------------------------- | --------------------------------- |
| Arrows, `Tab`, `Shift`+`Tab`           | Move                              |
| `Shift`+arrows                         | Extend the selection              |
| `Ctrl`/`⌘`+arrows                      | Jump to the edge of the data      |
| `Ctrl`/`⌘`+`A`                         | Select everything                 |
| `Shift`+`Space`, `Ctrl`+`Space`        | Select the row, the column        |
| `Enter`, `F2`                          | Edit the cell                     |
| `Enter`, `Shift`+`Enter` while editing | Write and move down, up           |
| `Alt`+`Enter` while editing            | Start a new line inside the cell  |
| `Escape` while editing                 | Leave the cell as it was          |
| `Delete`, `Backspace`                  | Clear the selection               |
| `Ctrl`/`⌘`+`C`, `X`, `V`               | Copy, cut, paste                  |
| `Ctrl`/`⌘`+`D`, `R`                    | Fill down, fill right             |
| `Ctrl`/`⌘`+`Z`, `Shift`+`Z`, `Y`       | Undo, redo                        |
| `Page Up`, `Page Down`                 | Move by a screen                  |
| `Home`, `End`                          | Go to the start or end of the row |

A workbook (`.xlsx`) shows its sheets as tabs under the grid: click one to open
it, **+** to add one, and the arrow on the open tab to rename or delete it, or
double-click its name to rename it. A CSV is a single sheet and has no tabs.

### Presentations

**New → Presentation** opens a gallery of ten templates — Midnight, Paper, Bold,
Aurora, Swiss, Forest, Sunset, Blueprint, Pastel and Noir — each drawn with its
title slide and three of its layouts. Pick one, give the deck a name and it
opens in the slide editor as a real PowerPoint file (`.pptx`): the theme
colours, the fonts, the master and eleven layouts are all inside it, so
PowerPoint, Keynote, Google Slides and LibreOffice open it as the template
looks.

Every template carries the same layouts: title, section header, title and
content, two columns, comparison, picture with caption, quote, big number,
agenda, closing and blank. **Add slide** under the slide rail starts a slide
from any of them, and **Layout** moves the current slide to another, carrying
its text along.

#### Editing slides

- **Text** — double-click a box, or select it and press `Enter`, to type in it.
  The toolbar sets the font, size, bold, italic, underline, strikethrough,
  colour, alignment, bullets, numbering and line spacing, for the selected
  characters or, with no text selected, the whole box. `Tab` and `Shift+Tab`
  change a bullet's level. Text that overflows a template's placeholder shrinks
  to fit, as it does in PowerPoint.
- **Shapes and lines** — rectangles, rounded rectangles, ellipses, triangles,
  stars, arrows, callouts and more, with fill and outline colour, outline weight
  and corner radius. Double-click a shape to write in it.
- **Pictures** — insert, paste or drop them on the slide. They are scaled to at
  most 1600 pixels and stored inside the presentation. Double-click an empty
  picture placeholder to fill it.
- **Drawing** — the pen and the highlighter draw freehand with a mouse, a pen or
  a finger; the eraser removes whole strokes. Drawings are saved as ordinary
  shapes, so PowerPoint shows and edits them too.
- **Arranging** — drag to move, the handles to resize (`Shift` keeps the
  proportions) and rotate. Objects snap to the slide's centre and edges and to
  each other; hold `Alt` to place freely. The **Arrange** menu aligns,
  distributes, stacks, groups and ungroups; arrow keys nudge, `Shift` by more.
- **Slides** — the rail reorders them by dragging (on a phone, from the grip)
  and its menu duplicates, hides and deletes them. A hidden slide is skipped
  when presenting.
- **Speaker notes** sit under the slide and are saved as PowerPoint's own notes
  pages.

`Ctrl+Z`/`⌘Z` undoes, and copy, cut and paste work within a slide, between
slides and between presentations.

#### Themes

**Change theme** moves an existing deck — one made here or uploaded — onto any
of the templates. Every slide goes to the matching layout of the new theme and
its titles and placeholders take the new look. Text, pictures and drawings you
placed yourself stay where they are, and formatting you set by hand on a word or
a shape stays too, as it would in PowerPoint.

#### PowerPoint compatibility

Opening a `.pptx` shows its slides with their masters, layouts, theme colours
and fonts. Saving rewrites only what you changed: a shape you did not touch is
written back exactly as it was, and one you moved keeps everything but its
position. Tables, charts, SmartArt, video and PowerPoint's own ink are shown and
can be moved, resized and copied, but not edited; they survive untouched.

The templates use fonts that come with Windows, macOS or Microsoft Office —
Century Gothic, Georgia, Gill Sans MT, Arial Black, Trebuchet MS, Palatino
Linotype, Calibri, Rockwell, Courier New and Verdana. Where one is missing,
PowerPoint substitutes its default font and the editor the closest match it
finds, so a line may wrap a little differently.

#### Presenting

**Present** fills the screen with the slides, hidden ones skipped. Arrow keys,
the space bar, a click or a swipe move between slides, a number then `Enter`
jumps to that slide and `Escape` returns to editing. **View → Presenter view**
shows the current slide, the next one, the speaker notes and a timer, and can
open the slides in a second window for the audience, kept in step as you
advance.

On a phone the menus and the toolbar fit the width of the screen, and the slide
rail runs along the bottom of the slide editor.

## Plain text files

**New → Text file** asks for a name and opens an empty file in a plain text
editor, for configuration files and the like: name it with its extension
(`nginx.conf`, `.env`, `notes.txt`). It saves the same way as the other editors.

Existing text files keep opening in the read-only preview. **Edit** in a file's
right-click menu opens it in the text editor; it is offered for code and
configuration files, `.txt` and `.log`, and files with no extension. A file that
turns out to hold binary data is refused rather than opened, since saving it
back as text would destroy it.

## The name follows the title

A document's file name tracks its own heading: retitle the first heading of a
document (or of a Markdown deck's first slide) and the file is renamed to match,
keeping its extension, the next time it saves. Sheets and PowerPoint
presentations are never renamed this way.

This stops the moment you rename the file yourself. Once the name and the
heading disagree, the name is yours and editing the heading no longer touches
it. Characters a file name cannot hold (`/`, `:`, `?`, `*`, `"`, `<`, `>`, `|`)
become spaces, and a very long heading is cut to 120 characters.

## Notes

Any file can carry notes — see [Sharing and collaboration](sharing.md#notes)
and, for notes pinned to a moment in a track or video,
[Media and notes](media.md#notes-pinned-to-a-moment).
