import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export interface SampleModelOption {
  id: string;
  name: string;
  format: 'stl' | 'step';
  description: string;
  badge: string;
}

export const SAMPLE_MODELS: SampleModelOption[] = [
  {
    id: 'sample-gear',
    name: 'Precision Helical Gear',
    format: 'stl',
    description: '16-tooth mechanical spur gear with center shaft bore & keyway',
    badge: 'Popular Mechanical'
  },
  {
    id: 'sample-benchy',
    name: '3D Benchy Tugboat',
    format: 'stl',
    description: 'The iconic 3D printing torture test with overhangs, bridges & arches',
    badge: 'Torture Test'
  },
  {
    id: 'sample-drone-arm',
    name: 'Quadcopter Motor Arm',
    format: 'stl',
    description: 'Lightweight drone arm with M3 motor mounts & structural ribbing',
    badge: 'Functional Part'
  },
  {
    id: 'sample-step-bracket',
    name: 'Bearing Mount CAD Assembly',
    format: 'step',
    description: 'High-precision industrial flange parsed directly from STEP (AP214 format)',
    badge: 'Real STEP CAD'
  }
];

/**
 * Creates a procedural 16-tooth gear geometry
 */
export function createGearGeometry(): THREE.BufferGeometry {
  const teeth = 16;
  const outerRadius = 32;
  const rootRadius = 24;
  const innerRadius = 8;
  const thickness = 14;

  const shape = new THREE.Shape();
  const step = (Math.PI * 2) / teeth;

  for (let i = 0; i < teeth; i++) {
    const angle = i * step;
    const a1 = angle;
    const a2 = angle + step * 0.25;
    const a3 = angle + step * 0.50;
    const a4 = angle + step * 0.75;

    const rRoot = rootRadius;
    const rOuter = outerRadius;

    if (i === 0) {
      shape.moveTo(Math.cos(a1) * rRoot, Math.sin(a1) * rRoot);
    } else {
      shape.lineTo(Math.cos(a1) * rRoot, Math.sin(a1) * rRoot);
    }

    shape.lineTo(Math.cos(a2) * rOuter, Math.sin(a2) * rOuter);
    shape.lineTo(Math.cos(a3) * rOuter, Math.sin(a3) * rOuter);
    shape.lineTo(Math.cos(a4) * rRoot, Math.sin(a4) * rRoot);
  }

  // Bore hole
  const holePath = new THREE.Path();
  holePath.absarc(0, 0, innerRadius, 0, Math.PI * 2, true);
  shape.holes.push(holePath);

  // Keyway slot
  const keyWidth = 3;
  const keyDepth = innerRadius + 2.5;
  const keyPath = new THREE.Path();
  keyPath.moveTo(-keyWidth / 2, innerRadius);
  keyPath.lineTo(-keyWidth / 2, keyDepth);
  keyPath.lineTo(keyWidth / 2, keyDepth);
  keyPath.lineTo(keyWidth / 2, innerRadius);
  shape.holes.push(keyPath);

  const extrudeSettings = {
    steps: 1,
    depth: thickness,
    bevelEnabled: true,
    bevelThickness: 1.2,
    bevelSize: 1.0,
    bevelSegments: 3
  };

  const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  geometry.center();
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * Creates a composite 3D Benchy-like tugboat geometry
 */
export function createBenchyGeometry(): THREE.BufferGeometry {
  const geometries: THREE.BufferGeometry[] = [];

  // Hull
  const hullShape = new THREE.Shape();
  hullShape.moveTo(-30, -12);
  hullShape.quadraticCurveTo(0, -18, 30, 0); // bow tip
  hullShape.quadraticCurveTo(0, 18, -30, 12);
  hullShape.lineTo(-30, -12);

  const hullGeo = new THREE.ExtrudeGeometry(hullShape, {
    depth: 18,
    bevelEnabled: true,
    bevelThickness: 3,
    bevelSize: 2,
    bevelSegments: 4
  });
  hullGeo.rotateX(-Math.PI / 2);
  hullGeo.translate(0, 8, 0);
  geometries.push(hullGeo);

  // Cabin
  const cabinGeo = new THREE.BoxGeometry(22, 18, 18);
  cabinGeo.translate(-4, 20, 0);
  geometries.push(cabinGeo);

  // Roof
  const roofGeo = new THREE.BoxGeometry(26, 3, 22);
  roofGeo.translate(-4, 30, 0);
  geometries.push(roofGeo);

  // Smokestack chimney
  const stackGeo = new THREE.CylinderGeometry(3.5, 4, 16, 20);
  stackGeo.translate(3, 36, 0);
  geometries.push(stackGeo);

  // Cargo box in stern
  const cargoGeo = new THREE.BoxGeometry(12, 6, 12);
  cargoGeo.translate(-20, 14, 0);
  geometries.push(cargoGeo);

  // Normalize all geometries to non-indexed to ensure compatible attributes
  const unindexed = geometries.map((g) => (g.index ? g.toNonIndexed() : g));
  const merged = BufferGeometryUtils.mergeGeometries(unindexed, false) || geometries[0];
  merged.center();
  merged.computeVertexNormals();
  return merged;
}

/**
 * Creates a procedural Quadcopter Drone Motor Arm geometry
 */
export function createDroneArmGeometry(): THREE.BufferGeometry {
  const geometries: THREE.BufferGeometry[] = [];

  // Arm beam
  const beamGeo = new THREE.BoxGeometry(90, 8, 14);
  beamGeo.translate(0, 4, 0);
  geometries.push(beamGeo);

  // Motor mount bell disc at the end
  const motorDisc = new THREE.CylinderGeometry(18, 18, 8, 32);
  motorDisc.translate(45, 4, 0);
  geometries.push(motorDisc);

  // Center hub clamp
  const hubGeo = new THREE.CylinderGeometry(14, 14, 12, 24);
  hubGeo.translate(-45, 6, 0);
  geometries.push(hubGeo);

  // Reinforcement gussets
  const gussetShape = new THREE.Shape();
  gussetShape.moveTo(-35, 8);
  gussetShape.lineTo(0, 16);
  gussetShape.lineTo(35, 8);
  gussetShape.closePath();
  const gussetGeo = new THREE.ExtrudeGeometry(gussetShape, {
    depth: 4,
    bevelEnabled: false
  });
  gussetGeo.translate(0, 0, -2);
  geometries.push(gussetGeo);

  const unindexed = geometries.map((g) => (g.index ? g.toNonIndexed() : g));
  const merged = BufferGeometryUtils.mergeGeometries(unindexed, false) || geometries[0];
  merged.center();
  merged.computeVertexNormals();
  return merged;
}

