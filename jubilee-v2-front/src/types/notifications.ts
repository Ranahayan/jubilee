
export enum NotificationType {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  SUCCESS = 'success',
}

export interface INotification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  is_read: boolean;
  type: NotificationType;
  expires_at: Date | null;
  is_pinned: boolean;
  background_color?: string;
  text_color?: string;
  icon_url?: string;
  primary_action_text?: string;
  primary_action_url?: string;
  secondary_action_text?: string;
  secondary_action_url?: string;
  created_at: Date;
}