# OpenChess-HMZ

An open-source, 1:1 alternative to Chess.com featuring **zero paywalls, zero daily limits, multi-variant support, and unlimited local Stockfish 16.1 Game Review**.

**Lead Developer / Architect**: `kyn`

---

## 🌟 Key Features

1. **Unlimited Free Game Review ("Coach")**
   - High-depth Stockfish evaluation running directly in the browser via Web Workers.
   - Mathematical precision mapping Centipawns ($cp$) to Win Probability ($W\%$) using:
     $$W = 50 + 50 \times \left(\frac{2}{1 + e^{-0.00368208 \times cp}} - 1\right)$$
   - Full Move Classification:
     - **Brilliant (!!)**: Material sacrifice that maintains or improves engine eval at depth $\ge 18$.
     - **Great (!)**: Critical tactical find.
     - **Best (★)**: Engine's recommended optimal choice.
     - **Excellent (✓)**: Minimal win probability loss ($\le 2\%$).
     - **Good (•)**: Solid positional move.
     - **Book (📖)**: Standard ECO opening database theory.
     - **Inaccuracy (?!)**: Win probability drops by $5\% - 10\%$.
     - **Mistake (?)**: Win probability drops by $10\% - 20\%$.
     - **Blunder (??)**: Win probability drops by $> 20\%$.
   - Interactive game report with CAPS accuracy percentage, move navigation, and coach commentary.

2. **Multi-Variant Board Mechanics**
   - **Standard 8x8**: Bullet, Blitz, Rapid, Daily.
   - **Crazyhouse**: Captured pieces switch colors and enter your side piece pocket, ready to be dropped on any legal square.
   - **Bughouse (2v2)**: Two boards grouped into one match. When a piece is captured on Board 1, it is immediately transferred into the partner's pocket on Board 2!
   - **4-Player Chess (14x14)**: Red, Blue, Yellow, and Green battle on a 14x14 board with 3x3 void corner regions, cycling turns clockwise.

3. **Backend & Real-Time Sync**
   - High-concurrency Golang WebSocket hub.
   - Server-side clock authority with lag compensation (0.1s deduction for client-side premoves).
   - PostgreSQL schema with Glicko-2 rating engine and game PGN archive.

---

## 🚀 Quickstart

### Client (Vite + React + TypeScript + Tailwind)
```bash
cd client
npm install
npm run dev      # Local development server at http://localhost:3000
npm run test     # Run Vitest test suite
npm run build    # Production build for GitHub Pages
```

### Server (Golang + Gorilla WebSockets)
```bash
cd server
go run cmd/server/main.go
# Run all Go tests:
go test -v ./...
```

---

## 🧪 Automated Test Suite
- **Go Backend Tests**:
  - `TestAuthService`: Bcrypt password hashing & JWT authentication.
  - `TestMemoryDatabase`: User CRUD, rating updates, game history.
  - `TestGameSession`: Clock synchronization & 0.1s premove deduction.
  - `TestCrazyhousePockets`: Piece capture transfer to pocket.
  - `TestBughouseCrossBoardPocketSync`: Cross-board pocket routing from Board 1 to Board 2.
  - `TestFourPlayerMatchTurnProgression`: 4-player turn cycling and player elimination.
  - `TestHubLifecycleAndMatchmakingQueue`: Gorilla WebSocket queueing and match setup.
- **Client Vitest Tests**:
  - `Stockfish Win Probability Mathematical Formulas`: Centipawns to Win%, Blunder $>20\%$ drop, Mistake $10\%-20\%$, Brilliant move material sacrifice verification.

---

## 📦 Deployment
Configured for automated deployment to GitHub Pages at:
[https://justacouplethings.github.io/OpenChess-HMZ/](https://justacouplethings.github.io/OpenChess-HMZ/)
via `.github/workflows/deploy.yml`.
