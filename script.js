// script.js
// Main client-side demo implementing signup/login, free/paid models, message limits, and chat logic.

// ======= Elements =======
const loginForm = document.getElementById("login-form");
const signupForm = document.getElementById("signup-form");
const showSignupLink = document.getElementById("show-signup");
const showLoginLink = document.getElementById("show-login");
const loginBtn = document.getElementById("login-btn");
const signupBtn = document.getElementById("signup-btn");
const logoutBtn = document.getElementById("logout-btn");

const loginEmail = document.getElementById("login-email");
const loginPass = document.getElementById("login-pass");
const signupName = document.getElementById("signup-name");
const signupEmail = document.getElementById("signup-email");
const signupPass = document.getElementById("signup-pass");

const profilePanel = document.getElementById("profile-panel");
const welcomeLine = document.getElementById("welcome-line");
const emailLine = document.getElementById("email-line");
const modelSelect = document.getElementById("model-select");
const adminPanel = document.getElementById("admin-panel");
const adminMarkPaidBtn = document.getElementById("admin-mark-paid");
const adminUserEmailInput = document.getElementById("admin-user-email");
const msgCountEl = document.getElementById("msg-count");
const currentModelDisplay = document.getElementById("current-model-display");

const chatContainer = document.querySelector(".chat-container");
const chatInput = document.getElementById("chat-input");
const sendButton = document.getElementById("send-btn");
const themeBtn = document.getElementById("theme-btn");
const deleteBtn = document.getElementById("delete-btn");

// ======= App state =======
let qaData = { "GPT-5o": [] }; // loaded from gpt-5o.json
let seededUsers = []; // initial users from data.json seed
let currentUser = null; // { name, email, passwordHash, paid:bool, createdAt, messageLog: [] }
let isBotTyping = false;

// constants
const FREE_LIMIT_PER_HOUR = 20;
const MODEL_PREMIUM = "GPT-5o";
const MODEL_CHEAP = "GPT-5o-mini";

// ======= Utility helpers =======
function $(sel){ return document.querySelector(sel); }
function saveUsersToLocal(users) {
  localStorage.setItem("users", JSON.stringify(users));
}
function loadUsersFromLocal() {
  try { return JSON.parse(localStorage.getItem("users") || "[]"); } catch(e){ return []; }
}
function setCurrentUser(user) {
  currentUser = user;
  localStorage.setItem("currentUser", JSON.stringify(user));
}
function getCurrentUserFromStorage() {
  try { return JSON.parse(localStorage.getItem("currentUser") || "null"); } catch(e){ return null; }
}
function hashSimple(s) { return btoa(s); } // demo only, not secure

// ======= Message tracking =======
function recordMessageSent(user) {
  if (!user.messageLog) user.messageLog = [];
  user.messageLog.push(Date.now());
  const users = loadUsersFromLocal();
  const idx = users.findIndex(u => u.email === user.email);
  if (idx !== -1) {
    users[idx] = user;
    saveUsersToLocal(users);
  }
  setCurrentUser(user);
}

function messagesInLastHour(user) {
  if (!user || !user.messageLog) return 0;
  const oneHourAgo = Date.now() - (60 * 60 * 1000);
  user.messageLog = user.messageLog.filter(ts => ts >= oneHourAgo);
  return user.messageLog.length;
}

function updateModelAndStatsUI() {
  if (!currentUser) return;
  const count = messagesInLastHour(currentUser);
  msgCountEl.textContent = count;

  if (!currentUser.paid) {
    if (count >= FREE_LIMIT_PER_HOUR) {
      currentUser.activeModel = MODEL_CHEAP;
      modelSelect.value = MODEL_CHEAP;
      modelSelect.disabled = true;
    } else {
      if (!currentUser.activeModel) currentUser.activeModel = MODEL_PREMIUM;
      modelSelect.value = currentUser.activeModel;
      modelSelect.disabled = true;
    }
  } else {
    currentUser.activeModel = currentUser.activeModel || MODEL_PREMIUM;
    modelSelect.value = currentUser.activeModel;
    modelSelect.disabled = false;
  }

  currentModelDisplay.textContent = currentUser.activeModel || MODEL_PREMIUM;
  setCurrentUser(currentUser);
}

// ======= Load initial JSONs =======
async function loadSeedData() {
  try {
    const res = await fetch("data.json");
    if (res.ok) {
      const d = await res.json();
      seededUsers = d.users || [];
      const localUsers = loadUsersFromLocal();
      seededUsers.forEach(su => {
        if (!localUsers.some(u => u.email === su.email)) {
          localUsers.push(su);
        }
      });
      saveUsersToLocal(localUsers);
    }
  } catch(e) { console.warn("No data.json found, continuing."); }

  try {
    const r = await fetch("gpt-5o.json");
    if (r.ok) {
      qaData = await r.json();
    }
  } catch(e) { console.error("Could not load gpt-5o.json:", e); }
}

// ======= Auth UI wiring =======
showSignupLink?.addEventListener("click", e => {
  e.preventDefault();
  loginForm.classList.add("hidden");
  signupForm.classList.remove("hidden");
});
showLoginLink?.addEventListener("click", e => {
  e.preventDefault();
  signupForm.classList.add("hidden");
  loginForm.classList.remove("hidden");
});

signupBtn.addEventListener("click", () => {
  const name = signupName.value.trim();
  const email = signupEmail.value.trim().toLowerCase();
  const pass = signupPass.value;
  if (!name || !email || !pass) { alert("Fill all fields"); return; }
  const users = loadUsersFromLocal();
  if (users.some(u => u.email === email)) { alert("Email already in use"); return; }
  const newUser = { name, email, passwordHash: hashSimple(pass), paid:false, createdAt: Date.now(), messageLog: [], activeModel: MODEL_PREMIUM };
  users.push(newUser);
  saveUsersToLocal(users);
  setCurrentUser(newUser);
  showProfileForUser(newUser);
  signupForm.classList.add("hidden"); loginForm.classList.add("hidden");
});

loginBtn.addEventListener("click", () => {
  const email = loginEmail.value.trim().toLowerCase();
  const pass = loginPass.value;
  const users = loadUsersFromLocal();
  const found = users.find(u => u.email === email && u.passwordHash === hashSimple(pass));
  if (!found) { alert("Invalid credentials"); return; }
  setCurrentUser(found);
  showProfileForUser(found);
});

logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("currentUser");
  currentUser = null;
  profilePanel.classList.add("hidden");
  loginForm.classList.remove("hidden");
  signupForm.classList.add("hidden");
});

adminMarkPaidBtn?.addEventListener("click", () => {
  const email = adminUserEmailInput.value.trim().toLowerCase();
  if (!email) return alert("Enter email");
  const users = loadUsersFromLocal();
  const idx = users.findIndex(u => u.email === email);
  if (idx === -1) return alert("User not found");
  users[idx].paid = true;
  saveUsersToLocal(users);
  alert(`${email} is now marked paid.`);
});

modelSelect.addEventListener("change", () => {
  if (!currentUser) return;
  if (!currentUser.paid) { modelSelect.value = currentUser.activeModel; return; }
  currentUser.activeModel = modelSelect.value;
  setCurrentUser(currentUser);
  updateModelAndStatsUI();
});

// ======= Chat logic =======
function buildMarkovChain(textArray) {
  const markov = {};
  textArray.forEach(sentence => {
    if (!sentence) return;
    const words = sentence.split(/\s+/).filter(Boolean);
    for (let i=0;i<words.length-1;i++){
      const w = words[i].toLowerCase();
      const nw = words[i+1].toLowerCase();
      if (!markov[w]) markov[w]=[];
      markov[w].push(nw);
    }
  });
  return markov;
}
function generateMarkovResponse(chain, startWord=null, length=30) {
  const keys = Object.keys(chain);
  if (!keys.length) return "";
  let word = startWord && chain[startWord] ? startWord : keys[Math.floor(Math.random()*keys.length)];
  const out = [word];
  for (let i=0;i<length;i++){
    const next = chain[word];
    if (!next || !next.length) break;
    word = next[Math.floor(Math.random()*next.length)];
    out.push(word);
  }
  return out.join(" ");
}
function similarity(a,b){
  const aw = a.toLowerCase().split(/\s+/);
  const bw = b.toLowerCase().split(/\s+/);
  const inter = aw.filter(x=>bw.includes(x));
  return inter.length / Math.max(1, Math.max(aw.length, bw.length));
}

// === Pipeline ===
function generateAnswerPipeline(question, activeModel) {
  const qaItems = qaData["GPT-5o"] || [];
  const q = question.trim().toLowerCase();
  let exactMatches = qaItems.filter(it => it.question.toLowerCase() === q);

  function weightedPick(items, qtext) {
    if (!items.length) return null;
    if (items.length===1) return items[0];
    const weights = items.map(it=>{
      const overlap = qtext.split(/\s+/).filter(w=>it.question.toLowerCase().includes(w)).length;
      return overlap+1;
    });
    const sum = weights.reduce((a,b)=>a+b,0);
    let r = Math.random()*sum;
    for (let i=0;i<items.length;i++){ r-=weights[i]; if (r<=0) return items[i]; }
    return items[0];
  }

  if (exactMatches.length) {
    const sel = weightedPick(exactMatches, q);
    const others = exactMatches.filter(it=>it.answer!==sel.answer).map(it=>it.answer);
    if (others.length) {
      const chain = buildMarkovChain([sel.answer].concat(others));
      const length = activeModel===MODEL_PREMIUM ? 50 : 20;
      return generateMarkovResponse(chain, sel.answer.split(" ")[0].toLowerCase(), length);
    } else {
      if (activeModel===MODEL_PREMIUM) {
        const chain = buildMarkovChain([sel.answer]);
        return generateMarkovResponse(chain, sel.answer.split(" ")[0].toLowerCase(), Math.min(40, sel.answer.split(" ").length+10)) || sel.answer;
      } else return sel.answer;
    }
  } else {
    const sims = qaItems.map(it=>({it,score:similarity(q,it.question)}));
    const maxScore = Math.max(...sims.map(s=>s.score),0);
    if (maxScore>0) {
      const top = sims.filter(s=>s.score===maxScore).map(s=>s.it);
      const sel = weightedPick(top,q);
      const related = qaItems.filter(it=>top.some(t=>t.question===it.question)).map(it=>it.answer);
      if (related.length>1) {
        const chain = buildMarkovChain(related);
        const length = activeModel===MODEL_PREMIUM?45:18;
        return generateMarkovResponse(chain, sel.answer.split(" ")[0].toLowerCase(), length);
      } else return sel.answer;
    } else {
      const unmatched = JSON.parse(localStorage.getItem("unmatchedQuestions")||"[]");
      unmatched.push(question);
      localStorage.setItem("unmatchedQuestions", JSON.stringify(unmatched));
      return activeModel===MODEL_PREMIUM
        ? "I don't know that yet, but here's a general helpful explanation."
        : "Sorry, I don't know that.";
    }
  }
}

// gradual display
function displayTextGradually(element, text, onDone) {
  const words = text.split(/\s+/).filter(Boolean);
  let i=0;
  const delay=100;
  function step(){
    if (i>=words.length) { onDone&&onDone(); return; }
    const chunk = Math.min(words.length-i, Math.floor(Math.random()*3)+2);
    const slice = words.slice(i,i+chunk).join(" ");
    element.textContent += (element.textContent ? " " : "") + slice;
    i+=chunk; setTimeout(step,delay);
  }
  step();
}

// bot response
function showBotResponse(question) {
  if (!currentUser) return;
  isBotTyping = true;
  const incomingDiv = document.createElement("div");
  incomingDiv.classList.add("chat");
  const img = document.createElement("img"); img.src="profile/gpt-5o.jpg"; img.className="avatar";
  const bubble = document.createElement("div"); bubble.className="bubble";
  const typingWrap = document.createElement("div");
  typingWrap.className="typing-animation";
  typingWrap.innerHTML='<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';
  bubble.appendChild(typingWrap);
  incomingDiv.appendChild(img); incomingDiv.appendChild(bubble);
  chatContainer.appendChild(incomingDiv); chatContainer.scrollTop=chatContainer.scrollHeight;

  updateModelAndStatsUI();
  const activeModel = currentUser.activeModel || (currentUser.paid?MODEL_PREMIUM:MODEL_PREMIUM);

  setTimeout(()=>{
    bubble.innerHTML="";
    const p=document.createElement("p"); bubble.appendChild(p);
    const response = generateAnswerPipeline(question,activeModel);
    displayTextGradually(p,response,()=>{
      isBotTyping=false;
      persistChatHTMLForUser();
      updateModelAndStatsUI();
      chatContainer.scrollTop=chatContainer.scrollHeight;
    });
  },700);
}

// chat persistence
function persistChatHTMLForUser() {
  if (!currentUser) return;
  const html = chatContainer.innerHTML;
  const users=loadUsersFromLocal();
  const idx=users.findIndex(u=>u.email===currentUser.email);
  if (idx!==-1) { users[idx].chatHTML=html; saveUsersToLocal(users); }
  setCurrentUser({...currentUser, chatHTML:html});
}
function loadChatForUser(user) {
  if (!user) return;
  const users=loadUsersFromLocal();
  const found=users.find(u=>u.email===user.email);
  if (found?.chatHTML) chatContainer.innerHTML=found.chatHTML;
  else chatContainer.innerHTML=`<div class="default-text"><h1>GPT-5o ChatBot</h1><p>Start chatting.</p></div>`;
  chatContainer.scrollTop=chatContainer.scrollHeight;
}

// send handler
sendButton.addEventListener("click",()=>handleSend());
chatInput.addEventListener("keydown",e=>{
  if (e.key==="Enter"&&!e.shiftKey){ e.preventDefault(); handleSend(); }
});
function handleSend(){
  if (isBotTyping) return;
  if (!currentUser){ alert("Please login or signup."); return; }
  const text=chatInput.value.trim(); if (!text) return;
  const outDiv=document.createElement("div"); outDiv.classList.add("chat","outgoing");
  const img=document.createElement("img"); img.src="profile/user.jpg"; img.className="avatar";
  const bubble=document.createElement("div"); bubble.className="bubble"; bubble.textContent=text;
  outDiv.appendChild(img); outDiv.appendChild(bubble);
  chatContainer.appendChild(outDiv); chatContainer.scrollTop=chatContainer.scrollHeight;
  chatInput.value="";
  recordMessageSent(currentUser); updateModelAndStatsUI();
  setTimeout(()=>showBotResponse(text),300);
}

// delete chat
deleteBtn.addEventListener("click",()=>{
  if (!currentUser) return;
  if (!confirm("Delete all chats?")) return;
  const users=loadUsersFromLocal();
  const idx=users.findIndex(u=>u.email===currentUser.email);
  if (idx!==-1){ users[idx].chatHTML=""; saveUsersToLocal(users); }
  currentUser.chatHTML=""; setCurrentUser(currentUser);
  loadChatForUser(currentUser);
});

// theme toggle
themeBtn.addEventListener("click",()=>{ document.body.classList.toggle("light-mode"); });

// profile UI
function showProfileForUser(user){
  if (!user) return;
  profilePanel.classList.remove("hidden");
  loginForm.classList.add("hidden"); signupForm.classList.add("hidden");
  welcomeLine.textContent=(user.email==="admin@gmail.com")?"Welcome, Admin":`Welcome, ${user.name}`;
  emailLine.textContent=user.email;
  if (user.email==="admin@gmail.com") adminPanel.classList.remove("hidden");
  else adminPanel.classList.add("hidden");
  updateModelAndStatsUI(); loadChatForUser(user);
}

// init
(async function init(){
  await loadSeedData();
  const users=loadUsersFromLocal();
  if (!users.some(u=>u.email==="admin@gmail.com")){
    users.push({ name:"Admin", email:"admin@gmail.com", passwordHash:hashSimple("Admin123"), paid:true, createdAt:Date.now(), messageLog:[], activeModel:MODEL_PREMIUM });
    saveUsersToLocal(users);
  }
  const stored=getCurrentUserFromStorage();
  if (stored){ const all=loadUsersFromLocal(); const found=all.find(u=>u.email===stored.email); if (found){ setCurrentUser(found); showProfileForUser(found); } }
  else loginForm.classList.remove("hidden");
})();
