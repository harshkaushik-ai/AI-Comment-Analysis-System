


import React from 'react';
import { Mail, Github, BookOpen } from 'lucide-react';
import Contact from '../pages/Contact';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const BG_COLOR = "bg-white"; 
  const BORDER_COLOR = "border-blue-100";
  const TEXT_COLOR = "text-gray-600";
  const ACCENT_HOVER = "hover:text-blue-600 transition duration-150";

  return (
    <footer className={`${BG_COLOR} ${TEXT_COLOR} border-t ${BORDER_COLOR} mt-12 p-8`}>
      <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
        
        
        <div className="space-y-3 col-span-2 md:col-span-1">
          <div className="text-xl font-extrabold tracking-tight text-blue-800">
            📊 CommentAnalyzer
          </div>
          <p className="text-sm">
            AI-powered comment moderation for social media.
          </p>
          <p className="text-xs text-gray-400">
            © {currentYear} CommetAnalyzer, LLC.
          </p>
        </div>

     
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-800 uppercase text-sm">Quick Links</h3>
          <ul className="space-y-2 text-sm">
            <li><a href="/" className={ACCENT_HOVER}>Dashboard</a></li>
            
            <li><a href="/docs" className={ACCENT_HOVER}>Scoring Guide (Docs)</a></li>
          </ul>
        </div>

        
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-800 uppercase text-sm">Resources</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <a href="#" className={ACCENT_HOVER}>Privacy Policy</a>
            </li>
            <li>
              <a href="#" className={ACCENT_HOVER}>Terms of Service</a>
            </li>
            <li>
              <a href="https://huggingface.co/unitary/toxic-bert" target="_blank" rel="noopener noreferrer" className={ACCENT_HOVER}>
                <BookOpen size={14} className="inline mr-1 align-sub" /> Model Source
              </a>
            </li>
          </ul>
        </div>

       
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-800 uppercase text-sm">Get In Touch</h3>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center">
              <Mail size={16} className="mr-2 text-blue-400" />
              <a href="/contact" className={ACCENT_HOVER}>
                support@Commentanalyzer.com
              </a>
            </li>
            <li className="flex items-center">
              <Github size={16} className="mr-2 text-blue-400" />
              <a href="https://github.com/harshkaushik-ai/AI-Comment-Analysis-System" target="_blank" rel="noopener noreferrer" className={ACCENT_HOVER}>
                Project GitHub
              </a>
            </li>
          </ul>
        </div>
        
      </div>
      
   
      <div className="max-w-6xl mx-auto pt-6 mt-6 border-t border-blue-50 text-xs text-center text-gray-400">
        <p>Built with React & powered by the unitary/toxic-bert model for research purposes.</p>
      </div>
    </footer>
  );
}