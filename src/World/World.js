import { createCamera } from './components/camera.js';
import { createMeshGroup, scatterBalls } from './components/meshGroup.js';
import { createScene } from './components/scene.js';
import { createLights } from './components/lights.js';
import { createControls } from './systems/controls.js';

import { createRenderer, createPostProcessing, computeFocusDistance, changeShader } from './systems/renderer.js';
import { Resizer } from './systems/Resizer.js';

import { GUI } from '../../node_modules/three/examples/jsm/libs/dat.gui.module.js';
import Stats from '../../node_modules/three/examples/jsm/libs/stats.module.js';
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
let matChanger;
let focusOnMouse;
let postProcessing = {};
let newShaderFolder;
let oldShaderFolder;
let stats;

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

        materialDepth.uniforms['mNear'].value = camera.near;
        materialDepth.uniforms['mFar'].value = camera.far;
        
        postProcessing = createPostProcessing(width, height);

        container.style.touchAction = "none";        
        document.addEventListener( "mousemove", onDocumentMouseMove, false );

        const scatterBallsFn = () => scatterBalls(meshGroup);

        effectController = { 
            enabled: true,
            useNew: true,
            autoRotation: false,
            focusOnMouse: false,
            'Scatter!': scatterBallsFn,   
            focalDepth : 40 ,
            focalLength : 80.0 ,
            fstop: 2.2,
            maxblur: 1.8,
            dithering: 0.0001,
            fringe: 1,
            focus: 916,
            aperture: 100
        } 

        matChanger = function () {
            for (const e in effectController) {
                if (e in postProcessing.bokeh_uniforms) {
                    if(e == 'aperture'){
                        postProcessing.bokeh_uniforms[e].value = effectController[e] * 0.00001;    
                    }else
                        postProcessing.bokeh_uniforms[e].value = effectController[e];                    
                }
            }

            postProcessing.enabled = effectController.enabled;
            postProcessing.bokeh_uniforms['nearClip'].value = camera.near;
            postProcessing.bokeh_uniforms['farClip'].value = camera.far;
            camera.setFocalLength(effectController.focalLength);
            controls.autoRotate = effectController.autoRotation;
            focusOnMouse = effectController.focusOnMouse;
            controls.update();
        };
          
        const gui = new GUI();

        const commonFolder = gui.addFolder('Common Settings');
        commonFolder.add(effectController, "enabled").onChange(matChanger);
        commonFolder.add(effectController, "focalLength", 70, 200, 1).onChange(matChanger);        
        commonFolder.add(effectController, "autoRotation", true).onChange(matChanger);
        commonFolder.add(effectController, "focusOnMouse", false).onChange(matChanger);
        commonFolder.add(effectController, "Scatter!");
        commonFolder.add(effectController, "useNew").onChange(updateShader);
        commonFolder.open();

        newShaderFolder = gui.addFolder('New Shader Settings');  
        newShaderFolder.add(effectController, "focalDepth", 1, 50.0, 1).listen().onChange(matChanger);      
        newShaderFolder.add(effectController, "fstop", 0.1, 22, 0.05).onChange(matChanger);
        newShaderFolder.add(effectController, "dithering", 0.0001, 0.005, 0.0001).onChange(matChanger);
        newShaderFolder.add(effectController, "maxblur", 0.0, 5.0, 0.025).listen().onChange(matChanger);
        newShaderFolder.add(effectController, "fringe", 0, 10, 0.5).onChange(matChanger);
        newShaderFolder.open();

        oldShaderFolder = gui.addFolder('Old Shader Settings'); 
        oldShaderFolder.add(effectController, "focus", 850, 950, 1).listen().onChange(matChanger);
        oldShaderFolder.add(effectController, "aperture", 0, 200, 1).onChange(matChanger);
        oldShaderFolder.add(effectController, "maxblur", 0.0, 0.05, 0.001).listen().onChange(matChanger);
            
        const resizer = new Resizer(width, height, camera, renderer, postProcessing);
        resizer.onResize = () => {
            postProcessing.rtTextureDepth.setSize(width, height);
            postProcessing.rtTextureColor.setSize(width, height);
            this.render();
        }

        stats = new Stats();   
        container.appendChild(stats.dom);

        matChanger();  
    }

    render() {        
        animate();           
    }
}

function animate() {
    requestAnimationFrame(animate, renderer.domElement);
    controls.update();
    render();
    stats.update();
}

function render() {
    if (focusOnMouse){
        distance = computeFocusDistance(scene, camera, mouse);
        if(effectController.useNew){
            postProcessing.bokeh_uniforms['focalDepth'].value = distance;
            effectController['focalDepth'] = distance;
        }else{
            postProcessing.bokeh_uniforms['focus'].value = distance;
            effectController['focus'] = distance;
        }        
    }

    if (postProcessing.enabled){
        renderer.clear();
        
        renderer.setRenderTarget(postProcessing.rtTextureColor);
        renderer.clear();
        renderer.render(scene, camera); 

        scene.overrideMaterial = materialDepth;
        renderer.setRenderTarget(postProcessing.rtTextureDepth);
        renderer.clear(); 
        renderer.render(scene, camera);

        scene.overrideMaterial = null;        
        renderer.setRenderTarget(null);
        renderer.render(postProcessing.scene, postProcessing.camera); 
    } else {
        scene.overrideMaterial = null;

        renderer.setRenderTarget(null);
        renderer.clear();
        renderer.render(scene, camera);
    }
}

function onDocumentMouseMove(event){
    if(event.isPrimary === false) return;

    mouse.x = (event.clientX - windowHalfX) / windowHalfX;
    mouse.y = - (event.clientY - windowHalfY) / windowHalfY;
}

function updateShader(){
    if(effectController.useNew){
        oldShaderFolder.close();
        newShaderFolder.open();
        effectController.maxblur = 1.8;
    }else{
        effectController.maxblur = 0.005;
        oldShaderFolder.open();
        newShaderFolder.close();
    }
    postProcessing = changeShader(postProcessing, effectController.useNew, width, height);
    matChanger();
}


export { World };