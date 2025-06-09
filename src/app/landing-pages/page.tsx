// src/app/landing-pages/page.tsx
'use client'

import React, { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

import { Loader2, ExternalLink, Info } from 'lucide-react'
import { LLMModel, AVAILABLE_MODELS, TokenUsage } from '@/lib/types/models'
import { DEFAULT_LANDING_PAGE_ANALYSIS_PROMPT } from '@/lib/prompts'
import { extractLandingPageCopy, analyzeLandingPageCopyWithScreenshot } from '@/lib/api-router'

export default function LandingPagesPage() {
    // Add pricing indicators to model names
    const getModelDisplayName = (model: any) => {
        const pricingMap: Record<string, string> = {
            'gpt-4.1-nano': 'GPT-4.1 Nano (💰 Cheapest)',
            'gpt-4.1-mini': 'GPT-4.1 Mini (💰💰 Mid-range)',
            'gpt-4.1': 'GPT-4.1 (💰💰💰 Most expensive)',
        }
        return pricingMap[model.id] || model.name
    }

    // Configuration state
    const [selectedModel, setSelectedModel] = useState<LLMModel>(AVAILABLE_MODELS[0])
    const [apiKey, setApiKey] = useState('')
    const [screenshotApiKey, setScreenshotApiKey] = useState('')

    // Phase 1: Copy extraction
    const [url, setUrl] = useState('https://www.monarch.edu.au/lp-diploma-of-accounting/')
    const [isExtractingCopy, setIsExtractingCopy] = useState(false)
    const [extractedCopy, setExtractedCopy] = useState<string | null>(null)
    const [copyError, setCopyError] = useState<string | null>(null)
    const [copyTokenUsage, setCopyTokenUsage] = useState<TokenUsage | null>(null)

    // Screenshot state
    const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null)
    const [isCapturingScreenshot, setIsCapturingScreenshot] = useState(false)
    const [screenshotError, setScreenshotError] = useState<string | null>(null)
    const [showScreenshotModal, setShowScreenshotModal] = useState(false)
    const [screenshotDimensions, setScreenshotDimensions] = useState<{ width: number, height: number } | null>(null)

    // Analysis state
    const [analysisPrompt, setAnalysisPrompt] = useState(DEFAULT_LANDING_PAGE_ANALYSIS_PROMPT)
    const [analysis, setAnalysis] = useState<string | null>(null)
    const [analysisError, setAnalysisError] = useState<string | null>(null)
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [isAnalyzingText, setIsAnalyzingText] = useState(false)
    const [isAnalyzingVision, setIsAnalyzingVision] = useState(false)
    const [analysisTokenUsage, setAnalysisTokenUsage] = useState<TokenUsage | null>(null)
    const [analysisType, setAnalysisType] = useState<'text' | 'vision' | null>(null)

    const isValidUrl = (urlString: string): boolean => {
        try {
            const urlObj = new URL(urlString)
            return urlObj.protocol === 'http:' || urlObj.protocol === 'https:'
        } catch {
            return false
        }
    }

    // Clear screenshot when URL changes
    React.useEffect(() => {
        if (screenshotUrl) {
            setScreenshotUrl(null)
            setScreenshotError(null)
        }
    }, [url]) // eslint-disable-line react-hooks/exhaustive-deps

    // Auto-capture screenshot when URL changes
    React.useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (url.trim() &&
                isValidUrl(url) &&
                !screenshotUrl && // Don't capture if we already have a screenshot
                !isCapturingScreenshot && // Don't capture if already capturing
                !isAnalyzing && // Don't capture during analysis
                (screenshotApiKey.trim() || process.env.NEXT_PUBLIC_SCREENSHOTONE_API_KEY)) {
                console.log('[AutoCapture] Triggering screenshot capture for URL:', url)
                handleCaptureScreenshot()
            }
        }, 1000) // Debounce for 1 second after URL change

        return () => clearTimeout(timeoutId)
    }, [url, screenshotUrl, isCapturingScreenshot, isAnalyzing]) // eslint-disable-line react-hooks/exhaustive-deps

    const handleCaptureScreenshot = async () => {
        if (!url.trim()) {
            setScreenshotError('Please enter a URL to capture')
            return
        }

        if (!isValidUrl(url)) {
            setScreenshotError('Please enter a valid URL (must include http:// or https://)')
            return
        }

        const effectiveScreenshotApiKey = screenshotApiKey.trim() || process.env.NEXT_PUBLIC_SCREENSHOTONE_API_KEY || ''

        if (!effectiveScreenshotApiKey) {
            setScreenshotError('Please enter your ScreenshotOne API key or set NEXT_PUBLIC_SCREENSHOTONE_API_KEY environment variable')
            return
        }

        setIsCapturingScreenshot(true)
        setScreenshotError(null)
        setScreenshotUrl(null)

        try {
            // Build API URL (same as your current code)
            const screenshotApiUrl = new URL('https://api.screenshotone.com/take')
            screenshotApiUrl.searchParams.set('access_key', effectiveScreenshotApiKey)
            screenshotApiUrl.searchParams.set('url', url)
            screenshotApiUrl.searchParams.set('viewport_width', '1920')
            screenshotApiUrl.searchParams.set('viewport_height', '1080')
            screenshotApiUrl.searchParams.set('device_scale_factor', '1')
            screenshotApiUrl.searchParams.set('format', 'png')
            screenshotApiUrl.searchParams.set('full_page', 'true')
            screenshotApiUrl.searchParams.set('block_ads', 'true')
            screenshotApiUrl.searchParams.set('block_cookie_banners', 'true')
            screenshotApiUrl.searchParams.set('block_chats', 'true')

            console.log('[Screenshot] Fetching from API...')
            const response = await fetch(screenshotApiUrl.toString())

            if (!response.ok) {
                throw new Error(`Screenshot API returned ${response.status}: ${response.statusText}`)
            }

            const imageBlob = await response.blob()
            console.log('[Screenshot] Blob created, size:', imageBlob.size, 'bytes')
            console.log('[Screenshot] Blob type:', imageBlob.type)

            // Convert blob to data URL - this is the key change!
            const dataUrl = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader()
                reader.onload = () => resolve(reader.result as string)
                reader.onerror = reject
                reader.readAsDataURL(imageBlob)
            })

            console.log('[Screenshot] Data URL created, length:', dataUrl.length)
            console.log('[Screenshot] Data URL starts with:', dataUrl.substring(0, 50))

            // Store the data URL immediately for display
            setScreenshotUrl(dataUrl)
            setIsCapturingScreenshot(false)

            // Get actual image dimensions for accurate token calculation (async, don't block UI)
            const img = new Image()
            img.onload = () => {
                console.log('[Screenshot] Actual image dimensions:', img.width, 'x', img.height, 'pixels')
                console.log('[Screenshot] Image size:', (imageBlob.size / 1024 / 1024).toFixed(2), 'MB')
                setScreenshotDimensions({ width: img.width, height: img.height })
            }
            img.onerror = (err) => {
                console.warn('[Screenshot] Could not load image for dimension check:', err)
            }
            img.src = dataUrl

        } catch (err) {
            console.error('Screenshot capture error:', err)
            setScreenshotError(err instanceof Error ? err.message : 'Failed to capture screenshot. Please try again.')
            setIsCapturingScreenshot(false)
        }
    }

    const handleExtractCopy = async () => {
        if (!url.trim()) {
            setCopyError('Please enter a URL to extract copy from')
            return
        }

        if (!isValidUrl(url)) {
            setCopyError('Please enter a valid URL (must include http:// or https://)')
            return
        }

        // Use environment variable if no API key is provided
        const effectiveApiKey = apiKey.trim() || process.env.NEXT_PUBLIC_OPENAI_API_KEY || ''

        if (!effectiveApiKey) {
            setCopyError('Please enter your OpenAI API key or set NEXT_PUBLIC_OPENAI_API_KEY environment variable')
            return
        }

        setIsExtractingCopy(true)
        setCopyError(null)
        setExtractedCopy('')
        setCopyTokenUsage(null)

        try {
            // Use GPT-4o Mini Search Preview for copy extraction (has web search capabilities)
            const response = await extractLandingPageCopy(
                url,
                effectiveApiKey,
                'gpt-4o-mini-search-preview',
                (chunk: string) => {
                    // Update copy with each chunk as it arrives
                    setExtractedCopy(prev => (prev || '') + chunk)
                }
            )

            // Set final copy and token usage
            setExtractedCopy(response.content)
            setCopyTokenUsage(response.usage || null)
        } catch (err) {
            console.error('Copy extraction error:', err)
            setCopyError(err instanceof Error ? err.message : 'Failed to extract landing page copy. Please try again.')
        } finally {
            setIsExtractingCopy(false)
        }
    }

    const handleAnalyzeCopyWithVision = async () => {
        if (!extractedCopy?.trim()) {
            setAnalysisError('Please extract landing page copy first')
            return
        }

        if (!analysisPrompt.trim()) {
            setAnalysisError('Please enter an analysis prompt')
            return
        }

        if (!screenshotUrl) {
            setAnalysisError('Screenshot is required for vision analysis. Please wait for screenshot to load.')
            return
        }

        // Validate screenshot URL
        if (!screenshotUrl.startsWith('data:image/')) {
            setAnalysisError('Invalid screenshot URL format. Please try capturing the screenshot again.')
            return
        }

        // console.log('[VisionAnalysis] Screenshot URL validation passed:', screenshotUrl)
        console.log('[VisionAnalysis] Screenshot URL length:', screenshotUrl.length)

        // Use environment variable if no API key is provided
        const effectiveApiKey = apiKey.trim() || process.env.NEXT_PUBLIC_OPENAI_API_KEY || ''

        if (!effectiveApiKey) {
            setAnalysisError('Please enter your OpenAI API key or set NEXT_PUBLIC_OPENAI_API_KEY environment variable')
            return
        }

        setIsAnalyzing(true)
        setIsAnalyzingVision(true)
        setAnalysisError(null)
        setAnalysis('')
        setAnalysisTokenUsage(null)
        setAnalysisType('vision')

        try {
            console.log('[LandingPages] Starting vision analysis with screenshot')
            console.log('[LandingPages] Using model:', selectedModel.id, 'with vision capabilities')
            // console.log('[LandingPages] Screenshot URL being sent:', screenshotUrl)

            const response = await analyzeLandingPageCopyWithScreenshot(
                extractedCopy,
                analysisPrompt,
                effectiveApiKey,
                selectedModel.id,
                screenshotUrl,
                (chunk: string) => {
                    // Update analysis with each chunk as it arrives
                    setAnalysis(prev => (prev || '') + chunk)
                }
            )

            // Set final analysis and token usage
            setAnalysis(response.content)
            setAnalysisTokenUsage(response.usage || null)
        } catch (err) {
            console.error('Vision analysis error:', err)
            setAnalysisError(err instanceof Error ? err.message : 'Failed to analyze landing page copy with vision. Please try again.')
        } finally {
            setIsAnalyzing(false)
            setIsAnalyzingVision(false)
        }
    }

    const handleAnalyzeCopy = async () => {
        if (!extractedCopy?.trim()) {
            setAnalysisError('Please extract landing page copy first')
            return
        }

        if (!analysisPrompt.trim()) {
            setAnalysisError('Please enter an analysis prompt')
            return
        }

        // Use environment variable if no API key is provided
        const effectiveApiKey = apiKey.trim() || process.env.NEXT_PUBLIC_OPENAI_API_KEY || ''

        if (!effectiveApiKey) {
            setAnalysisError('Please enter your OpenAI API key or set NEXT_PUBLIC_OPENAI_API_KEY environment variable')
            return
        }

        setIsAnalyzing(true)
        setIsAnalyzingText(true)
        setAnalysisError(null)
        setAnalysis('')
        setAnalysisTokenUsage(null)
        setAnalysisType('text')

        try {
            console.log('[LandingPages] Starting text-only analysis')
            console.log('[LandingPages] Using model:', selectedModel.id)

            const response = await analyzeLandingPageCopyWithScreenshot(
                extractedCopy,
                analysisPrompt,
                effectiveApiKey,
                selectedModel.id,
                undefined, // No screenshot for text-only analysis
                (chunk: string) => {
                    // Update analysis with each chunk as it arrives
                    setAnalysis(prev => (prev || '') + chunk)
                }
            )

            // Set final analysis and token usage
            setAnalysis(response.content)
            setAnalysisTokenUsage(response.usage || null)
        } catch (err) {
            console.error('Text analysis error:', err)
            setAnalysisError(err instanceof Error ? err.message : 'Failed to analyze landing page copy. Please try again.')
        } finally {
            setIsAnalyzing(false)
            setIsAnalyzingText(false)
        }
    }

    const clearCopyResults = () => {
        setExtractedCopy(null)
        setCopyError(null)
        setCopyTokenUsage(null)
        // Also clear analysis when clearing copy
        setAnalysis(null)
        setAnalysisError(null)
        setAnalysisTokenUsage(null)
    }

    const clearAnalysisResults = () => {
        setAnalysis(null)
        setAnalysisError(null)
        setAnalysisTokenUsage(null)
        setAnalysisType(null)
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
            <div className="container mx-auto px-4 pt-20 pb-8 space-y-8">
                <div className="text-center space-y-4">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full text-sm font-medium shadow-lg">
                        <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                        AI-Powered Analysis
                    </div>
                    <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                        Landing Pages
                    </h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Extract and analyze landing page content with cutting-edge AI insights
                    </p>
                </div>

                {/* Analysis Configuration */}
                <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                    <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-t-lg">
                        <CardTitle className="text-xl flex items-center gap-2">
                            <span className="w-2 h-2 bg-white rounded-full"></span>
                            Analysis Configuration
                        </CardTitle>
                        <CardDescription className="text-indigo-100">
                            Configure your AI models and API settings for optimal performance
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 p-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-4">
                                <Label htmlFor="model" className="text-base font-semibold text-gray-700">Analysis Model</Label>
                                <div className="space-y-3">
                                    <Select
                                        value={selectedModel.id}
                                        onValueChange={(value) => {
                                            const model = AVAILABLE_MODELS.find(m => m.id === value)
                                            if (model) setSelectedModel(model)
                                        }}
                                    >
                                        <SelectTrigger className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 hover:border-purple-300 transition-colors h-12">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {AVAILABLE_MODELS.map(model => (
                                                <SelectItem key={model.id} value={model.id}>
                                                    {getModelDisplayName(model)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border-l-4 border-purple-400">
                                        🎯 Model used for analyzing extracted copy
                                        {screenshotUrl && (
                                            <span className="block mt-1 text-blue-600 font-medium">
                                                📸 Will use GPT-4o Vision if screenshot is used
                                            </span>
                                        )}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <Label htmlFor="apiKey" className="text-base font-semibold text-gray-700">OpenAI API Key</Label>
                                <div className="space-y-3">
                                    <div className="relative">
                                        <Input
                                            id="apiKey"
                                            type="password"
                                            placeholder="sk-... (or set env var)"
                                            value={apiKey}
                                            onChange={(e) => setApiKey(e.target.value)}
                                            className="border-2 border-orange-200 bg-gradient-to-r from-orange-50 to-yellow-50 hover:border-orange-300 transition-colors pr-20 h-12"
                                        />
                                        {!apiKey.trim() && process.env.NEXT_PUBLIC_OPENAI_API_KEY && (
                                            <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                                                <div className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                                    <Info className="h-3 w-3" />
                                                    <span>Using env var</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border-l-4 border-orange-400">
                                        🔑 Secure API authentication for AI services
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <Label htmlFor="screenshotApiKey" className="text-base font-semibold text-gray-700">ScreenshotOne API Key</Label>
                                <div className="space-y-3">
                                    <div className="relative">
                                        <Input
                                            id="screenshotApiKey"
                                            type="password"
                                            placeholder="Access key... (optional)"
                                            value={screenshotApiKey}
                                            onChange={(e) => setScreenshotApiKey(e.target.value)}
                                            className="border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 hover:border-green-300 transition-colors pr-20 h-12"
                                        />
                                        {!screenshotApiKey.trim() && process.env.NEXT_PUBLIC_SCREENSHOTONE_API_KEY && (
                                            <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                                                <div className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                                    <Info className="h-3 w-3" />
                                                    <span>Using env var</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border-l-4 border-green-400">
                                        📸 Required for automatic screenshot capture. <a href="https://dash.screenshotone.com/sign-in" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800">Sign up</a> to get the access key and start taking screenshots.
                                    </p>
                                </div>
                            </div>
                        </div>


                    </CardContent>
                </Card>

                {/* Phase 1: Side-by-side Copy Extraction and Preview */}
                <div className="grid grid-cols-3 gap-6">
                    {/* Copy Extraction - 2/3 width */}
                    <div className="col-span-2">
                        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm h-[600px] flex flex-col">
                            <CardHeader className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-t-lg flex-shrink-0">
                                <CardTitle className="text-xl flex items-center gap-2">
                                    <span className="w-8 h-8 bg-white text-blue-600 rounded-full flex items-center justify-center font-bold">1</span>
                                    Extract Landing Page Copy
                                </CardTitle>
                                <CardDescription className="text-blue-100">
                                    🌐 Enter the URL and extract the textual content from the landing page using mini search preview
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1 flex flex-col space-y-4 p-6 overflow-hidden">
                                <div className="space-y-4 flex-shrink-0">
                                    <div className="flex gap-3">
                                        <Input
                                            placeholder="🌐 https://example.com/landing-page"
                                            value={url}
                                            onChange={(e) => setUrl(e.target.value)}
                                            className="flex-1 border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50 hover:border-blue-300 transition-colors font-bold h-16 px-4"
                                            style={{ fontSize: '24px' }}
                                        />
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => window.open(url, '_blank')}
                                            disabled={!isValidUrl(url)}
                                            title="Open URL in new tab"
                                            className="border-2 border-blue-300 bg-gradient-to-r from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 text-blue-600 h-16 w-16"
                                        >
                                            <ExternalLink className="h-5 w-5" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="flex justify-center flex-shrink-0">
                                    <Button
                                        onClick={handleExtractCopy}
                                        disabled={!url.trim() || isExtractingCopy || (!apiKey.trim() && !process.env.NEXT_PUBLIC_OPENAI_API_KEY)}
                                        className="bg-gradient-to-r from-blue-600 to-cyan-700 hover:from-blue-700 hover:to-cyan-800 text-white font-semibold py-3 px-8 text-base shadow-lg transform hover:scale-105 transition-all duration-200 rounded-lg"
                                    >
                                        {isExtractingCopy ? (
                                            <>
                                                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                                🔄 Extracting Copy...
                                            </>
                                        ) : (
                                            '🚀 Get Landing Page Copy'
                                        )}
                                    </Button>
                                </div>

                                {/* Copy Error Display */}
                                {copyError && (
                                    <div className="p-4 border-2 border-red-300 bg-gradient-to-r from-red-50 to-pink-50 rounded-xl text-red-700 shadow-lg flex-shrink-0">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-xl">❌</span>
                                            <span className="font-semibold">Error</span>
                                        </div>
                                        {copyError}
                                    </div>
                                )}

                                {/* Extracted Copy Results */}
                                {(extractedCopy || isExtractingCopy) && (
                                    <div className="flex-1 flex flex-col space-y-4 min-h-0">
                                        <div className="flex-1 flex flex-col p-6 border-2 border-blue-200 rounded-xl bg-gradient-to-r from-blue-50 to-cyan-50 shadow-lg min-h-0">
                                            <div className="text-lg font-bold mb-3 text-blue-700 flex items-center gap-2 flex-shrink-0">
                                                <span className="text-xl">📄</span>
                                                Extracted Copy:
                                            </div>
                                            {isExtractingCopy && !extractedCopy && (
                                                <div className="flex items-center gap-2 text-muted-foreground flex-shrink-0">
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    <span>Waiting for response...</span>
                                                </div>
                                            )}

                                            {extractedCopy && (
                                                <div className="flex-1 bg-white p-4 rounded-lg border overflow-y-auto min-h-0">
                                                    <div className="whitespace-pre-wrap text-sm">
                                                        {extractedCopy}
                                                        {isExtractingCopy && (
                                                            <span className="inline-block w-2 h-4 bg-blue-500 animate-pulse ml-1" />
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {copyTokenUsage && (
                                            <div className="flex gap-4 text-sm text-muted-foreground flex-shrink-0">
                                                <span>Input tokens: {copyTokenUsage.inputTokens}</span>
                                                <span>Output tokens: {copyTokenUsage.outputTokens}</span>
                                                <span>Total tokens: {copyTokenUsage.totalTokens}</span>
                                                <span>Cost: ${copyTokenUsage.cost?.toFixed(6) || '0.000000'}</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Landing Page Preview - 1/3 width */}
                    <div className="col-span-1">
                        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm h-[600px] flex flex-col">
                            <CardHeader className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-t-lg flex-shrink-0">
                                <CardTitle className="text-xl flex items-center gap-2">
                                    <span className="w-8 h-8 bg-white text-purple-600 rounded-full flex items-center justify-center font-bold">📸</span>
                                    Landing Page Preview
                                </CardTitle>
                                <CardDescription className="text-purple-100">
                                    📷 Auto-captured visual preview
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1 flex flex-col space-y-4 p-6 overflow-hidden">
                                {/* Screenshot Loading */}
                                {isCapturingScreenshot && !screenshotUrl && (
                                    <div className="flex-1 flex items-center justify-center">
                                        <div className="text-center space-y-3">
                                            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
                                            <span className="text-blue-700 font-medium text-sm">📸 Capturing screenshot...</span>
                                        </div>
                                    </div>
                                )}

                                {/* Screenshot Error Display */}
                                {screenshotError && !isCapturingScreenshot && (
                                    <div className="flex-1 flex items-center justify-center">
                                        <div className="p-4 border-2 border-red-300 bg-gradient-to-r from-red-50 to-pink-50 rounded-xl text-red-700 shadow-lg text-center space-y-3">
                                            <div className="flex items-center justify-center gap-2 mb-2">
                                                <span className="text-xl">❌</span>
                                                <span className="font-semibold">Screenshot Error</span>
                                            </div>
                                            <p className="text-sm">{screenshotError}</p>
                                            <Button
                                                onClick={() => {
                                                    setScreenshotError(null)
                                                    handleCaptureScreenshot()
                                                }}
                                                variant="outline"
                                                size="sm"
                                                className="text-red-600 border-red-300 hover:bg-red-50"
                                            >
                                                🔄 Retry Screenshot
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {/* Screenshot Display */}
                                {screenshotUrl && (
                                    <div className="flex-1 flex flex-col space-y-3 min-h-0">
                                        <div className="text-sm font-semibold text-green-700 flex items-center gap-2 flex-shrink-0">
                                            <span>✅</span>
                                            Screenshot captured
                                        </div>
                                        <div className="flex-1 border-2 border-purple-200 rounded-lg overflow-hidden shadow-md bg-white min-h-0">
                                            <img
                                                src={screenshotUrl}
                                                alt="Landing page screenshot"
                                                className="w-full h-full object-contain"
                                            />
                                        </div>
                                        <div className="text-sm flex-shrink-0">
                                            <button
                                                onClick={() => setShowScreenshotModal(true)}
                                                className="inline-flex items-center gap-1 text-purple-600 hover:underline cursor-pointer"
                                            >
                                                <ExternalLink className="h-3 w-3" />
                                                View full-size
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Default state when no screenshot */}
                                {!screenshotUrl && !isCapturingScreenshot && !screenshotError && (
                                    <div className="flex-1 flex items-center justify-center">
                                        <div className="text-center text-gray-500 space-y-2">
                                            <div className="text-4xl">📷</div>
                                            <p className="text-sm">Screenshot will appear here automatically when you enter a URL</p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Phase 2: Analysis */}
                {extractedCopy && (
                    <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                        <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-t-lg">
                            <CardTitle className="text-xl flex items-center gap-2">
                                <span className="w-8 h-8 bg-white text-blue-600 rounded-full flex items-center justify-center font-bold">2</span>
                                Analyze Landing Page Copy
                            </CardTitle>
                            <CardDescription className="text-blue-100">
                                🧠 Customize your analysis prompt and generate AI-powered insights
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6 p-6">
                            <div className="space-y-3">
                                <Label htmlFor="analysisPrompt" className="text-base font-semibold text-gray-700">🎯 Analysis Prompt</Label>
                                <Textarea
                                    id="analysisPrompt"
                                    placeholder="✨ Enter your analysis prompt to customize the AI insights..."
                                    value={analysisPrompt}
                                    onChange={(e) => setAnalysisPrompt(e.target.value)}
                                    rows={6}
                                    className="min-h-[150px] border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 hover:border-blue-300 transition-colors text-base"
                                />
                                <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded-lg border-l-4 border-blue-400">
                                    💡 Customize this prompt to focus on specific aspects like conversion optimization, UX analysis, or competitive insights
                                </p>
                            </div>

                            <div className="flex flex-col items-center space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
                                    {/* Text-Only Analysis */}
                                    <div className="space-y-2">
                                        <Button
                                            onClick={handleAnalyzeCopy}
                                            disabled={!extractedCopy.trim() || !analysisPrompt.trim() || isAnalyzingText || isAnalyzingVision || (!apiKey.trim() && !process.env.NEXT_PUBLIC_OPENAI_API_KEY)}
                                            className="w-full bg-gradient-to-r from-blue-600 to-cyan-700 hover:from-blue-700 hover:to-cyan-800 text-white font-semibold py-3 px-6 text-base shadow-lg transform hover:scale-105 transition-all duration-200 rounded-lg"
                                        >
                                            {isAnalyzingText ? (
                                                <>
                                                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                                    📝 Analyzing Text...
                                                </>
                                            ) : (
                                                '📝 Analyze Text Only'
                                            )}
                                        </Button>
                                        <p className="text-xs text-gray-500 text-center">
                                            💰 Uses selected model pricing
                                        </p>
                                    </div>

                                    {/* Vision Analysis */}
                                    <div className="space-y-2">
                                        <Button
                                            onClick={handleAnalyzeCopyWithVision}
                                            disabled={!extractedCopy.trim() || !analysisPrompt.trim() || !screenshotUrl || isAnalyzingText || isAnalyzingVision || (!apiKey.trim() && !process.env.NEXT_PUBLIC_OPENAI_API_KEY)}
                                            className="w-full bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white font-semibold py-3 px-6 text-base shadow-lg transform hover:scale-105 transition-all duration-200 rounded-lg"
                                        >
                                            {isAnalyzingVision ? (
                                                <>
                                                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                                    📸 Analyzing with Vision...
                                                </>
                                            ) : (
                                                <>
                                                    📸 Analyze Text + Screenshot
                                                    {!screenshotUrl && <span className="ml-2 text-xs">(waiting for screenshot)</span>}
                                                </>
                                            )}
                                        </Button>
                                        <p className="text-xs text-gray-500 text-center">
                                            💰💰 Higher cost due to image processing (~1500 image tokens)
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Analysis Error Display */}
                            {analysisError && (
                                <div className="p-4 border-2 border-red-300 bg-gradient-to-r from-red-50 to-pink-50 rounded-xl text-red-700 shadow-lg">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-xl">❌</span>
                                        <span className="font-semibold">Error</span>
                                    </div>
                                    {analysisError}
                                </div>
                            )}

                            {/* Analysis Results */}
                            {(analysis || isAnalyzingText || isAnalyzingVision) && (
                                <div className="space-y-4">
                                    <div className="p-6 border-2 border-blue-200 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 shadow-lg">
                                        <div className="text-lg font-bold mb-3 text-blue-700 flex items-center gap-2">
                                            <span className="text-xl">🧠</span>
                                            Analysis Results:
                                            {analysisType === 'vision' && (
                                                <span className="text-sm bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">
                                                    📸 Vision Analysis
                                                </span>
                                            )}
                                            {analysisType === 'text' && (
                                                <span className="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                                                    📝 Text Analysis
                                                </span>
                                            )}
                                        </div>
                                        {(isAnalyzingText || isAnalyzingVision) && !analysis && (
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                <span>Waiting for response...</span>
                                            </div>
                                        )}

                                        {analysis && (
                                            <div className="prose prose-sm max-w-none">
                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                    {analysis}
                                                </ReactMarkdown>
                                                {(isAnalyzingText || isAnalyzingVision) && (
                                                    <span className="inline-block w-2 h-4 bg-blue-500 animate-pulse ml-1" />
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {analysisTokenUsage && (
                                        <div className="flex gap-4 text-sm text-muted-foreground">
                                            <span>Input tokens: {analysisTokenUsage.inputTokens}</span>
                                            <span>Output tokens: {analysisTokenUsage.outputTokens}</span>
                                            <span>Total tokens: {analysisTokenUsage.totalTokens}</span>
                                            <span>Cost: ${analysisTokenUsage.cost?.toFixed(6) || '0.000000'}</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Screenshot Modal */}
                {showScreenshotModal && screenshotUrl && screenshotDimensions && (
                    <div
                        className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
                        onClick={() => setShowScreenshotModal(false)}
                    >
                        <div
                            className="relative bg-white rounded-lg shadow-2xl max-w-4xl max-h-[90vh] overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                width: Math.min(screenshotDimensions.width / 2, window.innerWidth - 32),
                                height: Math.min(screenshotDimensions.height / 2, window.innerHeight - 32)
                            }}
                        >
                            <button
                                onClick={() => setShowScreenshotModal(false)}
                                className="absolute top-2 right-2 z-10 bg-black bg-opacity-50 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-opacity-75 transition-colors"
                            >
                                ✕
                            </button>
                            <img
                                src={screenshotUrl}
                                alt="Landing page screenshot - full size"
                                className="w-full h-full object-contain"
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

