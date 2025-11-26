// Reading Time Calculator
// Based on average reading speed of 200 words per minute

function calculateReadingTime(text) {
  if (!text) return 0;

  // Remove HTML tags and count words
  const plainText = text.replace(/<[^>]*>/g, '');
  const words = plainText.split(/\s+/).filter(word => word.length > 0);
  const wordCount = words.length;

  // Average reading speed: 200 words per minute
  const wordsPerMinute = 200;
  const readingTime = Math.ceil(wordCount / wordsPerMinute);

  return Math.max(1, readingTime); // Minimum 1 minute
}

function formatReadingTime(minutes) {
  return `${minutes} min read`;
}

module.exports = {
  calculateReadingTime,
  formatReadingTime
};