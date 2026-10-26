import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

export class PostProcessing {
    constructor(renderer, scene, camera) {
        this.renderer = renderer;
        this.scene = scene;
        this.camera = camera;
        this.progress = 0.0;

        this.initComposer();
    }

    initComposer() {
        this.composer = new EffectComposer(this.renderer);

        this.renderPass = new RenderPass(this.scene, this.camera);
        this.composer.addPass(this.renderPass);

        this.bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            0.8,
            0.45,
            0.1
        );
        this.composer.addPass(this.bloomPass);

        this.cinematicShader = {
            uniforms: {
                tDiffuse: { value: null },
                uProgress: { value: 0.0 },
                uAberration: { value: 0.002 },
                uGrain: { value: 0.025 },
                uExposure: { value: 1.0 },
                uTime: { value: 0.0 }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D tDiffuse;
                uniform float uProgress;
                uniform float uAberration;
                uniform float uGrain;
                uniform float uExposure;
                uniform float uTime;
                varying vec2 vUv;

                float random(vec2 p) {
                    return fract(sin(dot(p.xy, vec2(12.9898, 78.233))) * 43758.5453);
                }

                vec3 acesTonemap(vec3 color) {
                    float a = 2.51;
                    float b = 0.03;
                    float c = 2.43;
                    float d = 0.59;
                    float e = 0.14;
                    return clamp((color * (a * color + b)) / (color * (c * color + d) + e), 0.0, 1.0);
                }

                void main() {
                    vec2 distFromCenter = vUv - 0.5;
                    float dist = length(distFromCenter);

                    float r = texture2D(tDiffuse, vUv + distFromCenter * (uAberration * dist)).r;
                    float g = texture2D(tDiffuse, vUv).g;
                    float b = texture2D(tDiffuse, vUv - distFromCenter * (uAberration * dist)).b;
                    vec4 color = vec4(r, g, b, 1.0);

                    color.rgb *= uExposure;
                    color.rgb = acesTonemap(color.rgb);

                    float noise = (random(vUv + uTime * 0.1) - 0.5) * uGrain;
                    color.rgb += noise;

                    float vignette = 1.0 - dot(distFromCenter * 1.3, distFromCenter * 1.3);
                    color.rgb *= clamp(vignette, 0.0, 1.0);

                    gl_FragColor = color;
                }
            `
        };

        this.cinematicPass = new ShaderPass(this.cinematicShader);
        this.composer.addPass(this.cinematicPass);
    }

    setSize(width, height) {
        this.composer.setSize(width, height);
        this.bloomPass.setSize(width, height);
    }

    setProgress(val) {
        this.progress = val;

        // ACT I: Past (0.00 – 0.40)
        if (this.progress < 0.40) {
            this.bloomPass.strength = 0.8;
            this.cinematicPass.uniforms.uAberration.value = 0.002;
            this.cinematicPass.uniforms.uExposure.value = 1.05;
        }
        // ACT II: Present / Illness (0.40 – 0.92)
        else if (this.progress >= 0.40 && this.progress < 0.92) {
            const distress = (this.progress - 0.40) / 0.52;
            this.bloomPass.strength = 0.85;
            this.cinematicPass.uniforms.uAberration.value = 0.002 + distress * 0.004;
            this.cinematicPass.uniforms.uExposure.value = 1.05;
        }
        // ACT III: Future (0.92 – 1.00)
        else {
            const decay = (this.progress - 0.92) / 0.08;
            this.bloomPass.strength = Math.max(0.0, 0.85 * (1.0 - decay));
            this.cinematicPass.uniforms.uAberration.value = 0.0;
            this.cinematicPass.uniforms.uExposure.value = Math.max(0.0, 1.05 - decay * 1.6);
        }

        this.cinematicPass.uniforms.uProgress.value = this.progress;
    }

    render() {
        this.cinematicPass.uniforms.uTime.value = performance.now() * 0.001;
        this.composer.render();
    }
}