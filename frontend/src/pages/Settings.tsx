import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Bell, Shield, Palette, Mail, Lock, LogOut, Moon, Sun, Smartphone } from 'lucide-react';

const Settings = () => {
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
                                <CardHeader>
                                    <CardTitle>Profile Information</CardTitle>
                                    <CardDescription>Update your profile details and public information.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-8">
                                    <div className="flex items-center gap-6">
                                        <Avatar className="w-24 h-24 border-4 border-background shadow-xl">
                                            <AvatarImage src="/placeholder-avatar.jpg" />
                                            <AvatarFallback className="text-2xl bg-primary/10 text-primary">JD</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <Button variant="outline" className="mr-2">Change Avatar</Button>
                                            <Button variant="ghost" className="text-destructive">Remove</Button>
                                        </div>
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="firstName">First Name</Label>
                                            <Input id="firstName" defaultValue="John" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="lastName">Last Name</Label>
                                            <Input id="lastName" defaultValue="Doe" />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input id="email" defaultValue="john.doe@example.com" className="pl-10" />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="bio">Bio</Label>
                                        <textarea 
                                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" 
                                            id="bio" 
                                            placeholder="Tell us a little about yourself"
                                            defaultValue="Medical researcher specializing in neurodegenerative disorders."
                                        />
                                    </div>

                                    <div className="flex justify-end">
                                        <Button>Save Changes</Button>
                                    </div>
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
                                <CardHeader>
                                    <CardTitle>Security</CardTitle>
                                    <CardDescription>Manage your password and account security settings.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="current-password">Current Password</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input id="current-password" type="password" className="pl-10" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="new-password">New Password</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input id="new-password" type="password" className="pl-10" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="confirm-password">Confirm New Password</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input id="confirm-password" type="password" className="pl-10" />
                                        </div>
                                    </div>
                                    <div className="flex justify-end">
                                        <Button>Update Password</Button>
                                    </div>

                                    <div className="pt-6 border-t">
                                        <h3 className="text-lg font-medium text-destructive mb-4">Danger Zone</h3>
                                        <Button variant="destructive" className="w-full sm:w-auto">
                                            <LogOut className="w-4 h-4 mr-2" /> Sign out of all devices
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </div>
                </div>
            </Tabs>
        </div>
    );
};

export default Settings;
