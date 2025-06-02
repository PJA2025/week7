import OpenAI from 'openai'
import {
    InsightRequest,
    LLMResponse,
    GenerateInsightsOptions,
    getApiModelName,
    calculateCost
} from './types/models'
import { createDataInsightsPrompt, DATA_ANALYSIS_SYSTEM_PROMPT, formatResponseAsMarkdown } from './prompts'

const MAX_RECOMMENDED_INSIGHT_ROWS = 1000

export async function generateOpenAIInsights(options: GenerateInsightsOptions, apiKey: string): Promise<LLMResponse> {
    const { data } = options

    // Create standard prompt with context
    const fullPrompt = createDataInsightsPrompt(options)

    // Check for API key
    if (!apiKey) {
        throw new Error('OpenAI API key is required. Please enter your API key.')
    }

    try {
        // Initialize the OpenAI client
        const openai = new OpenAI({
            apiKey,
            dangerouslyAllowBrowser: true // For client-side usage
        })

        // Format data for the API request
        const dataText = JSON.stringify(data, null, 2)
        const userContent = `${fullPrompt}\n\nData:\n${dataText}`

        // Get the proper API model name
        const apiModel = getApiModelName(options.model || 'gpt-4.1-mini')

        // Log what we're sending (with truncated data)
        console.log('[OpenAIAPI] Sending request with prompt:', fullPrompt)
        console.log('[OpenAIAPI] Data sample:', JSON.stringify(data.slice(0, 1), null, 2))
        console.log('[OpenAIAPI] Analyzing total rows:', data.length)
        console.log('[OpenAIAPI] Using model:', apiModel)

        // Generate content using the OpenAI SDK
        const response = await openai.chat.completions.create({
            model: apiModel,
            messages: [
                { role: 'system', content: DATA_ANALYSIS_SYSTEM_PROMPT },
                {
                    role: 'user', content: userContent
                }
            ],
            max_tokens: 4000,
        })

        // Log the response for debugging
        console.log('[OpenAIAPI] Response received')

        // Get the generated text
        const content = response.choices[0]?.message?.content

        if (!content) {
            throw new Error('No content returned from OpenAI')
        }

        // Get token usage from the OpenAI response
        const usage = {
            inputTokens: response.usage?.prompt_tokens || 0,
            outputTokens: response.usage?.completion_tokens || 0,
            totalTokens: response.usage?.total_tokens || 0
        }

        // Calculate cost using the API model name
        const cost = calculateCost(apiModel, usage.inputTokens, usage.outputTokens)

        // Log token usage
        console.log('[OpenAIAPI] Token usage:', usage)
        console.log('[OpenAIAPI] Estimated cost:', `$${cost.toFixed(6)}`)

        // Format the response using shared formatter and return with token information
        return {
            content: formatResponseAsMarkdown(content),
            usage: {
                ...usage,
                cost
            }
        }

    } catch (error) {
        console.error('[OpenAIAPI] Error generating insights:', error)
        throw error
    }
}

export async function generateInsightsWithProvider(request: InsightRequest): Promise<LLMResponse> {
    try {
        // Limit data size for API efficiency
        const limitedData = request.data.slice(0, MAX_RECOMMENDED_INSIGHT_ROWS)

        const options: GenerateInsightsOptions = {
            prompt: request.prompt,
            data: limitedData,
            dataSource: request.dataSource,
            filters: request.filters,
            totalRows: request.totalRows,
            analyzedRows: request.analyzedRows,
            currency: request.currency,
            provider: request.provider,
            model: request.model
        }

        if (request.provider === 'openai') {
            if (!request.apiKey) {
                throw new Error('OpenAI API key is required')
            }
            return await generateOpenAIInsights(options, request.apiKey)
        } else {
            throw new Error(`Provider ${request.provider} is not yet implemented`)
        }
    } catch (error) {
        console.error('Error generating insights:', error)
        throw new Error(error instanceof Error ? error.message : 'Failed to generate insights. Please try again.')
    }
} 