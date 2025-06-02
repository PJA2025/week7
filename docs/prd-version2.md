# Product Requirements Document: Data Insights Generator

## Problem Statement

Users of our advertising analytics application need a way to quickly generate actionable insights from their campaign data without manually analyzing spreadsheets or performing complex data analysis. Currently, users can view their data in tables and basic visualizations, but they lack the ability to:

- Quickly identify performance trends and anomalies
- Get AI-powered recommendations for optimization
- Filter and focus on specific data subsets for analysis
- Understand what actions to take based on their data

## Goal

Create a Data Insights Generator that allows users to:
1. Select a data source from their existing campaign data
2. Preview and filter the data to focus on relevant subsets
3. Generate AI-powered insights and recommendations using OpenAI's API
4. View formatted insights with cost transparency

## User Flow

1. User navigates to the Data Insights page
2. User selects a data source from dropdown (same sources as main dashboard)
3. System displays preview of top 10 rows sorted by impressions (descending)
4. User optionally applies filters to narrow down the dataset
5. User enters their OpenAI API key
6. User reviews/edits the default analysis prompt
7. User clicks "Generate Insights" button
8. System sends filtered data to OpenAI API and displays formatted results with cost information

## Inputs

### Data Source Selection
- **Type**: Dropdown selection
- **Options**: Same data sources available on main dashboard
- **Validation**: Must select a valid data source before proceeding

### API Key Input
- **Type**: Password input field
- **Label**: "OpenAI API Key"
- **Placeholder**: "sk-..."
- **Validation**: Required, must start with "sk-"
- **Security**: Stored in component state only, not persisted

### Data Filters
- **Type**: Dynamic filter builder
- **Fields**: Based on available columns in selected data source
- **Operators**: 
  - Metrics: equals, greater than, less than, between
  - Dimensions: equals, contains, in list
  - Dates: equals, before, after, between
- **Limit**: Maximum 5 filters to keep UI manageable

### Analysis Prompt
- **Type**: Textarea input
- **Default**: "Analyze this advertising campaign data focusing on performance trends, top and bottom performers, and provide actionable recommendations for optimization. Identify any anomalies or opportunities."
- **Validation**: Required, minimum 10 characters
- **Max Length**: 500 characters

## Processing

### Data Preparation
1. Fetch data from selected source using existing data fetching logic
2. Apply user-defined filters
3. Sort by impressions descending
4. Limit to maximum 1000 rows for cost control
5. Format data for API consumption

### API Integration
```typescript
interface OpenAIRequest {
  model: "gpt-4o-mini";
  messages: [
    {
      role: "system";
      content: "You are an expert advertising analyst...";
    },
    {
      role: "user";
      content: string; // User prompt + formatted data
    }
  ];
  max_tokens: 2000;
  temperature: 0.3;
}

interface OpenAIResponse {
  choices: [{
    message: {
      content: string;
    };
  }];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}
```

### Cost Calculation
```typescript
// OpenAI GPT-4o-mini pricing (as of 2024)
const COST_PER_INPUT_TOKEN = 0.00015 / 1000;  // $0.15 per 1M tokens
const COST_PER_OUTPUT_TOKEN = 0.0006 / 1000;  // $0.60 per 1M tokens

function calculateCost(usage: TokenUsage): number {
  return (usage.prompt_tokens * COST_PER_INPUT_TOKEN) + 
         (usage.completion_tokens * COST_PER_OUTPUT_TOKEN);
}
```

## Outputs

### Data Preview Table
- **Display**: First 10 rows of filtered data
- **Sorting**: Impressions descending (default)
- **Columns**: All available columns from data source
- **Formatting**: Use existing `formatMetricValue` function for consistent display

### Generated Insights
- **Format**: Markdown rendered as HTML
- **Styling**: Consistent with app's design system
- **Content**: AI-generated analysis and recommendations
- **Response Time**: Target under 30 seconds

### Cost Information
- **Display**: Token usage and estimated cost
- **Format**: "Used 1,234 tokens ($0.0012)"
- **Position**: Below the insights content

### Error Handling
- Invalid API key: "Invalid OpenAI API key. Please check and try again."
- API rate limits: "Rate limit exceeded. Please try again in a few minutes."
- Network errors: "Unable to connect to OpenAI. Please check your connection."
- Data too large: "Dataset too large. Please apply filters to reduce to under 1000 rows."

## Technical Constraints

### Performance
- **Response Time**: Maximum 30 seconds for insight generation
- **Data Limit**: Maximum 1000 rows sent to API
- **Timeout**: 30-second timeout on API calls

### Cost Control
- **Row Limit**: Hard limit of 1000 rows per request
- **Token Limit**: Maximum 2000 output tokens
- **Model**: Use gpt-4o-mini for cost efficiency

### Security
- **API Key**: Not stored persistently, only in component state
- **Data**: No data stored on external servers beyond API call duration

### Integration
- **Data Sources**: Must work with existing data fetching infrastructure
- **UI Components**: Use existing component library
- **Routing**: Add new route `/data-insights`

## Component Structure

```typescript
// Main component
interface DataInsightsProps {}

interface DataInsightsState {
  selectedSource: DataSource | null;
  apiKey: string;
  filters: Filter[];
  prompt: string;
  data: DataRow[];
  insights: string | null;
  loading: boolean;
  error: string | null;
  tokenUsage: TokenUsage | null;
}

// Supporting interfaces
interface Filter {
  id: string;
  field: string;
  operator: FilterOperator;
  value: string | number;
}

interface TokenUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}
```

## Development Task List

### Phase 1: Basic Structure
1. **Create route and navigation**
   - Add `/data-insights` route to app router
   - Add navigation link to main menu
   - Create basic page layout with title

2. **Set up data source selection**
   - Create dropdown component for data source selection
   - Integrate with existing data fetching logic
   - Add loading states and error handling

3. **Implement data preview table**
   - Display first 10 rows sorted by impressions desc
   - Use existing table components and formatting
   - Add row count indicator

### Phase 2: Filtering System
4. **Build filter interface**
   - Create dynamic filter builder component
   - Implement add/remove filter functionality
   - Add filter operators based on column types

5. **Implement filter logic**
   - Apply filters to dataset
   - Update preview table in real-time
   - Add filter validation and error states

### Phase 3: AI Integration
6. **Create API key input**
   - Add secure password input field
   - Implement basic validation (starts with "sk-")
   - Add help text and security notice

7. **Build prompt interface**
   - Create textarea with default prompt
   - Add character counter and validation
   - Implement prompt editing functionality

8. **Implement OpenAI integration**
   - Create API service for OpenAI calls
   - Format data for API consumption
   - Handle API responses and errors

### Phase 4: Results Display
9. **Create insights display component**
   - Implement markdown rendering
   - Style output consistently with app theme
   - Add loading states during generation

10. **Add cost tracking**
    - Calculate and display token usage
    - Show estimated cost in USD
    - Add cost breakdown tooltip

### Phase 5: Polish and Testing
11. **Error handling and validation**
    - Implement comprehensive error states
    - Add form validation
    - Create user-friendly error messages

12. **Performance optimization**
    - Add request timeouts
    - Implement data size validation
    - Optimize re-renders and API calls

13. **Testing and documentation**
    - Write unit tests for key functions
    - Test with various data sources
    - Document component props and usage

### Phase 6: Integration Testing
14. **End-to-end testing**
    - Test complete user flow
    - Validate with real API keys
    - Test error scenarios

15. **Performance testing**
    - Test with maximum data size (1000 rows)
    - Validate response times
    - Test API rate limiting scenarios

## File Structure

```
src/
├── pages/
│   └── data-insights/
│       └── page.tsx                 # Main page component
├── components/
│   └── data-insights/
│       ├── DataInsights.tsx         # Main component
│       ├── DataSourceSelector.tsx   # Dropdown for data sources
│       ├── DataPreviewTable.tsx     # Preview table component
│       ├── FilterBuilder.tsx        # Dynamic filter interface
│       ├── PromptEditor.tsx         # Prompt input component
│       ├── InsightsDisplay.tsx      # Markdown results display
│       └── types.ts                 # TypeScript interfaces
├── lib/
│   ├── services/
│   │   └── openai.ts               # OpenAI API integration
│   └── utils/
│       └── cost-calculator.ts      # Token cost calculations
└── constants/
    └── insights.ts                 # Default prompts, limits, etc.
```


