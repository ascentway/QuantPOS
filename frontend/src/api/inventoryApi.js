import axiosInstance from './axiosInstance';

export const inventoryApi = {
    createProduct: async (productData) => {
        const response = await axiosInstance.post('/api/inventory/products', productData);
        return response.data;
    },
    
    getAllProducts: async () => {
        const response = await axiosInstance.get('/api/inventory/products');
        return response.data;
    },

    lookupBarcode: async (barcode) => {
        const response = await axiosInstance.get(`/api/inventory/barcode/${barcode}`);
        return response.data;
    },

    createProductVariant: async (productId, variantData) => {
        const response = await axiosInstance.post(`/api/inventory/products/${productId}/variants`, variantData);
        return response.data;
    },

    adjustStock: async (adjustmentData) => {
        const response = await axiosInstance.post('/api/inventory/stock/adjust', adjustmentData);
        return response.data;
    },

    getPendingAdjustments: async () => {
        const response = await axiosInstance.get('/api/inventory/transactions/pending');
        return response.data;
    },

    approveAdjustment: async (transactionId, notes) => {
        const response = await axiosInstance.post(`/api/inventory/transactions/${transactionId}/approve`, { notes });
        return response.data;
    },

    rejectAdjustment: async (transactionId, notes) => {
        const response = await axiosInstance.post(`/api/inventory/transactions/${transactionId}/reject`, { notes });
        return response.data;
    },

    updateProduct: async (productId, productData) => {
        const response = await axiosInstance.put(`/api/inventory/products/${productId}`, productData);
        return response.data;
    },

    getTransactionHistory: async () => {
        const response = await axiosInstance.get('/api/inventory/transactions/history');
        return response.data;
    },

    deleteProduct: async (productId) => {
        const response = await axiosInstance.delete(`/api/inventory/products/${productId}`);
        return response.data;
    },

    updateProductVariant: async (variantId, variantData) => {
        const response = await axiosInstance.put(`/api/inventory/variants/${variantId}`, variantData);
        return response.data;
    },

    deleteProductVariant: async (variantId) => {
        const response = await axiosInstance.delete(`/api/inventory/variants/${variantId}`);
        return response.data;
    },

    recordLabelPrint: async (printData) => {
        const response = await axiosInstance.post('/api/inventory/labels/history', printData);
        return response.data;
    },

    getLabelPrintHistory: async () => {
        const response = await axiosInstance.get('/api/inventory/labels/history');
        return response.data;
    }
};
