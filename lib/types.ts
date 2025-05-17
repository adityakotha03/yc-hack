export interface Message {
  id: string
  role: "user" | "assistant" | "system"
  content: string
}

export interface ChatResponse {
  response: string | object
}
