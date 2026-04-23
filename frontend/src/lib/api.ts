import axios from 'axios';

const API_Base = 'http://127.0.0.1:5000';

export interface PredictionResponse {
  pd_probability: number;
  pd_probability_rf: number;
  pd_probability_svm: number;
  pd_probability_knn: number;
  pd_probability_dt: number;
  stage_probs: {
    early: number;
    mid: number;
    late: number;
  };
  top_features: { name: string; value: number }[];
  prediction_status: string;
  insights?: string[];
  insight_source?: string;
  generated_at?: string;
  db_status?: string;
}

export interface BatchPredictionResponse {
  predictions: any[];
  total_records: number;
  successful_predictions: number;
  failed_predictions: number;
}

export interface HealthCheckResponse {
  status: string;
  model_loaded: boolean;
  message?: string;
}

export interface DashboardTrendPoint {
  date: string;
  clinical: number;
  batch: number;
  total: number;
  detected: number;
}

export interface DashboardRiskDistribution {
  low: number;
  moderate: number;
  high: number;
}

export interface DashboardTopFeature {
  name: string;
  score: number;
  mentions: number;
}

export interface DashboardBatchRun {
  created_at: string;
  filename: string;
  total_records: number;
  successful_predictions: number;
  failed_predictions: number;
  status: string;
}

export interface DashboardSummaryResponse {
  kpis: {
    clinical_assessments: number;
    batch_predictions: number;
    total_predictions: number;
    pd_detected: number;
    detection_rate: number;
    week_over_week_change_percent: number;
  };
  today: {
    date: string;
    total_predictions: number;
    pd_detected: number;
  };
  risk_distribution: DashboardRiskDistribution;
  daily_trend: DashboardTrendPoint[];
  top_features: DashboardTopFeature[];
  recent_batch_runs: DashboardBatchRun[];
  insights: string[];
  insight_source: string;
  last_updated: string;
}

export const api = {
  predict: async (data: any, userId?: string) => {
    try {
      const payload = userId ? { features: data, user_id: userId } : { features: data };
      const response = await axios.post(`${API_Base}/predict`, payload);
      return response.data;
    } catch (error) {
      console.error("Prediction error:", error);
      throw error;
    }
  },

  predictCsv: async (file: File, userId?: string) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (userId) {
        formData.append('user_id', userId);
      }
      
      const response = await axios.post(`${API_Base}/predict_csv`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
       console.error("Batch prediction error:", error);
       throw error;
    }
  },

  parseFile: async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await axios.post(`${API_Base}/parse_file`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
       console.error("File parse error:", error);
       throw error;
    }
  },

  predictAudio: async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await axios.post(`${API_Base}/predict_audio`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error("Audio analysis error:", error);
      throw error;
    }
  },

  getBenchmarks: async () => {
    try {
      const response = await axios.get(`${API_Base}/benchmarks`);
      return response.data;
    } catch (error) {
      console.error("Benchmarks error:", error);
      return []; // Return empty array on error
    }
  },

  healthCheck: async (): Promise<HealthCheckResponse> => {
    try {
      const response = await axios.get(`${API_Base}/health`);
      return response.data;
    } catch (error) {
      console.error("Health check error:", error);
      throw error;
    }
  },

  getDashboardSummary: async (userId?: string): Promise<DashboardSummaryResponse> => {
    try {
      const response = await axios.get(`${API_Base}/dashboard/summary`, {
        params: userId ? { user_id: userId } : {},
      });
      return response.data;
    } catch (error) {
      console.error("Dashboard summary error:", error);
      throw error;
    }
  }
};
