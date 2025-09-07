import { LLMFactory } from "./llm/LLMFactory";
import { LLMProvider, ChatMessage, Tool } from "./llm/types";
import { GoogleReviewsData } from "./googleReviewsService";

export interface AIAnalysisResult {
  score: number;
  summary: string;
  pros: string[];
  cons: string[];
  lgbtFriendly: boolean;
  languages: string[];
}

export class AIAnalysisService {
  private llm: LLMProvider;

  constructor() {
    this.llm = LLMFactory.create();
  }

  async analyzeReviews(
    reviewsData: GoogleReviewsData,
    userRequirements: string
  ): Promise<AIAnalysisResult> {
    try {
      console.log("🤖 Starting AI analysis of reviews...");

      const providerInfo = LLMFactory.getProviderInfo();
      if (!providerInfo.hasApiKey) {
        console.log(`⚠️ ${providerInfo.provider} API key not found, returning mock analysis`);
        return this.getMockAnalysis(reviewsData, userRequirements);
      }

      const prompt = this.buildAnalysisPrompt(reviewsData, userRequirements);

      const messages: ChatMessage[] = [
        {
          role: "system",
          content:
            "You are a medical review analyst specializing in French healthcare. Analyze doctor reviews and provide insights based on user requirements. Respond in French and be objective and helpful.",
        },
        {
          role: "user",
          content: prompt,
        },
      ];

      // Use function calling if supported for structured output
      if (this.llm.supportsTools) {
        const tool: Tool = {
          type: 'function',
          function: {
            name: 'analyze_reviews',
            description: 'Analyze doctor reviews and provide structured analysis',
            parameters: {
              type: 'object',
              properties: {
                score: { type: 'number', minimum: 0, maximum: 10 },
                summary: { type: 'string' },
                pros: { type: 'array', items: { type: 'string' } },
                cons: { type: 'array', items: { type: 'string' } },
                lgbtFriendly: { type: 'boolean' },
                languages: { type: 'array', items: { type: 'string' } }
              },
              required: ['score', 'summary', 'pros', 'cons', 'lgbtFriendly', 'languages']
            }
          }
        };

        if (this.llm.chatWithTools) {
          const result = await this.llm.chatWithTools(
            messages,
            [tool],
            async (name, args) => args // Just return the structured data
          );
          
          try {
            const parsed = typeof result === 'string' ? JSON.parse(result) : result;
            return {
              score: Math.min(10, Math.max(0, parsed.score || 0)),
              summary: parsed.summary || "Analyse non disponible",
              pros: Array.isArray(parsed.pros) ? parsed.pros : [],
              cons: Array.isArray(parsed.cons) ? parsed.cons : [],
              lgbtFriendly: Boolean(parsed.lgbtFriendly),
              languages: Array.isArray(parsed.languages) ? parsed.languages : [],
            };
          } catch (error) {
            console.error('Failed to parse structured response:', error);
            // Fall through to text parsing
          }
        }
      }

      // Fallback to regular chat completion
      const completion = await this.llm.chat(messages, {
        temperature: 0.3,
        maxTokens: 1000,
      });

      const response = completion.content;
      if (!response) {
        throw new Error("No response from OpenAI");
      }

      const analysis = this.parseAIResponse(response, reviewsData);
      console.log("✅ AI analysis completed");

      return analysis;
    } catch (error) {
      console.error("AI Analysis error:", error);
      console.log("⚠️ AI analysis failed, returning mock analysis");
      return this.getMockAnalysis(reviewsData, userRequirements);
    }
  }

  private buildAnalysisPrompt(
    reviewsData: GoogleReviewsData,
    userRequirements: string
  ): string {
    const reviewsText = reviewsData.reviews
      .map(
        (review) =>
          `Avis ${review.rating}/5 par ${review.author}: "${review.text}"`
      )
      .join("\n\n");

    return `
Analysez ces avis de patients pour un docteur français et fournissez une évaluation basée sur les exigences suivantes:

EXIGENCES DU PATIENT:
${userRequirements || "Aucune exigence spécifique"}

AVIS À ANALYSER:
Note moyenne: ${reviewsData.averageRating}/5 (${reviewsData.totalReviews} avis)

${reviewsText}

Veuillez fournir votre analyse au format JSON suivant:
{
  "score": [note sur 10 basée sur la correspondance avec les exigences],
  "summary": "[résumé en 2-3 phrases de votre évaluation]",
  "pros": ["[point positif 1]", "[point positif 2]", "[point positif 3]"],
  "cons": ["[point négatif 1]", "[point négatif 2]"],
  "lgbtFriendly": [true/false basé sur les indices dans les avis],
  "languages": ["[langues mentionnées dans les avis]"]
}

Concentrez-vous particulièrement sur:
- La correspondance avec les exigences spécifiques du patient
- L'attitude du médecin (bienveillance, respect, écoute)
- La qualité des soins médicaux
- L'accessibilité et la communication
- Tout indice sur l'ouverture d'esprit et l'inclusivité
`;
  }

  private parseAIResponse(
    response: string,
    reviewsData: GoogleReviewsData
  ): AIAnalysisResult {
    try {
      // Log the raw response for debugging
      console.log("🔍 Raw AI response:", response);
      
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        let jsonString = jsonMatch[0];
        
        // Clean up common JSON formatting issues
        jsonString = jsonString
          .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
          .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
          .replace(/([{,]\s*)(\w+):/g, '$1"$2":') // Add quotes to unquoted keys
          .trim();
        
        console.log("🔍 Cleaned JSON string:", jsonString);
        
        const parsed = JSON.parse(jsonString);
        return {
          score: Math.min(10, Math.max(0, parsed.score || 0)),
          summary: parsed.summary || "Analyse non disponible",
          pros: Array.isArray(parsed.pros) ? parsed.pros : [],
          cons: Array.isArray(parsed.cons) ? parsed.cons : [],
          lgbtFriendly: Boolean(parsed.lgbtFriendly),
          languages: Array.isArray(parsed.languages) ? parsed.languages : [],
        };
      }
    } catch (error) {
      console.error("Error parsing AI response:", error);
      console.error("Response that failed to parse:", response);
    }

    // Fallback parsing if JSON parsing fails
    console.log("⚠️ Using fallback parsing due to JSON parse error");
    return this.fallbackParseResponse(response, reviewsData);
  }

  private fallbackParseResponse(
    response: string,
    reviewsData: GoogleReviewsData
  ): AIAnalysisResult {
    // Simple fallback analysis based on average rating
    const baseScore = Math.min(10, reviewsData.averageRating * 2);

    return {
      score: baseScore,
      summary: `Docteur avec une note moyenne de ${reviewsData.averageRating}/5 basée sur ${reviewsData.totalReviews} avis.`,
      pros: ["Professionnel de santé qualifié", "Avis patients disponibles"],
      cons: reviewsData.averageRating < 4 ? ["Note moyenne perfectible"] : [],
      lgbtFriendly: false,
      languages: ["Français"],
    };
  }

  private getMockAnalysis(
    reviewsData: GoogleReviewsData,
    userRequirements: string
  ): AIAnalysisResult {
    // Mock analysis for development
    const isLgbtRequirement =
      userRequirements.toLowerCase().includes("lgbt") ||
      userRequirements.toLowerCase().includes("trans");

    const isLanguageRequirement =
      userRequirements.toLowerCase().includes("anglais") ||
      userRequirements.toLowerCase().includes("english");

    const baseScore = reviewsData.averageRating * 2;
    let adjustedScore = baseScore;

    // Adjust score based on requirements match
    if (isLgbtRequirement) adjustedScore += 1;
    if (isLanguageRequirement) adjustedScore += 0.5;

    return {
      score: Math.min(10, Math.max(0, adjustedScore)),
      summary: `Docteur bien noté avec ${
        reviewsData.averageRating
      }/5 étoiles. ${
        isLgbtRequirement
          ? "Semble ouvert et bienveillant selon les avis."
          : "Professionnel compétent."
      } ${
        isLanguageRequirement ? "Parle anglais selon certains patients." : ""
      }`,
      pros: [
        "Très professionnel et compétent",
        "À l'écoute des patients",
        ...(isLgbtRequirement ? ["Bienveillant et respectueux"] : []),
        ...(isLanguageRequirement ? ["Parle anglais"] : []),
        "Cabinet bien situé",
      ],
      cons:
        reviewsData.averageRating < 4.5
          ? [
              "Délais de rendez-vous parfois longs",
              "Consultations parfois expéditives",
            ]
          : [],
      lgbtFriendly: isLgbtRequirement,
      languages: ["Français", ...(isLanguageRequirement ? ["Anglais"] : [])],
    };
  }
}
