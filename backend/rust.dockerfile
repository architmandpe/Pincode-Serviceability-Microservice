# Build stage
FROM rust:1.69-buster as builder

WORKDIR /app

ARG DATABASE_URL

ENV DATABASE_URL=$DATABASE_URL

COPY . .

RUN rustup override set nightly

RUN cargo build --release

#Preduction stage
FROM debian:buster-slim

WORKDIR /user/local/bin

RUN apt-get update && apt-get install -y libssl-dev && apt-get install -y libpq-dev

COPY --from=builder /app/Rocket.toml .
COPY --from=builder /app/.env .
COPY --from=builder /app/target/release/redis_tutorial .

EXPOSE 5432
EXPOSE 8083
EXPOSE 6379

CMD [ "./redis_tutorial" ]