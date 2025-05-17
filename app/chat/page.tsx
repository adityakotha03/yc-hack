"use client"

import { useState } from "react"
import { mcpService } from "@/services/mcp-service"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Send, RefreshCw } from "lucide-react"
import Link from "next/link"

interface Message {
  id: string
  role: "user" | "assistant" | "system"
  content: string
}

export default function ChatPage() {
  const [query, setQuery] = useState<string>("")
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const handleSendQuery = async () => {
    if (!query.trim()) return

    const userMessage: Message = { id: Date.now().toString(), role: "user", content: query }
    setMessages((prevMessages) => [...prevMessages, userMessage])
    setQuery("")
    setIsLoading(true)
    setError(null)

    try {
      const data = await mcpService.sendChat(query)
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: typeof data.response === "string" ? data.response : JSON.stringify(data.response),
      }
      setMessages((prevMessages) => [...prevMessages, assistantMessage])
    } catch (err: any) {
      console.error("Chat error:", err)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "system",
        content: `Error: ${err.message || "Failed to get response."}`,
      }
      setMessages((prevMessages) => [...prevMessages, errorMessage])
      setError(err.message || "An error occurred while sending the message.")
    }
    setIsLoading(false)
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 py-4 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">MCP Chat Interface</h1>
          <Link href="/" className="flex items-center text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Home
          </Link>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-8">
        <Card className="max-w-4xl mx-auto shadow-lg">
          <CardHeader>
            <CardTitle className="text-center">Model Context Protocol Chat</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Chat Messages Display */}
            <div className="h-96 overflow-y-auto p-4 border border-gray-200 rounded-md bg-gray-50 space-y-3">
              {messages.length === 0 && (
                <div className="flex justify-center items-center h-full text-gray-400">
                  <p>Send a message to start chatting with the MCP model</p>
                </div>
              )}

              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-lg shadow ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : msg.role === "assistant"
                          ? "bg-gray-200 text-gray-800"
                          : "bg-yellow-100 text-yellow-800 border border-yellow-300"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-lg shadow bg-gray-200 text-gray-800">
                    <p className="text-sm flex items-center">
                      <RefreshCw className="mr-2 h-3 w-3 animate-spin" />
                      Assistant is thinking...
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>

          {/* Query Input */}
          <CardFooter>
            <div className="flex gap-2 w-full">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !isLoading && handleSendQuery()}
                placeholder="Type your message..."
                className="flex-grow"
                disabled={isLoading}
              />
              <Button onClick={handleSendQuery} disabled={isLoading || !query.trim()} className="px-6">
                {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </main>

      <footer className="bg-white border-t border-gray-200 py-4 px-6 text-center text-gray-500">
        <p>MCP Chat Interface • Hackathon 2025</p>
      </footer>
    </div>
  )
}
