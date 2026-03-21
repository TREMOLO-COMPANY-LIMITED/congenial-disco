import { create } from "zustand";

interface VerificationStore {
  lastRunAt: string | null;
  runCount: number;
  incrementRunCount: () => void;
  setLastRunAt: (ts: string) => void;
}

export const useVerificationStore = create<VerificationStore>((set) => ({
  lastRunAt: null,
  runCount: 0,
  incrementRunCount: () =>
    set((state) => ({ runCount: state.runCount + 1 })),
  setLastRunAt: (ts) => set({ lastRunAt: ts }),
}));
