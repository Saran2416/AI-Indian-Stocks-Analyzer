export interface ScoringWeights {
  fundamentals: number;
  technicals: number;
  sentiment: number;
  risk: number;
}

export interface ScoreResult {
  overall: number;
  fundamentalsScore: number;
  technicalScore: number;
  sentimentScore: number;
  riskScore: number;
  recommendation: 'BUY' | 'HOLD' | 'AVOID';
  color: 'green' | 'yellow' | 'red';
}

// Default weights: Fundamentals 40%, Technicals 30%, Sentiment 20%, Risk 10%
const DEFAULT_WEIGHTS: ScoringWeights = {
  fundamentals: 0.4,
  technicals: 0.3,
  sentiment: 0.2,
  risk: 0.1,
};

/**
 * Calculate overall AI score based on individual component scores
 */
export function calculateOverallScore(
  fundamentalsScore: number,
  technicalScore: number,
  sentimentScore: number,
  riskScore: number,
  weights: ScoringWeights = DEFAULT_WEIGHTS
): number {
  // Adjust risk score (inverse it so higher risk = lower contribution)
  const adjustedRiskScore = 100 - riskScore;

  const overall = Math.round(
    fundamentalsScore * weights.fundamentals +
    technicalScore * weights.technicals +
    sentimentScore * weights.sentiment +
    adjustedRiskScore * weights.risk
  );

  return Math.max(0, Math.min(100, overall)); // Clamp between 0-100
}

/**
 * Get recommendation based on overall score
 */
export function getRecommendation(overallScore: number): 'BUY' | 'HOLD' | 'AVOID' {
  if (overallScore >= 71) {
    return 'BUY';
  } else if (overallScore >= 41) {
    return 'HOLD';
  } else {
    return 'AVOID';
  }
}

/**
 * Get color based on score
 */
export function getScoreColor(score: number): 'green' | 'yellow' | 'red' {
  if (score >= 71) {
    return 'green';
  } else if (score >= 41) {
    return 'yellow';
  } else {
    return 'red';
  }
}

/**
 * Calculate complete score result
 */
export function calculateScoreResult(
  fundamentalsScore: number,
  technicalScore: number,
  sentimentScore: number,
  riskScore: number,
  weights?: ScoringWeights
): ScoreResult {
  const overall = calculateOverallScore(
    fundamentalsScore,
    technicalScore,
    sentimentScore,
    riskScore,
    weights
  );

  return {
    overall,
    fundamentalsScore,
    technicalScore,
    sentimentScore,
    riskScore,
    recommendation: getRecommendation(overall),
    color: getScoreColor(overall),
  };
}

/**
 * Get detailed recommendation message
 */
export function getRecommendationMessage(recommendation: 'BUY' | 'HOLD' | 'AVOID'): string {
  const messages = {
    BUY: '✔ Strong Buy Signal - Stock shows positive indicators across multiple metrics',
    HOLD: '⚖ Neutral - Stock requires monitoring; wait for clearer signals before investing',
    AVOID: '❌ Avoid - Stock shows weakness; consider better opportunities',
  };
  return messages[recommendation];
}

/**
 * Format score with percentage
 */
export function formatScore(score: number): string {
  return `${Math.round(score)}%`;
}
