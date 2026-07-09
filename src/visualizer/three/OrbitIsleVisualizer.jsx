import { useCallback } from "react";
import * as THREE from "three";
import { resolveIntensity } from "../intensityContract.js";
import { useThreeScene } from "./useThreeScene.js";

const MAX_CLOUDS = 10;
const MAX_FIREFLIES = 90;

function saturateColor(color, saturation) {
  const hsl = {};
  color.getHSL(hsl);
  color.setHSL(hsl.h, Math.min(1, hsl.s * saturation), hsl.l);
}

export function OrbitIsleVisualizer(props) {
  const createScene = useCallback(({
    renderer,
    getProps,
    registerScene,
  }) => {
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x8b5875, 10, 25);
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(8, 4.6, 8);
    registerScene(scene, camera);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;

    const ambient = new THREE.HemisphereLight(0xaac8ff, 0x18231a, 1.8);
    const sun = new THREE.DirectionalLight(0xffddb0, 2.6);
    sun.position.set(5, 9, 4);
    sun.castShadow = true;
    scene.add(ambient, sun);

    const island = new THREE.Group();
    island.position.y = -0.6;
    scene.add(island);

    const rockMaterial = new THREE.MeshLambertMaterial({ color: 0x5c5861, flatShading: true });
    const rock = new THREE.Mesh(new THREE.ConeGeometry(3.2, 3.2, 9, 3), rockMaterial);
    rock.position.y = -1.25;
    rock.castShadow = true;
    island.add(rock);

    const grassGeometry = new THREE.CircleGeometry(3.12, 18);
    const positions = grassGeometry.attributes.position;
    for (let index = 1; index < positions.count; index += 1) {
      positions.setZ(index, (Math.sin(index * 4.7) + Math.cos(index * 2.3)) * 0.07);
    }
    positions.needsUpdate = true;
    const grass = new THREE.Mesh(
      grassGeometry,
      new THREE.MeshLambertMaterial({ color: 0x4c9a62, flatShading: true }),
    );
    grass.rotation.x = -Math.PI / 2;
    grass.receiveShadow = true;
    island.add(grass);

    const treeTrunkGeometry = new THREE.CylinderGeometry(0.09, 0.14, 0.85, 6);
    const treeTopGeometry = new THREE.ConeGeometry(0.55, 1.55, 7);
    const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x5d3c2b, flatShading: true });
    const treeMaterial = new THREE.MeshLambertMaterial({ color: 0x28684b, flatShading: true });
    [
      [-1.5, 0.7, -0.7, 1],
      [1.2, 0.65, -0.9, 0.85],
      [0.7, 0.75, 1.35, 1.1],
      [-0.8, 0.62, 1.3, 0.78],
    ].forEach(([x, y, z, scale]) => {
      const trunk = new THREE.Mesh(treeTrunkGeometry, trunkMaterial);
      trunk.position.set(x, y * 0.55, z);
      trunk.scale.setScalar(scale);
      trunk.castShadow = true;
      const top = new THREE.Mesh(treeTopGeometry, treeMaterial);
      top.position.set(x, y + 0.55 * scale, z);
      top.scale.setScalar(scale);
      top.castShadow = true;
      island.add(trunk, top);
    });

    const cloudGeometry = new THREE.PlaneGeometry(2.4, 1);
    const cloudMaterial = new THREE.MeshBasicMaterial({
      color: 0xe5efff,
      transparent: true,
      opacity: 0.32,
      depthWrite: false,
    });
    const clouds = Array.from({ length: MAX_CLOUDS }, (_, index) => {
      const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);
      const angle = index / MAX_CLOUDS * Math.PI * 2;
      cloud.position.set(Math.cos(angle) * (5 + index % 3), 2 + (index % 4) * 0.65, Math.sin(angle) * (5 + index % 3));
      cloud.scale.set(1 + (index % 3) * 0.4, 1, 1);
      scene.add(cloud);
      return cloud;
    });

    const fireflyPositions = new Float32Array(MAX_FIREFLIES * 3);
    for (let index = 0; index < MAX_FIREFLIES; index += 1) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 1 + Math.random() * 2.5;
      fireflyPositions[index * 3] = Math.cos(angle) * radius;
      fireflyPositions[index * 3 + 1] = Math.random() * 2.5;
      fireflyPositions[index * 3 + 2] = Math.sin(angle) * radius;
    }
    const fireflyGeometry = new THREE.BufferGeometry();
    fireflyGeometry.setAttribute("position", new THREE.BufferAttribute(fireflyPositions, 3));
    const fireflies = new THREE.Points(
      fireflyGeometry,
      new THREE.PointsMaterial({
        color: 0xffec72,
        size: 0.09,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    scene.add(fireflies);

    const dusk = new THREE.Color(0x8b5875);
    const night = new THREE.Color(0x071126);
    const sky = new THREE.Color();
    let elapsed = 0;

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
        sky.copy(dusk).lerp(night, Math.min(1, Math.max(0, progress)));
        saturateColor(sky, intensity.saturation);
        scene.background = sky;
        scene.fog.color.copy(sky);

        const cloudCount = Math.max(2, Math.round(5 * intensity.countScale));
        clouds.forEach((cloud, index) => {
          cloud.visible = index < cloudCount;
          cloud.position.x += deltaSeconds * speed * (0.12 + index * 0.006);
          if (cloud.position.x > 9) cloud.position.x = -9;
          cloud.quaternion.copy(camera.quaternion);
        });
        cloudMaterial.opacity = intensity.countScale < 0.5 ? 0.18 : 0.32;

        const orbit = elapsed * 0.16;
        camera.position.set(Math.cos(orbit) * 8.5, 4.7 + Math.sin(elapsed * 0.2) * 0.25, Math.sin(orbit) * 8.5);
        camera.lookAt(0, -0.15, 0);
        island.rotation.y = Math.sin(elapsed * 0.12) * 0.08;

        fireflies.visible = intensity.extras;
        if (intensity.extras) {
          fireflies.rotation.y = elapsed * 0.7;
          const points = fireflyGeometry.attributes.position;
          for (let index = 0; index < MAX_FIREFLIES; index += 1) {
            points.array[index * 3 + 1] += Math.sin(elapsed * 3 + index) * deltaSeconds * 0.035;
          }
          points.needsUpdate = true;
        }
      },
      dispose() {},
    };
  }, []);

  const hostRef = useThreeScene(createScene, props);
  return <div className="orbit-isle-visualizer" ref={hostRef} aria-hidden="true" />;
}
