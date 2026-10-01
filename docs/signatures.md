# Signatures

Ask people to sign a document, with or without an account on the instance. Each
signer gets a personal link, signs on a page that works on a phone, and once
everyone has signed, everybody gets the same signed PDF with a certificate and
an audit trail.

## What this is, and what it is not

This is a **simple electronic signature with an audit trail**. It records who
signed, when, from which IP address and browser, and that the document did not
change in between. It is not a qualified or advanced electronic signature:

- no certificate authority signs the PDF, and no identity document is checked;
- a signer is identified only by access to their link, which went to their email
  address;
- anyone who gets hold of a link can sign as that person.

That is enough for most everyday agreements. When the law or the other party
requires a qualified signature, use a provider that offers one.

## Asking for signatures

Open a document and choose **File → Ask for signatures…**. You need to be able
to edit the document: a read-only share, a shared drive where you are a viewer
or a read-only volume will not do.

- **Who signs**: search for people with an account, type a name and an email
  address for anyone else, or **Add me** to sign it yourself.
- **Sign in this order**: signers sign one after the other, in the order listed.
  Each one is emailed when the person before them has signed.
- **Message**: shown to every signer, in the email and on the signing page.
- **Links work for**: 7, 14, 30 (the default) or 90 days.

When you send, the document is **frozen**: Penombre renders it to PDF right
then, and that PDF is what everyone signs, whatever happens to the document
afterwards. Its SHA-256 is recorded and printed on the certificate. A PDF file
is frozen as it is; a document, spreadsheet or presentation is exported first
(see [Documents](documents.md) for what the export keeps). Password-protected
PDFs cannot be signed.

### The links

Each signer has their own link. With outgoing mail configured (see
[Notifications](notifications.md)), Penombre emails it. Either way, the dialog
shows every link once, ready to copy: without mail, that is how signers get
them.

Links are stored hashed, so Penombre cannot show one again. **New link** in the
document's signatures issues a fresh one, emails it when it can, copies it for
you, and stops the old one from working. In order mode, the email a signer gets
on their turn also carries a fresh link.

## Signing

The link opens a page with the name and message of whoever asked, the frozen PDF
(**Open the PDF** on a phone), and who else signs. The signer:

1. draws a signature with a finger or a mouse, or types their name, which is set
   in a handwriting face; someone signed in with the account the request was
   addressed to can reuse the signature they used last time;
2. ticks **I have read the document and agree to sign it electronically**;
3. presses **Sign**.

A link signs once. **Decline to sign**, with an optional reason, closes the
whole request and tells the requester. The page refuses signatures once the
request is complete, declined, cancelled or expired, and in order mode until the
signer's turn.

Someone who opens their link while signed in to Penombre with an account at the
same address is recorded as that account.

## The signed PDF

When the last person signs, Penombre:

- appends a **certificate** to the frozen PDF: the document's name, page count
  and SHA-256, the request's id, who asked and when, then each signer's
  signature, name, address, the time in UTC and in their own time zone, their IP
  address and browser, and the audit trail of every step (created, link issued,
  opened, signed, declined, completed);
- stamps every page's footer with the request's id;
- saves it as `<name> (signed).pdf` next to the document, as a new file;
- notifies you, in the app and by email;
- emails every signer a link to download it, which works for 90 days.

The document's own pages are copied into the signed PDF untouched, so the pages
of the frozen PDF are exactly what was signed.

## Following requests

**File → Signatures** in the editor lists a document's requests; the
**Signatures** page lists all of yours. Each shows who has signed, opened or
declined, and offers the original and signed PDFs, a new link per signer, and
**Cancel request** while it is pending. A cancelled request keeps its record and
its links stop working.

## Where it is kept

The frozen and signed PDFs live in `STORAGE_PATH/.signatures/<request id>/`,
outside every user's files, so the scan never lists them and they stay available
even when the document is moved or deleted. With
[encryption at rest](encryption.md) they are sealed like every other file.
Requests, signers and the audit trail are rows in the database, removed with the
account that made them.

IP addresses come from the request. Behind a reverse proxy, set `ADDRESS_HEADER`
(see [Reverse proxy](reverse-proxy.md)) or every signature records the proxy's
address.

## API

Everything the dialog and the list do is in the API, under **Signatures** in the
API docs: `POST /api/v1/signatures` (with `drive`, `volume` or `share` for a
document outside your own drive), `GET /api/v1/signatures`,
`POST /api/v1/signatures/{id}/cancel`,
`POST /api/v1/signatures/{id}/signers/{signerId}/link` and
`GET /api/v1/signatures/{id}/pdf`. Signers answer through the page only.
