import { create } from 'zustand';

interface UIState {
  isInsufficientFundsModalOpen: boolean;
  openInsufficientFundsModal: () => void;
  closeInsufficientFundsModal: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isInsufficientFundsModalOpen: false,
  openInsufficientFundsModal: () => set({ isInsufficientFundsModalOpen: true }),
  closeInsufficientFundsModal: () => set({ isInsufficientFundsModalOpen: false }),
}));
