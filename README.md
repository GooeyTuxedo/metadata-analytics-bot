# Gooey Discord Bot Docker Image

## Introduction

This Docker image contains a Discord bot built with Node.js and utilizes SQLite for storage.

## Requirements

- Docker
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

3. Build the Docker image

```bash
docker build -t discord-query-bot .
```

4. Run the Docker container

```bash
docker run -d discord-query-bot --name gooeylytics
```

5. Deploy discord slash commands (on first run)

```bash
docker exec -it gooeylytics node deploy-commands.js
```

## Environment Variables

The following environment variables must be set in the .env file in order for the bot to function properly:

- ALCHEMY_API_KEY: your alchemy api key.
- DISCORD_TOKEN: the token for your Discord bot.
- DISCORD_CLIENT: the client ID for your Discord bot. (app ID)