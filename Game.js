class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.entities = [];
    this.scrollX = 0;
    this.scrollY = 0;
    this.lastTime = 0;
    
    this.setupResize();
    this.setup();
    this.start(); // Kicks off the render loop
  }

  setupResize() {
    const fit = () => {
      const dpr = window.devicePixelRatio || 1;
      const r = this.canvas.parentElement.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) return;
      this.canvas.width = Math.floor(r.width * dpr);
      this.canvas.height = Math.floor(r.height * dpr);
      this.ctx.scale(dpr, dpr);
      this.cssWidth = r.width;
      this.cssHeight = r.height;
    };
    window.addEventListener('resize', fit);
    if (typeof ResizeObserver !== 'undefined') {
      new ResizeObserver(fit).observe(this.canvas.parentElement);
    }
    fit();
  }

  setup() {
    // Initialize the UI logic
    this.commandCenter = new CommandCenter();
    
    // Pre-populate some particles
    for (let i = 0; i < 50; i++) {
      this.spawnParticle();
    }
  }
  
  spawnParticle() {
    if (!this.cssWidth) return;
    const x = Math.random() * this.cssWidth;
    const y = Math.random() * this.cssHeight;
    const p = new Particle(x, y, this.cssWidth, this.cssHeight);
    this.entities.push(p);
  }

  screenToWorld(canvasX, canvasY) {
    return { x: canvasX + this.scrollX, y: canvasY + this.scrollY };
  }

  worldToScreen(worldX, worldY) {
    return { x: worldX - this.scrollX, y: worldY - this.scrollY };
  }

  getObjectAt(canvasX, canvasY) {
    const world = this.screenToWorld(canvasX, canvasY);
    for (const entity of this.entities) {
      const b = entity.getBounds();
      if (world.x >= b.x && world.x <= b.x + b.width &&
          world.y >= b.y && world.y <= b.y + b.height) {
        return entity;
      }
    }
    return null;
  }

  update(dt) {
    // Maintain particle count
    if (this.entities.length < 100 && Math.random() < 0.2) {
      this.spawnParticle();
    }
    
    for (let i = this.entities.length - 1; i >= 0; i--) {
      const entity = this.entities[i];
      entity.update(dt);
      
      if (entity.isDead && entity.isDead()) {
        this.entities.splice(i, 1);
        this.spawnParticle();
      }
    }
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw subtle grid background on canvas
    if (this.cssWidth && this.cssHeight) {
      this.ctx.strokeStyle = 'rgba(0, 255, 204, 0.03)';
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      const gridSize = 50;
      for (let x = 0; x < this.cssWidth; x += gridSize) {
        this.ctx.moveTo(x, 0);
        this.ctx.lineTo(x, this.cssHeight);
      }
      for (let y = 0; y < this.cssHeight; y += gridSize) {
        this.ctx.moveTo(0, y);
        this.ctx.lineTo(this.cssWidth, y);
      }
      this.ctx.stroke();
    }

    for (const entity of this.entities) {
      entity.draw(this.ctx);
    }
  }

  start() {
    const gameLoop = (timestamp) => {
      const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1); // Cap dt to prevent huge jumps
      this.lastTime = timestamp;
      if (dt > 0) {
        this.update(dt);
        this.draw();
      }
      requestAnimationFrame(gameLoop);
    };
    this.lastTime = performance.now();
    requestAnimationFrame(gameLoop);
  }
}
