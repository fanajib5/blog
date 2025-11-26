// Tag Filtering Functionality
document.addEventListener('DOMContentLoaded', function() {
  const tagButtons = document.querySelectorAll('.tag-btn');
  const postsList = document.querySelector('.post-list');
  const yearHeadings = document.querySelectorAll('.year-heading');
  const postsInYear = document.querySelectorAll('.posts-in-year');

  if (!tagButtons.length || !postsList) return;

  let postsData = [];

  // Collect all posts data with tags
  const posts = postsList.querySelectorAll('.posts-in-year .post-item');
  posts.forEach(post => {
    const link = post.querySelector('a');
    const title = link.textContent;
    const description = post.querySelector('.post-description')?.textContent || '';
    const date = post.querySelector('time')?.textContent || '';
    const tagElements = post.querySelectorAll('.post-tags .tag');
    const tags = Array.from(tagElements).map(tag => tag.textContent.toLowerCase());

    postsData.push({
      element: post,
      title: title.toLowerCase(),
      description: description.toLowerCase(),
      date: date,
      url: link.href,
      tags: tags,
      yearList: post.closest('.posts-in-year'),
      yearHeading: post.closest('.posts-in-year').previousElementSibling
    });
  });

  // Group posts by year
  const yearGroups = {};
  postsData.forEach(post => {
    const year = post.date.split(' ').pop() || 'Unknown';
    if (!yearGroups[year]) {
      yearGroups[year] = [];
    }
    yearGroups[year].push(post);
  });

  // Tag filtering
  tagButtons.forEach(button => {
    button.addEventListener('click', function() {
      const selectedTag = this.dataset.tag;

      // Update active state
      tagButtons.forEach(btn => btn.classList.remove('active'));
      this.classList.add('active');

      // Filter posts
      let visiblePosts = [];

      if (selectedTag === 'all') {
        // Show all posts
        postsData.forEach(post => {
          post.element.style.display = 'block';
        });
        // Show all year headings
        document.querySelectorAll('.year-heading').forEach(heading => {
          heading.style.display = 'block';
        });
        document.querySelectorAll('.posts-in-year').forEach(list => {
          list.style.display = 'block';
        });
      } else {
        // Filter by tag
        postsData.forEach(post => {
          if (post.tags.includes(selectedTag)) {
            post.element.style.display = 'block';
            visiblePosts.push(post);
          } else {
            post.element.style.display = 'none';
          }
        });

        // Show/hide year sections based on visible posts
        document.querySelectorAll('.year-heading').forEach(heading => {
          const postsInThisYear = Array.from(heading.nextElementSibling.querySelectorAll('.post-item'));
          const hasVisiblePosts = postsInThisYear.some(post => post.style.display === 'block');
          heading.style.display = hasVisiblePosts ? 'block' : 'none';
        });

        document.querySelectorAll('.posts-in-year').forEach(list => {
          const hasVisiblePosts = Array.from(list.querySelectorAll('.post-item')).some(post => post.style.display === 'block');
          list.style.display = hasVisiblePosts ? 'block' : 'none';
        });
      }

      // Update results count
      updateFilterResults(selectedTag, selectedTag === 'all' ? postsData.length : visiblePosts.length);
    });
  });

  function updateFilterResults(tag, count) {
    const searchResults = document.querySelector('.search-results');
    if (!searchResults) return;

    if (tag === 'all') {
      searchResults.textContent = `Showing all ${count} posts`;
    } else {
      searchResults.textContent = `${count} post${count === 1 ? '' : 's'} tagged with "${tag}"`;
    }
    searchResults.style.display = 'block';
  }
});