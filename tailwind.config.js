/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'golf-green': '#2d5016',
        'fairway': '#8fbc8f',
        'rough': '#556b2f',
        'sand': '#f4d03f',
        'earth-green': '#556b2f',
        'earth-burlap': '#deb887',
        'earth-beige': '#f5f5dc',
        'earth-brown': '#8b4513',
      },
      fontFamily: {
        marker: ['"Permanent Marker"', 'cursive'],
      },
    },
  },
  plugins: [],
} 