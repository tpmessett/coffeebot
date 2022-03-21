const gql = require('./gql');
module.exports = {
  showMenu: async function () {
    const menu = gql.getMenu()
    return menu.then(function(result) {
      const block = {
        blocks: [
          {
            type: "section",
            text: {
              type: "plain_text",
              text: "Hey, Origin Coffee is open right now, what would you like today?",
              emoji: true
            }
          },
        ]
      }
       result.forEach(item => {
         const vat = item.product_variant.vat / 100
         const price = item.product_variant.price * (1 + vat)
         const description = {
          type: "section",
          text: {
            type: "plain_text",
            text: `${item.product_variant.name} - £${price.toFixed(2)}`,
            emoji: true
          },
          accessory: {
            type: "button",
            text: {
              type: "plain_text",
              text: "Add to Order",
              emoji: true
            },
            value: `${item.product_variant.id}`,
            action_id: "addToCart"
          },
        }
         block.blocks.push(description)
       })
       return block
    })
  },
  checkOpen: function () {
    const open = gql.isOpen()
    return open
  },
  getExtras: function (id) {
    const result = gql.getExtras(id)
    return result.then (function(extras) {
      let block = {
        blocks: [
          {
            type: "section",
            text: {
              type: "plain_text",
              text: `Let me know what how you'd like your ${extras.data.product_variants[0].product.name}:`,
              emoji: true
            }
          },
        ]
      }
      const modifierGroups = extras.data.product_variants[0].product.product_modifier_groups
      if (modifierGroups.length == 0) {
        block = {
          blocks: [
            {
              type: "section",
              text: {
                type: "plain_text",
                text: `OK, ${extras.data.product_variants[0].product.name}, coming right up.`,
                emoji: true
              }
            },
          ]
        }
      } else {
      modifierGroups.forEach(group => {
        //console.log(group)
        const groupDesc = {
            type: "section",
            text: {
              type: "plain_text",
              text: `${group.modifier_group.name}:`,
              emoji: true
            }
          }
        block.blocks.push(groupDesc)
        const modifiers = group.modifier_group.modifier_assocs
        modifiers.forEach(modifier => {
          const vat = modifier.modifier.vat / 100
           const price = modifier.modifier.price * (1 + vat)
           const description = {
            type: "section",
            text: {
              type: "plain_text",
              text: `${modifier.modifier.name} - £${price.toFixed(2)}`,
              emoji: true
            },
            accessory: {
              type: "button",
              text: {
                type: "plain_text",
                text: "Select",
                emoji: true
              },
              value: `${id}.${modifier.id}`,
              action_id: "selectedExtra"
            },
          }
           block.blocks.push(description)
        })
      })
    }
      return block
    })
  },
  createCart: function(id, user){
    const items = [{
      productVariantId: `${id}`,
      quantity: 1,
      appliedModifiers: []
    }]
    const cart = gql.createCart(items)
      return cart.then(function(result){
      const cartId = result.data.createSlerpCart.id
      //console.log(cartId)
      const details = gql.updateDetails(cartId, user)
      return details.then(function(result){
        //console.log(result)
        const payment = gql.createPayment(cartId)
      return payment.then(function(result){
        //console.log(result.data.payViaWeb.sessionData.url)
         return result.data.payViaWeb.sessionData.url
      })
      })
    })
  },
  addToCart: function(id, user){
    const items = [{
      productVariantId: `${id}`,
      quantity: 1,
      appliedModifiers: []
    }]
    const cart = gql.createCart(items)
      return cart.then(function(result){
      const cartId = result.data.createSlerpCart.id
      //console.log(cartId)
      const details = gql.updateDetails(cartId, user)
      return details.then(function(result){
        //console.log(result)
        const payment = gql.createPayment(cartId)
      return payment.then(function(result){
        //console.log(result.data.payViaWeb.sessionData.url)
         return result.data.payViaWeb.sessionData.url
      })
      })
    })
  },
  checkout: function(id, user){
    const items = [{
      productVariantId: `${id}`,
      quantity: 1,
      appliedModifiers: []
    }]
    const cart = gql.createCart(items)
      return cart.then(function(result){
      const cartId = result.data.createSlerpCart.id
      //console.log(cartId)
      const details = gql.updateDetails(cartId, user)
      return details.then(function(result){
        //console.log(result)
        const payment = gql.createPayment(cartId)
      return payment.then(function(result){
        //console.log(result.data.payViaWeb.sessionData.url)
         return result.data.payViaWeb.sessionData.url
      })
      })
    })
  }
}
