/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,jsx,html}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        base: {
          950: "#07080b",
          900: "#0c0e13",
          850: "#11141b",
          800: "#161a23",
          700: "#1f2430",
          600: "#2a3140",
        },
        accent: {
          DEFAULT: "rgb(var(--color-accent) / <alpha-value>)",
          soft: "rgb(var(--color-accent-soft) / <alpha-value>)",
          muted: "rgb(var(--color-accent-muted) / <alpha-value>)",
        },
        success: "#3ddc84",
        warning: "#ffb454",
      },
      fontFamily: {
        sans: ["Inter", "Segoe UI", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 8px 30px rgba(0,0,0,0.45)",
        focus: "0 0 0 3px rgb(var(--color-accent) / 0.85), 0 12px 40px rgba(0,0,0,0.55)",
      },
      backgroundImage: {
        "fade-bottom":
          "linear-gradient(180deg, rgba(7,8,11,0) 0%, rgba(7,8,11,0.85) 70%, rgba(7,8,11,1) 100%)",
        "fade-top":
          "linear-gradient(180deg, rgba(7,8,11,0.9) 0%, rgba(7,8,11,0) 40%)",
      },
      keyframes: {
        indeterminate: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(300%)" },
        },
      },
    },
  },
  plugins: [],
};
