import type { ReactNode } from 'react';
import type { CameraMapa } from '../data/camera-mapa';
export type PropsMapaInterativo = { camera: CameraMapa; onChange: (camera: CameraMapa) => void; altura: number; children: ReactNode };
