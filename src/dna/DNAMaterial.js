import * as THREE from 'three';

export class DNAMaterial {
    constructor() {
        this.uniforms = {
            uTime: { value: 0.0 },
            uProgress: { value: 0.0 },
            
            // ACT I: Misty Cyan
            uPastBase: { value: new THREE.Color('#29B6F6') },
            uPastCore: { value: new THREE.Color('#E1F5FE') },
            
            // ACT II: Vivid Crimson Red
            uSickBase: { value: new THREE.Color('#E53935') },
            uSickHighlight: { value: new THREE.Color('#FF5252') },
            
            uPointSize: { value: 34.0 * Math.min(window.devicePixelRatio, 2) }
        };

        const vertexShader = `
            uniform float uTime;
            uniform float uProgress;
            uniform float uPointSize;

            attribute float aTimeline;
            attribute float aStrandType;
            attribute float aClusterId;
            attribute vec3 aDriftVelocity;
            attribute float aRandom;

            varying float vTimeline;
            varying float vDisintegration;
            varying float vAlpha;
            varying float vRandom;
            varying float vNearFade;

            void main() {
                vTimeline = aTimeline;
                vRandom = aRandom;
                vec3 transformed = position;

                float breath = sin(uTime * 1.5 + transformed.z * 0.08 + aRandom * 6.28) * 0.05;
                transformed.xy += normalize(transformed.xy + 0.001) * breath;

                // NEW EXTENDED THRESHOLDS
                const float PAST_END = 0.40;
                const float PRESENT_END = 0.92;

                float clusterNoise = fract(sin(aClusterId * 78.233 + 45.123) * 43758.5453);
                float isMemoryLossCluster = step(0.48, clusterNoise);

                float disintegration = 0.0;

                // --- ACT I: THE PAST (0.00 – 0.40) ---
                if (aTimeline < PAST_END) {
                    if (isMemoryLossCluster > 0.5) {
                        float driftDist = clamp((uProgress - aTimeline * 0.35) * 2.5, 0.0, 1.0);
                        transformed += aDriftVelocity * (driftDist * 8.0);
                        transformed.y += sin(uTime * 0.8 + aRandom * 10.0) * driftDist * 1.8;
                        disintegration = driftDist * 0.5;
                    }
                }
                // --- ACT II: THE PRESENT (0.40 – 0.92) ---
                else if (aTimeline >= PAST_END && aTimeline < PRESENT_END) {
                    float presentProgress = (aTimeline - PAST_END) / (PRESENT_END - PAST_END);
                    disintegration = clamp(presentProgress * 1.2, 0.0, 1.0);

                    float tremor = sin(uTime * 16.0 + aRandom * 50.0) * 0.1 * disintegration;
                    transformed += aDriftVelocity * tremor;

                    vec3 noiseCoord = transformed * 0.08 + vec3(uTime * 0.15);
                    vec3 turbulence = vec3(
                        sin(noiseCoord.y * 2.2 + uTime * 0.8),
                        cos(noiseCoord.z * 2.2 + uTime * 0.8),
                        sin(noiseCoord.x * 2.2 + uTime * 0.8)
                    ) * (disintegration * 5.5);

                    transformed.y -= pow(presentProgress, 1.8) * 3.6;
                    transformed += turbulence;

                    if (aStrandType == 2.0) {
                        transformed += aDriftVelocity * (disintegration * 7.5);
                    }
                }
                // --- ACT III: THE FUTURE (0.92 – 1.00) ---
                else {
                    disintegration = 1.0;
                    float futureProgress = (aTimeline - PRESENT_END) / (1.0 - PRESENT_END);
                    transformed += aDriftVelocity * (futureProgress * 5.0);
                }

                vDisintegration = disintegration;

                vec4 mvPosition = modelViewMatrix * vec4(transformed, 1.0);
                
                float sizeScale = 1.0;
                if (aTimeline >= PRESENT_END) {
                    sizeScale = max(0.0, 1.0 - smoothstep(PRESENT_END, 0.99, aTimeline));
                }

                gl_PointSize = (uPointSize / -mvPosition.z) * (0.85 + aRandom * 0.4) * sizeScale;
                gl_PointSize = clamp(gl_PointSize, 3.0, 15.0);

                gl_Position = projectionMatrix * mvPosition;

                vNearFade = smoothstep(0.3, 1.2, -mvPosition.z);
                vAlpha = 1.0 - smoothstep(0.94, 0.99, aTimeline);
            }
        `;

        const fragmentShader = `
            uniform vec3 uPastBase;
            uniform vec3 uPastCore;
            uniform vec3 uSickBase;
            uniform vec3 uSickHighlight;
            uniform float uTime;

            varying float vTimeline;
            varying float vDisintegration;
            varying float vAlpha;
            varying float vRandom;
            varying float vNearFade;

            void main() {
                vec2 coord = gl_PointCoord - vec2(0.5);
                float dist = length(coord);
                if (dist > 0.5) discard;

                float intensity = exp(-dist * dist * 12.0);

                // 1. Act I (Misty Cyan)
                vec3 colPast = mix(uPastBase, uPastCore, intensity * 0.6);

                // 2. Act II (Rich Crimson Red)
                float pulse = 0.93 + 0.07 * sin(uTime * 3.0 + vRandom * 6.28);
                vec3 colSick = mix(uSickBase * pulse, uSickHighlight, intensity * 0.7);

                // Extended transition zone (around 0.38 - 0.44)
                float actTransition = smoothstep(0.36, 0.44, vTimeline);
                vec3 finalColor = mix(colPast, colSick, actTransition);

                // Act III Void Blackout (0.92 - 0.99)
                float voidDecay = smoothstep(0.92, 0.99, vTimeline);
                finalColor = mix(finalColor, vec3(0.0), voidDecay);

                float alpha = intensity * 0.65 * vAlpha * vNearFade * (1.0 - voidDecay);
                gl_FragColor = vec4(finalColor, alpha);
            }
        `;

        this.material = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: this.uniforms,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
    }

    update(time, progress) {
        this.uniforms.uTime.value = time;
        this.uniforms.uProgress.value = progress;
    }
}