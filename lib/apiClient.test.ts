import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Use vi.hoisted to ensure variables are available for the mock factory
const { requestMock, useMock, apiClientMock } = vi.hoisted(() => {
    const requestMock = vi.fn();
    const useMock = vi.fn();
    
    const axiosInstance = {
        interceptors: {
            response: {
                use: useMock
            }
        },
        defaults: { headers: {} },
    };
    
    // In axios, the instance itself is a function (request)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const apiClientMock = requestMock as any;
    Object.assign(apiClientMock, axiosInstance);
    
    return { requestMock, useMock, apiClientMock };
});

vi.mock('axios', () => ({
    default: {
        create: () => apiClientMock,
        isAxiosError: () => true,
        // Add other axios static methods if needed
    },
    AxiosError: class {}
}));

// Import after mocking
import './apiClient'; // This executes the file and registers interceptors

describe('apiClient Retry Logic', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let errorInterceptor: any;

    beforeEach(() => {
        // The interceptor is registered when the module is imported.
        // useMock should have been called.
        // The second argument to use() is the error handler.
        if (useMock.mock.calls.length > 0) {
            errorInterceptor = useMock.mock.calls[0][1];
        } else {
            throw new Error('Interceptor not registered');
        }
        
        requestMock.mockReset();
        // Default resolve for requestMock to avoid "Cannot read properties of undefined" if code awaits it
        requestMock.mockResolvedValue({ data: { success: true } });
        
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should retry on 500', async () => {
        const config = { url: '/test' };
        const error = {
            config,
            response: { status: 500 },
            isAxiosError: true
        };

        // Trigger the error interceptor
        const promise = errorInterceptor(error);
        
        // Fast-forward time for retry delay
        await vi.advanceTimersByTimeAsync(2000); 
        
        await promise;
        
        expect(requestMock).toHaveBeenCalledWith(expect.objectContaining({
            url: '/test',
            _retryCount: 1
        }));
    });

    it('should NOT retry if shouldRetry is false on 500', async () => {
        const config = { url: '/test', shouldRetry: false };
        const error = {
            config,
            response: { status: 500 },
            isAxiosError: true
        };

        try {
            await errorInterceptor(error);
        } catch {
            // Expected to reject
        }

        expect(requestMock).not.toHaveBeenCalled();
    });

    it('should retry on ECONNABORTED (Timeout)', async () => {
        const config = { url: '/test' };
        const error = {
            config,
            code: 'ECONNABORTED',
            isAxiosError: true
        };

        const promise = errorInterceptor(error);
        await vi.advanceTimersByTimeAsync(2000);
        await promise;

        expect(requestMock).toHaveBeenCalled();
    });

    it('should NOT retry on ECONNABORTED if shouldRetry is false', async () => {
        const config = { url: '/test', shouldRetry: false };
        const error = {
            config,
            code: 'ECONNABORTED',
            isAxiosError: true
        };

        try {
            await errorInterceptor(error);
        } catch {}

        expect(requestMock).not.toHaveBeenCalled();
    });
});