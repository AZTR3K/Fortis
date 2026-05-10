import axios from "axios";

const api = axios.create({ baseURL: "/api" });

export const getAthletes = () => api.get(`athletes`).then((r) => r.data);
export const getAthlete = (id) => api.get(`/athlete/${id}`).then((r) => r.data);
export const getAthleteHistory = (id) => api.get(`/athlete/${id}/history`).then((r) => r.data);
export const postPredict = (payload) => api.post(`/predict`, payload).then((r) => r.data);
