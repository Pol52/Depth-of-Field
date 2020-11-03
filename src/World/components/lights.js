import { 
    PointLight,
    HemisphereLight
} from '../../../node_modules/three/build/three.module.js';

function createLights() {
    const mainLight = new PointLight('navajowhite', 10);
    mainLight.position.set(0,12,0);
    mainLight.castShadow = true    

    const ambientLight = new HemisphereLight('white', 'darkslategrey', 1);

    return {mainLight, ambientLight};
}

export { createLights };