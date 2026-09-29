export interface Quiz {
  id: number;
  title: string;
  slug: string;
  description: string;
  category: string;
  thumbnail: string;
  status: 'active' | 'draft';
  rating?: number;
  est_time?: string;
  total_questions?: number;
  total_participants?: number;
  created_at: string;
}

export interface Option {
  id: number;
  question_id?: number;
  option_text: string;
  score_value: number;
  result_code: string;
}

export interface Question {
  id: number;
  quiz_id: number;
  question_text: string;
  image_url: string | null;
  sort_order: number;
  options: Option[];
}

export interface ResultRule {
  id: number;
  quiz_id: number;
  result_code: string;
  title: string;
  description: string;
  badge: string;
  badge_color?: string;
  image_url: string | null;
  min_score: number;
  max_score: number;
  strengths?: string[];
  recommendation?: string;
  actionable_advice?: string[];
}

export interface BayesDetails {
  severity_percentage: number;
  posterior_probabilities: {
    ringan: number;
    sedang: number;
    kritis: number;
  };
  dominant_hypothesis: 'RINGAN' | 'SEDANG' | 'KRITIS';
  confidence_percentage: number;
}

export interface SubmissionResponse {
  response_id: number;
  quiz: {
    id: number;
    title: string;
    category: string;
  };
  score: number;
  dominant_code: string;
  code_distribution: Record<string, number>;
  bayes?: BayesDetails;
  result: {
    id: number;
    code: string;
    title: string;
    description: string;
    badge: string;
    badge_color?: string;
    image_url: string | null;
    strengths?: string[];
    recommendation?: string;
    actionable_advice?: string[];
  };
  total_answered: number;
  total_score?: number;
  answers_payload?: Array<{
    question_id: number;
    question_text: string;
    option_id: number;
    option_text: string;
    score_value: number;
    result_code: string;
    selected_option_letter?: string;
  }>;
  completed_at: string;
}
