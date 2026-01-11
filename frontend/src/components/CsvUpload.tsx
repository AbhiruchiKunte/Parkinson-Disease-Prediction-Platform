import React, { useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Upload, X, FileText, AlertCircle, CheckCircle, Loader2, FileSpreadsheet, Activity } from 'lucide-react';
import Papa from 'papaparse';
import { api, BatchPredictionResponse } from '@/lib/api';
import { Download, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, ScatterChart, Scatter, AreaChart, Area
} from 'recharts';

interface CsvData {
  fileName: string;
  headers: string[];
  data: any[];
}

const CsvUpload = () => {
    const { toast } = useToast();
    const [isDragActive, setIsDragActive] = useState(false);
    const [csvData, setCsvData] = useState<CsvData | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [dragActive, setDragActive] = useState(false);
    const [batchResults, setBatchResults] = useState<BatchPredictionResponse | null>(null);
  
    const handleDrag = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.type === "dragenter" || e.type === "dragover") {
        setDragActive(true);
      } else if (e.type === "dragleave") {
        setDragActive(false);
      }
    }, []);
  
    const handleDrop = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      
      const files = e.dataTransfer.files;
      if (files && files[0]) {
        handleFile(files[0]);
      }
    }, []);
  
    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files[0]) {
        handleFile(files[0]);
      }
    };
  
    const handleFile = (file: File) => {
        const validExtensions = ['.csv', '.json', '.xlsx', '.xls', '.doc', '.docx'];
        const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
        
        if (!validExtensions.includes(fileExtension)) {
            toast({
            title: "Invalid File Type",
            description: "Please upload a CSV, JSON, Excel, or Document file.",
            variant: "destructive",
            });
            return;
        }

      setSelectedFile(file);
      setIsUploading(true);

      if (fileExtension === '.csv') {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
             // ... existing CSV logic ...
             const headers = results.meta.fields || [];
             const data = results.data;
             setCsvData({ data, headers, fileName: file.name });
             setIsUploading(false);
             toast({ title: "File Uploaded", description: `Loaded CSV with ${data.length} records.` });
          },
          error: () => {
             setIsUploading(false);
             toast({ title: "Error", description: "Failed to parse CSV.", variant: "destructive" });
          }
        });
      } else if (fileExtension === '.json') {
          const reader = new FileReader();
          reader.onload = (e) => {
              try {
                  const json = JSON.parse(e.target?.result as string);
                  const data = Array.isArray(json) ? json : [json];
                  const headers = data.length > 0 ? Object.keys(data[0]) : [];
                  setCsvData({ data, headers, fileName: file.name });
                  setIsUploading(false);
                  toast({ title: "File Uploaded", description: `Loaded JSON with ${data.length} records.` });
              } catch (err) {
                  setIsUploading(false);
                  toast({ title: "Error", description: "Invalid JSON format.", variant: "destructive" });
              }
          };
          reader.readAsText(file);
      } else {
          setCsvData({ data: [], headers: [], fileName: file.name }); 
          setIsUploading(false);
          toast({ title: "File Selected", description: `${file.name} ready for processing.` });
      }
    };
  
    const processBatch = async () => {
      if (!selectedFile) return;
  
      setIsProcessing(true);
      
      try {
        const response = await api.predictCsv(selectedFile);
        setBatchResults(response);
        
        toast({
          title: "Batch Processing Complete",
          description: `Successfully analyzed ${response.total_records} patient records.`,
        });
      } catch (error) {
        toast({
          title: "Processing Error",
          description: error instanceof Error ? error.message : "Failed to process batch data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsProcessing(false);
      }
    };
  
    const removeFile = () => {
      setCsvData(null);
      setSelectedFile(null);
      setBatchResults(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
  
    return (
      <section id="upload" className="py-16 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Batch Analysis</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Upload patient datasets for large-scale Parkinson's screening and analysis.
            </p>
          </div>
  
          <div className="max-w-4xl mx-auto space-y-6">
            
            {/* Instructions Card */}
            <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-xl p-6">
                <h3 className="flex items-center gap-2 font-semibold text-blue-900 dark:text-blue-200 mb-3">
                    <AlertCircle className="h-5 w-5" />
                    Upload Instructions
                </h3>
                <div className="grid md:grid-cols-2 gap-6 text-sm text-muted-foreground">
                    <div>
                        <p className="font-medium text-foreground mb-1">Supported Formats:</p>
                        <ul className="list-disc list-inside space-y-1 ml-1">
                            <li>CSV (.csv) - Comma separated values</li>
                            <li>JSON (.json) - Structured data arrays</li>
                            <li>Excel (.xlsx, .xls) - Spreadsheets</li>
                            <li>Word (.doc, .docx) - <i>Experimental support</i></li>
                        </ul>
                    </div>
                    <div>
                        <p className="font-medium text-foreground mb-1">Required Columns/Keys:</p>
                        <p className="mb-2">Ensure your data contains these headers:</p>
                        <div className="flex flex-wrap gap-2">
                            {['age', 'tremor_score', 'handwriting_score', 'jitter_local', 'shimmer_local'].map(k => (
                                <span key={k} className="px-2 py-0.5 bg-background border rounded text-xs font-mono">
                                    {k}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <Card className="shadow-elevated">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-primary" />
                  Dataset Upload
                </CardTitle>
                <CardDescription>
                  Select a file from your computer for batch processing.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                {!selectedFile ? (
                    <div
                      className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
                        dragActive 
                          ? 'border-primary bg-medical-blue-light' 
                          : 'border-border hover:border-primary/50'
                      }`}
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                    >
                      <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-semibold mb-2">Upload Dataset</h3>
                      <p className="text-muted-foreground mb-4">
                        Drag and drop, or click to browse
                      </p>
                      <input
                        type="file"
                        accept=".csv,.json,.xlsx,.xls,.doc,.docx"
                        onChange={handleFileInput}
                        className="hidden"
                        id="csv-upload"
                        ref={fileInputRef}
                      />
                      <Button asChild variant="outline">
                        <label htmlFor="csv-upload" className="cursor-pointer">
                          Choose File
                        </label>
                      </Button>
                      <p className="text-xs text-muted-foreground mt-4">
                          Supports CSV, JSON, Excel, DOC
                      </p>
                    </div>
                ) : (
                    <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-full">
                                {selectedFile.name.endsWith('.csv') || selectedFile.name.endsWith('.xlsx') ? (
                                    <FileSpreadsheet className="h-6 w-6 text-primary" />
                                ) : (
                                    <FileText className="h-6 w-6 text-primary" />
                                )}
                            </div>
                            <div>
                                <p className="font-medium">{selectedFile.name}</p>
                                <p className="text-xs text-muted-foreground">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={removeFile}>
                            <X className="h-5 w-5 text-muted-foreground hover:text-destructive" />
                        </Button>
                    </div>
                )}

              {isUploading && (
                <div className="mt-4 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-sm text-muted-foreground mt-2">Uploading file...</p>
                </div>
              )}
            </CardContent>
          </Card>

          {csvData && (
            <Card className="shadow-elevated">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-medical-green" />
                  File Preview: {csvData.fileName}
                </CardTitle>
                <CardDescription>
                  {csvData.data.length} records loaded successfully
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="bg-muted rounded-lg p-4 mb-6">
                  <h4 className="font-semibold mb-2">Dataset Headers:</h4>
                  <div className="flex flex-wrap gap-2">
                    {csvData.headers.map((header, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                      >
                        {header}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="overflow-x-auto mb-6">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        {csvData.headers.slice(0, 6).map((header, index) => (
                          <th key={index} className="text-left p-2 font-medium">
                            {header}
                          </th>
                        ))}
                        {csvData.headers.length > 6 && (
                          <th className="text-left p-2 font-medium">...</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {csvData.data.slice(0, 5).map((row, rowIndex) => (
                        <tr key={rowIndex} className="border-b">
                          {csvData.headers.slice(0, 6).map((header, cellIndex) => (
                            <td key={cellIndex} className="p-2">
                              {row[header]}
                            </td>
                          ))}
                          {Object.keys(row).length > 6 && (
                            <td className="p-2 text-muted-foreground">...</td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {csvData.data.length > 5 && (
                    <p className="text-sm text-muted-foreground mt-2 text-center">
                      Showing first 5 rows of {csvData.data.length} total records
                    </p>
                  )}
                </div>

                <Button 
                  onClick={processBatch}
                  disabled={isProcessing}
                  size="lg"
                  className="w-full shadow-medical hover:scale-105 transition-transform"
                >
                  {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing Batch...
                      </>
                  ) : (
                      'Process Dataset'
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {batchResults && (
            <Card className="shadow-elevated animate-in fade-in slide-in-from-bottom-5 border-t-4 border-t-primary">
              <CardHeader className="pb-8">
                <CardTitle className="flex items-center gap-2 text-2xl text-primary">
                  <CheckCircle2 className="h-6 w-6" />
                  Processing Complete
                </CardTitle>
                <CardDescription className="text-base">
                   Analyzed {batchResults.total_records} patient records. Below is the population distribution and risk analysis.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                  
                  {/* Summary Cards */}
                  <div className="grid md:grid-cols-3 gap-6 mb-10">
                     <div className="bg-background border rounded-xl p-6 text-center shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-2 opacity-10">
                           <FileSpreadsheet className="w-24 h-24" />
                        </div>
                        <p className="text-muted-foreground font-medium mb-1">Total Records</p>
                        <p className="text-4xl font-bold">{batchResults.total_records}</p>
                     </div>
                     <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center shadow-sm dark:bg-green-900/10 dark:border-green-900/30">
                        <p className="text-green-700 font-medium mb-1 dark:text-green-500">Successful Predictions</p>
                        <p className="text-4xl font-bold text-green-700 dark:text-green-500">{batchResults.successful_predictions}</p>
                     </div>
                     <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center shadow-sm dark:bg-red-900/10 dark:border-red-900/30">
                        <p className="text-red-700 font-medium mb-1 dark:text-red-500">Failed Records</p>
                        <p className="text-4xl font-bold text-red-700 dark:text-red-500">{batchResults.failed_predictions}</p>
                     </div>
                  </div>

                  {/* Charts Section */}
                  <div className="grid lg:grid-cols-2 gap-8 mb-8">
                      {/* 1. Risk Distribution - Smooth Area Chart */}
                      <Card className="shadow-lg border-muted overflow-hidden relative group">
                          <div className="absolute inset-0 bg-gradient-to-br from-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                          <CardHeader>
                              <CardTitle className="text-lg flex items-center gap-2">
                                  <Activity className="h-4 w-4 text-primary" />
                                  Risk Distribution
                              </CardTitle>
                              <CardDescription>Population breakdown by risk probability</CardDescription>
                          </CardHeader>
                          <CardContent className="h-[350px]">
                              <ResponsiveContainer width="100%" height="100%">
                                  <AreaChart
                                      data={[
                                        { name: 'Low Risk', value: batchResults.predictions.filter((p: any) => p.pd_probability <= 0.3).length, fill: '#10b981' },
                                        { name: 'Moderate', value: batchResults.predictions.filter((p: any) => p.pd_probability > 0.3 && p.pd_probability <= 0.7).length, fill: '#f59e0b' },
                                        { name: 'High Risk', value: batchResults.predictions.filter((p: any) => p.pd_probability > 0.7).length, fill: '#ef4444' },
                                      ]}
                                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                  >
                                      <defs>
                                          <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                                              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                                              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                                          </linearGradient>
                                      </defs>
                                      <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 13, fontWeight: 500 }} dy={10} />
                                      <YAxis axisLine={false} tickLine={false} tick={{ fill: 'muted' }} />
                                      <Tooltip 
                                        cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 2 }}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.2)', backgroundColor: 'hsl(var(--popover))', color: 'hsl(var(--popover-foreground))' }}
                                      />
                                      <Area 
                                        type="monotone" 
                                        dataKey="value" 
                                        stroke="hsl(var(--primary))" 
                                        strokeWidth={3}
                                        fillOpacity={1} 
                                        fill="url(#colorRisk)" 
                                      />
                                  </AreaChart>
                              </ResponsiveContainer>
                          </CardContent>
                      </Card>

                       {/* 2. Success Rate Donut - Thin & Elegant */}
                       <Card className="shadow-lg border-muted overflow-hidden relative group">
                           <div className="absolute inset-0 bg-gradient-to-bl from-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                           <CardHeader>
                               <CardTitle className="text-lg flex items-center gap-2">
                                   <CheckCircle2 className="h-4 w-4 text-green-500" />
                                   Processing Status
                               </CardTitle>
                               <CardDescription>Success vs Failure Rate</CardDescription>
                           </CardHeader>
                           <CardContent className="h-[350px] relative">
                               <ResponsiveContainer width="100%" height="100%">
                                   <PieChart>
                                       <Pie
                                           data={[
                                               { name: 'Success', value: batchResults.successful_predictions, fill: '#10b981' },
                                               { name: 'Failed', value: batchResults.failed_predictions, fill: '#ef4444' },
                                           ]}
                                           cx="50%"
                                           cy="50%"
                                           innerRadius={80}
                                           outerRadius={100}
                                           paddingAngle={2}
                                           dataKey="value"
                                           cornerRadius={5}
                                       >
                                           <Cell key="cell-0" fill="#10b981" strokeWidth={0} />
                                           <Cell key="cell-1" fill="#ef4444" strokeWidth={0} />
                                       </Pie>
                                       <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.2)' }} />
                                       <Legend verticalAlign="bottom" height={36} iconType="circle"/>
                                   </PieChart>
                               </ResponsiveContainer>
                               {/* Center Text Overlay */}
                               <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                                   <span className="text-4xl font-bold">{batchResults.total_records}</span>
                                   <span className="text-xs text-muted-foreground uppercase tracking-widest">Total</span>
                               </div>
                           </CardContent>
                       </Card>

                       {/* 3. Age vs Risk Correlation - Modern Scatter */}
                       {batchResults.predictions.some((p: any) => p.features && p.features.age) && (
                           <Card className="shadow-lg border-muted lg:col-span-2 overflow-hidden relative group">
                               <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                               <CardHeader>
                                   <CardTitle className="text-lg flex items-center gap-2">
                                       <Activity className="h-4 w-4 text-primary" />
                                       Age vs. Risk Analysis
                                   </CardTitle>
                                   <CardDescription>Correlation between patient age and predicted probability</CardDescription>
                               </CardHeader>
                               <CardContent className="h-[400px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
                                            <XAxis 
                                                type="number" 
                                                dataKey="age" 
                                                name="Age" 
                                                unit=" yrs" 
                                                tickLine={false} 
                                                axisLine={false} 
                                                tick={{ fill: 'muted' }}
                                                label={{ value: 'Patient Age', position: 'insideBottom', offset: -10, fill: 'muted' }} 
                                            />
                                            <YAxis 
                                                type="number" 
                                                dataKey="prob" 
                                                name="Probability" 
                                                unit="%" 
                                                tickLine={false} 
                                                axisLine={false} 
                                                tick={{ fill: 'muted' }}
                                                domain={[0, 100]} 
                                            />
                                            <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.2)' }} />
                                            <Scatter name="Patients" data={batchResults.predictions.map((p: any) => ({ 
                                                age: p.features?.age || 0, 
                                                prob: (p.pd_probability * 100).toFixed(1) 
                                            }))}>
                                                {batchResults.predictions.map((entry: any, index: number) => (
                                                    <Cell key={`cell-${index}`} fill={entry.pd_probability > 0.5 ? '#ef4444' : '#10b981'} fillOpacity={0.6} />
                                                ))}
                                            </Scatter>
                                        </ScatterChart>
                                    </ResponsiveContainer>
                               </CardContent>
                           </Card>
                       )}

                       {/* 4. Feature Breakdown & Demographics */}
                       <div className="lg:col-span-2 grid md:grid-cols-2 gap-8">
                            {/* Jitter Distribution */}
                            <Card className="shadow-lg border-muted">
                                <CardHeader>
                                    <CardTitle className="text-lg">Voice Jitter Distribution</CardTitle>
                                    <CardDescription>Spread of vocal instability across patients</CardDescription>
                                </CardHeader>
                                <CardContent className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            data={[0, 0.002, 0.004, 0.006, 0.008, 0.01].map((binStart, i) => {
                                                const count = batchResults.predictions.filter((p: any) => {
                                                    const val = p.features?.jitter_local || 0;
                                                    return val >= binStart && val < binStart + 0.002;
                                                }).length;
                                                return { x: `< ${(binStart+0.002).toFixed(3)}`, y: count };
                                            })}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                                            <XAxis dataKey="x" fontSize={11} tickLine={false} axisLine={false} />
                                            <Tooltip contentStyle={{ borderRadius: '8px' }} />
                                            <Bar dataKey="y" fill="#8884d8" radius={[4, 4, 0, 0]} name="Patients">
                                                {/* Gradient Fill similar to risk chart */}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>

                            {/* Age Demographics Donut */}
                            <Card className="shadow-lg border-muted">
                                <CardHeader>
                                    <CardTitle className="text-lg">Age Demographics</CardTitle>
                                    <CardDescription>Patient age segments</CardDescription>
                                </CardHeader>
                                <CardContent className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={[
                                                    { name: '< 50', value: batchResults.predictions.filter((p: any) => (p.features?.age || 0) < 50).length, fill: '#60a5fa' },
                                                    { name: '50-70', value: batchResults.predictions.filter((p: any) => (p.features?.age || 0) >= 50 && (p.features?.age || 0) <= 70).length, fill: '#8b5cf6' },
                                                    { name: '> 70', value: batchResults.predictions.filter((p: any) => (p.features?.age || 0) > 70).length, fill: '#f59e0b' },
                                                ].filter(d => d.value > 0)}
                                                cx="50%" cy="50%"
                                                innerRadius={60} outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                <Cell fill="#60a5fa" />
                                                <Cell fill="#8b5cf6" />
                                                <Cell fill="#f59e0b" />
                                            </Pie>
                                            <Tooltip contentStyle={{ borderRadius: '8px' }} />
                                            <Legend verticalAlign="bottom" />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                       </div>

                       </div>
                       
                  <div className="flex justify-center">
                      <Button className="bg-gradient-hero shadow-lg gap-2" size="lg">
                          <Download className="w-4 h-4" /> Download Full Analysis Report
                      </Button>
                  </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </section>
  );
};

export default CsvUpload;