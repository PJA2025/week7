import OpenAI from 'openai'
import {
    InsightRequest,
    LLMResponse,
    GenerateInsightsOptions,
    getApiModelName,
    calculateCost,
    calculateImageTokens
} from './types/models'
import {
    createDataInsightsPrompt,
    DATA_ANALYSIS_SYSTEM_PROMPT,
    formatResponseAsMarkdown,
    createLandingPageCopyPrompt,
    createLandingPageAnalysisPrompt,
    LANDING_PAGE_ANALYSIS_SYSTEM_PROMPT
} from './prompts'

const MAX_RECOMMENDED_INSIGHT_ROWS = 1000

// Helper function to extract image dimensions from data URL and calculate tokens
async function getImageTokensFromDataUrl(dataUrl: string): Promise<number> {
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => {
            const tokens = calculateImageTokens(img.width, img.height)
            console.log(`[TokenCalculation] Image dimensions: ${img.width}x${img.height}, tokens: ${tokens}`)
            resolve(tokens)
        }
        img.onerror = () => {
            console.warn('[TokenCalculation] Failed to load image, using default estimate')
            // Fallback to reasonable estimate if image fails to load
            resolve(calculateImageTokens(1920, 3000))
        }
        img.src = dataUrl
    })
}

// Data insights function
export async function generateOpenAIInsights(options: GenerateInsightsOptions, apiKey: string): Promise<LLMResponse> {
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

        // Create the data insights prompt
        const fullPrompt = createDataInsightsPrompt(options)

        // Get the proper API model name
        const apiModel = getApiModelName(options.model || 'gpt-4.1-mini')

        // Log what we're sending
        console.log('[DataInsights] Generating insights')
        console.log('[DataInsights] Using model:', apiModel)
        console.log('[DataInsights] Data rows:', options.data.length)

        // Prepare the completion options
        const completionOptions: any = {
            model: apiModel,
            messages: [
                { role: 'system', content: DATA_ANALYSIS_SYSTEM_PROMPT },
                { role: 'user', content: fullPrompt }
            ],
            max_tokens: 4000,
            stream: false // Use non-streaming for reliable token usage data
        }

        // Generate content using the OpenAI SDK
        const response = await openai.chat.completions.create(completionOptions)

        const content = response.choices[0]?.message?.content || ''

        if (!content) {
            throw new Error('No content returned from OpenAI')
        }

        // Get actual usage from OpenAI response
        const usage = {
            inputTokens: response.usage?.prompt_tokens || 0,
            outputTokens: response.usage?.completion_tokens || 0,
            totalTokens: response.usage?.total_tokens || 0
        }

        // Calculate cost using the API model name
        const cost = calculateCost(apiModel, usage.inputTokens, usage.outputTokens)

        console.log('[DataInsights] Token usage:', usage)
        console.log('[DataInsights] Estimated cost:', `$${cost.toFixed(6)}`)

        // Format the response and return with token information
        return {
            content: formatResponseAsMarkdown(content),
            usage: {
                ...usage,
                cost
            }
        }

    } catch (error) {
        console.error('[DataInsights] Error generating insights:', error)

        // Handle specific OpenAI errors
        if (error instanceof Error) {
            if (error.message.includes('rate limit')) {
                throw new Error('Rate limit exceeded. Please wait a moment and try again.')
            }
            if (error.message.includes('API key')) {
                throw new Error('Invalid API key. Please check your OpenAI API key and try again.')
            }
        }

        throw error
    }
}

// Extract landing page copy
export async function extractLandingPageCopy(
    url: string,
    apiKey: string,
    model?: string,
    onChunk?: (chunk: string) => void
): Promise<LLMResponse> {
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

        // Create the copy extraction prompt
        const fullPrompt = createLandingPageCopyPrompt(url)

        // Get the proper API model name
        const apiModel = getApiModelName(model || 'gpt-4o-mini-search-preview')

        // Log what we're sending
        console.log('[LandingPageCopy] Extracting copy from URL:', url)
        console.log('[LandingPageCopy] Using model:', apiModel)

        // Prepare the completion options
        const completionOptions: any = {
            model: apiModel,
            messages: [
                { role: 'system', content: 'You are a web content extraction specialist. Extract and output the main textual content from web pages clearly and accurately.' },
                { role: 'user', content: fullPrompt }
            ],
            max_tokens: 4000,
            stream: true, // Enable streaming
            stream_options: {
                include_usage: true // Include usage data in streaming response
            }
        }

        // Add web search options for search preview models
        if (apiModel.includes('search-preview')) {
            completionOptions.web_search_options = {}
            console.log('[LandingPageCopy] Added web search options for search preview model')
        }

        // Generate content using the OpenAI SDK with streaming
        const stream = await openai.chat.completions.create(completionOptions) as any

        console.log('[LandingPageCopy] Streaming response started')

        let fullContent = ''
        let finalUsage: any = null

        // Process the stream
        for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || ''

            if (content) {
                fullContent += content

                // Call the onChunk callback if provided
                if (onChunk) {
                    onChunk(content)
                }
            }

            // Get usage information if available (usually in the last chunk)
            if (chunk.usage) {
                finalUsage = chunk.usage
                console.log('[LandingPageCopy] Final usage from stream:', chunk.usage)
            }
        }

        if (!fullContent) {
            throw new Error('No content returned from OpenAI')
        }

        // Use actual usage data from OpenAI, with fallback estimation
        let inputTokens = finalUsage?.prompt_tokens || 0
        let outputTokens = finalUsage?.completion_tokens || 0
        let totalTokens = finalUsage?.total_tokens || 0

        // Fallback estimation if streaming didn't provide usage (backup)
        if (!inputTokens || !outputTokens) {
            console.log('[LandingPageCopy] No usage data from stream, estimating tokens as fallback')
            inputTokens = inputTokens || Math.ceil(fullPrompt.length / 3.5) // More accurate estimate: ~3.5 chars per token
            outputTokens = outputTokens || Math.ceil(fullContent.length / 3.5)
            totalTokens = totalTokens || (inputTokens + outputTokens)
            console.log('[LandingPageCopy] Estimated tokens - input:', inputTokens, 'output:', outputTokens)
        }

        const usage = {
            inputTokens,
            outputTokens,
            totalTokens
        }

        // Calculate cost using the API model name
        const cost = calculateCost(apiModel, usage.inputTokens, usage.outputTokens)

        console.log('[LandingPageCopy] Final token usage:', usage)
        console.log('[LandingPageCopy] Estimated cost:', `$${cost.toFixed(6)}`)

        // Return the raw content (not markdown formatted for copy extraction)
        return {
            content: fullContent,
            usage: {
                ...usage,
                cost
            }
        }

    } catch (error) {
        console.error('[LandingPageCopy] Error extracting landing page copy:', error)

        // Handle specific OpenAI errors
        if (error instanceof Error) {
            if (error.message.includes('Invalid URL')) {
                throw new Error('The provided URL could not be accessed. Please check the URL and try again.')
            }
            if (error.message.includes('rate limit')) {
                throw new Error('Rate limit exceeded. Please wait a moment and try again.')
            }
            if (error.message.includes('API key')) {
                throw new Error('Invalid API key. Please check your OpenAI API key and try again.')
            }
        }

        throw error
    }
}

// Analyze landing page copy with optional screenshot
export async function analyzeLandingPageCopyWithScreenshot(
    copy: string,
    prompt: string,
    apiKey: string,
    model?: string,
    screenshotUrl?: string,
    onChunk?: (chunk: string) => void
): Promise<LLMResponse> {
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

        // Create the analysis prompt
        const fullPrompt = createLandingPageAnalysisPrompt(copy, prompt)

        // Get the proper API model name
        const apiModel = getApiModelName(model || 'gpt-4.1-mini')

        // Use vision model if screenshot is provided
        const isVisionAnalysis = !!screenshotUrl
        const effectiveModel = apiModel // Use the selected model for both text and vision

        // Log what we're sending
        console.log('[LandingPageAnalysis] Analyzing copy with', isVisionAnalysis ? 'screenshot' : 'text only')
        console.log('[LandingPageAnalysis] Using model:', effectiveModel)

        // Prepare the messages
        let messages: any[]

        if (isVisionAnalysis && screenshotUrl) {
            console.log('[LandingPageAnalysis] Setting up vision analysis with image URL:', screenshotUrl.substring(0, 50) + '...')
            // Vision analysis with screenshot
            messages = [
                { role: 'system', content: LANDING_PAGE_ANALYSIS_SYSTEM_PROMPT },
                {
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text: `${fullPrompt}\n\nPlease analyze both the text content and the visual design shown in the screenshot below:`
                        },
                        {
                            type: 'image_url',
                            image_url: {
                                url: screenshotUrl,
                                detail: 'high'
                            }
                        }
                    ]
                }
            ]
        } else {
            // Text-only analysis
            messages = [
                { role: 'system', content: LANDING_PAGE_ANALYSIS_SYSTEM_PROMPT },
                { role: 'user', content: fullPrompt }
            ]
        }

        // Prepare the completion options
        const completionOptions: any = {
            model: effectiveModel,
            messages,
            max_tokens: 4000,
            stream: true, // Enable streaming
            stream_options: {
                include_usage: true // Include usage data in streaming response
            }
        }

        // Generate content using the OpenAI SDK with streaming
        const stream = await openai.chat.completions.create(completionOptions) as any

        console.log('[LandingPageAnalysis] Streaming response started')

        let fullContent = ''
        let finalUsage: any = null

        // Process the stream
        for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || ''

            if (content) {
                fullContent += content

                // Call the onChunk callback if provided
                if (onChunk) {
                    onChunk(content)
                }
            }

            // Get usage information if available (usually in the last chunk)
            if (chunk.usage) {
                finalUsage = chunk.usage
                console.log('[LandingPageAnalysis] Final usage from stream:', chunk.usage)
            }
        }

        if (!fullContent) {
            throw new Error('No content returned from OpenAI')
        }

        // Use actual usage data from OpenAI, with fallback estimation
        let inputTokens = finalUsage?.prompt_tokens || 0
        let outputTokens = finalUsage?.completion_tokens || 0
        let totalTokens = finalUsage?.total_tokens || 0

        // Fallback estimation if streaming didn't provide usage (backup)
        if (!inputTokens || !outputTokens) {
            console.log('[LandingPageAnalysis] No usage data from stream, estimating tokens as fallback')
            const textInputTokens = Math.ceil(fullPrompt.length / 3.5) // More accurate estimate
            const textOutputTokens = Math.ceil(fullContent.length / 3.5)

            inputTokens = inputTokens || textInputTokens
            outputTokens = outputTokens || textOutputTokens
            totalTokens = totalTokens || (inputTokens + outputTokens)

            console.log('[LandingPageAnalysis] Estimated tokens - input:', inputTokens, 'output:', outputTokens)
        }

        const usage = {
            inputTokens,
            outputTokens,
            totalTokens
        }

        // Calculate cost including image tokens if applicable
        let imageTokens = 0
        if (isVisionAnalysis && screenshotUrl) {
            imageTokens = await getImageTokensFromDataUrl(screenshotUrl)
            console.log('[LandingPageAnalysis] Calculated image tokens:', imageTokens)
        }
        const cost = calculateCost(effectiveModel, usage.inputTokens, usage.outputTokens, imageTokens)

        console.log('[LandingPageAnalysis] Final token usage:', usage)
        console.log('[LandingPageAnalysis] Image tokens for cost calculation:', imageTokens)
        console.log('[LandingPageAnalysis] Estimated cost:', `$${cost.toFixed(6)}`)

        // Format the response and return with token information
        return {
            content: formatResponseAsMarkdown(fullContent),
            usage: {
                ...usage,
                cost
            }
        }

    } catch (error) {
        console.error('[LandingPageAnalysis] Error analyzing landing page copy:', error)

        // Handle specific OpenAI errors
        if (error instanceof Error) {
            if (error.message.includes('rate limit')) {
                throw new Error('Rate limit exceeded. Please wait a moment and try again.')
            }
            if (error.message.includes('API key')) {
                throw new Error('Invalid API key. Please check your OpenAI API key and try again.')
            }
        }

        throw error
    }
}

// Analyze landing page copy (legacy function for backward compatibility)
export async function analyzeLandingPageCopy(
    copy: string,
    prompt: string,
    apiKey: string,
    model?: string,
    onChunk?: (chunk: string) => void
): Promise<LLMResponse> {
    return analyzeLandingPageCopyWithScreenshot(copy, prompt, apiKey, model, undefined, onChunk)
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


