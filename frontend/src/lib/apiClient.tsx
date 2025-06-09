// src/lib/apiClient.ts
import { AxiosError, type AxiosRequestConfig } from "axios";
import toast from "react-hot-toast";
import { axiosInstance } from "./axios";

type ToastOptions = {
  successMessage?: string;
  errorMessage?: string;
  silent?: boolean;
  throwOnError?: boolean;
  onError?: () => void;
};

function handleAxiosError(
  error: unknown,
  fallbackMessage = "Something went wrong"
) {
  if (error instanceof AxiosError) {
    const msg = error.response?.data?.message || fallbackMessage;
    toast.error(msg);
  } else {
    toast.error(fallbackMessage);
  }
}

const api = {
  async get<T>(url: string, options?: ToastOptions & AxiosRequestConfig) {
    const {
      successMessage,
      errorMessage,
      silent,
      throwOnError,
      onError,
      ...axiosConfig
    } = options || {};
    try {
      const res = await axiosInstance.get<T>(url, axiosConfig);
      if (!silent && successMessage) toast.success(successMessage);
      return res.data;
    } catch (error) {
      if (!silent) handleAxiosError(error, errorMessage);
      if (onError) onError();
      if (throwOnError) throw error;
      return null;
    }
  },

  async post<T>(
    url: string,
    data?: any,
    options?: ToastOptions & AxiosRequestConfig
  ) {
    const {
      successMessage,
      errorMessage,
      silent,
      throwOnError,
      onError,
      ...axiosConfig
    } = options || {};
    try {
      const res = await axiosInstance.post<T>(url, data, axiosConfig);
      if (!silent && successMessage) toast.success(successMessage);
      return res.data;
    } catch (error) {
      if (!silent) handleAxiosError(error, errorMessage);
      if (onError) onError();
      if (throwOnError) throw error;
      return null;
    }
  },

  async put<T>(
    url: string,
    data?: any,
    options?: ToastOptions & AxiosRequestConfig
  ) {
    const {
      successMessage,
      errorMessage,
      silent,
      throwOnError,
      onError,
      ...axiosConfig
    } = options || {};
    try {
      const res = await axiosInstance.put<T>(url, data, axiosConfig);
      if (!silent && successMessage) toast.success(successMessage);
      return res.data;
    } catch (error) {
      if (!silent) handleAxiosError(error, errorMessage);
      if (onError) onError();
      if (throwOnError) throw error;
      return null;
    }
  },

  async patch<T>(
    url: string,
    data?: any,
    options?: ToastOptions & AxiosRequestConfig
  ) {
    const {
      successMessage,
      errorMessage,
      silent,
      throwOnError,
      onError,
      ...axiosConfig
    } = options || {};
    try {
      const res = await axiosInstance.patch<T>(url, data, axiosConfig);
      if (!silent && successMessage) toast.success(successMessage);
      return res.data;
    } catch (error) {
      if (!silent) handleAxiosError(error, errorMessage);
      if (onError) onError();
      if (throwOnError) throw error;
      return null;
    }
  },
};

export default api;
