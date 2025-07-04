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
  platforms = ["linux/amd64", "linux/arm64/v8"]
  cache-from = ["type=gha"]
  cache-to = ["type=gha,mode=max"]
}
