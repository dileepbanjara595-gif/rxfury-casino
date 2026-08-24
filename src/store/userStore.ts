import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Session, User } from '@supabase/supabase-js';

interface UserProfile {
  firstName?: string;
  lastName?: string;
  dob?: string;
  avatarUrl?: string;
}

interface UserState {
  user: User | null;
  session: Session | null;
  profileData: UserProfile | null;
  isLoading: boolean;
  setUser: (user: User | null, session: Session | null) => void;
  setProfileData: (data: Partial<UserProfile>) => void;
  setLoading: (isLoading: boolean) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      session: null,
      profileData: null,
      isLoading: true,
      setUser: (user, session) => set({ user, session, isLoading: false }),
      setProfileData: (data) => set((state) => ({ 
        profileData: { ...state.profileData, ...data } 
      })),
      setLoading: (isLoading) => set({ isLoading }),
      clearUser: () => set({ user: null, session: null, profileData: null, isLoading: false }),
    }),
    {
      name: 'rxfury-user-profile', // unique name
      partialize: (state) => ({ profileData: state.profileData }), // Only persist profileData
    }
  )
);
