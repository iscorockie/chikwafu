/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          50: "#eef1f7",
          100: "#d6ddec",
          200: "#adbbd9",
          300: "#7f93bf",
          400: "#54699e",
          500: "#374d80",
          600: "#243761",
          700: "#182647",
          800: "#101a34",
          900: "#0a1224",
        },
        gold: {
          50: "#fff9eb",
          100: "#ffefc2",
          300: "#ffc847",
          400: "#ffb61a",
          500: "#f59e00",
          600: "#cc7e00",
        },
        teal: {
          50: "#eafbf7",
          100: "#c9f3e9",
          400: "#2fba9f",
          500: "#179e85",
          600: "#0f7f6c",
        },
      },
      fontFamily: {
        display: ["'Fraunces'", "serif"],
        body: ["'Inter'", "sans-serif"],
      },
      boxShadow: {
        card: "0 2px 10px rgba(16,26,52,0.06)",
      },
    },
  },
  plugins: [],
};
