import * as THREE from 'three';
import { AudioManager } from './AudioManager.js';
import { translations } from './translations.js';

export class InputController {
    constructor(onProgressUpdate) {
        this.onProgressUpdate = onProgressUpdate;

        this.targetProgress = 0.0;
        this.currentProgress = 0.0;
        this.isHolding = false;
        this.isStarted = false;
        
        // Slower drift speed for extended listening
        this.driftSpeed = 0.00018;
        this.lerpFactor = 0.035;

        // 1. Inizializzazione lingua (ricorda la scelta o rileva la lingua del browser)
        const savedLang = localStorage.getItem('chronicle_lang');
        const browserIsIt = navigator.language && navigator.language.startsWith('it');
        this.currentLang = savedLang || (browserIsIt ? 'it' : 'en');
        this.activeFragmentKey = null;

        this.audio = new AudioManager();

        // Riferimenti DOM
        this.docTitle = document.querySelector('#doc-title');
        this.progressBar = document.querySelector('#progress-bar');
        this.timelineStatus = document.querySelector('#timeline-status');
        this.narrativeContainer = document.querySelector('#narrative-container');
        this.appHud = document.querySelector('#app');
        this.hudTag = document.querySelector('#hud-tag');
        this.interactionHint = document.querySelector('#interaction-hint');
        
        // Elementi Intro
        this.introOverlay = document.querySelector('#intro-overlay');
        this.introTag = document.querySelector('#intro-tag');
        this.introTitle = document.querySelector('#intro-title');
        this.introDesc = document.querySelector('#intro-desc');
        this.introHint = document.querySelector('#intro-hint');
        this.btnEnter = document.querySelector('#btn-enter');

        // Elementi Outro
        this.outroOverlay = document.querySelector('#outro-overlay');
        this.outroTag = document.querySelector('#outro-tag');
        this.outroTitle = document.querySelector('#outro-title');
        this.outroDesc = document.querySelector('#outro-desc');
        this.btnRewind = document.querySelector('#btn-rewind');

        // Pulsanti Lingua IT / EN
        this.btnLangIt = document.querySelector('#btn-lang-it');
        this.btnLangEn = document.querySelector('#btn-lang-en');

        this.fragments = [
            { range: [0.00, 0.20], key: 'fragment1' },
            { range: [0.20, 0.40], key: 'fragment2' },
            { range: [0.40, 0.60], key: 'fragment3' },
            { range: [0.60, 0.78], key: 'fragment4' },
            { range: [0.78, 0.92], key: 'fragment5' },
            { range: [0.92, 1.00], key: 'fragment6' }
        ];

        this.initEventListeners();

        // 2. Applica subito i testi della lingua attiva
        this.setLanguage(this.currentLang);
    }

    initEventListeners() {
        // Toggle lingua IT / EN
        if (this.btnLangIt) {
            this.btnLangIt.addEventListener('click', () => this.setLanguage('it'));
        }
        if (this.btnLangEn) {
            this.btnLangEn.addEventListener('click', () => this.setLanguage('en'));
        }

        if (this.btnEnter) {
            this.btnEnter.addEventListener('click', () => this.startChronicle());
        }

        if (this.btnRewind) {
            this.btnRewind.addEventListener('click', () => this.rewindChronicle());
        }

        window.addEventListener('wheel', (e) => {
            if (!this.isStarted) return;
            const delta = e.deltaY * 0.00010;
            this.targetProgress = THREE.MathUtils.clamp(this.targetProgress + delta, 0.0, 1.0);
        }, { passive: true });

        window.addEventListener('mousedown', (e) => {
            if (!this.isStarted) return;
            if (e.button === 0 && e.target.tagName !== 'BUTTON') {
                this.isHolding = true;
            }
        });
        window.addEventListener('mouseup', () => {
            this.isHolding = false;
        });

        window.addEventListener('touchstart', (e) => {
            if (!this.isStarted) return;
            if (e.target.tagName !== 'BUTTON') {
                this.isHolding = true;
            }
        }, { passive: true });
        window.addEventListener('touchend', () => {
            this.isHolding = false;
        });

        window.addEventListener('keydown', (e) => {
            if (!this.isStarted) return;
            if (e.code === 'Space') {
                e.preventDefault();
                this.isHolding = true;
            }
        });
        window.addEventListener('keyup', (e) => {
            if (e.code === 'Space') {
                this.isHolding = false;
            }
        });
    }

    setLanguage(lang) {
        if (!translations[lang]) return;
        this.currentLang = lang;
        localStorage.setItem('chronicle_lang', lang);

        // Aggiorna classi attive sui pulsanti lingua
        if (this.btnLangIt && this.btnLangEn) {
            this.btnLangIt.classList.toggle('active', lang === 'it');
            this.btnLangEn.classList.toggle('active', lang === 'en');
        }

        const t = translations[lang];

        // 1. Titolo pagina
        if (this.docTitle) this.docTitle.textContent = t.pageTitle;
        document.title = t.pageTitle;

        // 2. Intro Screen
        if (this.introTag) this.introTag.textContent = t.intro.tag;
        if (this.introTitle) this.introTitle.innerHTML = t.intro.title;
        if (this.introDesc) this.introDesc.textContent = t.intro.desc;
        if (this.btnEnter) this.btnEnter.textContent = t.intro.btnEnter;
        if (this.introHint) this.introHint.textContent = t.intro.hint;

        // 3. Outro Screen
        if (this.outroTag) this.outroTag.textContent = t.outro.tag;
        if (this.outroTitle) this.outroTitle.textContent = t.outro.title;
        if (this.outroDesc) this.outroDesc.textContent = t.outro.desc;
        if (this.btnRewind) this.btnRewind.textContent = t.outro.btnRewind;

        // 4. HUD fisso
        if (this.hudTag) this.hudTag.textContent = t.hud.tag;
        if (this.interactionHint) this.interactionHint.innerHTML = t.hud.hint;

        // 5. Aggiorna HUD e frase attiva a schermo
        this.updateHUD();

        if (this.narrativeContainer && this.activeFragmentKey) {
            this.narrativeContainer.textContent = t.narrative[this.activeFragmentKey];
        }
    }

    startChronicle() {
        this.isStarted = true;
        this.audio.start();

        if (this.introOverlay) {
            this.introOverlay.classList.add('intro-hidden');
        }
        if (this.appHud) {
            this.appHud.classList.remove('hud-hidden');
        }
    }

    rewindChronicle() {
        if (this.outroOverlay) {
            this.outroOverlay.classList.add('outro-hidden');
        }
        if (this.appHud) {
            this.appHud.classList.add('hud-hidden');
        }

        this.isStarted = false;
        this.isHolding = false;
        this.targetProgress = 0.0;
        this.currentProgress = 0.0;
        this.activeFragmentKey = null;

        this.audio.rewind();

        if (this.onProgressUpdate) {
            this.onProgressUpdate(0.0);
        }

        if (this.introOverlay) {
            this.introOverlay.classList.remove('intro-hidden');
        }
    }

    update() {
        if (this.isHolding && this.isStarted) {
            this.targetProgress = THREE.MathUtils.clamp(
                this.targetProgress + this.driftSpeed,
                0.0,
                1.0
            );
        }

        this.currentProgress = THREE.MathUtils.lerp(
            this.currentProgress,
            this.targetProgress,
            this.lerpFactor
        );

        if (this.onProgressUpdate && this.isStarted) {
            this.onProgressUpdate(this.currentProgress);
        }

        if (this.isStarted) {
            this.audio.setProgress(this.currentProgress);
        }

        this.updateHUD();
    }

    updateHUD() {
        if (!this.isStarted) return;

        if (this.progressBar) {
            this.progressBar.style.width = `${(this.currentProgress * 100).toFixed(2)}%`;
        }

        const t = translations[this.currentLang];
        if (!t) return;

        if (this.timelineStatus) {
            if (this.currentProgress < 0.40) {
                this.timelineStatus.textContent = t.hud.act1;
                this.timelineStatus.style.color = 'rgba(72, 202, 228, 0.9)';
            } else if (this.currentProgress >= 0.40 && this.currentProgress < 0.92) {
                this.timelineStatus.textContent = t.hud.act2;
                this.timelineStatus.style.color = 'rgba(229, 57, 53, 0.95)';
            } else {
                this.timelineStatus.textContent = t.hud.act3;
                this.timelineStatus.style.color = 'rgba(255, 255, 255, 0.2)';
            }
        }

        if (this.narrativeContainer) {
            const active = this.fragments.find(
                f => this.currentProgress >= f.range[0] && this.currentProgress < f.range[1]
            );

            if (active) {
                this.activeFragmentKey = active.key;
                const textToDisplay = t.narrative[active.key];

                if (this.narrativeContainer.textContent !== textToDisplay) {
                    this.narrativeContainer.style.opacity = '0';
                    setTimeout(() => {
                        this.narrativeContainer.textContent = textToDisplay;
                        this.narrativeContainer.style.opacity = '1';
                    }, 300);
                }
            }
        }

        if (this.outroOverlay && this.isStarted) {
            if (this.currentProgress >= 0.965) {
                this.outroOverlay.classList.remove('outro-hidden');
            } else if (this.currentProgress < 0.93) {
                this.outroOverlay.classList.add('outro-hidden');
            }
        }
    }
}