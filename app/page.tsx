import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-white to-gray-100 px-4">
      <div className="max-w-3xl w-full text-center space-y-8">
        <h1 className="text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl">MCP Chat Interface</h1>

        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Interact with Anthropic's Model Context Protocol locally through a clean, intuitive interface.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          <Link href="/chat" passHref>
            <Button size="lg" className="gap-2 text-lg px-8 py-6">
              Start Chatting <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </div>

        <div className="mt-12 p-6 bg-white rounded-xl shadow-lg">
          <h2 className="text-2xl font-semibold mb-4">About MCP</h2>
          <p className="text-gray-700">
            Model Context Protocol (MCP) allows you to interact with Anthropic models locally, giving you more control
            and flexibility for your AI applications.
          </p>
        </div>
      </div>

      <footer className="mt-auto py-6 text-center text-gray-500">
        <p>Built for Hackathon 2025</p>
      </footer>
    </div>
  )
}
