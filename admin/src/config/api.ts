import useAuthStore from "../state/storage";

export const API_URL = "https://apis.iscode.eu/v1"

// API helper with automatic token refresh
export const apiRequest = async (endpoint: string, options:any = {}) => {
  const { accessToken, refreshAccessToken, logout } = useAuthStore.getState();
  
  const makeRequest = async (token:string|null) => {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Remove Content-Type for FormData
    if (options.body instanceof FormData) {
      delete headers['Content-Type'];
    }
    
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers
    });
    
    return response;
  };
  
  let response = await makeRequest(accessToken);
  
  // If 401, try to refresh token
  if (response.status === 401) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      const { accessToken: newToken } = useAuthStore.getState();
      response = await makeRequest(newToken);
    } else {
      logout();
      throw new Error('Session expired. Please login again.');
    }
  }
  
  return response;
};