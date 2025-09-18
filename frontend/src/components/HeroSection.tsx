import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Activity, FileSpreadsheet, BarChart3, Shield } from 'lucide-react';

const HeroSection = () => {
  return (
    <section className="py-16 bg-gradient-hero">
      <div className="container mx-auto px-4">
        <div className="text-center text-white mb-12">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Advanced Parkinson's Detection
          </h1>
          <p className="text-xl md:text-2xl mb-8 opacity-90 max-w-3xl mx-auto">
            AI-powered analysis for early detection and stage classification of Parkinson's disease
            using comprehensive biomarker assessment.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
  <Button size="lg" variant="secondary" className="shadow-elevated">
    Start Assessment
  </Button>
  <Button size="lg" variant="secondary" className="shadow-elevated">
    Upload Dataset
  </Button>
</div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
  <Card className="bg-white/20 border-white/30 backdrop-blur-sm hover:bg-white/30 transition">
    <CardContent className="p-6 text-center text-white">
      <Activity className="h-12 w-12 mx-auto mb-4 text-medical-green" />
      <h3 className="text-lg font-semibold mb-2">Clinical Assessment</h3>
      <p className="text-sm opacity-90">
        Comprehensive questionnaire covering tremor, rigidity, and motor symptoms
      </p>
    </CardContent>
  </Card>

  <Card className="bg-white/20 border-white/30 backdrop-blur-sm hover:bg-white/30 transition">
    <CardContent className="p-6 text-center text-white">
      <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-medical-orange" />
      <h3 className="text-lg font-semibold mb-2">Batch Processing</h3>
      <p className="text-sm opacity-90">
        Upload patient datasets for large-scale analysis and screening
      </p>
    </CardContent>
  </Card>

  <Card className="bg-white/20 border-white/30 backdrop-blur-sm hover:bg-white/30 transition">
    <CardContent className="p-6 text-center text-white">
      <BarChart3 className="h-12 w-12 mx-auto mb-4 text-medical-blue" />
      <h3 className="text-lg font-semibold mb-2">Visual Analytics</h3>
      <p className="text-sm opacity-90">
        Interactive PCA plots and feature analysis for clinical insights
      </p>
    </CardContent>
  </Card>
</div>

      </div>
    </section>
  );
};

export default HeroSection;