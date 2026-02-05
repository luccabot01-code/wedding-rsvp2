import React, { useState, useEffect } from 'react';
import { getSupabase } from '../services/supabase';
import { Button } from './ui/Button';
import { Heart, Sparkles, Gem, ArrowRight, User, ExternalLink, RefreshCw, Trash2 } from 'lucide-react';
import { ThemeSelector } from './ThemeSelector';
import { BackgroundSelector } from './BackgroundSelector';
import { ConfirmModal } from './ui/ConfirmModal';
import { Host } from '../types';

interface SetupProps {
  onSuccess: (slug: string, name: string, backgroundId: string) => void;
}

export const Setup: React.FC<SetupProps> = ({ onSuccess }) => {
  const [names, setNames] = useState('');
  const [themeId, setThemeId] = useState('rose');
  const [backgroundUrl, setBackgroundUrl] = useState('');
  const [backgroundFile, setBackgroundFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [recentCouples, setRecentCouples] = useState<Host[]>([]);
  const [loadingCouples, setLoadingCouples] = useState(true);

  // Delete Modal State
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    couple: Host | null;
    isDeleting: boolean;
  }>({
    isOpen: false,
    couple: null,
    isDeleting: false
  });

  useEffect(() => {
    fetchRecentCouples();
  }, []);

  const fetchRecentCouples = async () => {
    try {
      setLoadingCouples(true);
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('wedding_template_couples')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setRecentCouples(data || []);
    } catch (err) {
      console.error('Error fetching recent couples:', err);
    } finally {
      setLoadingCouples(false);
    }
  };

  const openDeleteModal = (couple: Host) => {
    setDeleteModal({ isOpen: true, couple, isDeleting: false });
  };

  const handleDeleteCouple = async () => {
    if (!deleteModal.couple) return;

    try {
      setDeleteModal(prev => ({ ...prev, isDeleting: true }));
      const supabase = getSupabase();

      // Delete RSVPs first
      await supabase
        .from('wedding_template_rsvps')
        .delete()
        .eq('couple_id', deleteModal.couple.id);

      // Delete the couple
      const { error } = await supabase
        .from('wedding_template_couples')
        .delete()
        .eq('id', deleteModal.couple.id);

      if (error) throw error;

      setDeleteModal({ isOpen: false, couple: null, isDeleting: false });
      fetchRecentCouples();
    } catch (err: any) {
      console.error('Error deleting couple:', err);
      alert('Error: ' + (err.message || 'Could not delete couple.'));
      setDeleteModal(prev => ({ ...prev, isDeleting: false }));
    }
  };

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB limit

  const handleFileSelect = (file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      setError('The image size exceeds the 10MB limit. Please upload a smaller image.');
      return;
    }
    setError('');
    setBackgroundFile(file);
    // Create a temporary preview URL
    const url = URL.createObjectURL(file);
    setBackgroundUrl(url);
  };

  const handleClearBackground = () => {
    setBackgroundFile(null);
    setBackgroundUrl('');
  };

  const createSlug = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/\s+&\s+/g, '&') // Replace ' & ' with '&'
      .replace(/\s+/g, '-')     // Replace other spaces with hyphens
      .replace(/[^a-z0-9&-\u00C0-\u00FF]+/g, '') // Remove invalid chars, preserve & and foreign chars if needed (basic)
      .replace(/^-+|-+$/g, '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const slug = createSlug(names);

    if (slug.length < 3) {
      setError('Please enter a valid couple name (e.g. Mary & John)');
      setLoading(false);
      return;
    }

    try {
      const supabase = getSupabase();

      // Check for existing couple with this slug
      let { data: existingHost, error: checkError } = await supabase
        .from('wedding_template_couples')
        .select('id')
        .eq('slug', slug)
        .single();

      if (checkError && checkError.code !== 'PGRST116') throw checkError;

      if (existingHost) {
        setError('This couple name is already taken. Please try a different name.');
        setLoading(false);
        return;
      }

      let finalBackgroundUrl = '';

      // Upload background image if selected
      if (backgroundFile) {
        setUploading(true);
        const fileExt = backgroundFile.name.split('.').pop();
        const fileName = `${slug}-bg-${Math.random()}.${fileExt}`;
        const filePath = `backgrounds/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('couple_covers') // Re-using couple_covers bucket
          .upload(filePath, backgroundFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('couple_covers')
          .getPublicUrl(filePath);

        finalBackgroundUrl = publicUrl;
      }

      // Create new host
      const { error: insertError } = await supabase
        .from('wedding_template_couples')
        .insert([{
          slug: slug,
          couple_name: names,
          theme_id: themeId,
          background_id: finalBackgroundUrl // Using column to store the URL directly
        }])
        .single();
      if (insertError) throw insertError;

      onSuccess(slug, names, finalBackgroundUrl);
      fetchRecentCouples(); // Refresh list after success
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto relative animate-fade-in">
      {/* Anthracite Background Overlay */}
      <div className="fixed inset-0 bg-stone-950 -z-10" />

      <div className="absolute -top-16 -left-16 text-rose-200/50 animate-pulse-slow">
        <Sparkles size={120} strokeWidth={0.5} />
      </div>

      <div className="bg-white/90 backdrop-blur-xl p-8 md:p-12 rounded-[2rem] shadow-2xl border border-white/60 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-200 via-rose-500 to-rose-200" />

        <div className="mb-8 flex justify-center relative">
          <div className="absolute inset-0 bg-rose-100 rounded-full blur-xl opacity-50 animate-pulse"></div>
          <div className="w-24 h-24 bg-gradient-to-tr from-rose-50 to-white rounded-full flex items-center justify-center shadow-lg border border-rose-100 relative z-10">
            <Heart className="text-rose-500 fill-rose-500 animate-float" size={40} strokeWidth={1.5} />
          </div>
        </div>

        <h1 className="font-serif text-4xl md:text-5xl text-stone-800 mb-4 tracking-tight">
          Wedding RSVP
        </h1>
        <p className="font-sans text-stone-500 mb-8 leading-relaxed font-light">
          Let's create your legendary invitation page.<br />Enter your names to begin.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="text-left group">
            <label htmlFor="names" className="block text-xs font-bold text-stone-400 mb-2 uppercase tracking-widest pl-1">Couple Names</label>
            <div className="relative">
              <input
                type="text"
                id="names"
                required
                value={names}
                onChange={(e) => setNames(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-xl bg-stone-50/50 border border-stone-200 focus:border-rose-400 focus:ring-4 focus:ring-rose-100/50 outline-none transition-all font-serif text-2xl text-stone-700 placeholder-stone-300"
                placeholder="Mary & John"
              />
              <Gem className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-rose-500 transition-colors" size={20} strokeWidth={1.5} />
            </div>
            {names && (
              <p className="text-xs text-stone-400 mt-2 pl-1 font-mono opacity-60">
                your-site.com/{createSlug(names)}
              </p>
            )}
          </div>

          <div className="flex flex-col items-center gap-6 pb-2">
            <ThemeSelector currentThemeId={themeId} onSelect={setThemeId} />
            <BackgroundSelector
              currentBackgroundUrl={backgroundUrl}
              onFileSelect={handleFileSelect}
              onClear={handleClearBackground}
              isUploading={uploading}
            />
          </div>

          {error && (
            <div className="p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
              {error}
            </div>
          )}

          <Button type="submit" className="w-full text-lg shadow-rose-200/50 shadow-xl hover:shadow-rose-300/50 hover:-translate-y-1" isLoading={loading}>
            Create Page
          </Button>
        </form>
      </div>

      {/* Recent Couples Section */}
      <div className="mt-12 space-y-4 animate-fade-in delay-300">
        <div className="flex items-center justify-between px-2">
          <h2 className="font-serif text-xl text-stone-700 flex items-center gap-2">
            <User size={18} className="text-rose-400" />
            Recent Couples
          </h2>
          <button
            onClick={fetchRecentCouples}
            className="text-stone-400 hover:text-rose-500 transition-colors"
            title="Refresh list"
          >
            <RefreshCw size={16} className={loadingCouples ? 'animate-spin' : ''} />
          </button>
        </div>

        {loadingCouples ? (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 border-2 border-rose-200 border-t-rose-500 rounded-full animate-spin"></div>
          </div>
        ) : recentCouples.length > 0 ? (
          <div className="grid gap-3">
            {recentCouples.map((couple) => (
              <div
                key={couple.id}
                className="group bg-white/60 backdrop-blur-md p-4 rounded-2xl border border-white/50 shadow-sm hover:shadow-md hover:border-rose-200/50 transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-rose-50 rounded-full flex items-center justify-center text-rose-500">
                    <Heart size={16} className="fill-rose-500" />
                  </div>
                  <div>
                    <h3 className="font-serif text-lg text-stone-800 leading-tight">
                      {couple.couple_name}
                    </h3>
                    <p className="text-[10px] text-stone-400 uppercase tracking-widest font-bold">
                      /{couple.slug}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openDeleteModal(couple)}
                    className="p-2 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    title="Delete Couple"
                  >
                    <Trash2 size={16} />
                  </button>
                  <button
                    onClick={() => (window.location.href = `/dashboard/${couple.slug}`)}
                    className="p-2 bg-stone-100 group-hover:bg-rose-500 text-stone-400 group-hover:text-white rounded-xl transition-all"
                    title="Open Dashboard"
                  >
                    <ExternalLink size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white/40 backdrop-blur-sm rounded-3xl border border-white/50">
            <p className="text-stone-400 text-sm italic">No couples created yet.</p>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, couple: null, isDeleting: false })}
        onConfirm={handleDeleteCouple}
        title="Delete Couple"
        message={`Are you sure you want to delete "${deleteModal.couple?.couple_name}"? All associated RSVPs will be permanently removed.`}
        isLoading={deleteModal.isDeleting}
      />
    </div>
  );
};