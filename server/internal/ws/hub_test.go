package ws_test

import (
	"context"
	"testing"
	"time"

	"github.com/justacouplethings/OpenChess-HMZ/server/internal/db"
	"github.com/justacouplethings/OpenChess-HMZ/server/internal/models"
	"github.com/justacouplethings/OpenChess-HMZ/server/internal/ws"
)

func TestHubLifecycleAndMatchmakingQueue(t *testing.T) {
	database := db.NewMemoryDB()
	ctx := context.Background()
	user1, _ := database.CreateUser(ctx, "player_white", "pass123")
	user2, _ := database.CreateUser(ctx, "player_black", "pass123")

	hub := ws.NewHub(database)
	go hub.Run()
	defer hub.Stop()

	c1 := &ws.Client{
		Hub:      hub,
		Send:     make(chan []byte, 32),
		UserID:   user1.ID,
		Username: user1.Username,
	}

	c2 := &ws.Client{
		Hub:      hub,
		Send:     make(chan []byte, 32),
		UserID:   user2.ID,
		Username: user2.Username,
	}

	hub.Register <- c1
	hub.Register <- c2
	time.Sleep(20 * time.Millisecond)

	// Send JoinQueue for Player 1
	hub.Incoming <- ws.ClientMessage{
		Client: c1,
		Message: models.WSMessage{
			Type: models.MsgJoinQueue,
			Payload: models.JoinQueuePayload{
				Variant:     models.VariantBlitz,
				TimeControl: "3+0",
				BaseTimeMs:  180000,
			},
		},
	}

	// Send JoinQueue for Player 2
	hub.Incoming <- ws.ClientMessage{
		Client: c2,
		Message: models.WSMessage{
			Type: models.MsgJoinQueue,
			Payload: models.JoinQueuePayload{
				Variant:     models.VariantBlitz,
				TimeControl: "3+0",
				BaseTimeMs:  180000,
			},
		},
	}

	time.Sleep(50 * time.Millisecond)

	// Both clients should have received messages (queued and then game_start)
	if len(c1.Send) == 0 || len(c2.Send) == 0 {
		t.Fatalf("Expected messages delivered to clients on match creation")
	}
}
