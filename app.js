const { App } = require("@slack/bolt");
const requests = require('./requests');
const gql = require('./gql');
require("dotenv").config();
let cartId = ""
let modifiers = []
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
           // say(`OK, click here to pay: ${value}`)
           say({
              blocks: [
                  {
                    type: "section",
                    text: {
                      type: "mrkdwn",
                      "text": "OK, click the button to pay:"
                    },
                    accessory: {
                      type: "button",
                      text: {
                        type: "plain_text",
                        text: "Pay Now",
                        emoji: true
                      },
                      value: `${cartId}`,
                      url: `${value}`,
                      action_id: "pay-click"
                    }
                  }
                ]
            })
           cartId = ""
           console.log(`did I reset cart? checking: ${cartId}`)
         })
      }
    catch (error) {
      logger.error(error);
      say("hmm, something went wrong, sorry. Try again?")
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
      say("hmm, something went wrong, sorry. Try again?")
    }
  });

// add the selected item to the users cart
app.action({ action_id: 'addToCart' },
  async ({ body, ack, logger, say }) => {
    modifiers = []
    productId = body.actions[0].value
    await ack();
    try {
      const itemId = body.actions[0].value
      const extras = await requests.getExtras(itemId)
      if (extras.blocks.length == 1 && cartId === "") {
        console.log(`check create: ${cartId}`)
        const cart = requests.createCart(itemId, modifiers)
        Promise.resolve(cart).then(function(value){
          cartId = value
          say(anythingElse)
        })
      } else if (extras.blocks.length == 1 && cartId != "") {
        console.log(`check add: ${cartId}`)
        console.log(modifiers)
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
      say("hmm, something went wrong, sorry. Try again?")
    }
  });

//add item with extra to users cart
app.action({action_id: 'selectedExtra1'},
  async ({ body, ack, logger, say }) => {
    await ack()
    try {
      const result = body.actions[0].selected_option.value.split('.')
      console.log(result)
      modifierPush(result)
    }
    catch (error) {
      logger.error(error);
      say("hmm, something went wrong, sorry. Try again?")
    }
  })

app.action({action_id: 'selectedExtra2'},
  async ({ body, ack, logger, say }) => {
    await ack()
    try {
      const result = body.actions[0].selected_options[0].value.split('.')
      modifierPush(result)
    }
    catch (error) {
      logger.error(error);
      say("hmm, something went wrong, sorry. Try again?")
    }
  })

const modifierPush = (result) => {
  const modifier = {
        modifierGroupId: result[0],
        modifierId: result[1],
        quantity: 1
      }
      modifiers.push(modifier)
}

app.action({action_id: 'add'},
  async ({ body, ack, logger, say }) => {
    await ack()
    try {
      const id = body.actions[0].value
      if (cartId === "") {
        const cart = requests.createCart(id, modifiers)
        Promise.resolve(cart).then(function(value){
          cartId = value
          modifiers = []
          say(anythingElse)
        })
      } else {
        cart = requests.addToCart(id, modifiers, cartId)
        Promise.resolve(cart).then(function(){
          modifiers = []
          say(anythingElse)
        })
      }
    }
    catch (error) {
      logger.error(error);
      say("hmm, something went wrong, sorry. Try again?")
    }
  })

app.action({action_id: 'pay-click'},
  async ({ body, ack, logger, say }) => {
    await ack()
    try {
      const cart = body.actions[0].value
      const started = Date.now()
      pollOrder = setInterval(payment, 3000)
      function payment() {
        const paid = gql.listenPayment(cart)
        Promise.resolve(paid).then(function(result){
          if(result.data.orders[0].status.toLowerCase() === 'accepted') {
            const timeline = gql.getStoreInfo()
            Promise.resolve(timeline).then(function(result){
              say(`Great, your order has been accepted and will be ready in ${result} minutes`)
            })
            clearInterval(pollOrder)
          }
          if(result.data.orders[0].status.toLowerCase() === 'rejected') {
            say("Ahh it looks like we can't fulfill your order right now, sorry, please do order again another time.")
            clearInterval(pollOrder)
          }
          if (Date.now() - started > 600000) {
            console.log("stop")
            clearInterval(pollOrder);
          }
        })
      }
    }
    catch (error) {
      logger.error(error);
      say("hmm, something went wrong, sorry. Try again?")
    }
  })

app.command("/menu", async ({ command, ack, say }) => {
    try {
      await ack();
      const open = await requests.checkOpen()
        console.log(open)
        if (open.data.getValidStore == null || open.data.getValidStore == []) {
          say("Sorry we're closed right now")
        } else {
          const menu = await requests.showMenu();
          cartId = ''
          say(menu);
        }
    } catch (error) {
      console.log("err")
      console.error(error);
      say("hmm, something went wrong, sorry. Try again?")
    }
});

//allows app to respond to payment requests made by text
app.message(/(pay|checkout|done)/, async ({ body, client, logger, say }) => {
    try {
      if(cartId === '') {
        say("there is nothing in your cart, try asking for the menu first")
      }
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
           say({
              blocks: [
                  {
                    type: "section",
                    text: {
                      type: "mrkdwn",
                      "text": "OK, click the button to pay:"
                    },
                    accessory: {
                      type: "button",
                      text: {
                        type: "plain_text",
                        text: "Pay Now",
                        emoji: true
                      },
                      value: `${cartId}`,
                      url: `${value}`,
                      action_id: "pay-click"
                    }
                  }
                ]
            })
           cartId = ""
           console.log(`did I reset cart? checking: ${cartId}`)
         })
      }
    catch (error) {
      logger.error(error);
      say("hmm, something went wrong, sorry. Try again?")
    }
})

app.message(/(hey|open|order|morning|afternoon|coffee|menu)/i, async ({ command, say }) => {
    try {
      const open = await requests.checkOpen()
      console.log(open)
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

app.message(/(start again|clear cart|reset)/i, async ({ command, say }) => {
    try {
      cartId = ''
      say("OK let's start again...")
    } catch (error) {
        console.log("err")
      console.error(error);
      say("hmm, something went wrong, sorry. Try again?")
    }
});

app.message(/(slerp stand for|slerp meaning|slerp mean)/i, async ({ command, say }) => {
    try {
      say("SLERP stands for Simple Language ERP")
    } catch (error) {
        console.log("err")
      console.error(error);
      say("hmm, something went wrong, sorry. Try again?")
    }
});

app.message(/(most popular|best seller)/i, async ({ command, say}) => {
  try {
      const response = gql.getProdStats()
      say("Ok here are the top 5:")
      Promise.resolve(response).then(function(topFive) {
         for (let i = 0; i < topFive.length; i++) {
           say(`${i+1}) ${topFive[i].name} - ${topFive[i].total_count} sold`)
         }
      })
    } catch (error) {
        console.log("err")
      console.error(error);
      say("hmm, something went wrong, sorry. Try again?")
    }
});

(async () => {
  const port = 3000
  // Start your app
  await app.start(process.env.PORT || port);
  console.log(`⚡️ Slack Bolt app is running on port ${port}!`);
})();

