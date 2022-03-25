const { App } = require("@slack/bolt");
const requests = require('./requests');
require("dotenv").config();
let cartId = ""
// Initializes your app with your bot token and signing secret
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode:true, // enable the following to use socket mode
  appToken: process.env.APP_TOKEN
});
const anythingElse =
{
  blocks: [
      {
        type: "section",
        text: {
          type: "plain_text",
          text: "Coming right up, would you like anything else?",
          emoji: true
        }
      },
      {
        type: "actions",
        "elements": [
          {
            "type": "button",
            "text": {
              "type": "plain_text",
              "emoji": true,
              "text": "Yes Please"
            },
            style: "primary",
            value: "anotherItem",
            action_id: "anotherItem"
          },
          {
            "type": "button",
            "text": {
              "type": "plain_text",
              "emoji": true,
              "text": "That's it"
            },
            style: "primary",
            value: "checkoutnow",
            action_id: "checkoutnow"
          }
        ]
      }
    ]
  }

//checkout and get a pay link from stripe
app.action({ action_id: 'checkoutnow' },
  async ({ body, client, ack, logger, say }) => {
    await ack();
    try {
      const userId = body.user.id
        const user = await client.users.info({
          user: userId
        });
        const firstName = user.user.profile.first_name
        let lastName = user.user.profile.last_name
        const email = user.user.profile.email
        let phone = user.user.profile.phone
        if (lastName == ""){
          lastName = "Slerp"
        }
        if (phone == ""){
          phone = "07796000000"
        }
        const userInfo = {
          contactNum: phone,
          email: email,
          first_name: firstName,
          last_name: lastName
        }
        const payLink = requests.checkout(cartId, userInfo)
          Promise.resolve(payLink).then(function(value) {
           say(`OK, click here to pay: ${value}`)
           cartId = ""
           console.log(`did I reset cart? checking: ${cartId}`)
         })
      }
    catch (error) {
      logger.error(error);
    }
  });

//add a second item to cart
app.action({ action_id: 'anotherItem' },
  async ({ body, ack, logger, say }) => {
    await ack();
    try {
      const open = await requests.checkOpen()
        if (open.data.getValidStore == null || open.data.getValidStore == []) {
          say("Sorry we're closed right now")
        } else {
          const menu = await requests.showMenu();
          say(menu);
        }
    }
    catch (error) {
      logger.error(error);
    }
  });

// add the selected item to the users cart
app.action({ action_id: 'addToCart' },
  async ({ body, ack, logger, say }) => {
    console.log(`cart id: ${cartId}`)
    await ack();
    try {
      const itemId = body.actions[0].value
      const modifiers = []
      const extras = await requests.getExtras(itemId)
      if (extras.blocks.length == 1 && cartId == "") {
        const cart = requests.createCart(itemId, modifiers)
        Promise.resolve(cart).then(function(value){
          cartId = value
          console.log(cartId)
          say(anythingElse)
        })
      } else if (extras.blocks.length == 1 && cartId != "") {
        cart = requests.addToCart(itemId, modifiers, cartId)
        Promise.resolve(cart).then(function(){
          say(anythingElse)
        })
      } else {
        await say(extras);
      }
    }
    catch (error) {
      logger.error(error);
    }
  });

app.command("/menu", async ({ command, ack, say }) => {
    try {
      await ack();
      const open = await requests.checkOpen()
        if (open.data.getValidStore == null || open.data.getValidStore == []) {
          say("Sorry we're closed right now")
        } else {
          const menu = await requests.showMenu();
          say(menu);
        }
    } catch (error) {
      console.log("err")
      console.error(error);
    }
});

//allows app to respond to payment requests made by text
app.message(/(pay|checkout|done)/, async ({ body, client, logger, say }) => {
    try {
      const userId = body.event.user
        const user = await client.users.info({
          user: userId
        });
        const firstName = user.user.profile.first_name
        let lastName = user.user.profile.last_name
        const email = user.user.profile.email
        let phone = user.user.profile.phone
        if (lastName == ""){
          lastName = "Slerp"
        }
        if (phone == ""){
          phone = "07796000000"
        }
        const userInfo = {
          contactNum: phone,
          email: email,
          first_name: firstName,
          last_name: lastName
        }
        const payLink = requests.checkout(cartId, userInfo)
          Promise.resolve(payLink).then(function(value) {
           say(`Sure, click here to pay: ${value}`)
           cartId = ""
           console.log(`did I reset cart? checking: ${cartId}`)
         })
      }
    catch (error) {
      logger.error(error);
    }
})

app.message(/(hey|open|order|morning|afternoon|coffee|menu)/, async ({ command, say }) => {
    try {
      const open = await requests.checkOpen()
        if (open.data.getValidStore == null || open.data.getValidStore == []) {
          say("Sorry we're closed right now")
        } else {
          const menu = await requests.showMenu();
          say(menu);
        }
    } catch (error) {
        console.log("err")
      console.error(error);
    }
});

(async () => {
  const port = 3000
  // Start your app
  await app.start(process.env.PORT || port);
  console.log(`⚡️ Slack Bolt app is running on port ${port}!`);
})();

