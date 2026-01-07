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
  age: number;
  tremor_score: number;
  handwriting_score: number;
  jitter_local: number;
  shimmer_local: number;
  bradykinesia: number;
  rigidity: number;
}

const QuestionnaireForm = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<FormData>({
    age: 65,
    tremor_score: 1,
    handwriting_score: 1,
    jitter_local: 0.5,
    shimmer_local: 0.3,
    bradykinesia: 1,
    rigidity: 1,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PredictionResponse | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Filter out UI-only fields
      const apiData = {
        age: formData.age,
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

  const updateFormData = (field: keyof FormData, value: number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
                                <p className="text-sm font-medium text-muted-foreground mb-1">PD Probability</p>
                                <div className="flex items-baseline gap-2">
                                    <span className={`text-4xl font-bold ${result.pd_probability > 0.5 ? 'text-red-600' : 'text-green-600'}`}>
                                        {(result.pd_probability * 100).toFixed(1)}%
                                    </span>
                                    <span className="text-sm font-medium text-muted-foreground">confidence</span>
                                </div>
                                <p className={`mt-2 text-sm font-medium ${result.pd_probability > 0.5 ? 'text-red-700' : 'text-green-700'}`}>
                                    {result.pd_probability > 0.5 ? 'High probability of Parkinson\'s traits' : 'Low probability of Parkinson\'s traits'}
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
                        onClick={() => setResult(null)}
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
                      value={formData.age}
                      onChange={(e) => updateFormData('age', parseInt(e.target.value) || 0)}
                      min="18"
                      max="100"
                      className="shadow-card"
                    />
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