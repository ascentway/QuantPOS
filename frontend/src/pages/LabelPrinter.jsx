import React, { useState, useEffect, useRef } from 'react';
import { inventoryApi } from '../api/inventoryApi';
import { toast } from 'react-toastify';
import useAuthStore from '../store/authStore';

const Icon = ({ d, size = 16, strokeWidth = 1.6, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d={d} />
  </svg>
);

import JsBarcode from 'jsbarcode';

const LabelPrinter = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [weight, setWeight] = useState('1');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Business specs & Date/Time details
  const { user } = useAuthStore();
  const businessName = user.businessName;
  const businessGstin = user.gstin 
    ? (user.gstin.startsWith('GSTIN:') ? user.gstin : `GSTIN: ${user.gstin}`)
    : '';
  const [printDateTime, setPrintDateTime] = useState('');

  // History states
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historySearch, setHistorySearch] = useState('');

  // Searchable dropdown states
  const [productSearch, setProductSearch] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Barcode element refs
  const previewBarcodeRef = useRef(null);
  const printBarcodeRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const formatted = now.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' + 
                        now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
      setPrintDateTime(formatted);
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchHistory();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await inventoryApi.getAllProducts();
      if (res.success) {
        setProducts(res.data.filter(p => p.isActive && p.productType === 'LOOSE'));
      }
    } catch (err) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await inventoryApi.getLabelPrintHistory();
      if (res.success) {
        setHistory(res.data);
      }
    } catch (err) {
      console.error('Failed to load print history', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const selectedProduct = products.find(p => p.id === selectedProductId);
  const variants = selectedProduct?.variants || [];
  const selectedVariant = variants.find(v => v.id === selectedVariantId);

  // Filter products for the custom dropdown list
  const filteredProductsForDropdown = products.filter(p => {
    if (!productSearch) return true;
    const query = productSearch.toLowerCase();
    const nameMatch = p.name?.toLowerCase().includes(query);
    const skuMatch = p.sku?.toLowerCase().includes(query);
    const barcodeMatch = p.barcode?.toLowerCase().includes(query);
    return nameMatch || skuMatch || barcodeMatch;
  });

  // Filter history records based on search query
  const filteredHistory = history.filter(item => {
    if (!historySearch) return true;
    const query = historySearch.toLowerCase();
    return (
      item.productName?.toLowerCase().includes(query) ||
      item.sku?.toLowerCase().includes(query) ||
      item.barcode?.toLowerCase().includes(query) ||
      item.printedByUserName?.toLowerCase().includes(query)
    );
  });

  // Compute values for printing
  const isLoose = selectedProduct?.productType === 'LOOSE';
  const unitType = selectedProduct?.unitType || 'PIECE';
  const pricePaise = selectedVariant ? selectedVariant.pricePaise : (selectedProduct?.pricePaise || 0);
  const priceInRupees = pricePaise / 100;
  const sku = selectedVariant ? selectedVariant.sku : (selectedProduct?.sku || '');
  const name = selectedVariant ? `${selectedProduct?.name} (${selectedVariant.name})` : (selectedProduct?.name || '');
  const idStr = selectedVariant ? selectedVariant.id : (selectedProduct?.id || '');

  const w = parseFloat(weight) || 0;
  let calculatedPrice = 0;
  if (isLoose && w > 0) {
    if (unitType === 'GRAM' || unitType === 'ML') {
      calculatedPrice = (w / 1000) * priceInRupees;
    } else {
      calculatedPrice = w * priceInRupees;
    }
  } else {
    calculatedPrice = priceInRupees;
  }

  const calculatedPricePaise = Math.round(calculatedPrice * 100);
  const weightGrams = unitType === 'KG' || unitType === 'LITRE' ? w * 1000 : w;
  
  // Use a stable timestamp for the barcode string to avoid redraw loops
  const [barcodeTimestamp, setBarcodeTimestamp] = useState(Date.now());

  useEffect(() => {
    setBarcodeTimestamp(Date.now());
  }, [selectedProductId, selectedVariantId, weight]);

  const barcodeStr = `QP|${idStr.slice(0, 8)}|${isLoose ? weightGrams : 1}|${calculatedPricePaise}|${barcodeTimestamp}`;

  useEffect(() => {
    if (selectedProduct && barcodeStr) {
      const timer = setTimeout(() => {
        if (previewBarcodeRef.current) {
          try {
            JsBarcode(previewBarcodeRef.current, barcodeStr, {
              format: "CODE128",
              width: 1.1,
              height: 22,
              displayValue: false,
              margin: 0
            });
          } catch (err) {
            console.error("Failed to render preview barcode", err);
          }
        }
        if (printBarcodeRef.current) {
          try {
            JsBarcode(printBarcodeRef.current, barcodeStr, {
              format: "CODE128",
              width: 1.4,
              height: 32,
              displayValue: false,
              margin: 0
            });
          } catch (err) {
            console.error("Failed to render print barcode", err);
          }
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [selectedProductId, selectedVariantId, weight, barcodeStr]);

  const handlePrint = async (e) => {
    e.preventDefault();
    if (!selectedProduct) {
      toast.error('Please select a product');
      return;
    }
    if (isLoose && (!w || w <= 0)) {
      toast.error('Please enter a valid weight');
      return;
    }

    setIsSubmitting(true);

    try {
      await inventoryApi.recordLabelPrint({
        productId: selectedProductId,
        variantId: selectedVariantId || null,
        productName: name,
        sku: sku,
        barcode: barcodeStr,
        weight: isLoose ? parseFloat(weight) : null,
        unitType: isLoose ? unitType : 'PIECE',
        price: calculatedPrice
      });
      fetchHistory();
    } catch (err) {
      console.error("Failed to record label print history", err);
    }

    setTimeout(() => {
      window.print();
      setIsSubmitting(false);
    }, 100);
  };

  return (
    <div className="p-5 lg:p-7 space-y-6 max-w-[1000px] mx-auto print:hidden">
      <div>
        <h2 className="font-manrope font-bold text-[24px] text-text-primary">Label Printer</h2>
        <p className="font-inter text-[13px] text-text-muted mt-1">
          Select a product or variant to generate and print sticky thermal barcode labels.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left Form Panel */}
        <form onSubmit={handlePrint} className="md:col-span-7 bg-surface border border-theme rounded-[16px] p-6 space-y-5 shadow-sm">
          {loading ? (
            <div className="py-12 text-center text-text-muted font-inter text-[13px]">
              Loading product inventory...
            </div>
          ) : (
            <>
              {/* Searchable Combobox Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <label className="block font-inter text-[12px] font-semibold text-text-secondary mb-2">
                  Select Product *
                </label>

                {/* Trigger Button */}
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full flex items-center justify-between bg-card2 border border-theme rounded-[8px] px-3.5 py-2.5 font-inter text-[13px] text-text-primary text-left outline-none focus:border-accent hover:border-accent/60 transition-colors"
                >
                  <span className={selectedProduct ? 'text-text-primary font-medium' : 'text-text-muted'}>
                    {selectedProduct
                      ? `${selectedProduct.name} (Loose)`
                      : 'Search here'}
                  </span>
                  <span className={`inline-block transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} style={{ fontSize: '10px' }}>
                    ▼
                  </span>
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute left-0 right-0 mt-1.5 bg-surface border border-theme rounded-[10px] shadow-2xl z-50 flex flex-col overflow-hidden max-h-[300px]">
                    {/* Search Input Bar */}
                    <div className="p-2 border-b border-theme bg-card2/20 flex items-center gap-2">
                      <Icon d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" size={14} className="text-text-muted flex-shrink-0" />
                      <input
                        type="text"
                        value={productSearch}
                        onChange={e => setProductSearch(e.target.value)}
                        placeholder="Search by name, SKU, or barcode..."
                        className="w-full bg-transparent text-[13px] text-text-primary outline-none py-1"
                        autoFocus
                      />
                      {productSearch && (
                        <button
                          type="button"
                          onClick={() => setProductSearch('')}
                          className="text-text-muted hover:text-text-primary text-[11px] px-1"
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    {/* Options List */}
                    <div className="overflow-y-auto divide-y divide-theme max-h-[220px]">
                      {filteredProductsForDropdown.length === 0 ? (
                        <div className="px-4 py-3 text-center text-text-muted font-inter text-[12px]">
                          No matching products found
                        </div>
                      ) : (
                        filteredProductsForDropdown.map(p => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              setSelectedProductId(p.id);
                              setSelectedVariantId('');
                              setIsDropdownOpen(false);
                              setProductSearch('');
                            }}
                            className={`w-full text-left px-4 py-2.5 text-[12.5px] hover:bg-card2 transition-colors flex flex-col gap-0.5 ${selectedProductId === p.id ? 'bg-accent/5 text-accent font-semibold' : 'text-text-secondary'
                              }`}
                          >
                            <div className="flex justify-between items-center w-full">
                              <span className="truncate pr-2 font-medium">{p.name}</span>
                            </div>
                            <div className="flex justify-between items-center text-[10.5px] text-text-muted">
                              <span>SKU: {p.sku || 'N/A'}</span>
                              {p.barcode && <span>Barcode: {p.barcode}</span>}
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {variants.length > 0 && (
                <div>
                  <label className="block font-inter text-[12px] font-semibold text-text-secondary mb-2">
                    Select Variant *
                  </label>
                  <select
                    required
                    value={selectedVariantId}
                    onChange={e => setSelectedVariantId(e.target.value)}
                    className="w-full bg-card2 border border-theme rounded-[8px] px-3.5 py-2.5 font-inter text-[13px] text-text-primary outline-none focus:border-accent"
                  >
                    <option value="">-- Choose Variant --</option>
                    {variants.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.sku})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {isLoose && (
                <div>
                  <label className="block font-inter text-[12px] font-semibold text-text-secondary mb-2">
                    Weight / Volume ({unitType}) *
                  </label>
                  <input
                    required
                    type="number"
                    step="0.001"
                    min="0.001"
                    value={weight}
                    onChange={e => setWeight(e.target.value)}
                    className="w-full bg-card2 border border-theme rounded-[8px] px-3.5 py-2.5 font-inter text-[13px] text-text-primary outline-none focus:border-accent"
                    placeholder="e.g. 0.5"
                  />
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={!selectedProduct || isSubmitting}
                  className="w-full bg-accent hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed text-white font-manrope font-bold text-[14px] py-3 rounded-[8px] transition-all flex items-center justify-center gap-2 hover:-translate-y-[1px] hover:shadow-md active:translate-y-0 active:shadow-sm"
                >
                  <Icon d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2m-12 0v5h8v-5" size={16} />
                  {isSubmitting ? 'Generating...' : 'Print Barcode Label'}
                </button>
              </div>
            </>
          )}
        </form>

        {/* Right Preview Panel */}
        <div className="md:col-span-5 flex flex-col items-center bg-surface border border-theme rounded-[16px] p-6 shadow-sm">
          <p className="font-manrope font-bold text-[13px] text-text-muted mb-4 uppercase tracking-wider">
            Sticker Live Preview
          </p>

          {selectedProduct ? (
            <div className="w-[200px] h-[120px] bg-white text-black p-2 border border-dashed border-gray-400 rounded-[4px] flex flex-col justify-between items-center shadow-inner relative overflow-hidden select-none">
              {/* Store Identifier */}
              <div className="w-full flex flex-col items-center border-b border-black/10 pb-0.5">
                <span className="font-manrope font-bold text-[8.5px] leading-tight uppercase truncate max-w-full">{businessName}</span>
                <div className="w-full flex justify-between text-[7px] text-gray-500 font-semibold mt-0.5">
                  <span className="truncate max-w-[60%]">{businessGstin}</span>
                  <span>{printDateTime}</span>
                </div>
              </div>

              {/* Product Info */}
              <div className="w-full text-center my-0.5">
                <p className="font-manrope font-bold text-[10.5px] leading-tight truncate">{name}</p>
                <p className="font-inter text-[8px] text-gray-500 leading-none">SKU: {sku}</p>
              </div>

              {/* Price & Weight Detail */}
              <div className="w-full flex justify-between items-center px-1 my-0.5">
                <div className="text-[7.5px] text-left leading-tight">
                  <p className="font-bold">
                    {isLoose ? `${w.toFixed(3)} ${unitType}` : '1.000 unit'}
                  </p>
                  <p className="text-gray-500">₹{priceInRupees.toFixed(2)}/{unitType}</p>
                </div>
                <div className="text-right leading-none">
                  <p className="font-manrope font-extrabold text-[12px]">₹{calculatedPrice.toFixed(2)}</p>
                </div>
              </div>

              {/* Real Barcode Graphic */}
              <div className="w-full flex flex-col items-center">
                <svg ref={previewBarcodeRef} className="max-w-full h-6"></svg>
                <p className="font-mono text-[5.5px] tracking-tight mt-0.5 text-gray-600 truncate max-w-full">
                  {barcodeStr}
                </p>
              </div>
            </div>
          ) : (
            <div className="w-[200px] h-[120px] border border-dashed border-theme rounded-[8px] flex flex-col items-center justify-center text-center p-4">
              <span className="text-2xl mb-1 opacity-20">🖨️</span>
              <p className="font-inter text-[11px] text-text-muted">
                Choose a product to render print preview
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Hidden Print Container */}
      {selectedProduct && (
        <div className="hidden print:flex printable-sticker-container">
          <div className="print-header">
            <span className="print-biz-name">{businessName}</span>
            <div className="print-biz-sub">
              <span>{businessGstin}</span>
              <span>{printDateTime}</span>
            </div>
          </div>

          <div className="print-product">
            <p className="print-name">{name}</p>
            <p className="print-sku">SKU: {sku}</p>
          </div>

          <div className="print-pricing">
            <div className="print-qty-details">
              <p className="print-qty">
                {isLoose ? `${w.toFixed(3)} ${unitType}` : '1.000 unit'}
              </p>
              <p className="print-rate">₹{priceInRupees.toFixed(2)}/{unitType}</p>
            </div>
            <p className="print-total">₹{calculatedPrice.toFixed(2)}</p>
          </div>

          <div className="print-barcode-box">
            <svg ref={printBarcodeRef} className="print-barcode-svg"></svg>
            <p className="print-barcode-text">{barcodeStr}</p>
          </div>
        </div>
      )}

      {/* Embedded print page sizing stylesheet */}
      <style>{`
        @media print {
          @page {
            size: 50mm 25mm;
            margin: 0;
          }
          /* Hide all main layout containers */
          aside, header, main, #root > div:not(.printable-sticker-container), .print-hide {
            display: none !important;
          }
          body, #root {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            width: 50mm !important;
            height: 25mm !important;
            overflow: visible !important;
          }
          .printable-sticker-container {
            display: flex !important;
            flex-direction: column;
            justify-content: space-between;
            align-items: center;
            width: 50mm;
            height: 25mm;
            padding: 1.2mm 2mm;
            box-sizing: border-box;
            background: white;
            color: black;
            font-family: 'Manrope', 'Inter', sans-serif;
            position: absolute;
            top: 0;
            left: 0;
          }
          .print-header {
            width: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            border-bottom: 0.1mm solid rgba(0, 0, 0, 0.12);
            padding-bottom: 0.3mm;
          }
          .print-biz-name {
            font-size: 8px;
            font-weight: 800;
            text-transform: uppercase;
            line-height: 1.1;
            text-align: center;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 100%;
          }
          .print-biz-sub {
            width: 100%;
            display: flex;
            justify-content: space-between;
            font-size: 6px;
            color: #333;
            font-weight: 600;
            margin-top: 0.2mm;
          }
          .print-product {
            width: 100%;
            text-align: center;
            margin-top: 0.4mm;
            line-height: 1.1;
          }
          .print-name {
            font-size: 10px;
            font-weight: 800;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 100%;
            margin: 0;
          }
          .print-sku {
            font-size: 7px;
            color: #444;
            margin: 0;
          }
          .print-pricing {
            width: 100%;
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0 0.5mm;
            margin-top: 0.4mm;
          }
          .print-qty-details {
            text-align: left;
            line-height: 1;
          }
          .print-qty {
            font-size: 7px;
            font-weight: 700;
            margin: 0;
          }
          .print-rate {
            font-size: 6px;
            color: #444;
            margin: 0;
          }
          .print-total {
            font-size: 11px;
            font-weight: 900;
            margin: 0;
          }
          .print-barcode-box {
            width: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            margin-top: 0.4mm;
          }
          .print-barcode-svg {
            max-width: 100%;
            height: 25px !important;
          }
          .print-barcode-text {
            font-family: monospace;
            font-size: 5px;
            color: #222;
            margin: 0.2mm 0 0 0;
            line-height: 1;
            letter-spacing: -0.1px;
          }
        }
      `}</style>

      {/* Print History Section */}
      <div className="bg-surface border border-theme rounded-[16px] p-6 shadow-sm mt-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="font-manrope font-bold text-[18px] text-text-primary">Print History</h3>
            <p className="font-inter text-[12px] text-text-muted mt-0.5">
              Logs of generated and printed thermal labels (Role-based access)
            </p>
          </div>
          {/* Search bar in history */}
          <div className="relative max-w-[320px] w-full">
            <input
              type="text"
              value={historySearch}
              onChange={e => setHistorySearch(e.target.value)}
              placeholder="Search history by name, SKU or barcode..."
              className="w-full bg-card2 border border-theme rounded-[8px] pl-9 pr-3.5 py-2 font-inter text-[12.5px] text-text-primary outline-none focus:border-accent"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
              <Icon d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" size={14} />
            </span>
            {historySearch && (
              <button
                type="button"
                onClick={() => setHistorySearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary text-[11px]"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {historyLoading ? (
          <div className="py-12 text-center text-text-muted font-inter text-[13px]">
            Loading print history...
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="py-12 text-center text-text-muted font-inter text-[13px] border border-dashed border-theme rounded-[8px]">
            No label history found.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-[8px] border border-theme">
            <table className="w-full border-collapse text-left font-inter text-[13px]">
              <thead>
                <tr className="bg-card2/50 border-b border-theme text-text-secondary font-semibold">
                  <th className="px-4 py-3">Printed At</th>
                  <th className="px-4 py-3">Product / Variant</th>
                  <th className="px-4 py-3">SKU</th>
                  <th className="px-4 py-3">Price & Weight</th>
                  <th className="px-4 py-3">Barcode</th>
                  <th className="px-4 py-3">Printed By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme text-text-primary">
                {filteredHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-card2/20 transition-colors">
                    <td className="px-4 py-3 text-text-muted whitespace-nowrap">
                      {new Date(item.printedAt).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </td>
                    <td className="px-4 py-3 font-medium truncate max-w-[200px]">
                      {item.productName}
                    </td>
                    <td className="px-4 py-3 text-text-muted font-mono">
                      {item.sku}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-semibold text-accent">₹{item.price.toFixed(2)}</div>
                      <div className="text-[11px] text-text-muted">
                        {item.weight !== null && item.weight !== undefined ? `${item.weight.toFixed(3)} ${item.unitType}` : `1.000 ${item.unitType}`}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-text-muted truncate max-w-[150px]" title={item.barcode}>
                      {item.barcode}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-medium">{item.printedByUserName}</div>
                      <span className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded mt-0.5 ${
                        item.printedByUserRole === 'OWNER' ? 'bg-emerald-500/10 text-emerald-500' :
                        item.printedByUserRole === 'MANAGER' ? 'bg-purple-500/10 text-purple-500' :
                        'bg-blue-500/10 text-blue-500'
                      }`}>
                        {item.printedByUserRole}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default LabelPrinter;
