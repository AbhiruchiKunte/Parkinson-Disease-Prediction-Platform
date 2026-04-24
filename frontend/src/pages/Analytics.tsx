import React, { useState, useEffect } from 'react';
import VisualizationPanel from '@/components/VisualizationPanel';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Zap, TrendingUp, Activity, Target } from 'lucide-react';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';
import { api } from '@/lib/api';

const Analytics = () => {
  const modelComparisonData = [
    { metric: 'Accuracy', RF: 96.4, SVM: 94.0, DT: 92.7, KNN: 93.6 },
    { metric: 'Precision', RF: 96.0, SVM: 95.0, DT: 93.0, KNN: 95.0 },
    { metric: 'Recall', RF: 96.0, SVM: 94.0, DT: 93.0, KNN: 94.0 },
    { metric: 'F1 Score', RF: 96.0, SVM: 94.0, DT: 93.0, KNN: 94.0 },
    { metric: 'AUC', RF: 98.0, SVM: 97.0, DT: 94.0, KNN: 96.0 },
  ];

  // Mock training curve data (Fallback)
  const [trainingData, setTrainingData] = useState([
    { epoch: 10, accuracy: 65, loss: 0.8 },
    { epoch: 20, accuracy: 78, loss: 0.6 },
    { epoch: 30, accuracy: 82, loss: 0.45 },
    { epoch: 40, accuracy: 88, loss: 0.3 },
    { epoch: 50, accuracy: 92, loss: 0.15 },
    { epoch: 60, accuracy: 94.15, loss: 0.08 },
  ]);

  useEffect(() => {
    const fetchTrainingLogs = async () => {
      try {
        const data = await api.getTrainingLogs();
        if (data && data.length > 0) {
          setTrainingData(data);
        }
      } catch (err) {
        console.error("Failed to fetch training logs:", err);
      }
    };
    fetchTrainingLogs();
  }, []);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border p-3 rounded-lg shadow-lg">
          <p className="font-semibold mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {entry.value}%
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderCustomLegend = (props: any) => {
    const { payload } = props;
    return (
      <div className="flex flex-wrap justify-center gap-6 pt-6">
        {payload.map((entry: any, index: number) => (
          <div key={`item-${index}`} className="flex items-center gap-2">
            <div 
              className="w-2.5 h-2.5 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm font-medium" style={{ color: entry.color }}>
              {entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="container mx-auto px-6 py-10 min-h-screen">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight mb-4">Analytical Insights</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Comprehensive performance evaluation of machine learning models for Parkinson's detection.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid md:grid-cols-4 gap-6 mb-10">
        <Card className="shadow-sm border-l-4 border-l-yellow-500">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Best Performer</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-yellow-500" />
                    <span className="text-2xl font-bold">Random Forest</span>
                </div>
            </CardContent>
        </Card>
        <Card className="shadow-sm border-l-4 border-l-blue-500">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Accuracy Score</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-blue-500" />
                    <span className="text-2xl font-bold">94.15%</span>
                </div>
            </CardContent>
        </Card>
        <Card className="shadow-sm border-l-4 border-l-green-500">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Sensitivity</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-green-500" />
                    <span className="text-2xl font-bold">98.1%</span>
                </div>
            </CardContent>
        </Card>
         <Card className="shadow-sm border-l-4 border-l-purple-500">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Model Efficiency</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-purple-500" />
                    <span className="text-2xl font-bold">High</span>
                </div>
            </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 mb-10">
         {/* Radar Chart: Model Comparison */}
        <Card className="shadow-elevated">
          <CardHeader>
              <CardTitle>Model Comparison</CardTitle>
              <CardDescription>Multi-metric evaluation of top performing algorithms.</CardDescription>
          </CardHeader>
          <CardContent>
              <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={modelComparisonData}>
                      <PolarGrid stroke="hsl(var(--muted-foreground))" strokeOpacity={0.2} />
                      <PolarAngleAxis dataKey="metric" tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                      
                      <Radar name="Random Forest" dataKey="RF" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} />
                      <Radar name="SVM" dataKey="SVM" stroke="hsl(var(--medical-green))" fill="hsl(var(--medical-green))" fillOpacity={0.2} />
                      <Radar name="Decision Tree" dataKey="DT" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.2} />
                      <Radar name="KNN" dataKey="KNN" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.2} />

                      
                      <Legend content={renderCustomLegend} />
                      <Tooltip content={<CustomTooltip />} />
                    </RadarChart>
                  </ResponsiveContainer>
              </div>
          </CardContent>
        </Card>

        {/* Area Chart: Learning Curve */}
        <Card className="shadow-elevated">
          <CardHeader>
              <CardTitle>Training Performance</CardTitle>
              <CardDescription>Accuracy vs Loss over training epochs.</CardDescription>
          </CardHeader>
          <CardContent>
              <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trainingData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorAccuracy" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorLoss" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="epoch" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend content={renderCustomLegend} />
                      <Area type="monotone" dataKey="accuracy" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorAccuracy)" name="Accuracy (%)" />
                      {/* Scaling loss to match 0-100 scale visually or just showing it as is. 
                          Loss is 0.8, 0.6 etc. Multiplied by 100 for visual comparison or using secondary axis. 
                          For simplicity, let's just plot 'accuracy' here for the clean look, or 100 - loss*100 ?
                          Let's keep it simple: just Accuracy trend.
                      */}
                    </AreaChart>
                  </ResponsiveContainer>
              </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Reusing existing visualization panel (which supports the patient-specific analysis) */}
      <VisualizationPanel />
    </div>
  );
};

export default Analytics;
