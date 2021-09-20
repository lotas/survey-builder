const sveltePreprocess = require('svelte-preprocess');

module.exports = {
  preprocess: sveltePreprocess({
    postcss: true,
    plugins: [
      require('tailwindcss'),
      require('autoprefixer')
    ]
  })
};
