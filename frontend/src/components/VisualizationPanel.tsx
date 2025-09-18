import React, { useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, TrendingUp, Download } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ScatterController,
} from 'chart.js';
import { Chart } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ScatterController
);

const VisualizationPanel = () => {
  // Mock PCA data
  const pcaData = {
    datasets: [
      {
        label: 'Current Patient',
        data: [{ x: 0.45, y: 0.62 }],
        backgroundColor: 'hsl(0 84% 60%)',
        borderColor: 'hsl(0 84% 60%)',
        pointRadius: 12,
        pointHoverRadius: 15,
      },
      {
        label: 'Parkinson\'s Patients',
        data: [
          { x: 0.1, y: 0.3 }, { x: 0.15, y: 0.45 }, { x: 0.22, y: 0.38 },
          { x: 0.35, y: 0.52 }, { x: 0.28, y: 0.41 }, { x: 0.42, y: 0.58 },
          { x: 0.38, y: 0.65 }, { x: 0.31, y: 0.48 }, { x: 0.47, y: 0.61 },
          { x: 0.33, y: 0.44 }, { x: 0.39, y: 0.56 }, { x: 0.26, y: 0.39 },
        ],
        backgroundColor: 'hsl(38 92% 50% / 0.6)',
        borderColor: 'hsl(38 92% 50%)',
        pointRadius: 6,
        pointHoverRadius: 8,
      },
      {
        label: 'Healthy Controls',
        data: [
          { x: -0.45, y: -0.32 }, { x: -0.38, y: -0.28 }, { x: -0.41, y: -0.35 },
          { x: -0.33, y: -0.31 }, { x: -0.47, y: -0.39 }, { x: -0.29, y: -0.26 },
          { x: -0.52, y: -0.43 }, { x: -0.36, y: -0.33 }, { x: -0.44, y: -0.37 },
          { x: -0.31, y: -0.29 }, { x: -0.48, y: -0.41 }, { x: -0.35, y: -0.32 },
        ],
        backgroundColor: 'hsl(142 76% 36% / 0.6)',
        borderColor: 'hsl(142 76% 36%)',
        pointRadius: 6,
        pointHoverRadius: 8,
      },
    ],
  };

  const featureImportanceData = {
    labels: ['Tremor Score', 'Jitter', 'Bradykinesia', 'Rigidity', 'Shimmer', 'Handwriting'],
    datasets: [
      {
        label: 'Feature Importance (%)',
        data: [92.5, 85.1, 78.9, 71.3, 65.7, 58.2],
        backgroundColor: [
          'hsl(210 100% 50% / 0.8)',
          'hsl(210 100% 55% / 0.8)',
          'hsl(210 100% 60% / 0.8)',
          'hsl(210 100% 65% / 0.8)',
          'hsl(210 100% 70% / 0.8)',
          'hsl(210 100% 75% / 0.8)',
        ],
        borderColor: 'hsl(210 100% 50%)',
        borderWidth: 2,
      },
    ],
  };

  const pcaOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'PCA Analysis - Patient Positioning',
      },
    },
    scales: {
      x: {
        type: 'linear' as const,
        position: 'bottom' as const,
        title: {
          display: true,
          text: 'Principal Component 1',
        },
        min: -0.7,
        max: 0.7,
      },
      y: {
        title: {
          display: true,
          text: 'Principal Component 2',
        },
        min: -0.6,
        max: 0.8,
      },
    },
  };

  const barOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Feature Importance Ranking',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: 'Importance (%)',
        },
      },
    },
  };

  const exportChart = (type: string) => {
    // Mock export functionality
    console.log(`Exporting ${type} chart...`);
  };

  return (
    <section className="py-16 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">Data Visualization</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Interactive charts and plots providing insights into the analysis results and patient positioning.
          </p>
        </div>

        <Card className="max-w-6xl mx-auto shadow-elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Clinical Data Analysis
            </CardTitle>
            <CardDescription>
              Visual representation of feature importance and patient clustering analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <Tabs defaultValue="pca" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="pca" className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  PCA Plot
                </TabsTrigger>
                <TabsTrigger value="features" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Feature Analysis
                </TabsTrigger>
              </TabsList>

              <TabsContent value="pca" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Principal Component Analysis</h3>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => exportChart('PCA')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
                
                <div className="bg-card rounded-lg p-6 shadow-card">
                  <div className="h-96">
                    <Chart
                      type="scatter"
                      data={pcaData}
                      options={pcaOptions}
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4 mt-6">
                  <Card className="p-4">
                    <h4 className="font-semibold text-sm mb-2">Patient Position</h4>
                    <p className="text-xs text-muted-foreground">
                      Current patient clusters with Parkinson's group, indicating elevated risk factors.
                    </p>
                  </Card>
                  <Card className="p-4">
                    <h4 className="font-semibold text-sm mb-2">Separation Quality</h4>
                    <p className="text-xs text-muted-foreground">
                      Clear separation between healthy controls and Parkinson's patients visible.
                    </p>
                  </Card>
                  <Card className="p-4">
                    <h4 className="font-semibold text-sm mb-2">Clinical Interpretation</h4>
                    <p className="text-xs text-muted-foreground">
                      Position suggests early-stage presentation requiring clinical follow-up.
                    </p>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="features" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Feature Importance Analysis</h3>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => exportChart('Features')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
                
                <div className="bg-card rounded-lg p-6 shadow-card">
                  <div className="h-96">
                    <Chart
                      type="bar"
                      data={featureImportanceData}
                      options={barOptions}
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6 mt-6">
                  <Card className="p-6">
                    <h4 className="font-semibold mb-4">Top Contributors</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm">Tremor Score</span>
                        <span className="text-sm font-medium text-primary">92.5%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Jitter</span>
                        <span className="text-sm font-medium text-primary">85.1%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Bradykinesia</span>
                        <span className="text-sm font-medium text-primary">78.9%</span>
                      </div>
                    </div>
                  </Card>
                  
                  <Card className="p-6">
                    <h4 className="font-semibold mb-4">Clinical Insights</h4>
                    <ul className="text-sm space-y-2 text-muted-foreground">
                      <li>• Motor symptoms show highest predictive value</li>
                      <li>• Voice analysis contributes significantly</li>
                      <li>• Combined features improve accuracy</li>
                      <li>• Handwriting analysis provides additional context</li>
                    </ul>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default VisualizationPanel;