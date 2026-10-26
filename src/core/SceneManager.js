import * as THREE from 'three';
import { DNAGeometry } from '../dna/DNAGeometry.js';
import { DNAMaterial } from '../dna/DNAMaterial.js';
import { PostProcessing } from '../effects/PostProcessing.js';

export class SceneManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.progress = 0.0;
        this.clock = new THREE.Clock();

        this.currentCameraPos = new THREE.Vector3(15, 6.5, 10);
        this.currentLookAt = new THREE.Vector3(0, 0, -12);
        this.targetLookAt = new THREE.Vector3(0, 0, -12);

        this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };

        this.initScene();
        this.initDNA();
        this.initPostProcessing();
        this.initEvents();
    }

    initScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color('#000000');

        this.camera = new THREE.PerspectiveCamera(
            46,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.copy(this.currentCameraPos);

        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            powerPreference: 'high-performance'
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    }

    initDNA() {
        this.dnaGeo = new DNAGeometry();
        this.dnaMat = new DNAMaterial();
        this.points = new THREE.Points(this.dnaGeo.geometry, this.dnaMat.material);
        this.scene.add(this.points);
    }

    initPostProcessing() {
        this.postProcessing = new PostProcessing(this.renderer, this.scene, this.camera);
    }

    initEvents() {
        window.addEventListener('resize', this.onResize.bind(this));
        window.addEventListener('mousemove', (e) => {
            this.mouse.targetX = (e.clientX / window.innerWidth - 0.5) * 2.0;
            this.mouse.targetY = (e.clientY / window.innerHeight - 0.5) * 2.0;
        });
    }

    onResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        if (this.postProcessing) {
            this.postProcessing.setSize(width, height);
        }
    }

    setProgress(val) {
        this.progress = THREE.MathUtils.clamp(val, 0.0, 1.0);
        if (this.postProcessing) {
            this.postProcessing.setProgress(this.progress);
        }
    }

    updateCinematicCamera(elapsedTime) {
        const p = this.progress;

        this.mouse.x = THREE.MathUtils.lerp(this.mouse.x, this.mouse.targetX, 0.035);
        this.mouse.y = THREE.MathUtils.lerp(this.mouse.y, this.mouse.targetY, 0.035);

        // Extended flight down 470 units
        const focusZ = -p * 470.0;

        const enterT = THREE.MathUtils.smoothstep(p, 0.35, 0.50);
        const sagProgress = THREE.MathUtils.smoothstep(p, 0.40, 0.92);
        const sagY = -Math.pow(sagProgress, 1.6) * 3.5;

        const startX = 15.0;
        const startY = 6.5;

        let desiredX = THREE.MathUtils.lerp(startX, 0.0, enterT);
        let desiredY = THREE.MathUtils.lerp(startY, sagY, enterT);

        const leadZ = THREE.MathUtils.lerp(10.0, 3.5, enterT);
        let desiredZ = focusZ + leadZ;

        const targetLookX = 0.0;
        const targetLookY = sagY;
        const targetLookZ = focusZ - 12.0;

        const breathX = Math.sin(elapsedTime * 0.4) * 0.25;
        const breathY = Math.cos(elapsedTime * 0.35) * 0.2;

        const mousePanX = this.mouse.x * 1.2;
        const mousePanY = -this.mouse.y * 0.9;

        desiredX += breathX + mousePanX;
        desiredY += breathY + mousePanY;

        this.currentCameraPos.lerp(new THREE.Vector3(desiredX, desiredY, desiredZ), 0.05);
        this.camera.position.copy(this.currentCameraPos);

        this.targetLookAt.set(targetLookX + mousePanX * 0.3, targetLookY + mousePanY * 0.3, targetLookZ);
        this.currentLookAt.lerp(this.targetLookAt, 0.055);

        this.camera.up.set(0, 1, 0);
        this.camera.lookAt(this.currentLookAt);

        const targetFov = THREE.MathUtils.lerp(46.0, 54.0, enterT);
        if (Math.abs(this.camera.fov - targetFov) > 0.01) {
            this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFov, 0.04);
            this.camera.updateProjectionMatrix();
        }
    }

    render() {
        const elapsedTime = this.clock.getElapsedTime();
        this.updateCinematicCamera(elapsedTime);
        this.dnaMat.update(elapsedTime, this.progress);
        this.postProcessing.render();
    }
}