# Notifications

The bell in the header tells you when someone else did something to your things.
It is deliberately narrow: only events involving another person appear, so your
own uploads, renames and deletions never ring it. Those are in
[your activity log](admin.md) instead.

## What raises one

| Event                            | Who is told                                |
| -------------------------------- | ------------------------------------------ |
| **A note is left on a file**     | Its owner, and everyone else in the thread |
| **Something is shared with you** | Each person newly given access             |
| **Everyone signed a document**   | Whoever asked for the signatures           |
| **Someone declined to sign**     | Whoever asked for the signatures           |

The last two come from [signature requests](signatures.md). Two rules apply to
all of them:

- **You are never told about your own action.** Leaving a note on your own file
  rings nobody's bell, including yours.
- **Nobody is told twice about one event.** An owner who has also written in a
  note thread hears about a new note once, and re-sharing something with
  somebody who already has it is silent.

## Reading them

The bell shows a count of unread notifications. Opening it lists the most recent
thirty, newest first; clicking one marks it read and goes to the item —
`/view/<id>` for a note, **Shared with me** for a share. **Mark all as read**
clears the count without opening anything.

The list is fetched when the page loads and refreshed once a minute. There is no
live push channel, so a notification can be up to a minute old when it appears —
a deliberate trade, since pushing would mean running a pub/sub that a
single-container install does not otherwise need.

## Choosing where they reach you

**Settings → General → Notifications** has one row per kind of notification and
one column per place it can reach you:

| Place         | What it means                                          |
| ------------- | ------------------------------------------------------ |
| In the app    | The bell, on the web and in the mobile app             |
| By email      | A copy by mail, when the server can send mail          |
| On your phone | The mobile app's own notifications, while it is closed |

The same grid is in the mobile app, under **Settings → General**, and a change
in one shows in the other.

Out of the box every kind rings the bell and reaches your phone. Something
shared with you, and the outcome of a signature request you made, are emailed
too, since they are addressed to you by name; comments and notes are not emailed
unless you turn that on. Turning **In the app** off for a kind also stops it
reaching your phone: the app finds new notifications by asking the server for
the ones the bell keeps.

**By email** is disabled, with a note saying so, unless an administrator has
configured outgoing mail — see the SMTP section of [Environment](env.md). If
mail is removed afterwards the choices stay set but nothing is sent, rather than
failing quietly in a way that looks like lost notifications.

A failed email never affects the action that caused it: the notification is
recorded, the bell still rings, and the mail failure is logged.

## Notes on behaviour

- **Notifications are per person, not per drive.** In
  [simple mode](simple-mode.md) everyone shares one drive but each account keeps
  its own bell, so a note left on the shared drive reaches the drive's owner
  rather than everybody.
- **They outlive the people in them.** The actor's name is stored as it read
  when the event happened, so deleting an account does not blank out the history
  of what it did.
- **Deleting an account removes that account's own notifications.** They are
  addressed to it and mean nothing without it.
