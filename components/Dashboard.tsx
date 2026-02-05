import React, { useEffect, useState, useRef } from 'react';
import { getSupabase } from '../services/supabase';
import { RsvpResponse, DashboardStats } from '../types';
import { Button } from './ui/Button';
import { RefreshCw, Download, Trash2, Users, CheckCircle2, XCircle, X, Mail, MessageSquare, Phone, Copy, Link as LinkIcon, QrCode as QrIcon, Eye, Palette, Camera } from 'lucide-react';
import QRCode from 'react-qr-code';
import { Modal } from './ui/Modal';
import { ConfirmModal } from './ui/ConfirmModal';
import { HamburgerMenu } from './ui/HamburgerMenu';

interface DashboardProps {
  slug: string;
  coverImage: string | null;
  onPreview: () => void;
  onCoverUpdate: (url: string | null) => void;
  backgroundStyle?: React.CSSProperties;
}

export const Dashboard: React.FC<DashboardProps> = ({ slug, coverImage, onPreview, onCoverUpdate, backgroundStyle }) => {
  const [responses, setResponses] = useState<RsvpResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    total: 0,
    accepted: 0,
    declined: 0,
    totalGuests: 0
  });
  const [copied, setCopied] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    type: 'success' | 'error';
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: 'success',
    title: '',
    message: ''
  });

  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [isRemovingImage, setIsRemovingImage] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const prettyName = slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  const [displayName, setDisplayName] = useState(prettyName);

  // Demo-Style background - Fixed texture pattern for panel consistency (matching demo-rsvp)
  const subtleTexture: React.CSSProperties = {
    backgroundImage: 'linear-gradient(rgba(255, 253, 249, 0.5), rgba(255, 253, 249, 0.5)), url(/bg-texture.png)',
    backgroundRepeat: 'repeat',
    backgroundSize: '300px',
    backgroundColor: '#fffdf9'
  };


  const cleanLink = `${window.location.origin}/${slug}`;

  const fetchResponses = async () => {
    try {
      setLoading(true);
      const supabase = getSupabase();

      const { data: host, error: hostError } = await (supabase
        .from('wedding_template_couples') as any)
        .select('*')
        .eq('slug', slug)
        .single();

      if (hostError) throw hostError;

      if (host) {
        setDisplayName(host.couple_name);
      }

      const { data, error } = await (supabase
        .from('wedding_template_rsvps') as any)
        .select('*')
        .eq('couple_id', host.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setResponses(data || []);

      if (data) {
        const total = data.length;
        const accepted = data.filter((r: any) => r.attending).length;
        const declined = data.filter((r: any) => !r.attending).length;
        const totalGuests = data.reduce((acc: number, curr: any) => acc + (curr.party_size || 0), 0);
        setStats({ total, accepted, declined, totalGuests });
      }

    } catch (err) {
      console.error('Error fetching:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const supabase = getSupabase();
      const { error } = await supabase
        .from('wedding_template_rsvps')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchResponses();
      setModalConfig({
        isOpen: true,
        type: 'success',
        title: 'Deleted',
        message: 'Response has been removed.'
      });
    } catch (err) {
      console.error('Error deleting:', err);
      setModalConfig({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: 'Could not delete response.'
      });
    }
  };

  const exportCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Status', 'Guest Count', 'Message', 'Date'];
    const csvContent = [
      headers.join(','),
      ...responses.map(r => [
        `"${r.guest_name}"`,
        `"${r.guest_email}"`,
        `"${r.guest_phone || ''}"`,
        `"${r.attending ? 'Attending' : 'Not Attending'}"`,
        r.party_size,
        `"${(r.message || '').replace(/"/g, '""')}"`,
        `"${new Date(r.created_at).toLocaleDateString('en-US')}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${slug}_rsvp_list.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };



  const handleCopy = () => {
    navigator.clipboard.writeText(cleanLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQR = () => {
    const svg = document.getElementById("qr-code-svg-dashboard");
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${slug}-rsvp-qr.svg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  useEffect(() => {
    fetchResponses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB limit

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      setModalConfig({
        isOpen: true,
        type: 'error',
        title: 'Image Too Large',
        message: 'The image size exceeds the 10MB limit. Please upload a smaller image.'
      });
      return;
    }

    try {
      setUploading(true);
      const supabase = getSupabase();

      const fileExt = file.name.split('.').pop();
      const fileName = `${slug}-${Math.random()}.${fileExt}`;
      const filePath = `covers/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('couple_covers')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('couple_covers')
        .getPublicUrl(filePath);

      const { error: updateError } = await (supabase
        .from('wedding_template_couples') as any)
        .update({ cover_image_url: publicUrl })
        .eq('slug', slug);

      if (updateError) throw updateError;

      onCoverUpdate(publicUrl);
      setModalConfig({
        isOpen: true,
        type: 'success',
        title: 'Success',
        message: 'Cover image updated successfully.'
      });
    } catch (error: any) {
      console.error('Error uploading:', error);
      setModalConfig({
        isOpen: true,
        type: 'error',
        title: 'Upload Failed',
        message: error.message || 'Could not upload image.'
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = async () => {
    try {
      setIsRemovingImage(true);
      const supabase = getSupabase();

      const { error } = await (supabase
        .from('wedding_template_couples') as any)
        .update({ cover_image_url: null })
        .eq('slug', slug);

      if (error) throw error;

      onCoverUpdate(null);
      setShowRemoveConfirm(false);
      setModalConfig({
        isOpen: true,
        type: 'success',
        title: 'Removed',
        message: 'Cover image has been removed.'
      });
    } catch (error: any) {
      console.error('Error removing image:', error);
      setModalConfig({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: 'Could not remove image.'
      });
    } finally {
      setIsRemovingImage(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
      />

      <div className="w-full max-w-6xl mx-auto space-y-10 animate-fade-in pb-16 px-4 md:px-0">
        <div className="relative rounded-[4px] border border-stone-200 shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden" style={subtleTexture}>
          {coverImage && (
            <div className="w-full h-48 md:h-64 relative group overflow-hidden">
              <img
                src={coverImage}
                alt="Wedding Cover"
                className="w-full h-full object-cover animate-fade-in"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#fffdf9] via-transparent to-transparent opacity-60" />

              <button
                onClick={() => setShowRemoveConfirm(true)}
                className="absolute top-4 left-4 p-2 bg-white/80 backdrop-blur-md rounded-full text-stone-400 hover:text-red-500 hover:bg-white shadow-lg transition-all opacity-0 group-hover:opacity-100"
                title="Remove Photo"
              >
                <X size={20} />
              </button>
            </div>
          )}

          <HamburgerMenu
            onUploadClick={() => fileInputRef.current?.click()}
            onPreviewClick={onPreview}
            onRefreshClick={fetchResponses}
            onExportClick={exportCSV}
            onDownloadQR={handleDownloadQR}
            onThemeClick={() => setShowThemePicker(true)}
            qrLink={cleanLink}
            uploading={uploading}
            loading={loading}
          />

          <div className="hidden md:flex absolute top-6 right-6 z-20 items-center gap-2 p-2 bg-white/60 backdrop-blur-md rounded-2xl border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.06)] hover:bg-white/80 transition-all duration-300">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />



            <Button
              onClick={() => fileInputRef.current?.click()}
              isLoading={uploading}
              className="text-white font-serif italic px-5 h-10 border-none flex items-center justify-center transition-all hover:opacity-90 active:scale-95 text-sm"
              style={{
                backgroundColor: 'var(--color-primary-500)',
                boxShadow: '0 4px 12px -2px var(--color-primary-100)'
              }}
            >
              <Camera size={14} className="mr-2" /> Upload Photo
            </Button>

            <Button
              onClick={onPreview}
              className="text-white font-serif italic px-5 h-10 border-none flex items-center justify-center transition-all hover:opacity-90 active:scale-95 text-sm"
              style={{
                backgroundColor: 'var(--color-primary-500)',
                boxShadow: '0 4px 12px -2px var(--color-primary-100)'
              }}
            >
              <Eye size={14} className="mr-2" /> Preview
            </Button>

            <div className="h-6 w-[1px] bg-white/40 mx-1"></div>

            <Button
              onClick={fetchResponses}
              className="text-white px-3 h-10 border-none flex items-center justify-center transition-all hover:opacity-90 active:scale-95"
              style={{
                backgroundColor: 'var(--color-primary-500)',
                boxShadow: '0 4px 12px -2px var(--color-primary-100)'
              }}
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </Button>

            <Button
              onClick={exportCSV}
              className="text-white font-serif tracking-wide px-5 h-10 border-none flex items-center justify-center transition-all hover:opacity-90 active:scale-95 text-sm"
              style={{
                backgroundColor: 'var(--color-primary-500)',
                boxShadow: '0 4px 12px -2px var(--color-primary-100)'
              }}
            >
              <Download size={14} className="mr-2" /> .CSV
            </Button>
          </div>

          <div className="p-6 md:p-10 relative">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 relative z-10 w-full">
              <div className="text-center md:text-left min-w-0 max-w-full">
                <h1
                  className="font-slight text-6xl md:text-8xl tracking-wider capitalize break-words leading-[1.2]"
                  style={{ color: 'var(--color-primary-600)' }}
                >
                  {(loading && !displayName) ? (
                    <span className="animate-pulse text-stone-200">Loading...</span>
                  ) : (
                    (displayName || prettyName).split('&').map((part, index, arr) => (
                      <React.Fragment key={index}>
                        {part}
                        {index < arr.length - 1 && (
                          <span className="font-serif italic mx-1" style={{ fontSize: '0.9em', fontWeight: 300 }}>&</span>
                        )}
                      </React.Fragment>
                    ))
                  )}
                </h1>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 rounded-[4px] border border-stone-200 p-8 shadow-sm flex flex-col justify-between" style={subtleTexture}>
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-[var(--color-primary-50)] rounded-lg text-[var(--color-primary-500)]">
                    <LinkIcon size={20} />
                  </div>
                  <div>
                    <h3 className="font-serif text-2xl text-stone-800">Share Your Link</h3>
                    <p className="text-stone-600 text-xs uppercase tracking-widest font-bold">Your Guests' Gateway</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 mb-8">
                  <div className="flex-1 bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-stone-600 text-sm font-mono truncate flex items-center">
                    <span className="truncate">{cleanLink}</span>
                  </div>
                  <Button onClick={handleCopy} className="bg-stone-800 hover:bg-black text-white px-6">
                    {copied ? 'Copied!' : <><Copy size={16} className="mr-2" /> Copy Link</>}
                  </Button>
                </div>
              </div>

              <div className="bg-stone-50/50 rounded-xl p-5 border border-stone-100">
                <div className="flex items-start gap-3">
                  <Palette size={18} className="text-[var(--color-primary-400)] mt-1 shrink-0" />
                  <div className="space-y-2">
                    <h4 className="font-bold text-stone-700 text-sm">How it Works</h4>
                    <ul className="list-disc pl-4 space-y-1 text-xs text-stone-500 leading-relaxed opacity-90">
                      <li>Share the link above with your guests via WhatsApp, Email, or Instagram.</li>
                      <li>Download the QR code SVG and customize its color in Canva for your physical invitations.</li>
                      <li>Guests will see your personalized page and fill out the RSVP form.</li>
                      <li>Use this Dashboard to track responses and manage your guest list.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="hidden lg:flex rounded-[4px] border border-stone-200 p-8 shadow-sm flex-col items-center justify-center text-center" style={subtleTexture}>
              <div className="p-3 bg-white rounded-xl shadow-lg border border-stone-50 ring-4 ring-stone-50 mb-6">
                <div style={{ height: "auto", margin: "0 auto", maxWidth: 140, width: "100%" }}>
                  <QRCode
                    id="qr-code-svg-dashboard"
                    size={256}
                    style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                    value={cleanLink}
                    level='H'
                    viewBox={`0 0 256 256`}
                  />
                </div>
              </div>

              <div className="space-y-4 w-full">
                <div className="flex items-center justify-center gap-2 text-stone-800">
                  <QrIcon size={18} className="text-[var(--color-primary-500)]" />
                  <h3 className="font-serif text-lg">Event QR Code</h3>
                </div>
                <Button onClick={handleDownloadQR} variant="outline" className="w-full text-xs h-9 border-stone-300">
                  <Download size={14} className="mr-2" /> Download SVG
                </Button>
              </div>
            </div>
          </div>
        </div>
        {/* Stats Grid - Compact on mobile, horizontal */}
        <div className="grid grid-cols-4 gap-2 md:gap-6">
          <StatCard label="Total" value={stats.total} icon={<Mail size={16} />} accent="text-[var(--color-primary-600)]" bg="bg-[var(--color-primary-50)]" />
          <StatCard label="Accepted" value={stats.accepted} icon={<CheckCircle2 size={16} />} accent="text-[var(--color-primary-600)]" bg="bg-[var(--color-primary-50)]" />
          <StatCard label="Declined" value={stats.declined} icon={<XCircle size={16} />} accent="text-[var(--color-primary-600)]" bg="bg-[var(--color-primary-50)]" />
          <StatCard label="Guests" value={stats.totalGuests} icon={<Users size={16} />} accent="text-[var(--color-primary-600)]" bg="bg-[var(--color-primary-50)]" />
        </div>

        <div className="rounded-[4px] border border-stone-200 shadow-sm relative overflow-hidden" style={subtleTexture}>
          <div className="p-8 md:p-10 border-b border-stone-100 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white/40 flex items-center justify-center text-stone-400">
                <Users size={24} strokeWidth={1.5} />
              </div>
              <div>
                <h2 className="font-serif text-3xl text-stone-800">Guest List</h2>
                <p className="font-sans text-xs font-bold text-stone-600 tracking-widest uppercase mt-1">Managed Responses</p>
              </div>
            </div>
            <span className="font-serif italic text-stone-600 text-lg border-b border-stone-200 pb-1 px-2">{responses.length} entries</span>
          </div>

          {loading ? (
            <div className="p-32 text-center flex flex-col items-center gap-4">
              <div className="w-10 h-10 border-[3px] border-stone-100 border-t-[var(--color-primary-400)] rounded-full animate-spin"></div>
              <p className="font-serif italic text-stone-600">Retrieving your guest list...</p>
            </div>
          ) : responses.length === 0 ? (
            <div className="p-32 text-center bg-stone-50/30">
              <p className="font-serif text-2xl text-stone-500 italic mb-2">No responses yet</p>
              <p className="font-sans text-xs text-stone-600 tracking-widest uppercase">Share your link to get started</p>
            </div>
          ) : (
            <div className="divide-y divide-stone-100">
              {responses.map((rsvp) => (
                <div key={rsvp.id} className="p-6 md:px-10 md:py-8 hover:bg-[#fffdf9] transition-all duration-300 group">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-start gap-6">
                      <div className={`w-16 h-16 shrink-0 rounded-full flex items-center justify-center text-3xl font-serif border-2 ${rsvp.attending ? 'border-[var(--color-primary-100)] bg-[var(--color-primary-50)] text-[var(--color-primary-500)]' : 'border-stone-100 bg-stone-50 text-stone-300'}`}>
                        {rsvp.guest_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="space-y-2">
                        <div>
                          <h3 className="font-serif text-2xl text-stone-800 leading-none mb-1">{rsvp.guest_name}</h3>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-bold text-stone-500 tracking-wider uppercase font-sans">
                            <span className="flex items-center gap-1 hover:text-[var(--color-primary-500)] transition-colors cursor-default">
                              <Mail size={10} /> {rsvp.guest_email || 'No email'}
                            </span>
                            {rsvp.guest_phone && (
                              <span className="flex items-center gap-1 hover:text-[var(--color-primary-500)] transition-colors cursor-default">
                                <Phone size={10} /> {rsvp.guest_phone}
                              </span>
                            )}
                          </div>
                        </div>
                        {rsvp.message && (
                          <div className="bg-[var(--color-primary-50)]/30 rounded-r-xl rounded-bl-xl border-l-2 border-[var(--color-primary-200)] p-3 max-w-lg">
                            <div className="flex gap-2">
                              <MessageSquare size={12} className="text-stone-400 shrink-0 mt-1" />
                              <p className="font-serif italic text-stone-600 text-lg leading-relaxed">"{rsvp.message}"</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-8 pl-[5.5rem] md:pl-0">
                      <div className="text-right space-y-1">
                        {rsvp.attending ? (
                          <>
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full border border-green-100/50">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                              <span className="text-[10px] font-bold tracking-widest uppercase">Attending</span>
                            </div>
                            <p className="text-stone-600 font-serif italic text-lg">
                              Party of <strong className="text-stone-800 font-sans not-italic text-sm">{rsvp.party_size}</strong>
                            </p>
                          </>
                        ) : (
                          <div className="inline-flex items-center gap-2 px-3 py-1 bg-stone-100 text-stone-500 rounded-full border border-stone-200/50">
                            <span className="w-1.5 h-1.5 rounded-full bg-stone-400"></span>
                            <span className="text-[10px] font-bold tracking-widest uppercase">Declined</span>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => handleDelete(rsvp.id)}
                        className="w-10 h-10 flex items-center justify-center rounded-full text-stone-300 hover:text-red-500 hover:bg-white hover:shadow-md hover:border hover:border-red-100 transition-all"
                        title="Delete Entry"
                      >
                        <Trash2 size={18} strokeWidth={1.5} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={showRemoveConfirm}
        onClose={() => setShowRemoveConfirm(false)}
        onConfirm={handleRemoveImage}
        title="Remove Photo"
        message="Are you sure you want to remove the cover photo? This will return the dashboard to its default look."
        isLoading={isRemovingImage}
      />


    </>
  );
};

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  accent?: string;
  bg?: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, accent = 'text-stone-800', bg = 'bg-white' }) => {
  return (
    <div
      className={`p-3 md:p-8 rounded-[4px] border border-stone-200 flex flex-col items-center md:items-start gap-2 md:gap-4 hover:shadow-lg transition-all duration-300 group relative overflow-hidden text-center md:text-left`}
      style={{
        backgroundImage: 'linear-gradient(rgba(255, 253, 249, 0.5), rgba(255, 253, 249, 0.5)), url(/bg-texture.png)',
        backgroundRepeat: 'repeat',
        backgroundSize: '300px',
        backgroundColor: '#fffdf9'
      }}
    >
      <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-sm md:text-lg ${bg} ${accent}`}>
        {icon}
      </div>
      <div>
        <p className="font-serif text-xl md:text-5xl text-stone-800 leading-tight">{value}</p>
        <p className="font-sans text-[8px] md:text-xs font-bold text-stone-600 tracking-widest uppercase truncate max-w-full">{label}</p>
      </div>
    </div>
  );
};