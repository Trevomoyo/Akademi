import React from 'react';
import { Home, BookOpen, FileText, User } from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  onNavigate: (route: string) => void;
  themeColor?: string;
}

export function BottomNav({ activeTab, onNavigate, themeColor = "var(--primary)" }: BottomNavProps) {
  const tabs = [
    { label: "Home",     icon: Home,     route: "/dashboard" },
    { label: "Subjects", icon: BookOpen, route: "/dashboard" },
    { label: "Papers",   icon: FileText, route: "/pastpapers" },
    { label: "Profile",  icon: User,     route: "/profile" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 bg-[var(--surface)]/90 backdrop-blur-md border-t border-[var(--border)] z-50 md:hidden flex justify-around items-center pb-safe">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.route;
        return (
          <button
            key={tab.label}
            onClick={() => onNavigate(tab.route)}
            className="flex flex-col items-center justify-center w-full h-full pt-1 pb-1 transition-colors"
            style={{ color: isActive ? themeColor : 'var(--text-muted)' }}
          >
            <Icon size={24} className="mb-1" />
            <span className="text-[9px] font-medium">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
