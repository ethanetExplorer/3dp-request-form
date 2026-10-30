import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { ModelData } from '../types';
import { calculateDimensions, calculateGeometryVolume, calculateSurfaceArea } from './slicerEngine';
import {
  createBenchyGeometry,
  createDroneArmGeometry,
  createGearGeometry
} from './sampleModels';

// Cache the OCCT instance so wasm isn't reloaded repeatedly
let occtPromise: Promise<any> | null = null;

async function getOcctInstance(): Promise<any> {
  if (!occtPromise) {
    occtPromise = new Promise((resolve, reject) => {
      const initFn = (fn: any) => {
        try {
          const res = fn({
            locateFile: (name: string) => `/${name}`
          });
          resolve(res);
        } catch (err) {
          reject(err);
        }
      };

      if (typeof window !== 'undefined' && (window as any).occtimportjs) {
        initFn((window as any).occtimportjs);
      } else if (typeof document !== 'undefined') {
        const script = document.createElement('script');
        script.src = '/occt-import-js.js';
        script.onload = () => {
          if ((window as any).occtimportjs) {
            initFn((window as any).occtimportjs);
          } else {
            reject(new Error('occtimportjs is not available on window.'));
          }
        };
        script.onerror = () => reject(new Error('Failed to load /occt-import-js.js'));
        document.head.appendChild(script);
      } else {
        reject(new Error('Browser environment required to initialize occt-import-js.'));
      }
    });
  }
  return occtPromise;
}

/**
 * Positions geometry so that it is centered at (0, 0) on the print bed plane,
 * and rests with its lowest point at Y = 0 (on top of the build plate).
 */
export function normalizeGeometryToBed(geometry: THREE.BufferGeometry): THREE.BufferGeometry {
  geometry.computeBoundingBox();
  const box = geometry.boundingBox;
  if (!box) return geometry;

  // Center horizontally (X and Z), rest base on bed (Y=0)
  const centerX = (box.min.x + box.max.x) / 2;
  const minBase = box.min.y;
  const centerZ = (box.min.z + box.max.z) / 2;

  geometry.translate(-centerX, -minBase, -centerZ);
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

/**
 * Builds a ModelData record from a THREE.BufferGeometry
 */
export function createModelDataFromGeometry(
  geometry: THREE.BufferGeometry,
  name: string,
  fileSize: number,
  format: 'stl' | 'step'
): ModelData {
  normalizeGeometryToBed(geometry);

  const volumeMm3 = calculateGeometryVolume(geometry);
  const surfaceAreaMm2 = calculateSurfaceArea(geometry);
  const dims = calculateDimensions(geometry);

  // Triangle count
  const pos = geometry.getAttribute('position');
  const index = geometry.getIndex();
  const triangleCount = index ? index.count / 3 : (pos ? pos.count / 3 : 0);

  return {
    id: `model-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    name,
    fileSize,
    format,
    geometry,
    dimensions: {
      x: dims.x, // Width
      y: dims.z, // Depth (Z in 3D space)
      z: dims.y  // Height (Y in 3D space)
    },
    volume: Number((volumeMm3 / 1000).toFixed(2)),
    surfaceArea: Number((surfaceAreaMm2 / 100).toFixed(1)),
    triangleCount: Math.round(triangleCount)
  };
}

/**
 * Parses STL files (ASCII and Binary)
 */
export async function loadStlFromBuffer(buffer: ArrayBuffer | Uint8Array, fileName: string): Promise<ModelData> {
  const cleanBuffer = buffer instanceof ArrayBuffer
    ? buffer
    : buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);

  const loader = new STLLoader();
  const geometry = loader.parse(cleanBuffer as ArrayBuffer);
  geometry.computeVertexNormals();

  return createModelDataFromGeometry(geometry, fileName, cleanBuffer.byteLength, 'stl');
}

/**
 * Parses STEP / STP files using OpenCASCADE WebAssembly
 */
export async function loadStepFromBuffer(buffer: ArrayBuffer, fileName: string): Promise<ModelData> {
  const occt = await getOcctInstance();
  const fileBytes = new Uint8Array(buffer);
  const result = occt.ReadStepFile(fileBytes, null);

  if (!result || !result.meshes || result.meshes.length === 0) {
    throw new Error('Could not parse any 3D meshes from the STEP file. Ensure the file contains valid solid bodies.');
  }

  const geometries: THREE.BufferGeometry[] = [];

  for (const meshData of result.meshes) {
    if (!meshData.attributes || !meshData.attributes.position) continue;

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(meshData.attributes.position.array, 3));

    if (meshData.attributes.normal) {
      geo.setAttribute('normal', new THREE.Float32BufferAttribute(meshData.attributes.normal.array, 3));
    }

    if (meshData.index && meshData.index.array) {
      const idxArr = Uint32Array.from(meshData.index.array);
      geo.setIndex(new THREE.BufferAttribute(idxArr, 1));
    }

    geo.computeVertexNormals();
    geometries.push(geo);
  }

  if (geometries.length === 0) {
    throw new Error('STEP file contained no geometry positions.');
  }

  let merged: THREE.BufferGeometry;
  if (geometries.length === 1) {
    merged = geometries[0];
  } else {
    const unindexed = geometries.map((g) => (g.index ? g.toNonIndexed() : g));
    merged = BufferGeometryUtils.mergeGeometries(unindexed, false) || geometries[0];
  }

  // STEP models often use Z-up; rotate -90 degrees around X to match Three.js Y-up bed
  merged.rotateX(-Math.PI / 2);
  merged.computeVertexNormals();

  return createModelDataFromGeometry(merged, fileName, buffer.byteLength, 'step');
}

/**
 * Loads uploaded file based on its extension
 */
export async function loadModelFromFile(file: File): Promise<ModelData> {
  const extension = file.name.split('.').pop()?.toLowerCase();

  if (extension !== 'stl' && extension !== 'step' && extension !== 'stp') {
    throw new Error('Unsupported format. Please upload an .stl or .step / .stp file.');
  }

  const buffer = await file.arrayBuffer();

  if (extension === 'stl') {
    return loadStlFromBuffer(buffer, file.name);
  } else {
    return loadStepFromBuffer(buffer, file.name);
  }
}

/**
 * Loads pre-configured sample models
 */
export async function loadSampleModel(sampleId: string): Promise<ModelData> {
  if (sampleId === 'sample-gear') {
    const geo = createGearGeometry();
    return createModelDataFromGeometry(geo, 'Precision_Spur_Gear_16T.stl', 142800, 'stl');
  }

  if (sampleId === 'sample-benchy') {
    const geo = createBenchyGeometry();
    return createModelDataFromGeometry(geo, '3D_Benchy_Torture_Model.stl', 256400, 'stl');
  }

  if (sampleId === 'sample-drone-arm') {
    const geo = createDroneArmGeometry();
    return createModelDataFromGeometry(geo, 'Quadcopter_Motor_Arm.stl', 184500, 'stl');
  }

  if (sampleId === 'sample-step-bracket') {
    const response = await fetch('/samples/bearing_mount.step');
    if (!response.ok) {
      throw new Error('Failed to load sample STEP file from server');
    }
    const buffer = await response.arrayBuffer();
    return loadStepFromBuffer(buffer, 'Bearing_Mount_AP214.step');
  }

  // Default fallback
  const geo = createGearGeometry();
  return createModelDataFromGeometry(geo, 'Precision_Spur_Gear_16T.stl', 142800, 'stl');
}
