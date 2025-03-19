import { inView, animate, stagger } from "https://cdn.jsdelivr.net/npm/framer-motion@11.11.11/dom/+esm";
import { marked } from "https://cdn.jsdelivr.net/npm/marked@12.0.1/lib/marked.esm.js";
/**
 * UrlGenerator lets you switch between two different API endpoints
 */
class UrlGenerator {
  constructor(altMode = false) {
    this._altMode = altMode;
  }

  get topUrl() {
    return this._altMode
      ? 'HybridSearch'
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

const apiConfig = {
  baseUrl: window.location.hostname === 'localhost'
    ? 'https://localhost:7146/api'
    : 'https://odin.thorscodex.com/api'
};

const urlGenerator = new UrlGenerator();
const pageSize = 10;
let currentPage = 1;
let currentContinuationToken = "";

const asciiArt = `
     ____            __ _______  __
    / ___|_ __ __ _ / _|___ /\\ \\/ /
   | |  _| '__/ _\` | |_  |_ \\ \\  / 
   | |_| | | | (_| |  _|___) |/  \\ 
    \\____|_|  \\__,_|_| |____//_/\\_\\
         Welcome Goblins!
Please consider contributing to the project on github!`;

console.log(asciiArt);

function getSearchParam() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('searchTerm');
}

function updateUrlWithSearch(searchTerm) {
  const url = new URL(window.location);
  if (searchTerm) {
    url.searchParams.set('searchTerm', searchTerm);
  } else {
    url.searchParams.delete('searchTerm');
  }
  window.history.pushState({}, '', url);
}

export function formatTimestamp(seconds) {
  if (!seconds && seconds !== 0) return '0:00';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

async function loadScreenshotsTimeline(videoId, container) {
  const videoGroup = container.closest('.bg-white').querySelector('.video-group');
  const transcriptContainer = container.closest('.transcript-container');
  const transcriptContent = transcriptContainer.querySelector('.transcript-content');

  try {
    let partNumbers = [];
    if (videoGroup.dataset.partNumbers) {
      partNumbers = JSON.parse(videoGroup.dataset.partNumbers);
    }

    if (!partNumbers.length) {
      const maxSegments = 6;
      for (let seg = 0; seg < maxSegments; seg++) {
        for (let i = 1; i <= 6; i++) {
          partNumbers.push(seg * 6 + i);
        }
      }
    }

    const response = await fetch(`${apiConfig.baseUrl}/GetScreenshotsByVideoIdAndPartNumbers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ VideoId: videoId, PartNumbers: partNumbers })
    });

    if (!response.ok) {
      throw new Error('Failed to load screenshots');
    }

    const screenshots = await response.json();

    const screenshotsByPart = screenshots.reduce((acc, screenshot) => {
      if (!acc[screenshot.partNumber]) {
        acc[screenshot.partNumber] = [];
      }
      acc[screenshot.partNumber].push(screenshot);
      return acc;
    }, {});

    for (const partNumber in screenshotsByPart) {
      const container = transcriptContent.querySelector(`[data-part="${partNumber}"] .screenshot-container`);
      if (container) {
        const sortedScreenshots = screenshotsByPart[partNumber].sort(
          (a, b) => a.timestampSeconds - b.timestampSeconds
        );

        if (sortedScreenshots.length > 0) {
          container.querySelectorAll('.placeholder').forEach(el => el.remove());

          const firstTranscriptTimestamp = parseInt(container.dataset.firstTimestamp, 10) || 0;

          let closestScreenshotIndex = 0;
          let minTimeDiff = Infinity;

          sortedScreenshots.forEach((screenshot, index) => {
            const timeDiff = Math.abs(screenshot.timestampSeconds - firstTranscriptTimestamp);
            if (timeDiff < minTimeDiff) {
              minTimeDiff = timeDiff;
              closestScreenshotIndex = index;
            }

          });

          const screenshotsHtml = sortedScreenshots.map((screenshot, index) => `
            <div class="mb-1 screenshot-item inline-block md:block md:mr-0 flex-shrink-0 w-28 md:w-auto ${index === closestScreenshotIndex ? 'border-l-4 border-blue-500' : ''}">
              <div class="relative">
                <a href="https://www.youtube.com/watch?v=${videoId}&t=${screenshot.timestampSeconds}s" target="_blank">
                  <img 
                    src="data:image/png;base64,${screenshot.imageData}" 
                    alt="Screenshot at ${formatTimestamp(screenshot.timestampSeconds)}"
                    class="rounded-md border border-gray-300 w-full h-auto"
                  />
               </a>
                <div class="absolute bottom-2 right-2 bg-gray-800 bg-opacity-70 text-white text-xs px-2 py-1 rounded-md">
                  ${formatTimestamp(screenshot.timestampSeconds)}
                </div>
              </div>
            </div>
          `).join('');

          container.innerHTML = screenshotsHtml;
          container.classList.remove('hidden');

          if (closestScreenshotIndex > 0) {
            const matchingScreenshot = container.querySelectorAll('.screenshot-item')[closestScreenshotIndex];
            if (matchingScreenshot) {
              setTimeout(() => {
                container.scrollTo({ top: matchingScreenshot.offsetTop, behavior: 'smooth' });
              }, 100);
            }
          }
        } else {
          container.innerHTML = `<div class="text-sm text-gray-500">No screenshots available</div>`;
          container.classList.remove('hidden');
        }
      }
    }

  } catch (err) {
    console.error('Error loading timeline:', err);
  }
}

async function loadScreenshotsForTranscript(videoId, transcriptContent, partNumbers) {
  try {

    const response = await fetch(`${apiConfig.baseUrl}/GetScreenshotsByVideoIdAndPartNumbers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ VideoId: videoId, PartNumbers: partNumbers })
    });

    if (!response.ok) {
      throw new Error('Failed to load screenshots');
    }

    const screenshots = await response.json();

    const screenshotsByPart = screenshots.reduce((acc, screenshot) => {
      if (!acc[screenshot.partNumber]) {
        acc[screenshot.partNumber] = [];
      }
      acc[screenshot.partNumber].push(screenshot);
      return acc;
    }, {});
    console.log(screenshotsByPart)
    for (const partNumber in screenshotsByPart) {
      const container = transcriptContent.querySelector(`[data-part="${partNumber}"] .screenshot-container`);
      if (container) {
        const transcriptGroup = container.closest('.transcript-group');
        let maxHeight = transcriptGroup.clientHeight - 10;
        container.style.maxHeight = maxHeight + 'px';
      
        await loadScreenshotsTimeline(videoId, container);
        if (container.scrollHeight > maxHeight) {
          const sortedScreenshots = screenshotsByPart[partNumber].sort(
            (a, b) => a.timestampSeconds - b.timestampSeconds
          );
          if (sortedScreenshots.length > 0) {
            const firstTranscriptTimestamp = parseInt(container.dataset.firstTimestamp, 10) || 0;
            let closestScreenshotIndex = 0;
            let minTimeDiff = Infinity;
            sortedScreenshots.forEach((screenshot, index) => {
              const timeDiff = Math.abs(screenshot.timestampSeconds - firstTranscriptTimestamp);
              if (timeDiff < minTimeDiff) {
                minTimeDiff = timeDiff;
                closestScreenshotIndex = index;
              }
            });
            if (closestScreenshotIndex > 0) {
              const matchingScreenshot = container.querySelectorAll('.screenshot-item')[closestScreenshotIndex];
              if (matchingScreenshot) {
                setTimeout(() => {
                  container.scrollTo({ top: matchingScreenshot.offsetTop, behavior: 'smooth' });
                }, 100);
              }
            }
          }
        } 
      }
    }
  } catch (error) {
    console.error('Error loading screenshots:', error);
  }
}

export async function loadVideoTranscripts(videoGroup) {
  const transcriptContainer = videoGroup.nextElementSibling;
  const loadingSpinner = transcriptContainer.querySelector('.loading-spinner');
  const transcriptContent = transcriptContainer.querySelector('.transcript-content');
  const screenshotsTimeline = transcriptContainer.querySelector('.screenshots-timeline');

  screenshotsTimeline.classList.add('hidden');

  const videoId = videoGroup.dataset.videoId;
  const searchTerms = decodeURIComponent(videoGroup.dataset.searchTerms);
  const thumbnailUrl = videoGroup.querySelector('img').src;

  try {
    loadingSpinner.classList.remove('hidden');
    transcriptContent.innerHTML = '';

    const requestBody = {
      videoId: videoId,
      terms: searchTerms,
      page: currentPage++,
      pageSize: 10,
      ContinuationToken: ""
    };

    const response = await fetch(`${apiConfig.baseUrl}/${urlGenerator.detailsUrl}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

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

    const partNumbers = Object.keys(groupedResults).map(Number);
    videoGroup.dataset.partNumbers = JSON.stringify(partNumbers);

    const containsMarkdown = (text) => {
      if (!text) return false;
      return /(\*\*|__|##|>|\[.*?\]\(.*?\)|`|```|\|.*?\|)/.test(text);
    };

    const renderText = (text) => {
      if (containsMarkdown(text)) {
        return marked.parse(text);
      }
      return text;
    };

    transcriptContent.innerHTML = Object.entries(groupedResults)
      .map(([part, group]) => {
        const firstTranscriptTimestamp = group.transcripts[0]?.timestampSeconds || 0;

        const placeholderHtml = Array(3).fill()
          .map((_, i) => `
          <div class="mb-1 screenshot-item placeholder">
            <div class="relative">
              <img 
                src="${thumbnailUrl}" 
                alt="Loading screenshot placeholder"
                class="rounded-md border border-gray-300 w-full h-auto filter grayscale opacity-40"
              />
              <div class="absolute bottom-2 right-2 bg-gray-800 bg-opacity-70 text-white text-xs px-2 py-1 rounded-md">
                --:--
              </div>
            </div>
          </div>
        `).join('');

        return `
        <div class="transcript-group mb-4 border-b pb-4" data-part="${part}">
          <div class="flex flex-col md:flex-row gap-4">
            <div class="screenshot-container hidden md:w-1/6 lg:w-1/6 overflow-y-auto overflow-x-hidden scrollbar-hide" ce-nowrap md:whitespace-normal overflow-y-hidden md:overflow-y-auto md:overflow-x-hidden scrollbar-hide" 
                 id="screenshot-part-${part}" style="max-height: 450px"
                 data-first-timestamp="${firstTranscriptTimestamp}">
              ${placeholderHtml}
            </div>
            <div class="flex-1 flex gap-4">
              <div class="transcript-content w-1/2">
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
                    <div class="text-sm text-gray-600 leading-relaxed markdown-content">${renderText(group.summary)}</div>
                  </div>
                </div>
              ` : ''}
            </div>
          </div>
        </div>
      `;
      }).join('');
 const timelineToggleInput = document.getElementById('timelineToggleInput');
  if (timelineToggleInput && timelineToggleInput.checked) {
    try {
      await loadScreenshotsForTranscript(videoId, transcriptContent, partNumbers);
    } catch (screenshotError) {
      console.error('Error loading screenshots:', screenshotError);
    }
  } else {
    screenshotsTimeline.classList.add('hidden');
  }
  
} catch (error) {
  console.error('Error loading transcripts:', error);
  transcriptContent.innerHTML = '<p class="text-red-500">Error loading transcripts</p>';
} finally {
  loadingSpinner.classList.add('hidden');
}
}

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
}

function setupTagsAnimation() {

  const wordsSection = document.getElementById('words');
  const toggleButton = document.getElementById('toggleTags');
  const tagElements = document.querySelectorAll('#word-tags span');
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

const modal = document.getElementById('configSection');
const modalContent = modal.querySelector('div');
const configToggle = document.getElementById('configToggle');
const closeModal = document.getElementById('closeModal');
const confirmSettings = document.getElementById('confirmSettings');
const altModeToggle = document.getElementById('altModeToggle');
const toggleSearchService = document.getElementById('toggle');
const timelineToggle = document.getElementById('toggle-timeline');

function showModal(e) {
  e.stopPropagation();
  modal.classList.remove('hidden');
  setTimeout(() => {
    modal.classList.add('opacity-100');
    modalContent.classList.add('scale-100', 'opacity-100');
  }, 10);
}

function hideModal() {
  modal.classList.remove('opacity-100');
  modalContent.classList.remove('scale-100', 'opacity-100');
  setTimeout(() => {
    modal.classList.add('hidden');
  }, 100);
}

function updateToggleState(checked) {
  const toggleDot = document.querySelector('#toggle > div.toggle-dot');
  toggleDot.style.transform = checked ? 'translateX(1rem)' : 'translateX(0)';
  toggleSearchService.classList.toggle('bg-blue-600', checked);
  toggleSearchService.classList.toggle('bg-gray-600', !checked);
  altModeToggle.checked = checked;
  urlGenerator.altMode = checked;
  localStorage.setItem('altModeEnabled', checked);

  const resultsContainer = document.getElementById('searchResults');
  if (resultsContainer)
    resultsContainer.innerHTML = '';

  currentPage = 1;
  currentContinuationToken = "";
}

function updateTimelineToggleState(checked) {
  document.getElementById('timelineToggleInput').checked = checked;
  const toggleDot = document.querySelector('#toggle-timeline > div.toggle-dot');
  toggleDot.style.transform = checked ? 'translateX(1rem)' : 'translateX(0)';
  timelineToggle.classList.toggle('bg-blue-600', checked);
  timelineToggle.classList.toggle('bg-gray-600', !checked);
  localStorage.setItem('timelineToggle', checked);
}

export function setupConfig() {

  configToggle.addEventListener('click', showModal);
  closeModal.addEventListener('click', hideModal);
  confirmSettings.addEventListener('click', hideModal);

  toggleSearchService.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    updateToggleState(!altModeToggle.checked);
  });

  timelineToggle.addEventListener('click', (e) => {
    let timelineToggleInput = document.getElementById('timelineToggleInput');
    e.preventDefault();
    e.stopPropagation();
    updateTimelineToggleState(!timelineToggleInput.checked);
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) hideModal();
  });

  const savedAltMode = localStorage.getItem('altModeEnabled') === 'true';
  updateToggleState(savedAltMode);

  const savedTimeline = localStorage.getItem('timelineToggle');
  const timelineState = savedTimeline === null ? true : savedTimeline === 'true';
  updateTimelineToggleState(timelineState);
}

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
  const initialSearch = getSearchParam();
  if (initialSearch) {
    searchInput.value = decodeURIComponent(initialSearch);
    setTimeout(function () { searchButton.click() }, 1000);
  }
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
      updateUrlWithSearch(searchInput.value);
      searchTranscripts();
    }

    window.addEventListener('popstate', () => {
      const searchTerm = getSearchParam();
      if (searchTerm) {
        searchInput.value = decodeURIComponent(searchTerm);
        searchButton.click();
      } else {
        searchInput.value = '';
        resultsContainer.innerHTML = '';
      }
    });
  });

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
      currentContinuationToken = "";
    }


    try {
      const requestBody = {
        query: searchInput.value,
        page: currentPage++,
        pageSize: pageSize,
        ContinuationToken: currentContinuationToken
      };

      const response = await fetch(`${apiConfig.baseUrl}/${urlGenerator.topUrl}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (response.status === 404) {
        resultsContainer.insertAdjacentHTML = '<div class="text-white text-center mt-4">No results found</div>';
        paginationDiv.classList.add('hidden');
        return;
      }

      const data = await response.json();

      if (!data || !data.results || data.results.length === 0) {
        resultsContainer.insertAdjacentHTML = '<div class="text-white text-center mt-4">No results found</div>';
        paginationDiv.classList.add('hidden');
        return;
      }

      if (urlGenerator.altMode && data.results.length < pageSize) {
        showMoreButton.style.display = 'none';
      } else {
        showMoreButton.style.display = 'block';
      }

      currentContinuationToken = data.continuationToken || "";

      paginationDiv.classList.toggle('hidden', (!currentContinuationToken && !altModeToggle.checked));
      showMoreButton.disabled = !currentContinuationToken && !altModeToggle.checked;

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
            <div class="screenshots-timeline"></div>
            <div class="loading-spinner hidden"></div>
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
