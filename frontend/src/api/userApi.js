import axiosInstance from './axiosInstance';

export const userApi = {
    getAllUsers: async () => {
        const response = await axiosInstance.get('/api/users');
        return response.data;
    },

    updateUserStatus: async (userId, isActive) => {
        const response = await axiosInstance.patch(`/api/users/${userId}/status`, { isActive });
        return response.data;
    },

    updateUserRole: async (userId, role) => {
        const response = await axiosInstance.patch(`/api/users/${userId}/role`, { role });
        return response.data;
    },

    updateUserPermissions: async (userId, permissions) => {
        const response = await axiosInstance.patch(`/api/users/${userId}/permissions`, { permissions });
        return response.data;
    }
};
