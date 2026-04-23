import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertCircle,
  ArrowRight,
  Brain,
  CheckCircle,
  Clock,
  Database,
  RefreshCcw,
  Server,
  Sparkles,
  Upload,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { api, DashboardSummaryResponse } from '@/lib/api';

const Dashboard = () => {
  const { user } = useAuth();
  const [modelStatus, setModelStatus] = useState<'online' | 'offline'>('offline');
  const [latency, setLatency] = useState<string>('--');
  const [summary, setSummary] = useState<DashboardSummaryResponse | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const loadDashboardSummary = async () => {
    try {
      const data = await api.getDashboardSummary(user?.id);
      setSummary(data);
      setSummaryError(null);
    } catch (error) {
      setSummaryError('Failed to load live dashboard data from the database.');
    } finally {
      setLoadingSummary(false);
    }
  };

  useEffect(() => {
    const checkHealth = async () => {
      const start = performance.now();
      try {
        const health = await api.healthCheck();
        const end = performance.now();
        setLatency(`${Math.round(end - start)}ms`);
        setModelStatus(health.status === 'healthy' && health.model_loaded ? 'online' : 'offline');
      } catch (error) {
        setModelStatus('offline');
        setLatency('--');
      }
    };

    checkHealth();
    loadDashboardSummary();

    const healthInterval = setInterval(checkHealth, 30000);
    const summaryInterval = setInterval(loadDashboardSummary, 30000);

    return () => {
      clearInterval(healthInterval);
      clearInterval(summaryInterval);
    };
  }, [user?.id]);

  const trendData = useMemo(() => {
    if (!summary) return [];
    return summary.daily_trend.map((point) => ({
      ...point,
      label: new Date(point.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    }));
  }, [summary]);

  const riskData = useMemo(() => {
    if (!summary) return [];
    return [
      { name: 'Low', value: summary.risk_distribution.low, fill: '#22c55e' },
      { name: 'Moderate', value: summary.risk_distribution.moderate, fill: '#f59e0b' },
      { name: 'High', value: summary.risk_distribution.high, fill: '#ef4444' },
    ];
  }, [summary]);

  const featureData = useMemo(() => {
    if (!summary) return [];
    return summary.top_features.map((feature) => ({
      name: feature.name.replace(/_/g, ' '),
      score: feature.score,
      mentions: feature.mentions,
    }));
  }, [summary]);

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Live clinical and batch prediction analytics from the database.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={loadDashboardSummary} className="gap-2">
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </Button>
          <div className="flex items-center space-x-2 bg-card p-2 rounded-lg border shadow-sm">
            <Server className={`h-4 w-4 ${modelStatus === 'online' ? 'text-green-500' : 'text-red-500'}`} />
            <span className="text-sm font-medium">Server:</span>
            <span className={`text-sm font-bold ${modelStatus === 'online' ? 'text-green-600' : 'text-red-600'}`}>
              {modelStatus === 'online' ? 'Operational' : 'Offline'}
            </span>
          </div>
        </div>
      </div>

      {summaryError && (
        <Card className="mb-6 border-destructive/30">
          <CardContent className="py-4 flex items-center gap-3 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{summaryError}</span>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Predictions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.kpis.total_predictions ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              {summary?.kpis.week_over_week_change_percent ?? 0}% week-over-week
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">PD Detected</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.kpis.pd_detected ?? 0}</div>
            <p className="text-xs text-muted-foreground">{summary?.kpis.detection_rate ?? 0}% detection rate</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clinical Assessments</CardTitle>
            <Brain className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.kpis.clinical_assessments ?? 0}</div>
            <p className="text-xs text-muted-foreground">Saved in `clinical_assessments`</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Batch Predictions</CardTitle>
            <Database className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.kpis.batch_predictions ?? 0}</div>
            <p className="text-xs text-muted-foreground">Saved in `batch_process_results`</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Prediction Trend (14 Days)</CardTitle>
            <CardDescription>Clinical + batch prediction activity over time.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.2} />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="clinical" stroke="#2563eb" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="batch" stroke="#16a34a" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="detected" stroke="#ef4444" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Risk Distribution</CardTitle>
            <CardDescription>Real-time classification of stored predictions.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={riskData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={95} label>
                  {riskData.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Top Risk Contributors</CardTitle>
            <CardDescription>Most impactful features observed in assessments.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {featureData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={featureData} layout="vertical" margin={{ top: 10, right: 20, left: 20, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} strokeOpacity={0.2} />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="score" fill="#6366f1" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                Contributor data will appear after predictions with feature attribution are stored.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Recent Batch Runs</CardTitle>
            <CardDescription>Latest uploads processed from the database.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(summary?.recent_batch_runs || []).length === 0 && (
              <p className="text-sm text-muted-foreground">No batch history found yet.</p>
            )}
            {(summary?.recent_batch_runs || []).map((run, idx) => (
              <div key={`${run.created_at}-${idx}`} className="p-3 rounded-lg border bg-secondary/30">
                <div className="flex items-center justify-between">
                  <p className="font-medium truncate max-w-[65%]">{run.filename || 'Untitled Batch'}</p>
                  <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">{run.status}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {run.successful_predictions}/{run.total_records} successful, {run.failed_predictions} failed
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-8">
        {(summary?.insights || []).slice(0, 3).map((insight, index) => (
          <Card key={index} className="shadow-sm border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Insight {index + 1}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{insight}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 shadow-card">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Start a new assessment or process a patient file.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Link to="/prediction" className="group">
              <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg hover:border-primary/50 hover:bg-accent/5 transition-all cursor-pointer h-full">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Activity className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-1">New Assessment</h3>
                <p className="text-sm text-center text-muted-foreground">Manual entry of clinical biomarkers</p>
              </div>
            </Link>
            <Link to="/prediction?tab=upload" className="group">
              <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg hover:border-primary/50 hover:bg-accent/5 transition-all cursor-pointer h-full">
                <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Upload className="h-6 w-6 text-orange-600" />
                </div>
                <h3 className="font-semibold text-lg mb-1">Batch Upload</h3>
                <p className="text-sm text-center text-muted-foreground">Process CSV patient datasets</p>
              </div>
            </Link>
          </CardContent>
        </Card>

        <Card className="col-span-3 shadow-card">
          <CardHeader>
            <CardTitle>System Health</CardTitle>
            <CardDescription>API and inference service status.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium">API Gateway</span>
                </div>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Operational</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium">ML Inference Engine</span>
                </div>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                  {modelStatus === 'online' ? 'Ready' : 'Offline'}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Clock className="h-5 w-5 text-blue-500" />
                  <span className="font-medium">Avg. Latency</span>
                </div>
                <span className="text-sm font-mono">{latency}</span>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t text-xs text-muted-foreground">
              <p>Insight Source: {summary?.insight_source || 'loading...'}</p>
              <p>Last Updated: {summary?.last_updated ? new Date(summary.last_updated).toLocaleString() : '--'}</p>
              {loadingSummary && <p className="mt-2">Loading live metrics...</p>}
            </div>
            <div className="mt-4">
              <Link to="/analytics" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
                Open Deep Analytics <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
