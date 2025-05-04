import { materials } from './materials.js';
import { Tree, Bush, Grass, SeedDNA } from './plants.js';

// Base class for all materials
class MaterialType {
    constructor(material) {
        this.material = material;
    }

    update(x, y, grid, colorCache, gridWidth, gridHeight) {
        // Base update method - to be overridden by subclasses
    }
}

// Improved Liquid class with unbiased dispersion
class Liquid extends MaterialType {
    constructor(material) {
      super(material);
    }
  
    update(x, y, grid, colorCache, gridWidth, gridHeight) {
      const { density, dispersionRate } = this.material;
      const maxFall = 7;
  
      // 1. Fall straight down if empty or lower-density
      for (let d = 1; d <= maxFall; d++) {
        const ny = y + d;
        if (ny >= gridHeight) break;
        const cell = grid[x][ny];
        if (cell === materials.EMPTY || cell.density < density) {
          return this._move(x, y, x, ny, grid, colorCache);
        }
      }
  
      // 2. Gather lateral & diagonal moves
      const moves = [];
      for (let d = 1; d <= dispersionRate; d++) {
        [[-d, 0], [d, 0], [-d, d], [d, d]].forEach(([dx, dy]) => {
          const nx = x + dx, ny = y + dy;
          if (nx >= 0 && nx < gridWidth && ny < gridHeight) {
            moves.push({ nx, ny });
          }
        });
      }
  
      // 3. Shuffle to avoid bias
      for (let i = moves.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [moves[i], moves[j]] = [moves[j], moves[i]];
      }
  
      // 4. Execute first valid move
      for (const { nx, ny } of moves) {
        const target = grid[nx][ny];
        if (target === materials.EMPTY || target.density < density) {
          return this._move(x, y, nx, ny, grid, colorCache);
        }
      }
      // 5. no move
    }
  
    _move(x1, y1, x2, y2, grid, colorCache) {
      grid[x2][y2] = this.material;
      colorCache[x2][y2] = colorCache[x1][y1];
      grid[x1][y1] = materials.EMPTY;
      colorCache[x1][y1] = '#000000';
    }
}

// Base class for solid materials
class Solid extends MaterialType {
    update(x, y, grid, colorCache, gridWidth, gridHeight) {
        // Base update method for solids - to be overridden by subclasses
    }
}

// Movable solid class for materials that can fall and slide
class MovableSolid extends Solid {
    update(x, y, grid, colorCache, gridWidth, gridHeight) {
        // Try to move down
        if (y + 1 < gridHeight && (grid[x][y + 1] === materials.EMPTY || grid[x][y + 1].density < this.material.density)) {
            grid[x][y + 1] = this.material;
            colorCache[x][y + 1] = colorCache[x][y];
            grid[x][y] = materials.EMPTY;
            colorCache[x][y] = '#000000';
        }
        // Try to move down-left
        else if (y + 1 < gridHeight && x - 1 >= 0 && (grid[x - 1][y + 1] === materials.EMPTY || grid[x - 1][y + 1].density < this.material.density)) {
            grid[x - 1][y + 1] = this.material;
            colorCache[x - 1][y + 1] = colorCache[x][y];
            grid[x][y] = materials.EMPTY;
            colorCache[x][y] = '#000000';
        }
        // Try to move down-right
        else if (y + 1 < gridHeight && x + 1 < gridWidth && (grid[x + 1][y + 1] === materials.EMPTY || grid[x + 1][y + 1].density < this.material.density)) {
            grid[x + 1][y + 1] = this.material;
            colorCache[x + 1][y + 1] = colorCache[x][y];
            grid[x][y] = materials.EMPTY;
            colorCache[x][y] = '#000000';
        }
    }
}

// Immovable solid class for materials that don't move
class ImmovableSolid extends Solid {
    update(x, y, grid, colorCache, gridWidth, gridHeight) {
        // Immovable solids don't move
    }
}

// Gas class for materials that rise and disperse
class Gas extends MaterialType {
    update(x, y, grid, colorCache, gridWidth, gridHeight) {
        // Try to move up
        if (y - 1 >= 0 && grid[x][y - 1].density > this.material.density) {
            grid[x][y - 1] = this.material;
            colorCache[x][y - 1] = colorCache[x][y];
            grid[x][y] = materials.EMPTY;
            colorCache[x][y] = '#000000';
            return;
        }

        // If can't move up, try to disperse left or right
        const dispersionRate = this.material.dispersionRate;
        let foundSpace = false;

        // Check left and right directions
        for (let distance = 1; distance <= dispersionRate; distance++) {
            // Try left
            if (x - distance >= 0 && grid[x - distance][y].density > this.material.density) {
                grid[x - distance][y] = this.material;
                colorCache[x - distance][y] = colorCache[x][y];
                grid[x][y] = materials.EMPTY;
                colorCache[x][y] = '#000000';
                foundSpace = true;
                break;
            }
            // Try right
            if (x + distance < gridWidth && grid[x + distance][y].density > this.material.density) {
                grid[x + distance][y] = this.material;
                colorCache[x + distance][y] = colorCache[x][y];
                grid[x][y] = materials.EMPTY;
                colorCache[x][y] = '#000000';
                foundSpace = true;
                break;
            }
        }
    }
}

// Water subclass: uses base Liquid behavior
class Water extends Liquid {
    constructor(material) {
      super(material);
    }
}

// Special gravel class that moves less than sand or soil
class Gravel extends MovableSolid {
    update(x, y, grid, colorCache, gridWidth, gridHeight) {
        // Only try to move down (no diagonal movement)
        if (y + 1 < gridHeight && grid[x][y + 1].density < this.material.density) {
            grid[x][y + 1] = this.material;
            colorCache[x][y + 1] = colorCache[x][y];
            grid[x][y] = materials.EMPTY;
            colorCache[x][y] = '#000000';
        }
        // Only try to move down-left if there's a significant height difference
        else if (y + 1 < gridHeight && x - 1 >= 0 && 
                 grid[x - 1][y + 1].density < this.material.density &&
                 grid[x - 1][y].density < this.material.density) {
            grid[x - 1][y + 1] = this.material;
            colorCache[x - 1][y + 1] = colorCache[x][y];
            grid[x][y] = materials.EMPTY;
            colorCache[x][y] = '#000000';
        }
        // Only try to move down-right if there's a significant height difference
        else if (y + 1 < gridHeight && x + 1 < gridWidth && 
                 grid[x + 1][y + 1].density < this.material.density &&
                 grid[x + 1][y].density < this.material.density) {
            grid[x + 1][y + 1] = this.material;
            colorCache[x + 1][y + 1] = colorCache[x][y];
            grid[x][y] = materials.EMPTY;
            colorCache[x][y] = '#000000';
        }
    }
}

// Create instances of material types
export const materialTypes = {
    WATER: new Water(materials.WATER),
    SAND: new MovableSolid(materials.SAND),
    SOIL: new MovableSolid(materials.SOIL),
    STONE: new ImmovableSolid(materials.STONE),
    MUD: new MovableSolid(materials.MUD),
    GRAVEL: new MovableSolid(materials.GRAVEL)
};

// Keep the seed update function as is since it's special
export function updateSeed(x, y, grid, colorCache, gridWidth, gridHeight, seedDNA, activeBushes, currentPlantType) {
    // Check if seed has hit soil, sand, or mud
    if (y + 1 < gridHeight && (grid[x][y + 1] === materials.SOIL || grid[x][y + 1] === materials.SAND || grid[x][y + 1] === materials.MUD)) {
        // Create a new bush
        const bush = new Bush();
        bush.plant(x, y, grid, colorCache);
        activeBushes.push(bush);
        // Clear the seed position
        grid[x][y] = materials.EMPTY;
        colorCache[x][y] = '#000000';
        return;
    }

    // Store current position
    const currentX = x;
    const currentY = y;
    let moved = false;

    // Try to move down
    if (y + 1 < gridHeight && grid[x][y + 1] === materials.EMPTY) {
        x = x;
        y = y + 1;
        moved = true;
    }
    // Try to move down-left
    else if (y + 1 < gridHeight && x - 1 >= 0 && grid[x - 1][y + 1] === materials.EMPTY) {
        x = x - 1;
        y = y + 1;
        moved = true;
    }
    // Try to move down-right
    else if (y + 1 < gridHeight && x + 1 < gridWidth && grid[x + 1][y + 1] === materials.EMPTY) {
        x = x + 1;
        y = y + 1;
        moved = true;
    }

    // If we moved, update the grid
    if (moved) {
        // Clear old position first
        grid[currentX][currentY] = materials.EMPTY;
        colorCache[currentX][currentY] = '#000000';
        
        // Then set new position
        grid[x][y] = materials.SEED;
        colorCache[x][y] = materials.SEED.getVariedColor();
    }
}