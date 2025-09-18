package main

import (
	"embed"
	"fmt"
	"opendrive/api/logger"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	"github.com/golang-migrate/migrate/v4/source/iofs"
)

//go:embed db/migrations
var migrationsFS embed.FS

func RunMigrations(dbURL string) {
	logger.Info("Checking for database migrations...")

	sourceDriver, err := iofs.New(migrationsFS, "db/migrations")
	if err != nil {
		logger.Fatal("could not create migration source driver: %v", err)
	}

	// The database URL for migrate needs the `x-migrations-table` parameter
	// to specify which table it should use for tracking migration versions.
	// Also, ensure the driver is 'postgres' not 'postgresql'
	migrateDbURL := fmt.Sprintf("%s&x-migrations-table=migrations_history", dbURL)

	m, err := migrate.NewWithSourceInstance("iofs", sourceDriver, migrateDbURL)
	if err != nil {
		logger.Fatal("could not create migrate instance: %v", err)
	}

	if err := m.Up(); err != nil {
		if err == migrate.ErrNoChange {
			logger.Info("Database schema is up to date.")
		} else {
			logger.Fatal("failed to apply migrations: %v", err)
		}
	} else {
		logger.Info("Database migrations applied successfully.")
	}
}
