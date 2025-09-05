// API Services
import { API_BASE_URL } from '../constants';
import type { ApiResponse, PaginatedResponse, Property, SearchFilters } from '../types';

// Generic API client
class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// Create API client instance
export const apiClient = new ApiClient(API_BASE_URL);

// Property services
export const propertyService = {
  getAll: (page: number = 1, limit: number = 12): Promise<PaginatedResponse<Property>> =>
    apiClient.get(`/properties?page=${page}&limit=${limit}`),
  
  getById: (id: string): Promise<ApiResponse<Property>> =>
    apiClient.get(`/properties/${id}`),
  
  search: (filters: SearchFilters, page: number = 1): Promise<PaginatedResponse<Property>> =>
    apiClient.post(`/properties/search?page=${page}`, filters),
  
  getFeatured: (): Promise<ApiResponse<Property[]>> =>
    apiClient.get('/properties/featured'),
};

// User services
export const userService = {
  login: (email: string, password: string) =>
    apiClient.post('/auth/login', { email, password }),
  
  register: (userData: { name: string; email: string; password: string }) =>
    apiClient.post('/auth/register', userData),
  
  logout: () =>
    apiClient.post('/auth/logout', {}),
  
  getProfile: () =>
    apiClient.get('/user/profile'),
}; 