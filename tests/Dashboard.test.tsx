import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Dashboard from '@/components/Dashboard'
import { useSession } from "next-auth/react"
import apiClient from '@/lib/apiClient'

// Mock modules
vi.mock("next-auth/react")
vi.mock("@/lib/apiClient", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    interceptors: {
      response: { use: vi.fn() }
    }
  }
}))
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}))
// Mock UI components that might cause issues in jsdom
vi.mock("@/components/ui/calendar", () => ({
  Calendar: () => <div data-testid="calendar">Calendar</div>
}))

describe('Dashboard Component', () => {
  const mockSession = {
    user: { name: 'Test User', email: 'test@example.com', image: 'http://image.url' },
    accessToken: 'fake-token'
  }

  beforeEach(() => {
    vi.clearAllMocks();
    (useSession as unknown as Mock).mockReturnValue({ data: mockSession, status: 'authenticated' });
    (apiClient.get as unknown as Mock).mockResolvedValue({ data: { success: true, status: 'none' } });
  })

  it('renders dashboard correctly', () => {
    render(<Dashboard />)
    expect(screen.getByText('Dashboard')).toBeDefined()
    expect(screen.getByText('Create your contribution art')).toBeDefined()
  })

  it('handles pattern generation successfully', async () => {
    (apiClient.post as unknown as Mock).mockResolvedValue({ data: { success: true } })
    
    render(<Dashboard />)
    
    // Simulate user input
    const input = screen.getByPlaceholderText('HELLO')
    fireEvent.change(input, { target: { value: 'HELLO' } })
    
    // Trigger generation
    const generateBtn = screen.getByText('Commit Art')
    fireEvent.click(generateBtn)
    
    // Should show error toast because date is not valid/set correctly or just verifying axios not called with wrong payload
    // Actually in the component, 'date' state is initially undefined.
    // So clicking 'Commit Art' should trigger 'Please fill in all fields' toast and NOT call axios.
    
    await waitFor(() => {
       expect(apiClient.post).not.toHaveBeenCalledWith("/generate", expect.anything())
    })
  })

  it('generates pattern when all fields are valid', async () => {
    (apiClient.post as unknown as Mock).mockResolvedValue({ data: { success: true } });
    
    render(<Dashboard />)
    
    // Set text
    const input = screen.getByPlaceholderText('HELLO')
    fireEvent.change(input, { target: { value: 'TEST' } })
    
    // Set Date manually
    const dayInput = screen.getByPlaceholderText('DD')
    const monthInput = screen.getByPlaceholderText('MM')
    const yearInput = screen.getByPlaceholderText('YYYY')
    
    // Trigger change events to update state
    fireEvent.change(dayInput, { target: { value: '15' } })
    fireEvent.change(monthInput, { target: { value: '5' } })
    fireEvent.change(yearInput, { target: { value: '2025' } })
    
    const generateBtn = screen.getByText('Commit Art')
    fireEvent.click(generateBtn)
    
    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith(
        "/generate",
        expect.objectContaining({
          githubToken: 'fake-token',
          email: 'test@example.com',
          owner: 'Test User',
          repoName: expect.stringContaining('-contribution'),
        })
      )
    })
  })

  it('handles 409 conflict gracefully', async () => {
    // Mock 409 error
    const error = {
        response: {
            status: 409,
            data: { error: "Repository already exists" }
        }
    };
    (apiClient.post as unknown as Mock).mockRejectedValue(error);
    
    render(<Dashboard />)
    
    // Set text
    const input = screen.getByPlaceholderText('HELLO')
    fireEvent.change(input, { target: { value: 'CONFLICT' } })
    
    // Set Date manually
    const dayInput = screen.getByPlaceholderText('DD')
    const monthInput = screen.getByPlaceholderText('MM')
    const yearInput = screen.getByPlaceholderText('YYYY')
    
    fireEvent.change(dayInput, { target: { value: '15' } })
    fireEvent.change(monthInput, { target: { value: '5' } })
    fireEvent.change(yearInput, { target: { value: '2025' } })
    
    const generateBtn = screen.getByText('Commit Art')
    fireEvent.click(generateBtn)
    
    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalled()
      // Verify loading state is cleared (button is not disabled)
      expect(generateBtn).not.toBeDisabled()
    })
    // Note: toast.error is handled by apiClient interceptor, which is mocked out here.
    // We verify that in apiClient.test.ts
  })
})
