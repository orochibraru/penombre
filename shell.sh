#!/usr/bin/env bash
set -euo pipefail

registry='git.ombrage.space'
name='salokain/opendrive/app'

auth='salokain:626b561c5c4f40b38ac2bcee70d2e424f7777c51'
curl -u "$auth" -vsSL -X DELETE "https://${registry}/v2/${name}/manifests/$(
    curl -u "$auth" -sSL -I \
        -H "Accept: application/vnd.docker.distribution.manifest.v2+json" \
        "https://${registry}/v2/${name}/manifests/$(
            curl -u "$auth" -sSL "https://${registry}/v2/${name}/tags/list" | jq -r '.tags[0]'
        )" |
        awk '$1 == "Docker-Content-Digest:" { print $2 }' |
        tr -d $'\r'
)"
