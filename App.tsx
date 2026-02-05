import React, { useState, useEffect } from 'react';
import { Setup } from './components/Setup';
import { LinkShare } from './components/LinkShare';
import { RsvpForm } from './components/RsvpForm';
import { Dashboard } from './components/Dashboard';
import { ViewState } from './types';
import Petals from './components/Petals';
import { CheckCircle2, EyeOff } from 'lucide-react';
import { Button } from './components/ui/Button';
import { getSupabase } from './services/supabase';
import { applyTheme } from './utils/themes';
import { resolveBackgroundStyle } from './utils/backgrounds';
import { AdminLock } from './components/AdminLock';

const App: React.FC = () => {
  // Determine initial routing synchronously to prevent flicker
  const getInitialRoute = () => {
    const path = window.location.pathname;
    const params = new URLSearchParams(window.location.search);

    // 1. Path-based Routing
    if (path.startsWith('/dashboard/')) {
      const slug = path.split('/dashboard/')[1];
      if (slug) return { view: 'dashboard' as ViewState, slug: decodeURIComponent(slug) };
    }

    if (path.endsWith('/rsvp')) {
      const parts = path.split('/');
      if (parts.length >= 3) {
        const slug = parts[parts.length - 2];
        if (slug) return { view: 'form' as ViewState, slug: decodeURIComponent(slug) };
      }
    }

    const pathParts = path.split('/').filter(Boolean);
    if (pathParts.length === 1 && pathParts[0] !== 'assets' && pathParts[0] !== 'favicon.ico') {
      return { view: 'form' as ViewState, slug: decodeURIComponent(pathParts[0]) };
    }

    // 2. Query Parameter Fallback
    if (params.get('dashboard')) {
      return { view: 'dashboard' as ViewState, slug: params.get('dashboard') || '' };
    } else if (params.get('rsvp')) {
      return { view: 'form' as ViewState, slug: params.get('rsvp') || '' };
    } else if (params.get('setup') || path === '/' || path === '/index.html') {
      return { view: 'setup' as ViewState, slug: '' };
    }

    return { view: 'setup' as ViewState, slug: '' };
  };

  const initialRoute = getInitialRoute();

  // State
  const [view, setView] = useState<ViewState>(initialRoute.view);
  const [coupleSlug, setCoupleSlug] = useState<string>(initialRoute.slug);
  const [coupleName, setCoupleName] = useState<string>('');
  const [backgroundId, setBackgroundId] = useState<string>('linen'); // Default to demo texture
  const [isLoadingName, setIsLoadingName] = useState(true);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [isPreview, setIsPreview] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Routing Logic - still needed for browser navigation (back/forward)
  useEffect(() => {
    const handlePopState = () => {
      const route = getInitialRoute();
      setView(route.view);
      setCoupleSlug(route.slug);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Fetch Couple Data (Name, Theme, Background)
  useEffect(() => {
    if (!coupleSlug) {
      if (view !== 'setup') { // Only stop loading if we aren't in setup (or setup handles itself)
        setIsLoadingName(false);
      }
      return;
    }

    const fetchCoupleData = async () => {
      try {
        setIsLoadingName(true);
        const supabase = getSupabase();

        // Fetch host to get name, theme, and background
        const { data: host, error } = await (supabase
          .from('wedding_template_couples') as any)
          .select('couple_name, theme_id, background_id, cover_image_url')
          .eq('slug', coupleSlug)
          .single();

        if (error) {
          console.error('Error fetching couple:', error);
        }

        if (host) {
          setCoupleName(host.couple_name);
          if (host.theme_id) applyTheme(host.theme_id);
          if (host.background_id) setBackgroundId(host.background_id);

          const url = (host as any).cover_image_url;
          if (url) setCoverImage(url);
        }

      } catch (err) {
        console.error(err);
      } finally {
        setIsLoadingName(false);
      }
    };

    fetchCoupleData();
  }, [coupleSlug, view]);

  const updateHistory = (newPath: string) => {
    try {
      window.history.pushState({}, '', newPath);
    } catch (e) {
      // Ignore sandbox history errors
    }
  };

  const handleSetupSuccess = (slug: string, name: string, bgId: string) => {
    setCoupleSlug(slug);
    setCoupleName(name);
    setBackgroundId(bgId);
    setView('dashboard');
    window.scrollTo(0, 0);
    updateHistory(`/dashboard/${slug}`); // Directly go to dashboard URL
  };

  const handleDashboardNav = () => {
    const newUrl = `/dashboard/${coupleSlug}`;
    updateHistory(newUrl);
    setView('dashboard');
  };

  const handleNewForm = () => {
    updateHistory('/');
    setCoupleSlug('');
    setCoupleName('');
    setView('setup');
  };

  const handleRsvpSuccess = () => {
    setView('success');
  };

  const handlePreview = () => {
    setIsPreview(true);
    setView('form');
  };

  const handleClosePreview = () => {
    setIsPreview(false);
    // If we have a slug, we assume we want to go back to the dashboard/hub
    // The 'link' view is part of the setup flow which customers don't see
    setView('dashboard');
  };

  // Helper to format name from slug if real name isn't set yet
  const getDisplayName = () => {
    if (coupleName) return coupleName;
    if (!coupleSlug) return 'Our Wedding';
    return coupleSlug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const handleCoverUpdate = (url: string) => {
    setCoverImage(url);
  };

  // Background Logic
  const backgroundStyle = resolveBackgroundStyle(backgroundId);

  return (
    <div className="min-h-screen bg-[#fafaf9] text-stone-800 font-sans selection:bg-rose-100 relative">
      {/* Background Gradient Layer (from demo project) */}
      <div
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: `radial-gradient(ellipse at top, var(--color-primary-50), #f5f5f4, #e7e5e4)`
        }}
      />

      {/* Texture Layer (from demo-rsvp) */}
      <div
        className="fixed inset-0 z-0 opacity-100 pointer-events-none"
        style={{
          backgroundImage: `url(/bg-texture.png)`,
          backgroundRepeat: 'repeat',
          backgroundSize: '300px'
        }}
      />

      <Petals />

      <div className="relative z-10">
        {/* Header - Only show for Guest Views (RSVP Form / Success) */}
        {(view === 'form' || view === 'success') && (
          <header className="mb-2 text-center animate-fade-in select-none pt-12">
            <h1 className="font-slight text-7xl md:text-9xl mb-6 drop-shadow-sm text-[var(--color-primary-600)] pb-2 leading-relaxed tracking-wider">
              {isLoadingName ? (
                <span className="opacity-0">Loading</span>
              ) : (
                getDisplayName().split('&').map((part, index, arr) => (
                  <React.Fragment key={index}>
                    {part}
                    {index < arr.length - 1 && (
                      <span className="font-serif italic mx-2 text-[0.8em]" style={{ fontWeight: 300 }}>&</span>
                    )}
                  </React.Fragment>
                ))
              )}
            </h1>
            <p className="font-serif italic text-stone-500 tracking-[0.2em] uppercase text-sm md:text-base">
              Join us on our special day
            </p>
          </header>
        )}

        <main className="container mx-auto px-4 py-8 md:py-12 min-h-[calc(100vh-200px)] flex flex-col items-center justify-center">
          <div className="w-full max-w-6xl">
            {view === 'setup' && (
              isAuthenticated ? (
                <Setup onSuccess={handleSetupSuccess} />
              ) : (
                <AdminLock onUnlock={() => {
                  setIsAuthenticated(true);
                  updateHistory('/?setup=true');
                }} />
              )
            )}

            {view === 'link' && (
              <LinkShare
                slug={coupleSlug}
                coupleName={getDisplayName()}
                onNewForm={handleNewForm}
                onDashboard={handleDashboardNav}
                onPreview={handlePreview}
              />
            )}

            {view === 'form' && (
              <>
                {isPreview && (
                  <div className="fixed top-4 right-4 z-50 animate-fade-in">
                    <Button
                      variant="secondary"
                      onClick={handleClosePreview}
                      className="shadow-2xl border-2 border-white/50 backdrop-blur-md bg-stone-900/90 text-sm py-2 px-4 flex items-center gap-2"
                    >
                      <EyeOff size={16} strokeWidth={2} /> Close Preview
                    </Button>
                  </div>
                )}
                <RsvpForm
                  slug={coupleSlug}
                  coverImage={coverImage}
                  onSuccess={handleRsvpSuccess}
                />
              </>
            )}

            {view === 'success' && (
              <div className="text-center animate-slide-up bg-white/90 backdrop-blur-xl p-12 rounded-[2rem] shadow-2xl border border-white/60 max-w-md mx-auto relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[var(--color-primary-300)] via-[var(--color-primary-500)] to-[var(--color-primary-300)]"></div>
                <div className="w-24 h-24 bg-[var(--color-primary-50)] rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                  <CheckCircle2 className="w-12 h-12 text-green-500" strokeWidth={1.5} />
                </div>
                <h2 className="font-serif text-3xl mb-4 text-stone-800">RSVP Received</h2>
                <p className="text-stone-600 mb-10 font-sans leading-relaxed text-lg font-light">
                  Thank you for your response. Your details have been saved.
                </p>

                {isPreview ? (
                  <Button variant="outline" onClick={handleClosePreview} className="flex items-center gap-2 mx-auto">
                    <EyeOff size={16} /> Back to Dashboard
                  </Button>
                ) : (
                  <p className="font-script text-4xl text-[var(--color-primary-500)]">See you there!</p>
                )}
              </div>
            )}

            {view === 'dashboard' && (
              <Dashboard
                slug={coupleSlug}
                coverImage={coverImage}
                onPreview={handlePreview}
                onCoverUpdate={handleCoverUpdate}
                backgroundStyle={backgroundStyle}
              />
            )}
          </div>
        </main>

        <footer className="py-8 text-center text-stone-400 text-xs font-bold tracking-widest uppercase opacity-60 hover:opacity-100 transition-opacity relative z-20">
          <p>&copy; {new Date().getFullYear()} Wedding RSVP. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
};

export default App;