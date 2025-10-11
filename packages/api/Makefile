api:
	go tool oapi-codegen -config ./codegen.yaml ./public/openapi.json
	go mod tidy
	pnpm -C ../ui gen:api

dev:
	go tool air

db:
	go tool sqlc generate

lint:
	go tool golangci-lint run

test:
	go test -v ./...


.PHONY: api dev migration lint db
