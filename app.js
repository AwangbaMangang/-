const DICT_URL = "dictionary.json"; // local or GitHub raw link

let dictionary = [];

// Fetch dictionary
async function fetchDictionaryFromGitHub() {
  try {
    const res = await fetch(DICT_URL + "?t=" + Date.now());
    dictionary = await res.json();
    localStorage.setItem("dictionary", JSON.stringify(dictionary));
    updateLastSync();
  } catch (e) {
    console.error("Error fetching dictionary:", e);
  }
}

function updateLastSync() {
  const now = new Date();
  localStorage.setItem("lastSync", now.toISOString());
  document.getElementById("lastSync").textContent =
    "Last synced: " + now.toLocaleString();
}

async function autoDailySync() {
  const lastSync = localStorage.getItem("lastSync");
  const oneDay = 24 * 60 * 60 * 1000;
  if (!lastSync || Date.now() - Date.parse(lastSync) > oneDay) {
    await fetchDictionaryFromGitHub();
  } else {
    dictionary = JSON.parse(localStorage.getItem("dictionary") || "[]");
    document.getElementById("lastSync").textContent =
      "Last synced: " + new Date(lastSync).toLocaleString();
  }
}

document.getElementById("forceSync").addEventListener("click", fetchDictionaryFromGitHub);

function replaceText() {
  const input = document.getElementById("input").value;
  let output = input;
  let matches = [];
  dictionary.forEach(rule => {
    const regex = new RegExp(rule.find, "g");
    if (regex.test(output)) {
      matches.push(rule.find);
    }
    output = output.replace(regex, rule.replace);
  });
  document.getElementById("output").value = output;
  document.getElementById("report").textContent =
    "Replacements made for: " + (matches.length ? matches.join(", ") : "None");
}

// UI buttons
document.getElementById("runBtn").addEventListener("click", replaceText);

document.getElementById("copyOut").addEventListener("click", () => {
  navigator.clipboard.writeText(document.getElementById("output").value);
});

document.getElementById("downloadOut").addEventListener("click", () => {
  const blob = new Blob([document.getElementById("output").value], { type: "text/plain" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "output.txt";
  a.click();
});

document.getElementById("uploadBtn").addEventListener("click", () => {
  const inputEl = document.createElement("input");
  inputEl.type = "file";
  inputEl.accept = ".txt";
  inputEl.onchange = e => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = ev => {
      document.getElementById("input").value = ev.target.result;
    };
    reader.readAsText(file);
  };
  inputEl.click();
});

// === Theme handling ===
function setTheme(mode) {
  if (mode === "light") {
    document.documentElement.classList.add("light");
    document.getElementById("themeToggle").textContent = "☀️";
  } else {
    document.documentElement.classList.remove("light");
    document.getElementById("themeToggle").textContent = "🌙";
  }
  localStorage.setItem("theme", mode);
}

document.getElementById("themeToggle").addEventListener("click", () => {
  const current = localStorage.getItem("theme") || "dark";
  setTheme(current === "dark" ? "light" : "dark");
});

(function initTheme() {
  const saved = localStorage.getItem("theme");
  if (saved) {
    setTheme(saved);
  } else {
    if (window.matchMedia("(prefers-color-scheme: light)").matches) {
      setTheme("light");
    } else {
      setTheme("dark");
    }
  }
})();

// === Contrast handling ===
function setContrast(mode) {
  if (mode === "on") {
    document.documentElement.classList.add("high-contrast");
    document.getElementById("contrastToggle").textContent = "🔳";
  } else {
    document.documentElement.classList.remove("high-contrast");
    document.getElementById("contrastToggle").textContent = "⬜";
  }
  localStorage.setItem("contrast", mode);
}

document.getElementById("contrastToggle").addEventListener("click", () => {
  const current = localStorage.getItem("contrast") || "off";
  setContrast(current === "off" ? "on" : "off");
});

(function initContrast() {
  const saved = localStorage.getItem("contrast");
  if (saved) {
    setContrast(saved);
  } else {
    setContrast("off");
  }
})();

// === Reset preferences ===
document.getElementById("resetPrefs").addEventListener("click", () => {
  localStorage.removeItem("theme");
  localStorage.removeItem("contrast");
  setTheme("dark");
  setContrast("off");
  alert("Preferences reset to default");
});

// Initialize
autoDailySync();

// Service Worker
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js");
}
