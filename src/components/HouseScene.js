import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { useNavigate } from "react-router-dom"; // React Router 사용

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
    const sceneRef = useRef(new THREE.Scene());
    const [selectedCharacters, setSelectedCharacters] = useState([]); // 선택된 캐릭터 배열

    useEffect(() => {
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xffffff);
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
        const directionalLight = new THREE.DirectionalLight(0xffffff, 2.5);
        directionalLight.position.set(5, 10, 7.5);
        scene.add(directionalLight);

        // GLTFLoader로 집 모델 로드
        const loader = new GLTFLoader();
        loader.load(
            "/models/house.glb",
            (gltf) => {
                const house = gltf.scene;
                scene.add(house);

                // 클릭 가능한 cylinder 메쉬만 저장
                house.traverse((child) => {
                    if (child.isMesh && child.name === "Cylinder_1") {
                        child.userData.clickable = true; // 클릭 가능한 오브젝트 설정
                        clickableObjects.current.push(child); // 클릭 가능한 객체만 저장
                    }
                });

                // 캐릭터 로드 및 배치
                const characterPaths = [
                    "/models/me.glb",
                    "/models/aunt.glb",
                    "/models/grandma.glb",
                    "/models/grandfa.glb",
                ];

                const fixedVelocities = [0.01, 0.006, 0.003, 0.003];

                characterPaths.forEach((path, index) => {
                    loader.load(
                        path,
                        (gltf) => {
                            const character = gltf.scene;

                            const names = ["me", "aunt", "grandma", "grandfa"];
                            const armature = character.getObjectByName("Armature");
                            if (armature) {
                                armature.userData.name = names[index];
                            }
                            character.traverse((child) => {
                                if (child.isObject3D) {
                                    child.userData.name = names[index];
                                }
                            });

                            character.position.set(
                                (Math.random() * 100 % 12) - 5,
                                0.2,
                                (Math.random() * 100 % 12) - 5
                            );

                            const skinnedMesh = character.getObjectByProperty("type", "SkinnedMesh");
                            if (skinnedMesh) {
                                skinnedMesh.userData.originalMaterial = skinnedMesh.material.clone();
                            }

                            character.rotation.y = Math.random() * 2 * Math.PI;

                            const speed = fixedVelocities[index];
                            character.userData.velocity = new THREE.Vector3(
                                Math.sin(character.rotation.y) * speed,
                                0,
                                Math.cos(character.rotation.y) * speed
                            );

                            scene.add(character);
                            characters.current.push(character);
                            clickableObjects.current.push(skinnedMesh || character);

                            const mixer = new THREE.AnimationMixer(character);
                            if (gltf.animations.length > 0) {
                                gltf.animations.forEach((clip) => {
                                    mixer.clipAction(clip).play();
                                });
                            }
                            mixers.current.push(mixer);

                            setInterval(() => {
                                const newRotation = Math.random() * 2 * Math.PI;
                                character.rotation.y = newRotation;
                                character.userData.velocity.set(
                                    Math.sin(newRotation) * speed,
                                    0,
                                    Math.cos(newRotation) * speed
                                );
                            }, 4000);
                        },
                        undefined,
                        (error) => console.error("Error loading character model:", error)
                    );
                });
            },
            undefined,
            (error) => console.error("Error loading house model:", error)
        );

        camera.position.set(6, 6, 12);
        camera.lookAt(0, 0, 0);

        const updateCharacters = () => {
            characters.current.forEach((character) => {
                const velocity = character.userData.velocity;

                character.position.x += velocity.x;
                character.position.z += velocity.z;

                if (character.position.x < boundaries.xMin || character.position.x > boundaries.xMax) {
                    velocity.x = -velocity.x;
                    character.rotation.y = Math.atan2(velocity.x, velocity.z);
                    character.position.x = Math.max(
                        boundaries.xMin,
                        Math.min(boundaries.xMax, character.position.x)
                    );
                }
                if (character.position.z < boundaries.zMin || character.position.z > boundaries.zMax) {
                    velocity.z = -velocity.z;
                    character.rotation.y = Math.atan2(velocity.x, velocity.z);
                    character.position.z = Math.max(
                        boundaries.zMin,
                        Math.min(boundaries.zMax, character.position.z)
                    );
                }
            });
        };

        const onMouseClick = (event) => {
            const rect = renderer.domElement.getBoundingClientRect();
            mouse.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
            raycaster.current.setFromCamera(mouse.current, camera);
            const intersects = raycaster.current.intersectObjects(clickableObjects.current, true);
        
            if (intersects.length > 0) {
                const clickedObject = intersects[0].object;
        
                // Cylinder_1 클릭 처리
                if (clickedObject.userData.clickable && clickedObject.name === "Cylinder_1") {
                    console.log(`You clicked on: ${clickedObject.userData.name}`);
                    navigate("/dailyluck");
                    return;
                }
        
                let parent = clickedObject;
                while (parent.parent && !parent.userData.name) {
                    parent = parent.parent;
                }
        
                const characterName = parent.userData.name;
                if (!characterName) {
                    console.error("Character name not found!");
                    return;
                }
        
                if (selectedCharacters.some((char) => char.userData.name === characterName)) {
                    // 선택 해제
                    setSelectedCharacters((prev) =>
                        prev.filter((char) => char.userData.name !== characterName)
                    );
        
                    // 모든 SkinnedMesh의 색상 복원
                    parent.traverse((child) => {
                        if (child.isSkinnedMesh && child.userData.originalMaterial) {
                            child.material = child.userData.originalMaterial;
                            child.material.needsUpdate = true;
                        }
                    });
                } else {
                    // 새로운 캐릭터 선택
                    if (selectedCharacters.length < 2) {
                        setSelectedCharacters((prev) => [...prev, parent]);
        
                        // 모든 SkinnedMesh의 색상 변경
                        parent.traverse((child) => {
                            if (child.isSkinnedMesh) {
                                if (!child.userData.originalMaterial) {
                                    child.userData.originalMaterial = child.material.clone();
                                }
                                const newMaterial = child.material.clone();
                                newMaterial.color.set(0xffa500); // 주황색
                                newMaterial.needsUpdate = true;
                                child.material = newMaterial;
                            }
                        });
                    }
        
                    if (selectedCharacters.length === 1) {
                        const [firstCharacter] = selectedCharacters;
                        navigate(`/${firstCharacter.userData.name}/${characterName}`);
                    }
                }
            }
        };

        window.addEventListener("click", onMouseClick);

        const animate = () => {
            requestAnimationFrame(animate);
            const delta = clock.getDelta();
            mixers.current.forEach((mixer) => mixer.update(delta));
            updateCharacters();
            renderer.render(scene, camera);
        };
        animate();

        return () => {
            if (currentMount) {
                currentMount.removeChild(renderer.domElement);
            }
            window.removeEventListener("click", onMouseClick);
        };
    }, [navigate, selectedCharacters]);

    return <div ref={mountRef} />;
};

export default HouseScene;
