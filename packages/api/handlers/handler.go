package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"opendrive/api/services"
)

// Make sure we conform to the generated interface
type Server struct {
	Storage *services.StorageService
	DB      *services.Database
}

func NewServer() Server {
	return Server{}
}

type HealthResponse struct {
	db      string
	storage string
}

// GetHealthz implements ServerInterface.
func (s Server) GetApiV1Healthz(w http.ResponseWriter, r *http.Request) {
	ctx := context.Background()

	dbErr := services.CheckDb(s.DB, ctx)
	dbStatus := "available"
	if dbErr != nil {
		l.Warn("Database service not yet available.")
		dbStatus = "unavailable"
	}

	_, err := s.Storage.ListBuckets()
	storageStatus := "available"
	if err != nil {
		l.Warn("Storage service not yet available.")
		storageStatus = "unavailable"
	}

	RespondWithJSON(w, http.StatusOK, HealthResponse{
		db:      dbStatus,
		storage: storageStatus,
	})
}

// Helper function to respond with JSON
func RespondWithJSON(w http.ResponseWriter, code int, payload any) {
	response, _ := json.Marshal(payload)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	_, err := w.Write(response)
	if err != nil {
		l.Error("Failed to write JSON response")
		return
	}
}

// Helper function to respond with an error
func RespondWithError(w http.ResponseWriter, code int, message string) {
	l.Error("API Error: %c %s", code, message)
	errorResponse := services.Error{Error: &message}
	RespondWithJSON(w, code, errorResponse)
}
