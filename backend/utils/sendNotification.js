const Notification = require('../models/Notification');

const sendNotification = async (io, userId, type, title, message, data = {}) => {
  try {
    const notification = await Notification.create({
      userId,
      type,
      title,
      message,
      data
    });

    // Emit real-time notification via Socket.io
    if (io) {
      io.to(`user-${userId}`).emit('notification', {
        id: notification._id,
        type,
        title,
        message,
        data,
        createdAt: notification.createdAt
      });
    }

    return notification;
  } catch (error) {
    console.error('Error sending notification:', error);
    return null;
  }
};

module.exports = sendNotification;

