const supportArticles = [
  {
    title: 'Get started with WayV',
    description: 'Set up your workspace, invite your team, and connect your WayV products for the first time.',
    link: 'index.html#products',
    tags: ['setup', 'onboarding', 'team'],
  },
  {
    title: 'WaveOS device requirements',
    description: 'Check the compatibility matrix before installing WaveOS and learn how to keep your devices updated.',
    link: 'waveos.html',
    tags: ['waveos', 'devices', 'updates'],
  },
  {
    title: 'Build your first automation with Wave Engine',
    description: 'Create, test, and deploy automations using the Wave Engine visual tools and APIs.',
    link: 'wave-engine.html',
    tags: ['automation', 'workflow', 'apis'],
  },
  {
    title: 'Manage notifications with Wavium',
    description: 'Customize notification preferences and routing rules for your team and customers.',
    link: 'wavium.html',
    tags: ['notifications', 'routing', 'preferences'],
  },
  {
    title: 'Tapmood kiosk setup',
    description: 'Mount Tapmood, connect it to Wi‑Fi, and customize the feedback prompts for visitors.',
    link: 'tapmood.html',
    tags: ['tapmood', 'hardware', 'wifi'],
  },
  {
    title: 'Security and privacy controls',
    description: 'Review how WayV protects data, configure access controls, and download compliance documents.',
    link: 'privacy.html',
    tags: ['security', 'privacy', 'compliance'],
  },
  {
    title: 'Account billing and invoices',
    description: 'Update billing contacts, download invoices, and manage payment methods for your organization.',
    link: 'company.html#billing',
    tags: ['billing', 'invoices', 'payments'],
  },
  {
    title: 'Status and incident history',
    description: 'Check availability, scheduled maintenance, and historical incident reports for WayV services.',
    link: 'news.html#status',
    tags: ['uptime', 'maintenance', 'status'],
  },
  {
    title: 'Contact support',
    description: 'Email the support team for urgent questions or to follow up on an open ticket.',
    link: 'mailto:wayvsoftware@gmail.com',
    tags: ['support', 'contact', 'email'],
  },
];

const supportSearchInput = document.getElementById('supportSearchInput');
const resultsContainer = document.getElementById('supportSearchResults');
const emptyState = document.getElementById('supportSearchEmpty');
const statusBadge = document.getElementById('supportSearchStatus');
const clearButton = document.getElementById('supportSearchClear');

const defaultResults = supportArticles.slice(0, 6);

function normalize(text) {
  return text.toLowerCase();
}

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
        if (haystack.includes(term)) {
          termScore += 1;
        }
        if (normalize(article.title).includes(term)) {
          termScore += 2;
        }
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
    card.className =
      'block bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 group';

    const title = document.createElement('h3');
    title.className = 'text-xl font-semibold text-slate-900 mb-2 group-hover:text-teal-700 transition-colors';
    title.textContent = article.title;

    const description = document.createElement('p');
    description.className = 'text-slate-600 text-sm leading-relaxed';
    description.textContent = article.description;

    const tagsRow = document.createElement('div');
    tagsRow.className = 'flex flex-wrap gap-2 mt-4';
    article.tags.forEach((tag) => {
      const badge = document.createElement('span');
      badge.className = 'bg-teal-50 text-teal-700 px-3 py-1 text-xs font-semibold rounded-full';
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
    updateStatus('No matches yet', !!query);
  } else if (!query) {
    updateStatus('Showing top results', false);
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
}

window.addEventListener('load', initSupportSearch);
