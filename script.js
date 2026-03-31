/*
  TEACHER SETUP INSTRUCTIONS
  1. Create a new Google Sheet where you want student submissions to be saved.
  2. In that Google Sheet, choose Extensions > Apps Script to open the script editor.
  3. Paste in a simple doPost(e) Apps Script that reads the JSON and appends a row,
     then deploy it with Deploy > New deployment > Web app.
  4. Copy the Web App URL and paste it into the WEB_APP_URL constant below.

  Tip for beginners:
  Leave the placeholder URL in place while testing locally. The student site will
  still save submissions on this device so the teacher dashboard can preview data.
*/
const WEB_APP_URL = "PASTE_YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE";

const STORAGE_KEYS = {
  currentStudent: "energyQuestCurrentStudent",
  studentRecords: "energyQuestStudentRecords",
  submissions: "energyQuestSubmissions"
};

const MOCK_SUBMISSIONS = [
  {
    name: "Ava",
    classPeriod: "Period 1",
    quizScore: 8,
    quizTotal: 10,
    activitiesCompleted: true,
    timestamp: "2026-03-30T08:45:00.000Z"
  },
  {
    name: "Noah",
    classPeriod: "Period 2",
    quizScore: 10,
    quizTotal: 10,
    activitiesCompleted: true,
    timestamp: "2026-03-30T09:12:00.000Z"
  },
  {
    name: "Mia",
    classPeriod: "Period 4",
    quizScore: 7,
    quizTotal: 10,
    activitiesCompleted: true,
    timestamp: "2026-03-30T10:01:00.000Z"
  }
];

const MOCK_RECORDS = {
  "ava__period-1": {
    name: "Ava",
    classPeriod: "Period 1",
    quizComplete: true,
    quizScore: 8,
    quizTotal: 10,
    sortComplete: true,
    simulationComplete: true,
    activitiesComplete: true,
    submitted: true
  },
  "noah__period-2": {
    name: "Noah",
    classPeriod: "Period 2",
    quizComplete: true,
    quizScore: 10,
    quizTotal: 10,
    sortComplete: true,
    simulationComplete: true,
    activitiesComplete: true,
    submitted: true
  },
  "liam__period-3": {
    name: "Liam",
    classPeriod: "Period 3",
    quizComplete: false,
    quizScore: 0,
    quizTotal: 10,
    sortComplete: true,
    simulationComplete: false,
    activitiesComplete: false,
    submitted: false
  }
};

const glossaryDefinitions = {
  Energy: "The ability to do work or cause change",
  "Kinetic Energy": "Energy of motion",
  "Potential Energy": "Stored energy based on position",
  "Energy Transfer": "Energy moving from one object to another",
  "Energy Transformation": "Energy changing from one form to another",
  "Conservation of Energy": "Energy cannot be created or destroyed"
};

const SORT_ITEM_BLUEPRINT = [
  { id: "mug", text: "A hot mug warms your hands.", category: "transfer" },
  { id: "lamp", text: "A lamp changes electrical energy into light and heat.", category: "transformation" },
  { id: "pool-ball", text: "A moving pool ball hits another pool ball.", category: "transfer" },
  { id: "toaster", text: "A toaster changes electrical energy into thermal energy.", category: "transformation" },
  { id: "sunlight", text: "Sunlight warms the sidewalk.", category: "transfer" },
  { id: "food", text: "Your body changes food energy into motion.", category: "transformation" },
  { id: "speaker", text: "A vibrating speaker makes the air vibrate too.", category: "transfer" },
  { id: "toy-car", text: "A battery-powered toy car changes chemical energy into motion.", category: "transformation" }
];

const quizQuestions = [
  {
    prompt: "What is the best definition of energy?",
    choices: [
      "The ability to do work or cause change",
      "Something only batteries have",
      "A force that always makes things hot",
      "Matter that disappears after use"
    ],
    answer: 0,
    explanation:
      "Energy is the ability to do work or cause change. It is not limited to one object like a battery."
  },
  {
    prompt: "Which example has kinetic energy?",
    choices: [
      "A skateboard rolling down the sidewalk",
      "A backpack resting on a desk",
      "A book sitting on a shelf",
      "A stretched rubber band that is not moving"
    ],
    answer: 0,
    explanation:
      "Kinetic energy is energy of motion, so the moving skateboard is the correct example."
  },
  {
    prompt: "Which example mostly shows potential energy?",
    choices: [
      "A ball flying through the air",
      "A roller coaster waiting at the top of a hill",
      "A speaker playing music",
      "A flashlight shining"
    ],
    answer: 1,
    explanation:
      "Potential energy is stored energy based on position, so the coaster at the top has lots of it."
  },
  {
    prompt: "A lamp turns electrical energy into light and heat. This is called:",
    choices: [
      "Energy transfer",
      "Energy transformation",
      "Energy destruction",
      "Energy storage only"
    ],
    answer: 1,
    explanation:
      "This is energy transformation because the energy changes from one form to another."
  },
  {
    prompt: "True or False: Energy can be created when an object starts moving.",
    choices: ["True", "False"],
    answer: 1,
    explanation:
      "False. Energy is not created. Stored energy changes form or moves from one place to another."
  },
  {
    prompt: "Which example is an energy transfer?",
    choices: [
      "Food changing into motion in your body",
      "A battery changing chemical energy into electrical energy",
      "A hot spoon warming your hand",
      "A flashlight making light"
    ],
    answer: 2,
    explanation:
      "The spoon transfers thermal energy to your hand. The others mostly describe transformations."
  },
  {
    prompt: "True or False: A moving object can have both kinetic energy and sound energy in the same event.",
    choices: ["True", "False"],
    answer: 0,
    explanation:
      "True. Real events often involve more than one type of energy at the same time."
  },
  {
    prompt: "Why does a roller coaster have more kinetic energy near the bottom of a hill?",
    choices: [
      "Because energy has been destroyed",
      "Because potential energy has changed into kinetic energy",
      "Because the coaster stops having mass",
      "Because friction creates unlimited energy"
    ],
    answer: 1,
    explanation:
      "As the coaster moves down, stored potential energy transforms into kinetic energy."
  },
  {
    prompt: "What happens to some energy when a skateboard slows down because of friction?",
    choices: [
      "It disappears",
      "It changes into thermal energy and sound",
      "It turns only into potential energy",
      "It is locked forever"
    ],
    answer: 1,
    explanation:
      "Friction often changes some of the energy into heat and sound, but the total energy is still conserved."
  },
  {
    prompt: "True or False: Conservation of energy means energy cannot be created or destroyed.",
    choices: ["True", "False"],
    answer: 0,
    explanation:
      "True. Energy can move or change form, but the total amount stays the same."
  }
];

const ENERGY_TYPES = [
  {
    code: "KE",
    title: "Kinetic Energy",
    definition: "Energy of motion. If something is moving, it has kinetic energy.",
    examples: ["rolling soccer ball", "skateboard moving downhill"],
    diagram: "kinetic"
  },
  {
    code: "PE",
    title: "Potential Energy",
    definition: "Stored energy because of position. Higher objects can store more energy.",
    examples: ["book on a shelf", "coaster at the top of a hill"],
    diagram: "potential"
  },
  {
    code: "TH",
    title: "Thermal Energy",
    definition: "Energy connected to heat and moving particles.",
    examples: ["hot soup", "warm sidewalk on a sunny day"],
    diagram: "thermal"
  },
  {
    code: "CH",
    title: "Chemical Energy",
    definition: "Stored energy in food, batteries, and fuels.",
    examples: ["battery", "food for your body"],
    diagram: "chemical"
  },
  {
    code: "EL",
    title: "Electrical Energy",
    definition: "Energy carried by moving electric charges.",
    examples: ["phone charger", "lamp plugged into a wall"],
    diagram: "electrical"
  },
  {
    code: "LG",
    title: "Light Energy",
    definition: "Energy carried by light that we can often see.",
    examples: ["Sun", "light bulb"],
    diagram: "light"
  },
  {
    code: "SD",
    title: "Sound Energy",
    definition: "Energy caused by vibrations moving through matter.",
    examples: ["speaker", "drum"],
    diagram: "sound"
  },
  {
    code: "MX",
    title: "Mixed Energy System",
    definition: "A real system often uses more than one type of energy at the same time.",
    examples: ["flashlight", "your body riding a bike"],
    diagram: "mixed"
  }
];

function getEnergyDiagramSvg(type) {
  const diagrams = {
    kinetic: `
      <svg viewBox="0 0 320 180" role="img" aria-label="Kinetic energy diagram">
        <rect x="18" y="128" width="284" height="14" rx="7" class="diagram-ground"></rect>
        <line x1="56" y1="86" x2="110" y2="86" class="diagram-motion-line line-a"></line>
        <line x1="38" y1="104" x2="102" y2="104" class="diagram-motion-line line-b"></line>
        <line x1="66" y1="66" x2="118" y2="66" class="diagram-motion-line line-c"></line>
        <circle cx="165" cy="104" r="28" class="diagram-kinetic-ball"></circle>
        <text x="128" y="32" class="diagram-label">moving ball</text>
        <text x="182" y="98" class="diagram-small-label">motion</text>
        <text x="22" y="156" class="diagram-small-label">ground</text>
      </svg>
    `,
    potential: `
      <svg viewBox="0 0 320 180" role="img" aria-label="Potential energy diagram">
        <rect x="24" y="132" width="272" height="14" rx="7" class="diagram-ground"></rect>
        <rect x="58" y="62" width="108" height="12" rx="6" class="diagram-platform"></rect>
        <rect x="88" y="26" width="42" height="36" rx="8" class="diagram-block"></rect>
        <line x1="214" y1="126" x2="214" y2="48" class="diagram-arrow-line"></line>
        <polygon points="214,36 205,54 223,54" class="diagram-arrow-head"></polygon>
        <text x="74" y="18" class="diagram-label">stored energy</text>
        <text x="84" y="82" class="diagram-small-label">higher position</text>
        <text x="224" y="88" class="diagram-small-label">PE</text>
      </svg>
    `,
    thermal: `
      <svg viewBox="0 0 320 180" role="img" aria-label="Thermal energy diagram">
        <rect x="70" y="34" width="180" height="110" rx="20" class="diagram-thermal-box"></rect>
        <circle cx="110" cy="68" r="10" class="diagram-particle particle-fast"></circle>
        <circle cx="156" cy="58" r="10" class="diagram-particle particle-medium"></circle>
        <circle cx="204" cy="76" r="10" class="diagram-particle particle-fast"></circle>
        <circle cx="126" cy="112" r="10" class="diagram-particle particle-medium"></circle>
        <circle cx="180" cy="108" r="10" class="diagram-particle particle-fast"></circle>
        <circle cx="224" cy="116" r="10" class="diagram-particle particle-medium"></circle>
        <text x="90" y="24" class="diagram-label">faster particles = more heat</text>
        <text x="92" y="160" class="diagram-small-label">thermal energy</text>
      </svg>
    `,
    chemical: `
      <svg viewBox="0 0 320 180" role="img" aria-label="Chemical energy diagram">
        <rect x="54" y="54" width="126" height="62" rx="12" class="diagram-battery"></rect>
        <rect x="180" y="72" width="16" height="26" rx="4" class="diagram-battery-cap"></rect>
        <rect x="72" y="68" width="34" height="34" rx="6" class="diagram-battery-cell cell-a"></rect>
        <rect x="110" y="68" width="34" height="34" rx="6" class="diagram-battery-cell cell-b"></rect>
        <text x="70" y="44" class="diagram-label">stored in battery</text>
        <path d="M 228 68 L 212 92 L 228 92 L 214 116" class="diagram-zap"></path>
        <circle cx="246" cy="90" r="10" class="diagram-pulse pulse-a"></circle>
        <circle cx="270" cy="90" r="14" class="diagram-pulse pulse-b"></circle>
        <text x="208" y="136" class="diagram-small-label">energy release</text>
      </svg>
    `,
    electrical: `
      <svg viewBox="0 0 320 180" role="img" aria-label="Electrical energy diagram">
        <path d="M 34 110 C 78 52 122 52 166 110 S 254 168 288 110" class="diagram-wire"></path>
        <circle cx="66" cy="94" r="8" class="diagram-electron electron-a"></circle>
        <circle cx="142" cy="92" r="8" class="diagram-electron electron-b"></circle>
        <circle cx="224" cy="126" r="8" class="diagram-electron electron-c"></circle>
        <text x="38" y="38" class="diagram-label">electrons moving</text>
        <text x="188" y="62" class="diagram-small-label">wire</text>
        <text x="250" y="154" class="diagram-small-label">electrical flow</text>
      </svg>
    `,
    light: `
      <svg viewBox="0 0 320 180" role="img" aria-label="Light energy diagram">
        <circle cx="126" cy="84" r="34" class="diagram-light-core"></circle>
        <g class="diagram-rays">
          <line x1="126" y1="22" x2="126" y2="6"></line>
          <line x1="126" y1="146" x2="126" y2="162"></line>
          <line x1="64" y1="84" x2="48" y2="84"></line>
          <line x1="188" y1="84" x2="204" y2="84"></line>
          <line x1="82" y1="40" x2="70" y2="28"></line>
          <line x1="170" y1="128" x2="182" y2="140"></line>
          <line x1="170" y1="40" x2="182" y2="28"></line>
          <line x1="82" y1="128" x2="70" y2="140"></line>
        </g>
        <rect x="220" y="48" width="38" height="58" rx="12" class="diagram-bulb-base"></rect>
        <path d="M 239 106 L 239 132" class="diagram-bulb-stem"></path>
        <text x="80" y="24" class="diagram-label">light source</text>
        <text x="208" y="146" class="diagram-small-label">bulb</text>
        <text x="108" y="154" class="diagram-small-label">light rays</text>
      </svg>
    `,
    sound: `
      <svg viewBox="0 0 320 180" role="img" aria-label="Sound energy diagram">
        <rect x="44" y="70" width="42" height="40" rx="10" class="diagram-speaker-box"></rect>
        <polygon points="86,76 122,54 122,126 86,104" class="diagram-speaker-cone"></polygon>
        <path d="M 140 90 C 156 74 156 106 140 90" class="diagram-wave wave-a"></path>
        <path d="M 164 90 C 188 60 188 120 164 90" class="diagram-wave wave-b"></path>
        <path d="M 198 90 C 230 48 230 132 198 90" class="diagram-wave wave-c"></path>
        <text x="42" y="48" class="diagram-label">vibrating speaker</text>
        <text x="172" y="146" class="diagram-small-label">sound waves</text>
      </svg>
    `,
    mixed: `
      <svg viewBox="0 0 320 180" role="img" aria-label="Mixed energy system diagram">
        <rect x="42" y="62" width="54" height="36" rx="8" class="diagram-battery"></rect>
        <rect x="96" y="72" width="8" height="16" rx="3" class="diagram-battery-cap"></rect>
        <path d="M 104 80 L 166 80" class="diagram-wire"></path>
        <path d="M 166 80 L 198 66 L 198 94 Z" class="diagram-flashlight-body"></path>
        <path d="M 198 66 L 232 76 L 232 84 L 198 94 Z" class="diagram-flashlight-head"></path>
        <path d="M 232 80 L 278 60 L 278 100 Z" class="diagram-light-beam"></path>
        <path d="M 214 52 C 228 34 240 34 252 52" class="diagram-heat-wave heat-a"></path>
        <path d="M 224 46 C 238 28 250 28 262 46" class="diagram-heat-wave heat-b"></path>
        <text x="38" y="40" class="diagram-label">battery to flashlight</text>
        <text x="54" y="120" class="diagram-small-label">chemical</text>
        <text x="124" y="68" class="diagram-small-label">electrical</text>
        <text x="242" y="56" class="diagram-small-label">thermal</text>
        <text x="244" y="120" class="diagram-small-label">light</text>
      </svg>
    `
  };

  return diagrams[type] || "";
}

function createEnergyTypeCard(type) {
  return `
    <article class="type-card diagram-card">
      <div class="type-card-header">
        <div class="type-badge">${type.code}</div>
        <div>
          <h3><strong>${type.title}</strong></h3>
          <p class="type-definition">${type.definition}</p>
        </div>
      </div>
      <div class="diagram-shell diagram-${type.diagram}">
        ${getEnergyDiagramSvg(type.diagram)}
      </div>
      <p class="type-examples"><strong>Examples:</strong> ${type.examples.join(", ")}</p>
    </article>
  `;
}

function loadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (_error) {
    return fallback;
  }
}

function saveJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function normalizeText(value) {
  return value.trim().replace(/\s+/g, " ");
}

function createStudentKey(profile) {
  const safeName = normalizeText(profile.name).toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const safePeriod = normalizeText(profile.classPeriod || "no-class")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-");
  return `${safeName || "student"}__${safePeriod || "no-class"}`;
}

function createDefaultProgress() {
  return {
    quizComplete: false,
    quizScore: 0,
    quizTotal: quizQuestions.length,
    quizSelections: {},
    sortComplete: false,
    sortZones: {},
    simulationComplete: false,
    simulationValue: 75,
    activitiesComplete: false,
    submitted: false,
    submissionTimestamp: ""
  };
}

function recalculateProgress(progress) {
  return {
    ...progress,
    quizTotal: quizQuestions.length,
    activitiesComplete: Boolean(progress.sortComplete && progress.simulationComplete)
  };
}

function getStudentRecords() {
  return loadJson(STORAGE_KEYS.studentRecords, {});
}

function saveStudentRecords(records) {
  saveJson(STORAGE_KEYS.studentRecords, records);
}

function getCurrentStudent() {
  return loadJson(STORAGE_KEYS.currentStudent, null);
}

function setCurrentStudent(profile) {
  saveJson(STORAGE_KEYS.currentStudent, profile);
}

function clearCurrentStudent() {
  localStorage.removeItem(STORAGE_KEYS.currentStudent);
}

function getSubmissions() {
  return loadJson(STORAGE_KEYS.submissions, []);
}

function saveSubmissions(submissions) {
  saveJson(STORAGE_KEYS.submissions, submissions);
}

function upsertStudentRecord(profile, progress) {
  const records = getStudentRecords();
  const key = createStudentKey(profile);
  records[key] = {
    name: profile.name,
    classPeriod: profile.classPeriod || "",
    ...recalculateProgress(progress)
  };
  saveStudentRecords(records);
}

function getStoredProgressForStudent(profile) {
  const records = getStudentRecords();
  const saved = records[createStudentKey(profile)];
  return recalculateProgress({ ...createDefaultProgress(), ...saved });
}

function buildSortItems(savedZones = {}) {
  return SORT_ITEM_BLUEPRINT.map((item) => ({
    ...item,
    zone: savedZones[item.id] || "bank",
    feedbackState: ""
  }));
}

function formatTimestamp(timestamp) {
  if (!timestamp) {
    return "Not submitted";
  }

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return timestamp;
  }

  return date.toLocaleString();
}

function isAppsScriptConfigured() {
  return WEB_APP_URL && !WEB_APP_URL.includes("PASTE_YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE");
}

function setupNavigation() {
  const navToggle = document.getElementById("navToggle");
  const navLinks = document.getElementById("navLinks");

  if (!navToggle || !navLinks) {
    return;
  }

  navToggle.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });
}

function initStudentPage() {
  const energyTypesGrid = document.getElementById("energyTypesGrid");
  const loginOverlay = document.getElementById("loginOverlay");
  const loginForm = document.getElementById("loginForm");
  const loginMessage = document.getElementById("loginMessage");
  const studentNameInput = document.getElementById("studentName");
  const classPeriodInput = document.getElementById("classPeriod");
  const studentWelcome = document.getElementById("studentWelcome");
  const studentDetails = document.getElementById("studentDetails");
  const changeStudentButton = document.getElementById("changeStudent");
  const progressMeterFill = document.getElementById("progressMeterFill");
  const progressSummary = document.getElementById("progressSummary");
  const quizProgressStatus = document.getElementById("quizProgressStatus");
  const sortProgressStatus = document.getElementById("sortProgressStatus");
  const simulationProgressStatus = document.getElementById("simulationProgressStatus");
  const activitiesProgressStatus = document.getElementById("activitiesProgressStatus");
  const submissionProgressStatus = document.getElementById("submissionProgressStatus");
  const quizProgressItem = document.getElementById("quizProgressItem");
  const sortProgressItem = document.getElementById("sortProgressItem");
  const simulationProgressItem = document.getElementById("simulationProgressItem");
  const activitiesProgressItem = document.getElementById("activitiesProgressItem");
  const submissionProgressItem = document.getElementById("submissionProgressItem");
  const submitWorkButton = document.getElementById("submitWorkButton");
  const submitMessage = document.getElementById("submitMessage");

  const termTooltip = document.getElementById("termTooltip");
  const glossaryDisplay = document.getElementById("glossaryDisplay");
  const termButtons = document.querySelectorAll("[data-term]");
  const answerButtons = document.querySelectorAll(".answer-toggle");

  const sortBank = document.getElementById("sortBank");
  const transferList = document.getElementById("transferList");
  const transformationList = document.getElementById("transformationList");
  const sortFeedback = document.getElementById("sortFeedback");
  const dropZones = document.querySelectorAll(".drop-zone");
  const checkSortButton = document.getElementById("checkSort");
  const resetSortButton = document.getElementById("resetSort");

  const heightSlider = document.getElementById("heightSlider");
  const rampPath = document.getElementById("rampPath");
  const simBallGroup = document.getElementById("simBallGroup");
  const simBall = document.getElementById("simBall");
  const simBallLabel = document.getElementById("simBallLabel");
  const heightValue = document.getElementById("heightValue");
  const potentialEnergyValue = document.getElementById("potentialEnergyValue");
  const kineticEnergyValue = document.getElementById("kineticEnergyValue");
  const potentialBar = document.getElementById("potentialBar");
  const kineticBar = document.getElementById("kineticBar");
  const simulationNote = document.getElementById("simulationNote");

  const quizContainer = document.getElementById("quizContainer");
  const scoreQuizButton = document.getElementById("scoreQuiz");
  const resetQuizButton = document.getElementById("resetQuiz");
  const quizSummary = document.getElementById("quizSummary");

  let currentStudent = getCurrentStudent();
  let progress = currentStudent ? getStoredProgressForStudent(currentStudent) : createDefaultProgress();
  let sortItems = buildSortItems(progress.sortZones);
  let selectedSortItemId = null;
  let draggedSortItemId = null;
  let rampAnimationId = 0;
  let currentRampProgress = 1 - Number(progress.simulationValue) / 100;
  let targetRampProgress = currentRampProgress;

  function renderEnergyTypes() {
    energyTypesGrid.innerHTML = ENERGY_TYPES.map(createEnergyTypeCard).join("");
  }

  function persistProgress() {
    if (!currentStudent) {
      return;
    }

    progress = recalculateProgress(progress);
    upsertStudentRecord(currentStudent, progress);
  }

  function updateStudentHeader() {
    if (!currentStudent) {
      studentWelcome.textContent = "Hello, Scientist!";
      studentDetails.textContent = "Log in to save your progress on this device.";
      return;
    }

    studentWelcome.textContent = `Welcome, ${currentStudent.name}!`;
    studentDetails.textContent = currentStudent.classPeriod
      ? `Class: ${currentStudent.classPeriod}`
      : "Class period: not entered";
  }

  function updateProgressRow(element, label, complete) {
    element.textContent = complete ? "Complete" : label;
    element.parentElement.classList.toggle("complete", complete);
    element.parentElement.classList.toggle("incomplete", !complete);
  }

  function updateProgressDisplay() {
    const completedCount = [
      progress.quizComplete,
      progress.sortComplete,
      progress.simulationComplete
    ].filter(Boolean).length;
    const percent = Math.round((completedCount / 3) * 100);

    progressMeterFill.style.width = `${percent}%`;
    progressSummary.textContent = `${completedCount} of 3 tasks complete`;

    updateProgressRow(quizProgressStatus, "Incomplete", progress.quizComplete);
    updateProgressRow(sortProgressStatus, "Incomplete", progress.sortComplete);
    updateProgressRow(simulationProgressStatus, "Incomplete", progress.simulationComplete);
    updateProgressRow(activitiesProgressStatus, "Incomplete", progress.activitiesComplete);

    submissionProgressStatus.textContent = progress.submitted ? "Submitted" : "Not Submitted";
    submissionProgressItem.classList.toggle("complete", progress.submitted);
    submissionProgressItem.classList.toggle("incomplete", !progress.submitted);

    if (progress.quizComplete) {
      quizProgressStatus.textContent = `Complete (${progress.quizScore}/${progress.quizTotal})`;
      quizProgressItem.classList.add("complete");
      quizProgressItem.classList.remove("incomplete");
    }

    submitWorkButton.disabled = !currentStudent || !progress.quizComplete || !progress.activitiesComplete || progress.submitted;
  }

  function showLogin() {
    loginOverlay.classList.remove("hidden");
    document.body.classList.add("modal-open");
    studentNameInput.focus();
  }

  function hideLogin() {
    loginOverlay.classList.add("hidden");
    document.body.classList.remove("modal-open");
  }

  function loadStudent(profile) {
    currentStudent = {
      name: normalizeText(profile.name),
      classPeriod: normalizeText(profile.classPeriod || "")
    };
    setCurrentStudent(currentStudent);
    progress = getStoredProgressForStudent(currentStudent);
    sortItems = buildSortItems(progress.sortZones);
    updateStudentHeader();
    renderSortActivity();
    renderQuiz();
    updateSimulation();
    updateProgressDisplay();
    submitMessage.textContent = progress.submitted
      ? "This student's work has already been submitted."
      : "";
    hideLogin();
  }

  function setTooltipPosition(element) {
    const rect = element.getBoundingClientRect();
    const tooltipWidth = Math.min(300, window.innerWidth - 24);
    const left = Math.max(12, Math.min(rect.left, window.innerWidth - tooltipWidth - 12));
    const top = Math.max(12, rect.bottom + 12);

    termTooltip.style.left = `${left}px`;
    termTooltip.style.top = `${top}px`;
  }

  function showDefinition(term, element) {
    const definition = glossaryDefinitions[term];
    if (!definition) {
      return;
    }

    glossaryDisplay.textContent = `${term}: ${definition}`;
    termTooltip.textContent = `${term}: ${definition}`;
    setTooltipPosition(element);
    termTooltip.classList.add("visible");

    document.querySelectorAll(".glossary-card").forEach((card) => {
      card.classList.toggle("active", card.dataset.term === term);
    });
  }

  function hideTooltip() {
    termTooltip.classList.remove("visible");
  }

  function toggleAnswer(targetId, button) {
    const answer = document.getElementById(targetId);
    if (!answer) {
      return;
    }

    const isHidden = answer.hasAttribute("hidden");
    if (isHidden) {
      answer.removeAttribute("hidden");
      button.textContent = "Hide Answer";
    } else {
      answer.setAttribute("hidden", "");
      button.textContent = button.dataset.defaultLabel || "Show Answer";
    }
  }

  function storeSortZones() {
    const zones = {};
    sortItems.forEach((item) => {
      zones[item.id] = item.zone;
    });
    progress.sortZones = zones;
    persistProgress();
  }

  function renderSortActivity() {
    sortBank.innerHTML = "";
    transferList.innerHTML = "";
    transformationList.innerHTML = "";

    sortItems.forEach((item) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "sort-item";
      card.textContent = item.text;
      card.dataset.id = item.id;
      card.draggable = true;

      if (selectedSortItemId === item.id) {
        card.classList.add("selected");
      }

      if (item.feedbackState) {
        card.classList.add(item.feedbackState);
      }

      card.addEventListener("click", (event) => {
        event.stopPropagation();
        selectedSortItemId = selectedSortItemId === item.id ? null : item.id;
        renderSortActivity();
      });

      card.addEventListener("dragstart", (event) => {
        draggedSortItemId = item.id;
        selectedSortItemId = item.id;
        event.dataTransfer?.setData("text/plain", item.id);
      });

      card.addEventListener("dragend", () => {
        draggedSortItemId = null;
      });

      if (item.zone === "bank") {
        sortBank.appendChild(card);
      } else if (item.zone === "transfer") {
        transferList.appendChild(card);
      } else {
        transformationList.appendChild(card);
      }
    });
  }

  function moveSortItem(itemId, zone) {
    const item = sortItems.find((entry) => entry.id === itemId);
    if (!item) {
      return;
    }

    item.zone = zone;
    item.feedbackState = "";
    selectedSortItemId = null;
    progress.sortComplete = false;
    sortFeedback.textContent = "Sorting changed. Check your work again when you are ready.";
    storeSortZones();
    updateProgressDisplay();
    renderSortActivity();
  }

  function resetSortActivity() {
    sortItems = buildSortItems();
    selectedSortItemId = null;
    progress.sortZones = {};
    progress.sortComplete = false;
    progress.activitiesComplete = false;
    sortFeedback.textContent = "";
    persistProgress();
    updateProgressDisplay();
    renderSortActivity();
  }

  function checkSortActivity() {
    const placedItems = sortItems.filter((item) => item.zone !== "bank");
    let correctCount = 0;

    sortItems.forEach((item) => {
      if (item.zone === "bank") {
        item.feedbackState = "";
        return;
      }

      const isCorrect = item.zone === item.category;
      item.feedbackState = isCorrect ? "correct" : "incorrect";
      if (isCorrect) {
        correctCount += 1;
      }
    });

    renderSortActivity();

    if (placedItems.length < sortItems.length) {
      progress.sortComplete = false;
      progress.activitiesComplete = false;
      sortFeedback.textContent = "Keep going. Place every card in a box, then check again.";
      persistProgress();
      updateProgressDisplay();
      return;
    }

    progress.sortComplete = correctCount === sortItems.length;
    progress.activitiesComplete = Boolean(progress.sortComplete && progress.simulationComplete);
    persistProgress();
    updateProgressDisplay();

    if (progress.sortComplete) {
      sortFeedback.textContent =
        "Excellent sorting. You correctly separated every transfer example from every transformation example.";
    } else {
      sortFeedback.textContent =
        `You placed ${correctCount} out of ${sortItems.length} correctly. Remember: transfer means energy moves between objects, while transformation means energy changes form.`;
    }
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function getRampPoint(progressValue) {
    const totalLength = rampPath.getTotalLength();
    const safeProgress = clamp(progressValue, 0, 1);
    const length = totalLength * safeProgress;
    const point = rampPath.getPointAtLength(length);
    const behind = rampPath.getPointAtLength(Math.max(0, length - 1));
    const ahead = rampPath.getPointAtLength(Math.min(totalLength, length + 1));
    const dx = ahead.x - behind.x;
    const dy = ahead.y - behind.y;
    const tangentLength = Math.hypot(dx, dy) || 1;

    return {
      point,
      normalX: -dy / tangentLength,
      normalY: dx / tangentLength
    };
  }

  function drawRampAtProgress(progressValue) {
    const startPoint = rampPath.getPointAtLength(0);
    const endPoint = rampPath.getPointAtLength(rampPath.getTotalLength());
    const { point, normalX, normalY } = getRampPoint(progressValue);
    const displayX = point.x + normalX * 15;
    const displayY = point.y + normalY * 15;
    const heightRatio = clamp((endPoint.y - point.y) / (endPoint.y - startPoint.y), 0, 1);
    const potential = Math.round(heightRatio * 100);
    const kinetic = 100 - potential;

    simBall.setAttribute("cx", String(displayX));
    simBall.setAttribute("cy", String(displayY));
    simBallLabel.setAttribute("x", String(displayX + 18));
    simBallLabel.setAttribute("y", String(displayY - 18));
    simBallGroup.setAttribute("aria-label", `Ball at ${potential} percent height`);

    heightValue.textContent = `${potential}%`;
    potentialEnergyValue.textContent = `${potential} units`;
    kineticEnergyValue.textContent = `${kinetic} units`;
    potentialBar.style.width = `${potential}%`;
    kineticBar.style.width = `${kinetic}%`;

    if (potential >= 70) {
      simulationNote.textContent =
        "The ball is high on the ramp, so it has more potential energy than kinetic energy.";
    } else if (potential >= 35) {
      simulationNote.textContent =
        "The ball is midway on the ramp, so potential energy is changing into kinetic energy.";
    } else {
      simulationNote.textContent =
        "The ball is near the lower part of the ramp, so kinetic energy is now greater than potential energy.";
    }
  }

  function animateRamp() {
    const difference = targetRampProgress - currentRampProgress;
    if (Math.abs(difference) < 0.001) {
      currentRampProgress = targetRampProgress;
      drawRampAtProgress(currentRampProgress);
      rampAnimationId = 0;
      return;
    }

    currentRampProgress += difference * 0.12;
    drawRampAtProgress(currentRampProgress);
    rampAnimationId = window.requestAnimationFrame(animateRamp);
  }

  function animateRampToTarget() {
    if (rampAnimationId) {
      window.cancelAnimationFrame(rampAnimationId);
    }

    rampAnimationId = window.requestAnimationFrame(animateRamp);
  }

  function updateSimulation() {
    if (rampAnimationId) {
      window.cancelAnimationFrame(rampAnimationId);
      rampAnimationId = 0;
    }

    heightSlider.value = String(progress.simulationValue);
    targetRampProgress = 1 - Number(progress.simulationValue) / 100;
    currentRampProgress = targetRampProgress;
    drawRampAtProgress(currentRampProgress);
  }

  function renderQuiz() {
    quizContainer.innerHTML = "";

    quizQuestions.forEach((question, index) => {
      const card = document.createElement("fieldset");
      card.className = "quiz-card";
      card.dataset.index = String(index);

      const prompt = document.createElement("p");
      prompt.innerHTML = `<strong>${index + 1}.</strong> ${question.prompt}`;
      card.appendChild(prompt);

      const options = document.createElement("div");
      options.className = "quiz-options";

      question.choices.forEach((choice, choiceIndex) => {
        const label = document.createElement("label");
        label.className = "quiz-option";

        const input = document.createElement("input");
        input.type = "radio";
        input.name = `question-${index}`;
        input.value = String(choiceIndex);
        input.checked = String(progress.quizSelections[index] ?? "") === String(choiceIndex);

        const text = document.createElement("span");
        text.textContent = choice;

        label.appendChild(input);
        label.appendChild(text);
        options.appendChild(label);
      });

      const feedback = document.createElement("p");
      feedback.className = "quiz-feedback";
      feedback.id = `quiz-feedback-${index}`;
      feedback.setAttribute("aria-live", "polite");

      card.appendChild(options);
      card.appendChild(feedback);
      quizContainer.appendChild(card);
    });

    Object.entries(progress.quizSelections).forEach(([index, value]) => {
      updateQuizFeedback(Number(index), String(value));
    });
  }

  function updateQuizFeedback(questionIndex, selectedValue) {
    const question = quizQuestions[questionIndex];
    const card = quizContainer.querySelector(`[data-index="${questionIndex}"]`);
    const feedback = document.getElementById(`quiz-feedback-${questionIndex}`);

    if (!question || !card || !feedback) {
      return;
    }

    const isCorrect = Number(selectedValue) === question.answer;
    card.classList.toggle("correct", isCorrect);
    card.classList.toggle("incorrect", !isCorrect);
    feedback.textContent = isCorrect
      ? `Correct. ${question.explanation}`
      : `Not quite. ${question.explanation}`;
  }

  function scoreQuiz() {
    let answeredCount = 0;
    let correctCount = 0;

    quizQuestions.forEach((question, index) => {
      const selected = quizContainer.querySelector(`input[name="question-${index}"]:checked`);
      if (!selected) {
        return;
      }

      answeredCount += 1;
      if (Number(selected.value) === question.answer) {
        correctCount += 1;
      }
    });

    if (answeredCount < quizQuestions.length) {
      progress.quizComplete = false;
      progress.quizScore = 0;
      quizSummary.textContent =
        `You answered ${answeredCount} out of ${quizQuestions.length}. Finish the rest to see your full score.`;
      persistProgress();
      updateProgressDisplay();
      return;
    }

    progress.quizComplete = true;
    progress.quizScore = correctCount;
    persistProgress();
    updateProgressDisplay();

    if (correctCount === quizQuestions.length) {
      quizSummary.textContent =
        `Score: ${correctCount}/${quizQuestions.length}. Outstanding work. You are explaining energy like a scientist.`;
    } else if (correctCount >= 7) {
      quizSummary.textContent =
        `Score: ${correctCount}/${quizQuestions.length}. Nice job. Review transfer vs transformation and friction examples to strengthen your understanding even more.`;
    } else {
      quizSummary.textContent =
        `Score: ${correctCount}/${quizQuestions.length}. Keep practicing. Revisit the examples and glossary, then try again.`;
    }
  }

  function resetQuiz() {
    progress.quizSelections = {};
    progress.quizComplete = false;
    progress.quizScore = 0;
    quizSummary.textContent = "";
    persistProgress();
    updateProgressDisplay();
    renderQuiz();
  }

  async function submitWork() {
    if (!currentStudent) {
      submitMessage.textContent = "Please log in before submitting.";
      return;
    }

    if (progress.submitted) {
      submitMessage.textContent = "This work was already submitted from this device.";
      return;
    }

    if (!progress.quizComplete || !progress.activitiesComplete) {
      submitMessage.textContent = "Finish the quiz and both activities before submitting.";
      return;
    }

    const payload = {
      name: currentStudent.name,
      classPeriod: currentStudent.classPeriod,
      quizScore: progress.quizScore,
      quizTotal: progress.quizTotal,
      activitiesCompleted: progress.activitiesComplete,
      timestamp: new Date().toISOString()
    };

    const studentKey = createStudentKey(currentStudent);
    const submissions = getSubmissions();
    const hasExistingLocalSubmission = submissions.some(
      (entry) => createStudentKey(entry) === studentKey
    );

    if (!hasExistingLocalSubmission) {
      submissions.push(payload);
      saveSubmissions(submissions);
    }

    let remoteSaved = false;
    if (isAppsScriptConfigured()) {
      try {
        const response = await fetch(WEB_APP_URL, {
          method: "POST",
          mode: "no-cors",
          headers: {
            "Content-Type": "text/plain;charset=utf-8"
          },
          body: JSON.stringify(payload)
        });
        remoteSaved = Boolean(response);
      } catch (_error) {
        remoteSaved = false;
      }
    }

    progress.submitted = true;
    progress.submissionTimestamp = payload.timestamp;
    persistProgress();
    updateProgressDisplay();

    submitMessage.textContent = remoteSaved || !isAppsScriptConfigured()
      ? "Your work has been recorded!"
      : "Your work has been recorded! It was saved on this device, but the Google Sheets connection needs attention.";
  }

  setupNavigation();

  termButtons.forEach((button) => {
    const term = button.dataset.term;
    button.title = glossaryDefinitions[term] || "";

    button.addEventListener("click", () => showDefinition(term, button));
    button.addEventListener("focus", () => showDefinition(term, button));
    button.addEventListener("mouseenter", () => showDefinition(term, button));
    button.addEventListener("mouseleave", hideTooltip);
    button.addEventListener("blur", hideTooltip);
  });

  answerButtons.forEach((button) => {
    button.dataset.defaultLabel = button.textContent;
    button.addEventListener("click", () => {
      toggleAnswer(button.dataset.target, button);
    });
  });

  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const profile = {
      name: normalizeText(studentNameInput.value),
      classPeriod: normalizeText(classPeriodInput.value)
    };

    if (!profile.name) {
      loginMessage.textContent = "Please enter your name before starting.";
      return;
    }

    loginMessage.textContent = "";
    loadStudent(profile);
  });

  changeStudentButton.addEventListener("click", () => {
    clearCurrentStudent();
    currentStudent = null;
    progress = createDefaultProgress();
    sortItems = buildSortItems();
    updateStudentHeader();
    updateProgressDisplay();
    renderSortActivity();
    renderQuiz();
    updateSimulation();
    submitMessage.textContent = "";
    studentNameInput.value = "";
    classPeriodInput.value = "";
    showLogin();
  });

  dropZones.forEach((zone) => {
    zone.addEventListener("dragover", (event) => {
      event.preventDefault();
      zone.classList.add("is-target");
    });

    zone.addEventListener("dragleave", () => {
      zone.classList.remove("is-target");
    });

    zone.addEventListener("drop", (event) => {
      event.preventDefault();
      zone.classList.remove("is-target");
      const zoneName = zone.dataset.zone;
      if (draggedSortItemId && zoneName) {
        moveSortItem(draggedSortItemId, zoneName);
      }
    });

    zone.addEventListener("click", () => {
      const zoneName = zone.dataset.zone;
      if (selectedSortItemId && zoneName) {
        moveSortItem(selectedSortItemId, zoneName);
      }
    });
  });

  sortBank.addEventListener("click", () => {
    if (selectedSortItemId) {
      moveSortItem(selectedSortItemId, "bank");
    }
  });

  sortBank.addEventListener("dragover", (event) => {
    event.preventDefault();
  });

  sortBank.addEventListener("drop", (event) => {
    event.preventDefault();
    if (draggedSortItemId) {
      moveSortItem(draggedSortItemId, "bank");
    }
  });

  checkSortButton.addEventListener("click", checkSortActivity);
  resetSortButton.addEventListener("click", resetSortActivity);

  heightSlider.addEventListener("input", () => {
    progress.simulationValue = Number(heightSlider.value);
    progress.simulationComplete = true;
    progress.activitiesComplete = Boolean(progress.sortComplete && progress.simulationComplete);
    persistProgress();
    updateProgressDisplay();
    targetRampProgress = 1 - Number(progress.simulationValue) / 100;
    animateRampToTarget();
  });

  quizContainer.addEventListener("change", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) {
      return;
    }

    const questionIndex = Number(target.name.replace("question-", ""));
    progress.quizSelections[questionIndex] = Number(target.value);
    progress.quizComplete = false;
    progress.quizScore = 0;
    persistProgress();
    updateProgressDisplay();
    updateQuizFeedback(questionIndex, target.value);
  });

  scoreQuizButton.addEventListener("click", scoreQuiz);
  resetQuizButton.addEventListener("click", resetQuiz);
  submitWorkButton.addEventListener("click", submitWork);

  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    if (!target.closest("[data-term]")) {
      hideTooltip();
    }
  });

  renderEnergyTypes();
  updateStudentHeader();
  renderSortActivity();
  renderQuiz();
  updateSimulation();
  updateProgressDisplay();

  if (currentStudent) {
    hideLogin();
  } else {
    showLogin();
  }
}

function initTeacherPage() {
  const tableBody = document.getElementById("teacherTableBody");
  const averageScore = document.getElementById("averageScore");
  const submissionCount = document.getElementById("submissionCount");
  const localStatus = document.getElementById("localStatus");
  const incompleteList = document.getElementById("incompleteList");
  const refreshDashboard = document.getElementById("refreshDashboard");

  setupNavigation();

  function getDashboardData() {
    const localSubmissions = getSubmissions();
    const localRecords = getStudentRecords();

    if (localSubmissions.length > 0 || Object.keys(localRecords).length > 0) {
      return {
        usingMockData: false,
        submissions: localSubmissions,
        records: localRecords
      };
    }

    return {
      usingMockData: true,
      submissions: MOCK_SUBMISSIONS,
      records: MOCK_RECORDS
    };
  }

  function renderDashboard() {
    const data = getDashboardData();
    const submissions = data.submissions;
    const recordList = Object.values(data.records);
    const average = submissions.length
      ? submissions.reduce((total, entry) => total + (entry.quizScore / entry.quizTotal) * 100, 0) /
        submissions.length
      : 0;

    tableBody.innerHTML = "";
    submissions.forEach((entry) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${entry.name}</td>
        <td>${entry.classPeriod || "Not entered"}</td>
        <td>${entry.quizScore}/${entry.quizTotal}</td>
        <td>${entry.activitiesCompleted ? "Yes" : "No"}</td>
        <td>${formatTimestamp(entry.timestamp)}</td>
      `;
      tableBody.appendChild(row);
    });

    if (submissions.length === 0) {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td colspan="5">No submissions yet. Have students log in and submit their work.</td>
      `;
      tableBody.appendChild(row);
    }

    averageScore.textContent = submissions.length
      ? `${average.toFixed(1)}% average`
      : "No scores yet";
    submissionCount.textContent = `${submissions.length} submission${submissions.length === 1 ? "" : "s"}`;
    localStatus.textContent = data.usingMockData
      ? "Showing sample dashboard data because no local student records were found yet."
      : "Showing live data saved on this device.";

    incompleteList.innerHTML = "";
    const incompleteStudents = recordList.filter((record) => !record.activitiesComplete);

    if (incompleteStudents.length === 0) {
      const item = document.createElement("li");
      item.textContent = "All logged-in students have completed the activities.";
      incompleteList.appendChild(item);
      return;
    }

    incompleteStudents.forEach((record) => {
      const item = document.createElement("li");
      item.textContent = `${record.name} (${record.classPeriod || "No class listed"})`;
      incompleteList.appendChild(item);
    });
  }

  refreshDashboard.addEventListener("click", renderDashboard);
  renderDashboard();
}

if (document.body.classList.contains("teacher-page")) {
  initTeacherPage();
} else if (document.body.classList.contains("student-page")) {
  initStudentPage();
}
