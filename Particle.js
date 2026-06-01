class Particle extends GameObject {
  constructor(x, y, canvasWidth, canvasHeight) {
    super(x, y, 2, 2);
    this.name = 'Particle';
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    
    this.vx = (Math.random() - 0.5) * 10;
    this.vy = (Math.random() - 0.5) * 10 - 5;
    this.life = Math.random() * 100 + 50;
    this.maxLife = this.life;
    this.baseAlpha = Math.random() * 0.5 + 0.1;
    
    const colors = ['#00ffcc', '#39ff14', '#ffffff'];
    this.color = colors[Math.floor(Math.random() * colors.length)];
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.life -= dt * 10;
    
    // Wrap around screen slightly
    if (this.x < 0) this.x = this.canvasWidth;
    if (this.x > this.canvasWidth) this.x = 0;
    if (this.y < 0) this.y = this.canvasHeight;
    if (this.y > this.canvasHeight) this.y = 0;
  }

  draw(ctx) {
    const alpha = Math.max(0, (this.life / this.maxLife) * this.baseAlpha);
    ctx.fillStyle = this.color;
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.width, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1.0;
  }
  
  isDead() {
    return this.life <= 0;
  }
}
