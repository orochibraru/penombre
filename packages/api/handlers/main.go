package handlers

import (
	"encoding/json"
	"net/http"
	"opendrive/api/logger"
	"opendrive/api/services"
)

var l = logger.Get()

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
