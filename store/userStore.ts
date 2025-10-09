// store/userStore.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

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
  lastFetched: number | null;
  setPlan: (plan: string) => void;
  setUsage: (usage: UsageData) => void;
  setLoading: (loading: boolean) => void;
  fetchUserData: (force?: boolean) => Promise<void>;
  resetUserStore: () => void;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      plan: "free",
      usage: null,
      loading: false,
      initialized: false,
      lastFetched: null,

      resetUserStore: () =>
        set({
          plan: "free",
          usage: null,
          loading: false,
          initialized: false,
          lastFetched: null,
        }),

      setPlan: (plan) => set({ plan }),

      setUsage: (usage) => set({ usage }),

      setLoading: (loading) => set({ loading }),

      fetchUserData: async (force = false) => {
        const state = get();

        // Skip if already initialized and not forcing refresh
        if (state.initialized && !force && state.lastFetched) {
          const timeSinceLastFetch = Date.now() - state.lastFetched;
          if (timeSinceLastFetch < CACHE_DURATION) {
            console.log("Using cached user data");
            return;
          }
        }

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

          set({
            initialized: true,
            lastFetched: Date.now(),
          });
        } catch (error) {
          console.error("Failed to fetch user data:", error);
        } finally {
          set({ loading: false });
        }
      },
    }),
    {
      name: "user-storage", // localStorage key
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        plan: state.plan,
        usage: state.usage,
        initialized: state.initialized,
        lastFetched: state.lastFetched,
      }),
    }
  )
);
