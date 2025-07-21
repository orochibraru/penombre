package services

import (
	"context"
	"log"
	db "opendrive/api/db/sqlc"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Database struct {
	*db.Queries
	Pool      *pgxpool.Pool
	Available bool
	URL       string
}

func GetDbUrl() string {
	var dbUrl = "postgres://postgres:postgres@localhost:5432/opendrive?sslmode=disable"
	var envUrl = os.Getenv("DATABASE_URL")
	if envUrl != "" {
		dbUrl = envUrl
	}

	return dbUrl
}

func CheckDb(db *Database, ctx context.Context) *error {
	err := db.Pool.Ping(ctx)

	if err != nil {
		log.Println("Database not yet available.")
		return &err
	}

	return nil
}

func NewDatabase(ctx context.Context) (*Database, error) {
	dbUrl := GetDbUrl()
	pool, err := pgxpool.New(ctx, dbUrl)
	if err != nil {
		return nil, err
	}

	err = pool.Ping(ctx)

	if err != nil {
		// Fail silently, the DB might be spinning up.
		log.Println("Database not yet available.")
		return &Database{
			Queries:   db.New(pool),
			Pool:      pool,
			Available: false,
			URL:       dbUrl,
		}, nil
	}

	log.Println("Successfully connected to the database.")

	return &Database{
		Queries:   db.New(pool),
		Pool:      pool,
		Available: true,
		URL:       dbUrl,
	}, nil
}

func (d *Database) Close() {
	d.Pool.Close()
}
