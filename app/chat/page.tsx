"use client"

import { useState } from "react"
import { mcpService } from "@/services/mcp-service"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Send, RefreshCw, ChevronDown, ChevronRight } from "lucide-react"
import Link from "next/link"
import ReactMarkdown from "react-markdown"

interface Message {
  id: string
  role: "user" | "assistant" | "system"
  content: string
}

interface ToolCall {
  id: string
  type: "tool_request" | "tool_calling" | "tool_result"
  content: string
}

export default function ChatPage() {
  const [query, setQuery] = useState<string>("")
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedTools, setExpandedTools] = useState<Record<string, boolean>>({})

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

  const toggleToolExpand = (toolId: string) => {
    setExpandedTools(prev => ({
      ...prev,
      [toolId]: !prev[toolId]
    }))
  }

  // Extract tool calls from content
  const extractToolCalls = (content: string): { processedContent: string, toolCalls: ToolCall[] } => {
    const toolCalls: ToolCall[] = []
    let processedContent = content

    // Match all tool call patterns
    const toolRequestRegex = /\[Claude wants to use tool:(.*?)\]/g
    const toolCallingRegex = /\[Client calling tool(.*?)\]/g
    const toolResultRegex = /\[Tool(.*?)result:(.*?)\]/g

    // Process tool requests
    let match
    while ((match = toolRequestRegex.exec(content)) !== null) {
      // Generate a stable ID based on the content
      const fullMatch = match[0]
      const id = `tool-request-${Buffer.from(fullMatch).toString('base64').substring(0, 12)}`
      
      toolCalls.push({
        id,
        type: "tool_request",
        content: fullMatch
      })
      
      processedContent = processedContent.replace(
        fullMatch, 
        `<tool-call id="${id}" type="tool_request"></tool-call>`
      )
    }

    // Process tool callings
    while ((match = toolCallingRegex.exec(content)) !== null) {
      const fullMatch = match[0]
      const id = `tool-calling-${Buffer.from(fullMatch).toString('base64').substring(0, 12)}`
      
      toolCalls.push({
        id,
        type: "tool_calling",
        content: fullMatch
      })
      
      processedContent = processedContent.replace(
        fullMatch, 
        `<tool-call id="${id}" type="tool_calling"></tool-call>`
      )
    }

    // Process tool results
    while ((match = toolResultRegex.exec(content)) !== null) {
      const fullMatch = match[0]
      const id = `tool-result-${Buffer.from(fullMatch).toString('base64').substring(0, 12)}`
      
      toolCalls.push({
        id,
        type: "tool_result",
        content: fullMatch
      })
      
      processedContent = processedContent.replace(
        fullMatch, 
        `<tool-call id="${id}" type="tool_result"></tool-call>`
      )
    }

    return { processedContent, toolCalls }
  }

  // Render a collapsible tool call box
  const renderToolCall = (toolCall: ToolCall) => {
    const isExpanded = expandedTools[toolCall.id] || false
    
    let title = "Tool Operation"
    let bgColor = "bg-blue-50"
    let borderColor = "border-blue-200"
    let textColor = "text-blue-800"
    let parsedContent = toolCall.content
    let summary = ""
    
    // Parse the tool content based on type
    if (toolCall.type === "tool_request") {
      title = "Tool Request"
      bgColor = "bg-indigo-50"
      borderColor = "border-indigo-200"
      textColor = "text-indigo-800"
      
      // Extract tool name and args from Claude's request
      const match = toolCall.content.match(/\[Claude wants to use tool: (\w+)(.+?)\]/)
      if (match) {
        const toolName = match[1]
        let toolArgs = match[2]
        summary = `${toolName}`
        
        // Format the parsed content
        parsedContent = `**Tool**: \`${toolName}\`\n\n**Arguments**: \`${toolArgs.trim()}\``
      }
    } else if (toolCall.type === "tool_calling") {
      title = "Tool Calling"
      bgColor = "bg-violet-50"
      borderColor = "border-violet-200" 
      textColor = "text-violet-800"
      
      // Extract info from client tool calling
      const match = toolCall.content.match(/\[Client calling tool (\w+) .* with args (.+?)\]/)
      if (match) {
        const toolName = match[1]
        summary = `${toolName}`
        
        // Format the parsed content
        parsedContent = `**Executing**: \`${toolName}\`\n\n**With arguments**: \`${match[2]}\``
      }
    } else if (toolCall.type === "tool_result") {
      title = "Tool Result"
      bgColor = "bg-emerald-50"
      borderColor = "border-emerald-200"
      textColor = "text-emerald-800"
      
      // Extract tool result
      const match = toolCall.content.match(/\[Tool (.+?) result: (.+)\]/)
      if (match) {
        const toolName = match[1]
        summary = `${toolName} result`
        
        try {
          // Try to extract and format the result data
          let resultData = match[2]
          if (resultData.startsWith('[') && resultData.includes('TextContent')) {
            // Handle the TextContent format from the example
            const textMatch = resultData.match(/text='(.*?)'/);
            if (textMatch && textMatch[1]) {
              resultData = textMatch[1].replace(/\\n/g, '\n')
            }
          }
          
          parsedContent = `**Result from**: \`${toolName}\`\n\n${resultData}`
        } catch (e) {
          // If parsing fails, use the original content
          parsedContent = toolCall.content
        }
      }
    }

    // Style for short vs long content
    const isLongContent = toolCall.content.length > 150
    
    return (
      <div className={`my-2 rounded-md border ${borderColor} ${bgColor}`}>
        <div 
          className={`flex items-center justify-between p-2 cursor-pointer ${textColor} font-medium`}
          onClick={() => toggleToolExpand(toolCall.id)}
        >
          <div className="flex items-center">
            {isExpanded ? 
              <ChevronDown className="h-4 w-4 mr-1" /> : 
              <ChevronRight className="h-4 w-4 mr-1" />
            }
            <span>{title}{summary ? `: ${summary}` : ""}</span>
          </div>
          <span className="text-xs">
            {isExpanded ? "Collapse" : "Expand"}
          </span>
        </div>
        
        {isExpanded && (
          <div className="p-2 border-t border-gray-200 text-sm overflow-auto max-h-60">
            <ReactMarkdown
              components={{
                code: ({ children }) => <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">{children}</code>,
                pre: ({ children }) => <pre className="bg-gray-100 p-2 rounded overflow-auto my-2 text-sm font-mono">{children}</pre>,
              }}
            >
              {parsedContent}
            </ReactMarkdown>
          </div>
        )}
        
        {!isExpanded && isLongContent && (
          <div className="px-2 pb-2 text-xs italic text-gray-500">
            Click to view details
          </div>
        )}
        
        {!isExpanded && !isLongContent && (
          <div className="p-2 text-xs overflow-hidden text-gray-700 truncate">
            {summary || parsedContent}
          </div>
        )}
      </div>
    )
  }

  // Custom renderer for markdown content with tool calls
  const renderMessageContent = (content: string) => {
    // Extract tool calls and replace with placeholders
    const { processedContent, toolCalls } = extractToolCalls(content)
    
    // If no tool calls, just render the markdown
    if (toolCalls.length === 0) {
      return (
        <div className="markdown-content">
          <ReactMarkdown
            components={{
              code: ({ children }) => <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">{children}</code>,
              pre: ({ children }) => <pre className="bg-gray-100 p-2 rounded overflow-auto my-2 text-sm font-mono">{children}</pre>,
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      )
    }
    
    // Split by tool call markers
    const segments = processedContent.split(/<tool-call id="(.*?)" type="(.*?)"><\/tool-call>/)
    
    // Rebuild the content with tool calls rendered
    const renderedContent = []
    
    for (let i = 0; i < segments.length; i++) {
      if (i % 3 === 0) {
        // This is a text segment
        if (segments[i]) {
          renderedContent.push(
            <div key={`text-${i}`} className="markdown-content">
              <ReactMarkdown
                components={{
                  code: ({ children }) => <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">{children}</code>,
                  pre: ({ children }) => <pre className="bg-gray-100 p-2 rounded overflow-auto my-2 text-sm font-mono">{children}</pre>,
                }}
              >
                {segments[i]}
              </ReactMarkdown>
            </div>
          )
        }
      } else if (i % 3 === 1) {
        // This is a tool call ID
        const toolId = segments[i]
        const toolType = segments[i + 1]
        const tool = toolCalls.find(t => t.id === toolId)
        
        if (tool) {
          renderedContent.push(
            <div key={`tool-${tool.id}`}>
              {renderToolCall(tool)}
            </div>
          )
        }
      }
    }
    
    return <div>{renderedContent}</div>
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
                    <div className="text-sm">
                      {renderMessageContent(msg.content)}
                    </div>
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
