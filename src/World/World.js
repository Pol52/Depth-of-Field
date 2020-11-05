import { createCamera } from './components/camera.js';
import { createMeshGroup, scatterBalls } from './components/meshGroup.js';
import { createScene } from './components/scene.js';
import { createLights } from './components/lights.js';
import { createControls } from './systems/controls.js';

import { createRenderer, createPostProcessing, computeFocusDistance } from './systems/renderer.js';
import { Resizer } from './systems/Resizer.js';

import { GUI } from '../../node_modules/three/examples/jsm/libs/dat.gui.module.js';
import { Vector2 } from '../../node_modules/three/build/three.module.js';

let camera;
let scene;
let renderer;
let controls;

let width = window.innerWidth;
let height = window.innerHeight;
let windowHalfX = window.innerWidth / 2;
let windowHalfY = window.innerHeight / 2;

let mouse = new Vector2();
let distance = 100;

let effectController;
let focusOnMouse;
let postProcessing = {};

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
            
        postProcessing = createPostProcessing(scene, camera, renderer, width, height);

        container.style.touchAction = "none";        
        document.addEventListener( "mousemove", onDocumentMouseMove, false );

        const scatterBallsFn = () => scatterBalls(meshGroup);
        effectController = {
            focus: 25.5,
            aperture: 25,
            maxblur: 0.04,
            autoRotation: false,
            focusOnMouse: false,
            'Scatter!': scatterBallsFn
        };

        const matChanger = function ( ) {
            postProcessing.bokeh.uniforms[ "focus" ].value = effectController.focus;
            postProcessing.bokeh.uniforms[ "aperture" ].value = effectController.aperture * 0.00001;
            postProcessing.bokeh.uniforms[ "maxblur" ].value = effectController.maxblur;
            controls.autoRotate = effectController.autoRotation;
            focusOnMouse = effectController.focusOnMouse;
            controls.update();
        };
    
        const gui = new GUI();
        gui.add( effectController, "focus", 0.0, 300.0, 0.5 ).listen().onChange( matChanger );
        gui.add( effectController, "aperture", 0, 50, 0.1 ).onChange( matChanger );
        gui.add( effectController, "maxblur", 0.0, 0.05, 0.001 ).onChange( matChanger );
        gui.add( effectController, "autoRotation", true).onChange( matChanger );
        gui.add( effectController, "focusOnMouse", false).onChange(matChanger);
        gui.add( effectController, "Scatter!")
        gui.close();
    
        matChanger();         
        
        const resizer = new Resizer(width, height, camera, renderer, postProcessing);
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
    if(focusOnMouse){
        distance = computeFocusDistance(scene, camera, mouse, distance);
        postProcessing.bokeh.uniforms['focus'].value = distance;
        effectController['focus'] = distance;  
    }        
    postProcessing.composer.render( 0.1 );
}

function onDocumentMouseMove( event ) {
    mouse.x = ( event.clientX - windowHalfX ) / windowHalfX;
    mouse.y = - ( event.clientY - windowHalfY ) / windowHalfY;
}


export { World };