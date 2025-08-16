# Shopify Integration API v2 Documentation

This document describes the Shopify integration API endpoints for the TRESR Creator App, designed to handle product creation, management, and commission tracking with a default 40% commission rate for creators.

## Base URL
```
Production: https://creators.tresr.com/api/shopify
Development: http://localhost:3002/api/shopify
```

## Authentication
All endpoints except webhooks require authentication. Include the session cookie or authorization header.

## Endpoints Overview

### Product Management
- `POST /products/create` - Create single product from design
- `POST /products/superproduct` - Create SuperProduct with multiple variants
- `PUT /products/:id` - Update existing product
- `DELETE /products/:id` - Delete product
- `GET /products` - List creator's products

### Commission Tracking
- `POST /webhooks/order` - Handle Shopify order webhooks
- `GET /products/:id/commissions` - Get commission data for product

---

## Product Creation

### POST /products/create
Create a single product in Shopify from a design.

**Request Body:**
```json
{
  "designData": {
    "title": "My Awesome Design",
    "description": "A cool design description",
    "images": [
      {
        "url": "https://res.cloudinary.com/tresr/image/upload/v1/design-front.jpg",
        "alt": "Front view"
      },
      {
        "url": "https://res.cloudinary.com/tresr/image/upload/v1/design-back.jpg", 
        "alt": "Back view"
      }
    ],
    "variants": [
      {
        "title": "Small - Black",
        "price": "25.00",
        "sku": "DESIGN-S-BLK",
        "inventory_quantity": 0,
        "option1": "Small",
        "option2": "Black"
      }
    ],
    "tags": ["streetwear", "graphic-tee"],
    "vendor": "TRESR",
    "productType": "Apparel",
    "handle": "my-awesome-design"
  },
  "creatorId": "creator-123",
  "commissionRate": 40
}
```

**Response:**
```json
{
  "success": true,
  "product": {
    "id": 8765432109876,
    "title": "My Awesome Design",
    "handle": "my-awesome-design",
    "status": "draft",
    "variants": [...],
    "metafields": [
      {
        "namespace": "tresr",
        "key": "creator_id", 
        "value": "creator-123"
      },
      {
        "namespace": "tresr",
        "key": "commission_rate",
        "value": "40"
      }
    ]
  },
  "message": "Product created successfully"
}
```

---

### POST /products/superproduct
Create a SuperProduct with multiple garment types, colors, and sizes.

**Request Body:**
```json
{
  "designData": {
    "title": "Ultimate Design Collection",
    "description": "Available on multiple garments",
    "baseImages": [
      {
        "url": "https://res.cloudinary.com/tresr/image/upload/v1/design.jpg",
        "alt": "Design artwork"
      }
    ],
    "garmentVariants": [
      {
        "name": "Unisex T-Shirt",
        "sku": "TEE",
        "basePrice": "22.00",
        "weight": 0.5
      },
      {
        "name": "Hoodie",
        "sku": "HOODIE", 
        "basePrice": "45.00",
        "weight": 1.2
      }
    ],
    "colorOptions": [
      {"name": "Black", "code": "BLK"},
      {"name": "White", "code": "WHT"},
      {"name": "Navy", "code": "NVY"}
    ],
    "sizeOptions": ["XS", "S", "M", "L", "XL", "XXL"],
    "tags": ["superproduct", "multi-garment"]
  },
  "creatorId": "creator-123",
  "commissionRate": 40
}
```

**Response:**
```json
{
  "success": true,
  "product": {
    "id": 8765432109877,
    "title": "Ultimate Design Collection",
    "variants": [...], // Array of all generated variants
    "options": [
      {"name": "Garment", "values": ["Unisex T-Shirt", "Hoodie"]},
      {"name": "Color", "values": ["Black", "White", "Navy"]},
      {"name": "Size", "values": ["XS", "S", "M", "L", "XL", "XXL"]}
    ]
  },
  "variantCount": 36,
  "message": "SuperProduct created successfully"
}
```

---

## Product Management

### PUT /products/:id
Update an existing product. Only the creator who owns the product can update it.

**URL Parameters:**
- `id` - Shopify product ID

**Request Body:**
```json
{
  "creatorId": "creator-123",
  "updates": {
    "title": "Updated Product Title",
    "status": "active",
    "tags": "updated,tags"
  }
}
```

**Response:**
```json
{
  "success": true,
  "product": {
    "id": 8765432109876,
    "title": "Updated Product Title",
    "status": "active"
  },
  "message": "Product updated successfully"
}
```

---

### DELETE /products/:id
Delete a product. Only the creator who owns the product can delete it.

**URL Parameters:**
- `id` - Shopify product ID

**Request Body:**
```json
{
  "creatorId": "creator-123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Product deleted successfully"
}
```

---

### GET /products
List products created by a specific creator.

**Query Parameters:**
- `creatorId` (required) - Creator ID
- `status` (optional) - Filter by status: `draft`, `active`, `archived`
- `limit` (optional) - Number of products per page (default: 50)
- `page` (optional) - Page number (default: 1)

**Response:**
```json
{
  "success": true,
  "products": [
    {
      "id": 1,
      "shopify_id": 8765432109876,
      "creator_id": "creator-123",
      "title": "My Awesome Design",
      "handle": "my-awesome-design",
      "status": "active",
      "commission_rate": 40.00,
      "is_superproduct": false,
      "variant_count": 6,
      "total_sales": 150.00,
      "total_commissions": 60.00,
      "created_at": "2025-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1
  }
}
```

---

## Commission Tracking

### POST /webhooks/order
Handle Shopify order webhooks to automatically calculate and record commissions.

**Headers:**
- `X-Shopify-Hmac-Sha256` - Webhook signature (for verification)
- `X-Shopify-Topic` - Should be `orders/create` or `orders/updated`

**Request Body:** (Shopify order object)
```json
{
  "id": 5555555555555,
  "created_at": "2025-01-15T10:30:00Z",
  "total_price": "50.00",
  "line_items": [
    {
      "id": 11111111111111,
      "product_id": 8765432109876,
      "variant_id": 43434343434343,
      "title": "My Awesome Design - Small - Black",
      "price": "25.00",
      "quantity": 2
    }
  ]
}
```

**Response:**
```json
{
  "received": true,
  "order_id": 5555555555555,
  "processed_at": "2025-01-15T10:30:15Z"
}
```

**Process:**
1. Webhook receives order data
2. For each line item, checks for TRESR metafields
3. If `creator_id` and `commission_rate` metafields exist:
   - Calculates commission: `(price * quantity * commission_rate) / 100`
   - Records commission in `creator_commissions` table
   - Sets status to `pending`

---

### GET /products/:id/commissions
Get commission data for a specific product.

**URL Parameters:**
- `id` - Shopify product ID

**Query Parameters:**
- `creatorId` (optional) - Filter by creator
- `status` (optional) - Filter by status: `pending`, `approved`, `paid`, `disputed`, `cancelled`
- `startDate` (optional) - Filter from date (ISO format)
- `endDate` (optional) - Filter to date (ISO format)

**Response:**
```json
{
  "success": true,
  "commissions": [
    {
      "id": 1,
      "creator_id": "creator-123",
      "order_id": 5555555555555,
      "product_id": 8765432109876,
      "variant_id": 43434343434343,
      "line_item_id": 11111111111111,
      "sale_amount": 50.00,
      "commission_rate": 40.00,
      "commission_amount": 20.00,
      "quantity": 2,
      "order_date": "2025-01-15T10:30:00Z",
      "status": "pending",
      "created_at": "2025-01-15T10:30:15Z"
    }
  ],
  "summary": {
    "totalCommissions": 20.00,
    "totalSales": 50.00,
    "orderCount": 1
  }
}
```

---

## Metafields Structure

Every product created through this API includes these metafields in the `tresr` namespace:

| Key | Type | Description | Example |
|-----|------|-------------|---------|
| `creator_id` | `single_line_text_field` | ID of the creator | `"creator-123"` |
| `commission_rate` | `number_decimal` | Commission percentage | `"40"` |
| `created_by_system` | `single_line_text_field` | System identifier | `"tresr_creator_app"` |
| `creation_timestamp` | `date_time` | When product was created | `"2025-01-15T10:30:00Z"` |
| `product_type` | `single_line_text_field` | Type (SuperProducts only) | `"superproduct"` |
| `garment_count` | `number_integer` | Number of garments (SuperProducts only) | `"2"` |

---

## Database Schema

### shopify_products
Tracks all products created through the API.

```sql
CREATE TABLE `shopify_products` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `shopify_id` BIGINT NOT NULL UNIQUE,
  `creator_id` VARCHAR(36) NOT NULL,
  `design_id` VARCHAR(36) NULL,
  `title` VARCHAR(255) NOT NULL,
  `handle` VARCHAR(255) NOT NULL,
  `status` ENUM('draft', 'active', 'archived', 'deleted') DEFAULT 'draft',
  `commission_rate` DECIMAL(5,2) DEFAULT 40.00,
  `is_superproduct` BOOLEAN DEFAULT FALSE,
  `variant_count` INT DEFAULT 0,
  `total_sales` DECIMAL(10,2) DEFAULT 0.00,
  `total_commissions` DECIMAL(10,2) DEFAULT 0.00,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL
);
```

### creator_commissions
Tracks individual commission entries from sales.

```sql
CREATE TABLE `creator_commissions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `creator_id` VARCHAR(36) NOT NULL,
  `order_id` BIGINT NOT NULL,
  `product_id` BIGINT NOT NULL,
  `variant_id` BIGINT NOT NULL,
  `line_item_id` BIGINT NOT NULL,
  `sale_amount` DECIMAL(10,2) NOT NULL,
  `commission_rate` DECIMAL(5,2) NOT NULL,
  `commission_amount` DECIMAL(10,2) NOT NULL,
  `quantity` INT NOT NULL DEFAULT 1,
  `order_date` TIMESTAMP NOT NULL,
  `status` ENUM('pending', 'approved', 'paid', 'disputed', 'cancelled') DEFAULT 'pending',
  `payment_date` TIMESTAMP NULL,
  `payment_reference` VARCHAR(255) NULL,
  `notes` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

---

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Error description",
  "details": "Detailed error message",
  "status": 400
}
```

Common error codes:
- `400` - Bad Request (missing required fields)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (access denied, wrong creator)
- `404` - Not Found (product doesn't exist)
- `500` - Internal Server Error

---

## Setup Instructions

1. **Database Migration:**
   ```bash
   node server/scripts/migrate-shopify-integration.js
   ```

2. **Environment Variables:**
   ```env
   SHOPIFY_API_KEY=your_shopify_api_key
   SHOPIFY_API_SECRET=your_shopify_api_secret
   SHOPIFY_API_ACCESS_TOKEN=your_access_token
   SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
   SHOPIFY_WEBHOOK_SECRET=your_webhook_secret
   ```

3. **Shopify Webhook Setup:**
   Configure webhook endpoint in Shopify Admin:
   - URL: `https://creators.tresr.com/api/shopify/webhooks/order`
   - Event: `Order creation`
   - Format: `JSON`

4. **Required Shopify Scopes:**
   - `read_products`
   - `write_products`
   - `read_customers`
   - `write_customers`
   - `read_orders`
   - `write_orders`
   - `read_product_listings`
   - `write_product_listings`

---

## Commission Calculation Example

For a $25.00 product with 40% commission rate:
- Sale amount: $25.00
- Commission rate: 40%
- Commission amount: $25.00 × 0.40 = $10.00

For quantity of 2:
- Total sale: $50.00
- Total commission: $20.00

The commission is automatically calculated and recorded when the order webhook is processed.

---

## Testing

Use the included test data and development mode flags for testing without affecting production Shopify store. The API includes mock responses when `NODE_ENV=development`.

For webhook testing, use tools like ngrok to expose your local development server to Shopify webhooks.