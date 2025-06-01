'use client'

import { useState, useMemo } from 'react'
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    Line,
    LineChart as RechartsLineChart, // Renamed to avoid conflict
    ResponsiveContainer,
    XAxis,
    YAxis,
} from 'recharts'
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from '@/components/ui/chart'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Button } from '@/components/ui/button'
import { LineChartIcon, BarChartBigIcon, AreaChartIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { formatCurrencyForAxis, formatConversionsForAxis } from '@/lib/utils'

type ChartVariant = 'line' | 'bar' | 'area'

interface ChartDataItem {
    date: string // Expecting 'YYYY-MM-DD'
    [key: string]: any
}

interface MetricConfig {
    key: string
    label: string
    color: string
}

interface MetricsChartProps {
    data: ChartDataItem[]
    metric1: MetricConfig
    metric2?: MetricConfig
    chartType?: ChartVariant
    chartTitle?: string
    hideControls?: boolean
    onPreviousCampaign?: () => void
    onNextCampaign?: () => void
    canNavigatePrevious?: boolean
    canNavigateNext?: boolean
}

export function MetricsChart({
    data: rawData,
    metric1,
    metric2,
    chartType: initialChartType = 'area',
    chartTitle,
    hideControls = false,
    onPreviousCampaign,
    onNextCampaign,
    canNavigatePrevious,
    canNavigateNext,
}: MetricsChartProps) {
    const [currentChartType, setCurrentChartType] =
        useState<ChartVariant>(initialChartType)

    const processedData = useMemo(() => {
        // Check if this is aggregated data (no valid dates)
        const hasAggregatedData = rawData.some(item => item.date === 'aggregated')

        if (hasAggregatedData) {
            // For aggregated data, use ad group names and create sequential indices
            return rawData.map((item, index) => ({
                ...item,
                timestamp: index, // Use index for ordering
                displayName: item.adGroup || item.campaign || `Item ${index + 1}` // Use ad group name for display
            }))
        } else {
            // For time-series data, use dates
            return rawData
                .map((item) => ({
                    ...item,
                    timestamp: parseISO(item.date).getTime(),
                    displayName: item.date
                }))
                .sort((a, b) => a.timestamp - b.timestamp)
        }
    }, [rawData])

    const chartConfig = useMemo(() => {
        const config: ChartConfig = {}
        if (metric1) {
            config[metric1.key] = {
                label: metric1.label,
                color: metric1.color,
            }
        }
        if (metric2) {
            config[metric2.key] = {
                label: metric2.label,
                color: metric2.color,
            }
        }
        return config
    }, [metric1, metric2])

    const xAxisTickFormatter = (value: any) => {
        // Check if this is aggregated data
        const hasAggregatedData = rawData.some(item => item.date === 'aggregated')

        if (hasAggregatedData) {
            // For aggregated data, find the item by index and return the display name
            const item = processedData[value]
            return item?.displayName || `Item ${value + 1}`
        } else {
            // For time-series data, format as date
            return format(new Date(value), 'MMM d')
        }
    }

    const yAxisTickFormatter = (value: number, key?: string) => {
        if (!key) return value.toLocaleString()
        // This can be expanded based on metric keys if needed
        if (key.includes('cost') || key.includes('value') || key.includes('CPC') || key.includes('CPA') || key.includes('AOV')) {
            return formatCurrencyForAxis(value, '$')
        }
        if (key.includes('conv')) {
            return formatConversionsForAxis(value)
        }
        if (key.includes('CTR') || key.includes('CvR') || key.includes('imprShare') || key.includes('lost')) {
            return `${Math.round(value)}%`
        }
        return value.toLocaleString('en-US', { maximumFractionDigits: 0 })
    }


    const renderChart = () => {
        const commonXAxis = (
            <XAxis
                dataKey="timestamp"
                tickFormatter={xAxisTickFormatter}
                stroke="hsl(var(--foreground))"
                axisLine={{ stroke: "hsl(var(--border))" }}
                tickLine={{ stroke: "hsl(var(--border))" }}
                tick={{ fill: "hsl(var(--foreground))", fontSize: 12 }}
                tickMargin={12}
                angle={processedData.length > 45 ? -45 : 0}
                textAnchor={processedData.length > 45 ? 'end' : 'middle'}
                height={processedData.length > 45 ? 70 : 40}
                dy={processedData.length > 45 ? 5 : 0}
                minTickGap={5}
                interval="preserveStartEnd"
            />
        )

        const commonYAxis1 = (
            <YAxis
                yAxisId="left"
                stroke={metric1.color}
                axisLine={{ stroke: "hsl(var(--border))" }}
                tickLine={{ stroke: "hsl(var(--border))" }}
                tickFormatter={(value) => yAxisTickFormatter(value, metric1.key)}
                tickMargin={8}
            />
        )

        const commonYAxis2 = metric2 ? (
            <YAxis
                yAxisId="right"
                orientation="right"
                stroke={metric2.color}
                axisLine={{ stroke: "hsl(var(--border))" }}
                tickLine={{ stroke: "hsl(var(--border))" }}
                tickFormatter={(value) => yAxisTickFormatter(value, metric2.key)}
                tickMargin={8}
            />
        ) : null

        const chartKey = `${currentChartType}-${processedData.length}-${metric1.key}-${metric2?.key}`;

        const chartMargins = {
            top: 10,
            right: 30,
            left: 20,
            bottom: 10
        };

        switch (currentChartType) {
            case 'line':
                return (
                    <RechartsLineChart data={processedData} key={chartKey} margin={chartMargins}>
                        <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
                        {commonXAxis}
                        {commonYAxis1}
                        {commonYAxis2}
                        <ChartTooltip
                            cursor={{ stroke: "hsl(var(--border))", strokeDasharray: "3 3" }}
                            content={<ChartTooltipContent indicator="line" style={{ backgroundColor: "hsl(var(--card))", color: "hsl(var(--card-foreground))" }} />}
                        />
                        <Line
                            yAxisId="left"
                            dataKey={metric1.key}
                            type="monotone"
                            stroke={metric1.color}
                            strokeWidth={2}
                            dot={false}
                            activeDot={false}
                            name={metric1.label}
                            animationDuration={50}
                        />
                        {metric2 && (
                            <Line
                                yAxisId="right"
                                dataKey={metric2.key}
                                type="monotone"
                                stroke={metric2.color}
                                strokeWidth={2}
                                dot={false}
                                activeDot={false}
                                name={metric2.label}
                                animationDuration={50}
                            />
                        )}
                    </RechartsLineChart>
                )
            case 'bar':
                return (
                    <BarChart data={processedData} key={chartKey} margin={chartMargins}>
                        <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
                        {commonXAxis}
                        {commonYAxis1}
                        {commonYAxis2}
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent indicator="dot" style={{ backgroundColor: "hsl(var(--card))", color: "hsl(var(--card-foreground))" }} />}
                        />
                        <Bar
                            yAxisId="left"
                            dataKey={metric1.key}
                            fill={metric1.color}
                            radius={[4, 4, 0, 0]}
                            name={metric1.label}
                            animationDuration={50}
                        />
                        {metric2 && (
                            <Bar
                                yAxisId="right"
                                dataKey={metric2.key}
                                fill={metric2.color}
                                radius={[4, 4, 0, 0]}
                                name={metric2.label}
                                animationDuration={50}
                            />
                        )}
                    </BarChart>
                )
            case 'area':
                return (
                    <AreaChart data={processedData} key={chartKey} margin={chartMargins}>
                        <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
                        {commonXAxis}
                        {commonYAxis1}
                        {commonYAxis2}
                        <ChartTooltip
                            cursor={{ stroke: "hsl(var(--border))", strokeDasharray: "3 3" }}
                            content={<ChartTooltipContent indicator="line" style={{ backgroundColor: "hsl(var(--card))", color: "hsl(var(--card-foreground))" }} />}
                        />
                        <defs>
                            <linearGradient id={`gradient-${metric1.key}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={metric1.color} stopOpacity={0.8} />
                                <stop offset="95%" stopColor={metric1.color} stopOpacity={0.1} />
                            </linearGradient>
                            {metric2 && (
                                <linearGradient id={`gradient-${metric2.key}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={metric2.color} stopOpacity={0.8} />
                                    <stop offset="95%" stopColor={metric2.color} stopOpacity={0.1} />
                                </linearGradient>
                            )}
                        </defs>
                        <Area
                            yAxisId="left"
                            dataKey={metric1.key}
                            type="monotone"
                            stroke={metric1.color}
                            fillOpacity={0.4}
                            fill={`url(#gradient-${metric1.key})`}
                            strokeWidth={2}
                            dot={false}
                            activeDot={false}
                            name={metric1.label}
                            animationDuration={50}
                        />
                        {metric2 && (
                            <Area
                                yAxisId="right"
                                dataKey={metric2.key}
                                type="monotone"
                                stroke={metric2.color}
                                fillOpacity={0.4}
                                fill={`url(#gradient-${metric2.key})`}
                                strokeWidth={2}
                                dot={false}
                                activeDot={false}
                                name={metric2.label}
                                animationDuration={50}
                            />
                        )}
                    </AreaChart>
                )
            default:
                return null
        }
    }

    const handleChartTypeChange = (value: string) => {
        if (value && (['line', 'bar', 'area'] as ChartVariant[]).includes(value as ChartVariant)) {
            setCurrentChartType(value as ChartVariant);
        }
    };


    return (
        <Card>
            {chartTitle && (
                <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                        {(onPreviousCampaign || onNextCampaign) && (
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={onPreviousCampaign}
                                    disabled={!canNavigatePrevious}
                                    aria-label="Previous campaign"
                                >
                                    <ChevronLeftIcon className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={onNextCampaign}
                                    disabled={!canNavigateNext}
                                    aria-label="Next campaign"
                                >
                                    <ChevronRightIcon className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                        <CardTitle>{chartTitle}</CardTitle>
                    </div>
                    {!hideControls && (
                        <ToggleGroup
                            type="single"
                            value={currentChartType}
                            onValueChange={handleChartTypeChange}
                            aria-label="Chart type"
                            size="sm"
                        >
                            <ToggleGroupItem value="line" aria-label="Line chart">
                                <LineChartIcon className="h-4 w-4" />
                            </ToggleGroupItem>
                            <ToggleGroupItem value="bar" aria-label="Bar chart">
                                <BarChartBigIcon className="h-4 w-4" />
                            </ToggleGroupItem>
                            <ToggleGroupItem value="area" aria-label="Area chart">
                                <AreaChartIcon className="h-4 w-4" />
                            </ToggleGroupItem>
                        </ToggleGroup>
                    )}
                </CardHeader>
            )}
            <CardContent className="px-4 pt-4 pb-1 md:pb-2">
                <ChartContainer config={chartConfig} className="w-full h-[400px]">
                    {renderChart() || <div className="flex items-center justify-center h-full text-muted-foreground">Select a chart type</div>}
                </ChartContainer>
            </CardContent>
        </Card>
    )
} 