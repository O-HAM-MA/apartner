"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { Shield, MoreHorizontal, Plus } from "lucide-react"

// Mock data for roles
// Define the Role type
interface Role {
  id: string
  name: string
  description: string
  permissions: string[]
  usersCount: number
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([
    {
      id: "1",
      name: "Administrator",
      description: "Full access to all system features",
      permissions: ["users:read", "users:write", "roles:read", "roles:write", "settings:read", "settings:write"],
      usersCount: 3,
    },
    {
      id: "2",
      name: "Property Manager",
      description: "Manage properties and residents",
      permissions: ["users:read", "users:write", "settings:read"],
      usersCount: 8,
    },
    {
      id: "3",
      name: "Maintenance Staff",
      description: "Handle maintenance requests",
      permissions: ["users:read", "settings:read"],
      usersCount: 12,
    },
    {
      id: "4",
      name: "Resident",
      description: "Basic access to resident features",
      permissions: ["settings:read"],
      usersCount: 245,
    },
  ])
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddRoleDialogOpen, setIsAddRoleDialogOpen] = useState(false)
  const [isEditRoleDialogOpen, setIsEditRoleDialogOpen] = useState(false)
  const [isDeleteRoleDialogOpen, setIsDeleteRoleDialogOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState(null)
  const [newRole, setNewRole] = useState<Partial<Role>>({
    name: "",
    description: "",
    permissions: [],
  })
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const filteredRoles = roles.filter(
    (role) =>
      role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.description.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleAddRole = () => {
    const roleToAdd = {
      id: roles.length + 1,
      name: newRole.name,
      description: newRole.description,
      usersCount: 0,
      permissions: newRole.permissions,
    }

    setRoles([...roles, roleToAdd])
    setNewRole({ name: "", description: "", permissions: [] })
    setIsAddRoleDialogOpen(false)
  }

  const handleEditRole = () => {
    setRoles(roles.map((role) => (role.id === selectedRole.id ? selectedRole : role)))
    setIsEditRoleDialogOpen(false)
  }

  const handleDeleteRole = () => {
    setRoles(roles.filter((role) => role.id !== selectedRole.id))
    setIsDeleteRoleDialogOpen(false)
  }

  const togglePermission = (permissionId, roleToUpdate) => {
    if (roleToUpdate.permissions.includes(permissionId)) {
      return {
        ...roleToUpdate,
        permissions: roleToUpdate.permissions.filter((id) => id !== permissionId),
      }
    } else {
      return {
        ...roleToUpdate,
        permissions: [...roleToUpdate.permissions, permissionId],
      }
    }
  }

  const handleCreateRole = () => {
    if (newRole.name && newRole.permissions && newRole.permissions.length > 0) {
      const role: Role = {
        id: `${roles.length + 1}`,
        name: newRole.name,
        description: newRole.description || "",
        permissions: newRole.permissions,
        usersCount: 0,
      }

      setRoles([...roles, role])
      setNewRole({ name: "", description: "", permissions: [] })
      setIsDialogOpen(false)
    }
  }

  const togglePermission2 = (permission: string) => {
    if (!newRole.permissions) return

    setNewRole({
      ...newRole,
      permissions: newRole.permissions.includes(permission)
        ? newRole.permissions.filter((p) => p !== permission)
        : [...newRole.permissions, permission],
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Role Management</h1>
          <p className="text-muted-foreground">Define roles and permissions for system users</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Role
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Role</DialogTitle>
              <DialogDescription>Define a new role with specific permissions.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Role Name</Label>
                <Input
                  id="name"
                  value={newRole.name}
                  onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                  placeholder="e.g. Support Agent"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={newRole.description}
                  onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                  placeholder="Brief description of this role"
                />
              </div>
              <div className="grid gap-2">
                <Label>Permissions</Label>
                <div className="space-y-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {["users:read", "users:write", "roles:read", "roles:write", "settings:read", "settings:write"].map(
                      (permission) => (
                        <div key={permission} className="flex items-center space-x-2">
                          <Checkbox
                            id={permission}
                            checked={newRole.permissions?.includes(permission) || false}
                            onCheckedChange={() => togglePermission2(permission)}
                          />
                          <Label htmlFor={permission} className="capitalize">
                            {permission.split(":")[0]} ({permission.split(":")[1]})
                          </Label>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateRole}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Roles</CardTitle>
          <CardDescription>Manage roles and permissions for your organization</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell className="font-medium">{role.name}</TableCell>
                    <TableCell>{role.description}</TableCell>
                    <TableCell>{role.usersCount}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem>
                            <Shield className="mr-2 h-4 w-4" />
                            View Permissions
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>Edit</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
