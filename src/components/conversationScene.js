import React, { Suspense, useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import * as THREE from "three";
import { Canvas, useLoader } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import "./../styles/ConversationScene.css";
import "../index.css";

import {
  startTwoGPTConversation,
  startSingleGPTConversation,
  continueConversation,
} from "../api/api"; // API 불러오기

// GLB 모델 로드 컴포넌트
const Model = ({ url }) => {
  const gltf = useLoader(GLTFLoader, url);
  return <primitive object={gltf.scene} scale={[1, 1, 1]} />;
};

// 영문 -> 한글 이름 매핑 객체
const koreanNames = {
  me: "나",
  aunt: "고모",
  grandma: "할머니",
  grandfa: "할아버지",
  a: "a",
};

const ConversationScene = () => {
  const { id1, id2 } = useParams();
  const names = ["a", "me", "aunt", "grandma", "grandfa"];

  const hasMe = names[id1] === "me" || names[id2] === "me";

  // 대화 상태
  const [dialogues, setDialogues] = useState([]);
  const [conversationId, setConversationId] = useState(null);

  // 턴 (0부터 시작)
  const [turn, setTurn] = useState(0);

  // 기타 상태
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userInput, setUserInput] = useState("");

  // 타이핑
  const [typedMessage, setTypedMessage] = useState("");
  const typingIntervalRef = useRef(null);

  useEffect(() => {
    const initializeConversation = async () => {
      if (!id1 || !id2) return;

      try {
        setLoading(true);
        setError(null);

        let response;
        if (names[id1] === "me") {
          response = await startSingleGPTConversation(names[id2]);
        } else {
          response = await startTwoGPTConversation(names[id1], names[id2]);
        }

        if (!response) {
          throw new Error("Conversation ID is missing in the response.");
        }

        setConversationId(response);
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

  // GLB 경로 매핑
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

  // GPT 대화 API
  const handleContinueConversation = async (message) => {
    if (!conversationId) {
      setError("대화가 시작되지 않았습니다.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const speaker = turn % 2 === 0 ? names[id1] : names[id2];
      let userMessage;
      if (turn === 0 && speaker === "me" && !message) {
        userMessage = "안녕하세요!";
      } else {
        userMessage = message;
      }

      const response = await continueConversation(conversationId, userMessage, speaker);
      if (!response) {
        throw new Error("No response from conversation API.");
      }

      const assistantMessages = response.filter((msg) => msg.role === "assistant");
      setDialogues((prev) => {
        const newMessages = assistantMessages.filter(
          (msg) => !prev.some((prevMsg) => prevMsg.content === msg.content)
        );
        return [...prev, ...newMessages];
      });
    } catch (err) {
      console.error("Error continuing conversation:", err);
      setError("대화를 불러올 수 없습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 화살표 버튼 클릭
  const handleArrowClick = async () => {
    if (!hasMe) {
      // 두 캐릭터 모두 me가 없을 때
      await handleContinueConversation(null);
      setTurn((prev) => prev + 1);
      return;
    }

    // me가 있는 경우
    if (turn % 2 === 0) {
      // me 차례
      if (!userInput.trim()) {
        setError("입력 내용이 비어 있습니다.");
        return;
      }
      await handleContinueConversation(userInput.trim());
      setUserInput("");
      setTurn((prev) => prev + 1);
    } else {
      // GPT 차례가 끝난 후
      setTypedMessage("");
      setTurn((prev) => prev + 1);
    }
  };

  // 타이핑 효과
  useEffect(() => {
    const lastAssistantMessage = dialogues
      .filter((msg) => msg.role === "assistant")
      .slice(-1)[0]?.content;

    if (!lastAssistantMessage) {
      setTypedMessage("");
      if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
      return;
    }

    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
    }

    setTypedMessage("");
    let currentIndex = 0;

    typingIntervalRef.current = setInterval(() => {
      currentIndex++;
      setTypedMessage(lastAssistantMessage.slice(0, currentIndex));
      if (currentIndex >= lastAssistantMessage.length) {
        clearInterval(typingIntervalRef.current);
      }
    }, 40);

    return () => {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
      }
    };
  }, [dialogues]);

  // ------------------------------
  // 현재 화자 이름(한글)
  // ------------------------------
  let currentSpeakerEng = ""; // 먼저 선언!

  if (hasMe) {
    // meIndex / otherIndex
    const meIndex = names[id1] === "me" ? id1 : id2;
    const otherIndex = meIndex === id1 ? id2 : id1;

    // 짝수 턴 => me, 홀수 턴 => 상대
    currentSpeakerEng = turn % 2 === 0 ? names[meIndex] : names[otherIndex];
  } else {
    // me가 전혀 없는 경우
    if (turn === 0) {
      currentSpeakerEng = ""; // 첫 턴은 표시 X
    } else {
      // turn >= 1
      if ((turn - 1) % 2 === 0) {
        currentSpeakerEng = names[id1];
      } else {
        currentSpeakerEng = names[id2];
      }
    }
  }

  const currentSpeakerKor = currentSpeakerEng
    ? koreanNames[currentSpeakerEng] || currentSpeakerEng
    : "";

    

  return (
    <div className="conversation-scene-container">
      <Canvas className="canvas" camera={{ position: [0, 3, 8], fov: 75 }}>
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

      <div>
        <div className="dialogue-box">
          {error && <p className="error">{error}</p>}

          {/* 현재 화자 이름 표시 */}
          <h3 className="whoisspeaking">{currentSpeakerKor}</h3>

          {!hasMe ? (
            // me 없음 => 2 GPT 대화
            <div className="dialogue-messages">
              <p>{typedMessage}</p>
            </div>
          ) : turn % 2 === 0 ? (
            // 짝수 턴 => me 입력창
            <div className="user-input">
              <textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="대화를 입력하세요..."
              />
            </div>
          ) : (
            // 홀수 턴 => GPT의 타이핑 메시지
            <div className="dialogue-messages">
              <p>{typedMessage}</p>
            </div>
          )}

          {conversationId && (
            <button onClick={handleArrowClick} className="continue-button">
              <img
                src="/image/arrow.svg"
                alt="다음 대화"
                style={{ width: "40px", height: "40px" }}
              />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConversationScene;
