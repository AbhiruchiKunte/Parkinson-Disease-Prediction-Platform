const BASE_URL = 'http://localhost:5000';

export interface PredictionFeatures {
  age: number;
  tremor_score: number;
  handwriting_score: number;
  jitter_local: number;
  shimmer_local: number;
  // Included for future use but backend might ignore
  bradykinesia?: number;
  rigidity?: number;
}

export interface PredictionResponse {
  pd_probability: number;
  pd_probability_rf?: number;
  pd_probability_svm?: number;
  stage_probs: {
    early: number;
    mid: number;
    late: number;
  };
  top_features: string[];
}

export interface BatchPredictionResponse {
  predictions: any[];
  total_records: number;
  successful_predictions: number;
  failed_predictions: number;
}

export interface ModelInfo {
  model_loaded: boolean;
  required_features: string[];
  feature_descriptions: Record<string, string>;
}

export const api = {
  healthCheck: async (): Promise<{ status: string; model_loaded: boolean }> => {
    try {
      const response = await fetch(`${BASE_URL}/health`);
      if (!response.ok) throw new Error('Health check failed');
      return await response.json();
    } catch (error) {
      console.error('API Health Check Error:', error);
      throw error;
    }
  },

  getModelInfo: async (): Promise<ModelInfo> => {
    const response = await fetch(`${BASE_URL}/model_info`);
    if (!response.ok) throw new Error('Failed to fetch model info');
    return await response.json();
  },

  predict: async (features: PredictionFeatures, userId?: string): Promise<PredictionResponse> => {
    const payload = userId ? { features, user_id: userId } : { features };
    const response = await fetch(`${BASE_URL}/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Prediction failed');
    }

    return await response.json();
  },

  predictCsv: async (file: File, userId?: string): Promise<BatchPredictionResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    if (userId) {
      formData.append('user_id', userId);
    }

    const response = await fetch(`${BASE_URL}/predict_csv`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Batch prediction failed');
    }

    return await response.json();
  },
};
