api:
	go tool oapi-codegen -config ./codegen.yaml ./public/openapi.json
	go mod tidy
	pnpm -C ../ui gen:api

dev: 
	go tool air

db:
	sqlc generate

lint:
	golangci-lint run

migration:
	migrate -source file://db/migrations -database postgres://postgres:postgres@localhost:5432/opendrive?sslmode=disable up 2


.PHONY: api dev migration lint
