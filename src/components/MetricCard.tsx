import { Card } from '@/components/ui/card'

interface MetricCardProps {
  label: string
  value: string
  isSelected?: boolean
  onClick?: () => void
  className?: string
  highlightColor?: string
}

export function MetricCard({
  label,
  value,
  isSelected,
  onClick,
  className = '',
  highlightColor,
}: MetricCardProps) {
  return (
    <Card
      className={`
        p-2 transition-all
        ${onClick ? 'cursor-pointer hover:ring-2 hover:ring-ring' : ''}
        ${isSelected ? 'ring-2 ring-ring' : ''}
        ${className}
      `}
      style={isSelected && highlightColor ? { backgroundColor: highlightColor, color: 'white' } : {}}
      onClick={onClick}
    >
      <div className={`text-xs font-medium ${isSelected && highlightColor ? 'text-white/80' : 'text-muted-foreground'}`}>{label}</div>
      <div className={`text-lg font-bold mt-1 ${isSelected && highlightColor ? 'text-white' : 'text-foreground'}`}>{value}</div>
    </Card>
  )
} 