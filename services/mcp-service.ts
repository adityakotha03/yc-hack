import axios from "axios"

// Create an axios instance with default config
const mcpAxios = axios.create({
  baseURL: "http://localhost:8000",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 300000, // 5 minutes timeout
})

// Response interface
interface ChatResponse {
  response: string | object
}

// MCP Service with error handling
export const mcpService = {
  /**
   * Send a chat message to the MCP server
   * @param query The user's query
   * @returns Promise with chat response
   */
  async sendChat(query: string): Promise<ChatResponse> {
    try {
      const response = await mcpAxios.post("/chat", { query })
      return response.data
    } catch (error: any) {
      if (error.response) {
        throw new Error(error.response.data.detail || "Failed to send message")
      } else if (error.request) {
        throw new Error("No response from server. Is the MCP server running?")
      } else {
        throw new Error(`Error: ${error.message}`)
      }
    }
  },
}
