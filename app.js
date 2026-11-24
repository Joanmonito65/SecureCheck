(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };
  var all = function (selector, root) { return Array.prototype.slice.call((root || document).querySelectorAll(selector)); };
  var STORAGE_KEY = 'securecheck.preferences.v1';
  var categories = [
    { key: 'lower', label: 'Lowercase', color: 'var(--accent)' },
    { key: 'upper', label: 'Uppercase', color: 'var(--blue)' },
    { key: 'digits', label: 'Numbers', color: 'var(--purple)' },
    { key: 'symbols', label: 'Symbols / other', color: 'var(--amber)' }
  ];
  var COMMON = ('password password1 password123 passw0rd admin letmein welcome qwerty qwerty123 123456 12345678 123456789 1234567890 111111 abc123 iloveyou sunshine princess dragon monkey football baseball trustno1 master login secret shadow michael ashley 000000 654321 1q2w3e4r').split(' ');
  var DICTIONARY = ('password welcome monkey sunshine dragon football baseball princess letmein summer winter spring autumn flower garden cookie chocolate coffee secret freedom shadow master hello love angel star sunshine happy family purple silver orange tiger rabbit soccer hockey guitar laptop internet computer access security account admin guest money trust'.split(' '));
  var WORDLIST = ('amber anchor apple apron arcade arrow artist atlas autumn badge bamboo banner basil beacon berry bicycle biscuit blanket blossom bluebird breeze bright brook bubble cactus cabin cable candle canyon captain caraway carpet castle cedar celery chalk charm cherry chestnut circle citadel citrus clover cobalt comet compass coral cosmos cotton coyote cranberry crystal daisy dancer daylight delta desert dinner dolphin dragonfly drift dune eagle earth echo elm ember emerald engine falcon family feather fern festival field fig filter finch firefly fisher flame flight flora forest fossil fountain foxglove galaxy garden garlic gentle glacier golden granite grape grass gravity green harbor hazel heart hedgehog hill honey horizon island ivory jasmine jelly juniper kettle key kingdom kiwi lagoon lantern lavender lemon library lilac lilypad linen lotus lunar maple marble meadow melon memory mercury midnight mint mirror misty mobile monarch mountain museum music mustard narwhal nectar nest nickel nightingale north nutmeg ocean olive opal orchard origami otter oyster panda paper parrot patch pebbles pepper phoenix piano picnic pine planet plum poetry polar popcorn prairie puzzle quartz queen quiet quilt rabbit radar rainbow raven recipe reef ribbon river robin rocket rosemary saffron sailboat salmon sandalwood sapphire satellite scarf seaglass shadow shell sherbet silver skylark skyward snowfall soccer sonata sparrow spice spiral spring spruce squirrel starfish starlight stone story strawberry summit sunflower sunset swan sweater swift tablet tangerine temple thistle thunder ticket timber toast tomato topaz tractor trail tulip tunnel twilight umbrella unicorn valley velvet village violet walnut wander whale willow window winter wizard woodland yarn yellow yoga zephyr zinc zipper').split(' ');
  var palette = ['var(--accent)', 'var(--blue)', 'var(--purple)', 'var(--amber)'];
  var defaults = {
    theme: 'midnight-green', accent: 'auto', customAccent: '#79b8ff', density: 'comfortable',
    reduceMotion: false, autoHideReveal: true, sound: false,
    showEstimates: true, showAdvanced: true, historyEnabled: false,
    defaultSpeed: '10000', customSpeed: '1000'
  };
  if (window.matchMedia) defaults.reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var settings = readSettings();
  var currentPage = 'dashboard';
  var priorDarkTheme = 'midnight-green';
  var currentAnalysis = null;
  var historyItems = [];
  var historyTimer = null;
  var revealTimers = Object.create(null);
  var toastTimer = null;
  var lastGenerated = [];
  var lastPhrases = [];
  var simState = 'idle';
  var simCount = 0;
  var simElapsed = 0;
  var simTimer = null;
  var simTicks = 0;
  var fakeGuesses = ['cobalt_17!', 'piano-sky-4', 'violet.river', 'maple_82!', 'quiet-otter-7', 'citrus@lake', 'emberstone3', 'north-wind_6', 'paper.crane2', 'willow!trail'];
  var fakeCursor = 0;
  var challengeRoundIndex = -1;
  var challengeRound = null;
  var glossary = [
    ['Attack surface', 'The places an attacker could try to access an account, including login pages, leaked databases, and reused credentials.', 'THREATS'],
    ['Brute force', 'Trying candidate passwords from a search space until one works. Online controls and password hashing can slow different forms of this attack.', 'ATTACKS'],
    ['Credential stuffing', 'Automated attempts that reuse username and password pairs exposed in other breaches.', 'ATTACKS'],
    ['Dictionary attack', 'A ranked set of common words, passwords, names, dates, and predictable variations tried before arbitrary combinations.', 'ATTACKS'],
    ['Entropy', 'A mathematical way to describe uncertainty. An estimate depends on how choices were made and whether they were truly unpredictable.', 'MATH'],
    ['Hashing', 'A one-way transformation used to store password verifiers. Slow, salted password hashing makes offline guessing more expensive.', 'STORAGE'],
    ['MFA', 'Multi-factor authentication asks for another proof, such as a security key or authenticator, in addition to a password.', 'HABITS'],
    ['Passkey', 'A public-key credential tied to a device or credential manager. It can resist phishing because the private key is not shared with a website.', 'TOOLS'],
    ['Password manager', 'A tool that creates and remembers a different strong password for each account, protected by a master credential and recovery plan.', 'TOOLS'],
    ['Password reuse', 'Using the same or similar password on multiple accounts. One breach can make other accounts vulnerable to credential stuffing.', 'HABITS'],
    ['Rate limit', 'A service control that slows or blocks repeated login attempts, reducing the pace of online guessing.', 'STORAGE'],
    ['Salt', 'A unique random value added before hashing each password so identical passwords do not have identical stored hashes.', 'STORAGE'],
    ['Search space', 'The set of candidate strings an attacker might try. Length, character choices, and predictable patterns change its practical size.', 'MATH'],
    ['Unique credential', 'A password or passkey used for just one account. Uniqueness limits damage when another service is compromised.', 'HABITS']
  ];

  function readSettings() {
    try {
      var stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      var result = Object.assign({}, defaults);
      Object.keys(defaults).forEach(function (key) {
        if (Object.prototype.hasOwnProperty.call(stored, key) && typeof stored[key] === typeof defaults[key]) result[key] = stored[key];
      });
      if (['midnight-green', 'midnight-blue', 'cyber-purple', 'crimson-security', 'arctic-light', 'oled-black', 'graphite', 'emerald', 'cyberpunk', 'minimalist'].indexOf(result.theme) < 0) result.theme = 'midnight-green';
      if (['auto', 'lime', 'blue', 'violet', 'cyan', 'custom'].indexOf(result.accent) < 0) result.accent = 'auto';
      if (!/^#[0-9a-f]{6}$/i.test(result.customAccent)) result.customAccent = defaults.customAccent;
      if (['comfortable', 'compact', 'spacious'].indexOf(result.density) < 0) result.density = 'comfortable';
      return result;
    } catch (_) {
      return Object.assign({}, defaults);
    }
  }

  function saveSettings() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); } catch (_) { /* Preferences are optional. */ }
  }

  function rgbFromHex(hex) {
    var value = parseInt(hex.slice(1), 16);
    return { r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255 };
  }

  function relativeLuminance(rgb) {
    function channel(value) {
      var normalized = value / 255;
      return normalized <= 0.04045 ? normalized / 12.92 : Math.pow((normalized + 0.055) / 1.055, 2.4);
    }
    return 0.2126 * channel(rgb.r) + 0.7152 * channel(rgb.g) + 0.0722 * channel(rgb.b);
  }

  function applyAppearance() {
    var root = document.documentElement;
    var style = root.style;
    root.setAttribute('data-theme', settings.theme);
    root.setAttribute('data-accent', settings.accent);
    root.setAttribute('data-density', settings.density);
    root.classList.toggle('reduce-motion', settings.reduceMotion);
    ['--accent', '--accent-deep', '--accent-soft', '--accent-rgb', '--accent-text'].forEach(function (property) { style.removeProperty(property); });
    if (settings.accent === 'custom') {
      var rgb = rgbFromHex(settings.customAccent);
      var dark = { r: Math.round(rgb.r * 0.76), g: Math.round(rgb.g * 0.76), b: Math.round(rgb.b * 0.76) };
      var blackContrast = (relativeLuminance(rgb) + 0.05) / 0.05;
      var whiteContrast = 1.05 / (relativeLuminance(rgb) + 0.05);
      style.setProperty('--accent', settings.customAccent);
      style.setProperty('--accent-deep', 'rgb(' + dark.r + ', ' + dark.g + ', ' + dark.b + ')');
      style.setProperty('--accent-soft', 'rgba(' + rgb.r + ', ' + rgb.g + ', ' + rgb.b + ', .12)');
      style.setProperty('--accent-rgb', rgb.r + ', ' + rgb.g + ', ' + rgb.b);
      style.setProperty('--accent-text', blackContrast >= whiteContrast ? '#111713' : '#ffffff');
    }
  }

  function applySettings() {
    applyAppearance();
    $('themeSelect').value = settings.theme;
    $('accentSelect').value = settings.accent;
    $('customAccent').value = settings.customAccent;
    $('customAccentWrap').hidden = settings.accent !== 'custom';
    $('densitySelect').value = settings.density;
    $('reduceMotion').checked = settings.reduceMotion;
    $('autoHideReveal').checked = settings.autoHideReveal;
    $('soundToggle').checked = settings.sound;
    $('showEstimates').checked = settings.showEstimates;
    $('showAdvanced').checked = settings.showAdvanced;
    $('historyToggle').checked = settings.historyEnabled;
    $('estimatePanel').hidden = !settings.showEstimates;
    $('advancedPanel').hidden = !settings.showAdvanced;
    $('historyPanel').hidden = !settings.historyEnabled;
    all('[data-theme-pick]').forEach(function (button) {
      var selected = button.getAttribute('data-theme-pick') === settings.theme;
      button.setAttribute('aria-pressed', String(selected));
    });
    $('defaultSpeedPreset').value = settings.defaultSpeed;
    $('defaultCustomSpeedWrap').hidden = settings.defaultSpeed !== 'custom';
    $('defaultCustomSpeed').value = settings.customSpeed;
    $('pacePreset').value = settings.defaultSpeed;
    $('customSpeedWrap').hidden = settings.defaultSpeed !== 'custom';
    $('customSpeed').value = settings.customSpeed;
    renderHistory();
    updateScenarioTable();
    updateVerificationUI();
    updateLab();
  }

  function setText(id, value) { $(id).textContent = value; }
  function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }
  function safeCodePoints(value) { return Array.from(value); }
  function countLabel(count, singular, plural) { return count + ' ' + (count === 1 ? singular : (plural || singular + 's')); }
  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (char) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char];
    });
  }
  function iconMarkup(name) {
    return '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><use href="#icon-' + name + '"></use></svg>';
  }
  function createIcon(name) {
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'icon'); svg.setAttribute('viewBox', '0 0 24 24'); svg.setAttribute('aria-hidden', 'true'); svg.setAttribute('focusable', 'false');
    var use = document.createElementNS('http://www.w3.org/2000/svg', 'use'); use.setAttribute('href', '#icon-' + name); svg.appendChild(use);
    return svg;
  }
  function setIconButtonLabel(button, name, label) {
    button.innerHTML = iconMarkup(name) + '<span>' + escapeHtml(label) + '</span>';
  }
  function appendIconLabel(button, name, label) {
    button.appendChild(createIcon(name));
    button.appendChild(document.createTextNode(' ' + label));
  }
  function formatNumber(value) {
    if (!Number.isFinite(value)) return '—';
    return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(value);
  }
  function strengthFor(score) {
    if (score < 20) return 'Very Weak';
    if (score < 40) return 'Weak';
    if (score < 60) return 'Fair';
    if (score < 80) return 'Strong';
    return 'Very Strong';
  }
  function normalizeLeet(value) {
    return value.toLowerCase().replace(/[@4]/g, 'a').replace(/[8]/g, 'b').replace(/[3]/g, 'e')
      .replace(/[1!|]/g, 'i').replace(/[0]/g, 'o').replace(/[$5]/g, 's').replace(/[7]/g, 't');
  }
  function containsAny(value, candidates) {
    return candidates.some(function (candidate) { return value.indexOf(candidate) >= 0; });
  }
  function longestSequence(value) {
    var best = 1, run = 1, direction = 0;
    for (var i = 1; i < value.length; i++) {
      var previous = value.charCodeAt(i - 1), current = value.charCodeAt(i);
      var isAlpha = previous >= 97 && previous <= 122 && current >= 97 && current <= 122;
      var isDigit = previous >= 48 && previous <= 57 && current >= 48 && current <= 57;
      var difference = current - previous;
      if ((isAlpha || isDigit) && Math.abs(difference) === 1 && (direction === 0 || difference === direction)) {
        run++;
        direction = difference;
        best = Math.max(best, run);
      } else {
        run = 1;
        direction = 0;
      }
    }
    return best;
  }
  function repeatedUnit(value) {
    var limit = Math.min(8, Math.floor(value.length / 2));
    for (var size = 1; size <= limit; size++) {
      var unit = value.slice(0, size);
      if (unit.length && (unit.repeat(Math.ceil(value.length / size)).slice(0, value.length) === value)) return { unit: unit, count: Math.floor(value.length / size) };
    }
    return null;
  }
  function hasDictionaryWord(value) {
    var normalized = normalizeLeet(value).replace(/[^a-z]/g, '');
    for (var i = 0; i < DICTIONARY.length; i++) {
      var word = DICTIONARY[i];
      if (word.length >= 4 && normalized.indexOf(word) >= 0) return word;
    }
    return '';
  }
  function classifyChar(char) {
    if (/\p{Ll}/u.test(char)) return 'lower';
    if (/\p{Lu}/u.test(char)) return 'upper';
    if (/\p{N}/u.test(char)) return 'digits';
    return 'symbols';
  }
  function analyzePassword(password) {
    if (!password) return null;
    var chars = safeCodePoints(password);
    var length = chars.length;
    var counts = { lower: 0, upper: 0, digits: 0, symbols: 0 };
    var histogram = Object.create(null);
    var nonAscii = false;
    chars.forEach(function (char) {
      counts[classifyChar(char)]++;
      histogram[char] = (histogram[char] || 0) + 1;
      if (char.codePointAt(0) > 127) nonAscii = true;
    });
    var unique = Object.keys(histogram).length;
    var usedCategories = Object.keys(counts).filter(function (key) { return counts[key] > 0; }).length;
    var pool = (counts.lower ? 26 : 0) + (counts.upper ? 26 : 0) + (counts.digits ? 10 : 0) + (counts.symbols ? 32 : 0);
    if (nonAscii) pool += 128;
    var rawEntropy = length * Math.log2(Math.max(pool, 1));
    var weaknesses = [];
    var entropyPenalty = 0;
    var deductionTotal = 0;
    var addRisk = function (id, title, detail, deduction, entropyLoss) {
      weaknesses.push({ id: id, title: title, detail: detail, deduction: deduction, kind: 'risk' });
      deductionTotal += deduction;
      entropyPenalty += entropyLoss;
    };
    var addGood = function (id, title, detail) { weaknesses.push({ id: id, title: title, detail: detail, deduction: 0, kind: 'good' }); };
    var lowered = password.toLowerCase();
    var compact = lowered.replace(/[^a-z0-9]/g, '');
    var normalized = normalizeLeet(password).replace(/[^a-z0-9]/g, '');
    var repeated = repeatedUnit(lowered);
    var maxRepeat = 1;
    Object.keys(histogram).forEach(function (char) { maxRepeat = Math.max(maxRepeat, histogram[char]); });
    var sequenceLength = longestSequence(lowered.replace(/[^a-z0-9]/g, ''));
    var keyboardPatterns = ['qwerty', 'asdfgh', 'zxcvbn', 'qazwsx', '1qaz', '2wsx', 'qwertz', 'poiuy', 'lkjhg', 'mnbvc', '123456', '654321'];
    var hasKeyboard = containsAny(normalized, keyboardPatterns);
    var isCommon = COMMON.indexOf(compact) >= 0 || COMMON.indexOf(normalized) >= 0;
    var dictionaryWord = hasDictionaryWord(password);
    var yearMatch = password.match(/(?:19|20)\d{2}/);
    var dateLike = /\d{8}/.test(password) || /(?:19|20)\d{6}/.test(password);
    var contactLike = /(?:\+?\d[\s().-]?){7,}/.test(password) || /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(password);
    var uniqueRatio = unique / Math.max(length, 1);
    var unusualDistribution = length >= 10 && uniqueRatio < 0.42 && maxRepeat < length * 0.4;
    if (length < 12) addRisk('length', 'Shorter than 12 code points', 'Short passwords offer fewer possible guesses. Consider a longer random password or passphrase.', 12, 0);
    else if (length >= 16) addGood('length', 'Length adds meaningful room', 'Length helps when each character or word was selected unpredictably.');
    else addGood('length', 'Length is a useful start', 'Longer credentials can create more room for unpredictability.');
    if (usedCategories >= 3) addGood('variety', 'Several character types appear', 'Variety can expand the search space when the choices are unpredictable.');
    else addRisk('variety', 'Limited character variety', 'The observed character set is narrow; a larger random pool can help, but variety alone is not a guarantee.', 0, 0);
    if (maxRepeat >= 3) addRisk('repeat', 'Repeated characters detected', 'A character repeats ' + maxRepeat + ' times. Long runs or repeated blocks are easy to prioritize.', 18, 10);
    if (repeated && repeated.count >= 2 && repeated.unit.length < length) addRisk('repeat-block', 'Repeated sequence detected', 'The pattern "' + repeated.unit + '" appears as a repeated block.', 18, 12);
    if (sequenceLength >= 3) addRisk('sequence', 'Sequential characters detected', 'An ascending or descending letter/number run spans at least ' + sequenceLength + ' characters.', 13, 9);
    if (hasKeyboard) addRisk('keyboard', 'Keyboard walk detected', 'Common keyboard paths are frequently included early in guessing lists.', 18, 10);
    if (isCommon) addRisk('common', 'Matches a common-password pattern', 'This resembles a frequently used password. Common candidates are tried early.', 45, 32);
    if (dictionaryWord) addRisk('dictionary', 'Dictionary word or substitution pattern', 'A familiar word appears after simple substitutions are normalized. Cosmetic changes can be predictable.', 17, 14);
    if (yearMatch || dateLike) addRisk('date', 'Date or year-like sequence', 'Years and compact date-like numbers may reveal a predictable personal pattern.', 12, 8);
    if (contactLike) addRisk('personal', 'Possible contact or personal-info pattern', 'A phone-like or email-like pattern can be guessable if it relates to you.', 12, 8);
    if (unusualDistribution) addRisk('distribution', 'Unusual character distribution', 'Many characters repeat relative to the total length, reducing the number of distinct-looking choices.', 10, 8);
    if (usedCategories === 4) addGood('mix', 'All four character categories appear', 'The password includes lowercase, uppercase, numbers, and symbols or other characters.');
    if (uniqueRatio >= 0.8 && length >= 10) addGood('unique', 'Most characters are distinct', 'A varied character distribution avoids obvious repetition.');
    var lengthPoints = Math.min(32, length * 2.4);
    var varietyPoints = usedCategories * 5.5;
    var entropyPoints = Math.min(28, rawEntropy / 90 * 28);
    var uniquenessPoints = Math.min(18, uniqueRatio * 18);
    var earned = lengthPoints + varietyPoints + entropyPoints + uniquenessPoints;
    var score = Math.round(clamp(earned - deductionTotal, 0, 100));
    var effectiveEntropy = Math.max(1, rawEntropy - entropyPenalty);
    if (isCommon) effectiveEntropy = Math.min(effectiveEntropy, 2);
    var detectedRisks = weaknesses.filter(function (item) { return item.kind === 'risk'; });
    return {
      length: length, counts: counts, unique: unique, uniqueRatio: uniqueRatio,
      usedCategories: usedCategories, pool: pool, rawEntropy: rawEntropy,
      effectiveEntropy: effectiveEntropy, score: score, label: strengthFor(score),
      weaknesses: weaknesses, risks: detectedRisks, maxRepeat: maxRepeat,
      repeated: repeated, sequenceLength: sequenceLength, dictionaryWord: dictionaryWord,
      isCommon: isCommon, hasKeyboard: hasKeyboard, dateLike: !!(yearMatch || dateLike),
      contactLike: contactLike, unusualDistribution: unusualDistribution,
      points: { length: lengthPoints, variety: varietyPoints, entropy: entropyPoints, uniqueness: uniquenessPoints, deductions: deductionTotal },
    };
  }

  function log10(value) { return Math.log(value) / Math.LN10; }
  function formatRate(rate) {
    if (!Number.isFinite(rate) || rate <= 0) return '—';
    if (rate < 1) return String(Number(rate.toPrecision(3)));
    if (rate < 1000) return formatNumber(rate);
    if (rate < 1e6) return formatNumber(rate / 1000) + 'K';
    if (rate < 1e9) return formatNumber(rate / 1e6) + 'M';
    if (rate < 1e12) return formatNumber(rate / 1e9) + 'B';
    return '10^' + log10(rate).toFixed(1);
  }
  function formatTimeFromLog(logSeconds) {
    if (!Number.isFinite(logSeconds)) return 'Beyond practical scale';
    if (logSeconds < 0) return '< 1 second';
    if (logSeconds < log10(60)) return Math.max(1, Math.round(Math.pow(10, logSeconds))) + ' seconds';
    if (logSeconds < log10(3600)) return (Math.pow(10, logSeconds) / 60).toFixed(1) + ' minutes';
    if (logSeconds < log10(86400)) return (Math.pow(10, logSeconds) / 3600).toFixed(1) + ' hours';
    if (logSeconds < log10(31557600)) return (Math.pow(10, logSeconds) / 86400).toFixed(1) + ' days';
    var yearsLog = logSeconds - log10(31557600);
    if (yearsLog < 6) {
      var years = Math.pow(10, yearsLog);
      if (years < 1000) return years.toFixed(years < 10 ? 1 : 0) + ' years';
      return formatNumber(years / 1000) + ' thousand years';
    }
    if (yearsLog < 12) return (Math.pow(10, yearsLog) / 1e6).toFixed(1) + ' million years';
    return '10^' + yearsLog.toFixed(1) + ' years';
  }
  function timeForRate(analysis, rate) {
    if (!analysis || !Number.isFinite(rate) || rate <= 0) return '—';
    var expectedLogGuesses = Math.max(0, analysis.effectiveEntropy - 1);
    return formatTimeFromLog(expectedLogGuesses * Math.LN2 / Math.LN10 - log10(rate));
  }
  function parseRate(value, fallback) {
    var rate = Number(value);
    if (!Number.isFinite(rate) || rate <= 0) return fallback;
    return clamp(rate, 0.000001, 1e30);
  }
  function selectedCustomRate() {
    var preset = $('pacePreset').value;
    if (preset === 'custom') return parseRate($('customSpeed').value, 1000);
    return parseRate(preset, 10000);
  }
  function scenarios() {
    return [
      { name: 'Heavily rate-limited online', rate: 0.1, desc: 'A service that permits very few attempts over time.' },
      { name: 'Moderately rate-limited online', rate: 10, desc: 'A simplified online illustration with throttling.' },
      { name: 'Faster online guessing', rate: 100, desc: 'An illustrative online pace; real services may block or slow attempts.' },
      { name: 'Offline, slower hash', rate: 10000, desc: 'A moderate illustrative pace for a costly password hash.' },
      { name: 'Offline, faster hash', rate: 100000000, desc: 'A faster illustrative offline pace; memory-hard hashes can be much slower.' },
      { name: 'High-performance offline', rate: 10000000000, desc: 'Fast illustrative hardware and a fast hash; not a universal benchmark.' },
      { name: 'Your selected pace', rate: selectedCustomRate(), desc: 'A user-adjusted pace for exploring assumptions.' }
    ];
  }

  function updateScenarioTable() {
    var tbody = $('scenarioRows');
    if (!currentAnalysis) {
      tbody.innerHTML = '<tr class=\"scenario-empty\"><td colspan=\"4\">Enter a password to calculate illustrative estimates.</td></tr>';
      $('speedComparison').innerHTML = '<span class=\"empty-inline\">Scenario comparisons appear after analysis.</span>';
      return;
    }
    tbody.innerHTML = '';
    scenarios().forEach(function (scenario) {
      var row = document.createElement('tr');
      row.innerHTML = '<td><strong>' + escapeHtml(scenario.name) + '</strong><small>' + escapeHtml(scenario.desc) + '</small></td><td>' + escapeHtml(formatRate(scenario.rate)) + '</td><td class=\"time-cell\">' + escapeHtml(timeForRate(currentAnalysis, scenario.rate)) + '</td><td>' + escapeHtml(scenario.name === 'Your selected pace' ? 'Custom mathematical comparison.' : scenario.desc) + '</td>';
      tbody.appendChild(row);
    });
    renderSpeedComparison();
  }

  function renderSpeedComparison() {
    var root = $('speedComparison');
    root.innerHTML = '';
    scenarios().forEach(function (scenario) {
      var card = document.createElement('div'); card.className = 'speed-item';
      var head = document.createElement('div'); head.className = 'speed-item-head';
      var name = document.createElement('strong'); name.textContent = scenario.name;
      var time = document.createElement('span'); time.textContent = timeForRate(currentAnalysis, scenario.rate);
      head.appendChild(name); head.appendChild(time);
      var track = document.createElement('div'); track.className = 'speed-track';
      var bar = document.createElement('i');
      bar.style.width = clamp((log10(scenario.rate) + 1) / 13 * 100, 4, 100) + '%';
      track.appendChild(bar);
      var rate = document.createElement('small'); rate.textContent = formatRate(scenario.rate) + ' guesses/sec';
      card.appendChild(head); card.appendChild(track); card.appendChild(rate); root.appendChild(card);
    });
  }

  function renderComposition(analysis) {
    var legend = $('compositionLegend');
    legend.innerHTML = '';
    if (!analysis) {
      $('compositionDonut').style.background = 'var(--surface-3)';
      setText('donutTotal', '—');
      setText('compositionSummary', 'No input');
      legend.innerHTML = '<span class=\"muted\">Enter a password to map its composition.</span>';
      return;
    }
    var total = analysis.length || 1;
    var stops = [];
    var cursor = 0;
    categories.forEach(function (category, index) {
      var count = analysis.counts[category.key];
      if (!count) return;
      var start = cursor / total * 100;
      cursor += count;
      var end = cursor / total * 100;
      stops.push(palette[index] + ' ' + start.toFixed(2) + '% ' + end.toFixed(2) + '%');
      var item = document.createElement('div');
      item.className = 'legend-item';
      var square = document.createElement('i');
      square.style.background = palette[index];
      var label = document.createElement('span');
      label.textContent = category.label;
      var value = document.createElement('strong');
      value.textContent = count + ' · ' + Math.round(count / total * 100) + '%';
      item.appendChild(square); item.appendChild(label); item.appendChild(value);
      legend.appendChild(item);
    });
    $('compositionDonut').style.background = 'conic-gradient(' + stops.join(',') + ')';
    setText('donutTotal', analysis.length);
    setText('compositionSummary', analysis.usedCategories + ' types · ' + analysis.length + ' code points');
  }

  function renderScoreBreakdown(analysis) {
    var root = $('scoreBreakdown');
    root.innerHTML = '';
    if (!analysis) {
      root.innerHTML = '<div class=\"empty-inline\">Score details appear when you enter a password.</div>';
      return;
    }
    var formula = document.createElement('p');
    formula.className = 'breakdown-formula';
    formula.textContent = 'Final = clamp(round(length + diversity + entropy + distinctness − pattern penalties), 0, 100).';
    root.appendChild(formula);
    var rows = [
      ['Length contribution', analysis.points.length, 32, false, 'Up to 32 points; reaches its ceiling at 14 code points.'],
      ['Character diversity', analysis.points.variety, 22, false, '5.5 points for each observed character category.'],
      ['Character-set estimate', analysis.points.entropy, 28, false, 'Up to 28 points from the observed character pool and length.'],
      ['Distinct-character ratio', analysis.points.uniqueness, 18, false, 'Rewards a broader distribution of characters.']
    ];
    analysis.weaknesses.filter(function (item) { return item.deduction > 0; }).forEach(function (item) {
      rows.push([item.title, -item.deduction, 45, true, item.detail]);
    });
    rows.forEach(function (entry) {
      var row = document.createElement('div');
      row.className = 'breakdown-row' + (entry[3] ? ' deduction' : '');
      var name = document.createElement('span'); name.textContent = entry[0];
      name.title = entry[4] || '';
      var value = document.createElement('strong'); value.textContent = (entry[1] > 0 ? '+' : '') + entry[1].toFixed(1);
      var track = document.createElement('div'); track.className = 'breakdown-track';
      var bar = document.createElement('i'); bar.style.width = Math.min(100, Math.abs(entry[1]) / entry[2] * 100) + '%';
      var explanation = document.createElement('small'); explanation.textContent = entry[4];
      track.appendChild(bar); row.appendChild(name); row.appendChild(value); row.appendChild(track); row.appendChild(explanation); root.appendChild(row);
    });
    var final = document.createElement('div');
    final.className = 'breakdown-row';
    final.innerHTML = '<span><strong>Final score</strong></span><strong>' + analysis.score + ' / 100</strong>';
    root.appendChild(final);
  }

  function renderWeaknesses(analysis) {
    var root = $('weaknessList');
    root.innerHTML = '';
    if (!analysis) {
      root.innerHTML = '<div class=\"empty-inline\">Detected strengths and risks appear here.</div>';
      setText('patternCount', 'No analysis yet');
      setText('repetitionBox', 'Repetition and sequence checks will appear here.');
      return;
    }
    setText('patternCount', analysis.risks.length + ' risks · ' + analysis.weaknesses.filter(function (item) { return item.kind === 'good'; }).length + ' strengths');
    analysis.weaknesses.forEach(function (item) {
      var row = document.createElement('div');
      row.className = 'weakness-item' + (item.kind === 'good' ? ' good' : '');
      var dot = document.createElement('i'); dot.className = 'weakness-indicator';
      var content = document.createElement('span');
      var title = document.createElement('strong'); title.textContent = item.title;
      var detail = document.createElement('small'); detail.textContent = item.detail;
      content.appendChild(title); content.appendChild(detail);
      row.appendChild(dot); row.appendChild(content); root.appendChild(row);
    });
    var repeat = [];
    if (analysis.maxRepeat > 1) repeat.push('one character repeats up to ' + analysis.maxRepeat + ' times');
    else repeat.push('no repeated character run');
    if (analysis.repeated && analysis.repeated.count > 1) repeat.push('repeated block length ' + analysis.repeated.unit.length);
    if (analysis.sequenceLength >= 3) repeat.push('sequence length ' + analysis.sequenceLength);
    if (analysis.hasKeyboard) repeat.push('keyboard walk found');
    setText('repetitionBox', repeat.join(' · ') + '.');
  }

  function recommendationsFor(analysis) {
    if (!analysis) return [];
    var recs = [];
    if (analysis.length < 16) recs.push('Add length: aim for a longer random password or a passphrase with several random words.');
    if (analysis.isCommon || analysis.dictionaryWord || analysis.hasKeyboard) recs.push('Avoid familiar words, keyboard paths, and predictable substitutions; use a cryptographically generated option.');
    if (analysis.repeated || analysis.sequenceLength >= 3) recs.push('Remove repeated blocks and obvious sequences.');
    if (analysis.dateLike || analysis.contactLike) recs.push('Avoid dates, contact details, names, or other information connected to you.');
    if (analysis.usedCategories < 3 && analysis.length < 20) recs.push('Consider more unpredictable choices, while keeping length and uniqueness as the priority.');
    if (!recs.length) recs.push('Use this password for one account only, store it in a password manager, and enable multi-factor authentication.');
    recs.push('Use a password manager and multi-factor authentication where available.');
    return recs.slice(0, 4);
  }

  function renderRecommendations(analysis) {
    var root = $('recommendations');
    root.innerHTML = '';
    if (!analysis) { root.hidden = true; return; }
    var title = document.createElement('strong'); title.textContent = 'Ways to improve this choice';
    var list = document.createElement('ul');
    recommendationsFor(analysis).forEach(function (recommendation) {
      var item = document.createElement('li'); item.textContent = recommendation; list.appendChild(item);
    });
    root.appendChild(title); root.appendChild(list); root.hidden = false;
  }

  function renderAnalysisSummary(analysis) {
    var card = $('analysisSummary');
    if (!analysis) { card.hidden = true; return; }
    var firstRisk = analysis.risks.length ? analysis.risks[0].title.toLowerCase() : '';
    var summary = analysis.label + ' by SecureCheck’s heuristic model. It uses ' + analysis.length + ' Unicode code points across ' + analysis.usedCategories + ' character type' + (analysis.usedCategories === 1 ? '' : 's') + '. ';
    if (firstRisk) summary += 'The most relevant pattern to review is ' + firstRisk + '. ';
    else summary += 'No obvious common or repeated pattern was detected by the local checks. ';
    summary += 'The pattern-adjusted estimate is ' + analysis.effectiveEntropy.toFixed(1) + ' bits; use a unique password and account protections as well.';
    $('analysisSummaryText').textContent = summary;
    card.hidden = false;
  }

  function renderAnalysis(password) {
    currentAnalysis = analyzePassword(password);
    var analysis = currentAnalysis;
    var meter = $('strengthMeter');
    var roleMeter = document.querySelector('.meter-track[role=\"meter\"]');
    if (!analysis) {
      setText('scoreValue', '—'); setText('orbitScore', '—'); setText('strengthLabel', 'No password');
      setText('entropyValue', '—'); setText('poolValue', '—'); setText('poolCaption', 'possible characters');
      setText('uniqueValue', '—'); setText('uniqueCaption', '0% of input'); setText('flagValue', '—');
      setText('rawEntropyValue', '—'); setText('effectiveEntropySmall', '—');
      $('rawEntropyBar').style.width = '0%'; meter.style.width = '0%';
      setText('charCount', '0 code points');
      roleMeter.setAttribute('aria-valuenow', '0');
      $('scoreOrbit').style.borderColor = 'rgba(var(--accent-rgb),.31)';
      $('emptyNote').hidden = false; $('recommendations').hidden = true;
      setText('analyzerStatus', 'Waiting for input');
      $('copyPassword').disabled = true;
      renderAnalysisSummary(null);
      renderComposition(null); renderScoreBreakdown(null); renderWeaknesses(null); updateScenarioTable();
      return;
    }
    var color = analysis.score >= 60 ? 'var(--accent)' : (analysis.score >= 40 ? 'var(--amber)' : 'var(--red)');
    setText('scoreValue', analysis.score); setText('orbitScore', analysis.score); setText('strengthLabel', analysis.label);
    setText('entropyValue', analysis.effectiveEntropy.toFixed(1) + ' bits');
    setText('poolValue', formatNumber(analysis.pool)); setText('poolCaption', 'observed set size estimate');
    setText('uniqueValue', analysis.unique); setText('uniqueCaption', Math.round(analysis.uniqueRatio * 100) + '% of input');
    setText('flagValue', analysis.risks.length);
    setText('rawEntropyValue', analysis.rawEntropy.toFixed(1) + ' bits');
    setText('effectiveEntropySmall', analysis.effectiveEntropy.toFixed(1) + ' bits');
    $('rawEntropyBar').style.width = clamp(analysis.rawEntropy / 160 * 100, 2, 100) + '%';
    meter.style.width = analysis.score + '%'; meter.style.background = color;
    roleMeter.setAttribute('aria-valuenow', String(analysis.score));
    $('scoreOrbit').style.borderColor = color;
    $('emptyNote').hidden = true;
    setText('analyzerStatus', analysis.risks.length ? analysis.risks.length + ' pattern flag' + (analysis.risks.length === 1 ? '' : 's') + ' to review' : 'No obvious patterns found');
    $('copyPassword').disabled = false;
    setText('charCount', countLabel(analysis.length, 'code point') + ' · ' + countLabel(password.length, 'UTF-16 code unit'));
    renderComposition(analysis); renderScoreBreakdown(analysis); renderWeaknesses(analysis); renderRecommendations(analysis); updateScenarioTable();
    renderAnalysisSummary(analysis);
  }

  function updateHistory(analysis) {
    if (!settings.historyEnabled || !analysis) return;
    historyItems.unshift({
      at: Date.now(), length: analysis.length, score: analysis.score, label: analysis.label,
      entropy: Number(analysis.effectiveEntropy.toFixed(1)), flags: analysis.risks.length
    });
    historyItems = historyItems.slice(0, 8);
    renderHistory();
  }

  function scheduleHistory(analysis) {
    if (!settings.historyEnabled || !analysis) return;
    clearTimeout(historyTimer);
    historyTimer = setTimeout(function () { updateHistory(analysis); }, 650);
  }

  function renderHistory() {
    var list = $('historyList');
    if (!list) return;
    list.innerHTML = '';
    if (!settings.historyEnabled) {
      list.innerHTML = '<div class=\"empty-inline\">Enable recent history in Settings to see statistics here.</div>';
      return;
    }
    if (!historyItems.length) {
      list.innerHTML = '<div class=\"empty-inline\">No analyses yet. Only summary statistics will appear here.</div>';
      return;
    }
    historyItems.forEach(function (item) {
      var card = document.createElement('div'); card.className = 'history-item';
      var score = document.createElement('strong'); score.textContent = item.score + ' · ' + item.label;
      var details = document.createElement('small'); details.textContent = item.length + ' code points · ' + item.entropy + ' bits · ' + item.flags + ' flags · ' + new Date(item.at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      card.appendChild(score); card.appendChild(details); list.appendChild(card);
    });
  }

  function showToast(message, isError) {
    var region = $('toastRegion');
    var toast = document.createElement('div'); toast.className = 'toast' + (isError ? ' error' : '');
    toast.textContent = message; region.appendChild(toast);
    setTimeout(function () { toast.remove(); }, 2600);
  }

  async function copyText(value, successMessage) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        var helper = document.createElement('textarea');
        helper.value = value; helper.setAttribute('readonly', ''); helper.style.position = 'fixed'; helper.style.opacity = '0';
        document.body.appendChild(helper); helper.select();
        var ok = document.execCommand('copy'); helper.remove();
        if (!ok) throw new Error('Clipboard unavailable');
      }
      showToast(successMessage || 'Copied to clipboard');
      playSound();
      return true;
    } catch (_) {
      showToast('Copy is unavailable here. Select and copy the text manually.', true);
      return false;
    }
  }

  function playSound() {
    if (!settings.sound) return;
    try {
      var AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      var context = new AudioContextClass();
      var oscillator = context.createOscillator();
      var gain = context.createGain();
      oscillator.frequency.value = 620;
      gain.gain.value = 0.025;
      oscillator.connect(gain); gain.connect(context.destination);
      oscillator.start(); oscillator.stop(context.currentTime + 0.045);
      oscillator.onended = function () { context.close(); };
    } catch (_) { /* Audio is optional and may be blocked by browser policy. */ }
  }

  function downloadFile(filename, mime, content) {
    try {
      var blob = new Blob([content], { type: mime });
      var url = URL.createObjectURL(blob);
      var anchor = document.createElement('a'); anchor.href = url; anchor.download = filename;
      document.body.appendChild(anchor); anchor.click(); anchor.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
      showToast('Report exported without password text');
    } catch (_) { showToast('Could not create the report in this browser.', true); }
  }

  function reportObject() {
    var analysis = currentAnalysis;
    if (!analysis) return { product: 'SecureCheck', generatedAt: new Date().toISOString(), note: 'No password was analyzed. Password text is never included in this report.' };
    return {
      product: 'SecureCheck',
      generatedAt: new Date().toISOString(),
      privacy: 'Password text is deliberately excluded.',
      score: analysis.score,
      strength: analysis.label,
      characterStatistics: {
        codePoints: analysis.length,
        uniqueCharacters: analysis.unique,
        uniqueRatioPercent: Math.round(analysis.uniqueRatio * 100),
        characterPoolEstimate: analysis.pool,
        composition: analysis.counts
      },
      entropyEstimate: {
        characterSetCeilingBits: Number(analysis.rawEntropy.toFixed(2)),
        patternAdjustedBits: Number(analysis.effectiveEntropy.toFixed(2)),
        explanation: 'Illustrative estimates; uniform random choice is an assumption, and human patterns can be easier to guess.'
      },
      weaknesses: analysis.risks.map(function (item) { return { finding: item.title, explanation: item.detail }; }),
      strengths: analysis.weaknesses.filter(function (item) { return item.kind === 'good'; }).map(function (item) { return item.title; }),
      recommendations: recommendationsFor(analysis),
      guessingScenarios: scenarios().map(function (scenario) {
        return { scenario: scenario.name, guessesPerSecond: scenario.rate, estimatedTime: timeForRate(analysis, scenario.rate), assumption: scenario.desc };
      }),
      assumptions: 'Mathematical expected-search-position model using approximately half of the pattern-adjusted search space. Actual outcomes depend on hardware, storage and hashing, rate limits, attacker wordlists, reuse, and other controls.'
    };
  }

  function reportText() {
    var report = reportObject();
    if (!currentAnalysis) return 'SECURECHECK — PASSWORD ANALYSIS REPORT\nGenerated: ' + report.generatedAt + '\n\nNo password was analyzed. Password text is never included in this report.';
    var analysis = currentAnalysis;
    var lines = [
      'SECURECHECK — PASSWORD ANALYSIS REPORT',
      'Generated: ' + report.generatedAt,
      'Privacy: password text is deliberately excluded.',
      '',
      'SCORE',
      analysis.score + '/100 — ' + analysis.label,
      '',
      'CHARACTER STATISTICS',
      'Length: ' + analysis.length + ' Unicode code points',
      'Unique characters: ' + analysis.unique + ' (' + Math.round(analysis.uniqueRatio * 100) + '%)',
      'Character pool estimate: ' + analysis.pool,
      'Composition: lowercase ' + analysis.counts.lower + ', uppercase ' + analysis.counts.upper + ', numbers ' + analysis.counts.digits + ', symbols/other ' + analysis.counts.symbols,
      '',
      'ENTROPY ESTIMATES',
      'Character-set ceiling: ' + analysis.rawEntropy.toFixed(2) + ' bits',
      'Pattern-adjusted estimate: ' + analysis.effectiveEntropy.toFixed(2) + ' bits',
      'These are illustrative estimates, not guarantees.'
    ];
    lines.push('', 'FINDINGS');
    if (!analysis.risks.length) lines.push('No obvious patterns detected by this local heuristic.');
    analysis.risks.forEach(function (item) { lines.push('- ' + item.title + ': ' + item.detail); });
    lines.push('', 'RECOMMENDATIONS');
    recommendationsFor(analysis).forEach(function (item) { lines.push('- ' + item); });
    lines.push('', 'ESTIMATED GUESSING TIMES');
    scenarios().forEach(function (item) { lines.push('- ' + item.name + ' — ' + formatRate(item.rate) + ' guesses/sec — ' + timeForRate(analysis, item.rate) + '. ' + item.desc); });
    lines.push('', 'ASSUMPTIONS & LIMITATIONS', 'Expected position uses roughly half the modeled pattern-adjusted search space. Actual results depend on hardware, password storage and hashing, rate limits, attacker wordlists, password reuse, and other controls. No cracking is performed.');
    return lines.join('\n');
  }

  function renderGlossary(query) {
    var root = $('glossaryList');
    root.innerHTML = '';
    var normalized = (query || '').trim().toLowerCase();
    var matches = glossary.filter(function (item) { return (item[0] + ' ' + item[1] + ' ' + item[2]).toLowerCase().indexOf(normalized) >= 0; });
    matches.forEach(function (item) {
      var details = document.createElement('details'); details.className = 'glossary-item';
      var summary = document.createElement('summary');
      var term = document.createElement('strong'); term.textContent = item[0];
      var tag = document.createElement('span'); tag.textContent = item[2];
      var chevron = document.createElement('span'); chevron.className = 'glossary-chevron'; chevron.appendChild(createIcon('chevron-down'));
      summary.appendChild(term); summary.appendChild(tag); summary.appendChild(chevron);
      var description = document.createElement('p'); description.textContent = item[1];
      details.appendChild(summary); details.appendChild(description); root.appendChild(details);
    });
    $('glossaryEmpty').hidden = matches.length > 0;
  }

  function closeMobileNav() {
    $('sidebar').classList.remove('open');
    $('mobileScrim').classList.remove('open');
    $('menuToggle').setAttribute('aria-expanded', 'false');
    $('menuToggle').setAttribute('aria-label', 'Open navigation menu');
  }

  function clearRevealTimer(input) {
    if (revealTimers[input.id]) {
      clearTimeout(revealTimers[input.id]);
      delete revealTimers[input.id];
    }
  }

  function armRevealTimer(input, button, showLabel, hideLabel) {
    clearRevealTimer(input);
    if (!settings.autoHideReveal || input.type !== 'text') return;
    revealTimers[input.id] = window.setTimeout(function () {
      input.type = 'password';
      button.setAttribute('aria-label', showLabel);
      button.title = showLabel;
      delete revealTimers[input.id];
    }, 30000);
  }

  function setFieldVisibility(input, button, showLabel, hideLabel) {
    var show = input.type === 'password';
    clearRevealTimer(input);
    input.type = show ? 'text' : 'password';
    button.setAttribute('aria-label', show ? hideLabel : showLabel);
    button.title = show ? hideLabel : showLabel;
    if (show) armRevealTimer(input, button, showLabel, hideLabel);
  }

  function hideAllRevealedFields() {
    var analyzer = $('passwordInput');
    if (analyzer.type === 'text') setFieldVisibility(analyzer, $('togglePassword'), 'Show password', 'Hide password');
    all('.compare-reveal').forEach(function (button) {
      var input = $(button.getAttribute('data-target'));
      if (input.type === 'text') {
        var candidate = input.id === 'compareA' ? 'A' : 'B';
        setFieldVisibility(input, button, 'Show candidate ' + candidate, 'Hide candidate ' + candidate);
      }
    });
  }

  function clearAnalyzer() {
    clearTimeout(historyTimer);
    clearRevealTimer($('passwordInput'));
    $('passwordInput').value = '';
    $('passwordInput').type = 'password';
    $('togglePassword').setAttribute('aria-label', 'Show password');
    $('togglePassword').title = 'Show password';
    renderAnalysis('');
  }

  function clearComparison() {
    ['compareA', 'compareB'].forEach(function (id) { clearRevealTimer($(id)); });
    $('compareA').value = '';
    $('compareB').value = '';
    $('compareA').type = 'password';
    $('compareB').type = 'password';
    all('.compare-reveal').forEach(function (button) {
      var candidate = button.getAttribute('data-target') === 'compareA' ? 'A' : 'B';
      button.setAttribute('aria-label', 'Show candidate ' + candidate);
      button.title = 'Show candidate ' + candidate;
    });
    $('compareResults').hidden = true;
    $('emptyCompare').hidden = false;
  }

  function clearGeneratorResults() {
    lastGenerated = [];
    lastPhrases = [];
    $('generatedPasswords').innerHTML = '<div class="empty-generated">' + iconMarkup('key-round') + '<strong>Your results will appear here</strong><small>Choose options, then generate.</small></div>';
    $('phraseResults').innerHTML = '<div class="empty-phrase">Your passphrases will appear here.</div>';
  }

  function navigate(page, options) {
    options = options || {};
    var target = $('page-' + page);
    if (!target) return;
    if (page === currentPage) {
      closeMobileNav();
      return;
    }
    if (currentPage === 'dashboard') clearAnalyzer();
    if (currentPage === 'compare') clearComparison();
    if (currentPage === 'studio' && !options.preserveStudio) clearGeneratorResults();
    if (currentPage === 'simulator' && simState === 'running') pauseSimulation(true);
    all('.page').forEach(function (item) { item.classList.toggle('active', item === target); });
    all('.nav-item').forEach(function (item) { item.classList.toggle('active', item.getAttribute('data-page') === page); });
    currentPage = page;
    setText('headerPage', target.getAttribute('data-title') || 'SecureCheck');
    closeMobileNav();
    if ($('commandDialog').open) $('commandDialog').close();
    window.scrollTo(0, 0);
    if (page === 'learn') renderGlossary($('glossarySearch').value);
    if (page === 'simulator') updateSimulatorButtons();
  }

  function randomInt(max) {
    if (!window.crypto || typeof window.crypto.getRandomValues !== 'function') throw new Error('Secure random generation is not available in this browser.');
    if (!Number.isInteger(max) || max < 1 || max > 0x100000000) throw new Error('Invalid random selection range.');
    var range = 0x100000000;
    var limit = Math.floor(range / max) * max;
    var value = new Uint32Array(1);
    do { window.crypto.getRandomValues(value); } while (value[0] >= limit);
    return value[0] % max;
  }

  function secureShuffle(items) {
    for (var index = items.length - 1; index > 0; index--) {
      var swap = randomInt(index + 1);
      var temp = items[index]; items[index] = items[swap]; items[swap] = temp;
    }
    return items;
  }

  function uniqueChars(value) {
    return Array.from(new Set(safeCodePoints(value))).join('');
  }

  function generatorConfiguration() {
    var excludeAmbiguous = $('excludeAmbiguous').checked;
    var forbidden = excludeAmbiguous ? 'O0oIl1|' : '';
    var stripForbidden = function (value) { return Array.from(value).filter(function (char) { return forbidden.indexOf(char) < 0; }).join(''); };
    var groups = [];
    if ($('includeUpper').checked) groups.push(stripForbidden('ABCDEFGHIJKLMNOPQRSTUVWXYZ'));
    if ($('includeLower').checked) groups.push(stripForbidden('abcdefghijklmnopqrstuvwxyz'));
    if ($('includeNumbers').checked) groups.push(stripForbidden('0123456789'));
    if ($('includeSymbols').checked) groups.push(stripForbidden('!@#$%^&*()-_=+[]{}:;,.?/\\~'));
    var custom = stripForbidden(uniqueChars($('customChars').value));
    var poolChars = Array.from(uniqueChars(groups.join('') + custom));
    if (!groups.length && !custom) throw new Error('Choose at least one character type or add custom characters.');
    if (groups.some(function (group) { return !group; })) throw new Error('A selected character type has no available characters.');
    return { groups: groups, custom: custom, poolChars: poolChars };
  }

  function verificationLimitReason() {
    if (!$('includeUpper').checked || !$('includeLower').checked || !$('includeNumbers').checked || !$('includeSymbols').checked) {
      return 'A 100/100 score requires all four character categories in this scoring model. Enable uppercase, lowercase, numbers, and symbols.';
    }
    var length = Number($('passwordLength').value);
    if (length < 14) return 'The selected length cannot reach the model’s full length contribution. Use at least 14 characters for 100/100 mode.';
    var config;
    try { config = generatorConfiguration(); } catch (error) { return error.message; }
    if (length > config.poolChars.length) return 'A 100/100 score needs distinct characters for this model. This pool has ' + config.poolChars.length + ' unique characters; reduce length or add more custom characters.';
    return '';
  }

  function updateGeneratorSummary() {
    var summary = $('generatorPoolSummary');
    var text = $('generatorPoolText');
    if (!summary || !text) return;
    try {
      var config = generatorConfiguration();
      var length = Number($('passwordLength').value);
      var poolSize = config.poolChars.length;
      var ceiling = poolSize > 1 ? length * Math.log2(poolSize) : 0;
      summary.classList.remove('pool-summary-error');
      text.textContent = poolSize + ' unique ' + (poolSize === 1 ? 'character' : 'characters') + ' · ' + ceiling.toFixed(1) + ' bits theoretical ceiling at ' + length + ' characters. Assumes uniform random choices; not a security verdict.';
    } catch (error) {
      summary.classList.add('pool-summary-error');
      text.textContent = error.message;
    }
  }

  function updateVerificationUI() {
    updateGeneratorSummary();
    var enabled = $('verify100').checked;
    $('verificationStatus').hidden = !enabled;
    if (!enabled) {
      $('generatePasswords').disabled = false;
      setIconButtonLabel($('generatePasswords'), 'key-round', 'Generate secure passwords');
      $('generatorMessage').classList.remove('error-hint');
      return;
    }
    setIconButtonLabel($('generatePasswords'), 'badge-check', 'Generate analyzer-verified passwords');
    var reason = verificationLimitReason();
    $('generatePasswords').disabled = Boolean(reason);
    if (reason) {
      setText('generatorMessage', reason);
      $('generatorMessage').classList.add('error-hint');
    } else {
      setText('generatorMessage', 'Eligible settings. Each candidate will be checked by the shared analyzer; the attempt limit is 1,500 per result.');
      $('generatorMessage').classList.remove('error-hint');
    }
  }

  function applyPasswordPreset(value) {
    if (value === 'custom') return;
    var presets = {
      balanced: { length: 20, upper: true, lower: true, numbers: true, symbols: true, ambiguous: true },
      maximum: { length: 28, upper: true, lower: true, numbers: true, symbols: true, ambiguous: true },
      'easy-type': { length: 22, upper: true, lower: true, numbers: true, symbols: false, ambiguous: true }
    };
    var preset = presets[value];
    if (!preset) return;
    $('passwordLength').value = String(preset.length);
    setText('passwordLengthValue', String(preset.length));
    $('includeUpper').checked = preset.upper;
    $('includeLower').checked = preset.lower;
    $('includeNumbers').checked = preset.numbers;
    $('includeSymbols').checked = preset.symbols;
    $('excludeAmbiguous').checked = preset.ambiguous;
    updateVerificationUI();
  }

  function markPasswordSettingsCustom() {
    $('passwordPreset').value = 'custom';
    updateVerificationUI();
  }

  function buildPassword(length, uniqueMode) {
    var config = generatorConfiguration();
    if (length < config.groups.length + (config.custom ? 1 : 0)) throw new Error('The selected groups need more characters than this password length.');
    var result = [];
    if (uniqueMode) {
      if (length > config.poolChars.length) throw new Error('The selected character pool is smaller than this length. Reduce the length or add more custom characters.');
      var used = new Set();
      config.groups.forEach(function (group) {
        var choices = Array.from(group).filter(function (char) { return !used.has(char); });
        if (!choices.length) throw new Error('The selected character groups cannot all be represented uniquely. Adjust the custom set.');
        var chosen = choices[randomInt(choices.length)];
        used.add(chosen); result.push(chosen);
      });
      if (config.custom && !result.some(function (char) { return config.custom.indexOf(char) >= 0; })) {
        var customChoices = Array.from(config.custom).filter(function (char) { return !used.has(char); });
        if (customChoices.length) {
          var customChoice = customChoices[randomInt(customChoices.length)];
          used.add(customChoice); result.push(customChoice);
        } else {
          throw new Error('The custom character set could not be included uniquely. Adjust the custom set.');
        }
      }
      var remaining = config.poolChars.filter(function (char) { return !used.has(char); });
      secureShuffle(remaining);
      while (result.length < length && remaining.length) result.push(remaining.pop());
      if (result.length < length) throw new Error('Not enough distinct characters are available for this length.');
    } else {
      var groups = config.groups.slice();
      if (config.custom) groups.push(config.custom);
      groups.forEach(function (group) {
        var chars = Array.from(group);
        result.push(chars[randomInt(chars.length)]);
      });
      while (result.length < length) result.push(config.poolChars[randomInt(config.poolChars.length)]);
    }
    return secureShuffle(result).join('');
  }

  function renderGenerated(values) {
    var root = $('generatedPasswords');
    root.innerHTML = '';
    values.forEach(function (record, index) {
      var card = document.createElement('div'); card.className = 'generated-item';
      var main = document.createElement('div'); main.className = 'generated-item-main';
      var code = document.createElement('code'); code.textContent = record.password; main.appendChild(code);
      var head = document.createElement('div'); head.className = 'generated-item-head';
      var score = document.createElement('span'); score.className = 'generated-score-pill'; score.textContent = record.analysis.score + '/100';
      var strength = document.createElement('span'); strength.className = 'generated-strength'; strength.textContent = record.analysis.label;
      head.appendChild(score); head.appendChild(strength); main.appendChild(head);
      var stats = document.createElement('div'); stats.className = 'generated-stats';
      [['Length', record.analysis.length + ' code points'], ['Entropy', record.analysis.effectiveEntropy.toFixed(1) + ' bits'], ['Mix', record.analysis.counts.lower + 'L · ' + record.analysis.counts.upper + 'U · ' + record.analysis.counts.digits + 'N · ' + record.analysis.counts.symbols + 'S']].forEach(function (item) {
        var chip = document.createElement('span'); chip.textContent = item[0] + ': ' + item[1]; stats.appendChild(chip);
      });
      main.appendChild(stats);
      var composition = document.createElement('div'); composition.className = 'generated-composition'; composition.setAttribute('aria-label', 'Character composition chart');
      categories.forEach(function (category, categoryIndex) {
        var count = record.analysis.counts[category.key];
        if (!count) return;
        var bar = document.createElement('i'); bar.style.width = (count / record.analysis.length * 100) + '%'; bar.style.background = palette[categoryIndex]; composition.appendChild(bar);
      });
      main.appendChild(composition);
      var actions = document.createElement('div'); actions.className = 'generated-actions';
      [['Copy', 'data-copy-index', 'Copy generated password ', 'copy'], ['Analyze', 'data-analyze-index', 'Analyze generated password ', 'scan-search'], ['Regenerate', 'data-regenerate-index', 'Regenerate password ', 'rotate-cw']].forEach(function (action) {
        var button = document.createElement('button'); button.className = 'mini-action'; button.type = 'button';
        appendIconLabel(button, action[3], action[0]); button.setAttribute(action[1], String(index)); button.setAttribute('aria-label', action[2] + (index + 1)); actions.appendChild(button);
      });
      card.appendChild(main); card.appendChild(actions); root.appendChild(card);
    });
    var note = document.createElement('p'); note.className = 'generator-score-note';
    note.textContent = $('verify100').checked ? 'Each result below was accepted only after the shared analyzer returned exactly 100/100.' : 'Scores and entropy shown are from the same analyzer used on the main dashboard.';
    root.appendChild(note);
    if (values.length > 1) {
      var copyAll = document.createElement('button');
      copyAll.type = 'button'; copyAll.className = 'button button-outline batch-copy'; appendIconLabel(copyAll, 'copy', 'Copy all ' + values.length);
      copyAll.id = 'copyAllGenerated'; root.appendChild(copyAll);
    }
  }

  function createGeneratedRecord(length, verified) {
    var attemptsPerPassword = 1500;
    if (verified) {
      var blockedReason = verificationLimitReason();
      if (blockedReason) throw new Error(blockedReason);
    }
    for (var attempt = 0; attempt < (verified ? attemptsPerPassword : 1); attempt++) {
      var candidate = buildPassword(length, verified);
      var analysis = analyzePassword(candidate);
      if (!verified || analysis.score === 100) return { password: candidate, analysis: analysis };
    }
    throw new Error('No qualifying password was found within ' + attemptsPerPassword + ' attempts. Try a shorter length or review the selected character settings.');
  }

  function generatePasswords() {
    try {
      var length = Number($('passwordLength').value);
      var batch = Number($('passwordBatch').value);
      var values = [];
      var verified = $('verify100').checked;
      if (verified && verificationLimitReason()) throw new Error(verificationLimitReason());
      for (var i = 0; i < batch; i++) {
        values.push(createGeneratedRecord(length, verified));
      }
      lastGenerated = values;
      renderGenerated(values);
      setText('generatorMessage', verified ? 'All ' + values.length + ' accepted result' + (values.length === 1 ? '' : 's') + ' were scored 100/100 by the shared analyzer. Securely generated in this tab only.' : 'Generated locally with crypto.getRandomValues(). Values are held only in this tab.');
      $('generatorMessage').classList.remove('error-hint');
      showToast(verified ? countLabel(values.length, '100/100 password') + ' generated and analyzer-verified' : countLabel(values.length, 'password') + ' generated with secure randomness');
      playSound();
    } catch (error) {
      setText('generatorMessage', error && error.message ? error.message : 'Password generation could not complete.');
      $('generatorMessage').classList.add('error-hint');
      showToast(error && error.message ? error.message : 'Password generation failed.', true);
    }
  }

  function regenerateGenerated(index) {
    if (!lastGenerated[index]) return;
    try {
      var record = createGeneratedRecord(Number($('passwordLength').value), $('verify100').checked);
      lastGenerated[index] = record;
      renderGenerated(lastGenerated);
      $('generatorMessage').classList.remove('error-hint');
      showToast('Result regenerated and rescored');
    } catch (error) {
      setText('generatorMessage', error && error.message ? error.message : 'Could not regenerate this password.');
      $('generatorMessage').classList.add('error-hint');
      showToast(error && error.message ? error.message : 'Could not regenerate this password.', true);
    }
  }

  function renderPhrases(records) {
    var root = $('phraseResults');
    root.innerHTML = '';
    records.forEach(function (record, index) {
      var card = document.createElement('div'); card.className = 'phrase-result-card';
      var value = document.createElement('div'); value.className = 'phrase-result-value'; value.textContent = record.phrase;
      var meta = document.createElement('div'); meta.className = 'phrase-result-meta';
      var entropy = document.createElement('span'); entropy.textContent = 'Word-list estimate: ' + record.entropy.toFixed(1) + ' bits';
      var score = document.createElement('span'); score.textContent = 'Analyzer: ' + record.analysis.score + '/100 · ' + record.analysis.label;
      meta.appendChild(entropy); meta.appendChild(score);
      var actions = document.createElement('div'); actions.className = 'phrase-result-actions';
      [['Copy', 'data-phrase-copy', 'Copy passphrase ', 'copy'], ['Analyze', 'data-phrase-analyze', 'Analyze passphrase ', 'scan-search']].forEach(function (entry) {
        var button = document.createElement('button'); button.type = 'button'; button.className = 'mini-action';
        appendIconLabel(button, entry[3], entry[0]); button.setAttribute(entry[1], String(index)); button.setAttribute('aria-label', entry[2] + (index + 1)); actions.appendChild(button);
      });
      card.appendChild(value); card.appendChild(meta); card.appendChild(actions); root.appendChild(card);
    });
    if (records.length > 1) {
      var copyAll = document.createElement('button'); copyAll.type = 'button'; copyAll.className = 'button button-outline batch-copy';
      copyAll.id = 'copyAllPhrases'; appendIconLabel(copyAll, 'copy', 'Copy all ' + records.length); root.appendChild(copyAll);
    }
  }

  function generatePassphrase() {
    try {
      var wordCount = Number($('wordCount').value);
      var separatorChoice = $('phraseSeparator').value;
      var separator = separatorChoice === 'custom' ? $('customSeparator').value : separatorChoice;
      if (separatorChoice === 'custom' && !separator) separator = '+';
      var batch = Number($('phraseBatch').value);
      var records = [];
      for (var itemIndex = 0; itemIndex < batch; itemIndex++) {
        var words = [];
        for (var i = 0; i < wordCount; i++) {
          var word = WORDLIST[randomInt(WORDLIST.length)];
          if ($('phraseCaps').checked) word = word.charAt(0).toUpperCase() + word.slice(1);
          words.push(word);
        }
        var phrase = words.join(separator);
        var extraBits = 0;
        if ($('phraseNumbers').checked) {
          phrase += separator + String(randomInt(100)).padStart(2, '0');
          extraBits = Math.log2(100);
        }
        records.push({ phrase: phrase, entropy: wordCount * Math.log2(WORDLIST.length) + extraBits, analysis: analyzePassword(phrase) });
      }
      lastPhrases = records;
      renderPhrases(records);
      showToast(countLabel(records.length, 'passphrase') + ' generated with secure randomness');
      playSound();
    } catch (error) {
      showToast(error && error.message ? error.message : 'Passphrase generation failed.', true);
    }
  }

  function analyzeCandidate(password) {
    navigate('dashboard', { preserveStudio: true });
    clearGeneratorResults();
    $('passwordInput').value = password;
    $('passwordInput').type = 'password';
    renderAnalysis(password);
    $('passwordInput').focus();
  }

  function makeCompareCard(label, analysis, rate) {
    var card = document.createElement('article'); card.className = 'panel compare-card';
    var heading = document.createElement('h2');
    var title = document.createElement('span'); title.textContent = label;
    var score = document.createElement('strong'); score.className = 'compare-score'; score.textContent = analysis.score + '/100';
    heading.appendChild(title); heading.appendChild(score); card.appendChild(heading);
    var strength = document.createElement('div'); strength.className = 'compare-strength'; strength.textContent = analysis.label; card.appendChild(strength);
    var stats = document.createElement('div'); stats.className = 'compare-stats';
    [
      ['Length', analysis.length + ' code points'],
      ['Entropy', analysis.effectiveEntropy.toFixed(1) + ' bits'],
      ['Same pace', timeForRate(analysis, rate)]
    ].forEach(function (item) {
      var stat = document.createElement('div'); stat.className = 'compare-stat';
      var small = document.createElement('small'); small.textContent = item[0];
      var strong = document.createElement('strong'); strong.textContent = item[1];
      stat.appendChild(small); stat.appendChild(strong); stats.appendChild(stat);
    });
    card.appendChild(stats);
    var comp = document.createElement('p'); comp.className = 'form-hint';
    comp.textContent = 'Composition: ' + analysis.counts.lower + ' lower · ' + analysis.counts.upper + ' upper · ' + analysis.counts.digits + ' numbers · ' + analysis.counts.symbols + ' symbols/other';
    card.appendChild(comp);
    var title2 = document.createElement('strong'); title2.textContent = 'Findings'; card.appendChild(title2);
    var list = document.createElement('ul');
    if (!analysis.risks.length) {
      var none = document.createElement('li'); none.textContent = 'No obvious heuristic patterns found.'; list.appendChild(none);
    } else {
      analysis.risks.slice(0, 5).forEach(function (item) { var li = document.createElement('li'); li.textContent = item.title; list.appendChild(li); });
    }
    card.appendChild(list);
    return card;
  }

  function comparePasswords() {
    var valueA = $('compareA').value, valueB = $('compareB').value;
    if (!valueA || !valueB) {
      showToast('Enter both candidates to compare them.', true);
      return;
    }
    var analysisA = analyzePassword(valueA), analysisB = analyzePassword(valueB);
    var rate = selectedCustomRate();
    var root = $('compareResults');
    var cardA = makeCompareCard('Candidate A', analysisA, rate);
    var cardB = makeCompareCard('Candidate B', analysisB, rate);
    cardA.id = 'compareCardA'; cardB.id = 'compareCardB';
    $('compareCardA').replaceWith(cardA);
    $('compareCardB').replaceWith(cardB);
    var higher = analysisA.score === analysisB.score ? 'Both candidates received the same score.' : (analysisA.score > analysisB.score ? 'Candidate A scored higher in this heuristic comparison.' : 'Candidate B scored higher in this heuristic comparison.');
    var gap = Math.abs(analysisA.score - analysisB.score);
    $('comparisonTakeaway').innerHTML = '<strong>' + escapeHtml(higher) + '</strong><p>Score difference: ' + gap + ' points. A relative score is not a security verdict. Both estimates use the same selected pace of ' + escapeHtml(formatRate(rate)) + ' guesses per second and remain illustrative.</p>';
    root.hidden = false; $('emptyCompare').hidden = true;
  }

  function getSimulationRate() {
    return [1000, 100000, 10000000, 1000000000][Number($('simSpeed').value) - 1] || 100000;
  }
  function updateSimulationRateNote() {
    setText('simRateNote', 'A fictional visual rate of ' + formatRate(getSimulationRate()) + ' guesses per simulated second.');
  }
  function formatCount(value) {
    if (value < 1000000) return formatNumber(value);
    if (value < 1e9) return (value / 1e6).toFixed(value < 1e7 ? 1 : 0) + 'M';
    if (value < 1e12) return (value / 1e9).toFixed(value < 1e10 ? 1 : 0) + 'B';
    return '10^' + log10(value).toFixed(2);
  }
  function formatElapsed(seconds) {
    var whole = Math.floor(seconds);
    var hours = Math.floor(whole / 3600);
    var minutes = Math.floor((whole % 3600) / 60);
    var secs = whole % 60;
    var pad = function (num) { return String(num).padStart(2, '0'); };
    return hours ? pad(hours) + ':' + pad(minutes) + ':' + pad(secs) : pad(minutes) + ':' + pad(secs);
  }
  function writeTerminalLine(text, className) {
    var root = $('terminalBody');
    var line = document.createElement('div'); line.className = 'terminal-line' + (className ? ' ' + className : '');
    line.textContent = text; root.appendChild(line);
    while (root.children.length > 42) root.removeChild(root.firstChild);
    root.scrollTop = root.scrollHeight;
  }
  function updateSimulatorUI() {
    setText('simCount', formatCount(simCount));
    setText('simElapsed', formatElapsed(simElapsed));
    var progress = (simCount % 1000000) / 1000000 * 100;
    $('simProgress').style.width = progress.toFixed(2) + '%';
    setText('simProgressLabel', Math.floor(progress) + '%');
    setText('simState', simState.toUpperCase());
    $('simState').classList.toggle('running', simState === 'running');
    updateSimulatorButtons();
  }
  function updateSimulatorButtons() {
    $('simStart').disabled = simState === 'running' || simState === 'paused';
    $('simPause').disabled = simState !== 'running';
    $('simResume').disabled = simState !== 'paused';
    $('simStop').disabled = simState !== 'running' && simState !== 'paused';
  }
  function stopSimTimer() {
    if (simTimer) clearInterval(simTimer);
    simTimer = null;
  }
  function startSimulation(fresh) {
    if (fresh) {
      stopSimTimer();
      simCount = 0; simElapsed = 0; simTicks = 0; fakeCursor = 0;
      $('terminalBody').innerHTML = '';
      writeTerminalLine('> SecureCheck educational simulation ready', 'system-line');
      writeTerminalLine('> Fictional strings only; no password is read or tested.', 'system-line');
    }
    simState = 'running';
    writeTerminalLine('> Simulation running at ' + formatRate(getSimulationRate()) + ' fictional guesses/sec', 'system-line');
    simTimer = setInterval(function () {
      simTicks++;
      simCount += getSimulationRate() / 4;
      simElapsed += 0.25;
      if (simTicks % 2 === 0) {
        var sample = fakeGuesses[fakeCursor % fakeGuesses.length];
        fakeCursor++;
        writeTerminalLine('[' + formatCount(simCount) + '] ' + sample, 'guess-line');
      }
      updateSimulatorUI();
    }, 250);
    updateSimulatorUI();
  }
  function pauseSimulation(leavingPage) {
    if (simState !== 'running') return;
    stopSimTimer(); simState = 'paused';
    writeTerminalLine(leavingPage ? '> Paused while you viewed another section.' : '> Paused by user.', 'system-line');
    updateSimulatorUI();
  }
  function resumeSimulation() {
    if (simState !== 'paused') return;
    simState = 'running';
    writeTerminalLine('> Resumed visual demonstration.', 'system-line');
    simTimer = setInterval(function () {
      simTicks++;
      simCount += getSimulationRate() / 4;
      simElapsed += 0.25;
      if (simTicks % 2 === 0) {
        var sample = fakeGuesses[fakeCursor % fakeGuesses.length];
        fakeCursor++;
        writeTerminalLine('[' + formatCount(simCount) + '] ' + sample, 'guess-line');
      }
      updateSimulatorUI();
    }, 250);
    updateSimulatorUI();
  }
  function stopSimulation() {
    stopSimTimer(); simState = 'stopped';
    writeTerminalLine('> Stopped. Restart resets this visual counter.', 'system-line');
    updateSimulatorUI();
  }

  function updateChecklist() {
    var boxes = all('#securityChecklist input[type=\"checkbox\"]');
    var checked = boxes.filter(function (box) { return box.checked; }).length;
    $('checklistMeter').style.width = (checked / boxes.length * 100) + '%';
    setText('checklistProgress', checked + ' of ' + boxes.length + ' complete');
  }

  function labMixedSample(length, mix, variant) {
    var fixtures = {
      lower: ['qmvkzbtfphwdnrxjgasuyeloc', 'tzfjqmpwckxvnsyrbhalugdeo'],
      'lower-digits': ['q7m4v2k9z5b8t3f6p1h0wxdjgcyaes', 't4z9f2j7q5m8v1p6w0c3kxdnbyrghae'],
      all: ['q7!Mv4#Z2@k9$W5%t8^R3&x6*P1?', 'v3$Q8@r2!N7#k5^B9%t4&X1*']
    };
    if (variant === 'repeated') return 'ab'.repeat(Math.ceil(length / 2)).slice(0, length);
    if (variant === 'sequence') return 'qwerty123456'.repeat(Math.ceil(length / 12)).slice(0, length);
    if (variant === 'dictionary') return 'Garden2026!'.repeat(Math.ceil(length / 11)).slice(0, length);
    var source = (fixtures[mix] || fixtures.all)[variant === 'alternate' ? 1 : 0];
    return source.repeat(Math.ceil(length / source.length)).slice(0, length);
  }

  function createLabCard(title, note, sample, analysis, rate) {
    var card = document.createElement('article'); card.className = 'lab-result-card';
    var head = document.createElement('div'); head.className = 'lab-result-head';
    var name = document.createElement('strong'); name.textContent = title;
    var tag = document.createElement('span'); tag.textContent = note;
    head.appendChild(name); head.appendChild(tag); card.appendChild(head);
    var fixture = document.createElement('code'); fixture.className = 'lab-fake-sample'; fixture.textContent = sample; fixture.setAttribute('aria-label', 'Fictional sample string');
    card.appendChild(fixture);
    var scoreRow = document.createElement('div'); scoreRow.className = 'lab-score-row';
    var score = document.createElement('strong'); score.textContent = analysis.score + '/100';
    var strength = document.createElement('span'); strength.textContent = analysis.label;
    scoreRow.appendChild(score); scoreRow.appendChild(strength); card.appendChild(scoreRow);
    var track = document.createElement('div'); track.className = 'lab-bar-track';
    var fill = document.createElement('i'); fill.style.width = analysis.score + '%'; track.appendChild(fill); card.appendChild(track);
    var stats = document.createElement('div'); stats.className = 'lab-stat-row';
    [['Length', analysis.length + ' code points'], ['Entropy lens', analysis.effectiveEntropy.toFixed(1) + ' bits'], ['At this pace', timeForRate(analysis, rate)], ['Pattern flags', String(analysis.risks.length)]].forEach(function (item) {
      var stat = document.createElement('div'); stat.className = 'lab-stat';
      var small = document.createElement('small'); small.textContent = item[0];
      var strong = document.createElement('strong'); strong.textContent = item[1];
      stat.appendChild(small); stat.appendChild(strong); stats.appendChild(stat);
    });
    card.appendChild(stats);
    var flags = document.createElement('p'); flags.className = 'form-hint';
    flags.textContent = analysis.risks.length ? analysis.risks.slice(0, 2).map(function (item) { return item.title; }).join(' · ') : 'No obvious pattern flags in this example.';
    card.appendChild(flags);
    return card;
  }

  function updateLab() {
    if (!$('labCards')) return;
    var length = Number($('labLength').value);
    var mix = $('labMix').value;
    var selectedPattern = $('labPattern').value;
    var rate = Number($('labRate').value) || 10000;
    setText('labLengthValue', length + ' code points');
    var mixed = labMixedSample(length, mix, 'mixed');
    var patterned = labMixedSample(length, mix, selectedPattern === 'mixed' ? 'alternate' : selectedPattern);
    var mixedAnalysis = analyzePassword(mixed);
    var patternedAnalysis = analyzePassword(patterned);
    var cards = $('labCards'); cards.innerHTML = '';
    cards.appendChild(createLabCard('Random-like fixture', mix === 'all' ? 'POOL ≈ 94' : (mix === 'lower' ? 'POOL = 26' : 'POOL = 36'), mixed, mixedAnalysis, rate));
    cards.appendChild(createLabCard(selectedPattern === 'mixed' ? 'Alternate fixture' : 'Pattern fixture', selectedPattern === 'mixed' ? 'FIXED SAMPLE' : selectedPattern.toUpperCase(), patterned, patternedAnalysis, rate));
    var insight = $('labInsight');
    if (selectedPattern === 'mixed') {
      insight.innerHTML = '<strong>Compare the fixture scores.</strong> Both samples are fixed shuffled-looking examples. The actual randomness of a real password depends on how it was created.';
    } else {
      var delta = mixedAnalysis.score - patternedAnalysis.score;
      insight.innerHTML = '<strong>' + (delta > 0 ? 'The random-like fixture scored ' + delta + ' points higher.' : 'The scores are close in this run.') + '</strong> ' + escapeHtml(patternedAnalysis.risks.length ? patternedAnalysis.risks[0].detail : 'This pattern did not trigger a high-priority warning in the local checks.') + ' A longer predictable string can still be easier to guess.';
    }
    var ramp = $('lengthRamp'); ramp.innerHTML = '';
    [6, 10, 14, 20, 28].forEach(function (rampLength) {
      var sample = labMixedSample(rampLength, mix, 'mixed');
      var result = analyzePassword(sample);
      var step = document.createElement('div'); step.className = 'ramp-step';
      var value = document.createElement('strong'); value.textContent = result.score + '/100';
      var bar = document.createElement('i'); bar.className = 'ramp-bar'; bar.style.height = Math.max(4, result.score * 0.72) + 'px'; bar.setAttribute('aria-label', 'Fictional length ' + rampLength + ': score ' + result.score);
      var label = document.createElement('small'); label.textContent = rampLength + ' chars';
      step.appendChild(value); step.appendChild(bar); step.appendChild(label); ramp.appendChild(step);
    });
  }

  function renderChallengeRound() {
    var rounds = [
      { a: 'Summer2025!', b: 'n8#Q2vR5!mK' },
      { a: 'qwerty123456', b: 'R4@kN7!pX2#v' },
      { a: 'abababababab', b: 'f3$W8mQ1#tL6' },
      { a: 'Welcome2026!', b: '7x!K3v#Q9mR2' }
    ];
    challengeRoundIndex = (challengeRoundIndex + 1) % rounds.length;
    challengeRound = rounds[challengeRoundIndex];
    setText('challengeSampleA', challengeRound.a);
    setText('challengeSampleB', challengeRound.b);
    setText('challengeScoreA', 'Score hidden until you choose');
    setText('challengeScoreB', 'Score hidden until you choose');
    setText('challengeFeedback', 'Select A or B to see which patterns affected the score.');
    ['challengeChoiceA', 'challengeChoiceB'].forEach(function (id) {
      $(id).classList.remove('is-selected', 'is-best');
      $(id).setAttribute('aria-pressed', 'false');
    });
  }

  function answerChallenge(choice) {
    if (!challengeRound) return;
    var analysisA = analyzePassword(challengeRound.a);
    var analysisB = analyzePassword(challengeRound.b);
    var better = analysisA.score === analysisB.score ? 'tie' : (analysisA.score > analysisB.score ? 'A' : 'B');
    setText('challengeScoreA', analysisA.score + '/100 · ' + analysisA.label);
    setText('challengeScoreB', analysisB.score + '/100 · ' + analysisB.label);
    $('challengeChoiceA').classList.toggle('is-selected', choice === 'A');
    $('challengeChoiceB').classList.toggle('is-selected', choice === 'B');
    $('challengeChoiceA').classList.toggle('is-best', better === 'A' || better === 'tie');
    $('challengeChoiceB').classList.toggle('is-best', better === 'B' || better === 'tie');
    $('challengeChoiceA').setAttribute('aria-pressed', String(choice === 'A'));
    $('challengeChoiceB').setAttribute('aria-pressed', String(choice === 'B'));
    if (better === 'tie') {
      setText('challengeFeedback', 'Both examples score ' + analysisA.score + '/100 in this model. Try another round to spot a clearer pattern difference.');
      return;
    }
    var wasCorrect = choice === better;
    var difference = Math.abs(analysisA.score - analysisB.score);
    var bestAnalysis = better === 'A' ? analysisA : analysisB;
    var lowerAnalysis = better === 'A' ? analysisB : analysisA;
    var patterns = lowerAnalysis.risks.slice(0, 2).map(function (item) { return item.title; });
    var explanation = patterns.length ? 'Pattern flags on the lower-scoring example: ' + patterns.join(' · ') + '.' : 'The difference comes from this model’s length, variety, and distribution checks.';
    setText('challengeFeedback', (wasCorrect ? 'Correct' : 'Not quite') + '. ' + better + ' scored higher (' + bestAnalysis.score + '/100 vs. ' + (better === 'A' ? analysisB.score : analysisA.score) + '/100, a ' + difference + '-point difference). ' + explanation);
  }

  function setTheme(theme) {
    settings.theme = theme;
    saveSettings(); applySettings();
    $('themeQuick').title = 'Switch between dark and light themes';
  }
  function syncDefaultSpeed(value) {
    settings.defaultSpeed = value;
    settings.customSpeed = $('defaultCustomSpeed').value || settings.customSpeed;
    saveSettings(); applySettings();
  }

  function filterSettings() {
    var query = $('settingsSearch').value.trim().toLowerCase();
    var visibleCount = 0;
    all('.settings-section').forEach(function (section) {
      var sectionMatches = 0;
      all('.setting-row', section).forEach(function (row) {
        var match = !query || row.textContent.toLowerCase().indexOf(query) >= 0;
        row.hidden = !match;
        if (match) sectionMatches++;
      });
      all('.theme-option', section).forEach(function (option) {
        var themeGroupMatch = query && section.querySelector('#themeGrid') && /theme|appearance|palette|color/.test(query);
        var match = !query || themeGroupMatch || option.textContent.toLowerCase().indexOf(query) >= 0;
        option.hidden = !match;
        if (match) sectionMatches++;
      });
      section.hidden = sectionMatches === 0;
      visibleCount += sectionMatches;
    });
    $('settingsSearchEmpty').hidden = visibleCount > 0;
  }

  function openCommandMenu() {
    if (!$('commandDialog').open) $('commandDialog').showModal();
    $('commandSearch').value = '';
    filterCommands();
    $('commandSearch').focus();
  }

  function filterCommands() {
    var query = $('commandSearch').value.trim().toLowerCase();
    all('#commandList button').forEach(function (button) {
      button.hidden = query && button.textContent.toLowerCase().indexOf(query) < 0;
    });
  }

  function wireEvents() {
    all('[data-page]').forEach(function (button) {
      button.addEventListener('click', function () { navigate(button.getAttribute('data-page')); });
    });
    all('[data-page-link]').forEach(function (link) {
      link.addEventListener('click', function (event) { event.preventDefault(); navigate(link.getAttribute('data-page-link')); });
    });
    all('[data-goto]').forEach(function (button) {
      button.addEventListener('click', function () { navigate(button.getAttribute('data-goto')); });
    });
    $('menuToggle').addEventListener('click', function () {
      var open = !$('sidebar').classList.contains('open');
      $('sidebar').classList.toggle('open', open); $('mobileScrim').classList.toggle('open', open);
      $('menuToggle').setAttribute('aria-expanded', String(open));
      $('menuToggle').setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
    });
    $('mobileScrim').addEventListener('click', closeMobileNav);
    $('themeQuick').addEventListener('click', function () {
      var isLight = settings.theme === 'arctic-light' || settings.theme === 'minimalist';
      if (!isLight) priorDarkTheme = settings.theme;
      setTheme(isLight ? priorDarkTheme : 'arctic-light');
    });
    $('commandOpen').addEventListener('click', openCommandMenu);
    $('commandClose').addEventListener('click', function () { $('commandDialog').close(); });
    $('commandSearch').addEventListener('input', filterCommands);
    $('commandDialog').addEventListener('click', function (event) { if (event.target === $('commandDialog')) $('commandDialog').close(); });
    $('commandList').addEventListener('click', function (event) {
      var button = event.target.closest('[data-command-page]');
      if (button && !button.hidden) navigate(button.getAttribute('data-command-page'));
    });
    document.addEventListener('keydown', function (event) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault(); openCommandMenu();
      }
    });

    $('passwordInput').addEventListener('input', function () {
      renderAnalysis($('passwordInput').value);
      if (currentAnalysis) scheduleHistory(currentAnalysis);
      if ($('passwordInput').type === 'text') armRevealTimer($('passwordInput'), $('togglePassword'), 'Show password', 'Hide password');
    });
    $('togglePassword').addEventListener('click', function () {
      setFieldVisibility($('passwordInput'), $('togglePassword'), 'Show password', 'Hide password');
    });
    $('copyPassword').addEventListener('click', function () {
      if ($('passwordInput').value) copyText($('passwordInput').value, 'Password copied by your request');
    });
    $('clearPassword').addEventListener('click', clearAnalyzer);
    $('pacePreset').addEventListener('change', function () {
      settings.defaultSpeed = $('pacePreset').value;
      $('customSpeedWrap').hidden = settings.defaultSpeed !== 'custom';
      settings.customSpeed = $('customSpeed').value || settings.customSpeed;
      saveSettings(); applySettings(); updateScenarioTable();
    });
    $('customSpeed').addEventListener('input', function () {
      if (Number($('customSpeed').value) > 0) {
        settings.customSpeed = $('customSpeed').value;
        $('defaultCustomSpeed').value = settings.customSpeed;
        saveSettings(); updateScenarioTable();
      }
    });
    $('copyReport').addEventListener('click', function () { copyText(reportText(), 'Password-free report copied'); });
    $('exportTxt').addEventListener('click', function () { downloadFile('securecheck-report.txt', 'text/plain;charset=utf-8', reportText()); });
    $('exportJson').addEventListener('click', function () { downloadFile('securecheck-report.json', 'application/json;charset=utf-8', JSON.stringify(reportObject(), null, 2)); });
    $('clearHistory').addEventListener('click', function () { historyItems = []; clearTimeout(historyTimer); renderHistory(); showToast('Session history cleared'); });

    $('passwordLength').addEventListener('input', function () { setText('passwordLengthValue', $('passwordLength').value); markPasswordSettingsCustom(); });
    $('passwordPreset').addEventListener('change', function () { applyPasswordPreset($('passwordPreset').value); });
    ['includeUpper', 'includeLower', 'includeNumbers', 'includeSymbols', 'excludeAmbiguous'].forEach(function (id) {
      $(id).addEventListener('change', markPasswordSettingsCustom);
    });
    $('customChars').addEventListener('input', markPasswordSettingsCustom);
    $('verify100').addEventListener('change', updateVerificationUI);
    $('wordCount').addEventListener('input', function () { setText('wordCountValue', $('wordCount').value + ' words'); });
    $('phraseSeparator').addEventListener('change', function () { $('customSeparatorWrap').hidden = $('phraseSeparator').value !== 'custom'; });
    $('generatePasswords').addEventListener('click', generatePasswords);
    $('generatedPasswords').addEventListener('click', function (event) {
      var copyButton = event.target.closest('[data-copy-index]');
      var analyzeButton = event.target.closest('[data-analyze-index]');
      var regenerateButton = event.target.closest('[data-regenerate-index]');
      if (copyButton) {
        var copyRecord = lastGenerated[Number(copyButton.getAttribute('data-copy-index'))];
        if (copyRecord) copyText(copyRecord.password, 'Generated password copied');
      } else if (analyzeButton) {
        var analyzeRecord = lastGenerated[Number(analyzeButton.getAttribute('data-analyze-index'))];
        if (analyzeRecord) analyzeCandidate(analyzeRecord.password);
      } else if (regenerateButton) {
        regenerateGenerated(Number(regenerateButton.getAttribute('data-regenerate-index')));
      } else if (event.target.id === 'copyAllGenerated') {
        if (lastGenerated.length) copyText(lastGenerated.map(function (record) { return record.password; }).join('\n'), 'All generated passwords copied');
      }
    });
    $('wordCount').addEventListener('input', function () { setText('wordCountValue', $('wordCount').value + ' words'); });
    $('phraseResults').addEventListener('click', function (event) {
      var copyButton = event.target.closest('[data-phrase-copy]');
      var analyzeButton = event.target.closest('[data-phrase-analyze]');
      if (copyButton) {
        var record = lastPhrases[Number(copyButton.getAttribute('data-phrase-copy'))];
        if (record) copyText(record.phrase, 'Passphrase copied');
      } else if (analyzeButton) {
        var analyzeRecord = lastPhrases[Number(analyzeButton.getAttribute('data-phrase-analyze'))];
        if (analyzeRecord) analyzeCandidate(analyzeRecord.phrase);
      } else if (event.target.id === 'copyAllPhrases') {
        if (lastPhrases.length) copyText(lastPhrases.map(function (record) { return record.phrase; }).join('\n'), 'All passphrases copied');
      }
    });
    $('generatePhrase').addEventListener('click', generatePassphrase);

    all('.compare-reveal').forEach(function (button) {
      button.addEventListener('click', function () {
        var input = $(button.getAttribute('data-target'));
        var candidate = input.id === 'compareA' ? 'A' : 'B';
        setFieldVisibility(input, button, 'Show candidate ' + candidate, 'Hide candidate ' + candidate);
      });
    });
    $('compareButton').addEventListener('click', comparePasswords);
    ['compareA', 'compareB'].forEach(function (id) {
      $(id).addEventListener('input', function () {
        $('compareResults').hidden = true; $('emptyCompare').hidden = false;
        if ($(id).type === 'text') {
          var candidate = id === 'compareA' ? 'A' : 'B';
          var button = document.querySelector('.compare-reveal[data-target="' + id + '"]');
          armRevealTimer($(id), button, 'Show candidate ' + candidate, 'Hide candidate ' + candidate);
        }
      });
    });

    $('simSpeed').addEventListener('change', updateSimulationRateNote);
    $('simStart').addEventListener('click', function () { startSimulation(true); });
    $('simPause').addEventListener('click', function () { pauseSimulation(false); });
    $('simResume').addEventListener('click', resumeSimulation);
    $('simStop').addEventListener('click', stopSimulation);
    $('simRestart').addEventListener('click', function () { startSimulation(true); });
    $('labLength').addEventListener('input', updateLab);
    $('labMix').addEventListener('change', updateLab);
    $('labPattern').addEventListener('change', updateLab);
    $('labRate').addEventListener('change', updateLab);
    $('runLab').addEventListener('click', function () { updateLab(); showToast('Fictional experiment recalculated'); });
    $('newChallenge').addEventListener('click', renderChallengeRound);
    $('challengeChoiceA').addEventListener('click', function () { answerChallenge('A'); });
    $('challengeChoiceB').addEventListener('click', function () { answerChallenge('B'); });

    $('glossarySearch').addEventListener('input', function () { renderGlossary($('glossarySearch').value); });
    $('clearGlossary').addEventListener('click', function () { $('glossarySearch').value = ''; renderGlossary(''); $('glossarySearch').focus(); });
    all('#securityChecklist input[type=\"checkbox\"]').forEach(function (box) { box.addEventListener('change', updateChecklist); });
    $('resetChecklist').addEventListener('click', function () {
      all('#securityChecklist input[type=\"checkbox\"]').forEach(function (box) { box.checked = false; });
      updateChecklist(); showToast('Checklist reset');
    });

    $('themeSelect').addEventListener('change', function () { setTheme($('themeSelect').value); });
    all('[data-theme-pick]').forEach(function (button) {
      button.addEventListener('click', function () { setTheme(button.getAttribute('data-theme-pick')); });
    });
    $('accentSelect').addEventListener('change', function () { settings.accent = $('accentSelect').value; saveSettings(); applySettings(); });
    $('customAccent').addEventListener('input', function () {
      settings.customAccent = $('customAccent').value;
      saveSettings();
      if (settings.accent === 'custom') applyAppearance();
    });
    $('densitySelect').addEventListener('change', function () { settings.density = $('densitySelect').value; saveSettings(); applySettings(); });
    $('settingsSearch').addEventListener('input', filterSettings);
    $('reduceMotion').addEventListener('change', function () { settings.reduceMotion = $('reduceMotion').checked; saveSettings(); applySettings(); });
    $('autoHideReveal').addEventListener('change', function () {
      settings.autoHideReveal = $('autoHideReveal').checked;
      saveSettings();
      var fields = [
        [$('passwordInput'), $('togglePassword'), 'Show password', 'Hide password'],
        [$('compareA'), document.querySelector('.compare-reveal[data-target="compareA"]'), 'Show candidate A', 'Hide candidate A'],
        [$('compareB'), document.querySelector('.compare-reveal[data-target="compareB"]'), 'Show candidate B', 'Hide candidate B']
      ];
      fields.forEach(function (item) { armRevealTimer(item[0], item[1], item[2], item[3]); });
    });
    $('soundToggle').addEventListener('change', function () { settings.sound = $('soundToggle').checked; saveSettings(); });
    $('showEstimates').addEventListener('change', function () { settings.showEstimates = $('showEstimates').checked; saveSettings(); applySettings(); });
    $('showAdvanced').addEventListener('change', function () { settings.showAdvanced = $('showAdvanced').checked; saveSettings(); applySettings(); });
    $('historyToggle').addEventListener('change', function () {
      settings.historyEnabled = $('historyToggle').checked;
      if (!settings.historyEnabled) { historyItems = []; clearTimeout(historyTimer); }
      saveSettings(); applySettings();
    });
    $('defaultSpeedPreset').addEventListener('change', function () { syncDefaultSpeed($('defaultSpeedPreset').value); });
    $('defaultCustomSpeed').addEventListener('input', function () {
      var value = Number($('defaultCustomSpeed').value);
      if (value > 0) {
        settings.customSpeed = $('defaultCustomSpeed').value;
        $('customSpeed').value = settings.customSpeed;
        saveSettings(); updateScenarioTable();
      }
    });
    $('settingsClearHistory').addEventListener('click', function () { historyItems = []; clearTimeout(historyTimer); renderHistory(); showToast('Session history cleared'); });
    $('resetSettings').addEventListener('click', function () {
      settings = Object.assign({}, defaults);
      try { localStorage.removeItem(STORAGE_KEY); } catch (_) { /* Ignore unavailable storage. */ }
      historyItems = []; clearTimeout(historyTimer); applySettings(); renderAnalysis($('passwordInput').value);
      showToast('Settings restored to defaults');
    });
  }

  function init() {
    wireEvents();
    applySettings();
    renderAnalysis('');
    renderGlossary('');
    updateChecklist();
    updateSimulationRateNote();
    updateSimulatorUI();
    renderChallengeRound();
    $('themeQuick').title = 'Switch between dark and light themes';
    window.addEventListener('beforeunload', function () {
      stopSimTimer();
      $('passwordInput').value = '';
      $('compareA').value = ''; $('compareB').value = '';
    });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) hideAllRevealedFields();
      if (document.hidden && simState === 'running') pauseSimulation(true);
    });
  }

  init();
}());

