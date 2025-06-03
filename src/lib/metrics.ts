// src/lib/metrics.ts
import type { AdMetric, DailyMetrics, SearchTermMetric, AssetGroupMetric, LandingPage } from './types'

// Base interface for any data with performance metrics
interface BaseMetrics {
  clicks: number
  cost: number
  value: number
}

// Interface for data with impressions and conversions
interface StandardMetrics extends BaseMetrics {
  impr: number
  conv: number
}

// Interface for landing page metrics (different field names)
interface LandingPageMetrics extends BaseMetrics {
  impressions: number
  conversions: number
}

// Calculated metrics that can be added to any base type
export interface CalculatedMetrics {
  CTR: number
  CvR: number
  CPA: number
  ROAS: number
  CPC: number
}

// Combined interfaces for calculated metrics
export interface CalculatedSearchTermMetric extends SearchTermMetric, CalculatedMetrics { }
export interface CalculatedAssetGroupMetric extends AssetGroupMetric, CalculatedMetrics { }
export interface CalculatedLandingPageMetric extends LandingPage, CalculatedMetrics { }

// Generic function to calculate metrics from standard fields (impr, conv)
function calculateStandardMetrics(data: StandardMetrics): CalculatedMetrics {
  const { impr, clicks, cost, conv, value } = data

  return {
    CTR: impr > 0 ? (clicks / impr) * 100 : 0,
    CvR: clicks > 0 ? (conv / clicks) * 100 : 0,
    CPA: conv > 0 ? cost / conv : 0,
    ROAS: cost > 0 ? value / cost : 0,
    CPC: clicks > 0 ? cost / clicks : 0
  }
}

// Generic function to calculate metrics from landing page fields (impressions, conversions)
function calculateLandingPageMetrics(data: LandingPageMetrics): CalculatedMetrics {
  const { impressions, clicks, cost, conversions, value } = data

  return {
    CTR: impressions > 0 ? (clicks / impressions) * 100 : 0,
    CvR: clicks > 0 ? (conversions / clicks) * 100 : 0,
    CPA: conversions > 0 ? cost / conversions : 0,
    ROAS: cost > 0 ? value / cost : 0,
    CPC: clicks > 0 ? cost / clicks : 0
  }
}

// Generic function to add calculated metrics to any object
function addCalculatedMetrics<T extends StandardMetrics>(item: T): T & CalculatedMetrics {
  return {
    ...item,
    ...calculateStandardMetrics(item)
  }
}

// Generic function to add calculated metrics to landing page objects
function addLandingPageCalculatedMetrics<T extends LandingPageMetrics>(item: T): T & CalculatedMetrics {
  return {
    ...item,
    ...calculateLandingPageMetrics(item)
  }
}

// Calculate aggregated metrics for daily campaign data
export function calculateMetrics(data: AdMetric[]): DailyMetrics {
  const totals = data.reduce((acc, d) => ({
    campaign: d.campaign,
    campaignId: d.campaignId,
    date: '',  // Not relevant for totals
    clicks: acc.clicks + d.clicks,
    impr: acc.impr + d.impr,
    cost: acc.cost + d.cost,
    conv: acc.conv + d.conv,
    value: acc.value + d.value,
  }), {
    campaign: '',
    campaignId: '',
    date: '',
    clicks: 0,
    impr: 0,
    cost: 0,
    conv: 0,
    value: 0
  } as AdMetric)

  return addCalculatedMetrics(totals)
}

// Calculate daily metrics for campaign data
export function calculateDailyMetrics(data: AdMetric[]): DailyMetrics[] {
  return data.map(addCalculatedMetrics)
}

// Calculate derived metrics for a single Search Term row
export function calculateSingleSearchTermMetrics(term: SearchTermMetric): CalculatedSearchTermMetric {
  return addCalculatedMetrics(term)
}

// Calculate derived metrics for an array of Search Terms
export function calculateAllSearchTermMetrics(terms: SearchTermMetric[]): CalculatedSearchTermMetric[] {
  return terms.map(addCalculatedMetrics)
}

// Calculate derived metrics for a single Asset Group row
export function calculateSingleAssetGroupMetrics(assetGroup: AssetGroupMetric): CalculatedAssetGroupMetric {
  return addCalculatedMetrics(assetGroup)
}

// Calculate derived metrics for an array of Asset Groups
export function calculateAllAssetGroupMetrics(assetGroups: AssetGroupMetric[]): CalculatedAssetGroupMetric[] {
  return assetGroups.map(addCalculatedMetrics)
}

// Calculate derived metrics for a single Landing Page row
export function calculateSingleLandingPageMetrics(landingPage: LandingPage): CalculatedLandingPageMetric {
  return addLandingPageCalculatedMetrics(landingPage)
}

// Calculate derived metrics for an array of Landing Pages
export function calculateAllLandingPageMetrics(landingPages: LandingPage[]): CalculatedLandingPageMetric[] {
  return landingPages.map(addLandingPageCalculatedMetrics)
}

// Format metric values consistently
export function formatMetric(value: number, type: 'number' | 'currency' | 'percent', currency = '$'): string {
  if (value === 0 || !value) return '0'

  if (type === 'currency') {
    return `${currency}${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  if (type === 'percent') {
    return `${value.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`
  }

  return value.toLocaleString('en-US', { maximumFractionDigits: 0 })
} 