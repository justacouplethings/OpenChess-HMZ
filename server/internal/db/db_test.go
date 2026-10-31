package db_test

import (
	"context"
	"testing"

	"github.com/google/uuid"
	"github.com/justacouplethings/OpenChess-HMZ/server/internal/db"
	"github.com/justacouplethings/OpenChess-HMZ/server/internal/models"
)

func TestMemoryDatabase(t *testing.T) {
	ctx := context.Background()
	database := db.NewMemoryDB()

	// 1. Create User
	user, err := database.CreateUser(ctx, "kyn", "hashedpassword123")
	if err != nil {
		t.Fatalf("Failed to create user: %v", err)
	}
	if user.Username != "kyn" {
		t.Errorf("Expected username kyn, got %s", user.Username)
	}

	// 2. Prevent duplicate username
	_, err = database.CreateUser(ctx, "kyn", "hashedpassword456")
	if err == nil {
		t.Errorf("Expected error for duplicate username, got nil")
	}

	// 3. Fetch user
	fetched, err := database.GetUserByUsername(ctx, "kyn")
	if err != nil {
		t.Fatalf("Failed to get user by username: %v", err)
	}
	if fetched.ID != user.ID {
		t.Errorf("User ID mismatch")
	}

	// 4. Default Rating
	rating, err := database.GetRating(ctx, user.ID, models.VariantBlitz)
	if err != nil {
		t.Fatalf("Failed to get rating: %v", err)
	}
	if rating.GlickoMu != 1500.0 {
		t.Errorf("Expected default rating 1500, got %f", rating.GlickoMu)
	}

	// 5. Update Rating
	err = database.UpdateRating(ctx, user.ID, models.VariantBlitz, 1850.5, 75.0, 0.05)
	if err != nil {
		t.Fatalf("Failed to update rating: %v", err)
	}
	updated, _ := database.GetRating(ctx, user.ID, models.VariantBlitz)
	if updated.GlickoMu != 1850.5 {
		t.Errorf("Expected updated rating 1850.5, got %f", updated.GlickoMu)
	}

	// 6. Game CRUD
	user2, _ := database.CreateUser(ctx, "opponent", "hashpass")
	game := &models.Game{
		ID:      uuid.New(),
		WhiteID: user.ID,
		BlackID: user2.ID,
		Variant: models.VariantBlitz,
		PGN:     "1. e4 e5 2. Nf3 Nc6 1-0",
		Result:  "1-0",
	}

	createdGame, err := database.CreateGame(ctx, game)
	if err != nil {
		t.Fatalf("Failed to create game: %v", err)
	}
	if createdGame.ID != game.ID {
		t.Errorf("Game ID mismatch")
	}

	savedGame, err := database.GetGameByID(ctx, game.ID)
	if err != nil {
		t.Fatalf("Failed to get game by id: %v", err)
	}
	if savedGame.Result != "1-0" {
		t.Errorf("Expected result 1-0, got %s", savedGame.Result)
	}

	games, err := database.ListGamesByUserID(ctx, user.ID, 10, 0)
	if err != nil {
		t.Fatalf("Failed to list games: %v", err)
	}
	if len(games) != 1 {
		t.Errorf("Expected 1 game, got %d", len(games))
	}
}
