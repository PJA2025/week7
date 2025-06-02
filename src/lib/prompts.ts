import { GenerateInsightsOptions } from './types/models'

export const DATA_ANALYSIS_SYSTEM_PROMPT = `You are an expert Google Ads data analyst. Your role is to analyze advertising performance data and provide actionable insights.

When analyzing data, focus on:
- Performance trends and patterns
- Optimization opportunities
- Budget allocation recommendations
- Keyword and campaign performance
- Cost efficiency metrics
- Conversion optimization

Provide clear, actionable recommendations based on the data. Use specific numbers and percentages when relevant. Structure your response with clear headings and bullet points for readability.`

export function createDataInsightsPrompt(options: GenerateInsightsOptions): string {
    const { prompt, dataSource, filters, totalRows, analyzedRows, currency } = options

    return `Please analyze this Google Ads ${dataSource} data and provide insights based on the following request:

**User Request:** ${prompt}

**Data Context:**
- Data Source: ${dataSource}
- Currency: ${currency}
- Total Rows in Dataset: ${totalRows}
- Rows Being Analyzed: ${analyzedRows}
- Applied Filters: ${filters.length > 0 ? filters.join(', ') : 'None'}

Please provide specific, actionable insights based on this data and the user's request.`
}

export function formatResponseAsMarkdown(content: string): string {
    // The content is already formatted by the AI, so we'll return it as-is
    // In the future, we could add additional formatting here if needed
    return content
} 