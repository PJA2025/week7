import { useState, useMemo, useCallback } from 'react'
import {
    DataSourceType,
    ColumnDefinition,
    DataFilter,
    SortConfig,
    DataSummary,
    ColumnType,
    FILTER_OPERATORS,
    TabData,
    AdMetric,
    SearchTermMetric,
    AdGroupMetric,
    AssetGroupMetric
} from '@/lib/types'
import { LLMModel, AVAILABLE_MODELS, LLMResponse, TokenUsage } from '@/lib/types/models'
import { generateInsightsWithProvider } from '@/lib/api-router'

interface UseDataInsightsState {
    // Data source and columns
    selectedDataSource: DataSourceType
    columns: ColumnDefinition[]

    // Filtering and sorting
    filters: DataFilter[]
    sortConfig: SortConfig | null
    previewRowCount: number

    // AI insights
    prompt: string
    selectedModel: LLMModel
    apiKey: string
    insights: string
    tokenUsage: TokenUsage | null

    // Loading states
    isLoadingData: boolean
    isGeneratingInsights: boolean

    // Error states
    dataError: string | null
    insightsError: string | null
}

interface UseDataInsightsActions {
    setSelectedDataSource: (source: DataSourceType) => void
    addFilter: () => void
    removeFilter: (filterId: string) => void
    updateFilter: (filterId: string, field: keyof DataFilter, value: string) => void
    setSortConfig: (config: SortConfig | null) => void
    setPreviewRowCount: (count: number) => void
    setPrompt: (prompt: string) => void
    setSelectedModel: (model: LLMModel) => void
    setApiKey: (apiKey: string) => void
    generateInsights: () => Promise<void>
    clearInsights: () => void
}

export function useDataInsights(tabData: TabData, currency: string = 'USD') {
    // State
    const [selectedDataSource, setSelectedDataSource] = useState<DataSourceType>('searchTerms')
    const [filters, setFilters] = useState<DataFilter[]>([])
    const [sortConfig, setSortConfig] = useState<SortConfig | null>(null)
    const [previewRowCount, setPreviewRowCount] = useState(5)
    const [prompt, setPrompt] = useState('')
    const [selectedModel, setSelectedModel] = useState<LLMModel>(AVAILABLE_MODELS[0])
    const [apiKey, setApiKey] = useState('')
    const [insights, setInsights] = useState('')
    const [tokenUsage, setTokenUsage] = useState<TokenUsage | null>(null)
    const [isLoadingData, setIsLoadingData] = useState(false)
    const [isGeneratingInsights, setIsGeneratingInsights] = useState(false)
    const [dataError, setDataError] = useState<string | null>(null)
    const [insightsError, setInsightsError] = useState<string | null>(null)

    // Derive columns from selected data source
    const columns = useMemo((): ColumnDefinition[] => {
        const rawData = tabData[selectedDataSource]
        if (!rawData || rawData.length === 0) return []

        const sampleRow = rawData[0]
        const derivedColumns: ColumnDefinition[] = []

        Object.keys(sampleRow).forEach(key => {
            const value = sampleRow[key as keyof typeof sampleRow]
            let type: ColumnType = 'dimension'
            let label = key

            // Determine column type based on key name and value
            if (key === 'date') {
                type = 'date'
                label = 'Date'
            } else if (typeof value === 'number' && ['impr', 'clicks', 'cost', 'conv', 'value', 'cpc', 'ctr', 'convRate', 'cpa', 'roas'].includes(key)) {
                type = 'metric'
                // Format labels for metrics
                const metricLabels: Record<string, string> = {
                    impr: 'Impressions',
                    clicks: 'Clicks',
                    cost: 'Cost',
                    conv: 'Conversions',
                    value: 'Conversion Value',
                    cpc: 'CPC',
                    ctr: 'CTR',
                    convRate: 'Conversion Rate',
                    cpa: 'CPA',
                    roas: 'ROAS'
                }
                label = metricLabels[key] || key
            } else {
                // Format labels for dimensions
                const dimensionLabels: Record<string, string> = {
                    campaign: 'Campaign',
                    campaignId: 'Campaign ID',
                    adGroup: 'Ad Group',
                    adGroupId: 'Ad Group ID',
                    assetGroup: 'Asset Group',
                    assetGroupId: 'Asset Group ID',
                    searchTerm: 'Search Term',
                    keyword: 'Keyword',
                    keywordText: 'Keyword Text',
                    status: 'Status'
                }
                label = dimensionLabels[key] || key.charAt(0).toUpperCase() + key.slice(1)
            }

            derivedColumns.push({
                name: key,
                key,
                type,
                label
            })
        })

        return derivedColumns
    }, [selectedDataSource, tabData])

    // Get raw data for current source
    const rawData = useMemo(() => {
        return tabData[selectedDataSource] || []
    }, [selectedDataSource, tabData])

    // Apply filters to data
    const filteredData = useMemo(() => {
        if (filters.length === 0) return rawData

        return rawData.filter(row => {
            return filters.every(filter => {
                const column = columns.find(col => col.key === filter.column)
                if (!column) return true

                const value = row[filter.column as keyof typeof row]
                const filterValue = filter.value.toLowerCase()
                const rowValue = String(value).toLowerCase()

                switch (filter.operator) {
                    case 'contains':
                        return rowValue.includes(filterValue)
                    case 'not_contains':
                        return !rowValue.includes(filterValue)
                    case 'equals':
                        return column.type === 'metric'
                            ? Number(value) === Number(filter.value)
                            : rowValue === filterValue
                    case 'not_equals':
                        return column.type === 'metric'
                            ? Number(value) !== Number(filter.value)
                            : rowValue !== filterValue
                    case 'starts_with':
                        return rowValue.startsWith(filterValue)
                    case 'ends_with':
                        return rowValue.endsWith(filterValue)
                    case 'greater_than':
                        return Number(value) > Number(filter.value)
                    case 'less_than':
                        return Number(value) < Number(filter.value)
                    case 'greater_equal':
                        return Number(value) >= Number(filter.value)
                    case 'less_equal':
                        return Number(value) <= Number(filter.value)
                    case 'after':
                        return new Date(String(value)) > new Date(filter.value)
                    case 'before':
                        return new Date(String(value)) < new Date(filter.value)
                    case 'on_or_after':
                        return new Date(String(value)) >= new Date(filter.value)
                    case 'on_or_before':
                        return new Date(String(value)) <= new Date(filter.value)
                    default:
                        return true
                }
            })
        })
    }, [rawData, filters, columns])

    // Apply sorting to filtered data
    const sortedData = useMemo(() => {
        if (!sortConfig) return filteredData

        return [...filteredData].sort((a, b) => {
            const aValue = a[sortConfig.column as keyof typeof a]
            const bValue = b[sortConfig.column as keyof typeof b]

            let comparison = 0
            if (typeof aValue === 'number' && typeof bValue === 'number') {
                comparison = aValue - bValue
            } else {
                comparison = String(aValue).localeCompare(String(bValue))
            }

            return sortConfig.direction === 'desc' ? -comparison : comparison
        })
    }, [filteredData, sortConfig])

    // Get preview data (limited rows)
    const previewData = useMemo(() => {
        return sortedData.slice(0, previewRowCount)
    }, [sortedData, previewRowCount])

    // Calculate data summary
    const dataSummary = useMemo((): DataSummary => {
        const summary: DataSummary = {
            totalRows: filteredData.length,
            metrics: {},
            dimensions: {}
        }

        if (filteredData.length === 0) return summary

        columns.forEach(column => {
            if (column.type === 'metric') {
                const values = filteredData
                    .map(row => Number(row[column.key as keyof typeof row]))
                    .filter(val => !isNaN(val))

                if (values.length > 0) {
                    summary.metrics[column.key] = {
                        min: Math.min(...values),
                        max: Math.max(...values),
                        avg: values.reduce((sum, val) => sum + val, 0) / values.length,
                        sum: values.reduce((sum, val) => sum + val, 0)
                    }
                }
            } else if (column.type === 'dimension') {
                const values = filteredData.map(row => String(row[column.key as keyof typeof row]))
                const uniqueValues = [...new Set(values)]

                summary.dimensions[column.key] = {
                    uniqueCount: uniqueValues.length
                }

                // Add top values for dimensions (limit to 5)
                if (uniqueValues.length <= 20) {
                    const valueCounts = values.reduce((acc, val) => {
                        acc[val] = (acc[val] || 0) + 1
                        return acc
                    }, {} as Record<string, number>)

                    summary.dimensions[column.key].topValues = Object.entries(valueCounts)
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 5)
                        .map(([value, count]) => ({ value, count }))
                }
            }
        })

        return summary
    }, [filteredData, columns])

    // Actions
    const handleSetSelectedDataSource = useCallback((source: DataSourceType) => {
        setSelectedDataSource(source)
        setFilters([]) // Reset filters when changing data source
        setSortConfig(null) // Reset sort
        setInsights('') // Clear insights
        setInsightsError(null)
        setTokenUsage(null)
    }, [])

    const addFilter = useCallback(() => {
        const firstColumn = columns[0]
        let defaultOperator = 'equals'

        if (firstColumn) {
            if (firstColumn.type === 'dimension') {
                defaultOperator = 'contains'
            } else if (firstColumn.type === 'metric') {
                defaultOperator = 'greater_than'
            }
        }

        const newFilter: DataFilter = {
            id: `filter_${Date.now()}`,
            column: firstColumn?.key || '',
            operator: defaultOperator,
            value: ''
        }
        setFilters(prev => [...prev, newFilter])
    }, [columns])

    const removeFilter = useCallback((filterId: string) => {
        setFilters(prev => prev.filter(f => f.id !== filterId))
    }, [])

    const updateFilter = useCallback((filterId: string, field: keyof DataFilter, value: string) => {
        setFilters(prev => prev.map(filter => {
            if (filter.id === filterId) {
                const updated = { ...filter, [field]: value }

                // Reset operator and value when column changes
                if (field === 'column') {
                    const column = columns.find(col => col.key === value)
                    if (column) {
                        const availableOperators = FILTER_OPERATORS.filter(op =>
                            op.types.includes(column.type)
                        )

                        // Set better default operators based on column type
                        let defaultOperator = availableOperators[0]?.value || 'equals'
                        if (column.type === 'dimension') {
                            const containsOp = availableOperators.find(op => op.value === 'contains')
                            if (containsOp) defaultOperator = 'contains'
                        } else if (column.type === 'metric') {
                            const greaterThanOp = availableOperators.find(op => op.value === 'greater_than')
                            if (greaterThanOp) defaultOperator = 'greater_than'
                        }

                        updated.operator = defaultOperator
                        updated.value = ''
                    }
                }

                return updated
            }
            return filter
        }))
    }, [columns])

    const generateInsights = useCallback(async () => {
        if (!prompt.trim() || filteredData.length === 0) return

        setIsGeneratingInsights(true)
        setInsightsError(null)

        try {
            const filterDescriptions = filters.map(filter => {
                const column = columns.find(col => col.key === filter.column)
                const operator = FILTER_OPERATORS.find(op => op.value === filter.operator)
                return `${column?.label || filter.column} ${operator?.label || filter.operator} "${filter.value}"`
            })

            const response = await generateInsightsWithProvider({
                prompt,
                data: filteredData,
                dataSource: selectedDataSource,
                filters: filterDescriptions,
                totalRows: rawData.length,
                analyzedRows: filteredData.length,
                currency,
                provider: selectedModel.provider,
                model: selectedModel.id,
                apiKey: apiKey
            })

            setInsights(response.content)
            setTokenUsage(response.usage || null)
        } catch (error) {
            setInsightsError(error instanceof Error ? error.message : 'Failed to generate insights')
        } finally {
            setIsGeneratingInsights(false)
        }
    }, [prompt, filteredData, filters, columns, selectedDataSource, rawData.length, currency, selectedModel, apiKey])

    const clearInsights = useCallback(() => {
        setInsights('')
        setTokenUsage(null)
        setInsightsError(null)
    }, [])

    const state: UseDataInsightsState = {
        selectedDataSource,
        columns,
        filters,
        sortConfig,
        previewRowCount,
        prompt,
        selectedModel,
        apiKey,
        insights,
        tokenUsage,
        isLoadingData,
        isGeneratingInsights,
        dataError,
        insightsError
    }

    const actions: UseDataInsightsActions = {
        setSelectedDataSource: handleSetSelectedDataSource,
        addFilter,
        removeFilter,
        updateFilter,
        setSortConfig,
        setPreviewRowCount,
        setPrompt,
        setSelectedModel,
        setApiKey,
        generateInsights,
        clearInsights
    }

    return {
        ...state,
        ...actions,
        rawData,
        filteredData,
        sortedData,
        previewData,
        dataSummary,
        availableModels: AVAILABLE_MODELS,
        filterOperators: FILTER_OPERATORS
    }
} 