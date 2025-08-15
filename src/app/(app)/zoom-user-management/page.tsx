'use client'
import React, { useEffect, useState } from 'react'
import {
    Table,
    TableHeader,
    TableBody,
    TableHead,
    TableRow,
    TableCell,
} from '~/core/ui/Table'
import { Button } from '../components/base-v2/ui/Button'
import { Input } from '../components/base-v2/ui/Input'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '../components/base-v2/ui/Dialog'
import { createUnassignedZoomUserAction, getAllZoomUsersAction } from '~/lib/zoom/v2/actions'

const AdminZoomUserManagement = () => {
    const [zoomUsers, setZoomUsers] = useState<any[]>([])
    const [showDialog, setShowDialog] = useState(false)
    const [zoomEmail, setZoomEmail] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchZoomUsers = async () => {
            try {
                const zoomUsers = await getAllZoomUsersAction();
                setZoomUsers(zoomUsers);
            } catch (error) {
                setError('Failed to load zoom users. Please try again.');
            }
        }
        fetchZoomUsers();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        
        setError(null)
        setIsLoading(true)
        try {
            await createUnassignedZoomUserAction(zoomEmail);
            const updatedZoomUsers = await getAllZoomUsersAction();
            setZoomUsers(updatedZoomUsers);
            setZoomEmail('')
            setShowDialog(false)
        } catch (error) {
            console.error('Failed to create zoom user:', error);

            if (error instanceof Error) {
                setError(error.message);
            } else if (typeof error === 'string') {
                setError(error);
            } else {
                setError('Failed to create zoom user. Please try again.');
            }
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="p-2 max-w-full mx-auto ml-3 mr-3 mt-3">
            <div className="mb-6">
                <h1 className="text-2xl font-bold mb-4">Zoom User Management</h1>
                <div className="flex justify-end">
                    <Button
                        onClick={() => setShowDialog(true)}
                        variant="default"
                    >
                        Add New User
                    </Button>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Zoom User ID</TableHead>
                            <TableHead>Zoom Email</TableHead>
                            <TableHead>Tutor Name</TableHead>
                            <TableHead>Assigned</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {zoomUsers.map((user, index) => (
                            <TableRow key={index}>
                                <TableCell className="font-mono text-sm">
                                    {user.zoom_user_id}
                                </TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>{user.users?.display_name ?? "No tutor assigned"}</TableCell>
                                <TableCell>
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${user.is_assigned ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                                        {user.is_assigned ? 'Yes' : 'No'}
                                    </span>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Add New Zoom User</DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-3">
                            <div className="flex flex-col space-y-1">
                                <div className="mt-2 mb-8">
                                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                                        Make sure you have set up an alias or separate email for this address.
                                    </p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mt-1">
                                        Verification emails will be sent here.
                                    </p>
                                </div>
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    Comma Email
                                </label>
                                <Input
                                    type="email"
                                    value={zoomEmail}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setZoomEmail(e.target.value)}
                                    placeholder="user.alias@commaeducation.lk"
                                    required
                                    disabled={isLoading}
                                />
                            </div>
                            
                            {error && (
                                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                                    <p className="text-sm text-red-600 dark:text-red-400">
                                        {error}
                                    </p>
                                </div>
                            )}
                        </div>

                        <DialogFooter className="pt-4">
                            <Button 
                                type="submit" 
                                variant="default"
                                disabled={isLoading}
                            >
                                {isLoading ? 'Creating...' : 'Confirm'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}

const Page = () => {
    return (
        <>
            <AdminZoomUserManagement />
        </>
    )
}
export default Page;