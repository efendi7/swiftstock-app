export interface Activity {
  id: string;
  type: string;
  message: string;
  userName: string;
  time?: string;
  createdAt?: any;
}

export interface ActivityPart {
  text: string;
  styleType?: 'product' | 'qty' | 'price' | 'normal';
}