import React, { useState, useEffect } from 'react';
import { inventoryApi } from '../api/inventoryApi';
import { toast } from 'react-toastify';
import BarcodeScannerModal from '../components/inventory/BarcodeScannerModal';
import useAuthStore from '../store/authStore';

// ─── Micro Icon ───────────────────────────────────────────────────────────────
const Icon = ({ d, size = 16, strokeWidth = 1.6, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d={d} />
  </svg>
);

const Inventory = () => {
  const { user } = useAuthStore();
  const isManagerOrOwner = ['OWNER', 'MANAGER'].includes(user?.role);
  const canDirectlyManageStock = isManagerOrOwner || user?.permissions?.includes('MANAGE_INVENTORY');

  const [activeTab, setActiveTab] = useState('products'); // 'products' | 'pending' | 'history'
  const [products, setProducts] = useState([]);
  const [pendingTransactions, setPendingTransactions] = useState([]);
  const [historyTransactions, setHistoryTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalTab, setModalTab] = useState('adjust'); // 'new_product' | 'adjust'
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [isEditingVariant, setIsEditingVariant] = useState(false);
  const [editingVariantId, setEditingVariantId] = useState(null);
  const [showDeleteVariantConfirm, setShowDeleteVariantConfirm] = useState(false);
  const [variantToDelete, setVariantToDelete] = useState(null);
  
  // Collapsible hierarchy & detail modal states
  const [expandedProducts, setExpandedProducts] = useState({});
  const [showProductDetailsModal, setShowProductDetailsModal] = useState(false);
  const [selectedProductForDetails, setSelectedProductForDetails] = useState(null);

  const toggleProductExpand = (id) => {
    setExpandedProducts(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleViewProductDetails = (p) => {
    setSelectedProductForDetails(p);
    setShowProductDetailsModal(true);
  };

  // Editing states
  const [isEditing, setIsEditing] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [approveTransactionAfterSave, setApproveTransactionAfterSave] = useState(null);

  // Variant Modal states
  const [showVariantModal, setShowVariantModal] = useState(false);
  const [selectedProductForVariant, setSelectedProductForVariant] = useState(null);
  const [variantForm, setVariantForm] = useState({
    name: '', sku: '', barcode: '', pricePaise: '',
    stockQuantity: '0', lowStockThreshold: '0'
  });
  
  // New Product Form State
  const [productForm, setProductForm] = useState({
    name: '', sku: '', barcode: '', productType: 'PACKAGED',
    pricePaise: '', costPaise: '', hsnCode: '', gstRate: '0',
    gstInclusive: false, unitType: 'PIECE', pricePerUnitPaise: '',
    stockQuantity: '0', minimumLooseQuantity: ''
  });

  // Adjust Stock Form State
  const [stockForm, setStockForm] = useState({
    productId: '', variantId: '', type: 'ADD', quantity: '',
    reason: '', batchNumber: '', expiryDate: '', supplier: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedProductForLabel, setSelectedProductForLabel] = useState(null);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Always fetch products so we have metadata (names, prices, GST, etc.) for both tabs
      const prodRes = await inventoryApi.getAllProducts();
      if (prodRes.success) {
        setProducts(prodRes.data);
      }
      
      if (activeTab === 'pending' && isManagerOrOwner) {
        const res = await inventoryApi.getPendingAdjustments();
        if (res.success) setPendingTransactions(res.data);
      } else if (activeTab === 'history') {
        const res = await inventoryApi.getTransactionHistory();
        if (res.success) setHistoryTransactions(res.data);
      }
    } catch (err) {
      toast.error(`Failed to load data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getPriceLabel = () => {
    if (productForm.productType === 'LOOSE') {
      const unit = productForm.unitType;
      if (unit === 'KG') return 'Price per KG (₹) *';
      if (unit === 'GRAM') return 'Price per Gram (₹) *';
      if (unit === 'LITRE') return 'Price per Litre (₹) *';
      if (unit === 'ML') return 'Price per ML (₹) *';
      if (unit === 'PIECE') return 'Price per Piece (₹) *';
      return 'Price per Unit (₹) *';
    }
    return 'Price (₹) *';
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const priceVal = productForm.pricePaise ? Math.round(parseFloat(productForm.pricePaise) * 100) : 0;
      const payload = {
        name: productForm.name,
        sku: productForm.sku,
        barcode: productForm.barcode || null,
        description: productForm.description || null,
        productType: productForm.productType,
        pricePaise: priceVal,
        costPaise: productForm.costPaise ? Math.round(parseFloat(productForm.costPaise) * 100) : 0,
        hsnCode: productForm.hsnCode || null,
        gstRate: productForm.gstRate ? parseFloat(productForm.gstRate) : null,
        gstInclusive: productForm.gstInclusive || false,
        stockQuantity: productForm.stockQuantity ? parseFloat(productForm.stockQuantity) : null,
        minimumLooseQuantity: productForm.minimumLooseQuantity ? parseFloat(productForm.minimumLooseQuantity) : null,
        unitType: productForm.productType === 'LOOSE' ? productForm.unitType : null,
        pricePerUnitPaise: productForm.productType === 'LOOSE' ? priceVal : null,
      };

      let res;
      if (isEditing) {
        res = await inventoryApi.updateProduct(editingProductId, payload);
        if (res.success) {
          if (approveTransactionAfterSave) {
            await inventoryApi.approveAdjustment(approveTransactionAfterSave, "Edited & approved by manager");
            toast.success('Product updated and transaction approved!');
            setApproveTransactionAfterSave(null);
          } else {
            toast.success('Product updated successfully!');
          }
          setShowModal(false);
          setIsEditing(false);
          setEditingProductId(null);
          fetchData();
        }
      } else {
        res = await inventoryApi.createProduct(payload);
        if (res.success) {
          if (!canDirectlyManageStock) {
            toast.info('Product submitted for approval.');
          } else {
            toast.success('Product created successfully!');
          }
          setShowModal(false);
          fetchData();
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStockSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        productId: stockForm.productId,
        variantId: stockForm.variantId || null,
        transactionType: 'ADJUSTMENT',
        quantityChange: stockForm.type === 'REMOVE' ? -parseFloat(stockForm.quantity) : parseFloat(stockForm.quantity),
        reason: stockForm.reason || null,
        batchNumber: stockForm.batchNumber || null,
        expiryDate: stockForm.expiryDate ? stockForm.expiryDate : null
      };

      const res = await inventoryApi.adjustStock(payload);
      if (res.success) {
        if (!canDirectlyManageStock) {
          toast.info("Stock adjustment submitted. Pending approval from manager.");
        } else {
          toast.success("Stock adjusted successfully!");
        }
        setShowModal(false);
        fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to adjust stock');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await inventoryApi.approveAdjustment(id, "Approved from dashboard");
      toast.success("Adjustment approved");
      fetchData();
    } catch (err) {
      toast.error("Failed to approve");
    }
  };

  const handleReject = async (id) => {
    try {
      await inventoryApi.rejectAdjustment(id, "Rejected from dashboard");
      toast.success("Adjustment rejected");
      fetchData();
    } catch (err) {
      toast.error("Failed to reject");
    }
  };

  const handleEditProduct = (p) => {
    setIsEditing(true);
    setEditingProductId(p.id);
    setApproveTransactionAfterSave(null);
    setProductForm({
      name: p.name,
      sku: p.sku,
      barcode: p.barcode || '',
      productType: p.productType,
      pricePaise: (p.pricePaise / 100).toString(),
      costPaise: p.costPaise ? (p.costPaise / 100).toString() : '',
      hsnCode: p.hsnCode || '',
      gstRate: p.gstRate !== null && p.gstRate !== undefined ? p.gstRate.toString() : '0',
      gstInclusive: p.gstInclusive || false,
      unitType: p.unitType || 'PIECE',
      pricePerUnitPaise: p.pricePerUnitPaise ? (p.pricePerUnitPaise / 100).toString() : '',
      stockQuantity: p.stockQuantity !== null && p.stockQuantity !== undefined ? p.stockQuantity.toString() : '0',
      minimumLooseQuantity: p.minimumLooseQuantity !== null && p.minimumLooseQuantity !== undefined ? p.minimumLooseQuantity.toString() : ''
    });
    setModalTab('new_product');
    setShowModal(true);
  };

  const handleEditAndApprove = (p, txId) => {
    setIsEditing(true);
    setEditingProductId(p.id);
    setApproveTransactionAfterSave(txId);
    setProductForm({
      name: p.name,
      sku: p.sku,
      barcode: p.barcode || '',
      productType: p.productType,
      pricePaise: (p.pricePaise / 100).toString(),
      costPaise: p.costPaise ? (p.costPaise / 100).toString() : '',
      hsnCode: p.hsnCode || '',
      gstRate: p.gstRate !== null && p.gstRate !== undefined ? p.gstRate.toString() : '0',
      gstInclusive: p.gstInclusive || false,
      unitType: p.unitType || 'PIECE',
      pricePerUnitPaise: p.pricePerUnitPaise ? (p.pricePerUnitPaise / 100).toString() : '',
      stockQuantity: p.stockQuantity !== null && p.stockQuantity !== undefined ? p.stockQuantity.toString() : '0',
      minimumLooseQuantity: p.minimumLooseQuantity !== null && p.minimumLooseQuantity !== undefined ? p.minimumLooseQuantity.toString() : ''
    });
    setModalTab('new_product');
    setShowModal(true);
  };

  const handleAddVariantClick = (p) => {
    setSelectedProductForVariant(p);
    setIsEditingVariant(false);
    setEditingVariantId(null);
    setVariantForm({
      name: '', sku: '', barcode: '', pricePaise: (p.pricePaise / 100).toString(),
      stockQuantity: '0', lowStockThreshold: '0'
    });
    setShowVariantModal(true);
  };

  const handleVariantSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        name: variantForm.name,
        sku: variantForm.sku,
        barcode: variantForm.barcode || null,
        pricePaise: Math.round(parseFloat(variantForm.pricePaise) * 100),
        stockQuantity: parseFloat(variantForm.stockQuantity || '0'),
        lowStockThreshold: parseFloat(variantForm.lowStockThreshold || '0')
      };

      let res;
      if (isEditingVariant) {
        res = await inventoryApi.updateProductVariant(editingVariantId, payload);
      } else {
        res = await inventoryApi.createProductVariant(selectedProductForVariant.id, payload);
      }

      if (res.success) {
        toast.success(isEditingVariant ? 'Variant updated successfully!' : 'Variant added successfully!');
        setShowVariantModal(false);
        setIsEditingVariant(false);
        setEditingVariantId(null);
        fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit variant');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditVariant = (v, p) => {
    setSelectedProductForVariant(p);
    setIsEditingVariant(true);
    setEditingVariantId(v.id);
    setVariantForm({
      name: v.name,
      sku: v.sku,
      barcode: v.barcode || '',
      pricePaise: (v.pricePaise / 100).toString(),
      stockQuantity: (v.stockQuantity || 0).toString(),
      lowStockThreshold: v.lowStockThreshold ? v.lowStockThreshold.toString() : '0'
    });
    setShowVariantModal(true);
  };

  const handleDeleteVariantClick = (v) => {
    setVariantToDelete(v);
    setShowDeleteVariantConfirm(true);
  };

  const handleDeleteVariantConfirm = async () => {
    if (!variantToDelete) return;
    try {
      const res = await inventoryApi.deleteProductVariant(variantToDelete.id);
      if (res.success) {
        toast.success(`Variant "${variantToDelete.name}" deleted successfully`);
        setShowDeleteVariantConfirm(false);
        setVariantToDelete(null);
        fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete variant');
    }
  };

  const handleDeleteClick = (p) => {
    setProductToDelete(p);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;
    try {
      const res = await inventoryApi.deleteProduct(productToDelete.id);
      if (res.success) {
        toast.success(`Product "${productToDelete.name}" deleted successfully`);
        setShowDeleteConfirm(false);
        setProductToDelete(null);
        fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete product');
    }
  };

  // Helper to find selected product's variants
  const selectedProduct = products.find(p => p.id === stockForm.productId);
  const variants = selectedProduct?.variants || [];

  return (
    <div className="p-5 lg:p-7 space-y-6 max-w-[1200px] mx-auto">
      {/* ─── Header row ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-manrope font-bold text-[24px] text-text-primary">Inventory Management</h2>
          <p className="font-inter text-[13px] text-text-muted mt-1">Manage your products, variants, and stock levels.</p>
        </div>
        {activeTab === 'products' && (
          <button
            onClick={() => {
              setIsEditing(false);
              setEditingProductId(null);
              setApproveTransactionAfterSave(null);
              setProductForm({
                name: '', sku: '', barcode: '', productType: 'PACKAGED',
                pricePaise: '', costPaise: '', hsnCode: '', gstRate: '0',
                gstInclusive: false, unitType: 'PIECE', pricePerUnitPaise: '',
                stockQuantity: '0', minimumLooseQuantity: ''
              });
              setModalTab('new_product');
              setShowModal(true);
            }}
            className="flex items-center gap-2 bg-accent hover:bg-accent-hover transition-all duration-200 text-white font-manrope font-semibold text-[14px] px-5 py-2.5 rounded-[8px] hover:-translate-y-[1px] hover:shadow-md hover:scale-[1.03] active:translate-y-0 active:scale-100 shadow-sm"
          >
            <Icon d="M4 6h16M4 12h16M4 18h16" size={16} />
            Actions
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 rounded-[10px] p-1 w-fit bg-card2 border border-theme">
        <button
          onClick={() => setActiveTab('products')}
          className={`font-manrope font-semibold text-[13px] px-4 py-2 rounded-[7px] transition-all ${activeTab === 'products' ? 'bg-surface text-text-primary shadow-sm' : 'text-text-muted hover:text-text-primary'}`}
        >
          Products & Variants
        </button>
        {isManagerOrOwner && (
          <button
            onClick={() => setActiveTab('pending')}
            className={`font-manrope font-semibold text-[13px] px-4 py-2 rounded-[7px] transition-all flex items-center gap-2 ${activeTab === 'pending' ? 'bg-surface text-text-primary shadow-sm' : 'text-text-muted hover:text-text-primary'}`}
          >
            Pending Approvals
            {pendingTransactions.length > 0 && activeTab !== 'pending' && (
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
            )}
          </button>
        )}
        <button
          onClick={() => setActiveTab('history')}
          className={`font-manrope font-semibold text-[13px] px-4 py-2 rounded-[7px] transition-all ${activeTab === 'history' ? 'bg-surface text-text-primary shadow-sm' : 'text-text-muted hover:text-text-primary'}`}
        >
          {isManagerOrOwner ? 'Approval History' : 'My Requests'}
        </button>
      </div>

      {/* ─── Product List Table ──────────────────────────────────────────────── */}
      {activeTab === 'products' && (
        <div className="bg-surface border border-theme rounded-[12px] overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-text-muted font-inter text-[13px]">Loading products...</div>
          ) : products.length === 0 ? (
            <div className="p-12 text-center">
              <span className="text-4xl mb-3 block opacity-30">📦</span>
              <p className="font-manrope font-semibold text-[14px] text-text-muted">No products found</p>
              <p className="font-inter text-[12px] text-text-muted mt-1">Add a product to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/[0.04]">
                    <th className="px-5 py-3 font-manrope font-semibold text-[11px] text-text-muted uppercase tracking-wider">Name / Variant</th>
                    <th className="px-5 py-3 font-manrope font-semibold text-[11px] text-text-muted uppercase tracking-wider">SKU</th>
                    <th className="px-5 py-3 font-manrope font-semibold text-[11px] text-text-muted uppercase tracking-wider">Type</th>
                    <th className="px-5 py-3 font-manrope font-semibold text-[11px] text-text-muted uppercase tracking-wider text-right">Price</th>
                    <th className="px-5 py-3 font-manrope font-semibold text-[11px] text-text-muted uppercase tracking-wider text-right">Cost Price</th>
                    <th className="px-5 py-3 font-manrope font-semibold text-[11px] text-text-muted uppercase tracking-wider text-center">GST</th>
                    <th className="px-5 py-3 font-manrope font-semibold text-[11px] text-text-muted uppercase tracking-wider text-center">Stock</th>
                    <th className="px-5 py-3 font-manrope font-semibold text-[11px] text-text-muted uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.filter(p => p.isActive).map((p, idx) => (
                    <React.Fragment key={p.id}>
                      <tr className={`border-b border-white/[0.03] hover:bg-card2 transition-colors ${idx % 2 === 0 ? '' : 'bg-white/[0.01]'}`}>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            {p.variants && p.variants.length > 0 && (
                              <button
                                type="button"
                                onClick={() => toggleProductExpand(p.id)}
                                className="text-text-muted hover:text-text-primary p-1 focus:outline-none transition-colors"
                              >
                                <span className={`inline-block transition-transform duration-200 ${expandedProducts[p.id] ? 'rotate-90' : ''}`} style={{ fontSize: '9px' }}>
                                  ▶
                                </span>
                              </button>
                            )}
                            <div>
                              <button
                                type="button"
                                onClick={() => handleViewProductDetails(p)}
                                className="font-manrope font-semibold text-[13px] text-text-primary hover:text-accent transition-all text-left focus:outline-none"
                              >
                                {p.name}
                              </button>
                              {(!p.variants || p.variants.length === 0) && p.barcode && (
                                <p className="font-inter text-[11px] text-text-muted mt-0.5">{p.barcode}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 font-inter text-[12.5px] font-bold text-text-primary">
                          {p.variants && p.variants.length > 0 ? '—' : p.sku}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center font-inter text-[10px] font-bold px-2 py-0.5 rounded-[4px] ${
                            p.productType === 'LOOSE' ? 'text-amber-400 bg-amber-400/10' : 'text-emerald-400 bg-emerald-400/10'
                          }`}>
                            {p.productType}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 font-manrope font-bold text-[13px] text-text-primary text-right">
                          {p.variants && p.variants.length > 0 ? '—' : `₹${(p.pricePaise / 100).toFixed(2)}`}
                        </td>
                        <td className="px-5 py-3.5 font-manrope text-[12.5px] text-text-muted text-right">
                          {p.variants && p.variants.length > 0 ? '—' : p.costPaise ? `₹${(p.costPaise / 100).toFixed(2)}` : '—'}
                        </td>
                        <td className="px-5 py-3.5 font-inter text-[11.5px] text-text-muted text-center">
                          {p.gstRate !== null && p.gstRate !== undefined ? `${p.gstRate}% (${p.gstInclusive ? 'Inc' : 'Exc'})` : '0% (Inc)'}
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <span className="font-inter text-[12.5px] text-text-secondary">
                            {p.variants && p.variants.length > 0 
                              ? p.variants.reduce((sum, v) => sum + (v.stockQuantity || 0), 0) + (p.stockQuantity || 0)
                              : p.stockQuantity !== null && p.stockQuantity !== undefined ? p.stockQuantity : 0}
                            {p.productType === 'LOOSE' && p.unitType ? ` ${p.unitType}` : ''}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right flex items-center justify-end gap-2">
                          {isManagerOrOwner && (
                            <button
                              onClick={() => handleEditProduct(p)}
                              className="w-[72px] text-center font-inter text-[11px] font-semibold border border-accent/20 hover:border-accent bg-accent/5 hover:bg-accent/10 text-accent py-1.5 rounded-[6px] transition-all duration-200 hover:-translate-y-[1px] hover:shadow-md hover:scale-[1.03] active:translate-y-0 active:scale-100"
                            >
                              Edit
                            </button>
                          )}
                          {isManagerOrOwner && p.productType !== 'LOOSE' && (
                            <button
                              onClick={() => handleAddVariantClick(p)}
                              className="w-[82px] text-center font-inter text-[11px] font-semibold border border-indigo-500/20 hover:border-indigo-500 bg-indigo-500/5 hover:bg-indigo-500/10 text-indigo-400 py-1.5 rounded-[6px] transition-all duration-200 hover:-translate-y-[1px] hover:shadow-md hover:scale-[1.03] active:translate-y-0 active:scale-100"
                            >
                              + Variant
                            </button>
                          )}
                          {isManagerOrOwner && p.productType === 'LOOSE' && (
                            <div className="w-[82px] flex-shrink-0" />
                          )}
                          {isManagerOrOwner && (
                            <button
                              onClick={() => handleDeleteClick(p)}
                              className="w-[72px] text-center font-inter text-[11px] font-semibold border border-red-500/20 hover:border-red-500 bg-red-500/5 hover:bg-red-500/10 text-red-400 py-1.5 rounded-[6px] transition-all duration-200 hover:-translate-y-[1px] hover:shadow-md hover:scale-[1.03] active:translate-y-0 active:scale-100"
                            >
                              Delete
                            </button>
                          )}
                        </td>
                      </tr>
                      {/* Render Collapsible Variants */}
                      {p.variants && p.variants.length > 0 && expandedProducts[p.id] && (
                        <>
                          {/* Base Variant Row representing Parent pricing/SKU */}
                          <tr className="border-b border-white/[0.02] bg-[rgba(0,0,0,0.02)]">
                            <td className="px-5 py-2 pl-10 flex items-center gap-2">
                              <span className="text-text-muted">↳</span>
                              <span className="font-manrope text-[12.5px] text-text-secondary">{p.sku || 'Base'} (Base)</span>
                            </td>
                            <td className="px-5 py-2 font-inter text-[12px] font-bold text-text-primary">{p.sku}</td>
                            <td className="px-5 py-2"></td>
                            <td className="px-5 py-2 font-manrope font-semibold text-[12.5px] text-text-secondary text-right">
                              ₹{(p.pricePaise / 100).toFixed(2)}
                            </td>
                            <td className="px-5 py-2 font-manrope text-[12.5px] text-text-muted text-right">
                              {p.costPaise ? `₹${(p.costPaise / 100).toFixed(2)}` : '—'}
                            </td>
                            <td className="px-5 py-2 font-inter text-[12.5px] text-text-muted text-center">—</td>
                            <td className="px-5 py-2 text-center font-inter text-[12.5px] text-text-secondary">
                              {p.stockQuantity !== null && p.stockQuantity !== undefined ? p.stockQuantity : 0}
                              {p.productType === 'LOOSE' && p.unitType ? ` ${p.unitType}` : ''}
                            </td>
                            <td className="px-5 py-2 text-right">
                              <span className="text-[10px] text-text-muted italic px-2">Base details</span>
                            </td>
                          </tr>
                          {/* Additional Variants */}
                          {p.variants.map(v => (
                            <tr key={v.id} className="border-b border-white/[0.02] bg-[rgba(0,0,0,0.02)]">
                              <td className="px-5 py-2 pl-10 flex items-center gap-2">
                                <span className="text-text-muted">↳</span>
                                <span className="font-manrope text-[12.5px] text-text-secondary">{v.name}</span>
                              </td>
                              <td className="px-5 py-2 font-inter text-[12px] font-bold text-text-primary">{v.sku}</td>
                              <td className="px-5 py-2"></td>
                              <td className="px-5 py-2 font-manrope font-semibold text-[12.5px] text-text-secondary text-right">
                                ₹{(v.pricePaise / 100).toFixed(2)}
                              </td>
                              <td className="px-5 py-2 font-manrope text-[12.5px] text-text-muted text-right">—</td>
                              <td className="px-5 py-2 font-inter text-[12.5px] text-text-muted text-center">—</td>
                              <td className="px-5 py-2 text-center font-inter text-[12.5px] text-text-secondary">
                                {v.stockQuantity !== null && v.stockQuantity !== undefined ? v.stockQuantity : 0}
                                {p.productType === 'LOOSE' && p.unitType ? ` ${p.unitType}` : ''}
                              </td>
                              <td className="px-5 py-2 text-right flex items-center justify-end gap-2">
                                {isManagerOrOwner && (
                                  <button
                                    onClick={() => handleEditVariant(v, p)}
                                    className="font-inter text-[10px] font-semibold border border-accent/20 hover:border-accent bg-accent/5 hover:bg-accent/10 text-accent px-2.5 py-1 rounded-[4px] transition-all duration-200 hover:-translate-y-[0.5px] hover:shadow-md hover:scale-[1.03] active:translate-y-0 active:scale-100"
                                  >
                                    Edit
                                  </button>
                                )}
                                {isManagerOrOwner && (
                                  <button
                                    onClick={() => handleDeleteVariantClick(v)}
                                    className="font-inter text-[10px] font-semibold border border-red-500/20 hover:border-red-500 bg-red-500/5 hover:bg-red-500/10 text-red-400 px-2.5 py-1 rounded-[4px] transition-all duration-200 hover:-translate-y-[0.5px] hover:shadow-md hover:scale-[1.03] active:translate-y-0 active:scale-100"
                                  >
                                    Delete
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── Pending Transactions Cards ──────────────────────────────────────── */}
      {activeTab === 'pending' && isManagerOrOwner && (
        <div className="bg-surface border border-theme rounded-[12px] overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-text-muted font-inter text-[13px]">Loading pending adjustments...</div>
          ) : pendingTransactions.length === 0 ? (
            <div className="p-12 text-center">
              <span className="text-4xl mb-3 block opacity-30">✔️</span>
              <p className="font-manrope font-semibold text-[14px] text-text-muted">All caught up</p>
              <p className="font-inter text-[12px] text-text-muted mt-1">No pending stock adjustments require your approval.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5">
              {pendingTransactions.map(tx => {
                const prod = products.find(p => p.id === tx.productId);
                const variant = prod?.variants?.find(v => v.id === tx.variantId);
                const isNewProduct = prod && !prod.isActive;
                return (
                  <div key={tx.id} className="bg-card2 border border-theme rounded-[14px] p-5 shadow-lg flex flex-col justify-between hover:border-accent/40 transition-colors">
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-text-muted font-inter">
                          {new Date(tx.createdAt).toLocaleString()}
                        </span>
                        <span className={`inline-flex items-center font-inter text-[10px] font-bold px-2 py-0.5 rounded-[4px] uppercase tracking-wider ${
                          isNewProduct 
                            ? 'text-violet-400 bg-violet-400/10' 
                            : tx.transactionType === 'ADD' || tx.transactionType === 'PURCHASE'
                              ? 'text-emerald-400 bg-emerald-400/10' 
                              : 'text-red-400 bg-red-400/10'
                        }`}>
                          {isNewProduct ? 'NEW PRODUCT PROPOSAL' : tx.transactionType + ' STOCK'}
                        </span>
                      </div>

                      {/* Product & Variant Name */}
                      <div>
                        <h4 className="font-manrope font-bold text-[16px] text-text-primary">
                          {prod?.name || tx.productName}
                        </h4>
                        {variant && (
                          <p className="font-manrope font-semibold text-[13px] text-accent mt-0.5">
                            Variant: {variant.name}
                          </p>
                        )}
                      </div>

                      {/* Qty Impact */}
                      <div className="flex items-center gap-3">
                        <span className="text-[12px] font-medium text-text-muted">Quantity:</span>
                        <span className={`font-manrope font-bold text-[18px] ${
                          isNewProduct || tx.transactionType === 'ADD' || tx.transactionType === 'PURCHASE'
                            ? 'text-emerald-400'
                            : 'text-red-400'
                        }`}>
                          {tx.quantityChange !== null ? (tx.quantityChange > 0 ? '+' : '') + tx.quantityChange : '—'}
                          {prod?.productType === 'LOOSE' && prod?.unitType ? ` ${prod.unitType}` : ''}
                        </span>
                      </div>

                      {/* Proposed / Existing Details */}
                      {prod && (
                        <div className="text-[12px] space-y-1.5 bg-surface/50 border border-theme rounded-[8px] p-3">
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-text-secondary">
                            <div>Price: <strong className="text-text-primary">₹{(variant ? variant.pricePaise / 100 : prod.pricePaise / 100).toFixed(2)}</strong></div>
                            <div>Cost Price: <strong className="text-text-primary">{prod.costPaise ? `₹${(prod.costPaise / 100).toFixed(2)}` : '—'}</strong></div>
                            <div>GST Rate: <strong className="text-text-primary">{prod.gstRate !== null && prod.gstRate !== undefined ? `${prod.gstRate}%` : '0%'}</strong></div>
                            <div>GST Mode: <strong className="text-text-primary">{prod.gstInclusive ? 'Inclusive' : 'Exclusive'}</strong></div>
                            
                            <div className="col-span-2 border-t border-white/[0.04] my-1 pt-1" />
                            
                            <div>SKU: <strong className="text-text-primary font-bold">{variant?.sku || prod.sku || '—'}</strong></div>
                            <div>Barcode: <strong className="text-text-primary font-semibold">{variant?.barcode || prod.barcode || '—'}</strong></div>
                            
                            {!isNewProduct && (
                              <>
                                <div className="col-span-2 border-t border-white/[0.04] my-1 pt-1" />
                                <div>Current Stock: <strong className="text-text-primary">{variant ? (variant.stockQuantity || 0) : (prod.stockQuantity || 0)}{prod.productType === 'LOOSE' && prod.unitType ? ` ${prod.unitType}` : ''}</strong></div>
                                <div>Impact: <strong className="text-accent font-bold">{variant ? (variant.stockQuantity || 0) : (prod.stockQuantity || 0)} → {Number(variant ? (variant.stockQuantity || 0) : (prod.stockQuantity || 0)) + Number(tx.quantityChange || 0)}{prod.productType === 'LOOSE' && prod.unitType ? ` ${prod.unitType}` : ''}</strong></div>
                              </>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Reason */}
                      {tx.reason && (
                        <div className="text-[12.5px] text-text-primary bg-surface/60 border border-theme px-3 py-2 rounded-[8px] flex items-start gap-1.5">
                          <span className="font-semibold text-text-secondary flex-shrink-0">Reason:</span>
                          <span className="font-medium">"{tx.reason}"</span>
                        </div>
                      )}
                    </div>

                    {/* Actions & Meta */}
                    <div className="mt-5 border-t border-theme pt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                      <div className="text-[11.5px] text-text-muted">
                        <div>Requested by: <strong>{tx.createdByUserName || 'Staff'}</strong></div>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button 
                          onClick={() => handleApprove(tx.id)} 
                          className="flex-1 sm:flex-initial min-w-[110px] text-center font-manrope font-semibold text-[13px] bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-[8px] transition-all duration-200 hover:-translate-y-[1px] hover:shadow-md hover:scale-[1.03] active:translate-y-0 active:scale-100 shadow-sm"
                        >
                          Approve
                        </button>
                        {isNewProduct && (
                          <button 
                            onClick={() => handleEditAndApprove(prod, tx.id)} 
                            className="flex-1 sm:flex-initial min-w-[110px] text-center font-manrope font-semibold text-[13px] bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-[8px] transition-all duration-200 hover:-translate-y-[1px] hover:shadow-md hover:scale-[1.03] active:translate-y-0 active:scale-100 shadow-sm"
                          >
                            Edit & Approve
                          </button>
                        )}
                        <button 
                          onClick={() => handleReject(tx.id)} 
                          className="flex-1 sm:flex-initial min-w-[110px] text-center font-manrope font-semibold text-[13px] bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-[8px] transition-all duration-200 hover:-translate-y-[1px] hover:shadow-md hover:scale-[1.03] active:translate-y-0 active:scale-100 shadow-sm"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── Request History / My Requests Tab ─────────────────────────────── */}
      {activeTab === 'history' && (
        <div className="bg-surface border border-theme rounded-[12px] overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-text-muted font-inter text-[13px]">Loading history...</div>
          ) : historyTransactions.length === 0 ? (
            <div className="p-12 text-center">
              <span className="text-4xl mb-3 block opacity-35">📜</span>
              <p className="font-manrope font-semibold text-[14px] text-text-muted">No request history</p>
              <p className="font-inter text-[12px] text-text-muted mt-1">Requests you create or manage will appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/[0.04]">
                    <th className="px-5 py-3 font-manrope font-semibold text-[11px] text-text-muted uppercase tracking-wider">Date / Time</th>
                    <th className="px-5 py-3 font-manrope font-semibold text-[11px] text-text-muted uppercase tracking-wider">Product / Variant</th>
                    <th className="px-5 py-3 font-manrope font-semibold text-[11px] text-text-muted uppercase tracking-wider">Type</th>
                    <th className="px-5 py-3 font-manrope font-semibold text-[11px] text-text-muted uppercase tracking-wider text-center">Change</th>
                    <th className="px-5 py-3 font-manrope font-semibold text-[11px] text-text-muted uppercase tracking-wider text-center">Status</th>
                    <th className="px-5 py-3 font-manrope font-semibold text-[11px] text-text-muted uppercase tracking-wider">Reason</th>
                    <th className="px-5 py-3 font-manrope font-semibold text-[11px] text-text-muted uppercase tracking-wider">Requested By</th>
                    <th className="px-5 py-3 font-manrope font-semibold text-[11px] text-text-muted uppercase tracking-wider">Approved/Rejected By</th>
                  </tr>
                </thead>
                <tbody>
                  {historyTransactions.map((tx, idx) => {
                    const prod = products.find(p => p.id === tx.productId);
                    const isNewProduct = prod && !prod.isActive;
                    return (
                      <tr key={tx.id} className={`border-b border-white/[0.03] hover:bg-card2 transition-colors ${idx % 2 === 0 ? '' : 'bg-white/[0.01]'}`}>
                        <td className="px-5 py-3.5 font-inter text-[12px] text-text-secondary whitespace-nowrap">
                          {new Date(tx.createdAt).toLocaleString('en-IN')}
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="font-manrope font-semibold text-[13px] text-text-primary">{tx.productName}</p>
                          {tx.variantName && <p className="font-inter text-[11px] text-accent mt-0.5">Variant: {tx.variantName}</p>}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center font-inter text-[10px] font-bold px-2 py-0.5 rounded-[4px] uppercase tracking-wider ${
                            isNewProduct 
                              ? 'text-violet-400 bg-violet-400/10' 
                              : tx.transactionType === 'ADD' || tx.transactionType === 'PURCHASE'
                                ? 'text-emerald-400 bg-emerald-400/10' 
                                : 'text-red-400 bg-red-400/10'
                          }`}>
                            {isNewProduct ? 'NEW PRODUCT' : tx.transactionType}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-center font-manrope font-bold text-[13.5px]">
                          <span className={tx.quantityChange > 0 ? 'text-emerald-400' : 'text-red-400'}>
                            {tx.quantityChange !== null ? (tx.quantityChange > 0 ? '+' : '') + tx.quantityChange : '—'}
                            {prod?.productType === 'LOOSE' && prod?.unitType ? ` ${prod.unitType}` : ''}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <span className={`inline-flex items-center font-inter text-[10.5px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                            tx.status === 'APPROVED' 
                              ? 'text-emerald-400 bg-emerald-400/10 border border-emerald-500/20' 
                              : tx.status === 'REJECTED' 
                                ? 'text-red-400 bg-red-400/10 border border-red-500/20' 
                                : 'text-amber-400 bg-amber-400/10 border border-amber-500/20'
                          }`}>
                            {tx.status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 font-inter text-[12.5px] text-text-secondary max-w-[200px] truncate" title={tx.reason || '—'}>
                          {tx.reason || '—'}
                        </td>
                        <td className="px-5 py-3.5 font-manrope text-[12.5px] text-text-secondary">
                          {tx.createdByUserName || 'Staff'}
                        </td>
                        <td className="px-5 py-3.5 font-manrope text-[12.5px] text-text-secondary">
                          {tx.approvedByUserName || '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}




      {/* Camera Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={showScannerModal}
        onClose={() => setShowScannerModal(false)}
        onScanSuccess={(code) => {
          setProductForm(prev => ({ ...prev, barcode: code }));
          setShowScannerModal(false);
          toast.success(`Scanned barcode: ${code}`);
        }}
      />

      {/* ─── Add/Adjust Stock Modal ────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-2xl rounded-[16px] flex flex-col overflow-hidden shadow-2xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            
            {/* Header */}
            <div className="px-6 py-4 border-b flex justify-between items-center" style={{ borderColor: 'var(--border)' }}>
              <h3 className="font-manrope font-bold text-[18px] text-text-primary">
                {isEditing ? (approveTransactionAfterSave ? 'Edit & Approve Product' : 'Edit Product') : 'Inventory Action'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-text-muted hover:text-text-primary">
                <Icon d="M6 18L18 6M6 6l12 12" size={20} />
              </button>
            </div>

            {/* Modal Tabs */}
            {!isEditing && (
              <div className="px-6 pt-4 flex gap-4 border-b" style={{ borderColor: 'var(--border)' }}>
                <button 
                  onClick={() => setModalTab('new_product')}
                  className={`pb-3 font-manrope font-semibold text-[14px] border-b-2 transition-colors ${modalTab === 'new_product' ? 'border-accent text-accent' : 'border-transparent text-text-muted hover:text-text-primary'}`}
                >
                  Add Product
                </button>
                <button 
                  onClick={() => setModalTab('adjust')}
                  className={`pb-3 font-manrope font-semibold text-[14px] border-b-2 transition-colors ${modalTab === 'adjust' ? 'border-accent text-accent' : 'border-transparent text-text-muted hover:text-text-primary'}`}
                >
                  Adjust Stock / Add Batches
                </button>
              </div>
            )}

            <div className="flex-1 flex flex-col overflow-hidden">
              {modalTab === 'new_product' ? (
                <form onSubmit={handleProductSubmit} className="flex flex-col h-full overflow-hidden">
                  <div className="p-6 overflow-y-auto max-h-[60vh] space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-inter text-[11.5px] text-text-muted mb-1.5">Product Name *</label>
                        <input required type="text" value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} className="w-full bg-card2 border border-theme rounded-[8px] px-3 py-2 text-[13px] text-text-primary outline-none focus:border-accent" />
                      </div>
                      <div>
                        <label className="block font-inter text-[11.5px] text-text-muted mb-1.5">SKU *</label>
                        <input required type="text" value={productForm.sku} onChange={e => setProductForm({...productForm, sku: e.target.value})} className="w-full bg-card2 border border-theme rounded-[8px] px-3 py-2 text-[13px] text-text-primary outline-none focus:border-accent" />
                      </div>
                      <div>
                        <label className="block font-inter text-[11.5px] text-text-muted mb-1.5">Barcode (Optional)</label>
                        <div className="relative flex items-center">
                          <input 
                            type="text" 
                            value={productForm.barcode} 
                            onChange={e => setProductForm({...productForm, barcode: e.target.value})} 
                            className="w-full bg-card2 border border-theme rounded-[8px] pl-3 pr-10 py-2 text-[13px] text-text-primary outline-none focus:border-accent" 
                          />
                          <button
                            type="button"
                            onClick={() => setShowScannerModal(true)}
                            className="absolute right-2 text-text-muted hover:text-accent transition-colors p-1"
                            title="Scan barcode with camera"
                          >
                            <Icon d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" size={16} />
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block font-inter text-[11.5px] text-text-muted mb-1.5">Product Type</label>
                        <select 
                          value={productForm.productType} 
                          onChange={e => {
                            const newType = e.target.value;
                            setProductForm({
                              ...productForm, 
                              productType: newType,
                              // Set default unitType when switching to LOOSE, clear it for PACKAGED
                              unitType: newType === 'LOOSE' ? 'PIECE' : null
                            });
                          }} 
                          className="w-full bg-card2 border border-theme rounded-[8px] px-3 py-2 text-[13px] text-text-primary outline-none focus:border-accent"
                        >
                          <option value="PACKAGED">Packaged</option>
                          <option value="LOOSE">Loose / Variable Weight</option>
                          <option value="HYBRID">Hybrid</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-inter text-[11.5px] text-text-muted mb-1.5">{getPriceLabel()}</label>
                        <input required type="number" step="0.01" value={productForm.pricePaise} onChange={e => setProductForm({...productForm, pricePaise: e.target.value})} className="w-full bg-card2 border border-theme rounded-[8px] px-3 py-2 text-[13px] text-text-primary outline-none focus:border-accent" />
                      </div>
                      <div>
                        <label className="block font-inter text-[11.5px] text-text-muted mb-1.5">Cost Price (₹) (Optional)</label>
                        <input type="number" step="0.01" value={productForm.costPaise} onChange={e => setProductForm({...productForm, costPaise: e.target.value})} className="w-full bg-card2 border border-theme rounded-[8px] px-3 py-2 text-[13px] text-text-primary outline-none focus:border-accent" />
                      </div>
                      <div>
                        <label className="block font-inter text-[11.5px] text-text-muted mb-1.5">Initial Stock Quantity (Optional)</label>
                        <input type="number" step="0.01" value={productForm.stockQuantity} onChange={e => setProductForm({...productForm, stockQuantity: e.target.value})} className="w-full bg-card2 border border-theme rounded-[8px] px-3 py-2 text-[13px] text-text-primary outline-none focus:border-accent" placeholder="e.g. 100" />
                      </div>
                      <div>
                        <label className="block font-inter text-[11.5px] text-text-muted mb-1.5">HSN Code (Optional)</label>
                        <input type="text" value={productForm.hsnCode} onChange={e => setProductForm({...productForm, hsnCode: e.target.value})} className="w-full bg-card2 border border-theme rounded-[8px] px-3 py-2 text-[13px] text-text-primary outline-none focus:border-accent" />
                      </div>
                      <div>
                        <label className="block font-inter text-[11.5px] text-text-muted mb-1.5">GST Rate (%) *</label>
                        <input required type="number" step="0.1" min="0" value={productForm.gstRate} onChange={e => setProductForm({...productForm, gstRate: e.target.value})} disabled={productForm.gstInclusive} className="w-full bg-card2 border border-theme rounded-[8px] px-3 py-2 text-[13px] text-text-primary outline-none focus:border-accent disabled:opacity-50" placeholder="e.g. 0" />
                      </div>
                      <div className="flex items-center mt-6">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input type="checkbox" checked={productForm.gstInclusive} onChange={e => {
                            const checked = e.target.checked;
                            setProductForm({
                              ...productForm,
                              gstInclusive: checked,
                              gstRate: checked ? '0' : productForm.gstRate
                            });
                          }} className="rounded bg-card2 border-theme text-accent focus:ring-accent w-4 h-4" />
                          <span className="font-inter text-[12px] text-text-primary">GST Price is Inclusive</span>
                        </label>
                      </div>
                    </div>

                    {productForm.productType === 'LOOSE' && (
                      <div className="bg-accent/5 border border-accent/20 rounded-[10px] p-4 space-y-4 mt-2">
                        <h4 className="font-manrope font-semibold text-[13px] text-accent">Loose Product Settings</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block font-inter text-[11.5px] text-text-muted mb-1.5">Unit Type *</label>
                            <select value={productForm.unitType} onChange={e => setProductForm({...productForm, unitType: e.target.value})} className="w-full bg-surface border border-theme rounded-[8px] px-3 py-2 text-[13px] text-text-primary outline-none focus:border-accent">
                              <option value="PIECE">Piece</option>
                              <option value="KG">Kilogram (KG)</option>
                              <option value="GRAM">Gram (G)</option>
                              <option value="LITRE">Litre (L)</option>
                              <option value="ML">Millilitre (ML)</option>
                            </select>
                          </div>
                          <div>
                            <label className="block font-inter text-[11.5px] text-text-muted mb-1.5">Min Loose Qty (Optional)</label>
                            <input type="number" step="0.001" value={productForm.minimumLooseQuantity} onChange={e => setProductForm({...productForm, minimumLooseQuantity: e.target.value})} className="w-full bg-surface border border-theme rounded-[8px] px-3 py-2 text-[13px] text-text-primary outline-none focus:border-accent" placeholder="e.g. 0.05" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  {/* Fixed Footer */}
                  <div className="px-6 py-4 border-t flex justify-end gap-3 bg-card2/30" style={{ borderColor: 'var(--border)' }}>
                    <button type="button" onClick={() => setShowModal(false)} className="bg-card2 border border-theme hover:bg-theme/50 transition-all font-manrope font-semibold text-[13px] px-5 py-2.5 rounded-[8px] hover:-translate-y-[1px] active:translate-y-0 shadow-sm">
                      Cancel
                    </button>
                    <button disabled={isSubmitting} type="submit" className="bg-accent hover:bg-accent-hover transition-all text-white font-manrope font-semibold text-[13px] px-6 py-2.5 rounded-[8px] hover:-translate-y-[1px] active:translate-y-0 shadow-sm">
                      {isSubmitting ? (isEditing ? 'Saving...' : 'Adding...') : (isEditing ? 'Save Changes' : 'Add Product')}
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleStockSubmit} className="flex flex-col h-full overflow-hidden">
                  <div className="p-6 overflow-y-auto max-h-[60vh] space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-inter text-[12px] font-medium text-text-secondary mb-1.5">Select Product *</label>
                        <select required value={stockForm.productId} onChange={e => setStockForm({...stockForm, productId: e.target.value, variantId: ''})} className="w-full bg-card2 border border-theme rounded-[8px] px-3 py-2.5 text-[13.5px] text-text-primary outline-none focus:border-accent">
                          <option value="">-- Choose Product --</option>
                          {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block font-inter text-[12px] font-medium text-text-secondary mb-1.5">
                          Select Variant {variants.length > 0 && '*'}
                        </label>
                        <select 
                          required={variants.length > 0} 
                          value={stockForm.variantId} 
                          onChange={e => setStockForm({...stockForm, variantId: e.target.value})} 
                          disabled={!stockForm.productId || variants.length === 0} 
                          className="w-full bg-card2 border border-theme rounded-[8px] px-3 py-2.5 text-[13.5px] text-text-primary outline-none focus:border-accent disabled:opacity-50"
                        >
                          <option value="">
                            {!stockForm.productId 
                              ? '-- Choose Variant --' 
                              : variants.length === 0 
                                ? '-- No variants available --' 
                                : '-- Choose Variant --'}
                          </option>
                          {variants.map(v => <option key={v.id} value={v.id}>{v.name} ({v.sku})</option>)}
                        </select>
                      </div>

                      <div>
                        <label className="block font-inter text-[12px] font-medium text-text-secondary mb-1.5">Action *</label>
                        <div className="flex gap-2">
                          <label className={`flex-1 flex items-center justify-center py-2 rounded-[8px] cursor-pointer border transition-colors ${stockForm.type === 'ADD' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-card2 border-transparent text-text-muted hover:text-text-primary'}`}>
                            <input type="radio" name="type" value="ADD" className="hidden" checked={stockForm.type === 'ADD'} onChange={() => setStockForm({...stockForm, type: 'ADD'})} />
                            <span className="font-manrope font-semibold text-[13px]">Add Stock</span>
                          </label>
                          <label className={`flex-1 flex items-center justify-center py-2 rounded-[8px] cursor-pointer border transition-colors ${stockForm.type === 'REMOVE' ? 'bg-red-500/20 border-red-500 text-red-400' : 'bg-card2 border-transparent text-text-muted hover:text-text-primary'}`}>
                            <input type="radio" name="type" value="REMOVE" className="hidden" checked={stockForm.type === 'REMOVE'} onChange={() => setStockForm({...stockForm, type: 'REMOVE'})} />
                            <span className="font-manrope font-semibold text-[13px]">Remove Stock</span>
                          </label>
                        </div>
                      </div>

                      <div>
                        <label className="block font-inter text-[12px] font-medium text-text-secondary mb-1.5">Quantity *</label>
                        <input required type="number" step="0.01" min="0.01" value={stockForm.quantity} onChange={e => setStockForm({...stockForm, quantity: e.target.value})} className="w-full bg-card2 border border-theme rounded-[8px] px-3 py-2.5 text-[13.5px] text-text-primary outline-none focus:border-accent" placeholder="e.g. 50" />
                      </div>
                    </div>

                    <div className="bg-accent/5 border border-accent/20 rounded-[10px] p-4 space-y-4">
                      <div className="flex items-start gap-3">
                        <Icon d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" size={20} className="text-accent flex-shrink-0" />
                        <p className="font-inter text-[12.5px] text-text-secondary leading-relaxed">
                          <strong className="text-accent font-semibold">Tip:</strong> Adding an expiry date helps the system automatically send you and your managers timely alerts before the stock goes bad!
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        <div>
                          <label className="block font-inter text-[12px] font-medium text-text-secondary mb-1.5">Expiry Date (Optional)</label>
                          <input type="date" value={stockForm.expiryDate} onChange={e => setStockForm({...stockForm, expiryDate: e.target.value})} className="w-full bg-surface border border-theme rounded-[8px] px-3 py-2 text-[13.5px] text-text-primary outline-none focus:border-accent" />
                        </div>
                        <div>
                          <label className="block font-inter text-[12px] font-medium text-text-secondary mb-1.5">Batch Number (Optional)</label>
                          <input type="text" value={stockForm.batchNumber} onChange={e => setStockForm({...stockForm, batchNumber: e.target.value})} className="w-full bg-surface border border-theme rounded-[8px] px-3 py-2 text-[13.5px] text-text-primary outline-none focus:border-accent" placeholder="e.g. BATCH-001" />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block font-inter text-[12px] font-medium text-text-secondary mb-1.5">Reason for Adjustment</label>
                        <input type="text" value={stockForm.reason} onChange={e => setStockForm({...stockForm, reason: e.target.value})} className="w-full bg-card2 border border-theme rounded-[8px] px-3 py-2.5 text-[13.5px] text-text-primary outline-none focus:border-accent" placeholder="e.g. New delivery arrived, Expired items, etc." />
                      </div>
                    </div>
                  </div>
                  {/* Fixed Footer */}
                  <div className="px-6 py-4 border-t flex justify-end gap-3 bg-card2/30" style={{ borderColor: 'var(--border)' }}>
                    <button type="button" onClick={() => setShowModal(false)} className="bg-card2 border border-theme hover:bg-theme/50 transition-all font-manrope font-semibold text-[13px] px-5 py-2.5 rounded-[8px] hover:-translate-y-[1px] active:translate-y-0 shadow-sm">
                      Cancel
                    </button>
                    <button disabled={isSubmitting} type="submit" className="bg-accent hover:bg-accent-hover transition-all text-white font-manrope font-semibold text-[13px] px-6 py-2.5 rounded-[8px] hover:-translate-y-[1px] active:translate-y-0 shadow-sm">
                      {isSubmitting ? 'Submitting...' : canDirectlyManageStock ? 'Update Stock Instantly' : 'Submit'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Variant Modal */}
      {showVariantModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-lg rounded-[16px] flex flex-col overflow-hidden shadow-2xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            
            {/* Header */}
            <div className="px-6 py-4 border-b flex justify-between items-center" style={{ borderColor: 'var(--border)' }}>
              <div>
                <h3 className="font-manrope font-bold text-[18px] text-text-primary">
                  {isEditingVariant ? 'Edit Product Variant' : 'Add Product Variant'}
                </h3>
                <p className="text-[12px] text-text-muted mt-0.5">Product: {selectedProductForVariant?.name}</p>
              </div>
              <button onClick={() => setShowVariantModal(false)} className="text-text-muted hover:text-text-primary">
                <Icon d="M6 18L18 6M6 6l12 12" size={20} />
              </button>
            </div>

            <form onSubmit={handleVariantSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block font-inter text-[11.5px] text-text-muted mb-1.5">Variant Name * (e.g. Size, Color, Volume)</label>
                  <input required type="text" value={variantForm.name} onChange={e => setVariantForm({...variantForm, name: e.target.value})} className="w-full bg-card2 border border-theme rounded-[8px] px-3 py-2 text-[13px] text-text-primary outline-none focus:border-accent" placeholder="e.g. Large, 500ml" />
                </div>
                <div>
                  <label className="block font-inter text-[11.5px] text-text-muted mb-1.5">SKU *</label>
                  <input required type="text" value={variantForm.sku} onChange={e => setVariantForm({...variantForm, sku: e.target.value})} className="w-full bg-card2 border border-theme rounded-[8px] px-3 py-2 text-[13px] text-text-primary outline-none focus:border-accent" />
                </div>
                <div>
                  <label className="block font-inter text-[11.5px] text-text-muted mb-1.5">Barcode (Optional)</label>
                  <input type="text" value={variantForm.barcode} onChange={e => setVariantForm({...variantForm, barcode: e.target.value})} className="w-full bg-card2 border border-theme rounded-[8px] px-3 py-2 text-[13px] text-text-primary outline-none focus:border-accent" />
                </div>
                <div>
                  <label className="block font-inter text-[11.5px] text-text-muted mb-1.5">Price (₹) *</label>
                  <input required type="number" step="0.01" value={variantForm.pricePaise} onChange={e => setVariantForm({...variantForm, pricePaise: e.target.value})} className="w-full bg-card2 border border-theme rounded-[8px] px-3 py-2 text-[13px] text-text-primary outline-none focus:border-accent" />
                </div>
                <div>
                  <label className="block font-inter text-[11.5px] text-text-muted mb-1.5">Initial Stock Quantity</label>
                  <input type="number" step="0.01" value={variantForm.stockQuantity} onChange={e => setVariantForm({...variantForm, stockQuantity: e.target.value})} className="w-full bg-card2 border border-theme rounded-[8px] px-3 py-2 text-[13px] text-text-primary outline-none focus:border-accent" />
                </div>
                <div className="md:col-span-2">
                  <label className="block font-inter text-[11.5px] text-text-muted mb-1.5">Low Stock Threshold</label>
                  <input type="number" step="0.01" value={variantForm.lowStockThreshold} onChange={e => setVariantForm({...variantForm, lowStockThreshold: e.target.value})} className="w-full bg-card2 border border-theme rounded-[8px] px-3 py-2 text-[13px] text-text-primary outline-none focus:border-accent" />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setShowVariantModal(false)} className="bg-card2 border border-theme hover:bg-theme/50 transition-colors text-text-primary font-manrope font-semibold text-[13px] px-5 py-2.5 rounded-[8px]">
                  Cancel
                </button>
                <button disabled={isSubmitting} type="submit" className="bg-accent hover:bg-accent-hover transition-colors text-white font-manrope font-semibold text-[13px] px-5 py-2.5 rounded-[8px]">
                  {isSubmitting ? (isEditingVariant ? 'Saving...' : 'Adding...') : (isEditingVariant ? 'Save Changes' : 'Add Variant')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-[16px] overflow-hidden shadow-2xl border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div className="px-6 py-5 border-b" style={{ borderColor: 'var(--border)' }}>
              <h3 className="font-manrope font-bold text-[18px] text-text-primary">Delete Product</h3>
              <p className="font-inter text-[13px] text-text-muted mt-2">
                Are you sure you want to delete <strong className="text-text-primary">"{productToDelete?.name}"</strong>? This will deactivate the product and remove it from active inventory.
              </p>
            </div>
            <div className="px-6 py-4 flex gap-3 bg-card2/50">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setProductToDelete(null);
                }}
                className="flex-1 bg-card2 hover:bg-white/10 text-text-primary border border-theme font-manrope font-semibold text-[13px] py-2.5 rounded-[8px] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-manrope font-semibold text-[13px] py-2.5 rounded-[8px] transition-colors flex items-center justify-center gap-2 shadow-md shadow-red-600/10"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Delete Variant Confirmation Modal */}
      {showDeleteVariantConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-[16px] overflow-hidden shadow-2xl border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div className="px-6 py-5 border-b" style={{ borderColor: 'var(--border)' }}>
              <h3 className="font-manrope font-bold text-[18px] text-text-primary">Delete Variant</h3>
              <p className="font-inter text-[13px] text-text-muted mt-2">
                Are you sure you want to delete variant <strong className="text-text-primary">"{variantToDelete?.name}"</strong>? This will deactivate the variant and remove it from active inventory.
              </p>
            </div>
            <div className="px-6 py-4 flex gap-3 bg-card2/50">
              <button
                onClick={() => {
                  setShowDeleteVariantConfirm(false);
                  setVariantToDelete(null);
                }}
                className="flex-1 bg-card2 hover:bg-white/10 text-text-primary border border-theme font-manrope font-semibold text-[13px] py-2.5 rounded-[8px] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteVariantConfirm}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-manrope font-semibold text-[13px] py-2.5 rounded-[8px] transition-colors flex items-center justify-center gap-2 shadow-md shadow-red-600/10"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Read-Only Product Details & Margin Modal */}
      {showProductDetailsModal && selectedProductForDetails && (() => {
        const p = selectedProductForDetails;
        
        // Calculate parent margin
        let parentMargin = null;
        if (p.pricePaise && p.pricePaise > 0 && p.costPaise !== null && p.costPaise !== undefined) {
          parentMargin = ((p.pricePaise - p.costPaise) / p.pricePaise) * 100;
        }

        const getMarginColor = (margin) => {
          if (margin === null) return 'var(--text-muted)';
          if (margin >= 50) return '#10b981'; // Emerald
          if (margin >= 20) return 'var(--accent)'; // Purple/Indigo
          if (margin >= 0) return '#f59e0b'; // Amber
          return '#ef4444'; // Red
        };

        const formatMargin = (margin) => {
          if (margin === null) return '—';
          return `${margin.toFixed(1)}%`;
        };

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="w-full max-w-2xl bg-surface border border-theme rounded-[16px] flex flex-col overflow-hidden shadow-2xl" style={{ maxHeight: '90vh' }}>
              {/* Header */}
              <div className="px-6 py-4 border-b border-theme flex justify-between items-center bg-card2/10">
                <div>
                  <h3 className="font-manrope font-bold text-[18px] text-text-primary">Product Specifications</h3>
                  <p className="text-[12px] text-text-muted mt-0.5">Detailed specifications and margins</p>
                </div>
                <button
                  onClick={() => {
                    setShowProductDetailsModal(false);
                    setSelectedProductForDetails(null);
                  }}
                  className="text-text-muted hover:text-text-primary p-1.5 rounded-full hover:bg-card2 transition-all hover:scale-105"
                >
                  <Icon d="M6 18L18 6M6 6l12 12" size={20} />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1 text-[13px]">
                
                {/* Visual margin header */}
                <div className="bg-card2 border border-theme rounded-[12px] p-5 flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <h4 className="font-manrope font-bold text-[14px] text-text-primary">Estimated Gross Margin</h4>
                    <p className="text-[11.5px] text-text-muted mt-1">
                      {parentMargin !== null 
                        ? "Calculated as: ((Price - Cost Price) / Price) × 100"
                        : "Requires both Selling Price and Cost Price to calculate margin."}
                    </p>
                    
                    {/* Progress Bar */}
                    <div className="w-full bg-surface h-2.5 rounded-full mt-3.5 overflow-hidden border border-theme">
                      <div 
                        className="h-full rounded-full transition-all duration-500" 
                        style={{ 
                          width: `${parentMargin !== null ? Math.max(0, Math.min(100, parentMargin)) : 0}%`, 
                          backgroundColor: getMarginColor(parentMargin)
                        }} 
                      />
                    </div>
                  </div>
                  <div className="flex flex-col items-center justify-center px-4 py-2.5 rounded-[10px] bg-surface border border-theme min-w-[90px]">
                    <span className="font-manrope font-extrabold text-[22px] tracking-tight leading-none" style={{ color: getMarginColor(parentMargin) }}>
                      {formatMargin(parentMargin)}
                    </span>
                    <span className="text-[10px] text-text-muted mt-1.5 uppercase font-semibold">Margin</span>
                  </div>
                </div>

                {/* Grid details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                  <div className="space-y-3.5">
                    <h5 className="font-manrope font-bold text-[12px] text-accent uppercase tracking-wider">General Information</h5>
                    
                    <div className="space-y-2 border-l border-theme pl-3">
                      <div>
                        <span className="text-text-muted block text-[11px]">Product Name</span>
                        <strong className="text-text-primary font-manrope font-semibold text-[13.5px]">{p.name}</strong>
                      </div>
                      <div>
                        <span className="text-text-muted block text-[11px]">SKU</span>
                        <strong className="text-text-primary font-inter font-bold">{p.sku || '—'}</strong>
                      </div>
                      <div>
                        <span className="text-text-muted block text-[11px]">Barcode</span>
                        <strong className="text-text-primary font-inter font-semibold">{p.barcode || '—'}</strong>
                      </div>
                      <div>
                        <span className="text-text-muted block text-[11px]">Type / Unit</span>
                        <strong className="text-text-primary">
                          {p.productType} {p.unitType ? `(${p.unitType})` : ''}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3.5">
                    <h5 className="font-manrope font-bold text-[12px] text-accent uppercase tracking-wider">Pricing & Taxes</h5>
                    
                    <div className="space-y-2 border-l border-theme pl-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-text-muted block text-[11px]">Selling Price</span>
                          <strong className="text-text-primary font-manrope font-bold text-[14px]">₹{((p.pricePaise || 0) / 100).toFixed(2)}</strong>
                        </div>
                        <div>
                          <span className="text-text-muted block text-[11px]">Cost Price</span>
                          <strong className="text-text-primary font-manrope font-semibold text-[14px]">
                            {p.costPaise ? `₹${(p.costPaise / 100).toFixed(2)}` : '—'}
                          </strong>
                        </div>
                      </div>
                      <div>
                        <span className="text-text-muted block text-[11px]">GST Rate & Tax Mode</span>
                        <strong className="text-text-primary">
                          {p.gstRate !== null && p.gstRate !== undefined ? `${p.gstRate}%` : '0%'} 
                          <span className="text-text-muted font-normal"> ({p.gstInclusive ? 'Inclusive' : 'Exclusive'})</span>
                        </strong>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-text-muted block text-[11px]">Total Stock</span>
                          <strong className="text-text-primary">
                            {p.variants && p.variants.length > 0 
                              ? p.variants.reduce((sum, v) => sum + (v.stockQuantity || 0), 0) + (p.stockQuantity || 0)
                              : p.stockQuantity !== null && p.stockQuantity !== undefined ? p.stockQuantity : 0}
                          </strong>
                        </div>
                        <div>
                          <span className="text-text-muted block text-[11px]">HSN Code</span>
                          <strong className="text-text-primary">{p.hsnCode || '—'}</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description if available */}
                {p.description && (
                  <div className="space-y-2">
                    <h5 className="font-manrope font-bold text-[12px] text-accent uppercase tracking-wider">Description</h5>
                    <p className="bg-card2 border border-theme p-3 rounded-[8px] text-text-secondary leading-relaxed font-inter">{p.description}</p>
                  </div>
                )}

                {/* Variants Spec table if product has variants */}
                {p.variants && p.variants.length > 0 && (
                  <div className="space-y-3">
                    <h5 className="font-manrope font-bold text-[12px] text-accent uppercase tracking-wider">Variants Spec & Margin</h5>
                    
                    <div className="border border-theme rounded-[8px] overflow-hidden bg-card2/20">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-theme bg-card2/40 text-[10.5px] uppercase tracking-wider text-text-muted">
                            <th className="px-4 py-2 font-manrope font-semibold">Variant Name</th>
                            <th className="px-4 py-2 font-manrope font-semibold">SKU</th>
                            <th className="px-4 py-2 font-manrope font-semibold text-right">Price</th>
                            <th className="px-4 py-2 font-manrope font-semibold text-center">Stock</th>
                            <th className="px-4 py-2 font-manrope font-semibold text-right">Margin %</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-theme">
                          {/* Base Variant Row first */}
                          <tr className="hover:bg-card2/35">
                            <td className="px-4 py-2 font-medium text-text-primary">Base Product Details</td>
                            <td className="px-4 py-2 font-inter text-[12px] font-semibold text-text-secondary">{p.sku}</td>
                            <td className="px-4 py-2 font-manrope font-semibold text-text-secondary text-right">₹{((p.pricePaise || 0) / 100).toFixed(2)}</td>
                            <td className="px-4 py-2 text-center text-text-secondary font-inter">{p.stockQuantity || 0}</td>
                            <td className="px-4 py-2 text-right font-manrope font-bold" style={{ color: getMarginColor(parentMargin) }}>
                              {formatMargin(parentMargin)}
                            </td>
                          </tr>
                          
                          {/* Other Variants */}
                          {p.variants.map(v => {
                            let varMargin = null;
                            if (v.pricePaise && v.pricePaise > 0 && p.costPaise !== null && p.costPaise !== undefined) {
                              varMargin = ((v.pricePaise - p.costPaise) / v.pricePaise) * 100;
                            }
                            return (
                              <tr key={v.id} className="hover:bg-card2/35">
                                <td className="px-4 py-2 font-medium text-text-primary">{v.name}</td>
                                <td className="px-4 py-2 font-inter text-[12px] font-semibold text-text-secondary">{v.sku}</td>
                                <td className="px-4 py-2 font-manrope font-semibold text-text-secondary text-right">₹{((v.pricePaise || 0) / 100).toFixed(2)}</td>
                                <td className="px-4 py-2 text-center text-text-secondary font-inter">{v.stockQuantity || 0}</td>
                                <td className="px-4 py-2 text-right font-manrope font-bold" style={{ color: getMarginColor(varMargin) }}>
                                  {formatMargin(varMargin)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-theme flex justify-end bg-card2/30">
                <button
                  onClick={() => {
                    setShowProductDetailsModal(false);
                    setSelectedProductForDetails(null);
                  }}
                  className="bg-accent hover:bg-accent-hover text-white font-manrope font-semibold text-[13px] px-6 py-2.5 rounded-[8px] transition-all hover:-translate-y-[1px] active:translate-y-0 shadow-sm"
                >
                  Close Spec details
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default Inventory;
