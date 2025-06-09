# Landing Pages Analysis Feature - Implementation Plan

## Overview

Create a new "Landing Pages" feature that allows users to analyze web page content using AI. Users will input a URL, and the system will either use the OpenAI API to read the content directly or scrape the content and send it to AI for analysis.

## Problem Statement

Users need to analyze landing pages for:
- Content quality and relevance
- SEO optimization opportunities
- Conversion optimization suggestions
- Competitive analysis
- User experience improvements
- Alignment with advertising campaigns

## User Flow

1. User navigates to `/landing-pages` page
2. User enters a URL in the input field at the top
3. System attempts to fetch/scrape the page content
4. User reviews the default analysis prompt (editable)
5. User selects AI model and enters OpenAI API key
6. User clicks "Analyze Landing Page"
7. System sends URL content + prompt to AI and displays insights
8. User views formatted analysis with cost information

## Technical Architecture

### 1. Page Structure
```
/src/app/landing-pages/
├── page.tsx (main component)
└── loading.tsx (optional loading state)
```

### 2. New Library Components
```
/src/lib/
├── prompts.ts (add landing page prompts)
├── api-router.ts (add landing page analysis function)
└── types.ts (add landing page types)
```

### 3. Content Fetching Strategy

**Option A: OpenAI URL Reading (Primary)**
- Use OpenAI's ability to read URLs directly
- Simpler implementation
- May have limitations with some sites

**Option B: Web Scraping (Fallback)**
- Use a web scraping service or library
- More reliable for complex sites
- Requires additional dependencies

## Implementation Plan

### Phase 1: Basic Structure & Navigation

#### 1.1 Add Navigation Menu Item
- **File**: `src/components/Navigation.tsx`
- **Action**: Add "Landing Pages" link between "Data Insights" and "Data Test"
- **Route**: `/landing-pages`

#### 1.2 Create Page Route
- **File**: `src/app/landing-pages/page.tsx`
- **Structure**: Similar to insights page but simplified
- **Components Needed**:
  - URL input field
  - Prompt textarea (with default)
  - AI model selector
  - API key input
  - Generate button
  - Results display area

### Phase 2: Content Fetching Implementation

#### 2.1 Add Landing Page Prompts
- **File**: `src/lib/prompts.ts`
- **Add**:
  ```typescript
  export const LANDING_PAGE_ANALYSIS_SYSTEM_PROMPT = `You are an expert digital marketing and UX analyst...`
  
  export function createLandingPagePrompt(options: LandingPageAnalysisOptions): string
  
  export const DEFAULT_LANDING_PAGE_PROMPT = `Analyze this landing page and provide insights on...`
  ```

#### 2.2 Add Types
- **File**: `src/lib/types.ts`
- **Add**:
  ```typescript
  export interface LandingPageAnalysisRequest {
    url: string;
    prompt: string;
    provider: 'openai';
    model: string;
    apiKey: string;
  }
  
  export interface LandingPageAnalysisOptions {
    url: string;
    prompt: string;
    model?: string;
    provider?: string;
  }
  ```

#### 2.3 Add API Functions
- **File**: `src/lib/api-router.ts`
- **Add**:
  ```typescript
  export async function analyzeLandingPageWithOpenAI(
    options: LandingPageAnalysisOptions, 
    apiKey: string
  ): Promise<LLMResponse>
  
  export async function fetchPageContent(url: string): Promise<string>
  ```

### Phase 3: UI Components

#### 3.1 URL Input Section
- Large input field for URL
- Validation for proper URL format
- "Fetch Content" button (optional preview)

#### 3.2 Analysis Configuration
- Prompt textarea with default content
- AI model selector (reuse from insights)
- API key input (reuse from insights)

#### 3.3 Results Display
- Markdown rendering (reuse ReactMarkdown)
- Token usage and cost display
- Error handling display

### Phase 4: Content Fetching Logic

#### 4.1 Primary Method: OpenAI URL Reading
```typescript
// Try to use OpenAI's native URL reading capability
const messages = [
  { role: 'system', content: LANDING_PAGE_ANALYSIS_SYSTEM_PROMPT },
  { 
    role: 'user', 
    content: `Please analyze the landing page at this URL: ${url}\n\n${prompt}` 
  }
];
```

#### 4.2 Fallback Method: Web Scraping
- Use Puppeteer or similar for client-side scraping
- Or implement server-side API route for scraping
- Extract main content, strip navigation/footer
- Send cleaned content to OpenAI

### Phase 5: Error Handling & Edge Cases

#### 5.1 URL Validation
- Check for valid URL format
- Handle different protocols (http/https)
- Validate domain accessibility

#### 5.2 Content Fetching Errors
- Network timeouts
- Blocked by robots.txt
- JavaScript-heavy sites
- Authentication required

#### 5.3 API Errors
- Invalid API key
- Rate limiting
- Content too large for token limits

## File Structure Changes

### New Files to Create
```
src/app/landing-pages/page.tsx
src/hooks/useLandingPageAnalysis.ts (optional custom hook)
```

### Files to Modify
```
src/components/Navigation.tsx (add menu item)
src/lib/prompts.ts (add landing page prompts)
src/lib/api-router.ts (add analysis functions)
src/lib/types.ts (add interfaces)
```

## Default Prompt Template

```
Analyze this landing page and provide comprehensive insights focusing on:

**Content & Messaging:**
- Clarity and relevance of the main value proposition
- Alignment between headline and content
- Call-to-action effectiveness

**User Experience:**
- Page load speed and performance
- Mobile responsiveness indicators
- Navigation and layout structure

**Conversion Optimization:**
- Trust signals and credibility elements
- Form design and friction points
- Persuasion techniques used

**SEO & Technical:**
- Meta tags and structured data
- Content optimization opportunities
- Technical SEO elements

**Competitive Analysis:**
- Unique selling propositions
- Industry best practices compliance
- Areas for differentiation

Please provide specific, actionable recommendations for improvement.
```

## Implementation Priority

### High Priority (MVP)
1. Basic page structure and navigation
2. URL input and validation
3. OpenAI integration with URL reading
4. Basic prompt and results display

### Medium Priority
1. Web scraping fallback
2. Enhanced error handling
3. Content preview functionality
4. Advanced prompt templates

### Low Priority (Future)
1. Batch URL analysis
2. Historical analysis storage
3. Comparison features
4. Export functionality

## Technical Considerations

### Dependencies
- No new major dependencies for MVP (reuse existing OpenAI integration)
- Potential future: Puppeteer, Cheerio, or similar for scraping

### Performance
- URL fetching timeout: 30 seconds
- Content size limits for token efficiency
- Caching considerations for repeated URLs

### Security
- URL validation to prevent SSRF attacks
- API key handling (same as insights page)
- Content sanitization if implementing scraping

## Testing Strategy

### Manual Testing
1. Test with various URL types (static sites, SPAs, e-commerce)
2. Test error scenarios (invalid URLs, blocked content)
3. Test with different AI models and prompts

### Edge Cases
1. URLs requiring authentication
2. JavaScript-heavy single page applications
3. Very large pages exceeding token limits
4. Non-English content

## Success Metrics

### Functional
- Successfully analyze 90%+ of standard web pages
- Response time under 30 seconds
- Clear error messages for failures

### User Experience
- Intuitive URL input and validation
- Helpful default prompts
- Clear, actionable insights from AI

This plan provides a comprehensive roadmap for implementing the Landing Pages analysis feature while reusing existing infrastructure and maintaining consistency with the current Data Insights functionality. 