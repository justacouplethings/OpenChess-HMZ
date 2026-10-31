package game_test

import (
	"testing"

	"github.com/google/uuid"
	"github.com/justacouplethings/OpenChess-HMZ/server/internal/game"
	"github.com/justacouplethings/OpenChess-HMZ/server/internal/models"
)

func TestBughouseCrossBoardPocketSync(t *testing.T) {
	matchID := uuid.New()

	// Team 1: p1w (Board 1, White) + p2b (Board 2, Black)
	// Team 2: p1b (Board 1, Black) + p2w (Board 2, White)
	p1w := &game.BughousePlayer{ID: uuid.New(), Username: "Team1_Board1_White", Team: 1, BoardID: "1", Color: "w"}
	p1b := &game.BughousePlayer{ID: uuid.New(), Username: "Team2_Board1_Black", Team: 2, BoardID: "1", Color: "b"}
	p2w := &game.BughousePlayer{ID: uuid.New(), Username: "Team2_Board2_White", Team: 2, BoardID: "2", Color: "w"}
	p2b := &game.BughousePlayer{ID: uuid.New(), Username: "Team1_Board2_Black", Team: 1, BoardID: "2", Color: "b"}

	match := game.NewBughouseMatch(matchID, p1w, p1b, p2w, p2b, 180000, 0)

	var callbackTriggered bool
	var callbackBoard string
	var callbackColor string
	var callbackPiece string

	match.OnPartnerPocketUpdate = func(boardID string, color string, pocket models.PiecePocket, addedPiece string) {
		callbackTriggered = true
		callbackBoard = boardID
		callbackColor = color
		callbackPiece = addedPiece
	}

	// 1. Board 1: White (Player 1W, Team 1) captures a Bishop
	moveCapture := models.MovePayload{
		GameID:   match.Board1.ID.String(),
		From:     "e4",
		To:       "d5",
		Captured: "b",
	}

	err := match.HandleBoardMove("1", p1w.ID, moveCapture)
	if err != nil {
		t.Fatalf("HandleBoardMove failed: %v", err)
	}

	// Verify callback triggered for Board 2, Black player (partner of 1W)
	if !callbackTriggered {
		t.Errorf("Expected OnPartnerPocketUpdate callback to be triggered")
	}
	if callbackBoard != "2" || callbackColor != "b" || callbackPiece != "b" {
		t.Errorf("Expected piece 'b' delivered to Board 2 Black, got Board %s, Color %s, Piece %s",
			callbackBoard, callbackColor, callbackPiece)
	}

	// Verify Board 2 Black pocket directly has the bishop
	_, _, b2BlackPocket := match.Board2.GetStateSnapshot()
	if b2BlackPocket["b"] != 1 {
		t.Errorf("Expected Board 2 Black pocket to have 1 bishop, got %d", b2BlackPocket["b"])
	}

	// 2. Now Player 2 Black drops that bishop on Board 2
	dropMove := models.DropPayload{
		GameID: match.Board2.ID.String(),
		Piece:  "b",
		Square: "e5",
	}

	// Black cannot move first on board 2 because it's White's turn on Board 2
	err = match.HandleBoardDrop("2", p2b.ID, dropMove)
	if err != game.ErrNotYourTurn {
		t.Errorf("Expected ErrNotYourTurn on board 2 for black before white moves, got %v", err)
	}

	// Board 2 White moves first
	err = match.HandleBoardMove("2", p2w.ID, models.MovePayload{From: "e2", To: "e4"})
	if err != nil {
		t.Fatalf("Board 2 White move failed: %v", err)
	}

	// Now Board 2 Black drops the piece received from Board 1!
	err = match.HandleBoardDrop("2", p2b.ID, dropMove)
	if err != nil {
		t.Fatalf("Board 2 Black drop failed: %v", err)
	}

	// Pocket should now be 0
	_, _, b2BlackPocketAfter := match.Board2.GetStateSnapshot()
	if b2BlackPocketAfter["b"] != 0 {
		t.Errorf("Expected pocket bishop to be 0 after drop, got %d", b2BlackPocketAfter["b"])
	}
}
