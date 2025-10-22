variable "IMAGE" {
  default = "git.ombrage.space/opendrive/opendrive"
}

variable "TAG" {
  default = "latest"
  validation {
    condition = TAG != ""
    error_message = "The variable 'TAG' must not be empty."
  }
}

group "default" {
  targets = ["app"]
}


target "app" {
  context    = "."
  dockerfile = "./Dockerfile"
  tags       = ["${IMAGE}:latest","${IMAGE}:${TAG}"]
  platforms = ["linux/amd64"]
  cache-from = ["type=gha"]
  cache-to = ["type=gha,mode=max"]
}

target "docs" {
  context    = "packages/docs"
  dockerfile = "./Dockerfile"
  tags       = ["git.ombrage.space/opendrive/docs:latest","git.ombrage.space/opendrive/docs:${TAG}"]
  platforms = ["linux/amd64"]
  cache-from = ["type=gha"]
  cache-to = ["type=gha,mode=max"]
}
