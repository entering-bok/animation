import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

const LanternScene = () => {
    const mountRef = useRef(null);
    const lanterns = useRef([]); // 풍등 배열
    const clock = new THREE.Clock();

    useEffect(() => {
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x000000); // 검은색 배경 (밤하늘)

        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);

        const currentMount = mountRef.current;
        if (currentMount) {
            currentMount.appendChild(renderer.domElement);
        }

        // 조명 추가
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);

        const pointLight = new THREE.PointLight(0xffa500, 1, 50); // 주황색 빛
        pointLight.position.set(0, 10, 0);
        scene.add(pointLight);

        // GLTFLoader로 풍등 모델 로드
        const loader = new GLTFLoader();

        const addLantern = () => {
            loader.load(
                "/models/grandma.glb", // 풍등 모델 경로
                (gltf) => {
                    const lantern = gltf.scene;
                    lantern.position.set(
                        (Math.random() - 0.5) * 20, // x 좌표 랜덤
                        -10, // y 시작 좌표 (아래에서 시작)
                        (Math.random() - 0.5) * 20 // z 좌표 랜덤
                    );

                    lantern.scale.set(0.5, 0.5, 0.5); // 크기 조정
                    scene.add(lantern);
                    lanterns.current.push(lantern); // 배열에 추가
                },
                undefined,
                (error) => {
                    console.error("Error loading lantern model:", error);
                }
            );
        };

        // 일정 시간마다 풍등 추가
        const interval = setInterval(() => {
            addLantern();
        }, 1000); // 1초마다 추가

        camera.position.set(0, 5, 20);
        camera.lookAt(0, 5, 0);

        // 풍등 애니메이션 업데이트
        const updateLanterns = () => {
            lanterns.current.forEach((lantern, index) => {
                lantern.position.y += 0.05; // y 축으로 위로 이동
                lantern.rotation.y += 0.01; // 약간의 회전 추가

                // 화면 밖으로 나가면 제거
                if (lantern.position.y > 30) {
                    scene.remove(lantern); // 장면에서 제거
                    lanterns.current.splice(index, 1); // 배열에서 제거
                }
            });
        };

        // 애니메이션 및 렌더링 루프
        const animate = () => {
            requestAnimationFrame(animate);

            const delta = clock.getDelta();
            updateLanterns(); // 풍등 이동 업데이트

            renderer.render(scene, camera);
        };
        animate();

        // Clean up
        return () => {
            clearInterval(interval); // 풍등 추가 중지
            if (currentMount) {
                currentMount.removeChild(renderer.domElement);
            }
        };
    }, []);

    return <div ref={mountRef} />;
};

export default LanternScene;
