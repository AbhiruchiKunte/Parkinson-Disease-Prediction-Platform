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

export interface AudioPredictionResponse {
  prediction_label: "Normal" | "Parkinson" | string;
  prediction_confidence: number;
  pd_probability: number;
  prediction_status?: string;
  feature_means?: {
    mfcc_mean: number;
    delta_mean: number;
    delta2_mean: number;
  };
  waveform_preview?: number[];
  generated_at?: string;
  db_status?: string;
}

export interface VideoPredictionResponse {
  prediction_label: "Normal" | "Parkinson" | string;
  prediction_confidence: number;
  pd_probability: number;
  prediction_status?: string;
  analysis_method?: string;
  details?: string;
  distance_to_pd_template?: number;
  distance_to_normal_template?: number;
  video_features?: Record<string, number>;
  tremor_series?: { t: string; mag: number }[];
  gait_metrics?: { name: string; value: number; fill?: string }[];
  posture_radar?: { subject: string; A: number; fullMark?: number }[];
  generated_at?: string;
  db_status?: string;
}

export interface AudioHistoryEntry {
  created_at: string;
  filename: string;
  prediction_label: string;
  prediction_confidence: number;
  pd_probability: number;
  feature_means: {
    mfcc_mean: number;
    delta_mean: number;
    delta2_mean: number;
  };
  waveform_preview: number[];
}

export interface AudioHistoryResponse {
  entries: AudioHistoryEntry[];
  summary: {
    total: number;
    normal: number;
    parkinson: number;
    average_confidence: number;
  };
  daily_trend: { date: string; count: number }[];
}

export interface VideoHistoryEntry {
  created_at: string;
  filename: string;
  prediction_label: string;
  prediction_confidence: number;
  pd_probability: number;
  gait_metrics: { name: string; value: number }[];
  distance_to_pd_template?: number;
  distance_to_normal_template?: number;
}

export interface VideoHistoryResponse {
  entries: VideoHistoryEntry[];
  summary: {
    total: number;
    normal: number;
    parkinson: number;
    average_confidence: number;
  };
  daily_trend: { date: string; count: number }[];
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

export interface AnalyticsAggregateResponse {
  symptom_3d: { realX: number; realY: number; realZ: number; type: string }[];
  feature_data: { name: string; value: number }[];
  overall_probability: number;
  correlation_data: { x: number; y: number; type: string }[];
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

  predictAudio: async (file: File, userId?: string): Promise<AudioPredictionResponse> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (userId) {
        formData.append('user_id', userId);
      }
      
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

  predictVideo: async (file: File, userId?: string): Promise<VideoPredictionResponse> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (userId) {
        formData.append('user_id', userId);
      }

      const response = await axios.post(`${API_Base}/predict_video`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error("Video analysis error:", error);
      throw error;
    }
  },

  getAudioHistory: async (userId?: string): Promise<AudioHistoryResponse> => {
    try {
      const response = await axios.get(`${API_Base}/audio_history`, {
        params: userId ? { user_id: userId } : {},
      });
      return response.data;
    } catch (error) {
      console.error("Audio history error:", error);
      throw error;
    }
  },

  getVideoHistory: async (userId?: string): Promise<VideoHistoryResponse> => {
    try {
      const response = await axios.get(`${API_Base}/video_history`, {
        params: userId ? { user_id: userId } : {},
      });
      return response.data;
    } catch (error) {
      console.error("Video history error:", error);
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
  },

  getAnalyticsAggregate: async (): Promise<AnalyticsAggregateResponse> => {
    try {
      const response = await axios.get(`${API_Base}/analytics_aggregate`);
      return response.data;
    } catch (error) {
      console.error("Analytics aggregate error:", error);
      throw error;
    }
  },

  getTrainingLogs: async () => {
    try {
      const response = await axios.get(`${API_Base}/training_logs`);
      return response.data;
    } catch (error) {
      console.error("Training logs error:", error);
      return [];
    }
  }
};

