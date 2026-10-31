package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
	"github.com/justacouplethings/OpenChess-HMZ/server/internal/auth"
	"github.com/justacouplethings/OpenChess-HMZ/server/internal/db"
	"github.com/justacouplethings/OpenChess-HMZ/server/internal/models"
	"github.com/justacouplethings/OpenChess-HMZ/server/internal/ws"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all origins for Open Chess static SPA & development
	},
}

func enableCORS(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		next(w, r)
	}
}

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "openchess-hmz-super-secret-key-kyn-2026"
	}

	dbURL := os.Getenv("DATABASE_URL")
	var database db.Database

	if dbURL != "" {
		pg, err := db.NewPostgresDB(dbURL)
		if err != nil {
			log.Printf("Warning: Could not connect to PostgreSQL (%v). Falling back to MemoryDB.", err)
			database = db.NewMemoryDB()
		} else {
			log.Println("Connected to PostgreSQL successfully.")
			ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
			defer cancel()
			if err := pg.InitSchema(ctx); err != nil {
				log.Printf("Notice: Schema init: %v", err)
			}
			database = pg
		}
	} else {
		log.Println("No DATABASE_URL supplied; using thread-safe MemoryDB.")
		database = db.NewMemoryDB()
	}

	authService := auth.NewAuthService(database, jwtSecret)
	hub := ws.NewHub(database)
	go hub.Run()

	mux := http.NewServeMux()

	// Health Check
	mux.HandleFunc("/health", enableCORS(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"status": "healthy",
			"time":   time.Now().UTC().Format(time.RFC3339),
			"lead":   "kyn",
		})
	}))

	// Register
	mux.HandleFunc("/api/auth/register", enableCORS(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		var req struct {
			Username string `json:"username"`
			Password string `json:"password"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid JSON payload", http.StatusBadRequest)
			return
		}

		user, token, err := authService.Register(r.Context(), req.Username, req.Password)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"user":  user,
			"token": token,
		})
	}))

	// Login
	mux.HandleFunc("/api/auth/login", enableCORS(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		var req struct {
			Username string `json:"username"`
			Password string `json:"password"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid JSON payload", http.StatusBadRequest)
			return
		}

		user, token, err := authService.Login(r.Context(), req.Username, req.Password)
		if err != nil {
			http.Error(w, err.Error(), http.StatusUnauthorized)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"user":  user,
			"token": token,
		})
	}))

	// Me (current authenticated user)
	mux.HandleFunc("/api/auth/me", enableCORS(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		token := strings.TrimPrefix(authHeader, "Bearer ")
		claims, err := authService.ValidateToken(token)
		if err != nil {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		user, err := database.GetUserByID(r.Context(), claims.UserID)
		if err != nil {
			http.Error(w, "User not found", http.StatusNotFound)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(user)
	}))

	// Leaderboard
	mux.HandleFunc("/api/leaderboard", enableCORS(func(w http.ResponseWriter, r *http.Request) {
		variantStr := r.URL.Query().Get("variant")
		if variantStr == "" {
			variantStr = "blitz"
		}
		limitStr := r.URL.Query().Get("limit")
		limit := 50
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 {
			limit = l
		}

		leaderboard, err := database.GetLeaderboard(r.Context(), models.Variant(variantStr), limit)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(leaderboard)
	}))

	// WebSocket handler
	mux.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		token := r.URL.Query().Get("token")
		guestName := r.URL.Query().Get("guest")

		var userID uuid.UUID
		var username string

		if token != "" {
			claims, err := authService.ValidateToken(token)
			if err == nil {
				userID = claims.UserID
				username = claims.Username
			}
		}

		if username == "" {
			if guestName != "" {
				username = guestName
			} else {
				username = fmt.Sprintf("Guest_%s", uuid.New().String()[:5])
			}
			userID = uuid.New()
		}

		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			log.Printf("WS upgrade error: %v", err)
			return
		}

		client := &ws.Client{
			Hub:      hub,
			Conn:     conn,
			Send:     make(chan []byte, 256),
			UserID:   userID,
			Username: username,
		}

		hub.Register <- client

		go client.WritePump()
		go client.ReadPump()
	})

	serverAddr := ":" + port
	log.Printf("OpenChess-HMZ server running on %s", serverAddr)
	if err := http.ListenAndServe(serverAddr, mux); err != nil {
		log.Fatalf("Server stopped: %v", err)
	}
}
