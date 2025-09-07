import express from "express";
import {
  searchDoctors,
  analyzeDoctorReviews,
} from "../controllers/enhancedDoctorController";

const router = express.Router();

// Search doctors endpoint (using enhanced controller)
router.post("/search", searchDoctors);

// Enhanced search doctors endpoint (same as above for backward compatibility)
router.post("/enhanced/search", searchDoctors);

// Analyze doctor reviews endpoint (using enhanced controller)
router.post("/analyze-reviews", analyzeDoctorReviews);

// Enhanced analyze doctor reviews endpoint (same as above for backward compatibility)
router.post("/enhanced/analyze-reviews", analyzeDoctorReviews);

export default router;
