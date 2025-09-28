import { create } from "zustand";

type LanguageStore = {
  language: string;
  setLanguage: (lang: string) => void;
};

export const useLanguageStore = create<LanguageStore>((set) => ({
  language: localStorage.getItem("i18nextLng") || "en",
  setLanguage: (lang) => {
    localStorage.setItem("i18nextLng", lang);
    set({ language: lang });
  },
}));
