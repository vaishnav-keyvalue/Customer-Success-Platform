# Event Structure Documentation

## Overview
The event system has been updated to handle structured events with the following format:

```json
{
  "id": "nanoid-generated",
  "ts": "2024-01-15T10:30:00.000Z",
  "userId": "ABC123",
  "name": "ticket_replied",
  "props": {
    "ticketId": "t_ABC123",
    "message": "Loving the new export feature!",
    "sentiment": "positive",
    "urgency": "low"
  }
}
```

## Event Fields

### Required Fields
- **id**: Unique identifier (nanoid-generated string)
- **ts**: Timestamp when the event occurred
- **userId**: Identifier for the user who triggered the event
- **name**: Event name/type (e.g., "ticket_replied", "user_login", etc.)
- **props**: JSON object containing event-specific properties

### Props Structure
The `props` field supports the following predefined properties:
- **ticketId**: Associated ticket identifier
- **message**: Text message or description
- **sentiment**: One of "positive", "negative", "neutral"
- **urgency**: One of "high", "low"

Additional custom properties can be added to the `props` object as needed.

## Customer Management

### Automatic Customer Creation
When an event is created with a new `userId`, the system automatically:
1. Checks if a customer with that `userId` exists for the tenant
2. If not found, creates a new customer record with minimal information
3. Links the event to the customer via `userId`

### Customer Entity Structure
```typescript
interface Customer {
  id: string;           // UUID (auto-generated)
  userId: string;       // Required - unique identifier
  name?: string;        // Optional
  email?: string;       // Optional
  phone?: string;       // Optional
  tenantId: string;     // Required - tenant reference
  createdAt: Date;      // Auto-generated timestamp
  updatedAt: Date;      // Auto-updated timestamp
}
```

**Note**: All customer fields except `userId` and `tenantId` are optional and will be `null` by default.

## API Endpoints

### Create Event
```http
POST /events
Content-Type: application/json

{
  "id": "evt_123456",
  "ts": "2024-01-15T10:30:00.000Z",
  "userId": "user_123",
  "name": "ticket_replied",
  "props": {
    "ticketId": "t_ABC123",
    "message": "Great support!",
    "sentiment": "positive",
    "urgency": "low"
  }
}
```

**Response**: The event will be created and a customer record will be automatically created/updated if needed.

### Query Events

#### Get All Events for Tenant
```http
GET /events
```

#### Get Event by ID
```http
GET /events/{id}
```

#### Get Events by User ID
```http
GET /events/user/{userId}
```

#### Get Events by Name
```http
GET /events/name/{eventName}
```

#### Get Events by Sentiment
```http
GET /events/sentiment/{sentiment}
```

#### Get Events by Urgency
```http
GET /events/urgency/{urgency}
```

#### Get Events by Ticket ID
```http
GET /events/ticket/{ticketId}
```

## Database Schema

### Events Table
```sql
CREATE TABLE events (
  id VARCHAR(255) PRIMARY KEY,
  ts TIMESTAMP NOT NULL,
  userId VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  props JSONB NOT NULL,
  tenantId UUID NOT NULL,
  FOREIGN KEY (tenantId) REFERENCES tenants(id)
);

-- Indexes for performance
CREATE INDEX IDX_events_ts ON events (ts);
CREATE INDEX IDX_events_userId ON events (userId);
CREATE INDEX IDX_events_name ON events (name);
CREATE INDEX IDX_events_tenantId ON events (tenantId);
```

### Customers Table
```sql
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  userId VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(255),
  tenantId UUID NOT NULL,
  createdAt TIMESTAMP NOT NULL DEFAULT now(),
  updatedAt TIMESTAMP NOT NULL DEFAULT now(),
  FOREIGN KEY (tenantId) REFERENCES tenants(id)
);

-- Indexes for performance
CREATE UNIQUE INDEX IDX_customers_userId_tenantId ON customers (userId, tenantId);
CREATE INDEX IDX_customers_userId ON customers (userId);
```

## Migration

To update your existing database, run the migrations in order:
```bash
npm run migration:run
```

**Migration Order**:
1. `1755794626391-UpdateEventsTable` - Updates events table structure
2. `1755794626392-UpdateCustomersTable` - Updates customers table structure

## Example Usage

### Creating a Ticket Reply Event
```typescript
const eventData = {
  id: nanoid(), // Generate unique ID
  ts: new Date().toISOString(),
  userId: "user_123",
  name: "ticket_replied",
  props: {
    ticketId: "t_ABC123",
    message: "The issue has been resolved",
    sentiment: "positive",
    urgency: "low"
  }
};

const event = await eventService.createEvent(eventData, tenant);
// This will automatically create a customer record for "user_123" if it doesn't exist
```

### Querying Events by Sentiment
```typescript
const positiveEvents = await eventService.getEventsBySentiment('positive', tenantId);
```

### Querying Events by Ticket
```typescript
const ticketEvents = await eventService.getEventsByTicketId('t_ABC123', tenantId);
```

### Customer Lifecycle
1. **First Event**: Customer record is created with only `userId` and `tenantId`
2. **Subsequent Events**: Customer record is found and reused
3. **Customer Updates**: You can later update customer details (name, email, phone) as they become available
4. **Event Tracking**: All events are linked to customers via `userId` for analytics and reporting
