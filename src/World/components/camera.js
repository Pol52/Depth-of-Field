import { PerspectiveCamera } from '../../../node_modules/three/build/three.module.js';

function createCamera() {
    const camera = new PerspectiveCamera(
        35,
        1,
        1,
        1000,
    );

    camera.focus = 1;    
    camera.position.set(10, 5, 6);
    camera.rotation.Z = Math.PI / 2;
    camera.setFocalLength( 14 );
    return camera;
}

export { createCamera };