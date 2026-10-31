package game

import (
	"errors"
	"fmt"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/justacouplethings/OpenChess-HMZ/server/internal/models"
)

var (
	ErrGameFinished = errors.New("game is already finished")
	ErrNotYourTurn  = errors.New("not your turn")
	ErrInvalidMove  = errors.New("invalid move")
	ErrTimeout      = errors.New("player timed out")
)

const (
	InitialStandardFEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
	PremoveDeductionMs = 100 // Deduct exactly 0.1 seconds for client-side pre-moves
)

type GameSession struct {
	mu            sync.Mutex
	ID            uuid.UUID
	Variant       models.Variant
	WhiteID       uuid.UUID
	BlackID       uuid.UUID
	WhiteUsername string
	BlackUsername string

	FEN         string
	ActiveColor string // "w" or "b"
	HalfMoves   int
	FullMoves   int

	WhiteTimeMs int64
	BlackTimeMs int64
	IncrementMs int64

	LastMoveTime time.Time
	IsStarted    bool
	IsOver       bool
	Result       string // "1-0", "0-1", "1/2-1/2", "*"
	Reason       string // "checkmate", "timeout", "resignation", "draw", "abandoned"

	DrawOfferedBy uuid.UUID
	Moves         []models.MovePayload

	// Crazyhouse pockets
	WhitePocket models.PiecePocket
	BlackPocket models.PiecePocket
}

func NewGameSession(id uuid.UUID, variant models.Variant, whiteID, blackID uuid.UUID, whiteUser, blackUser string, baseMs, incMs int64) *GameSession {
	return &GameSession{
		ID:            id,
		Variant:       variant,
		WhiteID:       whiteID,
		BlackID:       blackID,
		WhiteUsername: whiteUser,
		BlackUsername: blackUser,
		FEN:           InitialStandardFEN,
		ActiveColor:   "w",
		HalfMoves:     0,
		FullMoves:     1,
		WhiteTimeMs:   baseMs,
		BlackTimeMs:   baseMs,
		IncrementMs:   incMs,
		LastMoveTime:  time.Now(),
		IsStarted:     false,
		IsOver:        false,
		Result:        "*",
		WhitePocket:   models.NewPiecePocket(),
		BlackPocket:   models.NewPiecePocket(),
		Moves:         make([]models.MovePayload, 0),
	}
}

// StartGame begins the clock on the first move
func (g *GameSession) StartGame() {
	g.mu.Lock()
	defer g.mu.Unlock()
	g.IsStarted = true
	g.LastMoveTime = time.Now()
}

// ApplyMove handles move processing, server-side clock deduction, premove lag compensation (0.1s), and turn switching
func (g *GameSession) ApplyMove(playerID uuid.UUID, m models.MovePayload) error {
	g.mu.Lock()
	defer g.mu.Unlock()

	if g.IsOver {
		return ErrGameFinished
	}

	// Verify player turn
	isWhite := playerID == g.WhiteID
	isBlack := playerID == g.BlackID
	if !isWhite && !isBlack {
		return errors.New("unauthorized player")
	}

	expectedColor := g.ActiveColor
	if (isWhite && expectedColor != "w") || (isBlack && expectedColor != "b") {
		return ErrNotYourTurn
	}

	now := time.Now()

	// If game wasn't started yet, start it now
	if !g.IsStarted {
		g.IsStarted = true
		g.LastMoveTime = now
	} else {
		// Clock calculation
		var elapsedMs int64
		if m.IsPremove {
			// Directive: Deduct exactly 0.1 seconds for client-side pre-moves
			elapsedMs = PremoveDeductionMs
		} else {
			elapsedMs = now.Sub(g.LastMoveTime).Milliseconds()
			if elapsedMs < 0 {
				elapsedMs = 0
			}
		}

		if isWhite {
			g.WhiteTimeMs -= elapsedMs
			if g.WhiteTimeMs <= 0 {
				g.WhiteTimeMs = 0
				g.IsOver = true
				g.Result = "0-1"
				g.Reason = "timeout"
				return ErrTimeout
			}
			g.WhiteTimeMs += g.IncrementMs
		} else {
			g.BlackTimeMs -= elapsedMs
			if g.BlackTimeMs <= 0 {
				g.BlackTimeMs = 0
				g.IsOver = true
				g.Result = "1-0"
				g.Reason = "timeout"
				return ErrTimeout
			}
			g.BlackTimeMs += g.IncrementMs
		}
	}

	g.LastMoveTime = now

	// Update FEN and history
	if m.FEN != "" {
		g.FEN = m.FEN
	}
	g.Moves = append(g.Moves, m)

	// In Crazyhouse, if a capture occurred, transfer captured piece to player's pocket
	if g.Variant == models.VariantCrazyhouse && m.Captured != "" {
		g.addCapturedToPocket(isWhite, m.Captured)
	}

	// Switch turn
	if g.ActiveColor == "w" {
		g.ActiveColor = "b"
	} else {
		g.ActiveColor = "w"
		g.FullMoves++
	}

	g.DrawOfferedBy = uuid.Nil
	return nil
}

// ApplyDrop handles crazyhouse piece drops
func (g *GameSession) ApplyDrop(playerID uuid.UUID, d models.DropPayload) error {
	g.mu.Lock()
	defer g.mu.Unlock()

	if g.IsOver {
		return ErrGameFinished
	}

	isWhite := playerID == g.WhiteID
	isBlack := playerID == g.BlackID
	if !isWhite && !isBlack {
		return errors.New("unauthorized player")
	}

	expectedColor := g.ActiveColor
	if (isWhite && expectedColor != "w") || (isBlack && expectedColor != "b") {
		return ErrNotYourTurn
	}

	// Check pocket count
	piece := d.Piece
	if isWhite {
		if g.WhitePocket[piece] <= 0 {
			return errors.New("piece not in pocket")
		}
		g.WhitePocket[piece]--
	} else {
		if g.BlackPocket[piece] <= 0 {
			return errors.New("piece not in pocket")
		}
		g.BlackPocket[piece]--
	}

	now := time.Now()
	var elapsedMs int64
	if d.IsPremove {
		elapsedMs = PremoveDeductionMs
	} else {
		elapsedMs = now.Sub(g.LastMoveTime).Milliseconds()
		if elapsedMs < 0 {
			elapsedMs = 0
		}
	}

	if isWhite {
		g.WhiteTimeMs -= elapsedMs
		if g.WhiteTimeMs <= 0 {
			g.WhiteTimeMs = 0
			g.IsOver = true
			g.Result = "0-1"
			g.Reason = "timeout"
			return ErrTimeout
		}
		g.WhiteTimeMs += g.IncrementMs
	} else {
		g.BlackTimeMs -= elapsedMs
		if g.BlackTimeMs <= 0 {
			g.BlackTimeMs = 0
			g.IsOver = true
			g.Result = "1-0"
			g.Reason = "timeout"
			return ErrTimeout
		}
		g.BlackTimeMs += g.IncrementMs
	}

	g.LastMoveTime = now
	if d.FEN != "" {
		g.FEN = d.FEN
	}

	// Switch turn
	if g.ActiveColor == "w" {
		g.ActiveColor = "b"
	} else {
		g.ActiveColor = "w"
		g.FullMoves++
	}

	return nil
}

func (g *GameSession) addCapturedToPocket(byWhite bool, piece string) {
	// Standardize to lowercase
	p := piece
	if len(p) > 0 {
		if p[0] >= 'A' && p[0] <= 'Z' {
			p = string(p[0] + 32)
		}
	}
	if byWhite {
		g.WhitePocket[p]++
	} else {
		g.BlackPocket[p]++
	}
}

// Resign handles a player resigning
func (g *GameSession) Resign(playerID uuid.UUID) (string, error) {
	g.mu.Lock()
	defer g.mu.Unlock()

	if g.IsOver {
		return "", ErrGameFinished
	}

	g.IsOver = true
	g.Reason = "resignation"
	if playerID == g.WhiteID {
		g.Result = "0-1"
		return "black", nil
	} else if playerID == g.BlackID {
		g.Result = "1-0"
		return "white", nil
	}
	return "", errors.New("unknown player")
}

// OfferDraw offers a draw
func (g *GameSession) OfferDraw(playerID uuid.UUID) bool {
	g.mu.Lock()
	defer g.mu.Unlock()

	if g.IsOver {
		return false
	}
	g.DrawOfferedBy = playerID
	return true
}

// RespondDraw accepts or declines a draw
func (g *GameSession) RespondDraw(playerID uuid.UUID, accept bool) (bool, error) {
	g.mu.Lock()
	defer g.mu.Unlock()

	if g.IsOver {
		return false, ErrGameFinished
	}

	if g.DrawOfferedBy == uuid.Nil || g.DrawOfferedBy == playerID {
		return false, errors.New("no active draw offer from opponent")
	}

	if accept {
		g.IsOver = true
		g.Result = "1/2-1/2"
		g.Reason = "draw_agreement"
		return true, nil
	}

	g.DrawOfferedBy = uuid.Nil
	return false, nil
}

// CheckTimeout updates clocks and flags if time has expired
func (g *GameSession) CheckTimeout() (bool, string) {
	g.mu.Lock()
	defer g.mu.Unlock()

	if g.IsOver || !g.IsStarted {
		return false, ""
	}

	now := time.Now()
	elapsedMs := now.Sub(g.LastMoveTime).Milliseconds()

	if g.ActiveColor == "w" {
		currentRemaining := g.WhiteTimeMs - elapsedMs
		if currentRemaining <= 0 {
			g.WhiteTimeMs = 0
			g.IsOver = true
			g.Result = "0-1"
			g.Reason = "timeout"
			return true, "0-1"
		}
	} else {
		currentRemaining := g.BlackTimeMs - elapsedMs
		if currentRemaining <= 0 {
			g.BlackTimeMs = 0
			g.IsOver = true
			g.Result = "1-0"
			g.Reason = "timeout"
			return true, "1-0"
		}
	}

	return false, ""
}

// GetStateSnapshot returns safe copy of the current game state
func (g *GameSession) GetStateSnapshot() (models.TimeSyncPayload, models.PiecePocket, models.PiecePocket) {
	g.mu.Lock()
	defer g.mu.Unlock()

	syncPayload := models.TimeSyncPayload{
		GameID:          g.ID.String(),
		WhiteTimeMs:     g.WhiteTimeMs,
		BlackTimeMs:     g.BlackTimeMs,
		ActiveColor:     g.ActiveColor,
		ServerTimestamp: time.Now().UnixMilli(),
	}

	wPocket := make(models.PiecePocket)
	for k, v := range g.WhitePocket {
		wPocket[k] = v
	}

	bPocket := make(models.PiecePocket)
	for k, v := range g.BlackPocket {
		bPocket[k] = v
	}

	return syncPayload, wPocket, bPocket
}

// FormatPGN creates a valid standard PGN string
func (g *GameSession) FormatPGN() string {
	g.mu.Lock()
	defer g.mu.Unlock()

	header := fmt.Sprintf(`[Event "OpenChess Online Game"]
[Site "OpenChess-HMZ"]
[Date "%s"]
[White "%s"]
[Black "%s"]
[Result "%s"]
[Variant "%s"]

`, time.Now().Format("2006.01.02"), g.WhiteUsername, g.BlackUsername, g.Result, string(g.Variant))

	movesStr := ""
	for i, m := range g.Moves {
		if i%2 == 0 {
			movesStr += fmt.Sprintf("%d. ", (i/2)+1)
		}
		if m.SAN != "" {
			movesStr += m.SAN + " "
		} else {
			movesStr += fmt.Sprintf("%s%s ", m.From, m.To)
		}
	}

	if g.Result != "" && g.Result != "*" {
		movesStr += g.Result
	}

	return header + movesStr
}
