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
        console.log(group)
        const groupId = group.modifier_group.id
        console.log(groupId)
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
           console.log(modifier)
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
              value: `${id}.${groupId}.${modifier.modifier.id}`,
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
    const items = [{
      productVariantId: `${id}`,
      quantity: 1,
      appliedModifiers: modifiers
    }]
    const currentCart = gql.getCart(cartId)
    currentCart.then(function(result){
      console.log(result.data.carts[0].order_items)
      const currentItems = result.data.carts[0].order_items
      currentItems.forEach(item => {
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
