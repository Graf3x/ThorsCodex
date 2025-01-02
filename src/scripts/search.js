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

  /**
   * Creates an info tooltip element.
   * @returns {HTMLElement} The tooltip element
   */
  function createInfoTooltip() {
    const tooltipDiv = document.createElement('div');
    tooltipDiv.className = 'absolute -top-6 right-0 text-white flex items-center gap-1';
    tooltipDiv.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
      </svg>
      <span class="group relative">
        Info
        <span class="invisible group-hover:visible absolute left-0 top-6 w-48 p-2 bg-gray-800 text-sm rounded-lg">
          Results are grouped by stream, showing 100 mentions per page
        </span>
      </span>
    `;
    return tooltipDiv;
  }
}