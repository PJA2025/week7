'use client'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useSettings } from '@/lib/contexts/SettingsContext'
import { formatCurrency } from '@/lib/utils'

interface AssetGroup {
    id: string;
    name: string;
    totalCost: number;
    status: string;
}

interface AssetGroupSelectProps {
    assetGroups: AssetGroup[];
    selectedId: string;
    onSelect: (id: string) => void;
    className?: string;
}

export function AssetGroupSelect({ assetGroups, selectedId, onSelect, className }: AssetGroupSelectProps) {
    const { settings } = useSettings()

    return (
        <div className={className}>
            <Select value={selectedId} onValueChange={onSelect}>
                <SelectTrigger className="w-full md:w-[300px]">
                    <SelectValue placeholder="Select Asset Group" />
                </SelectTrigger>
                <SelectContent>
                    {assetGroups.map(ag => {
                        const assetGroupIdStr = ag.id ? String(ag.id).trim() : '';
                        const assetGroupNameStr = ag.name ? String(ag.name).trim() : '(Unnamed Asset Group)';
                        const statusStr = ag.status ? ` [${ag.status}]` : '';

                        if (!assetGroupIdStr) {
                            console.error(`[AssetGroupSelect] SKIPPING ASSET GROUP WITH INVALID ID: Original ID='${ag.id}', Name='${ag.name}'`);
                            return null;
                        }
                        return (
                            <SelectItem key={assetGroupIdStr} value={assetGroupIdStr}>
                                {assetGroupNameStr}{statusStr} ({formatCurrency(ag.totalCost, settings.currency)})
                            </SelectItem>
                        );
                    })}
                </SelectContent>
            </Select>
        </div>
    );
} 