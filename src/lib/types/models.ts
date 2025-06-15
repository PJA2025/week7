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
    { id: 'gpt-4.1-nano', name: 'GPT-4.1 Nano', provider: 'openai', apiModel: 'gpt-4.1-nano-2025-04-14' },
    { id: 'gpt-4.1-mini', name: 'GPT-4.1 Mini', provider: 'openai', apiModel: 'gpt-4.1-mini-2025-04-14' },
    { id: 'gpt-4.1', name: 'GPT-4.1', provider: 'openai', apiModel: 'gpt-4.1-2025-04-14' },
]

export const AVAILABLE_MODELS_WITH_SEARCH: LLMModel[] = [
    // No search models needed for OCR-based extraction
]

// OpenAI pricing per 1M tokens (updated 2025 pricing)
export const OPENAI_PRICING: Record<string, ModelPricing> = {
    'gpt-4.1-2025-04-14': { input: 2.00, output: 8.00 },
    'gpt-4.1-mini-2025-04-14': { input: 0.40, output: 1.60 },
    'gpt-4.1-nano-2025-04-14': { input: 0.10, output: 0.40 },
}

// Default model
export const DEFAULT_OPENAI_MODEL = 'gpt-4.1-mini-2025-04-14'

// Default search model (not used for OCR)
export const DEFAULT_SEARCH_MODEL = 'gpt-4.1-nano-2025-04-14'

// Helper functions for model operations
export function getApiModelName(modelId: string): string {
    const model = AVAILABLE_MODELS.find(m => m.id === modelId)
    return model?.apiModel || DEFAULT_OPENAI_MODEL
}

export function calculateImageTokens(width: number, height: number): number {
    // OpenAI's exact image token calculation formula
    // Calculate initial patches needed
    const patchesWidth = Math.floor((width + 32 - 1) / 32)
    const patchesHeight = Math.floor((height + 32 - 1) / 32)
    const totalPatches = patchesWidth * patchesHeight

    // If under the cap, return as-is
    if (totalPatches <= 1536) {
        return totalPatches
    }

    // Scale down while preserving aspect ratio
    const shrinkFactor = Math.sqrt(1536 * 32 * 32 / (width * height))
    const newWidth = Math.floor(width * shrinkFactor)
    const newHeight = Math.floor(height * shrinkFactor)

    // Calculate patches for scaled image
    const scaledPatchesWidth = Math.floor((newWidth + 32 - 1) / 32)
    const scaledPatchesHeight = Math.floor((newHeight + 32 - 1) / 32)

    // Ensure we don't exceed the cap
    const finalPatches = scaledPatchesWidth * scaledPatchesHeight
    return Math.min(finalPatches, 1536)
}

export function getImageTokenMultiplier(model: string): number {
    // Based on OpenAI documentation for vision models
    const multipliers: Record<string, number> = {
        'gpt-4.1-mini-2025-04-14': 1.62,
        'gpt-4.1-nano-2025-04-14': 2.46,
        'gpt-4.1-2025-04-14': 1.0,
    }
    return multipliers[model] || 1.0
}

export function calculateCost(model: string, inputTokens: number, outputTokens: number, imageTokens?: number): number {
    const pricing = OPENAI_PRICING[model]
    if (!pricing) return 0

    let totalInputTokens = inputTokens

    // Add image tokens if provided, multiplied by model-specific factor
    if (imageTokens && imageTokens > 0) {
        const multiplier = getImageTokenMultiplier(model)
        totalInputTokens += Math.round(imageTokens * multiplier)
    }

    const inputCost = (totalInputTokens / 1000000) * pricing.input
    const outputCost = (outputTokens / 1000000) * pricing.output
    return inputCost + outputCost
}

// Landing Page Analysis Types
export interface LandingPageAnalysisRequest {
    url: string
    prompt: string
    provider: LLMProvider
    model: string
    apiKey: string
}

export interface LandingPageAnalysisOptions {
    url: string
    prompt: string
    model?: string
    provider?: LLMProvider
} 