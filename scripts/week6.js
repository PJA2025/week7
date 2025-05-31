const SHEET_URL = 'https://docs.google.com/spreadsheets/d/1lMiKofgjbw-Cy0048lOHPOtweq2FD6LIJpnqKBAQ4IQ/';       // add your sheet url here
const SEARCH_TERMS_TAB = 'SearchTerms';
const DAILY_TAB = 'Daily';
const AD_GROUP_TAB = 'AdGroups';  // New tab for ad group data
const NEGATIVE_KEYWORD_LISTS_TAB = 'NegativeKeywordLists'; // Tab for shared negative lists
const CAMPAIGN_NEGATIVES_TAB = 'CampaignNegatives'; // Tab for campaign-level negatives
const ADGROUP_NEGATIVES_TAB = 'AdGroupNegatives'; // Tab for ad group-level negatives
const CAMPAIGN_STATUS_TAB = 'CampaignStatus'; // Tab for campaign status
const SHARED_LIST_KEYWORDS_TAB = 'SharedListKeywords'; // Tab for keywords within shared lists
const LANDING_PAGES_TAB = 'LandingPages'; // Tab for landing pages

const NUMBER_OF_DAYS = 400; // Added for flexible date ranges

// Function to generate GAQL date WHERE clause for a period of N days ending yesterday
function getFlexibleDateRangeWhereClause(numDays) {
  const today = new Date();
  const endDate = new Date(today); // Clone today
  endDate.setDate(today.getDate() - 1); // Set endDate to yesterday

  const startDate = new Date(endDate); // Clone endDate (yesterday)
  // To get a period of numDays *ending* yesterday, startDate is (numDays - 1) days before yesterday
  startDate.setDate(endDate.getDate() - (numDays - 1));

  const format = date => Utilities.formatDate(date, AdsApp.currentAccount().getTimeZone(), 'yyyyMMdd');
  return `segments.date BETWEEN "${format(startDate)}" AND "${format(endDate)}"`;
}

// GAQL query for search terms
const SEARCH_TERMS_QUERY = `
SELECT 
  search_term_view.search_term, 
  campaign.name,
  ad_group.name,
  metrics.impressions, 
  metrics.clicks, 
  metrics.cost_micros, 
  metrics.conversions, 
  metrics.conversions_value
FROM search_term_view
WHERE segments.date DURING LAST_30_DAYS
  AND campaign.advertising_channel_type = "SEARCH"
  AND metrics.impressions >= 30
ORDER BY metrics.cost_micros DESC
`;

// GAQL query for daily campaign data
const DAILY_QUERY = `
SELECT
  campaign.name,
  campaign.id,
  metrics.clicks,
  metrics.conversions_value,
  metrics.conversions,
  metrics.cost_micros,
  metrics.impressions,
  segments.date
FROM campaign
WHERE ${getFlexibleDateRangeWhereClause(NUMBER_OF_DAYS)}
ORDER BY segments.date DESC, metrics.cost_micros DESC
`;

// GAQL query for ad group data
const AD_GROUP_QUERY = `
SELECT
  campaign.name,
  campaign.id,
  ad_group.name,
  ad_group.id,
  metrics.clicks,
  metrics.conversions_value,
  metrics.conversions,
  metrics.cost_micros,
  metrics.impressions,
  segments.date
FROM ad_group
WHERE ${getFlexibleDateRangeWhereClause(NUMBER_OF_DAYS)}
ORDER BY segments.date DESC, metrics.cost_micros DESC
`;

// GAQL query for shared negative keyword lists and their campaign associations
const NEGATIVE_KEYWORD_LISTS_QUERY = `
SELECT
  shared_set.name,
  shared_set.id,
  shared_set.type,
  campaign.name,
  campaign.id,
  campaign_shared_set.status
FROM campaign_shared_set
WHERE shared_set.type = NEGATIVE_KEYWORDS
  AND campaign_shared_set.status = "ENABLED"
ORDER BY shared_set.name
`;

// GAQL query for campaign-level negative keywords
const CAMPAIGN_NEGATIVES_QUERY = `
SELECT
  campaign.name,
  campaign.id,
  campaign_criterion.criterion_id,
  campaign_criterion.keyword.text,
  campaign_criterion.keyword.match_type,
  campaign_criterion.negative
FROM campaign_criterion
WHERE campaign_criterion.type = KEYWORD
  AND campaign_criterion.negative = TRUE
ORDER BY campaign.name, campaign_criterion.keyword.text
`;

// GAQL query for ad group-level negative keywords
const ADGROUP_NEGATIVES_QUERY = `
SELECT
  campaign.name,
  campaign.id,
  ad_group.name,
  ad_group.id,
  ad_group_criterion.criterion_id,
  ad_group_criterion.keyword.text,
  ad_group_criterion.keyword.match_type,
  ad_group_criterion.negative
FROM ad_group_criterion
WHERE ad_group_criterion.type = KEYWORD
  AND ad_group_criterion.negative = TRUE
ORDER BY campaign.name, ad_group.name, ad_group_criterion.keyword.text
`;

// GAQL query for Campaign Status
const CAMPAIGN_STATUS_QUERY = `
SELECT
  campaign.id,
  campaign.name,
  campaign.status,
  campaign.advertising_channel_type
FROM campaign
ORDER BY campaign.name
`;

// GAQL query for Keywords within Shared Negative Lists
const SHARED_LIST_KEYWORDS_QUERY = `
SELECT
  shared_set.id,
  shared_criterion.criterion_id,
  shared_criterion.keyword.text,
  shared_criterion.keyword.match_type,
  shared_criterion.type
FROM shared_criterion
WHERE shared_set.type = NEGATIVE_KEYWORDS
  AND shared_criterion.type = KEYWORD
ORDER BY shared_set.id, shared_criterion.keyword.text
`;

// GAQL query for Landing Page data
const LANDING_PAGES_QUERY = `
SELECT 
  landing_page_view.unexpanded_final_url,
  metrics.impressions,
  metrics.clicks,
  metrics.cost_micros,
  metrics.conversions,
  metrics.conversions_value
FROM landing_page_view
WHERE segments.date DURING LAST_30_DAYS
  AND metrics.impressions > 30
ORDER BY metrics.impressions DESC
`;

function main() {
  try {
    // Access the Google Sheet
    let ss;
    if (!SHEET_URL) {
      ss = SpreadsheetApp.create("Google Ads Report");
      let url = ss.getUrl();
      Logger.log("No SHEET_URL found, so this sheet was created: " + url);
    } else {
      ss = SpreadsheetApp.openByUrl(SHEET_URL);
    }

    // Process Search Terms tab
    processTab(
      ss,
      SEARCH_TERMS_TAB,
      ["searchTerm", "campaign", "adGroup", "impr", "clicks", "cost", "conv", "value", "cpc", "ctr", "convRate", "cpa", "roas"],
      SEARCH_TERMS_QUERY,
      calculateSearchTermsMetrics
    );

    // Process Daily tab
    processTab(
      ss,
      DAILY_TAB,
      ["campaign", "campaignId", "impr", "clicks", "value", "conv", "cost", "date"],
      DAILY_QUERY,
      processDailyData
    );

    // Process AdGroups tab (new)
    processTab(
      ss,
      AD_GROUP_TAB,
      ["campaign", "campaignId", "adGroup", "adGroupId", "impr", "clicks", "value", "conv", "cost", "date", "cpc", "ctr", "convRate", "cpa", "roas"],
      AD_GROUP_QUERY,
      processAdGroupData
    );

    // Process Negative Keyword Lists tab
    processTab(
      ss,
      NEGATIVE_KEYWORD_LISTS_TAB,
      ["listName", "listId", "listType", "appliedToCampaignName", "appliedToCampaignId"],
      NEGATIVE_KEYWORD_LISTS_QUERY,
      processNegativeKeywordLists
    );

    // Process Campaign Negatives tab
    processTab(
      ss,
      CAMPAIGN_NEGATIVES_TAB,
      ["campaignName", "campaignId", "criterionId", "keywordText", "matchType"],
      CAMPAIGN_NEGATIVES_QUERY,
      processCampaignNegatives
    );

    // Process Ad Group Negatives tab
    processTab(
      ss,
      ADGROUP_NEGATIVES_TAB,
      ["campaignName", "campaignId", "adGroupName", "adGroupId", "criterionId", "keywordText", "matchType"],
      ADGROUP_NEGATIVES_QUERY,
      processAdGroupNegatives
    );

    // Process Campaign Status tab
    processTab(
      ss,
      CAMPAIGN_STATUS_TAB,
      ["campaignId", "campaignName", "status", "channelType"],
      CAMPAIGN_STATUS_QUERY,
      processCampaignStatus
    );

    // Process Shared List Keywords tab
    processTab(
      ss,
      SHARED_LIST_KEYWORDS_TAB,
      ["listId", "criterionId", "keywordText", "matchType", "type"],
      SHARED_LIST_KEYWORDS_QUERY,
      processSharedListKeywords
    );

    // Process Landing Pages tab
    processTab(
      ss,
      LANDING_PAGES_TAB,
      ["url", "impressions", "clicks", "cost", "conversions", "value", "ctr", "cvr", "cpa", "roas"],
      LANDING_PAGES_QUERY,
      processLandingPages
    );

  } catch (e) {
    Logger.log("Error in main function: " + e);
  }
}

function processTab(ss, tabName, headers, query, dataProcessor) {
  try {
    // Get or create the tab
    let sheet = ss.getSheetByName(tabName);
    if (!sheet) {
      sheet = ss.insertSheet(tabName);
    } else {
      // Clear existing data
      sheet.clearContents();
    }

    // Set headers
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight("bold");

    // Run the query
    const report = AdsApp.report(query);
    const rows = report.rows();

    // Process data
    const data = dataProcessor(rows);

    // Write data to sheet (only if we have data)
    if (data.length > 0) {
      sheet.getRange(2, 1, data.length, data[0].length).setValues(data);
      Logger.log("Successfully wrote " + data.length + " rows to the " + tabName + " sheet.");
    } else {
      Logger.log("No data found for " + tabName + ".");
    }
  } catch (e) {
    Logger.log("Error in processTab function for " + tabName + ": " + e);
  }
}

function calculateSearchTermsMetrics(rows) {
  const data = [];
  while (rows.hasNext()) {
    const row = rows.next();
    const searchTerm = row['search_term_view.search_term'];
    const campaign = row['campaign.name'];
    const adGroup = row['ad_group.name'];
    const impressions = parseInt(row['metrics.impressions'], 10) || 0;
    const clicks = parseInt(row['metrics.clicks'], 10) || 0;
    const costMicros = parseInt(row['metrics.cost_micros'], 10) || 0;
    const conversions = parseFloat(row['metrics.conversions']) || 0;
    const conversionValue = parseFloat(row['metrics.conversions_value']) || 0;

    // Calculate metrics
    const cost = costMicros / 1000000;  // Convert micros to actual currency
    const cpc = clicks > 0 ? cost / clicks : 0;
    const ctr = impressions > 0 ? clicks / impressions : 0;
    const convRate = clicks > 0 ? conversions / clicks : 0;
    const cpa = conversions > 0 ? cost / conversions : 0;
    const roas = cost > 0 ? conversionValue / cost : 0;

    // Add all variables and calculated metrics to a new row
    const newRow = [searchTerm, campaign, adGroup, impressions, clicks, cost, conversions, conversionValue, cpc, ctr, convRate, cpa, roas];

    // Push new row to the data array
    data.push(newRow);
  }
  return data;
}

function processDailyData(rows) {
  const data = [];
  while (rows.hasNext()) {
    const row = rows.next();

    // Extract data according to the requested columns
    const campaign = String(row['campaign.name'] || '');
    const campaignId = String(row['campaign.id'] || '');
    const clicks = Number(row['metrics.clicks'] || 0);
    const value = Number(row['metrics.conversions_value'] || 0);
    const conv = Number(row['metrics.conversions'] || 0);
    const costMicros = Number(row['metrics.cost_micros'] || 0);
    const cost = costMicros / 1000000;  // Convert micros to actual currency
    const impr = Number(row['metrics.impressions'] || 0);
    const date = String(row['segments.date'] || '');

    // Create a new row with the data
    const newRow = [campaign, campaignId, impr, clicks, value, conv, cost, date];

    // Push new row to the data array
    data.push(newRow);
  }
  return data;
}

function processAdGroupData(rows) {
  const data = [];
  while (rows.hasNext()) {
    const row = rows.next();

    // Extract data
    const campaign = String(row['campaign.name'] || '');
    const campaignId = String(row['campaign.id'] || '');
    const adGroup = String(row['ad_group.name'] || '');
    const adGroupId = String(row['ad_group.id'] || '');
    const impressions = Number(row['metrics.impressions'] || 0);
    const clicks = Number(row['metrics.clicks'] || 0);
    const costMicros = Number(row['metrics.cost_micros'] || 0);
    const conversions = Number(row['metrics.conversions'] || 0);
    const conversionValue = Number(row['metrics.conversions_value'] || 0);
    const date = String(row['segments.date'] || '');

    // Calculate metrics
    const cost = costMicros / 1000000;  // Convert micros to actual currency
    const cpc = clicks > 0 ? cost / clicks : 0;
    const ctr = impressions > 0 ? clicks / impressions : 0;
    const convRate = clicks > 0 ? conversions / clicks : 0;
    const cpa = conversions > 0 ? cost / conversions : 0;
    const roas = cost > 0 ? conversionValue / cost : 0;

    // Create a new row with the data
    const newRow = [
      campaign,
      campaignId,
      adGroup,
      adGroupId,
      impressions,
      clicks,
      conversionValue,
      conversions,
      cost,
      date,
      cpc,
      ctr,
      convRate,
      cpa,
      roas
    ];

    // Push new row to the data array
    data.push(newRow);
  }
  return data;
}

function processNegativeKeywordLists(rows) {
  const data = [];
  while (rows.hasNext()) {
    const row = rows.next();
    const listName = String(row['shared_set.name'] || '');
    const listId = String(row['shared_set.id'] || '');
    const listType = String(row['shared_set.type'] || '');
    const campaignName = String(row['campaign.name'] || '');
    const campaignId = String(row['campaign.id'] || '');

    const newRow = [listName, listId, listType, campaignName, campaignId];
    data.push(newRow);
  }
  return data;
}

function processCampaignNegatives(rows) {
  const data = [];
  while (rows.hasNext()) {
    const row = rows.next();
    const campaignName = String(row['campaign.name'] || '');
    const campaignId = String(row['campaign.id'] || '');
    const criterionId = String(row['campaign_criterion.criterion_id'] || '');
    const keywordText = String(row['campaign_criterion.keyword.text'] || '');
    const matchType = String(row['campaign_criterion.keyword.match_type'] || '');
    // We query for negative = TRUE, so no need to include it explicitly in output

    const newRow = [campaignName, campaignId, criterionId, keywordText, matchType];
    data.push(newRow);
  }
  return data;
}

function processAdGroupNegatives(rows) {
  const data = [];
  while (rows.hasNext()) {
    const row = rows.next();
    const campaignName = String(row['campaign.name'] || '');
    const campaignId = String(row['campaign.id'] || '');
    const adGroupName = String(row['ad_group.name'] || '');
    const adGroupId = String(row['ad_group.id'] || '');
    const criterionId = String(row['ad_group_criterion.criterion_id'] || '');
    const keywordText = String(row['ad_group_criterion.keyword.text'] || '');
    const matchType = String(row['ad_group_criterion.keyword.match_type'] || '');
    // We query for negative = TRUE, so no need to include it explicitly in output

    const newRow = [campaignName, campaignId, adGroupName, adGroupId, criterionId, keywordText, matchType];
    data.push(newRow);
  }
  return data;
}

function processCampaignStatus(rows) {
  const data = [];
  while (rows.hasNext()) {
    const row = rows.next();
    const campaignId = String(row['campaign.id'] || '');
    const campaignName = String(row['campaign.name'] || '');
    const status = String(row['campaign.status'] || '');
    const channelType = String(row['campaign.advertising_channel_type'] || '');

    const newRow = [campaignId, campaignName, status, channelType];
    data.push(newRow);
  }
  return data;
}

function processSharedListKeywords(rows) {
  const data = [];
  while (rows.hasNext()) {
    const row = rows.next();
    const listId = String(row['shared_set.id'] || '');
    const criterionId = String(row['shared_criterion.criterion_id'] || '');
    const keywordText = String(row['shared_criterion.keyword.text'] || '');
    const matchType = String(row['shared_criterion.keyword.match_type'] || '');
    const type = String(row['shared_criterion.type'] || '');

    const newRow = [listId, criterionId, keywordText, matchType, type];
    data.push(newRow);
  }
  return data;
}

function processLandingPages(rows) {
  const data = [];
  while (rows.hasNext()) {
    const row = rows.next();
    const url = String(row['landing_page_view.unexpanded_final_url'] || '');
    const impressions = Number(row['metrics.impressions'] || 0);
    const clicks = Number(row['metrics.clicks'] || 0);
    const costMicros = Number(row['metrics.cost_micros'] || 0);
    const cost = costMicros / 1000000;  // Convert micros to actual currency
    const conversions = Number(row['metrics.conversions'] || 0);
    const conversionValue = Number(row['metrics.conversions_value'] || 0);
    const ctr = impressions > 0 ? clicks / impressions : 0;
    const cvr = clicks > 0 ? conversions / clicks : 0;
    const cpa = conversions > 0 ? cost / conversions : 0;
    const roas = cost > 0 ? conversionValue / cost : 0;

    const newRow = [url, impressions, clicks, cost, conversions, conversionValue, ctr, cvr, cpa, roas];
    data.push(newRow);
  }
  return data;
}
