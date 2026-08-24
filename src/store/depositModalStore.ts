import { create } from 'zustand';

export type TransactionType = 'deposit' | 'withdraw';
export type ModalView = 'methods' | 'fiat_amount' | 'upi_qr' | 'crypto_qr' | 'insufficient_funds' | 'fiat_withdraw' | 'crypto_withdraw';

interface DepositModalState {
  isOpen: boolean;
  type: TransactionType;
  view: ModalView;
  selectedMethod: any | null;
  openModal: (type?: TransactionType, view?: ModalView) => void;
  closeModal: () => void;
  setView: (view: ModalView) => void;
  setMethod: (method: any) => void;
}

export const useDepositModalStore = create<DepositModalState>((set) => ({
  isOpen: false,
  type: 'deposit',
  view: 'methods',
  selectedMethod: null,
  openModal: (type = 'deposit', view = 'methods') => set({ isOpen: true, type, view, selectedMethod: null }),
  closeModal: () => set({ isOpen: false, view: 'methods', selectedMethod: null }),
  setView: (view) => set({ view }),
  setMethod: (method) => set({ selectedMethod: method }),
}));
