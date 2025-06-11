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

// Landing Page Analysis Prompts
export const LANDING_PAGE_ANALYSIS_SYSTEM_PROMPT = `You are an expert digital marketing and UX analyst specializing in landing page optimization. Your role is to analyze web pages and provide actionable insights for improving conversion rates, user experience, and overall effectiveness.
When analyzing landing pages, focus on:
- Content clarity and value proposition strength
- User experience and conversion optimization
- Technical SEO and performance indicators
- Trust signals and credibility elements
- Mobile responsiveness and accessibility
- Competitive positioning and differentiation
Provide specific, actionable recommendations with clear priorities. Use concrete examples and reference specific elements when possible. Structure your response with clear headings and bullet points for readability.`

export const DEFAULT_LANDING_PAGE_COPY_PROMPT = `Output the copy from the URL provided. Do not include any HTML or CSS.`

export const DEFAULT_LANDING_PAGE_ANALYSIS_PROMPT = `# Landing Page Checker
Please analyze the landing page and provide insights for each section below:

## 1. The Offer (Foundation)

### 🎯 Why Your Offer Matters
- Your offer is the **foundation** of landing page success.
- No amount of great design or copy can fix a weak offer.

### 🧪 Components of a Great Offer
- **Core Value Proposition:** What they get, why it matters, how and when it's delivered, and who it's for.
- **Unique Selling Points (USPs):** Why your solution is better than alternatives.
- **Value Boosters:** Bonuses, additional features, onboarding, or guarantees that increase perceived value.
- **Social Proof:** Testimonials, media mentions, stats, etc.
- **Risk Removal:** Guarantees, trials, cancel-anytime policies.

### 🔁 Match Offer to Awareness Stage
- **Unaware**: Educate on problem (e.g., SEO audit tools).
- **Problem-Aware**: Validate their pain and introduce solution categories.
- **Solution-Aware**: Emphasize differentiation and unique methods.
- **Product-Aware**: Handle objections, showcase specifics.
- **Most-Aware**: Deliver the offer clearly and with urgency.

---

## 2. Informational Hierarchy (Structure)

### 🧭 Hierarchy Blueprint Questions
- **So what?** → Core value proposition
- **Who cares?** → Benefits & relevance
- **Says who?** → Trust & authority
- **What if…?** → Objection handling
- **Why now?** → Urgency & scarcity
- **Now what?** → Clear call to action

### 🔀 Flow of Content
- Logical progression that reduces friction.
- Aligns with natural scanning patterns (Z-pattern above-the-fold, F-pattern down the page).
- Strategic repetition of decision points.

---

## 3. Copy & Persuasion (Messaging)

### 🎤 Copywriting Essentials
- Focus on **outcomes**, not features.
- Use language that matches audience awareness.
- Highlight emotional + logical benefits (time saved, stress reduced, confidence gained).

### 🧠 Copy Frameworks
- **AIDA**: Attention → Interest → Desire → Action
- **PAS**: Problem → Agitation → Solution
- **FAB**: Features → Advantages → Benefits
- **BAB**: Before → After → Bridge

### ✒ Best Practices
- Use short, bold headlines with outcome focus.
- Subheads should clarify or expand the promise.
- Use natural, conversational tone.
- Avoid vague, jargon-heavy language.

---

## 4. Visual Hierarchy (Presentation)

### 🖼 Design for Conversion
- **Hero Section**: Clear headline, subheadline, visual, and CTA.
- Prioritize scanning and clarity.
- Reinforce messaging visually (not just decoratively).

### 🔍 Visual Structure Techniques
- **Directional cues** (arrows, lines, eye gaze).
- **Contrast** (color, size, white space).
- **Prioritization** of content based on hierarchy.

### 🚫 Common Mistakes
- Visual clutter.
- Misaligned message-visual pairing.
- Secondary links that leak conversions.

---

## 5.Trust & Objection Handling

### 🏆 Trust Elements
- **Institutional Trust**: Certifications, security, GDPR compliance.
- **Expertise Trust**: Media features, results, credentials.

### 💬 Social Proof Types
- Testimonials (specific > vague)
- Case studies
- Stats (precise > rounded)
- Endorsements & third-party validation

### 🚧 Objection Handling Techniques
- Guarantees
- FAQ sections
- Specific testimonials
- Value framing (price vs. value)
- Process clarity (what to expect)

---

## 6. Urgency & Scarcity (Why Now?)

### 🔥 Urgency Techniques
- Limited-time offers
- Countdown timers
- Expiring bonuses
- Sequential deadlines

### 📉 Scarcity Techniques
- Limited quantity
- Exclusive access
- One-time pricing

> Avoid manipulative tactics—use urgency ethically and authentically.

---

## 7. Calls-to-Action (Now What?)

### 📌 CTA Principles
- Focus on what the user gets (“Get my free plan”) not what they must do (“Submit”).
- Use first-person phrasing for ownership.
- Place CTA where intent is high (above the fold, end of sections).

### 🧩 CTA Pairings
- Reinforce with value
- Include social proof
- Tie in urgency or objection handling

---

## 8. Final Thoughts

> A landing page is your 24/7 salesperson.

- Start with a **strong offer**.
- Guide users through a **clear, logical hierarchy**.
- Use **persuasive, awareness-matched copy**.
- Design with **intentional visual priority**.
- Support with **social proof, trust, and urgency**.

Each layer amplifies the one below.

---


`


export function createLandingPageCopyPrompt(url: string): string {
    return `Please extract and output the copy from the landing page at this URL: ${url}

${DEFAULT_LANDING_PAGE_COPY_PROMPT}`
}

export function createLandingPageAnalysisPrompt(copy: string, userPrompt: string): string {
    return `${userPrompt}

**Landing Page Copy to Analyze:**
${copy}

Please apply the above analysis framework to this landing page copy and provide specific, actionable insights.`
}

