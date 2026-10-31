package auth

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/justacouplethings/OpenChess-HMZ/server/internal/db"
	"github.com/justacouplethings/OpenChess-HMZ/server/internal/models"
	"golang.org/x/crypto/bcrypt"
)

var (
	ErrInvalidCredentials = errors.New("invalid username or password")
	ErrInvalidToken       = errors.New("invalid or expired token")
	ErrUsernameTaken      = errors.New("username already taken")
	ErrInvalidInput       = errors.New("invalid username or password length")
)

type AuthService struct {
	db        db.Database
	jwtSecret []byte
}

func NewAuthService(database db.Database, secret string) *AuthService {
	if secret == "" {
		secret = "openchess-hmz-default-kyn-secret-key-32b"
	}
	return &AuthService{
		db:        database,
		jwtSecret: []byte(secret),
	}
}

type TokenClaims struct {
	UserID    uuid.UUID `json:"uid"`
	Username  string    `json:"name"`
	ExpiresAt int64     `json:"exp"`
}

func (s *AuthService) HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), 12)
	return string(bytes), err
}

func (s *AuthService) CheckPassword(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}

func (s *AuthService) Register(ctx context.Context, username, password string) (*models.User, string, error) {
	username = strings.TrimSpace(username)
	if len(username) < 3 || len(username) > 30 {
		return nil, "", fmt.Errorf("%w: username must be 3-30 chars", ErrInvalidInput)
	}
	if len(password) < 6 {
		return nil, "", fmt.Errorf("%w: password must be at least 6 chars", ErrInvalidInput)
	}

	existing, _ := s.db.GetUserByUsername(ctx, username)
	if existing != nil {
		return nil, "", ErrUsernameTaken
	}

	hash, err := s.HashPassword(password)
	if err != nil {
		return nil, "", err
	}

	user, err := s.db.CreateUser(ctx, username, hash)
	if err != nil {
		return nil, "", err
	}

	token, err := s.GenerateToken(user)
	if err != nil {
		return nil, "", err
	}

	return user, token, nil
}

func (s *AuthService) Login(ctx context.Context, username, password string) (*models.User, string, error) {
	user, err := s.db.GetUserByUsername(ctx, strings.TrimSpace(username))
	if err != nil {
		return nil, "", ErrInvalidCredentials
	}

	if !s.CheckPassword(password, user.PasswordHash) {
		return nil, "", ErrInvalidCredentials
	}

	token, err := s.GenerateToken(user)
	if err != nil {
		return nil, "", err
	}

	return user, token, nil
}

func (s *AuthService) GenerateToken(user *models.User) (string, error) {
	claims := TokenClaims{
		UserID:    user.ID,
		Username:  user.Username,
		ExpiresAt: time.Now().Add(7 * 24 * time.Hour).Unix(),
	}

	header := base64.RawURLEncoding.EncodeToString([]byte(`{"alg":"HS256","typ":"JWT"}`))
	claimsBytes, err := json.Marshal(claims)
	if err != nil {
		return "", err
	}
	payload := base64.RawURLEncoding.EncodeToString(claimsBytes)

	data := header + "." + payload
	sig := s.sign(data)
	token := data + "." + sig
	return token, nil
}

func (s *AuthService) ValidateToken(token string) (*TokenClaims, error) {
	parts := strings.Split(token, ".")
	if len(parts) != 3 {
		return nil, ErrInvalidToken
	}

	data := parts[0] + "." + parts[1]
	expectedSig := s.sign(data)
	if !hmac.Equal([]byte(parts[2]), []byte(expectedSig)) {
		return nil, ErrInvalidToken
	}

	claimsBytes, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		return nil, ErrInvalidToken
	}

	var claims TokenClaims
	if err := json.Unmarshal(claimsBytes, &claims); err != nil {
		return nil, ErrInvalidToken
	}

	if time.Now().Unix() > claims.ExpiresAt {
		return nil, ErrInvalidToken
	}

	return &claims, nil
}

func (s *AuthService) sign(data string) string {
	h := hmac.New(sha256.New, s.jwtSecret)
	h.Write([]byte(data))
	return base64.RawURLEncoding.EncodeToString(h.Sum(nil))
}
