'use client'

import React, { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useSettings } from '@/lib/contexts/SettingsContext'
import { useDataInsights } from '@/hooks/useDataInsights'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Plus, X, ArrowUpDown, ArrowUp, ArrowDown, Info } from 'lucide-react'
import { DataSourceType, FILTER_OPERATORS } from '@/lib/types'
import { SHEET_TABS } from '@/lib/config'

const ROW_COUNT_OPTIONS = [5, 10, 30, 50, 100]
const MAX_RECOMMENDED_INSIGHT_ROWS = 1000

const DATA_SOURCE_LABELS: Record<DataSourceType, string> = {
    daily: 'Daily Performance',
    searchTerms: 'Search Terms',
    adGroups: 'Ad Groups',
    assetGroups: 'Asset Groups'
}

const DEFAULT_PROMPT = `Analyze this Google Ads data and provide actionable insights. Focus on identifying the top performing and underperforming elements, cost efficiency opportunities, and specific optimization recommendations. What patterns do you see in the performance metrics, and what concrete steps should I take to improve campaign results and reduce wasted spend?`

export default function InsightsPage() {
    const { fetchedData, isDataLoading, dataError, settings, refreshData } = useSettings()

    const insights = useDataInsights(fetchedData || {
        daily: [],
        searchTerms: [],
        adGroups: [],
        assetGroups: []
    }, settings.currency)

    // Set default prompt on component mount
    React.useEffect(() => {
        if (!insights.prompt) {
            insights.setPrompt(DEFAULT_PROMPT)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Debug logging
    React.useEffect(() => {
        console.log('Insights Page Debug:', {
            isDataLoading,
            dataError,
            fetchedData: fetchedData ? Object.keys(fetchedData) : null,
            sheetUrl: settings.sheetUrl
        })
    }, [isDataLoading, dataError, fetchedData, settings.sheetUrl])

    if (isDataLoading) {
        return (
            <div className="container mx-auto px-4 pt-20 pb-8">
                <div className="flex flex-col items-center justify-center h-64 space-y-4">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <span className="ml-2">Loading data...</span>
                    <Button
                        variant="outline"
                        onClick={() => refreshData()}
                        className="mt-4"
                    >
                        Refresh Data
                    </Button>
                </div>
            </div>
        )
    }

    if (dataError) {
        return (
            <div className="container mx-auto px-4 pt-20 pb-8">
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center space-y-4">
                            <div className="text-red-600">
                                Error loading data: {dataError.message || String(dataError)}
                            </div>
                            <Button
                                variant="outline"
                                onClick={() => refreshData()}
                            >
                                Try Again
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    // Handle case where data is not available but not loading
    if (!fetchedData) {
        return (
            <div className="container mx-auto px-4 pt-20 pb-8">
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center text-muted-foreground space-y-4">
                            <p>No data available. Please check your sheet URL in settings.</p>
                            <p className="text-sm">Current URL: {settings.sheetUrl}</p>
                            <Button
                                variant="outline"
                                onClick={() => refreshData()}
                            >
                                Retry Loading
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    const handleSort = (column: string) => {
        if (insights.sortConfig?.column === column) {
            const newDirection = insights.sortConfig.direction === 'asc' ? 'desc' : 'asc'
            insights.setSortConfig({ column, direction: newDirection })
        } else {
            insights.setSortConfig({ column, direction: 'asc' })
        }
    }

    const getSortIcon = (column: string) => {
        if (insights.sortConfig?.column !== column) {
            return <ArrowUpDown className="h-4 w-4" />
        }
        return insights.sortConfig.direction === 'asc'
            ? <ArrowUp className="h-4 w-4" />
            : <ArrowDown className="h-4 w-4" />
    }

    const formatValue = (value: any, column: any) => {
        if (column.type === 'metric') {
            if (typeof value === 'number') {
                if (column.key === 'cost' || column.key === 'value' || column.key === 'cpc' || column.key === 'cpa') {
                    return `${settings.currency}${value.toFixed(2)}`
                }
                if (column.key === 'ctr' || column.key === 'convRate') {
                    return `${(value * 100).toFixed(2)}%`
                }
                if (column.key === 'roas') {
                    return value.toFixed(2)
                }
                return value.toLocaleString()
            }
        }
        return String(value)
    }

    // Calculate how many rows will be sent to AI
    const rowsToSendToAI = Math.min(insights.filteredData.length, MAX_RECOMMENDED_INSIGHT_ROWS)

    return (
        <div className="container mx-auto px-4 pt-20 pb-8 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Data Insights</h1>
                    <p className="text-muted-foreground">
                        Explore your advertising data and generate AI-powered insights
                    </p>
                </div>
            </div>

            {/* Data Source Selection */}
            <Card>
                <CardHeader>
                    <CardTitle>Data Source</CardTitle>
                    <CardDescription>
                        Select the dataset you want to analyze
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Select
                        value={insights.selectedDataSource}
                        onValueChange={(value) => insights.setSelectedDataSource(value as DataSourceType)}
                    >
                        <SelectTrigger className="w-64">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {SHEET_TABS.map(tab => (
                                <SelectItem key={tab} value={tab}>
                                    {DATA_SOURCE_LABELS[tab]}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>

            {/* Data Preview */}
            <Card>
                <CardHeader>
                    <CardTitle>Data Preview</CardTitle>
                    <CardDescription>
                        Preview of your dataset - apply filters below to refine the data
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Label htmlFor="rowCount">Rows to display:</Label>
                            <Select
                                value={insights.previewRowCount.toString()}
                                onValueChange={(value) => insights.setPreviewRowCount(Number(value))}
                            >
                                <SelectTrigger className="w-24">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {ROW_COUNT_OPTIONS.map(count => (
                                        <SelectItem key={count} value={count.toString()}>
                                            {count}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <Badge variant="secondary">
                            {insights.filteredData.length} total rows
                        </Badge>
                    </div>

                    {insights.previewData.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No data matches your current filters
                        </div>
                    ) : (
                        <div className="border rounded-lg overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        {insights.columns.map(column => (
                                            <TableHead
                                                key={column.key}
                                                className="cursor-pointer hover:bg-muted/50"
                                                onClick={() => handleSort(column.key)}
                                            >
                                                <div className="flex items-center gap-1">
                                                    {column.label}
                                                    {getSortIcon(column.key)}
                                                </div>
                                            </TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {insights.previewData.map((row, index) => (
                                        <TableRow key={index}>
                                            {insights.columns.map(column => (
                                                <TableCell key={column.key}>
                                                    {formatValue(row[column.key as keyof typeof row], column)}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle>Filters</CardTitle>
                    <CardDescription>
                        Apply filters to refine your data analysis. The filtered data above will be sent to the AI model.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {insights.filters.map((filter) => {
                        const column = insights.columns.find(col => col.key === filter.column)
                        const availableOperators = FILTER_OPERATORS.filter(op =>
                            column ? op.types.includes(column.type) : true
                        )

                        return (
                            <div key={filter.id} className="flex items-center gap-2">
                                <Select
                                    value={filter.column}
                                    onValueChange={(value) => insights.updateFilter(filter.id, 'column', value)}
                                >
                                    <SelectTrigger className="w-48">
                                        <SelectValue placeholder="Select column" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {insights.columns.map(col => (
                                            <SelectItem key={col.key} value={col.key}>
                                                {col.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Select
                                    value={filter.operator}
                                    onValueChange={(value) => insights.updateFilter(filter.id, 'operator', value)}
                                >
                                    <SelectTrigger className="w-48">
                                        <SelectValue placeholder="Select operator" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableOperators.map(op => (
                                            <SelectItem key={op.value} value={op.value}>
                                                {op.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Input
                                    placeholder="Filter value"
                                    value={filter.value}
                                    onChange={(e) => insights.updateFilter(filter.id, 'value', e.target.value)}
                                    className="w-48"
                                />

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => insights.removeFilter(filter.id)}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        )
                    })}

                    <Button
                        variant="outline"
                        onClick={insights.addFilter}
                        disabled={insights.columns.length === 0}
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Filter
                    </Button>
                </CardContent>
            </Card>

            {/* AI Insights */}
            <Card>
                <CardHeader>
                    <CardTitle>AI Insights</CardTitle>
                    <CardDescription>
                        Generate AI-powered insights from your filtered data
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Data to AI Info */}
                    <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <Info className="h-4 w-4 text-blue-600" />
                        <span className="text-sm text-blue-800">
                            <strong>{rowsToSendToAI.toLocaleString()}</strong> rows of filtered data will be sent to the AI model
                            {insights.filteredData.length > MAX_RECOMMENDED_INSIGHT_ROWS && (
                                <span className="text-blue-600"> (limited from {insights.filteredData.length.toLocaleString()} total rows)</span>
                            )}
                        </span>
                    </div>

                    <div className="flex gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="model">AI Model</Label>
                            <Select
                                value={insights.selectedModel.id}
                                onValueChange={(value) => {
                                    const model = insights.availableModels.find(m => m.id === value)
                                    if (model) insights.setSelectedModel(model)
                                }}
                            >
                                <SelectTrigger className="w-64">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {insights.availableModels.map(model => (
                                        <SelectItem key={model.id} value={model.id}>
                                            {model.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="apiKey">OpenAI API Key</Label>
                            <Input
                                id="apiKey"
                                type="password"
                                placeholder="sk-..."
                                value={insights.apiKey}
                                onChange={(e) => insights.setApiKey(e.target.value)}
                                className="w-64"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="prompt">Your Question or Prompt</Label>
                        <Textarea
                            id="prompt"
                            placeholder="Ask a question about your data or request specific insights..."
                            value={insights.prompt}
                            onChange={(e) => insights.setPrompt(e.target.value)}
                            rows={4}
                        />
                    </div>

                    <div className="flex gap-2">
                        <Button
                            onClick={insights.generateInsights}
                            disabled={!insights.prompt.trim() || insights.filteredData.length === 0 || insights.isGeneratingInsights || !insights.apiKey.trim()}
                        >
                            {insights.isGeneratingInsights ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                'Generate Insights'
                            )}
                        </Button>
                        {insights.insights && (
                            <Button variant="outline" onClick={insights.clearInsights}>
                                Clear
                            </Button>
                        )}
                    </div>

                    {insights.insightsError && (
                        <div className="p-4 border border-red-200 bg-red-50 rounded-lg text-red-700">
                            {insights.insightsError}
                        </div>
                    )}

                    {insights.insights && (
                        <div className="space-y-4">
                            <div className="p-4 border rounded-lg bg-muted/50">
                                <div className="prose prose-sm max-w-none">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {insights.insights}
                                    </ReactMarkdown>
                                </div>
                            </div>

                            {insights.tokenUsage && (
                                <div className="flex gap-4 text-sm text-muted-foreground">
                                    <span>Input tokens: {insights.tokenUsage.inputTokens}</span>
                                    <span>Output tokens: {insights.tokenUsage.outputTokens}</span>
                                    {insights.tokenUsage.totalTokens && (
                                        <span>Total tokens: {insights.tokenUsage.totalTokens}</span>
                                    )}
                                    {insights.tokenUsage.cost && (
                                        <span>Cost: ${insights.tokenUsage.cost.toFixed(6)}</span>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
} 