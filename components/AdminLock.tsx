import React, { useState } from 'react';
import { Button } from './ui/Button';
import { Lock, ArrowRight } from 'lucide-react';

interface AdminLockProps {
    onUnlock: () => void;
}

export const AdminLock: React.FC<AdminLockProps> = ({ onUnlock }) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === 'mihail') {
            onUnlock();
        } else {
            setError(true);
            setPassword('');
        }
    };

    return (
        <div className="w-full max-w-md mx-auto relative animate-fade-in z-50">
            {/* Anthracite Background Overlay */}
            <div className="fixed inset-0 bg-stone-950 -z-10" />

            <div className="bg-white/90 backdrop-blur-xl p-8 md:p-12 rounded-[2rem] shadow-2xl border border-white/60 text-center">
                <div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-6 text-stone-400 border border-stone-200">
                    <Lock size={32} strokeWidth={1.5} />
                </div>
                <h2 className="font-serif text-3xl text-stone-800 mb-2">Private Access</h2>
                <p className="text-stone-500 mb-8 font-light text-sm">This area is password protected.</p>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="relative">
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                setError(false);
                            }}
                            className={`w-full px-6 py-4 rounded-xl bg-stone-50 border ${error ? 'border-red-300 ring-4 ring-red-100' : 'border-stone-200 focus:border-rose-400 focus:ring-4 focus:ring-rose-100/50'} outline-none text-center text-xl tracking-widest transition-all`}
                            placeholder="Password"
                            autoFocus
                        />
                    </div>

                    {error && (
                        <p className="text-red-500 text-xs font-bold uppercase tracking-widest animate-pulse">
                            Incorrect Password
                        </p>
                    )}

                    <Button type="submit" className="w-full text-lg py-4 shadow-xl shadow-stone-200">
                        Unlock <ArrowRight size={18} className="ml-2" />
                    </Button>
                </form>
            </div>
        </div>
    );
};
