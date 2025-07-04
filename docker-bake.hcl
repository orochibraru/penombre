variable "REGISTRY" {
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
  tags       = ["${REGISTRY}:latest","${REGISTRY}:${TAG}"]
  platforms = ["linux/amd64", "linux/arm64/v8", "linux/arm"]
  cache-from = ["type=gha,scope=app"]
  cache-to = ["type=gha,mode=max,scope=app"]
}
