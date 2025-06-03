// src/lib/sheetsData.ts
import {
  AdMetric,
  Campaign,
  SearchTermMetric,
  TabData,
  AdGroupMetric,
  AssetGroupMetric,
  NegativeKeywordList,
  CampaignNegative,
  AdGroupNegative,
  CampaignStatus,
  SharedListKeyword,
  LandingPage
} from './types'
import { SHEET_TABS, SheetTab, TAB_CONFIGS, DEFAULT_SHEET_URL } from './config'

// Helper to fetch and parse SearchTerm data
async function fetchAndParseSearchTerms(sheetUrl: string): Promise<SearchTermMetric[]> {
  const tab: SheetTab = 'searchTerms';
  try {
    const urlWithTab = `${sheetUrl}?tab=${tab}`;
    const response = await fetch(urlWithTab);
    if (!response.ok) {
      throw new Error(`Failed to fetch data for tab ${tab}`);
    }
    const rawData = await response.json();
    if (!Array.isArray(rawData)) {
      console.error(`Response is not an array for ${tab}:`, rawData);
      return [];
    }

    return rawData.map((row: any) => ({
      searchTerm: String(row['searchTerm'] || ''),
      keyword: String(row['keyword'] || ''),
      keywordText: String(row['keywordText'] || ''),
      campaign: String(row['campaign'] || ''),
      adGroup: String(row['adGroup'] || ''),
      impr: Number(row['impr'] || 0),
      clicks: Number(row['clicks'] || 0),
      cost: Number(row['cost'] || 0),
      conv: Number(row['conv'] || 0),
      value: Number(row['value'] || 0),
    }));
  } catch (error) {
    console.error(`Error fetching ${tab} data:`, error);
    return [];
  }
}

// Helper to fetch and parse AdGroup data
async function fetchAndParseAdGroups(sheetUrl: string): Promise<AdGroupMetric[]> {
  const tab: SheetTab = 'adGroups';
  try {
    const urlWithTab = `${sheetUrl}?tab=${tab}`;
    const response = await fetch(urlWithTab);
    if (!response.ok) {
      throw new Error(`Failed to fetch data for tab ${tab}`);
    }
    const rawData = await response.json();
    if (!Array.isArray(rawData)) {
      console.error(`Response is not an array for ${tab}:`, rawData);
      return [];
    }

    return rawData.map((row: any) => ({
      campaign: String(row['campaign'] || ''),
      campaignId: String(row['campaignId'] || ''),
      adGroup: String(row['adGroup'] || ''),
      adGroupId: String(row['adGroupId'] || ''),
      clicks: Number(row['clicks'] || 0),
      value: Number(row['value'] || 0),
      conv: Number(row['conv'] || 0),
      cost: Number(row['cost'] || 0),
      impr: Number(row['impr'] || 0),
      date: String(row['date'] || ''),
      cpc: Number(row['cpc'] || 0),
      ctr: Number(row['ctr'] || 0),
      convRate: Number(row['convRate'] || 0),
      cpa: Number(row['cpa'] || 0),
      roas: Number(row['roas'] || 0)
    }));
  } catch (error) {
    console.error(`Error fetching ${tab} data:`, error);
    return [];
  }
}

// Helper to fetch and parse AssetGroup data
async function fetchAndParseAssetGroups(sheetUrl: string): Promise<AssetGroupMetric[]> {
  const tab: SheetTab = 'assetGroups';
  try {
    const urlWithTab = `${sheetUrl}?tab=${tab}`;
    const response = await fetch(urlWithTab);
    if (!response.ok) {
      throw new Error(`Failed to fetch data for tab ${tab}`);
    }
    const rawData = await response.json();
    if (!Array.isArray(rawData)) {
      console.error(`Response is not an array for ${tab}:`, rawData);
      return [];
    }

    return rawData.map((row: any) => ({
      campaign: String(row['campaign'] || ''),
      campaignId: String(row['campaignId'] || ''),
      assetGroup: String(row['assetGroup'] || ''),
      assetGroupId: String(row['assetGroupId'] || ''),
      status: String(row['status'] || ''),
      clicks: Number(row['clicks'] || 0),
      value: Number(row['value'] || 0),
      conv: Number(row['conv'] || 0),
      cost: Number(row['cost'] || 0),
      impr: Number(row['impr'] || 0),
      date: String(row['date'] || ''),
      cpc: Number(row['cpc'] || 0),
      ctr: Number(row['ctr'] || 0),
      convRate: Number(row['convRate'] || 0),
      cpa: Number(row['cpa'] || 0),
      roas: Number(row['roas'] || 0)
    }));
  } catch (error) {
    console.error(`Error fetching ${tab} data:`, error);
    return [];
  }
}

// Helper to fetch and parse Daily (AdMetric) data
async function fetchAndParseDaily(sheetUrl: string): Promise<AdMetric[]> {
  const tab: SheetTab = 'daily';
  try {
    const urlWithTab = `${sheetUrl}?tab=${tab}`;
    const response = await fetch(urlWithTab);
    if (!response.ok) {
      throw new Error(`Failed to fetch data for tab ${tab}`);
    }
    const rawData = await response.json();
    if (!Array.isArray(rawData)) {
      console.error(`Response is not an array for ${tab}:`, rawData);
      return [];
    }

    return rawData.map((row: any) => ({
      campaign: String(row['campaign'] || ''),
      campaignId: String(row['campaignId'] || ''),
      clicks: Number(row['clicks'] || 0),
      value: Number(row['value'] || 0),
      conv: Number(row['conv'] || 0),
      cost: Number(row['cost'] || 0),
      impr: Number(row['impr'] || 0),
      date: String(row['date'] || '')
    }));
  } catch (error) {
    console.error(`Error fetching ${tab} data:`, error);
    return [];
  }
}

// Helper to fetch and parse Negative Keyword Lists data
async function fetchAndParseNegativeKeywordLists(sheetUrl: string): Promise<NegativeKeywordList[]> {
  const tab: SheetTab = 'negativeKeywordLists';
  try {
    const urlWithTab = `${sheetUrl}?tab=${tab}`;
    const response = await fetch(urlWithTab);
    if (!response.ok) {
      throw new Error(`Failed to fetch data for tab ${tab}`);
    }
    const rawData = await response.json();
    if (!Array.isArray(rawData)) {
      console.error(`Response is not an array for ${tab}:`, rawData);
      return [];
    }

    return rawData.map((row: any) => ({
      listName: String(row['listName'] || ''),
      listId: String(row['listId'] || ''),
      listType: String(row['listType'] || ''),
      appliedToCampaignName: String(row['appliedToCampaignName'] || ''),
      appliedToCampaignId: String(row['appliedToCampaignId'] || '')
    }));
  } catch (error) {
    console.error(`Error fetching ${tab} data:`, error);
    return [];
  }
}

// Helper to fetch and parse Campaign Negatives data
async function fetchAndParseCampaignNegatives(sheetUrl: string): Promise<CampaignNegative[]> {
  const tab: SheetTab = 'campaignNegatives';
  try {
    const urlWithTab = `${sheetUrl}?tab=${tab}`;
    const response = await fetch(urlWithTab);
    if (!response.ok) {
      throw new Error(`Failed to fetch data for tab ${tab}`);
    }
    const rawData = await response.json();
    if (!Array.isArray(rawData)) {
      console.error(`Response is not an array for ${tab}:`, rawData);
      return [];
    }

    return rawData.map((row: any) => ({
      campaignName: String(row['campaignName'] || ''),
      campaignId: String(row['campaignId'] || ''),
      criterionId: String(row['criterionId'] || ''),
      keywordText: String(row['keywordText'] || ''),
      matchType: String(row['matchType'] || '')
    }));
  } catch (error) {
    console.error(`Error fetching ${tab} data:`, error);
    return [];
  }
}

// Helper to fetch and parse Ad Group Negatives data
async function fetchAndParseAdGroupNegatives(sheetUrl: string): Promise<AdGroupNegative[]> {
  const tab: SheetTab = 'adGroupNegatives';
  try {
    const urlWithTab = `${sheetUrl}?tab=${tab}`;
    const response = await fetch(urlWithTab);
    if (!response.ok) {
      throw new Error(`Failed to fetch data for tab ${tab}`);
    }
    const rawData = await response.json();
    if (!Array.isArray(rawData)) {
      console.error(`Response is not an array for ${tab}:`, rawData);
      return [];
    }

    return rawData.map((row: any) => ({
      campaignName: String(row['campaignName'] || ''),
      campaignId: String(row['campaignId'] || ''),
      adGroupName: String(row['adGroupName'] || ''),
      adGroupId: String(row['adGroupId'] || ''),
      criterionId: String(row['criterionId'] || ''),
      keywordText: String(row['keywordText'] || ''),
      matchType: String(row['matchType'] || '')
    }));
  } catch (error) {
    console.error(`Error fetching ${tab} data:`, error);
    return [];
  }
}

// Helper to fetch and parse Campaign Status data
async function fetchAndParseCampaignStatus(sheetUrl: string): Promise<CampaignStatus[]> {
  const tab: SheetTab = 'campaignStatus';
  try {
    const urlWithTab = `${sheetUrl}?tab=${tab}`;
    const response = await fetch(urlWithTab);
    if (!response.ok) {
      throw new Error(`Failed to fetch data for tab ${tab}`);
    }
    const rawData = await response.json();
    if (!Array.isArray(rawData)) {
      console.error(`Response is not an array for ${tab}:`, rawData);
      return [];
    }

    return rawData.map((row: any) => ({
      campaignId: String(row['campaignId'] || ''),
      campaignName: String(row['campaignName'] || ''),
      status: String(row['status'] || ''),
      channelType: String(row['channelType'] || '')
    }));
  } catch (error) {
    console.error(`Error fetching ${tab} data:`, error);
    return [];
  }
}

// Helper to fetch and parse Shared List Keywords data
async function fetchAndParseSharedListKeywords(sheetUrl: string): Promise<SharedListKeyword[]> {
  const tab: SheetTab = 'sharedListKeywords';
  try {
    const urlWithTab = `${sheetUrl}?tab=${tab}`;
    const response = await fetch(urlWithTab);
    if (!response.ok) {
      throw new Error(`Failed to fetch data for tab ${tab}`);
    }
    const rawData = await response.json();
    if (!Array.isArray(rawData)) {
      console.error(`Response is not an array for ${tab}:`, rawData);
      return [];
    }

    return rawData.map((row: any) => ({
      listId: String(row['listId'] || ''),
      criterionId: String(row['criterionId'] || ''),
      keywordText: String(row['keywordText'] || ''),
      matchType: String(row['matchType'] || ''),
      type: String(row['type'] || '')
    }));
  } catch (error) {
    console.error(`Error fetching ${tab} data:`, error);
    return [];
  }
}

// Helper to fetch and parse Landing Pages data
async function fetchAndParseLandingPages(sheetUrl: string): Promise<LandingPage[]> {
  const tab: SheetTab = 'landingPages';
  try {
    const urlWithTab = `${sheetUrl}?tab=${tab}`;
    const response = await fetch(urlWithTab);
    if (!response.ok) {
      throw new Error(`Failed to fetch data for tab ${tab}`);
    }
    const rawData = await response.json();
    if (!Array.isArray(rawData)) {
      console.error(`Response is not an array for ${tab}:`, rawData);
      return [];
    }

    return rawData.map((row: any) => ({
      url: String(row['url'] || ''),
      impressions: Number(row['impressions'] || 0),
      clicks: Number(row['clicks'] || 0),
      cost: Number(row['cost'] || 0),
      conversions: Number(row['conversions'] || 0),
      value: Number(row['value'] || 0),
      ctr: Number(row['ctr'] || 0),
      cvr: Number(row['cvr'] || 0),
      cpa: Number(row['cpa'] || 0),
      roas: Number(row['roas'] || 0)
    }));
  } catch (error) {
    console.error(`Error fetching ${tab} data:`, error);
    return [];
  }
}

export async function fetchAllTabsData(sheetUrl: string = DEFAULT_SHEET_URL): Promise<TabData> {
  const [
    dailyData,
    searchTermsData,
    adGroupsData,
    assetGroupsData,
    negativeKeywordListsData,
    campaignNegativesData,
    adGroupNegativesData,
    campaignStatusData,
    sharedListKeywordsData,
    landingPagesData
  ] = await Promise.all([
    fetchAndParseDaily(sheetUrl),
    fetchAndParseSearchTerms(sheetUrl),
    fetchAndParseAdGroups(sheetUrl),
    fetchAndParseAssetGroups(sheetUrl),
    fetchAndParseNegativeKeywordLists(sheetUrl),
    fetchAndParseCampaignNegatives(sheetUrl),
    fetchAndParseAdGroupNegatives(sheetUrl),
    fetchAndParseCampaignStatus(sheetUrl),
    fetchAndParseSharedListKeywords(sheetUrl),
    fetchAndParseLandingPages(sheetUrl)
  ]);

  return {
    daily: dailyData || [],
    searchTerms: searchTermsData || [],
    adGroups: adGroupsData || [],
    assetGroups: assetGroupsData || [],
    negativeKeywordLists: negativeKeywordListsData || [],
    campaignNegatives: campaignNegativesData || [],
    adGroupNegatives: adGroupNegativesData || [],
    campaignStatus: campaignStatusData || [],
    sharedListKeywords: sharedListKeywordsData || [],
    landingPages: landingPagesData || [],
  } as TabData;
}

export function getCampaigns(data: AdMetric[]): Campaign[] {
  const campaignMap = new Map<string, { id: string; name: string; totalCost: number }>()

  data.forEach(row => {
    const campaignId = row.campaignId ? String(row.campaignId).trim() : '';
    if (!campaignId) {
      return;
    }

    if (!campaignMap.has(campaignId)) {
      campaignMap.set(campaignId, {
        id: campaignId,
        name: row.campaign,
        totalCost: row.cost
      })
    } else {
      const campaign = campaignMap.get(campaignId)!
      campaign.totalCost += row.cost
    }
  })

  return Array.from(campaignMap.values())
    .sort((a, b) => b.totalCost - a.totalCost)
}

export function getMetricsByDate(data: AdMetric[], campaignId: string): AdMetric[] {
  return data
    .filter(metric => metric.campaignId === campaignId)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
}

export function getMetricOptions(activeTab: SheetTab = 'daily') {
  return TAB_CONFIGS[activeTab]?.metrics || {}
}

// SWR configuration without cache control
export const swrConfig = {
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  dedupingInterval: 5000
} 