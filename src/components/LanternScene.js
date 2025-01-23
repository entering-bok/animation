import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

const LanternScene = () => {
    const mountRef = useRef(null);
    const lanterns = useRef([]); // 풍등 배열
    const clock = new THREE.Clock();
    const texts = useRef([]); // 텍스트 배열

    // 소원 텍스트 리스트
    const wishes = [
        "이현정\n\n좋은 사람들과 함께 성장하는 한 달이었습니다\n이 인연들이 이어지면 좋겠고 몸과 마음이 건강한 한 해였으면 합니다! ",
        "최현우\n\n방어 먹으러 가고 싶다. 올해는 제발 하고싶은 걸 찾을 수 있길...",
        "박재현\n\n몰캠이 끝난 소감\n어쩌다보니 4주간 쉬는 것 없이 불태웠습니다.힘들었지만 보람있었네요. 개발이 제 길이 아니라는 걸 깨달았습니다. 감사합니다.\n새해 소원\n내가 하는 일들이 잘 풀리길 ",
        "이한샘\n\n좋은 사람들과 지낼 수 있어 좋았습니다. 새해에는 건강하고 싶어요^^",
        "허지민\n\nㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋ\nㄴㅔ",
        "김재민\n\n알빠야?",
        "공진우\n\n여러분들 덕분에 운영진 일이 힘들지 않았습니다. 새해에는 졸업하고 싶습니다.",
        "이종복\n\n개발자의 길을 걷는 여러분이 존경스럽습니다 진심으로요.",
        "복지희\n\n은은하게 돌아있는.. 정말 좋은 사람들과 한달간 너무 즐겁게 개발할하고 성장할 수 있었습니다! 새해에는.. 하고싶은 일을 찾았으면 좋겠어요 다들 한달간 고생많으셨습니다~!",
        "조어진\n\nㅋㅋㅋ\n잠만",
        "최주찬\n\nㅇㅋ",
        "최연우\n\n가장 기억에 남을만한 한 달이었다.\n마무리도 즐겁게 하고 싶다:)\n올해는 꼭 운동을 열심히 해야지!",
        "조성원\n\n행복했어요. 새해에는 맛있는거 많이 먹게 해주세요",
        "임수민\n\n한문단?\n다들 행복하세요~\n행복하겠습니당",
        "이명규\n\n4분반 4랑해~ 일본 여행 가고 싶어요",
        "이동욱\n\n빠르게 친해졌는데 헤어질 시간이 다가왔다니 너무 아쉬워요 ㅠㅠ\n1년동안 무탈하고 건강하게 다들 지냈으면 좋겠습니다",
        "박재현\n\n우끼끼우끼끼우끼끼우끼끼우끼끼우끼\n끼우끼끼우끼끼우끼끼우끼끼우끼끼우\n끼끼우끼끼우끼끼우끼끼우끼끼우끼끼\n우끼끼우끼끼우끼끼우끼끼우끼끼우끼\n끼우끼끼우끼끼우끼끼우끼끼우끼끼우\n끼끼우끼끼우끼끼우끼끼우끼끼우끼끼\n우끼끼우끼끼우끼끼우끼끼우끼끼우끼\n끼우끼끼우끼끼우끼끼우끼끼우끼끼우\n끼끼우끼끼우끼끼우끼끼우끼끼우끼끼\n우끼끼우끼끼우끼끼우끼끼우끼끼우끼\n끼우끼끼우끼끼우끼끼우끼끼우끼끼우\n끼끼우끼끼우끼끼우끼끼우끼끼우끼끼\n우끼끼우끼끼우끼끼우끼끼우끼끼우끼\n끼우끼끼우끼끼우끼끼우끼끼우끼끼우",
        "김문원\n\n드디어~ 끝! 원하는대로 이루어져라.",
        "이승진\n\n하면함",
        "김대영\n\n끝난 소감 : 백엔드 못해본게 아쉽지만, 정말 알차게 보낸 한달이였습니다.\n 새해 소원 : 살빼기, 졸업하기, 공익 붙기!",
        "고상혁\n\n이제 그만 집에 가고 싶은데 사람들은 계속 보고싶다 서울에서 만나요",
        "조어진\n\n날 생 生\n 날 일 日\n 생축!"
    ];

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

        // 텍스트 줄바꿈 처리 함수
    const wrapText = (context, text, maxWidth) => {
        const lines = [];
        const paragraphs = text.split("\n"); // 줄바꿈 문자 기준으로 나누기

        paragraphs.forEach(paragraph => {
            const words = paragraph.split(" ");
            let currentLine = words[0];

            for (let i = 1; i < words.length; i++) {
                const word = words[i];
                const width = context.measureText(currentLine + " " + word).width;
                if (width < maxWidth) {
                    currentLine += " " + word;
                } else {
                    lines.push(currentLine);
                    currentLine = word;
                }
            }
            lines.push(currentLine); // 마지막 줄 추가
        });

        return lines;
    };

        // 텍스트 메시지 생성
        const createText = (message) => {
            // 글씨 크기와 줄 간격 설정
            const fontSize = 28; // 고정된 글씨 크기
            const largeFontSize = 40; // 첫 세 글자의 글씨 크기
            const lineHeight = 28; // 줄 간격
            const maxWidth = 300; // 한 줄의 최대 너비
            const padding = 40; // Canvas 여백
            const scaleFactor = window.devicePixelRatio || 1; // 고해상도 지원

            // Canvas 크기 계산
            const canvas = document.createElement("canvas");
            const context = canvas.getContext("2d");
            context.font = `${fontSize}px Arial`;

            // 텍스트 줄바꿈 처리
            const lines = wrapText(context, message, maxWidth*scaleFactor);

            // Canvas 크기 설정
            canvas.width = (maxWidth + padding * 2) * scaleFactor; // 좌우 여백 포함
            canvas.height = (lines.length * lineHeight + padding * 2) * scaleFactor; // 위아래 여백 포함

            // 텍스트 스타일 설정
            context.fillStyle = "rgba(0, 0, 0, 0.2)"; // 반투명 배경
            context.fillRect(0, 0, canvas.width, canvas.height);

            context.font = `${fontSize*scaleFactor}px Arial`;
            context.fillStyle = "#ffffff"; // 텍스트 색상
            context.textAlign = "left";
            context.textBaseline = "middle";

            // 텍스트 그리기
            const startX = padding * scaleFactor; // 왼쪽 여백
            let currentY = padding * scaleFactor; // 위쪽 여백
            lines.forEach((line, index) => {
                // 첫 번째 줄의 첫 세 글자 스타일 변경
                if (index === 0) {
                    const firstThreeChars = line.slice(0, 3);
                    const remainingText = line.slice(3);
        
                    // 첫 세 글자 그리기 (큰 글씨)
                    context.font = `${largeFontSize * scaleFactor}px Arial`;
                    context.fillText(firstThreeChars, startX, currentY);
        
                    // 나머지 텍스트 그리기 (기본 글씨)
                    context.font = `${fontSize * scaleFactor}px Arial`;
                    const offsetX = context.measureText(firstThreeChars).width; // 첫 세 글자 너비 계산
                    context.fillText(remainingText, startX + offsetX, currentY);
                } else {
                    // 나머지 줄은 기본 글씨 크기로
                    context.fillText(line, startX, currentY);
                }
        
                currentY += lineHeight * scaleFactor; // 다음 줄로 이동
            });

            const texture = new THREE.CanvasTexture(canvas);
            texture.needsUpdate = true; // 텍스처 업데이트
            const material = new THREE.SpriteMaterial({ map: texture });
            const sprite = new THREE.Sprite(material);

            
            // Sprite 크기 설정
            sprite.scale.set(
                (canvas.width / scaleFactor) / 50, // Canvas 크기에 비례
                (canvas.height / scaleFactor) / 50,
                1
            );

            sprite.position.set(
                (Math.random() - 0.5) * 20, // x 좌표 랜덤
                -30, // y 시작 좌표
                3 // z 좌표 고정
            );

            sprite.renderOrder = 1; // 항상 풍등보다 앞에 렌더링
            scene.add(sprite);
            texts.current.push(sprite); // 배열에 추가
        };

        // 일정 시간마다 풍등 추가 (소원 텍스트 순서대로)
        let wishIndex = 0;
        const interval = setInterval(() => {
            if (wishIndex < wishes.length) {
                addLantern();
                createText(wishes[wishIndex]); // 소원을 텍스트로 추가
                wishIndex++;
            } else {
                clearInterval(interval); // 소원이 모두 추가되면 멈춤
            }
        }, 4000); // 4초마다 추가

        camera.position.set(0, 5, 20);
        camera.lookAt(0, 10, 0);

        // 풍등 애니메이션 업데이트
        const updateLanternsAndTexts = () => {
            lanterns.current.forEach((lantern, index) => {
                lantern.position.y += 0.02; // y 축으로 위로 이동
                lantern.rotation.y += 0.003; // 약간의 회전 추가

                // 화면 밖으로 나가면 제거
                if (lantern.position.y > 30) {
                    scene.remove(lantern); // 장면에서 제거
                    lanterns.current.splice(index, 1); // 배열에서 제거
                }
            });

            texts.current.forEach((text, index) => {
                text.position.y += 0.02; // y 축으로 위로 이동

                // 화면 밖으로 나가면 제거
                if (text.position.y > 30) {
                    scene.remove(text); // 장면에서 제거
                    texts.current.splice(index, 1); // 배열에서 제거
                }
            });
        };

        // 애니메이션 및 렌더링 루프
        const animate = () => {
            requestAnimationFrame(animate);

            const delta = clock.getDelta();
            updateLanternsAndTexts(); // 풍등 이동 업데이트

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
