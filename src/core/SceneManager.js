import * as THREE from 'three';
export class SceneManager {
  constructor(canvas, settings) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace; this.renderer.toneMapping = THREE.ACESFilmicToneMapping; this.renderer.toneMappingExposure = 1.12;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.scene = new THREE.Scene(); this.camera = new THREE.PerspectiveCamera(68, innerWidth / innerHeight, .1, 600); this.settings = settings;
    this.resize = () => { this.renderer.setSize(innerWidth, innerHeight); this.camera.aspect = innerWidth / innerHeight; this.camera.updateProjectionMatrix(); };
    window.addEventListener('resize', this.resize); this.applyQuality(settings.quality); this.resize();
    canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); document.dispatchEvent(new CustomEvent('renderer:lost')); });
    canvas.addEventListener('webglcontextrestored', () => location.reload());
  }
  applyQuality(quality) { this.renderer.setPixelRatio(Math.min(devicePixelRatio, quality === 'low' ? 1 : quality === 'high' ? 2 : 1.35)); this.renderer.shadowMap.enabled = quality !== 'low'; }
  menuCamera(time) { this.camera.position.set(29 + Math.sin(time * .025) * 2, 10.2, -166); this.camera.lookAt(-9, 20, -255); }
  endingCamera(dt) { this.camera.position.lerp(new THREE.Vector3(13, 23, -177), 1 - Math.exp(-.23 * dt)); this.camera.lookAt(0, 18, -252); }
  render() { this.renderer.render(this.scene, this.camera); }
}
