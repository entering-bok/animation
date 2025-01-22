import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

const AnotherScene = () => {
    const mountRef = useRef(null);

    useEffect(() => {
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);

        const currentMount = mountRef.current;
        if (currentMount) {
            currentMount.appendChild(renderer.domElement);
        }

        // 조명 추가
        const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
        scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
        directionalLight.position.set(5, 10, 7.5);
        scene.add(directionalLight);

        // 카메라 초기 위치
        camera.position.set(0, 2, 5);
        camera.lookAt(0, 0, 0);

        // GLTFLoader로 bok.glb 파일 불러오기
        const loader = new GLTFLoader();
        loader.load(
            "/models/bok.glb",
            (gltf) => {
                const model = gltf.scene;

                // 크기 및 위치 설정
                model.scale.set(1, 1, 1); // 크기 조정
                model.position.set(0, 0, 0); // 씬 중심에 위치

                // BoundingBox를 사용해 중앙으로 정렬
                const box = new THREE.Box3().setFromObject(model);
                const center = box.getCenter(new THREE.Vector3());
                model.position.sub(center);

                // 씬에 추가
                scene.add(model);
            },
            undefined,
            (error) => {
                console.error("Error loading bok.glb:", error);
            }
        );

        // 애니메이션 루프
        const animate = () => {
            requestAnimationFrame(animate);
            renderer.render(scene, camera);
        };
        animate();

        // Clean up
        return () => {
            if (currentMount) {
                currentMount.removeChild(renderer.domElement);
            }
        };
    }, []);

    return <div ref={mountRef} />;
};

export default AnotherScene;
