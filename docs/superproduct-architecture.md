# SuperProduct Architecture - Unified UX with Multi-Product Backend

## Overview

Create a single "SuperProduct" page that aggregates multiple Shopify products behind a unified interface. Users see one product page but the system dynamically switches which actual product gets added to cart based on their selections.

## User Experience Flow

### Customer Journey
```
1. User visits: /designs/cool-dragon-design
2. Sees unified product page with ALL options:
   - Style: [T-Shirt] [Hoodie] [Mug] [Phone Case]
   - Fit: [Men's] [Women's] (if apparel)
   - Color: [Black] [White] [Navy] [Red]
   - Size: [S] [M] [L] [XL] [2XL] [3XL]
3. Selects: T-Shirt, Men's, Black, Large
4. Click "Add to Cart"
5. System adds "Cool Dragon - Classic T-Shirt" (Black/L variant) to cart
6. Cart shows the actual Shopify product for proper checkout
```

### Backend Product Mapping
```
SuperProduct: "Cool Dragon Design"
├── Style: "T-Shirt" → Product: "Cool Dragon - Classic T-Shirt"
├── Style: "Hoodie" → Product: "Cool Dragon - Pullover Hoodie"  
├── Style: "Mug" → Product: "Cool Dragon - Ceramic Mug"
└── Style: "Phone Case" → Product: "Cool Dragon - Phone Case"
```

## Technical Implementation

### URL Structure
```
/designs/cool-dragon-design           # SuperProduct page
/products/cool-dragon-classic-tshirt  # Actual Shopify product (hidden from nav)
/products/cool-dragon-hoodie          # Actual Shopify product (hidden from nav)
```

### SuperProduct Data Model
```javascript
const superProduct = {
  id: 'cool-dragon-design',
  title: 'Cool Dragon Design',
  description: 'Epic dragon artwork available on multiple products',
  designImage: 'https://cdn.shopify.com/design-123.png',
  creator: {
    id: 'creator-456',
    name: 'DragonArtist',
    profile: '/creators/dragonartist'
  },
  
  // Define available options and their mappings
  options: {
    style: {
      name: 'Style',
      values: [
        { 
          name: 'Classic T-Shirt',
          id: 'classic-tee',
          shopifyProduct: 'cool-dragon-classic-tshirt',
          price: 22,
          sizes: ['S', 'M', 'L', 'XL', '2XL', '3XL'],
          colors: ['Black', 'White', 'Navy', 'Red'],
          fits: ['Men\'s', 'Women\'s']
        },
        {
          name: 'Pullover Hoodie', 
          id: 'hoodie',
          shopifyProduct: 'cool-dragon-hoodie',
          price: 42,
          sizes: ['S', 'M', 'L', 'XL', '2XL'],
          colors: ['Black', 'White', 'Navy'],
          fits: ['Unisex']
        },
        {
          name: 'Ceramic Mug',
          id: 'mug', 
          shopifyProduct: 'cool-dragon-mug',
          price: 15,
          sizes: ['11oz'],
          colors: ['White'],
          fits: null
        }
      ]
    }
  },
  
  // SEO and marketing
  tags: ['dragon', 'fantasy', 'artwork', 'cool'],
  metafields: {
    designId: 'design-123',
    creatorId: 'creator-456'
  }
};
```

### Dynamic Option Logic
```javascript
// React component for option selection
const SuperProductOptions = ({ superProduct, onSelectionChange }) => {
  const [selectedStyle, setSelectedStyle] = useState(superProduct.options.style.values[0]);
  const [selectedFit, setSelectedFit] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);

  // Update available options based on selected style
  useEffect(() => {
    const style = superProduct.options.style.values.find(s => s.id === selectedStyle.id);
    
    // Reset dependent selections
    setSelectedFit(style.fits?.[0] || null);
    setSelectedColor(style.colors[0]);
    setSelectedSize(style.sizes[0]);
    
    // Update parent component
    onSelectionChange({
      style,
      fit: style.fits?.[0] || null,
      color: style.colors[0],
      size: style.sizes[0]
    });
  }, [selectedStyle]);

  return (
    <div className="super-product-options">
      {/* Style Selector */}
      <div className="option-group">
        <h3>Style</h3>
        <div className="style-grid">
          {superProduct.options.style.values.map(style => (
            <div 
              key={style.id}
              className={`style-option ${selectedStyle.id === style.id ? 'selected' : ''}`}
              onClick={() => setSelectedStyle(style)}
            >
              <MockupPreview 
                garmentType={style.id}
                color={selectedColor}
                designImage={superProduct.designImage}
                width={120}
                height={160}
              />
              <span className="style-name">{style.name}</span>
              <span className="style-price">${style.price}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Fit Selector (if applicable) */}
      {selectedStyle.fits && (
        <div className="option-group">
          <h3>Fit</h3>
          <div className="fit-buttons">
            {selectedStyle.fits.map(fit => (
              <button
                key={fit}
                className={`fit-button ${selectedFit === fit ? 'selected' : ''}`}
                onClick={() => setSelectedFit(fit)}
              >
                {fit}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Color Selector */}
      <div className="option-group">
        <h3>Color</h3>
        <div className="color-grid">
          {selectedStyle.colors.map(color => (
            <div
              key={color}
              className={`color-option ${selectedColor === color ? 'selected' : ''}`}
              onClick={() => setSelectedColor(color)}
            >
              <MockupPreview
                garmentType={selectedStyle.id}
                color={color}
                designImage={superProduct.designImage}
                width={80}
                height={100}
                showColorName={true}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Size Selector */}
      <div className="option-group">
        <h3>Size</h3>
        <div className="size-buttons">
          {selectedStyle.sizes.map(size => (
            <button
              key={size}
              className={`size-button ${selectedSize === size ? 'selected' : ''}`}
              onClick={() => setSelectedSize(size)}
            >
              {size}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
```

### Cart Integration Logic
```javascript
const addToCart = async (superProductSelection) => {
  const { style, fit, color, size } = superProductSelection;
  
  // Map to actual Shopify product
  const actualProduct = await findShopifyProduct(style.shopifyProduct);
  
  // Find the exact variant
  const variant = actualProduct.variants.find(v => 
    v.option1 === color && 
    v.option2 === size &&
    (fit ? v.option3 === fit : true)
  );

  if (!variant) {
    throw new Error('Selected combination not available');
  }

  // Add actual Shopify product variant to cart
  const response = await fetch('/cart/add.js', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: variant.id,
      quantity: 1,
      // Include SuperProduct context for analytics
      properties: {
        '_superproduct_id': superProduct.id,
        '_superproduct_title': superProduct.title,
        '_design_id': superProduct.metafields.designId
      }
    })
  });

  return response.json();
};
```

## Shopify Template Structure

### Custom Template: `templates/page.design.liquid`
```liquid
<!-- SuperProduct Page Template -->
<div class="super-product-page" data-design-id="{{ page.metafields.tresr.design_id }}">
  
  <!-- Hero Section -->
  <div class="super-product-hero">
    <div class="design-showcase">
      <!-- Main design image -->
      <img src="{{ page.metafields.tresr.design_image }}" alt="{{ page.title }}">
    </div>
    
    <div class="product-details">
      <h1>{{ page.title }}</h1>
      <p>{{ page.content }}</p>
      
      <!-- Creator info -->
      <div class="creator-info">
        <span>Created by</span>
        <a href="/creators/{{ page.metafields.tresr.creator_handle }}">
          {{ page.metafields.tresr.creator_name }}
        </a>
      </div>
      
      <!-- React component will mount here -->
      <div id="super-product-options"></div>
      
      <!-- Add to cart area -->
      <div class="add-to-cart-section">
        <div class="price-display">
          <span class="current-price">$<span id="dynamic-price">22</span></span>
        </div>
        <button id="add-to-cart-btn" class="btn-add-to-cart">
          Add to Cart
        </button>
      </div>
    </div>
  </div>

  <!-- Related designs or creator work -->
  <div class="related-designs">
    <!-- Auto-populated based on creator or tags -->
  </div>
</div>

<script>
  // Initialize React component
  window.addEventListener('DOMContentLoaded', () => {
    const superProductData = {
      id: '{{ page.metafields.tresr.design_id }}',
      title: '{{ page.title | escape }}',
      designImage: '{{ page.metafields.tresr.design_image }}',
      // Load product options from metafields or API
    };
    
    ReactDOM.render(
      React.createElement(SuperProductOptions, {
        superProduct: superProductData,
        onSelectionChange: updatePriceAndCart
      }),
      document.getElementById('super-product-options')
    );
  });
</script>
```

### Backend Data Management
```javascript
// API endpoint to get SuperProduct data
app.get('/api/superproducts/:id', async (req, res) => {
  const designId = req.params.id;
  
  // Get all Shopify products for this design
  const products = await shopify.rest.Product.all({
    session,
    metafields: `tresr.design_id=${designId}`
  });
  
  // Transform into SuperProduct format
  const superProduct = {
    id: designId,
    title: products[0]?.metafields?.tresr?.design_title,
    designImage: products[0]?.metafields?.tresr?.design_image,
    options: {
      style: {
        name: 'Style',
        values: products.map(product => ({
          name: product.title.replace(superProduct.title + ' - ', ''),
          shopifyProduct: product.handle,
          price: Math.min(...product.variants.map(v => v.price)),
          colors: [...new Set(product.variants.map(v => v.option1))],
          sizes: [...new Set(product.variants.map(v => v.option2))],
          fits: product.variants.some(v => v.option3) ? 
            [...new Set(product.variants.map(v => v.option3))] : null
        }))
      }
    }
  };
  
  res.json(superProduct);
});
```

## Creator Dashboard Integration

### Design-First Workflow
```javascript
// Creator creates design once, system generates all products
const publishDesign = async (designData) => {
  // 1. Create SuperProduct page
  const superProductPage = await createSupeProductPage(designData);
  
  // 2. Create individual Shopify products (hidden from navigation)
  const shopifyProducts = await Promise.all(
    designData.enabledGarments.map(garment => 
      createShopifyProduct(designData, garment, { 
        published: true,
        published_scope: 'global',
        // Hide from collection pages and search
        tags: 'hidden-product,super-product-child'
      })
    )
  );
  
  // 3. Link everything together via metafields
  await linkSuperProductToShopifyProducts(superProductPage, shopifyProducts);
  
  return {
    superProductUrl: `/designs/${designData.handle}`,
    shopifyProducts: shopifyProducts
  };
};
```

## Search & Collections Strategy

### Search Integration
SuperProducts need to appear in Shopify search results while actual products remain hidden:

```javascript
// SuperProduct Page Setup
const superProductPage = {
  title: 'Cool Dragon Design',
  handle: 'cool-dragon-design',
  template_suffix: 'design', // Uses templates/page.design.liquid
  metafields: [
    {
      namespace: 'tresr',
      key: 'design_id',
      value: 'design-123'
    },
    {
      namespace: 'tresr', 
      key: 'searchable',
      value: 'true' // Include in search results
    },
    {
      namespace: 'tresr',
      key: 'product_type',
      value: 'design' // For filtering
    }
  ]
};

// Actual Shopify Products (Hidden from Search)
const hiddenProduct = {
  title: 'Cool Dragon - Classic T-Shirt',
  published: true,
  published_scope: 'global',
  tags: 'hidden-product,super-product-child,exclude-search',
  metafields: [
    {
      namespace: 'tresr',
      key: 'parent_design',
      value: 'cool-dragon-design'
    },
    {
      namespace: 'tresr',
      key: 'searchable', 
      value: 'false' // Exclude from search
    }
  ]
};
```

### Collection Architecture
Create collections that showcase SuperProducts, not individual products:

#### 1. Design Collections (Auto-Generated)
```javascript
// Each design gets its own collection for related products
const designCollection = {
  title: 'Cool Dragon Design',
  handle: 'cool-dragon-design-collection',
  description: 'All products featuring the Cool Dragon Design',
  template_suffix: 'design-collection',
  
  // Custom collection that links to SuperProduct page
  metafields: [
    {
      namespace: 'tresr',
      key: 'superproduct_url',
      value: '/designs/cool-dragon-design'
    },
    {
      namespace: 'tresr',
      key: 'design_image',
      value: 'https://cdn.shopify.com/design-123.png'
    }
  ]
};
```

#### 2. Creator Collections
```javascript
// Collections for each creator's work
const creatorCollection = {
  title: 'DragonArtist Designs',
  handle: 'dragonartist-designs',
  description: 'All designs by DragonArtist',
  template_suffix: 'creator-collection',
  
  // Contains links to SuperProduct pages
  metafields: [
    {
      namespace: 'tresr',
      key: 'creator_id',
      value: 'creator-456'
    },
    {
      namespace: 'tresr',
      key: 'collection_type',
      value: 'creator'
    }
  ]
};
```

#### 3. Category Collections
```javascript
// Thematic collections (Fantasy, Gaming, etc.)
const categoryCollection = {
  title: 'Fantasy Designs',
  handle: 'fantasy-designs',
  description: 'Mystical and fantasy-themed artwork',
  template_suffix: 'category-collection',
  
  // Links to SuperProduct pages in this category
  metafields: [
    {
      namespace: 'tresr',
      key: 'category',
      value: 'fantasy'
    }
  ]
};
```

### Search Results Customization
```liquid
<!-- search.liquid template modification -->
{% for page in search.results %}
  {% if page.type == 'page' and page.metafields.tresr.searchable == 'true' %}
    <!-- SuperProduct result -->
    <div class="search-result superproduct-result">
      <a href="/designs/{{ page.handle }}">
        <img src="{{ page.metafields.tresr.design_image }}" alt="{{ page.title }}">
        <h3>{{ page.title }}</h3>
        <p>{{ page.content | strip_html | truncate: 150 }}</p>
        <span class="result-type">Design</span>
      </a>
    </div>
  {% endif %}
{% endfor %}

<!-- Hide individual products from search results -->
{% for product in search.results %}
  {% unless product.tags contains 'hidden-product' %}
    <!-- Normal product result -->
  {% endunless %}
{% endfor %}
```

### Collection Page Templates

#### Template: `templates/collection.design-collection.liquid`
```liquid
<!-- Design Collection - showcases one design -->
<div class="design-collection-page">
  {% assign superproduct_url = collection.metafields.tresr.superproduct_url %}
  
  <div class="design-hero">
    <img src="{{ collection.metafields.tresr.design_image }}" alt="{{ collection.title }}">
    <div class="design-info">
      <h1>{{ collection.title }}</h1>
      <p>{{ collection.description }}</p>
      <a href="{{ superproduct_url }}" class="btn-view-design">
        View Design Options
      </a>
    </div>
  </div>
  
  <!-- Show available products as preview -->
  <div class="available-products">
    <h2>Available on {{ collection.products.size }} products</h2>
    <div class="product-previews">
      {% for product in collection.products limit: 6 %}
        <div class="product-preview" onclick="window.location='{{ superproduct_url }}'">
          <img src="{{ product.featured_image | img_url: '200x200' }}" alt="{{ product.title }}">
          <span>{{ product.title | replace: collection.title, '' | strip }}</span>
        </div>
      {% endfor %}
    </div>
  </div>
</div>
```

#### Template: `templates/collection.creator-collection.liquid`
```liquid
<!-- Creator Collection - showcases all designs by one creator -->
<div class="creator-collection-page">
  {% assign creator_id = collection.metafields.tresr.creator_id %}
  
  <div class="creator-header">
    <h1>{{ collection.title }}</h1>
    <p>{{ collection.description }}</p>
  </div>
  
  <!-- Grid of SuperProduct pages -->
  <div class="designs-grid">
    {% comment %} 
    Note: This would actually query SuperProduct pages, not products
    Need custom logic to get pages with matching creator_id metafield
    {% endcomment %}
    
    {% assign creator_pages = pages | where: 'metafields.tresr.creator_id', creator_id %}
    {% for page in creator_pages %}
      <div class="design-card">
        <a href="/designs/{{ page.handle }}">
          <img src="{{ page.metafields.tresr.design_image }}" alt="{{ page.title }}">
          <h3>{{ page.title }}</h3>
        </a>
      </div>
    {% endfor %}
  </div>
</div>
```

### Navigation Integration
```liquid
<!-- Main navigation includes collections that point to SuperProducts -->
<nav class="main-navigation">
  <ul>
    <li><a href="/collections/all-designs">All Designs</a></li>
    <li><a href="/collections/fantasy-designs">Fantasy</a></li>
    <li><a href="/collections/gaming-designs">Gaming</a></li>
    <li><a href="/collections/abstract-designs">Abstract</a></li>
    <li><a href="/creators">Creators</a></li>
  </ul>
</nav>

<!-- Collection pages show SuperProduct links, not individual products -->
```

### SEO Strategy
```html
<!-- SuperProduct pages get full SEO treatment -->
<head>
  <title>{{ page.title }} - Custom Design | TRESR</title>
  <meta name="description" content="{{ page.content | strip_html | truncate: 160 }}">
  
  <!-- Rich snippets for designs -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": "{{ page.title }}",
    "image": "{{ page.metafields.tresr.design_image }}",
    "description": "{{ page.content | strip_html }}",
    "brand": {
      "@type": "Brand", 
      "name": "TRESR"
    },
    "offers": {
      "@type": "AggregateOffer",
      "lowPrice": "15",
      "highPrice": "48",
      "priceCurrency": "USD"
    }
  }
  </script>
</head>

<!-- Individual products have noindex to avoid duplicate content -->
<meta name="robots" content="noindex,nofollow">
```

## SEO & Analytics Benefits

### URL Structure
- **SuperProduct**: `/designs/cool-dragon-design` (user-facing, SEO-optimized)
- **Collections**: `/collections/fantasy-designs` (showcase SuperProducts)
- **Actual Products**: `/products/cool-dragon-*` (hidden from search, cart-only)

### Search Benefits
- **Clean Search Results**: Only show SuperProduct pages, not cluttered individual products
- **Better User Intent**: Users find designs, not specific garment variants
- **Reduced Bounce Rate**: Unified experience keeps users engaged

### Analytics Tracking
```javascript
// Track SuperProduct interactions
analytics.track('SuperProduct Viewed', {
  designId: superProduct.id,
  designTitle: superProduct.title,
  creatorId: superProduct.metafields.creatorId
});

// Track style changes
analytics.track('Style Selected', {
  designId: superProduct.id,
  selectedStyle: style.name,
  price: style.price
});

// Track cart additions with full context
analytics.track('Product Added to Cart', {
  // SuperProduct context
  superProductId: superProduct.id,
  designTitle: superProduct.title,
  
  // Actual selection
  productId: actualProduct.id,
  variantId: variant.id,
  style: style.name,
  color: color,
  size: size,
  price: variant.price
});
```

## Search & Collections Strategy

### Hiding Individual Products from Search
```javascript
// Tag all individual Shopify products as hidden
const createShopifyProduct = async (designData, garment) => {
  return await shopify.rest.Product.save({
    session,
    title: `${designData.title} - ${garment.name}`,
    published: true,
    published_scope: 'global',
    
    // Critical: Hide from search and collections
    tags: [
      'hidden-product',           // Hide from search results
      'super-product-child',      // Identify as child product
      'exclude-from-collections', // Exclude from auto-collections
      designData.id,             // Link to SuperProduct
      garment.category
    ].join(','),
    
    // Hide from sitemap and search engines
    metafields: [
      {
        namespace: 'seo',
        key: 'hidden',
        value: 'true',
        type: 'boolean'
      }
    ]
  });
};
```

### Search Results Filtering
```liquid
<!-- templates/search.liquid -->
<div class="search-results">
  {% assign filtered_results = search.results | where: 'object_type', 'page' %}
  {% assign product_results = search.results | where: 'object_type', 'product' %}
  
  <!-- Filter out hidden products -->
  {% assign visible_products = '' | split: ',' %}
  {% for product in product_results %}
    {% unless product.tags contains 'hidden-product' %}
      {% assign visible_products = visible_products | append: product %}
    {% endunless %}
  {% endfor %}
  
  <!-- Show SuperProduct pages first -->
  {% for page in filtered_results %}
    {% if page.template_suffix == 'design' %}
      {% render 'superproduct-search-result', page: page %}
    {% endif %}
  {% endfor %}
  
  <!-- Then show visible products -->
  {% for product in visible_products %}
    {% render 'product-search-result', product: product %}
  {% endfor %}
</div>
```

### SuperProduct Collections System

#### Auto-Generated Collections Structure
```javascript
const collectionHierarchy = {
  // Top-level category collections (SuperProducts only)
  'superproduct-apparel': {
    title: 'Apparel Designs',
    handle: 'apparel',
    type: 'superproduct',
    filter: (page) => page.metafields.tresr.categories.includes('apparel')
  },
  
  'superproduct-drinkware': {
    title: 'Drinkware Designs', 
    handle: 'drinkware',
    type: 'superproduct',
    filter: (page) => page.metafields.tresr.categories.includes('drinkware')
  },
  
  // Creator collections (SuperProducts only)
  'creator-collections': {
    title: 'By Creator',
    type: 'dynamic',
    generateCollections: (creators) => creators.map(creator => ({
      title: `${creator.name} Designs`,
      handle: `creator-${creator.handle}`,
      filter: (page) => page.metafields.tresr.creator_id === creator.id
    }))
  }
};
```

#### Collection Page Templates
```liquid
<!-- templates/collection.superproduct.liquid -->
<div class="superproduct-collection">
  <div class="collection-header">
    <h1>{{ collection.title }}</h1>
    <p>{{ collection.description }}</p>
  </div>
  
  <!-- Filter/Sort Controls -->
  <div class="collection-filters">
    <select id="sort-by">
      <option value="created-desc">Newest First</option>
      <option value="popularity">Most Popular</option>
      <option value="price-asc">Price: Low to High</option>
    </select>
    
    <div class="filter-tags">
      <button class="filter-tag" data-filter="apparel">Apparel</button>
      <button class="filter-tag" data-filter="drinkware">Drinkware</button>
      <button class="filter-tag" data-filter="accessories">Accessories</button>
    </div>
  </div>
  
  <!-- SuperProduct Grid -->
  <div class="superproduct-grid">
    {% for page in collection.pages %}
      {% if page.template_suffix == 'design' %}
        <div class="superproduct-card" data-categories="{{ page.metafields.tresr.categories }}">
          <a href="{{ page.url }}">
            <div class="design-preview">
              <img src="{{ page.metafields.tresr.design_image }}" alt="{{ page.title }}">
            </div>
            <div class="design-info">
              <h3>{{ page.title }}</h3>
              <p>By {{ page.metafields.tresr.creator_name }}</p>
              <div class="product-count">
                Available on {{ page.metafields.tresr.product_count }} products
              </div>
              <div class="price-range">
                From ${{ page.metafields.tresr.min_price }}
              </div>
            </div>
          </a>
        </div>
      {% endif %}
    {% endfor %}
  </div>
</div>
```

### Navigation & Menu Structure
```liquid
<!-- snippets/main-navigation.liquid -->
<nav class="main-navigation">
  <ul class="nav-menu">
    <li class="nav-item">
      <a href="/collections/all-designs">All Designs</a>
    </li>
    <li class="nav-item dropdown">
      <a href="/collections/apparel">Apparel</a>
      <ul class="dropdown-menu">
        <li><a href="/collections/t-shirts">T-Shirts</a></li>
        <li><a href="/collections/hoodies">Hoodies</a></li>
        <li><a href="/collections/accessories">Accessories</a></li>
      </ul>
    </li>
    <li class="nav-item">
      <a href="/collections/creators">Browse by Creator</a>
    </li>
  </ul>
</nav>
```

### Search Enhancement with JavaScript
```javascript
// Enhanced search that prioritizes SuperProducts
const enhanceSearch = () => {
  const searchForm = document.querySelector('#search-form');
  const searchInput = searchForm.querySelector('input[name="q"]');
  
  searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = searchInput.value;
    
    // Custom search endpoint that filters results
    fetch(`/search/superproducts?q=${encodeURIComponent(query)}`)
      .then(response => response.json())
      .then(results => {
        displaySearchResults(results);
      });
  });
};

// Custom search endpoint response
const searchSuperProducts = async (query) => {
  // Search only SuperProduct pages and visible products
  const results = await shopify.graphql(`
    query searchSuperProducts($query: String!) {
      pages(first: 20, query: $query, where: {template_suffix: "design"}) {
        edges {
          node {
            id
            title
            handle
            content
            metafields(namespace: "tresr") {
              key
              value
            }
          }
        }
      }
    }
  `, { query });
  
  return results.pages.edges.map(edge => edge.node);
};
```

### SEO & Sitemap Management
```xml
<!-- sitemap.xml generation -->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Include SuperProduct pages -->
  {% for page in pages %}
    {% if page.template_suffix == 'design' %}
      <url>
        <loc>{{ shop.url }}{{ page.url }}</loc>
        <lastmod>{{ page.updated_at | date: '%Y-%m-%d' }}</lastmod>
        <priority>0.8</priority>
      </url>
    {% endif %}
  {% endfor %}
  
  <!-- Include SuperProduct collections -->
  {% for collection in collections %}
    {% if collection.handle contains 'superproduct' or collection.template_suffix == 'superproduct' %}
      <url>
        <loc>{{ shop.url }}{{ collection.url }}</loc>
        <lastmod>{{ collection.updated_at | date: '%Y-%m-%d' }}</lastmod>
        <priority>0.7</priority>
      </url>
    {% endif %}
  {% endfor %}
  
  <!-- Exclude hidden individual products from sitemap -->
</urlset>
```

### Admin Collection Management
```javascript
// Auto-create SuperProduct collections
const createSuperProductCollections = async () => {
  const collections = [
    {
      title: 'All Designs',
      handle: 'all-designs',
      collection_type: 'smart',
      rules: [
        {
          column: 'tag',
          relation: 'equals',
          condition: 'superproduct'
        }
      ],
      template_suffix: 'superproduct'
    },
    {
      title: 'New Designs',
      handle: 'new-designs', 
      collection_type: 'smart',
      rules: [
        {
          column: 'tag',
          relation: 'equals',
          condition: 'superproduct'
        },
        {
          column: 'created_at',
          relation: 'greater_than',
          condition: '30 days ago'
        }
      ]
    }
  ];
  
  return Promise.all(collections.map(collection => 
    shopify.rest.Collection.save({ session, ...collection })
  ));
};
```

## Implementation Priority

### Phase 1: Core SuperProduct Page (Week 1)
- Create page template structure
- Build React option selector component
- Implement cart switching logic
- **Set up product tagging and search filtering**

### Phase 2: Creator Integration (Week 2)
- Update creator dashboard to generate SuperProducts
- Implement design-first publishing workflow
- Add product linking via metafields
- **Create SuperProduct collection system**

### Phase 3: UX Polish (Week 3)
- Add smooth transitions between options
- Implement real-time mockup updates
- Add related designs and creator sections
- **Optimize search and navigation experience**

### Phase 4: Search & Collections (Week 4)
- **Implement enhanced search functionality**
- **Create automated collection generation**
- **Set up SEO and sitemap optimization**
- **Build admin tools for collection management**

This approach gives you **the best of both worlds**: seamless customer UX with scalable backend architecture while maintaining clean search results and logical collection organization!
