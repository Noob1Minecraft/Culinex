# Culinex

Multi-dish cooking planner with intelligent scheduling, live cooking mode and AI cooking assistance.

A Demo Day prototype: choose **2–3 dishes**, configure your kitchen and serving time, then follow **one coordinated timeline**. A deterministic local scheduler handles dependencies, equipment capacity, and one cook’s attention. Live Cooking Mode provides countdowns, parallel tasks, completion tracking, and an optional contextual AI assistant.

**Languages:** Russian (default), Kazakh, English. RU / KZ / EN switches immediately without resetting the selection, plan, timers, or progress. Language preference is stored in localStorage; blocked browser storage is handled safely.

## Run locally

Requires Node.js 22.12+ (verified with Node.js 24) and npm.

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

Browser tests use installed Google Chrome, with desktop (1440×1000) and mobile (390×844) projects. Start the development server first, then run:

```sh
npm run test:e2e
```

Set `E2E_BASE_URL` only if testing a different local port. Full-flow tests expect AI credentials to be absent so they can verify the real unavailable response. A separate test stubs a successful Kazakh response and verifies the language/context contract. Browser screenshots are saved under ignored `artifacts/`; failure traces under ignored `test-results/`.

## Demo Day flow

1. Open Home and switch RU → KZ → EN.
2. Select all three temporary dishes. Continue is disabled until two are selected.
3. Set the desired serving time and kitchen equipment. Try zero pans to demonstrate a recoverable equipment error, then restore one pan.
4. Generate the combined timeline. Inspect task times, resource labels, active/passive bars, start date/time, and serving date/time.
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
2. Set **AI_API_KEY** to an OpenAI API key on the server. Optionally set **AI_MODEL** (default `gpt-4.1-mini`). An already-set server environment variable **OPENAI_API_KEY** is accepted as a fallback.
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

Success: `{ "answer": "...", "language": "en" }`. Errors return `{ "error": "..." }` with 400 (invalid input), 405 (wrong method), 413 (oversized raw body), or 503 (unavailable). Request strings and context are bounded. Requests time out; provider errors and credentials are never returned to the client. Responses render as plain text. The AI has no tools and cannot control or regenerate the schedule.

Provider integration uses the [OpenAI Chat Completions API](https://developers.openai.com/api/reference/resources/chat). `api/ai.ts` exports both a testable handler and a Node serverless entry point. Vite mounts the same handler locally. A Node serverless host such as Vercel can serve `api/ai.ts` alongside the Vite build; configure the server environment there. A static host alone supports the complete core demo but not live AI responses.

No live paid-provider response was verified during implementation because no AI key was configured. Request routing, language/context propagation, success rendering with a stubbed response, and graceful real-endpoint failure were tested. This is a demo endpoint, without production rate limiting or abuse protection.

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
api/ai.ts       Optional server-side provider integration
tests/unit/     Scheduler, live session, timers, localization, API contracts
tests/e2e/      Desktop and mobile Demo Day scenarios
```

React + TypeScript + Vite + Tailwind CSS; lightweight Context state. No authentication, database, payments, gamification, or AI-generated scheduling.
