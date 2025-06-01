'use client'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useSettings } from '@/lib/contexts/SettingsContext'
import { formatCurrency } from '@/lib/utils'

interface AdGroup {
    id: string;
    name: string;
    totalCost: number;
}

interface AdGroupSelectProps {
    adGroups: AdGroup[];
    selectedId: string;
    onSelect: (id: string) => void;
    className?: string;
}

export function AdGroupSelect({ adGroups, selectedId, onSelect, className }: AdGroupSelectProps) {
    const { settings } = useSettings()

    return (
        <div className={className}>
            <Select value={selectedId} onValueChange={onSelect}>
                <SelectTrigger className="w-full md:w-[300px]">
                    <SelectValue placeholder="Select Ad Group" />
                </SelectTrigger>
                <SelectContent>
                    {adGroups.map(ag => {
                        const adGroupIdStr = ag.id ? String(ag.id).trim() : '';
                        const adGroupNameStr = ag.name ? String(ag.name).trim() : '(Unnamed Ad Group)';

                        if (!adGroupIdStr) {
                            console.error(`[AdGroupSelect] SKIPPING AD GROUP WITH INVALID ID: Original ID='${ag.id}', Name='${ag.name}'`);
                            return null;
                        }
                        return (
                            <SelectItem key={adGroupIdStr} value={adGroupIdStr}>
                                {adGroupNameStr} ({formatCurrency(ag.totalCost, settings.currency)})
                            </SelectItem>
                        );
                    })}
                </SelectContent>
            </Select>
        </div>
    );
} 