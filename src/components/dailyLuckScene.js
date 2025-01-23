import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import "./../styles/DailyLuckScene.css";

const DailyLuckScene = () => {
    const mountRef = useRef(null);
    const [name, setName] = useState(""); // 이름 입력 상태
    const [fortune, setFortune] = useState(""); // 운세 결과
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // 운세를 가져오는 함수
    const fetchFortune = async () => {
        if (!name.trim()) {
            setError("이름을 입력해주세요.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/dailyluck`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ name }),
            });

            if (!response.ok) {
                throw new Error("Failed to fetch fortune");
            }

            const data = await response.json();
            setFortune(data.fortune);
        } catch (error) {
            console.error("Error fetching fortune:", error.message);
            setError("운세를 가져오는 데 실패했습니다.");
        } finally {
            setLoading(false);
        }
    };

    // Three.js 초기화
    useEffect(() => {
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xf4f4f4);
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth / 2, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);

        // OrbitControls 추가
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;

        // 조명 추가
        const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
        scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
        directionalLight.position.set(5, 10, 7.5);
        scene.add(directionalLight);
        
        // GLTF 모델 로드
        const loader = new GLTFLoader();
        loader.load(
            "/models/bok.glb",
            (gltf) => {
                const model = gltf.scene;
                model.position.set(0, -1, 0); // 모델의 위치 조정
                model.scale.set(1.5, 1.5, 1.5);
                scene.add(model);
            },
            undefined,
            (error) => {
                console.error("Error loading model:", error);
            }
        );

        // 카메라 위치 설정
        camera.position.set(3, 3, 5);
        controls.update();

        const animate = () => {
            requestAnimationFrame(animate);
            controls.update();
            renderer.render(scene, camera);
        };

        const mount = mountRef.current;
        if (mount) {
            mount.appendChild(renderer.domElement);
        }

        animate();

        // Clean up
        return () => {
            if (mount) {
                mount.removeChild(renderer.domElement);
            }
            renderer.dispose();
            scene.traverse((object) => {
                if (object.isMesh) {
                    object.geometry.dispose();
                    if (object.material.isMaterial) {
                        object.material.dispose();
                    }
                }
            });
        };
    }, []);

    return (
        <div className="daily-luck-scene">
            <div ref={mountRef} className="threejs-container" />
            <div className="ui-container">
                <h1>오늘의 운세</h1>
                <div className="fortune-form">
                    <input
                        type="text"
                        placeholder="이름을 입력하세요"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                    <button onClick={fetchFortune} disabled={loading}>
                        {loading ? "로딩 중..." : "운세 확인"}
                    </button>
                </div>
                {error && <p className="error">{error}</p>}
                {fortune && (
                    <div className="fortune-result">
                        <h2>운세 결과</h2>
                        <p>{fortune}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DailyLuckScene;