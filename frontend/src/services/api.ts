import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000, // Увеличиваем до 2 минут для поиска врачей
});

export interface SearchParams {
  specialty: string;
  location: string;
  date: string;
  additionalRequirements?: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  address: string;
  phone: string;
  rating: number;
  reviewCount: number;
  aiAnalysis: {
    score: number;
    summary: string;
    pros: string[];
    cons: string[];
    lgbtFriendly?: boolean;
    languages?: string[];
  };
  availability: string[];
  doctolibUrl: string;
}

export interface SearchResults {
  doctors: Doctor[];
  totalFound: number;
}

export const searchDoctors = async (
  params: SearchParams
): Promise<SearchResults> => {
  try {
    console.log("🔍 Sending API request to:", `${API_BASE_URL}/doctors/search`);
    console.log("📦 Request params:", params);
    
    const response = await api.post("/doctors/search", params);
    
    console.log("✅ API Response received:", response.status);
    console.log("📋 Response data:", response.data);
    
    return response.data;
  } catch (error: any) {
    console.error("❌ API Error details:", error);
    
    if (error.response) {
      // Server responded with error status
      console.error("Response status:", error.response.status);
      console.error("Response data:", error.response.data);
      
      if (error.response.status === 500) {
        throw new Error("Erreur serveur: " + (error.response.data?.error || "Service temporairement indisponible"));
      } else if (error.response.status === 400) {
        throw new Error("Paramètres invalides: " + (error.response.data?.error || "Vérifiez vos critères de recherche"));
      } else {
        throw new Error(`Erreur ${error.response.status}: ${error.response.data?.error || "Erreur inconnue"}`);
      }
    } else if (error.request) {
      // Request was made but no response received
      console.error("No response received:", error.request);
      
      if (error.code === 'ECONNABORTED' && error.message.includes('timeout')) {
        throw new Error("La recherche prend plus de temps que prévu. Cela peut arriver lors de l'analyse des avis. Veuillez patienter ou réessayer.");
      } else {
        throw new Error("Impossible de contacter le serveur. Vérifiez votre connexion.");
      }
    } else {
      // Something else happened
      console.error("Request setup error:", error.message);
      throw new Error("Erreur de configuration: " + error.message);
    }
  }
};

export const analyzeDoctorReviews = async (
  doctorId: string,
  requirements?: string
) => {
  try {
    const response = await api.post("/doctors/analyze-reviews", {
      doctorId,
      requirements,
    });
    return response.data;
  } catch (error) {
    console.error("API Error:", error);
    throw new Error("Failed to analyze reviews");
  }
};

export default api;
