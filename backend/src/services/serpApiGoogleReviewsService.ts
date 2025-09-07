import axios from 'axios';

export interface GoogleReview {
  author: string;
  rating: number;
  text: string;
  date: string;
  relativeTime?: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  keyTopics?: string[];
  aiAnalysis?: string;
}

export interface GoogleReviewsData {
  averageRating: number;
  totalReviews: number;
  reviews: GoogleReview[];
  placeId?: string;
  placeUrl?: string;
  sentimentSummary?: {
    positive: number;
    neutral: number;
    negative: number;
  };
}

export class SerpApiGoogleReviewsService {
  private apiKey: string;
  private baseUrl = 'https://serpapi.com/search';

  constructor() {
    this.apiKey = process.env.SERPAPI_API_KEY || '';
    if (!this.apiKey) {
      console.warn('⚠️ SERPAPI_API_KEY not found, using mock data');
    }
  }

  async getDoctorReviews(doctorName: string, address: string, specialty?: string): Promise<GoogleReviewsData> {
    console.log(`🔍 SerpAPI Google Reviews search for Dr. ${doctorName}`);

    if (!this.apiKey) {
      console.log('⚠️ No SerpAPI key, returning empty reviews');
      return this.getEmptyReviews();
    }

    try {
      // Step 1: Search for the doctor's place
      const placeData = await this.searchDoctorPlace(doctorName, address, specialty);
      
      if (!placeData) {
        console.log('⚠️ Place not found via SerpAPI, returning empty reviews');
        return this.getEmptyReviews();
      }

      // Step 2: Get reviews for the place
      const reviewsData = await this.getPlaceReviews(placeData.data_id, doctorName);
      
      if (reviewsData && reviewsData.reviews.length > 0) {
        console.log(`✅ Found ${reviewsData.reviews.length} reviews via SerpAPI`);
        return reviewsData;
      }

      return this.getEmptyReviews();

    } catch (error) {
      console.error('SerpAPI error:', error);
      return this.getEmptyReviews();
    }
  }

  private async searchDoctorPlace(doctorName: string, address: string, specialty?: string): Promise<any> {
    try {
      // Clean doctor name - remove "Dr." prefix if present
      const cleanName = doctorName.replace(/^Dr\.?\s*/i, '');
      
      // Extract city from address (usually the last part)
      const cityMatch = address.match(/\b(\w+)\s*$/);
      const city = cityMatch ? cityMatch[1] : address;
      
      // Build search query: name + specialty + city
      let query = `${cleanName}`;
      if (specialty) {
        query += ` ${specialty}`;
      }
      query += ` ${city}`;
      
      console.log(`🔍 SerpAPI searching: "${query}"`);
      
      const response = await axios.get(this.baseUrl, {
        params: {
          engine: 'google_maps',
          q: query,
          api_key: this.apiKey,
          hl: 'fr',
          gl: 'fr'
        },
        timeout: 15000
      });

      if (response.data.local_results && response.data.local_results.length > 0) {
        // Check if any result matches the doctor name
        for (const place of response.data.local_results) {
          if (this.isRelevantDoctor(place, cleanName)) {
            console.log(`✅ Found relevant place via SerpAPI: ${place.title}`);
            console.log(`📍 Address: ${place.address}`);
            console.log(`⭐ Rating: ${place.rating} (${place.reviews} reviews)`);
            
            return {
              data_id: place.data_id,
              title: place.title,
              rating: place.rating,
              reviews: place.reviews,
              address: place.address
            };
          }
        }
      }

      console.log(`⚠️ No relevant doctor found for "${cleanName}" in SerpAPI results`);
      return null;

    } catch (error) {
      console.error('Error searching doctor place:', error);
      return null;
    }
  }

  private isRelevantDoctor(place: any, doctorName: string): boolean {
    if (!place.title) return false;
    
    const placeTitle = place.title.toLowerCase();
    const searchName = doctorName.toLowerCase();
    
    // Check if the place title contains the doctor's name parts
    const nameParts = searchName.split(' ').filter(part => part.length > 2);
    const hasNameParts = nameParts.some(part => placeTitle.includes(part));
    
    console.log(`🔍 Checking relevance: "${place.title}" for "${doctorName}"`);
    console.log(`   - Has name parts: ${hasNameParts}`);
    
    return hasNameParts;
  }

  private async getPlaceReviews(dataId: string, doctorName: string): Promise<GoogleReviewsData | null> {
    try {
      const response = await axios.get(this.baseUrl, {
        params: {
          engine: 'google_maps_reviews',
          data_id: dataId,
          api_key: this.apiKey,
          hl: 'fr',
          sort_by: 'newestFirst'
          // Remove num parameter for initial page
        },
        timeout: 15000
      });

      if (response.data.reviews && response.data.reviews.length > 0) {
        const reviews: GoogleReview[] = response.data.reviews.map((review: any) => ({
          author: review.user?.name || 'Anonyme',
          rating: review.rating || 5,
          text: review.snippet || review.text || '',
          date: review.date || 'Date inconnue',
          relativeTime: review.relative_date || '',
          sentiment: this.analyzeSentiment(review.snippet || review.text || ''),
          keyTopics: this.extractKeyTopics(review.snippet || review.text || ''),
          aiAnalysis: this.generateAiAnalysis(review.rating, review.snippet || review.text || '')
        }));

        // Get overall rating from place info
        const averageRating = response.data.place?.rating || this.calculateAverageRating(reviews);
        const totalReviews = response.data.place?.reviews || reviews.length;

        return {
          averageRating,
          totalReviews,
          reviews,
          placeId: dataId,
          placeUrl: response.data.place?.link,
          sentimentSummary: this.calculateSentimentSummary(reviews)
        };
      }

      return null;

    } catch (error) {
      console.error('Error getting place reviews:', error);
      return null;
    }
  }

  private analyzeSentiment(text: string): 'positive' | 'neutral' | 'negative' {
    if (!text) return 'neutral';

    const lowerText = text.toLowerCase();
    
    const positiveWords = [
      'excellent', 'très bien', 'recommande', 'satisfait', 'professionnel', 
      'compétent', 'aimable', 'parfait', 'super', 'génial', 'formidable',
      'à l\'écoute', 'bienveillant', 'efficace', 'rapide', 'ponctuel'
    ];
    
    const negativeWords = [
      'déçu', 'mauvais', 'problème', 'pas bien', 'décevant', 'nul',
      'incompétent', 'désagréable', 'long', 'lent', 'retard', 'difficile'
    ];

    const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;

    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  private extractKeyTopics(text: string): string[] {
    if (!text) return [];

    const topics: string[] = [];
    const lowerText = text.toLowerCase();

    const topicKeywords = {
      'écoute': ['écoute', 'écouter', 'attentif', 'attentive', 'bienveillant'],
      'professionnalisme': ['professionnel', 'professionnelle', 'compétent', 'compétente', 'expert'],
      'délais': ['délai', 'attente', 'rendez-vous', 'ponctuel', 'rapide', 'temps'],
      'accueil': ['accueil', 'personnel', 'secrétaire', 'aimable', 'souriant'],
      'diagnostic': ['diagnostic', 'examen', 'analyse', 'résultat', 'précis'],
      'traitement': ['traitement', 'médicament', 'prescription', 'soin', 'guérison'],
      'cabinet': ['cabinet', 'lieu', 'propreté', 'équipement', 'matériel'],
      'communication': ['explique', 'explication', 'clair', 'compréhensible', 'patient']
    };

    Object.entries(topicKeywords).forEach(([topic, keywords]) => {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        topics.push(topic);
      }
    });

    return topics;
  }

  private generateAiAnalysis(rating: number, text: string): string {
    const sentiment = this.getSentimentDescription(rating);
    const textLength = text.length;
    
    if (textLength > 100) {
      return `Avis ${rating}/5 étoiles - ${sentiment}. Commentaire détaillé du patient.`;
    } else if (textLength > 50) {
      return `Avis ${rating}/5 étoiles - ${sentiment}. Retour concis mais informatif.`;
    } else {
      return `Avis ${rating}/5 étoiles - ${sentiment}. Commentaire bref.`;
    }
  }

  private getSentimentDescription(rating: number): string {
    if (rating >= 4) return 'Très positif';
    if (rating >= 3) return 'Positif';
    if (rating >= 2) return 'Mitigé';
    return 'Négatif';
  }

  private calculateAverageRating(reviews: GoogleReview[]): number {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return Math.round((sum / reviews.length) * 10) / 10;
  }

  private calculateSentimentSummary(reviews: GoogleReview[]): { positive: number; neutral: number; negative: number } {
    const summary = { positive: 0, neutral: 0, negative: 0 };

    reviews.forEach(review => {
      if (review.sentiment === 'positive') summary.positive++;
      else if (review.sentiment === 'negative') summary.negative++;
      else summary.neutral++;
    });

    return summary;
  }

  private getEmptyReviews(): GoogleReviewsData {
    console.log('📝 No reviews found - returning empty data');

    return {
      averageRating: 0,
      totalReviews: 0,
      reviews: [],
      sentimentSummary: {
        positive: 0,
        neutral: 0,
        negative: 0
      }
    };
  }
}
