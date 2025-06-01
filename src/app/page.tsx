// src/app/page.tsx

'use client'

import { useEffect, useState, useMemo } from 'react'
import { useSettings } from '@/lib/contexts/SettingsContext'
import type { AdMetric, DailyMetrics, TabData, AdGroupMetric, AssetGroupMetric } from '@/lib/types'
import { calculateDailyMetrics } from '@/lib/metrics'
import { MetricCard } from '@/components/MetricCard'
import { MetricsChart } from '@/components/MetricsChart'
import { CampaignSelect } from '@/components/CampaignSelect'
import { AssetGroupSelect } from '@/components/AssetGroupSelect'
import { formatCurrency, formatPercent, formatConversions } from '@/lib/utils'
import { COLORS } from '@/lib/config'

type DisplayMetric = 'impr' | 'clicks' | 'CTR' | 'CPC' | 'cost' |
    'conv' | 'CvR' | 'CPA' | 'value' | 'ROAS'

const metricConfig = {
    impr: { label: 'Impressions', format: (v: number) => v.toLocaleString(), row: 1 },
    clicks: { label: 'Clicks', format: (v: number) => v.toLocaleString(), row: 1 },
    CTR: { label: 'CTR', format: formatPercent, row: 2 },
    CPC: { label: 'CPC', format: (v: number, currency: string) => formatCurrency(v, currency), row: 2 },
    cost: { label: 'Cost', format: (v: number, currency: string) => currency + Math.round(v).toLocaleString(), row: 1 },
    conv: { label: 'Conv', format: formatConversions, row: 1 },
    CvR: { label: 'Conv Rate', format: formatPercent, row: 2 },
    CPA: { label: 'CPA', format: (v: number, currency: string) => formatCurrency(v, currency), row: 2 },
    value: { label: 'Value', format: (v: number, currency: string) => currency + Math.round(v).toLocaleString(), row: 1 },
    ROAS: { label: 'ROAS', format: (v: number) => v.toFixed(2) + 'x', row: 2 }
} as const

export default function DashboardPage() {
    const { settings, fetchedData, dataError, isDataLoading, campaigns } = useSettings()
    const [selectedMetrics, setSelectedMetrics] = useState<[DisplayMetric, DisplayMetric]>(['cost', 'value'])
    const [selectedCampaignId, setSelectedCampaignId] = useState<string>('all-campaigns')
    const [selectedAdGroupId, setSelectedAdGroupId] = useState<string>('all-adgroups')
    const [selectedAssetGroupId, setSelectedAssetGroupId] = useState<string>('all-assetgroups')

    // Reset ad group and asset group selection when campaign changes
    useEffect(() => {
        setSelectedAdGroupId('all-adgroups')
        setSelectedAssetGroupId('all-assetgroups')
    }, [selectedCampaignId])

    // Campaign navigation functions
    const getCurrentCampaignIndex = () => {
        if (selectedCampaignId === 'all-campaigns') return -1
        return campaigns.findIndex(c => c.id === selectedCampaignId)
    }

    const handlePreviousCampaign = () => {
        const currentIndex = getCurrentCampaignIndex()
        if (currentIndex === -1) {
            // Currently on "All Campaigns", go to last campaign
            if (campaigns.length > 0) {
                setSelectedCampaignId(campaigns[campaigns.length - 1].id)
            }
        } else if (currentIndex > 0) {
            // Go to previous campaign
            setSelectedCampaignId(campaigns[currentIndex - 1].id)
        } else {
            // At first campaign, go to "All Campaigns"
            setSelectedCampaignId('all-campaigns')
        }
    }

    const handleNextCampaign = () => {
        const currentIndex = getCurrentCampaignIndex()
        if (currentIndex === -1) {
            // Currently on "All Campaigns", go to first campaign
            if (campaigns.length > 0) {
                setSelectedCampaignId(campaigns[0].id)
            }
        } else if (currentIndex < campaigns.length - 1) {
            // Go to next campaign
            setSelectedCampaignId(campaigns[currentIndex + 1].id)
        } else {
            // At last campaign, go to "All Campaigns"
            setSelectedCampaignId('all-campaigns')
        }
    }

    // Check if navigation buttons should be disabled
    const canNavigatePrevious = campaigns.length > 0
    const canNavigateNext = campaigns.length > 0

    // Aggregate metrics by date when viewing all campaigns
    const aggregateMetricsByDate = (data: AdMetric[]): AdMetric[] => {
        const metricsByDate = data.reduce((acc, metric) => {
            const date = metric.date
            if (!acc[date]) {
                acc[date] = {
                    campaign: 'All Campaigns',
                    campaignId: '',
                    date,
                    impr: 0,
                    clicks: 0,
                    cost: 0,
                    conv: 0,
                    value: 0,
                }
            }
            acc[date].impr += metric.impr
            acc[date].clicks += metric.clicks
            acc[date].cost += metric.cost
            acc[date].conv += metric.conv
            acc[date].value += metric.value
            return acc
        }, {} as Record<string, AdMetric>)

        return Object.values(metricsByDate).sort((a, b) =>
            new Date(a.date).getTime() - new Date(b.date).getTime()
        )
    }

    // Get filtered daily data based on campaign selection
    const filteredDailyData = useMemo(() => {
        if (!fetchedData?.daily) return []

        if (selectedCampaignId && selectedCampaignId !== 'all-campaigns') {
            return fetchedData.daily.filter(d => d.campaignId === selectedCampaignId)
        } else {
            return aggregateMetricsByDate(fetchedData.daily)
        }
    }, [selectedCampaignId, fetchedData?.daily])

    // Calculate daily metrics for chart and scorecard
    const dailyMetrics = useMemo(() => {
        return calculateDailyMetrics(filteredDailyData)
    }, [filteredDailyData])

    // Filter adGroups based on selectedCampaignId
    const campaignAdGroupsData = useMemo(() => {
        if (!selectedCampaignId || selectedCampaignId === 'all-campaigns' || !fetchedData?.adGroups) {
            return []
        }
        return fetchedData.adGroups.filter(ag => ag.campaignId === selectedCampaignId)
    }, [selectedCampaignId, fetchedData?.adGroups])

    // Filter assetGroups based on selectedCampaignId
    const campaignAssetGroupsData = useMemo(() => {
        if (!selectedCampaignId || selectedCampaignId === 'all-campaigns' || !fetchedData?.assetGroups) {
            return []
        }
        return fetchedData.assetGroups.filter(ag => ag.campaignId === selectedCampaignId)
    }, [selectedCampaignId, fetchedData?.assetGroups])

    // Determine if this campaign has ad groups or asset groups
    const hasAdGroups = campaignAdGroupsData.length > 0
    const hasAssetGroups = campaignAssetGroupsData.length > 0

    // Get unique ad groups for the selected campaign to populate the dropdown
    const uniqueAdGroupsForCampaign = useMemo(() => {
        if (!campaignAdGroupsData.length) return []

        const adGroupMap = new Map<string, { id: string; name: string; totalCost: number }>()
        campaignAdGroupsData.forEach(ag => {
            const adGroupId = ag.adGroupId ? String(ag.adGroupId).trim() : ''
            const adGroupName = ag.adGroup ? String(ag.adGroup).trim() : ''

            // Ensure adGroupId is valid and adGroupName is not empty
            if (adGroupId && adGroupName) {
                if (!adGroupMap.has(adGroupId)) {
                    adGroupMap.set(adGroupId, { id: adGroupId, name: adGroupName, totalCost: ag.cost })
                } else {
                    const existing = adGroupMap.get(adGroupId)!
                    existing.totalCost += ag.cost
                }
            }
        })

        const adGroupsArray = Array.from(adGroupMap.values())
        return adGroupsArray.sort((a, b) => b.totalCost - a.totalCost) // Sort by cost like campaigns
    }, [campaignAdGroupsData])

    // Get unique asset groups for the selected campaign to populate the dropdown
    const uniqueAssetGroupsForCampaign = useMemo(() => {
        if (!campaignAssetGroupsData.length) return []

        const assetGroupMap = new Map<string, { id: string; name: string; totalCost: number; status: string }>()
        campaignAssetGroupsData.forEach(ag => {
            const assetGroupId = ag.assetGroupId ? String(ag.assetGroupId).trim() : ''
            const assetGroupName = ag.assetGroup ? String(ag.assetGroup).trim() : ''
            const status = ag.status ? String(ag.status).trim() : ''

            // Ensure assetGroupId is valid and assetGroupName is not empty
            if (assetGroupId && assetGroupName) {
                if (!assetGroupMap.has(assetGroupId)) {
                    assetGroupMap.set(assetGroupId, { id: assetGroupId, name: assetGroupName, totalCost: ag.cost, status })
                } else {
                    const existing = assetGroupMap.get(assetGroupId)!
                    existing.totalCost += ag.cost
                }
            }
        })

        const assetGroupsArray = Array.from(assetGroupMap.values())
        return assetGroupsArray.sort((a, b) => b.totalCost - a.totalCost) // Sort by cost like campaigns
    }, [campaignAssetGroupsData])

    // Auto-select the highest cost ad group when campaign changes or when ad groups are available
    useEffect(() => {
        if (uniqueAdGroupsForCampaign.length > 0 && (selectedAdGroupId === 'all-adgroups' || !uniqueAdGroupsForCampaign.find(ag => ag.id === selectedAdGroupId))) {
            setSelectedAdGroupId(uniqueAdGroupsForCampaign[0].id) // Select highest cost ad group
        }
    }, [uniqueAdGroupsForCampaign, selectedAdGroupId])

    // Auto-select the highest cost asset group when campaign changes or when asset groups are available
    useEffect(() => {
        if (uniqueAssetGroupsForCampaign.length > 0 && (selectedAssetGroupId === 'all-assetgroups' || !uniqueAssetGroupsForCampaign.find(ag => ag.id === selectedAssetGroupId))) {
            setSelectedAssetGroupId(uniqueAssetGroupsForCampaign[0].id) // Select highest cost asset group
        }
    }, [uniqueAssetGroupsForCampaign, selectedAssetGroupId])

    // Ad Group navigation functions
    const getCurrentAdGroupIndex = () => {
        return uniqueAdGroupsForCampaign.findIndex(ag => ag.id === selectedAdGroupId)
    }

    const handlePreviousAdGroup = () => {
        const currentIndex = getCurrentAdGroupIndex()
        if (currentIndex > 0) {
            // Go to previous ad group
            setSelectedAdGroupId(uniqueAdGroupsForCampaign[currentIndex - 1].id)
        } else if (currentIndex === 0 && uniqueAdGroupsForCampaign.length > 1) {
            // At first ad group, go to last ad group
            setSelectedAdGroupId(uniqueAdGroupsForCampaign[uniqueAdGroupsForCampaign.length - 1].id)
        }
    }

    const handleNextAdGroup = () => {
        const currentIndex = getCurrentAdGroupIndex()
        if (currentIndex < uniqueAdGroupsForCampaign.length - 1) {
            // Go to next ad group
            setSelectedAdGroupId(uniqueAdGroupsForCampaign[currentIndex + 1].id)
        } else if (currentIndex === uniqueAdGroupsForCampaign.length - 1 && uniqueAdGroupsForCampaign.length > 1) {
            // At last ad group, go to first ad group
            setSelectedAdGroupId(uniqueAdGroupsForCampaign[0].id)
        }
    }

    const canNavigateAdGroupPrevious = uniqueAdGroupsForCampaign.length > 1
    const canNavigateAdGroupNext = uniqueAdGroupsForCampaign.length > 1

    // Asset Group navigation functions
    const getCurrentAssetGroupIndex = () => {
        return uniqueAssetGroupsForCampaign.findIndex(ag => ag.id === selectedAssetGroupId)
    }

    const handlePreviousAssetGroup = () => {
        const currentIndex = getCurrentAssetGroupIndex()
        if (currentIndex > 0) {
            // Go to previous asset group
            setSelectedAssetGroupId(uniqueAssetGroupsForCampaign[currentIndex - 1].id)
        } else if (currentIndex === 0 && uniqueAssetGroupsForCampaign.length > 1) {
            // At first asset group, go to last asset group
            setSelectedAssetGroupId(uniqueAssetGroupsForCampaign[uniqueAssetGroupsForCampaign.length - 1].id)
        }
    }

    const handleNextAssetGroup = () => {
        const currentIndex = getCurrentAssetGroupIndex()
        if (currentIndex < uniqueAssetGroupsForCampaign.length - 1) {
            // Go to next asset group
            setSelectedAssetGroupId(uniqueAssetGroupsForCampaign[currentIndex + 1].id)
        } else if (currentIndex === uniqueAssetGroupsForCampaign.length - 1 && uniqueAssetGroupsForCampaign.length > 1) {
            // At last asset group, go to first asset group
            setSelectedAssetGroupId(uniqueAssetGroupsForCampaign[0].id)
        }
    }

    const canNavigateAssetGroupPrevious = uniqueAssetGroupsForCampaign.length > 1
    const canNavigateAssetGroupNext = uniqueAssetGroupsForCampaign.length > 1

    // Get filtered ad group data based on ad group selection (using the same logic as AdGroupTable)
    const processedAdGroupData = useMemo(() => {
        if (!campaignAdGroupsData.length || !selectedAdGroupId) return []

        // Always show daily data for the selected ad group (no more "All Ad Groups")
        return campaignAdGroupsData
            .filter(item => item.adGroupId === selectedAdGroupId)
            .map(item => ({
                ...item,
                // Recalculate derived metrics for consistency
                ctr: item.impr > 0 ? (item.clicks / item.impr) * 100 : 0,
                cpc: item.clicks > 0 ? item.cost / item.clicks : 0,
                convRate: item.clicks > 0 ? (item.conv / item.clicks) * 100 : 0,
                cpa: item.conv > 0 ? item.cost / item.conv : 0,
                roas: item.cost > 0 ? item.value / item.cost : 0,
            }))
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [campaignAdGroupsData, selectedAdGroupId])

    // Get filtered asset group data based on asset group selection
    const processedAssetGroupData = useMemo(() => {
        if (!campaignAssetGroupsData.length || !selectedAssetGroupId) return []

        // Always show daily data for the selected asset group
        return campaignAssetGroupsData
            .filter(item => item.assetGroupId === selectedAssetGroupId)
            .map(item => ({
                ...item,
                // Recalculate derived metrics for consistency
                ctr: item.impr > 0 ? (item.clicks / item.impr) * 100 : 0,
                cpc: item.clicks > 0 ? item.cost / item.clicks : 0,
                convRate: item.clicks > 0 ? (item.conv / item.clicks) * 100 : 0,
                cpa: item.conv > 0 ? item.cost / item.conv : 0,
                roas: item.cost > 0 ? item.value / item.cost : 0,
            }))
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [campaignAssetGroupsData, selectedAssetGroupId])

    // Calculate daily metrics for ad group chart
    const adGroupDailyMetrics = useMemo(() => {
        return processedAdGroupData.map(ag => ({
            date: ag.date,
            impr: ag.impr,
            clicks: ag.clicks,
            cost: ag.cost,
            conv: ag.conv,
            value: ag.value,
            CTR: ag.ctr,
            CPC: ag.cpc,
            CvR: ag.convRate,
            CPA: ag.cpa,
            ROAS: ag.roas,
        }))
    }, [processedAdGroupData])

    // Calculate daily metrics for asset group chart
    const assetGroupDailyMetrics = useMemo(() => {
        return processedAssetGroupData.map(ag => ({
            date: ag.date,
            impr: ag.impr,
            clicks: ag.clicks,
            cost: ag.cost,
            conv: ag.conv,
            value: ag.value,
            CTR: ag.ctr,
            CPC: ag.cpc,
            CvR: ag.convRate,
            CPA: ag.cpa,
            ROAS: ag.roas,
        }))
    }, [processedAssetGroupData])

    // Calculate totals for scorecard
    const calculateTotals = () => {
        if (dailyMetrics.length === 0) return null

        const sums = dailyMetrics.reduce((acc, d) => ({
            impr: acc.impr + d.impr,
            clicks: acc.clicks + d.clicks,
            cost: acc.cost + d.cost,
            conv: acc.conv + d.conv,
            value: acc.value + d.value,
        }), {
            impr: 0, clicks: 0, cost: 0, conv: 0, value: 0,
        })

        return {
            ...sums,
            CTR: (sums.impr ? (sums.clicks / sums.impr) * 100 : 0),
            CPC: (sums.clicks ? sums.cost / sums.clicks : 0),
            CvR: (sums.clicks ? (sums.conv / sums.clicks) * 100 : 0),
            CPA: (sums.conv ? sums.cost / sums.conv : 0),
            ROAS: (sums.cost ? sums.value / sums.cost : 0),
        }
    }

    const handleMetricClick = (metric: DisplayMetric) => {
        setSelectedMetrics(prev => [prev[1], metric])
    }

    // Get chart title based on selection
    const getChartTitle = () => {
        if (selectedCampaignId && selectedCampaignId !== 'all-campaigns' && campaigns.find(c => c.id === selectedCampaignId)) {
            const campaignName = campaigns.find(c => c.id === selectedCampaignId)?.name
            return campaignName
        }
        return "All Campaigns"
    }

    // Get ad group chart title based on selection
    const getAdGroupChartTitle = () => {
        if (selectedAdGroupId && uniqueAdGroupsForCampaign.find(ag => ag.id === selectedAdGroupId)) {
            const adGroup = uniqueAdGroupsForCampaign.find(ag => ag.id === selectedAdGroupId)!
            return `${adGroup.name} (${formatCurrency(adGroup.totalCost, settings.currency)})`
        }
        return "Ad Group Performance"
    }

    // Get asset group chart title based on selection
    const getAssetGroupChartTitle = () => {
        if (selectedAssetGroupId && uniqueAssetGroupsForCampaign.find(ag => ag.id === selectedAssetGroupId)) {
            const assetGroup = uniqueAssetGroupsForCampaign.find(ag => ag.id === selectedAssetGroupId)!
            return `${assetGroup.name} (${formatCurrency(assetGroup.totalCost, settings.currency)})`
        }
        return "Asset Group Performance"
    }

    // Loading state
    if (isDataLoading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center py-12">
                    <div className="text-lg">Loading...</div>
                </div>
            </DashboardLayout>
        )
    }

    // Settings not configured
    if (!settings.sheetUrl) {
        return (
            <DashboardLayout>
                <div className="text-center py-12">
                    <p className="text-lg text-muted-foreground">Please configure your Google Sheet URL in settings</p>
                </div>
            </DashboardLayout>
        )
    }

    // Data error
    if (dataError) {
        return (
            <DashboardLayout>
                <div className="text-center py-12">
                    <p className="text-lg text-red-600">Failed to load data. Please check your Sheet URL.</p>
                </div>
            </DashboardLayout>
        )
    }

    // No data for All Campaigns
    if ((!selectedCampaignId || selectedCampaignId === 'all-campaigns') && (!fetchedData?.daily || fetchedData.daily.length === 0)) {
        return (
            <DashboardLayout>
                <div className="text-center py-12">
                    <p className="text-lg text-muted-foreground">No data found for All Campaigns</p>
                </div>
            </DashboardLayout>
        )
    }

    // No data for selected campaign (daily, ad groups, and asset groups all empty)
    if (selectedCampaignId && selectedCampaignId !== 'all-campaigns' && dailyMetrics.length === 0 && campaignAdGroupsData.length === 0 && campaignAssetGroupsData.length === 0) {
        return (
            <DashboardLayout>
                <div className="space-y-6">
                    <CampaignSelect
                        campaigns={campaigns || []}
                        selectedId={selectedCampaignId}
                        onSelect={setSelectedCampaignId}
                    />
                    <div className="text-center py-12">
                        <p className="text-lg text-muted-foreground">No data found for this campaign</p>
                    </div>
                </div>
            </DashboardLayout>
        )
    }

    const totals = calculateTotals()

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <CampaignSelect
                    campaigns={campaigns || []}
                    selectedId={selectedCampaignId}
                    onSelect={setSelectedCampaignId}
                />

                {/* Only render metric cards and chart if totals are available */}
                {totals && (
                    <>
                        <div className="grid gap-2 grid-cols-10">
                            {Object.entries(metricConfig)
                                .map(([key, config]) => {
                                    const metricKey = key as DisplayMetric
                                    const isMetric1 = selectedMetrics[0] === metricKey
                                    const isMetric2 = selectedMetrics[1] === metricKey
                                    let highlightColor = undefined
                                    if (isMetric1) highlightColor = COLORS.primary
                                    else if (isMetric2) highlightColor = COLORS.secondary

                                    return (
                                        <MetricCard
                                            key={key}
                                            label={config.label}
                                            value={config.format(totals[metricKey], settings.currency)}
                                            isSelected={selectedMetrics.includes(metricKey)}
                                            onClick={() => handleMetricClick(metricKey)}
                                            highlightColor={highlightColor}
                                        />
                                    )
                                })}
                        </div>

                        <MetricsChart
                            data={dailyMetrics}
                            chartTitle={getChartTitle()}
                            metric1={{
                                key: selectedMetrics[0],
                                label: metricConfig[selectedMetrics[0]].label,
                                color: COLORS.primary,
                            }}
                            metric2={{
                                key: selectedMetrics[1],
                                label: metricConfig[selectedMetrics[1]].label,
                                color: COLORS.secondary,
                            }}
                            onPreviousCampaign={handlePreviousCampaign}
                            onNextCampaign={handleNextCampaign}
                            canNavigatePrevious={canNavigatePrevious}
                            canNavigateNext={canNavigateNext}
                        />
                    </>
                )}

                {/* Ad Group Section - only show if a campaign is selected and has ad groups */}
                {selectedCampaignId && selectedCampaignId !== 'all-campaigns' && hasAdGroups && (
                    <div className="mt-8 pt-6 border-t">
                        <h2 className="text-2xl font-semibold mb-4">
                            Ad Group Performance {uniqueAdGroupsForCampaign.length > 0 && `(${uniqueAdGroupsForCampaign.length})`}
                        </h2>
                        {uniqueAdGroupsForCampaign.length > 0 ? (
                            <>
                                {adGroupDailyMetrics.length > 0 && (
                                    <MetricsChart
                                        data={adGroupDailyMetrics}
                                        chartTitle={getAdGroupChartTitle()}
                                        metric1={{
                                            key: selectedMetrics[0],
                                            label: metricConfig[selectedMetrics[0]].label,
                                            color: COLORS.primary,
                                        }}
                                        metric2={{
                                            key: selectedMetrics[1],
                                            label: metricConfig[selectedMetrics[1]].label,
                                            color: COLORS.secondary,
                                        }}
                                        onPreviousCampaign={handlePreviousAdGroup}
                                        onNextCampaign={handleNextAdGroup}
                                        canNavigatePrevious={canNavigateAdGroupPrevious}
                                        canNavigateNext={canNavigateAdGroupNext}
                                    />
                                )}
                            </>
                        ) : (
                            <p className="text-center text-gray-500 py-4">This campaign does not have any ad groups.</p>
                        )}
                    </div>
                )}

                {/* Asset Group Section - only show if a campaign is selected and has asset groups */}
                {selectedCampaignId && selectedCampaignId !== 'all-campaigns' && hasAssetGroups && (
                    <div className="mt-8 pt-6 border-t">
                        <h2 className="text-2xl font-semibold mb-4">
                            Asset Group Performance {uniqueAssetGroupsForCampaign.length > 0 && `(${uniqueAssetGroupsForCampaign.length})`}
                        </h2>
                        {uniqueAssetGroupsForCampaign.length > 0 ? (
                            <>
                                {assetGroupDailyMetrics.length > 0 && (
                                    <MetricsChart
                                        data={assetGroupDailyMetrics}
                                        chartTitle={getAssetGroupChartTitle()}
                                        metric1={{
                                            key: selectedMetrics[0],
                                            label: metricConfig[selectedMetrics[0]].label,
                                            color: COLORS.primary,
                                        }}
                                        metric2={{
                                            key: selectedMetrics[1],
                                            label: metricConfig[selectedMetrics[1]].label,
                                            color: COLORS.secondary,
                                        }}
                                        onPreviousCampaign={handlePreviousAssetGroup}
                                        onNextCampaign={handleNextAssetGroup}
                                        canNavigatePrevious={canNavigateAssetGroupPrevious}
                                        canNavigateNext={canNavigateAssetGroupNext}
                                    />
                                )}
                            </>
                        ) : (
                            <p className="text-center text-gray-500 py-4">This campaign does not have any asset groups.</p>
                        )}
                    </div>
                )}
            </div>
        </DashboardLayout>
    )
}

function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="container mx-auto px-4 py-12 mt-16">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900">A more useful dashboard</h1>
            </div>
            {children}
        </div>
    )
}