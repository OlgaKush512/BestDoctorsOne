import { Request, Response } from "express";
import { DoctolibService } from "../services/doctolibService";
import { SeleniumDoctolibService } from "../services/seleniumDoctolibService";
import { SerpApiGoogleReviewsService } from "../services/serpApiGoogleReviewsService";
import { AIAnalysisService } from "../services/aiAnalysisService";

interface SearchDoctorsRequest {
  specialty: string;
  location: string;
  date: string;
  additionalRequirements?: string;
}

interface AnalyzeReviewsRequest {
  doctorId: string;
  requirements?: string;
}

export const searchDoctors = async (
  req: Request<{}, {}, SearchDoctorsRequest>,
  res: Response
) => {
  try {
    const { specialty, location, date, additionalRequirements } = req.body;

    if (!specialty || !location || !date) {
      return res.status(400).json({
        error: "Missing required fields: specialty, location, date",
      });
    }

    console.log(`🔍 Enhanced search for ${specialty} in ${location} on ${date}`);

    // Step 1: Search doctors on Doctolib using improved AI-powered Selenium service
    const improvedDoctolibService = new (await import('../services/improvedDoctolibService')).ImprovedDoctolibService();
    const doctolibResults = await improvedDoctolibService.searchDoctors({
      specialty,
      location,
      date,
    });

    if (!doctolibResults || doctolibResults.length === 0) {
      return res.json({
        doctors: [],
        totalFound: 0,
        message: "No doctors found for the specified criteria",
      });
    }

    console.log(`📋 Found ${doctolibResults.length} doctors on Doctolib`);

    // Step 2: Analyze each doctor with SerpAPI Google Reviews and AI
    const googleReviewsService = new SerpApiGoogleReviewsService();
    const aiAnalysisService = new AIAnalysisService();

    const analyzedDoctors = await Promise.all(
      doctolibResults.map(async (doctor) => {
        try {
          // Get Enhanced Google Reviews with AI analysis
          const reviews = await googleReviewsService.getDoctorReviews(
            doctor.name,
            doctor.address,
            doctor.specialty
          );

          // Additional AI Analysis of reviews
          const aiAnalysis = await aiAnalysisService.analyzeReviews(
            reviews,
            additionalRequirements || ""
          );

          return {
            ...doctor,
            rating: reviews.averageRating || 0,
            reviewCount: reviews.totalReviews || 0,
            reviews: reviews.reviews.slice(0, 5), // Include top 5 reviews
            sentimentSummary: reviews.sentimentSummary,
            aiAnalysis: {
              score: aiAnalysis.score,
              summary: aiAnalysis.summary,
              pros: aiAnalysis.pros,
              cons: aiAnalysis.cons,
              lgbtFriendly: aiAnalysis.lgbtFriendly,
              languages: aiAnalysis.languages,
            },
          };
        } catch (error) {
          console.error(`Error analyzing doctor ${doctor.name}:`, error);
          return {
            ...doctor,
            rating: 0,
            reviewCount: 0,
            reviews: [],
            sentimentSummary: { positive: 0, neutral: 0, negative: 0 },
            aiAnalysis: {
              score: 0,
              summary: "Analysis not available",
              pros: [],
              cons: ["Analysis failed"],
              lgbtFriendly: false,
              languages: [],
            },
          };
        }
      })
    );

    // Sort by AI score (highest first)
    const sortedDoctors = analyzedDoctors.sort(
      (a, b) => b.aiAnalysis.score - a.aiAnalysis.score
    );

    console.log(`✅ Enhanced analysis complete for ${sortedDoctors.length} doctors`);

    res.json({
      doctors: sortedDoctors,
      totalFound: sortedDoctors.length,
      enhancedFeatures: [
        "SerpAPI-powered Google Reviews extraction",
        "Real-time review data from Google Maps",
        "Advanced sentiment analysis",
        "Topic extraction from reviews",
        "Individual review AI analysis",
        "LGBT-friendly detection",
        "Language detection"
      ]
    });
  } catch (error) {
    console.error("Enhanced search doctors error:", error);
    res.status(500).json({
      error: "Internal server error during enhanced doctor search",
    });
  }
};

export const analyzeDoctorReviews = async (
  req: Request<{}, {}, AnalyzeReviewsRequest>,
  res: Response
) => {
  try {
    const { doctorId, requirements } = req.body;

    if (!doctorId) {
      return res.status(400).json({
        error: "Missing required field: doctorId",
      });
    }

    // This endpoint can be used for individual doctor analysis
    // Implementation would be similar to the analysis done in searchDoctors

    res.json({
      message: "Enhanced individual doctor analysis endpoint - to be implemented",
      doctorId,
      requirements,
    });
  } catch (error) {
    console.error("Analyze reviews error:", error);
    res.status(500).json({
      error: "Internal server error during review analysis",
    });
  }
};
