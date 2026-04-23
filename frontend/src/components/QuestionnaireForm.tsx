import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext'; // Import useAuth
import { Activity, User, HandMetal, Mic, Sparkles, Download } from 'lucide-react';
import { api, PredictionResponse } from '@/lib/api';
import { Brain } from 'lucide-react';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  ResponsiveContainer, RadialBarChart, RadialBar, Legend, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell, AreaChart, Area,
  ScatterChart, Scatter, PieChart, Pie, ComposedChart, Line, ReferenceLine
} from 'recharts';

interface FormData {
  age: number | '';
  tremor_score: number;
  handwriting_score: number;
  jitter_local: number;
  shimmer_local: number;
  bradykinesia: number;
  rigidity: number;
}

const INITIAL_STATE: FormData = {
  age: '',
  tremor_score: 0,
  handwriting_score: 0,
  jitter_local: 0,
  shimmer_local: 0,
  bradykinesia: 0,
  rigidity: 0,
};

const getRiskAnalysis = (probability: number) => {
  const score = probability * 100;
  if (score < 35) {
    return {
      level: 'Low',
      color: '#22c55e', // Green
      title: 'Healthy Profile',
      description: "The assessment indicates a healthy profile. No significant markers associated with Parkinson's disease were detected. Maintain a healthy lifestyle."
    };
  } else if (score < 65) {
    return {
      level: 'Moderate',
      color: '#f59e0b', // Amber
      title: 'Moderate Risk Indicators',
      description: "Some markers suggest a potential risk. While not definitive, it is advisable to monitor symptoms and consult a healthcare provider for a routine checkup."
    };
  } else {
    return {
      level: 'High',
      color: '#ef4444', // Red
      title: 'High Risk Detected',
      description: "The assessment suggests significant markers associated with Parkinson's disease. Immediate clinical consultation is strongly recommended for further evaluation."
    };
  }
};

const QuestionnaireForm = () => {
  const { toast } = useToast();
  const { user } = useAuth(); // Get user from AuthContext
  const [formData, setFormData] = useState<FormData>(INITIAL_STATE);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [benchmarks, setBenchmarks] = useState<any[]>([]);

  React.useEffect(() => {
    // Load benchmarks on mount
    api.getBenchmarks().then(data => {
        if (Array.isArray(data)) {
            setBenchmarks(data);
        }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.age === '' || Number(formData.age) < 18) {
         toast({
            title: "Invalid Input",
            description: "Please enter a valid age (minimum 18).",
            variant: "destructive",
          });
          return;
    }

    setIsLoading(true);

    try {
      const apiData = {
        age: Number(formData.age),
        tremor_score: formData.tremor_score,
        handwriting_score: formData.handwriting_score,
        jitter_local: formData.jitter_local / 100, // Convert % to absolute
        shimmer_local: formData.shimmer_local / 100, 
        bradykinesia: formData.bradykinesia,
        rigidity: formData.rigidity
      };

      const response = await api.predict(apiData, user?.id); // Pass user.id
      setResult(response);
      
      if (response.db_status && response.db_status.startsWith('failed')) {
          toast({
            title: "Analysis Complete (Not Saved)",
            description: "Prediction ready, but failed to save to history.",
            variant: "destructive",
          });
      } else {
        toast({
            title: "Assessment Complete",
            description: "Analysis processed successfully.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process assessment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormData = (field: keyof FormData, value: number | string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleReset = () => {
    setResult(null);
    setFormData(INITIAL_STATE);
  };

  const csvEscape = (value: any) => {
    const str = String(value ?? '');
    if (/[",\n]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const downloadAssessmentReport = () => {
    if (!result) {
      toast({
        title: "No Report Available",
        description: "Analyze an assessment first to download a report.",
        variant: "destructive",
      });
      return;
    }

    try {
      const generatedAt = new Date();
      const summaryRows = [
        ['Report Generated At', generatedAt.toISOString()],
        ['Assessment Generated At', result.generated_at || ''],
        ['Risk Probability (%)', (result.pd_probability * 100).toFixed(2)],
        ['Prediction Status', result.prediction_status || (result.pd_probability >= 0.5 ? 'High Risk' : 'Low Risk')],
        ['RF Probability (%)', ((result.pd_probability_rf || 0) * 100).toFixed(2)],
        ['SVM Probability (%)', ((result.pd_probability_svm || 0) * 100).toFixed(2)],
        ['KNN Probability (%)', ((result.pd_probability_knn || 0) * 100).toFixed(2)],
        ['DT Probability (%)', ((result.pd_probability_dt || 0) * 100).toFixed(2)],
        ['Insight Source', result.insight_source || ''],
        [],
      ];

      const inputHeader = ['age', 'tremor_score', 'handwriting_score', 'jitter_local', 'shimmer_local', 'bradykinesia', 'rigidity'];
      const inputRow = [
        formData.age === '' ? '' : formData.age,
        formData.tremor_score,
        formData.handwriting_score,
        formData.jitter_local / 100,
        formData.shimmer_local / 100,
        formData.bradykinesia,
        formData.rigidity,
      ];

      const featureHeader = ['feature', 'contribution'];
      const featureRows = (result.top_features || []).map((f) => [f.name, f.value]);

      const insightHeader = ['insight_index', 'insight_text'];
      const insightRows = (result.insights || []).slice(0, 3).map((ins, idx) => [idx + 1, ins]);

      const lines: string[] = [];
      summaryRows.forEach((r) => lines.push(r.map(csvEscape).join(',')));
      lines.push('Input Features');
      lines.push(inputHeader.map(csvEscape).join(','));
      lines.push(inputRow.map(csvEscape).join(','));
      lines.push('');
      lines.push('Top Feature Contributions');
      lines.push(featureHeader.map(csvEscape).join(','));
      featureRows.forEach((r) => lines.push(r.map(csvEscape).join(',')));
      lines.push('');
      lines.push('Generated Insights');
      lines.push(insightHeader.map(csvEscape).join(','));
      insightRows.forEach((r) => lines.push(r.map(csvEscape).join(',')));

      const csvContent = lines.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `assessment_report_${generatedAt.toISOString().replace(/[:.]/g, '-')}.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);

      toast({
        title: "Report Downloaded",
        description: "Assessment analysis report downloaded successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Download Failed",
        description: error?.message || "Could not generate assessment report.",
        variant: "destructive",
      });
    }
  };

  return (
    <section id="assessment" className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">Clinical Assessment</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Complete this comprehensive assessment to analyze potential indicators of Parkinson's disease.
          </p>
        </div>

        <Card className="max-w-5xl mx-auto shadow-elevated overflow-hidden border-t-4 border-t-primary">
          <CardHeader className="bg-muted/30 pb-8">
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Activity className="h-6 w-6 text-primary" />
              Patient Assessment Form
            </CardTitle>
            <CardDescription className="text-base">
              Please provide accurate information for the most reliable analysis.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            {result ? (
                <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 space-y-8">
                    
                    {/* Header Result Section - Premium Radial Gauge */}
                    <div className="grid md:grid-cols-3 gap-8 mb-8">
                         <Card className="md:col-span-2 bg-gradient-to-br from-card to-secondary/50 border-primary/10 shadow-lg relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                            <CardHeader className="pb-2">
                                <CardTitle className="flex items-center gap-2 text-xl">
                                    <Activity className="h-5 w-5 text-primary" />
                                    Assessment Analysis
                                </CardTitle>
                                <CardDescription>
                                    Based on the provided clinical indicators
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex flex-col md:flex-row items-start gap-8 pt-4">
                                {/* 1. Speedometer Gauge Chart (Refined) */}
                                <div className="relative w-full h-[240px] flex flex-col items-center justify-end overflow-visible">
                                     
                                     {/* Gauge Arc */}
                                     <div className="absolute top-0 w-full h-[160px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    dataKey="value"
                                                    startAngle={180}
                                                    endAngle={0}
                                                    data={[
                                                        { value: Math.min((result.pd_probability * 100), 100) },
                                                        { value: Math.max(0, 100 - (result.pd_probability * 100)) }
                                                    ]}
                                                    cx="50%"
                                                    cy="100%"
                                                    innerRadius={80}
                                                    outerRadius={110}
                                                    stroke="none"
                                                >
                                                    <Cell fill={getRiskAnalysis(result.pd_probability).color} />
                                                    <Cell fill="#e2e8f0" /> {/* Background track */}
                                                </Pie>
                                            </PieChart>
                                        </ResponsiveContainer>
                                     </div>

                                     {/* Score & Slider - Positioned below the arc */}
                                     <div className="z-10 flex flex-col items-center mt-4">
                                         <div className="text-5xl font-black tracking-tighter tabular-nums text-foreground drop-shadow-sm leading-none">
                                             {Math.min((result.pd_probability * 100), 99.9).toFixed(1)}
                                         </div>
                                         <div className="text-xs text-muted-foreground font-bold uppercase tracking-widest mb-3">Confidence Score</div>
                                     </div>
                                </div>

                                {/* 2. Text Content */}
                                <div className="space-y-4 flex-1 -mt-12">
                                    <div>
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-2">
                                            <h3 className="text-2xl font-bold tracking-tight" style={{ color: getRiskAnalysis(result.pd_probability).color }}>
                                                {getRiskAnalysis(result.pd_probability).title}
                                            </h3>
                                        </div>
                                        <p className="text-muted-foreground mt-2">
                                            {getRiskAnalysis(result.pd_probability).description}
                                        </p>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <div className="w-3 h-3 rounded-full bg-green-500" /> Low
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <div className="w-3 h-3 rounded-full bg-amber-500" /> Medium
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <div className="w-3 h-3 rounded-full bg-red-500" /> High
                                        </div>
                                    </div>
                                </div>

                            </CardContent>
                         </Card>

                         {/* Dominant Indicators Column */}
                         <div className="flex flex-col gap-4">
                            {/* Indicator 1 */}
                            <Card className="flex-1 bg-card/50 backdrop-blur-sm border hover:border-primary/50 transition-colors shadow-sm cursor-default group overflow-hidden relative">
                                <div className="absolute inset-0 bg-primary/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                                <CardContent className="p-4 flex flex-col justify-center h-full relative z-10">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 rounded-full bg-primary/10 text-primary">
                                            <Activity className="w-5 h-5" />
                                        </div>
                                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Dominant Indicator</span>
                                    </div>
                                    <span className="text-lg font-bold capitalize truncate" title={result.top_features?.[0]?.name?.replace(/_/g, ' ')}>
                                        {result.top_features?.[0] ? result.top_features[0].name.replace(/_/g, ' ') : 'Tremor Score'}
                                    </span>
                                    {result.top_features?.[0] && (
                                        <div className="mt-1 text-xs text-primary font-medium">
                                            Contribution: {(result.top_features[0].value).toFixed(1)}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Indicator 2 */}
                             <Card className="flex-1 bg-card/50 backdrop-blur-sm border hover:border-secondary/50 transition-colors shadow-sm cursor-default group overflow-hidden relative">
                                <div className="absolute inset-0 bg-secondary/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                                <CardContent className="p-4 flex flex-col justify-center h-full relative z-10">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 rounded-full bg-secondary/10 text-secondary-foreground">
                                            <Brain className="w-5 h-5" />
                                        </div>
                                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Secondary Indicator</span>
                                    </div>
                                    <span className="text-lg font-bold capitalize truncate" title={result.top_features?.[1]?.name?.replace(/_/g, ' ')}>
                                        {result.top_features?.[1] ? result.top_features[1].name.replace(/_/g, ' ') : 'Voice Jitter'}
                                    </span>
                                    {result.top_features?.[1] && (
                                        <div className="mt-1 text-xs text-secondary-foreground font-medium">
                                            Contribution: {(result.top_features[1].value).toFixed(1)}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                         </div>
                    </div>

                    {/* 3. Detailed Model Breakdown - Premium Ring Charts */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* RF Model Ring */}
                        <Card className="shadow-lg border-muted overflow-hidden relative group">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                                    Random Forest
                                    <div className="h-2 w-2 rounded-full bg-blue-500" />
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="h-[200px] grid place-items-center p-0">
                                <div className="relative w-40 h-40">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadialBarChart 
                                            cx="50%" cy="50%" 
                                            innerRadius="80%" outerRadius="100%" 
                                            barSize={10} 
                                            data={[{ val: result.pd_probability_rf ? (result.pd_probability_rf * 100) : 0, fill: 'url(#gradientBlue)' }]} 
                                            startAngle={90} endAngle={-270}
                                        >
                                            <defs>
                                                <linearGradient id="gradientBlue" x1="0" y1="0" x2="1" y2="1">
                                                    <stop offset="0%" stopColor="#3b82f6" />
                                                    <stop offset="100%" stopColor="#2563eb" />
                                                </linearGradient>
                                                <linearGradient id="gradientGreen" x1="0" y1="0" x2="1" y2="1">
                                                    <stop offset="0%" stopColor="#22c55e" />
                                                    <stop offset="100%" stopColor="#16a34a" />
                                                </linearGradient>
                                                <linearGradient id="gradientPurple" x1="0" y1="0" x2="1" y2="1">
                                                    <stop offset="0%" stopColor="#a855f7" />
                                                    <stop offset="100%" stopColor="#9333ea" />
                                                </linearGradient>
                                                <linearGradient id="gradientOrange" x1="0" y1="0" x2="1" y2="1">
                                                    <stop offset="0%" stopColor="#f97316" />
                                                    <stop offset="100%" stopColor="#ea580c" />
                                                </linearGradient>
                                            </defs>
                                            <RadialBar background dataKey="val" cornerRadius={30} />
                                        </RadialBarChart>
                                    </ResponsiveContainer>
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-600">
                                            {result.pd_probability_rf ? (result.pd_probability_rf * 100).toFixed(1) : 0}%
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* SVM Model Ring */}
                        <Card className="shadow-lg border-muted overflow-hidden relative group">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                                    SVM Classifier
                                    <div className="h-2 w-2 rounded-full bg-green-500" />
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="h-[200px] grid place-items-center p-0">
                                <div className="relative w-40 h-40">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadialBarChart 
                                            cx="50%" cy="50%" 
                                            innerRadius="80%" outerRadius="100%" 
                                            barSize={10} 
                                            data={[{ val: result.pd_probability_svm ? (result.pd_probability_svm * 100) : 0, fill: 'url(#gradientGreen)' }]} 
                                            startAngle={90} endAngle={-270}
                                        >
                                            <RadialBar background dataKey="val" cornerRadius={30} />
                                        </RadialBarChart>
                                    </ResponsiveContainer>
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600">
                                            {result.pd_probability_svm ? (result.pd_probability_svm * 100).toFixed(1) : 0}%
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Decision Trees Model Ring (New) */}
                        <Card className="shadow-lg border-muted overflow-hidden relative group">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                                    Decision Trees
                                    <div className="h-2 w-2 rounded-full bg-purple-500" />
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="h-[200px] grid place-items-center p-0">
                                <div className="relative w-40 h-40">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadialBarChart 
                                            cx="50%" cy="50%" 
                                            innerRadius="80%" outerRadius="100%" 
                                            barSize={10} 
                                            data={[{ val: result.pd_probability_dt ? (result.pd_probability_dt * 100) : 0, fill: 'url(#gradientPurple)' }]} 
                                            startAngle={90} endAngle={-270}
                                        >
                                            <RadialBar background dataKey="val" cornerRadius={30} />
                                        </RadialBarChart>
                                    </ResponsiveContainer>
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-fuchsia-600">
                                            {result.pd_probability_dt ? (result.pd_probability_dt * 100).toFixed(1) : 0}%
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* KNN Model Ring (New) */}
                        <Card className="shadow-lg border-muted overflow-hidden relative group">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                                    KNN
                                    <div className="h-2 w-2 rounded-full bg-orange-500" />
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="h-[200px] grid place-items-center p-0">
                                <div className="relative w-40 h-40">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadialBarChart 
                                            cx="50%" cy="50%" 
                                            innerRadius="80%" outerRadius="100%" 
                                            barSize={10} 
                                            data={[{ val: result.pd_probability_knn ? (result.pd_probability_knn * 100) : 0, fill: 'url(#gradientOrange)' }]} 
                                            startAngle={90} endAngle={-270}
                                        >
                                            <RadialBar background dataKey="val" cornerRadius={30} />
                                        </RadialBarChart>
                                    </ResponsiveContainer>
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-600">
                                            {result.pd_probability_knn ? (result.pd_probability_knn * 100).toFixed(1) : 0}%
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* 4. Insight Visualizations Grid */}
                    <div className="grid lg:grid-cols-2 gap-8">
                        
                        {/* A. Feature Bar Chart (Replaced Radar) */}
                        <Card className="shadow-lg border-muted overflow-hidden relative group">
                            <div className="absolute inset-0 bg-gradient-to-tr from-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Brain className="w-4 h-4 text-primary" />
                                    Symptom Profile
                                </CardTitle>
                                <CardDescription>Key biomarkers normalized analysis</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[350px] flex items-center justify-center -ml-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart 
                                        data={[
                                            { subject: 'Tremor', A: (formData.tremor_score / 4) * 100 },
                                            { subject: 'Rigidity', A: (formData.rigidity / 4) * 100 },
                                            { subject: 'Brady', A: (formData.bradykinesia / 4) * 100 },
                                            { subject: 'Writing', A: (formData.handwriting_score / 4) * 100 },
                                            { subject: 'Jitter', A: (formData.jitter_local / 2) * 100 },
                                            { subject: 'Shimmer', A: (formData.shimmer_local / 1) * 100 },
                                        ]}
                                        margin={{ top: 20, right: 30, left: 20, bottom: 25 }}
                                    >
                                        <defs>
                                            <linearGradient id="barGradientFormatted" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                                                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                                        <XAxis 
                                            dataKey="subject" 
                                            tick={{ fill: 'currentColor', fontSize: 12, fontWeight: 500 }} 
                                            axisLine={false} 
                                            tickLine={false}
                                            label={{ value: 'Biomarker Category', position: 'insideBottom', offset: -10, fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                                        />
                                        <YAxis 
                                            hide={false} 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{ fill: 'currentColor', fontSize: 10 }}
                                            domain={[0, 100]}
                                            label={{ value: 'Normalized Score', angle: -90, position: 'insideLeft', offset: 10, fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                                        />
                                        <Tooltip 
                                            cursor={{ fill: 'hsl(var(--muted)/0.2)' }}
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.2)' }} 
                                        />
                                        <Bar 
                                            dataKey="A" 
                                            name="Severity" 
                                            fill="url(#barGradientFormatted)" 
                                            radius={[4, 4, 0, 0]} 
                                            barSize={32}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* B. Stage Probability Probability */}
                        <Card className="shadow-lg border-muted overflow-hidden relative group">
                            <div className="absolute inset-0 bg-gradient-to-bl from-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Activity className="w-4 h-4 text-primary" />
                                    Stage Prediction
                                </CardTitle>
                                <CardDescription>Likelihood of disease progression</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[350px] flex flex-col justify-center gap-6 px-10">
                                {result.stage_probs && [
                                    { name: 'Early Stage', prob: result.stage_probs.early * 100, color: '#10b981', desc: 'Mild symptoms, usually unilateral' }, 
                                    { name: 'Mid Stage', prob: result.stage_probs.mid * 100, color: '#f59e0b', desc: 'Balance impairment, mild disability' },   
                                    { name: 'Late Stage', prob: result.stage_probs.late * 100, color: '#ef4444', desc: 'Severe disability, limited mobility' }
                                ].map((stage, idx) => (
                                    <div key={idx} className="space-y-2">
                                        <div className="flex justify-between items-end">
                                            <span className="font-semibold">{stage.name}</span>
                                            <span className="font-bold text-lg" style={{ color: stage.color }}>{stage.prob.toFixed(1)}%</span>
                                        </div>
                                        <div className="h-3 w-full bg-secondary rounded-full overflow-hidden">
                                            <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${stage.prob}%`, backgroundColor: stage.color }} />
                                        </div>
                                        <p className="text-xs text-muted-foreground">{stage.desc}</p>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>


                        {/* D. Model Consensus - Bar Chart */}
                        <Card className="shadow-lg border-muted overflow-hidden relative group">
                            <CardHeader>
                                <CardTitle className="text-lg">Model Consensus</CardTitle>
                                <CardDescription>Agreement across different AI algorithms</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={[
                                            { model: 'Rand Forest', score: result.pd_probability_rf ? (result.pd_probability_rf * 100) : 0, fill: '#3b82f6' },
                                            { model: 'SVM', score: result.pd_probability_svm ? (result.pd_probability_svm * 100) : 0, fill: '#22c55e' },
                                            { model: 'Dec Tree', score: result.pd_probability_dt ? (result.pd_probability_dt * 100) : 0, fill: '#a855f7' },
                                            { model: 'KNN', score: result.pd_probability_knn ? (result.pd_probability_knn * 100) : 0, fill: '#f97316' },
                                        ]}
                                        margin={{ top: 20, right: 20, bottom: 20, left: 0 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                                        <XAxis dataKey="model" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                                        <YAxis hide domain={[0, 100]} />
                                        <Tooltip 
                                            cursor={{ fill: 'transparent' }}
                                            contentStyle={{ borderRadius: '12px', background: 'rgba(255, 255, 255, 0.95)', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                            labelStyle={{ color: '#1e293b', fontWeight: 'bold' }}
                                        />
                                        <Legend />
                                        <Bar 
                                            dataKey="score" 
                                            name="Probability (%)" 
                                            radius={[4, 4, 0, 0]} 
                                            barSize={40}
                                        >
                                            <Cell fill="#3b82f6" />
                                            <Cell fill="#22c55e" />
                                            <Cell fill="#a855f7" />
                                            <Cell fill="#f97316" />
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* E. Analysis Composition */}
                        {/* E. Analysis Composition - Pie Chart (Was Donut) */}
                        <Card className="shadow-lg border-muted overflow-hidden relative group">
                            <CardHeader>
                                <CardTitle className="text-lg">Risk Factors</CardTitle>
                                <CardDescription>Composition of risk contributors</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[300px] flex items-center justify-center">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={
                                                result.top_features && result.top_features.length > 0 
                                                ? result.top_features.map((f, i) => ({ name: f.name.replace(/_/g, ' '), val: f.value }))
                                                : [
                                                    { name: 'Tremor', val: (formData.tremor_score / 4) * 30 },
                                                    { name: 'Voice', val: ((formData.jitter_local * 100) + (formData.shimmer_local * 50)) },
                                                    { name: 'Mobility', val: (formData.bradykinesia / 4) * 20 },
                                                ]
                                            }
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={0}
                                            outerRadius={80}
                                            paddingAngle={2}
                                            dataKey="val"
                                        >
                                            {(result.top_features && result.top_features.length > 0
                                                ? result.top_features.map((f, i) => ({ name: f.name.replace(/_/g, ' '), val: f.value }))
                                                : [
                                                    { name: 'Tremor', val: (formData.tremor_score / 4) * 30 },
                                                    { name: 'Voice', val: ((formData.jitter_local * 100) + (formData.shimmer_local * 50)) },
                                                    { name: 'Mobility', val: (formData.bradykinesia / 4) * 20 },
                                                ]
                                            ).map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={['#10b981', '#8b5cf6', '#3b82f6', '#f59e0b', '#ec4899'][index % 5]} />
                                            ))}
                                        </Pie>
                                        <Tooltip 
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                        />
                                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                    </PieChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        <Card className="shadow-lg border-muted overflow-hidden relative group md:col-span-2">
                             <CardHeader>
                                 <CardTitle className="text-xl font-bold flex items-center gap-2">
                                     <Activity className="h-5 w-5 text-indigo-500" />
                                     <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">
                                         Comparative Health Benchmarks
                                     </span>
                                 </CardTitle>
                                 <CardDescription>Statistical distribution via Box Plot Analysis</CardDescription>
                             </CardHeader>
                             <CardContent className="h-[400px]">
                                 <ResponsiveContainer width="100%" height="100%">
                                     <BarChart
                                         data={benchmarks.length > 0 ? benchmarks : [
                                             { name: 'Tremor', min: 10, q1: 25, median: 42, q3: 58, max: 75, fill: '#8b5cf6', points: [12, 15, 18, 22, 25, 28, 30, 35, 40, 42, 45, 48, 50, 52, 55, 60, 65, 70, 72, 74] },
                                             { name: 'Rigidity', min: 15, q1: 35, median: 50, q3: 65, max: 85, fill: '#ec4899', points: [18, 22, 30, 35, 38, 42, 48, 50, 52, 55, 60, 62, 65, 68, 75, 80, 82, 84] },
                                             { name: 'Bradykinesia', min: 5, q1: 20, median: 35, q3: 55, max: 70, fill: '#10b981', points: [6, 10, 15, 20, 25, 28, 30, 35, 38, 40, 45, 50, 55, 58, 62, 65, 68] },
                                             { name: 'Voice Jitter', min: 20, q1: 38, median: 55, q3: 72, max: 90, fill: '#f59e0b', points: [22, 28, 35, 40, 45, 50, 55, 58, 60, 65, 70, 75, 80, 85, 88] },
                                             { name: 'Cognitive', min: 30, q1: 45, median: 60, q3: 75, max: 95, fill: '#3b82f6', points: [32, 38, 45, 50, 55, 60, 62, 65, 70, 75, 80, 85, 90, 92, 94] }
                                         ]}
                                         margin={{ top: 20, right: 30, left: 40, bottom: 40 }}
                                     >
                                         <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                                         <XAxis 
                                            dataKey="name" 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{ fill: 'currentColor', fontSize: 12, fontWeight: 500 }}
                                            interval={0}
                                            label={{ value: 'Clinical Feature Metric', position: 'bottom', offset: 20, fill: 'hsl(var(--muted-foreground))', fontSize: 14 }}
                                         />
                                         <YAxis 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{ fill: 'muted' }} 
                                            domain={[0, 100]}
                                            label={{ value: 'Percentile Score (0-100)', angle: -90, position: 'insideLeft', offset: -20, fill: 'hsl(var(--muted-foreground))', fontSize: 14 }}
                                         />
                                         <Tooltip 
                                            cursor={{ fill: 'transparent' }} // Cleaner look without cursor bar
                                            content={({ active, payload }) => {
                                                if (active && payload && payload.length) {
                                                    const d = payload[0].payload;
                                                    return (
                                                        <div className="bg-popover/95 backdrop-blur-sm text-popover-foreground p-4 rounded-xl shadow-xl border border-border/50 animate-in fade-in zoom-in-95 duration-200">
                                                            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border/50">
                                                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.fill }} />
                                                                <p className="font-bold text-base">{d.name}</p>
                                                            </div>
                                                            <div className="space-y-1.5 text-sm">
                                                                <div className="flex justify-between gap-8"><span className="text-muted-foreground">Range:</span> <span className="font-mono">{d.min} - {d.max}</span></div>
                                                                <div className="flex justify-between gap-8"><span className="text-muted-foreground">IQR:</span> <span className="font-mono">{d.q1} - {d.q3}</span></div>
                                                                <div className="flex justify-between gap-8"><span className="font-semibold text-foreground">Median:</span> <span className="font-mono font-bold">{d.median}</span></div>
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                         <Bar 
                                            dataKey="max" // Use max to determine height context for the custom shape
                                            shape={(props: any) => {
                                                const { x, y, width, height, payload, fill } = props;
                                                const { min, q1, median, q3, max, points } = payload;
                                                
                                                if (!max) return null;
                                                // Calculate pixels per unit
                                                const k = height / max;
                                                
                                                const bottom = y + height;
                                                const yMin = bottom - (min * k);
                                                const yQ1 = bottom - (q1 * k);
                                                const yMedian = bottom - (median * k);
                                                const yQ3 = bottom - (q3 * k);
                                                const yMax = bottom - (max * k);
                                                
                                                // NARROWER BOX LOGIC
                                                const center = x + width / 2;
                                                const boxWidth = width * 0.35; // Make boxes narrower (35% of slot width)
                                                const boxX = center - boxWidth / 2;

                                                return (
                                                    <g>
                                                        {/* Whiskers */}
                                                        <line x1={center} y1={yMin} x2={center} y2={yQ1} stroke={fill} strokeWidth={2} opacity={0.6} />
                                                        <line x1={center} y1={yQ3} x2={center} y2={yMax} stroke={fill} strokeWidth={2} opacity={0.6} />
                                                        <line x1={center - boxWidth/2} y1={yMin} x2={center + boxWidth/2} y2={yMin} stroke={fill} strokeWidth={2} opacity={0.6} />
                                                        <line x1={center - boxWidth/2} y1={yMax} x2={center + boxWidth/2} y2={yMax} stroke={fill} strokeWidth={2} opacity={0.6} />
                                                        
                                                        {/* Box */}
                                                        <rect x={boxX} y={yQ3} width={boxWidth} height={yQ1 - yQ3} stroke={fill} strokeWidth={2} fill={fill} fillOpacity={0.15} rx={3} />
                                                        
                                                        {/* Median */}
                                                        <line x1={boxX} y1={yMedian} x2={boxX + boxWidth} y2={yMedian} stroke={fill} strokeWidth={3} strokeLinecap="round" />

                                                        {/* Scatter Points - Jittered around center */}
                                                        {points && points.map((val: number, i: number) => {
                                                            const cy = bottom - (val * k);
                                                            // Deterministic pseudo-random jitter 
                                                            // Spread them slightly wider than the box for "cloud" effect, but keep centered
                                                            const jitterAmount = (width * 0.6); // Allow points to use 60% of width
                                                            const jitter = (((val * i * 13) % 100) / 100 - 0.5) * jitterAmount; 
                                                            const cx = center + jitter;
                                                            
                                                            return (
                                                                <circle 
                                                                    key={i} 
                                                                    cx={cx} 
                                                                    cy={cy} 
                                                                    r={2.5} 
                                                                    fill={fill} 
                                                                    fillOpacity={0.7} 
                                                                    stroke="none"
                                                                />
                                                            );
                                                        })}
                                                    </g>
                                                );
                                            }}
                                            barSize={50}
                                         >
                                            {/* We can use Cell to map colors if needed, but we passed fill in data */}
                                            {
                                                [
                                                    {fill: '#8b5cf6'}, {fill: '#ec4899'}, {fill: '#10b981'}, {fill: '#f59e0b'}, 
                                                    {fill: '#3b82f6'}, {fill: '#ef4444'}, {fill: '#06b6d4'}, {fill: '#84cc16'}
                                                ].map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                                ))
                                            }
                                         </Bar>
                                     </BarChart>
                                 </ResponsiveContainer>
                             </CardContent>
                         </Card>
                    </div>


                    <div className="grid gap-4 md:grid-cols-3 pt-2">
                        {(result.insights || []).slice(0, 3).map((insight, idx) => (
                            <Card key={idx} className="bg-card/60 border-primary/20 shadow-sm">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm flex items-center gap-2">
                                        <Sparkles className="h-4 w-4 text-primary" />
                                        Insight {idx + 1}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">{insight}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <div className="flex flex-col sm:flex-row justify-center gap-3 pt-6">
                        <Button 
                            variant="default"
                            size="lg"
                            onClick={downloadAssessmentReport}
                            className="px-8 font-semibold gap-2"
                        >
                            <Download className="h-4 w-4" />
                            Download Assessment Report
                        </Button>
                        <Button 
                            variant="outline" 
                            size="lg" 
                            onClick={handleReset}
                            className="px-8 border-2 hover:bg-muted font-semibold"
                        >
                            Start New Assessment
                        </Button>
                    </div>
                </div>
            ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid md:grid-cols-2 gap-8">
                {/* Left Column */}
                <div className="space-y-8">
                  {/* Demographics */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 mb-4">
                      <User className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-semibold">Demographics</h3>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="age">Age</Label>
                      <Input
                        id="age"
                        type="number"
                        placeholder="Enter age"
                        value={formData.age}
                        onChange={(e) => updateFormData('age', e.target.value === '' ? '' : parseInt(e.target.value))}
                        min="18"
                        max="100"
                        className="shadow-card"
                      />
                      <div className="mt-2">
                          <p className="text-sm text-muted-foreground mb-4">
                              Please enter the patient's current age. Age is a significant risk factor for Parkinson's, with risk increasing for those over 60.
                          </p>
                          
                          <div className="p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-800">
                              <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-3 flex items-center gap-2">
                                  <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse"/>
                                  Analyst Instructions
                              </h4>
                              <div className="grid grid-cols-[85px_1fr] gap-y-2 text-sm text-muted-foreground">
                                  <span className="font-medium text-foreground">1. Setting:</span>
                                  <span>Quiet, well-lit room free from distractions.</span>
                                  
                                  <span className="font-medium text-foreground">2. Baseline:</span>
                                  <span>Patient seated comfortably for 5+ mins.</span>
                                  
                                  <span className="font-medium text-foreground">3. Observe:</span>
                                  <span>Monitor resting tremors during interview.</span>
                                  
                                  <span className="font-medium text-foreground">4. Verify:</span>
                                  <span>Check age against medical records.</span>
                              </div>
                          </div>
                      </div>
                    </div>
                  </div>

                  {/* Voice Analysis */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Mic className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-semibold">Voice Analysis</h3>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <Label>Jitter (%)</Label>
                        <div className="px-2 py-4 cursor-pointer">
                          <Slider
                            value={[formData.jitter_local]}
                            onValueChange={(value) => updateFormData('jitter_local', value[0])}
                            max={2}
                            step={0.1}
                            className="w-full"
                          />
                          <div className="flex justify-between text-base font-medium text-foreground mt-1">
                            <span>0%</span>
                            <span className="font-bold text-primary">{formData.jitter_local.toFixed(1)}%</span>
                            <span>2%</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label>Shimmer (%)</Label>
                        <div className="px-2 py-4 cursor-pointer">
                          <Slider
                            value={[formData.shimmer_local]}
                            onValueChange={(value) => updateFormData('shimmer_local', value[0])}
                            max={1}
                            step={0.05}
                            className="w-full"
                          />
                          <div className="flex justify-between text-base font-medium text-foreground mt-1">
                            <span>0%</span>
                            <span className="font-bold text-primary">{formData.shimmer_local.toFixed(2)}%</span>
                            <span>1%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-8">
                  {/* Motor Assessment */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Brain className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-semibold">Motor Assessment</h3>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <Label>Tremor Score (0-4)</Label>
                        <div className="px-2 py-4 cursor-pointer">
                          <Slider
                            value={[formData.tremor_score]}
                            onValueChange={(value) => updateFormData('tremor_score', value[0])}
                            max={4}
                            step={1}
                            className="w-full"
                          />
                          <div className="flex justify-between text-base font-medium text-foreground mt-1">
                            <span>None</span>
                            <span className="font-bold text-primary">{formData.tremor_score}</span>
                            <span>Severe</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label>Rigidity (0-4)</Label>
                        <div className="px-2 py-4 cursor-pointer">
                          <Slider
                            value={[formData.rigidity]}
                            onValueChange={(value) => updateFormData('rigidity', value[0])}
                            max={4}
                            step={1}
                            className="w-full"
                          />
                          <div className="flex justify-between text-base font-medium text-foreground mt-1">
                            <span>Normal</span>
                            <span className="font-bold text-primary">{formData.rigidity}</span>
                            <span>Severe</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label>Bradykinesia (0-4)</Label>
                        <div className="px-2 py-4 cursor-pointer">
                          <Slider
                            value={[formData.bradykinesia]}
                            onValueChange={(value) => updateFormData('bradykinesia', value[0])}
                            max={4}
                            step={1}
                            className="w-full"
                          />
                          <div className="flex justify-between text-base font-medium text-foreground mt-1">
                            <span>Normal</span>
                            <span className="font-bold text-primary">{formData.bradykinesia}</span>
                            <span>Severe</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Handwriting */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Activity className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-semibold">Handwriting Assessment</h3>
                    </div>
                    
                    <div>
                      <Label>Handwriting Score (0-4)</Label>
                      <div className="px-2 py-4 cursor-pointer">
                        <Slider
                          value={[formData.handwriting_score]}
                          onValueChange={(value) => updateFormData('handwriting_score', value[0])}
                          max={4}
                          step={0.5}
                          className="w-full"
                        />
                        <div className="flex justify-between text-base font-medium text-foreground mt-1">
                          <span>Normal</span>
                          <span className="font-bold text-primary">{formData.handwriting_score}</span>
                          <span>Severe</span>
                        </div>
                      </div>
                      <div className="mt-4 p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground border">
                          <p className="font-medium mb-1">Observation Guide:</p>
                          <ul className="list-disc list-inside space-y-1">
                              <li>Check for Micrographia (small handwriting)</li>
                              <li>Observe shakiness or tremors while writing</li>
                              <li>Note any difficulty initiating the writing movement</li>
                          </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t">
                <Button 
                  type="submit" 
                  size="lg" 
                  disabled={isLoading}
                  className="w-full max-w-sm mx-auto flex bg-gradient-hero shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-200"
                >
                  {isLoading ? 'Analyzing...' : 'Analyze Assessment'}
                </Button>
              </div>
            </form>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default QuestionnaireForm;
