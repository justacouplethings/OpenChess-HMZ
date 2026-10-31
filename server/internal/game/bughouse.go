package game

import (
	"errors"
	"strings"
	"sync"

	"github.com/google/uuid"
	"github.com/justacouplethings/OpenChess-HMZ/server/internal/models"
)

type BughousePlayer struct {
	ID       uuid.UUID
	Username string
	Team     int    // 1 or 2
	BoardID  string // "1" or "2"
	Color    string // "w" or "b"
}

type BughouseMatch struct {
	mu sync.Mutex
	ID uuid.UUID

	Board1 *GameSession
	Board2 *GameSession

	// Team 1: Board1 White (Player A) & Board2 Black (Player D)
	// Team 2: Board1 Black (Player B) & Board2 White (Player C)
	Player1White *BughousePlayer // Team 1, Board 1
	Player1Black *BughousePlayer // Team 2, Board 1
	Player2White *BughousePlayer // Team 2, Board 2
	Player2Black *BughousePlayer // Team 1, Board 2

	IsOver bool
	Winner string // "team1", "team2", "draw"
	Reason string

	// Pocket notification callback
	OnPartnerPocketUpdate func(boardID string, color string, pocket models.PiecePocket, pieceAdded string)
	OnMatchEnd            func(winner string, reason string)
}

func NewBughouseMatch(
	id uuid.UUID,
	p1w, p1b, p2w, p2b *BughousePlayer,
	baseTimeMs, incMs int64,
) *BughouseMatch {
	b1ID := uuid.New()
	b2ID := uuid.New()

	board1 := NewGameSession(b1ID, models.VariantBughouse, p1w.ID, p1b.ID, p1w.Username, p1b.Username, baseTimeMs, incMs)
	board2 := NewGameSession(b2ID, models.VariantBughouse, p2w.ID, p2b.ID, p2w.Username, p2b.Username, baseTimeMs, incMs)

	return &BughouseMatch{
		ID:           id,
		Board1:       board1,
		Board2:       board2,
		Player1White: p1w,
		Player1Black: p1b,
		Player2White: p2w,
		Player2Black: p2b,
		IsOver:       false,
	}
}

// HandleBoardMove processes a move on either board and routes captured pieces to partner's pocket
func (bm *BughouseMatch) HandleBoardMove(boardNum string, playerID uuid.UUID, move models.MovePayload) error {
	bm.mu.Lock()
	defer bm.mu.Unlock()

	if bm.IsOver {
		return ErrGameFinished
	}

	var session *GameSession
	var isBoard1 bool

	if boardNum == "1" || boardNum == bm.Board1.ID.String() {
		session = bm.Board1
		isBoard1 = true
	} else if boardNum == "2" || boardNum == bm.Board2.ID.String() {
		session = bm.Board2
		isBoard1 = false
	} else {
		return errors.New("invalid board number for bughouse match")
	}

	isWhite := playerID == session.WhiteID

	// Apply standard move on this board
	err := session.ApplyMove(playerID, move)
	if err != nil {
		if session.IsOver {
			bm.concludeMatchFromBoard(session, isBoard1)
		}
		return err
	}

	// Capture routing directive:
	// When a piece is captured on Board 1, immediately broadcast a state update to Board 2
	// adding that piece to the partner's "pocket".
	if move.Captured != "" {
		piece := strings.ToLower(move.Captured)
		if isBoard1 {
			if isWhite {
				// Player 1 White (Team 1) captured -> Goes to Player 2 Black (Team 1) on Board 2
				bm.Board2.mu.Lock()
				bm.Board2.BlackPocket[piece]++
				pocketCopy := copyPocket(bm.Board2.BlackPocket)
				bm.Board2.mu.Unlock()

				if bm.OnPartnerPocketUpdate != nil {
					bm.OnPartnerPocketUpdate("2", "b", pocketCopy, piece)
				}
			} else {
				// Player 1 Black (Team 2) captured -> Goes to Player 2 White (Team 2) on Board 2
				bm.Board2.mu.Lock()
				bm.Board2.WhitePocket[piece]++
				pocketCopy := copyPocket(bm.Board2.WhitePocket)
				bm.Board2.mu.Unlock()

				if bm.OnPartnerPocketUpdate != nil {
					bm.OnPartnerPocketUpdate("2", "w", pocketCopy, piece)
				}
			}
		} else {
			if isWhite {
				// Player 2 White (Team 2) captured -> Goes to Player 1 Black (Team 2) on Board 1
				bm.Board1.mu.Lock()
				bm.Board1.BlackPocket[piece]++
				pocketCopy := copyPocket(bm.Board1.BlackPocket)
				bm.Board1.mu.Unlock()

				if bm.OnPartnerPocketUpdate != nil {
					bm.OnPartnerPocketUpdate("1", "b", pocketCopy, piece)
				}
			} else {
				// Player 2 Black (Team 1) captured -> Goes to Player 1 White (Team 1) on Board 1
				bm.Board1.mu.Lock()
				bm.Board1.WhitePocket[piece]++
				pocketCopy := copyPocket(bm.Board1.WhitePocket)
				bm.Board1.mu.Unlock()

				if bm.OnPartnerPocketUpdate != nil {
					bm.OnPartnerPocketUpdate("1", "w", pocketCopy, piece)
				}
			}
		}
	}

	if session.IsOver {
		bm.concludeMatchFromBoard(session, isBoard1)
	}

	return nil
}

// HandleBoardDrop handles dropping a piece on board 1 or 2
func (bm *BughouseMatch) HandleBoardDrop(boardNum string, playerID uuid.UUID, drop models.DropPayload) error {
	bm.mu.Lock()
	defer bm.mu.Unlock()

	if bm.IsOver {
		return ErrGameFinished
	}

	var session *GameSession
	var isBoard1 bool

	if boardNum == "1" || boardNum == bm.Board1.ID.String() {
		session = bm.Board1
		isBoard1 = true
	} else if boardNum == "2" || boardNum == bm.Board2.ID.String() {
		session = bm.Board2
		isBoard1 = false
	} else {
		return errors.New("invalid board number")
	}

	err := session.ApplyDrop(playerID, drop)
	if err != nil {
		if session.IsOver {
			bm.concludeMatchFromBoard(session, isBoard1)
		}
		return err
	}

	return nil
}

// CheckTimeouts checks both boards for clock flags
func (bm *BughouseMatch) CheckTimeouts() bool {
	bm.mu.Lock()
	defer bm.mu.Unlock()

	if bm.IsOver {
		return false
	}

	flagged1, _ := bm.Board1.CheckTimeout()
	if flagged1 {
		bm.concludeMatchFromBoard(bm.Board1, true)
		return true
	}

	flagged2, _ := bm.Board2.CheckTimeout()
	if flagged2 {
		bm.concludeMatchFromBoard(bm.Board2, false)
		return true
	}

	return false
}

func (bm *BughouseMatch) concludeMatchFromBoard(session *GameSession, isBoard1 bool) {
	bm.IsOver = true
	bm.Board1.IsOver = true
	bm.Board2.IsOver = true
	bm.Reason = session.Reason

	// Team 1: Board1 White + Board2 Black
	// Team 2: Board1 Black + Board2 White
	if isBoard1 {
		if session.Result == "1-0" {
			bm.Winner = "team1"
		} else if session.Result == "0-1" {
			bm.Winner = "team2"
		} else {
			bm.Winner = "draw"
		}
	} else {
		if session.Result == "1-0" {
			bm.Winner = "team2"
		} else if session.Result == "0-1" {
			bm.Winner = "team1"
		} else {
			bm.Winner = "draw"
		}
	}

	if bm.OnMatchEnd != nil {
		bm.OnMatchEnd(bm.Winner, bm.Reason)
	}
}

func copyPocket(p models.PiecePocket) models.PiecePocket {
	res := make(models.PiecePocket, len(p))
	for k, v := range p {
		res[k] = v
	}
	return res
}
