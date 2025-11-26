import markdownIt from 'markdown-it';
import markdownItAnchor from 'markdown-it-anchor';
import markdownItTocDoneRight from 'markdown-it-toc-done-right';

export default function(eleventyConfig) {
  // Markdown configuration
  const md = markdownIt({
    html: true,
    breaks: true,
    linkify: true,
    typographer: true
  });

  md.use(markdownItAnchor, {
    permalink: markdownItAnchor.permalink.headerLink({
      safariReaderFix: true,
      class: 'header-anchor'
    })
  });

  md.use(markdownItTocDoneRight, {
    containerClass: 'toc',
    listType: 'ul',
    level: [2, 3]
  });

  eleventyConfig.setLibrary('md', md);

  // Filters
  eleventyConfig.addFilter('dateFormat', (date, format = 'long') => {
    const d = new Date(date);
    const options = {
      'iso': { year: 'numeric', month: '2-digit', day: '2-digit' },
      'short': { year: 'numeric', month: 'short', day: 'numeric' },
      'long': { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
    };

    if (format === 'iso') {
      return d.toISOString().split('T')[0];
    }

    return d.toLocaleDateString('id-ID', options[format] || options['long']);
  });

  eleventyConfig.addFilter('readingTime', (content) => {
    const wordsPerMinute = 200;
    const text = content.replace(/<[^>]+>/g, '');
    const wordCount = text.split(/\s+/).length;
    const minutes = Math.ceil(wordCount / wordsPerMinute);
    return `${minutes} menit baca`;
  });

  // TOC filter replaced by eleventy-plugin-toc

  eleventyConfig.addFilter('slugify', (str) => {
    return str.toString().toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  });

  eleventyConfig.addFilter('limit', (array, limit) => {
    return array.slice(0, limit);
  });

  // Collections
  eleventyConfig.addCollection('posts', (collection) => {
    return collection.getFilteredByTag('writing')
      .filter(item => !item.data.draft)
      .sort((a, b) => b.date - a.date);
  });

  eleventyConfig.addCollection('gallery', (collection) => {
    return collection.getFilteredByTag('gallery')
      .filter(item => item.data.title) // Only items with titles (not the list page)
      .sort((a, b) => b.date - a.date);
  });

  // TOC Filter - extract TOC from markdown content
  eleventyConfig.addFilter('toc', (content) => {
    // Create a temporary markdown instance with TOC enabled
    const md = markdownIt({
      html: true,
      breaks: true,
      linkify: true,
      typographer: true
    });

    md.use(markdownItTocDoneRight, {
      containerClass: 'toc',
      listType: 'ul',
      level: [2, 3]
    });

    // Render content and extract TOC
    const rendered = md.render(content);
    const tocMatch = rendered.match(/<div class="toc"[^>]*>[\s\S]*?<\/div>/);

    return tocMatch ? tocMatch[0] : '';
  });

  // Pass through copy
  eleventyConfig.addPassthroughCopy('src/assets/images');
  eleventyConfig.addPassthroughCopy('src/assets/fonts');
  eleventyConfig.addPassthroughCopy('src/assets/js');
  eleventyConfig.addPassthroughCopy('src/gallery/**/*.{jpg,jpeg,png,gif,webp,svg}');

  // Watch targets
  eleventyConfig.addWatchTarget('src/assets/scss/');

  // Configuration
  return {
    dir: {
      input: 'src',
      output: '_site',
      includes: '_includes',
      data: '_data'
    },
    markdownTemplateEngine: false,
    htmlTemplateEngine: 'njk',
    templateFormats: ['md', 'njk', 'html']
  };
}
