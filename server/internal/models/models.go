package models

import (
	"time"

	"github.com/google/uuid"
)

type Variant string

const (
	VariantBullet     Variant = "bullet"
	VariantBlitz      Variant = "blitz"
	VariantRapid      Variant = "rapid"
	VariantDaily      Variant = "daily"
	VariantCrazyhouse Variant = "crazyhouse"
	VariantBughouse   Variant = "bughouse"
	VariantFourPlayer Variant = "4-player"
)

func (v Variant) IsValid() bool {
	switch v {
	case VariantBullet, VariantBlitz, VariantRapid, VariantDaily, VariantCrazyhouse, VariantBughouse, VariantFourPlayer:
		return true
	default:
		return false
	}
}

type User struct {
	ID           uuid.UUID `json:"id"`
	Username     string    `json:"username"`
	PasswordHash string    `json:"-"`
	CreatedAt    time.Time `json:"created_at"`
}

type Rating struct {
	UserID      uuid.UUID `json:"user_id"`
	Variant     Variant   `json:"variant"`
	GlickoMu    float64   `json:"glicko_mu"`
	GlickoPhi   float64   `json:"glicko_phi"`
	GlickoSigma float64   `json:"glicko_sigma"`
	UpdatedAt   time.Time `json:"updated_at"`
}

func DefaultRating(userID uuid.UUID, variant Variant) Rating {
	return Rating{
		UserID:      userID,
		Variant:     variant,
		GlickoMu:    1500.0,
		GlickoPhi:   350.0,
		GlickoSigma: 0.06,
		UpdatedAt:   time.Now().UTC(),
	}
}

type Game struct {
	ID        uuid.UUID `json:"id"`
	WhiteID   uuid.UUID `json:"white_id"`
	BlackID   uuid.UUID `json:"black_id"`
	Variant   Variant   `json:"variant"`
	PGN       string    `json:"pgn"`
	Result    string    `json:"result"`
	CreatedAt time.Time `json:"created_at"`
}

type PiecePocket map[string]int

func NewPiecePocket() PiecePocket {
	return PiecePocket{
		"p": 0,
		"n": 0,
		"b": 0,
		"r": 0,
		"q": 0,
	}
}

type WSMessageType string

const (
	MsgJoinQueue            WSMessageType = "join_queue"
	MsgLeaveQueue           WSMessageType = "leave_queue"
	MsgQueueStatus          WSMessageType = "queue_status"
	MsgGameStart            WSMessageType = "game_start"
	MsgMove                 WSMessageType = "move"
	MsgDropPiece            WSMessageType = "drop_piece"
	MsgTimeSync             WSMessageType = "time_sync"
	MsgGameState            WSMessageType = "game_state"
	MsgResign               WSMessageType = "resign"
	MsgDrawOffer            WSMessageType = "draw_offer"
	MsgDrawResponse         WSMessageType = "draw_response"
	MsgChat                 WSMessageType = "chat"
	MsgGameOver             WSMessageType = "game_over"
	MsgPocketUpdate         WSMessageType = "pocket_update"
	MsgPartnerPocketUpdate  WSMessageType = "partner_pocket_update"
	MsgFourPlayerTurn       WSMessageType = "four_player_turn"
	MsgFourPlayerEliminated WSMessageType = "four_player_eliminated"
	MsgError                WSMessageType = "error"
)

type WSMessage struct {
	Type    WSMessageType `json:"type"`
	Payload interface{}   `json:"payload"`
}

type JoinQueuePayload struct {
	Variant      Variant `json:"variant"`
	TimeControl  string  `json:"time_control"` // e.g. "1+0", "3+0", "3+2", "5+0", "10+0"
	BaseTimeMs   int64   `json:"base_time_ms"`
	IncrementMs  int64   `json:"increment_ms"`
}

type MovePayload struct {
	GameID    string `json:"game_id"`
	BoardID   string `json:"board_id,omitempty"`
	From      string `json:"from"`
	To        string `json:"to"`
	Promotion string `json:"promotion,omitempty"`
	IsPremove bool   `json:"is_premove"`
	FEN       string `json:"fen"`
	SAN       string `json:"san,omitempty"`
	Captured  string `json:"captured,omitempty"` // Piece captured, e.g. "p", "n", "b", "r", "q"
}

type DropPayload struct {
	GameID    string `json:"game_id"`
	BoardID   string `json:"board_id,omitempty"`
	Piece     string `json:"piece"` // "p", "n", "b", "r", "q"
	Square    string `json:"square"` // e.g. "e4"
	IsPremove bool   `json:"is_premove"`
	FEN       string `json:"fen"`
}

type TimeSyncPayload struct {
	GameID          string `json:"game_id"`
	BoardID         string `json:"board_id,omitempty"`
	WhiteTimeMs     int64  `json:"white_time_ms"`
	BlackTimeMs     int64  `json:"black_time_ms"`
	ActiveColor     string `json:"active_color"` // "w" or "b"
	ServerTimestamp int64  `json:"server_timestamp"`
}

type PocketUpdatePayload struct {
	GameID    string      `json:"game_id"`
	BoardID   string      `json:"board_id,omitempty"`
	Color     string      `json:"color"` // "w" or "b"
	Pocket    PiecePocket `json:"pocket"`
	AddedPiece string     `json:"added_piece,omitempty"`
}

type ChatPayload struct {
	GameID    string `json:"game_id"`
	Sender    string `json:"sender"`
	Text      string `json:"text"`
	Timestamp int64  `json:"timestamp"`
	IsTeam    bool   `json:"is_team,omitempty"`
}

type GameOverPayload struct {
	GameID string `json:"game_id"`
	Result string `json:"result"` // "1-0", "0-1", "1/2-1/2"
	Reason string `json:"reason"` // "checkmate", "timeout", "resignation", "draw_agreement", "stalemate"
	Winner string `json:"winner"` // "white", "black", "team1", "team2", "draw"
}
