import React, { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { inventoryApi } from '../api/inventoryApi';
import { useBarcodeScanner } from '../hooks/useBarcodeScanner';
import LooseProductModal from '../components/pos/LooseProductModal';
import BarcodeScannerModal from '../components/inventory/BarcodeScannerModal';
import { Wordmark } from '../components/ui/Wordmark';
import { toast } from 'react-toastify';

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

const PAYMENT_METHODS = [
  { id: 'cash',  label: 'Cash',  icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z' },
  { id: 'upi',   label: 'UPI',   icon: 'M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z' },
  { id: 'card',  label: 'Card',  icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
];

// ─── Product Card ─────────────────────────────────────────────────────────────
const ProductCard = ({ product, onAdd }) => (
  <button
    onClick={() => onAdd(product)}
    className="group relative bg-surface border border-theme hover:border-accent/40 rounded-[10px] p-3.5 flex flex-col items-start gap-2 text-left transition-all duration-150 hover:bg-white/5 active:scale-[0.97]"
  >
    <div className="w-full flex items-start justify-between">
      <span className="text-2xl leading-none">{product.emoji}</span>
      <span className={`font-inter text-[10px] px-1.5 py-0.5 rounded-[4px] ${
        product.stock < 60
          ? 'bg-danger/10 text-danger'
          : 'bg-success/10 text-success'
      }`}>
        {product.stock < 60 ? `${product.stock} left` : 'In Stock'}
      </span>
    </div>
    <div className="w-full min-w-0">
      <p className="font-inter text-[12.5px] text-secondary leading-tight line-clamp-2">{product.name}</p>
      <p className="font-manrope font-bold text-[15px] text-primary mt-1.5">₹{(product.pricePaise / 100).toFixed(2)}</p>
    </div>
    {/* Add indicator */}
    <div className="absolute inset-0 rounded-[10px] border-2 border-accent opacity-0 group-hover:opacity-30 transition-opacity pointer-events-none" />
  </button>
);

// ─── Cart Item ────────────────────────────────────────────────────────────────
const CartItem = ({ item, onInc, onDec, onRemove }) => (
  <div className="flex items-center gap-3 py-3 border-b border-theme group">
    <span className="text-xl flex-shrink-0">{item.emoji}</span>
    <div className="flex-1 min-w-0">
      <p className="font-inter text-[12.5px] text-secondary truncate">{item.name}</p>
      <p className="font-manrope font-semibold text-[12px] text-muted">₹{item.price} × {item.qty}</p>
    </div>
    <div className="flex items-center gap-1.5 flex-shrink-0">
      <button
        onClick={() => onDec(item.id)}
        className="w-6 h-6 flex items-center justify-center rounded-[4px] bg-white/[0.06] hover:bg-white/10 text-secondary hover:text-primary transition-colors text-sm font-bold"
      >−</button>
      <span className="font-manrope font-bold text-[13px] text-primary w-5 text-center">{item.qty}</span>
      <button
        onClick={() => onInc(item.id)}
        className="w-6 h-6 flex items-center justify-center rounded-[4px] bg-white/[0.06] hover:bg-white/10 text-secondary hover:text-primary transition-colors text-sm font-bold"
      >+</button>
    </div>
    <p className="font-manrope font-bold text-[13px] text-primary w-14 text-right flex-shrink-0">
      ₹{(item.cartPrice * item.qty).toFixed(2)}
    </p>
    <button
      onClick={() => onRemove(item.id)}
      className="opacity-0 group-hover:opacity-100 text-muted hover:text-danger transition-all ml-1"
    >
      <Icon d="M6 18L18 6M6 6l12 12" size={14} />
    </button>
  </div>
);

// ─── Success Modal ─────────────────────────────────────────────────────────────
const SuccessModal = ({ total, method, customerName, customerEmail, customerPhone, deliveryMethod, onClose }) => {
  const getDeliveryStatus = () => {
    if (deliveryMethod === 'PRINT') return 'Receipt queued for physical printing.';
    if (deliveryMethod === 'EMAIL') return `Receipt emailed to ${customerEmail}.`;
    if (deliveryMethod === 'SMS') return `Receipt SMS/WhatsApp sent to ${customerPhone}.`;
    if (deliveryMethod === 'BOTH') return `Receipt printed & digital copy sent to ${customerEmail || customerPhone}.`;
    return 'No receipt requested.';
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-surface border border-theme rounded-[16px] p-8 flex flex-col items-center gap-4 shadow-2xl max-w-sm w-full mx-4">
        <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center">
          <Icon d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" size={32} strokeWidth={1.8} className="text-success" />
        </div>
        <div className="text-center">
          <h3 className="font-manrope font-bold text-[20px] text-primary">Payment Successful</h3>
          <p className="font-inter text-[13px] text-muted mt-1">Transaction completed</p>
        </div>
        <div className="w-full bg-card2 rounded-[10px] p-4 flex flex-col gap-2">
          <div className="flex justify-between">
            <span className="font-inter text-[12px] text-muted">Amount</span>
            <span className="font-manrope font-bold text-[14px] text-primary">₹{total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-inter text-[12px] text-muted">Method</span>
            <span className="font-manrope font-semibold text-[12px] text-primary capitalize">{method}</span>
          </div>
          {customerName && (
            <div className="flex justify-between">
              <span className="font-inter text-[12px] text-muted">Customer</span>
              <span className="font-manrope font-semibold text-[12px] text-primary truncate max-w-[150px]">{customerName}</span>
            </div>
          )}
          {deliveryMethod !== 'NONE' && (
            <div className="flex flex-col border-t border-theme pt-2 mt-1">
              <span className="font-inter text-[10px] text-muted mb-0.5">Receipt Status</span>
              <span className="font-inter text-[12px] text-success leading-snug">{getDeliveryStatus()}</span>
            </div>
          )}
        </div>
        <div className="flex gap-2 w-full">
          {(deliveryMethod === 'PRINT' || deliveryMethod === 'BOTH') && (
            <button
              onClick={handlePrint}
              className="flex-1 bg-white/[0.06] hover:bg-white/10 text-primary border border-white/10 font-manrope font-semibold text-[13px] py-3 rounded-[10px] transition-colors flex items-center justify-center gap-1.5"
            >
              <span>🖨️</span> Print
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 bg-accent hover:bg-accent-hover text-white font-manrope font-semibold text-[13px] py-3 rounded-[10px] transition-colors"
          >
            New Sale
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── POS Terminal ─────────────────────────────────────────────────────────────
const PosTerminal = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(['All']);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [showSuccess, setShowSuccess] = useState(false);
  const [customDiscount, setCustomDiscount] = useState('');

  // Customer & Receipt Delivery states
  const [showCustomerSection, setShowCustomerSection] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState('PRINT');
  const [errors, setErrors] = useState({});

  // Loose Product Modal state
  const [selectedLooseProduct, setSelectedLooseProduct] = useState(null);
  const [isLooseModalOpen, setIsLooseModalOpen] = useState(false);
  const [showScannerModal, setShowScannerModal] = useState(false);

  useEffect(() => {
    inventoryApi.getAllProducts()
      .then(res => {
        if (res.success) {
          const fetchedProducts = res.data.map(p => ({
            ...p,
            stock: p.stockQuantity || 0,
            emoji: '📦',
            category: p.productType // Simple fallback
          }));
          setProducts(fetchedProducts);
          // Set unique categories
          const cats = new Set(fetchedProducts.map(p => p.category));
          setCategories(['All', ...cats]);
        }
      })
      .catch(err => {
        console.error("Failed to fetch products:", err);
        const msg = err.response?.data?.message || err.message;
        if (err.response?.status === 500) {
          toast.error(`Server error (500): Could not connect to backend. Please ensure the backend is running.`);
        } else {
          toast.error(`Failed to load products: ${msg}`);
        }
      })
      .finally(() => setLoadingProducts(false));
  }, []);

  // Filter products
  const filtered = products.filter(p => {
    const catMatch = activeCategory === 'All' || p.category === activeCategory;
    const searchMatch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return catMatch && searchMatch;
  });

  // Cart helpers
  const handleProductClick = useCallback((product) => {
    if (product.productType === 'LOOSE') {
      setSelectedLooseProduct(product);
      setIsLooseModalOpen(true);
    } else {
      addToCart(product, 1, product.pricePaise / 100);
    }
  }, []);

  const addToCart = useCallback((product, qty = 1, priceInRupees = null) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) {
        return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + qty } : i);
      }
      return [...prev, { ...product, qty, cartPrice: priceInRupees }];
    });
  }, []);

  const handleLooseConfirm = (product, parsedQty, calculatedPrice) => {
    addToCart(product, parsedQty, calculatedPrice / parsedQty);
    toast.success(`Added ${parsedQty} to cart`);
  };

  const handleBarcodeScan = useCallback((barcode) => {
    // If modal is open, ignore global barcode scanner
    if (isLooseModalOpen) return;

    inventoryApi.lookupBarcode(barcode)
      .then(res => {
        if (res.success) {
          const result = res.data;
          const p = result.product;
          const prodObj = { ...p, stock: p.stockQuantity || 0, emoji: '📦', category: p.productType };
          
          if ((result.isScaleBarcode || result.isQuantPosLabel) && result.weightGrams > 0) {
            // It has pre-calculated weight and price
            const cartPrice = result.calculatedPricePaise / 100;
            addToCart(prodObj, result.weightGrams, cartPrice / result.weightGrams);
            toast.success(`Scanned scale barcode: ${p.name}`);
          } else if (result.isScaleBarcode || result.isQuantPosLabel) {
            toast.error(`Scale barcode has invalid weight: ${result.weightGrams || 0}g`);
          } else {
            // Standard barcode
            handleProductClick(prodObj);
            if(p.productType !== 'LOOSE') {
                toast.success(`Scanned: ${p.name}`);
            }
          }
        }
      })
      .catch(err => {
        console.error("Barcode lookup failed", err);
        toast.error(`Barcode not recognized: ${barcode}`);
      });
  }, [addToCart, handleProductClick, isLooseModalOpen]);

  useBarcodeScanner(handleBarcodeScan, true, 50);

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
  const subtotal = cart.reduce((sum, i) => sum + (i.cartPrice * i.qty), 0);
  const discountAmount = (subtotal * discount) / 100;
  const gst = ((subtotal - discountAmount) * 0.18);
  const total = subtotal - discountAmount + gst;

  const handleCheckout = () => {
    if (cart.length === 0) return;

    // Validate delivery contacts
    const newErrors = {};
    if ((deliveryMethod === 'EMAIL' || deliveryMethod === 'BOTH') && !customerEmail.trim()) {
      newErrors.email = 'Required';
    }
    if ((deliveryMethod === 'SMS' || deliveryMethod === 'BOTH') && !customerPhone.trim()) {
      newErrors.phone = 'Required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setShowCustomerSection(true);
      return;
    }

    setShowSuccess(true);
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    clearCart();
    setCustomerName('');
    setCustomerEmail('');
    setCustomerPhone('');
    setDeliveryMethod('PRINT');
    setErrors({});
    setShowCustomerSection(false);
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
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-app text-primary">
      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="h-16 flex items-center justify-between px-6 border-b border-theme bg-surface flex-shrink-0 relative z-10">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="flex items-center justify-center w-8 h-8 rounded-[6px] text-muted hover:text-primary hover:bg-white/5 transition-colors">
            <Icon d="M15 18l-6-6 6-6" size={16} />
          </Link>
          <Wordmark size={28} />
        </div>
        <div className="flex items-center gap-3">
          <span className="font-manrope font-semibold text-[13px] text-secondary">Point of Sale</span>
        </div>
      </header>

      {/* ── Main Content ─────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden relative z-10">
        {/* ── LEFT: Product panel ─────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden border-r border-theme bg-app">

          {/* Search + category bar */}
          <div className="flex-shrink-0 px-6 py-4 border-b border-theme space-y-4 bg-surface/50">
            {/* Search */}
            <div className="relative flex items-center">
              <Icon
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0"
                size={16}
                className="absolute left-3.5 text-muted pointer-events-none"
              />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-white/[0.03] border border-theme rounded-[8px] pl-10 pr-10 py-2.5 font-inter text-[14px] text-primary placeholder-muted focus:outline-none focus:border-accent/50 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowScannerModal(true)}
                className="absolute right-3.5 text-muted hover:text-accent transition-colors"
                title="Scan barcode with camera"
              >
                <Icon d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" size={16} />
              </button>
            </div>

            {/* Categories */}
            <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-thin">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`flex-shrink-0 font-manrope font-medium text-[13px] px-4 py-2 rounded-[8px] transition-all ${
                    activeCategory === cat
                      ? 'bg-accent text-white shadow-btn'
                      : 'bg-card2 text-secondary hover:text-primary hover:bg-white/10'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Product grid */}
          <div className="flex-1 overflow-y-auto p-5 scrollbar-thin">
            {loadingProducts ? (
               <div className="flex flex-col items-center justify-center h-full text-center">
                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mb-4"></div>
                 <p className="font-manrope text-muted text-sm">Loading inventory...</p>
               </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-16">
                <span className="text-5xl mb-4">🔍</span>
                <p className="font-manrope font-semibold text-[15px] text-muted">No products found</p>
                <p className="font-inter text-[13px] text-muted/60 mt-1">Try a different search or category</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                {filtered.map(p => (
                  <ProductCard key={p.id} product={p} onAdd={handleProductClick} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: Cart panel ───────────────────────────────────────────────── */}
        <div className="w-[360px] xl:w-[400px] flex-shrink-0 flex flex-col bg-sidebar">

          {/* Cart header */}
          <div className="flex items-center justify-between px-6 py-4.5 border-b border-theme bg-surface">
            <div className="flex items-center gap-2">
              <h3 className="font-manrope font-semibold text-[15px] text-primary">Current Cart</h3>
              {cart.length > 0 && (
                <span className="bg-accent text-white text-[11px] font-manrope font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                  {cart.reduce((s, i) => s + i.qty, 0)}
                </span>
              )}
            </div>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="font-inter text-[12px] text-muted hover:text-danger transition-colors"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Cart items */}
          <div className="flex-1 overflow-y-auto px-6 scrollbar-thin">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-8">
                <span className="text-5xl mb-4 opacity-30">🛒</span>
                <p className="font-manrope font-semibold text-[14px] text-muted">Cart is empty</p>
                <p className="font-inter text-[12px] text-muted/60 mt-1">Tap a product to add it</p>
              </div>
            ) : (
              <div className="py-2">
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
            <div className="flex-shrink-0 px-6 py-5 border-t border-theme space-y-4.5 bg-surface/80">

              {/* Customer Details & Receipt Delivery */}
              <div className="border-b border-theme pb-4">
                <div className="flex items-center justify-between mb-2.5">
                  <p className="font-manrope font-medium text-[11px] text-muted uppercase tracking-wider">Customer & Receipt</p>
                  <button
                    type="button"
                    onClick={() => setShowCustomerSection(!showCustomerSection)}
                    className="text-[12px] text-accent hover:text-accent-hover font-semibold flex items-center gap-1 transition-colors"
                  >
                    {showCustomerSection ? 'Hide Details' : 'Add Details'}
                  </button>
                </div>

                {showCustomerSection && (
                  <div className="space-y-3.5 mt-3.5">
                    {/* Inputs */}
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Customer Name"
                        value={customerName}
                        onChange={e => setCustomerName(e.target.value)}
                        className="w-full bg-white/[0.03] border border-theme rounded-[8px] px-3.5 py-2.5 font-inter text-[13px] text-primary placeholder-muted focus:outline-none focus:border-accent/50 transition-colors"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <div className="relative">
                          <input
                            type="email"
                            placeholder="Email Address"
                            value={customerEmail}
                            onChange={e => {
                              setCustomerEmail(e.target.value);
                              if (errors.email) setErrors(prev => ({ ...prev, email: null }));
                            }}
                            className={`w-full bg-white/[0.03] border ${errors.email ? 'border-danger/50' : 'border-theme'} rounded-[8px] px-3.5 py-2.5 font-inter text-[13px] text-primary placeholder-muted focus:outline-none focus:border-accent/50 transition-colors`}
                          />
                          {errors.email && (
                            <span className="text-[10px] text-danger font-semibold absolute left-2 -bottom-4.5 bg-sidebar px-1 z-10">
                              {errors.email}
                            </span>
                          )}
                        </div>
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Phone Number"
                            value={customerPhone}
                            onChange={e => {
                              setCustomerPhone(e.target.value);
                              if (errors.phone) setErrors(prev => ({ ...prev, phone: null }));
                            }}
                            className={`w-full bg-white/[0.03] border ${errors.phone ? 'border-danger/50' : 'border-theme'} rounded-[8px] px-3.5 py-2.5 font-inter text-[13px] text-primary placeholder-muted focus:outline-none focus:border-accent/50 transition-colors`}
                          />
                          {errors.phone && (
                            <span className="text-[10px] text-danger font-semibold absolute left-2 -bottom-4.5 bg-sidebar px-1 z-10">
                              {errors.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Delivery Grid */}
                    <div className="pt-2.5">
                      <p className="font-manrope font-semibold text-[10px] text-muted mb-2.5 uppercase tracking-wider">Delivery Option</p>
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { id: 'PRINT', label: 'Print Only', icon: '🖨️' },
                          { id: 'EMAIL', label: 'Email', icon: '📧' },
                          { id: 'SMS', label: 'SMS', icon: '📱' },
                          { id: 'BOTH', label: 'Print & Dig.', icon: '🔄' }
                        ].map(opt => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => {
                              setDeliveryMethod(opt.id);
                              setErrors({});
                            }}
                            className={`flex flex-col items-center justify-center py-2.5 px-1.5 rounded-[8px] border transition-all ${
                              deliveryMethod === opt.id
                                ? 'bg-accent/10 border-accent/50 text-accent'
                                : 'bg-card2 border-theme text-muted hover:border-white/10 hover:text-primary'
                            }`}
                          >
                            <span className="text-lg mb-1.5">{opt.icon}</span>
                            <span className="text-[10px] font-manrope font-bold text-center leading-none truncate w-full">{opt.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Discount pills */}
              <div>
                <p className="font-manrope font-medium text-[11px] text-muted mb-2 uppercase tracking-wider">Discount</p>
                <div className="flex items-center gap-2 flex-wrap">
                  {[5, 10, 15, 20].map(pct => (
                    <button
                      key={pct}
                      onClick={() => applyDiscount(pct)}
                      className={`font-manrope font-semibold text-[12px] px-3 py-1.5 rounded-[6px] border transition-all ${
                        discount === pct
                          ? 'bg-accent border-accent text-white'
                          : 'bg-transparent border-theme text-muted hover:border-white/20 hover:text-primary'
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                  <div className="flex items-center gap-1.5 ml-auto">
                    <input
                      type="number"
                      placeholder="Custom %"
                      value={customDiscount}
                      onChange={e => setCustomDiscount(e.target.value)}
                      className="w-24 bg-white/[0.03] border border-theme rounded-[6px] px-2.5 py-1.5 font-inter text-[12px] text-primary placeholder-muted focus:outline-none focus:border-accent/50"
                    />
                    <button
                      onClick={applyCustomDiscount}
                      className="font-manrope font-semibold text-[12px] bg-white/[0.05] hover:bg-white/10 text-primary px-3 py-1.5 rounded-[6px] transition-colors"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>

              {/* Payment method */}
              <div>
                <p className="font-manrope font-medium text-[11px] text-muted mb-2.5 uppercase tracking-wider">Payment Method</p>
                <div className="grid grid-cols-3 gap-2">
                  {PAYMENT_METHODS.map(m => (
                    <button
                      key={m.id}
                      onClick={() => setPaymentMethod(m.id)}
                      className={`flex flex-col items-center gap-1.5 py-3 rounded-[8px] border transition-all ${
                        paymentMethod === m.id
                          ? 'bg-accent/10 border-accent/50 text-accent'
                          : 'bg-card2 border-theme text-muted hover:border-white/10 hover:text-primary'
                      }`}
                    >
                      <Icon d={m.icon} size={16} strokeWidth={1.8} />
                      <span className="font-manrope font-semibold text-[11px]">{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="bg-card2 rounded-[10px] px-4.5 py-3.5 space-y-2.5 border border-theme">
                <div className="flex justify-between">
                  <span className="font-inter text-[13px] text-muted">Subtotal</span>
                  <span className="font-manrope font-semibold text-[13px] text-primary">₹{subtotal.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between">
                    <span className="font-inter text-[13px] text-success">Discount ({discount}%)</span>
                    <span className="font-manrope font-semibold text-[13px] text-success">−₹{discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="font-inter text-[13px] text-muted">GST (18%)</span>
                  <span className="font-manrope font-semibold text-[13px] text-primary">₹{gst.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-theme pt-3 mt-1">
                  <span className="font-manrope font-bold text-[15px] text-primary">Total</span>
                  <span className="font-manrope font-bold text-[20px] text-primary">₹{total.toFixed(2)}</span>
                </div>
              </div>

              {/* Checkout button */}
              <button
                onClick={handleCheckout}
                disabled={cart.length === 0}
                className="w-full bg-accent hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed text-white font-manrope font-bold text-[15px] py-4.5 rounded-[10px] transition-all active:scale-[0.98] shadow-btn"
              >
                Charge ₹{total.toFixed(2)} · {PAYMENT_METHODS.find(m => m.id === paymentMethod)?.label}
              </button>
            </div>
          )}

          {/* Empty cart checkout placeholder */}
          {cart.length === 0 && (
            <div className="flex-shrink-0 px-6 py-5 border-t border-theme">
              <button
                disabled
                className="w-full bg-card2 disabled:cursor-not-allowed text-muted font-manrope font-bold text-[15px] py-4.5 rounded-[10px] border border-theme"
              >
                No items in cart
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Success Modal */}
      {showSuccess && (
        <SuccessModal
          total={total}
          method={paymentMethod}
          customerName={customerName}
          customerEmail={customerEmail}
          customerPhone={customerPhone}
          deliveryMethod={deliveryMethod}
          onClose={handleSuccessClose}
        />
      )}
      
      {/* Loose Product Modal */}
      <LooseProductModal 
        product={selectedLooseProduct} 
        isOpen={isLooseModalOpen} 
        onClose={() => setIsLooseModalOpen(false)} 
        onConfirm={handleLooseConfirm} 
      />

      <BarcodeScannerModal
        isOpen={showScannerModal}
        onClose={() => setShowScannerModal(false)}
        onScanSuccess={(code) => {
          setShowScannerModal(false);
          handleBarcodeScan(code);
        }}
      />
    </div>
  );
};

export default PosTerminal;
