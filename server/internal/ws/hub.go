package ws

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/justacouplethings/OpenChess-HMZ/server/internal/db"
	"github.com/justacouplethings/OpenChess-HMZ/server/internal/game"
	"github.com/justacouplethings/OpenChess-HMZ/server/internal/models"
)

type ClientMessage struct {
	Client  *Client
	Message models.WSMessage
	Raw     []byte
}

type QueueEntry struct {
	Client      *Client
	Variant     models.Variant
	TimeControl string
	BaseTimeMs  int64
	IncrementMs int64
	JoinedAt    time.Time
}

type Hub struct {
	mu sync.RWMutex

	Database db.Database

	Clients    map[*Client]bool
	Register   chan *Client
	Unregister chan *Client
	Incoming   chan ClientMessage

	// Matchmaking queues: key = variant:timeControl
	Queues map[string][]*QueueEntry

	// Active Standard / Crazyhouse Games
	Games map[string]*game.GameSession // gameID -> GameSession

	// Active Bughouse Matches
	BughouseMatches map[string]*game.BughouseMatch // matchID -> BughouseMatch

	// Active 4-Player Matches
	FourPlayerMatches map[string]*game.FourPlayerMatch // matchID -> FourPlayerMatch

	// User to Game mapping
	UserToGame map[uuid.UUID]string // userID -> gameID or matchID

	// Game to Clients mapping
	GameClients map[string][]*Client // gameID -> clients

	stopTicker chan struct{}
}

func NewHub(database db.Database) *Hub {
	return &Hub{
		Database:          database,
		Clients:           make(map[*Client]bool),
		Register:          make(chan *Client),
		Unregister:        make(chan *Client),
		Incoming:          make(chan ClientMessage, 256),
		Queues:            make(map[string][]*QueueEntry),
		Games:             make(map[string]*game.GameSession),
		BughouseMatches:   make(map[string]*game.BughouseMatch),
		FourPlayerMatches: make(map[string]*game.FourPlayerMatch),
		UserToGame:        make(map[uuid.UUID]string),
		GameClients:       make(map[string][]*Client),
		stopTicker:        make(chan struct{}),
	}
}

func (h *Hub) Run() {
	ticker := time.NewTicker(200 * time.Millisecond)
	defer ticker.Stop()

	for {
		select {
		case client := <-h.Register:
			h.mu.Lock()
			h.Clients[client] = true
			h.mu.Unlock()

		case client := <-h.Unregister:
			h.mu.Lock()
			delete(h.Clients, client)
			h.removeFromQueue(client)
			h.mu.Unlock()

		case clientMsg := <-h.Incoming:
			h.handleMessage(clientMsg)

		case <-ticker.C:
			h.checkTimeoutsAndSync()

		case <-h.stopTicker:
			return
		}
	}
}

func (h *Hub) Stop() {
	close(h.stopTicker)
}

func (h *Hub) handleMessage(cm ClientMessage) {
	client := cm.Client
	msg := cm.Message

	switch msg.Type {
	case models.MsgJoinQueue:
		var payload models.JoinQueuePayload
		b, _ := json.Marshal(msg.Payload)
		if err := json.Unmarshal(b, &payload); err != nil {
			return
		}
		h.handleJoinQueue(client, payload)

	case models.MsgLeaveQueue:
		h.mu.Lock()
		h.removeFromQueue(client)
		h.mu.Unlock()
		_ = client.SendJSON(models.WSMessage{
			Type:    models.MsgQueueStatus,
			Payload: map[string]interface{}{"status": "left"},
		})

	case models.MsgMove:
		var payload models.MovePayload
		b, _ := json.Marshal(msg.Payload)
		if err := json.Unmarshal(b, &payload); err != nil {
			return
		}
		h.handleMove(client, payload)

	case models.MsgDropPiece:
		var payload models.DropPayload
		b, _ := json.Marshal(msg.Payload)
		if err := json.Unmarshal(b, &payload); err != nil {
			return
		}
		h.handleDrop(client, payload)

	case models.MsgResign:
		h.handleResign(client)

	case models.MsgDrawOffer:
		h.handleDrawOffer(client)

	case models.MsgDrawResponse:
		var resp struct {
			Accept bool `json:"accept"`
		}
		b, _ := json.Marshal(msg.Payload)
		_ = json.Unmarshal(b, &resp)
		h.handleDrawResponse(client, resp.Accept)

	case models.MsgChat:
		var payload models.ChatPayload
		b, _ := json.Marshal(msg.Payload)
		if err := json.Unmarshal(b, &payload); err != nil {
			return
		}
		payload.Sender = client.Username
		payload.Timestamp = time.Now().UnixMilli()
		h.broadcastToGame(payload.GameID, models.WSMessage{
			Type:    models.MsgChat,
			Payload: payload,
		})
	}
}

func (h *Hub) handleJoinQueue(client *Client, req models.JoinQueuePayload) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if req.Variant == "" {
		req.Variant = models.VariantBlitz
	}
	if req.TimeControl == "" {
		req.TimeControl = "3+0"
	}
	if req.BaseTimeMs <= 0 {
		req.BaseTimeMs = 180000 // 3 minutes default
	}

	queueKey := fmt.Sprintf("%s:%s", req.Variant, req.TimeControl)
	h.removeFromQueue(client)

	entry := &QueueEntry{
		Client:      client,
		Variant:     req.Variant,
		TimeControl: req.TimeControl,
		BaseTimeMs:  req.BaseTimeMs,
		IncrementMs: req.IncrementMs,
		JoinedAt:    time.Now(),
	}

	h.Queues[queueKey] = append(h.Queues[queueKey], entry)

	_ = client.SendJSON(models.WSMessage{
		Type: models.MsgQueueStatus,
		Payload: map[string]interface{}{
			"status":       "queued",
			"variant":      req.Variant,
			"time_control": req.TimeControl,
			"queue_size":   len(h.Queues[queueKey]),
		},
	})

	// Check if match can be formed
	if req.Variant == models.VariantBughouse {
		if len(h.Queues[queueKey]) >= 4 {
			entries := h.Queues[queueKey][:4]
			h.Queues[queueKey] = h.Queues[queueKey][4:]
			h.createBughouseMatch(entries)
		}
	} else if req.Variant == models.VariantFourPlayer {
		if len(h.Queues[queueKey]) >= 4 {
			entries := h.Queues[queueKey][:4]
			h.Queues[queueKey] = h.Queues[queueKey][4:]
			h.createFourPlayerMatch(entries)
		}
	} else {
		// Standard 2-player match (Bullet, Blitz, Rapid, Daily, Crazyhouse)
		if len(h.Queues[queueKey]) >= 2 {
			entries := h.Queues[queueKey][:2]
			h.Queues[queueKey] = h.Queues[queueKey][2:]
			h.createTwoPlayerMatch(entries)
		}
	}
}

func (h *Hub) createTwoPlayerMatch(entries []*QueueEntry) {
	e1 := entries[0]
	e2 := entries[1]

	gameID := uuid.New()
	session := game.NewGameSession(
		gameID,
		e1.Variant,
		e1.Client.UserID,
		e2.Client.UserID,
		e1.Client.Username,
		e2.Client.Username,
		e1.BaseTimeMs,
		e1.IncrementMs,
	)

	gameIDStr := gameID.String()
	h.Games[gameIDStr] = session
	h.UserToGame[e1.Client.UserID] = gameIDStr
	h.UserToGame[e2.Client.UserID] = gameIDStr
	h.GameClients[gameIDStr] = []*Client{e1.Client, e2.Client}

	// Send GameStart to White
	_ = e1.Client.SendJSON(models.WSMessage{
		Type: models.MsgGameStart,
		Payload: map[string]interface{}{
			"game_id":          gameIDStr,
			"variant":          e1.Variant,
			"color":            "w",
			"opponent":         e2.Client.Username,
			"opponent_id":      e2.Client.UserID.String(),
			"white_time_ms":    session.WhiteTimeMs,
			"black_time_ms":    session.BlackTimeMs,
			"fen":              session.FEN,
			"server_timestamp": time.Now().UnixMilli(),
		},
	})

	// Send GameStart to Black
	_ = e2.Client.SendJSON(models.WSMessage{
		Type: models.MsgGameStart,
		Payload: map[string]interface{}{
			"game_id":          gameIDStr,
			"variant":          e2.Variant,
			"color":            "b",
			"opponent":         e1.Client.Username,
			"opponent_id":      e1.Client.UserID.String(),
			"white_time_ms":    session.WhiteTimeMs,
			"black_time_ms":    session.BlackTimeMs,
			"fen":              session.FEN,
			"server_timestamp": time.Now().UnixMilli(),
		},
	})
}

func (h *Hub) createBughouseMatch(entries []*QueueEntry) {
	matchID := uuid.New()
	matchIDStr := matchID.String()

	p1w := &game.BughousePlayer{ID: entries[0].Client.UserID, Username: entries[0].Client.Username, Team: 1, BoardID: "1", Color: "w"}
	p1b := &game.BughousePlayer{ID: entries[1].Client.UserID, Username: entries[1].Client.Username, Team: 2, BoardID: "1", Color: "b"}
	p2w := &game.BughousePlayer{ID: entries[2].Client.UserID, Username: entries[2].Client.Username, Team: 2, BoardID: "2", Color: "w"}
	p2b := &game.BughousePlayer{ID: entries[3].Client.UserID, Username: entries[3].Client.Username, Team: 1, BoardID: "2", Color: "b"}

	match := game.NewBughouseMatch(matchID, p1w, p1b, p2w, p2b, entries[0].BaseTimeMs, entries[0].IncrementMs)

	// Pocket cross-broadcasting directive:
	// "When a piece is captured on Board 1, immediately broadcast a state update to Board 2 adding that piece to the partner's 'pocket'."
	match.OnPartnerPocketUpdate = func(boardID string, color string, pocket models.PiecePocket, addedPiece string) {
		h.broadcastToGame(matchIDStr, models.WSMessage{
			Type: models.MsgPartnerPocketUpdate,
			Payload: models.PocketUpdatePayload{
				GameID:     matchIDStr,
				BoardID:    boardID,
				Color:      color,
				Pocket:     pocket,
				AddedPiece: addedPiece,
			},
		})
	}

	match.OnMatchEnd = func(winner string, reason string) {
		h.broadcastToGame(matchIDStr, models.WSMessage{
			Type: models.MsgGameOver,
			Payload: models.GameOverPayload{
				GameID: matchIDStr,
				Winner: winner,
				Reason: reason,
			},
		})
	}

	h.BughouseMatches[matchIDStr] = match
	clients := make([]*Client, 4)
	for i := 0; i < 4; i++ {
		clients[i] = entries[i].Client
		h.UserToGame[entries[i].Client.UserID] = matchIDStr
	}
	h.GameClients[matchIDStr] = clients

	// Notify all 4 participants
	assignments := []struct {
		client  *Client
		boardID string
		color   string
		team    int
		partner string
	}{
		{entries[0].Client, "1", "w", 1, entries[3].Client.Username},
		{entries[1].Client, "1", "b", 2, entries[2].Client.Username},
		{entries[2].Client, "2", "w", 2, entries[1].Client.Username},
		{entries[3].Client, "2", "b", 1, entries[0].Client.Username},
	}

	for _, a := range assignments {
		_ = a.client.SendJSON(models.WSMessage{
			Type: models.MsgGameStart,
			Payload: map[string]interface{}{
				"game_id":          matchIDStr,
				"variant":          models.VariantBughouse,
				"board_id":         a.boardID,
				"color":            a.color,
				"team":             a.team,
				"partner":          a.partner,
				"base_time_ms":     entries[0].BaseTimeMs,
				"server_timestamp": time.Now().UnixMilli(),
			},
		})
	}
}

func (h *Hub) createFourPlayerMatch(entries []*QueueEntry) {
	matchID := uuid.New()
	matchIDStr := matchID.String()

	var players [4]struct {
		ID       uuid.UUID
		Username string
	}
	clients := make([]*Client, 4)

	for i := 0; i < 4; i++ {
		players[i].ID = entries[i].Client.UserID
		players[i].Username = entries[i].Client.Username
		clients[i] = entries[i].Client
		h.UserToGame[entries[i].Client.UserID] = matchIDStr
	}

	match := game.NewFourPlayerMatch(matchID, players, entries[0].BaseTimeMs, entries[0].IncrementMs)
	h.FourPlayerMatches[matchIDStr] = match
	h.GameClients[matchIDStr] = clients

	colors := []string{"R", "B", "Y", "G"}
	for i, c := range clients {
		_ = c.SendJSON(models.WSMessage{
			Type: models.MsgGameStart,
			Payload: map[string]interface{}{
				"game_id":          matchIDStr,
				"variant":          models.VariantFourPlayer,
				"assigned_color":   colors[i],
				"slots":            match.Slots,
				"active_color":     "R",
				"server_timestamp": time.Now().UnixMilli(),
			},
		})
	}
}

func (h *Hub) handleMove(client *Client, move models.MovePayload) {
	h.mu.Lock()
	gameIDStr, inGame := h.UserToGame[client.UserID]
	if !inGame {
		h.mu.Unlock()
		return
	}

	// 1. Check Standard / Crazyhouse
	if session, exists := h.Games[gameIDStr]; exists {
		h.mu.Unlock()
		err := session.ApplyMove(client.UserID, move)
		if err != nil {
			log.Printf("Move error for user %s: %v", client.Username, err)
			return
		}

		timeSync, wPocket, bPocket := session.GetStateSnapshot()

		h.broadcastToGame(gameIDStr, models.WSMessage{
			Type:    models.MsgMove,
			Payload: move,
		})

		h.broadcastToGame(gameIDStr, models.WSMessage{
			Type:    models.MsgTimeSync,
			Payload: timeSync,
		})

		if session.Variant == models.VariantCrazyhouse {
			h.broadcastToGame(gameIDStr, models.WSMessage{
				Type: models.MsgPocketUpdate,
				Payload: models.PocketUpdatePayload{
					GameID: gameIDStr,
					Color:  "w",
					Pocket: wPocket,
				},
			})
			h.broadcastToGame(gameIDStr, models.WSMessage{
				Type: models.MsgPocketUpdate,
				Payload: models.PocketUpdatePayload{
					GameID: gameIDStr,
					Color:  "b",
					Pocket: bPocket,
				},
			})
		}

		if session.IsOver {
			h.finishGame(session)
		}
		return
	}

	// 2. Check Bughouse
	if bm, exists := h.BughouseMatches[gameIDStr]; exists {
		h.mu.Unlock()
		err := bm.HandleBoardMove(move.BoardID, client.UserID, move)
		if err != nil {
			log.Printf("Bughouse move error: %v", err)
			return
		}

		h.broadcastToGame(gameIDStr, models.WSMessage{
			Type:    models.MsgMove,
			Payload: move,
		})
		return
	}

	// 3. Check 4-Player
	if fpm, exists := h.FourPlayerMatches[gameIDStr]; exists {
		h.mu.Unlock()
		err := fpm.ApplyMove(client.UserID, move.IsPremove, move.FEN)
		if err != nil {
			log.Printf("4-Player move error: %v", err)
			return
		}

		h.broadcastToGame(gameIDStr, models.WSMessage{
			Type:    models.MsgMove,
			Payload: move,
		})

		h.broadcastToGame(gameIDStr, models.WSMessage{
			Type: models.MsgFourPlayerTurn,
			Payload: map[string]interface{}{
				"active_color": fpm.CurrentColor(),
				"slots":        fpm.Slots,
				"is_over":      fpm.IsOver,
				"winner":       fpm.Winner,
			},
		})
		return
	}

	h.mu.Unlock()
}

func (h *Hub) handleDrop(client *Client, drop models.DropPayload) {
	h.mu.Lock()
	gameIDStr, inGame := h.UserToGame[client.UserID]
	if !inGame {
		h.mu.Unlock()
		return
	}

	if session, exists := h.Games[gameIDStr]; exists {
		h.mu.Unlock()
		err := session.ApplyDrop(client.UserID, drop)
		if err != nil {
			log.Printf("Drop error: %v", err)
			return
		}

		timeSync, wPocket, bPocket := session.GetStateSnapshot()

		h.broadcastToGame(gameIDStr, models.WSMessage{
			Type:    models.MsgDropPiece,
			Payload: drop,
		})

		h.broadcastToGame(gameIDStr, models.WSMessage{
			Type:    models.MsgTimeSync,
			Payload: timeSync,
		})

		h.broadcastToGame(gameIDStr, models.WSMessage{
			Type: models.MsgPocketUpdate,
			Payload: models.PocketUpdatePayload{
				GameID: gameIDStr,
				Color:  "w",
				Pocket: wPocket,
			},
		})
		h.broadcastToGame(gameIDStr, models.WSMessage{
			Type: models.MsgPocketUpdate,
			Payload: models.PocketUpdatePayload{
				GameID: gameIDStr,
				Color:  "b",
				Pocket: bPocket,
			},
		})
		return
	}

	if bm, exists := h.BughouseMatches[gameIDStr]; exists {
		h.mu.Unlock()
		err := bm.HandleBoardDrop(drop.BoardID, client.UserID, drop)
		if err != nil {
			log.Printf("Bughouse drop error: %v", err)
			return
		}

		h.broadcastToGame(gameIDStr, models.WSMessage{
			Type:    models.MsgDropPiece,
			Payload: drop,
		})
		return
	}

	h.mu.Unlock()
}

func (h *Hub) handleResign(client *Client) {
	h.mu.Lock()
	gameIDStr, inGame := h.UserToGame[client.UserID]
	if !inGame {
		h.mu.Unlock()
		return
	}

	if session, exists := h.Games[gameIDStr]; exists {
		h.mu.Unlock()
		winner, err := session.Resign(client.UserID)
		if err == nil {
			h.broadcastToGame(gameIDStr, models.WSMessage{
				Type: models.MsgGameOver,
				Payload: models.GameOverPayload{
					GameID: gameIDStr,
					Result: session.Result,
					Reason: "resignation",
					Winner: winner,
				},
			})
			h.finishGame(session)
		}
		return
	}

	h.mu.Unlock()
}

func (h *Hub) handleDrawOffer(client *Client) {
	h.mu.Lock()
	gameIDStr, inGame := h.UserToGame[client.UserID]
	if !inGame {
		h.mu.Unlock()
		return
	}

	if session, exists := h.Games[gameIDStr]; exists {
		h.mu.Unlock()
		if session.OfferDraw(client.UserID) {
			h.broadcastToGame(gameIDStr, models.WSMessage{
				Type: models.MsgDrawOffer,
				Payload: map[string]interface{}{
					"from_user": client.Username,
				},
			})
		}
		return
	}
	h.mu.Unlock()
}

func (h *Hub) handleDrawResponse(client *Client, accept bool) {
	h.mu.Lock()
	gameIDStr, inGame := h.UserToGame[client.UserID]
	if !inGame {
		h.mu.Unlock()
		return
	}

	if session, exists := h.Games[gameIDStr]; exists {
		h.mu.Unlock()
		ended, err := session.RespondDraw(client.UserID, accept)
		if err == nil && ended {
			h.broadcastToGame(gameIDStr, models.WSMessage{
				Type: models.MsgGameOver,
				Payload: models.GameOverPayload{
					GameID: gameIDStr,
					Result: "1/2-1/2",
					Reason: "draw_agreement",
					Winner: "draw",
				},
			})
			h.finishGame(session)
		}
		return
	}
	h.mu.Unlock()
}

func (h *Hub) checkTimeoutsAndSync() {
	h.mu.RLock()
	var standardGames []*game.GameSession
	for _, s := range h.Games {
		standardGames = append(standardGames, s)
	}
	var bughouseMatches []*game.BughouseMatch
	for _, bm := range h.BughouseMatches {
		bughouseMatches = append(bughouseMatches, bm)
	}
	h.mu.RUnlock()

	for _, s := range standardGames {
		timedOut, result := s.CheckTimeout()
		if timedOut {
			winner := "white"
			if result == "0-1" {
				winner = "black"
			}
			h.broadcastToGame(s.ID.String(), models.WSMessage{
				Type: models.MsgGameOver,
				Payload: models.GameOverPayload{
					GameID: s.ID.String(),
					Result: result,
					Reason: "timeout",
					Winner: winner,
				},
			})
			h.finishGame(s)
		}
	}

	for _, bm := range bughouseMatches {
		bm.CheckTimeouts()
	}
}

func (h *Hub) finishGame(session *game.GameSession) {
	if h.Database != nil {
		pgn := session.FormatPGN()
		_, _ = h.Database.CreateGame(context.Background(), &models.Game{
			ID:        session.ID,
			WhiteID:   session.WhiteID,
			BlackID:   session.BlackID,
			Variant:   session.Variant,
			PGN:       pgn,
			Result:    session.Result,
			CreatedAt: time.Now().UTC(),
		})
	}
}

func (h *Hub) broadcastToGame(gameID string, msg models.WSMessage) {
	h.mu.RLock()
	clients := h.GameClients[gameID]
	h.mu.RUnlock()

	for _, c := range clients {
		_ = c.SendJSON(msg)
	}
}

func (h *Hub) removeFromQueue(client *Client) {
	for qk, entries := range h.Queues {
		var filtered []*QueueEntry
		for _, e := range entries {
			if e.Client.UserID != client.UserID {
				filtered = append(filtered, e)
			}
		}
		h.Queues[qk] = filtered
	}
}
