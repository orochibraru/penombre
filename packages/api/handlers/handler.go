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

// GetHealthz implements ServerInterface.
func (s Server) GetApiV1Healthz(w http.ResponseWriter, r *http.Request) {
	ctx := context.Background()

	dbErr := services.CheckDb(s.DB, ctx)
	if dbErr != nil {
		// Fail silently, the DB might be spinning up.
		l.Error("Database service not yet available.")
		RespondWithError(w, http.StatusInternalServerError, "DB is unreachable")
		return
	}

	_, err := s.Storage.ListBuckets()
	if err != nil {
		// Fail silently, the DB might be spinning up.
		l.Error("Storage service not yet available.")
		RespondWithError(w, http.StatusInternalServerError, "S3 is unreachable")
		return
	}

	RespondWithJSON(w, http.StatusOK, "Services are up.")
}

// Helper function to respond with JSON
func RespondWithJSON(w http.ResponseWriter, code int, payload interface{}) {
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
