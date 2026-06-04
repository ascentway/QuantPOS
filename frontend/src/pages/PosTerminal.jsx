import React, { useState, useCallback } from 'react';

// ─── Icon ─────────────────────────────────────────────────────────────────────
const Icon = ({ d, size = 18, strokeWidth = 1.6, className = '', fill = 'none', style = {} }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={fill}
    stroke={fill === 'none' ? 'currentColor' : 'none'}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={style}
  >
    <path d={d} />
  </svg>
);

// ─── Mock Product Catalog ─────────────────────────────────────────────────────
const CATEGORIES = ['All', 'Grocery', 'Dairy', 'Snacks', 'Beverages', 'Personal Care'];

const PRODUCTS = [
  { id: 1, name: 'Aashirvaad Atta 5kg',     price: 120, category: 'Grocery',       stock: 142, emoji: '🌾' },
  { id: 2, name: 'Amul Gold Milk 1L',        price: 50,  category: 'Dairy',         stock: 230, emoji: '🥛' },
  { id: 3, name: 'Amul Butter 100g',         price: 55,  category: 'Dairy',         stock: 88,  emoji: '🧈' },
  { id: 4, name: "Lay's Classic 52g",        price: 30,  category: 'Snacks',        stock: 200, emoji: '🥔' },
  { id: 5, name: 'Parle-G Biscuits 800g',    price: 50,  category: 'Snacks',        stock: 55,  emoji: '🍪' },
  { id: 6, name: 'Hide & Seek Bourbon',      price: 40,  category: 'Snacks',        stock: 120, emoji: '🍫' },
  { id: 7, name: 'Colgate MaxFresh 150g',    price: 65,  category: 'Personal Care', stock: 74,  emoji: '🦷' },
  { id: 8, name: 'Dove Soap 100g',           price: 45,  category: 'Personal Care', stock: 180, emoji: '🧼' },
  { id: 9, name: 'Maaza Mango 600ml',        price: 40,  category: 'Beverages',     stock: 96,  emoji: '🥭' },
  { id: 10, name: 'Tata Tea Gold 250g',      price: 80,  category: 'Grocery',       stock: 63,  emoji: '🍵' },
  { id: 11, name: 'Maggi Noodles 70g',       price: 14,  category: 'Snacks',        stock: 300, emoji: '🍜' },
  { id: 12, name: 'Thums Up 750ml',          price: 45,  category: 'Beverages',     stock: 50,  emoji: '🥤' },
  { id: 13, name: 'Fortune Sunflower Oil 1L',price: 130, category: 'Grocery',       stock: 75,  emoji: '🫙' },
  { id: 14, name: 'Haldiram\'s Bhujia 200g', price: 70,  category: 'Snacks',        stock: 90,  emoji: '🌶️' },
  { id: 15, name: 'Dettol Soap 75g',         price: 40,  category: 'Personal Care', stock: 110, emoji: '🧴' },
  { id: 16, name: 'Sprite 750ml',            price: 45,  category: 'Beverages',     stock: 60,  emoji: '🫧' },
];

const PAYMENT_METHODS = [
  { id: 'cash',  label: 'Cash',  icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z' },
  { id: 'upi',   label: 'UPI',   icon: 'M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z' },
  { id: 'card',  label: 'Card',  icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
];

// ─── Product Card ─────────────────────────────────────────────────────────────
const ProductCard = ({ product, onAdd }) => (
  <button
    onClick={() => onAdd(product)}
    className="group relative bg-[#16161f] border border-white/[0.06] hover:border-[#5757f8]/40 rounded-[10px] p-3.5 flex flex-col items-start gap-2 text-left transition-all duration-150 hover:bg-[#1c1c2a] active:scale-[0.97]"
  >
    <div className="w-full flex items-start justify-between">
      <span className="text-2xl leading-none">{product.emoji}</span>
      <span className={`font-inter text-[10px] px-1.5 py-0.5 rounded-[4px] ${
        product.stock < 60
          ? 'bg-red-400/10 text-red-400'
          : 'bg-emerald-400/10 text-emerald-400'
      }`}>
        {product.stock < 60 ? `${product.stock} left` : 'In Stock'}
      </span>
    </div>
    <div className="w-full min-w-0">
      <p className="font-inter text-[12.5px] text-white/80 leading-tight line-clamp-2">{product.name}</p>
      <p className="font-manrope font-bold text-[15px] text-white mt-1.5">₹{product.price}</p>
    </div>
    {/* Add indicator */}
    <div className="absolute inset-0 rounded-[10px] border-2 border-[#5757f8] opacity-0 group-hover:opacity-30 transition-opacity pointer-events-none" />
  </button>
);

// ─── Cart Item ────────────────────────────────────────────────────────────────
const CartItem = ({ item, onInc, onDec, onRemove }) => (
  <div className="flex items-center gap-3 py-3 border-b border-white/[0.05] group">
    <span className="text-xl flex-shrink-0">{item.emoji}</span>
    <div className="flex-1 min-w-0">
      <p className="font-inter text-[12.5px] text-white/80 truncate">{item.name}</p>
      <p className="font-manrope font-semibold text-[12px] text-white/50">₹{item.price} × {item.qty}</p>
    </div>
    <div className="flex items-center gap-1.5 flex-shrink-0">
      <button
        onClick={() => onDec(item.id)}
        className="w-6 h-6 flex items-center justify-center rounded-[4px] bg-white/[0.06] hover:bg-white/10 text-white/60 hover:text-white transition-colors text-sm font-bold"
      >−</button>
      <span className="font-manrope font-bold text-[13px] text-white w-5 text-center">{item.qty}</span>
      <button
        onClick={() => onInc(item.id)}
        className="w-6 h-6 flex items-center justify-center rounded-[4px] bg-white/[0.06] hover:bg-white/10 text-white/60 hover:text-white transition-colors text-sm font-bold"
      >+</button>
    </div>
    <p className="font-manrope font-bold text-[13px] text-white w-14 text-right flex-shrink-0">
      ₹{item.price * item.qty}
    </p>
    <button
      onClick={() => onRemove(item.id)}
      className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-400 transition-all ml-1"
    >
      <Icon d="M6 18L18 6M6 6l12 12" size={14} />
    </button>
  </div>
);

// ─── Success Modal ─────────────────────────────────────────────────────────────
const SuccessModal = ({ total, method, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
    <div className="bg-[#16161f] border border-white/[0.08] rounded-[16px] p-8 flex flex-col items-center gap-4 shadow-2xl max-w-xs w-full mx-4">
      <div className="w-16 h-16 rounded-full bg-emerald-400/10 flex items-center justify-center">
        <Icon d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" size={32} strokeWidth={1.8} className="text-emerald-400" />
      </div>
      <div className="text-center">
        <h3 className="font-manrope font-bold text-[20px] text-white">Payment Successful</h3>
        <p className="font-inter text-[13px] text-white/50 mt-1">Transaction completed</p>
      </div>
      <div className="w-full bg-white/[0.04] rounded-[10px] p-4 flex flex-col gap-2">
        <div className="flex justify-between">
          <span className="font-inter text-[12px] text-white/40">Amount</span>
          <span className="font-manrope font-bold text-[14px] text-white">₹{total.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-inter text-[12px] text-white/40">Method</span>
          <span className="font-manrope font-semibold text-[12px] text-white capitalize">{method}</span>
        </div>
      </div>
      <button
        onClick={onClose}
        className="w-full bg-[#5757f8] hover:bg-[#6c6cf8] text-white font-manrope font-semibold text-[14px] py-3 rounded-[10px] transition-colors"
      >
        New Transaction
      </button>
    </div>
  </div>
);

// ─── POS Terminal ─────────────────────────────────────────────────────────────
const PosTerminal = () => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [showSuccess, setShowSuccess] = useState(false);
  const [customDiscount, setCustomDiscount] = useState('');

  // Filter products
  const filtered = PRODUCTS.filter(p => {
    const catMatch = activeCategory === 'All' || p.category === activeCategory;
    const searchMatch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return catMatch && searchMatch;
  });

  // Cart helpers
  const addToCart = useCallback((product) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) {
        return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...product, qty: 1 }];
    });
  }, []);

  const incQty = useCallback((id) => {
    setCart(prev => prev.map(i => i.id === id ? { ...i, qty: i.qty + 1 } : i));
  }, []);

  const decQty = useCallback((id) => {
    setCart(prev => {
      const item = prev.find(i => i.id === id);
      if (item.qty === 1) return prev.filter(i => i.id !== id);
      return prev.map(i => i.id === id ? { ...i, qty: i.qty - 1 } : i);
    });
  }, []);

  const removeItem = useCallback((id) => {
    setCart(prev => prev.filter(i => i.id !== id));
  }, []);

  const clearCart = () => {
    setCart([]);
    setDiscount(0);
    setCustomDiscount('');
  };

  // Totals
  const subtotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  const discountAmount = (subtotal * discount) / 100;
  const gst = ((subtotal - discountAmount) * 0.18);
  const total = subtotal - discountAmount + gst;

  const handleCheckout = () => {
    if (cart.length === 0) return;
    setShowSuccess(true);
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    clearCart();
  };

  const applyDiscount = (pct) => {
    setDiscount(d => d === pct ? 0 : pct);
    setCustomDiscount('');
  };

  const applyCustomDiscount = () => {
    const val = parseFloat(customDiscount);
    if (!isNaN(val) && val >= 0 && val <= 100) {
      setDiscount(val);
    }
  };

  return (
    <div className="flex h-full overflow-hidden">

      {/* ── LEFT: Product panel ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden border-r border-white/[0.06]">

        {/* Search + category bar */}
        <div className="flex-shrink-0 px-5 py-4 border-b border-white/[0.06] space-y-3">
          {/* Search */}
          <div className="relative">
            <Icon
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0"
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
            />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-[8px] pl-9 pr-4 py-2.5 font-inter text-[13px] text-white placeholder-white/30 focus:outline-none focus:border-[#5757f8]/50 transition-colors"
            />
          </div>

          {/* Categories */}
          <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-none">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex-shrink-0 font-manrope font-medium text-[12px] px-3.5 py-1.5 rounded-[7px] transition-all ${
                  activeCategory === cat
                    ? 'bg-[#5757f8] text-white'
                    : 'bg-white/[0.05] text-white/40 hover:text-white hover:bg-white/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-16">
              <span className="text-5xl mb-3">🔍</span>
              <p className="font-manrope font-semibold text-[14px] text-white/40">No products found</p>
              <p className="font-inter text-[12px] text-white/20 mt-1">Try a different search or category</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
              {filtered.map(p => (
                <ProductCard key={p.id} product={p} onAdd={addToCart} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT: Cart panel ───────────────────────────────────────────────── */}
      <div className="w-[340px] xl:w-[380px] flex-shrink-0 flex flex-col bg-[#0e0e1a]">

        {/* Cart header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <h3 className="font-manrope font-semibold text-[14px] text-white">Current Cart</h3>
            {cart.length > 0 && (
              <span className="bg-[#5757f8] text-white text-[10px] font-manrope font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                {cart.reduce((s, i) => s + i.qty, 0)}
              </span>
            )}
          </div>
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="font-inter text-[11px] text-white/30 hover:text-red-400 transition-colors"
            >
              Clear all
            </button>
          )}
        </div>

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto px-5">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
              <span className="text-4xl mb-3 opacity-30">🛒</span>
              <p className="font-manrope font-semibold text-[13px] text-white/20">Cart is empty</p>
              <p className="font-inter text-[11px] text-white/15 mt-1">Tap a product to add it</p>
            </div>
          ) : (
            <div>
              {cart.map(item => (
                <CartItem
                  key={item.id}
                  item={item}
                  onInc={incQty}
                  onDec={decQty}
                  onRemove={removeItem}
                />
              ))}
            </div>
          )}
        </div>

        {/* Discount + payment */}
        {cart.length > 0 && (
          <div className="flex-shrink-0 px-5 py-4 border-t border-white/[0.06] space-y-4">

            {/* Discount pills */}
            <div>
              <p className="font-manrope font-medium text-[11px] text-white/30 mb-2 uppercase tracking-wider">Discount</p>
              <div className="flex items-center gap-2 flex-wrap">
                {[5, 10, 15, 20].map(pct => (
                  <button
                    key={pct}
                    onClick={() => applyDiscount(pct)}
                    className={`font-manrope font-semibold text-[11px] px-2.5 py-1 rounded-[5px] border transition-all ${
                      discount === pct
                        ? 'bg-[#5757f8] border-[#5757f8] text-white'
                        : 'bg-transparent border-white/10 text-white/50 hover:border-white/20 hover:text-white'
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
                <div className="flex items-center gap-1 ml-auto">
                  <input
                    type="number"
                    placeholder="Custom %"
                    value={customDiscount}
                    onChange={e => setCustomDiscount(e.target.value)}
                    className="w-20 bg-white/[0.04] border border-white/[0.08] rounded-[5px] px-2 py-1 font-inter text-[11px] text-white placeholder-white/20 focus:outline-none focus:border-[#5757f8]/50"
                  />
                  <button
                    onClick={applyCustomDiscount}
                    className="font-manrope font-semibold text-[11px] bg-white/[0.06] hover:bg-white/10 text-white px-2 py-1 rounded-[5px] transition-colors"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>

            {/* Payment method */}
            <div>
              <p className="font-manrope font-medium text-[11px] text-white/30 mb-2 uppercase tracking-wider">Payment Method</p>
              <div className="grid grid-cols-3 gap-2">
                {PAYMENT_METHODS.map(m => (
                  <button
                    key={m.id}
                    onClick={() => setPaymentMethod(m.id)}
                    className={`flex flex-col items-center gap-1.5 py-2.5 rounded-[8px] border transition-all ${
                      paymentMethod === m.id
                        ? 'bg-[#5757f8]/10 border-[#5757f8]/50 text-[#5757f8]'
                        : 'bg-white/[0.03] border-white/[0.06] text-white/40 hover:border-white/10 hover:text-white'
                    }`}
                  >
                    <Icon d={m.icon} size={15} strokeWidth={1.6} />
                    <span className="font-manrope font-semibold text-[10px]">{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="bg-white/[0.03] rounded-[10px] px-4 py-3 space-y-2">
              <div className="flex justify-between">
                <span className="font-inter text-[12px] text-white/40">Subtotal</span>
                <span className="font-manrope font-semibold text-[12px] text-white">₹{subtotal.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between">
                  <span className="font-inter text-[12px] text-emerald-400">Discount ({discount}%)</span>
                  <span className="font-manrope font-semibold text-[12px] text-emerald-400">−₹{discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="font-inter text-[12px] text-white/40">GST (18%)</span>
                <span className="font-manrope font-semibold text-[12px] text-white">₹{gst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-white/[0.06] pt-2 mt-1">
                <span className="font-manrope font-bold text-[14px] text-white">Total</span>
                <span className="font-manrope font-bold text-[18px] text-white">₹{total.toFixed(2)}</span>
              </div>
            </div>

            {/* Checkout button */}
            <button
              onClick={handleCheckout}
              disabled={cart.length === 0}
              className="w-full bg-[#5757f8] hover:bg-[#6c6cf8] disabled:opacity-40 disabled:cursor-not-allowed text-white font-manrope font-bold text-[14px] py-4 rounded-[10px] transition-all active:scale-[0.98] shadow-lg shadow-[#5757f8]/20"
            >
              Charge ₹{total.toFixed(2)} · {PAYMENT_METHODS.find(m => m.id === paymentMethod)?.label}
            </button>
          </div>
        )}

        {/* Empty cart checkout placeholder */}
        {cart.length === 0 && (
          <div className="flex-shrink-0 px-5 py-4 border-t border-white/[0.06]">
            <button
              disabled
              className="w-full bg-white/[0.04] disabled:cursor-not-allowed text-white/20 font-manrope font-bold text-[14px] py-4 rounded-[10px]"
            >
              No items in cart
            </button>
          </div>
        )}
      </div>

      {/* Success Modal */}
      {showSuccess && (
        <SuccessModal
          total={total}
          method={paymentMethod}
          onClose={handleSuccessClose}
        />
      )}
    </div>
  );
};

export default PosTerminal;
