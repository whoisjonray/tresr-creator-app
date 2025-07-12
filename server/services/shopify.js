const { shopifyApi, ApiVersion } = require('@shopify/shopify-api');
require('@shopify/shopify-api/adapters/node');

// Initialize Shopify API client
let shopify;
let shopifyClient;

const initShopify = () => {
  if (!shopify) {
    shopify = shopifyApi({
      apiKey: process.env.SHOPIFY_API_KEY,
      apiSecretKey: process.env.SHOPIFY_API_SECRET,
      scopes: ['read_products', 'write_products', 'read_customers', 'write_customers', 'read_orders'],
      hostName: process.env.HOST || 'creators.tresr.com',
      apiVersion: ApiVersion.January24,
    });
  }
  
  if (!shopifyClient) {
    shopifyClient = new shopify.clients.Rest({
      session: {
        shop: process.env.SHOPIFY_STORE_DOMAIN || 'becc05-b4.myshopify.com',
        accessToken: process.env.SHOPIFY_API_ACCESS_TOKEN
      }
    });
  }
  
  return shopifyClient;
};

// Product operations
const getProductsByVendor = async (vendor) => {
  // Return mock data in development mode
  if (process.env.NODE_ENV === 'development') {
    return [
      {
        id: 1,
        title: 'Mock Product 1',
        vendor: vendor,
        variants: [{ id: 1, title: 'Default', price: '22.00' }]
      },
      {
        id: 2,
        title: 'Mock Product 2',
        vendor: vendor,
        variants: [{ id: 2, title: 'Default', price: '22.00' }]
      }
    ];
  }
  
  const client = initShopify();
  
  const response = await client.get({
    path: 'products',
    query: {
      vendor,
      limit: 250
    }
  });
  
  return response.body.products;
};

const getProduct = async (productId) => {
  const client = initShopify();
  
  const response = await client.get({
    path: `products/${productId}`
  });
  
  return response.body.product;
};

const createProduct = async (productData) => {
  const client = initShopify();
  
  const response = await client.post({
    path: 'products',
    data: {
      product: productData
    }
  });
  
  return response.body.product;
};

const updateProduct = async (productId, updates) => {
  const client = initShopify();
  
  const response = await client.put({
    path: `products/${productId}`,
    data: {
      product: updates
    }
  });
  
  return response.body.product;
};

const deleteProduct = async (productId) => {
  const client = initShopify();
  
  await client.delete({
    path: `products/${productId}`
  });
  
  return true;
};

// Customer operations
const getCustomer = async (customerId) => {
  const client = initShopify();
  
  const response = await client.get({
    path: `customers/${customerId}`
  });
  
  return response.body.customer;
};

const updateCustomer = async (customerId, updates) => {
  const client = initShopify();
  
  const response = await client.put({
    path: `customers/${customerId}`,
    data: {
      customer: updates
    }
  });
  
  return response.body.customer;
};

// Order operations
const getOrdersByVendor = async (vendor, startDate, endDate) => {
  // Return mock data in development mode
  if (process.env.NODE_ENV === 'development') {
    return [
      {
        id: 1,
        total_price: '44.00',
        created_at: new Date().toISOString(),
        line_items: [
          { 
            title: 'Mock Product 1', 
            vendor: vendor, 
            quantity: 2, 
            price: '22.00' 
          }
        ]
      }
    ];
  }
  
  const client = initShopify();
  
  const query = {
    status: 'any',
    limit: 250,
    created_at_min: startDate
  };
  
  if (endDate) {
    query.created_at_max = endDate;
  }
  
  const response = await client.get({
    path: 'orders',
    query
  });
  
  // Filter orders that contain products from this vendor
  const vendorOrders = response.body.orders.filter(order => 
    order.line_items.some(item => item.vendor === vendor)
  );
  
  return vendorOrders;
};

module.exports = {
  getProductsByVendor,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getCustomer,
  updateCustomer,
  getOrdersByVendor
};