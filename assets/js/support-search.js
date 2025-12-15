// Data Source: Early Access & Beta Knowledge Base
const supportArticles = [
  // --- General Access & Account ---
  {
    title: 'WaveOS Beta Program',
    description: 'WaveOS is currently invite-only. Learn how to join the waitlist or request an access code for your team.',
    link: 'index.html#beta',
    tags: ['beta', 'invite', 'access', 'waitlist'],
  },
  {
    title: 'Reporting bugs and feedback',
    description: 'Found a glitch? Use the in-app "Feedback" tool to send logs directly to our engineering team.',
    link: 'support.html#bugs',
    tags: ['bugs', 'glitch', 'feedback', 'report'],
  },
  {
    title: 'Data persistence during Beta',
    description: 'Understanding how we handle your data during alpha/beta transitions and potential resets.',
    link: 'privacy.html#data-retention',
    tags: ['data', 'backup', 'reset', 'policy'],
  },

  // --- Wavium ---

  // --- TapMood ---

  // --- Community & Contact ---
  {
    title: 'Accessing the Developer Discord',
    description: 'Join our private Discord community to chat directly with WayV engineers and other builders.',
    link: 'https://discord.gg/RukYZ3vegt',
    tags: ['community', 'discord', 'chat', 'help'],
  },
  {
    title: 'Contact the founders',
    description: 'For enterprise inquiries or investor relations, email the founding team directly.',
    link: 'mailto:wayvsoftware@gmail.com',
    tags: ['contact', 'founders', 'email', 'investors'],
  },
];

// DOM Elements
const supportSearchInput = document.getElementById('supportSearchInput');
const resultsContainer = document.getElementById('supportSearchResults');
const emptyState = document.getElementById('supportSearchEmpty');
const statusBadge = document.getElementById('supportSearchStatus');
const clearButton = document.getElementById('supportSearchClear');

// Show fewer results by default to keep it clean
const defaultResults = supportArticles.slice(0, 6);

function normalize(text) {
  return text.toLowerCase();
}

/**
 * Ranks articles based on keyword matching in title, description, and tags.
 * Title matches are weighted higher (2x) than body matches (1x).
 */
function rankArticles(query) {
  const terms = normalize(query)
    .split(/\s+/)
    .map((term) => term.trim())
    .filter(Boolean);

  if (!terms.length) {
    return defaultResults.map((article) => ({ ...article, score: 0 }));
  }

  const results = supportArticles
    .map((article) => {
      const haystack = normalize(`${article.title} ${article.description} ${article.tags.join(' ')}`);
      
      const score = terms.reduce((total, term) => {
        let termScore = 0;
        
        if (haystack.includes(term)) termScore += 1;
        if (normalize(article.title).includes(term)) termScore += 10;
        if (article.tags.includes(term)) termScore += 5;

        return total + termScore;
      }, 0);

      return { ...article, score };
    })
    .filter((article) => article.score > 0)
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));

  return results;
}

function renderResults(items) {
  if (!resultsContainer) return;
  resultsContainer.innerHTML = '';

  if (!items.length) {
    emptyState?.classList.remove('hidden');
    return;
  }

  emptyState?.classList.add('hidden');

  items.forEach((article) => {
    const card = document.createElement('a');
    card.href = article.link;
    // Check if external link (Discord) to open in new tab
    if (article.link.startsWith('http')) {
        card.target = '_blank';
        card.rel = 'noopener noreferrer';
    }

    card.className =
      'block bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-teal-200 transition-all hover:-translate-y-0.5 group h-full flex flex-col';

    const title = document.createElement('h3');
    title.className = 'text-lg font-bold text-slate-900 mb-2 group-hover:text-teal-700 transition-colors';
    title.textContent = article.title;

    const description = document.createElement('p');
    description.className = 'text-slate-600 text-sm leading-relaxed mb-4 flex-grow';
    description.textContent = article.description;

    const tagsRow = document.createElement('div');
    tagsRow.className = 'flex flex-wrap gap-2 mt-auto';
    article.tags.slice(0, 3).forEach((tag) => {
      const badge = document.createElement('span');
      // Added a "Beta" tag style if the tag is 'beta' or 'alpha'
      const isBetaTag = ['beta', 'alpha', 'pilot'].includes(tag);
      const bgClass = isBetaTag ? 'bg-orange-50 text-orange-600' : 'bg-slate-100 text-slate-600';
      
      badge.className = `${bgClass} px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded-full group-hover:bg-teal-50 group-hover:text-teal-700 transition-colors`;
      badge.textContent = tag;
      tagsRow.appendChild(badge);
    });

    card.appendChild(title);
    card.appendChild(description);
    card.appendChild(tagsRow);

    resultsContainer.appendChild(card);
  });
}

function updateStatus(message, hasQuery) {
  if (statusBadge) {
    statusBadge.textContent = message;
    statusBadge.className = hasQuery 
        ? 'text-xs font-bold text-teal-600 uppercase tracking-widest' 
        : 'text-xs font-bold text-slate-400 uppercase tracking-widest';
  }
  if (clearButton) {
    clearButton.classList.toggle('hidden', !hasQuery);
  }
}

function handleSearch() {
  if (!supportSearchInput) return;

  const query = supportSearchInput.value.trim();
  const results = rankArticles(query);

  if (results.length === 0) {
    updateStatus('No matches found', !!query);
  } else if (!query) {
    updateStatus('Common Questions', false);
  } else {
    const label = results.length === 1 ? 'result' : 'results';
    updateStatus(`${results.length} ${label} for "${query}"`, true);
  }

  renderResults(results);
}

function initSupportSearch() {
  if (!supportSearchInput || !resultsContainer) return;

  supportSearchInput.addEventListener('input', handleSearch);
  
  clearButton?.addEventListener('click', () => {
    supportSearchInput.value = '';
    supportSearchInput.focus();
    handleSearch();
  });

  renderResults(defaultResults);
  updateStatus('Common Questions', false);
}

window.addEventListener('load', initSupportSearch);