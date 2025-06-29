/**
 * EdgeAnalyzer class implements Step 2 of the system
 * Analyzes each edge for acute angle connections with other edges
 * Calculates expand/shrink values based on acute angle count
 */
export class EdgeAnalyzer {
    constructor() {
        console.log('🔍 EdgeAnalyzer initialized');
    }
    
    /**
     * Analyze all edges for acute angle connections
     * Step 2: Each edge checks if it forms sharp acute angles (<90°) with other edges
     * @param {Array} edges - Array of edge objects from VoronoiMesh
     * @returns {Object} Analysis results with statistics
     */
    analyzeAcuteAngles(edges) {
        // Reset previous analysis
        this.resetEdgeAnalysis(edges);
        
        let acuteEdgeCount = 0;
        let expandingEdgeCount = 0;
        let shrinkingEdgeCount = 0;
        
        // Analyze each edge for acute angle connections
        for (let i = 0; i < edges.length; i++) {
            const edge = edges[i];
            let acuteConnectionCount = 0;
            
            // Check connections with all other edges that share a vertex
            for (const connectedEdgeIndex of edge.connectedEdges) {
                const connectedEdge = edges[connectedEdgeIndex];
                
                // Calculate the angle between the two edges
                const angle = this.calculateAngleBetweenEdges(edge, connectedEdge);
                
                // Check if it's an acute angle (< 90 degrees)
                if (this.isAcuteAngle(angle)) {
                    acuteConnectionCount++;
                }
            }
            
            // Store the acute connection count for this edge
            edge.acuteAngleCount = acuteConnectionCount;
            
            // Update statistics
            if (acuteConnectionCount > 0) {
                acuteEdgeCount++;
                expandingEdgeCount++;
            } else {
                shrinkingEdgeCount++;
            }
        }
        
        console.log(`🔬 Analyzed ${edges.length} edges: ${acuteEdgeCount} have acute connections`);
        
        return {
            totalEdges: edges.length,
            acuteEdgeCount,
            expandingEdgeCount,
            shrinkingEdgeCount
        };
    }
    
    /**
     * Calculate expand/shrink values for all edges based on analysis results
     * @param {Array} edges - Array of edge objects from analysis
     * @param {number} changeRate - Base percentage for expand/shrink (default 5%)
     * @returns {Array} Array of edge values for mesh evolution
     */
    calculateEdgeValues(edges, changeRate = 5) {
        const edgeValues = [];
        
        // Process each edge and calculate its expand/shrink value
        for (const edge of edges) {
            let value = 0;
            
            if (edge.acuteAngleCount > 0) {
                // Edge has acute connections - expand by changeRate% per connection
                value = changeRate * edge.acuteAngleCount;
                edge.expandValue = value;
            } else {
                // Edge has no acute connections - shrink by changeRate%
                value = -changeRate;
                edge.expandValue = value;
            }
            
            edgeValues.push({
                edgeId: edge.id,
                value: value,
                type: value > 0 ? 'expand' : 'shrink'
            });
        }
        
        console.log(`📊 Calculated values for ${edgeValues.length} edges (±${changeRate}% base rate)`);
        
        return edgeValues;
    }
    
    /**
     * Reset analysis data for all edges
     */
    resetEdgeAnalysis(edges) {
        for (const edge of edges) {
            edge.acuteAngleCount = 0;
            edge.expandValue = 0;
        }
    }
    
    /**
     * Calculate the angle between two edges that share a vertex
     * @param {Object} edge1 - First edge object
     * @param {Object} edge2 - Second edge object  
     * @returns {number} Angle in degrees (0-180)
     */
    calculateAngleBetweenEdges(edge1, edge2) {
        // Find the shared vertex
        const sharedVertex = this.findSharedVertex(edge1, edge2);
        if (!sharedVertex) {
            return 180; // No shared vertex, treat as straight angle
        }
        
        // Get direction vectors from shared vertex
        const vector1 = this.getDirectionFromVertex(edge1, sharedVertex);
        const vector2 = this.getDirectionFromVertex(edge2, sharedVertex);
        
        // Calculate angle between vectors using dot product
        const dot = vector1.x * vector2.x + vector1.y * vector2.y;
        const mag1 = Math.sqrt(vector1.x * vector1.x + vector1.y * vector1.y);
        const mag2 = Math.sqrt(vector2.x * vector2.x + vector2.y * vector2.y);
        
        if (mag1 === 0 || mag2 === 0) return 0;
        
        const cosAngle = dot / (mag1 * mag2);
        
        // Clamp to avoid floating point errors
        const clampedCos = Math.max(-1, Math.min(1, cosAngle));
        
        // Convert to degrees
        const angleRadians = Math.acos(clampedCos);
        const angleDegrees = angleRadians * (180 / Math.PI);
        
        return angleDegrees;
    }
    
    /**
     * Find the shared vertex between two edges
     * @param {Object} edge1 - First edge
     * @param {Object} edge2 - Second edge
     * @returns {Object|null} Shared vertex or null if none found
     */
    findSharedVertex(edge1, edge2) {
        const tolerance = 1e-6;
        
        if (this.pointsEqual(edge1.start, edge2.start, tolerance)) {
            return edge1.start;
        }
        if (this.pointsEqual(edge1.start, edge2.end, tolerance)) {
            return edge1.start;
        }
        if (this.pointsEqual(edge1.end, edge2.start, tolerance)) {
            return edge1.end;
        }
        if (this.pointsEqual(edge1.end, edge2.end, tolerance)) {
            return edge1.end;
        }
        
        return null;
    }
    
    /**
     * Get direction vector from a shared vertex for an edge
     * @param {Object} edge - Edge object
     * @param {Object} sharedVertex - The shared vertex
     * @returns {Object} Direction vector {x, y}
     */
    getDirectionFromVertex(edge, sharedVertex) {
        const tolerance = 1e-6;
        
        if (this.pointsEqual(edge.start, sharedVertex, tolerance)) {
            // Direction from start to end
            return {
                x: edge.end.x - edge.start.x,
                y: edge.end.y - edge.start.y
            };
        } else {
            // Direction from end to start
            return {
                x: edge.start.x - edge.end.x,
                y: edge.start.y - edge.end.y
            };
        }
    }
    
    /**
     * Check if two points are equal within tolerance
     */
    pointsEqual(p1, p2, tolerance) {
        return Math.abs(p1.x - p2.x) < tolerance && Math.abs(p1.y - p2.y) < tolerance;
    }
    
    /**
     * Check if an angle is acute (< 90 degrees)
     * @param {number} angleDegrees - Angle in degrees
     * @returns {boolean} True if acute angle
     */
    isAcuteAngle(angleDegrees) {
        return angleDegrees < 90;
    }
    
    /**
     * Get detailed statistics about edge analysis
     * @param {Array} edges - Array of analyzed edges
     * @returns {Object} Detailed statistics
     */
    getDetailedStatistics(edges) {
        const stats = {
            totalEdges: edges.length,
            acuteConnections: {},
            averageAcuteConnections: 0,
            maxAcuteConnections: 0,
            expandingEdges: 0,
            shrinkingEdges: 0
        };
        
        let totalAcuteConnections = 0;
        
        for (const edge of edges) {
            const count = edge.acuteAngleCount;
            totalAcuteConnections += count;
            
            if (count > stats.maxAcuteConnections) {
                stats.maxAcuteConnections = count;
            }
            
            if (count > 0) {
                stats.expandingEdges++;
                stats.acuteConnections[count] = (stats.acuteConnections[count] || 0) + 1;
            } else {
                stats.shrinkingEdges++;
                stats.acuteConnections[0] = (stats.acuteConnections[0] || 0) + 1;
            }
        }
        
        stats.averageAcuteConnections = totalAcuteConnections / edges.length;
        
        return stats;
    }
    
    /**
     * Debug: Visualize acute angle connections
     * @param {Array} edges - Edges to analyze
     * @returns {Array} Debug information for visualization
     */
    getDebugInfo(edges) {
        const debugInfo = [];
        
        for (const edge of edges) {
            debugInfo.push({
                edgeId: edge.id,
                start: edge.start,
                end: edge.end,
                acuteCount: edge.acuteAngleCount,
                expandValue: edge.expandValue,
                connectedEdgeCount: edge.connectedEdges.length
            });
        }
        
        return debugInfo;
    }
} 