import { createCamera } from './components/camera.js';
import { createMeshGroup, scatterBalls } from './components/meshGroup.js';
import { createScene } from './components/scene.js';
import { createLights } from './components/lights.js';
import { createControls } from './systems/controls.js';

import { createRenderer, createPostProcessing, computeFocusDistance } from './systems/renderer.js';
import { Resizer } from './systems/Resizer.js';

import { GUI } from '../../node_modules/three/examples/jsm/libs/dat.gui.module.js';
import { ShaderMaterial, Vector2 } from '../../node_modules/three/build/three.module.js';
import { BokehDepthShader } from '../../assets/BokehDepthShader.js';

let camera;
let scene;
let renderer;
let controls;
let materialDepth;
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
        
        const depthShader = BokehDepthShader;

        materialDepth = new ShaderMaterial( {
            uniforms: depthShader.uniforms,
            vertexShader: depthShader.vertexShader,
            fragmentShader: depthShader.fragmentShader
        } );

        materialDepth.uniforms[ 'mNear' ].value = camera.near;
        materialDepth.uniforms[ 'mFar' ].value = camera.far;
        
        postProcessing = createPostProcessing(width, height);

        container.style.touchAction = "none";        
        document.addEventListener( "mousemove", onDocumentMouseMove, false );

        const scatterBallsFn = () => scatterBalls(meshGroup);

        effectController = { 
            enabled: true,
            autoRotation: false,
            focusOnMouse: false,
            'Scatter!': scatterBallsFn,   
            focalDepth : 2.8 ,
            focalLength :  50.0 ,
            fstop:  2.2,
            maxblur: 1.8,
            dithering: 0.0001,
            fringe: 1
        } 

        const matChanger = function () {
            for ( const e in effectController ) {
                if ( e in postProcessing.bokeh_uniforms ) {
                    postProcessing.bokeh_uniforms[ e ].value = effectController[ e ];
                }
            }

            postProcessing.enabled = effectController.enabled;
            postProcessing.bokeh_uniforms['znear'].value = camera.near;
            postProcessing.bokeh_uniforms['zfar'].value = camera.far;
            camera.setFocalLength( effectController.focalLength );
            controls.autoRotate = effectController.autoRotation;
            focusOnMouse = effectController.focusOnMouse;
            controls.update();
        };  
        
        const gui = new GUI();
        gui.add( effectController, "enabled" ).onChange( matChanger );
        gui.add( effectController, "focalDepth", 10, 1000.0, 1 ).listen().onChange( matChanger );
        gui.add( effectController, "focalLength", 14, 80, 0.001 ).onChange( matChanger );
        gui.add( effectController, "fstop", 0.1, 22, 0.05 ).onChange( matChanger );
        gui.add( effectController, "dithering", 0.0001, 0.005, 0.0001 ).onChange( matChanger );
        gui.add( effectController, "maxblur", 0.0, 5.0, 0.025 ).onChange( matChanger );
        gui.add( effectController, "fringe", 1, 10, 0.5 ).onChange( matChanger );
        gui.add( effectController, "autoRotation", true).onChange( matChanger );
        gui.add( effectController, "focusOnMouse", false).onChange(matChanger);
        gui.add( effectController, "Scatter!")
        gui.close();
        
        const resizer = new Resizer(width, height, camera, renderer, postProcessing);
        resizer.onResize = () => {
            postProcessing.rtTextureDepth.setSize(width, height);
            postProcessing.rtTextureColor.setSize(width, height);
            this.render();
        }

        matChanger();  
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

    if ( focusOnMouse ) {
        distance = computeFocusDistance(scene, camera, mouse);
        postProcessing.bokeh_uniforms[ 'focalDepth' ].value = distance;
        effectController[ 'focalDepth' ] = distance;
    }

    if ( postProcessing.enabled ) {
        renderer.clear();
        
        renderer.setRenderTarget( postProcessing.rtTextureColor );
        renderer.clear();
        renderer.render( scene, camera ); 

        scene.overrideMaterial = materialDepth;
        renderer.setRenderTarget( postProcessing.rtTextureDepth );
        renderer.clear(); 
        renderer.render( scene, camera );

        scene.overrideMaterial = null;        
        renderer.setRenderTarget( null );
        renderer.render( postProcessing.scene, postProcessing.camera ); 
    } else {

        scene.overrideMaterial = null;

        renderer.setRenderTarget( null );
        renderer.clear();
        renderer.render( scene, camera );

    }
}

function onDocumentMouseMove( event ) {
    if (event.isPrimary === false) return;

    mouse.x = (event.clientX - windowHalfX) / windowHalfX;
    mouse.y = - (event.clientY - windowHalfY) / windowHalfY;
}


export { World };