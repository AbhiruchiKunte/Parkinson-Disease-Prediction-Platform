import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle } from 'lucide-react';
import Papa from 'papaparse';

interface CsvData {
  data: any[];
  headers: string[];
  fileName: string;
}

const CsvUpload = () => {
  const { toast } = useToast();
  const [csvData, setCsvData] = useState<CsvData | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);

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

    setIsUploading(true);

    Papa.parse(file, {
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

        const headers = results.data[0] as string[];
        const data = results.data.slice(1);

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
      },
      header: false,
      skipEmptyLines: true,
    });
  };

  const processBatch = async () => {
    if (!csvData) return;

    setIsProcessing(true);
    
    try {
      // Simulate batch processing
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      toast({
        title: "Batch Processing Complete",
        description: `Successfully analyzed ${csvData.data.length} patient records.`,
      });
    } catch (error) {
      toast({
        title: "Processing Error",
        description: "Failed to process batch data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
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
                />
                <Button asChild variant="outline">
                  <label htmlFor="csv-upload" className="cursor-pointer">
                    Choose File
                  </label>
                </Button>
              </div>

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
                          {row.slice(0, 6).map((cell: any, cellIndex: number) => (
                            <td key={cellIndex} className="p-2">
                              {cell}
                            </td>
                          ))}
                          {row.length > 6 && (
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
                  className="w-full shadow-medical"
                >
                  {isProcessing ? 'Processing Batch...' : 'Process Dataset'}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </section>
  );
};

export default CsvUpload;