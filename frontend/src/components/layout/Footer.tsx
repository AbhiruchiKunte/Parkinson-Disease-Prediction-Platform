import React from 'react';
import { Brain, Github, Linkedin, Mail } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-card border-t border-border mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center md:text-left">
          <div className="space-y-4">
            <div className="flex items-center justify-center md:justify-start space-x-2">
              <div className="p-1 rounded bg-gradient-hero">
                <Brain className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold">NeuroDetect</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Empowering early detection of Parkinson's Disease through advanced machine learning and voice analysis.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-foreground">Platform</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="/" className="hover:text-primary transition-colors">Home</a></li>
              <li><a href="/dashboard" className="hover:text-primary transition-colors">Dashboard</a></li>
              <li><a href="/prediction" className="hover:text-primary transition-colors">Prediction</a></li>
              <li><a href="/about" className="hover:text-primary transition-colors">About</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-foreground">Resources</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="https://drive.google.com/file/d/1kAagGYaKb30xX81rj7gTgyBzntv8sq9X/view?usp=drive_link" className="hover:text-primary transition-colors" target="_blank">Documentation</a></li>
              <li><a href="https://drive.google.com/drive/folders/142Q90U_z82wPx0ltZKQdMGdZQiXCf8xC?usp=sharing" className="hover:text-primary transition-colors" target="_blank">Research Papers</a></li>
              <li><a href="https://www.geeksforgeeks.org/machine-learning/parkinson-disease-prediction-using-machine-learning-python" className="hover:text-primary transition-colors" target="_blank">API Reference</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-foreground">Contact</h3>
            <div className="flex justify-center md:justify-start space-x-4">
              <a href="https://github.com/AbhiruchiKunte/Parkinson-Disease-Prediction-Platform" className="text-muted-foreground hover:text-primary transition-colors">
                <Github className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Mail className="h-5 w-5" />
              </a>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              © {new Date().getFullYear()} NeuroDetect. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
