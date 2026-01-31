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
  db_status?: string;
}

export interface BatchPredictionResponse {
  predictions: any[];
  total_records: number;
  successful_predictions: number;
  failed_predictions: number;
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
  }
};
