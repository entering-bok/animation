import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

const LanternScene = () => {
    const mountRef = useRef(null);
    const lanterns = useRef([]); // 풍등 배열
    const clock = new THREE.Clock();

    // 소원 텍스트 리스트
    const wishes = [
        "행복", "건강", "희망", "사랑", "평화",
        "성공", "기쁨", "용기", "축복", "행운",
        "배려", "지혜", "화합", "자유", "번영",
        "감사", "열정", "환희", "믿음", "여유"
    ];

    // Canvas를 사용해 텍스처 생성
    const createTextTexture = (text) => {
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        canvas.width = 512;
        canvas.height = 512;

        // 배경색 설정
        context.fillStyle = "#ffcc99"; // 풍등 배경색과 맞춤
        context.fillRect(0, 0, canvas.width, canvas.height);

        // 텍스트 스타일 설정
        context.font = "40px Arial";
        context.fillStyle = "#000000"; // 텍스트 색상
        context.textAlign = "center";
        context.textBaseline = "middle";

        // 텍스트 추가
        context.fillText(text, canvas.width / 2, canvas.height / 2);

        // Canvas를 텍스처로 반환
        return new THREE.CanvasTexture(canvas);
    };

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
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 10, 7.5);
        scene.add(directionalLight);

        // GLTFLoader로 풍등 모델 로드
        const loader = new GLTFLoader();
        const addLantern = (text) => {
            loader.load(
                "/models/lantern.glb",
                (gltf) => {
                    const lantern = gltf.scene;

                    // 텍스처 생성 및 적용
                    // const textTexture = createTextTexture(text);
                    // lantern.traverse((child) => {
                    //     if (child.isMesh) {
                    //         child.material.map = textTexture; // 텍스처 적용
                    //         child.material.needsUpdate = true;
                    //     }
                    // });

                    lantern.position.set(
                        (Math.random() - 0.5) * 40, // x 좌표 랜덤
                        -30, // y 시작 좌표 (아래에서 시작)
                        (Math.random() - 0.5) * 10 // z 좌표 랜덤
                    );
                    lantern.scale.set(2, 2, 2);
                    scene.add(lantern);
                    lanterns.current.push(lantern); // 배열에 추가
                },
                undefined,
                (error) => {
                    console.error("Error loading lantern model:", error);
                }
            );
        };

        // 일정 시간마다 풍등 추가 (소원 텍스트 순서대로)
        let wishIndex = 0;
        const interval = setInterval(() => {
            addLantern(wishes[wishIndex % wishes.length]); // 소원 순환
            wishIndex++;
        }, 2000); // 2초마다 추가

        camera.position.set(0, 5, 20);
        camera.lookAt(0, 10, 0);

        // 풍등 애니메이션 업데이트
        const updateLanterns = () => {
            lanterns.current.forEach((lantern, index) => {
                lantern.position.y += 0.02; // y 축으로 위로 이동
                lantern.rotation.y += 0.003; // 약간의 회전 추가

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
