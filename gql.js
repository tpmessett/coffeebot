const fetch = require('node-fetch');
require("dotenv").config();
const store = "1dc13cfa-b411-433c-b58a-0ef5866c391a"
const merchant = "2ba090b2-d4dc-4fd1-ba5c-9e0b73586673"
const date = new Date().toISOString().split('T')[0]
module.exports = {
  getMenu: async function () {
    console.log("getting menu")
    const data = JSON.stringify({
      query: `
      query GetLocation {
        store_variants(where: {store: {id: {_eq: "${store}"}}, published_at: {_is_null: false}, product_variant: {product: {archived_at: {_is_null: true}, category: {name: {_eq: "Hot Drinks"}}}, archived_at: {_is_null: true}, default_variant: {_eq: true}, published: {_eq: true}}, in_stock: {_eq: true}}) {
          in_stock
          id
          product_variant {
            name
            id
            options
            vat
            price
            product {
              product_id: id
              slug
              featured
              product_variants(where: {archived_at: {_is_null: true}, published: {_eq: true}}) {
                id
                name
                price
                __typename
              }
              __typename
            }
            __typename
          }
          __typename
        }
      }
        `,
    });

    const response = await fetch(
      'https://graph-qa.api.slerpdemo.com/v1/graphql',
      {
        method: 'post',
        body: data,
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + process.env.API_KEY,
          'User-Agent': 'Node',
        },
      }
    );

    const json = await response.json();
    return json.data.store_variants
  },
  isOpen: async function () {
    console.log("checking open")
    const data = JSON.stringify({
      query: `
          query getValidStore
           {
            getValidStore(
                storeId: "${store}",
                fulfillmentType: "pickup",
                fulfillmentDate: "${date}",
                address: "56 old street, London, e1"
              )
              {
                name
                id
                fulfillmentTimeslots(fulfillmentDate: "${date}", fulfillmentType: "pickup") {
                  endTime
                  startTime
                  value
              }
            }
          }
        `,
    });

    const response = await fetch(
      'https://graph-qa.api.slerpdemo.com/v1/graphql',
      {
        method: 'post',
        body: data,
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + process.env.API_KEY,
          'User-Agent': 'Node',
        },
      }
    );

    const json = await response.json();
    return json
  },
  getCart: async function (id) {
    console.log("getting cart")
    const data = JSON.stringify({
      query: `
        query GetCart {
          carts(where: {id: {_eq: "${id}"}}) {
            order_items {
              product_variant_id
              applied_modifiers {
                id
                quantity
              }
              quantity
            }
          }
        }
        `,
    });

    const response = await fetch(
      'https://graph-qa.api.slerpdemo.com/v1/graphql',
      {
        method: 'post',
        body: data,
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + process.env.API_KEY,
          'User-Agent': 'Node',
        },
      }
    );

    const json = await response.json();
    return json
  },
  getExtras: async function (id) {
    console.log("checking extras")
    const data = JSON.stringify({
      query: `
        query GetExtras {
            product_variants(where: {id: {_eq: "${id}"}}) {
              __typename
              product {
                name
                __typename
                product_modifier_groups {
                  modifier_group {
                    id
                    name
                    modifier_assocs: modifier_group_modifiers(where: {modifier: {archived_at: {_is_null: true}, store_modifiers: {published_at: {_is_null: false}}}}) {
                  id
                  modifier {
                    price
                    id
                    name
                    vat
                    sku

                  }

                  }
                }
              }
            }
            __typename
          }
        }`,
    });

    const response = await fetch(
      'https://graph-qa.api.slerpdemo.com/v1/graphql',
      {
        method: 'post',
        body: data,
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + process.env.API_KEY,
          'User-Agent': 'Node',
        },
      }
    );

    const json = await response.json();
    return json
  },
  createCart: async function (items) {
    console.log("creating cart")
    const data = JSON.stringify({
      query: `
      mutation CreateSlerpCart($orderItems: [OrderItemParams]) {
        createSlerpCart(
          storeId: "${store}",
          merchantId: "${merchant}",
          fulfillmentType: "pickup",
          address: "56 old street, London, e1",
          fulfillmentDate: "${date}",
          fulfillmentTime: "asap",
          orderItems: $orderItems,
        ) {
          id
        }
      }
        `,
      variables: {
        orderItems: items
      },
    });
    const response = await fetch(
      'https://graph-qa.api.slerpdemo.com/v1/graphql',
      {
        method: 'post',
        body: data,
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + process.env.API_KEY,
          'User-Agent': 'Node',
        },
      }
    );

    const json = await response.json();
    return json
  },
  createPayment: async function (id) {
    console.log("generating payment")
    const data = JSON.stringify({
      query: `
      mutation WebCartPayment($cartId:ID!, $cancelUrl:String!, $successUrl:String!) {
        payViaWeb(cartId:$cartId, cancelUrl:$cancelUrl, mode: "stripe", successUrl:$successUrl) {
          sessionData
        }
      }`,
      variables: {
        cartId: id,
        cancelUrl: "https://app.slack.com/client/TB51E9V4M/D038A7S1F0Q",
        successUrl: `https://slerpdemo.com/checkout_loading/${id}`
      },
    });

    const response = await fetch(
      'https://graph-qa.api.slerpdemo.com/v1/graphql',
      {
        method: 'post',
        body: data,
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + process.env.API_KEY,
          'User-Agent': 'Node',
        },
      }
    );

    const json = await response.json();
    return json
  },
  listenPayment: async function (id) {
    console.log("listening for payment")
    const data = JSON.stringify({
      query: `
      query getOrder {
        orders(where:{cart_id:{_eq: "${id}"}}) {
          transaction_id
          status
        }
      }
      `,
    });

    const response = await fetch(
      'https://graph-qa.api.slerpdemo.com/v1/graphql',
      {
        method: 'post',
        body: data,
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + process.env.API_KEY,
          'User-Agent': 'Node',
        },
      }
    );

    const json = await response.json();
    console.log(json)
    return json
  },
  updateDetails: async function (id, user) {
    console.log("updating details")
    const data = JSON.stringify({
      query: `
      mutation UpdateCustomerDetails($cartId: ID!, $customerDetails: CustomerDetailsParams!) {
        updateCartCustomerDetails(
          cartId: $cartId
          customerDetails: $customerDetails

        ) {
          id
          __typename
        }
      }

      `,
      variables: {
        cartId: id,
        customerDetails: user,

      },
    });

    const response = await fetch(
      'https://graph-qa.api.slerpdemo.com/v1/graphql',
      {
        method: 'post',
        body: data,
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + process.env.API_KEY,
          'User-Agent': 'Node',
        },
      }
    );

    const json = await response.json();
    return json
  },
  addToCart: async function (id, items) {
    console.log("updating cart")
    const data = JSON.stringify({
      query: `
      mutation updateSlerpCart(
          $cartId:ID!,
          $orderItems: OrderItemParams
        ) {
          updateSlerpCart(
            address: "56 old street, London, e1",
            cartId:$cartId,
            fulfillmentType: "pickup",
            fulfillmentTime: "asap",
            fulfillmentDate: "${date}",
            orderItems:$orderItems
          ) {
            id
          }
        }
      `,
      variables: {
        cartId: id,
        orderItems: items,
      },
    });
    const response = await fetch(
      'https://graph-qa.api.slerpdemo.com/v1/graphql',
      {
        method: 'post',
        body: data,
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + process.env.API_KEY,
          'User-Agent': 'Node',
        },
      }
    );

    const json = await response.json();
    return json
  }
 }


