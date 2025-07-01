const apiKey = "75a7e89329586e64789c4a51059f24ba";
const baseUrl = "https://api.themoviedb.org/3";
const imageBaseUrl = "https://image.tmdb.org/t/p/w500";
const mainContent = document.getElementById("mainContent");
const searchBox = document.getElementById("searchBox");
const suggestionsBox = document.getElementById("suggestions");
const goHollywoodBtn = document.getElementById("goHollywoodBtn");
const goBollywoodBtn = document.getElementById("goBollywoodBtn");

// Track current language (default: English)
let currentLanguage = "en";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBheoLlOSdjle4CCZpb1vLtg4R1OWyE5bQ",
  authDomain: "watch-this-f0b71.firebaseapp.com",
  projectId: "watch-this-f0b71",
  storageBucket: "watch-this-f0b71.firebasestorage.app",
  messagingSenderId: "1008946322583",
  appId: "1:1008946322583:web:dee56d71e612d35001ddd2",
  measurementId: "G-6TVXR7Y6QJ"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// Initialize particles animation
function createParticles() {
  const particlesContainer = document.createElement('div');
  particlesContainer.className = 'particles';
  document.body.appendChild(particlesContainer);

  for (let i = 0; i < 50; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.left = Math.random() * 100 + '%';
    particle.style.animationDelay = Math.random() * 15 + 's';
    particle.style.animationDuration = (Math.random() * 10 + 10) + 's';
    particlesContainer.appendChild(particle);
  }
}

// Initialize particles on page load
document.addEventListener('DOMContentLoaded', createParticles);

// Enhanced fetch functions with better error handling and loading states
async function fetchGenres() {
  try {
    showLoadingState();
    const response = await fetch(`${baseUrl}/genre/movie/list?api_key=${apiKey}&language=${currentLanguage}`);
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    const data = await response.json();
    console.log(`Fetched genres (${currentLanguage}):`, data.genres);
    return data.genres || [];
  } catch (error) {
    console.error("Error fetching genres:", error);
    showErrorState("Failed to load genres");
    return [];
  }
}

async function fetchMoviesByGenre(genreId, page = 1) {
  try {
    const response = await fetch(`${baseUrl}/discover/movie?api_key=${apiKey}&with_genres=${genreId}&page=${page}&with_original_language=${currentLanguage}`);
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    const data = await response.json();
    console.log(`Movies for genre ${genreId} (${currentLanguage}):`, data.results);
    return data.results || [];
  } catch (error) {
    console.error(`Error fetching movies for genre ${genreId}:`, error);
    return [];
  }
}

async function fetchSeriesByGenre(genreId, page = 1) {
  try {
    const response = await fetch(`${baseUrl}/discover/tv?api_key=${apiKey}&with_genres=${genreId}&page=${page}&with_original_language=${currentLanguage}&with_networks=213|8|9`);
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    const data = await response.json();
    console.log(`Series for genre ${genreId} (${currentLanguage}):`, data.results);
    return data.results || [];
  } catch (error) {
    console.error(`Error fetching series for genre ${genreId}:`, error);
    return [];
  }
}

async function fetchLatestSeries(page = 1) {
  try {
    const response = await fetch(`${baseUrl}/discover/tv?api_key=${apiKey}&page=${page}&with_original_language=${currentLanguage}&with_networks=213|8|9&sort_by=popularity.desc`);
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    const data = await response.json();
    console.log(`Latest series (${currentLanguage}):`, data.results);
    return data.results || [];
  } catch (error) {
    console.error("Error fetching latest series:", error);
    return [];
  }
}

// Enhanced UI functions with animations
function createCategorySection(genreName) {
  if (!mainContent) {
    console.error("Cannot create section: mainContent is null");
    return null;
  }

  const section = document.createElement("section");
  section.classList.add("category-section", "fade-in");

  const title = document.createElement("h2");
  title.classList.add("category-title");
  title.textContent = genreName;

  const catalogContainer = document.createElement("div");
  catalogContainer.classList.add("movie-catalog");

  const leftArrow = document.createElement("button");
  leftArrow.classList.add("scroll-arrow", "left");
  leftArrow.innerHTML = "←";
  leftArrow.onclick = () => scrollCatalog(catalogContainer, -300);
  leftArrow.setAttribute('aria-label', 'Scroll left');

  const rightArrow = document.createElement("button");
  rightArrow.classList.add("scroll-arrow", "right");
  rightArrow.innerHTML = "→";
  rightArrow.onclick = () => scrollCatalog(catalogContainer, 300);
  rightArrow.setAttribute('aria-label', 'Scroll right');

  section.appendChild(title);
  section.appendChild(catalogContainer);
  section.appendChild(leftArrow);
  section.appendChild(rightArrow);

  mainContent.appendChild(section);
  console.log(`Created section: ${genreName}`);
  return catalogContainer;
}

function scrollCatalog(catalog, distance) {
  if (catalog) {
    catalog.scrollBy({ 
      left: distance, 
      behavior: "smooth" 
    });
  }
}

async function loadMedia(catalog, genreId) {
  if (!catalog) return;

  // Show skeleton loading
  showSkeletonCards(catalog);

  const movies = await fetchMoviesByGenre(genreId);
  const series = await fetchSeriesByGenre(genreId);
  const combinedItems = [
    ...movies.map(item => ({ ...item, mediaType: 'movie' })),
    ...series.map(item => ({ ...item, mediaType: 'series' }))
  ].slice(0, 20);

  // Clear skeleton loading
  catalog.innerHTML = "";

  if (combinedItems.length === 0) {
    console.warn(`No media found for genre ${genreId} in ${currentLanguage}`);
    catalog.innerHTML = "<p class='no-content'>No content available in this language.</p>";
    return;
  }

  combinedItems.forEach((item, index) => {
    const card = document.createElement("div");
    card.classList.add("movie-card", "fade-in");
    card.style.animationDelay = `${index * 0.1}s`;
    
    card.innerHTML = `
      <img 
        src="${imageBaseUrl}${item.poster_path || '/placeholder.jpg'}" 
        alt="${item.title || item.name}"
        loading="lazy"
        onerror="this.src='https://via.placeholder.com/280x350/1a1a1a/ffffff?text=No+Image'"
      />
      <div class="details">
        <div class="title">${item.title || item.name}</div>
        <div class="year">${new Date(item.release_date || item.first_air_date).getFullYear() || 'N/A'}</div>
        <div class="media-type">${item.mediaType === 'movie' ? 'Movie' : 'Series'}</div>
      </div>
    `;
    
    card.onclick = () => {
      // Add click animation
      card.style.transform = 'scale(0.95)';
      setTimeout(() => {
        window.location.href = `movie.html?id=${item.id}&type=${item.mediaType}`;
      }, 150);
    };
    
    catalog.appendChild(card);
  });
}

async function loadLatestSeries(catalog) {
  if (!catalog) return;

  showSkeletonCards(catalog);

  const series = await fetchLatestSeries();
  
  catalog.innerHTML = "";

  if (series.length === 0) {
    console.warn(`No latest series found in ${currentLanguage}`);
    catalog.innerHTML = "<p class='no-content'>No latest series available in this language.</p>";
    return;
  }

  series.slice(0, 20).forEach((item, index) => {
    const card = document.createElement("div");
    card.classList.add("movie-card", "fade-in");
    card.style.animationDelay = `${index * 0.1}s`;
    
    card.innerHTML = `
      <img 
        src="${imageBaseUrl}${item.poster_path || '/placeholder.jpg'}" 
        alt="${item.name}"
        loading="lazy"
        onerror="this.src='https://via.placeholder.com/280x350/1a1a1a/ffffff?text=No+Image'"
      />
      <div class="details">
        <div class="title">${item.name}</div>
        <div class="year">${new Date(item.first_air_date).getFullYear() || 'N/A'}</div>
        <div class="media-type">Series</div>
      </div>
    `;
    
    card.onclick = () => {
      card.style.transform = 'scale(0.95)';
      setTimeout(() => {
        window.location.href = `movie.html?id=${item.id}&type=series`;
      }, 150);
    };
    
    catalog.appendChild(card);
  });
}

function showSkeletonCards(catalog) {
  catalog.innerHTML = "";
  for (let i = 0; i < 8; i++) {
    const skeleton = document.createElement("div");
    skeleton.classList.add("movie-card", "skeleton");
    skeleton.style.height = "400px";
    catalog.appendChild(skeleton);
  }
}

function showLoadingState() {
  if (mainContent) {
    mainContent.innerHTML = `
      <div class="loading-container" style="text-align: center; padding: 60px;">
        <div class="loading-spinner" style="width: 60px; height: 60px; border: 4px solid rgba(0, 125, 243, 0.3); border-top: 4px solid var(--primary-blue); border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px;"></div>
        <p style="font-size: 1.2rem; color: var(--text-secondary);">Loading amazing content...</p>
      </div>
    `;
  }
}

function showErrorState(message) {
  if (mainContent) {
    mainContent.innerHTML = `
      <div class="error-container" style="text-align: center; padding: 60px;">
        <div style="font-size: 3rem; margin-bottom: 20px;">😔</div>
        <h2 style="color: var(--red); margin-bottom: 10px;">Oops! Something went wrong</h2>
        <p style="color: var(--text-secondary); margin-bottom: 20px;">${message}</p>
        <button onclick="location.reload()" style="background: var(--gradient-primary); color: white; border: none; padding: 12px 24px; border-radius: 25px; cursor: pointer; font-weight: 600;">Try Again</button>
      </div>
    `;
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

async function loadGenresAndMovies() {
  if (!mainContent) {
    console.error("mainContent is null, cannot load content");
    return;
  }

  try {
    showLoadingState();

    // Load Latest Series first
    const latestCatalog = createCategorySection("🔥 Latest Series");
    if (latestCatalog) await loadLatestSeries(latestCatalog);

    // Load genre categories
    const genres = await fetchGenres();
    if (genres.length === 0) {
      showErrorState("No genres available");
      return;
    }

    for (const genre of genres.slice(0, 8)) { // Limit to 8 genres for better performance
      const catalog = createCategorySection(`🎬 ${genre.name}`);
      if (catalog) await loadMedia(catalog, genre.id);
    }
  } catch (error) {
    console.error("Error in loadGenresAndMovies:", error);
    showErrorState("Failed to load content. Please try again.");
  }
}

// Enhanced search with debouncing
let searchTimeout;
async function fetchSuggestions(event) {
  if (!suggestionsBox) return;

  const query = event.target.value.trim();
  
  // Clear previous timeout
  clearTimeout(searchTimeout);
  
  if (query.length < 3) {
    suggestionsBox.innerHTML = "";
    return;
  }

  // Debounce search requests
  searchTimeout = setTimeout(async () => {
    try {
      suggestionsBox.innerHTML = '<div class="suggestion-item">Searching...</div>';

      const movieResponse = await fetch(`${baseUrl}/search/movie?api_key=${apiKey}&query=${encodeURIComponent(query)}&with_original_language=${currentLanguage}`);
      const movieData = await movieResponse.json();

      const seriesResponse = await fetch(`${baseUrl}/search/tv?api_key=${apiKey}&query=${encodeURIComponent(query)}&with_original_language=${currentLanguage}&with_networks=213|8|9`);
      const seriesData = await seriesResponse.json();

      const combinedResults = [
        ...movieData.results.slice(0, 5).map(movie => ({ ...movie, mediaType: 'movie' })),
        ...seriesData.results.slice(0, 5).map(series => ({ ...series, mediaType: 'series' }))
      ];

      if (combinedResults.length === 0) {
        suggestionsBox.innerHTML = '<div class="suggestion-item">No results found</div>';
        return;
      }

      suggestionsBox.innerHTML = combinedResults
        .map(item => `
          <div class="suggestion-item" onclick="redirectToSearchPage('${query}')">
            <strong>${item.title || item.name}</strong>
            <span style="color: var(--text-muted); margin-left: 10px;">
              (${new Date(item.release_date || item.first_air_date).getFullYear() || 'N/A'}) - ${item.mediaType === 'movie' ? 'Movie' : 'Series'}
            </span>
          </div>
        `)
        .join("");
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      suggestionsBox.innerHTML = '<div class="suggestion-item">Error loading suggestions</div>';
    }
  }, 300);
}

function redirectToSearchPage(query) {
  window.location.href = `search.html?query=${encodeURIComponent(query)}`;
}

function performSearch(event) {
  if (event.key === "Enter") {
    const query = searchBox.value.trim();
    if (query.length >= 3) {
      window.open(`search.html?query=${encodeURIComponent(query)}`, '_blank');
    }
  }
}

// Enhanced language switching with smooth transitions
function switchToEnglish() {
  if (currentLanguage === "en") return;
  
  currentLanguage = "en";
  goHollywoodBtn.classList.add("active");
  goBollywoodBtn.classList.remove("active");
  
  // Add transition effect
  mainContent.style.opacity = "0.5";
  setTimeout(() => {
    loadGenresAndMovies().then(() => {
      mainContent.style.opacity = "1";
    });
  }, 200);
}

function switchToHindi() {
  if (currentLanguage === "hi") return;
  
  currentLanguage = "hi";
  goBollywoodBtn.classList.add("active");
  goHollywoodBtn.classList.remove("active");
  
  // Add transition effect
  mainContent.style.opacity = "0.5";
  setTimeout(() => {
    loadGenresAndMovies().then(() => {
      mainContent.style.opacity = "1";
    });
  }, 200);
}

// Enhanced mobile menu functionality
const menuToggle = document.querySelector('.mobile-menu-toggle');
const menuContainer = document.querySelector('.menu-container');

if (menuToggle && menuContainer) {
  menuToggle.addEventListener('click', () => {
    menuToggle.classList.toggle('active');
    menuContainer.classList.toggle('active');
    
    // Prevent body scroll when menu is open
    document.body.style.overflow = menuContainer.classList.contains('active') ? 'hidden' : '';
  });

  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    if (!menuContainer.contains(e.target) && !menuToggle.contains(e.target)) {
      menuToggle.classList.remove('active');
      menuContainer.classList.remove('active');
      document.body.style.overflow = '';
    }
  });
}

// Enhanced user menu functionality
const userBadge = document.querySelector('.user-badge');
const userMenu = document.getElementById('userMenu');

if (userBadge && userMenu) {
  userBadge.addEventListener('click', (e) => {
    e.stopPropagation();
    userMenu.classList.toggle('active');
  });

  document.addEventListener('click', (e) => {
    if (!userMenu.contains(e.target) && !userBadge.contains(e.target)) {
      userMenu.classList.remove('active');
    }
  });
}

// Enhanced search toggle functionality
const searchToggle = document.querySelector('.search-toggle');
const searchContainer = document.querySelector('.search-container');

if (searchToggle && searchContainer) {
  searchToggle.addEventListener('click', () => {
    searchContainer.classList.toggle('active');
    if (searchContainer.classList.contains('active')) {
      setTimeout(() => {
        document.getElementById('searchBox')?.focus();
      }, 300);
    }
  });
}

function hideSearch() {
  setTimeout(() => {
    if (!document.activeElement?.closest('.search-container')) {
      searchContainer?.classList.remove('active');
    }
  }, 100);
}

// Enhanced authentication handling
function displayGreeting() {
  const greetingElement = document.getElementById('greeting');
  if (!greetingElement) return;

  const user = auth.currentUser;
  if (user) {
    const username = user.email.split('@')[0];
    greetingElement.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; gap: 10px;">
        <div style="font-size: 1.2rem; font-weight: 700; background: var(--gradient-primary); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
          Welcome, ${username}
        </div>
        <button onclick="logout()" class="logout-btn">Logout</button>
      </div>
    `;
  } else {
    greetingElement.innerHTML = `
      <a href="login.html" style="color: var(--text-primary); text-decoration: none; font-size: 1.2rem; font-weight: 600; padding: 8px 16px; background: var(--glass-bg); border-radius: 20px; border: 1px solid var(--glass-border); transition: var(--transition-smooth);" 
         onmouseover="this.style.background='var(--glass-bg-hover)'; this.style.transform='translateY(-2px)'"
         onmouseout="this.style.background='var(--glass-bg)'; this.style.transform='translateY(0)'">
        Log In
      </a>
    `;
  }
}

auth.onAuthStateChanged(function(user) {
  displayGreeting();
});

function logout() {
  auth.signOut().then(function() {
    // Add logout animation
    document.body.style.opacity = '0.5';
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 300);
  }).catch(function(error) {
    alert('Error logging out: ' + error.message);
  });
}

// Enhanced currently watching functionality
async function renderCurrentlyWatching() {
  const container = document.getElementById("currentlyWatchingContainer");
  const data = JSON.parse(localStorage.getItem("lastWatched"));
  if (!data || !container) return;

  try {
    const endpoint = data.mediaType === 'movie' ? 'movie' : 'tv';
    const response = await fetch(`https://api.themoviedb.org/3/${endpoint}/${data.mediaId}?api_key=${apiKey}`);
    if (!response.ok) throw new Error("Failed to fetch media data");

    const media = await response.json();
    const backgroundImage = media.backdrop_path 
      ? `https://image.tmdb.org/t/p/w1280${media.backdrop_path}` 
      : `https://image.tmdb.org/t/p/w500${media.poster_path}`;

    const title = media.title || media.name || data.title || "Unknown Title";
    const seasonInfo = data.season ? `Season ${data.season}, Episode ${data.episode}` : "";
    const type = data.mediaType;

    container.innerHTML = `
      <div class="currently-watching fade-in" style="background-image: linear-gradient(135deg, rgba(0, 0, 0, 0.7), rgba(0, 125, 243, 0.1)), url('${backgroundImage}');">
        <div class="overlay">
          <h2>${title}</h2>
          <p>${seasonInfo}</p>
          <button onclick="event.stopPropagation(); continueWatching('${data.mediaId}', '${type}', '${data.season || ''}', '${data.episode || ''}')">
            ▶ Continue Watching
          </button>
        </div>
      </div>
    `;
  } catch (error) {
    console.error("Error rendering last watched:", error);
    container.innerHTML = `
      <div class="currently-watching fade-in">
        <div class="overlay">
          <h2>Unable to load last watched</h2>
          <p>Please try again later</p>
        </div>
      </div>
    `;
  }
}

function continueWatching(id, type, season = '', episode = '') {
  localStorage.setItem('autoplay', JSON.stringify({ id, type, season, episode }));
  window.location.href = `movie.html?id=${id}&type=${type}`;
}

async function loadLastWatchedFromFirebase() {
  if (!auth.currentUser) {
    renderCurrentlyWatching();
    return;
  }

  try {
    const doc = await db.collection('users').doc(auth.currentUser.uid).get();
    const data = doc.data();
    if (data?.lastWatched) {
      localStorage.setItem('lastWatched', JSON.stringify(data.lastWatched));
    }
  } catch (error) {
    console.error("Error fetching last watched:", error);
  } finally {
    renderCurrentlyWatching();
  }
}

// Event listeners
if (goHollywoodBtn) goHollywoodBtn.addEventListener("click", switchToEnglish);
if (goBollywoodBtn) goBollywoodBtn.addEventListener("click", switchToHindi);

// Enhanced page load with smooth animations
document.addEventListener('DOMContentLoaded', () => {
  // Add initial page load animation
  document.body.style.opacity = '0';
  setTimeout(() => {
    document.body.style.transition = 'opacity 0.5s ease';
    document.body.style.opacity = '1';
  }, 100);

  // Initialize everything
  loadLastWatchedFromFirebase();
  loadGenresAndMovies();
});

// Add smooth scroll behavior
document.documentElement.style.scrollBehavior = 'smooth';

// Enhanced error handling for images
document.addEventListener('error', (e) => {
  if (e.target.tagName === 'IMG') {
    e.target.src = 'https://via.placeholder.com/280x350/1a1a1a/ffffff?text=No+Image';
  }
}, true);

// Add intersection observer for lazy loading animations
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('fade-in');
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

// Observe elements for animation
setTimeout(() => {
  document.querySelectorAll('.movie-card, .category-section').forEach(el => {
    observer.observe(el);
  });
}, 1000);