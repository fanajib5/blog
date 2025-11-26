// GitHub API Integration for Social Proof
document.addEventListener('DOMContentLoaded', async function() {
  const githubElements = {
    followers: document.querySelector('.github-followers'),
    repos: document.querySelector('.github-repos'),
    stars: document.querySelector('.github-stars'),
    contributions: document.querySelector('.github-contributions'),
    lastCommit: document.querySelector('.github-last-commit')
  };

  // Only proceed if we have at least one GitHub element
  const hasGithubElements = Object.values(githubElements).some(el => el !== null);
  if (!hasGithubElements) return;

  const username = 'fanajib5'; // Your GitHub username

  try {
    const data = await fetchGitHubData(username);
    updateGitHubElements(data);
  } catch (error) {
    console.warn('Could not fetch GitHub data:', error);
    // Optionally show fallback values or error states
  }
});

async function fetchGitHubData(username) {
  const githubToken = ''; // Optional: Add your personal access token for higher rate limits

  const headers = {
    'Accept': 'application/vnd.github.v3+json'
  };

  if (githubToken) {
    headers['Authorization'] = `token ${githubToken}`;
  }

  // Fetch user data and public repos in parallel
  const [userResponse, reposResponse] = await Promise.all([
    fetch(`https://api.github.com/users/${username}`, { headers }),
    fetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`, { headers })
  ]);

  if (!userResponse.ok || !reposResponse.ok) {
    throw new Error('GitHub API request failed');
  }

  const userData = await userResponse.json();
  const reposData = await reposResponse.json();

  // Calculate total stars
  const totalStars = reposData.reduce((sum, repo) => sum + repo.stargazers_count, 0);

  // Get last commit date from recent activity
  const eventsResponse = await fetch(`https://api.github.com/users/${username}/events/public?per_page=1`, { headers });
  let lastCommitDate = null;

  if (eventsResponse.ok) {
    const eventsData = await eventsResponse.json();
    if (eventsData.length > 0) {
      lastCommitDate = new Date(eventsData[0].created_at);
    }
  }

  return {
    followers: userData.followers,
    publicRepos: userData.public_repos,
    totalStars: totalStars,
    lastCommit: lastCommitDate,
    avatarUrl: userData.avatar_url,
    profileUrl: userData.html_url
  };
}

function updateGitHubElements(data) {
  const { followers, publicRepos, totalStars, lastCommit, avatarUrl, profileUrl } = data;

  // Update followers count
  const followersEl = document.querySelector('.github-followers');
  if (followersEl) {
    followersEl.textContent = formatNumber(followers);
  }

  // Update repos count
  const reposEl = document.querySelector('.github-repos');
  if (reposEl) {
    reposEl.textContent = formatNumber(publicRepos);
  }

  // Update stars count
  const starsEl = document.querySelector('.github-stars');
  if (starsEl) {
    starsEl.textContent = formatNumber(totalStars);
  }

  // Update last commit
  const lastCommitEl = document.querySelector('.github-last-commit');
  if (lastCommitEl && lastCommit) {
    const timeAgo = getTimeAgo(lastCommit);
    lastCommitEl.textContent = timeAgo;
    lastCommitEl.setAttribute('title', lastCommit.toLocaleDateString());
  }

  // Update avatar
  const avatarEl = document.querySelector('.github-avatar');
  if (avatarEl && avatarUrl) {
    avatarEl.src = avatarUrl;
    avatarEl.alt = 'GitHub Avatar';
  }

  // Update profile link
  const profileLinkEl = document.querySelector('.github-profile-link');
  if (profileLinkEl && profileUrl) {
    profileLinkEl.href = profileUrl;
  }
}

function formatNumber(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);

  let interval = Math.floor(seconds / 31536000);
  if (interval >= 1) {
    return interval === 1 ? '1 year ago' : `${interval} years ago`;
  }

  interval = Math.floor(seconds / 2592000);
  if (interval >= 1) {
    return interval === 1 ? '1 month ago' : `${interval} months ago`;
  }

  interval = Math.floor(seconds / 86400);
  if (interval >= 1) {
    return interval === 1 ? '1 day ago' : `${interval} days ago`;
  }

  interval = Math.floor(seconds / 3600);
  if (interval >= 1) {
    return interval === 1 ? '1 hour ago' : `${interval} hours ago`;
  }

  interval = Math.floor(seconds / 60);
  if (interval >= 1) {
    return interval === 1 ? '1 minute ago' : `${interval} minutes ago`;
  }

  return 'Just now';
}