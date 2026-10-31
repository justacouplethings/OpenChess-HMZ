package game_test

import (
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/justacouplethings/OpenChess-HMZ/server/internal/game"
	"github.com/justacouplethings/OpenChess-HMZ/server/internal/models"
)

func TestGameSession(t *testing.T) {
	id := uuid.New()
	whiteID := uuid.New()
	blackID := uuid.New()

	baseTime := int64(60000) // 60 seconds
	session := game.NewGameSession(id, models.VariantBlitz, whiteID, blackID, "WhitePlayer", "BlackPlayer", baseTime, 0)

	// 1. First move starts clock
	move1 := models.MovePayload{
		GameID: id.String(),
		From:   "e2",
		To:     "e4",
		SAN:    "e4",
	}

	err := session.ApplyMove(whiteID, move1)
	if err != nil {
		t.Fatalf("Failed to apply white move: %v", err)
	}

	if session.ActiveColor != "b" {
		t.Errorf("Expected active color b, got %s", session.ActiveColor)
	}

	// 2. Black tries to move out of turn - should fail if white attempts
	err = session.ApplyMove(whiteID, move1)
	if err != game.ErrNotYourTurn {
		t.Errorf("Expected ErrNotYourTurn, got %v", err)
	}

	// 3. Black plays premove: verify exactly 100ms (0.1s) deduction
	blackInitialTime := session.BlackTimeMs
	time.Sleep(50 * time.Millisecond)

	move2 := models.MovePayload{
		GameID:    id.String(),
		From:      "e7",
		To:        "e5",
		SAN:       "e5",
		IsPremove: true,
	}

	err = session.ApplyMove(blackID, move2)
	if err != nil {
		t.Fatalf("Failed to apply black premove: %v", err)
	}

	deducted := blackInitialTime - session.BlackTimeMs
	if deducted != game.PremoveDeductionMs {
		t.Errorf("Expected exactly %d ms deduction for premove, got %d ms", game.PremoveDeductionMs, deducted)
	}

	// 4. Test Resignation
	winner, err := session.Resign(whiteID)
	if err != nil {
		t.Fatalf("Failed to resign: %v", err)
	}
	if winner != "black" || session.Result != "0-1" {
		t.Errorf("Expected black win 0-1, got winner=%s result=%s", winner, session.Result)
	}
}

func TestCrazyhousePockets(t *testing.T) {
	id := uuid.New()
	whiteID := uuid.New()
	blackID := uuid.New()

	session := game.NewGameSession(id, models.VariantCrazyhouse, whiteID, blackID, "W", "B", 60000, 0)
	session.StartGame()

	// White captures black knight
	moveCapture := models.MovePayload{
		GameID:   id.String(),
		From:     "e4",
		To:       "d5",
		Captured: "n",
	}

	err := session.ApplyMove(whiteID, moveCapture)
	if err != nil {
		t.Fatalf("Apply move error: %v", err)
	}

	_, wPocket, _ := session.GetStateSnapshot()
	if wPocket["n"] != 1 {
		t.Errorf("Expected 1 knight in white pocket, got %d", wPocket["n"])
	}

	// Black drops a piece if black has one, or test dropping without piece fails
	dropAttempt := models.DropPayload{
		GameID: id.String(),
		Piece:  "q",
		Square: "e4",
	}
	err = session.ApplyDrop(blackID, dropAttempt)
	if err == nil {
		t.Errorf("Expected error dropping piece not in pocket, got nil")
	}
}
