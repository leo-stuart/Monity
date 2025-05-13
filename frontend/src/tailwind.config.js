/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // 👈 this line is essential
  ],
  theme: {
    extend:{}
  },
  plugins: [],
}
