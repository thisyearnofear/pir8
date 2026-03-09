declare module 'three/examples/jsm/controls/OrbitControls' {
  import { Camera } from 'three';

  export class OrbitControls {
    constructor(object: Camera, domElement?: HTMLElement);
    update(): void;
    enableDamping: boolean;
    dampingFactor: number;
    screenSpacePanning: boolean;
    enableZoom: boolean;
    minDistance: number;
    maxDistance: number;
    maxPolarAngle: number;
  }
}
