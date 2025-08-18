# **TRESR Product Requirements Document (PRD)**

### Version 1.3

### Date: August 18, 2025

---

## **1. Product Overview**

TRESR is a **print-on-demand (POD) SaaS platform + Shopify plugin layer** that enables creators to rapidly upload, test, and scale apparel designs. It automates SuperProduct creation, credit-based workflows, ad testing, NFC engagement, and Shopify storefront optimization.

Creators will be able to:

* Upload designs and map them to multiple garments.
* Auto-generate SuperProducts in Shopify with dark/light variants.
* Run and validate Facebook ads.
* Track sales, orders, and analytics.
* Use a credit-based system tied to Treasure Key NFTs (NFKEYs).
* Manage NFC missions, coupons, and creator-branded storefronts.

---

## **2. Key Objectives**

1. Streamline high-volume design testing (7–10 per day, scaling to 50+).
2. Make SuperProducts the central hierarchy for design → variants.
3. Provide optimized, mobile-first Shopify storefronts.
4. Deliver multi-creator commissions and NFKEY-linked rewards.
5. Power all actions through credits/points.
6. Support NFC-driven engagement and mission systems.

---

## **3. User Roles**

* **Admin**

  * Full backend access.
  * God mode (login as any user).
  * Manage payouts, credits, commissions, print routing, NFC settings.

* **Creator**

  * Upload/manage designs.
  * Create SuperProducts, collections, coupons.
  * Track analytics, orders, NFC scans.
  * Run or delegate ads.
  * Manage credits and commissions.

* **Customer/Community Member**

  * Purchase products.
  * Track orders & shipping.
  * Scan NFC-enabled garments.
  * Join missions, opt in to email/SMS.
  * Earn or redeem credits in marketplace.

---

## **4. Core Features**

### **4.1 Creator Portal (creators.tresr.com)**

* **Design Upload & Mapping**

  * Upload images.
  * Map designs to 10+ garment templates.
  * Adjust bounding boxes.
  * Generate dark/light logo variants.

* **SuperProduct Creation**

  * Automatically generate Shopify SuperProducts from uploaded designs.
  * HTML5 canvas merges images into variants.
  * Variants grouped under one product page with drop-down menu.

* **Collection Management**

  * Auto-generate a brand collection per creator.
  * Allow custom collections.

* **Mockup Editor**

  * Swap backgrounds (studio, lifestyle, seasonal).
  * Sync mockups directly to Shopify product pages.

* **Metadata Editing**

  * Update product descriptions, SEO metadata, collection details.

* **Analytics Dashboard**

  * Pull Shopify stats API.
  * View sales, CTR, ad ROI by brand, collection, or product.

* **Order Tracking**

  * All users can view past Shopify orders and current tracking info.

---

### **4.2 Credits & Currency System**

* **All actions cost credits**, modeled after Gumloop/Loveable. Examples:

  * Create SuperProduct = X credits.
  * Edit variant = Y credits.
  * Run ads = Z credits.
* **Credits earned via NFKEYs** (formula TBD).
* Marketplace for buying/selling credits (lowest-offer orderbook).
* Redeemable for coupons, consulting, gear, ads, or community membership.

---

### **4.3 Ads & Marketing**

* Pixel injection per creator (custom FB pixel on SuperProducts).
* Adspend portal to fund campaigns.
* TRESR-managed ads (redeem credits to delegate).
* Analytics synced back into dashboard.

---

### **4.4 NFC Integration**

* Assign NFC chips to products.
* Dashboard for scan tracking (time, location, frequency).
* Missions system (e.g., scan at Starbucks for reward).
* Opt-in on first scan: collect email & phone, enable push notifications.
* Future: geolasso builder + creator vibe-code NFC APIs.

---

### **4.5 Backend/Admin Panel**

(From attached screenshot + requirements)

* User Management.
* Admin Panel.
* Product Templates.
* Bounding Box Editor.
* Commission Management.
* Garment Management.
* System Settings.
* **God Mode**: login as any user for troubleshooting.

---

### **4.6 Commissions & Coupons**

* NFKEY-linked dynamic commission rates.
* NFKEY discounts integrated at checkout.
* Commissions based on **final sale value only**, not retail (after discounts/coupons).
* Opt-in signature agreement required for all creators.
* Creators can generate coupons scoped to:

  * Entire brand.
  * Specific collections.
  * Individual products.

---

### **4.7 Security Requirements**

* Protect API endpoints.
* No client-side admin logic.
* Enforce user isolation.
* No secrets in frontend.
* Prevent property overrides (e.g., `isAdmin`).
* Review endpoints/sitemaps.
* Row-level security (Railway DB).
* Don’t return sensitive fields.
* No incremental IDs.
* Run Google Dork checks.
* Authentication via Dynamic.xyz API.

---

### **4.8 Fulfillment / Order Routing**

* Printify-style routing for regional/national/global print partners.
* Sync orders and image assets to print shop.
* NFC upsell flow after purchase.
* Import button to migrate old Sanity-stored products into new dashboard.

---

## **5. Critical Path / MVP Requirements**

These must be functional at launch:

1. **SuperProducts**

   * Setup and working for all old bestselling designs.
   * Setup and working for all new designs uploaded.
2. **Shopify Storefront**

   * Homepage complete and optimized (desktop + mobile).
   * Mobile-first: homepage, product, and collection pages must show **2-product width scrolling grid**.
3. **Creator Collection Pages**

   * Each creator has custom template: name, description, banner, logo, video URL, SEO text.
   * Each collection has SEO-optimized template: title, description, SEO text, keywords.
4. **NFKEY Commissions**

   * NFKEY discounts + commission tracking integrated.
   * Dynamic commission rates by NFKEY level.
   * Commissions based on final sale amount only.
   * Opt-in signature agreement enforced.
5. **Coupons**

   * Creators can create coupons for brand, collections, or products.

---

## **6. Technical Integrations**

* Shopify API (SuperProducts, orders, analytics, coupons).
* Dynamic.xyz (auth, wallet scan, NFKEY logic).
* Facebook Ads API.
* Print shop API.
* HTML5 Canvas (image merging).
* Railway DB.
* ImgOnline (remove color).
* Image upscaler (TBD).

---

## **7. Future / Aspirational Features**

* Gumloop-style **batch design generator**: spreadsheet rows → OpenAI → 50+ POD designs.
* Built-in GPT for design ideation.
* Automated image pipeline (remove background, upscale, ensure print-ready).
* Batch mockup generation.
* Community gamification (leaderboards, scan-to-earn).
* Shared TRESR marketplace for cross-promotion.
* White-label offering for other POD brands.

---

## **8. Open Questions**

1. Credit formula for NFKEY levels.
2. One-time vs. recurring credit issuance.
3. Expiration rules for credits.
4. Which image upscaler API to standardize.
5. How bulk commissions reporting/payouts are handled.
6. Workflow for creator coupon approvals (manual vs. auto).
7. Should credit costs be fixed or dynamic?

---

✅ This master PRD now contains **all core features, MVP requirements, credits system, NFC, commissions, coupons, order tracking, security, integrations, and aspirational roadmap** in one place.