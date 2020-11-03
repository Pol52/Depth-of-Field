import { createCamera } from './components/camera.js';
import { createMeshGroup } from './components/meshGroup.js';
import { createScene } from './components/scene.js';
import { createLights } from './components/lights.js';
import { createControls } from './systems/controls.js';

import { createRenderer } from './systems/renderer.js';
import { Resizer } from './systems/Resizer.js';

import { EffectComposer } from '../../node_modules/three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from '../../node_modules/three/examples/jsm/postprocessing/RenderPass.js';
import { BokehPass } from '../../node_modules/three/examples/jsm/postprocessing/BokehPass.js';
import { GUI } from '../../node_modules/three/examples/jsm/libs/dat.gui.module.js';

let camera;
let scene;
let renderer;
let controls;

let width = window.innerWidth;
let height = window.innerHeight;

const postprocessing = {};

function initPostprocessing() {

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

}

class World {    

    constructor(container) {
        camera = createCamera();
        scene = createScene();
        renderer = createRenderer();
        renderer.shadowMap.enabled = true;
        container.append(renderer.domElement);
        
        controls = createControls(camera, renderer.domElement);
        controls.addEventListener('change', () => {
            render();
        });
        
        const meshGroup = createMeshGroup();
        const {mainLight, ambientLight} = createLights();        
        scene.add(meshGroup, mainLight, ambientLight);
            
        initPostprocessing();

        container.style.touchAction = 'none';        

        const effectController = {
            focus: 25.5,
            aperture: 150,
            maxblur: 0.04,
            autoRotation: true   
        };

        const matChanger = function ( ) {
            postprocessing.bokeh.uniforms[ "focus" ].value = effectController.focus;
            postprocessing.bokeh.uniforms[ "aperture" ].value = effectController.aperture * 0.00001;
            postprocessing.bokeh.uniforms[ "maxblur" ].value = effectController.maxblur;
            controls.autoRotate = effectController.autoRotation;
            controls.update();
        };
    
        const gui = new GUI();
        gui.add( effectController, "focus", 0.0, 70.0, 0.5 ).onChange( matChanger );
        gui.add( effectController, "aperture", 0, 200, 0.1 ).onChange( matChanger );
        gui.add( effectController, "maxblur", 0.0, 0.05, 0.001 ).onChange( matChanger );
        gui.add( effectController, "autoRotation", true).onChange( matChanger );
        gui.close();
    
        matChanger(); 
        
        const resizer = new Resizer(width, height, camera, renderer, postprocessing);
        resizer.onResize = () => {
            this.render();
        }
    }

    render() {        
        animate();           
    }
}

function animate() {
    requestAnimationFrame( animate, renderer.domElement );
    controls.update();
    render();
}

function render() {    
    postprocessing.composer.render( 0.1 );
}

export { World };