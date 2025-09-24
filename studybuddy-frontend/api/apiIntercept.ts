"use client";
import axios,{AxiosResponse,AxiosError,InternalAxiosRequestConfig, AxiosRequestConfig} from "axios";
import { store } from "@/store";
import { setToken ,logoutState} from "@/store/loginSlice";

const api = axios.create({
    baseURL: "http://0.0.0.0:8000/studybuddy/v1",
    timeout: 10000,
})



api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const state = store.getState();
        const access_token = store.getState().loginUser.access_token || localStorage.getItem("access_token");

        if (access_token && config.headers) {
            config.headers.Authorization = `Bearer ${access_token}`;
        }

        return config; 
    },
    (error: AxiosError) => { 
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        if (!error.config) {
            return Promise.reject(error);
        }

        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const { data } = await api.post("/refresh", {}, { withCredentials: true });
                const newAccessToken = data.access_token;

                store.dispatch(setToken(data));
                localStorage.setItem("access_token", newAccessToken);
                originalRequest.headers = originalRequest.headers || {};
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

                return api(originalRequest);
            } catch (err) {
                store.dispatch(logoutState());
                window.location.href = "/";
                return Promise.reject(err);
            }
        }

        return Promise.reject(error);
    }
);


export default api;