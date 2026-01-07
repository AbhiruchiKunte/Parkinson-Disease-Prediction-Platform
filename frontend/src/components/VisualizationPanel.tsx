import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  BarChart3, 
  BrainCircuit, 
  Download, 
  Info, 
  Mic, 
  Share2, 
  TrendingUp, 
  Zap 
} from 'lucide-react';
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  BarChart, Bar, ReferenceLine,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  AreaChart, Area,
  RadialBarChart, RadialBar, Legend
} from 'recharts';

const VisualizationPanel = () => {
  const [activeTab, setActiveTab] = useState('overview');

  // --- MOCK DATA ---
  
  // 1. PCA Data
  const pcaPoints = [
    { x: 0.1, y: 0.3, type: 'Parkinson\'s' }, { x: 0.15, y: 0.45, type: 'Parkinson\'s' },
    { x: 0.22, y: 0.38, type: 'Parkinson\'s' }, { x: 0.35, y: 0.52, type: 'Parkinson\'s' },
    { x: -0.45, y: -0.32, type: 'Healthy' }, { x: -0.38, y: -0.28, type: 'Healthy' },
    { x: -0.41, y: -0.35, type: 'Healthy' }, { x: -0.33, y: -0.31, type: 'Healthy' },
    { x: 0.45, y: 0.62, type: 'Current Patient' }, // The outlier/target
  ];

  // 2. Feature Importance Data
  const featureData = [
    { name: 'Tremor Score', value: 92.5 },
    { name: 'Jitter (Abs)', value: 85.1 },
    { name: 'Bradykinesia', value: 78.9 },
    { name: 'Rigidity', value: 71.3 },
    { name: 'Shimmer (dB)', value: 65.7 },
  ];

  // 3. Radar Data for Symptom Profile
  const radarData = [
    { subject: 'Tremor', A: 120, B: 110, fullMark: 150 },
    { subject: 'Rigidity', A: 98, B: 130, fullMark: 150 },
    { subject: 'Bradykinesia', A: 86, B: 130, fullMark: 150 },
    { subject: 'Gait', A: 99, B: 100, fullMark: 150 },
    { subject: 'Speech', A: 85, B: 90, fullMark: 150 },
    { subject: 'Cognition', A: 65, B: 85, fullMark: 150 },
  ];

  // 4. Waveform Data (Voice Analysis)
  const waveData = Array.from({ length: 50 }, (_, i) => ({
    name: i,
    uv: Math.abs(Math.sin(i * 0.2) * 50 + Math.random() * 20),
    pv: Math.abs(Math.sin(i * 0.25) * 40 + Math.random() * 15),
  }));

  // 5. Gauge Data (Radial Bar)
  const gaugeData = [
    { name: 'Low Risk', value: 100, fill: '#22c55e' },
    { name: 'Medium Risk', value: 100, fill: '#eab308' },
    { name: 'High Risk', value: 85, fill: '#ef4444' }, // 85% filled
  ];

  // --- CUSTOM TOOLTIPS ---

  const CustomTooltipScatter = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="glass-panel p-3 rounded-lg border border-white/10 text-xs shadow-xl backdrop-blur-md bg-black/80">
          <p className="font-bold text-white mb-1">{data.type}</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-gray-300">
            <span>PC1:</span> <span className="text-right font-mono">{data.x}</span>
            <span>PC2:</span> <span className="text-right font-mono">{data.y}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover/90 backdrop-blur-sm border border-border p-3 rounded-xl shadow-xl text-sm">
          <p className="font-semibold mb-1 text-popover-foreground">{label}</p>
          {payload.map((p: any, idx: number) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
              <span className="text-muted-foreground capitalize">{p.name === 'uv' ? 'Patient' : p.name === 'pv' ? 'Healthy' : p.name}:</span>
              <span className="font-mono font-medium text-foreground">{Math.round(p.value)}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <section className="py-12 relative overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] -z-10" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-[80px] -z-10" />

      <div className="container mx-auto px-4">
        <div className="text-center mb-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-2">
            <Activity className="w-3 h-3" /> Advanced Analytics
          </div>
          <h2 className="text-4xl font-bold tracking-tight text-foreground">
            Clinical Insights & <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600">Visualization</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Interactive multidimensional analysis of patient biomarkers and voice patterns.
          </p>
        </div>

        <Tabs defaultValue="overview" className="max-w-7xl mx-auto" onValueChange={setActiveTab}>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
            <TabsList className="grid grid-cols-3 w-full sm:w-auto p-1 bg-muted/30 backdrop-blur-sm border border-border/50 rounded-2xl h-auto">
              <TabsTrigger value="overview" className="rounded-xl py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-lg transition-all duration-300">
                <BrainCircuit className="w-4 h-4 mr-2" /> Overview
              </TabsTrigger>
              <TabsTrigger value="voice" className="rounded-xl py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-lg transition-all duration-300">
                <Mic className="w-4 h-4 mr-2" /> Voice Analysis
              </TabsTrigger>
              <TabsTrigger value="clustering" className="rounded-xl py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-lg transition-all duration-300">
                <TrendingUp className="w-4 h-4 mr-2" /> Clustering
              </TabsTrigger>
            </TabsList>

            <div className="flex gap-2">
                <Button variant="outline" size="sm" className="hidden sm:flex items-center gap-2 rounded-xl backdrop-blur-sm bg-background/50">
                    <Share2 className="w-4 h-4" /> Share
                </Button>
                <Button variant="default" size="sm" className="items-center gap-2 rounded-xl shadow-lg shadow-primary/20">
                    <Download className="w-4 h-4" /> Export Report
                </Button>
            </div>
          </div>

          {/* TAB 1: OVERVIEW - DASHBOARD STYLE */}
          <TabsContent value="overview" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* 1. Radar Chart: Symptom Profile */}
                <Card className="lg:col-span-1 border-border/50 shadow-xl bg-card/50 backdrop-blur-xl">
                    <CardHeader>
                        <CardTitle className="text-base font-medium flex items-center gap-2">
                            <Activity className="w-4 h-4 text-primary" /> Symptom Profile
                        </CardTitle>
                        <CardDescription>Patient vs Typical PD Profile</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px] flex items-center justify-center -ml-6">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart outerRadius={90} data={radarData}>
                                <PolarGrid stroke="currentColor" strokeOpacity={0.1} />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: 'currentColor', opacity: 0.6, fontSize: 11 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 150]} stroke="transparent" />
                                <Radar name="Typical PD" dataKey="B" stroke="hsl(var(--primary))" strokeOpacity={0.5} fill="hsl(var(--primary))" fillOpacity={0.1} />
                                <Radar name="Current Patient" dataKey="A" stroke="hsl(var(--destructive))" strokeWidth={2} fill="hsl(var(--destructive))" fillOpacity={0.3} />
                                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                                <Tooltip content={<CustomTooltip />} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* 2. Radial Bar: Risk Gauge */}
                <Card className="lg:col-span-1 border-border/50 shadow-xl bg-card/50 backdrop-blur-xl">
                    <CardHeader>
                        <CardTitle className="text-base font-medium flex items-center gap-2">
                            <Zap className="w-4 h-4 text-yellow-500" /> Assessment Score
                        </CardTitle>
                        <CardDescription>Overall PD Probability</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px] relative flex flex-col items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadialBarChart innerRadius="70%" outerRadius="100%" barSize={15} startAngle={180} endAngle={0} data={gaugeData}>
                                <RadialBar background dataKey="value" cornerRadius={10} />
                            </RadialBarChart>
                        </ResponsiveContainer>
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/3 text-center">
                            <span className="text-5xl font-bold tracking-tighter text-foreground">85%</span>
                            <p className="text-sm text-destructive font-medium mt-1">High Probability</p>
                        </div>
                    </CardContent>
                </Card>

                {/* 3. Feature Importance Bar */}
                <Card className="lg:col-span-1 border-border/50 shadow-xl bg-card/50 backdrop-blur-xl">
                    <CardHeader>
                        <CardTitle className="text-base font-medium flex items-center gap-2">
                             <BarChart3 className="w-4 h-4 text-blue-500" /> Key Features
                        </CardTitle>
                        <CardDescription>Top contributing biomarkers</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart layout="vertical" data={featureData} margin={{ left: 20, right: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} strokeOpacity={0.1} />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11, fill: 'currentColor', opacity: 0.7 }} axisLine={false} tickLine={false} />
                                <Tooltip cursor={{ fill: 'transparent' }} content={<CustomTooltip />} />
                                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                                    {featureData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={`hsl(var(--primary) / ${0.4 + (index * 0.15)})`} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
          </TabsContent>

          {/* TAB 2: VOICE ANALYSIS */}
          <TabsContent value="voice" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <Card className="border-border/50 shadow-xl bg-card/50 backdrop-blur-xl">
                 <CardHeader>
                     <div className="flex justify-between items-center">
                        <div>
                             <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                <Mic className="w-5 h-5 text-purple-500" /> Voice Frequency Analysis
                             </CardTitle>
                             <CardDescription>Real-time frequency domain representation of patient's sustained phonation.</CardDescription>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary/50 px-3 py-1 rounded-lg">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Live Input
                        </div>
                     </div>
                 </CardHeader>
                 <CardContent className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={waveData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="colorPv" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="name" hide />
                            <YAxis hide />
                            <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                            <Tooltip content={<CustomTooltip label="Frequency Magnitude" />} />
                            <Area type="monotone" dataKey="uv" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorUv)" />
                            <Area type="monotone" dataKey="pv" stroke="#8884d8" strokeWidth={2} strokeDasharray="5 5" fillOpacity={1} fill="url(#colorPv)" />
                        </AreaChart>
                    </ResponsiveContainer>
                 </CardContent>
             </Card>
          </TabsContent>

          {/* TAB 3: CLUSTERING (Existing Optimized) */}
          <TabsContent value="clustering" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="border-border/50 shadow-xl bg-card/50 backdrop-blur-xl">
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                             <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                <BrainCircuit className="w-5 h-5 text-indigo-500" /> Principal Component Analysis (PCA)
                             </CardTitle>
                             <CardDescription>Dimensionality reduction showing patient separation.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="h-[500px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                      <XAxis type="number" dataKey="x" name="PC1" unit="" tick={{ fontSize: 12, opacity: 0.5 }} axisLine={false} tickLine={false}/>
                      <YAxis type="number" dataKey="y" name="PC2" unit="" tick={{ fontSize: 12, opacity: 0.5 }} axisLine={false} tickLine={false}/>
                      <Tooltip content={<CustomTooltipScatter />} cursor={{ strokeDasharray: '3 3' }} />
                      <Legend wrapperStyle={{ paddingTop: '20px' }}/>
                      <ReferenceLine y={0} stroke="currentColor" strokeOpacity={0.1} />
                      <ReferenceLine x={0} stroke="currentColor" strokeOpacity={0.1} />
                      
                      <Scatter name="Healthy Controls" data={pcaPoints.filter(p => p.type === 'Healthy')} fill="#22c55e" shape="circle" />
                      <Scatter name="Parkinson's Patients" data={pcaPoints.filter(p => p.type === 'Parkinson\'s')} fill="#eab308" shape="circle" />
                      <Scatter name="Current Patient" data={pcaPoints.filter(p => p.type === 'Current Patient')} fill="#ef4444" shape="star" r={200} />
                    </ScatterChart>
                  </ResponsiveContainer>
                </CardContent>
                 
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 pt-0">
                    <div className="bg-secondary/30 p-4 rounded-xl flex gap-3 items-start border border-border/50">
                        <Info className="h-5 w-5 text-blue-500 mt-0.5" />
                        <div>
                            <h4 className="font-semibold text-sm">Cluster Analysis</h4>
                            <p className="text-xs text-muted-foreground mt-1">Patient data point aligns with the PD cluster centroid with 92% confidence.</p>
                        </div>
                    </div>
                    <div className="bg-secondary/30 p-4 rounded-xl flex gap-3 items-start border border-border/50">
                        <TrendingUp className="h-5 w-5 text-green-500 mt-0.5" />
                        <div>
                            <h4 className="font-semibold text-sm">Separation Index</h4>
                            <p className="text-xs text-muted-foreground mt-1">Silhouette score of 0.72 indicates strong separation between healthy and PD clusters.</p>
                        </div>
                    </div>
                    <div className="bg-secondary/30 p-4 rounded-xl flex gap-3 items-start border border-border/50">
                        <Activity className="h-5 w-5 text-purple-500 mt-0.5" />
                        <div>
                            <h4 className="font-semibold text-sm">Variance Explained</h4>
                            <p className="text-xs text-muted-foreground mt-1">PC1 and PC2 account for 85% of total dataset variance.</p>
                        </div>
                    </div>
                 </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
};

export default VisualizationPanel;
