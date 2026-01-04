export interface User {
  name: string;
  avatar: string;
  isVerified: boolean;
  dob: string;
  status: string;
  cardNumber?: string;
}

export interface Story {
  id: string;
  user: Pick<User, 'name' | 'avatar'>;
}

export interface Bus {
  id: string;
  lineNumber: string;
  destination: string;
  arrivalTime: number; // in minutes
  lineColor: string;
  stops: string[]; // Durak listesi için bu alanı ekliyoruz
}

export interface DiscountPartner {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  iconColor: string;
  bgColor: string;
  offer: string;
  description: string;
  imageUrl?: string; // Add this line
  url: string;
  category?: 'Kafe' | 'Sinema' | 'Giyim' | 'Yiyecek' | 'Diğer';
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: string;
}

export interface Event {
  id: string;
  title: string;
  date: string;
  location: string;
  category: 'Konser' | 'Gezi' | 'Spor' | 'Tümü';
  image: string;
}

export interface Magazine {
  id: string;
  title: string;
  image: any; // URL string or local require source
  description?: string;
  category?: 'historic' | 'museum' | 'nature';
}

export interface Bulletin {
    id: string;
    title: string;
    url: string;
}

export interface Reward {
    id: string;
    name: string;
    points: number;
    icon: string;
}

export interface PointsHistory {
    id: string;
    description: string;
    points: number;
    date: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'event' | 'discount';
  createdAt: string;
  isRead?: boolean;
}
