// src/lib/config.ts
import type { MetricOptions } from './types'

export const COLORS = {
    primary: '#1e40af',
    secondary: '#ea580c'
} as const

export const DEFAULT_SHEET_URL = 'https://script.google.com/macros/s/AKfycbykrW6R5gFrcgIW7nQM-o-zP9rIF59VEt3pxhyirw6S9YidfehW9pefmjdi10R6pViU/exec'

export const SHEET_TABS = [
    'daily',
    'searchTerms',
    'adGroups',
    'assetGroups',
    'negativeKeywordLists',
    'campaignNegatives',
    'adGroupNegatives',
    'campaignStatus',
    'sharedListKeywords',
    'landingPages'
] as const
export type SheetTab = typeof SHEET_TABS[number]

export interface TabConfig {
    name: SheetTab
    metrics: MetricOptions
}

export const TAB_CONFIGS: Record<SheetTab, TabConfig> = {
    daily: {
        name: 'daily',
        metrics: {
            impr: { label: 'Impr', format: (val: number) => val.toLocaleString() },
            clicks: { label: 'Clicks', format: (val: number) => val.toLocaleString() },
            cost: { label: 'Cost', format: (val: number) => `$${val.toFixed(2)}` },
            conv: { label: 'Conv', format: (val: number) => val.toFixed(1) },
            value: { label: 'Value', format: (val: number) => `$${val.toFixed(2)}` }
        }
    },
    searchTerms: {
        name: 'searchTerms',
        metrics: {
            impr: { label: 'Impr', format: (val: number) => val.toLocaleString() },
            clicks: { label: 'Clicks', format: (val: number) => val.toLocaleString() },
            cost: { label: 'Cost', format: (val: number) => `$${val.toFixed(2)}` },
            conv: { label: 'Conv', format: (val: number) => val.toFixed(1) },
            value: { label: 'Value', format: (val: number) => `$${val.toFixed(2)}` }
        }
    },
    adGroups: {
        name: 'adGroups',
        metrics: {
            impr: { label: 'Impr', format: (val: number) => val.toLocaleString() },
            clicks: { label: 'Clicks', format: (val: number) => val.toLocaleString() },
            cost: { label: 'Cost', format: (val: number) => `$${val.toFixed(2)}` },
            conv: { label: 'Conv', format: (val: number) => val.toFixed(1) },
            value: { label: 'Value', format: (val: number) => `$${val.toFixed(2)}` },
            cpc: { label: 'CPC', format: (val: number) => `$${val.toFixed(2)}` },
            ctr: { label: 'CTR', format: (val: number) => `${(val * 100).toFixed(2)}%` },
            convRate: { label: 'CvR', format: (val: number) => `${(val * 100).toFixed(2)}%` },
            cpa: { label: 'CPA', format: (val: number) => `$${val.toFixed(2)}` },
            roas: { label: 'ROAS', format: (val: number) => val.toFixed(2) }
        }
    },
    assetGroups: {
        name: 'assetGroups',
        metrics: {
            impr: { label: 'Impr', format: (val: number) => val.toLocaleString() },
            clicks: { label: 'Clicks', format: (val: number) => val.toLocaleString() },
            cost: { label: 'Cost', format: (val: number) => `$${val.toFixed(2)}` },
            conv: { label: 'Conv', format: (val: number) => val.toFixed(1) },
            value: { label: 'Value', format: (val: number) => `$${val.toFixed(2)}` },
            cpc: { label: 'CPC', format: (val: number) => `$${val.toFixed(2)}` },
            ctr: { label: 'CTR', format: (val: number) => `${(val * 100).toFixed(2)}%` },
            convRate: { label: 'CvR', format: (val: number) => `${(val * 100).toFixed(2)}%` },
            cpa: { label: 'CPA', format: (val: number) => `$${val.toFixed(2)}` },
            roas: { label: 'ROAS', format: (val: number) => val.toFixed(2) }
        }
    },
    negativeKeywordLists: {
        name: 'negativeKeywordLists',
        metrics: {}
    },
    campaignNegatives: {
        name: 'campaignNegatives',
        metrics: {}
    },
    adGroupNegatives: {
        name: 'adGroupNegatives',
        metrics: {}
    },
    campaignStatus: {
        name: 'campaignStatus',
        metrics: {}
    },
    sharedListKeywords: {
        name: 'sharedListKeywords',
        metrics: {}
    },
    landingPages: {
        name: 'landingPages',
        metrics: {
            impressions: { label: 'Impressions', format: (val: number) => val.toLocaleString() },
            clicks: { label: 'Clicks', format: (val: number) => val.toLocaleString() },
            cost: { label: 'Cost', format: (val: number) => `$${val.toFixed(2)}` },
            conversions: { label: 'Conversions', format: (val: number) => val.toFixed(1) },
            value: { label: 'Value', format: (val: number) => `$${val.toFixed(2)}` },
            ctr: { label: 'CTR', format: (val: number) => `${(val * 100).toFixed(2)}%` },
            cvr: { label: 'CVR', format: (val: number) => `${(val * 100).toFixed(2)}%` },
            cpa: { label: 'CPA', format: (val: number) => `$${val.toFixed(2)}` },
            roas: { label: 'ROAS', format: (val: number) => val.toFixed(2) }
        }
    }
} 