export function drawGrid(ctx, grid, colorCache, sandSize) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0,0,ctx.canvas.width,ctx.canvas.height);
    for (let x=0; x<grid.length; x++) {
      for (let y=0; y<grid[0].length; y++) {
        if (grid[x][y] !== materials.EMPTY) {
          ctx.fillStyle = colorCache[x][y];
          ctx.fillRect(x*sandSize, y*sandSize, sandSize, sandSize);
        }
      }
    }
  }
  export function drawBrush(ctx, mouseX,mouseY,brushSize,sandSize) { /* ... */ }