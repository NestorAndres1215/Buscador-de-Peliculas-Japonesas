const API_URL = 'https://ghibliapi.vercel.app/films';
let allMovies = [];
let currentPage = 1;
const moviesPerPage = 12;

// Fetch movies when page loads
document.addEventListener('DOMContentLoaded', fetchMovies);

async function fetchMovies() {
    try {
        showLoading(true);
        
        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        
        allMovies = await response.json();
        
        // Add some calculated properties
        allMovies = allMovies.map(movie => {
            // Convert RT score to a number and normalize it if needed
            const rtScore = parseFloat(movie.rt_score) || 0;
            
            return {
                ...movie,
                rtScore,
                year: parseInt(movie.release_date) || 0
            };
        });
        
        // Update movie stats
        document.getElementById('movie-stats').textContent = `${allMovies.length} películas encontradas`;
        
        // Populate directors filter
        populateDirectorsFilter();
        
        // Display movies
        updateMoviesDisplay();
        
    } catch (error) {
        console.error('Error fetching movies:', error);
        document.getElementById('loading').innerHTML = `
            <i class="fas fa-exclamation-triangle" style="font-size: 2rem; color: #dc3545; margin-bottom: 1rem;"></i>
            <p>Error al cargar las películas. Por favor intenta de nuevo más tarde.</p>
        `;
    }
}

function populateDirectorsFilter() {
    const directorsSet = new Set();
    allMovies.forEach(movie => {
        if (movie.director) {
            directorsSet.add(movie.director);
        }
    });
    
    const directorFilter = document.getElementById('genre-filter');
    const directors = Array.from(directorsSet).sort();
    
    directors.forEach(director => {
        const option = document.createElement('option');
        option.value = director;
        option.textContent = director;
        directorFilter.appendChild(option);
    });
}

function searchMovies() {
    currentPage = 1;
    updateMoviesDisplay();
}

function filterAndSortMovies() {
    currentPage = 1;
    updateMoviesDisplay();
}

function updateMoviesDisplay() {
    const searchQuery = document.getElementById('search').value.toLowerCase().trim();
    const directorFilter = document.getElementById('genre-filter').value;
    const sortOption = document.getElementById('sort').value;
    
    // Filter movies
    let filteredMovies = allMovies.filter(movie => {
        const titleMatch = movie.title.toLowerCase().includes(searchQuery) || 
                         (movie.original_title && movie.original_title.toLowerCase().includes(searchQuery));
        
        const directorMatch = !directorFilter || movie.director === directorFilter;
        
        return titleMatch && directorMatch;
    });
    
    // Sort movies
    if (sortOption) {
        filteredMovies = sortMovies(filteredMovies, sortOption);
    }
    
    // Update movie stats
    document.getElementById('movie-stats').textContent = `${filteredMovies.length} de ${allMovies.length} películas encontradas`;
    
    // Apply pagination
    const totalPages = Math.ceil(filteredMovies.length / moviesPerPage);
    const startIndex = (currentPage - 1) * moviesPerPage;
    const endIndex = startIndex + moviesPerPage;
    const currentMovies = filteredMovies.slice(startIndex, endIndex);
    
    // Display movies or no results message
    if (filteredMovies.length === 0) {
        document.getElementById('no-results').style.display = 'block';
        document.getElementById('movies').style.display = 'none';
        document.getElementById('pagination').innerHTML = '';
    } else {
        document.getElementById('no-results').style.display = 'none';
        document.getElementById('movies').style.display = 'grid';
        displayMovies(currentMovies);
        
        // Update pagination if needed
        if (totalPages > 1) {
            createPagination(totalPages);
        } else {
            document.getElementById('pagination').innerHTML = '';
        }
    }
    
    showLoading(false);
}

function sortMovies(movies, sortOption) {
    const sortedMovies = [...movies];
    
    switch (sortOption) {
        case 'year_asc':
            sortedMovies.sort((a, b) => a.year - b.year);
            break;
        case 'year_desc':
            sortedMovies.sort((a, b) => b.year - a.year);
            break;
        case 'title_asc':
            sortedMovies.sort((a, b) => a.title.localeCompare(b.title));
            break;
        case 'title_desc':
            sortedMovies.sort((a, b) => b.title.localeCompare(a.title));
            break;
        case 'score_desc':
            sortedMovies.sort((a, b) => b.rtScore - a.rtScore);
            break;
        case 'score_asc':
            sortedMovies.sort((a, b) => a.rtScore - b.rtScore);
            break;
    }
    
    return sortedMovies;
}

function displayMovies(movies) {
    const moviesContainer = document.getElementById('movies');
    moviesContainer.innerHTML = '';
    
    movies.forEach(movie => {
        const movieCard = document.createElement('div');
        movieCard.classList.add('movie-card');
        movieCard.onclick = () => openMovieModal(movie);
        
        // Format duration to hours and minutes
        const durationMinutes = parseInt(movie.running_time) || 0;
        const hours = Math.floor(durationMinutes / 60);
        const minutes = durationMinutes % 60;
        const duration = hours > 0 
            ? `${hours}h ${minutes > 0 ? `${minutes}m` : ''}`
            : `${minutes}m`;
        
        movieCard.innerHTML = `
            <div class="movie-img-container">
                <img src="${movie.image}" class="movie-img" alt="${movie.title}">
                <div class="movie-rating">
                    <i class="fas fa-star"></i> ${movie.rtScore}%
                </div>
            </div>
            <div class="movie-body">
                <h3 class="movie-title">${movie.title}</h3>
                <div class="movie-info">
                    <span>${movie.release_date}</span>
                    <span>${duration}</span>
                </div>
                <p class="movie-description">${movie.description.substring(0, 100)}...</p>
                <span class="movie-link">Ver detalles <i class="fas fa-chevron-right"></i></span>
            </div>
        `;
        
        moviesContainer.appendChild(movieCard);
    });
}

function createPagination(totalPages) {
    const paginationContainer = document.getElementById('pagination');
    paginationContainer.innerHTML = '';
    
    // Previous button
    const prevButton = document.createElement('div');
    prevButton.classList.add('page-item');
    if (currentPage === 1) prevButton.classList.add('disabled');
    prevButton.innerHTML = `<a class="page-link" href="#" ${currentPage !== 1 ? 'onclick="changePage(' + (currentPage - 1) + ')"' : ''}><i class="fas fa-chevron-left"></i></a>`;
    paginationContainer.appendChild(prevButton);
    
    // Page numbers
    const maxPagesToShow = 5;
    let startPage = Math.max(currentPage - Math.floor(maxPagesToShow / 2), 1);
    let endPage = Math.min(startPage + maxPagesToShow - 1, totalPages);
    
    if (endPage - startPage + 1 < maxPagesToShow) {
        startPage = Math.max(endPage - maxPagesToShow + 1, 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        const pageItem = document.createElement('div');
        pageItem.classList.add('page-item');
        if (i === currentPage) pageItem.classList.add('active');
        pageItem.innerHTML = `<a class="page-link" href="#" onclick="changePage(${i})">${i}</a>`;
        paginationContainer.appendChild(pageItem);
    }
    
    // Next button
    const nextButton = document.createElement('div');
    nextButton.classList.add('page-item');
    if (currentPage === totalPages) nextButton.classList.add('disabled');
    nextButton.innerHTML = `<a class="page-link" href="#" ${currentPage !== totalPages ? 'onclick="changePage(' + (currentPage + 1) + ')"' : ''}><i class="fas fa-chevron-right"></i></a>`;
    paginationContainer.appendChild(nextButton);
}

function changePage(page) {
    currentPage = page;
    updateMoviesDisplay();
    window.scrollTo({
        top: document.getElementById('movies').offsetTop - 100,
        behavior: 'smooth'
    });
}

function showLoading(show) {
    document.getElementById('loading').style.display = show ? 'block' : 'none';
    if (show) {
        document.getElementById('movies').style.display = 'none';
        document.getElementById('no-results').style.display = 'none';
    }
}

function openMovieModal(movie) {
    // Format duration to hours and minutes
    const durationMinutes = parseInt(movie.running_time) || 0;
    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;
    const duration = hours > 0 
        ? `${hours}h ${minutes > 0 ? `${minutes}m` : ''}`
        : `${minutes}m`;
    
    // Set modal content
    document.getElementById('modal-backdrop').src = movie.movie_banner || movie.image;
    document.getElementById('modal-title').textContent = movie.title;
    
    document.getElementById('modal-info').innerHTML = `
        <span><i class="fas fa-calendar"></i> ${movie.release_date}</span>
        <span><i class="fas fa-clock"></i> ${duration}</span>
        <span><i class="fas fa-star"></i> ${movie.rtScore}%</span>
    `;
    
    document.getElementById('modal-body').innerHTML = `
        <div class="modal-section">
            <h3>Sinopsis</h3>
            <p>${movie.description}</p>
        </div>
        
        <div class="modal-section">
            <h3>Detalles</h3>
            <p><strong>Director:</strong> ${movie.director}</p>
            <p><strong>Productor:</strong> ${movie.producer}</p>
            <p><strong>Título original:</strong> ${movie.original_title} (${movie.original_title_romanised})</p>
        </div>
    `;
    
    // Show modal
    document.getElementById('movie-modal').style.display = 'block';
    document.body.style.overflow = 'hidden'; // Prevent scrolling
}

function closeModal() {
    document.getElementById('movie-modal').style.display = 'none';
    document.body.style.overflow = 'auto'; // Restore scrolling
}

// Close modal when clicking outside of modal content
window.onclick = function(event) {
    const modal = document.getElementById('movie-modal');
    if (event.target === modal) {
        closeModal();
    }
}