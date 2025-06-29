import * as THREE from 'three';
import { VoronoiMesh } from './VoronoiMesh.js';
import { EdgeAnalyzer } from './EdgeAnalyzer.js';
import { MeshEvolver } from './MeshEvolver.js';

/**
 * Main application class that orchestrates the dynamic Voronoi mesh system
 * This creates a Conway's Game of Life-like evolution based on acute angle edge detection
 */
class AcuteEdgeVoronoiApp {
    constructor() {
        // Configuration parameters - easily adjustable
        this.config = {
            cellCount: 50,          // Number of Voronoi cells
            changeRate: 5,          // Percentage for expand/shrink operations
            evolutionSpeed: 200,    // Decreased from 500ms - faster evolution
            canvasWidth: window.innerWidth,
            canvasHeight: window.innerHeight
        };
        
        // Evolution state
        this.generation = 0;
        this.isEvolutionRunning = false;
        this.evolutionTimer = null;
        
        // Three.js components
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        
        // Custom components for our Voronoi system
        this.voronoiMesh = null;
        this.edgeAnalyzer = null;
        this.meshEvolver = null;
        
        this.init();
    }
    
    /**
     * Initialize the Three.js scene and all components
     */
    init() {
        this.setupThreeJS();
        this.setupVoronoiSystem();
        this.setupControls();
        this.setupEventListeners();
        
        // Generate initial mesh
        this.regenerateMesh();
        
        // Start render loop
        this.animate();
        
        console.log('🎯 Acute Edge Voronoi system initialized');
    }
    
    /**
     * Set up the basic Three.js scene, camera, and renderer
     */
    setupThreeJS() {
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x111111);
        
        // Create camera with orthographic projection for 2D Voronoi visualization
        const aspect = this.config.canvasWidth / this.config.canvasHeight;
        const frustumSize = 20;
        this.camera = new THREE.OrthographicCamera(
            -frustumSize * aspect / 2, frustumSize * aspect / 2,
            frustumSize / 2, -frustumSize / 2,
            0.1, 1000
        );
        this.camera.position.z = 10;
        
        // Create renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(this.config.canvasWidth, this.config.canvasHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        
        // Add renderer to DOM
        document.getElementById('canvas-container').appendChild(this.renderer.domElement);
    }
    
    /**
     * Initialize the Voronoi mesh system and related analyzers
     */
    setupVoronoiSystem() {
        this.voronoiMesh = new VoronoiMesh(this.scene);
        this.edgeAnalyzer = new EdgeAnalyzer();
        this.meshEvolver = new MeshEvolver();
    }
    
    /**
     * Set up UI controls with synchronized inputs
     */
    setupControls() {
        // Cell count controls
        const cellCountSlider = document.getElementById('cellCount');
        const cellCountInput = document.getElementById('cellCountValue');
        
        cellCountSlider.addEventListener('input', (e) => {
            this.config.cellCount = parseInt(e.target.value);
            cellCountInput.value = e.target.value;
        });
        
        cellCountInput.addEventListener('input', (e) => {
            this.config.cellCount = parseInt(e.target.value);
            cellCountSlider.value = e.target.value;
        });
        
        // Change rate controls
        const changeRateSlider = document.getElementById('changeRate');
        const changeRateInput = document.getElementById('changeRateValue');
        
        changeRateSlider.addEventListener('input', (e) => {
            this.config.changeRate = parseInt(e.target.value);
            changeRateInput.value = e.target.value;
        });
        
        changeRateInput.addEventListener('input', (e) => {
            this.config.changeRate = parseInt(e.target.value);
            changeRateSlider.value = e.target.value;
        });
        
        // Evolution speed controls
        const evolutionSpeedSlider = document.getElementById('evolutionSpeed');
        const evolutionSpeedInput = document.getElementById('evolutionSpeedValue');
        
        evolutionSpeedSlider.addEventListener('input', (e) => {
            this.config.evolutionSpeed = parseInt(e.target.value);
            evolutionSpeedInput.value = e.target.value;
        });
        
        evolutionSpeedInput.addEventListener('input', (e) => {
            this.config.evolutionSpeed = parseInt(e.target.value);
            evolutionSpeedSlider.value = e.target.value;
        });
    }
    
    /**
     * Set up button event listeners for mesh control
     */
    setupEventListeners() {
        document.getElementById('regenerate').addEventListener('click', () => {
            this.regenerateMesh();
        });
        
        document.getElementById('startEvolution').addEventListener('click', () => {
            this.startEvolution();
        });
        
        document.getElementById('pauseEvolution').addEventListener('click', () => {
            this.pauseEvolution();
        });
        
        // Handle window resize
        window.addEventListener('resize', () => {
            this.onWindowResize();
        });
    }
    
    /**
     * Generate a new random Voronoi mesh
     */
    regenerateMesh() {
        this.generation = 0;
        this.updateInfoDisplay();
        
        // Generate new Voronoi mesh with current cell count
        this.voronoiMesh.generate(this.config.cellCount);
        
        console.log(`🔄 Generated new mesh with ${this.config.cellCount} cells`);
    }
    
    /**
     * Start the evolution process - this is where the magic happens!
     * Step 2: Analyze acute angles and assign expand/shrink values
     * Step 3: Apply physical changes to the mesh
     * Loop back to Step 2
     */
    startEvolution() {
        if (this.isEvolutionRunning) return;
        
        this.isEvolutionRunning = true;
        console.log('🚀 Starting evolution process...');
        
        this.evolutionTimer = setInterval(() => {
            this.evolveOneGeneration();
        }, this.config.evolutionSpeed);
    }
    
    /**
     * Pause the evolution process
     */
    pauseEvolution() {
        if (!this.isEvolutionRunning) return;
        
        this.isEvolutionRunning = false;
        if (this.evolutionTimer) {
            clearInterval(this.evolutionTimer);
            this.evolutionTimer = null;
        }
        
        console.log('⏸️ Evolution paused');
    }
    
    /**
     * Evolve the mesh by one generation
     * This implements your step 2 and 3 process
     */
    evolveOneGeneration() {
        this.generation++;
        
        // Step 2: Analyze edges for acute angles and calculate expand/shrink values
        const edgeData = this.voronoiMesh.getEdgeData();
        console.log(`🔍 Starting analysis of ${edgeData.length} edges for generation ${this.generation}`);
        
        // Debug: Check edge connectivity
        const debugInfo = this.voronoiMesh.getEdgeDebugInfo();
        console.log('🐛 Edge Debug Info:', debugInfo);
        
        const analysisResults = this.edgeAnalyzer.analyzeAcuteAngles(edgeData);
        console.log('📊 Analysis Results:', analysisResults);
        
        const edgeValues = this.edgeAnalyzer.calculateEdgeValues(
            edgeData,  // Pass the edges directly
            this.config.changeRate
        );
        console.log(`💰 Calculated ${edgeValues.length} edge values`);
        
        // Step 3: Apply physical changes using spring-damper system
        this.meshEvolver.applyEdgeValues(this.voronoiMesh, edgeValues);
        
        // Update mesh visualization
        this.voronoiMesh.updateMesh();
        
        // Update info display
        this.updateInfoDisplay(analysisResults);
        
        console.log(`🧬 Generation ${this.generation}: ${analysisResults.acuteEdgeCount} acute edges`);
    }
    
    /**
     * Update the information display with current statistics
     */
    updateInfoDisplay(analysisResults = null) {
        document.getElementById('generation').textContent = this.generation;
        
        if (analysisResults) {
            document.getElementById('acuteEdges').textContent = analysisResults.acuteEdgeCount;
            document.getElementById('expandingEdges').textContent = analysisResults.expandingEdgeCount;
            document.getElementById('shrinkingEdges').textContent = analysisResults.shrinkingEdgeCount;
        } else {
            document.getElementById('acuteEdges').textContent = '0';
            document.getElementById('expandingEdges').textContent = '0';
            document.getElementById('shrinkingEdges').textContent = '0';
        }
    }
    
    /**
     * Handle window resize
     */
    onWindowResize() {
        this.config.canvasWidth = window.innerWidth;
        this.config.canvasHeight = window.innerHeight;
        
        const aspect = this.config.canvasWidth / this.config.canvasHeight;
        const frustumSize = 20;
        
        this.camera.left = -frustumSize * aspect / 2;
        this.camera.right = frustumSize * aspect / 2;
        this.camera.top = frustumSize / 2;
        this.camera.bottom = -frustumSize / 2;
        this.camera.updateProjectionMatrix();
        
        this.renderer.setSize(this.config.canvasWidth, this.config.canvasHeight);
    }
    
    /**
     * Main animation loop
     */
    animate() {
        requestAnimationFrame(() => this.animate());
        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new AcuteEdgeVoronoiApp();
}); 