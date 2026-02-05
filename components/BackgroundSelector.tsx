import React, { useRef } from 'react';
import { Image, X, UploadCloud, Check } from 'lucide-react';
import { Button } from './ui/Button';

interface BackgroundSelectorProps {
    currentBackgroundUrl: string;
    onFileSelect: (file: File) => void;
    onClear: () => void;
    isUploading?: boolean;
}

export const BackgroundSelector: React.FC<BackgroundSelectorProps> = ({
    currentBackgroundUrl,
    onFileSelect,
    onClear,
    isUploading = false
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            onFileSelect(file);
        }
    };

    return (
        <div className="flex flex-col items-center gap-4 w-full">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/jpeg,image/png"
                className="hidden"
            />

            <div className="flex items-center gap-3">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    isLoading={isUploading}
                    className="gap-2 border-stone-300 hover:border-rose-400 hover:text-rose-600 transition-all shadow-sm"
                >
                    <UploadCloud size={18} />
                    <span>Upload Background</span>
                </Button>

                {currentBackgroundUrl && (
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={onClear}
                        className="p-3 rounded-full hover:bg-stone-200 text-stone-500"
                        title="Clear background"
                    >
                        <X size={18} />
                    </Button>
                )}
            </div>

            {currentBackgroundUrl && !isUploading && (
                <div className="relative group w-24 h-24 rounded-2xl overflow-hidden border-4 border-white shadow-xl animate-fade-in">
                    <img
                        src={currentBackgroundUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Check className="text-white" size={24} />
                    </div>
                </div>
            )}

            <p className="text-[10px] text-stone-400 uppercase tracking-widest font-bold">
                JPG or PNG (Recommended: 1920x1080)
            </p>
        </div>
    );
};
