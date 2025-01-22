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

    // 대화 초기화
    useEffect(() => {
        const initializeConversation = async () => {
            try {
                setLoading(true);
                setError(null);
    
                let response;
                if (names[id1] === "me") {
                    console.log("Starting single GPT conversation...");
                    console.log("API Endpoint:", `${process.env.REACT_APP_BASE_URL}/api/startSingleConversation`);
                    response = await startSingleGPTConversation(names[id2]);
                } else {
                    console.log("Starting two GPT conversation...");
                    console.log("API Endpoint:", `${process.env.REACT_APP_BASE_URL}/api/startConversation`);
                    response = await startTwoGPTConversation(names[id1], names[id2]);
                }
    
                console.log("API Response:", response);
    
                if (response) {
                    setConversationId(response);
                    console.log("Conversation ID:", response);
                } else {
                    throw new Error("Conversation ID is missing in the response.");
                }
    
                setDialogues([]);
                setTurn(0);
            } catch (err) {
                console.error("Error initializing conversation:", err);
                setError("대화를 시작할 수 없습니다.");
            } finally {
                setLoading(false);
            }
        };
    
        initializeConversation();
    }, [id1, id2]);

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

    // 대화 진행
    const handleContinueConversation = async () => {
        if (!conversationId) {
            setError("대화가 시작되지 않았습니다.");
            return;
        }
        

        try {
            setLoading(true);
            setError(null);

            const speaker = turn % 2 === 0 ? names[id1] : names[id2];
            const userMessage = names[id1] === "me" && turn === 0 ? "안녕하세요!" : null; // 초기 메시지 예시
            const response = await continueConversation(conversationId, userMessage, speaker);

            setDialogues((prev) => [...prev, ...response]);
            setTurn((prev) => prev + 1);
        } catch (err) {
            console.error("Error continuing conversation:", err);
            setError("대화를 불러올 수 없습니다.");
        } finally {
            setLoading(false);
        }
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
                    {dialogues.map((message, index) => (
                        <p key={index}>
                            <strong>{message.speaker}:</strong> {message.content}
                        </p>
                    ))}
                </div>

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