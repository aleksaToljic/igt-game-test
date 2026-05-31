# IGT Slot Demo

A small 5×3 slot machine built for the IGT PlayDigital frontend game-dev test. Pure TypeScript + PixiJS v8, no game framework.

The focus is code organisation: the "server" math is fully separated from rendering and unit-tested, the spin/stop/win flow runs through an explicit state machine, and the view layer talks to the game core through small interfaces.

## Running

```bash
npm install
npm run dev        # Vite dev server on http://localhost:5173
```

Spin with the **SPIN** button, a tap, or the **Space** key. Pick a stake from the **BET** dropdown.

Other scripts:

```bash
npm run build      # type-check + production build
npm run test       # unit tests (Vitest)
npm run lint       # Biome (lint + format check)
npm run typecheck  # tsc --noEmit
```

A Husky pre-commit hook runs lint + typecheck + tests.

## Tech

- TypeScript — strict, with `noUncheckedIndexedAccess` and `verbatimModuleSyntax`
- PixiJS v8 for rendering
- GSAP for the discrete tweens (reel settle bounce, win count-up, big-win pop)
- Vite · Vitest · Biome · Husky

## How it is organised

```
src/
  config/   game rules as data — reel size, symbols, paytable, paylines, bet levels, timings
  server/   the "backend": seeded RNG, payline evaluation, and a MockGameServer that returns JSON
  core/     framework-free game logic — Game orchestrator, state machine, wallet
  view/     PixiJS scene — reels, control panel, win presentation, big-win overlay
  app/      GameApp wires everything together and owns the PixiJS Application
```

Dependencies point inward: `view`/`app` depend on `core`/`server`/`config`, but `core` never imports `view`. The game core depends on small interfaces (`IGameServer`, `ReelsController`, `GameControls`, `WinCelebration`) instead of concrete Pixi classes, so the whole spin flow is unit-tested with fakes.

## Design decisions

- **The "server" is a separate module returning JSON.** `MockGameServer.getResponseData()` (behind an `IGameServer` interface) builds the stop grid from weighted reel strips, evaluates the win, and returns a `SpinResponseDTO` — the stop positions, winning lines and prize — after a simulated latency. The game treats it exactly like a network call; swapping in a real backend is a one-line change. Win evaluation (`PaylineEvaluator`) is a pure function, so it is unit-tested, including WILD substitution and full-screen wins.
- **Money is integer cents** — no floating-point money. Bet levels divide evenly across the 20 paylines.
- **An explicit state machine** (`idle → spinning → stopping → presenting → idle`) prevents double-spins and guarantees the game returns to idle on every path, including server errors.
- **Reel motion is hand-written; GSAP is only for polish.** An infinite scroll that stops on a server-chosen target is not a tween, so each reel integrates velocity on the ticker (accelerate → spin → decelerate onto the target) using a constant-memory recycled symbol buffer. GSAP handles the settle bounce, the win count-up and the big-win pop.
- **Win animation is a Strategy** behind `IWinAnimation` (`PulseWinAnimation` today), so a Spine-based version can drop in without touching the presenter.
- **Self-documenting code** — clear names and small functions instead of comments; the rationale lives in this README and the commit history.

Symbols are drawn as coloured tiles rather than sourced art — graphics were not the point of the test, and `SymbolView` is the single place to swap in textures.

## Where each requirement lives

| Feature | Code |
|---|---|
| Bet selection (combo box) | `view/ui/BetSelector.ts` |
| Reels 5×3 — start / spin / stop | `view/reels/Reel.ts`, `view/reels/ReelsView.ts` |
| Animated win symbols + paylines + win value | `view/win/WinPresenter.ts`, `view/reels/SymbolView.ts`, `view/ui/ControlPanel.ts` |
| Mocked server (JSON) | `server/MockGameServer.ts`, `server/dto.ts` |
| Win evaluation | `server/PaylineEvaluator.ts` |
| Game flow / state | `core/Game.ts`, `core/GameStateMachine.ts`, `core/Wallet.ts` |

Reel count, rows, paytable and paylines are all data in `config/`, so the 5×3 layout is configurable.

## What I would add next

- A Spine skeletal animation for the big-win celebration (the `IWinAnimation` seam is ready for it).
- Sound (spin / reel-stop / win), reel anticipation on near-misses, and a turbo toggle.
