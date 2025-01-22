import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 조명 추가
const ambientLight = new THREE.AmbientLight(0xffffff, 1.5); // 부드러운 조명
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
directionalLight.position.set(5, 10, 7.5);
scene.add(directionalLight);

// 카메라 초기 위치
camera.position.set(0, 1, 5);
camera.lookAt(0, 0, 0);

// GLTFLoader를 사용해 bok.glb 불러오기
const loader = new GLTFLoader();
loader.load(
    "/models/bok.glb", // bok.glb 파일 경로
    (gltf) => {
        const model = gltf.scene;

        // 모델 크기 조정 (필요한 경우)
        model.scale.set(1, 1, 1); // 크기 조정

        // 모델 위치 설정 (씬 중심에 배치)
        model.position.set(0, 0, 0); // x, y, z 좌표 (0, 0, 0)

        // 씬에 추가
        scene.add(model);

        // BoundingBox를 기준으로 가운데 정렬 (필요한 경우)
        const box = new THREE.Box3().setFromObject(model); // 모델의 BoundingBox 계산
        const center = box.getCenter(new THREE.Vector3()); // 중앙점 계산
        model.position.sub(center); // 모델 위치를 중앙으로 이동
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
