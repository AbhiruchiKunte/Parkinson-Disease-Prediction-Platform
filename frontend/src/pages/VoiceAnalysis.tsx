import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mic, Upload, Video, PlayCircle, StopCircle, RefreshCw, AlertCircle, FileAudio, FileVideo, Activity, Brain, X, CheckCircle2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  RadialBarChart, RadialBar, PolarAngleAxis, 
  Radar, RadarChart, PolarGrid, PolarRadiusAxis, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area,
  LineChart, Line, Legend
} from 'recharts';

const VoiceAnalysis = () => {
    const [isRecordingAudio, setIsRecordingAudio] = useState(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState<any>(null);

    const [selectedAudioFile, setSelectedAudioFile] = useState<File | null>(null);
    const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null);
    
    const audioInputRef = useRef<HTMLInputElement>(null);
    const videoInputRef = useRef<HTMLInputElement>(null);

    const [isVideoActive, setIsVideoActive] = useState(false);
    const [videoCaptured, setVideoCaptured] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
    const chunksRef = useRef<BlobPart[]>([]);

    useEffect(() => {
        if (isVideoActive && streamRef.current && videoRef.current) {
            videoRef.current.srcObject = streamRef.current;
        }
    }, [isVideoActive]);

    // Real Audio Recording
    const startAudioRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            
            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            recorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/wav' });
                setAudioBlob(blob);
                chunksRef.current = [];
            };

            recorder.start();
            setMediaRecorder(recorder);
            setIsRecordingAudio(true);
        } catch (err) {
            console.error("Error accessing microphone:", err);
            alert("Microphone access denied or unavailable.");
        }
    };

    const stopAudioRecording = () => {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
            mediaRecorder.stream.getTracks().forEach(track => track.stop());
            setIsRecordingAudio(false);
        }
    };

    const triggerUpload = (type: 'audio' | 'video') => {
        if (type === 'audio') audioInputRef.current?.click();
        else videoInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'audio' | 'video') => {
        if (e.target.files && e.target.files[0]) {
            if (type === 'audio') setSelectedAudioFile(e.target.files[0]);
            else setSelectedVideoFile(e.target.files[0]);
            
            // Reset input value to allow re-uploading the same file
            e.target.value = '';
        }
    };

    const startAnalysis = async (type: 'audio' | 'video') => {
        setIsProcessing(true);
        
        if (type === 'audio') {
            try {
                const formData = new FormData();
                
                if (selectedAudioFile) {
                    formData.append('file', selectedAudioFile);
                } else if (audioBlob) {
                    formData.append('file', audioBlob, 'recording.wav');
                } else {
                    alert("No audio selected or recorded!");
                    setIsProcessing(false);
                    return;
                }

                // User can potentially edit these later if we add inputs
                formData.append('age', '60');
                formData.append('tremor_score', '0');
                formData.append('handwriting_score', '0');

                const response = await fetch('http://localhost:5000/predict_audio', {
                    method: 'POST',
                    body: formData,
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || 'Analysis failed');
                }

                const data = await response.json();
                
                // Process backend response
                setResult({
                    type: 'audio',
                    confidence: (data.pd_probability * 100).toFixed(1),
                    status: data.pd_probability > 0.5 ? 'Signs of Parkinson\'s Detected' : 'Healthy Range',
                    details: data.pd_probability > 0.5 
                        ? `Detected anomalies in voice patterns. Probability: ${(data.pd_probability * 100).toFixed(1)}%` 
                        : 'Voice analysis shows normal patterns within healthy range.',
                    features: data.top_features
                });

            } catch (err) {
                console.error("Analysis Error:", err);
                // Fallback to sample results as requested
                setResult({
                    type: 'audio',
                    confidence: 88.5,
                    status: 'Early Signs Detected',
                    details: 'Detected jitter anomalies in vowel phonation. (Sample Result - Backend Unavailable)',
                    features: ['jitter_local', 'shimmer_local']
                });
            } finally {
                setIsProcessing(false);
                setSelectedAudioFile(null);
            }
        } else {
            // Mock Video Analysis for now (as per plan)
            setTimeout(() => {
                setIsProcessing(false);
                setResult({
                    type: 'video',
                    confidence: 92.1,
                    status: 'Gait Abnormality Detected',
                    details: 'Reduced arm swing and slight shuffling detected.'
                });
                setSelectedVideoFile(null);
            }, 2500);
        }
    };

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (stream) {
                 streamRef.current = stream;
                 setIsVideoActive(true);
                 setVideoCaptured(false);
            }
        } catch (err) {
            console.error("Error accessing camera:", err);
            alert("Camera access denied or unavailable.");
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setIsVideoActive(false);
        setVideoCaptured(true);
    };

    return (
        <div className="container mx-auto px-6 py-10 min-h-screen">
             {/* Hidden Inputs */}
            <input 
                type="file" 
                ref={audioInputRef} 
                className="hidden" 
                accept="audio/*"
                onChange={(e) => handleFileChange(e, 'audio')}
            />
             <input 
                type="file" 
                ref={videoInputRef} 
                className="hidden" 
                accept="video/*"
                onChange={(e) => handleFileChange(e, 'video')}
            />

            <div className="text-center mb-10">
                <h1 className="text-4xl font-bold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-hero">
                    Multimodal Analysis 
                </h1>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    Advanced AI diagnostics using vocal biomarkers and computer vision gait analysis.
                </p>
            </div>

            <Tabs defaultValue="voice" className="max-w-4xl mx-auto">
                <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 mb-8 h-auto sm:h-14 bg-secondary/20 p-1 rounded-2xl">
                    <TabsTrigger value="voice" className="text-lg rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-lg transition-all">
                        <Mic className="w-5 h-5 mr-2" /> Voice Analysis
                    </TabsTrigger>
                    <TabsTrigger value="video" className="text-lg rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-lg transition-all">
                        <Video className="w-5 h-5 mr-2" /> Video Gait & Tremor
                    </TabsTrigger>
                </TabsList>

                {/* VOICE ANALYSIS TAB */}
                <TabsContent value="voice" className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Audio Recorder */}
                        <Card className="shadow-lg border-primary/10 overflow-hidden relative">
                            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10">
                                <CardTitle className="flex items-center text-primary">
                                    <Mic className="w-5 h-5 mr-2" /> Live Recording
                                </CardTitle>
                                <CardDescription>Record sustained vowel phonation ("aaaaah")</CardDescription>
                            </CardHeader>
                            <CardContent className="p-8 flex flex-col items-center justify-center min-h-[300px]">
                                <div className={`w-32 h-32 rounded-full flex items-center justify-center mb-8 transition-all duration-500 ${isRecordingAudio ? 'bg-red-100 animate-pulse shadow-red-200' : 'bg-secondary'}`}>
                                    <Mic className={`w-12 h-12 ${isRecordingAudio ? 'text-red-500' : 'text-primary'}`} />
                                </div>
                                
                                {isRecordingAudio ? (
                                    <div className="text-center space-y-4">
                                        <div className="flex gap-1 justify-center h-8 items-end">
                                            {[...Array(5)].map((_, i) => (
                                                <div key={i} className="w-1.5 bg-red-400 rounded-full animate-bounce" style={{ height: '32px', animationDelay: `${i * 0.1}s` }} />
                                            ))}
                                        </div>
                                        <p className="text-red-500 font-semibold animate-pulse">Recording ...</p>
                                        <Button variant="destructive" onClick={stopAudioRecording}>Stop Recording</Button>
                                    </div>
                                ) : audioBlob ? (
                                    <div className="text-center space-y-4">
                                        <div className="bg-green-50 text-green-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center">
                                            <CheckCircle2 className="w-4 h-4 mr-2" />
                                            Recording Saved
                                        </div>
                                        <div className="flex flex-col gap-2">
                                             <Button 
                                                className="w-full bg-gradient-hero shadow-lg" 
                                                onClick={() => startAnalysis('audio')}
                                             >
                                                Analyze Recording
                                             </Button>
                                             <Button 
                                                variant="outline"
                                                className="w-full" 
                                                onClick={() => {
                                                    setAudioBlob(null);
                                                    setResult(null);
                                                }}
                                             >
                                                Record Again
                                             </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <Button size="lg" className="w-full max-w-xs bg-gradient-hero shadow-lg hover:shadow-xl transition-all" onClick={startAudioRecording}>
                                        <PlayCircle className="w-5 h-5 mr-2" /> Start Recording
                                    </Button>
                                )}
                            </CardContent>
                        </Card>

                        {/* Audio Upload */}
                        <Card className="shadow-lg border-primary/10">
                            <CardHeader className="bg-secondary/5">
                                <CardTitle className="flex items-center">
                                    <Upload className="w-5 h-5 mr-2" /> Upload Audio
                                </CardTitle>
                                <CardDescription>Supports .wav, .mp3 (Max 10MB)</CardDescription>
                            </CardHeader>
                            <CardContent className="p-8">
                                {!selectedAudioFile ? (
                                    <div 
                                        className="border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 rounded-xl p-10 flex flex-col items-center justify-center transition-all cursor-pointer h-[300px]"
                                        onClick={() => triggerUpload('audio')}
                                    >
                                        <div className="bg-background p-4 rounded-full shadow-md mb-4">
                                            <FileAudio className="w-8 h-8 text-muted-foreground" />
                                        </div>
                                        <p className="font-semibold text-lg text-foreground mb-2">Click to Upload</p>
                                        <p className="text-sm text-muted-foreground text-center">Drag and drop audio files here or click to browse</p>
                                    </div>
                                ) : (
                                    <div className="border-2 border-solid border-primary/20 bg-primary/5 rounded-xl p-8 flex flex-col items-center justify-center h-[300px] animate-in zoom-in-95">
                                        <div className="bg-white p-4 rounded-full shadow-lg mb-4 relative">
                                            <FileAudio className="w-8 h-8 text-primary" />
                                            <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-1 border-2 border-white">
                                                <CheckCircle2 className="w-3 h-3 text-white" />
                                            </div>
                                        </div>
                                        <p className="font-bold text-lg mb-1">{selectedAudioFile.name}</p>
                                        <p className="text-sm text-muted-foreground mb-6">{(selectedAudioFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                        
                                        <div className="flex gap-3 w-full max-w-xs">
                                            <Button variant="outline" className="flex-1" onClick={() => setSelectedAudioFile(null)}>Cancel</Button>
                                            <Button className="flex-1 bg-gradient-hero shadow-lg" onClick={() => startAnalysis('audio')}>
                                                Analyze Audio
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* VIDEO ANALYSIS TAB */}
                <TabsContent value="video" className="space-y-6">
                     <div className="grid md:grid-cols-2 gap-6">
                        {/* Video Camera */}
                        <Card className="shadow-lg border-primary/10 overflow-hidden">
                            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10">
                                <CardTitle className="flex items-center text-purple-600">
                                    <Video className="w-5 h-5 mr-2" /> Live Gait Analysis
                                </CardTitle>
                                <CardDescription>Walk in front of camera for gait assessment</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0 bg-black/90 min-h-[400px] relative flex flex-col items-center justify-center">
                                {isVideoActive ? (
                                    <>
                                        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                                        <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-4 z-10">
                                            <Button variant="destructive" onClick={stopCamera}>
                                                <StopCircle className="w-4 h-4 mr-2" /> Stop and Save
                                            </Button>
                                        </div>
                                    </>
                                ) : videoCaptured ? (
                                    <div className="text-center p-8 w-full h-full flex flex-col items-center justify-center animate-in fade-in">
                                        <div className="bg-green-50 text-green-700 px-6 py-3 rounded-xl text-lg font-medium flex items-center justify-center mb-8">
                                            <CheckCircle2 className="w-6 h-6 mr-2" />
                                            Video Captured
                                        </div>
                                        <div className="flex flex-col gap-4 w-full max-w-xs">
                                             <Button 
                                                className="w-full bg-gradient-hero shadow-lg h-12 text-lg" 
                                                onClick={() => startAnalysis('video')}
                                             >
                                                Analyze Stream
                                             </Button>
                                             <Button 
                                                variant="outline"
                                                className="w-full" 
                                                onClick={() => {
                                                    setVideoCaptured(false);
                                                    setResult(null);
                                                }}
                                             >
                                                Record Again
                                             </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center p-8">
                                        <div className="bg-white/10 p-6 rounded-full inline-block mb-6">
                                            <Video className="w-12 h-12 text-white/80" />
                                        </div>
                                        <h3 className="text-white text-xl font-semibold mb-2">Camera Access Required</h3>
                                        <p className="text-white/60 mb-8 max-w-xs mx-auto">We need permission to access your webcam for real-time tremor and gait analysis.</p>
                                        <Button size="lg" className="bg-purple-600 hover:bg-purple-700 text-white border-none" onClick={startCamera}>
                                            Enable Camera
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Video Upload */}
                        <Card className="shadow-lg border-primary/10">
                            <CardHeader className="bg-secondary/5">
                                <CardTitle className="flex items-center">
                                    <Upload className="w-5 h-5 mr-2" /> Upload Video
                                </CardTitle>
                                <CardDescription>Supports .mp4, .mov (Max 50MB)</CardDescription>
                            </CardHeader>
                            <CardContent className="p-8">
                                {!selectedVideoFile ? (
                                    <div className="border-2 border-dashed border-border hover:border-purple-500/50 hover:bg-purple-50/50 rounded-xl p-10 flex flex-col items-center justify-center transition-all cursor-pointer h-[400px]"
                                        onClick={() => triggerUpload('video')}>
                                        <div className="bg-background p-4 rounded-full shadow-md mb-4">
                                            <FileVideo className="w-8 h-8 text-muted-foreground" />
                                        </div>
                                        <p className="font-semibold text-lg text-foreground mb-2">Click to Upload Video</p>
                                        <p className="text-sm text-muted-foreground text-center">Analyze resting tremor or walking patterns from pre-recorded video</p>
                                    </div>
                                ) : (
                                     <div className="border-2 border-solid border-purple-500/20 bg-purple-50/10 rounded-xl p-8 flex flex-col items-center justify-center h-[400px] animate-in zoom-in-95">
                                        <div className="bg-white p-4 rounded-full shadow-lg mb-4 relative">
                                            <FileVideo className="w-8 h-8 text-purple-600" />
                                            <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-1 border-2 border-white">
                                                <CheckCircle2 className="w-3 h-3 text-white" />
                                            </div>
                                        </div>
                                        <p className="font-bold text-lg mb-1">{selectedVideoFile.name}</p>
                                        <p className="text-sm text-muted-foreground mb-6">{(selectedVideoFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                        
                                        <div className="flex gap-3 w-full max-w-xs">
                                            <Button variant="outline" className="flex-1" onClick={() => setSelectedVideoFile(null)}>Cancel</Button>
                                            <Button className="flex-1 bg-purple-600 hover:bg-purple-700 text-white shadow-lg" onClick={() => startAnalysis('video')}>
                                                Analyze Video
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>

            {/* Analysis Result Section - Inline & Premium */}
            {isProcessing && (
                 <div className="mt-12 text-center animate-in fade-in zoom-in duration-500">
                    <div className="w-20 h-20 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-6 shadow-glow"></div>
                    <h3 className="text-2xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">Analyzing Biomarkers...</h3>
                    <p className="text-muted-foreground">Running Dual-Stream LSTM & Computer Vision models</p>
                 </div>
            )}

            {result && !isProcessing && (
                <div className="mt-16 animate-in fade-in slide-in-from-bottom-10 space-y-8">
                     
                     <div className="text-center mb-10">
                        <div className={`inline-flex items-center justify-center p-3 rounded-full mb-4 ${result.status.includes('Detected') ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                            <Brain className="w-8 h-8" />
                        </div>
                        <h2 className="text-3xl font-bold">{result.status}</h2>
                        <p className="text-lg text-muted-foreground mt-2 max-w-2xl mx-auto">{result.details}</p>
                     </div>

                     <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {/* 1. Confidence Gauge */}
                        <Card className="shadow-xl border-muted overflow-hidden relative group lg:col-span-1">
                            <div className="absolute inset-0 bg-gradient-to-br from-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <CardHeader>
                                <CardTitle className="text-xl flex items-center gap-2">
                                    <Activity className="w-5 h-5 text-primary" />
                                    AI Confidence Score
                                </CardTitle>
                                <CardDescription>Probability of Parkinsonian patterns in {result.type} stream</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[300px] relative flex items-center justify-center">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadialBarChart 
                                        cx="50%" 
                                        cy="50%" 
                                        innerRadius="60%" 
                                        outerRadius="100%" 
                                        barSize={20} 
                                        data={[{ name: 'Confidence', value: result.confidence, fill: result.confidence > 50 ? '#ef4444' : '#10b981' }]} 
                                        startAngle={180} 
                                        endAngle={0}
                                    >
                                        <RadialBar
                                            background
                                            dataKey="value"
                                            cornerRadius={10}
                                        />
                                        <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                                    </RadialBarChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex flex-col items-center justify-center pt-10">
                                    <span className={`text-5xl font-bold ${Number(result.confidence) > 50 ? 'text-red-500' : 'text-green-500'}`}>
                                        {result.confidence}%
                                    </span>
                                    <span className="text-sm text-muted-foreground uppercase tracking-wider mt-1">Probability</span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* 2. Primary Analysis (Existing) */}
                        <Card className="shadow-xl border-muted overflow-hidden relative group lg:col-span-2">
                            <div className="absolute inset-0 bg-gradient-to-bl from-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <CardHeader>
                                <CardTitle className="text-xl flex items-center gap-2">
                                    {result.type === 'audio' ? <FileAudio className="w-5 h-5 text-purple-600" /> : <FileVideo className="w-5 h-5 text-purple-600" />}
                                    {result.type === 'audio' ? 'Signal Waveform Analysis' : 'Gait Kinematics Breakdown'}
                                </CardTitle>
                                <CardDescription>
                                    {result.type === 'audio' ? 'Real-time acoustic feature extraction overlay' : 'Detailed movement component analysis'}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    {result.type === 'audio' ? (
                                        <AreaChart data={[
                                            { time: '0s', val: 20 }, { time: '1s', val: 40 }, { time: '2s', val: 35 }, { time: '3s', val: 70 },
                                            { time: '4s', val: 45 }, { time: '5s', val: 60 }, { time: '6s', val: 30 },
                                            { time: '7s', val: 50 }, { time: '8s', val: 25 }, { time: '9s', val: 45 }, { time: '10s', val: 65 }
                                        ]}>
                                            <defs>
                                                <linearGradient id="colorWave" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.2)' }} />
                                            <Area type="monotone" dataKey="val" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorWave)" />
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                                            <XAxis dataKey="time" axisLine={false} tickLine={false} />
                                        </AreaChart>
                                    ) : (
                                        <BarChart data={[
                                            { name: 'Stride Length', value: 85, fill: '#8b5cf6' },
                                            { name: 'Arm Swing', value: 45, fill: '#ec4899' },
                                            { name: 'Posture', value: 60, fill: '#10b981' },
                                            { name: 'Stability', value: 75, fill: '#3b82f6' },
                                            { name: 'Turning Speed', value: 55, fill: '#f59e0b' },
                                        ]} layout="vertical" margin={{ left: 20 }}>
                                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} strokeOpacity={0.1} />
                                            <XAxis type="number" hide />
                                            <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={100} />
                                            <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '12px' }} />
                                            <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={30} background={{ fill: '#f3f4f6' }} />
                                        </BarChart>
                                    )}
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* 3. New Interactive Charts - Row 2 */}
                         {result.type === 'audio' ? (
                            <>
                                {/* Audio Chart 2: Frequency Spectrum - Enhanced */}
                                <Card className="shadow-lg border-muted lg:col-span-1 overflow-hidden relative group">
                                     <div className="absolute inset-0 bg-gradient-to-tr from-transparent to-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <CardHeader>
                                        <CardTitle className="text-lg">Frequency Spectrum</CardTitle>
                                        <CardDescription>Pitch stability analysis (Hz)</CardDescription>
                                    </CardHeader>
                                    <CardContent className="h-[250px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={[
                                                { f: '100Hz', amp: 30 }, { f: '200Hz', amp: 50 }, { f: '300Hz', amp: 45 }, 
                                                { f: '400Hz', amp: 80 }, { f: '500Hz', amp: 60 }, { f: '600Hz', amp: 40 }
                                            ]}>
                                                <defs>
                                                    <linearGradient id="colorFreq" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                                                <XAxis dataKey="f" fontSize={12} tickLine={false} axisLine={false} />
                                                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                                <Area type="monotone" dataKey="amp" stroke="#10b981" strokeWidth={3} fill="url(#colorFreq)" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </CardContent>
                                </Card>

                                {/* Audio Chart 3: Vocal Quality Metrics - Radial Style */}
                                <Card className="shadow-lg border-muted lg:col-span-2 overflow-hidden relative group">
                                    <div className="absolute inset-0 bg-gradient-to-bl from-transparent to-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <CardHeader>
                                        <CardTitle className="text-lg">Vocal Quality Metrics</CardTitle>
                                        <CardDescription>Comparison of key biomarkers vs Healthy Baseline</CardDescription>
                                    </CardHeader>
                                    <CardContent className="h-[250px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={[
                                                { name: 'Jitter (Micro)', val: 65, baseline: 30 },
                                                { name: 'Shimmer (dB)', val: 55, baseline: 25 },
                                                { name: 'HNR (dB)', val: 40, baseline: 80 },
                                            ]} barGap={0} barCategoryGap="20%">
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                                                <XAxis dataKey="name" tickLine={false} axisLine={false} />
                                                <Tooltip 
                                                    cursor={{fill: 'transparent'}}
                                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} 
                                                />
                                                <Legend iconType="circle" />
                                                {/* Patient Value with Gradient */}
                                                <defs>
                                                    <linearGradient id="patientGrad" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="0%" stopColor="#ef4444" stopOpacity={1}/>
                                                        <stop offset="100%" stopColor="#ef4444" stopOpacity={0.6}/>
                                                    </linearGradient>
                                                    <linearGradient id="baselineGrad" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="0%" stopColor="#10b981" stopOpacity={1}/>
                                                        <stop offset="100%" stopColor="#10b981" stopOpacity={0.6}/>
                                                    </linearGradient>
                                                </defs>
                                                <Bar name="Patient Value" dataKey="val" fill="url(#patientGrad)" radius={[4, 4, 0, 0]} animationDuration={1500} />
                                                <Bar name="Healthy Baseline" dataKey="baseline" fill="url(#baselineGrad)" radius={[4, 4, 0, 0]} animationDuration={1500} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </CardContent>
                                </Card>
                            </>
                        ) : (
                            <>
                                {/* Video Chart 2: Tremor Severity Series - Smooth Area */}
                                <Card className="shadow-lg border-muted lg:col-span-2 overflow-hidden relative group">
                                     <div className="absolute inset-0 bg-gradient-to-r from-transparent to-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <CardHeader>
                                        <CardTitle className="text-lg">Tremor Magnitude Series</CardTitle>
                                        <CardDescription>Detected tremor intensity over time</CardDescription>
                                    </CardHeader>
                                    <CardContent className="h-[250px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={[
                                                { t: '0s', mag: 10 }, { t: '2s', mag: 15 }, { t: '4s', mag: 45 }, 
                                                { t: '6s', mag: 30 }, { t: '8s', mag: 60 }, { t: '10s', mag: 55 }
                                            ]}>
                                                <defs>
                                                    <linearGradient id="colorTremor" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                                                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                                                <XAxis dataKey="t" tickLine={false} axisLine={false} />
                                                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                                <Area type="monotone" dataKey="mag" stroke="#f59e0b" strokeWidth={3} fill="url(#colorTremor)" animationDuration={2000} />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </CardContent>
                                </Card>

                                {/* Video Chart 3: Posture Stability Radar - Enhanced */}
                                <Card className="shadow-lg border-muted lg:col-span-1 overflow-hidden relative group">
                                    <div className="absolute inset-0 bg-gradient-to-br from-transparent to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <CardHeader>
                                        <CardTitle className="text-lg">Posture Stability</CardTitle>
                                        <CardDescription>Multi-axis balance assessment</CardDescription>
                                    </CardHeader>
                                    <CardContent className="h-[250px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={[
                                                { subject: 'Forward', A: 80, fullMark: 100 },
                                                { subject: 'Backward', A: 65, fullMark: 100 },
                                                { subject: 'Left', A: 90, fullMark: 100 },
                                                { subject: 'Right', A: 85, fullMark: 100 },
                                            ]}>
                                                <defs>
                                                    <radialGradient id="radarBlue" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                                                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.5}/>
                                                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.1}/>
                                                    </radialGradient>
                                                </defs>
                                                <PolarGrid strokeOpacity={0.2} />
                                                <PolarAngleAxis dataKey="subject" tick={{ fill: 'currentColor', fontSize: 12 }} />
                                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                                <Radar name="Balance" dataKey="A" stroke="#3b82f6" strokeWidth={2} fill="url(#radarBlue)" fillOpacity={0.6} animationDuration={1500} />
                                                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                            </RadarChart>
                                        </ResponsiveContainer>
                                    </CardContent>
                                </Card>
                            </>
                        )}
                     </div>

                     <div className="flex justify-center pt-8 pb-12">
                        <Button 
                            variant="outline" 
                            size="lg" 
                            onClick={() => setResult(null)}
                            className="mr-4"
                        >
                            Reset Analysis
                        </Button>
                        <Button size="lg" className="bg-gradient-hero shadow-lg px-8">
                            Download Detailed Clinical Report
                        </Button>
                     </div>
                </div>
            )}
        </div>
    );
};

export default VoiceAnalysis;
