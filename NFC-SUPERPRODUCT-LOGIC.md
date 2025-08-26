# NFC SuperProduct Implementation Guide

## NFC Option Behaviors

### 1. Include NFC for all purchases (Default)
**Dropdown Value**: `include-nfc`
**SuperProduct Behavior**:
- NFC chip is automatically included with every purchase
- Price already includes $12 NFC cost
- Display: "✓ NFC Rewards Included" (non-toggleable, grayed out)
- Customer cannot opt out
- Single SKU per size/color combination

### 2. Make NFC Optional (customer chooses)
**Dropdown Value**: `optional-nfc`
**SuperProduct Behavior**:
- Shows toggle: "[ ] Add NFC Rewards (+$12)"
- Customer can enable/disable during purchase
- Price updates dynamically when toggled
- Creates 2x variants (with/without NFC for each size/color)
- Example: Black/Medium becomes:
  - Black/Medium/No-NFC ($25)
  - Black/Medium/With-NFC ($37)

### 3. Do Not Include NFC Ever
**Dropdown Value**: `no-nfc`
**SuperProduct Behavior**:
- NFC option completely hidden
- No mention of NFC/rewards on product page
- Standard pricing without NFC
- Single SKU per size/color combination

## Variant Calculation Formula

```javascript
// Base calculation: enabled products × selected colors × sizes
baseVariants = Σ(enabledProducts × selectedColors × 8 sizes)

// NFC multiplier
if (nfcOption === 'optional-nfc') {
  totalVariants = baseVariants × 2  // Each variant has with/without NFC
} else {
  totalVariants = baseVariants      // No additional variants
}
```

### Example Calculations

**Scenario 1: 2 products, 3 colors each, Include NFC**
- Product 1: 3 colors × 8 sizes = 24 variants
- Product 2: 3 colors × 8 sizes = 24 variants
- Total: 48 variants (NFC included in all)

**Scenario 2: Same setup, Optional NFC**
- Base: 48 variants
- With NFC option: 48 × 2 = 96 variants total

**Scenario 3: Same setup, No NFC**
- Total: 48 variants (no NFC option)

## Implementation in SuperProduct Page

### Frontend Display

```jsx
// SuperProduct.jsx
{nfcOption === 'include-nfc' && (
  <div className="nfc-included">
    <CheckIcon /> NFC Rewards Included
    <span className="price-note">Price includes NFC chip</span>
  </div>
)}

{nfcOption === 'optional-nfc' && (
  <div className="nfc-optional">
    <input 
      type="checkbox" 
      onChange={(e) => {
        setIncludeNFC(e.target.checked);
        updatePrice(basePrice + (e.target.checked ? 12 : 0));
      }}
    />
    <label>Add NFC Rewards (+$12)</label>
  </div>
)}

{/* No display for no-nfc option */}
```

### Shopify Product Structure

**Include NFC**:
```
Product: Design Name
Variants:
- Black/S ($37 - includes NFC)
- Black/M ($37 - includes NFC)
- Black/L ($37 - includes NFC)
```

**Optional NFC**:
```
Product: Design Name
Variants:
- Black/S/Standard ($25)
- Black/S/With-NFC ($37)
- Black/M/Standard ($25)
- Black/M/With-NFC ($37)
```

**No NFC**:
```
Product: Design Name
Variants:
- Black/S ($25)
- Black/M ($25)
- Black/L ($25)
```

## Backend Considerations

1. **Metafields**: Store NFC option in product metafields
2. **Inventory**: Track NFC chip inventory separately
3. **Fulfillment**: Tag orders requiring NFC chips
4. **Pricing**: Dynamic pricing based on NFC selection

## User Experience Flow

1. **Designer** selects NFC option in design editor
2. **System** calculates correct variant count
3. **Customer** sees appropriate NFC options on product page
4. **Cart** reflects NFC selection and pricing
5. **Order** includes NFC fulfillment instructions

## Testing Checklist

- [ ] Variant count updates correctly when changing NFC option
- [ ] "Include NFC" shows as non-editable on SuperProduct
- [ ] "Optional NFC" toggle works and updates price
- [ ] "No NFC" completely hides NFC options
- [ ] Cart correctly reflects NFC selections
- [ ] Order data includes NFC variant information