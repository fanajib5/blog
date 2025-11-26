export default {
  layout: 'layouts/gallery-single.njk',
  tags: 'gallery',
  eleventyComputed: {
    permalink: (data) => {
      // For the list page (gallery.md), use /gallery/
      if (data.page.fileSlug === 'gallery') {
        return '/gallery/';
      }
      // For individual gallery pages, use /gallery/{fileSlug}/
      return `/gallery/${data.page.fileSlug}/index.html`;
    }
  }
};
