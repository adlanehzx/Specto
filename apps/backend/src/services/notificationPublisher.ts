/**
 * Notification Publisher
 * Publishes notifications to Redis Pub/Sub for real-time updates
 */

import Redis from "ioredis";

const redis = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD,
});

const NOTIFICATION_CHANNEL = "notifications";

export interface NotificationEvent {
  id: string;
  userId: string;
  type: string;
  title?: string | null;
  message: string;
  link?: string | null;
  read: boolean;
  createdAt: string | Date;
}

/**
 * Publish a notification event to Redis
 */
export async function publishNotification(
  notification: NotificationEvent
): Promise<void> {
  try {
    const event = {
      type: "notification:created",
      timestamp: new Date().toISOString(),
      data: notification,
    };

    await redis.publish(NOTIFICATION_CHANNEL, JSON.stringify(event));

    console.log(
      `[Notification Publisher] Published notification ${notification.id} for user ${notification.userId}`
    );
  } catch (error) {
    console.error(
      "[Notification Publisher] Error publishing notification:",
      error
    );
    // Don't throw - notification was already saved to DB
  }
}

/**
 * Subscribe to notification events (for testing/monitoring)
 */
export function subscribeToNotifications(
  callback: (notification: NotificationEvent) => void
): void {
  const subscriber = new Redis({
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379"),
    password: process.env.REDIS_PASSWORD,
  });

  subscriber.subscribe(NOTIFICATION_CHANNEL);

  subscriber.on("message", (channel, message) => {
    if (channel === NOTIFICATION_CHANNEL) {
      try {
        const event = JSON.parse(message);
        callback(event.data);
      } catch (error) {
        console.error(
          "[Notification Subscriber] Error parsing notification:",
          error
        );
      }
    }
  });

  console.log(
    `[Notification Subscriber] Subscribed to ${NOTIFICATION_CHANNEL}`
  );
}

export default redis;
