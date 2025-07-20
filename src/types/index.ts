export interface User {
  id: string;
  email: string;
  name: string;
  age: number;
  gender: string;
  city: string;
  photos: string[];
  bio?: string;
  interests: string[];
  location?: {
    latitude: number;
    longitude: number;
  };
  isVerified: boolean;
  isSuperVerified: boolean; // Nuevo campo para super verificación
  verifiedAt?: Date;
  superVerifiedAt?: Date; // Nuevo campo para fecha de super verificación
  verificationPhoto?: string;
  superVerificationPhoto?: string; // Foto de la verificación de vida
  isAdmin: boolean; // Campo para administradores
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
  isVerified?: boolean;
  isSuperVerified?: boolean;
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
  interactionStatus: string[]; // Nuevo campo para estado de interacción
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