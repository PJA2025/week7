'use client'

import { Campaign } from '@/lib/types'
import { useSettings } from '@/lib/contexts/SettingsContext'
import { formatCurrency } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface CampaignSelectProps {
  campaigns: Campaign[]
  selectedId?: string
  onSelect: (id: string) => void
}

export function CampaignSelect({ campaigns, selectedId, onSelect }: CampaignSelectProps) {
  const { settings } = useSettings()

  // console.log("[CampaignSelect] Rendering with campaigns:", campaigns);
  // Use a special value for "All Campaigns" instead of empty string
  const currentSelectedId = selectedId || 'all-campaigns';

  return (
    <Select value={currentSelectedId} onValueChange={onSelect}>
      <SelectTrigger className="w-full md:w-[300px]">
        <SelectValue placeholder="Select Campaign" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all-campaigns">All Campaigns</SelectItem>
        {campaigns.map(campaign => {
          const campaignIdStr = campaign.id ? String(campaign.id).trim() : '';
          // console.log(`[CampaignSelect] Mapping campaign: ID='${campaignIdStr}', Name='${campaign.name}'`);

          if (!campaignIdStr) { // Check if ID is empty string after trim, or was initially null/undefined
            console.error(`[CampaignSelect] SKIPPING CAMPAIGN WITH INVALID ID: Original ID='${campaign.id}', Name='${campaign.name}'`);
            return null; // Do not render this SelectItem
          }

          return (
            <SelectItem key={campaignIdStr} value={campaignIdStr}>
              {campaign.name} ({formatCurrency(campaign.totalCost, settings.currency)})
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  )
} 