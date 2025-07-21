package main

import (
	"embed"
	"fmt"
	"log"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	"github.com/golang-migrate/migrate/v4/source/iofs"
)

//go:embed db/migrations
var migrationsFS embed.FS

func RunMigrations(dbURL string) {
	log.Println("Checking for database migrations...")

	sourceDriver, err := iofs.New(migrationsFS, "db/migrations")
	if err != nil {
		log.Fatalf("could not create migration source driver: %v", err)
	}

	// The database URL for migrate needs the `x-migrations-table` parameter
	// to specify which table it should use for tracking migration versions.
	// Also, ensure the driver is 'postgres' not 'postgresql'
	migrateDbURL := fmt.Sprintf("%s&x-migrations-table=migrations_history", dbURL)

	m, err := migrate.NewWithSourceInstance("iofs", sourceDriver, migrateDbURL)
	if err != nil {
		log.Fatalf("could not create migrate instance: %v", err)
	}

	if err := m.Up(); err != nil {
		if err == migrate.ErrNoChange {
			log.Println("Database schema is up to date.")
		} else {
			log.Fatalf("failed to apply migrations: %v", err)
		}
	} else {
		log.Println("Database migrations applied successfully.")
	}
}
