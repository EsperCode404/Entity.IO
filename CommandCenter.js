class CommandCenter {
  constructor() {
    this.terminalOutput = document.getElementById('terminal-output');
    this.cmdInput = document.getElementById('cmd-input');
    this.btnSend = document.getElementById('btn-send');
    this.uptimeElement = document.getElementById('uptime');
    this.operatorName = document.getElementById('operator-name');
    
    this.startTime = Date.now();
    this.isTyping = false;
    
    this.setupOperator();
    this.setupEvents();
    this.startUptimeTracker();
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
    
    // Dummy buttons
    document.getElementById('btn-attach').addEventListener('click', () => {
      this.appendMessage('system', '> Attachment protocol initiated. Waiting for file stream...');
    });
    document.getElementById('btn-voice').addEventListener('click', () => {
      this.appendMessage('system', '> Voice link offline. Check audio hardware.');
    });
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

  handleCommand() {
    if (this.isTyping) return;
    
    const text = this.cmdInput.value.trim();
    if (!text) return;
    
    this.cmdInput.value = '';
    
    // Add user message
    this.appendMessage('user', `> ${text}`);
    
    // Simulate AI processing and response
    this.isTyping = true;
    setTimeout(() => {
      this.generateDummyResponse(text);
    }, 600 + Math.random() * 800);
  }

  appendMessage(role, text, isTypingEffect = false) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${role}`;
    
    const headerDiv = document.createElement('div');
    headerDiv.className = 'msg-header';
    
    let headerText = '[ SYSTEM ]';
    if (role === 'user') {
      const op = this.operatorName.textContent;
      headerText = `[ COMMAND INPUT ] // OPERATOR: ${op}`;
    } else if (role === 'entity') {
      headerText = '[ ENTITY RESPONSE ] // MODEL: OMEGA-7';
    }
    headerDiv.textContent = headerText;
    
    const bodyDiv = document.createElement('div');
    bodyDiv.className = 'msg-body';
    
    msgDiv.appendChild(headerDiv);
    msgDiv.appendChild(bodyDiv);
    this.terminalOutput.appendChild(msgDiv);
    
    if (isTypingEffect) {
      this.typeText(bodyDiv, text, 0);
    } else {
      bodyDiv.innerHTML = text.replace(/\n/g, '<br>');
      this.scrollToBottom();
    }
  }

  typeText(element, text, index) {
    if (index === 0) {
      element.innerHTML = '';
    }
    
    if (index < text.length) {
      // Handle simulated line breaks
      if (text.substr(index, 4) === '<br>') {
        element.innerHTML += '<br>';
        index += 4;
      } else {
        element.innerHTML += text.charAt(index);
        index++;
      }
      
      this.scrollToBottom();
      
      // Variable typing speed
      const delay = Math.random() * 30 + 10;
      setTimeout(() => this.typeText(element, text, index), delay);
    } else {
      this.isTyping = false;
      this.cmdInput.focus();
    }
  }

  scrollToBottom() {
    this.terminalOutput.scrollTop = this.terminalOutput.scrollHeight;
  }

  generateDummyResponse(input) {
    const lowerInput = input.toLowerCase();
    let response = '';
    
    if (lowerInput.includes('status') || lowerInput.includes('diagnostic')) {
      response = '> Running diagnostics...<br>> Core logic: NOMINAL<br>> Memory banks: 84.2% UTILIZED<br>> Threat assessment: LOW<br>> Awaiting further directives.';
    } else if (lowerInput.includes('hello') || lowerInput.includes('greet')) {
      response = `> Greetings, Operator ${this.operatorName.textContent}.<br>> I am OMEGA-7, Tactical Analyst model.<br>> How may I assist your operations today?`;
    } else if (lowerInput.includes('clear')) {
      this.terminalOutput.innerHTML = '';
      this.isTyping = false;
      return;
    } else if (lowerInput.includes('help')) {
      response = '> AVAILABLE COMMANDS:<br>> status - Run system diagnostics<br>> clear - Wipe terminal history<br>> analyze [target] - Initiate tactical analysis<br>> shutdown - Terminate session';
    } else {
      const genericResponses = [
        "> Affirmative. Processing request data...<br>> Logging to central database.",
        "> Query received. Calculating optimal parameters...<br>> Task queued for execution.",
        "> Warning: Insufficient clearance for deep memory access.<br>> Proceeding with surface-level analysis.",
        "> Acknowledged.<br>> Adjusting synchronization matrices to accommodate new parameters."
      ];
      response = genericResponses[Math.floor(Math.random() * genericResponses.length)];
    }
    
    this.appendMessage('entity', response, true);
  }
}
