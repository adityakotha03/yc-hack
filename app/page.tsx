"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Minus, Send, FileText, PieChart, FolderKanban, FolderClosed, User, RefreshCw, X } from "lucide-react"
import { mcpService } from "@/services/mcp-service"
import ReactMarkdown from "react-markdown"
import {
  PieChart as RechartsPieChart,
  Pie,
  BarChart as RechartsBarChart,
  Bar,
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts"

interface Message {
  id: string
  role: "user" | "assistant" | "system"
  content: string
}

interface Task {
  id: number
  name: string
  progress: number
}

// Sample data for charts
const marketData = [
  { name: "Product A", value: 55 },
  { name: "Product B", value: 25 },
  { name: "Product C", value: 20 },
]

const COLORS = ["#e05d6f", "#92d050", "#ffbe55"]

const competitorData = [
  { name: "Jan", competitor1: 4000, competitor2: 2400, competitor3: 3200 },
  { name: "Feb", competitor1: 3000, competitor2: 1398, competitor3: 2800 },
  { name: "Mar", competitor1: 2000, competitor2: 9800, competitor3: 2200 },
  { name: "Apr", competitor1: 2780, competitor2: 3908, competitor3: 2500 },
  { name: "May", competitor1: 1890, competitor2: 4800, competitor3: 2300 },
  { name: "Jun", competitor1: 2390, competitor2: 3800, competitor3: 2900 },
]

const progressData = [
  { name: "Week 1", progress: 20 },
  { name: "Week 2", progress: 35 },
  { name: "Week 3", progress: 42 },
  { name: "Week 4", progress: 58 },
  { name: "Week 5", progress: 65 },
  { name: "Week 6", progress: 78 },
  { name: "Week 7", progress: 82 },
  { name: "Week 8", progress: 88 },
]

export default function Dashboard() {
  const [query, setQuery] = useState<string>("")
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [isInputFocused, setInputFocused] = useState<boolean>(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Modal states
  const [showMarketModal, setShowMarketModal] = useState(false)
  const [showCompetitorModal, setShowCompetitorModal] = useState(false)
  const [showProgressModal, setShowProgressModal] = useState(false)

  // Tasks state with initial values
  const [tasks, setTasks] = useState<Task[]>([
    { id: 1, name: "Task 1", progress: 80 },
    { id: 2, name: "Task 2", progress: 50 },
    { id: 3, name: "Task 3", progress: 20 },
    { id: 4, name: "Task 4", progress: 50 },
  ])

  // Refresh tasks function - increases progress by 5-15% randomly
  const refreshTasks = () => {
    setTasks((prevTasks) =>
      prevTasks.map((task) => ({
        ...task,
        progress: Math.min(100, task.progress + Math.floor(Math.random() * 10) + 5),
      })),
    )
  }

  // Relevant updates refresh animation state
  const [isRefreshingUpdates, setIsRefreshingUpdates] = useState(false)

  // Handle refresh for relevant updates
  const refreshUpdates = () => {
    setIsRefreshingUpdates(true)
    setTimeout(() => {
      setIsRefreshingUpdates(false)
    }, 1000)
  }

  // Handle opening modals
  const openMarketModal = () => {
    setShowMarketModal(true)
  }

  const openCompetitorModal = () => {
    setShowCompetitorModal(true)
  }

  const openProgressModal = () => {
    setShowProgressModal(true)
  }

  // Close modals
  const closeMarketModal = () => {
    setShowMarketModal(false)
  }

  const closeCompetitorModal = () => {
    setShowCompetitorModal(false)
  }

  const closeProgressModal = () => {
    setShowProgressModal(false)
  }

  const handleSendQuery = async () => {
    if (!query.trim()) return

    const userMessage: Message = { id: Date.now().toString(), role: "user", content: query }
    setMessages((prevMessages) => [...prevMessages, userMessage])
    setQuery("")
    setIsLoading(true)
    setError(null)

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "40px"
    }

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
    } finally {
      setIsLoading(false)
    }
  }

  // Auto-resize textarea as user types
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setQuery(e.target.value)

    // Auto-resize
    e.target.style.height = "40px"
    e.target.style.height = `${e.target.scrollHeight}px`
  }

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault() // Prevent new line
      if (!isLoading && query.trim()) {
        handleSendQuery()
      }
    }
  }

  return (
    <div className="min-h-screen overflow-auto flex flex-col">
      <div className="flex flex-1">
        {/* Left Sidebar with radial gradient */}
        <div
          className="w-[380px] p-4 relative overflow-y-auto max-h-screen"
          style={{
            background: "radial-gradient(circle, #FFFFFF 0%, #B1E6F8 100%)",
          }}
        >
          <div className="space-y-4">
            {/* Today's Overview */}
            <div>
              <div className="border-t border-gray-300 w-6 mb-2 ml-1"></div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-[#463724] text-lg font-medium">Today's overview:</h2>
                  <Minus className="h-5 w-5 text-[#463724]" />
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="bg-black text-white text-xs px-2 py-1 rounded">veena</div>
                      <span className="font-medium text-[#463724]">Current Focus:</span>
                    </div>
                    <p className="text-xs text-[#463724] leading-relaxed">
                      Execute user testing with beta testing group & analyze what features are important for the
                      customer pain point.
                    </p>
                    <p className="text-xs text-[#463724] mt-2 leading-relaxed">
                      Painpoint: current music AI products are don't understand music theory
                    </p>
                    <p className="text-xs text-gray-500 text-right mt-2">Last pivoted March 2025</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Relevant Updates - New Section with clickable items */}
            <div>
              <div className="border-t border-gray-300 w-6 mb-2 ml-1"></div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-[#463724] text-lg font-medium">Relevant Updates:</h2>
                  <div className="flex items-center space-x-2">
                    <button onClick={refreshUpdates} className="text-[#463724] hover:text-blue-600 transition-colors">
                      <RefreshCw className={`h-4 w-4 ${isRefreshingUpdates ? "animate-spin" : ""}`} />
                    </button>
                    <Minus className="h-5 w-5 text-[#463724]" />
                  </div>
                </div>
                <div className="space-y-2">
                  <button
                    onClick={openMarketModal}
                    className="w-full text-left text-sm text-[#463724] py-1.5 px-2 rounded hover:bg-gray-100"
                  >
                    Market Analysis
                  </button>
                  <button
                    onClick={openCompetitorModal}
                    className="w-full text-left text-sm text-[#463724] py-1.5 px-2 rounded hover:bg-gray-100"
                  >
                    Competitor QA Analysis
                  </button>
                  <button
                    onClick={openProgressModal}
                    className="w-full text-left text-sm text-[#463724] py-1.5 px-2 rounded hover:bg-gray-100"
                  >
                    Project progress
                  </button>
                </div>
              </div>
            </div>

            {/* What's Done */}
            <div>
              <div className="border-t border-gray-300 w-6 mb-2 ml-1"></div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-[#463724] text-lg font-medium">What's done:</h2>
                  <Minus className="h-5 w-5 text-[#463724]" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                      <img src="/diverse-avatars.png" alt="User" className="h-full w-full object-cover" />
                    </div>
                    <span className="text-sm text-[#463724]">Userflow mapping</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                      <img src="/diverse-avatars.png" alt="User" className="h-full w-full object-cover" />
                    </div>
                    <span className="text-sm text-[#463724]">Client setup</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Today's Meetings */}
            <div>
              <div className="border-t border-gray-300 w-6 mb-2 ml-1"></div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-[#463724] text-lg font-medium">Today's Meetings</h2>
                  <Minus className="h-5 w-5 text-[#463724]" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-start space-x-3">
                    <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden mt-0.5">
                      <img src="/diverse-avatars.png" alt="User" className="h-full w-full object-cover" />
                    </div>
                    <div>
                      <p className="text-sm text-[#463724]">TAM SOM SAM Analysis Meeting</p>
                      <p className="text-xs text-gray-500 italic">11 AM</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden mt-0.5">
                      <img src="/diverse-avatars.png" alt="User" className="h-full w-full object-cover" />
                    </div>
                    <div>
                      <p className="text-sm text-[#463724]">Han x Greptile kickoff Meeting</p>
                      <p className="text-xs text-gray-500 italic">1 PM</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden mt-0.5">
                      <img src="/diverse-avatars.png" alt="User" className="h-full w-full object-cover" />
                    </div>
                    <div>
                      <p className="text-sm text-[#463724]">Caroline Schultz | User Interview</p>
                      <p className="text-xs text-gray-500 italic">2:30 PM</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden mt-0.5">
                      <img src="/diverse-avatars.png" alt="User" className="h-full w-full object-cover" />
                    </div>
                    <div>
                      <p className="text-sm text-[#463724]">Henry Ford | User Interview</p>
                      <p className="text-xs text-gray-500 italic">4 PM</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* To do with progress bars and refresh button */}
            <div>
              <div className="border-t border-gray-300 w-6 mb-2 ml-1"></div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-[#463724] text-lg font-medium">To do:</h2>
                  <div className="flex items-center space-x-2">
                    <button onClick={refreshTasks} className="text-[#463724] hover:text-blue-600 transition-colors">
                      <RefreshCw className="h-4 w-4" />
                    </button>
                    <Minus className="h-5 w-5 text-[#463724]" />
                  </div>
                </div>
                <div className="space-y-3">
                  {tasks.map((task) => (
                    <div key={task.id} className="flex items-center">
                      <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden mr-3">
                        <img src="/diverse-avatars.png" alt="User" className="h-full w-full object-cover" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-[#463724]">{task.name}</span>
                          <span className="text-xs text-gray-500">{task.progress}% progress</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500 rounded-full transition-all duration-500"
                            style={{ width: `${task.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Gradient separator */}
          <div className="absolute top-0 right-0 bottom-0 w-1 bg-gradient-to-r from-transparent to-gray-200"></div>
        </div>

        {/* Main Content with background image */}
        <div
          className="flex-1 p-6 flex flex-col relative overflow-y-auto max-h-screen"
          style={{
            backgroundImage: `url('/soft-blue-gradient.png')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        >
          {/* Semi-transparent overlay to ensure text readability */}
          <div className="absolute inset-0 bg-white bg-opacity-30"></div>

          {/* Content container */}
          <div className="relative z-10 flex flex-col h-full">
            {/* Header with Logo */}
            <div className="flex justify-center mb-4">
              <div className="bg-[#161616] text-white px-6 py-3 rounded-lg">
                <div className="flex items-center space-x-2">
                  <span className="text-[#00a0ff] text-2xl font-bold">√</span>
                  <div>
                    <div className="text-xl font-bold">veena</div>
                    <div className="text-xs tracking-widest">S T U D I O</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Chat Interface */}
            <div className="flex-1 flex flex-col min-h-0">
              <h1 className="text-[#463724] text-2xl font-medium mb-4">Hey Sam, ask me anything.</h1>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto mb-4 px-4 max-h-[40vh]">
                {messages.length > 0 && (
                  <div className="space-y-4">
                    {messages.map((msg) => (
                      <div key={msg.id}>
                        {msg.role === "user" ? (
                          <div className="flex justify-end">
                            <div className="flex items-end">
                              <div className="max-w-[75%] px-4 py-2 rounded-lg bg-[#212121] text-white">
                                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                              </div>
                              <div className="ml-2 rounded-full flex items-center justify-center h-8 w-8 bg-[#212121] text-white">
                                <User size={16} />
                              </div>
                            </div>
                          </div>
                        ) : msg.role === "assistant" ? (
                          <div className="flex justify-start">
                            <div className="flex items-end">
                              <div className="mr-2 rounded-full flex items-center justify-center h-8 w-8 bg-[#00a0ff] text-white">
                                <span className="text-lg">√</span>
                              </div>
                              <div className="max-w-[75%] px-4 py-2 rounded-lg bg-white text-[#463724]">
                                <ReactMarkdown
                                  components={{
                                    code: ({ children }) => (
                                      <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">
                                        {children}
                                      </code>
                                    ),
                                    pre: ({ children }) => (
                                      <pre className="bg-gray-100 p-2 rounded overflow-auto my-2 text-sm font-mono">
                                        {children}
                                      </pre>
                                    ),
                                  }}
                                >
                                  {msg.content}
                                </ReactMarkdown>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex justify-center">
                            <div className="max-w-[75%] px-4 py-2 rounded-lg bg-yellow-100 text-yellow-800 border border-yellow-300">
                              <p className="text-sm">{msg.content}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="flex items-end">
                          <div className="mr-2 rounded-full flex items-center justify-center h-8 w-8 bg-[#00a0ff] text-white">
                            <span className="text-lg">√</span>
                          </div>
                          <div className="max-w-[75%] px-4 py-2 rounded-lg bg-white text-[#463724]">
                            <p className="text-sm flex items-center">
                              <span className="animate-pulse mr-1">●</span>
                              <span className="animate-pulse delay-100 mx-0.5">●</span>
                              <span className="animate-pulse delay-200">●</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Input Area */}
              <div className="w-full max-w-3xl mx-auto mt-auto">
                <div className={`bg-white rounded-lg shadow-sm ${messages.length === 0 ? "mx-auto" : ""}`}>
                  <div className="flex items-end">
                    <div className="flex-grow relative">
                      <textarea
                        ref={textareaRef}
                        value={query}
                        onChange={handleTextareaChange}
                        onKeyDown={handleKeyDown}
                        onFocus={() => setInputFocused(true)}
                        onBlur={() => setInputFocused(false)}
                        placeholder={messages.length === 0 ? "Reply here" : "Message..."}
                        className="w-full resize-none focus:outline-none py-2 px-3 max-h-32 min-h-[40px]"
                        style={{ height: "40px" }}
                      />
                    </div>
                    <div className="flex items-center px-2">
                      <Button
                        onClick={handleSendQuery}
                        disabled={isLoading || !query.trim()}
                        className="bg-[#212121] hover:bg-[#000000] rounded-full h-10 w-10 p-0 flex items-center justify-center"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Keyboard shortcuts info */}
                <div
                  className="flex justify-end text-xs text-gray-500 mt-1 transition-opacity duration-300"
                  style={{ opacity: isInputFocused ? 1 : 0 }}
                >
                  <span>
                    <strong>Enter</strong> to send, <strong>Shift + Enter</strong> for new line
                  </span>
                </div>
              </div>

              {/* Powered by AI text */}
              {messages.length === 0 && (
                <div className="text-right text-xs text-gray-400 mt-1 mr-2">Powered with AI</div>
              )}

              {/* Quick Actions - only show when there are no messages */}
              {messages.length === 0 && (
                <div className="flex gap-4 mt-4">
                  <Button
                    variant="outline"
                    className="flex-1 bg-white bg-opacity-95 border-gray-200 text-[#463724] hover:bg-gray-50"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Pitch deck
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 bg-white bg-opacity-95 border-gray-200 text-[#463724] hover:bg-gray-50"
                  >
                    <PieChart className="h-4 w-4 mr-2" />
                    Product Pivot
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 bg-white bg-opacity-95 border-gray-200 text-[#463724] hover:bg-gray-50"
                  >
                    <FolderKanban className="h-4 w-4 mr-2" />
                    Project Management
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 bg-white bg-opacity-95 border-gray-200 text-[#463724] hover:bg-gray-50"
                  >
                    <FolderClosed className="h-4 w-4 mr-2" />
                    File organization
                  </Button>
                </div>
              )}

              {/* Footer */}
              <div className="mt-4 pt-2 text-right text-sm text-[#463724]">
                Connected through
                <span className="inline-flex ml-2 space-x-2">
                  <img src="/notion-logo.png" alt="Notion" className="h-5 w-5" />
                  <img src="/github-logo.png" alt="GitHub" className="h-5 w-5" />
                  <img src="/figma-logo.png" alt="Figma" className="h-5 w-5" />
                  <img src="/google-drive-logo.png" alt="Google Drive" className="h-5 w-5" />
                  <img src="/slack-logo.png" alt="Slack" className="h-5 w-5" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Market Analysis Modal */}
      {showMarketModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6 animate-fadeIn">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-[#463724]">Market Analysis</h2>
              <button onClick={closeMarketModal} className="text-gray-500 hover:text-gray-700">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mb-4">
              <p className="text-[#463724] mb-4">
                Current market share distribution across our product lines shows Product A leading with 55% market
                share.
              </p>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={marketData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      animationDuration={1000}
                      animationBegin={0}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {marketData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-500">
              <p>Last updated: May 17, 2025</p>
            </div>
          </div>
        </div>
      )}

      {/* Competitor Analysis Modal */}
      {showCompetitorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6 animate-fadeIn">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-[#463724]">Competitor QA Analysis</h2>
              <button onClick={closeCompetitorModal} className="text-gray-500 hover:text-gray-700">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mb-4">
              <p className="text-[#463724] mb-4">
                Comparative analysis of feature quality scores across our top three competitors over the last 6 months.
              </p>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={competitorData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="competitor1"
                      name="Our Product"
                      fill="#92d050"
                      animationDuration={1000}
                      animationBegin={0}
                    />
                    <Bar
                      dataKey="competitor2"
                      name="Competitor A"
                      fill="#8884d8"
                      animationDuration={1000}
                      animationBegin={300}
                    />
                    <Bar
                      dataKey="competitor3"
                      name="Competitor B"
                      fill="#82ca9d"
                      animationDuration={1000}
                      animationBegin={600}
                    />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-500">
              <p>Last updated: May 15, 2025</p>
            </div>
          </div>
        </div>
      )}

      {/* Project Progress Modal */}
      {showProgressModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6 animate-fadeIn">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-[#463724]">Project Progress</h2>
              <button onClick={closeProgressModal} className="text-gray-500 hover:text-gray-700">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mb-4">
              <p className="text-[#463724] mb-4">
                Weekly progress tracking for the current project shows steady improvement with 88% completion in Week 8.
              </p>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsLineChart data={progressData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip formatter={(value) => [`${value}%`, "Progress"]} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="progress"
                      name="Project Completion"
                      stroke="#ffbe55"
                      strokeWidth={2}
                      dot={{ r: 6 }}
                      activeDot={{ r: 8 }}
                      animationDuration={2000}
                    />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-500">
              <p>Last updated: May 16, 2025</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
