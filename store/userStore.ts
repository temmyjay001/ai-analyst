import { create } from "zustand";

interface UsageData {
  dailyQueries: number;
  monthlyQueries: number;
  dailyLimit: number;
  monthlyLimit: number;
}

interface UserState {
  plan: string;
  usage: UsageData | null;
  loading: boolean;
  initialized: boolean;
  setPlan: (plan: string) => void;
  setUsage: (usage: UsageData) => void;
  setLoading: (loading: boolean) => void;
  fetchUserData: () => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  plan: "free",
  usage: null,
  loading: true,
  initialized: false,

  setPlan: (plan) => set({ plan }),

  setUsage: (usage) => set({ usage }),

  setLoading: (loading) => set({ loading }),

  fetchUserData: async () => {
    if (get().initialized) return;

    set({ loading: true });

    try {
      const [planRes, usageRes] = await Promise.all([
        fetch("/api/user/plan"),
        fetch("/api/usage"),
      ]);

      if (planRes.ok) {
        const planData = await planRes.json();
        set({ plan: planData.plan || "free" });
      }

      if (usageRes.ok) {
        const usageData = await usageRes.json();
        set({
          usage: {
            dailyQueries: usageData.usage.dailyQueries,
            monthlyQueries: usageData.usage.monthlyQueries,
            dailyLimit: usageData.limits.dailyQueries,
            monthlyLimit: usageData.limits.monthlyQueries,
          },
        });
      }

      set({ initialized: true });
    } catch (error) {
      console.error("Failed to fetch user data:", error);
    } finally {
      set({ loading: false });
    }
  },
}));
