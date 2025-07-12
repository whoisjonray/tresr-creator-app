const express = require('express');
const router = express.Router();
const shopifyService = require('../services/shopify');
const { requireAuth } = require('../middleware/auth');

// Get creator stats (sales, commissions, etc.)
router.get('/stats', requireAuth, async (req, res) => {
  try {
    const { creator } = req.session;
    
    // In development, return mock stats
    if (process.env.NODE_ENV === 'development') {
      return res.json({
        success: true,
        stats: {
          totalProducts: 12,
          activeProducts: 10,
          totalSales: 2450.00,
          totalOrders: 23,
          commissionEarned: 980.00,
          commissionPending: 245.00,
          monthlyStats: {},
          topProducts: [
            { id: 1, title: "Cool Design Tee", sales: 450, quantity: 15 },
            { id: 2, title: "Awesome Hoodie", sales: 380, quantity: 8 }
          ]
        }
      });
    }
    
    // Get creator's products
    const products = await shopifyService.getProductsByVendor(creator.name);
    
    // Get order data for commission calculation
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const orders = await shopifyService.getOrdersByVendor(
      creator.name, 
      thirtyDaysAgo.toISOString()
    );
    
    // Calculate stats
    const stats = {
      totalProducts: products.length,
      activeProducts: products.filter(p => p.status === 'active').length,
      totalSales: orders.reduce((sum, order) => {
        return sum + order.line_items
          .filter(item => item.vendor === creator.name)
          .reduce((itemSum, item) => itemSum + parseFloat(item.price) * item.quantity, 0);
      }, 0),
      totalOrders: orders.length,
      commissionEarned: 0,
      commissionPending: 0,
      monthlyStats: {},
      topProducts: []
    };
    
    // Calculate commissions (40% of sales)
    stats.commissionEarned = stats.totalSales * 0.4;
    
    // Get top products by sales
    const productSales = {};
    orders.forEach(order => {
      order.line_items
        .filter(item => item.vendor === creator.name)
        .forEach(item => {
          if (!productSales[item.product_id]) {
            productSales[item.product_id] = {
              id: item.product_id,
              title: item.title,
              sales: 0,
              quantity: 0
            };
          }
          productSales[item.product_id].sales += parseFloat(item.price) * item.quantity;
          productSales[item.product_id].quantity += item.quantity;
        });
    });
    
    stats.topProducts = Object.values(productSales)
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5);

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Error fetching creator stats:', error);
    res.status(500).json({ 
      error: 'Failed to fetch stats',
      message: error.message 
    });
  }
});

// Get creator profile
router.get('/profile', requireAuth, async (req, res) => {
  try {
    const { creator } = req.session;
    
    // Get additional profile data from Shopify customer
    let shopifyCustomer = null;
    if (creator.shopifyCustomerId) {
      shopifyCustomer = await shopifyService.getCustomer(creator.shopifyCustomerId);
    }
    
    const profile = {
      id: creator.id,
      name: creator.name,
      email: creator.email,
      walletAddress: creator.walletAddress,
      shopifyCustomerId: creator.shopifyCustomerId,
      joinedDate: shopifyCustomer?.created_at || null,
      bio: shopifyCustomer?.note || '',
      socialLinks: {},
      payoutPreferences: {
        method: 'manual',
        details: {}
      }
    };
    
    // Parse social links from customer metafields if available
    if (shopifyCustomer?.metafields) {
      const socialMeta = shopifyCustomer.metafields.find(
        m => m.namespace === 'tresr' && m.key === 'social_links'
      );
      if (socialMeta) {
        profile.socialLinks = JSON.parse(socialMeta.value);
      }
    }

    res.json({
      success: true,
      profile
    });

  } catch (error) {
    console.error('Error fetching creator profile:', error);
    res.status(500).json({ 
      error: 'Failed to fetch profile',
      message: error.message 
    });
  }
});

// Update creator profile
router.put('/profile', requireAuth, async (req, res) => {
  try {
    const { creator } = req.session;
    const { bio, socialLinks, payoutPreferences } = req.body;
    
    // Update Shopify customer with profile data
    const updates = {
      note: bio || ''
    };
    
    // Store additional data in metafields
    const metafields = [];
    
    if (socialLinks) {
      metafields.push({
        namespace: 'tresr',
        key: 'social_links',
        value: JSON.stringify(socialLinks),
        type: 'json'
      });
    }
    
    if (payoutPreferences) {
      metafields.push({
        namespace: 'tresr',
        key: 'payout_preferences',
        value: JSON.stringify(payoutPreferences),
        type: 'json'
      });
    }
    
    if (creator.shopifyCustomerId) {
      await shopifyService.updateCustomer(creator.shopifyCustomerId, {
        ...updates,
        metafields
      });
    }
    
    res.json({
      success: true,
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('Error updating creator profile:', error);
    res.status(500).json({ 
      error: 'Failed to update profile',
      message: error.message 
    });
  }
});

// Get commission history
router.get('/commissions', requireAuth, async (req, res) => {
  try {
    const { creator } = req.session;
    const { startDate, endDate } = req.query;
    
    // Get orders within date range
    const orders = await shopifyService.getOrdersByVendor(
      creator.name,
      startDate || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
      endDate
    );
    
    // Calculate commissions by order
    const commissions = orders.map(order => {
      const creatorItems = order.line_items.filter(item => item.vendor === creator.name);
      const orderTotal = creatorItems.reduce((sum, item) => 
        sum + parseFloat(item.price) * item.quantity, 0
      );
      
      return {
        orderId: order.id,
        orderNumber: order.order_number,
        orderDate: order.created_at,
        customerName: order.customer?.first_name + ' ' + order.customer?.last_name,
        items: creatorItems.length,
        orderTotal,
        commission: orderTotal * 0.4,
        status: order.financial_status,
        payoutStatus: 'pending' // Would be tracked in separate system
      };
    });

    res.json({
      success: true,
      commissions,
      total: commissions.reduce((sum, c) => sum + c.commission, 0)
    });

  } catch (error) {
    console.error('Error fetching commission history:', error);
    res.status(500).json({ 
      error: 'Failed to fetch commission history',
      message: error.message 
    });
  }
});

module.exports = router;