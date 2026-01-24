import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { User, Bell, Shield, Palette, Mail, Lock, LogOut, Moon, Sun, Smartphone, Pencil, Check, X, Camera, Eye, EyeOff, Copy, Link as LinkIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

const Settings = () => {
    const [loading, setLoading] = useState(false);
    const [profile, setProfile] = useState<any>(null);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [bio, setBio] = useState('');
    const [email, setEmail] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState('');
    
    // Avatar Dialog State
    const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
    const [tempAvatarUrl, setTempAvatarUrl] = useState('');

    // Security Tab State
    const [isEditingPassword, setIsEditingPassword] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    useEffect(() => {
        getProfile();
    }, []);

    const getProfile = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) return;
            
            setEmail(user.email || '');

            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.warn("Error fetching profile:", error);
            }

            const metaName = user.user_metadata?.full_name || user.user_metadata?.name || '';
            const parts = metaName.split(' ');
            const metaFirst = parts[0] || '';
            const metaLast = parts.length > 1 ? parts.slice(1).join(' ') : '';

            if (data) {
                setProfile(data);
                setFirstName(data.first_name || metaFirst);
                setLastName(data.last_name || metaLast);
                setBio(data.bio || '');
                setAvatarUrl(data.avatar_url || '');
            } else {
                setFirstName(metaFirst);
                setLastName(metaLast);
                setAvatarUrl(user.user_metadata?.avatar_url || '');
            }
        } catch (error: any) {
            toast.error('Error loading user data!');
        } finally {
            setLoading(false);
        }
    };

    const updateProfile = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) throw new Error('No user logged in');

            const updates = {
                id: user.id,
                first_name: firstName,
                last_name: lastName,
                bio: bio,
                avatar_url: avatarUrl,
                updated_at: new Date(),
            };

            const { error } = await supabase.from('profiles').upsert(updates);

            if (error) throw error;
            
            toast.success('Profile updated successfully!');
            setIsEditing(false); // Exit edit mode on success
            getProfile(); // Refresh data
        } catch (error: any) {
            toast.error(error.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const openAvatarModal = () => {
        setTempAvatarUrl(avatarUrl);
        setIsAvatarModalOpen(true);
    };

    const saveAvatarUrl = () => {
        setAvatarUrl(tempAvatarUrl);
        setIsAvatarModalOpen(false);
        if (!isEditing) setIsEditing(true); // Switch to edit mode so user knows they have unsaved changes
        toast.success("Avatar updated! Don't forget to save changes.");
    };

    const getInitials = (first: string, last: string) => {
        return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
    };

    const initials = getInitials(firstName || 'U', lastName || 'User');

    const updatePassword = async () => {
        if (newPassword !== confirmPassword) {
            toast.error("New passwords do not match");
            return;
        }
        if (newPassword.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }

        try {
            setLoading(true);
            const { error } = await supabase.auth.updateUser({ password: newPassword });

            if (error) throw error;

            toast.success("Password updated successfully");
            setIsEditingPassword(false);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            toast.error(error.message || "Failed to update password");
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        toast.success("Password copied to clipboard");
    };

    return (
        <div className="container mx-auto px-6 py-10 min-h-screen max-w-6xl">
            <div className="mb-10">
                <h1 className="text-4xl font-bold tracking-tight mb-4">Settings</h1>
                <p className="text-lg text-muted-foreground">Manage your account preferences and application settings.</p>
            </div>

            <Tabs defaultValue="profile" className="w-full">
                <div className="flex flex-col md:flex-row gap-8">
                    {/* Sidebar Navigation */}
                    <aside className="md:w-64 flex-shrink-0">
                        <TabsList className="flex flex-col h-auto w-full bg-transparent p-0 gap-2">
                            <TabsTrigger 
                                value="profile" 
                                className="w-full justify-start px-4 py-3 h-auto text-base font-medium data-[state=active]:bg-secondary/50 data-[state=active]:text-foreground rounded-xl transition-all"
                            >
                                <User className="w-5 h-5 mr-3" /> Profile
                            </TabsTrigger>
                            <TabsTrigger 
                                value="appearance" 
                                className="w-full justify-start px-4 py-3 h-auto text-base font-medium data-[state=active]:bg-secondary/50 data-[state=active]:text-foreground rounded-xl transition-all"
                            >
                                <Palette className="w-5 h-5 mr-3" /> Appearance
                            </TabsTrigger>
                            <TabsTrigger 
                                value="notifications" 
                                className="w-full justify-start px-4 py-3 h-auto text-base font-medium data-[state=active]:bg-secondary/50 data-[state=active]:text-foreground rounded-xl transition-all"
                            >
                                <Bell className="w-5 h-5 mr-3" /> Notifications
                            </TabsTrigger>
                            <TabsTrigger 
                                value="security" 
                                className="w-full justify-start px-4 py-3 h-auto text-base font-medium data-[state=active]:bg-secondary/50 data-[state=active]:text-foreground rounded-xl transition-all"
                            >
                                <Shield className="w-5 h-5 mr-3" /> Security
                            </TabsTrigger>
                        </TabsList>
                    </aside>

                    {/* Content Area */}
                    <div className="flex-1">
                        {/* PROFILE TAB */}
                        <TabsContent value="profile" className="space-y-6 mt-0">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <div className="space-y-1">
                                        <CardTitle className="text-2xl">Profile Information</CardTitle>
                                        <CardDescription>Update your profile details and public information.</CardDescription>
                                    </div>
                                    {!isEditing && (
                                        <Button onClick={() => setIsEditing(true)} variant="outline" className="gap-2 shadow-sm hover:shadow-md transition-all duration-300 border-primary/20 text-primary hover:bg-primary hover:text-white hover:border-primary">
                                            <Pencil className="h-4 w-4" />
                                            Edit Profile
                                        </Button>
                                    )}
                                </CardHeader>
                                <CardContent className="space-y-8 mt-6">
                                    <div className="flex items-center gap-6">
                                        <div className="relative group">
                                            <Avatar className="w-24 h-24 border-4 border-background shadow-xl">
                                                <AvatarImage src={avatarUrl} className="object-cover" />
                                                <AvatarFallback className="text-2xl bg-primary/10 text-primary">{initials}</AvatarFallback>
                                            </Avatar>
                                            {isEditing && (
                                                <div 
                                                    className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                                    onClick={openAvatarModal}
                                                >
                                                    <Camera className="h-8 w-8 text-white" />
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            {isEditing ? (
                                                <Button variant="outline" onClick={openAvatarModal} className="mr-2 shadow-sm hover:shadow-md transition-all duration-300 border-primary/20 text-primary hover:bg-primary hover:text-white hover:border-primary">Change Avatar URL</Button>
                                            ) : (
                                                <div className="h-10 flex items-center">
                                                    <span className="text-sm text-muted-foreground italic">Click Edit to change avatar</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="firstName">First Name</Label>
                                            <Input 
                                                id="firstName" 
                                                value={firstName} 
                                                onChange={(e) => setFirstName(e.target.value)}
                                                disabled={!isEditing}
                                                className={!isEditing ? "bg-muted/50 text-muted-foreground" : ""}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="lastName">Last Name</Label>
                                            <Input 
                                                id="lastName" 
                                                value={lastName} 
                                                onChange={(e) => setLastName(e.target.value)}
                                                disabled={!isEditing}
                                                className={!isEditing ? "bg-muted/50 text-muted-foreground" : ""}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input id="email" value={email} readOnly disabled className="pl-10 bg-muted/50 text-muted-foreground cursor-not-allowed" />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="bio">Bio</Label>
                                        <textarea 
                                            className={`flex min-h-[100px] w-full rounded-md border border-input px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed ${!isEditing ? "bg-muted/50 text-muted-foreground disabled:opacity-100" : "bg-background"}`}
                                            id="bio" 
                                            placeholder="Tell us a little about yourself"
                                            value={bio}
                                            onChange={(e) => setBio(e.target.value)}
                                            disabled={!isEditing}
                                        />
                                    </div>

                                    {isEditing && (
                                        <div className="flex justify-end gap-3 pt-4 animate-in fade-in slide-in-from-bottom-2">
                                            <Button variant="outline" onClick={() => {
                                                setIsEditing(false);
                                                getProfile(); // Reset changes
                                            }} className="shadow-sm hover:shadow-md transition-all duration-300 border-primary/20 text-primary hover:bg-primary hover:text-white hover:border-primary">
                                                Cancel
                                            </Button>
                                            <Button onClick={updateProfile} disabled={loading} className="gap-2 shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-300">
                                                {loading ? 'Saving...' : (
                                                    <>
                                                        <Check className="h-4 w-4" /> Save Changes
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* APPEARANCE TAB */}
                        <TabsContent value="appearance" className="space-y-6 mt-0">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Appearance</CardTitle>
                                    <CardDescription>Customize the look and feel of the application.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-4">
                                        <Label>Theme Preference</Label>
                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="cursor-pointer space-y-2">
                                                <div className="h-24 rounded-lg bg-slate-100 border-2 border-primary shadow-sm flex items-center justify-center">
                                                    <Sun className="h-8 w-8 text-orange-500" />
                                                </div>
                                                <div className="text-center text-sm font-medium">Light</div>
                                            </div>
                                            <div className="cursor-pointer space-y-2">
                                                <div className="h-24 rounded-lg bg-slate-950 border-2 border-transparent hover:border-primary/50 transition-all flex items-center justify-center">
                                                    <Moon className="h-8 w-8 text-blue-400" />
                                                </div>
                                                <div className="text-center text-sm font-medium">Dark</div>
                                            </div>
                                            <div className="cursor-pointer space-y-2">
                                                <div className="h-24 rounded-lg bg-slate-200 border-2 border-transparent hover:border-primary/50 transition-all flex items-center justify-center">
                                                    <Smartphone className="h-8 w-8 text-slate-600" />
                                                </div>
                                                <div className="text-center text-sm font-medium">System</div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* NOTIFICATIONS TAB */}
                        <TabsContent value="notifications" className="space-y-6 mt-0">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Notifications</CardTitle>
                                    <CardDescription>Configure how you receive alerts and updates.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="flex items-center justify-between space-x-2">
                                        <Label htmlFor="email-notifs" className="flex flex-col space-y-1">
                                            <span>Email Notifications</span>
                                            <span className="font-normal text-xs text-muted-foreground">Receive daily summaries and critical alerts via email.</span>
                                        </Label>
                                        <Switch id="email-notifs" defaultChecked />
                                    </div>
                                    <div className="flex items-center justify-between space-x-2">
                                        <Label htmlFor="push-notifs" className="flex flex-col space-y-1">
                                            <span>Push Notifications</span>
                                            <span className="font-normal text-xs text-muted-foreground">Receive real-time alerts on your device.</span>
                                        </Label>
                                        <Switch id="push-notifs" defaultChecked />
                                    </div>
                                    <div className="flex items-center justify-between space-x-2">
                                        <Label htmlFor="marketing-emails" className="flex flex-col space-y-1">
                                            <span>Product Updates</span>
                                            <span className="font-normal text-xs text-muted-foreground">Receive news about new features and updates.</span>
                                        </Label>
                                        <Switch id="marketing-emails" />
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* SECURITY TAB */}
                        <TabsContent value="security" className="space-y-6 mt-0">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <div className="space-y-1">
                                        <CardTitle className="text-2xl">Security</CardTitle>
                                        <CardDescription>Manage your password and account security settings.</CardDescription>
                                    </div>
                                    {!isEditingPassword && (
                                        <Button onClick={() => setIsEditingPassword(true)} variant="outline" className="gap-2 shadow-sm hover:shadow-md transition-all duration-300 border-primary/20 text-primary hover:bg-primary hover:text-white hover:border-primary">
                                            <Pencil className="h-4 w-4" />
                                            Edit Password
                                        </Button>
                                    )}
                                </CardHeader>
                                <CardContent className="space-y-6 mt-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="current-password">Current Password</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input 
                                                id="current-password" 
                                                type={showCurrentPassword ? "text" : "password"} 
                                                className={`pl-10 pr-20 ${!isEditingPassword ? "bg-muted/50 text-muted-foreground" : ""}`}
                                                value={currentPassword}
                                                onChange={(e) => setCurrentPassword(e.target.value)}
                                                disabled={!isEditingPassword}
                                                placeholder={isEditingPassword ? "Enter current password" : "••••••••"}
                                            />
                                            <div className="absolute right-3 top-2.5 flex items-center gap-2">
                                                {isEditingPassword && (
                                                    <button 
                                                        type="button"
                                                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                                        className="text-muted-foreground hover:text-primary transition-colors p-1"
                                                    >
                                                        {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                    </button>
                                                )}
                                                {isEditingPassword && (
                                                    <button 
                                                        type="button"
                                                        onClick={() => copyToClipboard(currentPassword)}
                                                        className="text-muted-foreground hover:text-primary transition-colors p-1"
                                                        title="Copy password"
                                                    >
                                                        <Copy className="h-4 w-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="new-password">New Password</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input 
                                                id="new-password" 
                                                type={showNewPassword ? "text" : "password"} 
                                                className={`pl-10 pr-10 ${!isEditingPassword ? "bg-muted/50 text-muted-foreground" : ""}`}
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                disabled={!isEditingPassword}
                                                placeholder={isEditingPassword ? "Enter new password" : "••••••••"}
                                            />
                                            {isEditingPassword && (
                                                <button 
                                                    type="button"
                                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                                                >
                                                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="confirm-password">Confirm New Password</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input 
                                                id="confirm-password" 
                                                type={showConfirmPassword ? "text" : "password"} 
                                                className={`pl-10 pr-10 ${!isEditingPassword ? "bg-muted/50 text-muted-foreground" : ""}`}
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                disabled={!isEditingPassword}
                                                placeholder={isEditingPassword ? "Confirm new password" : "••••••••"}
                                            />
                                            {isEditingPassword && (
                                                <button 
                                                    type="button"
                                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                                                >
                                                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {isEditingPassword && (
                                        <div className="flex justify-end gap-3 pt-4 animate-in fade-in slide-in-from-bottom-2">
                                            <Button variant="outline" onClick={() => {
                                                setIsEditingPassword(false);
                                                // Reset fields
                                                setCurrentPassword('');
                                                setNewPassword('');
                                                setConfirmPassword('');
                                            }} className="shadow-sm hover:shadow-md transition-all duration-300 border-primary/20 text-primary hover:bg-primary hover:text-white hover:border-primary">
                                                Cancel
                                            </Button>
                                            <Button onClick={updatePassword} disabled={loading} className="gap-2 shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-300">
                                                {loading ? 'Updating...' : (
                                                    <>
                                                        <Check className="h-4 w-4" /> Update Password
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    )}

                                    <div className="pt-6 border-t mt-4">
                                        <h3 className="text-lg font-medium text-destructive mb-4">Danger Zone</h3>
                                        <Button variant="destructive" className="w-full sm:w-auto shadow-sm hover:shadow-red-500/25 transition-all duration-300">
                                            <LogOut className="w-4 h-4 mr-2" /> Sign out of all devices
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </div>
                </div>
            </Tabs>

            {/* Avatar Update Modal */}
            <Dialog open={isAvatarModalOpen} onOpenChange={setIsAvatarModalOpen}>
                <DialogContent className="w-[90vw] max-w-md rounded-xl">
                    <DialogHeader>
                        <DialogTitle>Update Profile Picture</DialogTitle>
                        <DialogDescription>
                            Enter a URL for your new profile picture.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex items-center space-x-2 py-4">
                        <div className="grid flex-1 gap-2">
                            <Label htmlFor="avatarUrl" className="sr-only">Avatar URL</Label>
                            <div className="relative">
                                <LinkIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="avatarUrl"
                                    placeholder="https://example.com/avatar.jpg"
                                    value={tempAvatarUrl}
                                    onChange={(e) => setTempAvatarUrl(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                        </div>
                    </div>
                    {tempAvatarUrl && (
                        <div className="flex justify-center py-4 bg-muted/30 rounded-lg mb-4">
                            <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                                <AvatarImage src={tempAvatarUrl} className="object-cover" />
                                <AvatarFallback>Pre</AvatarFallback>
                            </Avatar>
                        </div>
                    )}
                    <DialogFooter className="flex-row justify-end space-x-2 sm:space-x-2">
                        <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => setIsAvatarModalOpen(false)}
                            className="shadow-sm hover:shadow-md transition-all duration-300 border-primary/20 text-primary hover:bg-primary hover:text-white hover:border-primary"
                        >
                            Cancel
                        </Button>
                        <Button 
                            type="button" 
                            onClick={saveAvatarUrl} 
                            className="shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-300"
                        >
                            Set Avatar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Settings;
