const setSize = (width, height, camera, renderer, postprocessing) => {
    width = window.innerWidth;
    height = window.innerHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
}

class Resizer {
    constructor(width, height, camera, renderer, postprocessing) {
        setSize(width, height,camera, renderer, postprocessing);

        window.addEventListener('resize', () => {
            setSize(width, height, camera, renderer, postprocessing);
            this.onResize();
        });
    }

    onResize() {}    
}

export { Resizer };