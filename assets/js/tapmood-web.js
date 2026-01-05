const config = window.tapmoodConfig || {};
const supabaseUrl = config.supabaseUrl || 'https://lxylwexfjhtzvepwvjal.supabase.co';
const supabaseAnonKey = config.supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4eWx3ZXhmamh0enZlcHd2amFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwNTY3ODEsImV4cCI6MjA4MjYzMjc4MX0.78Jc7gu59eU5XOgZiVpkn4dq1GrX3uKCEsV_ffXCU3E';

const elements = {
  guestView: document.getElementById('guest-view'),
  appView: document.getElementById('app-view'),
  configCard: document.getElementById('config-card'),
  configStatus: document.getElementById('config-status'),
  connectionStatus: document.getElementById('connection-status'),
  connectionStatusApp: document.getElementById('connection-status-app'),
  authCard: document.getElementById('auth-card'),
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
  friendsCount: document.getElementById('friends-count'),
  conversationsCount: document.getElementById('conversations-count'),
  messagesCount: document.getElementById('messages-count'),
  emotionsCount: document.getElementById('emotions-count'),
  friendsList: document.getElementById('friends-list'),
  friendsPreview: document.getElementById('friends-preview'),
  conversationList: document.getElementById('conversation-list'),
  messagesList: document.getElementById('messages-list'),
  conversationTitle: document.getElementById('conversation-title'),
  conversationSubtitle: document.getElementById('conversation-subtitle'),
  emotionsList: document.getElementById('emotions-list'),
  profileCard: document.getElementById('profile-card'),
  signOut: document.getElementById('sign-out'),
  refreshDashboard: document.getElementById('refresh-dashboard'),
  pageTabs: document.querySelectorAll('[data-page]'),
  pagePanels: document.querySelectorAll('[data-page-panel]'),
};

const state = {
  supabase: null,
  authMode: 'signin',
  session: null,
  profile: null,
  conversations: [],
};

function setConnectionStatus(text, tone = 'text-slate-400') {
  if (elements.connectionStatus) {
    elements.connectionStatus.textContent = text;
    elements.connectionStatus.className = `rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-widest ${tone}`;
  }
  if (elements.connectionStatusApp) {
    elements.connectionStatusApp.textContent = text;
    elements.connectionStatusApp.className = `rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-widest ${tone}`;
  }
}

function setConfigStatus(text, tone = 'text-emerald-700', background = 'bg-emerald-100') {
  if (!elements.configStatus) return;
  elements.configStatus.textContent = text;
  elements.configStatus.className = `rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-widest ${background} ${tone}`;
}

function setAuthMessage(text, tone = 'text-slate-500') {
  elements.authMessage.textContent = text;
  elements.authMessage.className = `text-sm ${tone}`;
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
  if (elements.guestView) {
    elements.guestView.classList.remove('hidden');
  }
  if (elements.appView) {
    elements.appView.classList.add('hidden');
  }
}

function showAppView() {
  if (elements.guestView) {
    elements.guestView.classList.add('hidden');
  }
  if (elements.appView) {
    elements.appView.classList.remove('hidden');
  }
}

function setActivePage(page) {
  elements.pageTabs.forEach((tab) => {
    const isActive = tab.dataset.page === page;
    tab.classList.toggle('bg-slate-900', isActive);
    tab.classList.toggle('text-white', isActive);
    tab.classList.toggle('border', !isActive);
    tab.classList.toggle('border-slate-200', !isActive);
    tab.classList.toggle('text-slate-600', !isActive);
    tab.classList.toggle('bg-white', !isActive);
  });

  elements.pagePanels.forEach((panel) => {
    panel.classList.toggle('hidden', panel.dataset.pagePanel !== page);
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
  const lists = [
    { element: elements.friendsList, empty: 'No friends found yet.' },
    { element: elements.friendsPreview, empty: 'No friends online yet.' },
  ];

  lists.forEach(({ element, empty }) => {
    if (!element) return;
    element.innerHTML = '';
    if (!friends.length) {
      element.innerHTML = `<li>${empty}</li>`;
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
      element.appendChild(item);
    });
  });
}

function renderConversations(conversations) {
  elements.conversationList.innerHTML = '';
  if (!conversations.length) {
    elements.conversationList.innerHTML = '<li>No conversations yet.</li>';
    return;
  }

  conversations.forEach((conversation, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'w-full rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2 text-left transition hover:bg-slate-100';
    button.dataset.conversationId = conversation.id;
    button.innerHTML = `
      <p class="text-sm font-semibold text-slate-700">${conversation.title}</p>
      <p class="text-xs text-slate-400">${conversation.subtitle}</p>
    `;
    if (index === 0) {
      button.classList.add('border-teal-200', 'bg-teal-50');
    }
    elements.conversationList.appendChild(button);
  });
}

function renderMessages(messages) {
  elements.messagesList.innerHTML = '';
  if (!messages.length) {
    elements.messagesList.innerHTML = '<p>No messages yet.</p>';
    return;
  }

  messages.forEach((message) => {
    const senderName = message.sender_profile?.display_name || message.sender_profile?.username || 'Unknown';
    const time = new Date(message.created_at).toLocaleString();
    const item = document.createElement('div');
    item.className = 'rounded-2xl border border-slate-100 bg-white px-3 py-2';
    item.innerHTML = `
      <p class="text-xs font-semibold text-slate-400">${senderName} • ${time}</p>
      <p class="text-sm text-slate-600">${message.body}</p>
    `;
    elements.messagesList.appendChild(item);
  });
}

function renderEmotions(emotions) {
  elements.emotionsList.innerHTML = '';
  if (!emotions.length) {
    elements.emotionsList.innerHTML = '<div class="rounded-2xl border border-slate-100 bg-slate-50 p-4">No emotions logged yet.</div>';
    return;
  }

  emotions.forEach((emotion) => {
    const card = document.createElement('div');
    card.className = 'rounded-2xl border border-slate-100 bg-slate-50 p-4';
    card.innerHTML = `
      <div class="text-2xl">${emotion.emoji || '✨'}</div>
      <p class="mt-2 text-sm font-semibold text-slate-700">${emotion.label || 'Emotion logged'}</p>
      <p class="text-xs text-slate-400">Intensity ${emotion.intensity || '—'} • ${new Date(emotion.created_at).toLocaleDateString()}</p>
      <p class="mt-2 text-xs text-slate-500">${emotion.note || 'No note added.'}</p>
    `;
    elements.emotionsList.appendChild(card);
  });
}

function setCounts({ friends = 0, conversations = 0, messages = 0, emotions = 0 }) {
  elements.friendsCount.textContent = friends;
  elements.conversationsCount.textContent = conversations;
  elements.messagesCount.textContent = messages;
  elements.emotionsCount.textContent = emotions;
}

async function loadProfile(user) {
  const { data, error } = await state.supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url')
    .eq('id', user.id)
    .single();

  if (error) {
    setAuthMessage('Unable to load profile data.', 'text-amber-600');
    return null;
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
      avatar_url: friendProfile?.avatar_url || '',
      statusLabel: row.status === 'accepted' ? 'Connected' : row.status,
    };
  });
}

async function loadConversations(userId) {
  const { data, error } = await state.supabase
    .from('conversation_members')
    .select('conversation_id, conversations(id, title, is_group, updated_at)')
    .eq('user_id', userId)
    .order('joined_at', { ascending: false });

  if (error) {
    return [];
  }

  return data.map((row) => {
    const conversation = row.conversations || {};
    return {
      id: row.conversation_id,
      title: conversation.title || (conversation.is_group ? 'Group chat' : 'Direct chat'),
      subtitle: conversation.updated_at ? `Updated ${new Date(conversation.updated_at).toLocaleDateString()}` : 'Tap to view messages',
    };
  });
}

async function loadMessages(conversationId) {
  const { data, error } = await state.supabase
    .from('messages')
    .select('id, body, created_at, sender, sender_profile:profiles!messages_sender_fkey(username, display_name, avatar_url)')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(40);

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
  if (!state.session?.user) {
    return;
  }

  const user = state.session.user;
  setAuthMessage('Loading dashboard data...', 'text-slate-500');

  const [profile, friends, conversations, emotions] = await Promise.all([
    loadProfile(user),
    loadFriends(user.id),
    loadConversations(user.id),
    loadEmotions(user.id),
  ]);

  state.profile = profile;
  state.conversations = conversations;

  renderProfile(profile, user);
  renderFriends(friends);
  renderConversations(conversations);
  renderEmotions(emotions);

  if (elements.signOut) {
    elements.signOut.classList.remove('hidden');
  }

  let messagesCount = 0;
  if (conversations.length) {
    const firstConversation = conversations[0];
    const messages = await loadMessages(firstConversation.id);
    messagesCount = messages.length;
    renderMessages(messages);
    elements.conversationTitle.textContent = firstConversation.title;
    elements.conversationSubtitle.textContent = firstConversation.subtitle;
  } else {
    elements.messagesList.innerHTML = '<p>No messages yet.</p>';
    elements.conversationTitle.textContent = 'Messages';
    elements.conversationSubtitle.textContent = 'No conversation selected';
  }

  setCounts({
    friends: friends.length,
    conversations: conversations.length,
    messages: messagesCount,
    emotions: emotions.length,
  });

  setAuthMessage('Dashboard ready.', 'text-emerald-600');
}

async function handleConversationClick(event) {
  const button = event.target.closest('button[data-conversation-id]');
  if (!button) return;

  const conversationId = button.dataset.conversationId;
  const selected = state.conversations.find((conversation) => conversation.id === conversationId);
  if (!selected) return;

  document.querySelectorAll('#conversation-list button').forEach((node) => {
    node.classList.remove('border-teal-200', 'bg-teal-50');
  });
  button.classList.add('border-teal-200', 'bg-teal-50');

  elements.conversationTitle.textContent = selected.title;
  elements.conversationSubtitle.textContent = selected.subtitle;
  elements.messagesList.innerHTML = '<p>Loading messages...</p>';

  const messages = await loadMessages(conversationId);
  renderMessages(messages);
  elements.messagesCount.textContent = messages.length;
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
  if (elements.friendsPreview) {
    elements.friendsPreview.innerHTML = '<li>Sign in to view friends.</li>';
  }
  elements.conversationList.innerHTML = '<li>Sign in to view conversations.</li>';
  elements.messagesList.innerHTML = '<p>Messages will appear here once you select a conversation.</p>';
  elements.emotionsList.innerHTML = '<div class="rounded-2xl border border-slate-100 bg-slate-50 p-4">Sign in to view recent emotions.</div>';
  elements.conversationTitle.textContent = 'Messages';
  elements.conversationSubtitle.textContent = 'No conversation selected';
  renderProfile(null, null);
  if (elements.signOut) {
    elements.signOut.classList.add('hidden');
  }
}

async function handleRefresh() {
  if (!state.session?.user) return;
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
  if (elements.conversationList) {
    elements.conversationList.addEventListener('click', handleConversationClick);
  }
  elements.pageTabs.forEach((tab) => {
    tab.addEventListener('click', () => setActivePage(tab.dataset.page));
  });
}

async function initializeSupabase() {
  if (!supabaseAnonKey) {
    setConfigStatus('Missing key', 'text-amber-700', 'bg-amber-100');
    setConnectionStatus('Needs key', 'text-amber-700 bg-amber-100');
    resetDashboard();
    showGuestView();
    return;
  }

  setConfigStatus('Ready', 'text-emerald-700', 'bg-emerald-100');

  if (!state.supabase) {
    state.supabase = window.supabase.createClient(supabaseUrl, supabaseAnonKey);
  }

  setConnectionStatus('Connected', 'text-emerald-700 bg-emerald-100');

  const { data } = await state.supabase.auth.getSession();
  state.session = data.session;

  if (state.session?.user) {
    setAuthMessage(`Welcome back, ${state.session.user.email}`, 'text-emerald-600');
    showAppView();
    await loadDashboard();
  } else {
    setAuthMessage('Sign in to view your TapMood data.', 'text-slate-500');
    resetDashboard();
    showGuestView();
  }

  state.supabase.auth.onAuthStateChange(async (_event, session) => {
    state.session = session;
    if (session?.user) {
      showAppView();
      await loadDashboard();
    } else {
      resetDashboard();
      showGuestView();
    }
  });
}

setAuthMode('signin');
setActivePage('feed');
attachListeners();
initializeSupabase();
