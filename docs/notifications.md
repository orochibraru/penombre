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

Two rules apply to both:

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

## Emailed copies

Something shared with you is always emailed as well, since it is addressed to
you by name. For everything else, each person can opt in under **Settings →
General → Notifications** to also receive it by email. That is **off by
default**.

The toggle is disabled, with a note saying so, unless an administrator has
configured outgoing mail — see the SMTP section of [Environment](env.md). If
mail is removed afterwards the preference stays set but nothing is sent, rather
than failing quietly in a way that looks like lost notifications.

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
