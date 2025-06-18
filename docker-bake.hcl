variable "REGISTRY" {
  default = "git.ombrage.space/opendrive"
}

variable "TAG" {
  validation {
    condition = TAG != ""
    error_message = "The variable 'TAG' must not be empty."
  }
}

group "default" {
  targets = ["app", "db-migrator"]
}


target "app" {
  context    = "."
  dockerfile = "./Dockerfile"
  tags       = ["${REGISTRY}/app:latest","${REGISTRY}/app:${TAG}"]
  platforms = ["linux/amd64", "linux/arm/v7", "linux/arm64/v8", "linux/386"]
  cache-from = ["type=gha,scope=app"]
  cache-to = ["type=gha,mode=max,scope=app"]
  target = "runner"
}

target "db-migrator" {
  context    = "."
  dockerfile = "./Dockerfile"
  tags       = ["${REGISTRY}/db-migrator:latest","${REGISTRY}/db-migrator:${TAG}"]
  platforms = ["linux/amd64", "linux/arm/v7", "linux/arm64/v8", "linux/386"]
  cache-from = ["type=gha,scope=db-migrator"]
  cache-to = ["type=gha,mode=max,scope=db-migrator"]
  target = "db-migrate"
}
