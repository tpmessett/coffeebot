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
      const add = {
        // add gives a button, rework so when adding with extras the extras get stored in a const which is an array of objects
        // when add is clicked it triggers that array to get put into the right place to go in the cart.
        type: "actions",
        "elements": [
          {
            "type": "button",
            "text": {
              "type": "plain_text",
              "emoji": true,
              "text": "Add to Cart"
            },
            style: "primary",
            value: id,
            action_id: "add"
          }]
        }
      let block = {
        blocks: [
          {
            type: "section",
            text: {
              type: "plain_text",
              text: `Let me know how you'd like your ${extras.data.product_variants[0].product.name}:`,
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
        const groupId = group.modifier_group.id
        //console.log(group.modifier_group)
        if(group.modifier_group.minimum === 1) {
          console.log("one")
          const groupDesc = {
            type: "section",
              text: {
                type: "mrkdwn",
                text: "Pick one from the list:"
              },
              accessory: {
                type: "static_select",
                placeholder: {
                  type: "plain_text",
                  text: `Select ${group.modifier_group.name}`,
                  emoji: true
                },
                options: [],
                action_id: "selectedExtra1"
              }
            }
          const modifiers = group.modifier_group.modifier_assocs
          modifiers.forEach(modifier => {
            const vat = modifier.modifier.vat / 100
            const price = modifier.modifier.price * (1 + vat)
            const description = {
              text: {
                type: "plain_text",
                text: `${modifier.modifier.name} - £${price.toFixed(2)}`,
                emoji: true
              },
              value: `${groupId}.${modifier.modifier.id}`
            }
            groupDesc.accessory.options.push(description)
          })
          block.blocks.push(groupDesc)
        } else {
          console.log("two")
          const groupDesc = {
            type: "section",
              text: {
                type: "mrkdwn",
                text: `Select ${group.modifier_group.name}`,
              },
              accessory: {
                type: "checkboxes",
                options: [],
                action_id: "selectedExtra2"
              }
            }
          const modifiers = group.modifier_group.modifier_assocs
          modifiers.forEach(modifier => {
            const vat = modifier.modifier.vat / 100
            const price = modifier.modifier.price * (1 + vat)
            const description = {
              text: {
                type: "plain_text",
                text: `${modifier.modifier.name} - £${price.toFixed(2)}`,
                emoji: true
              },
              value: `${groupId}.${modifier.modifier.id}`
            }
            groupDesc.accessory.options.push(description)
          })
          block.blocks.push(groupDesc)
        }
      })
      block.blocks.push(add)
    }
    return block
    })
  },
  createCart: function(id, modifiers){
    const items = [{
      productVariantId: `${id}`,
      quantity: 1,
      appliedModifiers: modifiers
    }]
    const cart = gql.createCart(items)
      return cart.then(function(result){
      const cartId = result.data.createSlerpCart.id
      return cartId
    })
  },
  addToCart: function(id, modifiers, cartId){
    console.log(`cart: ${cartId}`)
    const items = [{
      productVariantId: `${id}`,
      quantity: 1,
      appliedModifiers: modifiers
    }]
    const currentCart = gql.getCart(cartId)
    currentCart.then(function(result){
      //console.log(result.data.carts[0].order_items)
      //console.log(result)
      const currentItems = result.data.carts[0].order_items
      currentItems.forEach(item => {
        console.log(item.applied_modifiers)
        const itemObject = {
          productVariantId: item.product_variant_id,
          quantity: item.quantity,
          appliedModifiers: item.applied_modifiers
        }
        console.log(itemObject)
        items.push(itemObject)
        console.log(items)
      })
      const cart = gql.addToCart(cartId, items)
      return cart.then(function(result){
      console.log(result)
      return result
    })
    })
  },
  checkout: function(cart, user){
    const details = gql.updateDetails(cart, user)
      return details.then(function(){
        const payment = gql.createPayment(cart)
        return payment.then(function(result){
          return result.data.payViaWeb.sessionData.url
      })
    })
  }
}
