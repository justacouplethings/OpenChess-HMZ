-- Open Chess PostgreSQL Schema Initialization
-- Lead Architect: kyn

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$ BEGIN
    CREATE TYPE chess_variant AS ENUM (
        'bullet',
        'blitz',
        'rapid',
        'daily',
        'crazyhouse',
        'bughouse',
        '4-player'
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
