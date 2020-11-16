import { Vector3 } from '../../../node_modules/three/build/three.module.js';
import { OrbitControls } from '../../../node_modules/three/examples/jsm/controls/OrbitControls.js';

function createControls(camera, canvas) {
    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.target = new Vector3(-11.5, 1.3, 19.3);
    controls.autoRotate = true; 

    return controls;
}

export { createControls };