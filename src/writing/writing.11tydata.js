export default {
  layout: 'layouts/post.njk',
  tags: 'writing',
  eleventyComputed: {
    permalink: (data) => {
      // For the list page (writing.md), use /writing/
      if (data.page.fileSlug === 'writing') {
        return '/writing/';
      }
      // For individual posts, use /writing/{fileSlug}/
      return `/writing/${data.page.fileSlug}/index.html`;
    }
  }
};
