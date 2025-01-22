import React, { useEffect, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

const FaceSelector = ({ faces, onSelect, selectedFaces, onChat }) => {
    const [thumbnails, setThumbnails] = useState({});
    const loader = new GLTFLoader();

    useEffect(() => {
        const generateThumbnail = async (face) => {
            const renderer = new THREE.WebGLRenderer({ antialias: true });
            renderer.setSize(150, 150); // 썸네일 크기 확대
            const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
            const scene = new THREE.Scene();
            scene.background = new THREE.Color(0xffffff);
    
            const light = new THREE.DirectionalLight(0xffffff, 2.5);
            light.position.set(5, 5, 5);
            scene.add(light);
            scene.add(new THREE.AmbientLight(0xffffff, 1.5));
    
            try {
                // 모델 로드
                const gltf = await loader.loadAsync(face.path);
                const model = gltf.scene;
    
                // BoundingBox 계산
                const boundingBox = new THREE.Box3().setFromObject(model);
                const center = boundingBox.getCenter(new THREE.Vector3()); // 모델 중심
                const size = boundingBox.getSize(new THREE.Vector3()); // 모델 크기
    
                // 모델 위치 조정
                model.position.set(-center.x, -center.y, -center.z); // 모델 중심을 원점으로 이동
                model.scale.set(2.5, 2.5, 2.5); // x, y, z 방향으로 확대
                scene.add(model);
    
                // 카메라 위치 설정 (정면에서 약간 떨어진 거리로 설정)
                const maxDim = Math.max(size.x, size.y, size.z); // 모델의 최대 크기
                const distance = maxDim * 2; // 적절한 거리 계산
                camera.position.set(0, center.y + size.y / 2, distance); // 모델의 정중앙과 조금 위를 바라보도록 설정
                camera.lookAt(0, center.y, 0); // 모델의 중심을 바라봄
    
                // 렌더링 및 썸네일 생성
                renderer.render(scene, camera);
                const thumbnailUrl = renderer.domElement.toDataURL();
                setThumbnails((prev) => ({
                    ...prev,
                    [face.id]: thumbnailUrl,
                }));
            } catch (error) {
                console.error(`Error loading model ${face.name}:`, error);
            } finally {
                renderer.dispose();
            }
        };
    
        faces.forEach((face) => {
            if (!thumbnails[face.id]) {
                generateThumbnail(face);
            }
        });
    }, [faces, thumbnails]);    
    
    return (
        <div className="face-selector">
            {faces.map((face) => (
                <div
                    key={face.id}
                    className={`face-item ${selectedFaces.includes(face.id) ? "selected" : ""}`}
                    onClick={() => onSelect(face.id)}
                >
                    {thumbnails[face.id] ? (
                        <img src={thumbnails[face.id]} alt={face.name} />
                    ) : (
                        <div>Loading...</div>
                    )}
                </div>
            ))}
            {/* 대화하기 버튼 */}
            {selectedFaces.length === 2 && (
                <button className="chat-button" onClick={onChat}>
                    대화하기
                </button>
            )}
        </div>
    );
};

export default FaceSelector;
