import axiosInstance from '../axios/axios.js';

const CULTURE_PROFILE_API = {

  /** Fetch the current recruiter's locked culture profile */
  getProfile: async () => {
    const res = await axiosInstance.get('/culture-profile');
    return res.data;
  },

  saveAndLock: async (industry, targets) => {
    const res = await axiosInstance.post('/culture-profile', { industry, targets });
    return res.data;
  },

  unlock: async () => {
    const res = await axiosInstance.delete('/culture-profile');
    return res.data;
  },
};

export default CULTURE_PROFILE_API;
