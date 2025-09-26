package main

import (
	"embed"
	"fmt"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	"github.com/golang-migrate/migrate/v4/source/iofs"
)

//go:embed db/migrations
var migrationsFS embed.FS

func RunMigrations(dbURL string) {
	l.Info("Checking for database migrations...")

	sourceDriver, err := iofs.New(migrationsFS, "db/migrations")
	if err != nil {
		l.Fatal("could not create migration source driver: %v", err)
	}

	migrateDbURL := fmt.Sprintf("%s&x-migrations-table=migrations_history", dbURL)

	m, err := migrate.NewWithSourceInstance("iofs", sourceDriver, migrateDbURL)
	if err != nil {
		l.Fatalf("could not create migration instance: %v", err)
	}

	if err := m.Up(); err != nil {
		if err == migrate.ErrNoChange {
			l.Info("Database schema is up to date.")
		} else {
			l.Fatal("failed to apply migrations: %v", err)
		}
	} else {
		l.Info("Database migrations applied successfully.")
	}
}
