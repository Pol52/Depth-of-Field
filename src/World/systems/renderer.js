import { WebGLRenderer } from '../../../node_modules/three/build/three.module.js';
import { Raycaster, Vector2 } from '../../../node_modules/three/build/three.module.js';

import { EffectComposer } from '../../../node_modules/three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from '../../../node_modules/three/examples/jsm/postprocessing/RenderPass.js';
import { BokehPass } from '../../../node_modules/three/examples/jsm/postprocessing/BokehPass.js';

let raycaster = new Raycaster();

function createRenderer() {
    const renderer = new WebGLRenderer({ antialias: true });
    renderer.physicallyCorrectLights = true;

    

    return renderer;
}

function createPostProcessing(scene, camera, renderer, width, height) {
    const postprocessing = {};

    const renderPass = new RenderPass( scene, camera );

    const bokehPass = new BokehPass( scene, camera, {
        focus: 1.0,
        aperture: 0.025,
        maxblur: 0.01,

        width: width,
        height: height
    } );

    const composer = new EffectComposer( renderer );

    composer.addPass( renderPass );
    composer.addPass( bokehPass );

    postprocessing.composer = composer;
    postprocessing.bokeh = bokehPass;

    return postprocessing;

}

function computeFocusDistance(scene, camera, mouse, distance) {
    raycaster.setFromCamera( mouse, camera );
    var intersects = raycaster.intersectObjects( scene.children, true );   
    if ( intersects.length > 0 ) {    
        var targetDistance = intersects[0].distance;    
        distance += (targetDistance - distance) * 0.03;    
        return distance;
    }else
        return distance; 
}



export {createRenderer, createPostProcessing, computeFocusDistance};