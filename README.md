# Acute Edge Voronoi Mesh Evolution

A dynamic Three.js application that creates an evolving Voronoi mesh system based on acute angle edge detection. This creates a Conway's Game of Life-like evolution where edges expand or contract based on their geometric relationships.

## System Overview

This project implements a multi-step evolution system:

### Step 1: Voronoi Mesh Generation
- Creates a random Voronoi diagram with adjustable cell count
- Renders white filled cells with black edge lines
- Extracts edge connectivity information for analysis

### Step 2: Acute Angle Detection
- Each edge analyzes its connections with other edges
- Detects acute angles (<90°) at shared vertices
- Calculates expand/shrink values:
  - **Expanding Edges**: +5% per acute angle connection (e.g., 3 connections = +15%)
  - **Shrinking Edges**: -5% if no acute angle connections
  - Percentage rates are adjustable in the UI

### Step 3: Spring-Damper Evolution
- Applies physical changes to the mesh based on calculated values
- Uses spring-damper physics to prevent oscillation
- Reconstructs cell geometry from modified edges
- Creates smooth, organic-looking deformations

### Step 4: Iterative Loop
- Returns to Step 2 with the modified mesh
- Recalculates acute angles on the new geometry
- Continues evolution creating dynamic, emergent patterns

## Features

- **Interactive Controls**: Adjust cell count, evolution rate, and speed
- **Real-time Statistics**: Monitor acute edges, expanding/shrinking counts
- **Smooth Animation**: Spring-damper physics prevents jarring transitions
- **Pause/Resume**: Control evolution at any time
- **Regeneration**: Create new random meshes

## Installation & Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start Development Server**:
   ```bash
   npm run dev
   ```

3. **Open in Browser**: Navigate to `http://localhost:5173`

## Usage

### Controls
- **Cell Count**: Adjust the number of Voronoi cells (10-200)
- **Expand/Shrink Rate**: Control the percentage change per acute connection (1-20%)
- **Evolution Speed**: Set time between evolution steps (100-2000ms)
- **Regenerate Mesh**: Create a new random Voronoi diagram
- **Start Evolution**: Begin the acute angle evolution process
- **Pause Evolution**: Stop/resume the evolution

### Understanding the Evolution

1. **Initial State**: Random Voronoi mesh with uniform appearance
2. **First Evolution**: Edges with acute connections expand, others shrink
3. **Continued Evolution**: New geometry creates different acute relationships
4. **Emergent Patterns**: Complex, organic structures emerge over time

## Technical Architecture

### Core Classes

- **`AcuteEdgeVoronoiApp`**: Main application orchestrator
- **`VoronoiMesh`**: Handles mesh generation and visualization
- **`EdgeAnalyzer`**: Implements acute angle detection and value calculation
- **`MeshEvolver`**: Applies spring-damper physics for smooth evolution

### Key Algorithms

- **Voronoi Generation**: Uses D3-Delaunay for efficient triangulation
- **Angle Calculation**: Vector dot product for precise angle measurement
- **Spring-Damper Physics**: Controlled deformation with stability constraints
- **Polygon Reconstruction**: Rebuilds cell geometry from modified edges

## Dependencies

- **Three.js**: 3D rendering and mesh management
- **D3-Delaunay**: Efficient Voronoi diagram generation
- **Vite**: Development server and bundling

## Configuration

All system parameters are easily adjustable:

```javascript
// In main.js - Evolution parameters
this.config = {
    cellCount: 50,          // Number of Voronoi cells
    changeRate: 5,          // Percentage for expand/shrink
    evolutionSpeed: 500     // Milliseconds between steps
};

// In MeshEvolver.js - Physics parameters
this.config = {
    springStrength: 0.1,    // Spring force strength
    dampingFactor: 0.8,     // Damping to prevent oscillation
    maxDeformation: 0.5,    // Maximum change per step
    stabilityThreshold: 0.001  // Minimum change threshold
};
```

## Performance Notes

- Optimized for meshes with 50-200 cells
- Evolution calculations are O(E²) where E is edge count
- Spring-damper system prevents mesh collapse
- Geometry updates use efficient Three.js buffer updates

## Future Enhancements

- 3D Voronoi evolution
- Different evolution rules (obtuse angles, edge length, etc.)
- Color-coded visualization of edge states
- Export capabilities for evolved meshes
- Interactive mesh editing

## License

MIT License - Feel free to use and modify for your projects!

---

This project demonstrates how simple geometric rules can create complex, emergent behaviors in computational systems, similar to cellular automata but applied to continuous geometric spaces. 