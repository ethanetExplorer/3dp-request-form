import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RotateCcw, Maximize2, Minimize2, Eye, Layers, Compass, Play, Pause } from 'lucide-react';
import { Material, ModelData, SlicerSettings } from '../types';

interface Viewer3DProps {
  modelData: ModelData | null;
  selectedMaterial: Material;
  slicerSettings: SlicerSettings;
  className?: string;
}

type ViewMode = 'solid' | 'wireframe' | 'xray' | 'slice';

export const Viewer3D: React.FC<Viewer3DProps> = ({
  modelData,
  selectedMaterial,
  slicerSettings,
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const wireframeMeshRef = useRef<THREE.Mesh | null>(null);
  const clipPlaneRef = useRef<THREE.Plane | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [viewMode, setViewMode] = useState<ViewMode>('solid');
  const [sliceProgress, setSliceProgress] = useState<number>(100); // 0 to 100%
  const [isAutoRotating, setIsAutoRotating] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Print bed dimensions (standard 250 x 250 mm)
  const bedSize = 250;

  // Initialize Three.js scene once
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 400;
    const height = container.clientHeight || 360;

    // Clear any previous canvas (handles React StrictMode remounts)
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color('#F1F3F5'); // Clean studio neutral grey

    // Camera
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.5, 2000);
    camera.position.set(160, 140, 200);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.localClippingEnabled = true;
    rendererRef.current = renderer;

    container.appendChild(renderer.domElement);

    // OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.maxPolarAngle = Math.PI / 2 + 0.05; // Prevent camera from going below bed
    controls.minDistance = 20;
    controls.maxDistance = 600;
    controls.target.set(0, 25, 0);
    controlsRef.current = controls;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight1.position.set(120, 200, 150);
    dirLight1.castShadow = true;
    dirLight1.shadow.mapSize.width = 1024;
    dirLight1.shadow.mapSize.height = 1024;
    dirLight1.shadow.bias = -0.0005;
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xdde5ed, 0.6);
    dirLight2.position.set(-150, 120, -100);
    scene.add(dirLight2);

    const underLight = new THREE.DirectionalLight(0xf8fafc, 0.4);
    underLight.position.set(0, -50, 0);
    scene.add(underLight);

    // Build Plate Grid (250 x 250 mm)
    const gridGroup = new THREE.Group();

    // Base Bed surface
    const bedGeo = new THREE.PlaneGeometry(bedSize, bedSize);
    const bedMat = new THREE.MeshStandardMaterial({
      color: 0xE2E8F0,
      roughness: 0.8,
      metalness: 0.1
    });
    const bedMesh = new THREE.Mesh(bedGeo, bedMat);
    bedMesh.rotation.x = -Math.PI / 2;
    bedMesh.position.y = -0.1;
    bedMesh.receiveShadow = true;
    gridGroup.add(bedMesh);

    // Grid lines (every 10mm and every 50mm)
    const gridHelper = new THREE.GridHelper(bedSize, 25, 0x94A3B8, 0xCBD5E1);
    gridHelper.position.y = 0.05;
    gridGroup.add(gridHelper);

    // Bounding build volume box (250 x 250 x 250 mm)
    const boxGeo = new THREE.BoxGeometry(bedSize, bedSize, bedSize);
    const boxEdges = new THREE.EdgesGeometry(boxGeo);
    const boxLines = new THREE.LineSegments(
      boxEdges,
      new THREE.LineBasicMaterial({ color: 0xCBD5E1, transparent: true, opacity: 0.35 })
    );
    boxLines.position.y = bedSize / 2;
    gridGroup.add(boxLines);

    // Axis indicators at corner
    const axisGroup = new THREE.Group();
    const axisLength = 20;
    const xAxis = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(-bedSize / 2, 0.1, bedSize / 2), axisLength, 0xEF4444, 4, 3);
    const zAxis = new THREE.ArrowHelper(new THREE.Vector3(0, 0, -1), new THREE.Vector3(-bedSize / 2, 0.1, bedSize / 2), axisLength, 0x3B82F6, 4, 3);
    const yAxis = new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), new THREE.Vector3(-bedSize / 2, 0.1, bedSize / 2), axisLength, 0x10B981, 4, 3);
    axisGroup.add(xAxis);
    axisGroup.add(zAxis);
    axisGroup.add(yAxis);
    gridGroup.add(axisGroup);

    scene.add(gridGroup);

    // Clipping plane for slicing cross section
    const clipPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), 250);
    clipPlaneRef.current = clipPlane;

    // Animation loop
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);

      if (controlsRef.current) {
        controlsRef.current.autoRotate = isAutoRotating;
        controlsRef.current.autoRotateSpeed = 2.0;
        controlsRef.current.update();
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    // Resize observer
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const newWidth = containerRef.current.clientWidth;
      const newHeight = containerRef.current.clientHeight;
      if (!newWidth || !newHeight) return;
      cameraRef.current.aspect = newWidth / newHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(newWidth, newHeight);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (rendererRef.current && rendererRef.current.domElement) {
        if (container.contains(rendererRef.current.domElement)) {
          container.removeChild(rendererRef.current.domElement);
        }
        rendererRef.current.dispose();
      }
    };
  }, []);

  // Update auto-rotate
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = isAutoRotating;
    }
  }, [isAutoRotating]);

  // Update Model Mesh whenever modelData changes
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Remove previous mesh
    if (meshRef.current) {
      scene.remove(meshRef.current);
      meshRef.current.geometry.dispose();
      meshRef.current = null;
    }
    if (wireframeMeshRef.current) {
      scene.remove(wireframeMeshRef.current);
      wireframeMeshRef.current.geometry.dispose();
      wireframeMeshRef.current = null;
    }

    if (!modelData) return;

    // Material setup
    const meshMat = createMeshMaterial(selectedMaterial, viewMode, clipPlaneRef.current);
    const mesh = new THREE.Mesh(modelData.geometry, meshMat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    meshRef.current = mesh;

    // Wireframe overlay if wireframe mode
    if (viewMode === 'wireframe') {
      const wireMat = new THREE.MeshBasicMaterial({
        color: 0x1E293B,
        wireframe: true,
        transparent: true,
        opacity: 0.6
      });
      const wireMesh = new THREE.Mesh(modelData.geometry, wireMat);
      scene.add(wireMesh);
      wireframeMeshRef.current = wireMesh;
    }

    // Auto-frame camera to fit model comfortably
    if (cameraRef.current && controlsRef.current) {
      const modelHeight = modelData.dimensions.z;
      const maxDim = Math.max(modelData.dimensions.x, modelData.dimensions.y, modelData.dimensions.z);
      const targetY = modelHeight * 0.45;

      controlsRef.current.target.set(0, targetY, 0);

      const distance = Math.max(90, maxDim * 2.2);
      cameraRef.current.position.set(distance * 0.8, distance * 0.7, distance * 0.9);
      controlsRef.current.update();
    }

    // Reset slice slider to top of model
    setSliceProgress(100);
  }, [modelData]);

  // Update material properties when selectedMaterial or viewMode changes
  useEffect(() => {
    if (!meshRef.current || !modelData) return;

    const scene = sceneRef.current;
    if (!scene) return;

    // Update or recreate material
    meshRef.current.material = createMeshMaterial(selectedMaterial, viewMode, clipPlaneRef.current);

    // Update wireframe mesh
    if (wireframeMeshRef.current) {
      scene.remove(wireframeMeshRef.current);
      wireframeMeshRef.current = null;
    }

    if (viewMode === 'wireframe') {
      const wireMat = new THREE.MeshBasicMaterial({
        color: 0x1E293B,
        wireframe: true,
        transparent: true,
        opacity: 0.7
      });
      const wireMesh = new THREE.Mesh(modelData.geometry, wireMat);
      scene.add(wireMesh);
      wireframeMeshRef.current = wireMesh;
    }
  }, [selectedMaterial, viewMode]);

  // Update slice clipping plane when sliceProgress changes
  useEffect(() => {
    if (!clipPlaneRef.current || !modelData) return;

    const maxHeight = modelData.dimensions.z;
    // When slice mode is active, clip at height = maxHeight * (sliceProgress / 100)
    if (viewMode === 'slice') {
      const cutHeight = Math.max(0.1, maxHeight * (sliceProgress / 100));
      clipPlaneRef.current.constant = cutHeight;
    } else {
      // Disengage clipping
      clipPlaneRef.current.constant = 1000;
    }
  }, [sliceProgress, viewMode, modelData]);

  // Helper to create Three.js material
  function createMeshMaterial(
    material: Material,
    mode: ViewMode,
    clipPlane: THREE.Plane | null
  ): THREE.Material {
    const color = new THREE.Color(material.colorHex);

    // Adjust roughness & metalness based on material finish
    let roughness = 0.55;
    let metalness = 0.05;

    if (material.finish === 'Matte') {
      roughness = 0.75;
      metalness = 0.02;
    } else if (material.finish === 'Silk') {
      roughness = 0.22;
      metalness = 0.35;
    } else if (material.finish === 'Glossy') {
      roughness = 0.28;
      metalness = 0.08;
    }

    const clippingPlanes = mode === 'slice' && clipPlane ? [clipPlane] : [];

    if (mode === 'xray') {
      return new THREE.MeshPhysicalMaterial({
        color,
        roughness: 0.1,
        metalness: 0.1,
        transmission: 0.85,
        transparent: true,
        opacity: 0.45,
        side: THREE.DoubleSide,
        depthWrite: false
      });
    }

    return new THREE.MeshStandardMaterial({
      color,
      roughness,
      metalness,
      side: THREE.DoubleSide,
      clippingPlanes,
      clipShadows: true
    });
  }

  // Camera reset
  const handleResetCamera = () => {
    if (!cameraRef.current || !controlsRef.current || !modelData) return;
    const maxDim = Math.max(modelData.dimensions.x, modelData.dimensions.y, modelData.dimensions.z);
    const distance = Math.max(90, maxDim * 2.2);
    const targetY = modelData.dimensions.z * 0.45;

    controlsRef.current.target.set(0, targetY, 0);
    cameraRef.current.position.set(distance * 0.8, distance * 0.7, distance * 0.9);
    controlsRef.current.update();
  };

  // Current slice layer calculation
  const currentLayerInfo = useMemo(() => {
    if (!modelData) return null;
    const totalLayers = Math.max(1, Math.round(modelData.dimensions.z / slicerSettings.layerHeight));
    const currentLayer = Math.max(1, Math.round(totalLayers * (sliceProgress / 100)));
    const currentHeightMm = (currentLayer * slicerSettings.layerHeight).toFixed(2);
    return {
      currentLayer,
      totalLayers,
      currentHeightMm
    };
  }, [modelData, slicerSettings.layerHeight, sliceProgress]);

  return (
    <div
      className={`relative w-full rounded-2xl overflow-hidden border border-neutral-200/90 bg-[#F1F3F5] select-none ${
        isFullscreen ? 'fixed inset-4 z-50 shadow-2xl' : 'h-[360px] md:h-[480px]'
      } ${className}`}
    >
      {/* Three.js Canvas Container */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Empty State / Instruction if no model */}
      {!modelData && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center pointer-events-none bg-neutral-100/60 backdrop-blur-[2px]">
          <div className="w-14 h-14 rounded-2xl bg-white shadow-sm border border-neutral-200 flex items-center justify-center text-neutral-400 mb-3">
            <Layers className="w-7 h-7" />
          </div>
          <h4 className="text-base font-semibold text-neutral-800">3D Interactive Preview</h4>
          <p className="text-xs text-neutral-500 mt-1 max-w-xs">
            Upload an STL or STEP file or choose a sample model above to inspect 3D geometry and slicing.
          </p>
        </div>
      )}

      {/* Model Loaded: Floating Top Toolbar */}
      {modelData && (
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none">
          {/* View Modes Segmented Control */}
          <div className="pointer-events-auto flex items-center bg-white/95 backdrop-blur-md border border-neutral-200/80 rounded-xl p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setViewMode('solid')}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all ${
                viewMode === 'solid'
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
              title="Solid Shaded View"
            >
              Solid
            </button>
            <button
              type="button"
              onClick={() => setViewMode('wireframe')}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all ${
                viewMode === 'wireframe'
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
              title="Polygon Wireframe"
            >
              Wireframe
            </button>
            <button
              type="button"
              onClick={() => setViewMode('xray')}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all ${
                viewMode === 'xray'
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
              title="X-Ray Semi-Transparent"
            >
              X-Ray
            </button>
            <button
              type="button"
              onClick={() => setViewMode('slice')}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all flex items-center gap-1 ${
                viewMode === 'slice'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
              title="Layer Slice Cross-Section"
            >
              <Eye className="w-3 h-3" />
              <span>Slice</span>
            </button>
          </div>

          {/* Quick Camera & Action Buttons */}
          <div className="pointer-events-auto flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsAutoRotating(!isAutoRotating)}
              className={`p-2 rounded-xl border border-neutral-200/80 shadow-sm transition-all ${
                isAutoRotating
                  ? 'bg-neutral-900 text-white'
                  : 'bg-white/95 text-neutral-700 hover:bg-neutral-50'
              }`}
              title={isAutoRotating ? 'Pause rotation' : 'Auto-rotate'}
            >
              {isAutoRotating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              onClick={handleResetCamera}
              className="p-2 rounded-xl bg-white/95 text-neutral-700 hover:bg-neutral-50 border border-neutral-200/80 shadow-sm transition-all"
              title="Reset Camera Angle"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-xl bg-white/95 text-neutral-700 hover:bg-neutral-50 border border-neutral-200/80 shadow-sm transition-all"
              title={isFullscreen ? 'Exit Fullscreen' : 'Expand 3D View'}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      )}

      {/* Bottom Floating Stats Pill & Slice Slider */}
      {modelData && (
        <div className="absolute bottom-3 left-3 right-3 flex flex-col gap-2 pointer-events-none">
          {/* Layer Slicing Control Bar (Shown in 'slice' mode) */}
          {viewMode === 'slice' && currentLayerInfo && (
            <div className="pointer-events-auto bg-white/95 backdrop-blur-md border border-neutral-200/90 rounded-xl p-2.5 shadow-md flex items-center gap-3">
              <span className="text-xs font-medium text-neutral-700 shrink-0">
                Layer {currentLayerInfo.currentLayer} / {currentLayerInfo.totalLayers}
              </span>
              <input
                type="range"
                min="1"
                max="100"
                value={sliceProgress}
                onChange={(e) => setSliceProgress(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
              <span className="text-[11px] text-neutral-500 font-mono shrink-0">
                {currentLayerInfo.currentHeightMm} mm
              </span>
            </div>
          )}

          {/* Model Dimension Info Pill */}
          <div className="flex items-center justify-between">
            <div className="pointer-events-auto inline-flex items-center gap-2 bg-neutral-900/85 backdrop-blur-md text-white text-[11px] font-medium px-3 py-1.5 rounded-full shadow-sm">
              <Compass className="w-3.5 h-3.5 text-neutral-400" />
              <span>{modelData.dimensions.x} × {modelData.dimensions.y} × {modelData.dimensions.z} mm</span>
              <span className="text-neutral-500">•</span>
              <span>{modelData.volume} cm³</span>
            </div>

            {/* Active material badge */}
            <div className="pointer-events-auto hidden sm:inline-flex items-center gap-1.5 bg-white/95 backdrop-blur-md border border-neutral-200/80 text-neutral-800 text-[11px] font-medium px-2.5 py-1.5 rounded-full shadow-sm">
              <span
                className="w-2.5 h-2.5 rounded-full border border-black/15 shadow-xs"
                style={{ backgroundColor: selectedMaterial.colorHex }}
              />
              <span>{selectedMaterial.type} ({selectedMaterial.colorName})</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

