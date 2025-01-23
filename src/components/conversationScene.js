import React, { Suspense, useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import * as THREE from "three";
import { Canvas, useLoader } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import "./../styles/ConversationScene.css";
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
  a: "a", // 필요하면 수정/삭제
};

const ConversationScene = () => {
  const { id1, id2 } = useParams();

  // 기존 배열 (인덱스로 id1, id2를 받아 캐릭터 영문명 반환)
  const names = ["a", "me", "aunt", "grandma", "grandfa"];

  // "대화에 me가 포함되어 있는지" 판별
  const hasMe = names[id1] === "me" || names[id2] === "me";

  // 대화 관련 상태
  const [dialogues, setDialogues] = useState([]); // API 응답 메시지들
  const [conversationId, setConversationId] = useState(null);

  // 몇 번째 턴인지 (0부터 시작)
  // - hasMe=true인 경우: 짝수=me, 홀수=GPT
  // - hasMe=false인 경우: 짝수=캐릭터1, 홀수=캐릭터2 (둘 다 GPT 역할)
  const [turn, setTurn] = useState(0);

  // 로딩/오류/사용자 입력
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userInput, setUserInput] = useState("");

  // 타이핑 효과를 위한 상태와 ref
  const [typedMessage, setTypedMessage] = useState("");
  const typingIntervalRef = useRef(null);

  // ----------------------------------------
  // 1) 대화 초기화
  // ----------------------------------------
  useEffect(() => {
    const initializeConversation = async () => {
      if (!id1 || !id2) return; // 라우트 파라미터가 유효해야 진행

      try {
        setLoading(true);
        setError(null);

        let response;
        // 만약 id1이 me라면 단일 대화, 아니면 두 GPT 대화
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
        setTurn(0); // 0부터 시작
      } catch (err) {
        console.error("Error initializing conversation:", err);
        setError("대화를 시작할 수 없습니다.");
      } finally {
        setLoading(false);
      }
    };

    initializeConversation();
  }, [id1, id2]);

  // ----------------------------------------
  // 2) GLB(모델) 경로 매핑
  // ----------------------------------------
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

  // ----------------------------------------
  // 3) GPT 대화 API 호출 (말하기)
  // ----------------------------------------
  const handleContinueConversation = async (message) => {
    if (!conversationId) {
      setError("대화가 시작되지 않았습니다.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // 현재 화자: 짝수 턴이면 id1, 홀수 턴이면 id2 (me가 있어도/없어도 동일)
      const speaker = turn % 2 === 0 ? names[id1] : names[id2];

      // 첫 턴 + me + 입력 없으면 "안녕하세요!" 로 대체
      let userMessage;
      if (turn === 0 && speaker === "me" && !message) {
        userMessage = "안녕하세요!";
      } else {
        userMessage = message;
      }

      // GPT에 메시지 전달
      const response = await continueConversation(conversationId, userMessage, speaker);
      if (!response) {
        throw new Error("No response from conversation API.");
      }

      // assistant(모델 응답) 메시지만 추가
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

  // ----------------------------------------
  // 4) 화살표 버튼 클릭
  //    - hasMe=true일 때만 사용자 입력 가능
  // ----------------------------------------
  const handleArrowClick = async () => {
    // 만약 me가 없다면(=두 캐릭터 다 GPT)
    // => 항상 handleContinueConversation(null)로 자동 진행
    if (!hasMe) {
      await handleContinueConversation(null);
      setTurn((prev) => prev + 1);
      return;
    }

    // 여기서부터는 me가 있는 경우
    // 짝수 턴 => me가 말할 차례
    if (turn % 2 === 0) {
      if (!userInput.trim()) {
        setError("입력 내용이 비어 있습니다.");
        return;
      }
      await handleContinueConversation(userInput.trim());
      setUserInput("");
      setTurn((prev) => prev + 1);
    } else {
      // 홀수 턴 => GPT가 말한 뒤 -> 다음 턴(me 차례)
      setTypedMessage("");
      setTurn((prev) => prev + 1);
    }
  };

  // ----------------------------------------
  // 5) 타이핑 효과
  // ----------------------------------------
  useEffect(() => {
    const lastAssistantMessage = dialogues
      .filter((msg) => msg.role === "assistant")
      .slice(-1)[0]?.content;

    // 메시지가 없으면 초기화
    if (!lastAssistantMessage) {
      setTypedMessage("");
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
      }
      return;
    }

    // interval 초기화
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

    // ----------------------------------------
    // 6) 현재 화자 이름(한글)
    // - 짝수 턴 => names[id1], 홀수 턴 => names[id2]
    // ----------------------------------------
    const currentSpeakerEng =
    turn === 0
        ? "" // 첫 번째 턴에는 빈 문자열
        : turn % 2 === 0
        ? names[id2]
        : names[id1];
    const currentSpeakerKor = turn === 0 ? "" : koreanNames[currentSpeakerEng] || currentSpeakerEng;


  return (
    <div className="conversation-scene-container">
      {/* 3D 모델 표시 */}
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

      {/* 대화창 영역 */}
      <div>

        <div className="dialogue-box">
          {error && <p className="error">{error}</p>}

          {/* 
            만약 me가 없으면(=hasMe=false) => 입력창 노출X
            (항상 2 GPT가 번갈아 말하므로 타이핑 메시지만 표시)
          */}

            {/* 현재 화자 이름(한글) */}
            <h3 className="whoisspeaking">{currentSpeakerKor}</h3>

          {!hasMe ? (
            <div className="dialogue-messages">
              <p>{typedMessage}</p>
            </div>
          ) : (
            /* me가 있을 때(=hasMe=true) => 
               짝수 턴(me 차례)엔 입력창, 
               홀수 턴(GPT 차례)엔 타이핑 메시지 표시
            */
            turn % 2 === 0 ? (
              // me 차례
              <div className="user-input">
                <textarea
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="대화를 입력하세요..."
                />
              </div>
            ) : (
              // GPT 차례
              <div className="dialogue-messages">
                <p>{typedMessage}</p>
              </div>
            )
          )}

          {/* 화살표 버튼 (대화 진행) */}
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
