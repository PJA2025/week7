'use client'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export type DateRangeOption = 'last-7-days' | 'last-14-days' | 'last-30-days' | 'last-90-days' | 'last-180-days' | 'last-365-days' | 'custom'

interface DateRangePickerProps {
    selectedRange: DateRangeOption
    onRangeChange: (range: DateRangeOption) => void
    className?: string
}

const dateRangeOptions = [
    { value: 'last-7-days', label: 'Last 7 days' },
    { value: 'last-14-days', label: 'Last 14 days' },
    { value: 'last-30-days', label: 'Last 30 days' },
    { value: 'last-90-days', label: 'Last 90 days' },
    { value: 'last-180-days', label: 'Last 180 days' },
    { value: 'last-365-days', label: 'Last 365 days' },
    // { value: 'custom', label: 'Custom range' }, // We'll add this later
] as const

export function DateRangePicker({ selectedRange, onRangeChange, className }: DateRangePickerProps) {
    return (
        <div className={className}>
            <Select value={selectedRange} onValueChange={onRangeChange}>
                <SelectTrigger className="w-full md:w-[160px]">
                    <SelectValue placeholder="Select date range" />
                </SelectTrigger>
                <SelectContent>
                    {dateRangeOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    )
}

// Helper function to get date range based on selection
export function getDateRange(range: DateRangeOption): { startDate: Date; endDate: Date } {
    const today = new Date()
    const endDate = new Date(today) // Today
    endDate.setHours(23, 59, 59, 999) // End of today

    const startDate = new Date(today)
    startDate.setHours(0, 0, 0, 0) // Start of day

    switch (range) {
        case 'last-7-days':
            startDate.setDate(today.getDate() - 6) // 7 days including today
            break
        case 'last-14-days':
            startDate.setDate(today.getDate() - 13) // 14 days including today
            break
        case 'last-30-days':
            startDate.setDate(today.getDate() - 29) // 30 days including today
            break
        case 'last-90-days':
            startDate.setDate(today.getDate() - 89) // 90 days including today
            break
        case 'last-180-days':
            startDate.setDate(today.getDate() - 179) // 180 days including today
            break
        case 'last-365-days':
            startDate.setDate(today.getDate() - 364) // 365 days including today
            break
        case 'custom':
            // For now, default to last 30 days - we'll handle custom later
            startDate.setDate(today.getDate() - 29)
            break
        default:
            startDate.setDate(today.getDate() - 29) // Default to 30 days
    }

    return { startDate, endDate }
}

// Helper function to filter data by date range
export function filterDataByDateRange<T extends { date: string }>(
    data: T[],
    dateRange: DateRangeOption
): T[] {
    const { startDate, endDate } = getDateRange(dateRange)

    return data.filter(item => {
        const itemDate = new Date(item.date)
        return itemDate >= startDate && itemDate <= endDate
    })
} 