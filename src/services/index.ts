// API Services
import { API_BASE_URL } from '../constants';
import { logError } from '../utils/logger';
import type { 
  ApiResponse, 
  PaginatedResponse, 
  Property, 
  PropertyFilters,
  CreatePropertyRequest,
  UpdatePropertyRequest,
  Booking,
  CreateBookingRequest,
  UpdateBookingRequest,
  Guest,
  CreateGuestRequest,
  UpdateGuestRequest,
  SearchResponse,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse
} from '../types/api';

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
      logError('API request failed', error, 'ApiClient');
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
    apiClient.get(`/properties?page=${page}&limit=${limit}`) as Promise<PaginatedResponse<Property>>,
  
  getById: (id: string): Promise<ApiResponse<Property>> =>
    apiClient.get(`/properties/${id}`),
  
  search: (filters: PropertyFilters, page: number = 1): Promise<SearchResponse> =>
    apiClient.post(`/properties/search?page=${page}`, filters) as Promise<SearchResponse>,
  
  getFeatured: (): Promise<ApiResponse<Property[]>> =>
    apiClient.get('/properties/featured'),
  
  create: (property: CreatePropertyRequest): Promise<ApiResponse<Property>> =>
    apiClient.post('/properties', property),
  
  update: (id: string, property: UpdatePropertyRequest): Promise<ApiResponse<Property>> =>
    apiClient.put(`/properties/${id}`, property),
  
  delete: (id: string): Promise<ApiResponse<void>> =>
    apiClient.delete(`/properties/${id}`),
  
  getAvailability: (id: string, startDate: Date, endDate: Date): Promise<ApiResponse<unknown>> =>
    apiClient.get(`/properties/${id}/availability?start=${startDate.toISOString()}&end=${endDate.toISOString()}`),
};

// Booking services
export const bookingService = {
  getAll: (page: number = 1, limit: number = 12): Promise<PaginatedResponse<Booking>> =>
    apiClient.get(`/bookings?page=${page}&limit=${limit}`) as Promise<PaginatedResponse<Booking>>,
  
  getById: (id: string): Promise<ApiResponse<Booking>> =>
    apiClient.get(`/bookings/${id}`),
  
  create: (booking: CreateBookingRequest): Promise<ApiResponse<Booking>> =>
    apiClient.post('/bookings', booking),
  
  update: (id: string, booking: UpdateBookingRequest): Promise<ApiResponse<Booking>> =>
    apiClient.put(`/bookings/${id}`, booking),
  
  cancel: (id: string, reason: string): Promise<ApiResponse<Booking>> =>
    apiClient.put(`/bookings/${id}/cancel`, { cancellationReason: reason }),
  
  getByProperty: (propertyId: string): Promise<ApiResponse<Booking[]>> =>
    apiClient.get(`/bookings/property/${propertyId}`),
  
  getByGuest: (guestId: string): Promise<ApiResponse<Booking[]>> =>
    apiClient.get(`/bookings/guest/${guestId}`),
  
  checkAvailability: (request: unknown): Promise<ApiResponse<unknown>> =>
    apiClient.post('/bookings/check-availability', request),
};

// Guest services
export const guestService = {
  getAll: (page: number = 1, limit: number = 12): Promise<PaginatedResponse<Guest>> =>
    apiClient.get(`/guests?page=${page}&limit=${limit}`) as Promise<PaginatedResponse<Guest>>,
  
  getById: (id: string): Promise<ApiResponse<Guest>> =>
    apiClient.get(`/guests/${id}`),
  
  create: (guest: CreateGuestRequest): Promise<ApiResponse<Guest>> =>
    apiClient.post('/guests', guest),
  
  update: (id: string, guest: UpdateGuestRequest): Promise<ApiResponse<Guest>> =>
    apiClient.put(`/guests/${id}`, guest),
  
  delete: (id: string): Promise<ApiResponse<void>> =>
    apiClient.delete(`/guests/${id}`),
  
  getByEmail: (email: string): Promise<ApiResponse<Guest>> =>
    apiClient.get(`/guests/email/${email}`),
};

// User services
export const userService = {
  login: (credentials: LoginRequest): Promise<LoginResponse> =>
    apiClient.post('/auth/login', credentials),
  
  register: (userData: RegisterRequest): Promise<RegisterResponse> =>
    apiClient.post('/auth/register', userData),
  
  logout: (): Promise<ApiResponse<void>> =>
    apiClient.post('/auth/logout', {}),
  
  getProfile: (): Promise<ApiResponse<unknown>> =>
    apiClient.get('/user/profile'),
  
  updateProfile: (data: unknown): Promise<ApiResponse<unknown>> =>
    apiClient.put('/user/profile', data),
  
  refreshToken: (refreshToken: string): Promise<ApiResponse<unknown>> =>
    apiClient.post('/auth/refresh', { refreshToken }),
}; 