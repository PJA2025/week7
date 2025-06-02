// src/lib/types/models.ts

export type LLMProvider = 'openai' | 'anthropic' | 'gemini'

export interface TokenUsage {
    inputTokens: number
    outputTokens: number
    totalTokens?: number
    cost?: number
}

export interface LLMResponse {
    content: string
    usage?: TokenUsage
    provider?: LLMProvider
    model?: string
}

export interface GenerateInsightsOptions {
    prompt: string
    data: any[]
    dataSource: string
    filters: string[]
    totalRows: number
    analyzedRows: number
    currency: string
    provider?: LLMProvider
    model?: string
}

export interface InsightRequest {
    prompt: string
    data: any[]
    dataSource: string
    filters: string[]
    totalRows: number
    analyzedRows: number
    currency: string
    provider: LLMProvider
    model: string
    apiKey?: string
}

export interface LLMModel {
    id: string
    name: string
    provider: LLMProvider
    apiModel: string // The actual model name to use in API calls
}

export interface ModelPricing {
    input: number  // Cost per 1M tokens
    output: number // Cost per 1M tokens
}

// Model configurations
export const AVAILABLE_MODELS: LLMModel[] = [
    { id: 'gpt-4.1-mini', name: 'GPT-4.1 Mini', provider: 'openai', apiModel: 'gpt-4.1-mini-2025-04-14' },
    { id: 'gpt-4.1', name: 'GPT-4.1', provider: 'openai', apiModel: 'gpt-4.1-2025-04-14' },
    { id: 'gpt-4.1-nano', name: 'GPT-4.1 Nano', provider: 'openai', apiModel: 'gpt-4.1-nano-2025-04-14' },
]

// OpenAI pricing per 1M tokens (updated 2025 pricing)
export const OPENAI_PRICING: Record<string, ModelPricing> = {
    'gpt-4.1-2025-04-14': { input: 2.00, output: 8.00 },
    'gpt-4.1-mini-2025-04-14': { input: 0.40, output: 1.60 },
    'gpt-4.1-nano-2025-04-14': { input: 0.10, output: 0.40 },
}

// Default model
export const DEFAULT_OPENAI_MODEL = 'gpt-4.1-mini-2025-04-14'

// Helper functions for model operations
export function getApiModelName(modelId: string): string {
    const model = AVAILABLE_MODELS.find(m => m.id === modelId)
    return model?.apiModel || DEFAULT_OPENAI_MODEL
}

export function calculateCost(model: string, inputTokens: number, outputTokens: number): number {
    const pricing = OPENAI_PRICING[model]
    if (!pricing) return 0

    const inputCost = (inputTokens / 1000000) * pricing.input
    const outputCost = (outputTokens / 1000000) * pricing.output
    return inputCost + outputCost
} 