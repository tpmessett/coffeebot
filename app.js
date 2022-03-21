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

app.action({ action_id: 'addToCart' },
  async ({ body, client, ack, logger, say }) => {
    await ack();
    try {
      const userId = body.user.id
      const user = await client.users.info({
        user: userId
      });
      //console.log(user)
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
      const itemId = body.actions[0].value
      const extras = await requests.getExtras(itemId)
      await say(extras);
      if (extras.blocks.length == 1) {
        const payLink = requests.checkout(itemId, userInfo)

         Promise.resolve(payLink).then(function(value) {
           say(`OK, click here to pay: ${value}`)
         })

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

