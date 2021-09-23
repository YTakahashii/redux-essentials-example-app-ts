export type Notification = {
  id: string;
  date: string;
  message: string;
  user: string;
  isNew?: boolean;
  read?: boolean;
};
