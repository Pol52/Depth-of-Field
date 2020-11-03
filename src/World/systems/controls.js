import { Vector3 } from '../../../node_modules/three/build/three.module.js';
import { OrbitControls } from '../../../node_modules/three/examples/jsm/controls/OrbitControls.js';

function createControls(camera, canvas) {
    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.target = new Vector3(-17.27420808731932, 1.4391236900241409,21.24044366221997);
    controls.autoRotate = true; 

    return controls;
}

export { createControls };