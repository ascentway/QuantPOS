import { useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook to capture rapid barcode scanner input globally across the application.
 * Distinguishes scanner input from manual typing by using a strict timeout buffer.
 * 
 * @param {Function} onScan - Callback triggered when a full barcode is scanned.
 * @param {boolean} isActive - Whether the listener should be active.
 * @param {number} timeoutMs - Maximum gap between keystrokes to be considered a continuous scan.
 */
export const useBarcodeScanner = (onScan, isActive = true, timeoutMs = 50) => {
    const bufferRef = useRef('');
    const timerRef = useRef(null);

    const handleKeyDown = useCallback((e) => {
        if (!isActive) return;

        // Ignore modifier keys
        if (e.ctrlKey || e.altKey || e.metaKey) return;

        // If it's Enter, evaluate the buffer
        if (e.key === 'Enter') {
            if (bufferRef.current.length > 3) {
                // We assume it's a valid barcode if it's longer than 3 characters
                e.preventDefault();
                onScan(bufferRef.current);
            }
            // Clear buffer regardless
            bufferRef.current = '';
            if (timerRef.current) clearTimeout(timerRef.current);
            return;
        }

        // If it's a printable character
        if (e.key.length === 1) {
            bufferRef.current += e.key;

            // Reset the timeout
            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => {
                // If the timeout is reached, it means the user stopped typing/scanning.
                // Clear the buffer because manual typing shouldn't trigger the scanner event.
                bufferRef.current = '';
            }, timeoutMs);
        }
    }, [onScan, isActive, timeoutMs]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [handleKeyDown]);
};
