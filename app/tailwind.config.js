/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        'googlesans-regular': ["GoogleSans-Regular"],
        'googlesans-italic': ["GoogleSans-Italic"],
        'googlesans-medium': ["GoogleSans-Medium"],
        'googlesans-medium-italic': ["GoogleSans-MediumItalic"],
        'googlesans-semibold': ["GoogleSans-SemiBold"],
        'googlesans-semibold-italic': ["GoogleSans-SemiBoldItalic"],
        'googlesans-bold': ["GoogleSans-Bold"],
        'googlesans-bold-italic': ["GoogleSans-BoldItalic"],
      },
      colors: {
        'bg-primary': 'var(--color-bg-primary)',
        'bg-secondary': 'var(--color-bg-secondary)',
        'bg-highlight': 'var(--color-bg-highlight)',
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        'icon': 'var(--color-icon)',
        'brand-primary': 'var(--color-brand-primary)',
      }
    },
  },
  plugins: [],
}