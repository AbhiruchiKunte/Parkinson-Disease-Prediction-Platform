import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Activity, Server, Database, Brain, AlertCircle, CheckCircle, ArrowRight, Upload, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';

const Dashboard = () => {
  const [modelStatus, setModelStatus] = useState<'online' | 'offline'>('offline');
  const [latency, setLatency] = useState<string>('--');

  React.useEffect(() => {
    const checkHealth = async () => {
        const start = performance.now();
        try {
            const health = await api.healthCheck();
            const end = performance.now();
            setLatency(`${Math.round(end - start)}ms`);

            if (health.status === 'healthy' && health.model_loaded) {
                setModelStatus('online');
            } else {
                setModelStatus('offline');
            }
        } catch (error) {
            setModelStatus('offline');
            setLatency('--');
        }
    };

    checkHealth();
    // Poll every 30 seconds
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of prediction models and recent activity.</p>
        </div>
        <div className="flex items-center space-x-2 bg-card p-2 rounded-lg border shadow-sm">
          <Server className={`h-4 w-4 ${modelStatus === 'online' ? 'text-green-500' : 'text-red-500'}`} />
          <span className="text-sm font-medium">Server Status: </span>
          <span className={`text-sm font-bold ${modelStatus === 'online' ? 'text-green-600' : 'text-red-600'}`}>
            {modelStatus === 'online' ? 'Operational' : 'Offline'}
          </span>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assessments</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,284</div>
            <p className="text-xs text-muted-foreground">+12% from last month</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">PD Detected</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">342</div>
            <p className="text-xs text-muted-foreground">~26% detection rate</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Model Accuracy</CardTitle>
            <Brain className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">98.5%</div>
            <p className="text-xs text-muted-foreground">Random Forest + SVM</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Datapoints</CardTitle>
            <Database className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12.5k</div>
            <p className="text-xs text-muted-foreground">Training dataset size</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Quick Actions */}
        <Card className="col-span-4 shadow-card">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Start a new analysis or manage data.</CardDescription>
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
        
        {/* System Health */}
        <Card className="col-span-3 shadow-card">
          <CardHeader>
            <CardTitle>System Health</CardTitle>
            <CardDescription>Backend services and model status.</CardDescription>
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
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Ready</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                        <Clock className="h-5 w-5 text-blue-500" />
                        <span className="font-medium">Avg. Latency</span>
                    </div>
                    <span className="text-sm font-mono">{latency}</span>
                </div>
            </div>
            <div className="mt-6 pt-4 border-t">
                <h4 className="text-sm font-semibold mb-3">Active Models</h4>
                 <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-primary/10 text-primary text-xs rounded-full border border-primary/20">Random Forest</span>
                    <span className="px-3 py-1 bg-primary/10 text-primary text-xs rounded-full border border-primary/20">SVM</span>
                    <span className="px-3 py-1 bg-gray-100 text-gray-500 text-xs rounded-full border border-gray-200">LSTM (Loading...)</span>
                 </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
