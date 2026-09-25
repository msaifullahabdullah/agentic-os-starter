---
name: make-agent
description: >-
  Create a new agent in this brain when the owner says "make me an agent for <job>", "I want
  something that watches <thing>", or "add an agent". Builds its folder from agents/_template,
  writes its charter, and gives the owner the routine to switch it on.
---

# Make an agent

1. **Ask three questions, one round:**
   1. What should it watch or do? One sentence.
   2. How often does that thing actually change? (Daily, a few times a week, weekly.)
   3. What should it tell you, and when?
2. **Pick the slowest schedule that still works.** Frequency follows how fast the thing changes, not how important it feels.
3. **Copy agents/_template to agents/<short-name>/** and fill in AGENT.md: purpose, schedule, the gate (one cheap check that decides if there is work today), what it reads, where it writes (only its own folder and outputs/), autonomy level 0, and the never list.
4. **Add a line to chief/board.md** and one to LOG.md.
5. **Give the owner the routine**, exactly like this:
   - Go to **claude.ai/code/routines**, then **New routine**.
   - Repository: this brain. Schedule: <the schedule>.
   - Prompt: "You are the <name> agent. Read CLAUDE.md, AGENTS.md and agents/<name>/AGENT.md, then do one run exactly as AGENT.md says. Commit and push."
   - Attach connectors it needs: <list>.
   If you have a tool that creates routines yourself, use it instead and just tell them it's done.
6. Commit and push. Tell the owner in two lines what the agent does and when they'll first hear from it.
