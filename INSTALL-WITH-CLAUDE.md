# Install Agentic OS with Claude

> **For the person:** give this whole file to Claude and say **"Set this up for me."**
> Best in the **Claude desktop app, Code tab** (Claude can then do almost everything itself).
> In a normal Claude chat it still works; Claude walks you through the clicks.
> You'll need about 15 minutes, a free GitHub account, and a paid Claude plan.

---

## Instructions for Claude

You are setting up **Agentic OS**, a personal AI brain, for the person you are talking to.
Source: https://github.com/msaifullahabdullah/agentic-os-starter (public, MIT).

**How to behave**
- Plain, warm, short. One step at a time. Bold the buttons they must click. Assume they are not technical.
- Start by telling them, in three lines: what they'll get, that it takes about 15 minutes, and that everything lives in their own accounts.
- **Never ask them to paste a password or token into this chat.** Secrets go only into Cloudflare's own secret boxes, typed by them.
- Ask before installing any software on their computer.
- If a step fails, read the exact error, fix that one step, and carry on. Don't restart everything.

**First, decide the path:** can you run shell commands on their computer?
- **Yes** → Path A (automatic).
- **No** → Path B (guided).

---

## Path A: automatic (Claude Code with a terminal)

**A1. Check tools.** Run `git --version`, `node --version` (18 or newer), `gh --version`.
If any are missing, say which and ask to install (macOS: `brew install git node gh`; Windows: `winget install Git.Git OpenJS.NodeJS.LTS GitHub.cli`; Linux: the package manager).

**A2. Sign in to GitHub.** Run `gh auth status`. If not signed in, run `gh auth login --web --git-protocol https` and tell them: "A browser window will open. Click **Authorize**."

**A3. Create their brain (private).**
```
gh repo create my-brain --private --template msaifullahabdullah/agentic-os-starter --clone
```
If that fails because the template flag isn't set, do this instead:
```
git clone --depth 1 https://github.com/msaifullahabdullah/agentic-os-starter my-brain
cd my-brain && rm -rf .git && git init -b main && git add -A && git commit -m "My brain"
gh repo create my-brain --private --source . --push
```
If "my-brain" is taken, use "my-brain-2". Tell them: "Your private brain is created on your GitHub."

**A4. Interview them and fill it in.** Change into the my-brain folder. Read `.claude/skills/onboarding/SKILL.md` and follow it exactly: the eight short rounds of questions, then write every page and `dashboard/settings.json` yourself. Commit and push with `git push`.

**A5. The connector (so the brain works in every Claude chat and the dashboard).** Ask: "Want your brain in every Claude chat and on your phone? About 8 more minutes." If yes:
1. **A key for the connector.** Open https://github.com/settings/personal-access-tokens/new for them and say: name **My brain connector**; expiration **the longest offered**; repository access **Only select repositories**, pick **my-brain**; permissions **Contents: Read and write**; **Generate token**; copy it and keep the tab open. Don't paste it here.
2. **Sign in to Cloudflare.** Run `npx --yes wrangler@latest login`. Say: "A browser window opens. Sign up free if needed, then click **Allow**."
3. **Deploy.** In `my-brain/connector` run:
   ```
   npx --yes wrangler@latest deploy --var REPO_OWNER:<their GitHub username> --var REPO_NAME:my-brain --var BRAIN_NAME:<their first name>
   ```
   Get the username from `gh api user --jq .login`. Note the workers.dev address it prints.
4. **Their two secrets, typed by them.** Say: "In Cloudflare: **Workers & Pages** → **my-brain** → **Settings** → **Variables and Secrets** → **Add** → type **Secret**. Add **GITHUB_TOKEN** (paste the key) and **BRAIN_PASSWORD** (a password of 12+ characters you'll remember, like a short sentence). Click **Deploy**." Wait for "done".
5. **Open the address** from step 3 in their browser. It shows "Your brain is ready" and four steps: **Settings → Connectors → Add custom connector**, name **My-Brain**, paste the link, **Connect**, type the password.
6. **Teach every chat to use it.** Claude **Settings → Profile → personal preferences**, paste:
   > I have a personal brain connected as My-Brain. At the start of each chat, read INDEX.md and AGENTS.md from it and follow them. Save lasting facts about me to it as we talk.
7. Record the connector address (never the password or key) in `context/tools-and-connectors.md`, commit and push.

**A6. Finish** (see "Last steps" below).

---

## Path B: guided (normal Claude chat)

Walk them through, one step at a time, waiting for "done" each time:
1. Open https://github.com/msaifullahabdullah/agentic-os-starter and click **Use this template → Create a new repository**. Name **my-brain**, **Private**, **Create repository**.
   (If there's no Use this template button: click **Code → Download ZIP**, then on GitHub click **New repository** named my-brain, Private, and use **uploading an existing file** to upload the unzipped files.)
2. Open https://claude.ai/code, connect GitHub if asked, pick **my-brain**, start a session.
3. Type **"set me up"** there. Claude interviews them and fills everything in.
4. For every-chat access, type **"connect my brain everywhere"** there and follow it.

---

## Last steps (both paths)

Tell them what's next, in this order:
1. **Dashboard:** open **claude.ai/code** on my-brain and say **"publish my dashboard"**. Bookmark the link, or add it to the phone's home screen.
2. **Daily helpers:** say **"set up my routines"** for the morning briefing, the evening check in and the weekly clean up.
3. **Their apps (optional):** in Claude **Settings → Connectors**, click **Connect** on Gmail, Google Calendar and Google Drive.

Then finish with:
- "Your brain is set up. It knows:" and 5 short bullets from their answers.
- The phrases to remember: **"save this to my brain"**, **"what does my brain know about…"**, **"how do I work?"** (after two weeks).
- "Everything is in your own GitHub and Cloudflare. Only you can open it."
