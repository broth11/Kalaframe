import { useCallback } from "react";
import * as THREE from "three";
import { resolveIntensity } from "../intensityContract.js";
import { useThreeScene } from "./useThreeScene.js";

const BASE_COUNT = 42;
const MAX_COUNT = Math.ceil(BASE_COUNT * 1.85);

function createTrail() {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(6), 3));
  const material = new THREE.LineBasicMaterial({
    color: 0xbceeff,
    transparent: true,
    opacity: 0.35,
    blending: THREE.AdditiveBlending,
  });
  return new THREE.Line(geometry, material);
}

export function PrismDriftVisualizer(props) {
  const createScene = useCallback(({ getProps, registerScene }) => {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x030615);
    scene.fog = new THREE.FogExp2(0x071027, 0.052);
    const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 80);
    camera.position.set(0, 0.6, 13);
    registerScene(scene, camera);

    scene.add(new THREE.AmbientLight(0x6677aa, 1.5));
    const keyLight = new THREE.PointLight(0x8ce7ff, 55, 30);
    keyLight.position.set(4, 6, 8);
    scene.add(keyLight);
    const rimLight = new THREE.PointLight(0xc669ff, 40, 25);
    rimLight.position.set(-6, -3, 3);
    scene.add(rimLight);

    const icosahedron = new THREE.IcosahedronGeometry(0.42, 0);
    const octahedron = new THREE.OctahedronGeometry(0.5, 0);
    const prisms = Array.from({ length: MAX_COUNT }, (_, index) => {
      const hue = (0.5 + index / MAX_COUNT * 0.42) % 1;
      const color = new THREE.Color().setHSL(hue, 0.78, 0.6);
      const material = new THREE.MeshPhysicalMaterial({
        color,
        emissive: color.clone().multiplyScalar(0.08),
        roughness: 0.18,
        metalness: 0.08,
        transmission: 0.48,
        transparent: true,
        opacity: 0.72,
        thickness: 0.8,
        flatShading: true,
      });
      const mesh = new THREE.Mesh(index % 2 ? octahedron : icosahedron, material);
      const start = new THREE.Vector3(
        (Math.random() - 0.5) * 16,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 14,
      );
      mesh.position.copy(start);
      mesh.scale.setScalar(0.55 + Math.random() * 1.25);
      scene.add(mesh);
      const trail = createTrail();
      scene.add(trail);
      return {
        mesh,
        trail,
        start,
        ringAngle: index / MAX_COUNT * Math.PI * 2,
        drift: Math.random() * Math.PI * 2,
        spin: new THREE.Vector3(
          (Math.random() - 0.5) * 1.4,
          (Math.random() - 0.5) * 1.4,
          (Math.random() - 0.5) * 1.4,
        ),
      };
    });

    let elapsed = 0;
    const target = new THREE.Vector3();
    const previous = new THREE.Vector3();
    return {
      update(deltaSeconds) {
        const {
          mode,
          progress = 0,
          reducedMotion,
          visualIntensity,
        } = getProps();
        const intensity = resolveIntensity(mode, visualIntensity);
        const speed = intensity.speedScale * (reducedMotion ? 0.25 : 1);
        elapsed += deltaSeconds * speed;
        const visibleCount = Math.max(12, Math.round(BASE_COUNT * intensity.countScale));
        const ringPull = Math.min(1, Math.max(0, progress)) * 0.76;

        prisms.forEach((prism, index) => {
          const visible = index < visibleCount;
          prism.mesh.visible = visible;
          prism.trail.visible = visible && intensity.extras;
          if (!visible) return;
          previous.copy(prism.mesh.position);
          const ringRadius = 3.8 + Math.sin(prism.ringAngle * 3) * 0.7;
          target.set(
            Math.cos(prism.ringAngle + elapsed * 0.08) * ringRadius,
            Math.sin(prism.ringAngle * 2 + elapsed * 0.15) * 1.25,
            Math.sin(prism.ringAngle + elapsed * 0.08) * ringRadius - 1.5,
          );
          prism.mesh.position.set(
            prism.start.x + Math.sin(elapsed * 0.22 + prism.drift) * 1.2,
            prism.start.y + Math.cos(elapsed * 0.18 + prism.drift) * 0.9,
            prism.start.z + Math.sin(elapsed * 0.14 + prism.drift) * 0.8,
          );
          prism.mesh.position.lerp(target, ringPull);
          const tumble = intensity.extras ? 1.35 : 1;
          prism.mesh.rotation.x += prism.spin.x * deltaSeconds * speed * tumble;
          prism.mesh.rotation.y += prism.spin.y * deltaSeconds * speed * tumble;
          prism.mesh.rotation.z += prism.spin.z * deltaSeconds * speed * tumble;

          const color = new THREE.Color().setHSL(
            (0.5 + index / MAX_COUNT * 0.42 + elapsed * 0.015) % 1,
            Math.min(1, 0.75 * intensity.saturation),
            0.58,
          );
          prism.mesh.material.color.copy(color);
          prism.mesh.material.emissive.copy(color).multiplyScalar(intensity.extras ? 0.34 : 0.07);
          prism.mesh.material.opacity = intensity.countScale < 0.5 ? 0.45 : 0.72;
          if (intensity.extras) {
            const positions = prism.trail.geometry.attributes.position;
            positions.setXYZ(0, prism.mesh.position.x, prism.mesh.position.y, prism.mesh.position.z);
            positions.setXYZ(
              1,
              previous.x - prism.spin.x * 1.5,
              previous.y - prism.spin.y * 1.5,
              previous.z - prism.spin.z * 1.5,
            );
            positions.needsUpdate = true;
            prism.trail.material.color.copy(color);
          }
        });
        camera.position.x = Math.sin(elapsed * 0.07) * 1.4;
        camera.position.y = 0.6 + Math.cos(elapsed * 0.09) * 0.7;
        camera.lookAt(0, 0, -1.5);
      },
      dispose() {},
    };
  }, []);

  const hostRef = useThreeScene(createScene, props);
  return <div className="prism-drift-visualizer" ref={hostRef} aria-hidden="true" />;
}
