"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, MoreHorizontal, UserPlus, Edit, Trash, Eye, Key } from "lucide-react"

// Mock data for admin accounts
const mockAdmins = [
  {
    id: 1,
    name: "John Admin",
    email: "john.admin@example.com",
    role: "Super Admin",
    lastLogin: "2023-05-15 14:30",
    status: "active",
  },
  {
    id: 2,
    name: "Sarah Manager",
    email: "sarah.manager@example.com",
    role: "Manager",
    lastLogin: "2023-05-14 09:15",
    status: "active",
  },
  {
    id: 3,
    name: "Mike Support",
    email: "mike.support@example.com",
    role: "Support",
    lastLogin: "2023-05-10 11:45",
    status: "inactive",
  },
  {
    id: 4,
    name: "Lisa Editor",
    email: "lisa.editor@example.com",
    role: "Content Editor",
    lastLogin: "2023-05-13 16:20",
    status: "active",
  },
]

// Available roles
const adminRoles = ["Super Admin", "Manager", "Support", "Content Editor", "Analyst"]

export default function AdminAccountsPage() {
  const [admins, setAdmins] = useState(mockAdmins)
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false)
  const [selectedAdmin, setSelectedAdmin] = useState(null)
  const [newAdmin, setNewAdmin] = useState({
    name: "",
    email: "",
    role: "",
    password: "",
    confirmPassword: "",
  })

  const filteredAdmins = admins.filter(
    (admin) =>
      admin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      admin.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      admin.role.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleAddAdmin = () => {
    if (newAdmin.password !== newAdmin.confirmPassword) {
      alert("Passwords do not match")
      return
    }

    const adminToAdd = {
      id: admins.length + 1,
      name: newAdmin.name,
      email: newAdmin.email,
      role: newAdmin.role,
      lastLogin: "Never",
      status: "active",
    }

    setAdmins([...admins, adminToAdd])
    setNewAdmin({ name: "", email: "", role: "", password: "", confirmPassword: "" })
    setIsAddDialogOpen(false)
  }

  const handleEditAdmin = () => {
    setAdmins(admins.map((admin) => (admin.id === selectedAdmin.id ? selectedAdmin : admin)))
    setIsEditDialogOpen(false)
  }

  const handleDeleteAdmin = () => {
    setAdmins(admins.filter((admin) => admin.id !== selectedAdmin.id))
    setIsDeleteDialogOpen(false)
  }

  const handleStatusChange = (adminId, newStatus) => {
    setAdmins(admins.map((admin) => (admin.id === adminId ? { ...admin, status: newStatus } : admin)))
  }

  const handleResetPassword = () => {
    // In a real application, this would trigger a password reset email
    alert(`Password reset link sent to ${selectedAdmin.email}`)
    setIsResetPasswordDialogOpen(false)
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Administrator Accounts</h2>
          <p className="text-muted-foreground">Manage administrator accounts and access permissions</p>
        </div>
        <Button className="flex items-center gap-2" onClick={() => setIsAddDialogOpen(true)}>
          <UserPlus className="h-4 w-4" />
          Add Administrator
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Administrators</CardTitle>
          <CardDescription>View and manage administrator accounts with system access.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search administrators..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAdmins.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No administrators found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAdmins.map((admin) => (
                    <TableRow key={admin.id}>
                      <TableCell className="font-medium">{admin.name}</TableCell>
                      <TableCell>{admin.email}</TableCell>
                      <TableCell>{admin.role}</TableCell>
                      <TableCell>{admin.lastLogin}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div
                            className={`h-2 w-2 rounded-full ${
                              admin.status === "active" ? "bg-green-500" : "bg-red-500"
                            }`}
                          />
                          <span className="capitalize">{admin.status}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedAdmin(admin)
                                // View details functionality would go here
                              }}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedAdmin(admin)
                                setIsEditDialogOpen(true)
                              }}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Account
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedAdmin(admin)
                                setIsResetPasswordDialogOpen(true)
                              }}
                            >
                              <Key className="mr-2 h-4 w-4" />
                              Reset Password
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {admin.status === "active" ? (
                              <DropdownMenuItem onClick={() => handleStatusChange(admin.id, "inactive")}>
                                <Trash className="mr-2 h-4 w-4" />
                                Deactivate
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => handleStatusChange(admin.id, "active")}>
                                <Trash className="mr-2 h-4 w-4" />
                                Activate
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => {
                                setSelectedAdmin(admin)
                                setIsDeleteDialogOpen(true)
                              }}
                            >
                              <Trash className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add Administrator Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Administrator</DialogTitle>
            <DialogDescription>Create a new administrator account with system access.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="name" className="font-medium">
                Full Name
              </label>
              <Input
                id="name"
                placeholder="Enter full name"
                value={newAdmin.name}
                onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="email" className="font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="Enter email address"
                value={newAdmin.email}
                onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="role" className="font-medium">
                Role
              </label>
              <Select value={newAdmin.role} onValueChange={(value) => setNewAdmin({ ...newAdmin, role: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {adminRoles.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <label htmlFor="password" className="font-medium">
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="Enter password"
                value={newAdmin.password}
                onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="confirmPassword" className="font-medium">
                Confirm Password
              </label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm password"
                value={newAdmin.confirmPassword}
                onChange={(e) => setNewAdmin({ ...newAdmin, confirmPassword: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddAdmin}
              disabled={
                !newAdmin.name || !newAdmin.email || !newAdmin.role || !newAdmin.password || !newAdmin.confirmPassword
              }
            >
              Add Administrator
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Administrator Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Administrator</DialogTitle>
            <DialogDescription>Update administrator account details.</DialogDescription>
          </DialogHeader>

          {selectedAdmin && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="edit-name" className="font-medium">
                  Full Name
                </label>
                <Input
                  id="edit-name"
                  value={selectedAdmin.name}
                  onChange={(e) => setSelectedAdmin({ ...selectedAdmin, name: e.target.value })}
                />
              </div>

              <div className="grid gap-2">
                <label htmlFor="edit-email" className="font-medium">
                  Email
                </label>
                <Input
                  id="edit-email"
                  type="email"
                  value={selectedAdmin.email}
                  onChange={(e) => setSelectedAdmin({ ...selectedAdmin, email: e.target.value })}
                />
              </div>

              <div className="grid gap-2">
                <label htmlFor="edit-role" className="font-medium">
                  Role
                </label>
                <Select
                  value={selectedAdmin.role}
                  onValueChange={(value) => setSelectedAdmin({ ...selectedAdmin, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {adminRoles.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <label htmlFor="edit-status" className="font-medium">
                  Status
                </label>
                <Select
                  value={selectedAdmin.status}
                  onValueChange={(value) => setSelectedAdmin({ ...selectedAdmin, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleEditAdmin}
              disabled={!selectedAdmin?.name || !selectedAdmin?.email || !selectedAdmin?.role}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Administrator Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the administrator account for {selectedAdmin?.name}? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteAdmin}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>Send a password reset link to {selectedAdmin?.email}?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResetPasswordDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleResetPassword}>Send Reset Link</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
