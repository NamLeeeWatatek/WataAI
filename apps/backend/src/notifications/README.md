# Notifications System - Real-time Implementation

This module provides a comprehensive real-time notification system with WebSocket support.

## Features

- **Real-time notifications** via WebSocket
- **Persistent storage** using TypeORM
- **Multiple notification types**: info, success, warning, error
- **Workspace-based notifications**
- **Unread count tracking**
- **Easy integration** with other modules

## Architecture

```
┌───────────────────────────────────────────────────────────────┐
│                        Client Applications                    │
└───────────────┬───────────────────────┬───────────────────────┘
                │                       │
                ▼                       ▼
┌───────────────────────┐       ┌───────────────────────┐
│     WebSocket         │       │      REST API         │
│     Connection        │       │                      │
└───────────────┬───────┘       └───────────────┬───────┘
                │                               │
                ▼                               ▼
┌───────────────────────────────────────────────────────────────┐
│                        Notifications Module                   │
│                                                               │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────┐  │
│  │  Gateway    │    │  Service    │    │    Controller   │  │
│  │ (WebSocket) │    │ (Business   │    │    (REST API)    │  │
│  └─────────────┘    │  Logic)     │    └─────────────────┘  │
│          ▲          └─────────────┘            ▲             │
│          │                                │             │
│          └────────────────┬──────────────────┘             │
│                       │                                   │
│                  ┌────▼─────────────┐                     │
│                  │  Database        │                     │
│                  │  (PostgreSQL)    │                     │
│                  └──────────────────┘                     │
└───────────────────────────────────────────────────────────────┘
```

## Setup

### 1. Import the module

```typescript
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  // ... other configurations
})
export class AppModule {}
```

### 2. Inject the service or helper

```typescript
// For basic usage
constructor(private readonly notificationsService: NotificationsService) {}

// For easier integration with predefined notification types
constructor(private readonly notificationsHelper: NotificationsHelper) {}
```

## Usage

### Basic Notification Creation

```typescript
// Using the service directly
await this.notificationsService.create({
  userId: 'user-id-here',
  workspaceId: 'workspace-id-here',
  title: 'Welcome!',
  message: 'Thank you for using our platform',
  type: 'success'
});

// Using the helper for system notifications
await this.notificationsHelper.sendSystemNotification(
  'user-id-here',
  'workspace-id-here',
  'System Update',
  'A new version is available',
  'info'
);
```

### Specialized Notifications

```typescript
// New message notification
await this.notificationsHelper.sendNewMessageNotification(
  'user-id-here',
  'workspace-id-here',
  'conv-123',
  'John Doe',
  'Hello, how are you?'
);

// Workflow notification
await this.notificationsHelper.sendWorkflowNotification(
  'user-id-here',
  'workspace-id-here',
  'Customer Onboarding',
  'completed',
  'The workflow completed successfully in 2 minutes'
);

// Bot notification
await this.notificationsHelper.sendBotNotification(
  'user-id-here',
  'workspace-id-here',
  'Support Bot',
  'created',
  'A new support bot has been created and is ready to use'
);
```

## WebSocket Integration

### Client-side Connection

```javascript
// Connect to the WebSocket server
const socket = io('http://your-backend-url/notifications', {
  query: {
    userId: 'current-user-id',
    token: 'jwt-token-here' // Include JWT token for authentication
  },
  transports: ['websocket']
});

// Event listeners
socket.on('connect', () => {
  console.log('Connected to notification server');
});

socket.on('disconnect', () => {
  console.log('Disconnected from notification server');
});

socket.on('new_notification', (notification) => {
  console.log('New notification received:', notification);
  // Show notification to user
  showToast(notification.title, notification.message, notification.type);
});

socket.on('unread_count', (data) => {
  console.log('Unread count updated:', data.count);
  // Update unread badge
  updateUnreadBadge(data.count);
});

socket.on('notification_updated', (notification) => {
  console.log('Notification updated:', notification);
  // Update notification in UI
});

socket.on('workspace_notification', (notification) => {
  console.log('Workspace notification:', notification);
  // Handle workspace-specific notifications
});

socket.on('error', (error) => {
  console.error('Notification error:', error.message);
});
```

### Subscribing to Workspaces

```javascript
// Subscribe to a specific workspace
socket.emit('subscribe_to_workspace', { workspaceId: 'workspace-id-here' });

// Unsubscribe from a workspace
socket.emit('unsubscribe_from_workspace', { workspaceId: 'workspace-id-here' });
```

### Marking Notifications as Read

```javascript
// Mark a single notification as read
socket.emit('mark_as_read', { notificationId: 'notification-id-here' });

// Mark all notifications as read
socket.emit('mark_all_as_read', { workspaceId: 'workspace-id-here' }); // optional workspaceId
```

## REST API Endpoints

### Get Notifications
```
GET /api/v1/notifications
Query params: workspaceId, isRead, page, limit
```

### Get Unread Count
```
GET /api/v1/notifications/unread-count
Query params: workspaceId (optional)
```

### Mark as Read
```
POST /api/v1/notifications/:id/read
```

### Mark All as Read
```
POST /api/v1/notifications/read-all
Query params: workspaceId (optional)
```

### Delete Notification
```
DELETE /api/v1/notifications/:id
```

### Delete All Notifications
```
DELETE /api/v1/notifications
Query params: workspaceId (optional)
```

### Create Notification
```
POST /api/v1/notifications
Body: { userId, workspaceId, title, message, type }
```

### Test Notification (Development)
```
POST /api/v1/notifications/test
Body: { title, message, type }
```

## Integration with Other Modules

### Example: Conversations Module

```typescript
import { NotificationsHelper } from '../../notifications/notifications.helper';

@Injectable()
export class ConversationsService {
  constructor(
    private readonly notificationsHelper: NotificationsHelper,
    // ... other dependencies
  ) {}

  async createMessage(userId: string, conversation: ConversationEntity, message: string) {
    // Save message to database
    const savedMessage = await this.messageRepository.save({
      conversationId: conversation.id,
      userId,
      content: message,
      // ... other fields
    });

    // Send notification to conversation participants
    for (const participant of conversation.participants) {
      if (participant.id !== userId) { // Don't notify the sender
        await this.notificationsHelper.sendNewMessageNotification(
          participant.id,
          conversation.workspaceId,
          conversation.id,
          conversation.name || 'Someone',
          message.substring(0, 50) + '...' // Preview
        );
      }
    }

    return savedMessage;
  }
}
```

### Example: Workflows Module

```typescript
@Injectable()
export class WorkflowService {
  constructor(
    private readonly notificationsHelper: NotificationsHelper,
    // ... other dependencies
  ) {}

  async executeWorkflow(workflow: WorkflowEntity, userId: string) {
    try {
      // Execute workflow logic
      const result = await this.workflowExecutor.execute(workflow);

      // Send success notification
      await this.notificationsHelper.sendWorkflowNotification(
        userId,
        workflow.workspaceId,
        workflow.name,
        'completed',
        `Workflow executed successfully. Result: ${result}`
      );

      return result;
    } catch (error) {
      // Send error notification
      await this.notificationsHelper.sendWorkflowNotification(
        userId,
        workflow.workspaceId,
        workflow.name,
        'failed',
        `Workflow failed: ${error.message}`
      );

      throw error;
    }
  }
}
```

## Best Practices

1. **Authentication**: Always include JWT token in WebSocket connection
2. **Error Handling**: Handle WebSocket disconnections gracefully
3. **Reconnection**: Implement automatic reconnection logic on client
4. **Rate Limiting**: Consider rate limiting for notification creation
5. **Batch Processing**: For bulk notifications, consider batching
6. **Cleanup**: Regularly clean up old notifications

## Security Considerations

- WebSocket connections require JWT authentication
- Users can only access their own notifications
- Workspace subscriptions are validated
- All API endpoints are protected with AuthGuard

## Performance Optimization

- **Pagination**: Use page and limit parameters for listing notifications
- **Caching**: Consider caching unread counts
- **Indexing**: Database tables are properly indexed for performance
- **Connection Management**: WebSocket connections are efficiently managed

## Troubleshooting

**WebSocket connection fails**:
- Check JWT token validity
- Verify CORS settings
- Ensure WebSocket server is running

**Notifications not received**:
- Check if user is connected to WebSocket
- Verify userId is correct
- Check browser console for errors

**High memory usage**:
- Monitor connected clients
- Implement connection limits if needed
- Consider horizontal scaling for WebSocket server
