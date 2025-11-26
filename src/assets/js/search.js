// Blog Search Functionality
document.addEventListener('DOMContentLoaded', function() {
  const searchForm = document.querySelector('.blog-search-form');
  const searchInput = document.querySelector('.blog-search-input');
  const searchResults = document.querySelector('.search-results');
  const postsList = document.querySelector('.post-list');
  const noResults = document.querySelector('.no-results');

  if (!searchInput || !postsList) return;

  let postsData = [];

  // Collect all posts data
  const posts = postsList.querySelectorAll('li');
  posts.forEach(post => {
    const link = post.querySelector('a');
    const title = link.textContent;
    const description = post.querySelector('p')?.textContent || '';
    const date = post.querySelector('time')?.textContent || '';

    postsData.push({
      element: post,
      title: title.toLowerCase(),
      description: description.toLowerCase(),
      date: date,
      url: link.href
    });
  });

  // Search functionality
  searchInput.addEventListener('input', debounce(function(e) {
    const query = e.target.value.toLowerCase().trim();

    if (query === '') {
      // Show all posts
      postsData.forEach(post => {
        post.element.style.display = 'block';
      });
      hideSearchResults();
      return;
    }

    // Filter posts
    const filteredPosts = postsData.filter(post => {
      return post.title.includes(query) ||
             post.description.includes(query) ||
             post.date.includes(query);
    });

    // Update display
    postsData.forEach(post => {
      if (filteredPosts.includes(post)) {
        post.element.style.display = 'block';
      } else {
        post.element.style.display = 'none';
      }
    });

    // Show no results message if needed
    if (filteredPosts.length === 0 && noResults) {
      noResults.style.display = 'block';
    } else if (noResults) {
      noResults.style.display = 'none';
    }

    // Update search results count
    updateSearchResults(filteredPosts.length, query);
  }, 300));

  function updateSearchResults(count, query) {
    if (!searchResults) return;

    if (query === '') {
      hideSearchResults();
      return;
    }

    const message = count === 0
      ? `No posts found for "${query}"`
      : `Found ${count} post${count === 1 ? '' : 's'} for "${query}"`;

    searchResults.textContent = message;
    searchResults.style.display = 'block';
  }

  function hideSearchResults() {
    if (searchResults) {
      searchResults.style.display = 'none';
    }
    if (noResults) {
      noResults.style.display = 'none';
    }
  }

  // Debounce utility
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
});