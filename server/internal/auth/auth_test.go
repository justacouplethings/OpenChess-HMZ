package auth_test

import (
	"context"
	"testing"

	"github.com/justacouplethings/OpenChess-HMZ/server/internal/auth"
	"github.com/justacouplethings/OpenChess-HMZ/server/internal/db"
)

func TestAuthService(t *testing.T) {
	ctx := context.Background()
	database := db.NewMemoryDB()
	svc := auth.NewAuthService(database, "test-secret-32-bytes-long-kyn!")

	// 1. Register
	user, token, err := svc.Register(ctx, "architect_kyn", "securepassword123")
	if err != nil {
		t.Fatalf("Failed to register: %v", err)
	}
	if user.Username != "architect_kyn" {
		t.Errorf("Expected username architect_kyn, got %s", user.Username)
	}
	if token == "" {
		t.Errorf("Expected non-empty JWT token")
	}

	// 2. Token validation
	claims, err := svc.ValidateToken(token)
	if err != nil {
		t.Fatalf("Failed to validate token: %v", err)
	}
	if claims.UserID != user.ID || claims.Username != "architect_kyn" {
		t.Errorf("Claims mismatch: %+v", claims)
	}

	// 3. Login success
	loggedUser, loginToken, err := svc.Login(ctx, "architect_kyn", "securepassword123")
	if err != nil {
		t.Fatalf("Login failed: %v", err)
	}
	if loggedUser.ID != user.ID || loginToken == "" {
		t.Errorf("Login returned invalid user or token")
	}

	// 4. Login fail bad password
	_, _, err = svc.Login(ctx, "architect_kyn", "wrongpassword")
	if err == nil {
		t.Errorf("Expected error on invalid password, got nil")
	}

	// 5. Short password rejected
	_, _, err = svc.Register(ctx, "validuser", "123")
	if err == nil {
		t.Errorf("Expected error for short password, got nil")
	}
}
