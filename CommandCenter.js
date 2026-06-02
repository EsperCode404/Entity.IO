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
    
    // UI Buttons
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

  // Targets your locally created 'ami' model tag specifically
  getActiveModel() {
    return 'ami'; 
  }

  async handleCommand() {
    if (this.isTyping) return;
    
    const text = this.cmdInput.value.trim();
    if (!text) return;
    
    this.cmdInput.value = '';
    this.appendMessage('user', `> ${text}`);
    
    if (text.toLowerCase() === 'clear') {
      this.terminalOutput.innerHTML = '';
      this.isTyping = false;
      return;
    }
    
    this.isTyping = true;
    const systemNotice = this.appendMessage('system', '> Query dispatched. Establishing LLM datastream...');
    
    try {
      const activeModelTag = this.getActiveModel();
      
      // 1. Establish connection with stream: true
      const response = await fetch('http://127.0.0.1:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: activeModelTag,
          prompt: text,
          stream: true // Enabled real-time chunking
        })
      });

      if (!response.ok) throw new Error(`HTTP Error Status: ${response.status}`);
      if (systemNotice) systemNotice.remove();

      // 2. Create an empty Entity Response element to stream text into
      // Create the entity response block and capture its body container directly
      const entityBodyElement = this.appendMessage('entity', '', true);
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.trim() !== '') {
            const parsed = JSON.parse(line);
            if (parsed.response) {
              // Directly inject raw tokens without artificial typing speed delays
              entityBodyElement.innerHTML += parsed.response.replace(/\n/g, '<br>');
              this.scrollToBottom();
            }
          }
        }
      }
      
    } catch (error) {
      if (systemNotice) systemNotice.remove();
      console.error("Ollama Pipeline Error:", error);
      
      const errorDiagnostic = `> EXCEPTION DETECTED: Unable to resolve local pipeline node.<br>` +
                              `> TARGET PORT: http://127.0.0.1:11434/api/generate`;
      this.appendMessage('system', errorDiagnostic);
    } finally {
      this.isTyping = false;
    }
  }

  // Modified appendMessage to handle direct real-time rendering safely
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
      headerText = `[ ENTITY RESPONSE ] // MODEL: OMEGA-7 (AMI)`;
    }
    headerDiv.textContent = headerText;
    
    const bodyDiv = document.createElement('div');
    bodyDiv.className = 'msg-body';
    
    msgDiv.appendChild(headerDiv);
    msgDiv.appendChild(bodyDiv);
    this.terminalOutput.appendChild(msgDiv);
    
    // If it's the streaming AI response, we skip the artificial typing effect entirely
    if (isTypingEffect && role !== 'entity') {
      this.typeText(bodyDiv, text, 0);
    } else {
      bodyDiv.innerHTML = text.replace(/\n/g, '<br>');
      this.scrollToBottom();
    }
    
    // Return the body div directly so our handleCommand loop can inject text instantly
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
      
      // Fast futuristic typing speed
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