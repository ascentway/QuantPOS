import React, { useState } from 'react';
import { toast } from 'react-toastify';

const Icon = ({ d, size = 16, strokeWidth = 1.6, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d={d} />
  </svg>
);

const BarcodeLabelPrinter = ({ product, isOpen, onClose }) => {
  const [weight, setWeight] = useState('');

  if (!isOpen || !product) return null;

  const w = parseFloat(weight) || 0;
  const priceInRupees = (product.pricePerUnitPaise || 0) / 100;
  
  let calculatedPrice = 0;
  if (w > 0) {
    if (product.unitType === 'GRAM' || product.unitType === 'ML') {
      calculatedPrice = (w / 1000) * priceInRupees;
    } else {
      calculatedPrice = w * priceInRupees;
    }
  }

  const calculatedPricePaise = Math.round(calculatedPrice * 100);
  const weightGrams = product.unitType === 'KG' || product.unitType === 'LITRE' ? w * 1000 : w;
  
  // Static timestamp for the barcode generation preview (updates when printed)
  const timestamp = 1782194400000; 
  const barcodeStr = `QP|${product.id.slice(0, 8)}|${weightGrams}|${calculatedPricePaise}|${timestamp}`;

  const handlePrint = () => {
    if (!w || w <= 0) {
      toast.error('Please enter a valid weight');
      return;
    }

    // Trigger standard browser print
    window.print();
    toast.success('Label sent to printer!');
    onClose();
  };

  return (
    <>
      {/* Visual Modal for Screen */}
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm print:hidden">
        <div className="bg-surface border border-white/[0.08] rounded-[16px] p-6 w-full max-w-lg shadow-2xl flex flex-col md:flex-row gap-6">
          
          {/* Left Panel: Inputs */}
          <div className="flex-1 space-y-4">
            <div>
              <h3 className="font-manrope font-bold text-[18px] text-text-primary mb-1">Print Label: {product.name}</h3>
              <p className="font-inter text-[12.5px] text-text-muted">Enter weight to generate a sticky thermal label.</p>
            </div>

            <div>
              <label className="block font-inter text-[11.5px] text-text-muted mb-1.5">Weight / Volume ({product.unitType})</label>
              <input
                type="number"
                step="0.001"
                min="0.001"
                autoFocus
                value={weight}
                onChange={e => setWeight(e.target.value)}
                className="w-full bg-card2 border border-theme rounded-[8px] px-3 py-2.5 font-inter text-[13px] text-text-primary focus:border-accent focus:outline-none"
                placeholder="e.g. 0.5"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={onClose}
                className="flex-1 bg-white/[0.06] hover:bg-white/10 text-text-primary font-manrope font-semibold text-[13px] py-2.5 rounded-[8px] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePrint}
                disabled={!w || w <= 0}
                className="flex-1 bg-accent hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed text-white font-manrope font-bold text-[13px] py-2.5 rounded-[8px] transition-colors flex items-center justify-center gap-2"
              >
                <span>🖨️</span> Print Label
              </button>
            </div>
          </div>

          {/* Right Panel: Sticker Live Preview */}
          <div className="w-full md:w-[220px] flex flex-col justify-center items-center">
            <p className="font-inter text-[11px] text-text-muted mb-2 uppercase tracking-wider">Sticker Print Preview</p>
            
            <div className="w-[200px] h-[120px] bg-white text-black p-2 border border-dashed border-gray-400 rounded-[4px] flex flex-col justify-between items-center shadow-inner relative overflow-hidden select-none">
              {/* Store Identifier */}
              <div className="w-full flex justify-between items-center text-[8px] font-bold border-b border-black/10 pb-0.5">
                <span>QuantPOS Store</span>
                <span>GST REGISTERED</span>
              </div>

              {/* Product Info */}
              <div className="w-full text-center mt-1">
                <p className="font-manrope font-bold text-[11px] leading-tight truncate">{product.name}</p>
                <p className="font-inter text-[8px] text-gray-500 leading-none">SKU: {product.sku}</p>
              </div>

              {/* Price & Weight Detail */}
              <div className="w-full flex justify-between items-center px-1 my-0.5">
                <div className="text-[8px] text-left leading-tight">
                  <p className="font-bold">{w.toFixed(3)} {product.unitType}</p>
                  <p className="text-gray-500">₹{priceInRupees.toFixed(2)}/{product.unitType}</p>
                </div>
                <div className="text-right leading-none">
                  <p className="font-manrope font-extrabold text-[12px]">₹{calculatedPrice.toFixed(2)}</p>
                </div>
              </div>

              {/* Mock Barcode Graphic */}
              <div className="w-full flex flex-col items-center">
                <div className="flex items-end justify-center gap-[1px] h-4 w-full bg-white">
                  <div className="w-[1.5px] h-full bg-black"></div>
                  <div className="w-[0.8px] h-full bg-black"></div>
                  <div className="w-[2px] h-full bg-black"></div>
                  <div className="w-[0.8px] h-full bg-black"></div>
                  <div className="w-[1.5px] h-full bg-black"></div>
                  <div className="w-[3px] h-full bg-black"></div>
                  <div className="w-[0.8px] h-full bg-black"></div>
                  <div className="w-[1.5px] h-full bg-black"></div>
                  <div className="w-[2px] h-full bg-black"></div>
                  <div className="w-[0.8px] h-full bg-black"></div>
                  <div className="w-[1.5px] h-full bg-black"></div>
                </div>
                <p className="font-mono text-[6px] tracking-tight mt-0.5 text-gray-600 truncate max-w-full">
                  {barcodeStr}
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Hidden Container for Physical Print Stylesheet */}
      <div className="hidden print:flex printable-sticker-container">
        {/* Store Identifier */}
        <div className="print-header">
          <span>QuantPOS Store</span>
          <span>GST REGISTERED</span>
        </div>

        {/* Product Info */}
        <div className="print-product">
          <p className="print-name">{product.name}</p>
          <p className="print-sku">SKU: {product.sku}</p>
        </div>

        {/* Price & Weight Detail */}
        <div className="print-pricing">
          <div className="print-qty-details">
            <p className="print-qty">{w.toFixed(3)} {product.unitType}</p>
            <p className="print-rate">₹{priceInRupees.toFixed(2)}/{product.unitType}</p>
          </div>
          <p className="print-total">₹{calculatedPrice.toFixed(2)}</p>
        </div>

        {/* Printed Barcode Graphic */}
        <div className="print-barcode-box">
          <div className="print-barcode-bars">
            <div className="w-[2px] h-full bg-black"></div>
            <div className="w-[1px] h-full bg-black"></div>
            <div className="w-[2.5px] h-full bg-black"></div>
            <div className="w-[1px] h-full bg-black"></div>
            <div className="w-[1.5px] h-full bg-black"></div>
            <div className="w-[3px] h-full bg-black"></div>
            <div className="w-[1px] h-full bg-black"></div>
            <div className="w-[1.5px] h-full bg-black"></div>
            <div className="w-[2px] h-full bg-black"></div>
            <div className="w-[1px] h-full bg-black"></div>
            <div className="w-[1.5px] h-full bg-black"></div>
          </div>
          <p className="print-barcode-text">
            {`QP|${product.id}|${weightGrams}|${calculatedPricePaise}|${Date.now()}`}
          </p>
        </div>
      </div>
    </>
  );
};

export default BarcodeLabelPrinter;
