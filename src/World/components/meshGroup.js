import { 
    SphereBufferGeometry,
    BoxBufferGeometry,
    Group,
    Mesh, 
    MeshStandardMaterial, 
    MathUtils,
    TextureLoader
} from '../../../node_modules/three/build/three.module.js';


function createMeshGroup() {
    const group = new Group();

    const table = createCube();
    table.rotation.x = Math.PI / 2;
    table.position.z = -0.30;
    group.add(table);

    const geometry = new SphereBufferGeometry(0.28, 32, 32);
    const material = new MeshStandardMaterial({color: 'white'});
    material.roughness = 0;
    material.metalness = 0;
    const protoSphere = new Mesh(geometry, material);
    protoSphere.castShadow = true;
    group.add(protoSphere);

    var loader = new TextureLoader();
    var basePath = '../../../assets/textures/';
    var ballNumbers = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15];

    for(let row=0; row<5; row += 1){
        for(let i=0; i<row+1; i+=1){
            const ballNumber = ballNumbers.sort(function() { return 0.5 - Math.random();}).pop();            
            loader.load(basePath + ballNumber + '.jpg', function (texture){
                const sphere = protoSphere.clone();
                const sphereMaterial = new MeshStandardMaterial( { map: texture } );
                sphereMaterial.roughness = 0;
                sphereMaterial.metalness = 0;
                sphere.material = sphereMaterial;
                if(i == 0){
                    sphere.position.x = 1.3;
                    sphere.position.y = 1.3 + row * 0.50;
                }else{
                    const lastSphere = group.children[group.children.length-1];
                    sphere.position.y = lastSphere.position.y - 0.56;
                    sphere.position.x = lastSphere.position.x +  0.56;
                }
                const sphereRotation = MathUtils.degToRad(Math.floor(Math.random() * 360));
                sphere.rotation.set(sphereRotation, sphereRotation, sphereRotation);
        
                group.add(sphere);
            })           
        }
    }
    
    
    group.scale.multiplyScalar(10);
    group.rotation.x = Math.PI / 2;
    group.rotation.y = Math.PI;

    return group;
}

function createCube() {
    const geometry = new BoxBufferGeometry(1000, 0.1, 1000);
    const material = new MeshStandardMaterial({color: 'mediumseagreen'});
    const cube = new Mesh(geometry, material);
    cube.receiveShadow = true;
    return cube;   
}

export { createCube, createMeshGroup };