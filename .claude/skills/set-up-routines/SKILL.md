---
name: set-up-routines
description: >-
  Switch on the brain's three scheduled helpers: the morning briefing, the evening check in, and the weekly clean up.
  Use when the owner says "set up my routines", "turn on the daily briefing", or after onboarding.
---

# Set up routines

1. If you have a tool that creates scheduled routines (for example create_trigger), create all three yourself from chief/routine-daily.md, chief/routine-evening.md and chief/routine-weekly.md, using the owner's wake and sleep times from context/habits.md and their time zone. Then tell them it's done and when the first briefing arrives.
2. Otherwise, walk them through it, one routine at a time:
   1. Open **claude.ai/code/routines**, click **New routine**.
   2. Pick **this brain's repository**.
   3. Schedule: morning briefing **daily, 15 minutes after waking**; evening check in **daily, 30 minutes before bed**; clean up **Sunday morning**.
   4. Paste the prompt from chief/routine-daily.md, chief/routine-evening.md, chief/routine-weekly.md in turn.
   5. Connectors: attach **My-Brain** if they connected it, plus Gmail and Google Calendar to the morning briefing if they use them.
   6. Turn on **notifications** so the briefing reaches their phone.
3. Add a line to context/tools-and-connectors.md and LOG.md.
