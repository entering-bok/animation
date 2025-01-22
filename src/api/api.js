// api.js

const BASE_URL = process.env.REACT_APP_BASE_URL;

/**
 * 운세 가져오기
 * @param {string} name 사용자 이름
 * @returns {Promise<string>} 운세 메시지
 */
export const fetchFortune = async (name) => {
  if (!name.trim()) {
    throw new Error("이름을 입력해주세요.");
  }

  const response = await fetch(`${BASE_URL}/api/dailyluck`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name }),
  });

  if (!response.ok) {
    throw new Error("운세를 가져오는 데 실패했습니다.");
  }

  const data = await response.json();
  return data.fortune;
};

/**
 * 두 GPT 간 대화 시작
 * @param {string} gpt1Id 첫 번째 GPT ID
 * @param {string} gpt2Id 두 번째 GPT ID
 * @returns {Promise<string>} 대화 ID
 */
export const startTwoGPTConversation = async (gpt1Id, gpt2Id) => {
  if (!gpt1Id || !gpt2Id) {
    throw new Error("두 GPT ID가 필요합니다.");
  }

  const response = await fetch(`${BASE_URL}/api/startConversation`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ gpt1Id, gpt2Id }),
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  const data = await response.json();
  return data.conversationId;
};

/**
 * 사용자와 GPT 간 대화 시작
 * @param {string} gptId GPT ID
 * @returns {Promise<string>} 대화 ID
 */
export const startSingleGPTConversation = async (gptId) => {
  if (!gptId) {
    throw new Error("GPT ID가 필요합니다.");
  }

  const response = await fetch(`${BASE_URL}/api/startSingleConversation`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ gptId }),
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  const data = await response.json();
  return data.conversationId;
};

/**
 * 대화 계속 진행
 * @param {string} conversationId 대화 ID
 * @param {string|null} userMessage 사용자 메시지 (null일 수 있음)
 * @param {string} speakerId 현재 발화자의 ID
 * @returns {Promise<Array>} 대화 메시지 목록
 */
export const continueConversation = async (conversationId, userMessage, speakerId) => {
  if (!conversationId) {
    throw new Error("대화 ID가 필요합니다.");
  }

  const response = await fetch(`${BASE_URL}/api/continueConversation`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      conversationId,
      userMessage,
      speakerId,
    }),
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  const data = await response.json();
  return data.messages;
};
