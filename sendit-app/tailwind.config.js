/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      colors: {
        body: "#EEF9FF",
        logo: "#EEF9FF",
      },
      fontFamily: {
        gilroy: ['Gilroy', 'sans-serif'],
      },
      fontWeight: {
        medium: '500',
        semibold: '600',
        extrabold: '800',
      },
    },
  },
  plugins: [],
}
