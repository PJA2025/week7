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
    // Use yesterday as the end date since Google Ads data typically ends yesterday
    const today = new Date()
    const endDate = new Date(today)
    endDate.setDate(today.getDate() - 1) // Yesterday
    endDate.setHours(23, 59, 59, 999) // End of yesterday

    const startDate = new Date(endDate)
    startDate.setHours(0, 0, 0, 0) // Start of day

    switch (range) {
        case 'last-7-days':
            startDate.setDate(endDate.getDate() - 6) // 7 days including yesterday
            break
        case 'last-14-days':
            startDate.setDate(endDate.getDate() - 13) // 14 days including yesterday
            break
        case 'last-30-days':
            startDate.setDate(endDate.getDate() - 29) // 30 days including yesterday
            break
        case 'last-90-days':
            startDate.setDate(endDate.getDate() - 89) // 90 days including yesterday
            break
        case 'last-180-days':
            startDate.setDate(endDate.getDate() - 179) // 180 days including yesterday
            break
        case 'last-365-days':
            startDate.setDate(endDate.getDate() - 364) // 365 days including yesterday
            break
        case 'custom':
            // For now, default to last 30 days - we'll handle custom later
            startDate.setDate(endDate.getDate() - 29)
            break
        default:
            startDate.setDate(endDate.getDate() - 29) // Default to 30 days
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
        // Parse the date string (YYYY-MM-DD format) and create a Date object
        // Use UTC to avoid timezone issues
        const dateParts = item.date.split('-')
        if (dateParts.length !== 3) return false

        const year = parseInt(dateParts[0])
        const month = parseInt(dateParts[1]) - 1 // Month is 0-indexed
        const day = parseInt(dateParts[2])

        // Create date in local timezone to match our startDate/endDate
        const itemDate = new Date(year, month, day)

        // Compare dates (ignoring time)
        const itemDateOnly = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate())
        const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())
        const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate())

        return itemDateOnly >= startDateOnly && itemDateOnly <= endDateOnly
    })
} 