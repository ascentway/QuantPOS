import axiosInstance from './axiosInstance';

export const notificationApi = {
    getUnreadNotifications: async () => {
        const response = await axiosInstance.get('/api/notifications');
        return response.data;
    },

    markAsRead: async (notificationId) => {
        const response = await axiosInstance.put(`/api/notifications/${notificationId}/read`);
        return response.data;
    },

    markAllAsRead: async () => {
        const response = await axiosInstance.put('/api/notifications/read-all');
        return response.data;
    }
};
