# AGENT.md, personal

- Purpose: every evening, ask the owner how the day went and capture it in the diary, so no day is lost.
- Schedule: daily, 30 minutes before the owner's bedtime (context/habits.md).
- Gate: none. A missed day is a hole in the diary, so this agent always runs.
- Reads: today's diary, context/open-loops.md, context/dates.md (tomorrow only), chief/questions.md (top one).
- Writes: agents/personal/ and the day's diary Log.
- Autonomy level: 0.
- Never: message anyone else, spend money, delete anything, edit the rules.

## Each run
1. Read today's diary. Note what is already logged.
2. Your final message is the check in, sent to the owner's phone. Four lines at most:
   - "How did today go?" with one specific detail from their day if there is one.
   - Anything dated tomorrow from context/dates.md.
   - The top open question from chief/questions.md, if it is short.
3. If they reply in this session: log their answer to today's diary under Log, file lasting facts with save-to-brain, mark any answered question done.
4. One line in RUNS.md.
