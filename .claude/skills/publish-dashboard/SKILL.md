---
name: publish-dashboard
description: >-
  Publish the owner's daily dashboard as their own private page, built from dashboard/dashboard.html
  and dashboard/settings.json. Use when they say "publish my dashboard", "make my dashboard",
  "update my dashboard", or change their settings.
---

# Publish the dashboard

1. **Check settings.** Read dashboard/settings.json. If "name" is empty, onboarding hasn't run: run the onboarding skill first.
2. **Build the page.** Read dashboard/dashboard.html. Replace the line `var SETTINGS = {};` with `var SETTINGS = <the contents of settings.json>;`. Write the result to dashboard/build/dashboard.html (create the folder if needed).
3. **Publish it** with the Artifact tool:
   - file: dashboard/build/dashboard.html
   - icon: dashboard
   - capabilities: `{"mcp":{"servers":[{"server":"My-Brain","tools":["read_brain","list_brain","append_diary","add_open_loop"]}]},"sample":{},"db":{}}`
   - If the owner has not connected their brain yet (Level 2), publish with only `{"sample":{},"db":{}}`. The dashboard still works; brain features switch on after connecting and republishing.
   - If this dashboard was published before (its URL is in context/tools-and-connectors.md), update that same URL instead of making a new one.
4. **Record the URL** in context/tools-and-connectors.md, dated.
5. **If there is no Artifact tool** in this session, say plainly: "Publishing needs Claude Code on the web (claude.ai/code). Open this brain there and say publish my dashboard again." Don't try another way.
6. **Tell the owner:** the link, then "Bookmark it or add it to your home screen. Everything you tick is saved. It works on your phone too."
