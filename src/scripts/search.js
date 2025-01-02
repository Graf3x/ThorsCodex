const pageSize = 100;
let currentPage = 1;
let currentContinuationToken = null;

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
    prevPageId,
    nextPageId,
    pageInfoId,
  } = config;

  const searchInput = document.getElementById(inputId);
  const searchButton = document.getElementById(buttonId);
  const spinner = document.getElementById(spinnerId);
  const resultsContainer = document.getElementById(resultsId);
  const paginationDiv = document.getElementById(paginationId);
  const prevPage = document.getElementById(prevPageId);
  const nextPage = document.getElementById(nextPageId);
  const pageInfo = document.getElementById(pageInfoId);


  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      searchTranscripts();
    }
  });

  searchButton.addEventListener('click', () => searchTranscripts());
  prevPage.addEventListener('click', () => {
    if (currentPage > 1) {
      searchTranscripts(currentPage - 1);
    }
  });
  nextPage.addEventListener('click', () => {
    searchTranscripts(currentPage + 1);
  });

  /**
   * Performs the actual search and updates UI elements.
   * @param {number} page - Page number to query
   */
  async function searchTranscripts(page = 1) {
    searchInput.disabled = true;
    searchButton.disabled = true;
    searchButton.innerText = 'Searching...';
    spinner.style.display = 'block';
    resultsContainer.innerHTML = '';

    try {
      let url = `https://odin.thorscodex.com/api/SearchAllFatherFullText?query=${encodeURIComponent(
        searchInput.value
      )}&pageSize=${pageSize}`;
      
      if (page > 1 && currentContinuationToken) {
        url += `&continuationToken=${encodeURIComponent(currentContinuationToken)}`;
      }
    
      const response = await fetch(url);
      const data = await response.json();
    
      // Store continuation token for next page
      currentContinuationToken = data.continuationToken;
    
      // Show/hide pagination based on continuation token
      paginationDiv.classList.toggle('hidden', !data.continuationToken);
    
      if (data.continuationToken) {
        currentPage = page;
        pageInfo.textContent = `Page ${currentPage}`; // Simple page counter
        prevPage.disabled = currentPage <= 1;
        nextPage.disabled = !data.continuationToken;
      }
    
      // Reset token when starting new search
      if (page === 1) {
        currentContinuationToken = null;
      }

      resultsContainer.innerHTML = '';
      resultsContainer.appendChild(createInfoTooltip());

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
          <div class="cursor-pointer" onclick="this.nextElementSibling.classList.toggle('hidden')">
            <div class="flex flex-col md:flex-row items-center gap-4">
              <img src="${thumbnailUrl}" alt="Video thumbnail" class="w-full md:w-32 rounded-lg">
              <div class="text-center md:text-left">
                <h3 class="text-md font-semibold">${results[0].videoTitle || 'Untitled Stream'}</h3>
                <p class="text-gray-500">${date} - ${results.length} mentions</p>
              </div>
            </div>
          </div>
          <div class="hidden mt-4 pl-4 border-l-2 border-gray-200">
            ${results
              .map(
                (result) => `
                  <div class="py-2">
                    <p class="text-gray-600">${result.text}</p>
                    <a href="${result.videoUrl}&t=${result.timestampSeconds}" 
                       target="_blank"
                       class="text-sm text-blue-500 hover:text-blue-700">
                      Watch at ${formatTimestamp(result.timestampSeconds)}
                    </a>
                  </div>
                `
              )
              .join('')}
          </div>
        `;
        resultsContainer.appendChild(groupElement);
      });
    } catch (err) {
      console.error(err);
    } finally {
      searchInput.disabled = false;
      searchButton.disabled = false;
      searchButton.innerText = 'Search';
      spinner.style.display = 'none';
    }
  }

  /**
   * Converts seconds to M:SS format
   * @param {number} seconds
   * @returns {string}
   */
  function formatTimestamp(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
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