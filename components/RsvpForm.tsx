import React, { useState } from 'react';
import { getSupabase } from '../services/supabase';
import { Button } from './ui/Button';
import { Check, X, Users, MessageSquare, Phone, Mail, User, ArrowLeft, Heart } from 'lucide-react';

interface RsvpFormProps {
  slug: string;
  coverImage: string | null;
  onSuccess: () => void;
}

export const RsvpForm: React.FC<RsvpFormProps> = ({ slug, coverImage, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [attendance, setAttendance] = useState<'yes' | 'no' | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const supabase = getSupabase();

      // Get host ID using clean slug column
      const { data: host, error: hostError } = await supabase
        .from('wedding_template_couples')
        .select('id')
        .eq('slug', slug)
        .single();

      if (hostError) throw new Error('Couple not found');

      // Submit RSVP
      const attendanceValue = formData.get('attendance');
      const guestsValue = formData.get('guests');

      const rsvpData = {
        couple_id: host.id,
        guest_name: formData.get('name') as string,
        guest_email: formData.get('email') as string,
        guest_phone: formData.get('phone') as string,
        attending: attendanceValue === 'yes',
        party_size: attendanceValue === 'yes' ? parseInt(guestsValue as string || '1') : 0,
        message: formData.get('message') as string,
        dietary_restrictions: '' // Ensure we pass something or leave null
      };

      const { error: insertError } = await supabase
        .from('wedding_template_rsvps')
        .insert([rsvpData]);

      if (insertError) throw insertError;

      onSuccess();

    } catch (err) {
      console.error(err);
      alert('Could not send. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto animate-slide-up relative perspective-1000">
      {/* "Paper" Card Effect */}
      <div
        className="rounded-[4px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] border border-stone-200 overflow-hidden relative transition-transform duration-500 bg-white/80 backdrop-blur-md"
      >
        {/* Cover Photo - Banner Style */}
        {coverImage && (
          <div className="w-full h-48 md:h-56 overflow-hidden relative border-b border-stone-100">
            <img
              src={coverImage}
              alt="Couple Cover"
              className="w-full h-full object-cover animate-fade-in"
            />
            {/* Elegant Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
          </div>
        )}

        {/* Decorative elements */}
        <div className="absolute top-3 left-3 right-3 bottom-3 border-[1px] border-gold-400 pointer-events-none z-10 opacity-30"></div>

        {/* Content */}
        <div className="p-8 md:p-12 relative z-20">
          <div className="text-center mb-10">
            <p className="font-script text-4xl mb-4 drop-shadow-sm" style={{ color: 'var(--color-primary-600)' }}>Please Respond</p>
            <h1 className="font-serif text-5xl text-stone-800 uppercase tracking-[0.2em] font-light">RSVP</h1>

            {/* Wedding Date with Heart */}
            <div className="flex items-center justify-center gap-3 mt-8">
              <div className="h-[1px] w-8 bg-stone-300"></div>
              <Heart
                size={16}
                className="animate-pulse"
                style={{ color: 'var(--color-primary-400)', fill: 'var(--color-primary-200)' }}
              />
              <div className="h-[1px] w-8 bg-stone-300"></div>
            </div>
            <p className="mt-4 text-stone-500 font-serif text-lg tracking-wider">
              <span className="font-semibold" style={{ color: 'var(--color-primary-600)' }}>18th</span>
              <span className="mx-2 text-stone-300">|</span>
              <span className="uppercase text-sm">September</span>
              <span className="mx-2 text-stone-300">|</span>
              <span className="font-semibold" style={{ color: 'var(--color-primary-600)' }}>2026</span>
            </p>

            <div className="flex items-center justify-center gap-4 mt-6 opacity-40">
              <div className="h-[1px] w-12 bg-stone-400"></div>
              <div className="w-2 h-2 rotate-45 border border-stone-400"></div>
              <div className="h-[1px] w-12 bg-stone-400"></div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8 font-serif relative">
            <div className="group">
              <label className="flex items-center gap-2 text-stone-600 text-xs uppercase tracking-widest mb-2 font-sans font-bold">
                <User size={12} /> Full Name
              </label>
              <input
                name="name"
                required
                className="w-full bg-transparent border-b border-stone-300 focus:border-[var(--color-primary-500)] outline-none py-3 text-2xl text-stone-800 transition-colors placeholder-stone-500 font-serif italic"
                placeholder="Name and Surname"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="group">
                <label className="flex items-center gap-2 text-stone-600 text-xs uppercase tracking-widest mb-2 font-sans font-bold">
                  <Mail size={12} /> Email
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  className="w-full bg-transparent border-b border-stone-300 focus:border-[var(--color-primary-500)] outline-none py-2 text-lg text-stone-800 transition-colors placeholder-stone-500"
                  placeholder="example@email.com"
                />
              </div>
              <div className="group">
                <label className="flex items-center gap-2 text-stone-600 text-xs uppercase tracking-widest mb-2 font-sans font-bold">
                  <Phone size={12} /> Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  className="w-full bg-transparent border-b border-stone-300 focus:border-[var(--color-primary-500)] outline-none py-2 text-lg text-stone-800 transition-colors placeholder-stone-500"
                  placeholder="+1 (555) 555-5555"
                />
              </div>
            </div>

            <div className="py-4">
              <label className="block text-stone-600 text-sm uppercase tracking-widest mb-6 text-center font-sans font-bold">Will you be attending?</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setAttendance('yes')}
                  className={`p-4 border rounded-xl flex flex-col items-center gap-3 transition-all duration-300 group ${attendance === 'yes' ? 'bg-[var(--color-primary-50)] border-[var(--color-primary-500)] text-[var(--color-primary-700)] shadow-md transform scale-[1.02]' : 'border-stone-200 hover:border-[var(--color-primary-300)] text-stone-400 hover:text-stone-600'}`}
                >
                  <div className={`p-2 rounded-full ${attendance === 'yes' ? 'bg-[var(--color-primary-100)]' : 'bg-stone-50 group-hover:bg-[var(--color-primary-50)]'} transition-colors`}>
                    <Check size={24} strokeWidth={2} />
                  </div>
                  <span className="text-sm font-bold font-sans">Joyfully<br />Accept</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAttendance('no')}
                  className={`p-4 border rounded-xl flex flex-col items-center gap-3 transition-all duration-300 group ${attendance === 'no' ? 'bg-stone-100 border-stone-500 text-stone-700 shadow-md transform scale-[1.02]' : 'border-stone-200 hover:border-stone-400 text-stone-400 hover:text-stone-600'}`}
                >
                  <div className={`p-2 rounded-full ${attendance === 'no' ? 'bg-stone-200' : 'bg-stone-50 group-hover:bg-stone-100'} transition-colors`}>
                    <X size={24} strokeWidth={2} />
                  </div>
                  <span className="text-sm font-bold font-sans">Regretfully<br />Decline</span>
                </button>
              </div>
              <input type="hidden" name="attendance" value={attendance || ''} required />
            </div>

            <div className={`transition-all duration-500 overflow-hidden ${attendance === 'yes' ? 'max-h-32 opacity-100 translate-y-0' : 'max-h-0 opacity-0 -translate-y-4'}`}>
              <label className="flex items-center gap-2 text-stone-600 text-xs uppercase tracking-widest mb-2 font-sans font-bold">
                <Users size={12} /> Guests (Including you)
              </label>
              <input
                type="number"
                name="guests"
                min="1"
                max="10"
                defaultValue="1"
                required={attendance === 'yes'}
                className="w-full bg-transparent border-b border-stone-300 focus:border-[var(--color-primary-500)] outline-none py-2 text-2xl text-stone-800 font-serif"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-stone-600 text-xs uppercase tracking-widest mb-2 font-sans font-bold">
                <MessageSquare size={12} /> Message to the Couple
              </label>
              <textarea
                name="message"
                rows={3}
                className="w-full bg-stone-50/50 rounded-xl border border-stone-200 focus:border-[var(--color-primary-500)] outline-none p-4 text-stone-700 transition-colors mt-2 resize-none font-serif text-lg leading-relaxed placeholder-stone-500"
                placeholder="Dietary restrictions or best wishes..."
              ></textarea>
            </div>

            <div className="pt-4 pb-2">
              <Button type="submit" className="w-full text-lg shadow-xl hover:shadow-2xl" isLoading={loading} disabled={!attendance}>
                Send RSVP
              </Button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};