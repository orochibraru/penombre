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
  platforms = ["linux/amd64", "linux/arm64/v8"]
  cache-from = ["type=gha,scope=opendrive"]
  cache-to = ["type=gha,scope=opendrive,mode=max"]
}
