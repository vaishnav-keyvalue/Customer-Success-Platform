# Event System Documentation

This document explains how to use the event system implemented in the EventService.

## Overview

The event system uses NestJS's EventEmitter2 to emit events when certain actions occur. Currently, it emits an `event.created` event whenever a new event is created and saved to the database.

## How It Works

### 1. Event Emission

When `createEvent()` is called in the `EventService`, it:
1. Creates/finds the customer
2. Saves the event to the database
3. Emits an `event.created` event with the following payload:

```typescript
{
  event: Event,        // The saved event entity
  customer: Customer,  // The associated customer
  timestamp: Date      // When the event was emitted
}
```

### 2. Event Listeners

Two event listeners are currently implemented:

#### EventListenerService
- Basic logging of all created events
- Logs event details, customer info, and properties

#### NotificationEventListenerService
- Handles business logic for specific event types
- Processes high urgency events
- Handles negative sentiment events
- Determines when notifications should be sent

## Usage Examples

### Creating an Event

```typescript
// This will automatically emit the 'event.created' event
const event = await eventService.createEvent({
  id: 'event-123',
  ts: new Date(),
  userId: 'user-456',
  name: 'ticket_created',
  props: {
    ticketId: 'ticket-789',
    urgency: 'high',
    sentiment: 'negative'
  }
});
```

### Adding Custom Event Listeners

To create your own event listener:

```typescript
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class CustomEventListenerService {
  @OnEvent('event.created')
  handleEventCreated(payload: EventCreatedPayload) {
    // Your custom logic here
    console.log('Custom handler for event:', payload.event.id);
  }
}
```

Don't forget to add it to the `EventModule` providers.

### Listening to Different Events

You can listen to any event name:

```typescript
@OnEvent('event.updated')
handleEventUpdated(payload: any) {
  // Handle event updates
}

@OnEvent('event.deleted')
handleEventDeleted(payload: any) {
  // Handle event deletions
}
```

## Event Payload Structure

The `event.created` event payload includes:

- **event**: The complete Event entity with all properties
- **customer**: The associated Customer entity
- **timestamp**: When the event was emitted

## Benefits

1. **Decoupling**: Event listeners are completely decoupled from the event creation logic
2. **Extensibility**: Easy to add new listeners without modifying existing code
3. **Asynchronous**: Event processing happens asynchronously
4. **Scalable**: Multiple listeners can process the same event
5. **Testable**: Easy to test event emission and listening separately

## Common Use Cases

- **Notifications**: Send emails, SMS, or push notifications
- **Analytics**: Track event metrics and generate reports
- **Integration**: Sync with external systems or APIs
- **Audit Logging**: Record all events for compliance
- **ML Processing**: Trigger machine learning models
- **Workflow Automation**: Start business processes

## Configuration

The EventEmitter2 is configured globally in `AppModule` with default settings. You can customize the configuration by modifying the `EventEmitterModule.forRoot()` call in `app.module.ts`.
