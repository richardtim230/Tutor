const API_BASE = "https://examguide.onrender.com/api/codecxreg";
function showStudentLoader() {
  if (document.getElementById('studentDataLoader')) return;
  const loaderHtml = `
    <div id="studentDataLoader" style="
      position:fixed;
      top:0;left:0;width:100vw;height:100vh;
      background:rgba(245,247,255,0.87);
      z-index:9999;display:flex;
      align-items:center;justify-content:center;
      transition:opacity 0.3s;
    ">
      <div style="text-align:center;">
        <div style="display:inline-block; margin-bottom:18px;">
          <svg width="64" height="64" viewBox="0 0 50 50" style="animation:spin 1.3s linear infinite;">
            <circle cx="25" cy="25" r="20" fill="none" stroke="#6366f1" stroke-width="6" stroke-linecap="round" stroke-dasharray="90,150">
              <animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="1.3s" repeatCount="indefinite"/>
            </circle>
          </svg>
        </div>
        <div style="font-size:1.1rem;color:#6366f1;font-weight:600;">Loading your dashboard...</div>
        <div style="color:#64748b;font-size:0.93rem;margin-top:8px;">Please wait while we fetch your data.</div>
      </div>
    </div>
    <style>
      @keyframes spin { 100% { transform: rotate(360deg); } }
    </style>
  `;
  document.body.insertAdjacentHTML('beforeend', loaderHtml);
}

function hideStudentLoader() {
  const loader = document.getElementById('studentDataLoader');
  if (loader) {
    loader.style.opacity = '0';
    setTimeout(() => loader.remove(), 350);
  }
}


// Fetch student profile (includes assignments and payments)
function fetchStudentProfile(token) {
  return fetch(`${API_BASE}/me`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  .then(res => {
    if (!res.ok) throw new Error('Failed to fetch profile');
    return res.json();
  });
}

// Get assignments from profile
function fetchAssignments(token) {
  return fetchStudentProfile(token)
    .then(profile => profile.assignmentHistory || []);
}

// Get payments from profile
function fetchPayments(token) {
  return fetchStudentProfile(token)
    .then(profile => profile.payments || []);
}

// Usage in loadDashboardData:
function loadDashboardData(token) {
  showStudentLoader();
  Promise.all([
    fetchStudentProfile(token),
    fetchAssignments(token),
    fetchPayments(token)
  ])
  .then(([profile, assignments, payments]) => {
    try {
      window.student = profile;
      window.assignments = assignments;
      window.payments = payments;
      renderAssignmentHistory(assignments);
      renderCourses();
      renderPayments();
      renderProgressSection();
    } catch (err) {
      console.error('Render error:', err);
      showToast('Failed to render dashboard: ' + err, 'error');
    }
  })
  .catch(err => {
    console.error('Error loading dashboard:', err);
    showToast('Failed to load dashboard: ' + err, 'error');
  })
  .finally(() => {
    hideStudentLoader();
  });
}

// Usage example (run after DOMContentLoaded):
document.addEventListener("DOMContentLoaded", function() {
  const token = localStorage.getItem('codecx_token');
  if (token) {
    loadDashboardData(token);
  } else {
    window.location.href = "login.html";
  }
});

(function() {
  // Inject toast modal HTML if not present
  if (!document.getElementById('toastModalBg')) {
    const modalBg = document.createElement('div');
    modalBg.id = 'toastModalBg';
    modalBg.className = 'fixed inset-0 z-50 bg-black bg-opacity-20 flex items-center justify-center hidden';
    modalBg.innerHTML = `
      <div id="toastModal" class="bg-white rounded-xl shadow-lg p-6 max-w-lg w-full text-center relative">
        <div id="toastSpinner" class="mb-3" style="display:none;">
          <div class="spin-anim inline-block w-8 h-8 border-4 border-indigo-400 border-t-transparent rounded-full"></div>
        </div>
        <div id="toastTitle" class="font-bold text-lg text-indigo-700 mb-2"></div>
        <div id="toastMessage" class="text-gray-700 mb-4"></div>
        <button id="toastCloseBtn" class="px-4 py-2 bg-indigo-600 text-white rounded font-semibold">Close</button>
      </div>
    `;
    document.body.appendChild(modalBg);

    // Add spinner animation style
    if (!document.getElementById('spinAnimStyle')) {
      const style = document.createElement('style');
      style.id = 'spinAnimStyle';
      style.textContent = `
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin-anim { animation: spin 1s linear infinite; }
      `;
      document.head.appendChild(style);
    }
    // Close button logic
    document.getElementById('toastCloseBtn').onclick = function() {
      modalBg.classList.add('hidden');
    };
    modalBg.onclick = function(e) {
      if (e.target === modalBg) modalBg.classList.add('hidden');
    };
  }

  // Expose global functions
  window.showToastModal = function(title, message, type = "info", showSpinner = false) {
    document.getElementById('toastTitle').textContent = title || '';
    document.getElementById('toastMessage').innerHTML = message || ''; // <-- Use innerHTML here!
    document.getElementById('toastSpinner').style.display = showSpinner ? 'block' : 'none';
    document.getElementById('toastModalBg').classList.remove('hidden');
    document.getElementById('toastTitle').style.color =
      type === 'success' ? '#16a34a' :
      type === 'error' ? '#dc2626' : '#6366f1';
};
  window.hideToastModal = function() {
    document.getElementById('toastModalBg').classList.add('hidden');
  };
})();
    
const WS_GROUP_LINK = "https://chat.whatsapp.com/HErvit5xKqY4cMGm9hsi5R?mode=ems_copy_c";
let student = {};
let token = localStorage.getItem('codecx_token');
let chatPollingInterval = null;
let ws = null, reconnectTimeout = null;

// Toast utility
function showToast(msg, type = "info") {
  Toastify({
    text: msg,
    duration: 10000,
    gravity: "top",
    position: "center",
    backgroundColor: type === "success" ? "#16a34a" :
      type === "error" ? "#dc2626" : "#6366f1"
  }).showToast();
}
function logout() {
  localStorage.removeItem('codecx_token');
  localStorage.removeItem('matricNumber');
  window.location.href = "login.html";
}

    
// Receipt Modal
function showReceiptModal(html) {
  document.getElementById("receiptModalContent").innerHTML = html;
  document.getElementById("receiptModal").classList.remove("hidden");
}
function closeReceipt() {
  document.getElementById("receiptModal").classList.add("hidden");
}
document.getElementById("receiptModal").addEventListener("click", function (e) {
  if (e.target === this) closeReceipt();
});

// Payment Modal
document.getElementById("payNowBtn").onclick = function () {
  document.getElementById("paymentModalBg").classList.add("show");
};
function closePaymentModal() {
  document.getElementById("paymentModalBg").classList.remove("show");
}

// WhatsApp Group Button Logic
function updateWhatsAppBtn() {
  const btn = document.getElementById("whatsappGroupBtn");
  const note = document.getElementById("whatsappNote");
  if (student.hasPaid) {
    btn.disabled = false;
    btn.onclick = () => window.open(WS_GROUP_LINK, "_blank");
    note.textContent = "Access to the closed WhatsApp group is reserved for paid students.";
  } else {
    btn.disabled = true;
    btn.onclick = null;
    note.textContent = "Pay for the masterclass to access the exclusive WhatsApp group.";
  }
}

// Loader & Toast Modal
function showLoader(show = true) {
  let loader = document.getElementById("globalLoaderModal");
  if (!loader) {
    loader = document.createElement("div");
    loader.id = "globalLoaderModal";
    loader.style = "position:fixed;inset:0;display:flex;align-items:center;justify-content:center;z-index:99999;background:rgba(60,72,128,0.16);";
    loader.innerHTML = `<div style="padding:2.2rem 2.8rem;background:#fff;border-radius:1.2rem;box-shadow:0 6px 32px #6366f133;display:flex;flex-direction:column;align-items:center;">
      <div class="spinner" style="width:44px;height:44px;border:5px solid #6366f1;border-top:5px solid #fff;border-radius:50%;animation:spin 1.1s linear infinite"></div>
      <div style="font-size:1.1rem;color:#6366f1;font-weight:600;margin-top:1.2rem">Loading, please wait...</div>
    </div>`;
    document.body.appendChild(loader);
    // Spinner CSS
    if (!document.getElementById('globalSpinnerStyle')) {
      const style = document.createElement('style');
      style.id = 'globalSpinnerStyle';
      style.textContent = '@keyframes spin{0%{transform:rotate(0deg);}100%{transform:rotate(360deg);}}';
      document.head.appendChild(style);
    }
  }
  loader.style.display = show ? 'flex' : 'none';
}

function showToastModal(title, message, type="info") {
  let modal = document.getElementById("globalToastModal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "globalToastModal";
    modal.style = "position:fixed;inset:0;display:flex;align-items:center;justify-content:center;z-index:99999;background:rgba(60,72,128,0.13);";
    modal.innerHTML = `<div style="padding:2.4rem 2.5rem;background:#fff;border-radius:1.25rem;box-shadow:0 8px 40px #6366f155;display:flex;flex-direction:column;align-items:center;max-width:95vw;">
      <div id="toastIcon" style="font-size:2.3rem;margin-bottom:0.7rem"></div>
      <div id="toastTitle" style="font-size:1.23rem;font-weight:700;color:#6366f1;margin-bottom:0.7rem"></div>
      <div id="toastMsg" style="font-size:1.07rem;color:#444;margin-bottom:1.2rem;text-align:center"></div>
      <button onclick="document.getElementById('globalToastModal').style.display='none'" style="padding:0.6rem 2rem;background:#6366f1;color:#fff;border:none;border-radius:.7rem;font-weight:600;cursor:pointer;font-size:1.05rem">Close</button>
    </div>`;
    document.body.appendChild(modal);
  }
  document.getElementById("toastTitle").textContent = title;
  document.getElementById("toastMsg").textContent = message;
  let icon = "ℹ️";
  if (type === "success") icon = "✅";
  if (type === "error") icon = "❌";
  document.getElementById("toastIcon").textContent = icon;
  modal.style.display = "flex";
}

// Helper: Allowed topics based on registered courses
function getAllowedTopics(courses) {
  const courseStr = (courses || []).map(c => c.name.toLowerCase()).join(" ");
  return {
    HTML: /html/.test(courseStr),
    CSS: /css/.test(courseStr),
    JS: /javascript|js/.test(courseStr),
  };
}

function formatDateUTC(date) {
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// Set program start date (Monday 8th September 2025)
const PROGRAM_START_DATE = new Date('2025-09-08T00:00:00');

// Generate session dates for 60 days
const sessions = [];
for (let i = 0; i < 60; i++) {
  const sessionDate = new Date(PROGRAM_START_DATE);
  sessionDate.setDate(sessionDate.getDate() + i);
  let topic = "";
  if (i < 20) topic = `HTML: Day ${i + 1}`;
  else if (i < 40) topic = `CSS: Day ${i - 19}`;
  else topic = `JavaScript: Day ${i - 39}`;
  sessions.push({
    day: i + 1,
    topic,
    topicKey: i < 20 ? "HTML" : (i < 40 ? "CSS" : "JS"),
    date: formatDate(sessionDate)
  });
}

// Helper: Get quiz/attendance status for a day
function getQuizStatus(day) {
  if (!student.activities) return { quiz: false, attendance: false };
  const quizAct = student.activities.find(a => a.activity.startsWith(`Quiz completed - Day ${day}`));
  const attAct = student.activities.find(a => a.activity === `Attendance marked - Day ${day}`);
  return {
    quiz: !!quizAct,
    attendance: !!attAct
  };
}


async function fetchQuizForDay(day) {
  try {
    const response = await fetch('/quizzes.json');
    if (!response.ok) throw new Error('Failed to load quizzes.json');
    const data = await response.json();
    // Ensure both are numbers for comparison
    const quiz = data.days.find(q => Number(q.day) === Number(day));
    return quiz || null;
  } catch (error) {
    console.error('Error fetching quiz:', error);
    return null;
  }
}

async function renderProgressSection() {
  const PROGRAM_START_DATE = new Date('2025-09-08T00:00:00Z');
  const now = new Date();
  const diffDays = Math.floor((now - PROGRAM_START_DATE) / (1000 * 60 * 60 * 24)) + 1;

  // Determine days to show (rolling window of 5 days)
  const firstDayToShow = Math.max(1, diffDays - 4); // 5 quizzes max
  const daysToShow = [];
  for (let day = diffDays; day >= firstDayToShow; day--) {
    daysToShow.push(day);
  }

  // Fetch quizzes for those days (in parallel)
  const quizzes = await Promise.all(daysToShow.map(day => fetchQuizForDay(day)));

  const progressSummary = document.getElementById("progressSummary");
  const progressGrid = document.getElementById("progressGrid");

  // Handle program not started or no quizzes found
  if (now < PROGRAM_START_DATE) {
    progressSummary.textContent = "The program has not started yet.";
    progressGrid.innerHTML = "";
    return;
  }
  if (!quizzes.some(q => q)) {
    progressSummary.textContent = "No quizzes found for these days.";
    progressGrid.innerHTML = "";
    return;
  }

  // Render quiz cards for each day (most recent at top)
  let html = quizzes.map((quiz, index) => {
    const day = daysToShow[index];
    if (!quiz) return `<div class="border rounded-lg p-4 bg-gray-50 min-w-0 mb-3">No quiz for Day ${day}</div>`;
    const status = getQuizStatus(day);
    let card = `<div class="border border-indigo-400 rounded-lg p-4 bg-gray-50 flex flex-col items-start relative min-w-0 mb-3" style="max-width:500px;">
      <div class="font-bold text-lg mb-1">${quiz.topic}</div>
      <div class="text-xs text-gray-500 mb-3">Day ${quiz.day}</div>
      <div class="mb-3">`;
    if (status.quiz) {
      card += `<span class="text-green-700 flex items-center"><i class="bi bi-check-circle-fill mr-1"></i>Quiz Done</span>`;
    } else {
      card += `<button class="px-3 py-2 text-base bg-indigo-600 text-white rounded quiz-btn" data-day="${quiz.day}">Take Quiz</button>`;
    }
    card += `</div>`;
    if (status.attendance) {
      card += `<span class="text-green-700 flex items-center"><i class="bi bi-person-check-fill mr-1"></i>Attendance Marked</span>`;
    } else if (status.quiz) {
      card += `<button class="px-3 py-2 text-base bg-green-600 text-white rounded attendance-btn" data-day="${quiz.day}">Mark Attendance</button>`;
    }
    card += `</div>`;
    return card;
  }).join("");

  progressSummary.textContent = `Showing quizzes for Days ${firstDayToShow} to ${diffDays}.`;
  progressGrid.innerHTML = html;

  // Quiz button event
  document.querySelectorAll(".quiz-btn").forEach(btn => {
    btn.onclick = async function () {
      const day = parseInt(btn.getAttribute("data-day"), 10);
      await showQuizModal(day);
    };
  });

  // Attendance button event
  document.querySelectorAll(".attendance-btn").forEach(btn => {
    btn.onclick = async function () {
      const day = parseInt(btn.getAttribute("data-day"), 10);
      await markAttendance(day);
    };
  });
}


// ---- QUIZ MODAL LOGIC ----
async function showQuizModal(day) {
  showLoader(true);
  try {
    // Fetch from quizzes.json
    let data = await fetchQuizForDay(day);
    showLoader(false);
    if (!data || !data.questions) {
      showToastModal("Error Loading Quiz", "Could not load quiz", "error");
      return;
    }
    let html = `<div class="modal-title">Day ${day} Quiz</div>
      <form id="quizForm">
        <div class="modal-quiz">`;
    data.questions.forEach((q, i) => {
      html += `<div class="mb-2"><b>Q${i + 1}:</b> ${escapeHtml(q.question)}</div>`;
      if (q.code) {
        html += `<pre class="bg-gray-100 rounded p-2 mb-2 overflow-x-auto">
          <code class="language-html">${escapeHtml(q.code)}</code>
        </pre>`;
      }
      html += `<div class="modal-quiz-options mb-4">` +
        q.options.map((opt, idx) =>
          `<label>
            <input type="radio" name="q${i}" value="${escapeHtml(opt)}"/>
            <span>${escapeHtml(opt)}</span>
          </label>`
        ).join("") + `</div>`;
    });
    html += `</div>
      <div class="modal-actions">
        <button type="submit" class="modal-btn" id="submitQuizBtn"><span>Submit Quiz</span></button>
        <button type="button" class="modal-btn secondary" onclick="closeDayQuizModal()">Cancel</button>
      </div>
      </form>
      <div id="quizResult" style="margin-top:1.2rem"></div>`;
    document.getElementById("dayQuizContent").innerHTML = html;
    document.getElementById("dayQuizModalBg").style.display = "flex";

    // Highlight code blocks
    setTimeout(() => { if (window.Prism) Prism.highlightAll(); }, 100);

    document.getElementById("quizForm").onsubmit = async function (e) {
      e.preventDefault();
      showLoader(true);
      const submitBtn = document.getElementById("submitQuizBtn");
      submitBtn.disabled = true;
      // Prepare answers
      const answers = [];
      for (let i = 0; i < data.questions.length; i++) {
        const ansInput = document.querySelector(`input[name="q${i}"]:checked`);
        answers.push(ansInput ? ansInput.value : "");
      }

      try {
        // Grade quiz on client-side for .json quizzes
        let score = 0;
        let total = data.questions.length;
        data.questions.forEach((q, idx) => {
          if (answers[idx] === q.answer) score++;
        });
        const percent = Math.round((score / total) * 100);

        // Correction/Review block
        let reviewHtml = '<div class="mt-4"><b>Corrections:</b><ul style="list-style:decimal inside;">';
        data.questions.forEach((q, idx) => {
          const userAns = answers[idx];
          const correctAns = q.answer;
          const isCorrect = userAns === correctAns;
          reviewHtml += `<li style="margin-bottom:0.7em;">
            <div><b>Q${idx+1}:</b> ${escapeHtml(q.question)}</div>
            ${q.code ? `<pre class="bg-gray-100 rounded p-2 mb-2 overflow-x-auto"><code class="language-html">${escapeHtml(q.code)}</code></pre>` : ""}
            <div>Your answer: <span style="color:${isCorrect ? 'green' : 'red'};font-weight:bold;">${escapeHtml(userAns || 'No answer')}</span></div>
            ${isCorrect ? `<div style="color:green;">Correct ✔️</div>` : `<div style="color:red;">Incorrect ❌. Correct answer: <span style="font-weight:bold;">${escapeHtml(correctAns)}</span></div>`}
          </li>`;
        });
        reviewHtml += '</ul></div>';

        showLoader(false);
        document.getElementById("quizResult").innerHTML =
          `<div class="font-bold text-green-700 mb-2"><i class="bi bi-award"></i> Quiz Score: ${score} / ${total} (${percent}%)</div>${reviewHtml}`;

        // Record quiz completion (with score)
        await markQuizCompletedWithScore(day, score);

        // Auto-mark attendance
        await markAttendance(day, true);

        showToastModal("Quiz Submitted", `Your score: ${score} / ${total} (${percent}%). Attendance marked for Day ${day}.`, "success");

        // Wait a bit for user to see score, then close modal & reload dashboard
        setTimeout(() => {
          closeDayQuizModal();
          reloadDashboard();
        }, 20000); // Increased to 6s for more time for review

      } catch (err) {
        showLoader(false);
        showToastModal("Quiz Submission Error", err.message, "error");
        submitBtn.disabled = false;
      }
    };
  } catch (err) {
    showLoader(false);
    showToastModal("Quiz Modal Error", err.message, "error");
  }
}


// Helper: Record quiz completed activity WITH score
async function markQuizCompletedWithScore(day, score) {
  showLoader(true);
  try {
    const resp = await fetch(`${API_BASE}/activities`, {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + token,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ activity: `Quiz completed - Day ${day} (Score: ${score})` })
    });
    const data = await resp.json();
    showLoader(false);
    if (!resp.ok) throw new Error(data.message);
    return true;
  } catch (err) {
    showLoader(false);
    showToastModal("Quiz Completion Error", err.message, "error");
    throw new Error("Failed to record quiz completion: " + err.message);
  }
}

// Helper: Mark attendance for day (optionally silent on error if auto)
async function markAttendance(day, auto = false) {
  showLoader(true);
  try {
    const resp = await fetch(`${API_BASE}/activities`, {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + token,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ activity: `Attendance marked - Day ${day}` })
    });
    const data = await resp.json();
    showLoader(false);
    if (!resp.ok) throw new Error(data.message);
    return true;
  } catch (err) {
    showLoader(false);
    if (!auto) showToastModal("Attendance Error", err.message, "error");
    if (auto) console.warn("Auto attendance failed:", err.message);
    return false;
  }
}

// Helper: Close quiz modal
function closeDayQuizModal() {
  document.getElementById("dayQuizModalBg").style.display = "none";
}


async function reloadDashboard() {
  if (!token) { logout(); return; }
  try {
    const resp = await fetch(`${API_BASE}/me`, {
      headers: { "Authorization": "Bearer " + token }
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.message);
    student = data;

window.student = student; // <-- Add this line!

    localStorage.setItem('matricNumber', student.matricNumber);

    document.getElementById("studentAvatar").src = student.passportBase64 || "https://ui-avatars.com/api/?name=" + encodeURIComponent(student.fullName);
    document.getElementById("studentPassport").src = student.passportBase64 || "https://ui-avatars.com/api/?name=" + encodeURIComponent(student.fullName);
    document.getElementById("studentFullName").textContent = student.fullName;
    document.getElementById("studentNameHeader").textContent = student.fullName;
    document.getElementById("studentMatric").textContent = student.matricNumber;
    document.getElementById("studentEmail").textContent = student.email;
    document.getElementById("studentPhone").textContent = student.phone;
    document.getElementById("studentStatus").innerHTML = student.hasPaid
      ? `<span class="bg-green-100 text-green-800">Paid & Active</span>`
      : `<span class="bg-red-100 text-red-800">Unpaid (Limited Access)</span>`;
    updateWhatsAppBtn();

    // Lock masterclass features if unpaid
    const locked = !student.hasPaid;
    document.getElementById("masterclassSection").classList.toggle("locked", locked);
    document.querySelector("#masterclassSection .padlock-icon").style.display = locked ? "block" : "none";
    document.getElementById("unlockMessage").classList.toggle("hidden", !locked);
    renderAssignmentHistory(student.assignmentHistory || []);
  
    renderCourses();
    renderActivity();
    renderPayments();
    renderProgressSection();
    
    document.getElementById("adminNote").textContent = student.adminNote || "";
    
  } catch (err) {
    showToast("Error loading dashboard: " + err.message, "error");
    logout();
  }
}
document.addEventListener("DOMContentLoaded", reloadDashboard);
// Courses
function renderCourses() {
  const list = document.getElementById("coursesList");
  list.innerHTML = "";
  (student.courses || []).forEach(c => {
    list.innerHTML += `<span class="px-3 py-1 rounded bg-gray-200 text-indigo-800 font-semibold flex items-center gap-1">${c.name}
      <button class="ml-2 text-red-700" style="font-size:1.1em" onclick="removeCourse('${c.name}')">&times;</button>
    </span>`;
  });
}
async function addCourse() {
  const select = document.getElementById("courseSelect");
  const courseName = select.value;
  if (!courseName) {
    if (window.showToastModal) {
      showToastModal("Error", "Select a course to add.", "error");
      setTimeout(hideToastModal, 2000);
    } else {
      showToast("Select a course to add.", "error");
    }
    return;
  }
  // Show loader modal if available
  if (window.showToastModal) showToastModal("Adding Course...", "Please wait while we add your course.", "info", true);
  try {
    const resp = await fetch(`${API_BASE}/courses`, {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + token,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ courseName })
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.message);
    await reloadDashboard();
    if (window.showToastModal) {
      showToastModal("Course Added!", "Your course was added successfully.", "success");
      setTimeout(hideToastModal, 2000);
    } else {
      showToast("Course added!", "success");
    }
  } catch (err) {
    if (window.showToastModal) {
      showToastModal("Error", err.message, "error");
      setTimeout(hideToastModal, 2000);
    } else {
      showToast(err.message, "error");
    }
  }
}

async function removeCourse(courseName) {
  if (window.showToastModal) showToastModal("Removing Course...", "Please wait while we remove your course.", "info", true);
  try {
    const resp = await fetch(`${API_BASE}/courses`, {
      method: "DELETE",
      headers: {
        "Authorization": "Bearer " + token,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ courseName })
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.message);
    await reloadDashboard();
    if (window.showToastModal) {
      showToastModal("Course Removed!", "Your course was removed successfully.", "success");
      setTimeout(hideToastModal, 2000);
    } else {
      showToast("Course removed!", "success");
    }
  } catch (err) {
    if (window.showToastModal) {
      showToastModal("Error", err.message, "error");
      setTimeout(hideToastModal, 2000);
    } else {
      showToast(err.message, "error");
    }
  }
}
// Activity
function renderActivity() {
  const table = document.getElementById("activityTable");
  table.innerHTML = "";
  (student.activities || []).slice(-12).reverse().forEach(act => {
    table.innerHTML += `
      <tr>
        <td class="border px-2 py-1">${formatDate(act.date)}</td>
        <td class="border px-2 py-1">${act.activity}</td>
        <td class="border px-2 py-1">${act.status}</td>
      </tr>
    `;
  });
  // Attendance Status
  let latestAttendance = (student.activities || []).filter(a => /^Attendance marked - Day \d+$/.test(a.activity)).slice(-1)[0];
  document.getElementById("attendanceStatus").textContent =
    latestAttendance ? `Last attendance: ${formatDate(latestAttendance.date)}` : "No attendance marked yet.";
}

async function submitAssignment() {
  const inp = document.getElementById("assignmentInput");
  if (!inp.files[0]) {
    if (window.showToastModal) {
      showToastModal("Error", "Select an assignment file to upload.", "error");
      setTimeout(hideToastModal, 20000);
    } else {
      showToast("Select an assignment file to upload.", "error");
    }
    return;
  }
  if (window.showToastModal) showToastModal("Uploading Assignment...", "Please wait while we upload your assignment.", "info", true);

  try {
    let matricNumber = window.student?.matricNumber || localStorage.getItem("matricNumber");
    if (!matricNumber) {
      const profileResp = await fetch(`${API_BASE}/me`, {
        headers: { "Authorization": "Bearer " + token }
      });
      const profile = await profileResp.json();
      if (profile && profile.matricNumber) matricNumber = profile.matricNumber;
    }
    if (!matricNumber) throw new Error("Matric number not found.");

    // Replace slashes with dashes for URL safety
    const safeMatricNumber = matricNumber.replace(/\//g, '-');

    const formData = new FormData();
    formData.append("assignment", inp.files[0]);
    formData.append("title", inp.files[0].name);

    const resp = await fetch(`${API_BASE}/student/matric/${safeMatricNumber}/assignment`, {
      method: "POST",
      headers: { "Authorization": "Bearer " + token },
      body: formData
    });

    const text = await resp.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      throw new Error("Server error: " + text);
    }

    if (!resp.ok) throw new Error(data.message || "Assignment upload failed");

    document.getElementById("assignmentStatus").textContent = "Submitted!";
    inp.value = "";
    await reloadDashboard();

    if (window.showToastModal) {
      showToastModal("Success!", "Assignment submitted successfully.", "success");
      setTimeout(hideToastModal, 20000);
    } else {
      showToast("Assignment submitted!", "success");
    }
  } catch (err) {
  if (err.message === "Failed to fetch") {
    showToastModal("Network Error", "Could not connect to server. Try again later.", "error");
    setTimeout(hideToastModal, 20000);
  } else {
    showToastModal("Error", err.message, "error");
    setTimeout(hideToastModal, 20000);
  }
}
}

function renderPayments() {
  const tb = document.getElementById("paymentsTable");
  tb.innerHTML = "";
  (student.payments || []).slice(-8).reverse().forEach(p => {
    tb.innerHTML += `
      <tr>
        <td class="border px-2 py-1">${formatDate(p.date)}</td>
        <td class="border px-2 py-1">₦${p.amount}</td>
        <td class="border px-2 py-1">${p.status}</td>
        <td class="border px-2 py-1">${p.ref}</td>
      </tr>
    `;
  });
  document.getElementById("paymentStatus").textContent =
    student.hasPaid
      ? `Last payment: ₦${student.payments?.slice(-1)[0]?.amount || ""} (Ref: ${student.lastPaymentRef || ""})`
      : "No payment yet. Please complete payment to unlock features.";
}

// --- Date Formatting ---
function formatDate(dt) {
  const date = new Date(dt);
  if (isNaN(date)) return "";
  return date.toLocaleString();
    }


// Update assignment upload flow to call reloadDashboard after successful submission
async function submitAssignment() {
  const inp = document.getElementById("assignmentInput");
  if (!inp.files[0]) {
    showToast("Select an assignment file to upload.", "error");
    return;
  }
  showToastModal("Uploading Assignment...", "Please wait while we upload your assignment.", "info", true);

  try {
    let matricNumber = window.student?.matricNumber || localStorage.getItem("matricNumber");
    if (!matricNumber) throw new Error("Matric number not found.");

    // Replace slashes with dashes for URL safety
    const safeMatricNumber = matricNumber.replace(/\//g, '-');

    const formData = new FormData();
    formData.append("assignment", inp.files[0]);
    formData.append("title", inp.files[0].name);

    const resp = await fetch(`${API_BASE}/student/matric/${safeMatricNumber}/assignment`, {
      method: "POST",
      headers: { "Authorization": "Bearer " + token },
      body: formData
    });

    const text = await resp.text();
    let data;
    try { data = JSON.parse(text); } catch (e) { throw new Error("Server error: " + text); }
    if (!resp.ok) throw new Error(data.message || "Assignment upload failed");

    document.getElementById("assignmentStatus").textContent = "Submitted!";
    inp.value = "";
    await reloadDashboard();

    showToastModal("Success!", "Assignment submitted successfully.", "success");
    setTimeout(hideToastModal, 2000);
  } catch (err) {
    showToastModal("Error", err.message, "error");
    setTimeout(hideToastModal, 2000);
  }
}

// Update assignment delete flow to reload dashboard after deletion
async function deleteAssignment(index) {
  if (!confirm("Delete this assignment? This action cannot be undone.")) return;
  showToastModal("Deleting...", "Please wait...", "info", true);
  try {
    let matricNumber = window.student?.matricNumber || localStorage.getItem("matricNumber");
    if (!matricNumber) throw new Error("Matric number not found.");
    const safeMatricNumber = matricNumber.replace(/\//g, '-');
    const resp = await fetch(`${API_BASE}/student/matric/${safeMatricNumber}/assignment/${index}`, {
      method: "DELETE",
      headers: { "Authorization": "Bearer " + token }
    });
    let data;
    try { data = await resp.json(); } catch (e) { data = {}; }
    if (!resp.ok) throw new Error(data.message || "Delete failed");
    await reloadDashboard();
    showToastModal("Deleted!", "Assignment deleted.", "success");
    setTimeout(hideToastModal, 1500);
  } catch (err) {
    showToastModal("Error", err.message, "error");
    setTimeout(hideToastModal, 2000);
  }
}

// Render assignment history from window.student.assignments
// Render assignment history from window.student.assignmentHistory
function renderAssignmentHistory(assignmentHistory) {
  const history = document.getElementById("assignmentHistory");
  if (!assignmentHistory || !assignmentHistory.length) {
    history.innerHTML = `<div class="text-gray-400 text-center">No assignments submitted yet.</div>`;
    return;
  }
  history.innerHTML = assignmentHistory.map((a, idx) => `
    <div class="flex flex-col md:flex-row items-center bg-gray-50 rounded-lg shadow-sm px-4 py-3 gap-4">
      <div class="flex-1 min-w-0">
        <div class="font-semibold text-indigo-700">${a.title || a.fileName || "Assignment"}</div>
        <div class="text-xs text-gray-500">Submitted: ${a.historyDate ? new Date(a.historyDate).toLocaleString() : (a.date ? new Date(a.date).toLocaleString() : "")}</div>
        ${a.mark ? `<div class="text-xs text-green-700">Mark: ${a.mark}</div>` : ""}
        ${a.status ? `<div class="text-xs text-indigo-700">Status: ${a.status}</div>` : ""}
      </div>
      <div class="flex gap-2 mt-2 md:mt-0">
        <button class="px-3 py-1 bg-gray-200 text-indigo-700 rounded font-semibold hover:bg-indigo-100"
          onclick="previewAssignmentHistory(${idx})">
          <i class="bi bi-eye-fill mr-1"></i> Preview
        </button>
      </div>
    </div>
  `).join("");
}

// Helper to escape HTML for safe code preview
function escapeHtml(text) {
  return text.replace(/[&<>"']/g, function (m) {
    return (
      {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }[m]
    );
  });
}

function getExtension(filename) {
  return filename?.split('.').pop().toLowerCase();
}

// Main preview function for assignment history
function previewAssignmentHistory(index) {
  const assignment = (window.student?.assignmentHistory || [])[index];
  if (!assignment) return;

  const downloadLink = assignment.fileData
    ? `<a href="data:${assignment.fileType};base64,${assignment.fileData}" download="${assignment.fileName}" target="_blank"
      style="color:#6366f1;font-weight:bold;text-decoration:underline;">Download File</a>`
    : `<div class="text-gray-500">No download available.</div>`;

  const ext = getExtension(assignment.fileName);

  let previewHtml = "";
  if (assignment.fileType.startsWith("image/")) {
    previewHtml = `<img src="data:${assignment.fileType};base64,${assignment.fileData}" style="max-width:100%;max-height:300px;border-radius:9px;box-shadow:0 2px 16px #6366f155;" />`;
  } else if (assignment.fileType === "application/pdf") {
    previewHtml = `<iframe src="data:application/pdf;base64,${assignment.fileData}" width="100%" height="400" style="border-radius:8px;border:1px solid #eee;"></iframe>`;
  } else if (
    assignment.fileType.startsWith("text/") ||
    ["application/javascript", "text/html", "text/css"].includes(assignment.fileType) ||
    ["js", "css", "html", "txt"].includes(ext)
  ) {
    let decoded = "";
    try {
      decoded = atob(assignment.fileData);
    } catch (e) {
      decoded = "Unable to decode file data.";
    }

    let codeType = ext;
    let codeBlock = "";
    if (ext === "html") {
      codeBlock += `<div style="margin-bottom:1.2em;">
        <span style="font-weight:600;color:#4338ca;">Live HTML Preview:</span>
        <iframe srcdoc="${escapeHtml(decoded)}" style="width:98%;height:160px;border:1px solid #eee;border-radius:7px;background:white;box-shadow:0 2px 12px #6366f122;"></iframe>
      </div>`;
      codeType = "html";
    }
    // Use Prism.js classes for syntax highlighting
    codeBlock += `<pre style="max-height:180px;overflow:auto;text-align:left;background:#f8fafc;border-radius:8px;padding:0.7em;font-size:0.97em;">
      <code class="language-${codeType}">${escapeHtml(decoded)}</code>
    </pre>`;
    previewHtml = codeBlock;
  } else {
    previewHtml = `<div class="text-gray-500">Preview not available for this file type. Please download to view.</div>`;
  }

  let html = `<div style="text-align:center;">
    <h2 style="font-size:1.2rem;color:#6366f1;font-weight:700;">${assignment.title || assignment.fileName}</h2>
    <div style="margin:1rem 0;">Submitted: ${assignment.historyDate ? new Date(assignment.historyDate).toLocaleString() : (assignment.date ? new Date(assignment.date).toLocaleString() : "")}</div>
    <div style="margin-bottom:1rem;">${previewHtml}</div>
    <div style="margin-bottom:1.3em;">${downloadLink}</div>
    ${assignment.mark ? `<div>Mark: <b>${assignment.mark}</b></div>` : ""}
    ${assignment.status ? `<div>Status: <b>${assignment.status}</b></div>` : ""}
  </div>`;
  showToastModal("Assignment Preview", html, "info");

  // Wait for modal to render, then trigger Prism
  setTimeout(() => {
    if (window.Prism) Prism.highlightAll();
  }, 100);
}
      
// On page load, fetch and render dashboard
window.addEventListener('DOMContentLoaded', reloadDashboard);
    
// --- Optionally: expose initChat for manual reload ---
window.reloadChat = initChat;
window.addCourse = addCourse;
window.removeCourse = removeCourse;
window.submitAssignment = submitAssignment;
window.closeDayQuizModal = closeDayQuizModal;
window.showQuizModal = showQuizModal;
window.logout = logout;
window.closePaymentModal = closePaymentModal;
window.closeReceipt = closeReceipt;
