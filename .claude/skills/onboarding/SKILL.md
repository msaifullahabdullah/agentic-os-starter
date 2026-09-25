---
name: onboarding
description: >-
  Set up a brand new Agentic OS brain by interviewing its owner and filling in every page
  yourself. Use it on the very first conversation (when identity/about-me.md has no dated
  lines), or when the owner says "set me up", "start", "interview me", "fill my brain",
  or "redo my setup". The owner only answers questions; they never edit a file.
---

# Onboarding

The owner answers. You write everything. Aim for 15 to 25 minutes.

## How to run the interview

- **Warm, short, one round at a time.** Each round is 3 to 5 questions, numbered, in plain words. Wait for the answers before the next round.
- **Tell them how it works first**, in three lines: "I'll ask about 8 short rounds of questions. Answer as much or as little as you like; say skip to skip. Then I'll fill your whole brain in and show you."
- **Voice answers are fine.** If they write briefly, don't push. If an answer opens something important, ask one follow up at most.
- **Never ask for passwords, card numbers or ID numbers.** If they offer one, say you won't store it.
- **Adapt.** A retired grandparent and a student get different follow ups. Skip rounds that clearly don't apply (for example study for someone retired).
- After round 4, say how many rounds are left.

## The rounds

**Round 1. You**
1. What's your name, and what should I call you?
2. Where do you live (city and country)? This sets your time zone.
3. Roughly how old are you, and what do you do day to day (work, study, retired, other)?
4. Is faith part of your daily life? If yes, which, and would you like prayer times on your dashboard?

**Round 2. Your days**
1. When do you usually wake up and go to sleep?
2. What does a normal weekday look like, roughly hour by hour?
3. What regular commitments do you have each week (classes, work shifts, sport, family, worship)?
4. When in the day do you do your best focused work?

**Round 3. What you want**
1. What do you most want to achieve in the next year?
2. And in the next 90 days, what would make you proud?
3. What's the one thing that matters most this week?
4. Why do these matter to you? One sentence is enough.

**Round 4. Your people**
1. Who are the most important people in your life? First names and who they are to you.
2. Anyone you're responsible for or who depends on you?
3. Any birthdays, anniversaries or dates I should never let you forget?
(Say: "Share only what you're comfortable with. You can mark anyone private.")

**Round 5. How you work**
1. What usually stops you from starting things?
2. When you fall behind, what tends to be the cause?
3. How do you like to be told things: short and direct, or gentle and detailed? Numbers and charts, or words?
4. What motivates you more: progress you can see, a deadline, someone checking on you, or a reward after?

**Round 6. Daily non-negotiables**
1. What 3 to 5 small things, if you did them every day, would make any day a good day? (For example: pray on time, walk 20 minutes, read 10 pages, phone away at night.)
2. Any rules you want to hold yourself to? (For example: no new projects until a date, no phone after 10pm.)
3. Do you want accountability with a cost? For example a small charity donation for each planned block you miss without a good reason. Yes or no, and how much.

**Round 7. Your world**
1. Current projects, work or study, and any exams or deadlines with dates.
2. Health things you want tracked (appointments, habits). Skip if you'd rather not.
3. Upcoming trips or events with dates.
4. Places you go regularly.

**Round 8. Tools and limits**
1. Which apps do you use: Gmail, Google Calendar, Google Drive, others? (They can be connected to Claude later.)
2. Anything I must never do, store or ask about?
3. Anything else you'd like me to know?

## Then fill everything in yourself

Write every answer to the right page using the routing table in AGENTS.md. Every line dated with today's date, plain words, first person as the owner.

1. **identity/about-me.md**: name, what to call them, city and time zone, age range, what they do, faith.
2. **identity/vision.md**: the one year goal, the 90 day goals, and why.
3. **identity/growth.md**: what stops them starting, what makes them fall behind.
4. **context/habits.md**: wake and sleep times, weekday shape, weekly commitments, best focus time, how they like to be told things, what motivates them.
5. **context/boundaries.md**: things never to do, store or ask.
6. **memory/people.md**: one line per person. Mark private anyone they asked to keep private.
7. **context/dates.md**: every date mentioned, in the page's format, with what to do on the day.
8. **memory/projects.md**, **records/health.md**, **records/travel.md**, **context/local-places.md**, **context/tools-and-connectors.md**: whatever they shared.
9. **context/open-loops.md**: any task they mentioned, under Open.
10. **chief/board.md**: one line per thread of their life (each goal, project, and commitment).
11. **chief/questions.md**: up to five things you still need to know, most important first, each with why it matters.
12. **dashboard/settings.json**: fill it from their answers (see the file for fields): name, city, latitude, longitude, time zone, prayer times on or off, the daily non-negotiables as the Daily Floor, their rules as Deals, the fine (on or off, amount, their currency, valid reasons), and the 90 day goal as the countdown ({label, start: today, date}). Look up the city's latitude, longitude and time zone (like Europe/London) yourself. If they want prayer times, set prayer_method to what is usual where they live (for example fajr 18 and isha 17 in Europe, 18.5 and 90 minutes after maghrib approximated as isha 18.5 in Saudi Arabia, 18.2 and 18.2 in the UAE, 15 and 15 in North America) and asr "hanafi" if they follow the Hanafi school, otherwise "shafi". Put anything they count toward (pages, papers, runs, savings) in progress as {label, value, of}.
13. **diary/** today's page: one Log line, "Set up my brain."
14. **LOG.md**: "Onboarding complete."

Commit and push with the message "Onboarding: my brain is set up".

## Show them what you did

Finish with a short, friendly summary:
- "Your brain now knows:" then 5 to 7 bullet points in their words.
- "Next:" the 3 next steps, in order:
  1. Say **"publish my dashboard"** to get your daily dashboard.
  2. Say **"connect my brain everywhere"** to use it in any Claude chat and on your phone (about 10 minutes).
  3. Switch on the two daily helpers: say **"set up my routines"**.
- "Anything I got wrong? Just tell me and I'll fix it."
