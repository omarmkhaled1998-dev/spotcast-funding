# Claude Code tooling for this repo

Five add-ons for working on SpotCast Funding with Claude Code. Three ship inside the repo and load automatically. Two are local tools you install once on your own machine.

## Ships with the repo

### 1. Playwright MCP (browser eyes and hands)

`.mcp.json` registers Microsoft's Playwright MCP server (`@playwright/mcp`). Claude Code picks it up when you open the project and asks you to approve it once. After that Claude can open the running app, click through pages, take screenshots, and fix what it sees.

Run the dev server first so there is something to look at:

```bash
npm run dev
```

If you use the official Playwright plugin instead, remove the `playwright` entry from `.mcp.json` so the server is not registered twice.

### 2. Humanizer skill

`.claude/skills/humanizer/` holds the Humanizer skill by blader (MIT). It rewrites AI-sounding text so it reads like a person wrote it, based on Wikipedia's "Signs of AI writing" guide. Use it on grant narratives, donor emails, and site copy before they go out.

```text
/humanizer

[paste the text]
```

Source and updates: https://github.com/blader/humanizer

### 3. Marketing Skills Library by Corey Haines

The remaining folders under `.claude/skills/` are the 53 skills from https://github.com/coreyhaines31/marketingskills (MIT). Claude loads the one that matches the task, for example `copywriting`, `emails`, `seo-audit`, `launch`, `public-relations`, or `marketing-plan`. Ask in plain language or name a skill with a slash command, such as `/copywriting`.

Several skills read a product context file at `.agents/product-marketing.md` if it exists. Create it with the `product-marketing` skill once and the others reuse it.

To update the skills later:

```bash
npx skills add coreyhaines31/marketingskills -a claude-code
```

## Install locally

These two sit between Claude Code and the model API, so they run on your machine and are not repo files.

### 4. OmniRoute (fallback when you hit usage limits)

OmniRoute is a local router. Claude Code talks to it, and it forwards requests to whichever provider you connect, switching to another one when the current one fails or hits a limit.

```bash
npm install -g omniroute
omniroute                      # dashboard at http://localhost:20128
omniroute run claude           # launches Claude Code through the router
```

Connect at least one provider in the dashboard first (Providers tab). Note that routing through OmniRoute sends your prompts and code to whichever providers you connect there, so pick them deliberately.

Docs: https://github.com/cheaper-inference/OmniRoute

### 5. Headroom (smaller context, smaller bill)

Headroom compresses tool output, logs, and long JSON before each request so the model reads fewer tokens for the same answer.

```bash
uv tool install --python 3.13 "headroom-ai[all]"   # or: pip install "headroom-ai[proxy]"
headroom wrap claude
```

Set `HEADROOM_BEACON=off` to disable its anonymous usage beacon, or `HEADROOM_OFFLINE=1` to block every outbound call it makes on its own.

Docs: https://docs.headroomlabs.ai
