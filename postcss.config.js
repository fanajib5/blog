module.exports = {
  plugins: {
    '@tailwindcss/postcss': {
      // Tell Tailwind v4 which files to scan for class names
      content: ['./src/**/*.{md,njk,html}', './src/_includes/**/*.{njk,html}'],
    },
    ...(process.env.NODE_ENV === "production"
      ? { cssnano: { preset: "default" } }
      : {})
  }
};
