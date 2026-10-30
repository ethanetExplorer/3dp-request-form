import * as THREE from 'three';
import { Material, PrintEstimate, SlicerSettings } from '../types';
import { BASE_SETUP_FEES } from './materialsData';

/**
 * Calculates accurate geometric volume of a THREE.BufferGeometry in mm³.
 * Uses signed tetrahedron decomposition: Volume = 1/6 * sum(v1 . (v2 x v3))
 */
export function calculateGeometryVolume(geometry: THREE.BufferGeometry): number {
  const position = geometry.getAttribute('position');
  if (!position) return 0;

  const index = geometry.getIndex();
  let volume = 0;

  const p1 = new THREE.Vector3();
  const p2 = new THREE.Vector3();
  const p3 = new THREE.Vector3();

  if (index) {
    for (let i = 0; i < index.count; i += 3) {
      const a = index.getX(i);
      const b = index.getX(i + 1);
      const c = index.getX(i + 2);

      p1.fromBufferAttribute(position, a);
      p2.fromBufferAttribute(position, b);
      p3.fromBufferAttribute(position, c);

      volume += signedTetrahedronVolume(p1, p2, p3);
    }
  } else {
    for (let i = 0; i < position.count; i += 3) {
      p1.fromBufferAttribute(position, i);
      p2.fromBufferAttribute(position, i + 1);
      p3.fromBufferAttribute(position, i + 2);

      volume += signedTetrahedronVolume(p1, p2, p3);
    }
  }

  // Absolute volume in mm³. If volume is 0 or unclosed mesh, estimate from bounding box.
  const absVol = Math.abs(volume);
  if (absVol > 0.001) {
    return absVol;
  }

  // Fallback to ~35% of bounding box volume for non-watertight/open meshes
  geometry.computeBoundingBox();
  const box = geometry.boundingBox;
  if (!box) return 1000; // 1 cm³ fallback

  const size = new THREE.Vector3();
  box.getSize(size);
  return size.x * size.y * size.z * 0.35;
}

function signedTetrahedronVolume(p1: THREE.Vector3, p2: THREE.Vector3, p3: THREE.Vector3): number {
  return (
    p1.x * (p2.y * p3.z - p2.z * p3.y) -
    p1.y * (p2.x * p3.z - p2.z * p3.x) +
    p1.z * (p2.x * p3.y - p2.y * p3.x)
  ) / 6.0;
}

/**
 * Calculates surface area of a geometry in mm²
 */
export function calculateSurfaceArea(geometry: THREE.BufferGeometry): number {
  const position = geometry.getAttribute('position');
  if (!position) return 0;

  const index = geometry.getIndex();
  let area = 0;

  const p1 = new THREE.Vector3();
  const p2 = new THREE.Vector3();
  const p3 = new THREE.Vector3();
  const edge1 = new THREE.Vector3();
  const edge2 = new THREE.Vector3();
  const cross = new THREE.Vector3();

  const count = index ? index.count : position.count;

  for (let i = 0; i < count; i += 3) {
    const a = index ? index.getX(i) : i;
    const b = index ? index.getX(i + 1) : i + 1;
    const c = index ? index.getX(i + 2) : i + 2;

    p1.fromBufferAttribute(position, a);
    p2.fromBufferAttribute(position, b);
    p3.fromBufferAttribute(position, c);

    edge1.subVectors(p2, p1);
    edge2.subVectors(p3, p1);
    cross.crossVectors(edge1, edge2);

    area += cross.length() * 0.5;
  }

  return area;
}

/**
 * Computes bounding box dimensions { x, y, z } in mm
 */
export function calculateDimensions(geometry: THREE.BufferGeometry): { x: number; y: number; z: number } {
  geometry.computeBoundingBox();
  const box = geometry.boundingBox;
  if (!box) return { x: 20, y: 20, z: 20 };

  const size = new THREE.Vector3();
  box.getSize(size);
  return {
    x: Math.max(0.1, Number(size.x.toFixed(1))),
    y: Math.max(0.1, Number(size.y.toFixed(1))),
    z: Math.max(0.1, Number(size.z.toFixed(1)))
  };
}

/**
 * Slices the model mathematically and calculates print duration, filament consumption,
 * and cost based on hourly machine rate and material parameters.
 */
export function estimatePrintCost(
  volumeMm3: number,
  surfaceAreaMm2: number,
  dimensions: { x: number; y: number; z: number },
  settings: SlicerSettings,
  material: Material,
  customSetupFee?: number,
  additionalHourlyRate?: number
): PrintEstimate {
  // Convert to cm³ and cm²
  const volumeCm3 = volumeMm3 / 1000.0;
  const surfaceAreaCm2 = surfaceAreaMm2 / 100.0;

  // Shell volume: walls of thickness (wallLoops * 0.4mm = 0.04cm * loops)
  const wallThicknessCm = settings.wallLoops * 0.04;
  const rawShellVolumeCm3 = surfaceAreaCm2 * wallThicknessCm * 0.5; // inner half of surface
  const shellVolumeCm3 = Math.min(volumeCm3 * 0.95, rawShellVolumeCm3);

  // Core volume subjected to infill
  const coreVolumeCm3 = Math.max(0, volumeCm3 - shellVolumeCm3);
  const infillVolumeCm3 = coreVolumeCm3 * (settings.infillPercent / 100.0);

  // Support volume estimation
  let supportFactor = 0;
  if (settings.supportType === 'normal') {
    supportFactor = 0.18; // ~18% extra material for supports
  } else if (settings.supportType === 'tree') {
    supportFactor = 0.11; // ~11% extra for tree supports
  }
  const supportVolumeCm3 = volumeCm3 * supportFactor;

  // Bed adhesion material (skirt, brim, raft)
  let adhesionVolumeCm3 = 0.5; // base skirt
  if (settings.bedAdhesion === 'brim') adhesionVolumeCm3 = 2.0;
  if (settings.bedAdhesion === 'raft') adhesionVolumeCm3 = 5.0;

  // Total plastic volume
  const totalVolumeCm3 = shellVolumeCm3 + infillVolumeCm3 + supportVolumeCm3 + adhesionVolumeCm3;

  // Filament weight in grams = volume * density
  const filamentWeightGrams = Math.max(3.0, Number((totalVolumeCm3 * material.density).toFixed(1)));

  // Filament length (1.75mm diameter has cross section ~2.405 mm² = 0.02405 cm²)
  const filamentLengthMeters = Number(((totalVolumeCm3 / 0.02405) / 100.0).toFixed(1));

  // Layer count
  const layerHeight = settings.layerHeight || 0.20;
  const layerCount = Math.max(1, Math.round(dimensions.z / layerHeight));

  // Print Speed multiplier
  let speedMultiplier = 1.0;
  if (settings.speedPreset === 'quality') speedMultiplier = 1.45; // Slower, higher detail
  if (settings.speedPreset === 'high_speed') speedMultiplier = 0.70; // High speed CoreXY

  // Material speed adjustment (PETG prints slightly slower than PLA for optimal layer bonding)
  const materialSpeedFactor = material.type === 'PETG' ? 1.15 : 1.0;

  // Infill pattern speed modifier
  let patternMultiplier = 1.0;
  if (settings.infillPattern === 'Gyroid') patternMultiplier = 1.08;
  if (settings.infillPattern === 'Honeycomb') patternMultiplier = 1.15;
  if (settings.infillPattern === 'Linear') patternMultiplier = 0.95;

  // Nozzle diameter speed modifier
  // Smaller nozzles (0.2mm) have lower volumetric flow rate; larger nozzles (0.6mm, 0.8mm) extrude wider beads much faster
  let nozzleSpeedFactor = 1.0;
  const nozzleSize = settings.nozzleSize || 0.4;
  if (nozzleSize <= 0.25) {
    nozzleSpeedFactor = 1.60; // 0.2mm nozzle: fine detail, ~60% slower
  } else if (nozzleSize <= 0.45) {
    nozzleSpeedFactor = 1.0;  // 0.4mm nozzle: standard baseline
  } else if (nozzleSize <= 0.65) {
    nozzleSpeedFactor = 0.72; // 0.6mm nozzle: ~28% faster extrusion
  } else {
    nozzleSpeedFactor = 0.52; // 0.8mm nozzle: ~48% faster extrusion
  }

  // Base extrusion rate: standard FDM extrudes ~16.5 grams per hour with 0.4mm nozzle
  const extrusionHours = (filamentWeightGrams / 16.5) * speedMultiplier * materialSpeedFactor * patternMultiplier * nozzleSpeedFactor;

  // Overhead time: layer travel transitions (~0.45s per layer) + 9 min pre-flight heatup/bed mesh
  const layerTravelHours = (layerCount * 0.45) / 3600.0;
  const preheatOverheadHours = 0.15; // ~9 mins

  const rawPrintTimeHours = extrusionHours + layerTravelHours + preheatOverheadHours;
  // Round to nearest 0.05 hr (3 minutes) with a 0.25 hr minimum
  const printTimeHours = Math.max(0.3, Number(rawPrintTimeHours.toFixed(2)));

  // Format into hours and minutes
  const totalMinutes = Math.round(printTimeHours * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const formattedTime = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

  // Pricing calculations
  // 1. Machine Cost = printTimeHours * (hourlyMachineRate + additionalHourlyRate)
  const baseRate = material.hourlyMachineRate;
  const extraRate = additionalHourlyRate !== undefined && !isNaN(additionalHourlyRate) ? additionalHourlyRate : 0;
  const effectiveHourlyRate = baseRate + extraRate;
  const machineCost = Number((printTimeHours * effectiveHourlyRate).toFixed(2));

  // 2. Material Cost = filamentWeightGrams * gramRate
  const materialCost = Number((filamentWeightGrams * material.gramRate).toFixed(2));

  // 3. Flat Machine Slicing & Setup Fee
  const setupFee = customSetupFee !== undefined ? customSetupFee : (BASE_SETUP_FEES[material.type] ?? 3.50);

  // Total Cost
  const totalCost = Number((machineCost + materialCost + setupFee).toFixed(2));

  return {
    layerCount,
    filamentWeightGrams,
    filamentLengthMeters,
    printTimeHours,
    formattedTime,
    hourlyMachineRate: effectiveHourlyRate,
    machineCost,
    materialCost,
    setupFee,
    totalCost
  };
}

