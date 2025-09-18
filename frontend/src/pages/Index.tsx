import React from 'react';
import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import QuestionnaireForm from '@/components/QuestionnaireForm';
import CsvUpload from '@/components/CsvUpload';
import PredictionDisplay from '@/components/PredictionDisplay';
import VisualizationPanel from '@/components/VisualizationPanel';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <HeroSection />
      <QuestionnaireForm />
      <CsvUpload />
      <PredictionDisplay />
      <VisualizationPanel />
    </div>
  );
};

export default Index;
