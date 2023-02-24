# Gooey Discord Bot Docker Image

## Introduction

This Docker image contains a Discord bot built with Node.js and utilizes SQLite for storage.

## Requirements

- Docker + Docker Compose
- A Discord bot token
- An Alchemy API key

## Usage

1. Clone the repository to your local machine

```bash
git clone https://github.com/GooeyTuxedo/metadata-analytics-bot.git
```

2. Create a .env file in the root of the project and add the following environment variables:

```makefile
ALCHEMY_API_KEY=<your alchemy api key>
DISCORD_TOKEN=<your discord bot token>
DISCORD_CLIENT=<your discord client ID>
```

3. Run the Docker container

```bash
docker compose up -d
```

4. Deploy discord slash commands (on first run)

```bash
docker exec -it gooeylytics node deploy-commands.js
```

- Destroy discord slash commands (if needed) 
```bash
docker exec -it gooeylytics node destroy-commands.js
```

- View container logs

```bash
docker logs -f gooeylytics
```

## Rebuilding with new changes

1. Stop the running bot and remove container by same name

```bash
docker compose down
```

2. Pull the new work

```bash
git pull
```

3. Build and Run

```bash
docker compose up -d --build
```

#### Note: You may want to occasionally clear unused docker images and cache items (this can take a very long time):

```bash
docker system prune
```
 
## Environment Variables

The following environment variables must be set in the .env file in order for the bot to function properly:

- ALCHEMY_API_KEY: your alchemy api key.
- DISCORD_TOKEN: the Oauth2 token for your Discord bot.
- DISCORD_CLIENT: the client ID for your Discord bot. (app ID)