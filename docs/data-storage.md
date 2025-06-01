# Data Storage Architecture

This document explains how data is stored, fetched, and managed in the Google Ads Dashboard application.

## Overview

The application uses a **Google Sheets-based data storage** approach where Google Ads data is exported to Google Sheets via Google Apps Script, and the React application fetches this data via the Google Sheets API.

## Data Flow

```
Google Ads API → Google Apps Script → Google Sheets → React App
```

1. **Google Apps Script** runs GAQL (Google Ads Query Language) queries against the Google Ads API
2. **Processed data** is written to specific tabs in a Google Sheet
3. **React application** fetches data from the Google Sheet via HTTP requests
4. **Data is cached** in the application using SWR for efficient re-fetching

## Google Sheets Structure

The application expects data in the following sheet tabs:

### Daily Tab (`daily`)
Campaign-level daily performance data.

**Columns:**
- `campaign` - Campaign name
- `campaignId` - Unique campaign identifier
- `impr` - Impressions
- `clicks` - Clicks
- `value` - Conversion value
- `conv` - Conversions
- `cost` - Cost
- `date` - Date in YYYY-MM-DD format

### Ad Groups Tab (`adGroups`)
Ad group-level daily performance data.

**Columns:**
- `campaign` - Campaign name
- `campaignId` - Campaign identifier
- `adGroup` - Ad group name
- `adGroupId` - Ad group identifier
- `impr` - Impressions
- `clicks` - Clicks
- `value` - Conversion value
- `conv` - Conversions
- `cost` - Cost
- `date` - Date in YYYY-MM-DD format
- `cpc` - Cost per click (calculated)
- `ctr` - Click-through rate (calculated)
- `convRate` - Conversion rate (calculated)
- `cpa` - Cost per acquisition (calculated)
- `roas` - Return on ad spend (calculated)

### Asset Groups Tab (`assetGroups`)
Asset group-level daily performance data for Performance Max campaigns.

**Columns:**
- `campaign` - Campaign name
- `campaignId` - Campaign identifier
- `assetGroup` - Asset group name
- `assetGroupId` - Asset group identifier
- `status` - Asset group status (ENABLED, PAUSED, etc.)
- `impr` - Impressions
- `clicks` - Clicks
- `value` - Conversion value
- `conv` - Conversions
- `cost` - Cost
- `date` - Date in YYYY-MM-DD format
- `cpc` - Cost per click (calculated)
- `ctr` - Click-through rate (calculated)
- `convRate` - Conversion rate (calculated)
- `cpa` - Cost per acquisition (calculated)
- `roas` - Return on ad spend (calculated)

### Search Terms Tab (`searchTerms`)
Search query performance data.

**Columns:**
- `searchTerm` - The actual search query
- `keyword` - The matched keyword
- `campaign` - Campaign name
- `adGroup` - Ad group name
- `impr` - Impressions
- `clicks` - Clicks
- `cost` - Cost
- `conv` - Conversions
- `value` - Conversion value
- Additional calculated metrics (CPC, CTR, etc.)

## Data Types

### Core Interfaces

```typescript
interface AdMetric {
  campaign: string
  campaignId: string
  impr: number
  clicks: number
  value: number
  conv: number
  cost: number
  date: string
}

interface AdGroupMetric extends AdMetric {
  adGroup: string
  adGroupId: string
  cpc: number
  ctr: number
  convRate: number
  cpa: number
  roas: number
}

interface AssetGroupMetric extends AdMetric {
  assetGroup: string
  assetGroupId: string
  status: string
  cpc: number
  ctr: number
  convRate: number
  cpa: number
  roas: number
}
```

## Data Fetching

### SWR Integration
The application uses SWR (Stale-While-Revalidate) for data fetching and caching:

```typescript
const { data: fetchedData, error: dataError, isLoading: isDataLoading } = useSWR<TabData>(
  settings.sheetUrl ? settings.sheetUrl : null,
  fetchAllTabsData,
  {
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  }
)
```

### Fetch Function
Data is fetched from Google Sheets using the `fetchAllTabsData` function:

```typescript
async function fetchAllTabsData(sheetUrl: string): Promise<TabData> {
  const [daily, searchTerms, adGroups, assetGroups] = await Promise.all([
    fetchAndParseDaily(sheetUrl),
    fetchAndParseSearchTerms(sheetUrl),
    fetchAndParseAdGroups(sheetUrl),
    fetchAndParseAssetGroups(sheetUrl)
  ])

  return { daily, searchTerms, adGroups, assetGroups }
}
```

## Date Handling

### Date Format
All dates in the system use the **YYYY-MM-DD** format to ensure consistency between:
- Google Sheets data
- JavaScript Date objects
- Chart rendering
- Date range filtering

### Date Range Filtering
The application supports multiple date range options:
- Last 7 days
- Last 14 days
- Last 30 days
- Last 90 days
- Last 180 days
- Last 365 days

Date ranges are calculated from today's date and filter data accordingly.

## Data Processing

### Campaign Aggregation
Campaigns are dynamically calculated from the daily data with costs aggregated based on the selected date range:

```typescript
const campaignsWithDateFilteredCosts = useMemo(() => {
  // Filter data by date range first
  const dateFilteredData = filterDataByDateRange(fetchedData.daily, selectedDateRange)
  
  // Calculate campaigns from the date-filtered data
  const campaignMap = new Map<string, Campaign>()
  // ... aggregation logic
}, [fetchedData?.daily, selectedDateRange])
```

### Metric Calculations
Derived metrics are calculated on the client side:
- **CTR** = (clicks / impressions) × 100
- **CPC** = cost / clicks
- **Conversion Rate** = (conversions / clicks) × 100
- **CPA** = cost / conversions
- **ROAS** = conversion value / cost

## Settings Storage

User settings are stored in **localStorage**:

```typescript
interface Settings {
  sheetUrl: string      // Google Sheets URL
  currency: string      // Currency symbol ($, €, etc.)
  selectedCampaign?: string
  activeTab: string
}
```

Settings are automatically saved to localStorage whenever they change and loaded on application startup.

## Error Handling

The application handles various error scenarios:
- **Invalid Sheet URL** - Shows error message
- **Network failures** - SWR handles retries
- **Missing data** - Graceful fallbacks to empty arrays
- **Malformed data** - Type coercion and validation

## Performance Considerations

### Data Caching
- SWR caches fetched data in memory
- Data is only re-fetched when the sheet URL changes
- No automatic revalidation to avoid unnecessary API calls

### Date Range Optimization
- Date filtering is performed client-side after data fetch
- Campaign costs are recalculated based on selected date range
- Memoization prevents unnecessary recalculations

### Memory Management
- Large datasets are handled efficiently through React's useMemo
- Only necessary data transformations are performed
- Component re-renders are minimized through proper dependency arrays

## Data Security

- **No sensitive data storage** - Only Google Sheets URLs are stored locally
- **Read-only access** - Application only reads from Google Sheets
- **Client-side processing** - All data processing happens in the browser
- **No server-side storage** - No backend database or user data collection
