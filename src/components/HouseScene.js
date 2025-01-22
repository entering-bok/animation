import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { useNavigate } from "react-router-dom"; // React Router 사용

import FaceSelector from "./FaceSelector";
import "../styles/HouseScene.css";

const HouseScene = () => {
    const navigate = useNavigate(); // 페이지 이동을 위한 훅
    const mountRef = useRef(null);
    const mixers = useRef([]);
    const clickableObjects = useRef([]);
    const clock = new THREE.Clock();
    const characters = useRef([]); // 캐릭터 데이터를 저장
    const boundaries = { xMin: -5, xMax: 7, zMin: -5, zMax: 7 }; // 집 내부 경계 설정
    const raycaster = useRef(new THREE.Raycaster());
    const mouse = useRef(new THREE.Vector2());
    const isDancing = useRef(false);
    const [selectedFaces, setSelectedFaces] = useState([]);

    const faceImages = [
        { id: 1, path: "/models/me_face.glb", name: "Character 1" },
        { id: 2, path: "/models/aunt_face.glb", name: "Character 2" },
        { id: 3, path: "/models/grandma_face.glb", name: "Character 3" },
        { id: 4, path: "/models/grandfa_face.glb", name: "Character 4" },
    ];
    

    useEffect(() => {
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xffffff);
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth - 100, window.innerHeight);

        const currentMount = mountRef.current;
        if (currentMount) {
            currentMount.appendChild(renderer.domElement);
        }

        // OrbitControls 추가
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;

        // 조명 추가
        const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
        scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 2.5);
        directionalLight.position.set(5, 10, 7.5);
        scene.add(directionalLight);

        // GLTFLoader로 집 모델 로드
        const loader = new GLTFLoader();
        loader.load(
            "/models/house.glb",
            (gltf) => {
                const house = gltf.scene;
                
                // Bounding Box 생성
                const boundingBox = new THREE.Box3().setFromObject(house);
                house.userData.boundingBox = boundingBox; // Bounding Box 저장

                // LOD 생성
                const lod = new THREE.LOD();

                // 고해상도 메쉬
                lod.addLevel(house.clone(), 0);

                // 중간 해상도 메쉬
                const midResMesh = house.clone();
                lod.addLevel(midResMesh, 10);

                // 저해상도 메쉬
                const lowResMesh = house.clone();
                lod.addLevel(lowResMesh, 20);

                scene.add(lod);

                // 클릭 가능한 cylinder 메쉬만 저장
                house.traverse((child) => {
                    if (child.isMesh) {                
                        // 각 객체에 고유한 이벤트 정보를 추가
                        if (child.name === "Cylinder_1") {
                            child.userData = { clickable: true, name: "bok", event: "navigateToSceneBok" };
                        } else if (child.name === "Cube110") {
                            child.userData = { clickable: true, name: "lantern", event: "navigateToSceneLantern" };
                        } else if (child.name === "Cube010_2" || child.name === "Cube010_3" || child.name === "Cube010_6") {
                            child.userData = { clickable: true, name: "radio", event: "navigateToSceneRadio" };
                        }
                        clickableObjects.current.push(child); // 클릭 가능한 객체 배열에 추가
                    }
                });

                // 캐릭터 로드 및 배치
                const characterPaths = [
                    "/models/me.glb",
                    "/models/aunt.glb",
                    "/models/grandma.glb",
                    "/models/grandfa.glb",
                ];

                //캐릭터 속도
                const fixedVelocities = [0.04, 0.02, 0.005, 0.005];
                
                characterPaths.forEach((path, index) => {
                    loader.load(
                        path,
                        (gltf) => {
                            const character = gltf.scene;
                
                            // 초기 위치 설정
                            character.position.set(
                                (Math.random() * 100 % 12) - 5, // x축 초기 위치
                                0.2,                   // y축 높이
                                (Math.random() * 100 % 12) - 5 // z축 초기 위치
                            );
                
                            // 초기 회전 설정 (랜덤 방향)
                            const randomRotation = Math.random() * 2 * Math.PI
                            ; // 0 ~ 2π (0 ~ 360도)
                            character.rotation.y = randomRotation;
                
                            // 초기 속도 설정 (정면 방향 기준)
                            const speed = fixedVelocities[index]; // 이동 속도
                            character.userData.velocity = new THREE.Vector3(
                                Math.sin(character.rotation.y) * speed, // x축 속도 (회전 방향 적용)
                                0, // y축은 고정
                                Math.cos(character.rotation.y) * speed  // z축 속도 (회전 방향 적용)
                            );
                
                            // 캐릭터에 이름 및 클릭 가능 속성 추가
                            character.userData.clickable = true; // 클릭 가능 설정
                            character.userData.name = "Character ${index + 1}"; // 캐릭터 이름 설정

                            scene.add(character);
                            characters.current.push(character);
                
                            // 애니메이션 믹서 설정
                            const mixer = new THREE.AnimationMixer(character);
                            if (gltf.animations.length > 0) {
                                gltf.animations.forEach((clip) => {
                                    mixer.clipAction(clip).play();
                                });
                            }
                            mixers.current.push(mixer);
                
                            // 일정 시간 간격으로 방향 변경
                            setInterval(() => {
                                const newRotation = Math.random() * 2 * Math.PI; // 새로운 랜덤 방향
                                character.rotation.y = newRotation; // 회전 변경
                                character.userData.velocity.set(
                                    Math.sin(newRotation) * speed, // x축 속도 (회전 방향 적용)
                                    0, // y축 고정
                                    Math.cos(newRotation) * speed  // z축 속도 (회전 방향 적용)
                                );
                            }, 4000); // 4초마다 새로운 방향으로 전환
                        },
                        undefined,
                        (error) => {
                            console.error("Error loading character model:", error);
                        }
                    );
                });                        
            },
            undefined,
            (error) => {
                console.error("Error loading house model:", error);
            }
        );

        camera.position.set(6, 6, 12);
        camera.lookAt(0, 0, 0);

        // 캐릭터 이동 업데이트 로직
        const updateCharacters = () => {
            characters.current.forEach((character) => {
                const velocity = character.userData.velocity;
        
                // 캐릭터 이동
                character.position.x += velocity.x;
                character.position.z += velocity.z;
        
                // 집 내부 경계 체크
                if (character.position.x < boundaries.xMin || character.position.x > boundaries.xMax) {
                    velocity.x = -velocity.x; // x 방향 반전
                    character.rotation.y = Math.atan2(velocity.x, velocity.z); // 회전 변경
                    character.position.x = Math.max(
                        boundaries.xMin,
                        Math.min(boundaries.xMax, character.position.x)
                    );
                }
                if (character.position.z < boundaries.zMin || character.position.z > boundaries.zMax) {
                    velocity.z = -velocity.z; // z 방향 반전
                    character.rotation.y = Math.atan2(velocity.x, velocity.z); // 회전 변경
                    character.position.z = Math.max(
                        boundaries.zMin,
                        Math.min(boundaries.zMax, character.position.z)
                    );
                }
            });
        };      
        
        // 마우스 클릭 이벤트 처리
        const onMouseClick = (event) => {
            const rect = renderer.domElement.getBoundingClientRect();
            mouse.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

            // Raycaster로 교차 테스트 수행
            raycaster.current.setFromCamera(mouse.current, camera);
            const intersects = raycaster.current.intersectObjects(clickableObjects.current, true);

            if (intersects.length > 0) {
                const clickedObject = intersects[0].object;
            
                if (clickedObject.userData.clickable) {
            
                    // userData 기반으로 이벤트 처리
                    switch (clickedObject.userData.event) {
                        case "navigateToSceneRadio": {
                            console.log("radio 눌림!");
                        
                            // 이미 춤추는 상태인지 확인
                            if (isDancing.current) {
                                console.log("이미 춤추는 상태입니다. 새로고침합니다.");
                                window.location.reload(); // 페이지 새로고침
                                return;
                            }

                            console.log("춤추는 상태로 전환");
                            isDancing.current = true;

                            // 기존 캐릭터 제거
                            characters.current.forEach((character) => {
                                scene.remove(character);
                            });
                            characters.current = []; // 캐릭터 배열 초기화
                        
                            // GLTFLoader로 새로운 캐릭터 모델 로드
                            const dancingCharacters = [
                                { name: "grandma_flair", path: "/models/grandma_flair.glb", position: { x: 3, y: 0, z: 5 }, scale: 1.3 },
                                { name: "aunt_dancing", path: "/models/aunt_dancing.glb", position: { x: -2, y: 0, z: 3 }, scale: 1 },
                                { name: "grandfa_dancing", path: "/models/grandfa_dancing.glb", position: { x: 6, y: 0, z: 2 }, scale: 1 },
                                { name: "me_dancing", path: "/models/me_dancing.glb", position: { x: 0, y: 0, z: -3 }, scale: 1 },
                            ];
                        
                            dancingCharacters.forEach((char) => {
                                loader.load(
                                    char.path,
                                    (gltf) => {
                                        const character = gltf.scene;
                        
                                        // 위치와 스케일 설정
                                        character.position.set(char.position.x, char.position.y, char.position.z);
                                        character.scale.set(char.scale, char.scale, char.scale);
                        
                                        // userData.velocity를 0으로 설정하여 이동을 멈춤
                                        character.userData.velocity = new THREE.Vector3(0, 0, 0); // 속도 0으로 설정
                        
                                        // 애니메이션 믹서 설정
                                        const mixer = new THREE.AnimationMixer(character);
                                        gltf.animations.forEach((clip) => {
                                            const action = mixer.clipAction(clip);
                                            action.play(); // 애니메이션 재생
                                        });
                        
                                        // 씬에 추가
                                        scene.add(character);
                        
                                        // 캐릭터 배열 및 믹서에 추가
                                        characters.current.push(character);
                                        mixers.current.push(mixer);
                                    },
                                    undefined,
                                    (error) => {
                                        console.error(`Error loading ${char.name} model:`, error);
                                    }
                                );
                            });
                        
                            // 2. 노래 재생 및 종료 시 처리
                            const audioListener = new THREE.AudioListener();
                            camera.add(audioListener);
                            const audio = new THREE.Audio(audioListener);
                            const audioLoader = new THREE.AudioLoader();
                            audioLoader.load("/audio/flair_song.m4a", (buffer) => {
                                audio.setBuffer(buffer);
                                audio.setLoop(false);
                                audio.setVolume(0.5);
                                audio.play();
                        
                                // 클럽 조명 효과
                                const originalLightColor = ambientLight.color.clone(); // 기존 조명 색상 저장
                                let colorIndex = 0;
                                const rainbowColors = [0xff0000, 0xff7f00, 0xffff00, 0x00ff00, 0x0000ff, 0x4b0082, 0x9400d3]; // 빨주노초파남보
                                const lightingInterval = setInterval(() => {
                                    ambientLight.color.setHex(rainbowColors[colorIndex]);
                                    directionalLight.color.setHex(rainbowColors[colorIndex]);
                                    colorIndex = (colorIndex + 1) % rainbowColors.length; // 색상 순환
                                }, 200); // 0.2초마다 색 변경
                        
                                // 노래 종료 시 처리
                                audio.onEnded = () => {
                                    clearInterval(lightingInterval); // 조명 효과 종료
                                    ambientLight.color.copy(originalLightColor); // 기존 색으로 복원
                                    directionalLight.color.copy(originalLightColor);
                        
                                    // 모든 새로운 캐릭터 제거
                                    characters.current.forEach((character) => {
                                        scene.remove(character);
                                    });
                                    characters.current = [];
                                };
                            });
                        
                            break;
                        }                                              
                        
                        case "navigateToSceneLantern":
                            navigate("/lantern");
                            break;
            
                        case "navigateToSceneBok":
                            navigate("/dailyluck");
                            break;
            
                        default:
                            console.warn("No event defined for this object.");
                    }
                }
            }            

            // 애니메이션 믹서 업데이트 강제 적용
            const delta = clock.getDelta();
            mixers.current.forEach((mixer) => mixer.update(delta));
        };


        // 클릭 이벤트 리스너 추가
        window.addEventListener("click", onMouseClick);

        // 애니메이션 및 렌더링 루프
        const animate = () => {
            requestAnimationFrame(animate);

            const delta = clock.getDelta();
            mixers.current.forEach((mixer) => mixer.update(delta));
            updateCharacters(); // 캐릭터 이동 업데이트

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

    const handleSelect = (id) => {
        setSelectedFaces((prev) => {
            if (prev.includes(id)) {
                // 이미 선택된 얼굴이면 선택 해제
                return prev.filter((faceId) => faceId !== id);
            } else if (prev.length < 2) {
                // 최대 두 명까지만 선택
                return [...prev, id];
            }
            return prev; // 두 명 이상 선택 불가
        });
    };

    const handleChat = () => {
        console.log("대화하기 버튼 클릭!");
        console.log("선택된 얼굴들:", selectedFaces);
    };

    return (
        <div className="house-scene-container">
            <div className="scene" ref={mountRef} />
            <FaceSelector
                faces={faceImages}
                onSelect={handleSelect}
                selectedFaces={selectedFaces}
                onChat={handleChat}
            />
        </div>
    );
};

export default HouseScene;