package services

import (
	"context"
	"opendrive/api/config"
	db "opendrive/api/db/sqlc"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Database struct {
	*db.Queries
	Pool      *pgxpool.Pool
	Available bool
	URL       string
}

func CheckDb(db *Database, ctx context.Context) *error {
	err := db.Pool.Ping(ctx)

	if err != nil {
		l.Error("Database not yet available.")
		return &err
	}

	return nil
}

func NewDatabase(ctx context.Context) (*Database, error) {
	dbUrl := config.Get(config.DatabaseUrl)
	if dbUrl == "" {
		l.Fatal("Missing DATABASE_URL.")
	}
	pool, err := pgxpool.New(ctx, dbUrl)
	if err != nil {
		return nil, err
	}

	err = pool.Ping(ctx)

	if err != nil {
		// Fail silently, the DB might be spinning up.
		l.Error("Database not yet available.")
		return &Database{
			Queries:   db.New(pool),
			Pool:      pool,
			Available: false,
			URL:       dbUrl,
		}, nil
	}

	l.Info("Successfully connected to the database.")

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
