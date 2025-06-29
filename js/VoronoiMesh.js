import * as THREE from 'three';
import { Delaunay } from 'd3-delaunay';

/**
 * VoronoiMesh class handles the generation and management of the Voronoi diagram
 * Step 1: Creates random Voronoi mesh with black edges and white cells
 */
export class VoronoiMesh {
    constructor(scene) {
        this.scene = scene;
        
        // Mesh components
        this.cellMesh = null;       // White filled cells
        this.edgeMesh = null;       // Black edge lines
        
        // Voronoi data structures
        this.points = [];           // Original seed points
        this.voronoi = null;        // Delaunay/Voronoi structure
        this.cells = [];            // Cell polygon data
        this.edges = [];            // Edge line data with connectivity info
        
        // Mesh bounds for generation
        this.bounds = {
            minX: -8, maxX: 8,
            minY: -6, maxY: 6
        };
        
        // Periodic boundary settings
        this.periodicBoundaries = true;
        this.boundaryWidth = this.bounds.maxX - this.bounds.minX;  // 16
        this.boundaryHeight = this.bounds.maxY - this.bounds.minY; // 12
        
        console.log('🔶 VoronoiMesh initialized');
    }
    
    /**
     * Generate a new random Voronoi mesh with specified number of cells
     * @param {number} cellCount - Number of Voronoi cells to generate
     */
    generate(cellCount) {
        // Step 1a: Generate random seed points
        this.generateRandomPoints(cellCount);
        
        // Step 1b: Create Voronoi diagram using Delaunay triangulation
        this.createVoronoiDiagram();
        
        // Step 1c: Extract cell and edge data
        this.extractCellData();
        this.extractEdgeData();
        
        // Step 1d: Create visual mesh (white cells, black edges)
        this.createVisualMesh();
        
        console.log(`📐 Generated Voronoi mesh: ${cellCount} cells, ${this.edges.length} edges`);
    }
    
    /**
     * Regenerate the Voronoi diagram from current seed points
     * This is called after seed points have been moved by evolution
     */
    regenerateFromSeeds() {
        // Step 1b: Create Voronoi diagram using current points
        this.createVoronoiDiagram();
        
        // Step 1c: Extract cell and edge data
        this.extractCellData();
        this.extractEdgeData();
        
        // Step 1d: Update visual mesh
        this.createVisualMesh();
        
        console.log(`🔄 Regenerated mesh from moved seeds: ${this.cells.length} cells, ${this.edges.length} edges`);
    }
    
    /**
     * Get the current seed points for evolution
     * @returns {Array} Array of seed points
     */
    getSeedPoints() {
        return this.points;
    }
    
    /**
     * Generate random points within the mesh bounds
     */
    generateRandomPoints(count) {
        this.points = [];
        
        for (let i = 0; i < count; i++) {
            const x = Math.random() * (this.bounds.maxX - this.bounds.minX) + this.bounds.minX;
            const y = Math.random() * (this.bounds.maxY - this.bounds.minY) + this.bounds.minY;
            this.points.push([x, y]);
        }
    }
    
    /**
     * Create Voronoi diagram using D3 Delaunay
     */
    createVoronoiDiagram() {
        let allPoints = [...this.points];
        
        // For periodic boundaries, create ghost points around the edges
        if (this.periodicBoundaries) {
            const ghostPoints = this.createGhostPoints();
            allPoints = allPoints.concat(ghostPoints);
        }
        
        // Create Delaunay triangulation with all points (real + ghosts)
        const delaunay = Delaunay.from(allPoints);
        
        // Create Voronoi diagram with bounds
        this.voronoi = delaunay.voronoi([
            this.bounds.minX, this.bounds.minY, 
            this.bounds.maxX, this.bounds.maxY
        ]);
    }
    
    /**
     * Create ghost points around boundaries for periodic conditions
     */
    createGhostPoints() {
        const ghostPoints = [];
        
        for (let i = 0; i < this.points.length; i++) {
            const [x, y] = this.points[i];
            
            // Create 8 ghost copies around the main domain
            const offsets = [
                [-this.boundaryWidth, -this.boundaryHeight], // bottom-left
                [0, -this.boundaryHeight],                   // bottom
                [this.boundaryWidth, -this.boundaryHeight],  // bottom-right
                [-this.boundaryWidth, 0],                    // left
                [this.boundaryWidth, 0],                     // right
                [-this.boundaryWidth, this.boundaryHeight],  // top-left
                [0, this.boundaryHeight],                    // top
                [this.boundaryWidth, this.boundaryHeight]    // top-right
            ];
            
            for (const [dx, dy] of offsets) {
                ghostPoints.push([x + dx, y + dy]);
            }
        }
        
        return ghostPoints;
    }
    
    /**
     * Extract cell polygon data for rendering white filled areas
     */
    extractCellData() {
        this.cells = [];
        
        for (let i = 0; i < this.points.length; i++) {
            const cellPolygon = this.voronoi.cellPolygon(i);
            if (cellPolygon) {
                this.cells.push({
                    id: i,
                    polygon: cellPolygon,
                    center: this.points[i]
                });
            }
        }
    }
    
    /**
     * Extract edge data with connectivity information
     * This is crucial for Step 2 acute angle analysis
     */
    extractEdgeData() {
        this.edges = [];
        this.extractEdgesFromCells();
        
        // Now find connected edges for each edge (edges that share vertices)
        this.findConnectedEdges();
        
        console.log(`📐 Extracted ${this.edges.length} edges with connectivity info`);
        
        // Debug: Log some connectivity stats
        let totalConnections = 0;
        for (const edge of this.edges) {
            totalConnections += edge.connectedEdges.length;
        }
        console.log(`🔗 Total edge connections: ${totalConnections}, Average: ${(totalConnections / this.edges.length).toFixed(2)} per edge`);
    }
    
    /**
     * Fallback method: Extract edges from cell polygons
     */
    extractEdgesFromCells() {
        const edgeMap = new Map();
        
        // Iterate through all cells to find edges
        for (let cellIndex = 0; cellIndex < this.cells.length; cellIndex++) {
            const cell = this.cells[cellIndex];
            if (!cell.polygon) continue;
            
            // Process each edge of the cell polygon
            for (let i = 0; i < cell.polygon.length; i++) {
                const start = cell.polygon[i];
                const end = cell.polygon[(i + 1) % cell.polygon.length];
                
                // Create edge identifier (sorted to avoid duplicates)
                const edgeKey = this.createEdgeKey(start, end);
                
                if (!edgeMap.has(edgeKey)) {
                    const edge = {
                        id: this.edges.length,
                        start: { x: start[0], y: start[1] },
                        end: { x: end[0], y: end[1] },
                        length: Math.sqrt((end[0] - start[0]) ** 2 + (end[1] - start[1]) ** 2),
                        connectedCells: [cellIndex],
                        connectedEdges: [],  // Will be populated later
                        acuteAngleCount: 0,  // For Step 2 analysis
                        expandValue: 0       // For Step 3 evolution
                    };
                    
                    this.edges.push(edge);
                    edgeMap.set(edgeKey, edge);
                } else {
                    // Edge already exists, add this cell as connected
                    const existingEdge = edgeMap.get(edgeKey);
                    existingEdge.connectedCells.push(cellIndex);
                }
            }
        }
    }
    
    /**
     * Calculate circumcenter of a triangle
     */
    circumcenter(ax, ay, bx, by, cx, cy) {
        const dx = bx - ax;
        const dy = by - ay;
        const ex = cx - ax;
        const ey = cy - ay;
        const bl = dx * dx + dy * dy;
        const cl = ex * ex + ey * ey;
        const d = 0.5 / (dx * ey - dy * ex);
        
        if (!isFinite(d)) return null;
        
        return {
            x: ax + (ey * bl - dy * cl) * d,
            y: ay + (dx * cl - ex * bl) * d
        };
    }
    
    /**
     * Find edges that are connected to each edge (share vertices)
     * This is needed for acute angle analysis in Step 2
     */
    findConnectedEdges() {
        // Use a spatial grid approach to handle floating-point precision issues
        const vertexGrid = new Map();
        const gridSize = 0.01; // Grid cell size for grouping vertices
        
        // Function to get grid key for a vertex
        const getGridKey = (vertex) => {
            const gridX = Math.round(vertex.x / gridSize);
            const gridY = Math.round(vertex.y / gridSize);
            return `${gridX},${gridY}`;
        };
        
        // Group all edge endpoints by grid position
        for (let i = 0; i < this.edges.length; i++) {
            const edge = this.edges[i];
            
            // Add start vertex
            const startKey = getGridKey(edge.start);
            if (!vertexGrid.has(startKey)) {
                vertexGrid.set(startKey, []);
            }
            vertexGrid.get(startKey).push({ edgeIndex: i, isStart: true });
            
            // Add end vertex
            const endKey = getGridKey(edge.end);
            if (!vertexGrid.has(endKey)) {
                vertexGrid.set(endKey, []);
            }
            vertexGrid.get(endKey).push({ edgeIndex: i, isStart: false });
        }
        
        // Now connect edges that share grid positions
        for (let i = 0; i < this.edges.length; i++) {
            const edge = this.edges[i];
            edge.connectedEdges = [];
            
            // Check connections at start vertex
            const startKey = getGridKey(edge.start);
            const startNeighbors = vertexGrid.get(startKey) || [];
            for (const neighbor of startNeighbors) {
                if (neighbor.edgeIndex !== i) {
                    edge.connectedEdges.push(neighbor.edgeIndex);
                }
            }
            
            // Check connections at end vertex
            const endKey = getGridKey(edge.end);
            const endNeighbors = vertexGrid.get(endKey) || [];
            for (const neighbor of endNeighbors) {
                if (neighbor.edgeIndex !== i && !edge.connectedEdges.includes(neighbor.edgeIndex)) {
                    edge.connectedEdges.push(neighbor.edgeIndex);
                }
            }
        }
        
        // Debug: Count successful connections
        let connectedEdges = 0;
        let totalConnections = 0;
        for (const edge of this.edges) {
            if (edge.connectedEdges.length > 0) {
                connectedEdges++;
            }
            totalConnections += edge.connectedEdges.length;
        }
        
        console.log(`🔗 Connectivity Analysis: ${connectedEdges}/${this.edges.length} edges have connections, ${totalConnections} total connections`);
    }
    
    /**
     * Create a unique key for an edge based on its endpoints
     */
    createEdgeKey(start, end) {
        // Sort coordinates to ensure consistent key regardless of direction
        const p1 = start[0] < end[0] || (start[0] === end[0] && start[1] < end[1]) ? start : end;
        const p2 = start[0] < end[0] || (start[0] === end[0] && start[1] < end[1]) ? end : start;
        
        return `${p1[0].toFixed(6)},${p1[1].toFixed(6)}-${p2[0].toFixed(6)},${p2[1].toFixed(6)}`;
    }
    
    /**
     * Create the visual mesh with white cells and black edges
     */
    createVisualMesh() {
        // Remove existing meshes
        this.clearMesh();
        
        // Create white filled cells
        this.createCellMesh();
        
        // Create black edge lines
        this.createEdgeMesh();
    }
    
    /**
     * Create mesh for white filled cells
     */
    createCellMesh() {
        const geometry = new THREE.BufferGeometry();
        const vertices = [];
        const indices = [];
        
        let vertexIndex = 0;
        
        // Convert each cell polygon to triangulated mesh
        for (const cell of this.cells) {
            if (!cell.polygon || cell.polygon.length < 3) continue;
            
            const startVertexIndex = vertexIndex;
            
            // Add vertices for this cell
            for (const point of cell.polygon) {
                vertices.push(point[0], point[1], 0);
                vertexIndex++;
            }
            
            // Triangulate the polygon (simple fan triangulation)
            for (let i = 1; i < cell.polygon.length - 1; i++) {
                indices.push(
                    startVertexIndex,
                    startVertexIndex + i,
                    startVertexIndex + i + 1
                );
            }
        }
        
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setIndex(indices);
        geometry.computeVertexNormals();
        
        // White material for cells
        const material = new THREE.MeshBasicMaterial({ 
            color: 0xffffff,
            side: THREE.DoubleSide
        });
        
        this.cellMesh = new THREE.Mesh(geometry, material);
        this.scene.add(this.cellMesh);
    }
    
    /**
     * Create mesh for colored edge lines based on acute angle count
     */
    createEdgeMesh() {
        const geometry = new THREE.BufferGeometry();
        const vertices = [];
        const colors = [];
        
        // Add all edge vertices and colors
        for (const edge of this.edges) {
            vertices.push(
                edge.start.x, edge.start.y, 0.01,  // Slightly above cells
                edge.end.x, edge.end.y, 0.01
            );
            
            // Get color based on acute angle count
            const color = this.getEdgeColor(edge.acuteAngleCount || 0);
            
            // Add color for both vertices of the edge
            colors.push(color.r, color.g, color.b);
            colors.push(color.r, color.g, color.b);
        }
        
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        
        // Use vertex colors instead of uniform color
        const material = new THREE.LineBasicMaterial({ 
            vertexColors: true,
            linewidth: 2
        });
        
        this.edgeMesh = new THREE.LineSegments(geometry, material);
        this.scene.add(this.edgeMesh);
    }
    
    /**
     * Get color based on acute angle count
     * 0 = blue (contracting), 1 = green, 2 = orange, 3+ = red (expanding)
     */
    getEdgeColor(acuteCount) {
        switch(acuteCount) {
            case 0: return { r: 0.0, g: 0.0, b: 1.0 }; // Blue
            case 1: return { r: 0.0, g: 0.8, b: 0.0 }; // Green  
            case 2: return { r: 1.0, g: 0.6, b: 0.0 }; // Orange
            default: return { r: 1.0, g: 0.0, b: 0.0 }; // Red (3+)
        }
    }
    
    /**
     * Update the mesh after evolution changes
     * This applies the spring-damper deformations from Step 3
     */
    updateMesh() {
        if (!this.cellMesh || !this.edgeMesh) return;
        
        // Update cell mesh vertices
        this.updateCellVertices();
        
        // Update edge mesh vertices  
        this.updateEdgeVertices();
    }
    
    /**
     * Update cell mesh vertices based on edge deformations
     */
    updateCellVertices() {
        const positions = this.cellMesh.geometry.attributes.position;
        
        // Apply edge deformations to cell vertices
        // This is where the spring-damper physics gets applied
        let vertexIndex = 0;
        
        for (const cell of this.cells) {
            if (!cell.polygon || cell.polygon.length < 3) continue;
            
            for (let i = 0; i < cell.polygon.length; i++) {
                // The vertex positions are updated by the MeshEvolver
                // Here we just update the Three.js geometry
                positions.setXYZ(
                    vertexIndex,
                    cell.polygon[i][0],
                    cell.polygon[i][1],
                    0
                );
                vertexIndex++;
            }
        }
        
        positions.needsUpdate = true;
        this.cellMesh.geometry.computeVertexNormals();
    }
    
    /**
     * Update edge mesh vertices and colors based on deformations
     */
    updateEdgeVertices() {
        const positions = this.edgeMesh.geometry.attributes.position;
        const colors = this.edgeMesh.geometry.attributes.color;
        
        for (let i = 0; i < this.edges.length; i++) {
            const edge = this.edges[i];
            const baseIndex = i * 2;
            
            // Update positions
            positions.setXYZ(
                baseIndex,
                edge.start.x,
                edge.start.y,
                0.01
            );
            
            positions.setXYZ(
                baseIndex + 1,
                edge.end.x,
                edge.end.y,
                0.01
            );
            
            // Update colors based on current acute angle count
            const color = this.getEdgeColor(edge.acuteAngleCount || 0);
            
            colors.setXYZ(baseIndex, color.r, color.g, color.b);
            colors.setXYZ(baseIndex + 1, color.r, color.g, color.b);
        }
        
        positions.needsUpdate = true;
        colors.needsUpdate = true;
    }
    
    /**
     * Get edge data for analysis in Step 2
     * @returns {Array} Array of edge objects with connectivity information
     */
    getEdgeData() {
        return this.edges;
    }
    
    /**
     * Get cell data for mesh evolution
     * @returns {Array} Array of cell objects
     */
    getCellData() {
        return this.cells;
    }
    
    /**
     * Clear existing mesh from scene
     */
    clearMesh() {
        if (this.cellMesh) {
            this.scene.remove(this.cellMesh);
            this.cellMesh.geometry.dispose();
            this.cellMesh.material.dispose();
            this.cellMesh = null;
        }
        
        if (this.edgeMesh) {
            this.scene.remove(this.edgeMesh);
            this.edgeMesh.geometry.dispose();
            this.edgeMesh.material.dispose();
            this.edgeMesh = null;
        }
    }
    
    /**
     * Debug method to get edge analysis information
     */
    getEdgeDebugInfo() {
        const info = {
            totalEdges: this.edges.length,
            edgesWithConnections: 0,
            maxConnections: 0,
            totalConnections: 0,
            sampleEdges: [],
            sampleVertices: []
        };
        
        for (let i = 0; i < Math.min(5, this.edges.length); i++) {
            const edge = this.edges[i];
            info.sampleEdges.push({
                id: edge.id,
                start: `(${edge.start.x.toFixed(3)}, ${edge.start.y.toFixed(3)})`,
                end: `(${edge.end.x.toFixed(3)}, ${edge.end.y.toFixed(3)})`,
                length: edge.length.toFixed(3),
                connections: edge.connectedEdges.length,
                acuteCount: edge.acuteAngleCount
            });
            
            // Add sample vertices for debugging
            info.sampleVertices.push(
                { x: edge.start.x, y: edge.start.y },
                { x: edge.end.x, y: edge.end.y }
            );
            
            if (edge.connectedEdges.length > 0) {
                info.edgesWithConnections++;
            }
            
            info.totalConnections += edge.connectedEdges.length;
            
            if (edge.connectedEdges.length > info.maxConnections) {
                info.maxConnections = edge.connectedEdges.length;
            }
        }
        
        info.averageConnections = info.totalConnections / Math.min(5, this.edges.length);
        
        return info;
    }
} 