
export interface Stamp {
  id: string;
  image: string;
  name: string;
  origin: string;
  year: string;
  estimatedValue: string;
  rarity: string;
  condition: string;
  description: string;
  dateAdded: string;
  expertStatus: 'none' | 'pending' | 'appraised';
  expertValuation?: string;
  expertNote?: string;
  historicalContext?: string;
  album: string;
  // Database Matching Fields
  catalogId?: string; // e.g. "Michel Nr. 403"
  priceSource?: string; // e.g. "Sotheby's 2024"
  // Technical details for deep analysis
  printingMethod?: string;
  paperType?: string;
  cancellationType?: string;
  // Live Market Data
  webRefs?: { title: string; uri: string }[];
}

export interface PhilatelicNews {
  title: string;
  summary: string;
  url: string;
  source: string;
  type: 'auction' | 'discovery' | 'trend';
}

export type AppView = 'dashboard' | 'scanner' | 'collection' | 'appraisal';

export type KeyStatus = 'checking' | 'missing' | 'invalid' | 'valid';

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}
