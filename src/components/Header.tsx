import { NavSection } from '../types';
import { Menu, X, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import QBenchLogo from './QBenchLogo';

interface HeaderProps {
  activeSection: NavSection;
  onNavigate: (section: NavSection) => void;
}

export default function Header({ activeSection, onNavigate }: HeaderProps) {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems: { id: NavSection; label: string }[] = [
    { id: 'home', label: 'Home' },
    { id: 'services', label: 'Services' },
    { id: 'packages', label: 'Packages' },
    { id: 'portfolio', label: 'Portfolio' },
    { id: 'process', label: 'Process' },
    { id: 'contact', label: 'Contact' },
  ];

  return (
    <header id="app-header" className="sticky top-0 z-50 w-full border-b border-brand-outline/20 bg-brand-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-12">
        {/* Logo */}
        <div 
          id="brand-logo-container"
          className="flex cursor-pointer items-center"
          onClick={() => onNavigate('home')}
        >
          <QBenchLogo variant="horizontal" iconSize={40} />
        </div>

        {/* Desktop Navigation */}
        <nav id="desktop-nav" className="hidden md:flex items-center space-x-8">
          {menuItems.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                id={`nav-item-${item.id}`}
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`relative px-1 py-2 font-display text-sm font-semibold transition-colors duration-200 outline-none cursor-pointer ${
                  isActive ? 'text-brand-primary' : 'text-brand-text-muted hover:text-brand-text'
                }`}
              >
                {item.label}
                {isActive && (
                  <span 
                    id={`active-underline-${item.id}`}
                    className="absolute bottom-0 left-0 h-0.5 w-full bg-brand-primary rounded-full" 
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* CTA Button */}
        <div id="desktop-cta-container" className="hidden md:flex items-center">
          <button
            id="start-project-btn-header"
            onClick={() => onNavigate('contact')}
            className="flex items-center space-x-2 rounded-xl bg-brand-primary px-5 py-2.5 font-display text-xs font-semibold tracking-wider text-white hover:bg-brand-primary-light transition-all duration-300 shadow-sm cursor-pointer"
          >
            <span>Start a Project</span>
            <ArrowRight id="start-project-arrow" className="h-4 w-4" />
          </button>
        </div>

        {/* Mobile menu button */}
        <div id="mobile-menu-trigger-container" className="flex md:hidden">
          <button
            id="mobile-menu-toggle-btn"
            onClick={() => setIsOpen(!isOpen)}
            className="rounded-lg p-2 text-brand-text hover:bg-brand-surface-low focus:outline-none cursor-pointer"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      {isOpen && (
        <div id="mobile-nav-menu" className="md:hidden border-b border-brand-outline/20 bg-brand-background px-6 py-4 animate-fade-in">
          <div className="flex flex-col space-y-4">
            {menuItems.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <button
                  id={`mobile-nav-item-${item.id}`}
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    setIsOpen(false);
                  }}
                  className={`py-2 text-left font-display text-base font-semibold ${
                    isActive ? 'text-brand-primary pl-2 border-l-2 border-brand-primary' : 'text-brand-text-muted'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
            <button
              id="mobile-start-project-btn"
              onClick={() => {
                onNavigate('contact');
                setIsOpen(false);
              }}
              className="flex items-center justify-center space-x-2 rounded-xl bg-brand-primary py-3 text-center font-display text-sm font-semibold text-white cursor-pointer"
            >
              <span>Start a Project</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
