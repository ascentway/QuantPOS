import React, { useState, useEffect } from 'react';

const LooseProductModal = ({ product, isOpen, onClose, onConfirm }) => {
  const [quantity, setQuantity] = useState('');
  
  useEffect(() => {
    if (isOpen) setQuantity('');
  }, [isOpen]);

  if (!isOpen || !product) return null;

  const unitLabel = product.unitType === 'GRAM' ? 'g' : product.unitType === 'ML' ? 'ml' : product.unitType === 'KG' ? 'kg' : product.unitType === 'LITRE' ? 'L' : 'units';
  const parsedQty = parseFloat(quantity);
  let calculatedPrice = 0;
  
  if (!isNaN(parsedQty) && parsedQty > 0) {
    // Determine price per unit. If pricePerUnitPaise is based on the base unit type (like per KG).
    // The user's PRD: "price auto-calculates as (457/1000) * ₹45 = ₹20.57" -> this assumes unit is grams but price_per_unit is per KG.
    // To keep it simple, let's assume pricePerUnitPaise represents the price for 1 base unit (e.g., 1 KG or 1 Litre).
    const priceInRupees = product.pricePerUnitPaise / 100;
    
    if (product.unitType === 'GRAM' || product.unitType === 'ML') {
      // If entered in grams, price per unit is per KG (1000g). So (qty / 1000) * priceInRupees
      calculatedPrice = (parsedQty / 1000) * priceInRupees;
    } else {
      // If entered in KG, price per unit is per KG. So qty * priceInRupees
      calculatedPrice = parsedQty * priceInRupees;
    }
  }

  const handleConfirm = () => {
    if (parsedQty > 0) {
      onConfirm(product, parsedQty, calculatedPrice);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-surface border border-white/[0.08] rounded-[16px] p-6 w-full max-w-sm shadow-2xl">
        <h3 className="font-manrope font-bold text-[18px] text-white mb-1">{product.name}</h3>
        <p className="font-inter text-[13px] text-white/50 mb-5">Enter weight/volume for this loose item</p>

        <div className="space-y-4">
          <div>
            <label className="font-inter text-[11px] text-white/40 uppercase tracking-wider mb-1.5 block">Quantity ({unitLabel})</label>
            <div className="relative">
              <input
                type="number"
                step="0.001"
                autoFocus
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleConfirm(); }}
                className="w-full bg-sidebar border border-white/10 rounded-[8px] px-4 py-3 font-manrope font-semibold text-[16px] text-white focus:outline-none focus:border-accent"
                placeholder={`e.g. 500`}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 font-manrope font-bold text-[14px] text-white/30">
                {unitLabel}
              </span>
            </div>
          </div>

          <div className="bg-sidebar border border-white/[0.05] rounded-[8px] p-3 flex justify-between items-center">
            <span className="font-inter text-[12px] text-white/50">Calculated Price</span>
            <span className="font-manrope font-bold text-[18px] text-emerald-400">
              ₹{calculatedPrice.toFixed(2)}
            </span>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={onClose}
              className="flex-1 bg-white/[0.06] hover:bg-white/10 text-white font-manrope font-semibold text-[13px] py-3 rounded-[8px] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={parsedQty <= 0 || isNaN(parsedQty)}
              className="flex-1 bg-accent hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-white font-manrope font-bold text-[13px] py-3 rounded-[8px] transition-colors"
            >
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LooseProductModal;
