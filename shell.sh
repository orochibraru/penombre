#!/usr/bin/env bash
# Credits (based on): J. Elliot Taylor https://gist.github.com/jaytaylor/86d5efaddda926a25fa68c263830dac1
# Changes:
# - iterate over tag list instead of using only first one
# - optional: basic auth

set -e
set -o pipefail

readonly VER=1.0.0
REGISTRY_URL='https://git.ombrage.space'
REGISTRY_CONTAINER=registry
CRED_OPT="-u salokain:626b561c5c4f40b38ac2bcee70d2e424f7777c51"
IMAGE="salokain/opendrive/app"

echo -e "\n[$(date +'%T %Z') v$VER] ${USER:-${USERNAME:-${LOGNAME:-UID #$UID}}}@${HOSTNAME} ${PWD}> $0${*+ }$*\n"
shift $((OPTIND - 1))

while (($# > 0)); do
    tags+=("$1")
    shift
done

if ((${#tags[@]} == 0)); then
    # Get tag list
    tag_list=$(curl "${CRED_OPT[@]}" --silent --show-error "${REGISTRY_URL}/v2/${IMAGE}/tags/list" | jq -r '.tags[]?')
    readarray -t tags <<<"$tag_list"
fi

# check for empty tag list, e.g. when already cleaned up
if ((${#tags[@]} == 0)); then
    echo "No $IMAGE images found"
    exit
fi

deleted=false
for tag in "${tags[@]}"; do
    image_digest=$(
        curl --head --header "Accept: application/vnd.docker.distribution.manifest.v2+json" "${CRED_OPT[@]}" \
            --silent --show-error "${REGISTRY_URL}/v2/${IMAGE}/manifests/${tag}" |
            awk '$1 == "Docker-Content-Digest:" { print $2 }' |
            tr -d $'\r'
    )
    if [[ $image_digest ]]; then
        echo "DELETING $IMAGE:$tag"
        curl --request DELETE "${CRED_OPT[@]}" --silent --show-error "${REGISTRY_URL}/v2/${IMAGE}/manifests/${image_digest}"
        deleted=true
        echo "DELETED $IMAGE:$tag"
    else
        echo "No $IMAGE:$tag image found"
    fi
done

if [[ $deleted == true ]]; then
    echo -e "\nCleaning up after deletion\n"
    # -m delete manifests that are not currently referenced via tag
    docker exec -it "$REGISTRY_CONTAINER" bin/registry garbage-collect /etc/docker/registry/config.yml -m

    echo -e "\nRestarting Registry"
    docker restart "$REGISTRY_CONTAINER"
fi
