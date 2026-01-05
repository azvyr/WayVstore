const config = window.tapmoodConfig || {};
const supabaseUrl = config.supabaseUrl || 'https://lxylwexfjhtzvepwvjal.supabase.co';
const supabaseAnonKey = config.supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4eWx3ZXhmamh0enZlcHd2amFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwNTY3ODEsImV4cCI6MjA4MjYzMjc4MX0.78Jc7gu59eU5XOgZiVpkn4dq1GrX3uKCEsV_ffXCU3E';

const elements = {
  guestView: document.getElementById('guest-view'),
  appView: document.getElementById('app-view'),
  connectionStatus: document.getElementById('connection-status'),
  connectionStatusApp: document.getElementById('connection-status-app'),
  authForm: document.getElementById('auth-form'),
  authUsernameField: document.getElementById('auth-username-field'),
  authUsername: document.getElementById('auth-username'),
  authEmail: document.getElementById('auth-email'),
  authPassword: document.getElementById('auth-password'),
  authHelper: document.getElementById('auth-helper'),
  authMessage: document.getElementById('auth-message'),
  authSubmit: document.getElementById('auth-submit'),
  authSignin: document.getElementById('auth-signin'),
  authSignup: document.getElementById('auth-signup'),
  signOut: document.getElementById('sign-out'),
  notificationsToggle: document.getElementById('notifications-toggle'),
  notificationsPanel: document.getElementById('notifications-panel'),
  notificationsList: document.getElementById('notifications-list'),
  notificationsFriends: document.getElementById('notifications-friends'),
  notificationsBadge: document.getElementById('notifications-badge'),
  refreshDashboard: document.getElementById('refresh-dashboard'),
  friendsCount: document.getElementById('friends-count'),
  messagesCount: document.getElementById('messages-count'),
  emotionsCount: document.getElementById('emotions-count'),
  emotionsList: document.getElementById('emotions-list'),
  moodForm: document.getElementById('mood-form'),
  moodEmoji: document.getElementById('mood-emoji'),
  moodLabel: document.getElementById('mood-label'),
  moodIntensity: document.getElementById('mood-intensity'),
  moodNote: document.getElementById('mood-note'),
  moodStatus: document.getElementById('mood-status'),
  messageForm: document.getElementById('message-form'),
  messageRecipient: document.getElementById('message-recipient'),
  messageText: document.getElementById('message-text'),
  messageStatus: document.getElementById('message-status'),
  messagesList: document.getElementById('messages-list'),
  messagesInbox: document.getElementById('messages-inbox'),
  friendsList: document.getElementById('friends-list'),
  friendSearch: document.getElementById('friend-search'),
  friendSearchResults: document.getElementById('friend-search-results'),
  friendStatus: document.getElementById('friend-status'),
  friendRequests: document.getElementById('friend-requests'),
  friendDiscover: document.getElementById('friend-discover'),
  profileCard: document.getElementById('profile-card'),
  profileForm: document.getElementById('profile-form'),
  profileDisplayName: document.getElementById('profile-display-name'),
  profileUsername: document.getElementById('profile-username'),
  profileAvatar: document.getElementById('profile-avatar'),
  profileBio: document.getElementById('profile-bio'),
  profileStatus: document.getElementById('profile-status'),
  activityFeed: document.getElementById('activity-feed'),
  navMessagesCount: document.getElementById('nav-messages-count'),
  navFriendsCount: document.getElementById('nav-friends-count'),
  navButtons: Array.from(document.querySelectorAll('.tapmood-nav-item')),
  topNavButtons: Array.from(document.querySelectorAll('.tapmood-top-nav')),
  pageToggleButtons: Array.from(document.querySelectorAll('[data-page-target]')),
  pageSections: Array.from(document.querySelectorAll('[data-page]')),
};

const state = {
  supabase: null,
  authMode: 'signin',
  session: null,
  profile: null,
  activePage: 'home',
  notifications: [],
  notificationChannel: null,
  friends: [],
};

function setConnectionStatus(text, tone = 'text-slate-400 bg-slate-100') {
  if (elements.connectionStatus) {
    elements.connectionStatus.textContent = text;
    elements.connectionStatus.className = `rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-widest ${tone}`;
  }
  if (elements.connectionStatusApp) {
    elements.connectionStatusApp.textContent = text;
    elements.connectionStatusApp.className = `rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-widest ${tone}`;
  }
}

function setAuthMessage(text, tone = 'text-slate-500') {
  if (!elements.authMessage) return;
  elements.authMessage.textContent = text;
  elements.authMessage.className = `text-sm ${tone}`;
}

function setStatusMessage(element, text, tone = 'text-slate-500') {
  if (!element) return;
  element.textContent = text;
  element.className = `text-sm ${tone}`;
}

function setAuthMode(mode) {
  state.authMode = mode;
  if (mode === 'signin') {
    elements.authSignin.classList.add('bg-slate-900', 'text-white');
    elements.authSignin.classList.remove('border', 'border-slate-200', 'text-slate-500');
    elements.authSignup.classList.remove('bg-slate-900', 'text-white');
    elements.authSignup.classList.add('border', 'border-slate-200', 'text-slate-500');
    elements.authSubmit.textContent = 'Sign In';
    elements.authUsernameField.classList.add('hidden');
    elements.authHelper.textContent = 'Use the same TapMood credentials you already have on mobile.';
  } else {
    elements.authSignup.classList.add('bg-slate-900', 'text-white');
    elements.authSignup.classList.remove('border', 'border-slate-200', 'text-slate-500');
    elements.authSignin.classList.remove('bg-slate-900', 'text-white');
    elements.authSignin.classList.add('border', 'border-slate-200', 'text-slate-500');
    elements.authSubmit.textContent = 'Sign Up';
    elements.authUsernameField.classList.remove('hidden');
    elements.authHelper.textContent = 'Pick a unique username so friends can find you fast.';
  }
}

function showGuestView() {
  elements.guestView?.classList.remove('hidden');
  elements.appView?.classList.add('hidden');
}

function showAppView() {
  elements.guestView?.classList.add('hidden');
  elements.appView?.classList.remove('hidden');
}

function setCounts({ friends = 0, messages = 0, emotions = 0 }) {
  if (elements.friendsCount) elements.friendsCount.textContent = friends;
  if (elements.messagesCount) elements.messagesCount.textContent = messages;
  if (elements.emotionsCount) elements.emotionsCount.textContent = emotions;
  if (elements.navFriendsCount) elements.navFriendsCount.textContent = friends;
  if (elements.navMessagesCount) elements.navMessagesCount.textContent = messages;
}

function setActivePage(page) {
  state.activePage = page;
  elements.pageSections.forEach((section) => {
    section.classList.toggle('hidden', section.dataset.page !== page);
  });

  elements.navButtons.forEach((button) => {
    const isActive = button.dataset.pageTarget === page;
    button.className = isActive
      ? 'tapmood-nav-item flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-900 px-4 py-3 text-left text-sm font-semibold text-white'
      : 'tapmood-nav-item flex w-full items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-left text-sm font-semibold text-slate-600 transition hover:bg-slate-100';
  });

  elements.topNavButtons.forEach((button) => {
    const isActive = button.dataset.pageTarget === page;
    button.className = isActive
      ? 'tapmood-top-nav rounded-full border border-slate-200 bg-slate-900 px-4 py-2 text-white transition hover:bg-slate-800'
      : 'tapmood-top-nav rounded-full border border-slate-200 bg-white px-4 py-2 text-slate-600 transition hover:bg-slate-50';
  });
}

function renderProfile(profile, user) {
  if (!profile || !user) {
    elements.profileCard.innerHTML = `
      <div class="h-12 w-12 rounded-full bg-slate-200"></div>
      <div>
        <p class="font-semibold">Not signed in</p>
        <p>Sign in to load your profile.</p>
      </div>
    `;
    return;
  }

  const displayName = profile.display_name || profile.username || user.email;
  const username = profile.username ? `@${profile.username}` : '';
  const avatar = profile.avatar_url
    ? `<img src="${profile.avatar_url}" alt="${displayName}" class="h-12 w-12 rounded-full object-cover" />`
    : `<div class="h-12 w-12 rounded-full bg-gradient-to-br from-teal-400 to-indigo-400"></div>`;

  elements.profileCard.innerHTML = `
    ${avatar}
    <div>
      <p class="font-semibold">${displayName}</p>
      <p>${username || user.email}</p>
    </div>
  `;
}

function renderFriends(friends) {
  if (!elements.friendsList) return;
  elements.friendsList.innerHTML = '';
  if (!friends.length) {
    elements.friendsList.innerHTML = '<li>No friends yet.</li>';
    return;
  }

  friends.forEach((friend) => {
    const avatar = friend.avatar_url
      ? `<img src="${friend.avatar_url}" alt="${friend.name}" class="h-8 w-8 rounded-full object-cover" />`
      : `<div class="h-8 w-8 rounded-full bg-slate-200"></div>`;
    const item = document.createElement('li');
    item.className = 'flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2';
    item.innerHTML = `
      ${avatar}
      <div>
        <p class="font-semibold text-slate-700">${friend.name}</p>
        <p class="text-xs text-slate-400">${friend.statusLabel}</p>
      </div>
    `;
    elements.friendsList.appendChild(item);
  });
}

function renderFriendRequests(requests) {
  if (!elements.friendRequests) return;
  elements.friendRequests.innerHTML = '';
  if (!requests.length) {
    elements.friendRequests.innerHTML = '<p>No pending friend requests.</p>';
    return;
  }

  requests.forEach((request) => {
    const avatar = request.avatar_url
      ? `<img src="${request.avatar_url}" alt="${request.name}" class="h-9 w-9 rounded-full object-cover" />`
      : `<div class="h-9 w-9 rounded-full bg-slate-200"></div>`;
    const row = document.createElement('div');
    row.className = 'flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2';
    row.innerHTML = `
      <div class="flex items-center gap-3">
        ${avatar}
        <div>
          <p class="text-sm font-semibold text-slate-700">${request.name}</p>
          <p class="text-xs text-slate-400">@${request.username}</p>
        </div>
      </div>
      <button type="button" data-request-id="${request.id}" class="rounded-full bg-slate-900 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-white">Accept</button>
    `;
    row.querySelector('button')?.addEventListener('click', () => acceptFriendRequest(request.id));
    elements.friendRequests.appendChild(row);
  });
}

function renderNotifications(notifications) {
  if (!elements.notificationsList || !elements.notificationsBadge) return;
  elements.notificationsList.innerHTML = '';
  if (!notifications.length) {
    elements.notificationsList.innerHTML = '<p class="text-sm text-slate-500">You are all caught up.</p>';
    elements.notificationsBadge.classList.add('hidden');
    return;
  }

  notifications.slice(0, 6).forEach((notification) => {
    const item = document.createElement('div');
    item.className = 'rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3';
    item.innerHTML = `
      <p class="text-xs font-semibold uppercase tracking-widest text-slate-400">${notification.type}</p>
      <p class="mt-1 text-sm font-semibold text-slate-700">${notification.title}</p>
      <p class="text-xs text-slate-500">${notification.subtitle}</p>
    `;
    elements.notificationsList.appendChild(item);
  });

  elements.notificationsBadge.textContent = notifications.length;
  elements.notificationsBadge.classList.toggle('hidden', notifications.length === 0);
}

function renderNotificationFriends(friends) {
  if (!elements.notificationsFriends) return;
  elements.notificationsFriends.innerHTML = '';
  if (!friends.length) {
    elements.notificationsFriends.innerHTML = '<p class="text-sm text-slate-500">No friends yet. Add some to see them here.</p>';
    return;
  }

  friends.slice(0, 5).forEach((friend) => {
    const avatar = friend.avatar_url
      ? `<img src="${friend.avatar_url}" alt="${friend.name}" class="h-8 w-8 rounded-full object-cover" />`
      : `<div class="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-[10px] font-semibold text-slate-500">${friend.name.slice(0, 2).toUpperCase()}</div>`;
    const item = document.createElement('div');
    item.className = 'flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2';
    item.innerHTML = `
      <div class="flex items-center gap-3">
        ${avatar}
        <div>
          <p class="text-sm font-semibold text-slate-700">${friend.name}</p>
          <p class="text-xs text-slate-400">${friend.statusLabel}</p>
        </div>
      </div>
      <button type="button" class="rounded-full border border-slate-200 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-slate-500" data-friend-name="${friend.name}">Message</button>
    `;
    item.querySelector('button')?.addEventListener('click', () => {
      setActivePage('messages');
      if (elements.messageRecipient) {
        elements.messageRecipient.value = friend.username || friend.name;
      }
    });
    elements.notificationsFriends.appendChild(item);
  });
}

function renderMessages(messages) {
  elements.messagesList.innerHTML = '';
  if (!messages.length) {
    elements.messagesList.innerHTML = '<p>No messages yet.</p>';
    return;
  }

  messages.forEach((message) => {
    const sender = message.sender_name || message.sender_code || 'Unknown';
    const time = new Date(message.timestamp || message.created_at).toLocaleString();
    const item = document.createElement('div');
    item.className = 'rounded-2xl border border-slate-100 bg-white px-3 py-2';
    item.innerHTML = `
      <p class="text-xs font-semibold text-slate-400">${sender} • ${time}</p>
      <p class="text-sm text-slate-600">${message.text}</p>
    `;
    elements.messagesList.appendChild(item);
  });
}

function renderMessageInbox(messages, username) {
  if (!elements.messagesInbox) return;
  elements.messagesInbox.innerHTML = '';
  if (!messages.length) {
    elements.messagesInbox.innerHTML = '<p>No conversations yet.</p>';
    return;
  }

  const threads = {};
  messages.forEach((message) => {
    const sender = message.sender_code || '';
    const recipient = message.recipient_code || '';
    const otherUser = sender === username ? recipient : sender || recipient;
    if (!otherUser) return;
    if (!threads[otherUser] || new Date(message.timestamp) > new Date(threads[otherUser].timestamp)) {
      threads[otherUser] = message;
    }
  });

  Object.entries(threads)
    .sort(([, a], [, b]) => new Date(b.timestamp) - new Date(a.timestamp))
    .forEach(([otherUser, message]) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'flex w-full flex-col rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2 text-left transition hover:border-slate-200 hover:bg-white';
      button.innerHTML = `
        <div class="flex items-center justify-between text-xs font-semibold uppercase tracking-widest text-slate-400">
          <span>${otherUser}</span>
          <span>${new Date(message.timestamp).toLocaleDateString()}</span>
        </div>
        <p class="mt-1 text-sm font-semibold text-slate-700">${message.text || 'New message'}</p>
      `;
      button.addEventListener('click', async () => {
        if (elements.messageRecipient) {
          elements.messageRecipient.value = otherUser;
        }
        const threadMessages = await loadMessages(username, otherUser);
        renderMessages(threadMessages);
      });
      elements.messagesInbox.appendChild(button);
    });
}

function renderEmotions(emotions) {
  elements.emotionsList.innerHTML = '';
  if (!emotions.length) {
    elements.emotionsList.innerHTML = '<div class="rounded-2xl border border-slate-100 bg-slate-50 p-4">No moods logged yet.</div>';
    return;
  }

  emotions.forEach((emotion) => {
    const card = document.createElement('div');
    card.className = 'rounded-2xl border border-slate-100 bg-slate-50 p-4';
    card.innerHTML = `
      <div class="text-2xl">${emotion.emoji || '✨'}</div>
      <p class="mt-2 text-sm font-semibold text-slate-700">${emotion.label || 'Mood update'}</p>
      <p class="text-xs text-slate-400">Intensity ${emotion.intensity || '—'} • ${new Date(emotion.created_at).toLocaleDateString()}</p>
      <p class="mt-2 text-xs text-slate-500">${emotion.note || 'No note added.'}</p>
    `;
    elements.emotionsList.appendChild(card);
  });
}

function renderActivityFeed({ friends = [], emotions = [], messages = [] }) {
  if (!elements.activityFeed) return;
  elements.activityFeed.innerHTML = '';
  const items = [];

  emotions.slice(0, 3).forEach((emotion) => {
    items.push({
      type: 'mood',
      title: `${emotion.label || 'Mood update'} • ${emotion.emoji || '✨'}`,
      subtitle: emotion.note || 'Shared a mood update.',
      timestamp: emotion.created_at,
    });
  });

  messages.slice(0, 3).forEach((message) => {
    items.push({
      type: 'message',
      title: `Message to @${message.recipient_code || 'friend'}`,
      subtitle: message.text || 'Sent a new message.',
      timestamp: message.timestamp,
    });
  });

  friends.slice(0, 2).forEach((friend) => {
    items.push({
      type: 'friend',
      title: `Connected with ${friend.name}`,
      subtitle: 'Say hello and share a mood.',
      timestamp: new Date().toISOString(),
    });
  });

  if (!items.length) {
    elements.activityFeed.innerHTML = '<p>No activity yet. Share a mood or send a message to get started.</p>';
    return;
  }

  items
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .forEach((item) => {
      const row = document.createElement('div');
      row.className = 'rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3';
      row.innerHTML = `
        <p class="text-xs font-semibold uppercase tracking-widest text-slate-400">${item.type}</p>
        <p class="mt-1 text-sm font-semibold text-slate-700">${item.title}</p>
        <p class="text-xs text-slate-500">${item.subtitle}</p>
      `;
      elements.activityFeed.appendChild(row);
    });
}

function renderDiscoverPeople(people) {
  if (!elements.friendDiscover) return;
  elements.friendDiscover.innerHTML = '';
  if (!people.length) {
    elements.friendDiscover.innerHTML = '<p>No new profiles to show yet.</p>';
    return;
  }

  people.forEach((person) => {
    const avatar = person.avatar_url
      ? `<img src="${person.avatar_url}" alt="${person.name}" class="h-10 w-10 rounded-full object-cover" />`
      : `<div class="h-10 w-10 rounded-full bg-slate-200"></div>`;
    const card = document.createElement('div');
    card.className = 'rounded-2xl border border-slate-100 bg-slate-50 p-4';
    card.innerHTML = `
      <div class="flex items-center gap-3">
        ${avatar}
        <div>
          <p class="text-sm font-semibold text-slate-700">${person.name}</p>
          <p class="text-xs text-slate-400">@${person.username}</p>
        </div>
      </div>
      <p class="mt-2 text-xs text-slate-500">${person.bio || 'TapMood member'}</p>
      <button type="button" class="mt-3 rounded-full border border-slate-200 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-slate-500" data-profile-id="${person.id}">Send request</button>
    `;
    card.querySelector('button')?.addEventListener('click', () => sendFriendRequest(person));
    elements.friendDiscover.appendChild(card);
  });
}

function renderFriendSearchResults(results) {
  if (!elements.friendSearchResults) return;
  elements.friendSearchResults.innerHTML = '';
  if (!results.length) {
    elements.friendSearchResults.innerHTML = '<p class="text-sm text-slate-400">Start typing to search for friends.</p>';
    return;
  }

  results.forEach((person) => {
    const avatar = person.avatar_url
      ? `<img src="${person.avatar_url}" alt="${person.name}" class="h-9 w-9 rounded-full object-cover" />`
      : `<div class="h-9 w-9 rounded-full bg-slate-200"></div>`;
    const row = document.createElement('div');
    row.className = 'flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white px-3 py-2';
    row.innerHTML = `
      <div class="flex items-center gap-3">
        ${avatar}
        <div>
          <p class="text-sm font-semibold text-slate-700">${person.name}</p>
          <p class="text-xs text-slate-400">@${person.username}</p>
        </div>
      </div>
      <button type="button" class="rounded-full bg-slate-900 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-white">Add</button>
    `;
    row.querySelector('button')?.addEventListener('click', () => sendFriendRequest(person));
    elements.friendSearchResults.appendChild(row);
  });
}

async function ensureProfile(user) {
  const { data, error } = await state.supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url, bio')
    .eq('id', user.id)
    .maybeSingle();

  if (error) {
    setAuthMessage('Unable to load profile data.', 'text-amber-600');
    return null;
  }

  if (!data) {
    const fallbackUsername = user.user_metadata?.username || user.email?.split('@')[0] || `user-${user.id.slice(0, 6)}`;
    const { data: created, error: createError } = await state.supabase
      .from('profiles')
      .upsert({
        id: user.id,
        username: fallbackUsername,
        display_name: fallbackUsername,
      })
      .select('id, username, display_name, avatar_url, bio')
      .single();

    if (createError) {
      setAuthMessage('Unable to create profile data.', 'text-amber-600');
      return null;
    }

    return created;
  }

  return data;
}

async function loadFriends(userId) {
  const { data, error } = await state.supabase
    .from('friendships')
    .select('id, status, requester, addressee, requester_profile:profiles!friendships_requester_fkey(id, username, display_name, avatar_url), addressee_profile:profiles!friendships_addressee_fkey(id, username, display_name, avatar_url)')
    .eq('status', 'accepted')
    .or(`requester.eq.${userId},addressee.eq.${userId}`)
    .order('created_at', { ascending: false });

  if (error) {
    return [];
  }

  return data.map((row) => {
    const isRequester = row.requester === userId;
    const friendProfile = isRequester ? row.addressee_profile : row.requester_profile;
    return {
      id: row.id,
      name: friendProfile?.display_name || friendProfile?.username || 'Friend',
      username: friendProfile?.username || '',
      avatar_url: friendProfile?.avatar_url || '',
      statusLabel: row.status === 'accepted' ? 'Connected' : row.status,
    };
  });
}

async function loadFriendRequests(userId) {
  const { data, error } = await state.supabase
    .from('friendships')
    .select('id, requester, status, requester_profile:profiles!friendships_requester_fkey(id, username, display_name, avatar_url)')
    .eq('status', 'pending')
    .eq('addressee', userId)
    .order('created_at', { ascending: false });

  if (error) {
    return [];
  }

  return data.map((row) => ({
    id: row.id,
    name: row.requester_profile?.display_name || row.requester_profile?.username || 'TapMood user',
    username: row.requester_profile?.username || 'tapmood',
    avatar_url: row.requester_profile?.avatar_url || '',
  }));
}

async function loadExcludedProfileIds(userId) {
  const { data, error } = await state.supabase
    .from('friendships')
    .select('requester, addressee')
    .or(`requester.eq.${userId},addressee.eq.${userId}`);

  if (error || !data) {
    return [userId];
  }

  const ids = new Set([userId]);
  data.forEach((row) => {
    if (row.requester && row.requester !== userId) ids.add(row.requester);
    if (row.addressee && row.addressee !== userId) ids.add(row.addressee);
  });

  return Array.from(ids);
}

async function loadSuggestedProfiles(userId) {
  const excluded = await loadExcludedProfileIds(userId);
  let query = state.supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url, bio')
    .limit(6);

  if (excluded.length) {
    query = query.not('id', 'in', `(${excluded.join(',')})`);
  }

  const { data, error } = await query;
  if (error || !data) return [];

  return data.map((profile) => ({
    id: profile.id,
    name: profile.display_name || profile.username || 'TapMood user',
    username: profile.username || 'tapmood',
    avatar_url: profile.avatar_url || '',
    bio: profile.bio || '',
  }));
}

async function searchProfiles(queryText, userId) {
  if (!queryText) return [];
  const excluded = await loadExcludedProfileIds(userId);
  let query = state.supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url, bio')
    .or(`username.ilike.%${queryText}%,display_name.ilike.%${queryText}%`)
    .limit(6);

  if (excluded.length) {
    query = query.not('id', 'in', `(${excluded.join(',')})`);
  }

  const { data, error } = await query;
  if (error || !data) return [];

  return data.map((profile) => ({
    id: profile.id,
    name: profile.display_name || profile.username || 'TapMood user',
    username: profile.username || 'tapmood',
    avatar_url: profile.avatar_url || '',
    bio: profile.bio || '',
  }));
}

async function loadIncomingMessages(username) {
  if (!username) return [];
  const { data, error } = await state.supabase
    .from('chat_messages')
    .select('id, sender_name, sender_code, recipient_code, text, timestamp')
    .eq('recipient_code', username)
    .order('timestamp', { ascending: false })
    .limit(5);

  if (error || !data) return [];
  return data;
}

async function loadNotifications({ userId, username }) {
  const [requests, incomingMessages] = await Promise.all([
    loadFriendRequests(userId),
    loadIncomingMessages(username),
  ]);

  const notifications = [];

  requests.forEach((request) => {
    notifications.push({
      type: 'friend request',
      title: `${request.name} wants to connect`,
      subtitle: `@${request.username} sent you a request.`,
      timestamp: new Date().toISOString(),
    });
  });

  incomingMessages.forEach((message) => {
    notifications.push({
      type: 'message',
      title: `New message from ${message.sender_name || message.sender_code || 'TapMood user'}`,
      subtitle: message.text || 'Tap to read the full message.',
      timestamp: message.timestamp,
    });
  });

  notifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  state.notifications = notifications;
  renderNotifications(notifications);
}

async function loadMessages(username, recipient = '') {
  if (!username) return [];
  let query = state.supabase
    .from('chat_messages')
    .select('id, sender_name, sender_code, recipient_code, text, timestamp')
    .order('timestamp', { ascending: false })
    .limit(20);

  if (recipient) {
    query = query.or(`and(sender_code.eq.${username},recipient_code.eq.${recipient}),and(sender_code.eq.${recipient},recipient_code.eq.${username})`);
  } else {
    query = query.or(`sender_code.eq.${username},recipient_code.eq.${username}`);
  }

  const { data, error } = await query;
  if (error) {
    return [];
  }

  return data;
}

async function loadEmotions(userId) {
  const { data, error } = await state.supabase
    .from('emotions')
    .select('id, emoji, label, intensity, note, created_at')
    .eq('author', userId)
    .order('created_at', { ascending: false })
    .limit(6);

  if (error) {
    return [];
  }

  return data;
}

async function loadDashboard() {
  if (!state.session?.user) return;

  const user = state.session.user;
  setAuthMessage('Loading dashboard data...', 'text-slate-500');

  const profile = await ensureProfile(user);
  state.profile = profile;
  renderProfile(profile, user);

  if (profile) {
    elements.profileDisplayName.value = profile.display_name || '';
    elements.profileUsername.value = profile.username || '';
    elements.profileAvatar.value = profile.avatar_url || '';
    elements.profileBio.value = profile.bio || '';
  }

  const [friends, emotions, messages, requests, suggestedPeople] = await Promise.all([
    loadFriends(user.id),
    loadEmotions(user.id),
    loadMessages(profile?.username),
    loadFriendRequests(user.id),
    loadSuggestedProfiles(user.id),
  ]);

  renderFriends(friends);
  state.friends = friends;
  renderEmotions(emotions);
  renderMessages(messages);
  renderMessageInbox(messages, profile?.username);
  renderActivityFeed({ friends, emotions, messages });
  renderFriendRequests(requests);
  renderDiscoverPeople(suggestedPeople);
  renderNotificationFriends(friends);
  if (profile?.username) {
    renderFriendSearchResults([]);
    await loadNotifications({ userId: user.id, username: profile.username });
  }

  setCounts({
    friends: friends.length,
    messages: messages.length,
    emotions: emotions.length,
  });

  setAuthMessage('Dashboard ready.', 'text-emerald-600');
}

async function handleAuthSubmit(event) {
  event.preventDefault();
  if (!state.supabase) return;

  const username = elements.authUsername?.value.trim();
  const email = elements.authEmail.value.trim();
  const password = elements.authPassword.value;

  if (!email || !password) {
    setAuthMessage('Email and password are required.', 'text-amber-600');
    return;
  }

  if (state.authMode === 'signup' && !username) {
    setAuthMessage('Please choose a username for your profile.', 'text-amber-600');
    return;
  }

  setAuthMessage('Working...', 'text-slate-500');

  const action = state.authMode === 'signin'
    ? state.supabase.auth.signInWithPassword({ email, password })
    : state.supabase.auth.signUp({ email, password, options: { data: { username } } });

  const { data, error } = await action;
  if (error) {
    setAuthMessage(error.message, 'text-rose-600');
    return;
  }

  if (state.authMode === 'signup') {
    if (data?.user && username) {
      await state.supabase.from('profiles').upsert({
        id: data.user.id,
        username,
        display_name: username,
      });
    }
    setAuthMessage('Account created! Check your email to confirm your sign up.', 'text-emerald-600');
  }
}

async function handleSignOut() {
  if (!state.supabase) return;
  await state.supabase.auth.signOut();
  setAuthMessage('Signed out.', 'text-slate-500');
}

function resetDashboard() {
  setCounts({});
  if (elements.friendsList) {
    elements.friendsList.innerHTML = '<li>Sign in to view friends.</li>';
  }
  if (elements.messagesList) {
    elements.messagesList.innerHTML = '<p>Sign in to view messages.</p>';
  }
  if (elements.messagesInbox) {
    elements.messagesInbox.innerHTML = '<p>Sign in to view messages.</p>';
  }
  if (elements.emotionsList) {
    elements.emotionsList.innerHTML = '<div class="rounded-2xl border border-slate-100 bg-slate-50 p-4">Sign in to view recent moods.</div>';
  }
  if (elements.activityFeed) {
    elements.activityFeed.innerHTML = '<p>Sign in to see your live activity feed.</p>';
  }
  renderDiscoverPeople([]);
  renderFriendRequests([]);
  renderFriendSearchResults([]);
  renderNotifications([]);
  renderNotificationFriends([]);
  renderProfile(null, null);
  setStatusMessage(elements.moodStatus, '');
  setStatusMessage(elements.messageStatus, '');
  setStatusMessage(elements.friendStatus, '');
  setStatusMessage(elements.profileStatus, '');
}

async function handleRefresh() {
  if (!state.session?.user) return;
  await loadDashboard();
}

async function handleMoodSubmit(event) {
  event.preventDefault();
  if (!state.session?.user || !state.profile) return;

  const emoji = elements.moodEmoji.value.trim();
  const label = elements.moodLabel.value.trim();
  const intensity = Number(elements.moodIntensity.value || 0);
  const note = elements.moodNote.value.trim();

  if (!label) {
    setStatusMessage(elements.moodStatus, 'Please enter a mood label.', 'text-amber-600');
    return;
  }

  const payload = {
    author: state.session.user.id,
    emoji: emoji || '✨',
    label,
    intensity: intensity || null,
    note,
  };

  setStatusMessage(elements.moodStatus, 'Sending mood...', 'text-slate-500');
  const { error } = await state.supabase.from('emotions').insert(payload);
  if (error) {
    setStatusMessage(elements.moodStatus, error.message, 'text-rose-600');
    return;
  }

  elements.moodForm.reset();
  setStatusMessage(elements.moodStatus, 'Mood shared.', 'text-emerald-600');
  await loadDashboard();
}

async function handleMessageSubmit(event) {
  event.preventDefault();
  if (!state.profile) return;

  const recipient = elements.messageRecipient.value.trim();
  const text = elements.messageText.value.trim();

  if (!recipient || !text) {
    setStatusMessage(elements.messageStatus, 'Add a recipient and message.', 'text-amber-600');
    return;
  }

  setStatusMessage(elements.messageStatus, 'Sending message...', 'text-slate-500');
  const { error } = await state.supabase.from('chat_messages').insert({
    sender_name: state.profile.display_name || state.profile.username || 'TapMood user',
    sender_code: state.profile.username,
    recipient_code: recipient,
    text,
  });

  if (error) {
    setStatusMessage(elements.messageStatus, error.message, 'text-rose-600');
    return;
  }

  elements.messageText.value = '';
  setStatusMessage(elements.messageStatus, 'Message sent.', 'text-emerald-600');
  const messages = await loadMessages(state.profile.username, recipient);
  renderMessages(messages);
  renderMessageInbox(messages, state.profile.username);
  setCounts({
    friends: Number(elements.friendsCount.textContent) || 0,
    messages: messages.length,
    emotions: Number(elements.emotionsCount.textContent) || 0,
  });
}

async function sendFriendRequest(profile) {
  if (!state.session?.user || !state.profile || !profile) return;

  if (profile.username === state.profile.username) {
    setStatusMessage(elements.friendStatus, 'You cannot add yourself.', 'text-amber-600');
    return;
  }

  setStatusMessage(elements.friendStatus, 'Sending friend request...', 'text-slate-500');
  const { data: existing } = await state.supabase
    .from('friendships')
    .select('id, status')
    .or(`and(requester.eq.${state.session.user.id},addressee.eq.${profile.id}),and(requester.eq.${profile.id},addressee.eq.${state.session.user.id})`)
    .maybeSingle();

  if (existing) {
    setStatusMessage(elements.friendStatus, 'You already have a connection with this user.', 'text-amber-600');
    return;
  }

  const { error: insertError } = await state.supabase.from('friendships').insert({
    requester: state.session.user.id,
    addressee: profile.id,
    status: 'pending',
  });

  if (insertError) {
    setStatusMessage(elements.friendStatus, insertError.message, 'text-rose-600');
    return;
  }

  setStatusMessage(elements.friendStatus, `Request sent to ${profile.name}.`, 'text-emerald-600');
  await loadDashboard();
}

async function acceptFriendRequest(requestId) {
  if (!state.session?.user) return;
  const { error } = await state.supabase
    .from('friendships')
    .update({ status: 'accepted' })
    .eq('id', requestId);

  if (error) {
    setStatusMessage(elements.friendStatus, error.message, 'text-rose-600');
    return;
  }

  setStatusMessage(elements.friendStatus, 'Friend request accepted.', 'text-emerald-600');
  await loadDashboard();
}

async function handleProfileSubmit(event) {
  event.preventDefault();
  if (!state.session?.user) return;

  const payload = {
    id: state.session.user.id,
    display_name: elements.profileDisplayName.value.trim(),
    username: elements.profileUsername.value.trim(),
    avatar_url: elements.profileAvatar.value.trim(),
    bio: elements.profileBio.value.trim(),
  };

  if (!payload.username) {
    setStatusMessage(elements.profileStatus, 'Username cannot be empty.', 'text-amber-600');
    return;
  }

  setStatusMessage(elements.profileStatus, 'Saving profile...', 'text-slate-500');
  const { error } = await state.supabase.from('profiles').upsert(payload);

  if (error) {
    setStatusMessage(elements.profileStatus, error.message, 'text-rose-600');
    return;
  }

  setStatusMessage(elements.profileStatus, 'Profile updated.', 'text-emerald-600');
  await loadDashboard();
}

function attachListeners() {
  elements.authSignin.addEventListener('click', () => setAuthMode('signin'));
  elements.authSignup.addEventListener('click', () => setAuthMode('signup'));
  elements.authForm.addEventListener('submit', handleAuthSubmit);
  if (elements.signOut) {
    elements.signOut.addEventListener('click', handleSignOut);
  }
  if (elements.refreshDashboard) {
    elements.refreshDashboard.addEventListener('click', handleRefresh);
  }
  if (elements.moodForm) {
    elements.moodForm.addEventListener('submit', handleMoodSubmit);
  }
  if (elements.messageForm) {
    elements.messageForm.addEventListener('submit', handleMessageSubmit);
  }
  if (elements.friendSearch) {
    elements.friendSearch.addEventListener('input', async (event) => {
      if (!state.session?.user) return;
      const queryText = event.target.value.trim();
      if (!queryText) {
        renderFriendSearchResults([]);
        return;
      }
      const results = await searchProfiles(queryText, state.session.user.id);
      renderFriendSearchResults(results);
    });
  }
  if (elements.notificationsToggle && elements.notificationsPanel) {
    elements.notificationsToggle.addEventListener('click', () => {
      elements.notificationsPanel.classList.toggle('hidden');
    });
    document.addEventListener('click', (event) => {
      if (!elements.notificationsPanel.contains(event.target) && !elements.notificationsToggle.contains(event.target)) {
        elements.notificationsPanel.classList.add('hidden');
      }
    });
  }
  if (elements.profileForm) {
    elements.profileForm.addEventListener('submit', handleProfileSubmit);
  }
  elements.pageToggleButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const pageTarget = button.dataset.pageTarget;
      if (pageTarget) {
        setActivePage(pageTarget);
      }
    });
  });
}

async function initializeSupabase() {
  if (!supabaseAnonKey) {
    setConnectionStatus('Needs key', 'text-amber-700 bg-amber-100');
    resetDashboard();
    showGuestView();
    return;
  }

  if (!state.supabase) {
    state.supabase = window.supabase.createClient(supabaseUrl, supabaseAnonKey);
  }

  setConnectionStatus('Connected', 'text-emerald-700 bg-emerald-100');

  const { data } = await state.supabase.auth.getSession();
  state.session = data.session;

  if (state.session?.user) {
    setAuthMessage(`Welcome back, ${state.session.user.email}`, 'text-emerald-600');
    showAppView();
    setActivePage(state.activePage);
    await loadDashboard();
    if (state.profile?.username) {
      subscribeToNotifications(state.profile.username, state.session.user.id);
    }
  } else {
    setAuthMessage('Sign in to view your TapMood data.', 'text-slate-500');
    resetDashboard();
    showGuestView();
  }

  state.supabase.auth.onAuthStateChange(async (_event, session) => {
    state.session = session;
    if (session?.user) {
      showAppView();
      setActivePage(state.activePage);
      await loadDashboard();
      if (state.profile?.username) {
        subscribeToNotifications(state.profile.username, session.user.id);
      }
    } else {
      resetDashboard();
      showGuestView();
    }
  });
}

function subscribeToNotifications(username, userId) {
  if (!state.supabase || !username || !userId) return;
  if (state.notificationChannel) {
    state.supabase.removeChannel(state.notificationChannel);
  }

  state.notificationChannel = state.supabase
    .channel(`tapmood-notifications-${userId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'friendships', filter: `addressee=eq.${userId}` },
      () => loadNotifications({ userId, username })
    )
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `recipient_code=eq.${username}` },
      () => loadNotifications({ userId, username })
    )
    .subscribe();
}

setAuthMode('signin');
setActivePage(state.activePage);
renderDiscoverPeople([]);
renderFriendSearchResults([]);
attachListeners();
initializeSupabase();
