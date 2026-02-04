
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { toast } from 'sonner';

// Mock sonner
vi.mock('sonner', () => ({
    toast: {
        error: vi.fn(),
        success: vi.fn()
    }
}));

const mocks = vi.hoisted(() => {
    const useResponseInterceptor = vi.fn();
    const mockAxiosInstance = {
        interceptors: {
            response: {
                use: useResponseInterceptor
            }
        },
        get: vi.fn(),
        post: vi.fn()
    };
    return {
        useResponseInterceptor,
        mockAxiosInstance
    };
});

// Mock axios
vi.mock('axios', () => ({
    default: {
        create: vi.fn(() => mocks.mockAxiosInstance),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        isAxiosError: (payload: any) => !!payload.isAxiosError
    }
}));

describe('apiClient Interceptors', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.resetModules();
    });

    it('should handle 409 Conflict error with toast', async () => {
        // Dynamic import to ensure it runs with fresh mocks
        await import('../lib/apiClient');

        // Ensure interceptor was registered
        expect(mocks.useResponseInterceptor).toHaveBeenCalled();
        
        // Get the error handler (second argument to use)
        // use(onFulfilled, onRejected)
        const handlers = mocks.useResponseInterceptor.mock.calls[0];
        const errorHandler = handlers[1];
        
        const error409 = {
            isAxiosError: true,
            response: {
                status: 409,
                data: {
                    message: "Repository already exists"
                }
            },
            config: {}
        };

        try {
            await errorHandler(error409);
        } catch (e) {
            // It re-throws the error, which is expected behavior of the interceptor
            expect(e).toBe(error409);
        }

        expect(toast.error).toHaveBeenCalledWith('Conflict: Repository already exists');
    });

    it('should NOT retry on 409 error', async () => {
        await import('../lib/apiClient');
        const handlers = mocks.useResponseInterceptor.mock.calls[0];
        const errorHandler = handlers[1];
        
        const error409 = {
            isAxiosError: true,
            response: {
                status: 409,
                data: { message: "Repo exists" }
            },
            config: { _retryCount: 0 }
        };

        try {
            await errorHandler(error409);
        } catch {
            // Expected
        }
        
        expect(error409.config._retryCount).toBe(0); 
    });

    it('should handle 401 Session Expired error', async () => {
        await import('../lib/apiClient');
        const handlers = mocks.useResponseInterceptor.mock.calls[0];
        const errorHandler = handlers[1];
        
        const error401 = {
            isAxiosError: true,
            response: {
                status: 401,
                data: { message: "Bad credentials" }
            },
            config: {}
        };

        try {
            await errorHandler(error401);
        } catch (e) {
            expect(e).toBe(error401);
        }

        expect(toast.error).toHaveBeenCalledWith('Session expired. Please sign in again.');
    });

    it('should handle 403 Permission Denied error', async () => {
        await import('../lib/apiClient');
        const handlers = mocks.useResponseInterceptor.mock.calls[0];
        const errorHandler = handlers[1];
        
        const error403 = {
            isAxiosError: true,
            response: {
                status: 403,
                data: { message: "API Rate Limit Exceeded" }
            },
            config: {}
        };

        try {
            await errorHandler(error403);
        } catch (e) {
            expect(e).toBe(error403);
        }

        expect(toast.error).toHaveBeenCalledWith('Permission Denied: API Rate Limit Exceeded');
    });
});
