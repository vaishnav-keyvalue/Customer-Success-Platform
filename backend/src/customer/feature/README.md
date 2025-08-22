# Feature Service

The Feature Service provides methods to compute user features based on events within a specified date range.

## Features Computed

The service computes the following features for each user:

- **activity_7d**: Number of events in the last 7 days
- **activity_30d**: Number of events in the last 30 days
- **time_since_last_use_days**: Days since the user's last event
- **failed_renewals_30d**: Number of events with `plan_renewal_failed` or `pre_renewal_card_decline` in the last 30 days
- **tickets_7d**: Number of `ticket_opened` events in the last 7 days
- **tickets_30d**: Number of `ticket_opened` events in the last 30 days
- **plan_value**: Monetary value based on user's subscription plan (Basic: $9, Pro: $29, Enterprise: $99)
- **region**: User's geographical region
- **usage_score**: Normalized activity score (0.0 to 1.0) based on 30-day activity

## Label Generation

The service automatically generates a **label** (value between 0 and 1) for each user based on their features:

### Positive Features (Higher values = Better score)
- **activity_30d**: Contributes up to 0.2 to the score
- **activity_7d**: Contributes up to 0.15 to the score  
- **usage_score**: Contributes up to 0.15 to the score

### Negative Features (Higher values = Worse score)
- **time_since_last_use_days**: Penalizes up to 0.2 from the score
- **failed_renewals_30d**: Penalizes up to 0.15 from the score
- **tickets_7d**: Penalizes up to 0.1 from the score
- **tickets_30d**: Penalizes up to 0.1 from the score

### Scoring Logic
- Base score starts at 0.5
- Positive features increase the score
- Negative features decrease the score
- Final score is clamped between 0 and 1
- Higher scores indicate better user health/engagement

## API Endpoints

### Public Endpoints (No Authentication Required)

#### Compute Features for All Users (Public)
```
GET /customers/features/public?startDate=2024-01-01&endDate=2024-01-31&tenantId=tenant123
```

**Query Parameters:**
- `startDate`: Start date in ISO format (YYYY-MM-DD)
- `endDate`: End date in ISO format (YYYY-MM-DD)
- `tenantId`: The tenant ID to compute features for

#### Compute Features for Specific User (Public)
```
GET /customers/features/public/user123?startDate=2024-01-01&endDate=2024-01-31&tenantId=tenant123
```

**Path Parameters:**
- `userId`: The user ID to compute features for

**Query Parameters:**
- `startDate`: Start date in ISO format (YYYY-MM-DD)
- `endDate`: End date in ISO format (YYYY-MM-DD)
- `tenantId`: The tenant ID to compute features for

### Protected Endpoints (Authentication Required)

#### Compute Features for All Users (Protected)
```
GET /customers/features/compute?startDate=2024-01-01&endDate=2024-01-31
```

**Query Parameters:**
- `startDate`: Start date in ISO format (YYYY-MM-DD)
- `endDate`: End date in ISO format (YYYY-MM-DD)

**Note:** This endpoint uses tenant authentication from the JWT token.

#### Compute Features for Specific User (Protected)
```
GET /customers/user123/features?startDate=2024-01-01&endDate=2024-01-31
```

**Path Parameters:**
- `userId`: The user ID to compute features for

**Query Parameters:**
- `startDate`: Start date in ISO format (YYYY-MM-DD)
- `endDate`: End date in ISO format (YYYY-MM-DD)

**Note:** This endpoint uses tenant authentication from the JWT token.

## Response Format

All endpoints return a consistent response format:

```json
{
  "success": true,
  "data": [
    {
      "userId": "user123",
      "features": {
        "userId": "user123",
        "activity_7d": 5,
        "activity_30d": 25,
        "time_since_last_use_days": 2,
        "failed_renewals_30d": 1,
        "tickets_7d": 2,
        "tickets_30d": 5,
        "plan_value": 29,
        "region": "US",
        "usage_score": 0.25
      },
      "label": 0.75
    }
  ],
  "count": 1,
  "dateRange": {
    "startDate": "2024-01-01T00:00:00.000Z",
    "endDate": "2024-01-31T00:00:00.000Z"
  },
  "tenantId": "tenant123"
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

## Usage Examples

### Using the Service Directly

```typescript
import { FeatureService } from './feature/feature.service';

@Injectable()
export class SomeService {
  constructor(private readonly featureService: FeatureService) {}

  async analyzeUserBehavior(tenantId: string) {
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-01-31');
    
    const features = await this.featureService.computeUserFeatures(
      startDate,
      endDate,
      tenantId
    );
    
    // Process features for analytics, ML models, etc.
    return features;
  }
}
```

### Computing Features for a Single User

```typescript
const userFeatures = await this.featureService.computeUserFeaturesForUser(
  'user123',
  startDate,
  endDate,
  tenantId
);
```

## Business Logic

### Activity Calculation
- Events are filtered by timestamp within the specified date range
- 7-day and 30-day activity windows are calculated from the current date
- Activity counts include all event types

### Failed Renewals
- Events with `name: 'plan_renewal_failed'` or `name: 'pre_renewal_card_decline'` are counted
- Only events within the 30-day window are considered

### Ticket Count
- Events with `name: 'ticket_opened'` are counted
- `tickets_7d`: Events within the 7-day window
- `tickets_30d`: Events within the 30-day window

### Plan Value Mapping
- Basic: $9/month
- Pro: $29/month  
- Enterprise: $99/month

### Usage Score
- Normalized score from 0.0 to 1.0
- Based on 30-day activity relative to a maximum expected activity of 100 events
- Formula: `min(activity_30d / 100, 1.0)`

## Performance Considerations

- The service fetches all events within the date range in a single query
- Events are grouped by userId in memory for efficient processing
- Consider implementing pagination for large datasets
- For production use, consider caching computed features and implementing incremental updates

## Error Handling

The service includes comprehensive error handling:
- Invalid date formats return appropriate error messages
- Database errors are caught and returned with descriptive messages
- All endpoints return consistent response formats with success/error indicators
