class Node {
  constructor(row, col, isWall = false, weight = 1) {
    this.row = row;
    this.col = col;
    this.isWall = isWall;
    this.weight = weight;
    this.distance = Infinity; // used in Dijkstra
    this.f = Infinity;
    this.g = Infinity;
    this.h = 0;
    this.previousNode = null;
    this.visited = false;
  }
}


class Grid {
  constructor(rows, cols) {
    this.rows = rows;
    this.cols = cols;
    this.grid = this.initializeGrid();
  }
  
  initializeGrid() {
    return Array.from({ length: this.rows }, (_, row) =>
      Array.from({ length: this.cols }, (_, col) => new Node(row, col))
    );
  }
}

function handleCellClick(e) {
  const cell = e.target;
  const node = cell.node;

  if (mode === "start") {
    if (startCell) startCell.classList.remove("start");
    startCell = cell;
    node.isWall = false;
    cell.classList.remove("end", "wall");
    cell.classList.add("start");
  } else if (mode === "end") {
    if (endCell) endCell.classList.remove("end");
    endCell = cell;
    node.isWall = false;
    cell.classList.remove("start", "wall");
    cell.classList.add("end");
  } if (mode === "wall") {
    cell.classList.add("wall");
    node.isWall = true;
    node.weight = Infinity;
  } if (mode === "monkey") {
    cell.classList.add("monkey");
    node.isWall = false;
    node.weight = 10; // higher than bushes
  }else if (mode === "bush") {
    cell.classList.add("bush");
    node.isWall = false;
    node.weight = 5; // higher than normal path
  }

}


// A* implementation with path check
function aStar(grid, startNode, endNode) {
  const openSet = [startNode];
  const visitedNodesInOrder = [];

  startNode.g = 0;
  startNode.h = heuristic(startNode, endNode);
  startNode.f = startNode.h;

  while (openSet.length > 0) {
    // Sort by lowest f score
    openSet.sort((a, b) => a.f - b.f);
    const current = openSet.shift();

    if (current.isWall) continue;
    if (current === endNode) return visitedNodesInOrder;

    current.visited = true;
    visitedNodesInOrder.push(current);

    const neighbors = getUnvisitedNeighbors(current, grid);
    for (const neighbor of neighbors) {
      const tempG = current.g + neighbor.weight;

      if (tempG < neighbor.g) {
        neighbor.g = tempG;
        neighbor.h = heuristic(neighbor, endNode);
        neighbor.f = neighbor.g + neighbor.h;
        neighbor.previousNode = current;

        if (!openSet.includes(neighbor)) {
          openSet.push(neighbor);
        }
      }
    }
  }

  // No path found, return null
  return null;
}

// Dijkstra implementation
function dijkstra(grid, startNode, endNode) {
  const visitedNodesInOrder = [];
  const unvisitedNodes = [];

  startNode.distance = 0;
  unvisitedNodes.push(startNode);

  while (unvisitedNodes.length > 0) {
    // Sort nodes by shortest distance
    unvisitedNodes.sort((a, b) => a.distance - b.distance);
    const current = unvisitedNodes.shift();

    if (current.isWall) continue;
    if (current.distance === Infinity) break; // Unreachable
    if (current === endNode) return visitedNodesInOrder;

    current.visited = true;
    visitedNodesInOrder.push(current);

    const neighbors = getUnvisitedNeighbors(current, grid);
    for (const neighbor of neighbors) {
      const newDist = current.distance + neighbor.weight;
      if (newDist < neighbor.distance) {
        neighbor.distance = newDist;
        neighbor.previousNode = current;
        if (!unvisitedNodes.includes(neighbor)) {
          unvisitedNodes.push(neighbor);
        }
      }
    }
  }

  return null; // No path found
}


function heuristic(nodeA, nodeB) {
  return Math.abs(nodeA.row - nodeB.row) + Math.abs(nodeA.col - nodeB.col); // Manhattan distance
}

function getUnvisitedNeighbors(node, grid) {
  const neighbors = [];
  const { row, col } = node;

  if (row > 0) neighbors.push(grid.grid[row - 1][col]);     // Up
  if (row < grid.rows - 1) neighbors.push(grid.grid[row + 1][col]); // Down
  if (col > 0) neighbors.push(grid.grid[row][col - 1]);     // Left
  if (col < grid.cols - 1) neighbors.push(grid.grid[row][col + 1]); // Right

  return neighbors.filter(n => !n.visited);
}

function animatePath(visitedNodes, path) {
  const speed = parseInt(document.getElementById("speed").value);

  for (let i = 0; i < visitedNodes.length; i++) {
    setTimeout(() => {
      const node = visitedNodes[i];
      const cell = grid[node.row][node.col];
      if (!cell.classList.contains("start") && !cell.classList.contains("end"))
        cell.classList.add("visited");
    }, speed * i);
  }

  setTimeout(() => {
    for (let i = 0; i < path.length; i++) {
      setTimeout(() => {
        const node = path[i];
        const cell = grid[node.row][node.col];
        if (!cell.classList.contains("start") && !cell.classList.contains("end"))
          cell.classList.add("path");
      }, speed * i * 1.5);
    }
  }, speed * visitedNodes.length);
}

function getNodesInShortestPathOrder(endNode) {
  const path = [];
  let current = endNode;
  while (current !== null) {
    path.unshift(current);
    current = current.previousNode;
  }
  return path;
}

// Clear grid function
function clearGrid() {
  // Reset the grid state
  startCell = null;
  endCell = null;

  // Reset the visual grid
  for (let row of grid) {
    for (let cell of row) {
      cell.classList.remove("visited", "path", "start", "end", "wall");
    }
  }

  // Reset the logical grid
  for (let row of logicalGrid.grid) {
    for (let node of row) {
      node.visited = false;
      node.previousNode = null;
      node.g = Infinity;
      node.h = 0;
      node.f = Infinity;
    }
  }

  
}
// Function to handle the active button state
function updateActiveButton(selectedMode) {
  // Clear active class from all buttons
  document.getElementById("start").classList.remove("active");
  document.getElementById("end").classList.remove("active");
  document.getElementById("wall").classList.remove("active");
  document.getElementById("monkey").classList.remove("active");
  document.getElementById("bush").classList.remove("active");

  // Add active class to the selected button
  document.getElementById(selectedMode).classList.add("active");
}

function createGrid(rows, cols) {
  gridElement.innerHTML = ""; // Clear existing grid
  logicalGrid.grid = [];
  grid.length = 0;
  logicalGrid.rows = rows;
  logicalGrid.cols = cols;

  for (let row = 0; row < rows; row++) {
    const currentRow = [];
    const logicalRow = [];
    for (let col = 0; col < cols; col++) {
      const cell = document.createElement("div");
      cell.classList.add("cell");
      cell.style.width = cell.style.height = "40px";
      const node = new Node(row, col);
      cell.node = node;

      cell.addEventListener("click", handleCellClick);
      gridElement.appendChild(cell);
      currentRow.push(cell);
      logicalRow.push(node);
    }
    grid.push(currentRow);
    logicalGrid.grid.push(logicalRow);
  }

  gridElement.style.gridTemplateColumns = `repeat(${cols}, 40px)`;
  gridElement.style.gridTemplateRows = `repeat(${rows}, 40px)`;
}



const gridElement = document.getElementById("grid");
const ROWS = 10;
const COLS = 10;
let mode = "wall"; // default mode
let startCell = null;
let endCell = null;

const grid = [];
const logicalGrid = new Grid(ROWS, COLS); // Create logic grid

// Create visual + logic grid
for (let row = 0; row < ROWS; row++) {
  const currentRow = [];
  for (let col = 0; col < COLS; col++) {
    const cell = document.createElement("div");
    cell.classList.add("cell");
    cell.dataset.row = row;
    cell.dataset.col = col;

    const node = logicalGrid.grid[row][col];
    cell.node = node; // Link DOM cell to its logic node

    cell.addEventListener("click", handleCellClick);
    gridElement.appendChild(cell);
    currentRow.push(cell);
  }
  grid.push(currentRow);
}

// Mode buttons
document.getElementById("start").addEventListener("click", () => {
  mode = "start";
  updateActiveButton("start");
});

document.getElementById("end").addEventListener("click", () => {
  mode = "end";
  updateActiveButton("end");
});

document.getElementById("wall").addEventListener("click", () => {
  mode = "wall";
  updateActiveButton("wall");
});

document.getElementById("monkey").addEventListener("click", () => {
  mode = "monkey";
  updateActiveButton("monkey");
});

document.getElementById("bush").addEventListener("click", () => {
  mode = "bush";
  updateActiveButton("bush");
});


// Stub for pathfinding button
document.getElementById("findPath").addEventListener("click", () => {
  if (!startCell || !endCell) {
    alert("Please set a start and end point first.");
    return;
  }

  const selectedAlgorithm = document.getElementById("algorithm").value;

  // Reset grid state
  for (let row of logicalGrid.grid) {
    for (let node of row) {
      node.distance = Infinity;
      node.f = Infinity;
      node.g = Infinity;
      node.h = 0;
      node.previousNode = null;
      node.visited = false;
    }
  }

  for (let row of grid) {
    for (let cell of row) {
      cell.classList.remove("visited", "path");
    }
  }

  const startNode = startCell.node;
  const endNode = endCell.node;
  let visitedNodes;

  if (selectedAlgorithm === "astar") {
    visitedNodes = aStar(logicalGrid, startNode, endNode);
  } else if (selectedAlgorithm === "dijkstra") {
    visitedNodes = dijkstra(logicalGrid, startNode, endNode);
  }

  if (!visitedNodes) {
    alert("No path found!");
    clearGrid();
    return;
  }

  const shortestPath = getNodesInShortestPathOrder(endNode);
  animatePath(visitedNodes, shortestPath); // reuse animation function
});





// Clear to reset the grid
document.getElementById("clear").addEventListener("click", () => {
  // Reset the grid state
  startCell = null;
  endCell = null;
  
  // Reset the visual grid
  for (let row of grid) {
    for (let cell of row) {
      cell.classList.remove("visited", "path", "start", "end", "wall", "monkey", "bush");
    }
  }

  // Reset the logical grid
  for (let row of logicalGrid.grid) {
    for (let node of row) {
      node.visited = false;
      node.previousNode = null;
      node.g = Infinity;
      node.h = 0;
      node.f = Infinity;
    }
  }


});

// adjust grid size
document.getElementById("gridSize").addEventListener("change", (e) => {
  const size = parseInt(e.target.value);
  createGrid(size, size); // you'll need to refactor your grid creation logic into a function
});

