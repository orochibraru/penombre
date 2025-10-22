package handlers

import (
	"context"
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
	DB      string `json:"db"`
	Storage string `json:"storage"`
}

// GetHealthz implements ServerInterface.
func (s Server) GetApiV1Healthz(w http.ResponseWriter, r *http.Request) {
	ctx := context.Background()

	httpStatus := http.StatusOK

	dbErr := services.CheckDb(s.DB, ctx)
	dbStatus := "available"
	if dbErr != nil {
		l.Warn("Database service not yet available.")
		dbStatus = "unavailable"
		httpStatus = http.StatusInternalServerError
	}

	err := s.Storage.HealthCheck()
	storageStatus := "available"
	if err != nil {
		l.Warn("Storage service not yet available.")
		storageStatus = "unavailable"
		httpStatus = http.StatusInternalServerError
	}

	RespondWithJSON(w, httpStatus, HealthResponse{
		DB:      dbStatus,
		Storage: storageStatus,
	})
}
