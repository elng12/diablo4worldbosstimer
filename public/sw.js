// Diablo 4 World Boss Timer - Service Worker
// Handles notification delivery even when the page is closed

const pendingNotifications = new Map();

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SCHEDULE_NOTIFICATION') {
    const { id, title, body, tag, delayMs } = event.data;
    const delay = Math.max(0, delayMs);

    // Clear any existing notification with the same id
    if (pendingNotifications.has(id)) {
      clearTimeout(pendingNotifications.get(id));
      pendingNotifications.delete(id);
    }

    if (delay <= 0) {
      self.registration.showNotification(title, { body, tag, icon: '/favicon.svg' });
    } else {
      const timer = setTimeout(() => {
        self.registration.showNotification(title, { body, tag, icon: '/favicon.svg' });
        pendingNotifications.delete(id);
      }, delay);
      pendingNotifications.set(id, timer);
    }
  }

  if (event.data?.type === 'CANCEL_NOTIFICATION') {
    const { id } = event.data;
    if (pendingNotifications.has(id)) {
      clearTimeout(pendingNotifications.get(id));
      pendingNotifications.delete(id);
    }
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) {
        return clientList[0].focus();
      }
      return clients.openWindow('/');
    })
  );
});
