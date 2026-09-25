# Brain connector

Lets your brain work in any Claude chat, on your phone, and in your dashboard.
It runs free on your own Cloudflare account and opens only with your password.

**Easiest:** in Claude Code, say **"connect my brain everywhere"** and follow the steps.

**By hand:**
1. Make a GitHub token: github.com/settings/personal-access-tokens/new, only your brain repo, Contents read and write.
2. Click the **Deploy to Cloudflare** button in the main README. Fill in your username, repo name, first name, the token, and a password of 12+ characters.
3. Open the link it gives you and follow the 4 steps on that page.

**Safe by design:** the password is stored as a secret and compared in constant time; five wrong tries lock that address for 15 minutes; only the brain's own folders can be written; rules files can't be changed by any tool; sign in renews itself, so you sign in once.
