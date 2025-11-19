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
  tags       = ["git.ombrage.space/opendrive/opendrive:latest","git.ombrage.space/opendrive/opendrive:${TAG}"]
  platforms = ["linux/amd64"]
  cache-from = ["type=gha"]
  cache-to = ["type=gha,mode=max"]
}

