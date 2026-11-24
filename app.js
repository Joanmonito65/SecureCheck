(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };
  var all = function (selector, root) { return Array.prototype.slice.call((root || document).querySelectorAll(selector)); };
  var STORAGE_KEY = 'securecheck.preferences.v1';
  var categories = [
    { key: 'lower', label: 'Lowercase', color: 'var(--accent)' },
    { key: 'upper', label: 'Uppercase', color: 'var(--blue)' },
    { key: 'digits', label: 'Numbers', color: 'var(--purple)' },
    { key: 'symbols', label: 'Symbols', color: 'var(--amber)' },
    { key: 'whitespace', label: 'Whitespace', color: 'var(--teal)' }
  ];
  var COMMON = ('password password1 password123 passw0rd admin letmein welcome qwerty qwerty123 123456 12345678 123456789 1234567890 111111 abc123 iloveyou sunshine princess dragon monkey football baseball trustno1 master login secret shadow michael ashley 000000 654321 1q2w3e4r').split(' ');
  var DICTIONARY = ('password welcome monkey sunshine dragon football baseball princess letmein summer winter spring autumn flower garden cookie chocolate coffee secret freedom shadow master hello love angel star sunshine happy family purple silver orange tiger rabbit soccer hockey guitar laptop internet computer access security account admin guest money trust'.split(' '));
  var WORDLIST = ('amber anchor apple apron arcade arrow artist atlas autumn badge bamboo banner basil beacon berry bicycle biscuit blanket blossom bluebird breeze bright brook bubble cactus cabin cable candle canyon captain caraway carpet castle cedar celery chalk charm cherry chestnut circle citadel citrus clover cobalt comet compass coral cosmos cotton coyote cranberry crystal daisy dancer daylight delta desert dinner dolphin dragonfly drift dune eagle earth echo elm ember emerald engine falcon family feather fern festival field fig filter finch firefly fisher flame flight flora forest fossil fountain foxglove galaxy garden garlic gentle glacier golden granite grape grass gravity green harbor hazel heart hedgehog hill honey horizon island ivory jasmine jelly juniper kettle key kingdom kiwi lagoon lantern lavender lemon library lilac lilypad linen lotus lunar maple marble meadow melon memory mercury midnight mint mirror misty mobile monarch mountain museum music mustard narwhal nectar nest nickel nightingale north nutmeg ocean olive opal orchard origami otter oyster panda paper parrot patch pebbles pepper phoenix piano picnic pine planet plum poetry polar popcorn prairie puzzle quartz queen quiet quilt rabbit radar rainbow raven recipe reef ribbon river robin rocket rosemary saffron sailboat salmon sandalwood sapphire satellite scarf seaglass shadow shell sherbet silver skylark skyward snowfall soccer sonata sparrow spice spiral spring spruce squirrel starfish starlight stone story strawberry summit sunflower sunset swan sweater swift tablet tangerine temple thistle thunder ticket timber toast tomato topaz tractor trail tulip tunnel twilight umbrella unicorn valley velvet village violet walnut wander whale willow window winter wizard woodland yarn yellow yoga zephyr zinc zipper').split(' ');
  var palette = ['var(--accent)', 'var(--blue)', 'var(--purple)', 'var(--amber)', 'var(--teal)'];
  var defaults = {
    theme: 'midnight-green', accent: 'auto', customAccent: '#79b8ff', density: 'comfortable',
    reduceMotion: false, autoHideReveal: true, sound: false,
    showEstimates: true, showAdvanced: true, historyEnabled: false,
    defaultSpeed: '10000', customSpeed: '1000', customSpeedUnit: 'sec'
  };
  if (window.matchMedia) defaults.reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var settings = readSettings();
  var currentPage = 'dashboard';
  var priorDarkTheme = ['arctic-light', 'minimalist', 'solarized-light'].indexOf(settings.theme) < 0 ? settings.theme : 'midnight-green';
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
      if (['midnight-green', 'midnight-blue', 'cyber-purple', 'crimson-security', 'arctic-light', 'oled-black', 'graphite', 'emerald', 'cyberpunk', 'minimalist', 'deep-ocean', 'solarized-light', 'monochrome', 'neon-blue', 'forest'].indexOf(result.theme) < 0) result.theme = 'midnight-green';
      if (['auto', 'lime', 'blue', 'violet', 'cyan', 'custom'].indexOf(result.accent) < 0) result.accent = 'auto';
      if (!/^#[0-9a-f]{6}$/i.test(result.customAccent)) result.customAccent = defaults.customAccent;
      if (['comfortable', 'compact', 'spacious'].indexOf(result.density) < 0) result.density = 'comfortable';
      if (['sec', 'min', 'hour'].indexOf(result.customSpeedUnit) < 0) result.customSpeedUnit = 'sec';
      var validSpeedPresets = ['1000', '10000', '100000', '1000000', '10000000', '100000000', '1000000000', '10000000000', '100000000000', '1000000000000', '10000000000000', '100000000000000', '1000000000000000', 'custom'];
      if (validSpeedPresets.indexOf(result.defaultSpeed) < 0) result.defaultSpeed = '10000';
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
    if (['arctic-light', 'minimalist', 'solarized-light'].indexOf(settings.theme) < 0) priorDarkTheme = settings.theme;
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
    var isCustomPace = settings.defaultSpeed === 'custom';
    $('paceUnit').value = isCustomPace ? settings.customSpeedUnit : 'sec';
    $('customSpeed').value = isCustomPace ? settings.customSpeed : settings.defaultSpeed;
    $('customSpeedWrap').hidden = false;
    $('paceSlider').value = String(clamp(log10(Math.max(1000, selectedCustomRate())), 3, 15));
    setText('paceSliderValue', formatRate(selectedCustomRate()) + ' / sec');
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
    var words = DICTIONARY.concat(WORDLIST);
    for (var i = 0; i < words.length; i++) {
      var word = words[i];
      if (word.length >= 4 && normalized.indexOf(word) >= 0) return word;
    }
    return '';
  }
  function classifyChar(char) {
    if (/\s/u.test(char)) return 'whitespace';
    if (/\p{Ll}/u.test(char)) return 'lower';
    if (/\p{Lu}/u.test(char)) return 'upper';
    if (/\p{N}/u.test(char)) return 'digits';
    return 'symbols';
  }
  function utf8Length(value) {
    if (window.TextEncoder) return new TextEncoder().encode(value).length;
    return unescape(encodeURIComponent(value)).length;
  }
  function graphemeCount(value) {
    if (window.Intl && Intl.Segmenter) return Array.from(new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(value)).length;
    return safeCodePoints(value).length;
  }
  function analyzePassword(password, origin) {
    if (!password) return null;
    origin = origin || {};
    var chars = safeCodePoints(password);
    var length = chars.length;
    var counts = { lower: 0, upper: 0, digits: 0, symbols: 0, whitespace: 0 };
    var histogram = Object.create(null);
    var asciiCounts = { lower: 0, upper: 0, digits: 0, symbols: 0, whitespace: 0 };
    var nonAsciiChars = Object.create(null);
    var emojiCodePoints = 0;
    var emojiGraphemes = 0;
    var emojiPattern = /[\p{Extended_Pictographic}\p{Regional_Indicator}\u20e3]/u;
    chars.forEach(function (char) {
      var charKind = classifyChar(char);
      counts[charKind]++;
      if (char.codePointAt(0) <= 127) asciiCounts[charKind]++;
      histogram[char] = (histogram[char] || 0) + 1;
      if (char.codePointAt(0) > 127) nonAsciiChars[char] = true;
      if (emojiPattern.test(char)) emojiCodePoints++;
    });
    var unique = Object.keys(histogram).length;
    var unicodeCount = Object.keys(nonAsciiChars).length;
    var usedCategories = ['lower', 'upper', 'digits', 'symbols'].filter(function (key) { return counts[key] > 0; }).length;
    var categoryCount = Object.keys(counts).filter(function (key) { return counts[key] > 0; }).length;
    var emojiSegments = window.Intl && Intl.Segmenter ? Array.from(new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(password)) : [];
    if (emojiSegments.length) emojiGraphemes = emojiSegments.filter(function (segment) { return emojiPattern.test(segment.segment); }).length;
    else emojiGraphemes = emojiCodePoints;
    var asciiPool = (asciiCounts.lower ? 26 : 0) + (asciiCounts.upper ? 26 : 0) + (asciiCounts.digits ? 10 : 0) + (asciiCounts.symbols ? 32 : 0) + (asciiCounts.whitespace ? 5 : 0);
    var pool = Math.max(1, asciiPool + unicodeCount);
    var knownPool = Number(origin.poolSize);
    var hasKnownPool = (origin.origin === 'generated' || origin.origin === 'assumed-generated') && Number.isFinite(knownPool) && knownPool > 1;
    var rawEntropy = hasKnownPool
      ? length * Math.log2(knownPool)
      : length * Math.log2(pool);
    var entropyByCharacter = 0;
    Object.keys(histogram).forEach(function (char) {
      var probability = histogram[char] / Math.max(1, length);
      entropyByCharacter -= probability * Math.log2(probability);
    });
    var distributionRatio = unique > 1 ? clamp(entropyByCharacter / Math.log2(unique), 0, 1) : 0;
    var uniqueRatio = unique / Math.max(length, 1);
    var lowered = password.toLowerCase();
    var compact = lowered.replace(/[^a-z0-9]/g, '');
    var normalized = normalizeLeet(password).replace(/[^a-z0-9]/g, '');
    var repeated = repeatedUnit(lowered);
    var maxRepeat = 1;
    var currentRun = 1;
    var longestRepeatRun = 1;
    for (var ci = 0; ci < chars.length; ci++) {
      maxRepeat = Math.max(maxRepeat, histogram[chars[ci]]);
      currentRun = ci > 0 && chars[ci] === chars[ci - 1] ? currentRun + 1 : 1;
      longestRepeatRun = Math.max(longestRepeatRun, currentRun);
    }
    var sequenceLength = longestSequence(compact);
    var keyboardPatterns = ['qwerty', 'asdfgh', 'zxcvbn', 'qazwsx', '1qaz', '2wsx', 'qwertz', 'poiuy', 'lkjhg', 'mnbvc', '123456', '654321', '1q2w3e', 'zaq1'];
    var hasKeyboard = containsAny(normalized, keyboardPatterns);
    var normalizedCommon = COMMON.some(function (candidate) { return normalized.indexOf(candidate) >= 0; });
    var isCommon = COMMON.indexOf(compact) >= 0 || COMMON.indexOf(normalized) >= 0 || normalizedCommon;
    var dictionaryWord = hasDictionaryWord(password);
    var phraseTokens = (password.toLowerCase().match(/[a-z]+/g) || []);
    var localWords = DICTIONARY.concat(WORDLIST);
    var allDictionaryTokens = phraseTokens.length >= 2 && phraseTokens.every(function (token) { return localWords.indexOf(token) >= 0; });
    var passphraseSearchBits = allDictionaryTokens ? phraseTokens.length * Math.log2(WORDLIST.length) : 0;
    var normalizedHasWord = hasDictionaryWord(normalized);
    var hasSubstitution = normalized !== compact && Boolean(normalizedHasWord || normalizedCommon);
    var yearMatch = password.match(/(?:19|20)\d{2}/);
    var dateLike = /\d{8}/.test(password) || /(?:19|20)\d{6}/.test(password) || /(?:19|20)\d{2}[-/.]\d{1,2}(?:[-/.]\d{1,2})?/.test(password);
    var monthMatch = /(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)/i.test(password);
    var contactLike = /(?:\+?\d[\s().-]?){7,}/.test(password) || /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(password);
    var wordNumber = Boolean(dictionaryWord && /[0-9]/.test(password));
    var suffixPattern = /[0-9]{1,4}[!@#$%^&*._-]*$/.test(password);
    var commonAffix = /^(?:pass(?:word)?|admin|welcome|letmein|login|qwerty)|(?:123|1234|202[0-9]|!{1,3}|@{1,3})$/i.test(password);
    var predictableCapitalization = /^[A-Z][a-z]{3,}/.test(password) && Boolean(dictionaryWord);
    var whitespaceWords = password.trim().split(/\s+/).filter(Boolean);
    var passphraseLike = whitespaceWords.length >= 2 || (/[-_.]/.test(password) && (password.match(/[-_.]/g) || []).length >= 2 && Boolean(dictionaryWord));
    var patternFlags = [];
    var patternPenalties = Object.create(null);
    var modelLosses = Object.create(null);
    function addRisk(id, title, detail, severity, group, scoreLoss, modelLoss, recommendation) {
      patternFlags.push({
        id: id, title: title, detail: detail, severity: severity, group: group,
        scoreLoss: scoreLoss, modelLoss: modelLoss, recommendation: recommendation,
        guessingImpact: group === 'common' ? 'Common-password similarity is treated as an early candidate signal; the local model caps its search proxy.' :
          (group === 'repetition' ? 'Repeated structure is reflected once in the repetition factor, even if several related patterns appear.' :
          (group === 'distribution' ? 'This reduces the visible diversity indicator; the app does not assume each character was randomly selected.' :
          (modelLoss ? 'Counted once in the shared predictability factor; related flags are combined to limit double-counting.' : 'This is shown as a structural warning and does not create an additional score deduction.'))), kind: 'risk'
      });
      if (group !== 'repetition' && group !== 'distribution') {
        var factor = 'predictability';
        patternPenalties[factor] = Math.max(patternPenalties[factor] || 0, scoreLoss);
        modelLosses[factor] = Math.max(modelLosses[factor] || 0, modelLoss);
      }
    }
    var addGood = function (id, title, detail) {
      patternFlags.push({ id: id, title: title, detail: detail, severity: 'low', group: 'strength', scoreLoss: 0, modelLoss: 0, recommendation: '', kind: 'good' });
    };
    if (length < 12) addRisk('short-length', 'Short length', 'Short strings leave less room for unpredictable choices.', 'high', 'length', 0, 0, 'Use a longer unique password or a passphrase made from independently selected words.');
    else if (length >= 20) addGood('length', 'Strong length contribution', 'Length contributes fully to SecureCheck’s 100-point model at 20 code points.');
    else addGood('length', 'Useful length', 'More length helps when each character was chosen unpredictably.');
    if (longestRepeatRun >= 3) addRisk('repeat-run', 'Consecutive repeated characters', 'A run of identical characters is a pattern guessers can prioritize.', longestRepeatRun >= 5 ? 'high' : 'moderate', 'repetition', 0, 0, 'Replace repeated runs with independently generated characters.');
    if (repeated && repeated.count >= 2 && repeated.unit.length < length) addRisk('repeat-block', 'Repeated block', 'A shorter block repeats across the string, making many positions predictable.', repeated.count >= 3 ? 'high' : 'moderate', 'repetition', 0, 0, 'Avoid repeating a word, symbol group, or character block.');
    if (sequenceLength >= 3) addRisk('sequence', 'Sequential letters or numbers', 'An ascending or descending run is commonly tried early in structured guesses.', sequenceLength >= 5 ? 'high' : 'moderate', 'sequence', sequenceLength >= 5 ? 10 : 7, sequenceLength >= 5 ? 10 : 7, 'Replace the ordered run with unrelated randomly selected characters.');
    if (hasKeyboard) addRisk('keyboard', 'Keyboard walk', 'A familiar path across the keyboard is easier to model than independent character choices.', 'high', 'keyboard', 11, 11, 'Replace keyboard paths with a manager-generated password.');
    if (isCommon) addRisk('common', 'Common-password similarity', 'This matches or contains a locally curated common-password pattern; popular candidates are tried early.', 'critical', 'common', 25, 18, 'Do not use a common password or a simple variation of one.');
    if (dictionaryWord) addRisk('dictionary', 'Dictionary-like word', 'A familiar word or a simple substitution pattern appears in the string.', hasSubstitution ? 'high' : 'moderate', 'dictionary', hasSubstitution ? 9 : 7, hasSubstitution ? 12 : 9, 'Avoid recognizable words and cosmetic substitutions; use random characters or independently chosen passphrase words.');
    if (hasSubstitution) addRisk('substitution', 'Common character substitution', 'A letter-to-number or symbol swap was detected around a recognizable word; these swaps are predictable.', 'moderate', 'dictionary', 5, 6, 'Do not rely on replacing a few letters with lookalike numbers or symbols.');
    if (wordNumber) addRisk('word-number', 'Word followed by numbers', 'A familiar word combined with a numeric suffix follows a common human-created structure.', 'moderate', 'word-structure', 6, 7, 'Use independent random choices instead of adding a year or short number to a word.');
    if (dateLike || yearMatch || monthMatch) addRisk('date', monthMatch ? 'Month or date pattern' : 'Year or date pattern', 'Month names, years, and compact dates can be guessed as structured personal or calendar choices.', 'moderate', 'date', 7, 7, 'Avoid dates and month names, especially ones connected to you.');
    if (contactLike) addRisk('personal', 'Contact-like pattern', 'The string resembles phone or email data that may be personally associated with you.', 'moderate', 'personal', 6, 6, 'Do not include your own phone number, email address, or account identifiers.');
    if (suffixPattern) addRisk('suffix', 'Predictable numeric or punctuation ending', 'A short number and optional punctuation at the end is a common password construction pattern.', 'moderate', 'suffix', 5, 5, 'Avoid predictable suffixes; use an independently generated full string.');
    if (commonAffix) addRisk('common-affix', 'Common password prefix or suffix', 'A familiar opening or short conventional ending can make part of the string easier to prioritize.', 'moderate', 'affix', 5, 5, 'Avoid common openings and endings; choose the entire credential unpredictably.');
    if (predictableCapitalization) addRisk('capitalization', 'Predictable capitalization', 'An initial capital followed by a familiar lowercase word is a common pattern.', 'moderate', 'capitalization', 4, 4, 'Avoid relying on a capital letter at the start of a familiar word.');
    var unusualDistribution = length >= 8 && (uniqueRatio < 0.55 || distributionRatio < 0.55);
    if (unusualDistribution) addRisk('distribution', 'Uneven character distribution', 'Repeated characters or a narrow set of observed choices reduce variety in the visible string.', 'moderate', 'distribution', 0, 0, 'Favor independently generated choices with a broader distribution.');
    if (usedCategories >= 3) addGood('variety', 'Several character classes', 'Multiple character classes appear; this helps only when choices are not predictable.');
    if (uniqueRatio >= 0.85 && length >= 10) addGood('unique', 'Mostly distinct characters', 'Most code points are distinct, which is a useful distribution indicator.');
    if (passphraseLike) addGood('passphrase', 'Passphrase-like structure', 'Several word-like segments are present; strength depends on whether the words were selected independently and at random.');
    var lengthPoints = Math.min(30, length / 20 * 30);
    var diversityPoints = Math.min(10, usedCategories * 2.5) * clamp(length / 12, 0, 1);
    var randomnessPoints = 20 * (0.65 * uniqueRatio + 0.35 * distributionRatio) * clamp(length / 16, 0, 1);
    var patternPenalty = Object.keys(patternPenalties).reduce(function (sum, group) { return sum + patternPenalties[group]; }, 0);
    patternPenalty = Math.min(25, patternPenalty);
    var repetitionPenalty = repeated && repeated.count >= 2 ? 10 : (longestRepeatRun >= 5 ? 8 : (longestRepeatRun >= 3 ? 6 : (maxRepeat > 1 ? 2 : 0)));
    var commonPenalty = isCommon ? 5 : (normalizedCommon ? 4 : (dictionaryWord ? 2.5 : 0));
    var patternPoints = Math.max(0, 25 - patternPenalty);
    var repetitionPoints = Math.max(0, 10 - repetitionPenalty);
    var commonPoints = Math.max(0, 5 - commonPenalty);
    var score = Math.round(clamp(lengthPoints + diversityPoints + randomnessPoints + patternPoints + repetitionPoints + commonPoints, 0, 100));
    var totalModelLoss = Object.keys(modelLosses).reduce(function (sum, group) { return sum + modelLosses[group]; }, 0);
    totalModelLoss += repetitionPenalty * 0.8 + commonPenalty * 2;
    var guessabilityBits = Math.max(1, Math.min(rawEntropy, rawEntropy - totalModelLoss));
    if (isCommon) guessabilityBits = Math.min(guessabilityBits, 18);
    if (!hasKnownPool && allDictionaryTokens) guessabilityBits = Math.min(guessabilityBits, passphraseSearchBits);
    else if (!hasKnownPool && wordNumber) guessabilityBits = Math.min(guessabilityBits, Math.log2(WORDLIST.length) + Math.log2(10000) + 7);
    else if (!hasKnownPool && dictionaryWord) guessabilityBits = Math.min(guessabilityBits, Math.log2(WORDLIST.length) + 12);
    if (hasKnownPool) {
      guessabilityBits = Math.max(1, length * Math.log2(knownPool) - totalModelLoss);
    }
    var riskItems = patternFlags.filter(function (item) { return item.kind === 'risk'; });
    var confidence = origin.origin === 'generated' ? 'High for generation settings' : (origin.origin === 'assumed-generated' ? 'Assumption only' : 'Low');
    var structure = isCommon ? 'Common-password variation' :
      (hasKeyboard ? 'Keyboard-based' : (repeated ? 'Repeated-block' : (dateLike || monthMatch ? 'Date-based' :
      (passphraseLike ? 'Passphrase-like' : (wordNumber ? 'Word-number pattern' : (dictionaryWord ? 'Word-based' :
      (uniqueRatio >= 0.8 && !suffixPattern && !commonAffix ? 'Random-looking mixed string · origin unknown' : 'Mixed structure')))))));
    var utf8Bytes = utf8Length(password);
    return {
      length: length, graphemes: graphemeCount(password), utf8Bytes: utf8Bytes,
      counts: counts, unique: unique, uniqueRatio: uniqueRatio, distributionRatio: distributionRatio,
      usedCategories: usedCategories, categoryCount: categoryCount, pool: pool,
      rawEntropy: rawEntropy, theoreticalBits: rawEntropy, guessabilityBits: guessabilityBits,
      effectiveEntropy: guessabilityBits, score: score, label: strengthFor(score),
      weaknesses: patternFlags, risks: riskItems, maxRepeat: maxRepeat, longestRepeatRun: longestRepeatRun,
      repeated: repeated, sequenceLength: sequenceLength, dictionaryWord: dictionaryWord,
      isCommon: isCommon, hasKeyboard: hasKeyboard, hasSubstitution: hasSubstitution,
      dictionaryTokens: phraseTokens, wordBasedPassphrase: allDictionaryTokens, passphraseSearchBits: passphraseSearchBits,
      dateLike: !!(yearMatch || dateLike || monthMatch), monthMatch: monthMatch,
      contactLike: contactLike, unusualDistribution: unusualDistribution, emoji: emojiGraphemes,
      emojiCodePoints: emojiCodePoints, unicodeCount: unicodeCount, structure: structure,
      confidence: confidence, confidenceDetail: origin.origin === 'generated'
        ? 'SecureCheck created this value with Web Crypto and knows its configured pool; a score still cannot guarantee account security.'
        : (origin.origin === 'assumed-generated' ? 'This fictional lab case assumes a generation process; it is not evidence about a real password’s origin.' : 'The analyzer sees structure and character counts, but cannot know whether a person selected this string randomly or whether it has appeared in a breach.'),
      points: {
        length: lengthPoints, diversity: diversityPoints, randomness: randomnessPoints,
        predictability: patternPoints, repetition: repetitionPoints, commonSimilarity: commonPoints,
        patternPenalty: patternPenalty, repetitionPenalty: repetitionPenalty, commonPenalty: commonPenalty,
        deductions: patternPenalty + repetitionPenalty + commonPenalty
      }
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
    if (logSeconds < log10(86400 * 30.4375)) return (Math.pow(10, logSeconds) / 86400).toFixed(1) + ' days';
    if (logSeconds < log10(31557600)) return (Math.pow(10, logSeconds) / (86400 * 30.4375)).toFixed(1) + ' months';
    var yearsLog = logSeconds - log10(31557600);
    if (yearsLog < 2) {
      var years = Math.pow(10, yearsLog);
      return years.toFixed(years < 10 ? 1 : 0) + ' years';
    }
    if (yearsLog < 5) {
      var centuries = Math.pow(10, yearsLog - 2);
      return (centuries < 10 ? centuries.toFixed(1) : formatNumber(centuries)) + (centuries < 1.5 ? ' century' : ' centuries');
    }
    if (yearsLog < 6) return formatNumber(Math.pow(10, yearsLog) / 1000) + ' thousand years';
    if (yearsLog < 12) return (Math.pow(10, yearsLog) / 1e6).toFixed(1) + ' million years';
    return '10^' + yearsLog.toFixed(1) + ' years';
  }
  function estimateTimes(analysis, rate) {
    if (!analysis || !Number.isFinite(rate) || rate <= 0) return null;
    var bits = Math.max(1, analysis.guessabilityBits);
    var log10Rate = log10(rate);
    var expectedLogSeconds = Math.max(0, bits - 1) * Math.LN2 / Math.LN10 - log10Rate;
    var worstLogSeconds = bits * Math.LN2 / Math.LN10 - log10Rate;
    return {
      expected: formatTimeFromLog(expectedLogSeconds),
      worst: formatTimeFromLog(worstLogSeconds),
      expectedLogSeconds: expectedLogSeconds,
      worstLogSeconds: worstLogSeconds
    };
  }
  function timeForRate(analysis, rate) {
    var estimate = estimateTimes(analysis, rate);
    return estimate ? estimate.expected : '—';
  }
  function parseRate(value, fallback) {
    var rate = Number(value);
    if (!Number.isFinite(rate) || rate <= 0) return fallback;
    return clamp(rate, 0.000001, 1e30);
  }
  function selectedCustomRate() {
    var preset = $('pacePreset').value;
    if (preset !== 'custom') return parseRate(preset, 10000);
    var multipliers = { sec: 1, min: 1 / 60, hour: 1 / 3600 };
    return parseRate($('customSpeed').value, 1000) * (multipliers[$('paceUnit').value] || 1);
  }
  var customScenarioSelected = true;
  var scenarioState = [
    { id: 'online-limited', name: 'Rate-limited online', rate: 0.1, selected: true, desc: 'Illustrative pace; service throttles and lockouts vary.' },
    { id: 'online-fast', name: 'Faster online guessing', rate: 100, selected: true, desc: 'Illustrative online pace; actual controls may block attempts.' },
    { id: 'offline-fast', name: 'Offline against a fast hash', rate: 1000000000, selected: true, desc: 'User-editable assumption for a fast general-purpose hash.' },
    { id: 'offline-slow', name: 'Offline against a slow password hash', rate: 1000, selected: true, desc: 'Editable assumption; selected method settings and hardware determine actual speed.' }
  ];
  function scenarios() {
    return scenarioState.concat([{
      id: 'user-configured', name: 'User-configured hypothetical', rate: selectedCustomRate(), selected: customScenarioSelected,
      desc: 'Your selected rate, converted to guesses per second.'
    }]);
  }
  function selectedScenarios() {
    return scenarios().filter(function (scenario) { return scenario.selected && Number.isFinite(scenario.rate) && scenario.rate > 0; });
  }
  function updatePrimaryEstimate() {
    var list = selectedScenarios();
    var primary = list.reduce(function (best, scenario) { return !best || scenario.rate > best.rate ? scenario : best; }, null);
    if (!currentAnalysis || !primary) {
      setText('primaryEstimate', currentAnalysis ? 'Select a scenario' : '—');
      setText('primaryRate', '—');
      setText('primaryScenario', primary ? primary.name : 'No active scenarios');
      setText('primaryExpected', '—');
      setText('primaryWorst', '—');
      setText('primaryModelNote', currentAnalysis ? 'Choose at least one valid speed assumption.' : 'Enter a password to calculate an illustrative estimate.');
      $('estimateScaleFill').style.width = '0%';
      return;
    }
    var estimate = estimateTimes(currentAnalysis, primary.rate);
    setText('primaryEstimate', estimate.expected);
    setText('primaryRate', formatNumber(primary.rate) + ' guesses per second');
    setText('primaryScenario', primary.name);
    setText('primaryExpected', estimate.expected);
    setText('primaryWorst', estimate.worst);
    setText('primaryModelNote', 'Uses a ' + currentAnalysis.guessabilityBits.toFixed(1) + '-bit modeled search-space proxy. Confidence: ' + currentAnalysis.confidence.toLowerCase() + '.');
    var scale = (estimate.expectedLogSeconds + 2) / 50 * 100;
    $('estimateScaleFill').style.width = clamp(scale, 2, 100) + '%';
  }
  function updateScenarioTable() {
    var tbody = $('scenarioRows');
    if (!currentAnalysis) {
      tbody.innerHTML = '<tr class="scenario-empty"><td colspan="5">Enter a password to compare editable illustrative assumptions.</td></tr>';
      $('speedComparison').innerHTML = '<span class="empty-inline">Scenario comparisons appear after analysis.</span>';
      updatePrimaryEstimate();
      return;
    }
    tbody.innerHTML = '';
    scenarios().forEach(function (scenario) {
      var row = document.createElement('tr');
      row.setAttribute('data-scenario-row', scenario.id);
      var selectCell = document.createElement('td');
      var toggle = document.createElement('input');
      toggle.type = 'checkbox'; toggle.checked = scenario.selected;
      toggle.setAttribute('data-scenario-toggle', scenario.id);
      toggle.setAttribute('aria-label', 'Include ' + scenario.name + ' in the primary estimate');
      selectCell.appendChild(toggle);
      var nameCell = document.createElement('td');
      var name = document.createElement('strong'); name.textContent = scenario.name;
      var desc = document.createElement('small');
      desc.textContent = scenario.id === 'offline-slow'
        ? scenario.desc + ' Method context: ' + $('hashMethod').selectedOptions[0].textContent + '.'
        : scenario.desc;
      nameCell.appendChild(name); nameCell.appendChild(desc);
      var rateCell = document.createElement('td');
      var rate = document.createElement('input');
      rate.type = 'number'; rate.min = '0.000001'; rate.max = '1e30'; rate.step = 'any';
      rate.className = 'scenario-rate-input';
      rate.value = String(scenario.rate);
      rate.setAttribute('data-scenario-rate', scenario.id);
      rate.setAttribute('aria-label', scenario.name + ' assumed guesses per second');
      var unit = document.createElement('small'); unit.textContent = 'guesses / sec';
      rateCell.appendChild(rate); rateCell.appendChild(unit);
      var times = estimateTimes(currentAnalysis, scenario.rate);
      var expectedCell = document.createElement('td'); expectedCell.className = 'time-cell';
      expectedCell.setAttribute('data-scenario-expected', scenario.id);
      expectedCell.textContent = times ? times.expected : '—';
      var worstCell = document.createElement('td'); worstCell.className = 'time-cell worst-time-cell';
      worstCell.setAttribute('data-scenario-worst', scenario.id);
      worstCell.textContent = times ? times.worst : '—';
      row.appendChild(selectCell); row.appendChild(nameCell); row.appendChild(rateCell); row.appendChild(expectedCell); row.appendChild(worstCell);
      tbody.appendChild(row);
    });
    renderSpeedComparison();
    updatePrimaryEstimate();
  }
  function refreshEstimateValues() {
    var rows = all('[data-scenario-row]');
    rows.forEach(function (row) {
      var id = row.getAttribute('data-scenario-row');
      var scenario = scenarios().filter(function (item) { return item.id === id; })[0];
      if (!scenario) return;
      var times = estimateTimes(currentAnalysis, scenario.rate);
      var expected = row.querySelector('[data-scenario-expected]');
      var worst = row.querySelector('[data-scenario-worst]');
      if (expected) expected.textContent = times ? times.expected : '—';
      if (worst) worst.textContent = times ? times.worst : '—';
    });
    renderSpeedComparison();
    updatePrimaryEstimate();
  }
  function renderSpeedComparison() {
    var root = $('speedComparison');
    root.innerHTML = '';
    if (!currentAnalysis) {
      root.innerHTML = '<span class="empty-inline">Scenario comparisons appear after analysis.</span>';
      return;
    }
    selectedScenarios().forEach(function (scenario) {
      var card = document.createElement('div'); card.className = 'speed-item';
      var head = document.createElement('div'); head.className = 'speed-item-head';
      var name = document.createElement('strong'); name.textContent = scenario.name;
      var estimate = estimateTimes(currentAnalysis, scenario.rate);
      var time = document.createElement('span'); time.textContent = estimate ? estimate.expected : '—';
      head.appendChild(name); head.appendChild(time);
      var track = document.createElement('div'); track.className = 'speed-track';
      var bar = document.createElement('i');
      bar.style.width = clamp((log10(scenario.rate) + 1) / 31 * 100, 4, 100) + '%';
      track.appendChild(bar);
      var rate = document.createElement('small'); rate.textContent = formatRate(scenario.rate) + ' guesses/sec';
      card.appendChild(head); card.appendChild(track); card.appendChild(rate); root.appendChild(card);
    });
    if (!root.children.length) root.innerHTML = '<span class="empty-inline">Select one or more scenarios to compare their estimates.</span>';
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
      root.innerHTML = '<div class="empty-inline">Score details appear when you enter a password.</div>';
      return;
    }
    var formula = document.createElement('p');
    formula.className = 'breakdown-formula';
    formula.textContent = 'Score = length (30) + character diversity (10) + distribution indicators (20) + predictability (25) + repetition (10) + common-password similarity (5). Related pattern flags share a factor to limit double-counting.';
    root.appendChild(formula);
    var rows = [
      ['Length', analysis.points.length, 30, analysis.length + ' code points; length points reach their ceiling at 20.'],
      ['Character diversity', analysis.points.diversity, 10, analysis.usedCategories + ' distinct non-whitespace character classes are present. Symbols are not an automatic security bonus.'],
      ['Distribution indicators', analysis.points.randomness, 20, Math.round(analysis.uniqueRatio * 100) + '% unique code points; this is a visible indicator, not proof of randomness.'],
      ['Pattern predictability', analysis.points.predictability, 25, analysis.points.patternPenalty.toFixed(1) + ' points reduced for the strongest predictable structure; related flags share this factor.'],
      ['Repetition', analysis.points.repetition, 10, analysis.points.repetitionPenalty.toFixed(1) + ' points reduced for repeated characters or blocks.'],
      ['Common-password similarity', analysis.points.commonSimilarity, 5, analysis.points.commonPenalty.toFixed(1) + ' points reduced for local common-password or dictionary similarity.']
    ];
    rows.forEach(function (entry) {
      var row = document.createElement('div');
      row.className = 'breakdown-row' + (entry[1] < entry[2] ? ' deduction' : '');
      var name = document.createElement('span'); name.textContent = entry[0];
      name.title = entry[3];
      var value = document.createElement('strong'); value.textContent = entry[1].toFixed(1) + ' / ' + entry[2];
      var track = document.createElement('div'); track.className = 'breakdown-track';
      var bar = document.createElement('i'); bar.style.width = clamp(entry[1] / entry[2] * 100, 0, 100) + '%';
      var explanation = document.createElement('small'); explanation.textContent = entry[3];
      track.appendChild(bar); row.appendChild(name); row.appendChild(value); row.appendChild(track); row.appendChild(explanation); root.appendChild(row);
    });
    var final = document.createElement('div');
    final.className = 'breakdown-row final-score-row';
    var finalTitle = document.createElement('span'); finalTitle.textContent = 'Final SecureCheck score';
    var finalValue = document.createElement('strong'); finalValue.textContent = analysis.score + ' / 100';
    final.appendChild(finalTitle); final.appendChild(finalValue); root.appendChild(final);
    var caveat = document.createElement('small');
    caveat.className = 'score-caveat';
    caveat.textContent = analysis.score === 100
      ? '100/100 means the string reached this model’s scoring ceiling; it is not a guarantee or proof of how it was created.'
      : 'This heuristic score helps compare visible traits. It cannot verify password history, reuse, or creation randomness.';
    root.appendChild(caveat);
  }

  function renderWeaknesses(analysis) {
    var root = $('weaknessList');
    root.innerHTML = '';
    if (!analysis) {
      root.innerHTML = '<div class="empty-inline">Detected strengths and risks appear here.</div>';
      setText('patternCount', 'No analysis yet');
      setText('repetitionBox', 'Repetition and sequence checks will appear here.');
      return;
    }
    setText('patternCount', analysis.risks.length + ' risks · ' + analysis.weaknesses.filter(function (item) { return item.kind === 'good'; }).length + ' strengths');
    analysis.weaknesses.forEach(function (item) {
      var row = document.createElement('div');
      row.className = 'weakness-item' + (item.kind === 'good' ? ' good' : '') + (item.kind === 'risk' ? ' severity-' + item.severity : '');
      var dot = document.createElement('i'); dot.className = 'weakness-indicator';
      var content = document.createElement('span');
      var titleLine = document.createElement('span'); titleLine.className = 'weakness-title-line';
      var title = document.createElement('strong'); title.textContent = item.title;
      titleLine.appendChild(title);
      if (item.kind === 'risk') {
        var badge = document.createElement('em'); badge.className = 'risk-level'; badge.textContent = item.severity + ' risk';
        titleLine.appendChild(badge);
      }
      var detail = document.createElement('small'); detail.textContent = item.detail;
      content.appendChild(titleLine); content.appendChild(detail);
      if (item.kind === 'risk') {
        var impact = document.createElement('small'); impact.className = 'weakness-impact'; impact.textContent = 'Guessability effect: ' + item.guessingImpact;
        content.appendChild(impact);
        if (item.recommendation) {
          var next = document.createElement('small'); next.className = 'weakness-recommendation'; next.textContent = 'Improve: ' + item.recommendation;
          content.appendChild(next);
        }
      }
      row.appendChild(dot); row.appendChild(content); root.appendChild(row);
    });
    var repeat = [];
    repeat.push(analysis.longestRepeatRun > 1 ? 'longest repeated run ' + analysis.longestRepeatRun : 'no consecutive repeated run');
    if (analysis.repeated && analysis.repeated.count > 1) repeat.push('repeated block length ' + analysis.repeated.unit.length);
    if (analysis.sequenceLength >= 3) repeat.push('sequence length ' + analysis.sequenceLength);
    if (analysis.hasKeyboard) repeat.push('keyboard walk found');
    setText('repetitionBox', repeat.join(' · ') + '.');
  }

  function renderAnalysisInsights(analysis, password) {
    if (!analysis) {
      setText('structureClass', 'Awaiting input');
      setText('confidenceLevel', 'No analysis yet');
      setText('confidenceExplanation', 'Manual strings cannot reveal how they were selected or whether they have appeared in a breach.');
      setText('footprintSummary', 'Code points, graphemes, bytes, Unicode, and emoji will appear here.');
      $('anatomyMap').innerHTML = '<span class="empty-inline">Structure map appears after analysis.</span>';
      return;
    }
    setText('structureClass', analysis.structure);
    setText('confidenceLevel', analysis.confidence);
    setText('confidenceExplanation', analysis.confidenceDetail);
    setText('footprintSummary', analysis.length + ' code points · ' + analysis.graphemes + ' graphemes · ' + analysis.utf8Bytes + ' UTF-8 bytes · ' +
      analysis.counts.whitespace + ' whitespace · ' + analysis.unicodeCount + ' distinct non-ASCII code points · ' + analysis.emoji + ' emoji graphemes');
    var map = $('anatomyMap'); map.innerHTML = '';
    var tokens = [];
    safeCodePoints(password).forEach(function (char) {
      var kind = classifyChar(char);
      var previous = tokens[tokens.length - 1];
      if (previous && previous.kind === kind) previous.count++;
      else tokens.push({ kind: kind, count: 1 });
    });
    tokens.forEach(function (token) {
      var part = document.createElement('span');
      part.className = 'anatomy-token anatomy-' + token.kind;
      part.textContent = token.kind + ' × ' + token.count;
      map.appendChild(part);
    });
    map.setAttribute('aria-label', 'Password anatomy map with ' + tokens.map(function (token) { return token.kind + ' run of ' + token.count; }).join(', '));
  }

  function recommendationsFor(analysis) {
    if (!analysis) return [];
    var recs = [];
    if (analysis.length < 20) recs.push('Add length: SecureCheck’s length factor reaches its ceiling at 20 code points; prefer a longer unique password or independently selected passphrase words.');
    analysis.risks.forEach(function (item) { if (item.recommendation && recs.indexOf(item.recommendation) < 0) recs.push(item.recommendation); });
    if (!recs.length) recs.push('Keep this credential unique, store it in a password manager, and enable multi-factor authentication where available.');
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
    summary += 'The guessability proxy is ' + analysis.guessabilityBits.toFixed(1) + ' modeled bits with ' + analysis.confidence.toLowerCase() + '; use a unique password and account protections as well.';
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
      renderComposition(null); renderScoreBreakdown(null); renderWeaknesses(null); renderAnalysisInsights(null, ''); updateScenarioTable();
      return;
    }
    var color = analysis.score >= 60 ? 'var(--accent)' : (analysis.score >= 40 ? 'var(--amber)' : 'var(--red)');
    setText('scoreValue', analysis.score); setText('orbitScore', analysis.score); setText('strengthLabel', analysis.label);
    setText('entropyValue', analysis.guessabilityBits.toFixed(1) + ' bits');
    setText('poolValue', formatNumber(analysis.pool)); setText('poolCaption', analysis.unicodeCount ? 'ASCII classes + observed Unicode; true choice pool unknown' : 'inferred ASCII class pool; not a true choice set');
    setText('uniqueValue', analysis.unique); setText('uniqueCaption', Math.round(analysis.uniqueRatio * 100) + '% of input');
    setText('flagValue', analysis.risks.length);
    setText('rawEntropyValue', analysis.rawEntropy.toFixed(1) + ' bits');
    setText('effectiveEntropySmall', analysis.guessabilityBits.toFixed(1) + ' bits');
    $('rawEntropyBar').style.width = clamp(analysis.rawEntropy / 160 * 100, 2, 100) + '%';
    meter.style.width = analysis.score + '%'; meter.style.background = color;
    roleMeter.setAttribute('aria-valuenow', String(analysis.score));
    $('scoreOrbit').style.borderColor = color;
    $('emptyNote').hidden = true;
    setText('analyzerStatus', analysis.risks.length ? analysis.risks.length + ' pattern flag' + (analysis.risks.length === 1 ? '' : 's') + ' to review' : 'No obvious patterns found');
    $('copyPassword').disabled = false;
    setText('charCount', countLabel(analysis.length, 'code point') + ' · ' + countLabel(password.length, 'UTF-16 code unit'));
    renderComposition(analysis); renderScoreBreakdown(analysis); renderWeaknesses(analysis); renderAnalysisInsights(analysis, password); renderRecommendations(analysis); updateScenarioTable();
    renderAnalysisSummary(analysis);
  }

  function updateHistory(analysis) {
    if (!settings.historyEnabled || !analysis) return;
    historyItems.unshift({
      at: Date.now(), length: analysis.length, score: analysis.score, label: analysis.label,
      entropy: Number(analysis.guessabilityBits.toFixed(1)), flags: analysis.risks.length
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
      wordCombinationProxyBits: analysis.passphraseSearchBits ? Number(analysis.passphraseSearchBits.toFixed(2)) : null,
        modeledGuessabilityProxyBits: Number(analysis.guessabilityBits.toFixed(2)),
        explanation: 'Theoretical character-class ceiling and heuristic guessability proxy. Manual password randomness, breach exposure, and actual guess rank cannot be determined from the string.'
      },
      confidence: { label: analysis.confidence, explanation: analysis.confidenceDetail },
      structure: analysis.structure,
      weaknesses: analysis.risks.map(function (item) { return { finding: item.title, severity: item.severity, explanation: item.detail, guessingImpact: item.guessingImpact, recommendation: item.recommendation }; }),
      strengths: analysis.weaknesses.filter(function (item) { return item.kind === 'good'; }).map(function (item) { return item.title; }),
      recommendations: recommendationsFor(analysis),
      guessingScenarios: scenarios().map(function (scenario) {
        var times = estimateTimes(analysis, scenario.rate);
        return { scenario: scenario.name, selected: scenario.selected, guessesPerSecond: scenario.rate, expectedTime: times ? times.expected : '—', worstCaseTime: times ? times.worst : '—', assumption: scenario.desc, methodContext: $('hashMethod').value };
      }),
      assumptions: 'Expected time uses N/2 guesses and worst case uses N guesses inside the modeled candidate space. Actual outcomes depend on hardware, storage and hashing, rate limits, attacker wordlists, reuse, and other controls.'
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
      'Composition: lowercase ' + analysis.counts.lower + ', uppercase ' + analysis.counts.upper + ', numbers ' + analysis.counts.digits + ', symbols ' + analysis.counts.symbols + ', whitespace ' + analysis.counts.whitespace,
      'Encoding footprint: ' + analysis.graphemes + ' graphemes, ' + analysis.utf8Bytes + ' UTF-8 bytes, ' + analysis.unicodeCount + ' distinct non-ASCII code points, ' + analysis.emoji + ' emoji graphemes',
      'Structure classification: ' + analysis.structure,
      'Analysis confidence: ' + analysis.confidence + ' — ' + analysis.confidenceDetail,
      '',
      'ENTROPY ESTIMATES',
      'Character-set ceiling: ' + analysis.rawEntropy.toFixed(2) + ' bits',
      'Modeled guessability proxy: ' + analysis.guessabilityBits.toFixed(2) + ' bits (low confidence for manual input)',
      'These are illustrative estimates, not guarantees.'
    ];
    lines.push('', 'FINDINGS');
    if (!analysis.risks.length) lines.push('No obvious patterns detected by this local heuristic.');
    analysis.risks.forEach(function (item) { lines.push('- ' + item.title + ' [' + item.severity + ']: ' + item.detail + ' Guessability effect: ' + item.guessingImpact + ' Improve: ' + item.recommendation); });
    lines.push('', 'RECOMMENDATIONS');
    recommendationsFor(analysis).forEach(function (item) { lines.push('- ' + item); });
    lines.push('', 'ESTIMATED GUESSING TIMES');
    scenarios().forEach(function (item) { var times = estimateTimes(analysis, item.rate); lines.push('- ' + item.name + (item.selected ? ' [selected]' : ' [not selected]') + ' — ' + formatRate(item.rate) + ' guesses/sec — expected ' + (times ? times.expected : '—') + ', worst case ' + (times ? times.worst : '—') + '. ' + item.desc); });
    lines.push('', 'ASSUMPTIONS & LIMITATIONS', 'Expected search uses N/2 candidates and worst case uses N equally likely candidates within this heuristic modeled space. Actual results depend on hardware, password storage and hashing, rate limits, attacker wordlists, password reuse, and other controls. No cracking is performed.');
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
    if (length < 20) return 'The selected length cannot reach the model’s full length contribution. Use at least 20 characters for 100/100 mode.';
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
      [['Length', record.analysis.length + ' code points'], ['Guessability proxy', record.analysis.guessabilityBits.toFixed(1) + ' modeled bits'], ['Mix', record.analysis.counts.lower + 'L · ' + record.analysis.counts.upper + 'U · ' + record.analysis.counts.digits + 'N · ' + record.analysis.counts.symbols + 'S']].forEach(function (item) {
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
    note.textContent = $('verify100').checked ? 'Each result below was accepted only after the shared analyzer returned exactly 100/100.' : 'The shared analyzer uses the configured pool for its theoretical estimate; the score still describes only SecureCheck’s model.';
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
      var config = generatorConfiguration();
      var analysis = analyzePassword(candidate, { origin: 'generated', poolSize: config.poolChars.length });
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
      ['Guessability proxy', analysis.guessabilityBits.toFixed(1) + ' modeled bits'],
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
    [['Length', analysis.length + ' code points'], ['Guessability proxy', analysis.guessabilityBits.toFixed(1) + ' modeled bits'], ['Expected at this pace', timeForRate(analysis, rate)], ['Pattern flags', String(analysis.risks.length)]].forEach(function (item) {
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
    var labOrigin = $('labOrigin').value === 'generated' ? { origin: 'assumed-generated', poolSize: mix === 'all' ? 94 : (mix === 'lower-digits' ? 36 : 26) } : {};
    var mixedAnalysis = analyzePassword(mixed, labOrigin);
    var patternedAnalysis = analyzePassword(patterned, labOrigin);
    var cards = $('labCards'); cards.innerHTML = '';
    cards.appendChild(createLabCard('Random-looking fixture', mix === 'all' ? 'POOL ≈ 94' : (mix === 'lower' ? 'POOL = 26' : 'POOL = 36'), mixed, mixedAnalysis, rate));
    cards.appendChild(createLabCard(selectedPattern === 'mixed' ? 'Alternate fixture' : 'Pattern fixture', selectedPattern === 'mixed' ? 'FIXED SAMPLE' : selectedPattern.toUpperCase(), patterned, patternedAnalysis, rate));
    var insight = $('labInsight');
    if (selectedPattern === 'mixed') {
      insight.innerHTML = '<strong>Compare the fixture scores.</strong> Both samples are fixed teaching examples. The selected origin control changes the model assumption only; it cannot turn a fixed sample into an actual random value.';
    } else {
      var delta = mixedAnalysis.score - patternedAnalysis.score;
      insight.innerHTML = '<strong>' + (delta > 0 ? 'The random-like fixture scored ' + delta + ' points higher.' : 'The scores are close in this run.') + '</strong> ' + escapeHtml(patternedAnalysis.risks.length ? patternedAnalysis.risks[0].detail : 'This pattern did not trigger a high-priority warning in the local checks.') + ' A longer predictable string can still be easier to guess.';
    }
    var ramp = $('lengthRamp'); ramp.innerHTML = '';
    [6, 10, 14, 20, 28].forEach(function (rampLength) {
      var sample = labMixedSample(rampLength, mix, 'mixed');
      var result = analyzePassword(sample, labOrigin);
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
    if (['arctic-light', 'minimalist', 'solarized-light'].indexOf(theme) < 0) priorDarkTheme = theme;
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

  function syncPaceDisplay() {
    var rate = selectedCustomRate();
    $('paceSlider').value = String(clamp(log10(Math.max(1000, rate)), 3, 15));
    setText('paceSliderValue', formatRate(rate) + ' / sec');
  }

  function setCustomPace(rate) {
    var safeRate = parseRate(rate, 10000);
    $('paceUnit').value = 'sec';
    $('customSpeed').value = String(safeRate);
    var hasPreset = Array.prototype.some.call($('pacePreset').options, function (option) { return option.value === String(safeRate); });
    $('pacePreset').value = hasPreset ? String(safeRate) : 'custom';
    settings.defaultSpeed = $('pacePreset').value;
    if (!hasPreset) settings.customSpeed = String(safeRate);
    settings.customSpeedUnit = 'sec';
    $('defaultSpeedPreset').value = settings.defaultSpeed;
    $('defaultCustomSpeedWrap').hidden = settings.defaultSpeed !== 'custom';
    $('defaultCustomSpeed').value = settings.customSpeed;
    $('defaultCustomSpeedWrap').hidden = settings.defaultSpeed !== 'custom';
    syncPaceDisplay();
    saveSettings();
    refreshEstimateValues();
  }

  function useCustomPaceInput() {
    settings.defaultSpeed = 'custom';
    settings.customSpeed = $('customSpeed').value;
    settings.customSpeedUnit = $('paceUnit').value;
    $('pacePreset').value = 'custom';
    $('defaultSpeedPreset').value = 'custom';
    $('defaultCustomSpeed').value = settings.customSpeed;
    $('defaultCustomSpeedWrap').hidden = settings.defaultSpeed !== 'custom';
    syncPaceDisplay();
    saveSettings();
    refreshEstimateValues();
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
      var isLight = ['arctic-light', 'minimalist', 'solarized-light'].indexOf(settings.theme) >= 0;
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
      if (settings.defaultSpeed === 'custom') {
        $('customSpeed').value = settings.customSpeed;
        $('paceUnit').value = settings.customSpeedUnit;
      } else {
        $('customSpeed').value = settings.defaultSpeed;
        $('paceUnit').value = 'sec';
      }
      saveSettings(); applySettings(); refreshEstimateValues();
    });
    $('customSpeed').addEventListener('input', useCustomPaceInput);
    $('paceUnit').addEventListener('change', useCustomPaceInput);
    $('paceSlider').addEventListener('input', function () {
      var perSecond = Math.pow(10, Number($('paceSlider').value));
      var unitScale = { sec: 1, min: 1 / 60, hour: 1 / 3600 }[$('paceUnit').value] || 1;
      $('customSpeed').value = String(perSecond / unitScale);
      useCustomPaceInput();
    });
    all('[data-speed-preset]').forEach(function (button) {
      button.addEventListener('click', function () { setCustomPace(button.getAttribute('data-speed-preset')); });
    });
    $('resetPace').addEventListener('click', function () { setCustomPace(10000); showToast('Guessing pace reset to 10,000 per second'); });
    $('hashMethod').addEventListener('change', updateScenarioTable);
    $('scenarioRows').addEventListener('input', function (event) {
      var rateInput = event.target.closest('[data-scenario-rate]');
      if (!rateInput) return;
      var id = rateInput.getAttribute('data-scenario-rate');
      var rate = Number(rateInput.value);
      if (id === 'user-configured') {
        if (Number.isFinite(rate) && rate > 0) setCustomPace(rate);
        else refreshEstimateValues();
        return;
      }
      var scenario = scenarioState.filter(function (item) { return item.id === id; })[0];
      if (scenario) scenario.rate = Number.isFinite(rate) && rate > 0 ? clamp(rate, 0.000001, 1e30) : NaN;
      refreshEstimateValues();
    });
    $('scenarioRows').addEventListener('change', function (event) {
      var toggle = event.target.closest('[data-scenario-toggle]');
      if (!toggle) return;
      var id = toggle.getAttribute('data-scenario-toggle');
      if (id === 'user-configured') customScenarioSelected = toggle.checked;
      else {
        var scenario = scenarioState.filter(function (item) { return item.id === id; })[0];
        if (scenario) scenario.selected = toggle.checked;
      }
      refreshEstimateValues();
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
    $('labOrigin').addEventListener('change', updateLab);
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
      scenarioState.forEach(function (scenario, index) { scenario.rate = [0.1, 100, 1000000000, 1000][index]; scenario.selected = true; });
      customScenarioSelected = true;
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

