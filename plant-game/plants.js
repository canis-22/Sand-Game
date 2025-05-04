import { materials } from './materials.js';

export class Tree {
    constructor() {
        this.type = 'tree';
    }
    plant(x, y, grid, colorCache) {  
        return;
    }
}

export class Bush {
    constructor(maxSize = 100, stopChance = 0.05, growthDelay = 2, maxBudsPerCell = 5) {
        this.type = 'bush';
        this.woodCells = new Set();      // Strings "x,y" for wood cells
        this.rootCells = new Set();      // Strings "x,y" for root cells
        this.leafCells = new Set();      // Strings "x,y" for leaf cells
        this.tips = [];                  // Active wood frontier cells
        this.rootTips = [];              // Active root frontier cells
        this.maxRootSize = Math.floor(Math.random() * 401) + 100; // Random size between 100 and 500
        this.stopChance = stopChance;
        this.growthDelay = growthDelay;
        this.growthCounter = 0;
        this.originX = 0;
        this.originY = 0;
        this.maxBudsPerCell = maxBudsPerCell;
        this.isGrowing = true;
        this.grid = null;
        this.colorCache = null;
        this.mudRoots = 0;               // Count of roots in mud
    }

    plant(x, y, grid, colorCache) {
        this.grid = grid;
        this.colorCache = colorCache;
        
        // Store origin for directional bias
        this.originX = x;
        this.originY = y;

        // Turn seed into wood
        grid[x][y] = materials.WOOD;
        colorCache[x][y] = materials.WOOD.getVariedColor();
        this.woodCells.add(`${x},${y}`);
        this.rootCells.add(`${x},${y}`);

        // Initialize as first tip
        this.tips.push({ x, y, buds: this.maxBudsPerCell });
        this.rootTips.push({ x, y, buds: this.maxBudsPerCell });
        this.isGrowing = true;
    }

    spawnLeafCluster(x, y, leafChance = 0.7) {
        // all 8 neighbors plus one more layer out
        const leafDirs = [
            // Inner layer (original 8 neighbors)
            {x: -1, y: -1}, {x:  0, y: -1}, {x:  1, y: -1},
            {x: -1, y:  0},               {x:  1, y:  0},
            {x: -1, y:  1}, {x:  0, y:  1}, {x:  1, y:  1},
            // Outer layer (new positions)
            {x: -2, y: -2}, {x: -1, y: -2}, {x:  0, y: -2}, {x:  1, y: -2}, {x:  2, y: -2},
            {x: -2, y: -1},                                           {x:  2, y: -1},
            {x: -2, y:  0},                                           {x:  2, y:  0},
            {x: -2, y:  1},                                           {x:  2, y:  1},
            {x: -2, y:  2}, {x: -1, y:  2}, {x:  0, y:  2}, {x:  1, y:  2}, {x:  2, y:  2}
        ];

        // Shuffle the directions to create more organic patterns
        for (let i = leafDirs.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [leafDirs[i], leafDirs[j]] = [leafDirs[j], leafDirs[i]];
        }

        for (const d of leafDirs) {
            const lx = x + d.x;
            const ly = y + d.y;
            if (
                lx >= 0 && lx < this.grid.length &&
                ly >= 0 && ly < this.grid[0].length &&
                this.grid[lx][ly] === materials.EMPTY
            ) {
                // Calculate distance from center
                const distance = Math.sqrt(d.x * d.x + d.y * d.y);
                // Higher chance for closer cells, lower for outer cells
                const distanceFactor = 1 - (distance * 0.2);
                // Add some randomness to the pattern
                const randomFactor = 0.8 + Math.random() * 0.4;
                // Combine factors for final chance
                const finalChance = leafChance * distanceFactor * randomFactor;

                if (Math.random() < finalChance) {
                    this.grid[lx][ly] = materials.PLANT;
                    this.colorCache[lx][ly] = materials.PLANT.getVariedColor();
                    this.leafCells.add(`${lx},${ly}`);
                }
            }
        }
    }

    changeRootsToBlue() {
        // Convert all root cells to blue
        for (const cell of this.rootCells) {
            const [x, y] = cell.split(',').map(Number);
            this.colorCache[x][y] = '#0000FF';  // Pure blue color
        }
    }

    update() {
        if (!this.isGrowing) return;

        // build in frame delay
        this.growthCounter++;
        if (this.growthCounter < this.growthDelay) return;
        this.growthCounter = 0;

        // stop if no tips left
        if (this.tips.length === 0 && this.rootTips.length === 0) {
            this.isGrowing = false;
            // Spawn final leaf clusters at remaining tips
            for (const t of this.tips) {
                this.spawnLeafCluster(t.x, t.y, 0.7);
            }
            this.changeRootsToBlue();  // Change roots to blue when growth stops
            return;
        }

        // Update roots if they haven't reached max size
        if (this.rootCells.size < this.maxRootSize) {
            this.updateRoots();
        } else {
            // If roots have reached max size, clear all tips and stop growing
            this.rootTips = [];
            this.tips = [];
            this.isGrowing = false;
            this.changeRootsToBlue();  // Change roots to blue when max size reached
            return;
        }

        // Update plant only if roots are still growing
        if (this.rootCells.size < this.maxRootSize && this.rootTips.length > 0) {
            this.updatePlant();
        }
    }

    updateRoots() {
        if (this.rootTips.length === 0) return;

        // pick a random root tip
        const idx = Math.floor(Math.random() * this.rootTips.length);
        const tip = this.rootTips[idx];

        // per-tip stopChance: maybe kill this root
        if (Math.random() < this.stopChance) {
            this.rootTips.splice(idx, 1);
            return;
        }

        // possible root growth directions (downward bias)
        const directions = [
            { x: 0,  y: 1,  weight: 2 },   // down
            { x: -1, y: 1,  weight: 1 },   // down-left
            { x: 1,  y: 1,  weight: 1 },   // down-right
            { x: -1, y: 0,  weight: 0.5 }, // left
            { x: 1,  y: 0,  weight: 0.5 }  // right
        ];

        // weighted random selection
        const totalW = directions.reduce((sum, d) => sum + d.weight, 0);
        let r = Math.random() * totalW;
        let chosen;
        for (const d of directions) {
            r -= d.weight;
            if (r <= 0) { chosen = d; break; }
        }

        // candidate position
        const nx = tip.x + chosen.x;
        const ny = tip.y + chosen.y;

        // attempt root growth - in soil or mud
        if (
            nx >= 0 && nx < this.grid.length &&
            ny >= 0 && ny < this.grid[0].length &&
            (this.grid[nx][ny] === materials.SOIL || this.grid[nx][ny] === materials.MUD) &&
            this.rootCells.size < this.maxRootSize
        ) {
            // Check if the new position is mud
            const isMud = this.grid[nx][ny] === materials.MUD;
            if (isMud) {
                this.mudRoots++;
                // Adjust growth parameters based on mud roots
                this.maxRootSize = Math.min(this.maxRootSize * 1.5, 1000); // Increase max size up to 1000
                this.stopChance = Math.max(this.stopChance * 0.8, 0.01);   // Decrease stop chance
                this.maxBudsPerCell = Math.min(this.maxBudsPerCell + 1, 8); // Increase buds
            }

            this.grid[nx][ny] = materials.ROOT;
            this.colorCache[nx][ny] = materials.ROOT.getVariedColor();
            this.rootCells.add(`${nx},${ny}`);
            // new root tip
            this.rootTips.push({ x: nx, y: ny, buds: this.maxBudsPerCell });
            // decrement buds on parent tip
            tip.buds -= 1;
            if (tip.buds <= 0) {
                this.rootTips.splice(idx, 1);
            }
        } else {
            // can't grow here, drop the tip
            this.rootTips.splice(idx, 1);
        }
    }

    updatePlant() {
        if (this.tips.length === 0) return;

        // Adjust leaf cluster size based on mud roots
        const leafClusterSize = 0.7 + (this.mudRoots * 0.1); // Increase leaf size with mud roots

        // pick a random tip
        const idx = Math.floor(Math.random() * this.tips.length);
        const tip = this.tips[idx];

        // per-tip stopChance: maybe kill this branch
        if (Math.random() < this.stopChance) {
            this.tips.splice(idx, 1);
            this.spawnLeafCluster(tip.x, tip.y, leafClusterSize);
            return;
        }

        // compute bias from origin
        const dx = tip.x - this.originX;
        const dy = tip.y - this.originY;

        // possible directions (including diagonals)
        const directions = [
            { x: 0,  y: -1, weight: 1 },  // up
            { x: -1, y:  0, weight: 1 },  // left
            { x: 1,  y:  0, weight: 1 },  // right
            { x: 1,  y: -1, weight: 0.8 },// up-right
            { x: -1, y: -1, weight: 0.8 },// up-left
            { x: 1,  y:  1, weight: 0.6 },// down-right
            { x: -1, y:  1, weight: 0.6 } // down-left
        ];

        // bias away from origin: encourage outward growth
        directions.forEach(dir => {
            if (dir.x * dx > 0) dir.weight += 0.5;   // horizontal push if on same side
            if (dir.y * dy > 0) dir.weight += 1.0;   // vertical push if below origin
        });

        // optional: widen crown for large dx
        if (Math.abs(dx) > this.maxRootSize * 0.1) {
            directions.filter(d => d.x !== 0).forEach(d => d.weight += 0.3);
        }

        // weighted random selection
        const totalW = directions.reduce((sum, d) => sum + d.weight, 0);
        let r = Math.random() * totalW;
        let chosen;
        for (const d of directions) {
            r -= d.weight;
            if (r <= 0) { chosen = d; break; }
        }

        // candidate position
        const nx = tip.x + chosen.x;
        const ny = tip.y + chosen.y;

        // attempt growth - allow growth into leaf cells
        if (
            nx >= 0 && nx < this.grid.length &&
            ny >= 0 && ny < this.grid[0].length &&
            (this.grid[nx][ny] === materials.EMPTY || this.leafCells.has(`${nx},${ny}`))
        ) {
            // If growing into a leaf cell, remove it from leaf tracking
            if (this.leafCells.has(`${nx},${ny}`)) {
                this.leafCells.delete(`${nx},${ny}`);
            }
            
            this.grid[nx][ny] = materials.WOOD;
            this.colorCache[nx][ny] = materials.WOOD.getVariedColor();
            this.woodCells.add(`${nx},${ny}`);
            // new tip at leaf
            this.tips.push({ x: nx, y: ny, buds: this.maxBudsPerCell });
            // decrement buds on parent tip
            tip.buds -= 1;
            if (tip.buds <= 0) {
                this.tips.splice(idx, 1);
                this.spawnLeafCluster(tip.x, tip.y, leafClusterSize);
            }

            // Spawn leaves around the new wood cell
            this.spawnLeafCluster(nx, ny, 0.5); // Lower leaf chance for growing tips
        } else {
            // can't grow here, drop the tip
            this.tips.splice(idx, 1);
            this.spawnLeafCluster(tip.x, tip.y, leafClusterSize);
        }
    }
}

export class Grass {
    constructor() {
        this.type = 'grass';
    }

    plant(x, y, grid, colorCache) {
        return;
    }

    update() {
        return;
    }
}

export class SeedDNA {
  constructor() {
        this.growthRate = 0.1;
        this.maxAge = 100;
        this.branchChance = 0.3;
        this.branchLength = 3;
        this.colorVariation = 0.2;
        this.archetype = new Bush(); // Create a new Bush instance for each seed
        this.maxPenetration = 5; // Maximum number of soil/sand cells a seed can penetrate
  }
}