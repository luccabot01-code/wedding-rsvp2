import React from 'react';

/**
 * Resolves a background value (either an ID or a URL) into a CSS style object.
 * If the value starts with http or /, it's treated as an image URL.
 */
export const resolveBackgroundStyle = (bgValue: string): React.CSSProperties => {
    if (!bgValue) return { backgroundColor: '#ffffff' };

    // If it's a URL or path to an image
    if (bgValue.startsWith('http') || bgValue.startsWith('/') || bgValue.includes('supabase.co')) {
        return {
            backgroundImage: `url(${bgValue})`,
            backgroundSize: 'cover', // Cover the full screen
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat', // Do not tile
            backgroundAttachment: 'fixed',
            // backgroundColor removed to allow Radial Gradient from App.tsx to show through
        };
    }

    // Fallback for previous IDs if any remain, or default
    return {
        backgroundColor: '#ffffff'
    };
};
