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
git clone https://github.com/<repo>.git
```

2. Create a .env file and add the following environment variables:

```makefile
ALCHEMY_API_KEY=<your alchemy api key>
DISCORD_TOKEN=<your discord bot token>
DISCORD_CLIENT=<your discord client ID>
DISCORD_GUILD=<your discord channel ID>
```

3. Build the Docker image

docker build -t discord-bot .

4. Run the Docker container

```bash
docker run -d --env-file .env discord-bot
```

## Environment Variables

The following environment variables must be set in the .env file in order for the bot to function properly:

- ALCHEMY_API_KEY: your alchemy api key.
- DISCORD_TOKEN: the token for your Discord bot.
- DISCORD_CLIENT: the client ID for your Discord bot.
- DISCORD_GUILD: the guild ID for your Discord server.