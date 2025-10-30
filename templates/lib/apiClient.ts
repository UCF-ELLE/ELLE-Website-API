import Cookies from 'js-cookie';

const API_BASE = process.env.NEXT_PUBLIC_ELLE_API_BASE || 'http://localhost:5050/elleapi';

export class ApiClient {
    private getToken(): string | undefined {
        const userCookie = Cookies.get('currentUser');
        if (userCookie) {
            const user = JSON.parse(userCookie);
            return user.jwt;
        }
        return undefined;
    }

    private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const token = this.getToken();
        const headers: Record<string, string> = {
            ...(token && { Authorization: `Bearer ${token}` }),
            ...(options.headers as Record<string, string>),
        };
        
        // Only add Content-Type for requests with a body
        if (options.body) {
            headers['Content-Type'] = 'application/json';
        }

        console.log('[apiClient] Request:', endpoint, options.method || 'GET');

        const response = await fetch(`${API_BASE}${endpoint}`, {
            ...options,
            headers,
        });

        console.log('[apiClient] Response status:', response.status, endpoint);

        if (!response.ok) {
            let errorData;
            try {
                errorData = await response.json();
            } catch {
                // Empty or invalid JSON response
                errorData = { error: `Request failed with status ${response.status}` };
            }
            console.error('[apiClient] Error:', errorData);
            throw new Error(errorData.error || errorData.Error || errorData.message || `Request failed: ${response.status}`);
        }

        try {
            const data = await response.json();
            console.log('[apiClient] Response data:', data);
            return data;
        } catch (e) {
            console.error('[apiClient] Failed to parse JSON response:', e);
            throw new Error('Failed to parse server response');
        }
    }

    async get<T>(endpoint: string): Promise<T> {
        return this.request<T>(endpoint, { method: 'GET' });
    }

    async post<T>(endpoint: string, data?: any): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'POST',
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    async put<T>(endpoint: string, data?: any): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'PUT',
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    async delete<T>(endpoint: string): Promise<T> {
        return this.request<T>(endpoint, { method: 'DELETE' });
    }
}

export const apiClient = new ApiClient();
