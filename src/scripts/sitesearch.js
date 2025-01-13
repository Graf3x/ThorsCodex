import { inView, animate, stagger } from "https://cdn.jsdelivr.net/npm/framer-motion@11.11.11/dom/+esm";

class UrlGenerator {
  constructor(altMode = false) {
    this._altMode = altMode;
  }

  get topUrl() {
    return this._altMode
      ? 'AskAllFatherAISearch'
      : 'SearchAllFatherFullText';
  }

  get detailsUrl() {
    return this._altMode
      ? 'AskHeimdall'
      : 'AskHeimdallForDetails';
  }

  set altMode(value) {
    this._altMode = Boolean(value);
  }

  get altMode() {
    return this._altMode;
  }
}

const urlGenerator = new UrlGenerator();
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
const asciiArt = `
     ____            __ _______  __
    / ___|_ __ __ _ / _|___ /\\ \\/ /
   | |  _| '__/ _\` | |_  |_ \\ \\  / 
   | |_| | | | (_| |  _|___) |/  \\ 
    \\____|_|  \\__,_|_| |____//_/\\_\\
         Welcome Goblins!
Please consider contributing to the project on github!`;

console.log(asciiArt);

const consoleWatch = () => {
  const detectDevTools = () => {
    const widthThreshold = window.outerWidth - window.innerWidth > 160;
    const heightThreshold = window.outerHeight - window.innerHeight > 160;
    return widthThreshold || heightThreshold;
  };

  let isOpen = false;

  setInterval(() => {
    const devToolsOpen = detectDevTools();
    if (devToolsOpen && !isOpen) {
      isOpen = true;
      console.clear();
      console.log('%c' + asciiArt, 'color: #082c41; font-family: monospace; font-size: 12px;');
      console.log('%cWelcome to Thor\'s Codex!', 'color: #082c41; font-size: 20px; font-weight: bold;');
    } else if (!devToolsOpen) {
      isOpen = false;
    }
  }, 1000);
};

function setupTagsAnimation() {
  const wordsSection = document.getElementById('words');
  const toggleButton = document.getElementById('toggleTags');
  const tagElements = document.querySelectorAll('#word-tags span');


  tagElements.forEach(tag => {
    tag.style.cursor = 'pointer';
    tag.addEventListener('click', async () => {
      if (tag.classList.contains('disabled')) return;

      searchInput.value = tag.textContent.trim();

      tagElements.forEach(t => {
        t.classList.add('disabled');
        t.style.opacity = '0.5';
        t.style.pointerEvents = 'none';
      });
      searchButton.click();

      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.target.disabled === false) {
            tagElements.forEach(t => {
              t.classList.remove('disabled');
              t.style.opacity = '1';
              t.style.pointerEvents = 'auto';
            });
            observer.disconnect();
          }
        });
      });

      observer.observe(searchButton, {
        attributes: true,
        attributeFilter: ['disabled']
      });
    });
  });

  const frequencies = Array.from(tagElements).map(tag =>
    parseInt(tag.dataset.frequency, 10)
  );


  const minFreq = Math.min(...frequencies);
  const maxFreq = Math.max(...frequencies);


  const scale = (num) => {
    return 0.75 + (
      ((num - minFreq) / (maxFreq - minFreq)) * 1.03
    );
  };

  tagElements.forEach(tag => {
    const freq = parseInt(tag.dataset.frequency, 10);
    const size = scale(freq);
    tag.style.fontSize = `${size}rem`;
  });

  toggleButton.addEventListener('click', () => {
    wordsSection.classList.toggle('hidden');

    if (!wordsSection.classList.contains('hidden')) {
      animate(wordsSection,
        { opacity: [0, 1] },
        { duration: 0.3 }
      );
      animate(tagElements,
        { opacity: [0, 1], transform: ['translateY(20px)', 'translateY(0)'] },
        {
          duration: 0.5,
          delay: stagger(0.05),
          easing: 'ease-out'
        }
      );
    }
  });
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
  const errorMessage = document.getElementById('error-message');
  consoleWatch();
  setupConfig();
  setupTagsAnimation();
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
      if (validateInput()) { searchTranscripts(); }
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
      let url = `https://odin.thorscodex.com/api/${urlGenerator.topUrl}?query=${encodeURIComponent(
        searchInput.value
      )}&pageSize=${pageSize}`;

      if (currentContinuationToken) {
        url += `&continuationToken=${encodeURIComponent(currentContinuationToken)}`;
      }

      const response = await fetch(url);


      if (response.status === 404) {
        resultsContainer.innerHTML = '<div class="text-white text-center mt-4">No results found</div>';
        paginationDiv.classList.add('hidden');
        return;
      }

      const data = await response.json();

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

        inView(groupElement, () => {
          animate(
            groupElement,
            {
              opacity: [0, 1],
              transform: ['translateY(20px)', 'translateY(0)']
            },
            {
              duration: 0.5,
              easing: 'ease-out'
            }
          );
          return false;
        });

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

    const response = await fetch(`https://odin.thorscodex.com/api/${urlGenerator.detailsUrl}?videoId=${videoId}&terms=${encodeURIComponent(searchTerms)}`);

    if (!response.ok) {
      throw new Error('Failed to fetch transcripts');
    }

    const data = await response.json();
    const results = data.results || [];

    if (results.length === 0) {
      transcriptContent.innerHTML = '<p class="text-gray-500">No transcripts found</p>';
      return;
    }

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
/**
 * Configuration modal elements and state management
 */
const modal = document.getElementById('configSection');
const modalContent = modal.querySelector('div');
const configToggle = document.getElementById('configToggle');
const closeModal = document.getElementById('closeModal');
const confirmSettings = document.getElementById('confirmSettings');
const altModeToggle = document.getElementById('altModeToggle');
const toggleDot = document.querySelector('.toggle-dot');
const toggleBackground = document.getElementById('toggle');

/**
 * Shows the configuration modal with animation
 * @param {Event} e - Click event
 */
function showModal(e) {
  e.stopPropagation();
  modal.classList.remove('hidden');
  setTimeout(() => {
    modal.classList.add('opacity-100');
    modalContent.classList.add('scale-100', 'opacity-100');
  }, 10);
}

/**
 * Hides the configuration modal with animation
 */
function hideModal() {
  modal.classList.remove('opacity-100');
  modalContent.classList.remove('scale-100', 'opacity-100');
  setTimeout(() => {
    modal.classList.add('hidden');
  }, 300);
}

/**
 * Updates the toggle switch state and related UI elements
 * @param {boolean} checked - Whether the toggle is checked
 */
function updateToggleState(checked) {
  toggleDot.style.transform = checked ? 'translateX(1rem)' : 'translateX(0)';
  toggleBackground.classList.toggle('bg-blue-600', checked);
  toggleBackground.classList.toggle('bg-gray-600', !checked);
  altModeToggle.checked = checked;
  urlGenerator.altMode = checked;
  localStorage.setItem('altModeEnabled', checked);
}

/**
 * Initialize configuration modal and toggle switch
 */
export function setupConfig() {

  configToggle.removeEventListener('click', showModal);
  closeModal.removeEventListener('click', hideModal);
  confirmSettings.removeEventListener('click', hideModal);


  configToggle.addEventListener('click', showModal);
  closeModal.addEventListener('click', hideModal);
  confirmSettings.addEventListener('click', hideModal);
  
  toggleBackground.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    updateToggleState(!altModeToggle.checked);
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) hideModal();
  });

  // Load saved preference
  const savedAltMode = localStorage.getItem('altModeEnabled') === 'true';
  updateToggleState(savedAltMode);
}