import {jwtDecode} from 'jwt-decode';

document.addEventListener('DOMContentLoaded', () => {
  const userContent = document.getElementById('userContent') as HTMLDivElement;
  const popularGrid = document.getElementById('popularGrid') as HTMLDivElement;
  const searchContainer = document.getElementById('searchContainer') as HTMLDivElement;

  const token = localStorage.getItem('token');
  const refreshToken = localStorage.getItem('refreshToken');
  let userFollowedMangas: Set<number> = new Set();

  if (token) {
    const decodedToken = jwtDecode<{ exp: number }>(token);
    const currentTime = Math.floor(Date.now() / 1000);

    if (decodedToken.exp < currentTime) {
      refreshAccessToken().then(() => {
        continueApp();
      }).catch((error) => {
        console.error('Token refresh error:', error);
        handleNoToken();
      });
    } else {
      continueApp();
    }
  } else {
    handleNoToken();
  }

  async function refreshAccessToken() {
    if (!refreshToken) {
      throw new Error('No refresh token found.');
    }

    const response = await fetch('/api/refresh-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to refresh token.');
    }

    localStorage.setItem('token', data.accessToken);
  }

  function continueApp() {
    const token = localStorage.getItem('token');

    if (token) {
      fetch('/api/user-manga', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(response => response.json())
      .then(mangas => {
        userContent.innerHTML = '<h2>Your Followed Mangas</h2>';
        const grid = document.createElement('div');
        grid.className = 'grid';
        mangas.forEach((manga: any) => {
          userFollowedMangas.add(manga.id);
          const card = createMangaCard(manga, true);
          grid.appendChild(card);
        });
        userContent.appendChild(grid);

        const logoutButton = document.createElement('button');
        logoutButton.textContent = 'Logout';
        logoutButton.className = 'logout-button';
        logoutButton.addEventListener('click', () => {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          window.location.reload();
        });
        userContent.appendChild(logoutButton);
      });
    } else {
      handleNoToken();
    }

    fetchPopularManga();
    initializeSearch();
  }

  function fetchPopularManga() {
    fetch('/api/popular-manga')
      .then(response => response.json())
      .then(mangas => {
        popularGrid.innerHTML = '<h2>Popular Mangas</h2>';
        const grid = document.createElement('div');
        grid.className = 'grid';
        mangas.forEach((manga: any) => {
          const card = createMangaCard(manga, false);
          grid.appendChild(card);
        });
        popularGrid.appendChild(grid);
      });
  }

  function initializeSearch() {
    const searchInput = searchContainer.querySelector('input') as HTMLInputElement;
    const searchDropdown = searchContainer.querySelector('.dropdown') as HTMLDivElement;

    let debounceTimeout: NodeJS.Timeout;

    searchInput.addEventListener('input', () => {
      clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(async () => {
        const query = searchInput.value;
        if (query) {
          try {
            const response = await fetch(`/api/search-manga?query=${query}`);
            const mangas = await response.json();
            searchDropdown.innerHTML = ''; // Clear previous results
            if (mangas.length > 0) {
              searchDropdown.style.display = 'block'; // Show dropdown if there are results
              mangas.slice(0, 5).forEach((manga: any) => { // Ensure only 5 results are displayed
                const item = document.createElement('div');
                item.className = 'dropdown-item';
                item.innerHTML = `
                  <span>${manga.title.english || manga.title.romaji}</span>
                  <img src="${manga.coverImage.large}" alt="${manga.title.english || manga.title.romaji}" style="height: 50px;"/>
                  <span>Chapters: ${manga.chapters || 'N/A'}</span>
                  ${token ? `<button class="follow-button" data-id="${manga.id}">Follow</button>` : ''}
                `;
                item.querySelector('.follow-button')?.addEventListener('click', () => {
                  followManga(manga.id, manga);
                });
                searchDropdown.appendChild(item);
              });
            } else {
              searchDropdown.style.display = 'none'; // Hide dropdown if no results
            }
          } catch (error) {
            console.error('Error fetching data:', error);
          }
        } else {
          searchDropdown.innerHTML = ''; // Clear dropdown if query is empty
          searchDropdown.style.display = 'none'; // Hide dropdown if query is empty
        }
      }, 300); // Debounce delay to avoid too many requests
    });

    document.addEventListener('click', (event) => {
      if (!searchContainer.contains(event.target as Node)) {
        searchDropdown.innerHTML = '';
        searchDropdown.style.display = 'none'; // Hide dropdown when clicking outside
      }
    });
  }

  const followManga = async (mangaId: number, manga: any) => {
    if (!token) {
      alert('Please login to follow manga.');
      return;
    }

    try {
      const response = await fetch('/api/add-manga', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ mangaId })
      });
      if (response.ok) {
        alert('Manga followed successfully.');
        const card = createMangaCard(manga, true);
        document.querySelector('.grid')?.appendChild(card);
        userFollowedMangas.add(mangaId);
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error following manga:', error);
      alert('An error occurred while following the manga.');
    }
  };

  const unfollowManga = async (mangaId: number, card: HTMLDivElement) => {
    if (!token) {
      alert('Please login to unfollow manga.');
      return;
    }

    try {
      const response = await fetch('/api/unfollow-manga', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ mangaId })
      });
      if (response.ok) {
        alert('Manga unfollowed successfully.');
        card.remove();
        userFollowedMangas.delete(mangaId);
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error unfollowing manga:', error);
      alert('An error occurred while unfollowing the manga.');
    }
  };

  function handleNoToken() {
    userContent.innerHTML = '<p>Please <a href="./login.html">login</a> to see your followed mangas.</p>';
    fetchPopularManga();
    initializeSearch();
  }

  function handleTokenError(error: any) {
    console.error('Token error:', error);
    handleNoToken();
  }

  function createMangaCard(manga: any, isFollowed: boolean): HTMLDivElement {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <img src="${manga.cover_url}" alt="${manga.title}">
      <h3>${manga.title}</h3>
      <p>Chapters: ${manga.chapters || 'N/A'}</p>
      <p>Last Updated: ${manga.last_updated ? new Date(manga.last_updated).toLocaleDateString() : 'N/A'}</p>
      <p>Followers: ${manga.follower_count !== undefined ? manga.follower_count : 'N/A'}</p>
      ${isFollowed ? `<button class="unfollow-button" data-id="${manga.id}">Unfollow</button>` : ''}
    `;
    card.querySelector('.unfollow-button')?.addEventListener('click', () => {
      unfollowManga(manga.id, card);
    });
    return card;
  }
});
