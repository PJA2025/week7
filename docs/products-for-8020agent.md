# Products and ngrams Analysis Page

## Overview
A new analysis page that categorizes products into performance buckets and provides visual insights through tables and charts. This will be added to the main navigation menu above "Budget Optimization" in the "Analyse Account" submenu.

## Initial Setup Requirements

### Router and Navigation Setup
Before implementing the page functionality, we need to add the new page to the application:

1. **Add route to router** (`src/main.tsx` or router config)
   - Add new route: `/products`
   - Import and configure the ProductsNgrams component

2. **Update main navigation** 
   - Add "Products & ngrams" to the main menu
   - Position above "Budget Optimization" in "Analyse Account" submenu
   - Ensure proper navigation highlighting

3. **Create page component structure**
   - Create `src/pages/products-ngrams.tsx`
   - Add basic page layout with header
   - Include navigation breadcrumb

## Page Structure

### Navigation
- **Location**: Main menu → Analyse Account → Products & ngrams
- **Position**: Above existing "Budget Optimization" option

## Core Functionality

### 1. Product Bucketing System
Products are categorized into **6 distinct buckets** based on performance metrics:

#### Bucket Definitions
1. **Zombies** - Products with impressions but no clicks (no cost)
2. **Zero Conversions** - Products with cost > 0 but conversions = 0
3. **Costly** - Products above cost threshold + below ROAS threshold
4. **Meh** - Products below cost threshold + below ROAS threshold  
5. **Profitable** - Products above cost threshold + above ROAS threshold
6. **Flukes** - Products below cost threshold + above ROAS threshold

#### Bucketing Logic
```
Cost/Clicks Threshold (Vertical Split)
├── Above Threshold: Costly | Profitable
└── Below Threshold: Meh | Flukes

ROAS/CPA Threshold (Horizontal Split)  
├── Below Threshold: Costly | Meh
└── Above Threshold: Profitable | Flukes

Special Cases:
├── No Clicks: Zombies
└── No Conversions (but has cost): Zero Conversions
```

### 2. Data Aggregation
- **Aggregation Level**: Product Title (regardless of Product ID or Campaign)
- **Source**: Products dataset from Google Ads script
- **Metrics**: Impressions, Clicks, Cost, Conversions, Value, CTR, ROAS, CvR

### 3. User Controls

#### Threshold Toggles
- **Metric Toggle**: ROAS ↔ CPA (default: ROAS)
- **Volume Toggle**: Cost ↔ Clicks (default: Cost)

#### Threshold Sliders
- **Cost Threshold**: Range 1-100, Default: 10
- **ROAS Threshold**: Range 1-20, Default: 4
- **Future**: CPA and Clicks thresholds when toggles are switched

### 4. Data Visualization

#### Summary Matrix Table
Display for each bucket:
- Number of Product Titles
- Total Cost
- Total Conversions  
- Total Value
- ROAS
- **Future additions**: POAS (Profit on Ad Spend), Profit

#### Product Details Table
- Filterable by bucket
- Show all products with metrics: Product Title, Impressions, Clicks, Cost, Conversions, Value, CTR, ROAS, CvR
- Sortable columns

#### Donut Charts (3 charts)
1. **Number of Titles** - Distribution of product count across buckets
2. **Cost** - Distribution of spend across buckets  
3. **Conversion Value** - Distribution of revenue across buckets

## Technical Implementation Plan

### Phase 1: Data Layer
1. **Create data service functions**
   - `fetchProductsData()` - Get data from products sheet
   - `aggregateProductsByTitle()` - Group by product title, sum metrics
   - `calculateDerivedMetrics()` - Add CTR, ROAS, CvR

### Phase 2: Bucketing Engine
1. **Create bucketing logic**
   - `categorizeProducts(products, thresholds)` - Main bucketing function
   - `getBucketForProduct(product, thresholds)` - Individual product categorization
   - Support for different threshold types (ROAS/CPA, Cost/Clicks)

### Phase 3: UI Components
1. **Page Layout**
   - Header with navigation breadcrumb
   - Controls section (toggles + sliders)
   - Metrics overview cards
   - Charts section (3 donut charts)
   - Detailed table section

2. **Interactive Controls**
   - Toggle components for metric selection
   - Slider components with real-time updates
   - Threshold value displays

3. **Data Tables**
   - Summary matrix table (6 rows for buckets)
   - Detailed products table with filtering/sorting
   - Export functionality

4. **Charts**
   - Three donut charts using Recharts
   - Color-coded by bucket type
   - Interactive tooltips
   - Legend with percentages

### Phase 4: State Management
1. **Context/State Structure**
   ```typescript
   interface ProductsState {
     rawData: ProductData[]
     aggregatedData: AggregatedProduct[]
     bucketedData: BucketedProducts
     thresholds: ThresholdSettings
     filters: FilterSettings
   }
   ```

2. **Real-time Updates**
   - Threshold changes trigger re-bucketing
   - Filter changes update table display
   - All charts/tables stay synchronized

### Phase 5: Styling & UX
1. **Bucket Color Scheme**
   - Profitable: Green
   - Costly: Red  
   - Flukes: Yellow/Orange
   - Meh: Light Purple/Gray
   - Zero Conversions: Dark Gray
   - Zombies: Very Light Gray

2. **Responsive Design**
   - Mobile-friendly charts
   - Collapsible sections
   - Optimized table scrolling

## Data Types

### Core Interfaces
```typescript
interface ProductData {
  campaign: string
  campaignId: string
  productId: string
  productTitle: string
  impressions: number
  clicks: number
  cost: number
  conversions: number
  value: number
}

interface AggregatedProduct {
  productTitle: string
  impressions: number
  clicks: number
  cost: number
  conversions: number
  value: number
  ctr: number
  roas: number
  cvr: number
  cpa?: number
}

interface BucketedProducts {
  profitable: AggregatedProduct[]
  costly: AggregatedProduct[]
  flukes: AggregatedProduct[]
  meh: AggregatedProduct[]
  zeroConversions: AggregatedProduct[]
  zombies: AggregatedProduct[]
}

interface ThresholdSettings {
  metricType: 'roas' | 'cpa'
  volumeType: 'cost' | 'clicks'
  costThreshold: number
  roasThreshold: number
  cpaThreshold?: number
  clicksThreshold?: number
}
```

## Future Enhancements

### N-grams Analysis (Phase 6 - Later Implementation)
After the product bucketing system is complete, we will add n-grams analysis:
- **1-word n-grams**: Single word frequency analysis from product titles
- **2-word n-grams**: Two-word phrase analysis 
- **3-word n-grams**: Three-word phrase analysis
- Performance correlation with n-gram patterns
- Separate tab/section within the Products & ngrams page

### Other Future Additions
1. **Additional Metrics**: POAS, Profit calculations
2. **Advanced Filtering**: Date ranges, campaign filtering
3. **Export Options**: CSV, PDF reports
4. **Comparison Views**: Period-over-period analysis
5. **Optimization Suggestions**: AI-powered recommendations per bucket

## Success Metrics
- Clear visual separation of product performance
- Actionable insights for budget reallocation
- Easy identification of top/bottom performers
- Flexible threshold adjustment for different business models

---

## Development Task Checklist

### ✅ Initial Setup
- [ ] Add `/products` route to router configuration
- [ ] Update main navigation menu with "Products & ngrams" option
- [ ] Position menu item above "Budget Optimization"
- [ ] Create basic page component `src/pages/products.tsx`
- [ ] Add navigation breadcrumb to page header
- [ ] Test navigation and routing works correctly

### ✅ Phase 1: Data Layer
- [ ] Create `fetchProductsData()` function to get data from products sheet
- [ ] Implement `aggregateProductsByTitle()` to group and sum metrics by product title
- [ ] Create `calculateDerivedMetrics()` to add CTR, ROAS, CvR calculations
- [ ] Add error handling for data fetching
- [ ] Test data aggregation with sample data
- [ ] Verify all required metrics are calculated correctly

### ✅ Phase 2: Bucketing Engine
- [ ] Create `getBucketForProduct()` function for individual product categorization
- [ ] Implement `categorizeProducts()` main bucketing function
- [ ] Add support for ROAS vs CPA threshold logic
- [ ] Add support for Cost vs Clicks threshold logic
- [ ] Handle edge cases (zombies, zero conversions)
- [ ] Create unit tests for bucketing logic
- [ ] Test with various threshold combinations

### ✅ Phase 3: UI Components
#### Page Layout
- [ ] Create page header with title and breadcrumb
- [ ] Design controls section layout (toggles + sliders)
- [ ] Create metrics overview cards section
- [ ] Design charts section for 3 donut charts
- [ ] Create detailed table section layout

#### Interactive Controls
- [ ] Build toggle component for ROAS ↔ CPA selection
- [ ] Build toggle component for Cost ↔ Clicks selection
- [ ] Create slider component for cost threshold (1-100, default 10)
- [ ] Create slider component for ROAS threshold (1-20, default 4)
- [ ] Add real-time threshold value displays
- [ ] Connect controls to state management

#### Data Tables
- [ ] Create summary matrix table (6 bucket rows)
- [ ] Build detailed products table with all metrics
- [ ] Add filtering by bucket functionality
- [ ] Add column sorting functionality
- [ ] Implement export functionality
- [ ] Add loading and empty states

#### Charts
- [ ] Create "Number of Titles" donut chart
- [ ] Create "Cost Distribution" donut chart  
- [ ] Create "Conversion Value" donut chart
- [ ] Add color coding by bucket type
- [ ] Implement interactive tooltips
- [ ] Add legends with percentages
- [ ] Ensure charts are responsive

### ✅ Phase 4: State Management
- [ ] Define ProductsState interface and types
- [ ] Create products context provider
- [ ] Implement threshold state management
- [ ] Add filter state management
- [ ] Connect threshold changes to re-bucketing
- [ ] Ensure all components stay synchronized
- [ ] Add loading states for async operations
- [ ] Test state updates and re-renders

### ✅ Phase 5: Styling & UX
#### Bucket Color Scheme
- [ ] Apply green color scheme to Profitable bucket
- [ ] Apply red color scheme to Costly bucket
- [ ] Apply yellow/orange color scheme to Flukes bucket
- [ ] Apply light purple/gray color scheme to Meh bucket
- [ ] Apply dark gray color scheme to Zero Conversions bucket
- [ ] Apply very light gray color scheme to Zombies bucket

#### Responsive Design
- [ ] Ensure charts work on mobile devices
- [ ] Make tables horizontally scrollable on small screens
- [ ] Add collapsible sections for mobile
- [ ] Test on various screen sizes
- [ ] Optimize touch interactions
- [ ] Add loading spinners and skeleton states

### ✅ Testing & Polish
- [ ] Test with real products data
- [ ] Verify bucketing accuracy with manual calculations
- [ ] Test all threshold combinations
- [ ] Check responsive design on multiple devices
- [ ] Verify chart interactions work correctly
- [ ] Test table filtering and sorting
- [ ] Add error boundaries and error handling
- [ ] Performance test with large datasets
- [ ] Cross-browser compatibility testing

### ✅ Future Phase 6: N-grams (Later)
- [ ] Design n-grams analysis UI
- [ ] Implement 1-word n-gram extraction
- [ ] Implement 2-word n-gram extraction  
- [ ] Implement 3-word n-gram extraction
- [ ] Add performance correlation analysis
- [ ] Create separate tab/section for n-grams
- [ ] Add n-grams visualization components
