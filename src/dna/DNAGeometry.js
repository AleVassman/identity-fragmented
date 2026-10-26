import * as THREE from 'three';

export class DNAGeometry {
    constructor() {
        this.particleCount = 115000;
        this.geometry = new THREE.BufferGeometry();
        this.generateHelix();
    }

    generateHelix() {
        const positions = new Float32Array(this.particleCount * 3);
        const aTimeline = new Float32Array(this.particleCount);
        const aStrandType = new Float32Array(this.particleCount);
        const aClusterId = new Float32Array(this.particleCount);
        const aDriftVelocity = new Float32Array(this.particleCount * 3);
        const aRandom = new Float32Array(this.particleCount);

        // Extended 3D space dimensions for long listening sessions
        const length = 480.0;
        const radius = 3.4;
        const twists = 32.0;

        const countStrandA = Math.floor(this.particleCount * 0.40);
        const countStrandB = Math.floor(this.particleCount * 0.40);
        const countBridges = this.particleCount - countStrandA - countStrandB;

        let index = 0;

        const addParticle = (x, y, z, t, strandType, clusterId) => {
            const i3 = index * 3;
            positions[i3] = x;
            positions[i3 + 1] = y;
            positions[i3 + 2] = z;

            aTimeline[index] = t;
            aStrandType[index] = strandType;
            aClusterId[index] = clusterId;
            aRandom[index] = Math.random();

            const drift = new THREE.Vector3(
                (Math.random() - 0.5) * 2.0,
                (Math.random() - 0.2) * 1.8,
                (Math.random() - 0.5) * 2.0
            ).normalize();

            aDriftVelocity[i3] = drift.x;
            aDriftVelocity[i3 + 1] = drift.y;
            aDriftVelocity[i3 + 2] = drift.z;

            index++;
        };

        // Strand A
        for (let i = 0; i < countStrandA; i++) {
            const t = i / countStrandA;
            const angle = t * Math.PI * 2 * twists;
            const z = -t * length;
            
            const r = radius + (Math.random() - 0.5) * 0.5;
            const x = Math.cos(angle) * r + (Math.random() - 0.5) * 0.2;
            const y = Math.sin(angle) * r + (Math.random() - 0.5) * 0.2;

            const clusterId = Math.floor(t * 120.0);
            addParticle(x, y, z, t, 0.0, clusterId);
        }

        // Strand B
        for (let i = 0; i < countStrandB; i++) {
            const t = i / countStrandB;
            const angle = t * Math.PI * 2 * twists + Math.PI;
            const z = -t * length;
            
            const r = radius + (Math.random() - 0.5) * 0.5;
            const x = Math.cos(angle) * r + (Math.random() - 0.5) * 0.2;
            const y = Math.sin(angle) * r + (Math.random() - 0.5) * 0.2;

            const clusterId = Math.floor(t * 120.0);
            addParticle(x, y, z, t, 1.0, clusterId);
        }

        // Base Pairs
        for (let i = 0; i < countBridges; i++) {
            const rungIndex = Math.floor(Math.random() * (twists * 12));
            const t = rungIndex / (twists * 12);
            const angleA = t * Math.PI * 2 * twists;
            const angleB = angleA + Math.PI;
            const z = -t * length;

            const posA = new THREE.Vector3(Math.cos(angleA) * radius, Math.sin(angleA) * radius, z);
            const posB = new THREE.Vector3(Math.cos(angleB) * radius, Math.sin(angleB) * radius, z);
            
            const lerpFactor = Math.random();
            const bridgePos = new THREE.Vector3().lerpVectors(posA, posB, lerpFactor);
            bridgePos.x += (Math.random() - 0.5) * 0.2;
            bridgePos.y += (Math.random() - 0.5) * 0.2;

            const clusterId = Math.floor(t * 120.0);
            addParticle(bridgePos.x, bridgePos.y, bridgePos.z, t, 2.0, clusterId);
        }

        this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        this.geometry.setAttribute('aTimeline', new THREE.BufferAttribute(aTimeline, 1));
        this.geometry.setAttribute('aStrandType', new THREE.BufferAttribute(aStrandType, 1));
        this.geometry.setAttribute('aClusterId', new THREE.BufferAttribute(aClusterId, 1));
        this.geometry.setAttribute('aDriftVelocity', new THREE.BufferAttribute(aDriftVelocity, 3));
        this.geometry.setAttribute('aRandom', new THREE.BufferAttribute(aRandom, 1));
    }
}