"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Search, Send, MoreVertical } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

// Mock data for chats
const mockChats = [
  {
    id: 1,
    user: {
      id: 101,
      name: "John Doe",
      avatar: "/placeholder.svg?height=40&width=40",
      apartment: "A-101",
    },
    lastMessage: "Hello, I have a question about the facility booking.",
    timestamp: "10:30 AM",
    unread: true,
  },
  {
    id: 2,
    user: {
      id: 102,
      name: "Jane Smith",
      avatar: "/placeholder.svg?height=40&width=40",
      apartment: "B-205",
    },
    lastMessage: "Thank you for your help with the maintenance request.",
    timestamp: "Yesterday",
    unread: false,
  },
  {
    id: 3,
    user: {
      id: 103,
      name: "Robert Johnson",
      avatar: "/placeholder.svg?height=40&width=40",
      apartment: "C-310",
    },
    lastMessage: "When will the pool maintenance be completed?",
    timestamp: "Yesterday",
    unread: true,
  },
  {
    id: 4,
    user: {
      id: 104,
      name: "Emily Davis",
      avatar: "/placeholder.svg?height=40&width=40",
      apartment: "D-412",
    },
    lastMessage: "I'd like to schedule a meeting with the property manager.",
    timestamp: "Monday",
    unread: false,
  },
]

// Mock data for messages
const mockMessages = [
  {
    id: 1,
    senderId: 101,
    text: "Hello, I have a question about the facility booking.",
    timestamp: "10:30 AM",
    isAdmin: false,
  },
  {
    id: 2,
    senderId: "admin",
    text: "Hi John, how can I help you with the facility booking?",
    timestamp: "10:32 AM",
    isAdmin: true,
  },
  {
    id: 3,
    senderId: 101,
    text: "I'm trying to book the community room for next Saturday, but the system shows it's unavailable. However, the calendar appears empty.",
    timestamp: "10:33 AM",
    isAdmin: false,
  },
  {
    id: 4,
    senderId: "admin",
    text: "Let me check that for you. There might be a maintenance event scheduled that isn't showing on the resident calendar.",
    timestamp: "10:35 AM",
    isAdmin: true,
  },
  {
    id: 5,
    senderId: "admin",
    text: "I've checked the system and you're right - there was a glitch. I've fixed it now, so you should be able to make your booking. Let me know if you have any other issues!",
    timestamp: "10:40 AM",
    isAdmin: true,
  },
]

export default function ChatManagement() {
  const [selectedChat, setSelectedChat] = useState(mockChats[0])
  const [messages, setMessages] = useState(mockMessages)
  const [newMessage, setNewMessage] = useState("")
  const [searchTerm, setSearchTerm] = useState("")

  const filteredChats = mockChats.filter((chat) => chat.user.name.toLowerCase().includes(searchTerm.toLowerCase()))

  const handleSendMessage = () => {
    if (newMessage.trim() === "") return

    const newMsg = {
      id: messages.length + 1,
      senderId: "admin",
      text: newMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      isAdmin: true,
    }

    setMessages([...messages, newMsg])
    setNewMessage("")
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Chat Management</h1>
        <p className="text-muted-foreground">Manage resident communications and support requests</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
        {/* Chat List */}
        <Card className="md:col-span-1 flex flex-col h-full">
          <CardHeader className="px-4 py-3 border-b">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="p-0 overflow-auto flex-grow">
            <div className="divide-y">
              {filteredChats.map((chat) => (
                <div
                  key={chat.id}
                  className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                    selectedChat?.id === chat.id ? "bg-muted" : ""
                  }`}
                  onClick={() => setSelectedChat(chat)}
                >
                  <div className="flex items-start gap-3">
                    <Avatar>
                      <AvatarImage src={chat.user.avatar || "/placeholder.svg"} alt={chat.user.name} />
                      <AvatarFallback>{chat.user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium truncate">{chat.user.name}</h4>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">{chat.timestamp}</span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{chat.lastMessage}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{chat.user.apartment}</span>
                        {chat.unread && <Badge className="h-2 w-2 rounded-full p-0 bg-apartner-500" />}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Chat Messages */}
        <Card className="md:col-span-2 flex flex-col h-full">
          {selectedChat ? (
            <>
              <CardHeader className="px-6 py-4 border-b flex flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={selectedChat.user.avatar || "/placeholder.svg"} alt={selectedChat.user.name} />
                    <AvatarFallback>{selectedChat.user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">{selectedChat.user.name}</CardTitle>
                    <CardDescription>{selectedChat.user.apartment}</CardDescription>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>View Profile</DropdownMenuItem>
                    <DropdownMenuItem>Mark as Resolved</DropdownMenuItem>
                    <DropdownMenuItem>Transfer to Manager</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">Block User</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent className="p-6 overflow-auto flex-grow flex flex-col gap-4">
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.isAdmin ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.isAdmin ? "bg-apartner-600 text-white" : "bg-muted"
                      }`}
                    >
                      <p className="text-sm">{message.text}</p>
                      <p className={`text-xs mt-1 ${message.isAdmin ? "text-apartner-100" : "text-muted-foreground"}`}>
                        {message.timestamp}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1"
                  />
                  <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">Select a conversation to start chatting</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
