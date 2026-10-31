package game

import (
	"errors"
	"sync"
	"time"

	"github.com/google/uuid"
)

type FourPlayerColor string

const (
	ColorRed    FourPlayerColor = "R" // Bottom
	ColorBlue   FourPlayerColor = "B" // Left
	ColorYellow FourPlayerColor = "Y" // Top
	ColorGreen  FourPlayerColor = "G" // Right
)

type FourPlayerSlot struct {
	UserID      uuid.UUID       `json:"user_id"`
	Username    string          `json:"username"`
	Color       FourPlayerColor `json:"color"`
	TimeMs      int64           `json:"time_ms"`
	Eliminated  bool            `json:"eliminated"`
	Score       int             `json:"score"`
}

type FourPlayerMatch struct {
	mu           sync.Mutex
	ID           uuid.UUID
	Slots        [4]FourPlayerSlot // 0: Red, 1: Blue, 2: Yellow, 3: Green
	CurrentIndex int               // 0 to 3
	IncrementMs  int64
	LastMoveTime time.Time
	IsStarted    bool
	IsOver       bool
	Winner       FourPlayerColor
	BoardState   string // 14x14 board serialized representation or FEN-like notation
	MovesCount   int
}

func NewFourPlayerMatch(id uuid.UUID, players [4]struct {
	ID       uuid.UUID
	Username string
}, baseTimeMs, incMs int64) *FourPlayerMatch {
	colors := [4]FourPlayerColor{ColorRed, ColorBlue, ColorYellow, ColorGreen}
	var slots [4]FourPlayerSlot

	for i := 0; i < 4; i++ {
		slots[i] = FourPlayerSlot{
			UserID:     players[i].ID,
			Username:   players[i].Username,
			Color:      colors[i],
			TimeMs:     baseTimeMs,
			Eliminated: false,
			Score:      0,
		}
	}

	return &FourPlayerMatch{
		ID:           id,
		Slots:        slots,
		CurrentIndex: 0, // Red starts
		IncrementMs:  incMs,
		LastMoveTime: time.Now(),
		IsStarted:    false,
		IsOver:       false,
		BoardState:   "INITIAL_14x14",
	}
}

// CurrentColor returns the color of the player whose turn it is
func (f *FourPlayerMatch) CurrentColor() FourPlayerColor {
	return f.Slots[f.CurrentIndex].Color
}

// ApplyMove validates player and switches turn to next active (non-eliminated) player
func (f *FourPlayerMatch) ApplyMove(playerID uuid.UUID, isPremove bool, newBoardState string) error {
	f.mu.Lock()
	defer f.mu.Unlock()

	if f.IsOver {
		return ErrGameFinished
	}

	curr := &f.Slots[f.CurrentIndex]
	if curr.UserID != playerID {
		return ErrNotYourTurn
	}

	now := time.Now()
	if !f.IsStarted {
		f.IsStarted = true
		f.LastMoveTime = now
	} else {
		var elapsedMs int64
		if isPremove {
			elapsedMs = PremoveDeductionMs
		} else {
			elapsedMs = now.Sub(f.LastMoveTime).Milliseconds()
			if elapsedMs < 0 {
				elapsedMs = 0
			}
		}

		curr.TimeMs -= elapsedMs
		if curr.TimeMs <= 0 {
			curr.TimeMs = 0
			curr.Eliminated = true
			f.advanceTurn()
			f.checkGameOver()
			return ErrTimeout
		}
		curr.TimeMs += f.IncrementMs
	}

	f.LastMoveTime = now
	if newBoardState != "" {
		f.BoardState = newBoardState
	}
	f.MovesCount++

	f.advanceTurn()
	f.checkGameOver()
	return nil
}

// EliminatePlayer marks a player as eliminated (checkmate, timeout, resignation)
func (f *FourPlayerMatch) EliminatePlayer(playerID uuid.UUID) error {
	f.mu.Lock()
	defer f.mu.Unlock()

	found := false
	for i := 0; i < 4; i++ {
		if f.Slots[i].UserID == playerID {
			f.Slots[i].Eliminated = true
			found = true
			break
		}
	}

	if !found {
		return errors.New("player not found in match")
	}

	if f.Slots[f.CurrentIndex].UserID == playerID {
		f.advanceTurn()
	}

	f.checkGameOver()
	return nil
}

func (f *FourPlayerMatch) advanceTurn() {
	activeCount := 0
	for _, slot := range f.Slots {
		if !slot.Eliminated {
			activeCount++
		}
	}
	if activeCount <= 1 {
		return
	}

	for i := 0; i < 4; i++ {
		f.CurrentIndex = (f.CurrentIndex + 1) % 4
		if !f.Slots[f.CurrentIndex].Eliminated {
			break
		}
	}
}

func (f *FourPlayerMatch) checkGameOver() {
	activeCount := 0
	var lastAlive FourPlayerColor
	for _, slot := range f.Slots {
		if !slot.Eliminated {
			activeCount++
			lastAlive = slot.Color
		}
	}

	if activeCount <= 1 {
		f.IsOver = true
		f.Winner = lastAlive
	}
}
