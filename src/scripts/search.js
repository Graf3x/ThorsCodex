const pageSize = 100;
let currentPage = 1;

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

  // Trigger search on Enter key
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      searchTranscripts();
    }
  });

  // Trigger search on button click
  searchButton.addEventListener('click', () => searchTranscripts());

  // Pagination
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
      const response = await fetch(
        `https://odin.thorscodex.com/api/SearchAllFather?like=${encodeURIComponent(
          searchInput.value
        )}&page=${page}&pageSize=${pageSize}`
      );
      const data = await response.json();

      // Show/hide pagination based on results
      paginationDiv.classList.toggle('hidden', data.totalPages <= 1);

      if (data.totalPages > 1) {
        currentPage = data.page;
        pageInfo.textContent = `Page ${data.page} of ${data.totalPages}`;
        prevPage.disabled = currentPage <= 1;
        nextPage.disabled = currentPage >= data.totalPages;
      }

      // Group results by streamDate
      const groupedResults = data.results.reduce((groups, item) => {
        const date = new Date(item.streamDate).toLocaleDateString();
        if (!groups[date]) {
          groups[date] = [];
        }
        groups[date].push(item);
        return groups;
      }, {});

      // Render grouped results
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
                <h3 class="text-lg font-semibold">${results[0].videoTitle || 'Untitled Stream'}</h3>
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
}