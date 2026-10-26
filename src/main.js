import './style.css';
import { SceneManager } from './core/SceneManager.js';
import { InputController } from './core/InputController.js';

const canvas = document.querySelector('#webgl-canvas');
const sceneManager = new SceneManager(canvas);

// Bind Navigation Controller to Scene Manager
const inputController = new InputController((progress) => {
    sceneManager.setProgress(progress);
});

// Main 60 FPS Engine Loop
function animate() {
    requestAnimationFrame(animate);
    
    // Update smooth navigation & timeline progress
    inputController.update();
    
    // Render DNA scene
    sceneManager.render();
}

animate();

console.log("Chronicle Engine Active: Dual Navigation Connected.");