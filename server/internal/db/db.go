package db

import (
	"context"
	"database/sql"
	"errors"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/justacouplethings/OpenChess-HMZ/server/internal/models"
	_ "github.com/lib/pq"
)

var (
	ErrUserNotFound     = errors.New("user not found")
	ErrGameNotFound     = errors.New("game not found")
	ErrRatingNotFound   = errors.New("rating not found")
	ErrDuplicateUser    = errors.New("username already exists")
)

type Database interface {
	InitSchema(ctx context.Context) error
	CreateUser(ctx context.Context, username, passwordHash string) (*models.User, error)
	GetUserByUsername(ctx context.Context, username string) (*models.User, error)
	GetUserByID(ctx context.Context, id uuid.UUID) (*models.User, error)
	GetRating(ctx context.Context, userID uuid.UUID, variant models.Variant) (*models.Rating, error)
	UpdateRating(ctx context.Context, userID uuid.UUID, variant models.Variant, mu, phi, sigma float64) error
	GetLeaderboard(ctx context.Context, variant models.Variant, limit int) ([]models.Rating, error)
	CreateGame(ctx context.Context, game *models.Game) (*models.Game, error)
	GetGameByID(ctx context.Context, id uuid.UUID) (*models.Game, error)
	ListGamesByUserID(ctx context.Context, userID uuid.UUID, limit, offset int) ([]*models.Game, error)
	Close() error
}

// PostgresDB implements Database via database/sql and github.com/lib/pq
type PostgresDB struct {
	db *sql.DB
}

func NewPostgresDB(connStr string) (*PostgresDB, error) {
	db, err := sql.Open("postgres", connStr)
	if err != nil {
		return nil, err
	}
	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(5 * time.Minute)

	if err := db.Ping(); err != nil {
		return nil, err
	}

	return &PostgresDB{db: db}, nil
}

func (p *PostgresDB) Close() error {
	return p.db.Close()
}

func (p *PostgresDB) InitSchema(ctx context.Context) error {
	query := `
	CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

	DO $$ BEGIN
		CREATE TYPE chess_variant AS ENUM (
			'bullet', 'blitz', 'rapid', 'daily', 'crazyhouse', 'bughouse', '4-player'
		);
	EXCEPTION
		WHEN duplicate_object THEN NULL;
	END $$;

	CREATE TABLE IF NOT EXISTS users (
		id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
		username VARCHAR(32) NOT NULL UNIQUE,
		password_hash TEXT NOT NULL,
		created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
	);

	CREATE TABLE IF NOT EXISTS ratings (
		user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
		variant chess_variant NOT NULL,
		glicko_mu DOUBLE PRECISION NOT NULL DEFAULT 1500.0,
		glicko_phi DOUBLE PRECISION NOT NULL DEFAULT 350.0,
		glicko_sigma DOUBLE PRECISION NOT NULL DEFAULT 0.06,
		updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
		PRIMARY KEY (user_id, variant)
	);

	CREATE TABLE IF NOT EXISTS games (
		id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
		white_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
		black_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
		variant chess_variant NOT NULL,
		pgn TEXT NOT NULL DEFAULT '',
		result VARCHAR(32) NOT NULL DEFAULT '*',
		created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
	);

	CREATE INDEX IF NOT EXISTS idx_games_white_id ON games(white_id);
	CREATE INDEX IF NOT EXISTS idx_games_black_id ON games(black_id);
	CREATE INDEX IF NOT EXISTS idx_games_variant ON games(variant);
	CREATE INDEX IF NOT EXISTS idx_ratings_user_variant ON ratings(user_id, variant);
	`
	_, err := p.db.ExecContext(ctx, query)
	return err
}

func (p *PostgresDB) CreateUser(ctx context.Context, username, passwordHash string) (*models.User, error) {
	user := &models.User{
		ID:           uuid.New(),
		Username:     username,
		PasswordHash: passwordHash,
		CreatedAt:    time.Now().UTC(),
	}

	query := `INSERT INTO users (id, username, password_hash, created_at) VALUES ($1, $2, $3, $4) RETURNING id, created_at`
	err := p.db.QueryRowContext(ctx, query, user.ID, user.Username, user.PasswordHash, user.CreatedAt).Scan(&user.ID, &user.CreatedAt)
	if err != nil {
		return nil, err
	}

	variants := []models.Variant{
		models.VariantBullet,
		models.VariantBlitz,
		models.VariantRapid,
		models.VariantDaily,
		models.VariantCrazyhouse,
		models.VariantBughouse,
		models.VariantFourPlayer,
	}

	for _, v := range variants {
		initRating := models.DefaultRating(user.ID, v)
		_, _ = p.db.ExecContext(ctx, `
			INSERT INTO ratings (user_id, variant, glicko_mu, glicko_phi, glicko_sigma, updated_at)
			VALUES ($1, $2, $3, $4, $5, $6)
			ON CONFLICT (user_id, variant) DO NOTHING
		`, initRating.UserID, string(initRating.Variant), initRating.GlickoMu, initRating.GlickoPhi, initRating.GlickoSigma, initRating.UpdatedAt)
	}

	return user, nil
}

func (p *PostgresDB) GetUserByUsername(ctx context.Context, username string) (*models.User, error) {
	query := `SELECT id, username, password_hash, created_at FROM users WHERE username = $1`
	user := &models.User{}
	err := p.db.QueryRowContext(ctx, query, username).Scan(&user.ID, &user.Username, &user.PasswordHash, &user.CreatedAt)
	if err == sql.ErrNoRows {
		return nil, ErrUserNotFound
	}
	if err != nil {
		return nil, err
	}
	return user, nil
}

func (p *PostgresDB) GetUserByID(ctx context.Context, id uuid.UUID) (*models.User, error) {
	query := `SELECT id, username, password_hash, created_at FROM users WHERE id = $1`
	user := &models.User{}
	err := p.db.QueryRowContext(ctx, query, id).Scan(&user.ID, &user.Username, &user.PasswordHash, &user.CreatedAt)
	if err == sql.ErrNoRows {
		return nil, ErrUserNotFound
	}
	if err != nil {
		return nil, err
	}
	return user, nil
}

func (p *PostgresDB) GetRating(ctx context.Context, userID uuid.UUID, variant models.Variant) (*models.Rating, error) {
	query := `SELECT user_id, variant, glicko_mu, glicko_phi, glicko_sigma, updated_at FROM ratings WHERE user_id = $1 AND variant = $2`
	r := &models.Rating{}
	var variantStr string
	err := p.db.QueryRowContext(ctx, query, userID, string(variant)).Scan(&r.UserID, &variantStr, &r.GlickoMu, &r.GlickoPhi, &r.GlickoSigma, &r.UpdatedAt)
	if err == sql.ErrNoRows {
		def := models.DefaultRating(userID, variant)
		return &def, nil
	}
	if err != nil {
		return nil, err
	}
	r.Variant = models.Variant(variantStr)
	return r, nil
}

func (p *PostgresDB) UpdateRating(ctx context.Context, userID uuid.UUID, variant models.Variant, mu, phi, sigma float64) error {
	query := `
	INSERT INTO ratings (user_id, variant, glicko_mu, glicko_phi, glicko_sigma, updated_at)
	VALUES ($1, $2, $3, $4, $5, NOW())
	ON CONFLICT (user_id, variant)
	DO UPDATE SET glicko_mu = EXCLUDED.glicko_mu, glicko_phi = EXCLUDED.glicko_phi, glicko_sigma = EXCLUDED.glicko_sigma, updated_at = NOW()
	`
	_, err := p.db.ExecContext(ctx, query, userID, string(variant), mu, phi, sigma)
	return err
}

func (p *PostgresDB) GetLeaderboard(ctx context.Context, variant models.Variant, limit int) ([]models.Rating, error) {
	if limit <= 0 {
		limit = 50
	}
	query := `SELECT user_id, variant, glicko_mu, glicko_phi, glicko_sigma, updated_at FROM ratings WHERE variant = $1 ORDER BY glicko_mu DESC LIMIT $2`
	rows, err := p.db.QueryContext(ctx, query, string(variant), limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var ratings []models.Rating
	for rows.Next() {
		var r models.Rating
		var variantStr string
		if err := rows.Scan(&r.UserID, &variantStr, &r.GlickoMu, &r.GlickoPhi, &r.GlickoSigma, &r.UpdatedAt); err != nil {
			return nil, err
		}
		r.Variant = models.Variant(variantStr)
		ratings = append(ratings, r)
	}
	return ratings, nil
}

func (p *PostgresDB) CreateGame(ctx context.Context, game *models.Game) (*models.Game, error) {
	if game.ID == uuid.Nil {
		game.ID = uuid.New()
	}
	if game.CreatedAt.IsZero() {
		game.CreatedAt = time.Now().UTC()
	}
	query := `INSERT INTO games (id, white_id, black_id, variant, pgn, result, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)`
	_, err := p.db.ExecContext(ctx, query, game.ID, game.WhiteID, game.BlackID, string(game.Variant), game.PGN, game.Result, game.CreatedAt)
	if err != nil {
		return nil, err
	}
	return game, nil
}

func (p *PostgresDB) GetGameByID(ctx context.Context, id uuid.UUID) (*models.Game, error) {
	query := `SELECT id, white_id, black_id, variant, pgn, result, created_at FROM games WHERE id = $1`
	game := &models.Game{}
	var variantStr string
	err := p.db.QueryRowContext(ctx, query, id).Scan(&game.ID, &game.WhiteID, &game.BlackID, &variantStr, &game.PGN, &game.Result, &game.CreatedAt)
	if err == sql.ErrNoRows {
		return nil, ErrGameNotFound
	}
	if err != nil {
		return nil, err
	}
	game.Variant = models.Variant(variantStr)
	return game, nil
}

func (p *PostgresDB) ListGamesByUserID(ctx context.Context, userID uuid.UUID, limit, offset int) ([]*models.Game, error) {
	if limit <= 0 {
		limit = 20
	}
	query := `SELECT id, white_id, black_id, variant, pgn, result, created_at FROM games WHERE white_id = $1 OR black_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`
	rows, err := p.db.QueryContext(ctx, query, userID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var games []*models.Game
	for rows.Next() {
		game := &models.Game{}
		var variantStr string
		if err := rows.Scan(&game.ID, &game.WhiteID, &game.BlackID, &variantStr, &game.PGN, &game.Result, &game.CreatedAt); err != nil {
			return nil, err
		}
		game.Variant = models.Variant(variantStr)
		games = append(games, game)
	}
	return games, nil
}

// MemoryDB provides a fully compliant thread-safe in-memory database for unit testing
type MemoryDB struct {
	mu      sync.RWMutex
	users   map[uuid.UUID]*models.User
	byName  map[string]uuid.UUID
	ratings map[string]*models.Rating // key: userID_variant
	games   map[uuid.UUID]*models.Game
}

func NewMemoryDB() *MemoryDB {
	return &MemoryDB{
		users:   make(map[uuid.UUID]*models.User),
		byName:  make(map[string]uuid.UUID),
		ratings: make(map[string]*models.Rating),
		games:   make(map[uuid.UUID]*models.Game),
	}
}

func (m *MemoryDB) InitSchema(ctx context.Context) error {
	return nil
}

func (m *MemoryDB) Close() error {
	return nil
}

func (m *MemoryDB) CreateUser(ctx context.Context, username, passwordHash string) (*models.User, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	if _, exists := m.byName[username]; exists {
		return nil, ErrDuplicateUser
	}

	user := &models.User{
		ID:           uuid.New(),
		Username:     username,
		PasswordHash: passwordHash,
		CreatedAt:    time.Now().UTC(),
	}

	m.users[user.ID] = user
	m.byName[username] = user.ID

	variants := []models.Variant{
		models.VariantBullet,
		models.VariantBlitz,
		models.VariantRapid,
		models.VariantDaily,
		models.VariantCrazyhouse,
		models.VariantBughouse,
		models.VariantFourPlayer,
	}

	for _, v := range variants {
		def := models.DefaultRating(user.ID, v)
		key := user.ID.String() + "_" + string(v)
		m.ratings[key] = &def
	}

	return user, nil
}

func (m *MemoryDB) GetUserByUsername(ctx context.Context, username string) (*models.User, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	id, exists := m.byName[username]
	if !exists {
		return nil, ErrUserNotFound
	}
	return m.users[id], nil
}

func (m *MemoryDB) GetUserByID(ctx context.Context, id uuid.UUID) (*models.User, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	user, exists := m.users[id]
	if !exists {
		return nil, ErrUserNotFound
	}
	return user, nil
}

func (m *MemoryDB) GetRating(ctx context.Context, userID uuid.UUID, variant models.Variant) (*models.Rating, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	key := userID.String() + "_" + string(variant)
	r, exists := m.ratings[key]
	if !exists {
		def := models.DefaultRating(userID, variant)
		return &def, nil
	}
	return r, nil
}

func (m *MemoryDB) UpdateRating(ctx context.Context, userID uuid.UUID, variant models.Variant, mu, phi, sigma float64) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	key := userID.String() + "_" + string(variant)
	m.ratings[key] = &models.Rating{
		UserID:      userID,
		Variant:     variant,
		GlickoMu:    mu,
		GlickoPhi:   phi,
		GlickoSigma: sigma,
		UpdatedAt:   time.Now().UTC(),
	}
	return nil
}

func (m *MemoryDB) GetLeaderboard(ctx context.Context, variant models.Variant, limit int) ([]models.Rating, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	var result []models.Rating
	for _, r := range m.ratings {
		if r.Variant == variant {
			result = append(result, *r)
		}
	}
	return result, nil
}

func (m *MemoryDB) CreateGame(ctx context.Context, game *models.Game) (*models.Game, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	if game.ID == uuid.Nil {
		game.ID = uuid.New()
	}
	if game.CreatedAt.IsZero() {
		game.CreatedAt = time.Now().UTC()
	}
	m.games[game.ID] = game
	return game, nil
}

func (m *MemoryDB) GetGameByID(ctx context.Context, id uuid.UUID) (*models.Game, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	g, exists := m.games[id]
	if !exists {
		return nil, ErrGameNotFound
	}
	return g, nil
}

func (m *MemoryDB) ListGamesByUserID(ctx context.Context, userID uuid.UUID, limit, offset int) ([]*models.Game, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	var result []*models.Game
	for _, g := range m.games {
		if g.WhiteID == userID || g.BlackID == userID {
			result = append(result, g)
		}
	}
	return result, nil
}
