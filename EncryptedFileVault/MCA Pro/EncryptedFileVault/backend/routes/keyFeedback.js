import express from "express";
import KeyPattern from "../models/KeyPattern.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * @route POST /api/key-feedback/analyze
 * @desc Analyze key and store pattern for adaptive learning
 * @access Private
 */
router.post("/analyze", protect, async (req, res) => {
  try {
    const { keyLength, hasUppercase, hasLowercase, hasNumbers, hasSpecial, strengthScore } = req.body;

    // Store the pattern
    const pattern = new KeyPattern({
      user: req.user.id,
      keyLength,
      hasUppercase,
      hasLowercase,
      hasNumbers,
      hasSpecial,
      strengthScore,
    });

    await pattern.save();

    // Get user's historical patterns
    const userPatterns = await KeyPattern.find({ user: req.user.id })
      .sort({ timestamp: -1 })
      .limit(10);

    // Analyze patterns and generate personalized feedback
    const feedback = generateAdaptiveFeedback(userPatterns, {
      keyLength,
      hasUppercase,
      hasLowercase,
      hasNumbers,
      hasSpecial,
      strengthScore,
    });

    res.json({
      success: true,
      feedback,
      patterns: userPatterns.length,
    });
  } catch (error) {
    console.error("Key feedback error:", error);
    res.status(500).json({ success: false, message: "Analysis failed" });
  }
});

/**
 * @route GET /api/key-feedback/suggestions
 * @desc Get personalized key suggestions based on user history
 * @access Private
 */
router.get("/suggestions", protect, async (req, res) => {
  try {
    const userPatterns = await KeyPattern.find({ user: req.user.id })
      .sort({ timestamp: -1 })
      .limit(20);

    if (userPatterns.length === 0) {
      return res.json({
        success: true,
        suggestions: [
          "Use at least 16 characters for strong encryption",
          "Mix uppercase, lowercase, numbers, and special characters",
          "Avoid common words and patterns",
        ],
        isPersonalized: false,
      });
    }

    // Analyze user's typical patterns
    const avgLength = userPatterns.reduce((sum, p) => sum + p.keyLength, 0) / userPatterns.length;
    const avgScore = userPatterns.reduce((sum, p) => sum + p.strengthScore, 0) / userPatterns.length;
    
    const uppercaseUsage = userPatterns.filter(p => p.hasUppercase).length / userPatterns.length;
    const numbersUsage = userPatterns.filter(p => p.hasNumbers).length / userPatterns.length;
    const specialUsage = userPatterns.filter(p => p.hasSpecial).length / userPatterns.length;

    const suggestions = [];

    // Personalized suggestions based on patterns
    if (avgLength < 16) {
      suggestions.push(`You typically use ${Math.round(avgLength)} characters. Try increasing to 16+ for better security.`);
    }

    if (uppercaseUsage < 0.7) {
      suggestions.push("You often forget uppercase letters. Remember to include A-Z for stronger keys.");
    }

    if (numbersUsage < 0.7) {
      suggestions.push("Adding numbers (0-9) would significantly improve your key strength.");
    }

    if (specialUsage < 0.5) {
      suggestions.push("Special characters (!@#$%^&*) are rarely used in your keys. They add extra security!");
    }

    if (avgScore < 60) {
      suggestions.push(`Your average key strength is ${Math.round(avgScore)}/100. Aim for 80+ for optimal security.`);
    } else if (avgScore >= 80) {
      suggestions.push("Great job! You consistently create strong encryption keys. Keep it up!");
    }

    // Add improvement trend
    if (userPatterns.length >= 5) {
      const recentAvg = userPatterns.slice(0, 5).reduce((sum, p) => sum + p.strengthScore, 0) / 5;
      const olderAvg = userPatterns.slice(5, 10).reduce((sum, p) => sum + p.strengthScore, 0) / Math.min(5, userPatterns.length - 5);
      
      if (recentAvg > olderAvg + 10) {
        suggestions.push("📈 Your key strength is improving! Keep up the good work.");
      } else if (recentAvg < olderAvg - 10) {
        suggestions.push("📉 Your recent keys are weaker than before. Stay vigilant!");
      }
    }

    res.json({
      success: true,
      suggestions: suggestions.slice(0, 4),
      isPersonalized: true,
      stats: {
        totalKeys: userPatterns.length,
        avgLength: Math.round(avgLength),
        avgScore: Math.round(avgScore),
      },
    });
  } catch (error) {
    console.error("Suggestions error:", error);
    res.status(500).json({ success: false, message: "Failed to get suggestions" });
  }
});

// Helper function to generate adaptive feedback
function generateAdaptiveFeedback(patterns, currentKey) {
  const feedback = [];

  if (patterns.length >= 3) {
    // Check if user is repeating weak patterns
    const recentWeak = patterns.slice(0, 3).filter(p => p.strengthScore < 50).length;
    if (recentWeak >= 2) {
      feedback.push("⚠️ You've used weak keys recently. Consider using our key generator.");
    }

    // Check if user is improving
    const scores = patterns.slice(0, 5).map(p => p.strengthScore);
    const isImproving = scores.every((score, i) => i === 0 || score >= scores[i - 1] - 5);
    if (isImproving && currentKey.strengthScore >= 70) {
      feedback.push("✨ Great progress! Your key security is improving.");
    }
  }

  // Specific feedback for current key
  if (currentKey.keyLength < 12) {
    feedback.push("🔑 Your keys are typically short. Longer keys = better security.");
  }

  if (!currentKey.hasSpecial && patterns.filter(p => !p.hasSpecial).length >= 3) {
    feedback.push("💡 You rarely use special characters. They significantly boost security!");
  }

  return feedback.slice(0, 3);
}

export default router;
