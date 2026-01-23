import React from 'react';
import HeroSection from '@/components/HeroSection';
import { Brain, Activity, ShieldCheck, Users, ArrowRight, Headset, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <HeroSection />

      {/* Statistics Section */}
      <section className="py-24 bg-background relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5 -skew-y-3 transform origin-top-left scale-110"></div>
        <div className="container mx-auto px-6 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            <div className="group p-8 bg-card/50 backdrop-blur-sm rounded-2xl shadow-sm border hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600 mb-2">96.5%</div>
              <div className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">Detection Accuracy</div>
            </div>
            <div className="group p-8 bg-card/50 backdrop-blur-sm rounded-2xl shadow-sm border hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600 mb-2">&lt; 2s</div>
              <div className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">Processing Time</div>
            </div>
            <div className="group p-8 bg-card/50 backdrop-blur-sm rounded-2xl shadow-sm border hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600 mb-2">5</div>
              <div className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">ML Algorithms</div>
            </div>
            <div className="group p-8 bg-card/50 backdrop-blur-sm rounded-2xl shadow-sm border hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600 mb-2">7k+</div>
              <div className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">Data Points</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold mb-4 tracking-tight">Comprehensive Analysis Platform</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our platform serves as a supporting tool for early Parkinson’s screening, helping clinicians analyze patient patterns for better disease monitoring.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            <div className="flex flex-col items-center text-center group">
              <div className="h-20 w-20 bg-blue-50 dark:bg-blue-900/20 rounded-2xl rotate-3 flex items-center justify-center mb-8 text-blue-600 shadow-lg group-hover:rotate-6 transition-transform duration-300">
                <ShieldCheck className="h-10 w-10" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Early Detection</h3>
              <p className="text-muted-foreground leading-relaxed">
                Identify potential risks before severe symptoms appear using subtle vocal biomarkers and tremor analysis.
              </p>
            </div>
            <div className="flex flex-col items-center text-center group">
              <div className="h-20 w-20 bg-green-50 dark:bg-green-900/20 rounded-2xl -rotate-3 flex items-center justify-center mb-8 text-green-600 shadow-lg group-hover:-rotate-6 transition-transform duration-300">
                <Activity className="h-10 w-10" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Stage Classification</h3>
              <p className="text-muted-foreground leading-relaxed">
                Proprietary algorithms predict the severity and progression stage (UPDRS) of the disease with precision.
              </p>
            </div>
            <div className="flex flex-col items-center text-center group">
              <div className="h-20 w-20 bg-purple-50 dark:bg-purple-900/20 rounded-2xl rotate-3 flex items-center justify-center mb-8 text-purple-600 shadow-lg group-hover:rotate-6 transition-transform duration-300">
                <Brain className="h-10 w-10" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Ensemble Methodology</h3>
              <p className="text-muted-foreground leading-relaxed">
                A multi-model ensemble of SVM, KNN, LSTM, and tree-based classifiers yields more scientifically robust outcomes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Research Papers & Documentation Section */}
      <section className="py-24 bg-gradient-to-b from-secondary/30 to-background">
        <div className="container mx-auto px-6 text-center">
            <h2 className="text-3xl font-bold mb-6">Research & Documentation</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-16 opacity-80">
                Built upon rigorous scientific research. Access verified methodologies and datasets.
            </p>
            
            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                <div className="bg-card p-10 rounded-2xl shadow-sm border text-left hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                    <h3 className="text-2xl font-bold mb-3">Technical Documentation</h3>
                    <p className="text-muted-foreground mb-6">
                        Explore the detailed architecture, system design, and algorithm implementation details.
                    </p>
                    <a href="https://drive.google.com/drive/folders/142Q90U_z82wPx0ltZKQdMGdZQiXCf8xC?usp=drive_link" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-primary font-semibold hover:gap-3 transition-all">
                        View Docs <ArrowRight className="h-4 w-4" />
                    </a>
                </div>
                <div className="bg-card p-10 rounded-2xl shadow-sm border text-left hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                    <h3 className="text-2xl font-bold mb-3">Research Papers</h3>
                    <p className="text-muted-foreground mb-6">
                        Read our published findings on vocal biomarkers and machine learning efficacy in PD detection.
                    </p>
                    <a href="https://drive.google.com/drive/folders/142Q90U_z82wPx0ltZKQdMGdZQiXCf8xC?usp=drive_link" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-primary font-semibold hover:gap-3 transition-all">
                        Access Papers <ArrowRight className="h-4 w-4" />
                    </a>
                </div>
            </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-24">
        <div className="container mx-auto px-6">
            <div className="text-center mb-16">
                <h2 className="text-3xl font-bold mb-4">Get in Touch</h2>
                <p className="text-muted-foreground">Have specific requirements or research questions? Contact us.</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-16 max-w-5xl mx-auto items-center">
                <div className="space-y-10">
                    <div className="flex items-start gap-6">
                        <div className="h-14 w-14 bg-gradient-hero rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg">
                            <Users className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold mb-2">Research Team</h3>
                            <p className="text-muted-foreground leading-relaxed">
                                Curating advanced ML solutions for accessible healthcare diagnostics.
                            </p>
                        </div>
                    </div>
                     <div className="flex items-start gap-6">
                        <div className="h-14 w-14 bg-gradient-hero rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg">
                            <Activity className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold mb-2">Clinical Partners</h3>
                            <p className="text-muted-foreground leading-relaxed">
                                Validated against medical datasets and clinical trials.
                            </p>
                        </div>
                    </div>
                     <div className="flex items-start gap-6">
                        <div className="h-14 w-14 bg-gradient-hero rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg">
                            <Headset className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold mb-2">Technical Support</h3>
                            <p className="text-muted-foreground leading-relaxed">
                                24/7 dedicated assistance for platform integration and API usage.
                            </p>
                        </div>
                    </div>
                     <div className="flex items-start gap-6">
                        <div className="h-14 w-14 bg-gradient-hero rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg">
                            <Users className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold mb-2">Community Support</h3>
                            <p className="text-muted-foreground leading-relaxed">
                                Join our growing community of researchers and developers.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-card p-8 md:p-10 rounded-3xl shadow-2xl border-t border-white/20 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
                    <form className="space-y-6 relative z-10" onSubmit={(e) => e.preventDefault()}>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold ml-1">First Name</label>
                                <input className="w-full p-3 rounded-lg border bg-background/50 focus:bg-background transition-colors focus:ring-2 focus:ring-primary/20 outline-none" placeholder="John" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold ml-1">Last Name</label>
                                <input className="w-full p-3 rounded-lg border bg-background/50 focus:bg-background transition-colors focus:ring-2 focus:ring-primary/20 outline-none" placeholder="Doe" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold ml-1">Email</label>
                            <input className="w-full p-3 rounded-lg border bg-background/50 focus:bg-background transition-colors focus:ring-2 focus:ring-primary/20 outline-none" placeholder="john@example.com" type="email" />
                        </div>
                         <div className="space-y-2">
                            <label className="text-sm font-semibold ml-1">Message</label>
                             <textarea className="w-full p-3 rounded-lg border bg-background/50 focus:bg-background transition-colors focus:ring-2 focus:ring-primary/20 outline-none min-h-[120px]" placeholder="How can we help?" />
                        </div>
                        <Button className="w-full h-12 text-lg bg-gradient-hero hover:opacity-90 shadow-lg">Send Message</Button>
                    </form>
                </div>
            </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-background border-t border-border">
        <div className="container mx-auto px-6">
          <div className="bg-gradient-hero rounded-3xl p-6 md:p-16 text-center text-white relative overflow-hidden shadow-2xl">
              <div className="relative z-10 max-w-3xl mx-auto">
                <h2 className="text-3xl md:text-5xl font-bold mb-6">Ready to check your health?</h2>
                <p className="text-xl opacity-90 mb-8">
                  Get an instant assessment using our advanced machine learning models. Safe, secure, and private.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <Link to="/register" className="w-full sm:w-auto">
                        <Button size="lg" variant="outline" className="w-full sm:w-auto min-w-[200px] h-14 px-4 md:px-8 text-base md:text-lg bg-white/10 text-white border-white hover:bg-white/20">
                            Get Started
                        </Button>
                    </Link>
                    <Link to="/login" className="w-full sm:w-auto">
                      <Button size="lg" variant="secondary" className="w-full sm:w-auto min-w-[200px] shadow-lg h-14 px-4 md:px-8 text-base md:text-lg">
                        Start Assessment Now <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    </Link>
                </div>
              </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
