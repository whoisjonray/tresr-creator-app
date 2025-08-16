/**
 * Mock Data for TRESR Creator App Tests
 * Centralized test data to ensure consistency across test suites
 */

// Dynamic.xyz User Mock Data
const MOCK_DYNAMIC_USERS = {
  creator: {
    id: 'dyn_user_12345',
    email: 'test.creator@tresr.com',
    name: 'Test Creator',
    walletAddress: '0x742d35Cc6632C0532e6B0332D2cA7568Ec8b0352',
    verifiedCredentials: [
      {
        walletAddress: '0x742d35Cc6632C0532e6B0332D2cA7568Ec8b0352',
        network: 'avalanche'
      }
    ],
    authenticatedAt: '2024-01-15T10:00:00Z'
  },
  admin: {
    id: 'dyn_admin_67890',
    email: 'admin@tresr.com',
    name: 'Test Admin',
    walletAddress: '0x9c89f8B9B76bCd857216B6380cFA8361e95edF7F',
    verifiedCredentials: [
      {
        walletAddress: '0x9c89f8B9B76bCd857216B6380cFA8361e95edF7F',
        network: 'avalanche'
      }
    ],
    authenticatedAt: '2024-01-15T09:00:00Z',
    role: 'admin'
  },
  memelord: {
    id: 'dyn_memelord_001',
    email: 'memelord@tresr.com',
    name: 'Memelord Creator',
    walletAddress: '0x0f0553a18b671FcD0190252e86e2d64a97fcB40c',
    verifiedCredentials: [
      {
        walletAddress: '0x0f0553a18b671FcD0190252e86e2d64a97fcB40c',
        network: 'avalanche'
      }
    ],
    authenticatedAt: '2024-01-15T08:00:00Z'
  }
};

// Sanity CMS Mock Data
const MOCK_SANITY_DESIGNS = {
  basic: {
    _id: 'design-test-001',
    title: 'Test Design - Cool NFT Art',
    slug: 'test-design-cool-nft-art',
    description: 'A test design for our integration testing',
    images: [
      {
        asset: {
          _id: 'image-front-001',
          url: 'https://cdn.sanity.io/images/a9vtdosx/production/front-design.png',
          metadata: {
            dimensions: { width: 1200, height: 1200 }
          }
        }
      },
      {
        asset: {
          _id: 'image-back-001',
          url: 'https://cdn.sanity.io/images/a9vtdosx/production/back-design.png',
          metadata: {
            dimensions: { width: 1200, height: 1200 }
          }
        }
      }
    ],
    overlayTopLeft: { x: 100, y: 100 },
    overlayBottomRight: { x: 300, y: 300 },
    tags: ['nft', 'digital-art', 'crypto'],
    isActive: true,
    publishedAt: '2024-01-15T10:00:00Z',
    createdAt: '2024-01-15T09:00:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
    salesCount: 42,
    viewCount: 1337
  },
  complex: {
    _id: 'design-test-002',
    title: 'Advanced Multi-Layer Design',
    slug: 'advanced-multi-layer-design',
    description: 'Complex design with multiple print areas and high-res assets',
    images: [
      {
        asset: {
          _id: 'image-front-002',
          url: 'https://cdn.sanity.io/images/a9vtdosx/production/complex-front.png'
        }
      },
      {
        asset: {
          _id: 'image-back-002',
          url: 'https://cdn.sanity.io/images/a9vtdosx/production/complex-back.png'
        }
      },
      {
        asset: {
          _id: 'image-detail-001',
          url: 'https://cdn.sanity.io/images/a9vtdosx/production/detail-view.png'
        }
      }
    ],
    overlayTopLeft: { x: 50, y: 80 },
    overlayBottomRight: { x: 350, y: 400 },
    tags: ['premium', 'artistic', 'detailed'],
    isActive: true,
    publishedAt: '2024-01-10T14:00:00Z',
    createdAt: '2024-01-10T13:00:00Z',
    updatedAt: '2024-01-15T16:45:00Z',
    salesCount: 15,
    viewCount: 892
  }
};

const MOCK_SANITY_PERSONS = {
  testCreator: {
    _id: 'person-test-001',
    name: 'Test Creator',
    email: 'test.creator@tresr.com',
    username: 'testcreator',
    walletAddress: '0x742d35Cc6632C0532e6B0332D2cA7568Ec8b0352',
    wallets: ['0x742d35Cc6632C0532e6B0332D2cA7568Ec8b0352'],
    bio: 'Test creator for integration testing',
    isVerified: true,
    avatar: {
      asset: {
        _id: 'avatar-test-001',
        url: 'https://cdn.sanity.io/images/a9vtdosx/production/avatar.jpg'
      }
    },
    socialLinks: {
      twitter: '@testcreator',
      instagram: '@testcreator_art'
    },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T12:00:00Z'
  },
  memelord: {
    _id: 'person-memelord-001',
    name: 'Memelord Creator',
    email: 'memelord@tresr.com',
    username: 'memelord',
    walletAddress: '0x0f0553a18b671FcD0190252e86e2d64a97fcB40c',
    wallets: ['0x0f0553a18b671FcD0190252e86e2d64a97fcB40c'],
    bio: 'Meme lord and digital artist',
    isVerified: true,
    createdAt: '2023-12-01T00:00:00Z',
    updatedAt: '2024-01-15T11:30:00Z'
  }
};

// Shopify Product Mock Data
const MOCK_SHOPIFY_PRODUCTS = {
  basic: {
    id: 'gid://shopify/Product/12345678901234',
    handle: 'test-design-cool-nft-art-t-shirt',
    title: 'Test Design - Cool NFT Art T-Shirt',
    vendor: 'TRESR',
    productType: 'T-Shirt',
    status: 'active',
    description: 'Cool NFT art design on premium t-shirt',
    images: {
      edges: [
        {
          node: {
            id: 'gid://shopify/ProductImage/12345',
            url: 'https://cdn.shopify.com/product-front.jpg',
            altText: 'Front view of t-shirt with design'
          }
        },
        {
          node: {
            id: 'gid://shopify/ProductImage/12346',
            url: 'https://cdn.shopify.com/product-back.jpg',
            altText: 'Back view of t-shirt'
          }
        }
      ]
    },
    variants: {
      edges: [
        {
          node: {
            id: 'gid://shopify/ProductVariant/11111',
            title: 'S / Black',
            price: '29.99',
            sku: 'TRESR-TEST-S-BLK',
            inventoryQuantity: 100,
            weight: 0.5,
            weightUnit: 'POUNDS'
          }
        },
        {
          node: {
            id: 'gid://shopify/ProductVariant/11112',
            title: 'M / Black',
            price: '29.99',
            sku: 'TRESR-TEST-M-BLK',
            inventoryQuantity: 150,
            weight: 0.5,
            weightUnit: 'POUNDS'
          }
        },
        {
          node: {
            id: 'gid://shopify/ProductVariant/11113',
            title: 'L / Black',
            price: '29.99',
            sku: 'TRESR-TEST-L-BLK',
            inventoryQuantity: 120,
            weight: 0.5,
            weightUnit: 'POUNDS'
          }
        }
      ]
    },
    tags: ['nft', 'art', 'crypto', 'tresr'],
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:30:00Z'
  }
};

// Commission and NFKEY Mock Data
const MOCK_COMMISSION_DATA = {
  sales: [
    {
      id: 'sale-001',
      productId: 'product-123',
      creatorName: 'Test Creator',
      creatorId: 'dyn_user_12345',
      saleAmount: 100.00,
      walletAddress: '0x742d35Cc6632C0532e6B0332D2cA7568Ec8b0352',
      timestamp: '2024-01-15T15:00:00Z',
      nfkeyLevel: 145,
      commissionRate: 0.40,
      commissionAmount: 40.00
    },
    {
      id: 'sale-002',
      productId: 'product-124',
      creatorName: 'Memelord Creator',
      creatorId: 'dyn_memelord_001',
      saleAmount: 50.00,
      walletAddress: '0x0f0553a18b671FcD0190252e86e2d64a97fcB40c',
      timestamp: '2024-01-15T16:00:00Z',
      nfkeyLevel: 75,
      commissionRate: 0.20,
      commissionAmount: 10.00
    }
  ],
  nfkeyBalances: {
    '0x742d35Cc6632C0532e6B0332D2cA7568Ec8b0352': {
      balance: 5,
      highestLevel: 145
    },
    '0x0f0553a18b671FcD0190252e86e2d64a97fcB40c': {
      balance: 3,
      highestLevel: 75
    },
    '0x9c89f8B9B76bCd857216B6380cFA8361e95edF7F': {
      balance: 1,
      highestLevel: 25
    }
  }
};

// Cloudinary Mock Data
const MOCK_CLOUDINARY_RESPONSES = {
  uploadSuccess: {
    public_id: 'designs/test-design-001-front',
    secure_url: 'https://res.cloudinary.com/tresr/image/upload/v1705123456/designs/test-design-001-front.jpg',
    width: 1200,
    height: 1200,
    format: 'jpg',
    resource_type: 'image',
    bytes: 234567,
    created_at: '2024-01-15T10:30:56Z'
  },
  uploadError: {
    error: {
      message: 'Invalid image URL',
      http_code: 400
    }
  }
};

// API Response Templates
const MOCK_API_RESPONSES = {
  dynamicAuth: {
    success: {
      verified: true,
      user: MOCK_DYNAMIC_USERS.creator
    },
    failure: {
      verified: false,
      error: 'Invalid token'
    }
  },
  sanityQuery: {
    designs: [MOCK_SANITY_DESIGNS.basic, MOCK_SANITY_DESIGNS.complex],
    persons: [MOCK_SANITY_PERSONS.testCreator, MOCK_SANITY_PERSONS.memelord]
  },
  shopifyMutation: {
    success: {
      data: {
        productCreate: {
          product: MOCK_SHOPIFY_PRODUCTS.basic,
          userErrors: []
        }
      }
    },
    failure: {
      data: {
        productCreate: {
          product: null,
          userErrors: [
            {
              field: ['title'],
              message: 'Title cannot be blank'
            }
          ]
        }
      }
    }
  }
};

// Blockchain Mock Data (Avalanche NFKEY contract responses)
const MOCK_BLOCKCHAIN_RESPONSES = {
  balanceOf: {
    '0x742d35Cc6632C0532e6B0332D2cA7568Ec8b0352': '0x0000000000000000000000000000000000000000000000000000000000000005', // 5
    '0x0f0553a18b671FcD0190252e86e2d64a97fcB40c': '0x0000000000000000000000000000000000000000000000000000000000000003', // 3
    '0x9c89f8B9B76bCd857216B6380cFA8361e95edF7F': '0x0000000000000000000000000000000000000000000000000000000000000001'  // 1
  },
  tokensOfOwner: {
    '0x742d35Cc6632C0532e6B0332D2cA7568Ec8b0352': ['145', '146', '147', '148', '149'],
    '0x0f0553a18b671FcD0190252e86e2d64a97fcB40c': ['75', '76', '77'],
    '0x9c89f8B9B76bCd857216B6380cFA8361e95edF7F': ['25']
  },
  getLevel: {
    '145': '0x0000000000000000000000000000000000000000000000000000000000000091', // 145
    '75': '0x000000000000000000000000000000000000000000000000000000000000004b',  // 75
    '25': '0x0000000000000000000000000000000000000000000000000000000000000019'   // 25
  }
};

// Database Mock Models
const MOCK_DATABASE_MODELS = {
  UserRole: {
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn()
  },
  CreatorMapping: {
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn()
  },
  Design: {
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findAll: jest.fn()
  },
  Creator: {
    findByPk: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn()
  }
};

// Test Helper Functions
const createMockRequest = (overrides = {}) => ({
  body: {},
  session: {},
  sessionID: 'test-session-' + Date.now(),
  ip: '127.0.0.1',
  get: jest.fn().mockReturnValue('Test User Agent'),
  ...overrides
});

const createMockResponse = () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    cookie: jest.fn().mockReturnThis(),
    clearCookie: jest.fn().mockReturnThis()
  };
  return res;
};

const createAuthenticatedSession = (user = MOCK_DYNAMIC_USERS.creator) => ({
  creator: {
    id: user.id,
    email: user.email,
    name: user.name,
    walletAddress: user.walletAddress,
    role: user.role || 'creator',
    isAdmin: user.role === 'admin',
    authenticatedAt: user.authenticatedAt
  }
});

module.exports = {
  MOCK_DYNAMIC_USERS,
  MOCK_SANITY_DESIGNS,
  MOCK_SANITY_PERSONS,
  MOCK_SHOPIFY_PRODUCTS,
  MOCK_COMMISSION_DATA,
  MOCK_CLOUDINARY_RESPONSES,
  MOCK_API_RESPONSES,
  MOCK_BLOCKCHAIN_RESPONSES,
  MOCK_DATABASE_MODELS,
  createMockRequest,
  createMockResponse,
  createAuthenticatedSession
};