import { PerspectiveCamera } from '../../../node_modules/three/build/three.module.js';

function createCamera() {
    const camera = new PerspectiveCamera(
        70,
        window.innerWidth/window.innerHeight,
        1,
        1000,
    );

    camera.focus = 1;    
    camera.position.set(32.6, 0.4, 111.5);
    camera.rotation.Z = Math.PI / 2;
    return camera;
}

export { createCamera };