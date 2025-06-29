/**
 * MeshEvolver class implements Step 3 of the system
 * Direct modification of existing VoronoiMesh - no parallel physics systems!
 * Just move the existing edge vertices based on spring forces
 */
export class MeshEvolver {
    constructor() {
        // Simple physics parameters
        this.config = {
            springConstant: 0.3,
            dampingFactor: 0.85,
            timeStep: 0.1
        };
        
        // Track vertex velocities (keyed by position string)
        this.vertexVelocities = new Map();
        
        console.log('🔄 MeshEvolver - direct mesh modification approach');
    }
    
    /**
     * Apply edge values by directly modifying existing mesh vertices
     * NO separate physics system - just move the actual edge endpoints!
     */
    applyEdgeValues(voronoiMesh, edgeValues) {
        const edges = voronoiMesh.getEdgeData();
        
        // Step 1: Update rest lengths based on acute angle values
        this.updateRestLengths(edges, edgeValues);
        
        // Step 2: Apply spring forces directly to edge vertices
        this.applySpringForcesToEdges(edges);
        
        // Step 3: Update the visual mesh from modified edge data
        voronoiMesh.updateMesh();
        
        console.log(`🌊 Direct edge physics applied to ${edges.length} edges`);
    }
    
    /**
     * Update rest lengths for edges based on acute angle analysis
     */
    updateRestLengths(edges, edgeValues) {
        const valueMap = new Map();
        for (const ev of edgeValues) {
            valueMap.set(ev.edgeId, ev.value);
        }
        
        for (const edge of edges) {
            const evolutionValue = valueMap.get(edge.id) || 0;
            
            // Set target length based on current length and evolution value
            if (!edge.originalLength) {
                edge.originalLength = edge.length; // Store original length
            }
            
            // Calculate new target length
            const factor = 1 + (evolutionValue / 100);
            edge.targetLength = edge.originalLength * factor;
        }
    }
    
    /**
     * Apply spring forces directly to edge start/end points
     * This is the key - modify the ACTUAL edge vertices, not parallel data!
     */
    applySpringForcesToEdges(edges) {
        // Collect all unique vertices from edges
        const vertexForces = new Map();
        
        // Initialize forces for all vertices
        for (const edge of edges) {
            const startKey = this.getVertexKey(edge.start);
            const endKey = this.getVertexKey(edge.end);
            
            if (!vertexForces.has(startKey)) {
                vertexForces.set(startKey, { x: 0, y: 0, vertex: edge.start });
            }
            if (!vertexForces.has(endKey)) {
                vertexForces.set(endKey, { x: 0, y: 0, vertex: edge.end });
            }
        }
        
        // Calculate spring forces for each edge
        for (const edge of edges) {
            const startKey = this.getVertexKey(edge.start);
            const endKey = this.getVertexKey(edge.end);
            
            const dx = edge.end.x - edge.start.x;
            const dy = edge.end.y - edge.start.y;
            const currentLength = Math.sqrt(dx * dx + dy * dy);
            
            if (currentLength === 0) continue;
            
            // Spring force toward target length
            const targetLength = edge.targetLength || edge.length;
            const forceMagnitude = this.config.springConstant * (currentLength - targetLength);
            
            // Direction vector (normalized)
            const dirX = dx / currentLength;
            const dirY = dy / currentLength;
            
            // Force components
            const forceX = dirX * forceMagnitude;
            const forceY = dirY * forceMagnitude;
            
            // Apply forces to vertices (opposite directions)
            const startForce = vertexForces.get(startKey);
            const endForce = vertexForces.get(endKey);
            
            startForce.x += forceX;
            startForce.y += forceY;
            endForce.x -= forceX;
            endForce.y -= forceY;
        }
        
        // Apply forces to actual vertex positions
        this.updateVertexPositions(vertexForces);
        
        // Update edge lengths after movement
        for (const edge of edges) {
            const dx = edge.end.x - edge.start.x;
            const dy = edge.end.y - edge.start.y;
            edge.length = Math.sqrt(dx * dx + dy * dy);
        }
    }
    
    /**
     * Update actual vertex positions based on forces
     * This modifies the REAL edge.start and edge.end objects!
     */
    updateVertexPositions(vertexForces) {
        for (const [vertexKey, force] of vertexForces) {
            const vertex = force.vertex;
            
            // Get or initialize velocity
            if (!this.vertexVelocities.has(vertexKey)) {
                this.vertexVelocities.set(vertexKey, { x: 0, y: 0 });
            }
            const velocity = this.vertexVelocities.get(vertexKey);
            
            // Update velocity with force
            velocity.x += force.x * this.config.timeStep;
            velocity.y += force.y * this.config.timeStep;
            
            // Apply damping
            velocity.x *= this.config.dampingFactor;
            velocity.y *= this.config.dampingFactor;
            
            // Update actual vertex position
            vertex.x += velocity.x * this.config.timeStep;
            vertex.y += velocity.y * this.config.timeStep;
            
            // Periodic boundaries
            vertex.x = this.wrapCoordinate(vertex.x, -8, 8);
            vertex.y = this.wrapCoordinate(vertex.y, -6, 6);
        }
    }
    
    /**
     * Get vertex key for tracking velocities
     */
    getVertexKey(vertex) {
        return `${vertex.x.toFixed(6)},${vertex.y.toFixed(6)}`;
    }
    
    /**
     * Wrap coordinate for periodic boundaries
     */
    wrapCoordinate(coord, min, max) {
        const range = max - min;
        if (coord < min) return coord + range;
        if (coord > max) return coord - range;
        return coord;
    }
} 