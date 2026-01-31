import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { User, Bell, Shield, Palette, Mail, Lock, LogOut, Moon, Sun, Smartphone, Pencil, Check, X, Camera, Eye, EyeOff, Copy, Link as LinkIcon, Type, Rat, Eye as EyeIcon, Stethoscope, Database, Share2, HelpCircle, Activity, FileText, Download, Cloud } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useTheme } from '@/contexts/ThemeContext';

const Settings = () => {
    const [loading, setLoading] = useState(false);
    const [profile, setProfile] = useState<any>(null);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [bio, setBio] = useState('');
    const [email, setEmail] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState('');
    
    // Theme Context
    const { 
        theme, setTheme, 
        fontSize, setFontSize, 
        fontStyle, setFontStyle,
        reducedMotion, setReducedMotion, 
        highContrast, setHighContrast 
    } = useTheme();

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
                                value="security" 
                                className="w-full justify-start px-4 py-3 h-auto text-base font-medium data-[state=active]:bg-secondary/50 data-[state=active]:text-foreground rounded-xl transition-all"
                            >
                                <Shield className="w-5 h-5 mr-3" /> Security
                            </TabsTrigger>
                            <TabsTrigger 
                                value="appearance" 
                                className="w-full justify-start px-4 py-3 h-auto text-base font-medium data-[state=active]:bg-secondary/50 data-[state=active]:text-foreground rounded-xl transition-all"
                            >
                                <Palette className="w-5 h-5 mr-3" /> Appearance
                            </TabsTrigger>
                            <TabsTrigger 
                                value="integrations" 
                                className="w-full justify-start px-4 py-3 h-auto text-base font-medium data-[state=active]:bg-secondary/50 data-[state=active]:text-foreground rounded-xl transition-all"
                            >
                                <Share2 className="w-5 h-5 mr-3" /> Integrations
                            </TabsTrigger>
                            <TabsTrigger 
                                value="notifications" 
                                className="w-full justify-start px-4 py-3 h-auto text-base font-medium data-[state=active]:bg-secondary/50 data-[state=active]:text-foreground rounded-xl transition-all"
                            >
                                <Bell className="w-5 h-5 mr-3" /> Notifications
                            </TabsTrigger>
                            <TabsTrigger 
                                value="clinical" 
                                className="w-full justify-start px-4 py-3 h-auto text-base font-medium data-[state=active]:bg-secondary/50 data-[state=active]:text-foreground rounded-xl transition-all"
                            >
                                <Stethoscope className="w-5 h-5 mr-3" /> Clinical Preference
                            </TabsTrigger>
                            <TabsTrigger 
                                value="data" 
                                className="w-full justify-start px-4 py-3 h-auto text-base font-medium data-[state=active]:bg-secondary/50 data-[state=active]:text-foreground rounded-xl transition-all"
                            >
                                <Database className="w-5 h-5 mr-3" /> Data & Privacy
                            </TabsTrigger>
                            <TabsTrigger 
                                value="support" 
                                className="w-full justify-start px-4 py-3 h-auto text-base font-medium data-[state=active]:bg-secondary/50 data-[state=active]:text-foreground rounded-xl transition-all"
                            >
                                <HelpCircle className="w-5 h-5 mr-3" /> Help & Support
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
                                <CardContent className="space-y-8">
                                    {/* Theme Selection */}
                                    <div className="space-y-4">
                                        <Label className="text-base">Theme Preference</Label>
                                        <div className="grid grid-cols-3 gap-4">
                                            <div 
                                                onClick={() => setTheme('light')}
                                                className={`cursor-pointer space-y-2 p-2 rounded-xl transition-all ${theme === 'light' ? 'ring-2 ring-primary ring-offset-2 bg-secondary/50' : 'hover:bg-secondary/30'}`}
                                            >
                                                <div className="h-24 rounded-lg bg-slate-100 border-2 border-slate-200 shadow-sm flex items-center justify-center relative overflow-hidden group">
                                                    <div className="absolute top-0 right-0 p-2 bg-white rounded-bl-lg shadow-sm">
                                                        <div className="w-2 h-2 rounded-full bg-orange-400"></div>
                                                    </div>
                                                    <Sun className={`h-8 w-8 text-orange-500 transition-transform ${theme === 'light' ? 'scale-110' : 'group-hover:scale-110'}`} />
                                                </div>
                                                <div className="text-center text-sm font-medium flex items-center justify-center gap-2">
                                                    Light
                                                    {theme === 'light' && <Check className="w-3 h-3 text-primary" />}
                                                </div>
                                            </div>
                                            <div 
                                                onClick={() => setTheme('dark')}
                                                className={`cursor-pointer space-y-2 p-2 rounded-xl transition-all ${theme === 'dark' ? 'ring-2 ring-primary ring-offset-2 bg-secondary/50' : 'hover:bg-secondary/30'}`}
                                            >
                                                <div className="h-24 rounded-lg bg-slate-950 border-2 border-slate-800 shadow-sm flex items-center justify-center relative overflow-hidden group">
                                                    <div className="absolute top-0 right-0 p-2 bg-slate-800 rounded-bl-lg shadow-sm">
                                                        <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                                                    </div>
                                                    <Moon className={`h-8 w-8 text-blue-400 transition-transform ${theme === 'dark' ? 'scale-110' : 'group-hover:scale-110'}`} />
                                                </div>
                                                <div className="text-center text-sm font-medium flex items-center justify-center gap-2">
                                                    Dark
                                                    {theme === 'dark' && <Check className="w-3 h-3 text-primary" />}
                                                </div>
                                            </div>
                                            <div 
                                                onClick={() => setTheme('system')}
                                                className={`cursor-pointer space-y-2 p-2 rounded-xl transition-all ${theme === 'system' ? 'ring-2 ring-primary ring-offset-2 bg-secondary/50' : 'hover:bg-secondary/30'}`}
                                            >
                                                <div className="h-24 rounded-lg bg-gradient-to-br from-slate-100 to-slate-900 border-2 border-slate-200 flex items-center justify-center relative overflow-hidden group">
                                                    <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px]"></div>
                                                    <Smartphone className={`h-8 w-8 text-slate-600 dark:text-slate-300 relative z-10 transition-transform ${theme === 'system' ? 'scale-110' : 'group-hover:scale-110'}`} />
                                                </div>
                                                <div className="text-center text-sm font-medium flex items-center justify-center gap-2">
                                                    System
                                                    {theme === 'system' && <Check className="w-3 h-3 text-primary" />}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Font Style */}
                                    <div className="space-y-4 pt-4 border-t">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-base flex items-center gap-2">
                                                <Type className="w-4 h-4" /> 
                                                Font Style
                                            </Label>
                                            <Select value={fontStyle} onValueChange={(value: any) => setFontStyle(value)}>
                                                <SelectTrigger className="w-[180px]">
                                                    <SelectValue placeholder="Select font" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="default" className="focus:bg-primary focus:text-primary-foreground cursor-pointer">Default</SelectItem>
                                                    <SelectItem value="google-sans" className="font-['Google_Sans'] focus:bg-primary focus:text-primary-foreground cursor-pointer">Google Sans</SelectItem>
                                                    <SelectItem value="nunito-sans" className="font-['Nunito_Sans'] focus:bg-primary focus:text-primary-foreground cursor-pointer">Nunito Sans</SelectItem>
                                                    <SelectItem value="inter" className="font-['Inter'] focus:bg-primary focus:text-primary-foreground cursor-pointer">Inter</SelectItem>
                                                    <SelectItem value="dm-sans" className="font-['DM_Sans'] focus:bg-primary focus:text-primary-foreground cursor-pointer">DM Sans</SelectItem>
                                                    <SelectItem value="ibm-plex-sans" className="font-['IBM_Plex_Sans'] focus:bg-primary focus:text-primary-foreground cursor-pointer">IBM Plex Sans</SelectItem>
                                                    <SelectItem value="roboto" className="font-['Roboto'] focus:bg-primary focus:text-primary-foreground cursor-pointer">Roboto</SelectItem>
                                                    <SelectItem value="playfair-display" className="font-['Playfair_Display'] focus:bg-primary focus:text-primary-foreground cursor-pointer">Playfair Display</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    {/* Font Size */}
                                    <div className="space-y-4 pt-4 border-t">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-base flex items-center gap-2">
                                                <Type className="w-4 h-4" /> 
                                                Font Size
                                            </Label>
                                            <span className="text-sm text-muted-foreground capitalize">{fontSize}</span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-4">
                                            <Button 
                                                variant={fontSize === 'small' ? 'default' : 'outline'}
                                                onClick={() => setFontSize('small')}
                                                className={`h-12 text-sm transition-all duration-200 ${fontSize === 'small' ? 'shadow-md scale-[1.02]' : 'hover:border-primary hover:text-primary hover:bg-primary/5'}`}
                                            >
                                                Aa Small
                                            </Button>
                                            <Button 
                                                variant={fontSize === 'medium' ? 'default' : 'outline'}
                                                onClick={() => setFontSize('medium')}
                                                className={`h-12 text-base transition-all duration-200 ${fontSize === 'medium' ? 'shadow-md scale-[1.02]' : 'hover:border-primary hover:text-primary hover:bg-primary/5'}`}
                                            >
                                                Aa Medium
                                            </Button>
                                            <Button 
                                                variant={fontSize === 'large' ? 'default' : 'outline'}
                                                onClick={() => setFontSize('large')}
                                                className={`h-12 text-lg transition-all duration-200 ${fontSize === 'large' ? 'shadow-md scale-[1.02]' : 'hover:border-primary hover:text-primary hover:bg-primary/5'}`}
                                            >
                                                Aa Large
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Accessibility */}
                                    <div className="space-y-4 pt-4 border-t">
                                        <Label className="text-base flex items-center gap-2 mb-4">
                                            <EyeIcon className="w-4 h-4" /> 
                                            Accessibility
                                        </Label>
                                        
                                        <div className="flex items-center justify-between space-x-2 p-3 rounded-lg border border-transparent hover:bg-secondary/40 hover:border-border/50 transition-all duration-200">
                                            <Label htmlFor="reduced-motion" className="flex flex-col space-y-1 cursor-pointer flex-1">
                                                <span>Reduced Motion</span>
                                                <span className="font-normal text-xs text-muted-foreground">Minimize animations and movement.</span>
                                            </Label>
                                            <Switch 
                                                id="reduced-motion" 
                                                checked={reducedMotion}
                                                onCheckedChange={setReducedMotion}
                                                className="data-[state=checked]:bg-primary"
                                            />
                                        </div>

                                        <div className="flex items-center justify-between space-x-2 p-3 rounded-lg border border-transparent hover:bg-secondary/40 hover:border-border/50 transition-all duration-200">
                                            <Label htmlFor="high-contrast" className="flex flex-col space-y-1 cursor-pointer flex-1">
                                                <span>High Contrast</span>
                                                <span className="font-normal text-xs text-muted-foreground">Increase contrast for better visibility.</span>
                                            </Label>
                                            <Switch 
                                                id="high-contrast" 
                                                checked={highContrast}
                                                onCheckedChange={setHighContrast}
                                                className="data-[state=checked]:bg-primary"
                                            />
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

                        {/* CLINICAL TAB */}
                        <TabsContent value="clinical" className="space-y-6 mt-0">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Clinical Preferences</CardTitle>
                                    <CardDescription>Customize your clinical workspace and analysis parameters.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="flex items-center justify-between space-x-2">
                                        <Label htmlFor="risk-threshold" className="flex flex-col space-y-1">
                                            <span>High Risk Alert Threshold</span>
                                            <span className="font-normal text-xs text-muted-foreground">Set the confidence score threshold for high-risk alerts (default: 85%).</span>
                                        </Label>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium">85%</span>
                                            <Button variant="outline" size="sm" className="h-8 shadow-sm hover:shadow-md transition-all duration-300 border-primary/20 text-primary hover:bg-primary hover:text-white hover:border-primary">Adjust</Button>
                                        </div>
                                    </div>

                                    <div className="space-y-4 pt-4 border-t">
                                        <div className="flex items-center justify-between">
                                            <Label className="flex flex-col space-y-1">
                                                <span>Diagnostic Standard</span>
                                                <span className="font-normal text-xs text-muted-foreground">Select the clinical criteria used for validation.</span>
                                            </Label>
                                            <Select defaultValue="mds">
                                                <SelectTrigger className="w-[230px] justify-between text-left">
                                                    <SelectValue placeholder="Select criteria" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="mds" className="focus:bg-primary focus:text-primary-foreground cursor-pointer">MDS Clinical Criteria</SelectItem>
                                                    <SelectItem value="ukbb" className="focus:bg-primary focus:text-primary-foreground cursor-pointer">UK Brain Bank</SelectItem>
                                                    <SelectItem value="gelb" className="focus:bg-primary focus:text-primary-foreground cursor-pointer">Gelb Criteria</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="space-y-4 pt-4 border-t">
                                        <div className="flex items-center justify-between">
                                            <Label className="flex flex-col space-y-1">
                                                <span>Analysis Mode</span>
                                                <span className="font-normal text-xs text-muted-foreground">Choose the primary model architecture for predictions.</span>
                                            </Label>
                                            <Select defaultValue="ensemble">
                                                <SelectTrigger className="w-[230px] justify-between text-left">
                                                    <SelectValue placeholder="Select mode" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="standard" className="focus:bg-primary focus:text-primary-foreground cursor-pointer">Standard (Fast)</SelectItem>
                                                    <SelectItem value="ensemble" className="focus:bg-primary focus:text-primary-foreground cursor-pointer">Ensemble Method (Accurate)</SelectItem>
                                                    <SelectItem value="experimental" className="focus:bg-primary focus:text-primary-foreground cursor-pointer">Experimental (Beta)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="space-y-4 pt-4 border-t">
                                        <div className="flex items-center justify-between">
                                            <Label className="flex flex-col space-y-1">
                                                <span>Default Dashboard View</span>
                                                <span className="font-normal text-xs text-muted-foreground">Set the primary view when logging in.</span>
                                            </Label>
                                            <Select defaultValue="overview">
                                                <SelectTrigger className="w-[230px] justify-between text-left">
                                                    <SelectValue placeholder="Select view" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="overview" className="focus:bg-primary focus:text-primary-foreground cursor-pointer">Risk Overview</SelectItem>
                                                    <SelectItem value="patients" className="focus:bg-primary focus:text-primary-foreground cursor-pointer">Patient List</SelectItem>
                                                    <SelectItem value="activity" className="focus:bg-primary focus:text-primary-foreground cursor-pointer">Recent Activity</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between space-x-2 pt-4 border-t">
                                        <Label htmlFor="auto-report" className="flex flex-col space-y-1">
                                            <span>Automated Reporting</span>
                                            <span className="font-normal text-xs text-muted-foreground">Automatically generate PDF reports after analysis completion.</span>
                                        </Label>
                                        <Switch id="auto-report" />
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* INTEGRATIONS TAB */}
                        <TabsContent value="integrations" className="space-y-6 mt-0">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Integrations</CardTitle>
                                    <CardDescription>Manage connections with external systems and devices.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="flex items-center justify-between p-4 border rounded-lg">
                                        <div className="flex items-center gap-4">
                                            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                                <Activity className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <div>
                                                <h4 className="font-medium">EHR System</h4>
                                                <p className="text-sm text-muted-foreground">Connect to hospital Electronic Health Records.</p>
                                            </div>
                                        </div>
                                        <Button variant="outline" className="shadow-sm hover:shadow-md transition-all duration-300 border-primary/20 text-primary hover:bg-primary hover:text-white hover:border-primary">Connect</Button>
                                    </div>
                                    <div className="flex items-center justify-between p-4 border rounded-lg">
                                        <div className="flex items-center gap-4">
                                            <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                                <Smartphone className="h-6 w-6 text-green-600 dark:text-green-400" />
                                            </div>
                                            <div>
                                                <h4 className="font-medium">Wearable Devices</h4>
                                                <p className="text-sm text-muted-foreground">Sync data from patient wearables.</p>
                                            </div>
                                        </div>
                                        <Button variant="outline" className="shadow-sm hover:shadow-md transition-all duration-300 border-primary/20 text-primary hover:bg-primary hover:text-white hover:border-primary">Manage</Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* DATA TAB */}
                        <TabsContent value="data" className="space-y-6 mt-0">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Data & Privacy</CardTitle>
                                    <CardDescription>Manage your data, exports, and privacy settings.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-4">
                                        <h4 className="text-sm font-medium">Data Export</h4>
                                        <div className="flex items-center justify-between p-4 border rounded-lg">
                                            <div className="flex items-center gap-4">
                                                <FileText className="h-5 w-5 text-muted-foreground" />
                                                <div className="space-y-1">
                                                    <p className="text-sm font-medium">Patient Records (CSV)</p>
                                                    <p className="text-xs text-muted-foreground">Export all patient analysis records.</p>
                                                </div>
                                            </div>
                                            <Button variant="outline" size="sm" className="shadow-sm hover:shadow-md transition-all duration-300 border-primary/20 text-primary hover:bg-primary hover:text-white hover:border-primary">
                                                <Download className="h-4 w-4 mr-2" /> Export
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="pt-4 border-t">
                                        <h4 className="text-sm font-medium mb-4">Storage & Retention</h4>
                                        <div className="flex items-center justify-between space-x-2">
                                            <Label htmlFor="local-cache" className="flex flex-col space-y-1">
                                                <span>Local Caching</span>
                                                <span className="font-normal text-xs text-muted-foreground">Cache patient data locally for faster access (Encrypted).</span>
                                            </Label>
                                            <Switch id="local-cache" defaultChecked />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* SUPPORT TAB */}
                        <TabsContent value="support" className="space-y-6 mt-0">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Help & Support</CardTitle>
                                    <CardDescription>Get help with the platform.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="p-4 border rounded-xl hover:bg-secondary/50 transition-colors cursor-pointer group">
                                            <div className="mb-3">
                                                <FileText className="h-6 w-6 text-primary group-hover:scale-110 transition-transform" />
                                            </div>
                                            <h4 className="font-medium mb-1">Documentation</h4>
                                            <p className="text-sm text-muted-foreground">Read the user guide and API docs.</p>
                                        </div>
                                        <div className="p-4 border rounded-xl hover:bg-secondary/50 transition-colors cursor-pointer group">
                                            <div className="mb-3">
                                                <HelpCircle className="h-6 w-6 text-primary group-hover:scale-110 transition-transform" />
                                            </div>
                                            <h4 className="font-medium mb-1">Contact Support</h4>
                                            <p className="text-sm text-muted-foreground">Get in touch with our support team.</p>
                                        </div>
                                    </div>
                                    <div className="mt-6 p-4 bg-muted/30 rounded-lg">
                                        <h4 className="font-medium mb-2">Version Information</h4>
                                        <div className="text-sm text-muted-foreground space-y-1">
                                            <p>Platform Version: 2.1.0-beta</p>
                                            <p>Model Version: PD-Net v4.2</p>
                                            <p>Last Updated: Jan 2026</p>
                                        </div>
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
