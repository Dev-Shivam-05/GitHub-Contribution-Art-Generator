import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { toast } from "sonner";

// Define the standard error response format
interface ApiErrorResponse {
    ok: boolean;
    code: string;
    message: string;
    details?: unknown;
    correlationId?: string;
    // Legacy support
    success?: boolean;
    error?: string;
}

const apiClient: AxiosInstance = axios.create({
    baseURL: '/api', // Next.js proxy will handle this
    timeout: 10000, // 10s default timeout
    headers: {
        'Content-Type': 'application/json',
    },
});

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000;

apiClient.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: AxiosError<ApiErrorResponse>) => {
        const config = error.config as AxiosRequestConfig & { _retryCount?: number };
        
        // Check if we should retry
        const shouldRetry = (config as unknown as { shouldRetry?: boolean }).shouldRetry !== false;
        if (shouldRetry && config && (error.response?.status === 500 || error.code === 'ECONNABORTED' || !error.response)) {
            config._retryCount = config._retryCount || 0;
            
            if (config._retryCount < MAX_RETRIES) {
                config._retryCount++;
                const delay = INITIAL_RETRY_DELAY * Math.pow(2, config._retryCount - 1); // Exponential backoff
                
                // Add jitter
                const jitter = Math.random() * 100;
                
                await new Promise(resolve => setTimeout(resolve, delay + jitter));
                
                return apiClient(config);
            }
        }

        // Standardized Error Handling for UI
        if (!(config as unknown as { skipErrorHandling?: boolean }).skipErrorHandling) {
            if (error.response) {
                const data = error.response.data;
                const status = error.response.status;
                
                // Prefer standardized 'message' field, fallback to legacy 'error'
                const errorMessage = data.message || data.error || "An unexpected error occurred";
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const errorDetails = data.details ? ` (${JSON.stringify(data.details)})` : '';
                const correlationId = data.correlationId ? ` [Req ID: ${data.correlationId}]` : '';

                if (status === 500) {
                    toast.error(`Server Error: ${errorMessage}${correlationId}`);
                } else if (status === 400) {
                     toast.error(`Validation Error: ${errorMessage}`);
                } else if (status === 401) {
                    toast.error("Session expired. Please sign in again.");
                } else if (status === 403) {
                    toast.error(`Permission Denied: ${errorMessage}`);
                } else if (status === 409) {
                    toast.error(`Conflict: ${errorMessage}`);
                } else if (status === 503) {
                    toast.error(`Service Unavailable: ${errorMessage}`);
                } else {
                    toast.error(`Error (${status}): ${errorMessage}`);
                }
            } else if (error.request) {
                toast.error("Network Error: No response from server. Please check your connection.");
            } else {
                toast.error(`Request Failed: ${error.message}`);
            }
        }

        return Promise.reject(error);
    }
);

export default apiClient;
