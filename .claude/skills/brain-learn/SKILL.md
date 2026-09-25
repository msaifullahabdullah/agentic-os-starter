---
name: brain-learn
description: >-
  Improve the brain from the conversation that just happened: record what worked, what failed, what
  the owner corrected, and what pattern is emerging, as dated observations in the right page. This is
  the learning half of the brain; save-to-brain records facts. Use it at the end of any substantial
  conversation, whenever the owner corrects you, whenever an approach visibly worked or failed, and
  whenever they say "learn from this", "improve", or "remember how". Do not use it for plain facts,
  moods, one off events, or guesses without evidence.
---

# Brain learn

The brain records two things. **Facts** are what is true about the owner's world (save-to-brain).
**Learnings** are what is true about how things go: what worked, what failed, what they keep
correcting. This skill handles learnings. It is what makes the brain improve rather than just grow.

Learning does not need permission. Every line is dated, visible in git, and reversible. Read
chief/LEARNING.md for the full rules; this skill is its working end.

## The one distinction that matters

> A fact is *"Her cat is called Pepper."*
> A learning is *"Explaining a rule to her does not work. Testing her on it does."*

If what you have is the first kind, use save-to-brain instead.

## How to do it

### 1. Look back over the conversation for real signal

Five things are worth recording. Most conversations contain one or two, not five.

- **A correction.** They told you that you were wrong, or redirected you. This is the highest value
  signal in the whole system, because it is them teaching you their actual preference. Record what you
  did, what they wanted instead, and their words if they were specific.
- **Something that visibly worked.** An approach, a format, a way of explaining that landed.
- **Something that visibly failed.** An approach that confused them, annoyed them, or had to be redone.
- **A repeat.** Something you have now seen more than once. Check the brain: if a related observation
  is already filed, this is a pattern, which is more valuable than either sighting alone.
- **A decision and its reasoning.** Not the decision itself, which is a fact, but *why* they chose it,
  because that reasoning predicts future decisions.

Nothing worth recording is a perfectly good outcome. Say so and stop, rather than inventing signal.

### 2. Decide the tier, honestly

- **Seen once** → an observation. File it to the diary via `append_diary`, or to
  `memory/learnings.md` if it is clearly about method rather than about the day.
- **Seen twice or more, with dates you can cite** → a pattern. File it to `memory/learnings.md`, or
  `context/habits.md` if it is about how they work and want to be worked with. Quote the dates.
- **A pattern strong enough that the system should behave differently by default** → do not file it
  as a rule yourself. Write it as a proposal in `chief/inbox.md` and tell them. Changing behaviour is
  their call.

### 3. Write it so it survives being read cold in a year

Two rules, both from `chief/LEARNING.md`, and both non negotiable:

**Point at the evidence.** Never write a pattern you cannot cite dates for. A hunch goes to
`chief/questions.md` as a question for them, not to a pillar as a finding.

**Observe, do not diagnose.** Write what happened and when, never a verdict on who they are.

> Good: *"Three of the last four study sessions ended with a block started and not finished, on 5, 6
> and 7 September 2026."*
> Bad: *"They do not finish what they start."*

The first is checkable and useful. The second is a judgement, and if it is wrong it quietly poisons
every decision made downstream of it.

Write plainly, as the owner, no dashes used as punctuation. Date every line `YYYY-MM-DD`. The connector's
`capture_fact` already prepends the date, so do not write it twice. In Claude Code, write the date yourself.

### 4. File it, then say what you filed

Use `capture_fact` for a pillar, `append_diary` for an observation about the day, `add_open_loop` if
the learning implies something they must actually do. Then tell them in one or two lines what you
recorded and where. Never file silently: un-gated means you do not ask first, not that you hide it.

## Worked example

The owner said *"too long, just give me the number"* twice in one week.

- `capture_fact("context/habits.md", "Prefers the number first and the explanation only if asked. Said so on 2026-10-02 and 2026-10-05.")`

One candidate, one filed. A pass that files nothing is a valid outcome and far better than noise.
