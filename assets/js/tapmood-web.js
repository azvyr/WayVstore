/**
 * TapMood Web Client Logic
 * version: 1.3.0 (Refactor + UX + Realtime)
 * engineering: vanilla JS / Supabase v2
 *
 * Goals:
 * - Feel like a real social app: realtime updates, optimistic UI, better inbox, better notifications
 * - Safer + cleaner code: centralized UI helpers, error handling, query hygiene, fewer full reloads
 * - Faster: incremental refresh, local cache, minimal DOM churn
 */

/* ---------------------------- 1) Config ---------------------------- */

const config = window.tapmoodConfig || {};
const supabaseUrl =
  config.supabaseUrl || "https://lxylwexfjhtzvepwvjal.supabase.co";
const supabaseAnonKey =
  config.supabaseAnonKey ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4eWx3ZXhmamh0enZlcHd2amFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwNTY3ODEsImV4cCI6MjA4MjYzMjc4MX0.78Jc7gu59eU5XOgZiVpkn4dq1GrX3uKCEsV_ffXCU3E";

const supabaseScriptSources = [
  "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2",
  "https://unpkg.com/@supabase/supabase-js@2",
];

/* ---------------------------- 2) DOM ---------------------------- */

const el = {
  guestView: document.getElementById("guest-view"),
  appView: document.getElementById("app-view"),
  connectionStatus: document.getElementById("connection-status"),
  connectionStatusApp: document.getElementById("connection-status-app"),

  // Auth
  authForm: document.getElementById("auth-form"),
  authUsernameField: document.getElementById("auth-username-field"),
  authUsername: document.getElementById("auth-username"),
  authEmail: document.getElementById("auth-email"),
  authPassword: document.getElementById("auth-password"),
  authHelper: document.getElementById("auth-helper"),
  authMessage: document.getElementById("auth-message"),
  authSubmit: document.getElementById("auth-submit"),
  authSignin: document.getElementById("auth-signin"),
  authSignup: document.getElementById("auth-signup"),
  signOut: document.getElementById("sign-out"),

  // Dashboard & Navigation
  notificationsToggle: document.getElementById("notifications-toggle"),
  notificationsPanel: document.getElementById("notifications-panel"),
  notificationsList: document.getElementById("notifications-list"),
  notificationsFriends: document.getElementById("notifications-friends"),
  notificationsBadge: document.getElementById("notifications-badge"),
  refreshDashboard: document.getElementById("refresh-dashboard"),

  // Stats
  friendsCount: document.getElementById("friends-count"),
  messagesCount: document.getElementById("messages-count"),
  emotionsCount: document.getElementById("emotions-count"),

  // Moods
  emotionsList: document.getElementById("emotions-list"),
  moodForm: document.getElementById("mood-form"),
  moodEmoji: document.getElementById("mood-emoji"),
  moodLabel: document.getElementById("mood-label"),
  moodIntensity: document.getElementById("mood-intensity"),
  moodNote: document.getElementById("mood-note"),
  moodStatus: document.getElementById("mood-status"),

  // Messages
  messageForm: document.getElementById("message-form"),
  messageRecipient: document.getElementById("message-recipient"),
  messageText: document.getElementById("message-text"),
  messageStatus: document.getElementById("message-status"),
  messagesList: document.getElementById("messages-list"),
  messagesInbox: document.getElementById("messages-inbox"),
  messagesFriends: document.getElementById("messages-friends"),
  inboxSearch: document.getElementById("inbox-search"),
  messageThreadName: document.getElementById("message-thread-name"),
  messageThreadStatus: document.getElementById("message-thread-status"),
  messageThreadAvatar: document.getElementById("message-thread-avatar"),
  messageTypingStatus: document.getElementById("message-typing-status"),
  dbTimeoutPopup: document.getElementById("db-timeout-popup"),
  dbTimeoutClose: document.getElementById("db-timeout-close"),
  dbTimeoutRetry: document.getElementById("db-timeout-retry"),

  // Friends
  friendsList: document.getElementById("friends-list"),
  friendSearch: document.getElementById("friend-search"),
  friendSearchResults: document.getElementById("friend-search-results"),
  friendStatus: document.getElementById("friend-status"),
  friendRequests: document.getElementById("friend-requests"),
  friendDiscover: document.getElementById("friend-discover"),

  // Profile
  profileCard: document.getElementById("profile-card"),
  profileForm: document.getElementById("profile-form"),
  profileDisplayName: document.getElementById("profile-display-name"),
  profileUsername: document.getElementById("profile-username"),
  profileAvatar: document.getElementById("profile-avatar"),
  profileBio: document.getElementById("profile-bio"),
  profileStatus: document.getElementById("profile-status"),

  // Structure
  activityFeed: document.getElementById("activity-feed"),
  navMessagesCount: document.getElementById("nav-messages-count"),
  navFriendsCount: document.getElementById("nav-friends-count"),
  navButtons: Array.from(document.querySelectorAll(".tapmood-nav-item")),
  topNavButtons: Array.from(document.querySelectorAll(".tapmood-top-nav")),
  pageToggleButtons: Array.from(document.querySelectorAll("[data-page-target]")),
  pageSections: Array.from(document.querySelectorAll("[data-page]")),
};

/* ---------------------------- 3) State ---------------------------- */

const state = {
  supabase: null,
  authMode: "signin",
  session: null,
  profile: null,
  activePage: "home",

  // data caches
  friends: [],
  emotions: [],
  messages: [],
  requests: [],
  suggested: [],

  // realtime
  rt: {
    channel: null,
    enabled: true,
  },

  // inbox
  selectedThreadUser: "",
  inboxFilter: "",
  typing: {
    peers: {},
    timers: new Map(),
    localTimer: null,
    lastSentAt: 0,
    lastTo: "",
  },

  // notification list
  notifications: [],

  // UX flags
  busy: {
    auth: false,
    dashboard: false,
    moodPost: false,
    msgSend: false,
    profileSave: false,
    friendAction: false,
  },

  // stale guard for async
  runId: 0,

  // search debounce
  searchTimer: null,
  searchToken: 0,
};

/* ---------------------------- 4) Utils ---------------------------- */

function safeText(s) {
  if (s == null) return "";
  return String(s);
}

function clampInt(n, min, max) {
  const v = Number.parseInt(n, 10);
  if (Number.isNaN(v)) return null;
  return Math.max(min, Math.min(max, v));
}

function nowIso() {
  return new Date().toISOString();
}

function timeAgo(iso) {
  if (!iso) return "";
  const t = new Date(iso).getTime();
  const d = Date.now() - t;
  const s = Math.floor(d / 1000);
  if (s < 10) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  return `${days}d ago`;
}

function getInitials(name) {
  const safe = safeText(name).trim();
  if (!safe) return "TM";
  return safe
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

function renderAvatar({ name, username, avatar_url }, size = "h-10 w-10") {
  if (avatar_url) {
    return `<img src="${avatar_url}" alt="${safeText(
      name || username || "Friend"
    )}" class="${size} rounded-2xl object-cover" />`;
  }
  return `<div class="${size} flex items-center justify-center rounded-2xl bg-slate-200 text-[11px] font-semibold text-slate-600">${getInitials(
    name || username || "Friend"
  )}</div>`;
}

function findFriendByUsername(username) {
  if (!username) return null;
  const normalized = username.replace("@", "").trim().toLowerCase();
  return state.friends.find(
    (friend) => safeText(friend.username).toLowerCase() === normalized
  );
}

function setConnectionStatus(text, tone = "text-slate-400 bg-slate-100") {
  const className = `rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-widest ${tone}`;
  if (el.connectionStatus) {
    el.connectionStatus.textContent = text;
    el.connectionStatus.className = className;
  }
  if (el.connectionStatusApp) {
    el.connectionStatusApp.textContent = text;
    el.connectionStatusApp.className = className;
  }
}

function setAuthMessage(text, tone = "text-slate-500") {
  if (!el.authMessage) return;
  el.authMessage.textContent = text;
  el.authMessage.className = `text-sm ${tone}`;
}

function setStatusMessage(node, text, tone = "text-slate-500") {
  if (!node) return;
  node.textContent = text;
  node.className = `text-sm ${tone}`;
}

/* ---------------------------- Toasts ---------------------------- */
/* Minimal toast system, no CSS required, uses Tailwind classes. */

let toastHost = null;
let dbTimeoutTimer = null;

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const existing = Array.from(document.scripts).find((script) => script.src === src);
    if (existing) {
      if (typeof supabase !== "undefined") return resolve();
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error(`Failed to load ${src}`)));
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
}

async function ensureSupabaseLoaded() {
  if (typeof supabase !== "undefined") return true;

  for (const src of supabaseScriptSources) {
    try {
      await loadScript(src);
      if (typeof supabase !== "undefined") return true;
    } catch (error) {
      console.warn(error);
    }
  }

  return false;
}

function ensureToastHost() {
  if (toastHost) return toastHost;
  const host = document.createElement("div");
  host.id = "tapmood-toast-host";
  host.className =
    "fixed bottom-6 right-6 z-[9999] flex max-w-[90vw] flex-col gap-2";
  document.body.appendChild(host);
  toastHost = host;
  return host;
}

function showDbTimeoutPopup() {
  if (el.dbTimeoutPopup) el.dbTimeoutPopup.classList.remove("hidden");
}

function hideDbTimeoutPopup() {
  if (el.dbTimeoutPopup) el.dbTimeoutPopup.classList.add("hidden");
}

function scheduleDbTimeoutPopup() {
  if (dbTimeoutTimer) clearTimeout(dbTimeoutTimer);
  dbTimeoutTimer = setTimeout(() => {
    if (state.busy.dashboard) showDbTimeoutPopup();
  }, 5000);
}

function toast(msg, kind = "info") {
  const host = ensureToastHost();
  const t = document.createElement("div");
  const base =
    "rounded-2xl border px-4 py-3 text-sm shadow-[0_18px_40px_rgba(15,23,42,0.18)] backdrop-blur";
  const style =
    kind === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : kind === "error"
        ? "border-rose-200 bg-rose-50 text-rose-900"
        : kind === "warn"
          ? "border-amber-200 bg-amber-50 text-amber-900"
          : "border-slate-200 bg-white/90 text-slate-800";
  t.className = `${base} ${style}`;
  t.textContent = msg;
  host.appendChild(t);
  setTimeout(() => {
    t.style.opacity = "0";
    t.style.transform = "translateY(6px)";
    t.style.transition = "opacity 220ms ease, transform 220ms ease";
    setTimeout(() => t.remove(), 240);
  }, 2200);
}

function getLastMessageForThread(username) {
  if (!username || !state.messages.length || !state.profile?.username) return null;
  const myUsername = state.profile.username;
  let last = null;
  state.messages.forEach((m) => {
    const sender = safeText(m.sender_code || "");
    const recipient = safeText(m.recipient_code || "");
    const other = sender === myUsername ? recipient : sender || recipient;
    if (other !== username) return;
    const mt = new Date(m.timestamp || m.created_at || 0).getTime();
    const lt = last ? new Date(last.timestamp || last.created_at || 0).getTime() : 0;
    if (!last || mt > lt) last = m;
  });
  return last;
}

function updateThreadHeader() {
  if (!el.messageThreadName || !el.messageThreadStatus || !el.messageThreadAvatar) return;

  const otherUser = state.selectedThreadUser;
  if (!otherUser) {
    el.messageThreadName.textContent = "Select a conversation";
    el.messageThreadStatus.textContent = "Tap a friend to open chat.";
    el.messageThreadAvatar.innerHTML = "TM";
    if (el.messageTypingStatus) el.messageTypingStatus.textContent = "";
    return;
  }

  const friend = findFriendByUsername(otherUser);
  const displayName = friend?.name || otherUser;
  const avatarMarkup = renderAvatar(
    {
      name: friend?.name || otherUser,
      username: friend?.username || otherUser,
      avatar_url: friend?.avatar_url || "",
    },
    "h-12 w-12"
  );

  el.messageThreadName.textContent = displayName;
  el.messageThreadAvatar.innerHTML = avatarMarkup;

  const typing = state.typing.peers?.[otherUser];
  if (typing) {
    el.messageThreadStatus.textContent = "Typing now…";
    if (el.messageTypingStatus) el.messageTypingStatus.textContent = "Typing";
    return;
  }

  const lastMessage = getLastMessageForThread(otherUser);
  if (lastMessage?.timestamp || lastMessage?.created_at) {
    const when = lastMessage.timestamp || lastMessage.created_at;
    el.messageThreadStatus.textContent = `Last active ${timeAgo(when)}`;
  } else {
    el.messageThreadStatus.textContent = "Say hello to start the conversation.";
  }
  if (el.messageTypingStatus) el.messageTypingStatus.textContent = "";
}

function setTypingIndicator(user, isTyping) {
  if (!user) return;
  if (isTyping) {
    state.typing.peers[user] = true;
  } else {
    delete state.typing.peers[user];
  }
  updateThreadHeader();
  if (state.profile?.username) {
    renderMessageInbox(state.messages, state.profile.username);
  }
}

function sendTypingEvent(isTyping, overrideUser) {
  if (!state.rt.channel || !state.profile?.username) return;
  const toUser = overrideUser || state.selectedThreadUser;
  if (!toUser) return;

  const now = Date.now();
  if (isTyping && now - state.typing.lastSentAt < 800) return;

  state.typing.lastSentAt = now;
  state.typing.lastTo = toUser;

  state.rt.channel.send({
    type: "broadcast",
    event: "typing",
    payload: {
      from: state.profile.username,
      to: toUser,
      typing: Boolean(isTyping),
    },
  });
}

function handleTypingInput() {
  const text = el.messageText?.value || "";
  const hasText = text.trim().length > 0;
  sendTypingEvent(hasText);

  if (state.typing.localTimer) clearTimeout(state.typing.localTimer);
  state.typing.localTimer = setTimeout(() => {
    sendTypingEvent(false);
  }, 1600);
}

function setActiveThread(otherUser) {
  const clean = safeText(otherUser || "").replace("@", "").trim();
  if (!clean) return;

  if (state.selectedThreadUser && state.selectedThreadUser !== clean) {
    sendTypingEvent(false, state.selectedThreadUser);
  }

  state.selectedThreadUser = clean;
  if (el.messageRecipient) el.messageRecipient.value = clean;
  updateThreadHeader();
}

function showGuestView() {
  el.guestView?.classList.remove("hidden");
  el.appView?.classList.add("hidden");
}

function showAppView() {
  el.guestView?.classList.add("hidden");
  el.appView?.classList.remove("hidden");
}

function setCounts({ friends = 0, messages = 0, emotions = 0 }) {
  if (el.friendsCount) el.friendsCount.textContent = String(friends);
  if (el.messagesCount) el.messagesCount.textContent = String(messages);
  if (el.emotionsCount) el.emotionsCount.textContent = String(emotions);
  if (el.navFriendsCount) el.navFriendsCount.textContent = String(friends);
  if (el.navMessagesCount) el.navMessagesCount.textContent = String(messages);
}

function setAuthMode(mode) {
  state.authMode = mode;
  if (!el.authSignin || !el.authSignup || !el.authSubmit) return;

  const on = (btn) => {
    btn.classList.add("bg-slate-900", "text-white");
    btn.classList.remove("border", "border-slate-200", "text-slate-500");
  };

  const off = (btn) => {
    btn.classList.remove("bg-slate-900", "text-white");
    btn.classList.add("border", "border-slate-200", "text-slate-500");
  };

  if (mode === "signin") {
    on(el.authSignin);
    off(el.authSignup);
    el.authSubmit.textContent = "Sign In";
    el.authUsernameField?.classList.add("hidden");
    if (el.authHelper)
      el.authHelper.textContent =
        "Use the same TapMood credentials you already have on mobile.";
  } else {
    on(el.authSignup);
    off(el.authSignin);
    el.authSubmit.textContent = "Sign Up";
    el.authUsernameField?.classList.remove("hidden");
    if (el.authHelper)
      el.authHelper.textContent =
        "Pick a unique username so friends can find you fast.";
  }
}

function setActivePage(page) {
  state.activePage = page;

  el.pageSections.forEach((section) => {
    section.classList.toggle("hidden", section.dataset.page !== page);
  });

  el.navButtons.forEach((button) => {
    const isActive = button.dataset.pageTarget === page;
    button.className = isActive
      ? "tapmood-nav-item flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-900 px-4 py-3 text-left text-sm font-semibold text-white"
      : "tapmood-nav-item flex w-full items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-left text-sm font-semibold text-slate-600 transition hover:bg-slate-100";
  });

  el.topNavButtons.forEach((button) => {
    const isActive = button.dataset.pageTarget === page;
    button.className = isActive
      ? "tapmood-top-nav rounded-full border border-slate-200 bg-slate-900 px-4 py-2 text-white transition hover:bg-slate-800"
      : "tapmood-top-nav rounded-full border border-slate-200 bg-white px-4 py-2 text-slate-600 transition hover:bg-slate-50";
  });

  // small UX touch
  if (page === "messages" && el.messageRecipient) {
    el.messageRecipient.focus({ preventScroll: true });
    updateThreadHeader();
  }
}

function closeNotifications() {
  el.notificationsPanel?.classList.add("hidden");
}

function openNotifications() {
  el.notificationsPanel?.classList.remove("hidden");
}

function toggleNotifications() {
  el.notificationsPanel?.classList.toggle("hidden");
}

/* ---------------------------- 5) Render ---------------------------- */

function renderProfile(profile, user) {
  if (!el.profileCard) return;

  if (!profile || !user) {
    el.profileCard.innerHTML = `
      <div class="h-12 w-12 rounded-full bg-slate-200"></div>
      <div>
        <p class="font-semibold">Not signed in</p>
        <p>Sign in to load your profile.</p>
      </div>
    `;
    return;
  }

  const displayName = profile.display_name || profile.username || user.email;
  const username = profile.username ? `@${profile.username}` : "";
  const avatar = profile.avatar_url
    ? `<img src="${profile.avatar_url}" alt="${safeText(
        displayName
      )}" class="h-12 w-12 rounded-full object-cover" />`
    : `<div class="h-12 w-12 rounded-full bg-gradient-to-br from-teal-400 to-indigo-400"></div>`;

  el.profileCard.innerHTML = `
    ${avatar}
    <div class="min-w-0">
      <p class="truncate font-semibold">${safeText(displayName)}</p>
      <p class="truncate">${safeText(username || user.email)}</p>
    </div>
  `;
}

function renderFriends(friends) {
  if (!el.friendsList) return;
  el.friendsList.innerHTML = "";

  if (!friends.length) {
    el.friendsList.innerHTML =
      '<li class="text-slate-500">No friends yet.</li>';
    return;
  }

  friends.forEach((friend) => {
    const name = safeText(friend.name || "Friend");
    const handle = safeText(friend.username || "");
    const avatar = friend.avatar_url
      ? `<img src="${friend.avatar_url}" alt="${name}" class="h-8 w-8 rounded-full object-cover" />`
      : `<div class="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-[10px] font-semibold text-slate-500">${name
          .slice(0, 2)
          .toUpperCase()}</div>`;

    const item = document.createElement("li");
    item.className =
      "flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2";

    item.innerHTML = `
      <div class="flex min-w-0 items-center gap-3">
        ${avatar}
        <div class="min-w-0">
          <p class="truncate font-semibold text-slate-700">${name}</p>
          <p class="truncate text-xs text-slate-400">${handle ? `@${handle}` : friend.statusLabel || ""}</p>
        </div>
      </div>
      <button type="button" class="msg-btn shrink-0 rounded-full border border-slate-200 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-slate-500 hover:bg-white">
        Message
      </button>
    `;

    const btn = item.querySelector(".msg-btn");
    if (btn) {
      btn.addEventListener("click", async () => {
        setActivePage("messages");
        setActiveThread(handle || name);
        await loadThreadIfPossible(handle || name);
      });
    }

    el.friendsList.appendChild(item);
  });
}

function renderFriendRequests(requests) {
  if (!el.friendRequests) return;
  el.friendRequests.innerHTML = "";

  if (!requests.length) {
    el.friendRequests.innerHTML =
      '<p class="text-slate-500">No pending friend requests.</p>';
    return;
  }

  requests.forEach((request) => {
    const name = safeText(request.name || "TapMood user");
    const username = safeText(request.username || "tapmood");
    const avatar = request.avatar_url
      ? `<img src="${request.avatar_url}" alt="${name}" class="h-9 w-9 rounded-full object-cover" />`
      : `<div class="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-[10px] font-semibold text-slate-500">${name
          .slice(0, 2)
          .toUpperCase()}</div>`;

    const row = document.createElement("div");
    row.className =
      "flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2";

    row.innerHTML = `
      <div class="flex min-w-0 items-center gap-3">
        ${avatar}
        <div class="min-w-0">
          <p class="truncate text-sm font-semibold text-slate-700">${name}</p>
          <p class="truncate text-xs text-slate-400">@${username}</p>
        </div>
      </div>
      <button type="button" class="accept-btn rounded-full bg-slate-900 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-white hover:bg-slate-800">
        Accept
      </button>
    `;

    const btn = row.querySelector(".accept-btn");
    if (btn) btn.addEventListener("click", () => acceptFriendRequest(request.id));

    el.friendRequests.appendChild(row);
  });
}

function renderNotifications(notifications) {
  if (!el.notificationsList || !el.notificationsBadge) return;

  el.notificationsList.innerHTML = "";
  const count = notifications.length;

  el.notificationsBadge.textContent = String(count);
  el.notificationsBadge.classList.toggle("hidden", count === 0);

  if (!count) {
    el.notificationsList.innerHTML =
      '<p class="text-sm text-slate-500">You are all caught up.</p>';
    return;
  }

  notifications.slice(0, 8).forEach((n) => {
    const item = document.createElement("div");
    item.className =
      "rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3";
    item.innerHTML = `
      <div class="flex items-center justify-between gap-2">
        <p class="text-xs font-semibold uppercase tracking-widest text-slate-400">${safeText(
          n.type
        )}</p>
        <p class="text-[11px] font-semibold text-slate-400">${timeAgo(
          n.timestamp
        )}</p>
      </div>
      <p class="mt-1 text-sm font-semibold text-slate-700">${safeText(
        n.title
      )}</p>
      <p class="text-xs text-slate-500">${safeText(n.subtitle)}</p>
    `;
    el.notificationsList.appendChild(item);
  });
}

function renderNotificationFriends(friends) {
  if (!el.notificationsFriends) return;
  el.notificationsFriends.innerHTML = "";

  if (!friends.length) {
    el.notificationsFriends.innerHTML =
      '<p class="text-sm text-slate-500">No friends yet.</p>';
    return;
  }

  friends.slice(0, 6).forEach((friend) => {
    const name = safeText(friend.name || "Friend");
    const handle = safeText(friend.username || "");
    const avatar = friend.avatar_url
      ? `<img src="${friend.avatar_url}" alt="${name}" class="h-8 w-8 rounded-full object-cover" />`
      : `<div class="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-[10px] font-semibold text-slate-500">${name
          .slice(0, 2)
          .toUpperCase()}</div>`;

    const item = document.createElement("div");
    item.className =
      "flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2";

    item.innerHTML = `
      <div class="flex min-w-0 items-center gap-3">
        ${avatar}
        <div class="min-w-0">
          <p class="truncate text-sm font-semibold text-slate-700">${name}</p>
          <p class="truncate text-xs text-slate-400">${handle ? `@${handle}` : friend.statusLabel || ""}</p>
        </div>
      </div>
      <button type="button" class="msg-btn rounded-full border border-slate-200 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-slate-500 hover:bg-white">
        Message
      </button>
    `;

    const btn = item.querySelector(".msg-btn");
    if (btn) {
      btn.addEventListener("click", async () => {
        closeNotifications();
        setActivePage("messages");
        setActiveThread(handle || name);
        await loadThreadIfPossible(handle || name);
      });
    }

    el.notificationsFriends.appendChild(item);
  });
}

function renderMessages(messages, myUsername) {
  if (!el.messagesList) return;
  el.messagesList.innerHTML = "";

  if (!messages.length) {
    el.messagesList.innerHTML =
      '<p class="text-slate-500">No messages yet. Start the conversation below.</p>';
    updateThreadHeader();
    return;
  }

  messages
    .slice()
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    .forEach((message) => {
      const senderCode = safeText(message.sender_code || "");
      const senderName = safeText(message.sender_name || senderCode || "Unknown");
      const when = message.timestamp || message.created_at;
      const isMine = senderCode && myUsername ? senderCode === myUsername : false;
      const item = document.createElement("div");
      item.className = `flex ${isMine ? "justify-end" : "justify-start"}`;
      item.innerHTML = `
        <div class="max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
          isMine
            ? "bg-slate-900 text-white"
            : "bg-white text-slate-800 border border-slate-100"
        }">
          <div class="flex items-center justify-between gap-3 text-[11px] font-semibold ${
            isMine ? "text-slate-200" : "text-slate-400"
          }">
            <span class="truncate">${isMine ? "You" : senderName}</span>
            <span>${timeAgo(when)}</span>
          </div>
          <p class="mt-1 whitespace-pre-wrap text-sm">${safeText(message.text)}</p>
        </div>
      `;
      el.messagesList.appendChild(item);
    });

  el.messagesList.scrollTop = el.messagesList.scrollHeight;
  updateThreadHeader();
}

function renderMessageInbox(messages, myUsername) {
  if (!el.messagesInbox) return;
  el.messagesInbox.innerHTML = "";

  if (!messages.length) {
    el.messagesInbox.innerHTML =
      '<p class="text-slate-500">No conversations yet.</p>';
    return;
  }

  const threads = new Map();

  for (const m of messages) {
    const sender = safeText(m.sender_code || "");
    const recipient = safeText(m.recipient_code || "");
    const other = sender === myUsername ? recipient : sender || recipient;
    if (!other) continue;

    const prev = threads.get(other);
    const mTime = new Date(m.timestamp || m.created_at || 0).getTime();
    const prevTime = prev ? new Date(prev.timestamp || prev.created_at || 0).getTime() : 0;

    if (!prev || mTime > prevTime) threads.set(other, m);
  }

  const sorted = Array.from(threads.entries()).sort((a, b) => {
    const at = new Date(a[1].timestamp || a[1].created_at || 0).getTime();
    const bt = new Date(b[1].timestamp || b[1].created_at || 0).getTime();
    return bt - at;
  });

  const filter = state.inboxFilter.trim().toLowerCase();

  sorted.forEach(([otherUser, lastMsg]) => {
    if (filter && !otherUser.toLowerCase().includes(filter)) return;

    const active = otherUser === state.selectedThreadUser;
    const friend = findFriendByUsername(otherUser);
    const typing = state.typing.peers?.[otherUser];

    const button = document.createElement("button");
    button.type = "button";
    button.className = active
      ? "flex w-full gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-3 text-left shadow-sm"
      : "flex w-full gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-3 text-left transition hover:border-slate-200 hover:bg-white";

    button.innerHTML = `
      ${renderAvatar(
        {
          name: friend?.name || otherUser,
          username: friend?.username || otherUser,
          avatar_url: friend?.avatar_url || "",
        },
        "h-10 w-10"
      )}
      <div class="min-w-0 flex-1">
        <div class="flex items-center justify-between text-xs font-semibold uppercase tracking-widest text-slate-400">
          <span class="truncate">${safeText(friend?.name || otherUser)}</span>
          <span class="shrink-0">${timeAgo(lastMsg.timestamp)}</span>
        </div>
        <p class="mt-1 truncate text-sm font-semibold ${
          typing ? "text-indigo-500" : "text-slate-700"
        }">${typing ? "Typing…" : safeText(lastMsg.text || "New message")}</p>
      </div>
    `;

    button.addEventListener("click", async () => {
      setActiveThread(otherUser);
      renderMessageInbox(state.messages, myUsername);
      await loadThreadIfPossible(otherUser);
    });

    el.messagesInbox.appendChild(button);
  });
}

function renderMessageFriends(friends) {
  if (!el.messagesFriends) return;
  el.messagesFriends.innerHTML = "";

  if (!friends.length) {
    el.messagesFriends.innerHTML =
      '<p class="text-sm text-slate-500">No friends yet. Add someone to start chatting.</p>';
    return;
  }

  friends.slice(0, 6).forEach((friend) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className =
      "flex w-full items-center gap-3 rounded-2xl border border-slate-100 bg-white px-3 py-3 text-left transition hover:border-slate-200 hover:bg-white";
    card.innerHTML = `
      ${renderAvatar(friend, "h-10 w-10")}
      <div class="min-w-0 flex-1">
        <p class="truncate text-sm font-semibold text-slate-700">${safeText(
          friend.name || friend.username || "Friend"
        )}</p>
        <p class="truncate text-xs text-slate-400">@${safeText(
          friend.username || "friend"
        )}</p>
      </div>
      <span class="text-[11px] font-semibold text-slate-400">Chat</span>
    `;

    card.addEventListener("click", async () => {
      const username = safeText(friend.username || friend.name);
      if (!username) return;
      state.selectedThreadUser = username;
      if (el.messageRecipient) el.messageRecipient.value = username;
      updateThreadHeader();
      renderMessageInbox(state.messages, state.profile?.username || "");
      await loadThreadIfPossible(username);
    });

    el.messagesFriends.appendChild(card);
  });
}

function renderEmotions(emotions) {
  if (!el.emotionsList) return;
  el.emotionsList.innerHTML = "";

  if (!emotions.length) {
    el.emotionsList.innerHTML =
      '<div class="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-slate-500">No moods logged yet.</div>';
    return;
  }

  emotions.forEach((emotion) => {
    const card = document.createElement("div");
    card.className =
      "rounded-2xl border border-slate-100 bg-slate-50 p-4";
    card.innerHTML = `
      <div class="flex items-center justify-between gap-2">
        <div class="text-2xl">${safeText(emotion.emoji || "✨")}</div>
        <div class="rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-slate-500">
          ${safeText(emotion.intensity ? `Intensity ${emotion.intensity}` : "Mood")}
        </div>
      </div>
      <p class="mt-2 text-sm font-semibold text-slate-800">${safeText(
        emotion.label || "Mood update"
      )}</p>
      <p class="text-xs text-slate-400">${timeAgo(emotion.created_at)}</p>
      <p class="mt-2 line-clamp-3 whitespace-pre-wrap text-xs text-slate-600">${safeText(
        emotion.note || "No note added."
      )}</p>
    `;
    el.emotionsList.appendChild(card);
  });
}

function renderActivityFeed({ friends = [], emotions = [], messages = [] }) {
  if (!el.activityFeed) return;
  el.activityFeed.innerHTML = "";

  const items = [];

  emotions.slice(0, 5).forEach((e) => {
    items.push({
      type: "mood",
      title: `${safeText(e.emoji || "✨")} ${safeText(e.label || "Mood")}`,
      subtitle: safeText(e.note || "Shared a mood update."),
      timestamp: e.created_at,
    });
  });

  messages.slice(0, 5).forEach((m) => {
    items.push({
      type: "message",
      title: `Message to @${safeText(m.recipient_code || "friend")}`,
      subtitle: safeText(m.text || "Sent a new message."),
      timestamp: m.timestamp,
    });
  });

  friends.slice(0, 3).forEach((f) => {
    items.push({
      type: "friend",
      title: `Connected with ${safeText(f.name || "a friend")}`,
      subtitle: "Say hello and share a mood.",
      timestamp: nowIso(),
    });
  });

  if (!items.length) {
    el.activityFeed.innerHTML =
      '<p class="text-slate-500">No activity yet. Share a mood or send a message to get started.</p>';
    return;
  }

  items
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 10)
    .forEach((item) => {
      const row = document.createElement("div");
      row.className =
        "rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3";
      row.innerHTML = `
        <div class="flex items-center justify-between gap-2">
          <p class="text-xs font-semibold uppercase tracking-widest text-slate-400">${safeText(
            item.type
          )}</p>
          <p class="text-[11px] font-semibold text-slate-400">${timeAgo(
            item.timestamp
          )}</p>
        </div>
        <p class="mt-1 text-sm font-semibold text-slate-800">${safeText(
          item.title
        )}</p>
        <p class="text-xs text-slate-600">${safeText(item.subtitle)}</p>
      `;
      el.activityFeed.appendChild(row);
    });
}

function renderDiscoverPeople(people) {
  if (!el.friendDiscover) return;
  el.friendDiscover.innerHTML = "";

  if (!people.length) {
    el.friendDiscover.innerHTML =
      '<p class="text-slate-500">No new profiles to show yet.</p>';
    return;
  }

  people.forEach((person) => {
    const name = safeText(person.name || "TapMood user");
    const username = safeText(person.username || "tapmood");

    const avatar = person.avatar_url
      ? `<img src="${person.avatar_url}" alt="${name}" class="h-10 w-10 rounded-full object-cover" />`
      : `<div class="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-[10px] font-semibold text-slate-500">${name
          .slice(0, 2)
          .toUpperCase()}</div>`;

    const card = document.createElement("div");
    card.className =
      "rounded-2xl border border-slate-100 bg-slate-50 p-4";
    card.innerHTML = `
      <div class="flex items-center gap-3">
        ${avatar}
        <div class="min-w-0">
          <p class="truncate text-sm font-semibold text-slate-700">${name}</p>
          <p class="truncate text-xs text-slate-400">@${username}</p>
        </div>
      </div>
      <p class="mt-2 line-clamp-2 text-xs text-slate-600">${safeText(
        person.bio || "TapMood member"
      )}</p>
      <button type="button" class="add-btn mt-3 w-full rounded-full bg-slate-900 px-3 py-2 text-[11px] font-semibold uppercase tracking-widest text-white hover:bg-slate-800">
        Send request
      </button>
    `;

    const btn = card.querySelector(".add-btn");
    if (btn) btn.addEventListener("click", () => sendFriendRequest(person));

    el.friendDiscover.appendChild(card);
  });
}

function renderFriendSearchResults(results) {
  if (!el.friendSearchResults) return;
  el.friendSearchResults.innerHTML = "";

  if (!results.length) {
    el.friendSearchResults.innerHTML =
      '<p class="text-sm text-slate-400">Search by username or name.</p>';
    return;
  }

  results.forEach((person) => {
    const name = safeText(person.name || "TapMood user");
    const username = safeText(person.username || "tapmood");

    const avatar = person.avatar_url
      ? `<img src="${person.avatar_url}" alt="${name}" class="h-9 w-9 rounded-full object-cover" />`
      : `<div class="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-[10px] font-semibold text-slate-500">${name
          .slice(0, 2)
          .toUpperCase()}</div>`;

    const row = document.createElement("div");
    row.className =
      "flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white px-3 py-2";
    row.innerHTML = `
      <div class="flex min-w-0 items-center gap-3">
        ${avatar}
        <div class="min-w-0">
          <p class="truncate text-sm font-semibold text-slate-700">${name}</p>
          <p class="truncate text-xs text-slate-400">@${username}</p>
        </div>
      </div>
      <button type="button" class="add-btn rounded-full bg-slate-900 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-white hover:bg-slate-800">
        Add
      </button>
    `;

    const btn = row.querySelector(".add-btn");
    if (btn) btn.addEventListener("click", () => sendFriendRequest(person));

    el.friendSearchResults.appendChild(row);
  });
}

/* ---------------------------- 6) Data ---------------------------- */

async function ensureProfile(user) {
  const { data, error } = await state.supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, bio")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    setAuthMessage("Unable to load profile data.", "text-amber-600");
    return null;
  }

  if (data) return data;

  const fallbackUsername =
    user.user_metadata?.username ||
    user.email?.split("@")[0] ||
    `user-${user.id.slice(0, 6)}`;

  const { data: created, error: createError } = await state.supabase
    .from("profiles")
    .upsert({
      id: user.id,
      username: fallbackUsername,
      display_name: fallbackUsername,
    })
    .select("id, username, display_name, avatar_url, bio")
    .single();

  if (createError) {
    setAuthMessage("Unable to create profile data.", "text-amber-600");
    return null;
  }

  return created;
}

async function loadFriends(userId) {
  const { data, error } = await state.supabase
    .from("friendships")
    .select(
      "id, status, requester, addressee, requester_profile:profiles!friendships_requester_fkey(id, username, display_name, avatar_url), addressee_profile:profiles!friendships_addressee_fkey(id, username, display_name, avatar_url)"
    )
    .eq("status", "accepted")
    .or(`requester.eq.${userId},addressee.eq.${userId}`)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.map((row) => {
    const isRequester = row.requester === userId;
    const friendProfile = isRequester
      ? row.addressee_profile
      : row.requester_profile;

    return {
      id: row.id,
      name:
        friendProfile?.display_name ||
        friendProfile?.username ||
        "Friend",
      username: friendProfile?.username || "",
      avatar_url: friendProfile?.avatar_url || "",
      statusLabel: "Connected",
    };
  });
}

async function loadFriendRequests(userId) {
  const { data, error } = await state.supabase
    .from("friendships")
    .select(
      "id, requester, status, requester_profile:profiles!friendships_requester_fkey(id, username, display_name, avatar_url)"
    )
    .eq("status", "pending")
    .eq("addressee", userId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id,
    name:
      row.requester_profile?.display_name ||
      row.requester_profile?.username ||
      "TapMood user",
    username: row.requester_profile?.username || "tapmood",
    avatar_url: row.requester_profile?.avatar_url || "",
  }));
}

async function loadExcludedProfileIds(userId) {
  const { data, error } = await state.supabase
    .from("friendships")
    .select("requester, addressee")
    .or(`requester.eq.${userId},addressee.eq.${userId}`);

  const ids = new Set([userId]);
  if (!error && data) {
    data.forEach((row) => {
      if (row.requester && row.requester !== userId) ids.add(row.requester);
      if (row.addressee && row.addressee !== userId) ids.add(row.addressee);
    });
  }
  return Array.from(ids);
}

async function loadSuggestedProfiles(userId) {
  const excluded = await loadExcludedProfileIds(userId);
  let q = state.supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, bio")
    .limit(8);

  if (excluded.length) q = q.not("id", "in", `(${excluded.join(",")})`);

  const { data, error } = await q;
  if (error || !data) return [];

  return data.map((p) => ({
    id: p.id,
    name: p.display_name || p.username || "TapMood user",
    username: p.username || "tapmood",
    avatar_url: p.avatar_url || "",
    bio: p.bio || "",
  }));
}

async function searchProfiles(queryText, userId) {
  if (!queryText) return [];
  const excluded = await loadExcludedProfileIds(userId);

  let q = state.supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, bio")
    .or(
      `username.ilike.%${queryText}%,display_name.ilike.%${queryText}%`
    )
    .limit(8);

  if (excluded.length) q = q.not("id", "in", `(${excluded.join(",")})`);

  const { data, error } = await q;
  if (error || !data) return [];

  return data.map((p) => ({
    id: p.id,
    name: p.display_name || p.username || "TapMood user",
    username: p.username || "tapmood",
    avatar_url: p.avatar_url || "",
    bio: p.bio || "",
  }));
}

async function loadIncomingMessages(username) {
  if (!username) return [];
  const { data, error } = await state.supabase
    .from("chat_messages")
    .select("id, sender_name, sender_code, recipient_code, text, timestamp")
    .eq("recipient_code", username)
    .order("timestamp", { ascending: false })
    .limit(8);

  if (error || !data) return [];
  return data;
}

async function loadMessages(myUsername) {
  if (!myUsername) return [];
  const { data, error } = await state.supabase
    .from("chat_messages")
    .select("id, sender_name, sender_code, recipient_code, text, timestamp")
    .or(`sender_code.eq.${myUsername},recipient_code.eq.${myUsername}`)
    .order("timestamp", { ascending: false })
    .limit(80);

  return error || !data ? [] : data;
}

async function loadThread(myUsername, otherUser) {
  if (!myUsername || !otherUser) return [];
  const other = otherUser.replace("@", "");

  const { data, error } = await state.supabase
    .from("chat_messages")
    .select("id, sender_name, sender_code, recipient_code, text, timestamp")
    .or(
      `and(sender_code.eq.${myUsername},recipient_code.eq.${other}),and(sender_code.eq.${other},recipient_code.eq.${myUsername})`
    )
    .order("timestamp", { ascending: false })
    .limit(80);

  return error || !data ? [] : data;
}

async function loadEmotions(userId) {
  const { data, error } = await state.supabase
    .from("emotions")
    .select("id, emoji, label, intensity, note, created_at")
    .eq("author", userId)
    .order("created_at", { ascending: false })
    .limit(10);

  return error || !data ? [] : data;
}

async function buildNotifications({ userId, username }) {
  const [requests, incoming] = await Promise.all([
    loadFriendRequests(userId),
    loadIncomingMessages(username),
  ]);

  const list = [];

  requests.forEach((r) => {
    list.push({
      type: "friend request",
      title: `${r.name} wants to connect`,
      subtitle: `@${r.username} sent you a request.`,
      timestamp: nowIso(),
    });
  });

  incoming.forEach((m) => {
    list.push({
      type: "message",
      title: `New message from ${m.sender_name || m.sender_code || "TapMood user"}`,
      subtitle: m.text || "Tap to read the full message.",
      timestamp: m.timestamp,
    });
  });

  list.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  state.notifications = list;
  renderNotifications(list);
}

/* ---------------------------- 7) Realtime ---------------------------- */

function stopRealtime() {
  if (!state.supabase) return;
  if (state.rt.channel) {
    state.supabase.removeChannel(state.rt.channel);
    state.rt.channel = null;
  }
  Object.keys(state.typing.peers || {}).forEach((user) => {
    setTypingIndicator(user, false);
  });
  state.typing.timers.forEach((timer) => clearTimeout(timer));
  state.typing.timers.clear();
}

function startRealtime() {
  stopRealtime();

  if (!state.supabase || !state.session?.user || !state.profile?.username) return;
  if (!state.rt.enabled) return;

  const userId = state.session.user.id;
  const myUsername = state.profile.username;

  // Note: Realtime requires you to have enabled it on tables in Supabase.
  const channel = state.supabase
    .channel(`tapmood:${userId}`)
    .on("broadcast", { event: "typing" }, ({ payload }) => {
      const from = safeText(payload?.from || "");
      const to = safeText(payload?.to || "");
      const typing = Boolean(payload?.typing);
      if (!from || !to) return;
      if (to !== myUsername || from === myUsername) return;

      setTypingIndicator(from, typing);

      if (state.typing.timers.has(from)) {
        clearTimeout(state.typing.timers.get(from));
      }
      if (typing) {
        const timer = setTimeout(() => {
          setTypingIndicator(from, false);
          state.typing.timers.delete(from);
        }, 3200);
        state.typing.timers.set(from, timer);
      }
    })
    // friend requests and acceptances that touch you
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "friendships", filter: `addressee=eq.${userId}` },
      async () => {
        await softRefresh({ friends: true, requests: true, suggested: true, notifications: true });
        toast("New friend activity", "info");
      }
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "friendships", filter: `requester=eq.${userId}` },
      async () => {
        await softRefresh({ friends: true, suggested: true });
      }
    )
    // new moods by you (and later: by friends if you add a feed table)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "emotions", filter: `author=eq.${userId}` },
      async () => {
        await softRefresh({ emotions: true, activity: true });
      }
    )
    // new messages sent to you or from you
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "chat_messages", filter: `recipient_code=eq.${myUsername}` },
      async () => {
        await softRefresh({ messages: true, notifications: true, activity: true });
        toast("New message received", "info");
      }
    )
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "chat_messages", filter: `sender_code=eq.${myUsername}` },
      async () => {
        await softRefresh({ messages: true, activity: true });
      }
    )
    .subscribe((status) => {
      if (status === "SUBSCRIBED") {
        setConnectionStatus("Connected", "text-emerald-600 bg-emerald-100");
      }
    });

  state.rt.channel = channel;
}

/* ---------------------------- 8) Dashboard Orchestration ---------------------------- */

function fillProfileForm(profile) {
  if (!profile) return;
  if (el.profileDisplayName) el.profileDisplayName.value = profile.display_name || "";
  if (el.profileUsername) el.profileUsername.value = profile.username || "";
  if (el.profileAvatar) el.profileAvatar.value = profile.avatar_url || "";
  if (el.profileBio) el.profileBio.value = profile.bio || "";
}

function setDashboardLoading(isLoading) {
  if (!el.refreshDashboard) return;
  el.refreshDashboard.disabled = isLoading;
  el.refreshDashboard.classList.toggle("opacity-50", isLoading);
  el.refreshDashboard.classList.toggle("cursor-not-allowed", isLoading);
}

async function loadThreadIfPossible(otherUser) {
  if (!state.profile?.username) return;
  const myUsername = state.profile.username;
  const other = (otherUser || "").replace("@", "").trim();
  if (!other) return;

  setActiveThread(other);
  setStatusMessage(el.messageStatus, "Loading thread...", "text-slate-500");
  const thread = await loadThread(myUsername, other);
  renderMessages(thread, myUsername);
  setStatusMessage(el.messageStatus, "", "text-slate-500");
}

async function loadDashboard() {
  if (!state.session?.user) return;

  const runId = ++state.runId;
  let hasError = false;
  state.busy.dashboard = true;
  setDashboardLoading(true);
  setAuthMessage("Loading dashboard...", "text-slate-500");
  hideDbTimeoutPopup();
  scheduleDbTimeoutPopup();

  try {
    const user = state.session.user;

    // profile
    const profile = await ensureProfile(user);
    if (runId !== state.runId) return;
    state.profile = profile;
    renderProfile(profile, user);
    fillProfileForm(profile);

    // core data
    const [friends, emotions, messages, requests, suggested] = await Promise.all([
      loadFriends(user.id),
      loadEmotions(user.id),
      loadMessages(profile?.username),
      loadFriendRequests(user.id),
      loadSuggestedProfiles(user.id),
    ]);

    if (runId !== state.runId) return;

    state.friends = friends;
    state.emotions = emotions;
    state.messages = messages;
    state.requests = requests;
    state.suggested = suggested;

    // renders
    renderFriends(friends);
    renderEmotions(emotions);
    renderMessageInbox(messages, profile?.username);
    renderMessageFriends(friends);
    renderActivityFeed({ friends, emotions, messages });
    renderFriendRequests(requests);
    renderDiscoverPeople(suggested);
    renderNotificationFriends(friends);

    // default thread selection
    if (!state.selectedThreadUser) {
      const firstThread = pickFirstThreadUser(messages, profile?.username);
      if (firstThread) setActiveThread(firstThread);
    }

    // if we have a selected thread, load it
    if (state.selectedThreadUser && profile?.username) {
      const thread = await loadThread(profile.username, state.selectedThreadUser);
      if (runId !== state.runId) return;
      renderMessages(thread, profile.username);
    } else {
      renderMessages([], profile?.username);
    }

    // notifications
    if (profile?.username) {
      await buildNotifications({ userId: user.id, username: profile.username });
    } else {
      renderNotifications([]);
    }

    setCounts({
      friends: friends.length,
      messages: messages.length,
      emotions: emotions.length,
    });

    setAuthMessage("Dashboard ready.", "text-emerald-600");
    startRealtime();
  } catch (e) {
    hasError = true;
    console.error(e);
    setAuthMessage("Dashboard failed to load.", "text-rose-600");
    toast("Failed to load dashboard", "error");
    showDbTimeoutPopup();
  } finally {
    state.busy.dashboard = false;
    setDashboardLoading(false);
    if (dbTimeoutTimer) {
      clearTimeout(dbTimeoutTimer);
      dbTimeoutTimer = null;
    }
    if (!hasError) hideDbTimeoutPopup();
  }
}

function pickFirstThreadUser(messages, myUsername) {
  if (!messages || !messages.length || !myUsername) return "";
  const threads = new Map();
  for (const m of messages) {
    const sender = safeText(m.sender_code || "");
    const recipient = safeText(m.recipient_code || "");
    const other = sender === myUsername ? recipient : sender || recipient;
    if (!other) continue;
    const prev = threads.get(other);
    const mt = new Date(m.timestamp || 0).getTime();
    const pt = prev ? new Date(prev.timestamp || 0).getTime() : 0;
    if (!prev || mt > pt) threads.set(other, m);
  }
  const sorted = Array.from(threads.entries()).sort((a, b) => {
    const at = new Date(a[1].timestamp || 0).getTime();
    const bt = new Date(b[1].timestamp || 0).getTime();
    return bt - at;
  });
  return sorted.length ? sorted[0][0] : "";
}

/**
 * Soft refresh updates only what you ask for.
 * This is what makes it feel faster than reloading everything.
 */
async function softRefresh(flags = {}) {
  if (!state.session?.user || !state.profile?.username) return;
  const user = state.session.user;
  const myUsername = state.profile.username;

  const jobs = [];

  if (flags.friends) jobs.push(loadFriends(user.id).then((x) => (state.friends = x)));
  if (flags.requests) jobs.push(loadFriendRequests(user.id).then((x) => (state.requests = x)));
  if (flags.emotions) jobs.push(loadEmotions(user.id).then((x) => (state.emotions = x)));
  if (flags.messages) jobs.push(loadMessages(myUsername).then((x) => (state.messages = x)));
  if (flags.suggested) jobs.push(loadSuggestedProfiles(user.id).then((x) => (state.suggested = x)));
  if (flags.notifications) jobs.push(buildNotifications({ userId: user.id, username: myUsername }));

  await Promise.all(jobs);

  if (flags.friends) {
    renderFriends(state.friends);
    renderNotificationFriends(state.friends);
    renderMessageFriends(state.friends);
  }
  if (flags.requests) renderFriendRequests(state.requests);
  if (flags.emotions) renderEmotions(state.emotions);
  if (flags.messages) {
    renderMessageInbox(state.messages, myUsername);
    if (state.selectedThreadUser) {
      const thread = await loadThread(myUsername, state.selectedThreadUser);
      renderMessages(thread, myUsername);
    }
  }
  if (flags.suggested) renderDiscoverPeople(state.suggested);

  if (flags.activity) {
    renderActivityFeed({
      friends: state.friends,
      emotions: state.emotions,
      messages: state.messages,
    });
  }

  setCounts({
    friends: state.friends.length,
    messages: state.messages.length,
    emotions: state.emotions.length,
  });
}

/* ---------------------------- 9) Actions ---------------------------- */

async function handleAuthSubmit(event) {
  event.preventDefault();
  if (!state.supabase || state.busy.auth) return;

  const username = el.authUsername?.value.trim();
  const email = el.authEmail?.value.trim();
  const password = el.authPassword?.value;

  if (!email || !password) {
    setAuthMessage("Email and password are required.", "text-amber-600");
    return;
  }
  if (password.length < 8) {
    setAuthMessage("Password must be at least 8 characters.", "text-amber-600");
    return;
  }
  if (state.authMode === "signup" && !username) {
    setAuthMessage("Please choose a username for your profile.", "text-amber-600");
    return;
  }

  state.busy.auth = true;
  el.authSubmit.disabled = true;
  setAuthMessage("Working...", "text-slate-500");

  try {
    if (state.authMode === "signin") {
      const { error } = await state.supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast("Welcome back", "success");
      return;
    }

    const { data, error } = await state.supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });
    if (error) throw error;

    // If email confirmations are enabled, user may not be "active" yet.
    if (data?.user && username) {
      await state.supabase.from("profiles").upsert({
        id: data.user.id,
        username,
        display_name: username,
      });
    }

    setAuthMessage(
      "Account created! Check your email to confirm your sign up.",
      "text-emerald-600"
    );
    toast("Account created. Check your email.", "success");
  } catch (e) {
    setAuthMessage(e.message || "Authentication failed.", "text-rose-600");
    toast(e.message || "Auth failed", "error");
  } finally {
    state.busy.auth = false;
    el.authSubmit.disabled = false;
  }
}

async function handleSignOut() {
  if (!state.supabase) return;
  stopRealtime();
  await state.supabase.auth.signOut();
  toast("Signed out", "info");
}

function resetDashboard() {
  setCounts({ friends: 0, messages: 0, emotions: 0 });

  if (el.friendsList) el.friendsList.innerHTML = "<li>Sign in to view friends.</li>";
  if (el.messagesList) el.messagesList.innerHTML = "<p>Sign in to view messages.</p>";
  if (el.messagesInbox) el.messagesInbox.innerHTML = "<p>Sign in to view messages.</p>";
  if (el.messagesFriends) el.messagesFriends.innerHTML = "<p>Sign in to view friends.</p>";
  if (el.emotionsList)
    el.emotionsList.innerHTML =
      '<div class="rounded-2xl border border-slate-100 bg-slate-50 p-4">Sign in to view recent moods.</div>';
  if (el.activityFeed) el.activityFeed.innerHTML = "<p>Sign in to see your live activity feed.</p>";

  renderDiscoverPeople([]);
  renderFriendRequests([]);
  renderFriendSearchResults([]);
  renderNotifications([]);
  renderNotificationFriends([]);
  renderProfile(null, null);

  setStatusMessage(el.moodStatus, "");
  setStatusMessage(el.messageStatus, "");
  setStatusMessage(el.friendStatus, "");
  setStatusMessage(el.profileStatus, "");

  state.friends = [];
  state.emotions = [];
  state.messages = [];
  state.requests = [];
  state.suggested = [];
  state.notifications = [];
  state.selectedThreadUser = "";
  state.inboxFilter = "";
  state.typing.peers = {};
  state.typing.timers.forEach((timer) => clearTimeout(timer));
  state.typing.timers.clear();
  updateThreadHeader();
}

async function handleRefresh() {
  if (!state.session?.user) return;
  toast("Refreshing…", "info");
  await loadDashboard();
}

async function handleMoodSubmit(event) {
  event.preventDefault();
  if (!state.session?.user || state.busy.moodPost) return;

  const emoji = safeText(el.moodEmoji?.value || "").trim();
  const label = safeText(el.moodLabel?.value || "").trim();
  const intensity = clampInt(el.moodIntensity?.value, 1, 5);
  const note = safeText(el.moodNote?.value || "").trim();

  if (!emoji && !label) {
    setStatusMessage(el.moodStatus, "Add an emoji or a mood label.", "text-amber-600");
    return;
  }

  state.busy.moodPost = true;
  setStatusMessage(el.moodStatus, "Posting...", "text-slate-500");

  try {
    const payload = {
      author: state.session.user.id,
      emoji: emoji || null,
      label: label || null,
      intensity: intensity || null,
      note: note || null,
    };

    // optimistic UI
    const optimistic = {
      id: `tmp-${Math.random().toString(16).slice(2)}`,
      ...payload,
      created_at: nowIso(),
    };

    state.emotions = [optimistic, ...state.emotions].slice(0, 10);
    renderEmotions(state.emotions);
    renderActivityFeed({
      friends: state.friends,
      emotions: state.emotions,
      messages: state.messages,
    });

    const { error } = await state.supabase.from("emotions").insert(payload);
    if (error) throw error;

    setStatusMessage(el.moodStatus, "Mood posted!", "text-emerald-600");
    toast("Mood posted", "success");

    if (el.moodNote) el.moodNote.value = "";
    await softRefresh({ emotions: true, activity: true });
  } catch (e) {
    console.error(e);
    setStatusMessage(el.moodStatus, "Failed to post mood.", "text-rose-600");
    toast(e.message || "Failed to post", "error");
    await softRefresh({ emotions: true, activity: true });
  } finally {
    state.busy.moodPost = false;
    setTimeout(() => setStatusMessage(el.moodStatus, ""), 1200);
  }
}

async function handleMessageSubmit(event) {
  event.preventDefault();
  if (!state.session?.user || !state.profile || state.busy.msgSend) return;

  const recipientCode = safeText(el.messageRecipient?.value || "").trim().replace("@", "");
  const text = safeText(el.messageText?.value || "").trim();

  if (!recipientCode || !text) {
    setStatusMessage(el.messageStatus, "Recipient and message required.", "text-amber-600");
    return;
  }

  state.busy.msgSend = true;
  setStatusMessage(el.messageStatus, "Sending...", "text-slate-500");
  sendTypingEvent(false, recipientCode);

  try {
    // optimistic: append to current thread UI if it matches
    const optimistic = {
      id: `tmp-${Math.random().toString(16).slice(2)}`,
      sender_code: state.profile.username,
      sender_name: state.profile.display_name,
      recipient_code: recipientCode,
      text,
      timestamp: nowIso(),
    };

    if (!state.selectedThreadUser) setActiveThread(recipientCode);
    if (state.selectedThreadUser === recipientCode) {
      const current = await loadThread(state.profile.username, recipientCode);
      renderMessages([...current, optimistic].slice(-80), state.profile.username);
    }

    const { error } = await state.supabase.from("chat_messages").insert({
      sender_code: state.profile.username,
      sender_name: state.profile.display_name,
      recipient_code: recipientCode,
      text,
      timestamp: nowIso(),
    });

    if (error) throw error;

    setStatusMessage(el.messageStatus, "Sent!", "text-emerald-600");
    toast("Message sent", "success");
    if (el.messageText) el.messageText.value = "";

    await softRefresh({ messages: true, activity: true, notifications: true });
    setActiveThread(recipientCode);
  } catch (e) {
    console.error(e);
    setStatusMessage(el.messageStatus, "Failed to send.", "text-rose-600");
    toast(e.message || "Failed to send", "error");
    await softRefresh({ messages: true });
  } finally {
    state.busy.msgSend = false;
    setTimeout(() => setStatusMessage(el.messageStatus, ""), 1200);
  }
}

async function handleProfileUpdate(event) {
  event.preventDefault();
  if (!state.session?.user || state.busy.profileSave) return;

  const username = safeText(el.profileUsername?.value || "").trim().replace("@", "");
  const displayName = safeText(el.profileDisplayName?.value || "").trim();
  const avatar = safeText(el.profileAvatar?.value || "").trim();
  const bio = safeText(el.profileBio?.value || "").trim();

  if (username && username.length < 3) {
    setStatusMessage(el.profileStatus, "Username must be at least 3 chars.", "text-amber-600");
    return;
  }

  state.busy.profileSave = true;
  setStatusMessage(el.profileStatus, "Saving...", "text-slate-500");

  try {
    const updates = {
      id: state.session.user.id,
      username: username || state.profile?.username || null,
      display_name: displayName || username || state.profile?.display_name || null,
      bio: bio || null,
      avatar_url: avatar || null,
      updated_at: nowIso(),
    };

    const { error } = await state.supabase.from("profiles").upsert(updates);
    if (error) throw error;

    setStatusMessage(el.profileStatus, "Profile saved.", "text-emerald-600");
    toast("Profile updated", "success");

    // If username changed, reload everything and restart realtime subscriptions
    await loadDashboard();
  } catch (e) {
    console.error(e);
    setStatusMessage(el.profileStatus, e.message || "Update failed.", "text-rose-600");
    toast(e.message || "Profile update failed", "error");
  } finally {
    state.busy.profileSave = false;
    setTimeout(() => setStatusMessage(el.profileStatus, ""), 1400);
  }
}

async function sendFriendRequest(person) {
  if (!state.session?.user || state.busy.friendAction) return;
  state.busy.friendAction = true;
  setStatusMessage(el.friendStatus, "Sending request...", "text-slate-500");

  try {
    const receiverId = person.id;
    const { error } = await state.supabase.from("friendships").insert({
      requester: state.session.user.id,
      addressee: receiverId,
      status: "pending",
    });

    if (error) {
      if (error.code === "23505") {
        toast("Friend request already exists", "warn");
        setStatusMessage(el.friendStatus, "Request already sent.", "text-amber-600");
      } else {
        throw error;
      }
      return;
    }

    toast("Friend request sent", "success");
    setStatusMessage(el.friendStatus, "Request sent!", "text-emerald-600");
    await softRefresh({ suggested: true, notifications: true });
  } catch (e) {
    console.error(e);
    toast(e.message || "Failed to send request", "error");
    setStatusMessage(el.friendStatus, "Failed to send request.", "text-rose-600");
  } finally {
    state.busy.friendAction = false;
    setTimeout(() => setStatusMessage(el.friendStatus, ""), 1500);
  }
}

async function acceptFriendRequest(requestId) {
  if (!state.session?.user || state.busy.friendAction) return;
  state.busy.friendAction = true;

  try {
    const { error } = await state.supabase
      .from("friendships")
      .update({ status: "accepted" })
      .eq("id", requestId)
      .eq("addressee", state.session.user.id);

    if (error) throw error;

    toast("Friend added", "success");
    await softRefresh({ friends: true, requests: true, suggested: true, notifications: true, activity: true });
  } catch (e) {
    console.error(e);
    toast(e.message || "Could not accept request", "error");
  } finally {
    state.busy.friendAction = false;
  }
}

function handleFriendSearch(event) {
  const query = safeText(event.target.value || "").trim();
  clearTimeout(state.searchTimer);

  if (!state.session?.user) return;

  if (query.length < 2) {
    renderFriendSearchResults([]);
    return;
  }

  const token = ++state.searchToken;

  state.searchTimer = setTimeout(async () => {
    if (!state.session?.user) return;
    const results = await searchProfiles(query, state.session.user.id);

    // stale guard
    if (token !== state.searchToken) return;

    renderFriendSearchResults(results);
  }, 280);
}

/* ---------------------------- 10) Init + Wiring ---------------------------- */

function bindGlobalUX() {
  // Close notifications on outside click
  document.addEventListener("click", (e) => {
    if (!el.notificationsPanel || !el.notificationsToggle) return;
    const panelOpen = !el.notificationsPanel.classList.contains("hidden");
    if (!panelOpen) return;

    const target = e.target;
    const insidePanel = el.notificationsPanel.contains(target);
    const insideButton = el.notificationsToggle.contains(target);
    if (!insidePanel && !insideButton) closeNotifications();
  });

  // Close notifications on ESC
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeNotifications();
  });
}

async function init() {
  const supabaseReady = await ensureSupabaseLoaded();
  if (!supabaseReady) {
    console.error("Supabase JS library not found.");
    setConnectionStatus("Supabase Missing", "text-rose-600 bg-rose-100");
    setAuthMessage("TapMood web couldn't load the data service. Please refresh.", "text-rose-600");
    return;
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Supabase config missing.");
    setConnectionStatus("Config Missing", "text-rose-600 bg-rose-100");
    setAuthMessage("TapMood web is missing its server configuration.", "text-rose-600");
    return;
  }

  state.supabase = supabase.createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  setConnectionStatus("Checking", "text-amber-600 bg-amber-100");

  // Auth
  el.authSignin?.addEventListener("click", () => setAuthMode("signin"));
  el.authSignup?.addEventListener("click", () => setAuthMode("signup"));
  el.authForm?.addEventListener("submit", handleAuthSubmit);
  el.signOut?.addEventListener("click", handleSignOut);

  // Dashboard
  el.refreshDashboard?.addEventListener("click", handleRefresh);
  el.moodForm?.addEventListener("submit", handleMoodSubmit);
  el.messageForm?.addEventListener("submit", handleMessageSubmit);
  el.messageText?.addEventListener("input", handleTypingInput);
  el.messageRecipient?.addEventListener("change", (event) => {
    const value = safeText(event.target.value || "").trim();
    if (value) setActiveThread(value);
  });
  el.profileForm?.addEventListener("submit", handleProfileUpdate);
  el.friendSearch?.addEventListener("input", handleFriendSearch);
  el.inboxSearch?.addEventListener("input", (event) => {
    state.inboxFilter = safeText(event.target.value || "");
    if (state.profile?.username) renderMessageInbox(state.messages, state.profile.username);
  });

  // Notifications panel
  el.notificationsToggle?.addEventListener("click", () => {
    toggleNotifications();
  });

  el.dbTimeoutClose?.addEventListener("click", () => hideDbTimeoutPopup());
  el.dbTimeoutRetry?.addEventListener("click", () => {
    hideDbTimeoutPopup();
    handleRefresh();
  });

  // Page nav
  el.pageToggleButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.pageTarget;
      if (target) setActivePage(target);
    });
  });

  bindGlobalUX();

  // Auth state
  state.supabase.auth.onAuthStateChange(async (_event, session) => {
    state.session = session;

    if (session) {
      setConnectionStatus("Connected", "text-emerald-600 bg-emerald-100");
      showAppView();
      await loadDashboard();
    } else {
      stopRealtime();
      setConnectionStatus("Offline", "text-slate-400 bg-slate-100");
      showGuestView();
      resetDashboard();
    }
  });

  // initial session
  const { data, error } = await state.supabase.auth.getSession();
  if (error) {
    console.error("Auth Session Error:", error.message);
    setConnectionStatus("Offline", "text-rose-600 bg-rose-100");
    showGuestView();
    return;
  }

  if (data?.session) {
    state.session = data.session;
    setConnectionStatus("Connected", "text-emerald-600 bg-emerald-100");
    showAppView();
    await loadDashboard();
  } else {
    setConnectionStatus("Offline", "text-slate-400 bg-slate-100");
    showGuestView();
    resetDashboard();
  }

  // default auth mode UI
  setAuthMode("signin");
}

// Start
document.addEventListener("DOMContentLoaded", init);
