// components/Layout.tsx
// 全局布局组件，包含导航栏和主要内容区域

import React from 'react';
import { useSession } from '@/hooks/useSession';
import { useTranslation } from '@/hooks/useTranslation';
import { supabase } from '@/lib/supabase';
import LanguageToggle from './LanguageToggle';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user } = useSession();
  const { t, lang } = useTranslation();

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* 导航栏 */}
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-black/20 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/" className="text-2xl font-black tracking-tighter bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
              {t.brand}
            </Link>

            {/* 右侧区域 */}
            <div className="flex items-center gap-4">
              {user && (
                <div className="hidden md:flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10">
                  <Sparkles size={14} className="text-yellow-400" />
                  <span className="text-[10px] uppercase font-bold tracking-widest text-white/50">
                    {t.labels.matchLimit}: 0/5
                  </span>
                </div>
              )}
              <LanguageToggle />
              {user && (
                <button
                  onClick={() => supabase.auth.signOut()}
                  className="text-sm text-white/50 hover:text-white transition-colors"
                >
                  {lang === 'en' ? 'Sign out' : '退出'}
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* 主内容 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
