# Culinex

Multi-dish cooking planner with intelligent scheduling, live cooking mode and AI cooking assistance.

A Demo Day prototype: choose **2–3 dishes**, configure your kitchen and serving time, then follow **one coordinated timeline**. A deterministic local scheduler handles dependencies, equipment capacity, and one cook’s attention. Live Cooking Mode provides countdowns, parallel tasks, completion tracking, and an optional contextual AI assistant.

**Languages:** Russian (default), Kazakh, English. RU / KZ / EN switches immediately without resetting the selection, plan, timers, or progress. Language preference is stored in localStorage; blocked browser storage is handled safely.

## Run locally

Requires Node.js 24 and npm. The same Node major version is selected for Vercel through `package.json`.

```sh
git clone https://github.com/Noob1Minecraft/Culinex.git
cd Culinex
npm ci
npm run dev
```

Open the localhost URL printed by Vite, normally `http://127.0.0.1:5173`.

On the development Windows machine, a stale npm shim exists in the user profile. If `npm` fails with `Cannot find module ... npm-cli.js`, use the installed Node npm directly:

```powershell
& 'C:\Program Files\nodejs\npm.cmd' ci
& 'C:\Program Files\nodejs\npm.cmd' run dev
```

## Build and checks

```sh
npm run typecheck
npm test
npm run build
npm run preview
```

`dist/` is the production frontend. `preview` serves the frontend; it does not run the optional serverless AI endpoint. AI fails gracefully when serving static files only.

Browser tests use installed Google Chrome, with desktop (1440×1000) and mobile (390×844) projects. The full desktop flow additionally checks Home, Recipes, Planner, Schedule, Cooking, AI, and Result at 375, 768, 1280, and 1920 px, checks loaded photos and horizontal overflow, and saves a screenshot of every view. Start the development server first, then run:

```sh
npm run test:e2e
```

Set `E2E_BASE_URL` only if testing a different local port. Failure scenarios stub unavailable responses so they are deterministic with or without local AI credentials. Additional tests stub responses in RU/KK/EN, check context, loading and duplicate-submit protection, and simulate network errors, invalid JSON, empty answers, and rate limiting. Browser screenshots are saved under ignored `artifacts/`; failure traces under ignored `test-results/`. Two workers keep memory usage predictable on a demo laptop.

For an explicit production smoke test, set `E2E_BASE_URL` to the deployed HTTPS URL and run `npm run test:production`. It tests API validation and the complete cooking flow on desktop and mobile, making one real AI request per language on each device. This consumes provider credits. Failed AI requests are recorded as test failures while the test still verifies cooking can reach Result. Tracing is disabled for these live checks.

## Demo Day flow

1. Open Home and switch RU → KZ → EN.
2. Select all three temporary dishes. Continue is disabled until two are selected.
3. Set the desired serving time and kitchen equipment. Try zero pans to demonstrate a recoverable equipment error, then restore one pan.
4. Generate the combined timeline. Follow the shared vertical time rail; tasks starting at the same time are grouped. Inspect durations, active/passive and resource labels, start date/time, and serving date/time.
5. Choose **Start now**. This starts live timers immediately, regardless of the planned clock time.
6. Complete the first two steps to see a passive task running alongside the next hands-on task.
7. Switch language during cooking: the current task, countdown, and completed-step count remain intact.
8. Open Culinex AI. With no key it displays a localized unavailable message; the cooking session continues.
9. Press **Done** for each finished step. Passive steps also require confirmation. For a presentation with no real food, these confirmations let you walk through the demo quickly.
10. Reach Result, switch languages, and finish to start a fresh session.

## Scheduler behavior

- Pure local TypeScript; no AI or network dependency.
- Uses a reverse serial scheduling heuristic: schedule successors first, find the latest feasible slot, then normalize to a combined timeline.
- Stable task IDs determine tie-breaking; changing names, language, or recipe array order does not alter the schedule.
- Positive whole-minute task durations. Missing dependencies, cycles, duplicate IDs, unsupported resource capacity, invalid selections, and invalid time inputs are rejected.
- At most one hands-on task at a time. Passive processes can overlap compatible tasks.
- Counts burners, pans, pots, and oven occupancy. One shared knife and one shared board are assumed.
- Target time means the next feasible occurrence in the device’s local timezone. If today is too close or has passed, the date rolls forward and is shown explicitly.
- Finishing dishes close together is a heuristic, not a globally optimal solution. The three sample dishes finish within five minutes of one another.

## Live Cooking Mode

The saved timeline remains unchanged. The live dispatcher walks that plan in order and starts ready, compatible work using **actual confirmed completion**, so overruns cannot release occupied equipment prematurely. Early confirmation may advance work earlier than its planned offset; actual serving time can differ from the target. Timers use elapsed wall-clock time, clamp to zero, and clean up their intervals. A timer reaching zero requests a doneness check and does not automatically finish the task.

Session state lives in React Context. **Refreshing or closing the tab resets the cooking session**; language preference persists. Keep the tab open throughout the demonstration. The prototype has no alarm sound, background notifications, pause mode, account, database, or session recovery.

## Optional AI

The core flow works without any credentials.

1. Copy `.env.example` to `.env.local`.
2. Set **AI_API_KEY** to a Groq API key on the server. Optionally set **AI_MODEL** (default `openai/gpt-oss-120b`). Legacy OpenAI keys are not used.
3. Restart the development server.

Never use a `VITE_*` credential. Real `.env` files are ignored by Git. The frontend only calls `POST /api/ai`; provider headers and credentials remain server-side.

Request:

```json
{
  "question": "What can I use instead of cream?",
  "language": "en",
  "context": {
    "recipe": "Tomato garden pasta",
    "currentTask": "Drain, toss with sauce, and serve",
    "selectedRecipes": ["Tomato garden pasta", "Crisp green salad"]
  }
}
```

Success: `{ "answer": "..." }`. Errors return `{ "error": "..." }` with 400 (invalid input), 405 (wrong method), 413 (oversized body, including pre-parsed requests), or 503 (unavailable). Only the validated question, language, and cooking context are forwarded. Provider requests time out after 20 seconds; the function has a 30-second maximum duration and the browser a 25-second timeout. Provider errors and credentials are never returned to the client. Responses render as plain text. The AI has no tools and cannot control or regenerate the schedule, dependencies, resources, timers, or progress.

Requests use the official [Groq Chat Completions API](https://console.groq.com/docs/openai) at `https://api.groq.com/openai/v1/chat/completions`. Provider-specific transport is isolated in `server/ai/provider.ts`; request validation is in `server/ai/service.ts`. `api/ai.ts` exports the Node serverless entry point. Vite uses the very same HTTP handler locally: `npm run dev` needs no second backend process. `optional_model_name` in the example file is a placeholder and is treated as unset; the default model is `openai/gpt-oss-120b`, listed among [Groq production models](https://console.groq.com/docs/models). This is an open-weight model hosted by Groq; requests and credentials go only to Groq, not the OpenAI API. GPT-OSS uses low reasoning effort and suppresses reasoning output; the UI receives only the final answer. No tools are enabled.

Live Groq responses in RU, KK and EN were verified locally with `openai/gpt-oss-120b`. Request routing, language/context propagation, loading, and graceful failure are also covered by automated tests. This is a demo endpoint, without production rate limiting or abuse protection.

To explicitly run three small paid-provider checks (RU, KK, EN), configure the local server environment and run `npm run test:ai:live`. They skip when no key is available and never print the key or response text. The checks verify success, nonempty text, and the expected writing system; linguistic quality still needs a human review, especially Kazakh.

If this Windows environment reports `SELF_SIGNED_CERT_IN_CHAIN`, use its trusted system certificate store with Node 24: set `$env:NODE_USE_SYSTEM_CA = "1"` in PowerShell before starting `npm run dev` or the live tests. Keep TLS verification enabled. This is a local certificate configuration; the Vercel function does not need it.

## Vercel deployment preparation

1. In Vercel, import `Noob1Minecraft/Culinex` and select the repository root.
2. Use the **Vite** framework preset, **Node.js 24.x**, install command `npm ci`, build command `npm run build`, and output directory `dist`.
3. In **Project Settings → Environment Variables**, add **AI_API_KEY** as a server secret for Production and the Preview environments where AI should work. Add **AI_MODEL** only to override the default with a model available to your Groq account. Do not use a `VITE_` prefix.
4. Deploy from `main`. After changing environment variables, create a new deployment so the function receives the changes.
5. Verify `/` and `/favicon.svg`, refresh the page, and run through the cooking flow. Test `POST /api/ai` from the AI panel in each UI language; without a key, a JSON 503 and a localized fallback are expected. `GET /api/ai` intentionally returns JSON 405.

The [Vercel Node function convention](https://vercel.com/docs/functions/runtimes/node-js) serves `api/ai.ts`; no persistent server, Express, Render, or database is needed. Helpers stay outside `api/` so they do not become additional function routes. Only server code reads credentials.

All six screens currently use in-memory navigation at `/`; there are no `/planner` or `/cooking` URL routes. Refreshing `/` loads Home, rather than a 404, and resets the session as before. No SPA rewrite is needed. `vercel.json` pins the Vite preset, `npm ci`, `npm run build`, and `dist`. If URL routes are introduced later, add a frontend fallback that preserves `/api/*` and static asset paths, following [Vercel’s Vite routing guidance](https://vercel.com/docs/frameworks/frontend/vite).

Production is hosted at [culinex-rho.vercel.app](https://culinex-rho.vercel.app) in the Vercel project `enginnerus/culinex`, connected to GitHub `main`. `AI_API_KEY` is a sensitive, server-side Production variable; `AI_MODEL` selects the tested Groq model. Run `npm run test:production` against that URL after deployment to verify both device sizes and live AI. No Render service is required. Static-only hosting still supports the complete core demo with graceful AI unavailability.

## Visual design

The interface uses warm charcoal surfaces, warm white text, orange actions, and restrained green status accents. Home is an editorial menu with a featured dish; Recipes uses large food photographs and explicit selection borders/checkmarks. Planner places the selected menu beside serving time and equipment. Schedule groups simultaneous starts on one vertical rail, with a separate start/finish/duration summary. Cooking puts the current instruction and timer first, parallel and upcoming work underneath, and AI/full-plan controls last. Result pairs the completed menu with session totals.

Three temporary food images are bundled in `public/images/` and used by `src/components/RecipeImage.tsx`. They were generated with the built-in image generation tool; exact prompts and paths are recorded in [docs/image-prompts.md](docs/image-prompts.md). They illustrate the demo fixtures and should be replaced with final dish photography. No external image or font service is needed. A recipe's `image` property overrides the demo image mapping, with an emoji fallback for unmapped dishes.

The redesign changes presentation only. Scheduler, session dispatcher, timer hooks, recipe/task data, navigation handlers, and AI server transport remain independent of the visual layer.

## Replacing the temporary recipes

**Edit `src/data/recipes.ts`.** It contains exactly three clearly marked temporary recipes. These are scheduler fixtures, not the final culinary-team instructions.

For each final dish, replace its names, descriptions, visuals/image path, estimated time, difficulty, and task list. Provide `ru`, `kk`, and `en` for every localized field. Keep recipe/task IDs unique, match each task’s `recipeId`, list dependency task IDs, specify positive integer minute durations, and declare all equipment occupied during each task. Mark constant-attention tasks with `requiresAttention: true`.

Use local public assets for reliable offline visuals (`image: '/images/your-dish.jpg'`), or the existing emoji fallback. No scheduler or Cooking Mode changes are required for valid replacement data. Run the scheduler tests again; update fixture-specific assertions (13 steps, sample task counts, five-minute finish spread) when the final recipes arrive.

## Structure

```text
src/
  components/   Cards, language switcher, equipment, timeline, timers, AI dialog
  pages/        Home → Recipes → Planner → Schedule → Cooking → Result
  context/      Session state and live resource-aware dispatcher
  data/         The three replaceable temporary recipes
  hooks/        Wall-clock timer helpers
  i18n/         Central RU / KK / EN dictionaries and safe Russian fallback
  scheduler/    Deterministic scheduling and shared resource rules
  types/        Recipe, schedule, and session contracts
api/ai.ts       Vercel Node function and shared local HTTP adapter
server/ai/      Server-only validation and isolated Groq transport
tests/unit/     Scheduler, live session, timers, localization, API contracts
tests/e2e/      Desktop and mobile Demo Day scenarios
tests/live/     Explicit opt-in RU / KK / EN provider checks
```

React + TypeScript + Vite + Tailwind CSS; lightweight Context state. No authentication, database, payments, gamification, or AI-generated scheduling.
