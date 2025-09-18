import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { Activity, User, HandMetal, Mic } from 'lucide-react';

interface FormData {
  age: number;
  tremorScore: number;
  handwritingScore: number;
  jitter: number;
  shimmer: number;
  bradykinesia: number;
  rigidity: number;
}

const QuestionnaireForm = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<FormData>({
    age: 65,
    tremorScore: 1,
    handwritingScore: 1,
    jitter: 0.5,
    shimmer: 0.3,
    bradykinesia: 1,
    rigidity: 1,
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Simulate API call to Flask backend
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Assessment Complete",
        description: "Your results have been calculated and displayed below.",
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
                          value={[formData.tremorScore]}
                          onValueChange={(value) => updateFormData('tremorScore', value[0])}
                          max={4}
                          step={0.5}
                          className="w-full"
                        />
                        <div className="flex justify-between text-sm text-muted-foreground mt-1">
                          <span>None</span>
                          <span className="font-medium">{formData.tremorScore}</span>
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
                          value={[formData.jitter]}
                          onValueChange={(value) => updateFormData('jitter', value[0])}
                          max={2}
                          step={0.1}
                          className="w-full"
                        />
                        <div className="flex justify-between text-sm text-muted-foreground mt-1">
                          <span>0%</span>
                          <span className="font-medium">{formData.jitter.toFixed(1)}%</span>
                          <span>2%</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label>Shimmer (%)</Label>
                      <div className="px-2 py-4 cursor-pointer">
                        <Slider
                          value={[formData.shimmer]}
                          onValueChange={(value) => updateFormData('shimmer', value[0])}
                          max={1}
                          step={0.05}
                          className="w-full"
                        />
                        <div className="flex justify-between text-sm text-muted-foreground mt-1">
                          <span>0%</span>
                          <span className="font-medium">{formData.shimmer.toFixed(2)}%</span>
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
                        value={[formData.handwritingScore]}
                        onValueChange={(value) => updateFormData('handwritingScore', value[0])}
                        max={4}
                        step={0.5}
                        className="w-full"
                      />
                      <div className="flex justify-between text-sm text-muted-foreground mt-1">
                        <span>Normal</span>
                        <span className="font-medium">{formData.handwritingScore}</span>
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
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default QuestionnaireForm;