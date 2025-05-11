import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Bell, Check, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface HeaderProps {
  title: string;
  children?: React.ReactNode;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning';
  time: string;
  read: boolean;
}

export function Header({ title, children }: HeaderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      title: 'New Student Enrolled',
      message: 'John Doe has enrolled in Physics 2026 A/L Group 2',
      type: 'success',
      time: '2 minutes ago',
      read: false
    },
    {
      id: '2',
      title: 'Upcoming Class Reminder',
      message: 'You have a class scheduled in 30 minutes',
      type: 'warning',
      time: '5 minutes ago',
      read: false
    },
    {
      id: '3',
      title: 'Payment Received',
      message: 'Payment of Rs. 5,000 received from Jane Smith',
      type: 'info',
      time: '1 hour ago',
      read: false
    },
    {
      id: '4',
      title: 'Class Materials Updated',
      message: 'New materials added to Physics 2027 A/L Group 1',
      type: 'info',
      time: '2 hours ago',
      read: true
    }
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const getTypeStyles = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return 'bg-success-light text-success-dark';
      case 'warning':
        return 'bg-warning-light text-warning-dark';
      default:
        return 'bg-primary-blue-50 text-primary-blue-700';
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-200">
      <h1 className="text-xl sm:text-2xl font-bold text-neutral-900">{title}</h1>
      <div className="flex items-center gap-4">
        {children}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon" className="relative rounded-full">
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary-orange-500 text-white text-xs flex items-center justify-center rounded-full">
                  {unreadCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[320px] sm:w-[380px] p-0" align="end">
            <div className="flex items-center justify-between p-4 border-b border-neutral-100">
              <h2 className="font-semibold">Notifications</h2>
              {unreadCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-sm text-primary-blue-600 hover:text-primary-blue-700"
                  onClick={markAllAsRead}
                >
                  Mark all as read
                </Button>
              )}
            </div>
            <ScrollArea className="h-[400px]">
              {notifications.length > 0 ? (
                <div className="divide-y divide-neutral-100">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={cn(
                        "p-4 transition-colors",
                        !notification.read && "bg-neutral-50"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{notification.title}</p>
                          <p className="text-sm text-neutral-600">{notification.message}</p>
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "text-xs px-2 py-0.5 rounded-full",
                              getTypeStyles(notification.type)
                            )}>
                              {notification.type}
                            </span>
                            <span className="text-xs text-neutral-500">{notification.time}</span>
                          </div>
                        </div>
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-neutral-500 hover:text-primary-blue-600"
                            onClick={() => markAsRead(notification.id)}
                          >
                            <Check size={16} />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full py-8 text-neutral-500">
                  <Bell size={40} className="mb-2 text-neutral-400" />
                  <p>No notifications</p>
                </div>
              )}
            </ScrollArea>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}