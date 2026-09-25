---
name: save-to-brain
description: >-
  Capture durable facts about the owner from the current conversation into their Agentic OS brain,
  routing each fact to the correct pillar file per the AGENTS.md routing table, dated and
  appended. Use this whenever the owner says "save this to my brain", "update my brain",
  "remember this", "capture that", "add that to my brain", "log this", or asks to record,
  store, or note something about themselves, their people, projects, health, finances,
  travel, routines, tools, or plans. Also use it proactively at the natural end of a conversation
  where meaningful new facts about the owner came up, even if they do not name the skill. Do not
  use it for one off questions, drafting external messages, or content that is not a lasting
  fact about the owner or their world.
---

# Save to Brain

The owner keeps a personal second brain (their Agentic OS) as markdown files in a GitHub repo,
reached through connector tools. This skill takes what was learned about them in a
conversation and files it into the right place so nothing is lost and everything is easy
to find later. The point is a brain that quietly gets richer every time you talk, without
the owner having to organize anything themselves.

The brain is edited through these connector tools when the connector is attached. In Claude Code, edit the
files directly with the same rules, then commit and push: `read_brain`, `list_brain`, `capture_fact`, `add_open_loop`, `append_diary`,
`edit_diary`. Their names describe what they do.

## The one rule that matters most

Only save **durable facts** about the owner or their world, things that will still be true or
useful weeks from now. The brain is a long term memory, not a chat log. If you flood it
with passing chatter it becomes noise and stops being useful, so be selective. When in
doubt about whether something lasts, lean toward skipping it or ask the owner.

**Durable, worth saving:** a new preference or boundary, a person and their details, a
project update, a goal, a habit, a tool or account they set up, a health or travel or
document fact, a place they go, a decision they made, a lesson learned, a task they need to
follow up on.

**Not durable, skip it:** the answer to a one off question, small talk, something you did
for them this session that has no lasting meaning, anything they are clearly just thinking out
loud about. A fact they might change their mind on in an hour is not yet durable.

## How to do it

### 1. Know where things go

Facts are routed by topic to pillar files. Read `AGENTS.md` with `read_brain` to get the
current routing table, since the owner may have added pillars. The routing table as of writing:

| Topic | Pillar file |
| --- | --- |
| Who they are, values, background | identity/about-me.md |
| Goals, growth, things they are improving | identity/growth.md |
| Routines, standing preferences, how they work | context/habits.md |
| Tasks and follow ups | context/open-loops.md |
| Tools, apps, connectors, accounts | context/tools-and-connectors.md |
| Limits, lines not to cross | context/boundaries.md |
| Places they go | context/local-places.md |
| Ideas | memory/ideas.md |
| People | memory/people.md |
| Projects | memory/projects.md |
| Lessons learned | memory/learnings.md |
| Health | records/health.md |
| Travel | records/travel.md |
| Documents | records/documents.md |
| Insurance | records/insurance.md |
| Family | records/family.md |
| A specific client | clients/&lt;name&gt;.md |
| Bills and cards, last 4 digits only | finance/bills-and-cards.md |
| What happened today, a dated event | diary/YYYY/MM/YYYY-MM-DD.md |

If a fact does not fit any pillar cleanly, pick the closest one rather than inventing a new
file, and mention the mismatch to the owner so they can decide.

### 2. Scan the conversation for durable facts

Read back over the conversation and pull out every lasting fact about the owner. Phrase each one
as a short, plain, self contained statement that will still make sense read cold in a year,
so include the context ("the owner's cat Pepper" not just "Pepper"). One fact per line.

### 3. Avoid duplicates

Before writing to a pillar, read it with `read_brain` and check whether the fact, or a
close version of it, is already there. If the brain already knows it, skip it. If the fact
updates or corrects something, add the new dated line rather than trying to erase the old
one, since the brain is append only and the newest dated line wins. This keeps the history
honest and avoids clobbering.

### 4. Show the owner a quick preview, then write

The standing boundary is to show a draft before committing changes on the owner's behalf. Group
the facts you are about to save by pillar and show them a short preview, for example:

```
About to save to your brain:
- identity/about-me.md: the owner retired from teaching in 2015.
- memory/people.md: <name>, their doctor at <clinic>, reachable on weekdays.
- context/open-loops.md: renew the car insurance before it lapses next month.
```

Keep the preview tight, no need for a big report. Then write each fact with the matching
tool:

- General facts about a pillar: `capture_fact(path, text)`. It stamps today's date and
  appends, so pass the plain fact without a date.
- A task or follow up: `add_open_loop(text)`. It files under Open in context/open-loops.md.
- A dated event, something that happened today: `append_diary(text)`. It adds a line under
  today's Log and creates the day's diary if missing.

If the owner is clearly in a hurry or has said to just do it, you can save first and show the
summary right after instead of previewing. Read the room.

### 5. Confirm what landed

After writing, tell the owner in one or two lines what you saved and where, so they trust the
brain is current. If you skipped things as not durable, you can note that briefly too.

## Formatting and safety, non negotiable

These are the brain's operating rules, and breaking them corrupts the brain or
the owner's trust, so hold to them:

- **Dated and append only.** Every fact carries its date and is added, never overwritten.
  The tools handle the dating; your job is to not try to rewrite or delete existing lines.
  The one exception is `edit_diary`, which is only for fixing a diary entry.
- **No secrets, ever.** Never store passwords, full card numbers, full ID or passport
  numbers, API keys, or one time codes. Last 4 digits of a card are fine in
  finance/bills-and-cards.md. If the owner shares a secret, save the harmless context ("added a
  new bank card ending 4417") and leave the secret out.
- **Write plainly, as the owner, no dashes as punctuation.** Match the calm first person voice
  of the existing notes. Avoid using a dash to join clauses.
- **Do not invent.** Only record what the owner actually said or that is clearly true from the
  conversation. Never pad the brain with guesses about them.

## A worked example

Suppose the conversation revealed: the owner has a new doctor named Dr Rahman at the local
clinic, wants to visit family in October, and prefers calls in the morning.

- `capture_fact("memory/people.md", "Dr Rahman is the owner's doctor at the local clinic.")`
- `capture_fact("context/habits.md", "Prefers phone calls in the morning.")`
- `add_open_loop("Plan the October family visit and book travel.")`

Three facts, three pillars, each dated and appended by the tools. That is the whole job.
