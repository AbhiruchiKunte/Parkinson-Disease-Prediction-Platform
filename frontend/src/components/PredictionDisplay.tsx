import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, CheckCircle, TrendingUp, Activity } from 'lucide-react';

interface PredictionResult {
  probability: number;
  stage: 'Early' | 'Mid' | 'Late' | 'Negative';
  confidence: number;
  topFeatures: Array<{
    name: string;
    importance: number;
    value: number;
  }>;
}

const mockResult: PredictionResult = {
  probability: 75.3,
  stage: 'Early',
  confidence: 87.2,
  topFeatures: [
    { name: 'Tremor Score', importance: 92.5, value: 3.2 },
    { name: 'Jitter', importance: 85.1, value: 1.4 },
    { name: 'Bradykinesia', importance: 78.9, value: 2.1 },
    { name: 'Rigidity', importance: 71.3, value: 1.8 },
    { name: 'Shimmer', importance: 65.7, value: 0.42 },
  ],
};

const PredictionDisplay = () => {
  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'Early':
        return 'bg-medical-orange text-medical-orange-light';
      case 'Mid':
        return 'bg-warning text-warning-foreground';
      case 'Late':
        return 'bg-destructive text-destructive-foreground';
      case 'Negative':
        return 'bg-medical-green text-medical-green-light';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getRiskLevel = (probability: number) => {
    if (probability >= 80) return { level: 'High', color: 'text-destructive', icon: AlertTriangle };
    if (probability >= 50) return { level: 'Moderate', color: 'text-warning', icon: TrendingUp };
    if (probability >= 25) return { level: 'Low', color: 'text-medical-orange', icon: Activity };
    return { level: 'Minimal', color: 'text-medical-green', icon: CheckCircle };
  };

  const riskInfo = getRiskLevel(mockResult.probability);
  const RiskIcon = riskInfo.icon;

  return (
    <section id="results" className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">Analysis Results</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Comprehensive AI analysis based on clinical parameters and biomarkers.
          </p>
        </div>

        <div className="max-w-6xl mx-auto grid lg:grid-cols-3 gap-6">
          {/* Main Result Card */}
          <Card className="lg:col-span-2 shadow-elevated">
            <CardHeader className="bg-gradient-card">
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <RiskIcon className={`h-6 w-6 ${riskInfo.color}`} />
                  Parkinson's Risk Assessment
                </span>
                <Badge className={getStageColor(mockResult.stage)}>
                  {mockResult.stage} Stage
                </Badge>
              </CardTitle>
              <CardDescription>
                Analysis based on clinical assessment and biomarker data
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <div className="space-y-8">
                {/* Probability Score */}
                <div className="text-center">
                  <div className="relative inline-block">
                    <div className="text-6xl font-bold text-primary mb-2">
                      {mockResult.probability.toFixed(1)}%
                    </div>
                    <div className="text-lg text-muted-foreground">
                      Parkinson's Probability
                    </div>
                  </div>
                  <div className={`text-lg font-semibold mt-2 ${riskInfo.color}`}>
                    {riskInfo.level} Risk Level
                  </div>
                </div>

                {/* Confidence */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Model Confidence</span>
                    <span>{mockResult.confidence.toFixed(1)}%</span>
                  </div>
                  <Progress value={mockResult.confidence} className="h-3" />
                </div>

                {/* Top Contributing Features */}
                <div>
                  <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Top Contributing Features
                  </h4>
                  <div className="space-y-4">
                    {mockResult.topFeatures.map((feature, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{feature.name}</span>
                          <div className="text-right">
                            <div className="text-xs text-muted-foreground">
                              Value: {feature.value}
                            </div>
                            <div className="font-medium">
                              {feature.importance.toFixed(1)}% importance
                            </div>
                          </div>
                        </div>
                        <Progress value={feature.importance} className="h-2" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Clinical Recommendations */}
          <div className="space-y-6">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-lg">Clinical Recommendations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-medical-blue-light rounded-lg">
                  <h5 className="font-semibold text-medical-blue mb-2">Next Steps</h5>
                  <ul className="text-sm space-y-1 text-medical-blue">
                    <li>• Consult with neurologist</li>
                    <li>• DaTscan imaging recommended</li>
                    <li>• Monitor symptom progression</li>
                  </ul>
                </div>
                
                <div className="p-4 bg-medical-orange-light rounded-lg">
                  <h5 className="font-semibold text-medical-orange mb-2">Follow-up</h5>
                  <ul className="text-sm space-y-1 text-medical-orange">
                    <li>• Schedule 3-month reassessment</li>
                    <li>• Track daily symptoms</li>
                    <li>• Consider physical therapy</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-lg">Risk Factors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Age</span>
                    <Badge variant="outline">High</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Motor Symptoms</span>
                    <Badge variant="outline">Moderate</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Voice Analysis</span>
                    <Badge variant="outline">Elevated</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Family History</span>
                    <Badge variant="outline">Unknown</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PredictionDisplay;