import * as THREE from 'three';
import { groundHeight, pathCenter, seededRandom, glowTexture } from './primitives.js';
import { locations } from '../data/locations.js';
import { forestFloorTexture, pineTexture } from './textures.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export class Environment {
  constructor(scene, colliders) {
    this.scene = scene; this.colliders = colliders; this.random = seededRandom(); this.time = { value: 0 };
    this.createSky(); this.createTerrain(); this.createForest(); this.createDetails();
  }
  createSky() {
    const material = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false,
      uniforms: { top: { value: new THREE.Color('#0a1c26') }, horizon: { value: new THREE.Color('#59656a') } },
      vertexShader: 'varying vec3 vWorld; void main(){ vWorld=(modelMatrix*vec4(position,1.)).xyz; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
      fragmentShader: `varying vec3 vWorld; uniform vec3 top; uniform vec3 horizon;
      float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      void main(){vec3 d=normalize(vWorld); float h=max(d.y,0.); vec3 color=mix(horizon,top,pow(h,.45));
      float cloud=sin(d.x*22.+d.z*15.+sin(d.x*37.))*sin(d.z*29.+d.y*15.); color*=.92+cloud*.07;
      float war=pow(max(0.,dot(d,normalize(vec3(.38,.025,-1.)))),34.); color+=vec3(.16,.045,.016)*war*(1.-smoothstep(.04,.4,h));
      gl_FragColor=vec4(color,1.); }` });
    this.scene.add(new THREE.Mesh(new THREE.SphereGeometry(550, 32, 16), material));
    const moon = new THREE.Mesh(new THREE.SphereGeometry(8.5, 24, 16), new THREE.MeshBasicMaterial({ color: '#d0d9d2', fog: false })); moon.position.set(70, 116, -360); this.scene.add(moon);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: '#a8c2ca', transparent: true, opacity: .16, fog: false, blending: THREE.AdditiveBlending, depthWrite: false })); halo.position.copy(moon.position); halo.scale.set(90, 90, 1); this.scene.add(halo);
    const random = this.random;
    const mountainMat = new THREE.MeshStandardMaterial({ color: 0x35474b, roughness: 1, flatShading: true });
    for (let i = 0; i < 20; i++) {
      const height = 40 + random() * 75;
      const g = new THREE.ConeGeometry(35 + random() * 45, height, 5, 2);
      const mountain = new THREE.Mesh(g, mountainMat); mountain.position.set(-260 + i * 28, height / 2 - 10, -350 - random() * 80); mountain.rotation.y = random() * 3; this.scene.add(mountain);
    }
  }
  createTerrain() {
    const g = new THREE.PlaneGeometry(240, 470, 150, 260); g.rotateX(-Math.PI / 2); g.translate(0, 0, -135);
    const p = g.attributes.position, colors = new Float32Array(p.count * 3), c = new THREE.Color();
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i), d = Math.abs(x - pathCenter(z)); p.setY(i, groundHeight(x, z));
      const n = this.random() * .12, path = 1 - THREE.MathUtils.smoothstep(d, 3.3, 6.4);
      c.setRGB(.12 + n + path * .06, .16 + n + path * .018, .14 + n + path * .008); c.toArray(colors, i * 3);
    }
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3)); g.computeVertexNormals();
    const terrain = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, map: forestFloorTexture(), roughness: .92, metalness: .03 })); terrain.receiveShadow = true; this.scene.add(terrain);
    const puddleMaterial = new THREE.MeshStandardMaterial({ color: '#778a91', roughness: .15, metalness: .65, transparent: true, opacity: .32, depthWrite: false });
    for (let i = 0; i < 38; i++) {
      const z = 50 - this.random() * 267, x = pathCenter(z) + (this.random() - .5) * 4;
      const puddle = new THREE.Mesh(new THREE.CircleGeometry(1, 12), puddleMaterial); puddle.rotation.x = -Math.PI / 2; puddle.position.set(x, groundHeight(x, z) + .035, z); puddle.scale.set(.4 + this.random() * .8, .5 + this.random() * 2, 1); this.scene.add(puddle);
    }
  }
  createForest() {
    const r = this.random, positions = [];
    for (let i = 0; i < 1400; i++) {
      const x = (r() - .5) * 200, z = 70 - r() * 355;
      if (Math.abs(x - pathCenter(z)) < 8 || z < -205 && Math.abs(x) < 68) continue;
      // Keep a clear, framed view of the skyline from the title camera.
      if (z < -163 && z > -220 && x > -10 && x < 45) continue;
      if (Object.values(locations).some(p => Math.hypot(x - p.x, z - p.z) < (p === locations.tower ? 13 : 10))) continue;
      positions.push({ x, z, h: 8 + r() * 17, radius: .27 + r() * .35, rotation: r() * Math.PI * 2 });
    }
    const bark = new THREE.MeshStandardMaterial({ color: '#353b35', roughness: 1, flatShading: true });
    const foliage = new THREE.MeshStandardMaterial({ color: '#acbbaa', map: pineTexture(), alphaTest: .36, side: THREE.DoubleSide, roughness: 1 });
    foliage.onBeforeCompile = shader => {
      shader.uniforms.uWindTime = this.time;
      shader.vertexShader = 'uniform float uWindTime;\n' + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\ntransformed.x += sin(uWindTime*.7 + instanceMatrix[3].x*.15 + instanceMatrix[3].z*.12) * max(position.y+.5,0.)*.009;');
    };
    const trunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(.55, 1, 1, 7), bark, positions.length);
    const planes = [0, Math.PI / 3, Math.PI * 2 / 3].map(angle => { const plane = new THREE.PlaneGeometry(1, 1); plane.rotateY(angle); return plane; });
    const crowns = new THREE.InstancedMesh(mergeGeometries(planes), foliage, positions.length);
    const d = new THREE.Object3D(), color = new THREE.Color();
    positions.forEach((p, i) => {
      d.position.set(p.x, groundHeight(p.x, p.z) + p.h * .5, p.z); d.scale.set(p.radius, p.h, p.radius); d.rotation.set(0, p.rotation, (r() - .5) * .025); d.updateMatrix(); trunks.setMatrixAt(i, d.matrix);
      d.position.set(p.x, groundHeight(p.x, p.z) + p.h * .58, p.z); d.scale.set(p.h * .64, p.h * .94, p.h * .64); d.rotation.set(0, p.rotation, 0); d.updateMatrix(); crowns.setMatrixAt(i, d.matrix);
      color.setHSL(.36 + r() * .04, .12, .52 + r() * .2); crowns.setColorAt(i, color);
      if (Math.abs(p.x) < 50 && p.z > -220) this.colliders.push({ x: p.x, z: p.z, radius: p.radius + .15 });
    });
    trunks.castShadow = true; crowns.castShadow = true; trunks.receiveShadow = true; crowns.receiveShadow = true;
    this.scene.add(trunks, crowns); this.foliage = crowns;
    // A few bare, branching silhouettes break up the evergreen canopy.
    const branchMat = new THREE.MeshStandardMaterial({ color: '#313835', roughness: 1 });
    const branchGeo = new THREE.CylinderGeometry(.07, .25, 1, 5);
    const branches = new THREE.InstancedMesh(branchGeo, branchMat, 150); let index = 0;
    for (let t = 0; t < 25; t++) {
      const x = (t % 2 ? 1 : -1) * (9 + r() * 14), z = 45 - r() * 238, h = 7 + r() * 7;
      for (let j = 0; j < 6; j++) {
        d.position.set(x + (j ? Math.sin(j * 4) * 1.6 : 0), groundHeight(x, z) + h * (j ? .58 + j * .055 : .5), z);
        d.rotation.set(j ? .2 : 0, j, j ? Math.sin(j * 4) * .9 : 0); d.scale.set(j ? .7 : 1.5, j ? 4 : h, j ? .7 : 1.5); d.updateMatrix(); branches.setMatrixAt(index++, d.matrix);
      }
    }
    this.scene.add(branches);
  }
  createDetails() {
    const r = this.random, d = new THREE.Object3D(), c = new THREE.Color();
    const rocks = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), new THREE.MeshStandardMaterial({ color: '#67716b', roughness: .96, flatShading: true }), 420);
    for (let i = 0; i < 420; i++) {
      let x = (r() - .5) * 150; const z = 57 - r() * 310; let size = .2 + r() ** 3 * 2.9;
      if (Object.values(locations).some(p => Math.hypot(x - p.x, z - p.z) < 9)) size = .15 + r() * .3;
      if (size > .8 && Math.abs(x - pathCenter(z)) < 4) x += x > 0 ? 7 : -7;
      d.position.set(x, groundHeight(x, z) + size * .15, z); d.rotation.set(r(), r() * 6, r()); d.scale.set(size * 1.4, size * .7, size); d.updateMatrix(); rocks.setMatrixAt(i, d.matrix);
      c.setScalar(.45 + r() * .35); rocks.setColorAt(i, c);
      if (size > 1.4) this.colliders.push({ x, z, radius: size * .7 });
    }
    rocks.castShadow = true; rocks.receiveShadow = true; this.scene.add(rocks);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([-.025, 0, 0, .1, .5, .02, .025, 0, 0, 0, 0, -.02, -.13, .36, .04, 0, 0, .02, -.09, 0, .05, -.2, .31, .04, -.04, 0, .05], 3)); g.computeVertexNormals();
    this.grass = new THREE.InstancedMesh(g, new THREE.MeshStandardMaterial({ color: '#52614b', side: THREE.DoubleSide, roughness: 1 }), 11000);
    for (let i = 0; i < 11000; i++) {
      let x = (r() - .5) * 145, z = 60 - r() * 302;
      if (Math.abs(x - pathCenter(z)) < 4) x += x > 0 ? 5 : -5;
      d.position.set(x, groundHeight(x, z) - .04, z); d.rotation.set(0, r() * 6, 0); d.scale.setScalar(.4 + r() * 1.5); d.updateMatrix(); this.grass.setMatrixAt(i, d.matrix);
      c.setHSL(.22 + r() * .12, .16, .2 + r() * .12); this.grass.setColorAt(i, c);
    }
    this.scene.add(this.grass);
  }
  update(time) { this.time.value = time; }
}
