
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
import { BokehShader } from '../../../assets/BokehShader.js';

let raycaster = new Raycaster();
let distance = 100;

function createRenderer() {
    const renderer = new WebGLRenderer({ antialias: true });
    renderer.physicallyCorrectLights = true;
    
    return renderer;
}

function createPostProcessing(width, height){

    const postProcessing = { enabled: false };

    postProcessing.scene = new Scene();

    postProcessing.camera = new OrthographicCamera(width / - 2, width / 2, height / 2, height / - 2, - 10000, 10000);
    postProcessing.camera.position.z = 100;

    postProcessing.scene.add(postProcessing.camera);

    const pars = { minFilter: LinearFilter, magFilter: LinearFilter, format: RGBFormat };
    postProcessing.rtTextureDepth = new WebGLRenderTarget(width, height, pars);
    postProcessing.rtTextureColor = new WebGLRenderTarget(width, height, pars);

    const bokeh_shader = BokehShaderUpdate;

    postProcessing.bokeh_uniforms = UniformsUtils.clone(bokeh_shader.uniforms);

    postProcessing.bokeh_uniforms['tDepth'].value = postProcessing.rtTextureDepth.texture;
    postProcessing.bokeh_uniforms['tRender'].value = postProcessing.rtTextureColor.texture;  
    postProcessing.bokeh_uniforms['iResolution'].value = new Vector2(width, height);

    postProcessing.materialBokeh = new ShaderMaterial( {
        uniforms: postProcessing.bokeh_uniforms,
        vertexShader: bokeh_shader.vertexShader,
        fragmentShader: bokeh_shader.fragmentShader
    } );

    postProcessing.quad = new Mesh(new PlaneBufferGeometry(width, height), postProcessing.materialBokeh);
    
    postProcessing.quad.position.z = -500;
    postProcessing.scene.add(postProcessing.quad);
    return postProcessing;
}

function changeShader(postProcessing, useNew, width, height){
    if(useNew) {
        const bokeh_shader = BokehShaderUpdate;

        postProcessing.bokeh_uniforms = UniformsUtils.clone(bokeh_shader.uniforms);
    
        postProcessing.bokeh_uniforms['tDepth'].value = postProcessing.rtTextureDepth.texture;
        postProcessing.bokeh_uniforms['tRender'].value = postProcessing.rtTextureColor.texture;  
        postProcessing.bokeh_uniforms['iResolution'].value = new Vector2(width, height);
    
        postProcessing.materialBokeh = new ShaderMaterial( {
            uniforms: postProcessing.bokeh_uniforms,
            vertexShader: bokeh_shader.vertexShader,
            fragmentShader: bokeh_shader.fragmentShader
        } );
    
        postProcessing.quad = new Mesh(new PlaneBufferGeometry(width, height), postProcessing.materialBokeh);
        
        postProcessing.quad.position.z = -500;
        postProcessing.scene.children.pop();
        postProcessing.scene.add(postProcessing.quad);
    } else {
        const bokeh_shader = BokehShader;

        postProcessing.bokeh_uniforms = UniformsUtils.clone(bokeh_shader.uniforms);
    
        postProcessing.bokeh_uniforms['tDepth'].value = postProcessing.rtTextureDepth.texture;
        postProcessing.bokeh_uniforms['tColor'].value = postProcessing.rtTextureColor.texture;  
        postProcessing.bokeh_uniforms['aspect'].value = width/height;
    
        postProcessing.materialBokeh = new ShaderMaterial({
            defines: Object.assign({}, bokeh_shader.defines),
            uniforms: postProcessing.bokeh_uniforms,
            vertexShader: bokeh_shader.vertexShader,
            fragmentShader: bokeh_shader.fragmentShader
        } );
    
        postProcessing.quad = new Mesh(new PlaneBufferGeometry(width, height), postProcessing.materialBokeh);
        
        postProcessing.quad.position.z = -500;
        postProcessing.scene.children.pop(); 
        postProcessing.scene.add(postProcessing.quad);
    }

    return postProcessing;
    
}

function computeFocusDistance(scene, camera, mouse) {
    raycaster.setFromCamera(mouse, camera);
    var intersects = raycaster.intersectObjects( scene.children, true );   

    if (intersects.length > 0){    
        var targetDistance = intersects[0].distance;    
        distance += (targetDistance - distance) * 0.03; 
        const sdistance = smoothstep(camera.near, camera.far, distance);
        const ldistance = linearize(camera, 1 - sdistance); 
        return ldistance;
    }else
        return distance; 
}

function linearize(camera, depth) {
    const zfar = camera.far;
    const znear = camera.near;
    return - zfar * znear / (depth * (zfar - znear) - zfar);
}

function smoothstep(near, far, depth) {
    const x = saturate((depth - near) / (far - near));
    return x * x * ( 3 - 2 * x );
}

function saturate(x) {
    return Math.max(0, Math.min( 1, x ));
}



export {createRenderer, createPostProcessing, computeFocusDistance, changeShader};