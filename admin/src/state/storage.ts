import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { API_URL } from '../config/api';

type User = {
    id?: string;
    username?: string;
    email?: string;
    isVerified?: boolean;
    role?: "user"|"admin"
    profile?: {
      avatar?: string;
      bio?: string;
    };
  };

interface AuthStorage {
    accessToken: string | null;
    refreshToken:string | null;
    user: User | null
    isAuthenticated: boolean;
    setTokens: (access:string,refresh:string) => void
    setUser: (user: object) => void
    logout: () => void
    refreshAccessToken: () => Promise<boolean>
}

const useAuthStore = create<AuthStorage>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
      
      setTokens: (access, refresh) => set({ 
        accessToken: access, 
        refreshToken: refresh,
        isAuthenticated: true 
      }),
      
      setUser: (user) => set({ user }),
      
      logout: () => set({ 
        accessToken: null, 
        refreshToken: null, 
        user: null,
        isAuthenticated: false 
      }),
      
      // Refresh token logic
      refreshAccessToken: async () => {
        const { refreshToken } = get();
        if (!refreshToken) return false;
        
        try {
          const res = await fetch(`${API_URL}/auth/refresh-token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: refreshToken })
          });
          
          const data = await res.json();
          if (data.success) {
            set({ 
              accessToken: data.access_token,
              refreshToken: data.refresh_token 
            });
            return true;
          }
          return false;
        } catch (err) {
          console.error('Token refresh failed:', err);
          get().logout();
          return false;
        }
      }
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);

export default useAuthStore