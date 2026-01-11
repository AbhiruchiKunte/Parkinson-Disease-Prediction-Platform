import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { Activity, User, HandMetal, Mic } from 'lucide-react';
import { api, PredictionResponse } from '@/lib/api';
import { Brain } from 'lucide-react';

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

const QuestionnaireForm = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<FormData>(INITIAL_STATE);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PredictionResponse | null>(null);

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
      // Filter out UI-only fields
      const apiData = {
        age: Number(formData.age),
        tremor_score: formData.tremor_score,
        handwriting_score: formData.handwriting_score,
        jitter_local: formData.jitter_local,
        shimmer_local: formData.shimmer_local
      };

      const response = await api.predict(apiData);
      setResult(response);
      
      toast({
        title: "Assessment Complete",
        description: "Analysis processed successfully.",
      });
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

  return (
    <section id="assessment" className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">Clinical Assessment</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Complete this comprehensive assessment to analyze potential indicators of Parkinson's disease.
          </p>
        </div>

        <Card className="max-w-4xl mx-auto shadow-elevated">
          <CardHeader className="bg-gradient-card">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Patient Assessment Form
            </CardTitle>
            <CardDescription>
              Please provide accurate information for the most reliable analysis.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            {result ? (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className={`p-6 rounded-2xl border ${result.pd_probability > 0.5 ? 'bg-red-50 border-red-200 dark:bg-red-900/10' : 'bg-green-50 border-green-200 dark:bg-green-900/10'}`}>
                        <div className="flex items-center gap-4 mb-4">
                            <div className={`p-3 rounded-full ${result.pd_probability > 0.5 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                <Brain className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold">Analysis Result</h3>
                                <p className="text-muted-foreground">Based on provided clinical biomarkers</p>
                            </div>
                        </div>
                        
                        <div className="grid md:grid-cols-2 gap-6 mt-6">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground mb-3">PD Probability (Combined)</p>
                                
                                {/* Random Forest Result */}
                                <div className="mb-4">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-sm font-medium">Random Forest</span>
                                        <span className={`text-lg font-bold ${(result.pd_probability_rf ?? result.pd_probability) > 0.5 ? 'text-red-600' : 'text-green-600'}`}>
                                           {((result.pd_probability_rf ?? result.pd_probability) * 100).toFixed(1)}%
                                        </span>
                                    </div>
                                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full ${(result.pd_probability_rf ?? result.pd_probability) > 0.5 ? 'bg-red-500' : 'bg-green-500'}`} 
                                            style={{ width: `${(result.pd_probability_rf ?? result.pd_probability) * 100}%` }} 
                                        />
                                    </div>
                                </div>

                                {/* SVM Result */}
                                {(result.pd_probability_svm !== undefined) && (
                                    <div className="mb-4">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-sm font-medium">SVM Model</span>
                                            <span className={`text-lg font-bold ${result.pd_probability_svm > 0.5 ? 'text-red-600' : 'text-green-600'}`}>
                                            {(result.pd_probability_svm * 100).toFixed(1)}%
                                            </span>
                                        </div>
                                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full ${result.pd_probability_svm > 0.5 ? 'bg-red-500' : 'bg-green-500'}`} 
                                                style={{ width: `${result.pd_probability_svm * 100}%` }} 
                                            />
                                        </div>
                                    </div>
                                )}

                                <p className={`mt-2 text-sm font-medium ${result.pd_probability > 0.5 ? 'text-red-700' : 'text-green-700'}`}>
                                    {result.pd_probability > 0.5 ? 'High probability of Parkinson\'s traits detected' : 'Low probability of Parkinson\'s traits detected'}
                                </p>
                            </div>
                            
                            <div className="space-y-3">
                                <p className="text-sm font-medium text-muted-foreground">Stage Probability</p>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span>Early Stage</span>
                                        <span className="font-bold">{(result.stage_probs.early * 100).toFixed(0)}%</span>
                                    </div>
                                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-500" style={{ width: `${result.stage_probs.early * 100}%` }} />
                                    </div>
                                    
                                    <div className="flex justify-between text-sm">
                                        <span>Mid Stage</span>
                                        <span className="font-bold">{(result.stage_probs.mid * 100).toFixed(0)}%</span>
                                    </div>
                                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                                        <div className="h-full bg-yellow-500" style={{ width: `${result.stage_probs.mid * 100}%` }} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {result.top_features && result.top_features.length > 0 && (
                            <div className="mt-6 pt-6 border-t border-border/50">
                                <p className="text-sm font-medium text-muted-foreground mb-3">Key Contributing Factors</p>
                                <div className="flex flex-wrap gap-2">
                                    {result.top_features.map((feature, i) => (
                                        <span key={i} className="px-3 py-1 bg-background rounded-full border shadow-sm text-sm font-medium">
                                            {feature.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    
                    <Button 
                        variant="outline" 
                        size="lg" 
                        className="w-full"
                        onClick={handleReset}
                    >
                        Start New Assessment
                    </Button>
                </div>
            ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid md:grid-cols-2 gap-8">
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

                {/* Motor Symptoms */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2 mb-4">
                    <HandMetal className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Motor Symptoms</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <Label>Tremor Score (0-4)</Label>
                      <div className="px-2 py-4 cursor-pointer">
                        <Slider
                          value={[formData.tremor_score]}
                          onValueChange={(value) => updateFormData('tremor_score', value[0])}
                          max={4}
                          step={0.5}
                          className="w-full"
                        />
                        <div className="flex justify-between text-sm text-muted-foreground mt-1">
                          <span>None</span>
                          <span className="font-medium">{formData.tremor_score}</span>
                          <span>Severe</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label>Bradykinesia Score (0-4)</Label>
                      <div className="px-2 py-4 cursor-pointer">
                        <Slider
                          value={[formData.bradykinesia]}
                          onValueChange={(value) => updateFormData('bradykinesia', value[0])}
                          max={4}
                          step={0.5}
                          className="w-full"
                        />
                        <div className="flex justify-between text-sm text-muted-foreground mt-1">
                          <span>None</span>
                          <span className="font-medium">{formData.bradykinesia}</span>
                          <span>Severe</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label>Rigidity Score (0-4)</Label>
                      <div className="px-2 py-4 cursor-pointer">
                        <Slider
                          value={[formData.rigidity]}
                          onValueChange={(value) => updateFormData('rigidity', value[0])}
                          max={4}
                          step={0.5}
                          className="w-full"
                        />
                        <div className="flex justify-between text-sm text-muted-foreground mt-1">
                          <span>None</span>
                          <span className="font-medium">{formData.rigidity}</span>
                          <span>Severe</span>
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
                        <div className="flex justify-between text-sm text-muted-foreground mt-1">
                          <span>0%</span>
                          <span className="font-medium">{formData.jitter_local.toFixed(1)}%</span>
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
                        <div className="flex justify-between text-sm text-muted-foreground mt-1">
                          <span>0%</span>
                          <span className="font-medium">{formData.shimmer_local.toFixed(2)}%</span>
                          <span>1%</span>
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
                      <div className="flex justify-between text-sm text-muted-foreground mt-1">
                        <span>Normal</span>
                        <span className="font-medium">{formData.handwriting_score}</span>
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

              <div className="pt-6 border-t">
                <Button 
                  type="submit" 
                  size="lg" 
                  disabled={isLoading}
                  className="w-full shadow-medical"
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