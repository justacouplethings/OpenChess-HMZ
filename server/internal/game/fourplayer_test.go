package game_test

import (
	"testing"

	"github.com/google/uuid"
	"github.com/justacouplethings/OpenChess-HMZ/server/internal/game"
)

func TestFourPlayerMatchTurnProgression(t *testing.T) {
	id := uuid.New()
	pRed := uuid.New()
	pBlue := uuid.New()
	pYellow := uuid.New()
	pGreen := uuid.New()

	players := [4]struct {
		ID       uuid.UUID
		Username string
	}{
		{ID: pRed, Username: "RedPlayer"},
		{ID: pBlue, Username: "BluePlayer"},
		{ID: pYellow, Username: "YellowPlayer"},
		{ID: pGreen, Username: "GreenPlayer"},
	}

	match := game.NewFourPlayerMatch(id, players, 180000, 1000)

	// Red should start
	if match.CurrentColor() != game.ColorRed {
		t.Errorf("Expected Red to start, got %s", match.CurrentColor())
	}

	// Red moves -> Turn passes to Blue
	err := match.ApplyMove(pRed, false, "NEW_STATE_1")
	if err != nil {
		t.Fatalf("Red move failed: %v", err)
	}
	if match.CurrentColor() != game.ColorBlue {
		t.Errorf("Expected Blue next, got %s", match.CurrentColor())
	}

	// Blue moves -> Turn passes to Yellow
	err = match.ApplyMove(pBlue, false, "NEW_STATE_2")
	if err != nil {
		t.Fatalf("Blue move failed: %v", err)
	}
	if match.CurrentColor() != game.ColorYellow {
		t.Errorf("Expected Yellow next, got %s", match.CurrentColor())
	}

	// Eliminate Yellow (e.g. checkmate)
	err = match.EliminatePlayer(pYellow)
	if err != nil {
		t.Fatalf("Yellow elimination failed: %v", err)
	}
	// Turn should now skip to Green
	if match.CurrentColor() != game.ColorGreen {
		t.Errorf("Expected Green next after Yellow eliminated, got %s", match.CurrentColor())
	}

	// Green moves -> Turn should wrap back to Red (skipping eliminated Yellow)
	err = match.ApplyMove(pGreen, false, "NEW_STATE_3")
	if err != nil {
		t.Fatalf("Green move failed: %v", err)
	}
	if match.CurrentColor() != game.ColorRed {
		t.Errorf("Expected Red next, got %s", match.CurrentColor())
	}
}
