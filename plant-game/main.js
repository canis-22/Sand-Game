import { materials } from './materials.js';
import { Bush, SeedDNA } from './plants.js';
import { materialTypes, updateSeed } from './physics.js';
import { setupInput } from './input.js';

// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const gridWidth = 160;  // Doubled to maintain same visual size
const gridHeight = 120; // Doubled to maintain same visual size
const cellSize = 5;     // Reduced from 10 to 5

// Game state
const grid = Array(gridWidth).fill().map(() => Array(gridHeight).fill(materials.EMPTY));
const colorCache = Array(gridWidth).fill().map(() => Array(gridHeight).fill('#000000'));
const activeBushes = [];
const seedDNA = new SeedDNA();
let currentPlantType = 'bush';  // Always bush

// Initialize grid with some materials
function initializeGrid() {
    // Add some stone at the bottom
    for (let x = 0; x < gridWidth; x++) {
        for (let y = gridHeight - 10; y < gridHeight; y++) {  // Adjusted for new grid size
            grid[x][y] = materials.STONE;
            colorCache[x][y] = materials.STONE.getVariedColor();
        }
    }

    // Add some soil above the stone
    for (let x = 0; x < gridWidth; x++) {
        for (let y = gridHeight - 30; y < gridHeight - 10; y++) {  // Adjusted for new grid size
            grid[x][y] = materials.SOIL;
            colorCache[x][y] = materials.SOIL.getVariedColor();
        }
    }
}

// Main game loop
function update() {
    // Update physics from bottom to top
    for (let y = gridHeight - 1; y >= 0; y--) {
        for (let x = 0; x < gridWidth; x++) {
            const material = grid[x][y];
            
            // Special case for seeds since they need additional parameters
            if (material === materials.SEED) {
                updateSeed(x, y, grid, colorCache, gridWidth, gridHeight, seedDNA, activeBushes, currentPlantType);
            }
            // For all other materials, use their material type's update method
            else if (material !== materials.EMPTY) {
                const materialType = Object.values(materialTypes).find(type => type.material === material);
                if (materialType) {
                    materialType.update(x, y, grid, colorCache, gridWidth, gridHeight);
                }
            }
        }
    }

    // Update plants
    for (const bush of activeBushes) {
        bush.update();
    }
}

// Drawing function
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    for (let x = 0; x < gridWidth; x++) {
        for (let y = 0; y < gridHeight; y++) {
            ctx.fillStyle = colorCache[x][y];
            ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        }
    }
}

// Game loop
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Initialize the game
function init() {
    // Set canvas size
    canvas.width = gridWidth * cellSize;
    canvas.height = gridHeight * cellSize;

    // Initialize grid
    initializeGrid();

    // Setup input handlers
    setupInput(canvas, grid, colorCache, gridWidth, gridHeight, activeBushes, seedDNA);

    // Start game loop
    gameLoop();
}

// Start the game
init();