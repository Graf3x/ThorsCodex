const pageSize = 10;
let currentPage = 1;
let currentContinuationToken = null;


/**
 * Converts seconds to M:SS format
 * @param {number} seconds
 * @returns {string}
 */
export function formatTimestamp(seconds) {
  if (!seconds && seconds !== 0) return '0:00';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Initializes the search functionality.
 * @param {Object} config - Configuration with element IDs
 */
export function setupSearch(config) {
  const {
    inputId,
    buttonId,
    spinnerId,
    resultsId,
    paginationId,
  } = config;

  const searchInput = document.getElementById(inputId);
  const searchButton = document.getElementById(buttonId);
  const spinner = document.getElementById(spinnerId);
  const resultsContainer = document.getElementById(resultsId);
  const paginationDiv = document.getElementById(paginationId);
  const showMoreButton = document.getElementById('showMore');
  const errorMessage = document.createElement('div');
  errorMessage.className = 'error-message';
  errorMessage.textContent = 'Please enter a search term';
  searchInput.parentNode.insertBefore(errorMessage, searchInput.nextSibling);

  function validateInput() {
    if (!searchInput.value.trim()) {
      searchInput.classList.add('bounce');
      errorMessage.classList.add('show');
      
      setTimeout(() => {
        searchInput.classList.remove('bounce');
      }, 500);
      
      setTimeout(() => {
        errorMessage.classList.remove('show');
      }, 3000);
      
      return false;
    }
    return true;
  }
  showMoreButton.addEventListener('click', () => {
    showMoreButton.innerText = 'Loading...';
    searchTranscripts(true);
  });

  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      if (validateInput()) {searchTranscripts();}
    }
  });

  searchButton.addEventListener('click', () => {
    if (validateInput()) {
      searchTranscripts();
    }
  });

  /**
   * Performs the actual search and updates UI elements.
   * @param {number} page - Page number to query
   */
  async function searchTranscripts(appendResults = false) {
    searchInput.disabled = true;
    searchButton.disabled = true;
    showMoreButton.disabled = true;
    
    // Update button text based on which action triggered the search
    if (appendResults) {
      showMoreButton.innerText = 'Loading...';
    } else {
      searchButton.innerText = 'Searching...';
    }
    
    spinner.style.display = 'block';
    
    if (!appendResults) {
      resultsContainer.innerHTML = '';
      currentPage = 1;
      currentContinuationToken = null;
    }

    try {
      let url = `https://odin.thorscodex.com/api/SearchAllFatherFullText?query=${encodeURIComponent(
        searchInput.value
      )}&pageSize=${pageSize}`;
      
      if (currentContinuationToken) {
        url += `&continuationToken=${encodeURIComponent(currentContinuationToken)}`;
      }
    
      const response = await fetch(url);
      
      // Handle 404 Not Found case
      if (response.status === 404) {
        resultsContainer.innerHTML = '<div class="text-white text-center mt-4">No results found</div>';
        paginationDiv.classList.add('hidden');
        return;
      }
    
      const data = (await response.json()).value;
      
      // Check if we have results
      if (!data || !data.results || data.results.length === 0) {
        resultsContainer.innerHTML = '<div class="text-white text-center mt-4">No results found</div>';
        paginationDiv.classList.add('hidden');
        return;
      }
    
      currentContinuationToken = data.continuationToken;
      paginationDiv.classList.toggle('hidden', !data.continuationToken);
      showMoreButton.disabled = !data.continuationToken;
    
      if (!appendResults) {
        resultsContainer.innerHTML = '';

      }

      const groupedResults = data.results.reduce((groups, item) => {
        const date = new Date(item.streamDate).toLocaleDateString();
        if (!groups[date]) {
          groups[date] = [];
        }
        groups[date].push(item);
        return groups;
      }, {});

      Object.entries(groupedResults).forEach(([date, results]) => {
        const videoId = results[0].videoUrl.split('v=')[1];
        const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;

        const groupElement = document.createElement('div');
        groupElement.classList.add('bg-white', 'rounded-lg', 'p-4', 'my-4', 'shadow-lg');
        groupElement.innerHTML = `
          <div class="cursor-pointer video-group" 
               data-video-id="${videoId}" 
               data-search-terms="${encodeURIComponent(searchInput.value)}"
               onclick="this.nextElementSibling.classList.toggle('hidden'); this.dispatchEvent(new CustomEvent('loadTranscripts'))">
            <div class="flex flex-col md:flex-row items-center gap-4">
              <img src="${thumbnailUrl}" alt="Video thumbnail" class="w-full md:w-32 rounded-lg object-contain">
              <div class="text-center md:text-left">
                <h3 class="text-md font-semibold">${results[0].videoTitle || 'Untitled Stream'}</h3>
                <p class="text-gray-500">${date} </p>
              </div>
            </div>
          </div>
          <div class="hidden mt-4 pl-4 border-l-2 border-gray-200 transcript-container">
            <div class="loading-spinner hidden">Loading transcripts...</div>
            <div class="transcript-content"></div>
          </div>
        `;
        resultsContainer.appendChild(groupElement);

        const videoGroup = groupElement.querySelector('.video-group');
        videoGroup.addEventListener('loadTranscripts', () => {
          if (!videoGroup.nextElementSibling.querySelector('.transcript-content').innerHTML) {
            loadVideoTranscripts(videoGroup);
          }
        });
      });
    } catch (err) {
      console.error(err);
    } finally {
      searchInput.disabled = false;
      searchButton.disabled = false;
      showMoreButton.disabled = false;
      searchButton.innerText = 'Search';
      showMoreButton.innerText = 'Show More';
      spinner.style.display = 'none';
    }
  }

  

  /**
   * Creates an info tooltip element.
   * @returns {HTMLElement} The tooltip element
   */
  function createInfoTooltip() {
    const tooltipContainer = document.createElement('div');
    tooltipContainer.className = 'tooltip-container';
  
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip invisible group-hover:visible absolute p-2 bg-gray-800 text-sm rounded-lg text-white';
    tooltip.textContent = 'Results are grouped by stream, showing 100 mentions per page';
  
    tooltipContainer.appendChild(tooltip);
    return tooltipContainer;
  }
}

export async function loadVideoTranscripts(videoGroup) {
  const transcriptContainer = videoGroup.nextElementSibling;
  const loadingSpinner = transcriptContainer.querySelector('.loading-spinner');
  const transcriptContent = transcriptContainer.querySelector('.transcript-content');
  
  const videoId = videoGroup.dataset.videoId;
  const searchTerms = decodeURIComponent(videoGroup.dataset.searchTerms);

  try {
    loadingSpinner.classList.remove('hidden');
    transcriptContent.innerHTML = '';

    const response = await fetch(`https://odin.thorscodex.com/api/AskHeimdallForDetails?videoId=${videoId}&terms=${encodeURIComponent(searchTerms)}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch transcripts');
    }

    const data = await response.json();
    const results = data.results || [];
    
    if (results.length === 0) {
      transcriptContent.innerHTML = '<p class="text-gray-500">No transcripts found</p>';
      return;
    }

    // Group results by partNumber
    const groupedResults = results.reduce((acc, result) => {
      const part = result.partNumber || 0;
      if (!acc[part]) {
        acc[part] = {
          transcripts: [],
          summary: result.summary
        };
      }
      acc[part].transcripts.push(result);
      return acc;
    }, {});

    transcriptContent.innerHTML = Object.entries(groupedResults)
      .map(([part, group]) => `
        <div class="transcript-group flex gap-4 mb-2 border-b pb-4">
          <div class="transcript-content flex-1">
            ${group.transcripts.map(result => `
              <div class="py-2">
                <p class="text-gray-600">${result.text}</p>
                <a href="${result.videoUrlWithTimestamp}" 
                   target="_blank"
                   class="text-sm text-blue-500 hover:text-blue-700">
                  Watch at ${formatTimestamp(result.timestampSeconds)}
                </a>
              </div>
            `).join('')}
          </div>
          ${group.summary?.trim() ? `
            <div class="summary-sidebar w-1/2 pl-4 border-l">
              <div class="sticky top-4">
                <h4 class="text-sm font-semibold text-gray-700 mb-2">Context:</h4>
                <p class="text-sm text-gray-600 leading-relaxed">${group.summary}</p>
              </div>
            </div>
          ` : ''}
        </div>
      `).join('');


  } catch (error) {
    console.error('Error loading transcripts:', error);
    transcriptContent.innerHTML = '<p class="text-red-500">Error loading transcripts</p>';
  } finally {
    loadingSpinner.classList.add('hidden');
  }
}