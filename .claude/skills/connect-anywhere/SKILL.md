---
name: connect-anywhere
description: >-
  Walk the owner through Level 2: deploying their own brain connector so the brain works in any
  Claude chat, on their phone, and in the dashboard. Use when they say "connect my brain
  everywhere", "use my brain in normal Claude", "set up the connector", or "Level 2".
---

# Connect your brain everywhere (about 10 minutes)

Guide one step at a time. Wait for "done" after each. Short sentences, bold the buttons.

**Step 1. Make a key so the connector can write to your brain (2 minutes)**
1. Open **github.com/settings/personal-access-tokens/new**.
2. Token name: **My brain connector**. Expiration: **No expiration** (or the longest offered).
3. Repository access: **Only select repositories**, then pick **this brain's repo**.
4. Permissions: **Repository permissions**, then **Contents**: **Read and write**.
5. Click **Generate token** and copy it. Keep this tab open; you'll paste it in Step 2.
(Tell them: "This key only opens your brain repo, nothing else. Don't paste it anywhere but Cloudflare.")

**Step 2. Deploy your connector (3 minutes)**
1. Open the deploy link from the README (the **Deploy to Cloudflare** button). Sign up for a free Cloudflare account if asked.
2. When it asks for settings, fill in:
   - **REPO_OWNER**: your GitHub username
   - **REPO_NAME**: this brain's repo name
   - **BRAIN_NAME**: your first name
   - **GITHUB_TOKEN**: paste the key from Step 1
   - **BRAIN_PASSWORD**: a password you'll remember, at least 12 characters. A short sentence works well, like "blue kettle on sunday".
3. Click **Deploy**. When it finishes, click **Visit**. You'll see "Your brain is ready".

**Step 3. Add it to Claude (2 minutes)**
Follow the page from Step 2: **Settings**, **Connectors**, **Add custom connector**, name **My-Brain**, paste the link, **Connect**, type your brain password.

**Step 4. Teach every chat to use it (1 minute)**
In Claude: **Settings**, **Profile**, **What personal preferences should Claude consider**. Paste:
> I have a personal brain connected as My-Brain. At the start of each chat, read INDEX.md and AGENTS.md from it and follow them. Save lasting facts about me to it as we talk.

**Step 5. Check it works**
In a new normal chat, ask: **"What does my brain know about me?"** It should answer from your brain.
Then say "publish my dashboard" here again so the dashboard switches on its brain features.

**Step 6. Connect your other apps (1 minute each, optional)**
In Claude: **Settings**, **Connectors**. Click **Connect** on **Gmail**, **Google Calendar** and **Google Drive** if they use them. Then the brain can read their calendar for the morning briefing and file dates from email. Nothing is sent without their yes.

Finish: record the connector URL (not the password or key) in context/tools-and-connectors.md and add a LOG.md line.
If anything fails, ask for the exact message on screen and fix that one step.
