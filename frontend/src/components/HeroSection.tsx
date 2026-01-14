import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Activity, FileSpreadsheet, BarChart3 } from 'lucide-react';

const HeroSection = () => {
  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      const headerOffset = 80; // Approximate height of the fixed header
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section className="pt-24 pb-16 bg-gradient-hero relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80')] opacity-10 bg-cover bg-center mix-blend-overlay"></div>
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center text-white mb-12 animate-in fade-in slide-in-from-bottom-5 duration-700">
          <h1 className="text-4xl md:text-7xl font-bold mb-6 tracking-tight">
            Advanced Parkinson's Detection
          </h1>
          <p className="text-xl md:text-2xl mb-8 opacity-90 max-w-3xl mx-auto font-light">
            AI-powered analysis for early detection and stage classification of Parkinson's disease
            using biomarker assessment.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/prediction" className="w-full sm:w-auto">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto min-w-[200px] shadow-elevated text-lg h-14 px-8 font-semibold">
                Start Assessment
              </Button>
            </Link>
            <Link to="/about" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto min-w-[200px] bg-transparent text-white border-white hover:bg-white/10 shadow-elevated text-lg h-14 px-8">
                Learn Methodology
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {/* Card 1 */}
          <div className="group transition-all duration-300 hover:scale-[1.03] hover:shadow-elevated rounded-lg">
            <Card className="bg-white/20 border-white/30 backdrop-blur-sm transition h-full">
              <CardContent className="p-6 text-center text-white flex flex-col h-full">
                <Activity className="h-12 w-12 mx-auto mb-4 text-medical-green flex-shrink-0" />
                <h3 className="text-lg font-semibold mb-2">Clinical Assessment</h3>
                <p className="text-sm opacity-90">
                  Comprehensive questionnaire covering tremor, rigidity, and motor symptoms
                </p>
              </CardContent>
            </Card>
          </div>
          
          {/* Card 2 */}
          <div className="group transition-all duration-300 hover:scale-[1.03] hover:shadow-elevated rounded-lg">
            <Card className="bg-white/20 border-white/30 backdrop-blur-sm transition h-full">
              <CardContent className="p-6 text-center text-white flex flex-col h-full">
                <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-medical-orange flex-shrink-0" />
                <h3 className="text-lg font-semibold mb-2">Batch Processing</h3>
                <p className="text-sm opacity-90">
                  Upload patient datasets for large-scale analysis and screening
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Card 3 */}
          <div className="group transition-all duration-300 hover:scale-[1.03] hover:shadow-elevated rounded-lg">
            <Card className="bg-white/20 border-white/30 backdrop-blur-sm transition h-full">
              <CardContent className="p-6 text-center text-white flex flex-col h-full">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-medical-blue flex-shrink-0" />
                <h3 className="text-lg font-semibold mb-2">Visual Analytics</h3>
                <p className="text-sm opacity-90">
                  Interactive PCA plots and feature analysis for clinical insights
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
