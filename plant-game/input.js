import { materials } from './materials.js';
import { Bush } from './plants.js';

let currentMaterial = materials.SAND;
let isMouseDown = false;
let lastX = 0;
let lastY = 0;
let brushSize = 3;
const minBrushSize = 1;
const maxBrushSize = 10;
let lastSpawnTime = 0;
const spawnCooldown = 500; // 500ms cooldown between seed spawns

// Material key mappings for keyboard shortcuts
const materialKeys = {
    '1': 'seed',
    '2': 'water',
    '3': 'sand',
    '4': 'soil',
    '5': 'stone',
    '6': 'gravel'
};

export function setupInput(canvas, grid, colorCache, gridWidth, gridHeight, activeBushes, seedDNA) {
    // Prevent context menu on right click
    canvas.addEventListener('contextmenu', (e) => {
        e.preventDefault();
    });

    // Set up clear canvas button
    const clearButton = document.getElementById('clearButton');
    clearButton.addEventListener('click', () => {
        location.reload();
    });

    // Set up material selection buttons
    const materialButtonsContainer = document.getElementById('materialButtons');
    
    // Create buttons for each material (except EMPTY)
    Object.entries(materials).forEach(([key, material]) => {
        if (key !== 'EMPTY') {
            const button = document.createElement('button');
            button.className = 'material-btn';
            button.dataset.material = key.toLowerCase();
            
            // Add keyboard shortcut if available
            const keyMapping = Object.entries(materialKeys).find(([_, value]) => value === key.toLowerCase());
            const shortcut = keyMapping ? ` (${keyMapping[0]})` : '';
            
            // Create span for text to ensure it stays above the color overlay
            const textSpan = document.createElement('span');
            textSpan.textContent = `${material.name.charAt(0).toUpperCase() + material.name.slice(1)}${shortcut}`;
            button.appendChild(textSpan);

            // Set the material color as a CSS variable
            button.style.setProperty('--material-color', material.color);
            
            // Set initial active button
            if (material === currentMaterial) {
                button.classList.add('active');
            }
            
            button.addEventListener('click', () => {
                // Remove active class from all buttons
                document.querySelectorAll('.material-btn').forEach(btn => btn.classList.remove('active'));
                // Add active class to clicked button
                button.classList.add('active');
                // Set current material
                currentMaterial = material;
            });
            
            materialButtonsContainer.appendChild(button);
        }
    });

    // Create a separate canvas for the brush outline
    const outlineCanvas = document.createElement('canvas');
    outlineCanvas.width = canvas.width;
    outlineCanvas.height = canvas.height;
    outlineCanvas.style.position = 'absolute';
    outlineCanvas.style.pointerEvents = 'none';
    outlineCanvas.style.left = canvas.offsetLeft + 'px';
    outlineCanvas.style.top = canvas.offsetTop + 'px';
    canvas.parentNode.insertBefore(outlineCanvas, canvas.nextSibling);

    // Draw brush outline
    function drawBrushOutline(x, y) {
        const ctx = outlineCanvas.getContext('2d');
        ctx.clearRect(0, 0, outlineCanvas.width, outlineCanvas.height);
        
        // Draw the brush outline
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x, y, brushSize * 5, 0, Math.PI * 2);
        ctx.stroke();
    }

    // Handle mouse wheel for brush size
    canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        if (e.deltaY < 0) {
            brushSize = Math.min(brushSize + 1, maxBrushSize);
        } else {
            brushSize = Math.max(brushSize - 1, minBrushSize);
        }
        // Update outline position
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        drawBrushOutline(x, y);
    });

    // Handle mouse movement for brush outline
    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        drawBrushOutline(x, y);
    });

    // Handle mouse down
    canvas.addEventListener('mousedown', (e) => {
        isMouseDown = true;
        handleMouseEvent(e);
    });

    // Handle mouse up
    canvas.addEventListener('mouseup', () => {
        isMouseDown = false;
    });

    // Handle mouse move for drawing
    canvas.addEventListener('mousemove', (e) => {
        if (isMouseDown) {
            handleMouseEvent(e);
        }
    });

    // Add continuous drawing when mouse is held
    function handleContinuousDrawing() {
        if (isMouseDown && currentMaterial !== materials.SEED) {
            const rect = canvas.getBoundingClientRect();
            const x = Math.floor((lastX - rect.left) / 5);
            const y = Math.floor((lastY - rect.top) / 5);
            applyMaterial(x, y);
            requestAnimationFrame(handleContinuousDrawing);
        }
    }

    // Handle keyboard input
    document.addEventListener('keydown', (e) => {
        const materialKey = materialKeys[e.key];
        if (materialKey) {
            const material = materials[materialKey.toUpperCase()];
            if (material) {
                currentMaterial = material;
                // Update active button
                document.querySelectorAll('.material-btn').forEach(btn => {
                    btn.classList.remove('active');
                    if (btn.dataset.material === materialKey) {
                        btn.classList.add('active');
                    }
                });
            }
        }
    });

    function handleMouseEvent(e) {
        const rect = canvas.getBoundingClientRect();
        lastX = e.clientX;
        lastY = e.clientY;
        const x = Math.floor((e.clientX - rect.left) / 5);
        const y = Math.floor((e.clientY - rect.top) / 5);

        if (e.buttons === 1) { // Left click
            if (currentMaterial === materials.SEED) {
                // Spawn seed with cooldown
                if (Date.now() - lastSpawnTime > spawnCooldown) {
                    lastSpawnTime = Date.now();
                    grid[x][y] = materials.SEED;
                    colorCache[x][y] = materials.SEED.getVariedColor();
                }
            } else {
                applyMaterial(x, y);
                // Start continuous drawing
                requestAnimationFrame(handleContinuousDrawing);
            }
        } else if (e.buttons === 2) { // Right click
            eraseMaterial(x, y);
            // Start continuous erasing
            requestAnimationFrame(handleContinuousErasing);
        }
    }

    function applyMaterial(x, y) {
        // Apply current material with brush size
        for (let i = -brushSize; i <= brushSize; i++) {
            for (let j = -brushSize; j <= brushSize; j++) {
                const nx = x + i;
                const ny = y + j;
                if (nx >= 0 && nx < gridWidth && ny >= 0 && ny < gridHeight) {
                    if (i * i + j * j <= brushSize * brushSize) {
                        grid[nx][ny] = currentMaterial;
                        colorCache[nx][ny] = currentMaterial.getVariedColor();
                    }
                }
            }
        }
    }

    function eraseMaterial(x, y) {
        // Erase material with brush size
        for (let i = -brushSize; i <= brushSize; i++) {
            for (let j = -brushSize; j <= brushSize; j++) {
                const nx = x + i;
                const ny = y + j;
                if (nx >= 0 && nx < gridWidth && ny >= 0 && ny < gridHeight) {
                    if (i * i + j * j <= brushSize * brushSize) {
                        grid[nx][ny] = materials.EMPTY;
                        colorCache[nx][ny] = '#000000';
                    }
                }
            }
        }
    }

    // Add continuous erasing when right mouse button is held
    function handleContinuousErasing() {
        if (isMouseDown && e.buttons === 2) {
            const rect = canvas.getBoundingClientRect();
            const x = Math.floor((lastX - rect.left) / 5);
            const y = Math.floor((lastY - rect.top) / 5);
            eraseMaterial(x, y);
            requestAnimationFrame(handleContinuousErasing);
        }
    }
}

function handleInput(x, y, grid, colorCache, gridWidth, gridHeight, activeBushes, seedDNA) {
    // Apply the current material in a brush size radius
    for (let dx = -brushSize + 1; dx < brushSize; dx++) {
        for (let dy = -brushSize + 1; dy < brushSize; dy++) {
            const nx = x + dx;
            const ny = y + dy;
            
            // Check if within bounds
            if (nx >= 0 && nx < gridWidth && ny >= 0 && ny < gridHeight) {
                // Check if within brush radius
                if (Math.sqrt(dx * dx + dy * dy) < brushSize) {
                    // Handle seed placement
                    if (currentMaterial === materials.SEED) {
                        // Create a new seed with bush type
                        grid[nx][ny] = materials.SEED;
                        colorCache[nx][ny] = materials.SEED.getVariedColor();
                        seedDNA.archetype = new Bush();
                    } else {
                        // Handle other materials
                        grid[nx][ny] = currentMaterial;
                        colorCache[nx][ny] = currentMaterial.getVariedColor();
                    }
                }
            }
        }
    }
  }