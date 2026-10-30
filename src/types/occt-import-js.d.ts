declare module 'occt-import-js' {
  export interface OcctMesh {
    name?: string;
    color?: [number, number, number];
    brep_faces?: Array<{
      color?: [number, number, number];
      first: number;
      last: number;
    }>;
    attributes: {
      position: {
        array: Float32Array | number[];
      };
      normal?: {
        array: Float32Array | number[];
      };
    };
    index?: {
      array: Uint32Array | number[];
    };
  }

  export interface OcctResult {
    success: boolean;
    meshes: OcctMesh[];
  }

  export interface OcctInstance {
    ReadStepFile: (buffer: Uint8Array, params: any) => OcctResult;
  }

  export default function occtimportjs(options?: {
    locateFile?: (path: string) => string;
    wasmBinary?: Uint8Array | ArrayBuffer;
  }): Promise<OcctInstance>;
}

