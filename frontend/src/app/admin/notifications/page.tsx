"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Bell, Send, Trash2, AlertCircle, Info, Calendar, Settings } from "lucide-react"

// Mock data for notifications
const notifications = [
  {
    id: 1,
    title: "System Maintenance",
    message: "The system will be down for maintenance on Saturday, July 15th from 2:00 AM to 4:00 AM.",
    type: "system",
    status: "scheduled",
    date: "2023-07-15T02:00:00",
    recipients: "all",
  },
  {
    id: 2,
    title: "New Feature: Facility Booking",
    message: "We've added a new feature that allows you to book facilities directly from the app.",
    type: "announcement",
    status: "sent",
    date: "2023-07-10T14:30:00",
    recipients: "all",
  },
  {
    id: 3,
    title: "Pool Maintenance",
    message: "The pool will be closed for maintenance on Monday, July 17th.",
    type: "facility",
    status: "draft",
    date: "2023-07-17T08:00:00",
    recipients: "residents",
  },
  {
    id: 4,
    title: "Fire Alarm Testing",
    message: "We will be testing the fire alarm system on Tuesday, July 18th from 10:00 AM to 11:00 AM.",
    type: "emergency",
    status: "scheduled",
    date: "2023-07-18T10:00:00",
    recipients: "all",
  },
  {
    id: 5,
    title: "Community Meeting",
    message: "There will be a community meeting on Wednesday, July 19th at 7:00 PM in the community room.",
    type: "event",
    status: "sent",
    date: "2023-07-19T19:00:00",
    recipients: "residents",
  },
]

const getTypeIcon = (type) => {
  switch (type) {
    case "system":
      return <Settings className="h-4 w-4" />
    case "announcement":
      return <Info className="h-4 w-4" />
    case "facility":
      return <Calendar className="h-4 w-4" />
    case "emergency":
      return <AlertCircle className="h-4 w-4" />
    case "event":
      return <Calendar className="h-4 w-4" />
    default:
      return <Bell className="h-4 w-4" />
  }
}

const getStatusBadge = (status) => {
  switch (status) {
    case "sent":
      return (
        <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
          Sent
        </Badge>
      )
    case "scheduled":
      return (
        <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
          Scheduled
        </Badge>
      )
    case "draft":
      return (
        <Badge variant="outline" className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
          Draft
        </Badge>
      )
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState("all")
  const [newNotification, setNewNotification] = useState({
    title: "",
    message: "",
    type: "announcement",
    recipients: "all",
    schedule: false,
    date: "",
    time: "",
  })

  const filteredNotifications =
    activeTab === "all" ? notifications : notifications.filter((notification) => notification.type === activeTab)

  const handleCreateNotification = () => {
    // In a real application, this would send the notification to the backend
    console.log("Creating notification:", newNotification)
    // Reset form
    setNewNotification({
      title: "",
      message: "",
      type: "announcement",
      recipients: "all",
      schedule: false,
      date: "",
      time: "",
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
        <p className="text-muted-foreground">Manage and send notifications to users</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Notification History</CardTitle>
              <CardDescription>View and manage sent and scheduled notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="announcement">Announcements</TabsTrigger>
                  <TabsTrigger value="system">System</TabsTrigger>
                  <TabsTrigger value="emergency">Emergency</TabsTrigger>
                  <TabsTrigger value="facility">Facility</TabsTrigger>
                  <TabsTrigger value="event">Events</TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="space-y-4">
                  {filteredNotifications.length > 0 ? (
                    filteredNotifications.map((notification) => (
                      <div key={notification.id} className="flex items-start p-4 border rounded-lg">
                        <div className="mr-4 mt-1">{getTypeIcon(notification.type)}</div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-medium">{notification.title}</h3>
                            {getStatusBadge(notification.status)}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                          <div className="flex items-center text-xs text-muted-foreground">
                            <span className="mr-4">
                              {new Date(notification.date).toLocaleDateString()} at{" "}
                              {new Date(notification.date).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            <span>Recipients: {notification.recipients}</span>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="icon">
                            <Send className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Bell className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                      <h3 className="mt-4 text-lg font-medium">No notifications found</h3>
                      <p className="text-muted-foreground">
                        {activeTab === "all"
                          ? "You haven't created any notifications yet."
                          : `You haven't created any ${activeTab} notifications yet.`}
                      </p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Create Notification</CardTitle>
              <CardDescription>Send a new notification to users</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Notification title"
                  value={newNotification.title}
                  onChange={(e) => setNewNotification({ ...newNotification, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  placeholder="Notification message"
                  rows={4}
                  value={newNotification.message}
                  onChange={(e) => setNewNotification({ ...newNotification, message: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select
                  value={newNotification.type}
                  onValueChange={(value) => setNewNotification({ ...newNotification, type: value })}
                >
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="announcement">Announcement</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                    <SelectItem value="facility">Facility</SelectItem>
                    <SelectItem value="event">Event</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="recipients">Recipients</Label>
                <Select
                  value={newNotification.recipients}
                  onValueChange={(value) => setNewNotification({ ...newNotification, recipients: value })}
                >
                  <SelectTrigger id="recipients">
                    <SelectValue placeholder="Select recipients" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="residents">Residents Only</SelectItem>
                    <SelectItem value="staff">Staff Only</SelectItem>
                    <SelectItem value="managers">Managers Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="schedule"
                  checked={newNotification.schedule}
                  onCheckedChange={(checked) => setNewNotification({ ...newNotification, schedule: checked })}
                />
                <Label htmlFor="schedule">Schedule for later</Label>
              </div>
              {newNotification.schedule && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={newNotification.date}
                      onChange={(e) => setNewNotification({ ...newNotification, date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time">Time</Label>
                    <Input
                      id="time"
                      type="time"
                      value={newNotification.time}
                      onChange={(e) => setNewNotification({ ...newNotification, time: e.target.value })}
                    />
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                onClick={handleCreateNotification}
                disabled={!newNotification.title || !newNotification.message}
              >
                {newNotification.schedule ? "Schedule Notification" : "Send Notification"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}
