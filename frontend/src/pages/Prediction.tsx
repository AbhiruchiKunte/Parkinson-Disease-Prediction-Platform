import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import QuestionnaireForm from '@/components/QuestionnaireForm';
import CsvUpload from '@/components/CsvUpload';
import { useLocation } from 'react-router-dom';

const Prediction = () => {
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const defaultTab = queryParams.get('tab') === 'upload' ? 'upload' : 'assessment';

  return (
    <div className="container mx-auto px-6 py-10 min-h-screen">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-bold tracking-tight mb-4">Parkinson's Risk Assessment</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Choose between individual clinical assessment or batch processing for large datasets.
          Our AI models analyze biomarkers to provide early detection insights.
        </p>
      </div>

      <Tabs defaultValue={defaultTab} className="max-w-5xl mx-auto">
        <TabsList className="grid w-full grid-cols-2 mb-8 h-16 bg-muted/30 p-1.5 rounded-xl border">
          <TabsTrigger 
            value="assessment" 
            className="h-full text-lg font-medium rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all duration-200"
          >
            Clinical Assessment
          </TabsTrigger>
          <TabsTrigger 
            value="upload" 
            className="h-full text-lg font-medium rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all duration-200"
          >
            Batch Upload
          </TabsTrigger>
        </TabsList>
        <TabsContent value="assessment" className="animate-in fade-in slide-in-from-bottom-5 duration-500">
          <QuestionnaireForm />
        </TabsContent>
        <TabsContent value="upload" className="animate-in fade-in slide-in-from-bottom-5 duration-500">
          <CsvUpload />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Prediction;
