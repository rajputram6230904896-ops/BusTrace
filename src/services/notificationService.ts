export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'arrival' | 'delay' | 'report_confirmed' | 'system';
  timestamp: number;
  read: boolean;
  routeId?: string;
  stopId?: string;
}

class NotificationService {
  private notifications: AppNotification[] = [];
  private listeners: Set<(notifs: AppNotification[]) => void> = new Set();

  constructor() {
    this.notifications = [
      {
        id: 'notif_welcome',
        title: 'Welcome to BusTrace',
        message: 'Community bus tracking is active on Rajpura, Patiala & Chandigarh transit corridors.',
        type: 'system',
        timestamp: Date.now() - 15 * 60 * 1000,
        read: false,
      },
    ];
  }

  public subscribe(cb: (notifs: AppNotification[]) => void): () => void {
    this.listeners.add(cb);
    cb([...this.notifications]);
    return () => {
      this.listeners.delete(cb);
    };
  }

  private notify() {
    this.listeners.forEach((cb) => cb([...this.notifications]));
  }

  public async requestBrowserPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }
    if (Notification.permission === 'granted') {
      return true;
    }
    if (Notification.permission !== 'denied') {
      const perm = await Notification.requestPermission();
      return perm === 'granted';
    }
    return false;
  }

  public sendNotification(title: string, message: string, type: AppNotification['type'] = 'system', routeId?: string, stopId?: string) {
    const newNotif: AppNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title,
      message,
      type,
      timestamp: Date.now(),
      read: false,
      routeId,
      stopId,
    };

    this.notifications.unshift(newNotif);
    this.notify();

    // Trigger browser native notification if permitted
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(`BusTrace: ${title}`, {
          body: message,
          icon: '/src/assets/images/bustrace_app_icon_1793000806882.jpg',
        });
      } catch (err) {
        console.warn('Native notification suppressed or not supported in this frame', err);
      }
    }
  }

  public markAsRead(id: string) {
    const n = this.notifications.find((item) => item.id === id);
    if (n) {
      n.read = true;
      this.notify();
    }
  }

  public markAllAsRead() {
    this.notifications.forEach((n) => (n.read = true));
    this.notify();
  }

  public getUnreadCount(): number {
    return this.notifications.filter((n) => !n.read).length;
  }
}

export const notificationService = new NotificationService();
