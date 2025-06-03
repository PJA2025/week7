// src/lib/types.ts
import { SheetTab } from './config'

export interface Settings {
  sheetUrl: string
  currency: string
  selectedCampaign?: string
  activeTab?: SheetTab
}

export interface Campaign {
  id: string
  name: string
  totalCost: number
}

// Daily campaign metrics
export interface AdMetric {
  campaign: string
  campaignId: string
  clicks: number
  value: number
  conv: number
  cost: number
  impr: number
  date: string
}

// Add the new AdGroupMetric interface
export interface AdGroupMetric {
  campaign: string
  campaignId: string
  adGroup: string
  adGroupId: string
  impr: number
  clicks: number
  value: number
  conv: number
  cost: number
  date: string
  cpc: number
  ctr: number
  convRate: number
  cpa: number
  roas: number
}

// Add the new AssetGroupMetric interface
export interface AssetGroupMetric {
  campaign: string
  campaignId: string
  assetGroup: string
  assetGroupId: string
  status: string
  impr: number
  clicks: number
  value: number
  conv: number
  cost: number
  date: string
  cpc: number
  ctr: number
  convRate: number
  cpa: number
  roas: number
}

// Search term metrics - Core metrics from script
export interface SearchTermMetric {
  searchTerm: string
  keyword: string
  keywordText?: string
  campaign: string
  adGroup: string
  impr: number
  clicks: number
  cost: number
  conv: number
  value: number
}

// Negative Keyword Lists interface - Updated to match script headers
export interface NegativeKeywordList {
  listName: string
  listId: string
  listType: string
  appliedToCampaignName: string
  appliedToCampaignId: string
}

// Campaign Negatives interface - Updated to match script headers
export interface CampaignNegative {
  campaignName: string
  campaignId: string
  criterionId: string
  keywordText: string
  matchType: string
}

// Ad Group Negatives interface - Updated to match script headers
export interface AdGroupNegative {
  campaignName: string
  campaignId: string
  adGroupName: string
  adGroupId: string
  criterionId: string
  keywordText: string
  matchType: string
}

// Campaign Status interface - Updated to match script headers
export interface CampaignStatus {
  campaignId: string
  campaignName: string
  status: string
  channelType: string
}

// Shared List Keywords interface - Updated to match script headers
export interface SharedListKeyword {
  listId: string
  criterionId: string
  keywordText: string
  matchType: string
  type: string
}

// Landing Pages interface - Updated to match script headers
export interface LandingPage {
  url: string
  impressions: number
  clicks: number
  cost: number
  conversions: number
  value: number
  ctr: number
  cvr: number
  cpa: number
  roas: number
}

// Calculated metrics for daily data
export interface DailyMetrics extends AdMetric {
  CTR: number
  CvR: number
  CPA: number
  ROAS: number
  CPC: number
}

// Regular metrics excluding metadata fields
export type MetricKey = keyof Omit<AdMetric, 'campaign' | 'campaignId' | 'date'>

// Search term metrics excluding metadata
export type SearchTermMetricKey = keyof Omit<SearchTermMetric, 'searchTerm' | 'keyword' | 'keywordText' | 'campaign' | 'adGroup'>

// All possible metrics (regular + calculated)
export type AllMetricKeys = MetricKey | keyof Omit<DailyMetrics, keyof AdMetric>

export interface MetricOption {
  label: string
  format: (val: number) => string
}

export interface MetricOptions {
  [key: string]: MetricOption
}

export interface TabConfig {
  metrics: MetricOptions
}

export interface TabConfigs {
  [key: string]: TabConfig
}

// Type guard for search term data
export function isSearchTermMetric(data: any): data is SearchTermMetric {
  return 'searchTerm' in data && 'adGroup' in data
}

// Type guard for daily metrics
export function isAdMetric(data: any): data is AdMetric {
  return 'campaignId' in data && 'impr' in data
}

// Combined tab data type - Updated to include all new tabs
export type TabData = {
  daily: AdMetric[]
  searchTerms: SearchTermMetric[]
  adGroups: AdGroupMetric[]
  assetGroups: AssetGroupMetric[]
  negativeKeywordLists: NegativeKeywordList[]
  campaignNegatives: CampaignNegative[]
  adGroupNegatives: AdGroupNegative[]
  campaignStatus: CampaignStatus[]
  sharedListKeywords: SharedListKeyword[]
  landingPages: LandingPage[]
}

// Helper type to get numeric values from metrics
export type MetricValue<T> = T extends number ? T : never

// Data Insights Types
export type DataSourceType = keyof TabData

export type ColumnType = 'metric' | 'dimension' | 'date'

export interface ColumnDefinition {
  name: string
  key: string
  type: ColumnType
  label: string
}

export interface FilterOperator {
  value: string
  label: string
  types: ColumnType[]
}

export interface DataFilter {
  id: string
  column: string
  operator: string
  value: string
}

export interface SortConfig {
  column: string
  direction: 'asc' | 'desc'
}

export interface DataSummary {
  totalRows: number
  metrics: Record<string, {
    min: number
    max: number
    avg: number
    sum: number
  }>
  dimensions: Record<string, {
    uniqueCount: number
    topValues?: Array<{ value: string; count: number }>
  }>
}

// Filter operators configuration
export const FILTER_OPERATORS: FilterOperator[] = [
  { value: 'contains', label: 'Contains', types: ['dimension'] },
  { value: 'not_contains', label: 'Does not contain', types: ['dimension'] },
  { value: 'equals', label: 'Equals', types: ['metric', 'dimension', 'date'] },
  { value: 'not_equals', label: 'Not equals', types: ['metric', 'dimension', 'date'] },
  { value: 'starts_with', label: 'Starts with', types: ['dimension'] },
  { value: 'ends_with', label: 'Ends with', types: ['dimension'] },
  { value: 'greater_than', label: 'Greater than', types: ['metric'] },
  { value: 'less_than', label: 'Less than', types: ['metric'] },
  { value: 'greater_equal', label: 'Greater than or equals', types: ['metric'] },
  { value: 'less_equal', label: 'Less than or equals', types: ['metric'] },
  { value: 'after', label: 'After', types: ['date'] },
  { value: 'before', label: 'Before', types: ['date'] },
  { value: 'on_or_after', label: 'On or after', types: ['date'] },
  { value: 'on_or_before', label: 'On or before', types: ['date'] },
] 