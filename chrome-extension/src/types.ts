export interface SearchParams {
  specialty: string;
  location: string;
  date: string;
  additionalRequirements?: string;
}

export interface DoctorAIAnalysis {
  score: number;
  summary: string;
  pros: string[];
  cons: string[];
  lgbtFriendly?: boolean;
  languages?: string[];
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  address: string;
  phone: string;
  rating: number;
  reviewCount: number;
  aiAnalysis: DoctorAIAnalysis;
  availability: string[];
  doctolibUrl: string;
}

export interface SearchResults {
  doctors: Doctor[];
  totalFound: number;
}
