import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mic, Upload, Video, PlayCircle, StopCircle, RefreshCw, AlertCircle, FileAudio, FileVideo, Activity, Brain, X, CheckCircle2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
                <TabsList className="grid w-full grid-cols-2 mb-8 h-14 bg-secondary/20 p-1 rounded-2xl">
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

            {/* Analysis Result Modal / Overlay */}
            {isProcessing && (
                 <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
                    <div className="bg-card p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center border border-primary/20">
                        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                        <h3 className="text-xl font-bold mb-2">Analyzing Biomarkers...</h3>
                        <p className="text-muted-foreground">Running LSTM & Computer Vision models</p>
                    </div>
                 </div>
            )}

            {result && !isProcessing && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                     <div className="bg-card p-0 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className={`p-6 ${result.confidence > 80 ? 'bg-red-50 dark:bg-red-900/20' : 'bg-green-50 dark:bg-green-900/20'}`}>
                            <div className="flex items-center gap-3 mb-2">
                                <Brain className={`w-6 h-6 ${result.confidence > 80 ? 'text-red-600' : 'text-green-600'}`} />
                                <h3 className={`text-lg font-bold ${result.confidence > 80 ? 'text-red-700' : 'text-green-700'}`}>Analysis Complete</h3>
                            </div>
                            <p className="text-sm opacity-90">{result.details}</p>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex justify-between items-center bg-secondary/30 p-4 rounded-xl">
                                <span className="font-medium">Detected Pattern</span>
                                <span className="font-bold">{result.status}</span>
                            </div>
                            <div className="flex justify-between items-center bg-secondary/30 p-4 rounded-xl">
                                <span className="font-medium">AI Confidence</span>
                                <span className="font-bold text-primary">{result.confidence}%</span>
                            </div>
                            
                            {result.features && result.features.length > 0 && (
                                <div className="bg-secondary/20 p-4 rounded-xl">
                                    <span className="font-medium block mb-2">Key Factors:</span>
                                    <div className="flex flex-wrap gap-2">
                                        {result.features.map((feature: string, i: number) => (
                                            <span key={i} className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full border border-primary/20">
                                                {feature.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div className="flex gap-3 pt-2">
                                <Button className="flex-1 bg-gradient-hero" onClick={() => setResult(null)}>Close</Button>
                                <Button variant="outline" className="flex-1">Detailed Report</Button>
                            </div>
                        </div>
                     </div>
                </div>
            )}
        </div>
    );
};

export default VoiceAnalysis;
