import {
	Vector2
} from "../node_modules/three/build/three.module.js";

var BokehShaderUpdate = {
    uniforms: {
        tDepth : { type: "t", texture: null },
        tRender : { type: "t", texture: null },
        nearClip : { type: "f", value : 0.1 },
        farClip : { type: "f", value : 1000 },
        aspect : { type: "v2", value : new Vector2() },
        focalDepth : { type: "f", value: 10000 },
        focalLength : { type: "f", value: 10.0 },
        fstop: { type: "f", value: 0.5 },
        dithering : { type: "f", value: 0.0001 },
        maxblur : { type: "f", value: 2.0 },
        fringe : { type: "f", value: 0 },
    },
    vertexShader: [
        "varying vec2 vUv;",

        "void main(){",
           " vUv = vec2( uv.x, uv.y );",
            "gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",
        "}"        
    ].join("\n"),

    fragmentShader: [
        "#define PI 3.1415926",

        "uniform sampler2D tDepth;",
        "uniform sampler2D tRender;",
        "uniform float nearClip; ",
        "uniform float farClip;", 
        "uniform vec2 aspect;", 
        "uniform float focalLength;", 
        "uniform float focalDepth;", 
        "uniform float fstop;", 
        "uniform float dithering;", 
        "uniform float maxblur;", 
        "uniform float fringe;", 
        
        "varying vec2 vUv;", 
        
        "float dbsize = 1.25;", 
        "const float CoC = 0.03;", 
        "const int rings = 3;",
        "const int samples = 4;",
        "const int maxringsamples = rings * samples;",
        
        
        "float bdepth(vec2 coords) {",
            "float d = 0.0, kernel[9];",
            "vec2 texel = vec2(1.0/aspect.x,1.0/aspect.y);",
            "vec2 offset[9], wh = vec2(texel.x, texel.y) * dbsize;",
        
            "offset[0] = vec2(-wh.x,-wh.y);",
            "offset[1] = vec2( 0.0, -wh.y);",
            "offset[2] = vec2( wh.x -wh.y);",
        
            "offset[3] = vec2(-wh.x,  0.0);",
            "offset[4] = vec2( 0.0,   0.0);",
            "offset[5] = vec2( wh.x,  0.0);",
        
            "offset[6] = vec2(-wh.x, wh.y);",
            "offset[7] = vec2( 0.0,  wh.y);",
            "offset[8] = vec2( wh.x, wh.y);",
        
            "kernel[0] = 1.0/16.0;   kernel[1] = 2.0/16.0;   kernel[2] = 1.0/16.0;",
            "kernel[3] = 2.0/16.0;   kernel[4] = 4.0/16.0;   kernel[5] = 2.0/16.0;",
            "kernel[6] = 1.0/16.0;   kernel[7] = 2.0/16.0;   kernel[8] = 1.0/16.0;",
        
        
            "for( int i=0; i<9; i++ ) {",
                "float tmp = texture2D(tDepth, coords + offset[i]).r;",
                "d += tmp * kernel[i];",
            "}",
        
            "return d;",
        "}",
        
        "vec3 color(vec2 coords,float blur) {",
            "vec3 col = vec3(0.0);",
            "vec2 texel = vec2(1.0/aspect.x,1.0/aspect.y);",
            
            "col.r = texture2D(tRender,coords + vec2(0.0,1.0)*texel*fringe*blur).r;",
            "col.g = texture2D(tRender,coords + vec2(-0.866,-0.5)*texel*fringe*blur).g;",
            "col.b = texture2D(tRender,coords + vec2(0.866,-0.5)*texel*fringe*blur).b;",

            "return col;",
        "}",
        
        "void gather(float i, float j, int ringsamples, inout vec3 col, float w, float h, float blur) {",
            "float rings2 = float(rings);",
            "float step = PI*2.0 / float(ringsamples);",
            "float pw = cos(j*step)*i;",
            "float ph = sin(j*step)*i;",
            "col += color(vUv.xy + vec2(pw*w,ph*h), blur) * 1.0;",
        "}",
        
        "float linearize(float depth) {",
            "return -farClip * nearClip / (depth * (farClip - nearClip) - farClip);",
        "}",
        
        "void main(void)",
        "{",
            "float depth = linearize(bdepth(vUv.xy));",
        
            "float f = focalLength;", 
            "float d = focalDepth*1000.0;", 
            "float o = depth*1000.0;", 
        
            "float a = (o*f)/(o-f);",
            "float b = (d*f)/(d-f);",
            "float c = 1.0/(fstop*CoC);",
        
            "float blur = clamp(abs(a-b)*c,0.0,1.0);",
        
            "float w = (1.0/aspect.x)*blur*maxblur;",
            "float h = (1.0/aspect.y)*blur*maxblur;",
        
            "vec3 col = texture2D(tRender, vUv.xy).rgb;",
        
            "if ( blur >= 0.05 ) {",
                "float s = 1.0;",
                "int ringsamples;",
        
                "for (int i = 1; i <= rings; i++) {",
                    "ringsamples = i * samples;",
        
                    "for (int j = 0 ; j < ringsamples + 1 ; j++) {",
                        "s += 1.0;",
                        "gather(float(i), float(j), ringsamples, col, w, h, blur);",
                    "}",
                "}",
                "col /= s;", 
            "}",
        
            "gl_FragColor = vec4(col,1.0);",
        "}"
    ].join("\n")
}


				
export { BokehShaderUpdate };



