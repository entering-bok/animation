import React, { Suspense, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { useLoader } from "@react-three/fiber";
import "./../styles/ConversationScene.css";
import { startTwoGPTConversation, startSingleGPTConversation, continueConversation } from "../api/api"; // API 불러오기


// GLB 모델 로드 컴포넌트
const Model = ({ url }) => {
    const gltf = useLoader(GLTFLoader, url);
    return <primitive object={gltf.scene} scale={[1, 1, 1]} />;
};

const ConversationScene = () => {
    const { id1, id2 } = useParams();
    const names = ["a", "me", "aunt", "grandma", "grandfa"];
    const [dialogues, setDialogues] = useState([]); // 대화 상태
    const [conversationId, setConversationId] = useState(null);
    const [turn, setTurn] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [userInput, setUserInput] = useState(""); // 사용자 입력 상태

    // 대화 초기화
    useEffect(() => {
        const initializeConversation = async () => {
            if (!id1 || !id2) return; // ID가 없으면 실행 중지
    
            try {
                setLoading(true);
                setError(null);
    
                let response;
                if (names[id1] === "me") {
                    response = await startSingleGPTConversation(names[id2]);
                } else {
                    response = await startTwoGPTConversation(names[id1], names[id2]);
                }
    
                if (response) {
                    setConversationId(response); // 대화 ID 설정
                    setDialogues([]); // 기존 대화 초기화
                    setTurn(0); // 턴 초기화
                } else {
                    throw new Error("Conversation ID is missing in the response.");
                }
            } catch (err) {
                console.error("Error initializing conversation:", err);
                setError("대화를 시작할 수 없습니다.");
            } finally {
                setLoading(false);
            }
        };
    
        initializeConversation();
    }, [id1, id2]); // 의존성 배열에서 필요 없는 값 제거

    // 두 ID 조합에 따라 GLB 경로 매핑
    const glbMapping = {
        "me-grandma": "/models/me-grandma.glb",
        "grandma-grandfa": "/models/grandma-grandfa.glb",
        "aunt-grandma": "/models/aunt-grandma.glb",
        "me-grandfa": "/models/me-grandfa.glb",
        "aunt-grandfa": "/models/aunt-grandfa.glb",
        "me-aunt": "/models/me-aunt.glb",
    };

    const sortedIds = [names[id1], names[id2]].join("-");
    const glbPath = glbMapping[sortedIds];
    
    console.log("Starting conversation with IDs:", { gpt1: names[id1], gpt2: names[id2] });
    console.log("GLB Path:", glbPath);
    console.log("Speaker:", turn % 2 === 0 ? names[id1] : names[id2]);


    // 대화 진행
    const handleContinueConversation = async () => {
        if (!conversationId) {
            setError("대화가 시작되지 않았습니다.");
            return;
        }
    
        try {
            setLoading(true);
            setError(null);
    
            // 스피커 역할 결정
            const speaker = turn % 2 === 0 ? names[id1] : names[id2];
            const userMessage = turn === 0 && names[id1] === "me" ? "안녕하세요!" : null;
    
            const response = await continueConversation(conversationId, userMessage, speaker);
    
            if (response) {
                const assistantMessages = response.filter(
                    (message) => message.role === "assistant"
                ); // 'assistant' 메시지만 추출
                setDialogues((prev) => {
                    const newMessages = response.filter((msg) => msg.role === "assistant");
                    const uniqueMessages = newMessages.filter(
                        (msg) => !prev.some((prevMsg) => prevMsg.content === msg.content)
                    );
                    return [...prev, ...uniqueMessages];
                });
                setTurn((prev) => prev + 1); // 턴 증가
            } else {
                throw new Error("No response from conversation API.");
            }
        } catch (err) {
            console.error("Error continuing conversation:", err);
            setError("대화를 불러올 수 없습니다.");
        } finally {
            setLoading(false);
        }
    };

    // 사용자 입력 전송
    const handleSendMessage = () => {
        if (!userInput.trim()) {
            setError("입력 내용이 비어 있습니다.");
            return;
        }

        handleContinueConversation(userInput); // 사용자 입력 전달
        setUserInput(""); // 입력창 초기화
    };

    return (
        <div className="conversation-scene-container">
            <Canvas className="canvas" camera={{ position: [0, 2, 5], fov: 75 }}>
                <ambientLight intensity={0.8} />
                <directionalLight position={[10, 10, 5]} intensity={1.5} />
                <Suspense fallback={<Html>Loading...</Html>}>
                    {glbPath ? (
                        <Model url={glbPath} />
                    ) : (
                        <Html>
                            <h2>이 대화는 아직 준비되지 않았습니다.</h2>
                        </Html>
                    )}
                </Suspense>
                <OrbitControls />
            </Canvas>

            {/* 대화창 */}
            <div>
            <h1>대화창</h1>
            <div className="dialogue-box">
                <h2>대화</h2>
                <p>첫 번째 캐릭터: {names[id1]}</p>
                <p>두 번째 캐릭터: {names[id2]}</p>

                {loading && <p>대화를 불러오는 중...</p>}
                {error && <p className="error">{error}</p>}

                <div className="dialogue-messages">
                  {dialogues
                    .filter((message) => message.role === "assistant") // 'assistant' 메시지만 필터링
                    .map((message, index) => (
                    <p key={index}>
                      {message.content}
                     </p>
                     ))}
                  </div>

                  {/* 사용자 입력창 */}
                  {names[id1] === "me" && (
                        <div className="user-input">
                            <textarea
                                value={userInput}
                                onChange={(e) => setUserInput(e.target.value)}
                                placeholder="메시지를 입력하세요..."
                            />
                            <button onClick={handleSendMessage}>Send</button>
                        </div>
                    )}


                {/* 대화 이어가기 버튼 */}
                {conversationId && (
                    <button onClick={handleContinueConversation} className="continue-button">
                        대화 이어가기
                    </button>
                )}
            </div>
        </div>
        </div>
    );
};

export default ConversationScene;