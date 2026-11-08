/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { PublicPages } from './components/PublicPages';
import { AdminPanel } from './components/AdminPanel';
import { api } from './api';
import { PublicPortalData } from './types';
import { Loader2 } from 'lucide-react';

function MainApp() {
  const [currentView, setCurrentView] = useState<string>('home');
  const [selectedSlug, setSelectedSlug] = useState<string>('about');
  const [data, setData] = useState<PublicPortalData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const portal = await api.getPublicData();
      setData(portal);
      setLoadError(null);
    } catch (err: any) {
      console.error('Failed to load public portal data:', err);
      setLoadError('تعذر تحميل بيانات المنصة، يرجى المحاولة لاحقاً');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Sync view from hash on mount or when hash changes
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (!hash) return;
      if (hash.startsWith('page/')) {
        const slug = hash.replace('page/', '');
        setSelectedSlug(slug);
        setCurrentView('cms-page');
      } else if (hash === 'admin') {
        setCurrentView('admin');
      } else if (
        [
          'home',
          'about',
          'party-leaders',
          'secretariat-leaders',
          'secretariats',
          'initiatives',
          'news',
          'events',
          'gallery',
          'join',
          'contact'
        ].includes(hash)
      ) {
        setCurrentView(hash);
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Update hash when currentView changes
  const handleSetCurrentView = (view: string) => {
    setCurrentView(view);
    if (view === 'admin') {
      window.location.hash = 'admin';
    } else if (view === 'cms-page' && selectedSlug) {
      window.location.hash = `page/${selectedSlug}`;
    } else {
      window.location.hash = view;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-4 text-center space-y-4">
        <div className="w-16 h-16 bg-red-700 text-amber-300 rounded-2xl flex items-center justify-center shadow-lg animate-pulse">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
        <div>
          <h2 className="text-xl font-black text-stone-900">حزب الجبهة الوطنية</h2>
          <p className="text-xs text-stone-500 mt-1">أمانة قسم ثالث أكتوبر – محافظة الجيزة</p>
          <p className="text-[11px] text-amber-700 font-bold mt-1">«مصر للجميع»</p>
        </div>
      </div>
    );
  }

  if (loadError || !data) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-4 text-center space-y-4">
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl max-w-md">
          <p className="text-sm font-bold">{loadError || 'خطأ في الاتصال بالخادم'}</p>
          <button
            onClick={() => {
              setLoading(true);
              loadData();
            }}
            className="mt-4 bg-red-700 text-white font-bold px-4 py-2 rounded-xl text-xs cursor-pointer hover:bg-red-800"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  // Admin View
  if (currentView === 'admin') {
    return (
      <AdminPanel
        onBackToSite={() => handleSetCurrentView('home')}
        onRefreshPublicData={loadData}
      />
    );
  }

  // Public View
  return (
    <div className="min-h-screen bg-stone-50 flex flex-col selection:bg-red-700 selection:text-white" dir="rtl">
      <Navbar
        currentView={currentView}
        setCurrentView={handleSetCurrentView}
        officialLogo={data.settings.officialLogo}
        slogan={data.settings.slogan}
      />

      <main className="flex-1">
        <PublicPages
          currentView={currentView}
          setCurrentView={handleSetCurrentView}
          data={data}
          onRefreshData={loadData}
          selectedSlug={selectedSlug}
          setSelectedSlug={setSelectedSlug}
        />
      </main>

      <Footer
        settings={data.settings}
        setCurrentView={handleSetCurrentView}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
