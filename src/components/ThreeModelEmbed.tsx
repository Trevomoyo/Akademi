import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';

interface ThreeModelEmbedProps {
  modelType: "benzene" | "dna-helix" | "electronconfiguration" | "voltmeter-circuit";
}

export function ThreeModelEmbed({ modelType }: ThreeModelEmbedProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [showTooltip, setShowTooltip] = useState(true);

  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = 300;
    
    // Limits pixel ratio for mobile
    const pixelRatio = Math.min(window.devicePixelRatio, 1.5);
    
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    
    renderer.setSize(width, height);
    renderer.setPixelRatio(pixelRatio);
    mountRef.current.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 5, 5);
    scene.add(dirLight);

    // Build models based on type
    const materials: THREE.Material[] = [];
    const geometries: THREE.BufferGeometry[] = [];

    if (modelType === 'benzene') {
      const carbonMat = new THREE.MeshStandardMaterial({ color: 0x555555 });
      const hydrogenMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
      const bondMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa });
      materials.push(carbonMat, hydrogenMat, bondMat);

      const sphereGeo = new THREE.SphereGeometry(1, 16, 16);
      const smallSphereGeo = new THREE.SphereGeometry(0.6, 16, 16);
      const cylGeo = new THREE.CylinderGeometry(0.2, 0.2, 1, 8);
      geometries.push(sphereGeo, smallSphereGeo, cylGeo);

      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const x = Math.cos(angle) * 3;
        const y = Math.sin(angle) * 3;
        
        const carbon = new THREE.Mesh(sphereGeo, carbonMat);
        carbon.position.set(x, y, 0);
        group.add(carbon);

        const hydrogen = new THREE.Mesh(smallSphereGeo, hydrogenMat);
        hydrogen.position.set(x * 1.5, y * 1.5, 0);
        group.add(hydrogen);
      }
      camera.position.z = 12;
    } else if (modelType === 'dna-helix') {
      const backboneMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
      const colors = [0x3B82F6, 0x14B8A6, 0x8B5CF6, 0x0EA5E9];
      materials.push(backboneMat);

      const sphereGeo = new THREE.SphereGeometry(0.4, 12, 12);
      const cylGeo = new THREE.CylinderGeometry(0.15, 0.15, 3, 8);
      geometries.push(sphereGeo, cylGeo);

      for (let i = 0; i < 24; i++) {
        const y = (i - 12) * 0.5;
        const angle = i * 0.4;
        
        const x1 = Math.cos(angle) * 2;
        const z1 = Math.sin(angle) * 2;
        const s1 = new THREE.Mesh(sphereGeo, backboneMat);
        s1.position.set(x1, y, z1);
        group.add(s1);

        const x2 = Math.cos(angle + Math.PI) * 2;
        const z2 = Math.sin(angle + Math.PI) * 2;
        const s2 = new THREE.Mesh(sphereGeo, backboneMat);
        s2.position.set(x2, y, z2);
        group.add(s2);

        const matColor = new THREE.MeshStandardMaterial({ color: colors[i % 4] });
        materials.push(matColor);
        const rung = new THREE.Mesh(cylGeo, matColor);
        rung.position.set(0, y, 0);
        rung.rotation.y = -angle;
        rung.rotation.x = Math.PI / 2;
        group.add(rung);
      }
      camera.position.z = 15;
    } else if (modelType === 'electronconfiguration') {
      const nucMat = new THREE.MeshStandardMaterial({ color: 0xEF4444 });
      const elecMat = new THREE.MeshStandardMaterial({ color: 0x3B82F6 });
      const orbitMat = new THREE.LineBasicMaterial({ color: 0x888888, transparent: true, opacity: 0.3 });
      materials.push(nucMat, elecMat, orbitMat);

      const nucGeo = new THREE.SphereGeometry(0.8, 16, 16);
      const elecGeo = new THREE.SphereGeometry(0.2, 8, 8);
      geometries.push(nucGeo, elecGeo);

      const nucleus = new THREE.Mesh(nucGeo, nucMat);
      group.add(nucleus);

      [2, 3.5, 5].forEach((radius, i) => {
        const curve = new THREE.EllipseCurve(0, 0, radius, radius, 0, 2 * Math.PI, false, 0);
        const points = curve.getPoints(50);
        const orbitGeo = new THREE.BufferGeometry().setFromPoints(points);
        geometries.push(orbitGeo);
        
        const orbit = new THREE.Line(orbitGeo, orbitMat);
        orbit.rotation.x = Math.PI / 2;
        orbit.rotation.y = i * Math.PI / 4;
        group.add(orbit);

        const numElectrons = i === 0 ? 2 : (i === 1 ? 8 : 4);
        for(let j=0; j<numElectrons; j++) {
           const electron = new THREE.Mesh(elecGeo, elecMat);
           const angle = (j / numElectrons) * Math.PI * 2;
           electron.position.set(Math.cos(angle)*radius, 0, Math.sin(angle)*radius);
           orbit.add(electron);
        }
      });
      camera.position.set(0, 8, 12);
      camera.lookAt(0,0,0);
    } else if (modelType === 'voltmeter-circuit') {
      const boardMat = new THREE.MeshStandardMaterial({ color: 0x166534 });
      materials.push(boardMat);
      const boardGeo = new THREE.BoxGeometry(8, 0.2, 6);
      geometries.push(boardGeo);
      
      const board = new THREE.Mesh(boardGeo, boardMat);
      group.add(board);
      camera.position.set(0, 8, 10);
      camera.lookAt(0,0,0);
    }

    // Interaction handling
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    const handlePointerDown = (e: PointerEvent) => {
      isDragging = true;
      setShowTooltip(false);
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const deltaMove = {
        x: e.clientX - previousMousePosition.x,
        y: e.clientY - previousMousePosition.y
      };

      if (modelType === 'dna-helix') {
        group.rotation.y += deltaMove.x * 0.01;
      } else {
        group.rotation.y += deltaMove.x * 0.01;
        group.rotation.x += deltaMove.y * 0.01;
      }

      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const handlePointerUp = () => {
      isDragging = false;
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    // Animation Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      if (!isDragging) {
        if (modelType === 'dna-helix') {
          group.rotation.y += 0.005;
        } else if (modelType === 'electronconfiguration') {
          group.children.forEach((child, index) => {
            if (child.type === 'Line') {
                child.rotation.z += 0.01 * (index % 2 === 0 ? 1 : -1);
            }
          });
        } else {
          group.rotation.y += 0.002;
        }
      }
      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      domElement.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      
      if (mountRef.current && mountRef.current.contains(renderer.domElement)) {
        mountRef.current.removeChild(renderer.domElement);
      }
      
      geometries.forEach(g => g.dispose());
      materials.forEach(m => m.dispose());
      renderer.dispose();
    };
  }, [modelType]);

  return (
    <div className="relative w-full max-w-[340px] mx-auto my-6 rounded-2xl bg-[var(--surface-dark)] flex justify-center items-center overflow-hidden h-[300px]" style={{ touchAction: 'none' }}>
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
      {showTooltip && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full pointer-events-none backdrop-blur animate-fade-in">
          Drag to rotate 3D model
        </div>
      )}
    </div>
  );
}
