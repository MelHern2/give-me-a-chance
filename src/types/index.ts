export interface User {
  id: string;
  email: string;
  name: string;
  age: number;
  gender: string;
  country: string;
  region: string;
  city: string;
  religion: string;
  isMonogamous: boolean;
  sexualOrientation: string;
  politicalOrientation: string;
  hasChildren: boolean;
  relationshipType: string;
  description: string;
  photos: string[];
  location: {
    latitude: number;
    longitude: number;
  };
  isAdmin: boolean;
  fcmToken?: string; // Token para notificaciones push
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  id: string;
  name: string;
  age: number;
  gender: string;
  country: string;
  region: string;
  city: string;
  religion: string;
  isMonogamous: boolean;
  sexualOrientation: string;
  politicalOrientation: string;
  hasChildren: boolean;
  relationshipType: string;
  description: string;
  photos: string[];
  location?: {
    latitude: number;
    longitude: number;
  };
  distance?: number;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
}

export interface FilterOptions {
  maxDistance: number;
  ageRange: [number, number];
  gender: string[];
  sexualOrientation: string[];
  relationshipType: string[];
  hasChildren?: boolean;
  isMonogamous?: boolean;
}

export interface Match {
  id: string;
  users: [string, string];
  createdAt: Date;
  lastMessage?: string;
  lastMessageAt?: Date;
}

export interface Message {
  id: string;
  matchId: string;
  senderId: string;
  content: string;
  createdAt: Date;
}

export interface Report {
  id: string;
  reporterId: string;
  reportedUserId: string;
  reason: string;
  createdAt: Date;
} 