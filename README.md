# coffeebot
Building a bot for ordering coffee from my local coffee shop using Slerp API and Slack in NodeJS

# API:
This uses the Slerp API you will need a Slerp API key in env file named: API_KEY<br>
To call stats you will need an admin level partner API key.<br>
For dev use Slerp Demo API

# Slack API:
You will need to set up a slack app at https://api.slack.com/apps<br>
The app is built using socket mode and the Slack Bolt API: https://slack.dev/bolt-js/deployments/heroku<br>
Use the App Manifest JSON below to set correct permissions for the app and then set up the following keys and save to an .env file:<br>
- SLACK_SIGNING_SECRET
- APP_TOKEN (setup under App-Level Tokens, need both read and write)
- SLACK_BOT_TOKEN (setup under Oauth and Permissions -> OAuth Tokens for Your Workspace)

# Setup dev:
You will need Node on your machine<br>
First run Yarn Install to install dependencies<br>
Then run Yarn Run Dev to start the app, interact in your slack workspace.

# App Manifest Json to copy and paste:

```
{
    "display_information": {
        "name": "coffeebot",
        "description": "Order your coffee from me.",
        "background_color": "#000000"
    },
    "features": {
        "bot_user": {
            "display_name": "coffeebot",
            "always_online": true
        },
        "slash_commands": [
            {
                "command": "/menu",
                "description": "Shows the menu",
                "should_escape": false
            }
        ]
    },
    "oauth_config": {
        "scopes": {
            "bot": [
                "app_mentions:read",
                "calls:read",
                "calls:write",
                "channels:history",
                "chat:write",
                "chat:write.customize",
                "chat:write.public",
                "commands",
                "conversations.connect:write",
                "groups:history",
                "im:history",
                "im:read",
                "im:write",
                "mpim:history",
                "mpim:read",
                "mpim:write",
                "users:read",
                "users:read.email",
                "users.profile:read"
            ]
        }
    },
    "settings": {
        "event_subscriptions": {
            "bot_events": [
                "message.channels",
                "message.groups",
                "message.im",
                "message.mpim"
            ]
        },
        "interactivity": {
            "is_enabled": true
        },
        "org_deploy_enabled": false,
        "socket_mode_enabled": true,
        "token_rotation_enabled": false
    }
}
```
