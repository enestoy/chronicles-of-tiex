import * as THREE from 'three';
import { seededRandom } from './primitives.js';

export function forestFloorTexture() {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 512;
  const c = canvas.getContext('2d'), r = seededRandom(654), pixels = c.createImageData(512, 512);
  for (let i = 0; i < pixels.data.length; i += 4) {
    const n = r() * 32, x = i / 4 % 512, y = Math.floor(i / 2048), patch = Math.sin(x * .04) * Math.sin(y * .07) * 9;
    pixels.data.set([78 + n + patch, 85 + n + patch, 69 + n + patch, 255], i);
  }
  c.putImageData(pixels, 0, 0);
  for (let i = 0; i < 1300; i++) {
    const x = r() * 512, y = r() * 512; c.save(); c.translate(x, y); c.rotate(r() * 6.28);
    c.fillStyle = ['#66644a', '#474c38', '#797258', '#4a4737', '#77776a'][Math.floor(r() * 5)];
    c.beginPath(); c.ellipse(0, 0, 1 + r() * 4, .6 + r() * 1.4, 0, 0, Math.PI * 2); c.fill(); c.restore();
  }
  const map = new THREE.CanvasTexture(canvas); map.colorSpace = THREE.SRGBColorSpace; map.wrapS = map.wrapT = THREE.RepeatWrapping; map.repeat.set(65, 125); map.anisotropy = 8; return map;
}

// Crossed, alpha-tested needle canopies retain a detailed silhouette at a low triangle count.
export function pineTexture() {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 1024;
  const c = canvas.getContext('2d'), r = seededRandom(87);
  c.lineCap = 'round';
  c.strokeStyle = '#484539'; c.lineWidth = 13; c.beginPath(); c.moveTo(512, 1010); c.lineTo(511, 45); c.stroke();
  for (let layer = 0; layer < 54; layer++) {
    const y = 50 + layer * 17, span = 15 + Math.pow(layer / 54, .94) * 375;
    for (const side of [-1, 1]) {
      const width = span * (.68 + r() * .38), rootY = y + r() * 12, droop = 15 + layer * .7;
      c.strokeStyle = '#343f32'; c.lineWidth = 4 + layer * .07;
      c.beginPath(); c.moveTo(512, rootY); c.quadraticCurveTo(512 + side * width * .55, rootY + 6, 512 + side * width, rootY + droop); c.stroke();
      for (let step = 0; step < 30; step++) {
        const t = step / 30, x = 512 + side * width * t, by = rootY + droop * t * t;
        const twig = (12 + r() * 20 + layer * .35) * (1 - t * .55);
        for (const direction of [-1, 1]) {
          const tx = x + side * twig * .7, ty = by + direction * twig;
          c.strokeStyle = ['#526750', '#40583f', '#62765b', '#384f3c', '#71836a'][Math.floor(r() * 5)]; c.lineWidth = 1.8;
          c.beginPath(); c.moveTo(x, by); c.lineTo(tx, ty); c.stroke();
          for (let needle = 0; needle < 7; needle++) {
            const q = needle / 7, nx = x + (tx - x) * q, ny = by + (ty - by) * q;
            const length = 5 + r() * 9;
            c.beginPath(); c.moveTo(nx - side * length * .7, ny + direction * length); c.lineTo(nx, ny); c.lineTo(nx + side * length, ny + direction * length * .6); c.stroke();
          }
        }
      }
    }
  }
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = 4; return texture;
}
