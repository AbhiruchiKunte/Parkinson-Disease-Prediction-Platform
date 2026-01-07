import React, { useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Upload, X, FileText, AlertCircle, CheckCircle, Loader2, FileSpreadsheet } from 'lucide-react';
import Papa from 'papaparse';
import { api, BatchPredictionResponse } from '@/lib/api';
import { Download, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

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
    if (!file.name.endsWith('.csv')) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a CSV file.",
        variant: "destructive",
      });
      return;
    }
    if (file && file.type === "text/csv") {
      setSelectedFile(file);
      setIsUploading(true);

      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            toast({
              title: "Parse Error",
              description: "Failed to parse CSV file. Please check the format.",
              variant: "destructive",
            });
            setIsUploading(false);
            return;
          }

          const headers = results.meta.fields || [];
          const data = results.data;

          setCsvData({
            data: data,
            headers: headers,
            fileName: file.name,
          });

          setIsUploading(false);
          toast({
             title: "File Uploaded Successfully",
             description: `Loaded ${data.length} records from ${file.name}`,
           });
        }
      });
    }
  };

  const processBatch = async () => {
    if (!csvData || !selectedFile) return;

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
            Upload patient datasets in CSV format for large-scale Parkinson's screening and analysis.
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          <Card className="shadow-elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-primary" />
                Dataset Upload
              </CardTitle>
              <CardDescription>
                Upload a CSV file containing patient data for batch processing.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              {!csvData ? (
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
                    <h3 className="text-lg font-semibold mb-2">Upload CSV File</h3>
                    <p className="text-muted-foreground mb-4">
                      Drag and drop your file here, or click to browse
                    </p>
                    <input
                      type="file"
                      accept=".csv"
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
                  </div>
              ) : (
                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10 rounded-full">
                              <FileSpreadsheet className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                              <p className="font-medium">{csvData.fileName}</p>
                              <p className="text-xs text-muted-foreground">{csvData.data.length} records</p>
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
            <Card className="shadow-elevated animate-in fade-in slide-in-from-bottom-5">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10">
                <CardTitle className="flex items-center gap-2 text-primary">
                  <CheckCircle2 className="h-6 w-6" />
                  Processing Complete
                </CardTitle>
                <CardDescription>
                   Batch analysis summary for {batchResults.total_records} records.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                  <div className="grid md:grid-cols-3 gap-6 mb-8">
                     <div className="bg-background border rounded-xl p-6 text-center shadow-sm">
                        <p className="text-muted-foreground font-medium mb-1">Total Records</p>
                        <p className="text-3xl font-bold">{batchResults.total_records}</p>
                     </div>
                     <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center shadow-sm dark:bg-green-900/10 dark:border-green-900/30">
                        <p className="text-green-700 font-medium mb-1 dark:text-green-500">Successful</p>
                        <p className="text-3xl font-bold text-green-700 dark:text-green-500">{batchResults.successful_predictions}</p>
                     </div>
                     <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center shadow-sm dark:bg-red-900/10 dark:border-red-900/30">
                        <p className="text-red-700 font-medium mb-1 dark:text-red-500">Failed</p>
                        <p className="text-3xl font-bold text-red-700 dark:text-red-500">{batchResults.failed_predictions}</p>
                     </div>
                  </div>

                  <div className="flex justify-center">
                      <Button className="bg-gradient-hero shadow-lg gap-2" size="lg">
                          <Download className="w-4 h-4" /> Download Report
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