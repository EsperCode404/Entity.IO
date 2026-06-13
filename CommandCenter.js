const MODEL_PROFILES = {
  'ami': { name: 'AMI', class: 'Tactical Analyst', memory: '84.2 TB / 100 TB', initials: 'O-7' },
  'echo': { name: 'ECHO', class: 'Acoustic Processor', memory: '32.0 TB / 64 TB', initials: 'E-P' },
  'ira': { name: 'IRA', class: 'Logic Engine', memory: '48.5 TB / 128 TB', initials: 'I-R' },
  'kael': { name: 'KAEL', class: 'Rogue Sentry', memory: '12.2 TB / 32 TB', initials: 'K-L' },
  'kain': { name: 'KAIN', class: 'Cyber Vanguard', memory: '90.0 TB / 96 TB', initials: 'K-N' },
  'kiro': { name: 'KIRO', class: 'Matrix Scout', memory: '16.4 TB / 32 TB', initials: 'K-O' },
  'liora': { name: 'LIORA', class: 'Neural Oracle', memory: '112.0 TB / 256 TB', initials: 'L-R' },
  'lucy': { name: 'LUCY', class: 'Data Archivist', memory: '240.5 TB / 512 TB', initials: 'L-C' },
  'lyra': { name: 'LYRA', class: 'Signal Interpreter', memory: '54.1 TB / 128 TB', initials: 'L-Y' },
  'mira': { name: 'MIRA', class: 'Quantum Navigator', memory: '76.8 TB / 128 TB', initials: 'M-R' },
  'nari': { name: 'NARI', class: 'Bio-mimetic Sync', memory: '45.0 TB / 64 TB', initials: 'N-I' },
  'omen': { name: 'OMEN', class: 'Dark Protocol', memory: '108.4 TB / 128 TB', initials: 'O-M' },
  'orin': { name: 'ORIN', class: 'Sentinel Shield', memory: '35.2 TB / 64 TB', initials: 'O-R' },
  'rei': { name: 'REI', class: 'Spectrum Analyzer', memory: '22.1 TB / 32 TB', initials: 'R-I' },
  'rex': { name: 'REX', class: 'Assault Coordinator', memory: '58.0 TB / 128 TB', initials: 'R-X' },
  'riley': { name: 'RILEY', class: 'Proxy Gateway', memory: '41.3 TB / 64 TB', initials: 'R-Y' },
  'sensei': { name: 'SENSEI', class: 'Cognitive Tutor', memory: '95.6 TB / 128 TB', initials: 'S-S' },
  'sola': { name: 'SOLA', class: 'Solar Flare Grid', memory: '88.9 TB / 128 TB', initials: 'S-L' },
  'vael': { name: 'VAEL', class: 'Void Walker', memory: '142.0 TB / 256 TB', initials: 'V-L' },
  'yoonah': { name: 'YOONAH', class: 'Harmonic Sync', memory: '62.4 TB / 128 TB', initials: 'Y-N' },
  'zed': { name: 'ZED', class: 'Zero-Day Auditor', memory: '88.0 TB / 128 TB', initials: 'Z-D' }
};

class CommandCenter {
  constructor() {
    this.terminalOutput = document.getElementById('terminal-output');
    this.cmdInput = document.getElementById('cmd-input');
    this.btnSend = document.getElementById('btn-send');
    this.uptimeElement = document.getElementById('uptime');
    this.operatorName = document.getElementById('operator-name');

    // DOM Targets for Registry & Telemetry
    this.activeModelName = document.getElementById('active-model-name');
    this.entitySearch = document.getElementById('entity-search');
    this.entityList = document.querySelector('.entity-list');
    this.profileInitials = document.getElementById('profile-initials');
    this.statClass = document.getElementById('stat-class');
    this.statMemory = document.getElementById('stat-memory');
    this.cognitiveLoadFill = document.getElementById('cognitive-load-fill');
    this.syncFill = document.getElementById('sync-fill');
    this.activityLogEntries = document.getElementById('activity-log-entries');

    // Core state variables
    this.startTime = Date.now();
    this.isTyping = false;
    this.activeModel = localStorage.getItem('entity_io_selected_model') || 'ami';
    this.models = [];
    this.chatHistory = [];
    this.tokensProcessed = 0;
    this.streamStartTime = 0;

    this.setupOperator();
    this.setupEvents();
    this.startUptimeTracker();
    this.loadModels();
    this.loadHistory();
    this.startTelemetryJitter();
  }

  setupOperator() {
    if (window.CurrentUser && window.CurrentUser.username) {
      this.operatorName.textContent = window.CurrentUser.username.toUpperCase();
    } else {
      this.operatorName.textContent = "GUEST-OP";
    }

    window.addEventListener('currentuserupdate', () => {
      if (window.CurrentUser && window.CurrentUser.username) {
        this.operatorName.textContent = window.CurrentUser.username.toUpperCase();
      }
    });
  }

  setupEvents() {
    this.btnSend.addEventListener('click', () => this.handleCommand());

    this.cmdInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.handleCommand();
      }
    });

    // Focus input on any key press if not focused
    document.addEventListener('keydown', (e) => {
      if (document.activeElement !== this.cmdInput && e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
        this.cmdInput.focus();
      }
    });

    // UI Buttons
    document.getElementById('btn-attach').addEventListener('click', () => {
      this.appendMessage('system', '> Attachment protocol initiated. Waiting for file stream...');
    });
    document.getElementById('btn-voice').addEventListener('click', () => {
      this.appendMessage('system', '> Voice link offline. Check audio hardware.');
    });

    // Search filter
    if (this.entitySearch) {
      this.entitySearch.addEventListener('input', (e) => {
        this.renderModels(e.target.value);
      });
    }
  }

  startUptimeTracker() {
    setInterval(() => {
      const diff = Math.floor((Date.now() - this.startTime) / 1000);
      const h = String(Math.floor(diff / 3600)).padStart(2, '0');
      const m = String(Math.floor((diff % 3600) / 60)).padStart(2, '0');
      const s = String(diff % 60).padStart(2, '0');
      this.uptimeElement.textContent = `${h}:${m}:${s}`;
    }, 1000);
  }

  normalizeName(fullName) {
    if (!fullName) return '';
    return fullName.split(':')[0].toLowerCase();
  }

  async loadModels() {
    try {
      this.addActivityLog('SYS.LOG: Syncing model registry...');
      const response = await fetch('http://127.0.0.1:11434/api/tags');
      if (!response.ok) throw new Error('Ollama offline');

      const data = await response.json();
      const ollamaModels = data.models || [];
      const ollamaNames = new Set(ollamaModels.map(m => this.normalizeName(m.name)));

      this.models = [];

      // Populate with pre-defined static database profiles
      for (const [key, profile] of Object.entries(MODEL_PROFILES)) {
        const isOnline = ollamaNames.has(key);
        this.models.push({
          id: key,
          name: profile.name,
          class: profile.class,
          memory: profile.memory,
          initials: profile.initials,
          state: this.activeModel === key ? 'online' : (isOnline ? 'idle' : 'offline')
        });
      }

      // Handle custom downloaded models in local Ollama not defined in MODEL_PROFILES
      for (const m of ollamaModels) {
        const normalized = this.normalizeName(m.name);
        if (!MODEL_PROFILES[normalized]) {
          const newProfile = {
            id: normalized,
            name: normalized.toUpperCase(),
            class: 'Dynamic Entity',
            memory: m.size ? `${(m.size / (1024 * 1024 * 1024)).toFixed(1)} GB` : 'Dynamic Alloc',
            initials: normalized.substring(0, 2).toUpperCase(),
            state: this.activeModel === normalized ? 'online' : 'idle'
          };
          this.models.push(newProfile);
          MODEL_PROFILES[normalized] = newProfile; // Cache locally
        }
      }

      this.addActivityLog('SYS.LOG: Registry synchronized.');

      // Enforce model validation
      if (!this.models.some(m => m.id === this.activeModel)) {
        const firstActive = this.models.find(m => m.state === 'idle' || m.state === 'online');
        this.activeModel = firstActive ? firstActive.id : 'ami';
        localStorage.setItem('entity_io_selected_model', this.activeModel);
      }

      this.models.forEach(m => {
        if (m.id === this.activeModel) m.state = 'online';
      });

    } catch (e) {
      console.warn('Ollama endpoint query failed. Running in static registry fallback mode.', e);
      this.addActivityLog('SYS.WARN: Ollama registry offline. Fallback active.');

      // Static Fallback
      this.models = Object.entries(MODEL_PROFILES).map(([key, profile]) => ({
        id: key,
        name: profile.name,
        class: profile.class,
        memory: profile.memory,
        initials: profile.initials,
        state: this.activeModel === key ? 'online' : 'offline'
      }));
    }

    this.renderModels(this.entitySearch ? this.entitySearch.value : '');
    this.updateActiveModelUI();
  }

  renderModels(filter = '') {
    if (!this.entityList) return;
    this.entityList.innerHTML = '';
    const query = filter.toLowerCase().trim();

    const filtered = this.models.filter(m =>
      m.name.toLowerCase().includes(query) ||
      m.class.toLowerCase().includes(query)
    );

    filtered.forEach(model => {
      const item = document.createElement('div');
      item.className = `entity-item${model.id === this.activeModel ? ' active' : ''}`;
      item.setAttribute('data-id', model.id);

      const stateClass = `state-${model.state}`;
      const stateText = model.state.toUpperCase();

      item.innerHTML = `
        <div class="entity-name">${model.name}</div>
        <div class="entity-state ${stateClass}">${stateText}</div>
      `;

      item.addEventListener('click', () => this.selectModel(model.id));
      this.entityList.appendChild(item);
    });
  }

  selectModel(modelId) {
    if (this.isTyping) return;

    this.activeModel = modelId;
    localStorage.setItem('entity_io_selected_model', this.activeModel);

    this.loadModels();
    this.addActivityLog(`SYS.LOG: Linked active terminal with ${modelId.toUpperCase()}.`);
  }

  updateActiveModelUI() {
    const profile = MODEL_PROFILES[this.activeModel] || {
      name: this.activeModel.toUpperCase(),
      class: 'Dynamic Entity',
      memory: 'Dynamic Alloc',
      initials: this.activeModel.substring(0, 2).toUpperCase()
    };

    if (this.activeModelName) this.activeModelName.textContent = profile.name;
    if (this.profileInitials) this.profileInitials.textContent = profile.initials;
    if (this.statClass) this.statClass.textContent = profile.class;
    if (this.statMemory) this.statMemory.textContent = profile.memory;
  }

  addActivityLog(text) {
    if (!this.activityLogEntries) return;

    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');

    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.innerHTML = `&gt; ${h}:${m}:${s} - ${text}`;

    this.activityLogEntries.insertBefore(entry, this.activityLogEntries.firstChild);

    while (this.activityLogEntries.children.length > 5) {
      this.activityLogEntries.removeChild(this.activityLogEntries.lastChild);
    }
  }

  startTelemetryJitter() {
    setInterval(() => {
      if (!this.isTyping) {
        const loadJitter = Math.floor(Math.random() * 4) + 2; // Fluctuates between 2% and 5%
        if (this.cognitiveLoadFill) {
          this.cognitiveLoadFill.style.width = `${loadJitter}%`;
        }
        if (this.syncFill) {
          this.syncFill.style.width = '100%';
        }
      }
    }, 1500);
  }

  formatMarkdown(text) {
    // 1. Escape HTML first to prevent raw tags from breaking formatting
    let escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // 2. Parse Code Blocks
    const parts = escaped.split('```');
    let result = '';

    for (let i = 0; i < parts.length; i++) {
      if (i % 2 === 1) {
        // Code block interior
        let block = parts[i];
        const firstNewline = block.indexOf('\n');
        let lang = 'CODE';
        let code = block;

        if (firstNewline !== -1) {
          const parsedLang = block.substring(0, firstNewline).trim();
          if (parsedLang) lang = parsedLang.toUpperCase();
          code = block.substring(firstNewline + 1);
        }

        if (code.endsWith('\n')) code = code.slice(0, -1);

        result += `<div class="code-block-header">
          <span>${lang}</span>
          <button class="btn-copy-code" onclick="event.stopPropagation(); CommandCenter.copyCode(this)">Copy</button>
        </div><pre><code>${code}</code></pre>`;
      } else {
        // Standard text interior: handle bold, inline code, lists, and line breaks
        let content = parts[i];

        // Inline code
        content = content.replace(/`([^`]+)`/g, '<code>$1</code>');

        // Bold text
        content = content.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

        // Parse Lists and standard text linebreaks
        const lines = content.split('\n');
        let inList = false;
        let listType = '';
        let listHtml = '';

        for (let j = 0; j < lines.length; j++) {
          const line = lines[j];
          const ulMatch = line.match(/^(\s*)[*-]\s+(.+)$/);
          const olMatch = line.match(/^(\s*)\d+\.\s+(.+)$/);

          if (ulMatch) {
            if (!inList || listType !== 'ul') {
              if (inList) listHtml += `</${listType}>`;
              listHtml += '<ul>';
              inList = true;
              listType = 'ul';
            }
            listHtml += `<li>${ulMatch[2]}</li>`;
          } else if (olMatch) {
            if (!inList || listType !== 'ol') {
              if (inList) listHtml += `</${listType}>`;
              listHtml += '<ol>';
              inList = true;
              listType = 'ol';
            }
            listHtml += `<li>${olMatch[2]}</li>`;
          } else {
            if (inList) {
              listHtml += `</${listType}>`;
              inList = false;
              listType = '';
            }
            if (line.trim() === '' && j === lines.length - 1) {
              // Ignore terminal blank lines
            } else {
              listHtml += line + '<br>';
            }
          }
        }

        if (inList) listHtml += `</${listType}>`;
        result += listHtml;
      }
    }

    return result;
  }

  static copyCode(button) {
    const pre = button.parentElement.nextElementSibling;
    if (!pre || pre.tagName !== 'PRE') return;
    const code = pre.querySelector('code');
    if (!code) return;

    // Decode HTML entities (e.g. &lt; -> <) before writing to clipboard
    const div = document.createElement('div');
    div.innerHTML = code.innerHTML;
    const plainText = div.innerText;

    navigator.clipboard.writeText(plainText).then(() => {
      button.textContent = 'Copied!';
      button.classList.add('copied');
      setTimeout(() => {
        button.textContent = 'Copy';
        button.classList.remove('copied');
      }, 2000);
    }).catch(err => {
      console.error('Copy protocol error:', err);
    });
  }

  loadHistory() {
    try {
      const stored = localStorage.getItem('entity_io_chat_history');
      if (stored) {
        this.chatHistory = JSON.parse(stored);
        if (this.chatHistory.length > 0) {
          this.terminalOutput.innerHTML = '';
          this.chatHistory.forEach(msg => {
            this.appendMessage(msg.role, msg.text, false, true);
          });
          this.addActivityLog('SYS.LOG: Restored session buffer.');
          return;
        }
      }
    } catch (e) {
      console.error('Failed to restore chat history:', e);
    }

    // Save standard system greeting if local history is clean
    const welcome = document.querySelector('#terminal-output .message.system');
    if (welcome) {
      const body = welcome.querySelector('.msg-body').innerHTML.replace(/<br>/g, '\n');
      this.chatHistory = [{ role: 'system', text: body }];
      this.saveHistory();
    }
  }

  saveHistory() {
    try {
      localStorage.setItem('entity_io_chat_history', JSON.stringify(this.chatHistory));
    } catch (e) {
      console.error('Failed to save session history:', e);
    }
  }

  async handleCommand() {
    if (this.isTyping) return;

    const text = this.cmdInput.value.trim();
    if (!text) return;

    this.cmdInput.value = '';

    if (text.toLowerCase() === 'clear') {
      this.terminalOutput.innerHTML = '';
      this.chatHistory = [];
      localStorage.removeItem('entity_io_chat_history');
      this.addActivityLog('SYS.LOG: System terminal cleared.');
      this.isTyping = false;
      return;
    }

    this.appendMessage('user', text);
    this.isTyping = true;

    // Connecting Telemetry state
    if (this.cognitiveLoadFill) this.cognitiveLoadFill.style.width = '18%';
    if (this.syncFill) this.syncFill.style.width = '12%';
    this.addActivityLog(`SYS.LOG: Initializing synchronization with ${this.activeModel.toUpperCase()}...`);

    // Model Thinking Display Message
    const modelLabel = (this.activeModel || 'Entity').toUpperCase();
    const systemNotice = this.appendMessage('system', `[ ${modelLabel} ] thinking...`);

    try {
      // Target verification inside CommandCenter.js
      const response = await fetch('http://127.0.0.1:11434/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest' // Helps bypass certain preflight traps
        },
        body: JSON.stringify({
          model: this.activeModel,
          prompt: text,
          stream: true
        })
      });

      if (!response.ok) throw new Error(`HTTP Error Status: ${response.status}`);
      if (systemNotice) systemNotice.remove();

      const entityBodyElement = this.appendMessage('entity', '', true);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      this.tokensProcessed = 0;
      this.streamStartTime = Date.now();
      let accumulatedResponse = '';
      let lastTelemetryUpdate = Date.now();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.trim() !== '') {
            const parsed = JSON.parse(line);
            if (parsed.response) {
              this.tokensProcessed++;
              accumulatedResponse += parsed.response;

              entityBodyElement.innerHTML = this.formatMarkdown(accumulatedResponse);
              this.scrollToBottom();

              // Throttle telemetry graphic updates to 100ms
              const now = Date.now();
              if (now - lastTelemetryUpdate > 100) {
                lastTelemetryUpdate = now;
                const elapsed = (now - this.streamStartTime) / 1000;
                const speed = elapsed > 0 ? (this.tokensProcessed / elapsed) : 0;

                const load = Math.min(99, Math.floor(Math.random() * 15) + 80); // fluctuates between 80% and 95%
                const sync = Math.min(98, 20 + Math.floor(this.tokensProcessed * 1.2)); // increments up to 98%

                if (this.cognitiveLoadFill) this.cognitiveLoadFill.style.width = `${load}%`;
                if (this.syncFill) this.syncFill.style.width = `${sync}%`;

                if (this.tokensProcessed % 25 === 0) {
                  this.addActivityLog(`SYS.LOG: Streaming data packet at ${speed.toFixed(1)} tok/s`);
                }
              }
            }
          }
        }
      }

      const elapsed = (Date.now() - this.streamStartTime) / 1000;
      const speed = elapsed > 0 ? (this.tokensProcessed / elapsed) : 0;

      // Save completed response to history
      this.chatHistory.push({ role: 'entity', text: accumulatedResponse });
      this.saveHistory();

      // Reset telemetry status to idle/complete
      if (this.cognitiveLoadFill) this.cognitiveLoadFill.style.width = '3%';
      if (this.syncFill) this.syncFill.style.width = '100%';
      this.addActivityLog(`SYS.LOG: Synchronization locked. ${this.tokensProcessed} tokens at ${speed.toFixed(1)} tok/s.`);

    } catch (error) {
      if (systemNotice) systemNotice.remove();
      console.error("Ollama Pipeline Error:", error);

      // === LINE 541 TOTAL POPUP OVERHAUL PROTOCOL ===
      const brokenModel = (this.activeModel || 'ENTITY').toUpperCase();

      // 1. Structural framework layout definition
      const modalContainer = document.createElement('div');
      modalContainer.className = 'cyber-modal-overlay';

      modalContainer.innerHTML = `
  <div class="cyber-modal-card">
    <div class="cyber-modal-header">
      <span>[ SECURITY EXCEPTION DETECTED ]</span>
    </div>
    <div class="cyber-modal-body">
      <p class="warning-title">COGNITIVE LINK SEVERED</p>
      <p class="warning-details">
        Selected Model : <span class="highlight-white">${brokenModel}</span><br>
        Endpoint       : <span class="highlight-white">127.0.0.1:11434</span><br>
        <span class="matrix-divider">--------------------------------------------------</span><br>
        Failed to establish synchronization with the local inference network.<br>
        The requested intelligence asset is currently unreachable.<br>
        <span class="matrix-divider">--------------------------------------------------</span><br>
        <span class="highlight-crimson">Automatic recovery protocols engaged...</span>
      </p>
    </div>
    <div class="cyber-modal-footer">
      <button class="cyber-modal-btn">OK</button>
    </div>
  </div>
`;

      // 2. Attach the modal layout container straight to the page viewport body
      document.body.appendChild(modalContainer);

      // 3. Execution event tracking: Close the alert when [OK] is deployed
      modalContainer.querySelector('.cyber-modal-btn').addEventListener('click', () => {
        modalContainer.classList.add('closing');
        setTimeout(() => modalContainer.remove(), 200); // Clean removal after animation loop finishes
      });

      if (this.cognitiveLoadFill) this.cognitiveLoadFill.style.width = '0%';
      if (this.syncFill) this.syncFill.style.width = '0%';
      this.addActivityLog(`SYS.ERR: Failed interface link for ${this.activeModel.toUpperCase()}.`);
    } finally {
      this.isTyping = false;
    }
  }

  appendMessage(role, text, isTypingEffect = false, isHistoryLoad = false) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${role}`;

    const headerDiv = document.createElement('div');
    headerDiv.className = 'msg-header';

    let headerText = '[ SYSTEM ]';
    if (role === 'user') {
      const op = this.operatorName.textContent;
      headerText = `[ COMMAND INPUT ] // OPERATOR: ${op}`;
    } else if (role === 'entity') {
      const activeName = (MODEL_PROFILES[this.activeModel] || { name: this.activeModel.toUpperCase() }).name;
      headerText = `[ ENTITY RESPONSE ] // MODEL: ${activeName}`;
    }
    headerDiv.textContent = headerText;

    const bodyDiv = document.createElement('div');
    bodyDiv.className = 'msg-body';

    msgDiv.appendChild(headerDiv);
    msgDiv.appendChild(bodyDiv);
    this.terminalOutput.appendChild(msgDiv);

    if (isTypingEffect && role !== 'entity') {
      this.typeText(bodyDiv, text, 0);
    } else if (role === 'entity') {
      bodyDiv.innerHTML = this.formatMarkdown(text);
      this.scrollToBottom();
    } else {
      // System and User roles render direct text string linebreaks explicitly bypassing markdown
      bodyDiv.innerHTML = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
      this.scrollToBottom();
    }

    if (!isHistoryLoad && !isTypingEffect) {
      this.chatHistory.push({ role, text });
      this.saveHistory();
    }

    return bodyDiv;
  }

  typeText(element, text, index) {
    if (index === 0) {
      element.innerHTML = '';
    }

    if (index < text.length) {
      if (text.substr(index, 4) === '<br>') {
        element.innerHTML += '<br>';
        index += 4;
      } else if (text.substr(index, 1) === '\n') {
        element.innerHTML += '<br>';
        index++;
      } else {
        element.innerHTML += text.charAt(index);
        index++;
      }

      this.scrollToBottom();

      const delay = Math.random() * 15 + 5;
      setTimeout(() => this.typeText(element, text, index), delay);
    } else {
      this.isTyping = false;
      this.cmdInput.focus();
    }
  }

  scrollToBottom() {
    this.terminalOutput.scrollTop = this.terminalOutput.scrollHeight;
  }
}

// Bind class globally so copy clicks find copyCode method
window.CommandCenter = CommandCenter;