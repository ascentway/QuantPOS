import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { toast } from 'react-toastify';

const Icon = ({ d, size = 18, strokeWidth = 1.6, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d={d} />
  </svg>
);

const BarcodeScannerModal = ({ isOpen, onClose, onScanSuccess }) => {
  const [hasPermission, setHasPermission] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const scannerRef = useRef(null);
  const elementId = 'barcode-reader-element';

  useEffect(() => {
    if (!isOpen) return;

    let html5QrCode;
    
    // Tiny delay to ensure modal DOM is fully rendered before mounting scanner
    const timer = setTimeout(() => {
      html5QrCode = new Html5Qrcode(elementId);
      scannerRef.current = html5QrCode;

      const qrCodeSuccessCallback = (decodedText) => {
        // Stop scanning, clean up, and return success
        cleanupScanner().then(() => {
          onScanSuccess(decodedText);
        });
      };

      const qrCodeErrorCallback = () => {
        // Verbose scanning noise, ignored to prevent console flood
      };

      const config = { 
        fps: 15, 
        qrbox: (width, height) => {
          // Responsive scan box (65% of screen width)
          const size = Math.min(width, height) * 0.65;
          return { width: size, height: size * 0.6 };
        }
      };

      html5QrCode.start(
        { facingMode: 'environment' }, // Default to rear camera
        config,
        qrCodeSuccessCallback,
        qrCodeErrorCallback
      )
      .then(() => {
        setHasPermission(true);
      })
      .catch(err => {
        console.warn('Rear camera start failed, attempting fallback to any camera:', err);
        // Fallback to any user-facing/default camera
        html5QrCode.start(
          { facingMode: 'user' },
          config,
          qrCodeSuccessCallback,
          qrCodeErrorCallback
        )
        .then(() => {
          setHasPermission(true);
        })
        .catch(fallbackErr => {
          console.error('Camera fallback failed:', fallbackErr);
          setHasPermission(false);
          setErrorMsg(
            fallbackErr.message?.includes('Permission') || fallbackErr.name?.includes('NotAllowed')
              ? 'Camera permission was denied. Please check your browser settings.'
              : 'Could not access any device camera. Please make sure a camera is connected.'
          );
        });
      });
    }, 250);

    const cleanupScanner = async () => {
      if (html5QrCode && html5QrCode.isScanning) {
        try {
          await html5QrCode.stop();
          html5QrCode.clear();
        } catch (e) {
          console.warn('Failed to stop/clear scanner:', e);
        }
      }
    };

    return () => {
      clearTimeout(timer);
      cleanupScanner();
    };
  }, [isOpen, onScanSuccess]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md bg-surface border border-theme rounded-[16px] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-theme flex justify-between items-center bg-card2">
          <div className="flex items-center gap-2">
            <span className="animate-pulse w-2 h-2 rounded-full bg-accent"></span>
            <h3 className="font-manrope font-bold text-[16px] text-text-primary">Camera Barcode Scanner</h3>
          </div>
          <button 
            onClick={onClose}
            className="text-text-muted hover:text-text-primary transition-colors p-1 rounded-full hover:bg-white/5"
          >
            <Icon d="M6 18L18 6M6 6l12 12" size={18} />
          </button>
        </div>

        {/* Scanner view / error messages */}
        <div className="p-6 flex flex-col items-center justify-center min-h-[300px] bg-black/20">
          {hasPermission === null && (
            <div className="flex flex-col items-center gap-3 py-10">
              <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
              <p className="font-inter text-[13px] text-text-muted">Initializing device camera...</p>
            </div>
          )}

          {hasPermission === false && (
            <div className="flex flex-col items-center text-center p-6 space-y-4">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                <Icon d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" size={24} />
              </div>
              <div className="space-y-1">
                <p className="font-manrope font-bold text-[15px] text-text-primary">Camera Access Failed</p>
                <p className="font-inter text-[12.5px] text-text-muted leading-relaxed max-w-[280px]">
                  {errorMsg}
                </p>
              </div>
              <button
                onClick={onClose}
                className="mt-2 bg-white/[0.06] hover:bg-white/10 text-text-primary px-5 py-2 rounded-[8px] font-manrope font-semibold text-[13px] transition-colors"
              >
                Close Scanner
              </button>
            </div>
          )}

          <div 
            id={elementId} 
            className={`w-full max-w-[320px] rounded-[12px] overflow-hidden border border-white/15 bg-black transition-all ${
              hasPermission === true ? 'opacity-100 scale-100' : 'opacity-0 scale-95 h-0 w-0 pointer-events-none'
            }`}
            style={{ minHeight: hasPermission === true ? '240px' : '0px' }}
          ></div>
          
          {hasPermission === true && (
            <p className="font-inter text-[12px] text-text-muted text-center mt-4">
              Center the barcode inside the scan window.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default BarcodeScannerModal;
