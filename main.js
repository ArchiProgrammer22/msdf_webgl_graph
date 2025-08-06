import { WebGLContext } from './src/WebGLContext.js';
import { SceneManager } from './src/SceneManager.js';

const canvas = document.getElementById('gl-canvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const gl = canvas.getContext('webgl');
if (!gl) {
    alert('WebGL is not supported!');
}

let webglContext;
let sceneManager;

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    if (gl) {
        webglContext.updateViewport(canvas.width, canvas.height);
        sceneManager.updateLayout();
    }
});

async function init() {
    webglContext = new WebGLContext(gl);
    sceneManager = new SceneManager(gl, webglContext);
    await sceneManager.loadAssets();
    
    renderLoop();
}

function renderLoop(currentTime) {
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    sceneManager.update(currentTime);
    sceneManager.draw();

    requestAnimationFrame(renderLoop);
}

init();
