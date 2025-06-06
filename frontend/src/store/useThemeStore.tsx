import { create } from "zustand";
import type { Theme } from "../constants/theme";

export const useThemeStore = create<{
  theme: Theme;
  setTheme: (theme: Theme) => void;
}>((set) => ({
  theme: (localStorage.getItem("chat-theme") as Theme) || "coffee",
  setTheme: (theme: Theme) => {
    localStorage.setItem("chat-theme", theme);
    set({ theme });
  },
}));
