import axiosInstance from './axiosInstance';

export const terminalApi = {
    getAllTerminals: async () => {
        const response = await axiosInstance.get('/api/terminals');
        return response.data;
    },

    createTerminal: async (terminalData) => {
        const response = await axiosInstance.post('/api/terminals', terminalData);
        return response.data;
    },

    toggleLock: async (terminalId) => {
        const response = await axiosInstance.patch(`/api/terminals/${terminalId}/lock`);
        return response.data;
    }
};
