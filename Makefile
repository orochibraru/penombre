api:
	go -C packages/api tool oapi-codegen -config ./codegen.yaml ./public/openapi.json
	go -C packages/api mod tidy
	pnpm -C packages/ui gen:api

dev:
	go -C packages/api tool air

db:
	go -C packages/api tool sqlc generate

lint:
	go -C packages/api tool golangci-lint run

test:
	go -C packages/api test -v -race ./...

migration:
	migrate -source file://db/migrations -database postgres://postgres:postgres@localhost:5432/opendrive?sslmode=disable up 2


.PHONY: api dev migration lint db
