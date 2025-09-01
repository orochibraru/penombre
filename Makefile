api:
	go tool oapi-codegen -config ./codegen.yaml ./public/openapi.json
	go mod tidy
	pnpm gen:api

dev: 
	go tool air

db:
	go tool sqlc generate

lint:
	go tool golangci-lint run

test:
	go test -v -race ./...

migration:
	migrate -source file://db/migrations -database postgres://postgres:postgres@localhost:5432/opendrive?sslmode=disable up 2


.PHONY: api dev migration lint db
