
import { LinearFilter, 
        Mesh, 
        OrthographicCamera,  
        PlaneBufferGeometry,
        Raycaster, 
        RGBFormat,
        Scene,
        ShaderMaterial,
        UniformsUtils,
        Vector2,
        WebGLRenderer,
        WebGLRenderTarget } from '../../../node_modules/three/build/three.module.js';

import { BokehShaderUpdate } from '../../../assets/BokehShaderUpdate.js';

let raycaster = new Raycaster();
let distance = 100;

function createRenderer() {
    const renderer = new WebGLRenderer({ antialias: true });
    renderer.physicallyCorrectLights = true;
    
    return renderer;
}

function createPostProcessing(width, height){

    const postprocessing = { enabled: false };

    postprocessing.scene = new Scene();

    postprocessing.camera = new OrthographicCamera( width / - 2, width / 2, height / 2, height / - 2, - 10000, 10000 );
    postprocessing.camera.position.z = 100;

    postprocessing.scene.add( postprocessing.camera );

    const pars = { minFilter: LinearFilter, magFilter: LinearFilter, format: RGBFormat };
    postprocessing.rtTextureDepth = new WebGLRenderTarget( width, height, pars );
    postprocessing.rtTextureColor = new WebGLRenderTarget( width, height, pars );

    const bokeh_shader = BokehShaderUpdate;

    postprocessing.bokeh_uniforms = UniformsUtils.clone( bokeh_shader.uniforms );

    postprocessing.bokeh_uniforms['tDepth'].value = postprocessing.rtTextureDepth.texture;
    postprocessing.bokeh_uniforms['tRender'].value = postprocessing.rtTextureColor.texture;  
    postprocessing.bokeh_uniforms['iResolution'].value = new Vector2(width, height);

    postprocessing.materialBokeh = new ShaderMaterial( {
        uniforms: postprocessing.bokeh_uniforms,
        vertexShader: bokeh_shader.vertexShader,
        fragmentShader: bokeh_shader.fragmentShader
    } );

    postprocessing.quad = new Mesh( new PlaneBufferGeometry( width, height ), postprocessing.materialBokeh );
    
    postprocessing.quad.position.z = -500;
    postprocessing.scene.add( postprocessing.quad );

    return postprocessing;
}

function computeFocusDistance(scene, camera, mouse) {
    raycaster.setFromCamera( mouse, camera );
    var intersects = raycaster.intersectObjects( scene.children, true );   
    if ( intersects.length > 0 ) {    
        var targetDistance = intersects[0].distance;    
        distance += (targetDistance - distance) * 0.03; 
        const sdistance = smoothstep( camera.near, camera.far, distance );
        const ldistance = linearize( camera, 1 - sdistance );   
        return ldistance;
    }else
        return distance; 
}

function linearize(camera, depth) {
    const zfar = camera.far;
    const znear = camera.near;
    return - zfar * znear / ( depth * ( zfar - znear ) - zfar );
}

function smoothstep( near, far, depth ) {
    const x = saturate( ( depth - near ) / ( far - near ) );
    return x * x * ( 3 - 2 * x );
}

function saturate( x ) {
    return Math.max( 0, Math.min( 1, x ) );
}



export {createRenderer, createPostProcessing, computeFocusDistance};