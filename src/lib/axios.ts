import axios from "axios";
import { API_URL } from "./constant";


export const HttpClient = axios.create({
    baseURL: API_URL,
    // withCredentials: true,
});

// Setup axios interceptor
HttpClient.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});