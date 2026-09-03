FROM dxflrs/garage:v2.3.0 AS garage

FROM alpine:3.24
RUN apk add --no-cache gettext

COPY --from=garage /garage /garage
COPY ./docker/garage.toml /etc/garage.toml.template
COPY ./docker/garage-entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
