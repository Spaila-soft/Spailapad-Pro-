const API_KEY = 'AIzaSyDkdXhTEtW4xWjwZ8bmZRxGIdCTBhgAtik'; // YouTube API Key
let isMuted = false;

// -------- SPEAK FUNCTION --------
function speak(text) {
  if (isMuted || !('speechSynthesis' in window)) return;
  const msg = new SpeechSynthesisUtterance(text);
  msg.lang = 'en-US';
  speechSynthesis.speak(msg);
}

// -------- SEARCH INPUT EVENT --------
document.getElementById('searchInput').addEventListener('keydown', function (e) {
  if (e.key === 'Enter') {
    const query = this.value.trim();
    if (!query) return;
    getAnswer(query);
    getExplanation(query);
    getVideos(query);
  }
});

// --------- ANSWER FETCH ---------
async function getAnswer(query) {
  const answerBox = document.getElementById('answer');
  answerBox.innerHTML =  `
  <div class="d-flex justify-content-center align-items-center" style="height: 150px;">
    <div class="spinner-grow text-primary" role="status">
      <span class="visually-hidden">Loading...</span>
    </div>
  </div>
`;

  try {
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${query}`);
    const data = await res.json();
    const def = data[0]?.meanings[0]?.definitions[0]?.definition;
    if (def) {
      answerBox.innerHTML = `<strong>Answer:</strong> ${def}`;
      speak(def);
      return;
    }
  } catch {}

 

  try {
    const res = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json`);
    const data = await res.json();
    if (data.Abstract) {
      answerBox.innerHTML = `<strong>Answer:</strong> ${data.Abstract}`;
      speak(data.Abstract);
      return;
    }
  } catch {}

  answerBox.innerHTML = 'Answer: No reliable answer found.';
}

// --------- EXPLANATION FETCH STACKED ---------
async function getExplanation(query) {
  const explanationBox = document.getElementById('explanation');
  explanationBox.innerHTML = `
    <div class="d-flex justify-content-center align-items-center" style="height: 150px;">
      <div class="spinner-grow text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>
  `;

  // Try Wikipedia first
  try {
    const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`);
    const data = await res.json();
    if (data.extract) {
      explanationBox.innerHTML = `<strong>Explanation:</strong> ${data.extract}`;
      speak(data.extract);
      return;
    }
  } catch (err) {
    console.warn("Wikipedia failed:", err);
  }

  // Try DuckDuckGo next
  try {
    const res = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json`);
    const data = await res.json();
    if (data.Abstract) {
      explanationBox.innerHTML = `<strong>Explanation:</strong> ${data.Abstract}`;
      speak(data.Abstract);
      return;
    }
  } catch (err) {
    console.warn("DuckDuckGo failed:", err);
  }

  // Try MathJS next
try {
  if (/[\d\+\-\*\/\^]/.test(query)) {
    const res = await fetch(`https://api.mathjs.org/v4/?expr=${encodeURIComponent(query)}`);
    const result = await res.text();
    if (result) {
      explanationBox.innerHTML = `<strong>Explanation:</strong> ${result}`;
      speak(result);
      return;
    }
  }
} catch (err) {
  console.warn("MathJS failed:", err);
}


// Try Wiktionary next
try {
  const res = await fetch(`https://en.wiktionary.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`);
  const data = await res.json();
  if (data.extract) {
    explanationBox.innerHTML = `<strong>Explanation:</strong> ${data.extract}`;
    speak(data.extract);
    return;
  }
} catch (err) {
  console.warn("Wiktionary failed:", err);
}
  // Final fallback
  explanationBox.innerHTML = 'Explanation: No related information found.';
  speak("No explanation available.");
}
// --------- YOUTUBE FETCH ---------
async function getVideos(query) {
  const videoBox = document.getElementById('videos');
videoBox.innerHTML = `
  <div class="d-flex justify-content-center align-items-center" style="height: 150px;">
    <div class="spinner-grow text-primary" role="status">
      <span class="visually-hidden">Loading...</span>
    </div>
  </div>
`;

  try {
    const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=10&key=${API_KEY}`);
    const data = await res.json();

    const videoHTML = data.items.map(video => {
      const id = video.id.videoId;
      const title = video.snippet.title;
      const desc = video.snippet.description;
      const thumb = video.snippet.thumbnails.medium.url;

      return `
        <div class="video-card" onclick="playVideo(this, '${id}')">
          <img src="${thumb}" class="video-thumb" alt="Thumbnail">
          <div class="video-info">
            <div class="video-title">${title}</div>
            <div class="video-desc">${desc.slice(0, 120)}...</div>
          </div>
        </div>`;
    }).join('');

    videoBox.innerHTML = `<strong>Related Videos:</strong><br/>` + videoHTML;
  } catch {
    videoBox.innerHTML = 'No videos found.';
  }
}

// Replace thumbnail with iframe on click
function playVideo(card, videoId) {
  card.innerHTML = `
    <iframe width="100%" height="200" src="https://www.youtube.com/embed/${videoId}?autoplay=1"   
      frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"   
      allowfullscreen></iframe>`;
}
// --------- MICROPHONE INPUT ---------
document.getElementById('micButton').addEventListener('click', () => {
  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.lang = 'en-US';
  recognition.start();

  recognition.onresult = (event) => {
    const query = event.results[0][0].transcript;
    document.getElementById('searchInput').value = query;
    getAnswer(query);
    getExplanation(query);
    getVideos(query);
  };

  recognition.onerror = (event) => {
    alert("Error with speech recognition: " + event.error);
  };
});

// --------- MUTE BUTTON ---------
document.getElementById("muteBtn").addEventListener("click", function () {
  isMuted = !isMuted;
  this.innerHTML = isMuted 
  ? `<svg width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v8.06c1.48-.74 2.5-2.26 2.5-4.03zM14 3.23v2.06c3.39.49 6 3.39 6 6.71s-2.61 6.22-6 6.71v2.06c4.45-.51 8-4.27 8-8.77s-3.55-8.26-8-8.77z"/></svg> `
  : `<svg width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v8.06c1.48-.74 2.5-2.26 2.5-4.03z"/><path fill="currentColor" d="M12 3.23v2.06c3.39.49 6 3.39 6 6.71s-2.61 6.22-6 6.71v2.06c4.45-.51 8-4.27 8-8.77s-3.55-8.26-8-8.77z"/></svg> `;
  this.classList.toggle("btn-danger");
  this.classList.toggle("btn-success");

  if (isMuted && speechSynthesis.speaking) {
    speechSynthesis.cancel();
  }

  localStorage.setItem("isMuted", isMuted);
});

// --------- APPLY SETTINGS ON LOAD ---------
window.addEventListener("load", function () {
  const savedMute = localStorage.getItem("isMuted");
  if (savedMute === "true") {
    isMuted = true;
    const btn = document.getElementById("muteBtn");
    btn.textContent = "Unmute";
    btn.classList.remove("btn-danger");
    btn.classList.add("btn-success");
  }

  const savedColor = localStorage.getItem("bgColor");
  if (savedColor) {
    document.body.style.backgroundColor = savedColor;
    document.getElementById("bgColorPicker").value = savedColor;
  }
});

// --------- BACKGROUND COLOR PICKER ---------
document.getElementById("bgColorPicker").addEventListener("input", function () {
  document.body.style.backgroundColor = this.value;
  localStorage.setItem("bgColor", this.value);
});

/* Welcome form modal*/
  function closeWelcomeModal() {
    const modal = document.getElementById("welcomeModal");
    modal.style.display = "none";
  }

  function handleFormSubmit(event) {
    closeWelcomeModal(); // close the modal immediately
    // form will submit normally to FormSubmit.co
  }
  
  /* welcome modal*/
    // Check if the user has seen the welcome before
  if (!localStorage.getItem('spailapad_welcome_seen')) {
    // Show the welcome box
    document.getElementById('welcome-box').style.display = 'block';

    // When the user clicks "Got it!", hide it and mark it as seen
    document.querySelector('#welcome-box button').addEventListener('click', function () {
      document.getElementById('welcome-box').style.display = 'none';
      localStorage.setItem('spailapad_welcome_seen', 'true');
    });
  } else {
    // Hide it immediately if already seen

document.getElementById('welcome-box').style.display = 'none';  
  }
  
  /* contact form button */
  
  function closeContactForm() {
    document.getElementById('contactForm').style.display = 'none';
  }
  
    // Show welcome form once
  window.onload = function() {
    if (!localStorage.getItem('spailapad_joined')) {
      document.getElementById('welcomeModal').style.display = 'block';
      document.getElementById('joinForm').addEventListener('submit', () => {
        localStorage.setItem('spailapad_joined', 'true');
      });
    }
  };

  function toggleContact() {
    const form = document.getElementById('contactForm');
    form.style.display = form.style.display === 'block' ? 'none' : 'block';
  }
  //lot of apps 
  
  function openApp(url) {
    const iframe = document.getElementById("appIframe");
    const container = document.getElementById("appIframeContainer");
    iframe.src = url;
    container.style.display = "block";
  }

function closeContactForm() {
    document.getElementById("contactForm").style.display = "none";
  }
