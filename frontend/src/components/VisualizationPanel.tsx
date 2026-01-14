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
  Layers, 
  Share2, 
  TrendingUp, 
  Zap 
} from 'lucide-react';
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  BarChart, Bar, ReferenceLine, LineChart, Line,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  AreaChart, Area,
  RadialBarChart, RadialBar, Legend
} from 'recharts';

const VisualizationPanel = () => {
  const [activeTab, setActiveTab] = useState('overview');

  // --- MOCK DATA ---
  
  // 1. PCA Data (High Density 
  const generateGaussianData = (count: number, centerX: number, centerY: number, varianceX: number, varianceY: number, type: string) => {
    return Array.from({ length: count }, (_, i) => {
        // Box-Muller transform for normal distribution
        const u = 1 - Math.random();
        const v = Math.random();
        const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
        
        // Second dimension
        const u2 = 1 - Math.random();
        const v2 = Math.random();
        const z2 = Math.sqrt(-2.0 * Math.log(u2)) * Math.cos(2.0 * Math.PI * v2);

        return {
            x: centerX + (z * varianceX),
            y: centerY + (z2 * varianceY),
            z: Math.random(), // unused
            type
        };
    });
  };

  const pcaPoints3D = [
      // Yellow stars (Early PD) - Wide spread, roughly X: [0, 10], Y: [-2, 4]
      ...generateGaussianData(500, 6, 1, 3.5, 1.5, 'Parkinson\'s'),
      
      // Green circles (Healthy) - Tighter cluster, roughly X: [-2, 2], Y: [0, 2]
      ...generateGaussianData(300, 0, 1.5, 1.2, 0.8, 'Healthy'),
  ];
  
  // Legacy points for compatibility if needed (can be removed or kept)
  const pcaPoints = pcaPoints3D; 

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

  // 5. Multi-Waveform Series Data (Accelerometer)
  const waveformSeries = Array.from({ length: 60 }, (_, i) => ({
      name: i,
      fp: Math.sin(i * 0.3) * 30 + 50 + Math.random() * 10,  // False Positive (Pink/Purple)
      tp: Math.sin(i * 0.5) * 20 + 20 + Math.random() * 15, // True Positive (Red)
      tn: 10 + Math.random() * 5,                           // True Negative (Green - Flat)
      fn: Math.sin(i * 0.1) * 5 + 5 + Math.random() * 2,    // False Negative (Cyan - Low)
  }));

  // 6. Tremor Box Plot Data
  const tremorBoxData = [
      { name: 'rel 3', no_tremor: 20, small_tremor: 30, high_tremor: 45 },
      { name: 'rel 4', no_tremor: 15, small_tremor: 12, high_tremor: 8 },
      { name: 'rel 5', no_tremor: 10, small_tremor: 8, high_tremor: 5 },
  ];

  // 7. Gauge Data (Radial Bar)
  const gaugeData = [
    { name: 'Low Risk', value: 100, fill: '#22c55e' },
    { name: 'Medium Risk', value: 100, fill: '#eab308' },
    { name: 'High Risk', value: 85, fill: '#ef4444' }, 
  ];

  // 8. Symptom Profile 3D Scatter Data (Red vs Green)
  const project3D = (x: number, y: number, z: number) => {
    const angle = Math.PI / 6; // 30 degrees
    const scale = 3; 
    const u = (x - y) * Math.cos(angle) * scale;
    const v = ((x + y) * Math.sin(angle) - z) * scale;
    return { x: u, y: v, realX: x, realY: y, realZ: z };
  };

  const generateSymptomData = (count: number, centerX: number, centerY: number, centerZ: number, spread: number, type: string) => {
      return Array.from({ length: count }, (_, i) => {
          const rawX = centerX + (Math.random() - 0.5) * spread;
          const rawY = centerY + (Math.random() - 0.5) * spread;
          const rawZ = centerZ + (Math.random() - 0.5) * spread; // Z is vertical height
          const proj = project3D(rawX, rawY, rawZ);
          return {
              ...proj,
              type
          };
      });
  };

  const symptom3DData = [
      ...generateSymptomData(150, 15, 15, 15, 10, 'Healthy Control'),
      ...generateSymptomData(300, 30, 30, 45, 25, 'PD patient'),
  ];

  // Custom 3D Background Grid Component
  const ThreeDGrid = () => {
    const size = 50;
    const step = 10;
    const lines = [];

    // Floor lines (z=0)
    for (let i = 0; i <= size; i += step) {
        // x-parallel
        const start = project3D(0, i, 0);
        const end = project3D(size, i, 0);
        lines.push(<line key={`f-x-${i}`} x1={start.x} y1={start.y} x2={end.x} y2={end.y} stroke="#e5e7eb" strokeWidth="1" />);
        // y-parallel
        const startY = project3D(i, 0, 0);
        const endY = project3D(i, size, 0);
        lines.push(<line key={`f-y-${i}`} x1={startY.x} y1={startY.y} x2={endY.x} y2={endY.y} stroke="#e5e7eb" strokeWidth="1" />);
    }

    // Back Left Wall (x=0)
    for (let i = 0; i <= size; i += step) {
        // z-parallel (vertical)
        const start = project3D(0, i, 0);
        const end = project3D(0, i, size);
        lines.push(<line key={`l-z-${i}`} x1={start.x} y1={start.y} x2={end.x} y2={end.y} stroke="#e5e7eb" strokeWidth="1" />);
        // y-parallel (horizontal-ish)
        const startY = project3D(0, 0, i);
        const endY = project3D(0, size, i);
        lines.push(<line key={`l-y-${i}`} x1={startY.x} y1={startY.y} x2={endY.x} y2={endY.y} stroke="#e5e7eb" strokeWidth="1" />);
    }
    
     // Back Right Wall (y=0)
    for (let i = 0; i <= size; i += step) {
         // z-parallel (vertical)
        const start = project3D(i, 0, 0);
        const end = project3D(i, 0, size);
        lines.push(<line key={`r-z-${i}`} x1={start.x} y1={start.y} x2={end.x} y2={end.y} stroke="#e5e7eb" strokeWidth="1" />);
        // x-parallel
        const startX = project3D(0, 0, i);
        const endX = project3D(size, 0, i);
        lines.push(<line key={`r-x-${i}`} x1={startX.x} y1={startX.y} x2={endX.x} y2={endX.y} stroke="#e5e7eb" strokeWidth="1" />);
    }

    // Axes Labels (approximated positions)
    const zTop = project3D(0, 0, 55);
    const xEnd = project3D(55, 0, 0);
    const yEnd = project3D(0, 55, 0);

    return (
        <svg style={{ position: 'absolute', top: '50.3%', left: '50%', transform: 'translate(-50%, -50%)', width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }} viewBox="-150 -180 300 360">
            {lines}
            {/* Axes Lines (darker) */}
            <line x1={project3D(0,0,0).x} y1={project3D(0,0,0).y} x2={project3D(50,0,0).x} y2={project3D(50,0,0).y} stroke="#9ca3af" strokeWidth="2" />
            <line x1={project3D(0,0,0).x} y1={project3D(0,0,0).y} x2={project3D(0,50,0).x} y2={project3D(0,50,0).y} stroke="#9ca3af" strokeWidth="2" />
            <line x1={project3D(0,0,0).x} y1={project3D(0,0,0).y} x2={project3D(0,0,50).x} y2={project3D(0,0,50).y} stroke="#9ca3af" strokeWidth="2" />
            
            {/* Labels */}
            <text x={zTop.x} y={zTop.y} textAnchor="middle" fill="#6b7280" fontSize="10">Sleep disorder</text>
            <text x={xEnd.x} y={xEnd.y} textAnchor="start" fill="#6b7280" fontSize="10">Cognitive</text>
            <text x={yEnd.x} y={yEnd.y} textAnchor="end" fill="#6b7280" fontSize="10">Movement</text>
        </svg>
    );
  };

  // --- CUSTOM TOOLTIPS ---

  const CustomTooltipScatter = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="glass-panel p-3 rounded-lg border border-white/10 text-xs shadow-xl backdrop-blur-md bg-black/80">
          <p className="font-bold text-white mb-1">{data.type}</p>
           <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-gray-300">
            <span>Cog:</span> <span className="text-right font-mono">{data.realX ? data.realX.toFixed(1) : data.x.toFixed(1)}</span>
            <span>Mov:</span> <span className="text-right font-mono">{data.realY ? data.realY.toFixed(1) : data.y.toFixed(1)}</span>
            {data.realZ && <><span>Sleep:</span> <span className="text-right font-mono">{data.realZ.toFixed(1)}</span></>}
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
                <Layers className="w-4 h-4 mr-2" /> Multimodal Analysis
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* 1. Review Requested: Replaced Symptom Profile with 3D Scatter Style (Green vs Red) */}
                <Card className="border-border/50 shadow-xl bg-card/50 backdrop-blur-xl hover:shadow-2xl transition-all duration-300 relative overflow-hidden">
                    <CardHeader>
                        <CardTitle className="text-base font-medium flex items-center gap-2">
                            <Activity className="w-4 h-4 text-primary" /> Symptom Space (3D Projection)
                        </CardTitle>
                        <CardDescription>Cognitive vs Movement vs Sleep Disorder</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[350px] flex items-center justify-center relative">
                         {/* THE 3D Background */}
                        <ThreeDGrid />
                        
                        {/* The Data Plot */}
                        <div className="w-full h-full z-10">
                            <ResponsiveContainer width="100%" height="100%">
                                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                    {/* Hide Default Axes */}
                                    <XAxis type="number" dataKey="x" hide domain={[-150, 150]} />
                                    <YAxis type="number" dataKey="y" hide domain={[-150, 150]} />
                                    
                                    <Tooltip content={<CustomTooltipScatter />} cursor={{ strokeDasharray: '3 3' }} />
                                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                                    
                                    {/* PD Patient (Green) */}
                                    <Scatter name="PD patient" data={symptom3DData.filter(d => d.type === 'PD patient')} fill="#008000" fillOpacity={0.6} shape="circle" />
                                    
                                    {/* Healthy Control (Red) */}
                                    <Scatter name="Healthy Control" data={symptom3DData.filter(d => d.type === 'Healthy Control')} fill="#ff0000" fillOpacity={0.6} shape="circle" />
                                    
                                </ScatterChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* 2. Vertical Bar Chart: Key Features */}
                <Card className="border-border/50 shadow-xl bg-card/50 backdrop-blur-xl hover:shadow-2xl transition-all duration-300">
                    <CardHeader>
                        <CardTitle className="text-base font-medium flex items-center gap-2">
                             <BarChart3 className="w-4 h-4 text-blue-500" /> Key Features
                        </CardTitle>
                        <CardDescription>Top contributing biomarkers</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={featureData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <defs>
                                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={1}/>
                                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.6}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                                <Tooltip cursor={{ fill: 'transparent' }} content={<CustomTooltip />} />
                                <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40} fill="url(#barGradient)">
                                     {featureData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={`hsl(var(--primary) / ${0.5 + (index * 0.1)})`} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                
                {/* 3. Radial Bar: Risk Gauge (Preserved but styled) */}
                <Card className="border-border/50 shadow-xl bg-card/50 backdrop-blur-xl hover:shadow-2xl transition-all duration-300">
                    <CardHeader>
                        <CardTitle className="text-base font-medium flex items-center gap-2">
                            <Zap className="w-4 h-4 text-yellow-500" /> Assessment Score
                        </CardTitle>
                        <CardDescription>Overall PD Probability</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[350px] relative flex flex-col items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadialBarChart innerRadius="70%" outerRadius="100%" barSize={20} startAngle={180} endAngle={0} data={gaugeData}>
                                <RadialBar background dataKey="value" cornerRadius={10} />
                            </RadialBarChart>
                        </ResponsiveContainer>
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/3 text-center">
                            <span className="text-6xl font-bold tracking-tighter text-foreground drop-shadow-lg">85%</span>
                            <p className="text-base text-destructive font-medium mt-2">High Probability</p>
                        </div>
                    </CardContent>
                </Card>

                {/* 4. Scatter Plot: Feature Correlation (New) */}
                <Card className="border-border/50 shadow-xl bg-card/50 backdrop-blur-xl hover:shadow-2xl transition-all duration-300">
                    <CardHeader>
                         <CardTitle className="text-base font-medium flex items-center gap-2">
                            <BrainCircuit className="w-4 h-4 text-indigo-500" /> Biomarker Correlation
                         </CardTitle>
                         <CardDescription>Population Distribution Analysis</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                <XAxis type="number" dataKey="x" name="Metric 1" unit="" tick={{ fontSize: 12, opacity: 0.5 }} axisLine={false} tickLine={false}/>
                                <YAxis type="number" dataKey="y" name="Metric 2" unit="" tick={{ fontSize: 12, opacity: 0.5 }} axisLine={false} tickLine={false}/>
                                <Tooltip content={<CustomTooltipScatter />} cursor={{ strokeDasharray: '3 3' }} />
                                <Legend wrapperStyle={{ fontSize: '12px' }}/>
                                <Scatter name="Healthy" data={pcaPoints3D.filter(p => p.type === 'Healthy')} fill="#22c55e" shape="circle" />
                                <Scatter name="PD Group" data={pcaPoints3D.filter(p => p.type === 'Parkinson\'s')} fill="#eab308" shape="triangle" />
                                <Scatter name="Patient" data={pcaPoints3D.filter(p => p.type === 'Current Patient')} fill="#ef4444" shape="star" r={200} />
                            </ScatterChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

            </div>
          </TabsContent>


          {/* TAB 2: VOICE ANALYSIS */}
          <TabsContent value="voice" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {/* 1. Raw Accelerometer / Waveform Analysis */}
                 <Card className="col-span-1 md:col-span-2 border-border/50 shadow-xl bg-card/50 backdrop-blur-xl">
                     <CardHeader>
                         <div className="flex justify-between items-center">
                            <div>
                                 <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                    <Activity className="w-5 h-5 text-purple-500" /> Signal Classification Analysis
                                 </CardTitle>
                                 <CardDescription>Raw accelerometer data showing true/false positive patterns.</CardDescription>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary/50 px-3 py-1 rounded-lg">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Live Feed
                            </div>
                         </div>
                     </CardHeader>
                     <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={waveformSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                                <XAxis dataKey="name" hide />
                                <YAxis hide />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend />
                                <Line type="monotone" dataKey="fp" stroke="#d946ef" strokeWidth={2} dot={false} name="False Positive" />
                                <Line type="monotone" dataKey="tp" stroke="#ef4444" strokeWidth={2} dot={false} name="True Positive" />
                                <Line type="monotone" dataKey="tn" stroke="#22c55e" strokeWidth={2} dot={false} name="True Negative" />
                                <Line type="monotone" dataKey="fn" stroke="#06b6d4" strokeWidth={2} dot={false} name="False Negative" />
                            </LineChart>
                        </ResponsiveContainer>
                     </CardContent>
                 </Card>

                 {/* 2. Box Plot: Tremor Scale Distribution */}
                 <Card className="col-span-1 border-border/50 shadow-xl bg-card/50 backdrop-blur-xl">
                    <CardHeader>
                        <CardTitle className="text-base font-medium flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-blue-500" /> Tremor Scale Distribution
                        </CardTitle>
                        <CardDescription>Relative scale distribution</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={tremorBoxData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                                <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                                <Tooltip cursor={{ fill: 'transparent' }} content={<CustomTooltip />} />
                                <Legend />
                                <Bar dataKey="no_tremor" name="No Tremor" fill="#fbbf24" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="small_tremor" name="Small Tremor" fill="#16a34a" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="high_tremor" name="High Tremor" fill="#2563eb" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                 </Card>

                 {/* 3. Existing Voice Analysis (Smaller) */}
                 <Card className="col-span-1 border-border/50 shadow-xl bg-card/50 backdrop-blur-xl">
                     <CardHeader>
                         <CardTitle className="text-base font-medium flex items-center gap-2">
                            <Layers className="w-4 h-4 text-purple-500" /> Voice Frequency Analysis
                         </CardTitle>
                         <CardDescription>Sustained phonation frequency domain.</CardDescription>
                     </CardHeader>
                     <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={waveData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
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
             </div>
          </TabsContent>

          {/* TAB 3: CLUSTERING (Updated 3D Style) */}
          <TabsContent value="clustering" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="border-border/50 shadow-xl bg-card/50 backdrop-blur-xl">
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                             <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                <BrainCircuit className="w-5 h-5 text-indigo-500" /> 3D Feature Space Projection
                             </CardTitle>
                             <CardDescription>PCA Analysis</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="h-[500px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                      <XAxis type="number" dataKey="x" name="1st Principal Component" unit="" tick={{ fontSize: 12, opacity: 0.5 }} axisLine={false} tickLine={false}/>
                      <YAxis type="number" dataKey="y" name="2nd Principal Component" unit="" tick={{ fontSize: 12, opacity: 0.5 }} axisLine={false} tickLine={false}/>
                      {/* Z-Axis simulation via implied depth and density */}
                      <Tooltip content={<CustomTooltipScatter />} cursor={{ strokeDasharray: '3 3' }} />
                      <Legend wrapperStyle={{ paddingTop: '20px' }}/>
                      
                      {/* Healthy: Green HOLLOW Circles */}
                      <Scatter 
                        name="Healthy Normal" 
                        data={pcaPoints3D.filter(p => p.type === 'Healthy')} 
                        fill="transparent" 
                        stroke="#22c55e" 
                        strokeWidth={2} 
                        shape="circle" 
                      />
                      
                      {/* Early PD: Yellow Stars */}
                      <Scatter 
                        name="Early PD" 
                        data={pcaPoints3D.filter(p => p.type === 'Parkinson\'s')} 
                        fill="#ffff00"  // Bright Yellow
                        shape="star" 
                      />
                      
                    </ScatterChart>
                  </ResponsiveContainer>
                </CardContent>
                 
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 pt-0">
                    <div className="bg-secondary/30 p-4 rounded-xl flex gap-3 items-start border border-border/50">
                        <Info className="h-5 w-5 text-blue-500 mt-0.5" />
                        <div>
                            <h4 className="font-semibold text-sm">Cluster Analysis</h4>
                            <p className="text-xs text-muted-foreground mt-1">Clear separation observed between Healthy (Green) and Early PD (Yellow) clusters.</p>
                        </div>
                    </div>
                    <div className="bg-secondary/30 p-4 rounded-xl flex gap-3 items-start border border-border/50">
                        <TrendingUp className="h-5 w-5 text-green-500 mt-0.5" />
                        <div>
                            <h4 className="font-semibold text-sm">Variance Ratio</h4>
                            <p className="text-xs text-muted-foreground mt-1">First three components explain 92.4% of the total dataset variance.</p>
                        </div>
                    </div>
                    <div className="bg-secondary/30 p-4 rounded-xl flex gap-3 items-start border border-border/50">
                        <Activity className="h-5 w-5 text-purple-500 mt-0.5" />
                        <div>
                            <h4 className="font-semibold text-sm">Outlier Detection</h4>
                            <p className="text-xs text-muted-foreground mt-1">Current patient sample lies within the 95% confidence interval of the PD cluster.</p>
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
