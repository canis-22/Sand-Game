export class Material {
    constructor(name, color, density, isSolid = false, dispersionRate = 0, colorVariation = 0.2) {
      this.name = name;
      this.color = color;
      this.density = density;
      this.isSolid = isSolid;
      this.dispersionRate = dispersionRate;
      this.colorVariation = colorVariation;
    }
    getVariedColor() {
      const r = parseInt(this.color.slice(1, 3), 16);
      const g = parseInt(this.color.slice(3, 5), 16);
      const b = parseInt(this.color.slice(5, 7), 16);
      const variation = this.colorVariation * 255;
      const vr = Math.max(0, Math.min(255, r + (Math.random() - 0.5) * variation));
      const vg = Math.max(0, Math.min(255, g + (Math.random() - 0.5) * variation));
      const vb = Math.max(0, Math.min(255, b + (Math.random() - 0.5) * variation));
      return `#${Math.floor(vr).toString(16).padStart(2, '0')}${Math.floor(vg).toString(16).padStart(2, '0')}${Math.floor(vb).toString(16).padStart(2, '0')}`;
    }
  }
  
  export const materials = {
    EMPTY : new Material('empty', '#000000',  0,    false, 0, 0.2),
    SAND  : new Material('sand',  '#e6c229', 1,   false, 0, 0.2),
    STONE : new Material('stone', '#808080', 2,    true, 0, 0.2),
    WATER : new Material('water', '#1e90ff', 0.5, false, 5, 0.2),
    SEED  : new Material('seed',  '#8B4513', 1.5, false, 0, 0.2),
    WOOD  : new Material('wood',  '#8B4513', 2,    true, 0, 0.2),
    PLANT : new Material('plant', '#2E8B57', 1.2, true, 0, 0.2),
    SOIL  : new Material('soil',  '#5C4033', 1.3, false, 0, 0.2),
    ROOT  : new Material('root',  '#FF69B4', 2,    true, 0, 0.2),
    MUD   : new Material('mud',   '#4B2F0A', 1.3, false, 0, 0.2),
    GRAVEL: new Material('gravel', '#A9A9A9', 1.6, false, 0, 0.2)
  };