/* ============================================================
   TapMood Web Client
   Version: 1.3.1 (Database-aligned, hardened)
   Stack: Vanilla JS + Supabase v2
   ============================================================ */

/* ---------------------------- Config ---------------------------- */

const config = window.tapmoodConfig || {};
const supabaseUrl =
  config.supabaseUrl || "https://lxylwexfjhtzvepwvjal.supabase.co";
const supabaseAnonKey =
  config.supabaseAnonKey ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4eWx3ZXhmamh0enZlcHd2amFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwNTY3ODEsImV4cCI6MjA4MjYzMjc4MX0.78Jc7gu59eU5XOgZiVpkn4dq1GrX3uKCEsV_ffXCU3E";

/* ---------------------------- State ---------------------------- */

const state = {
  supabase: null,
  session: null,
  profile: null,

  friends: [],
  emotions: [],
  messages: [],
  requests: [],
  suggested: [],
  notifications: [],

  activePage: "home",
  selectedThreadUser: "",
  inboxFilter: "",

  rt: { channel: null },

  typing: {
    peers: {},
    timers: new Map(),
    lastSentAt: 0,
  },

  busy: {
    auth: false,
    dashboard: false,
    mood: false,
    message: false,
    profile: false,
    friend: false,
  },

  runId: 0,
};

/* ---------------------------- Utils ---------------------------- */

const safe = (v) => (v == null ? "" : String(v));
const nowIso = () => new Date().toISOString();

function timeAgo(iso) {
  if (!iso) return "";
  const s = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

/* ---------------------------- DOM ---------------------------- */

const $ = (id) => document.getElementById(id);

const el = {
  guestView: $("guest-view"),
  appView: $("app-view"),
  connectionStatus: $("connection-status"),
  connectionStatusApp: $("connection-status-app"),

  authForm: $("auth-form"),
  authEmail: $("auth-email"),
  authPassword: $("auth-password"),
  authUsername: $("auth-username"),
  authSubmit: $("auth-submit"),
  authSignin: $("auth-signin"),
  authSignup: $("auth-signup"),
  authMessage: $("auth-message"),
  signOut: $("sign-out"),

  friendsList: $("friends-list"),
  friendRequests: $("friend-requests"),
  friendSearch: $("friend-search"),
  friendSearchResults: $("friend-search-results"),
  friendDiscover: $("friend-discover"),

  emotionsList: $("emotions-list"),
  moodForm: $("mood-form"),
  moodEmoji: $("mood-emoji"),
  moodLabel: $("mood-label"),
  moodIntensity: $("mood-intensity"),
  moodNote: $("mood-note"),
  moodStatus: $("mood-status"),

  messagesInbox: $("messages-inbox"),
  messagesList: $("messages-list"),
  messageForm: $("message-form"),
  messageRecipient: $("message-recipient"),
  messageText: $("message-text"),
  messageStatus: $("message-status"),

  notificationsToggle: $("notifications-toggle"),
  notificationsPanel: $("notifications-panel"),
  notificationsList: $("notifications-list"),
  notificationsBadge: $("notifications-badge"),

  profileForm: $("profile-form"),
  profileUsername: $("profile-username"),
  profileDisplayName: $("profile-display-name"),
  profileAvatar: $("profile-avatar"),
  profileBio: $("profile-bio"),
  profileStatus: $("profile-status"),

  refreshDashboard: $("refresh-dashboard"),
};

/* ---------------------------- Auth UI ---------------------------- */

const authState = {
  mode: "signin",
};

function setAuthMessage(message, tone = "neutral") {
  if (!el.authMessage) return;
  el.authMessage.textContent = message || "";
  el.authMessage.classList.remove("text-rose-500", "text-emerald-600");
  if (tone === "error") el.authMessage.classList.add("text-rose-500");
  if (tone === "success") el.authMessage.classList.add("text-emerald-600");
}

function setAuthMode(mode) {
  authState.mode = mode;
  const isSignup = mode === "signup";

  if (el.authUsername?.parentElement) {
    el.authUsername.parentElement.classList.toggle("hidden", !isSignup);
  }

  if (el.authSubmit) {
    el.authSubmit.textContent = isSignup ? "Create Account" : "Sign In";
  }

  if (el.authSignin) {
    el.authSignin.classList.toggle("bg-slate-900", !isSignup);
    el.authSignin.classList.toggle("text-white", !isSignup);
    el.authSignin.classList.toggle("border", isSignup);
    el.authSignin.classList.toggle("border-slate-200", isSignup);
    el.authSignin.classList.toggle("text-slate-600", isSignup);
  }

  if (el.authSignup) {
    el.authSignup.classList.toggle("bg-slate-900", isSignup);
    el.authSignup.classList.toggle("text-white", isSignup);
    el.authSignup.classList.toggle("border", !isSignup);
    el.authSignup.classList.toggle("border-slate-200", !isSignup);
    el.authSignup.classList.toggle("text-slate-600", !isSignup);
  }

  if (el.authUsername) el.authUsername.required = isSignup;
  setAuthMessage("");
}

function setConnectionStatus(text, tone = "idle") {
  if (el.connectionStatus) {
    el.connectionStatus.textContent = text;
    el.connectionStatus.classList.toggle("bg-emerald-100", tone === "good");
    el.connectionStatus.classList.toggle("text-emerald-700", tone === "good");
    el.connectionStatus.classList.toggle("bg-rose-100", tone === "bad");
    el.connectionStatus.classList.toggle("text-rose-700", tone === "bad");
  }
  if (el.connectionStatusApp) {
    el.connectionStatusApp.classList.toggle("hidden", tone !== "good");
  }
}

/* ---------------------------- Auth ---------------------------- */

async function ensureProfile(user) {
  const { data, error } = await state.supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Profile fetch failed:", error);
    throw error;
  }

  if (data) return data;

  const username =
    user.user_metadata?.username ||
    user.email.split("@")[0];

  const { data: created, error: insertError } =
    await state.supabase
      .from("profiles")
      .insert({
        id: user.id,
        username,
        display_name: username,
      })
      .select()
      .single();

  if (insertError) {
    console.error("Profile creation failed:", insertError);
    throw insertError;
  }

  return created;
}

/* ---------------------------- Data Loaders ---------------------------- */

async function loadFriends(userId) {
  const { data } = await state.supabase
    .from("friendships")
    .select(`
      id, requester, addressee,
      requester_profile:profiles!friendships_requester_fkey(id, username, display_name, avatar_url),
      addressee_profile:profiles!friendships_addressee_fkey(id, username, display_name, avatar_url)
    `)
    .eq("status", "accepted");

  if (!data) return [];

  return data
    .filter((f) => f.requester === userId || f.addressee === userId)
    .map((f) => {
      const p =
        f.requester === userId
          ? f.addressee_profile
          : f.requester_profile;

      return {
        id: p.id,
        username: p.username,
        name: p.display_name || p.username,
        avatar_url: p.avatar_url || "",
      };
    });
}

async function loadMessages(username) {
  const { data } = await state.supabase
    .from("chat_messages")
    .select("*")
    .or(
      `sender_code.eq.${username},recipient_code.eq.${username}`
    )
    .order("timestamp", { ascending: false })
    .limit(100);

  return data || [];
}

async function loadThread(me, other) {
  const { data } = await state.supabase
    .from("chat_messages")
    .select("*")
    .or(
      `and(sender_code.eq.${me},recipient_code.eq.${other}),and(sender_code.eq.${other},recipient_code.eq.${me})`
    )
    .order("timestamp", { ascending: true })
    .limit(100);

  return data || [];
}

async function loadEmotions(userId) {
  const { data } = await state.supabase
    .from("emotions")
    .select("*")
    .eq("author", userId)
    .order("created_at", { ascending: false })
    .limit(10);

  return data || [];
}

/* ---------------------------- Messaging ---------------------------- */

async function sendMessage(to, text) {
  if (!to || !text || to === state.profile.username) return;

  await state.supabase.from("chat_messages").insert({
    sender_code: state.profile.username,
    sender_name: state.profile.display_name,
    recipient_code: to,
    text,
    timestamp: nowIso(),
  });
}

/* ---------------------------- Realtime ---------------------------- */

function startRealtime() {
  stopRealtime();

  const username = state.profile.username;

  state.rt.channel = state.supabase
    .channel(`tapmood:${username}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "chat_messages" },
      async (payload) => {
        const m = payload.new;
        if (
          m.sender_code === username ||
          m.recipient_code === username
        ) {
          state.messages.unshift(m);
          renderInbox();
          if (state.selectedThreadUser) {
            const t = await loadThread(
              username,
              state.selectedThreadUser
            );
            renderMessages(t);
          }
        }
      }
    )
    .subscribe();
}

function stopRealtime() {
  if (state.rt.channel) {
    state.supabase.removeChannel(state.rt.channel);
    state.rt.channel = null;
  }
}

/* ---------------------------- Rendering ---------------------------- */

function renderInbox() {
  el.messagesInbox.innerHTML = "";
  const threads = {};

  state.messages.forEach((m) => {
    const other =
      m.sender_code === state.profile.username
        ? m.recipient_code
        : m.sender_code;
    if (!threads[other]) threads[other] = m;
  });

  Object.entries(threads).forEach(([user, msg]) => {
    const btn = document.createElement("button");
    btn.className = "inbox-row";
    btn.textContent = `${user}: ${msg.text.slice(0, 40)}`;
    btn.onclick = async () => {
      state.selectedThreadUser = user;
      const t = await loadThread(
        state.profile.username,
        user
      );
      renderMessages(t);
    };
    el.messagesInbox.appendChild(btn);
  });
}

function renderMessages(list) {
  el.messagesList.innerHTML = "";
  list.forEach((m) => {
    const div = document.createElement("div");
    div.className =
      m.sender_code === state.profile.username
        ? "msg me"
        : "msg them";
    div.textContent = m.text;
    el.messagesList.appendChild(div);
  });
}

/* ---------------------------- Dashboard ---------------------------- */

async function loadDashboard() {
  try {
    const run = ++state.runId;
    const user = state.session.user;

    state.profile = await ensureProfile(user);
    if (run !== state.runId) return;

    const [friends, messages, emotions] = await Promise.all([
      loadFriends(user.id),
      loadMessages(state.profile.username),
      loadEmotions(user.id),
    ]);

    if (run !== state.runId) return;

    state.friends = friends;
    state.messages = messages;
    state.emotions = emotions;

    renderInbox();
    startRealtime();
  } catch (err) {
    console.error("Dashboard load failed:", err);
    el.authMessage.textContent =
      "Account loaded, but data failed to sync. Check console.";
  }
}

/* ---------------------------- Init ---------------------------- */

async function init() {
  const sb = window.supabase; // use the global you checked for
  if (!sb || !sb.createClient) {
    console.error("Supabase not loaded or wrong global. Check your CDN script.");
    setConnectionStatus("Offline", "bad");
    return;
  }

  state.supabase = sb.createClient(supabaseUrl, supabaseAnonKey);
  setConnectionStatus("Ready", "good");

  const showApp = async () => {
    if (el.guestView) el.guestView.classList.add("hidden");
    if (el.appView) el.appView.classList.remove("hidden");
    setConnectionStatus("Connected", "good");
    await loadDashboard();
  };

  const showGuest = () => {
    stopRealtime();
    if (el.appView) el.appView.classList.add("hidden");
    if (el.guestView) el.guestView.classList.remove("hidden");
    setConnectionStatus("Signed out", "idle");
  };

  if (el.authSignin) el.authSignin.addEventListener("click", () => setAuthMode("signin"));
  if (el.authSignup) el.authSignup.addEventListener("click", () => setAuthMode("signup"));

  if (el.authForm) {
    el.authForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (state.busy.auth) return;
      state.busy.auth = true;
      setAuthMessage("");

      const email = el.authEmail?.value?.trim();
      const password = el.authPassword?.value || "";
      const username = el.authUsername?.value?.trim();

      if (!email || !password) {
        setAuthMessage("Enter your email and password.", "error");
        state.busy.auth = false;
        return;
      }

      try {
        if (authState.mode === "signup") {
          if (!username) {
            setAuthMessage("Add a username to continue.", "error");
            state.busy.auth = false;
            return;
          }

          const { error } = await state.supabase.auth.signUp({
            email,
            password,
            options: { data: { username } },
          });

          if (error) {
            setAuthMessage(error.message, "error");
          } else {
            setAuthMessage("Account created. Check your email to confirm.", "success");
          }
        } else {
          const { error } = await state.supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) {
            setAuthMessage(error.message, "error");
          } else {
            setAuthMessage("Signing you in…", "success");
          }
        }
      } catch (err) {
        console.error("Auth error:", err);
        setAuthMessage("Something went wrong. Try again.", "error");
      } finally {
        state.busy.auth = false;
      }
    });
  }

  if (el.signOut) {
    el.signOut.addEventListener("click", async () => {
      await state.supabase.auth.signOut();
    });
  }

  state.supabase.auth.onAuthStateChange(async (_evt, session) => {
    state.session = session;
    if (session) await showApp();
    else showGuest();
  });

  // Initial session restore
  const { data, error } = await state.supabase.auth.getSession();
  if (error) console.error("getSession error:", error);

  if (data?.session) {
    state.session = data.session;
    await showApp(); // IMPORTANT: also switches UI
  } else {
    showGuest();
  }

  setAuthMode("signin");
}

document.addEventListener("DOMContentLoaded", init);
