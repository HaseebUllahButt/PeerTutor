import Notification, { NotificationType } from '@/models/Notification';
import { getSocketServer } from '@/lib/socket';

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
}

/**
 * Creates a notification in DB and pushes it to the user's socket room instantly.
 */
export async function createNotification(params: CreateNotificationParams) {
  const notif = await Notification.create({
    user: params.userId,
    type: params.type,
    title: params.title,
    body: params.body,
    link: params.link,
    read: false,
  });

  const io = getSocketServer();
  if (io) {
    io.to(`user:${params.userId}`).emit('notification', {
      _id: notif._id.toString(),
      type: notif.type,
      title: notif.title,
      body: notif.body,
      link: notif.link,
      read: notif.read,
      createdAt: notif.createdAt,
    });
  }

  return notif;
}
