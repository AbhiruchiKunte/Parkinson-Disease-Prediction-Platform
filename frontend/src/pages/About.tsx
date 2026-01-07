import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, Database, Network, Binary } from 'lucide-react';

const About = () => {
  return (
    <div className="container mx-auto px-6 py-10 min-h-screen">
       <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold tracking-tight mb-4">Research Methodology</h1>
                <p className="text-lg text-muted-foreground mb-6">
                    Understanding the core technologies and algorithms powering our Parkinson's Detection Platform.
                </p>
                <a href="https://drive.google.com/file/d/1kAagGYaKb30xX81rj7gTgyBzntv8sq9X/view?usp=sharing" target="_blank" rel="noopener noreferrer">
                    <Button className="gap-2">
                        <Database className="h-4 w-4" />
                        Access Full Documentation
                    </Button>
                </a>
            </div>

            <div className="space-y-12">
                {/* Section 1: PCA */}
                <section>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg text-blue-600">
                            <Binary className="h-6 w-6" />
                        </div>
                        <h2 className="text-2xl font-bold">Dimensionality Reduction (PCA)</h2>
                    </div>
                    <Card className="shadow-card">
                        <CardHeader>
                            <CardTitle className="text-lg">Principal Component Analysis</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="leading-relaxed text-muted-foreground">
                                We utilize Principal Component Analysis (PCA) to handle the complexity of biomedical voice data. 
                                By transforming high-dimensional data into a lower-dimensional form while preserving the most 
                                critical information (variance), we ensure our models focus on the most relevant features like 
                                pitch period entropy and jitter variants.
                            </p>
                            <div className="flex flex-wrap gap-2">
                                <Badge variant="secondary">Feature Extraction</Badge>
                                <Badge variant="secondary">Noise Reduction</Badge>
                                <Badge variant="secondary">Variance Preservation</Badge>
                            </div>
                        </CardContent>
                    </Card>
                </section>

                {/* Section 2: Machine Learning Models */}
                <section>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg text-green-600">
                            <Database className="h-6 w-6" />
                        </div>
                        <h2 className="text-2xl font-bold">Machine Learning Algorithms</h2>
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                        <Card className="shadow-card">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    Random Forest Classifier
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-4">
                                    An ensemble learning method that constructs a multitude of decision trees at training time. 
                                    It excels at handling non-linear data and preventing overfitting, achieving our highest accuracy of 98.5%.
                                </p>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span>Accuracy</span>
                                        <span className="font-bold text-green-600">98.5%</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span>Robustness</span>
                                        <span className="font-bold text-green-600">High</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="shadow-card">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    Support Vector Machine (SVM)
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Effective in high-dimensional spaces, SVM finds the optimal hyperplane to separate 
                                    Parkinson's positive and negative cases. It is particularly effective for smaller, complex datasets.
                                </p>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span>Accuracy</span>
                                        <span className="font-bold text-blue-600">96.2%</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span>Generalization</span>
                                        <span className="font-bold text-blue-600">Excellent</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </section>

                {/* Section 3: Deep Learning */}
                <section>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg text-purple-600">
                            <Brain className="h-6 w-6" />
                        </div>
                        <h2 className="text-2xl font-bold">Next Gen: Deep Learning</h2>
                    </div>
                    <Card className="shadow-card border-l-4 border-l-purple-500">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Network className="h-5 w-5" />
                                Long Short-Term Memory (LSTM)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="leading-relaxed text-muted-foreground mb-4">
                                Our future roadmap includes integrating LSTM networks for raw audio waveform analysis. 
                                LSTMs are capable of learning long-term dependencies, making them ideal for analyzing 
                                the temporal dynamics of voice tremors and speech patterns in Parkinson's patients.
                            </p>
                            <p className="text-sm font-medium text-foreground">
                                Objective: Real-time video/audio analysis for stage prediction.
                            </p>
                        </CardContent>
                    </Card>
                </section>
            </div>
       </div>
    </div>
  );
};

export default About;
