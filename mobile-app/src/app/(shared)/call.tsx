import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, Linking, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
    ArrowLeft,
    PhoneOff,
    Mic,
    MicOff,
    Volume2,
    VolumeX,
    User,
    PhoneForwarded,
    ShieldCheck
} from 'lucide-react-native';
import { THEME } from '../../constants/theme';

export default function InAppCallScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();

    const partnerName = (params.name as string) || 'Lê Chung';
    const partnerRole = (params.role as string) || 'Đối Tác Thợ';
    const partnerPhone = (params.phone as string) || '0912345678';

    const [callStatus, setCallStatus] = useState<'calling' | 'connected'>('calling');
    const [callDuration, setCallDuration] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    const [isSpeaker, setIsSpeaker] = useState(false);

    const waveAnim1 = useRef(new Animated.Value(1)).current;
    const waveAnim2 = useRef(new Animated.Value(1)).current;

    // Hiệu ứng sóng âm thanh lan tỏa
    useEffect(() => {
        Animated.loop(
            Animated.stagger(600, [
                Animated.sequence([
                    Animated.timing(waveAnim1, { toValue: 1.4, duration: 1500, useNativeDriver: true }),
                    Animated.timing(waveAnim1, { toValue: 1, duration: 1500, useNativeDriver: true }),
                ]),
                Animated.sequence([
                    Animated.timing(waveAnim2, { toValue: 1.3, duration: 1500, useNativeDriver: true }),
                    Animated.timing(waveAnim2, { toValue: 1, duration: 1500, useNativeDriver: true }),
                ]),
            ])
        ).start();

        // Tự động chuyển sang Connected sau 3.5 giây mô phỏng
        const connectTimer = setTimeout(() => {
            setCallStatus('connected');
        }, 3500);

        return () => clearTimeout(connectTimer);
    }, []);

    // Bộ đếm thời lượng cuộc gọi
    useEffect(() => {
        let timer: any;
        if (callStatus === 'connected') {
            timer = setInterval(() => {
                setCallDuration((prev) => prev + 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [callStatus]);

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const handleEndCall = () => {
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace('/(shared)/chat');
        }
    };

    const handleSwitchToCellular = () => {
        Linking.openURL(`tel:${partnerPhone}`);
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace('/(shared)/chat');
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#0f172a' }}>
            {/* Top Bar Back Button */}
            <View style={{ paddingHorizontal: 20, paddingTop: 10 }}>
                <TouchableOpacity
                    onPress={handleEndCall}
                    style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255, 255, 255, 0.15)', alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-start' }}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <ArrowLeft size={20} color="#ffffff" />
                </TouchableOpacity>
            </View>
            <View style={{ flex: 1, justifyContent: 'space-between', alignItems: 'center', paddingVertical: 24, paddingHorizontal: 24 }}>
                {/* Header Info */}
                <View style={{ alignItems: 'center', gap: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 9999, backgroundColor: 'rgba(255,255,255,0.1)' }}>
                        <ShieldCheck size={14} color="#60a5fa" />
                        <Text style={{ color: '#e2e8f0', fontSize: 11, fontWeight: '700' }}>
                            Cuộc gọi miễn phí qua Internet (VoIP)
                        </Text>
                    </View>

                    <Text style={{ fontSize: 28, fontWeight: '800', color: '#ffffff', marginTop: 12 }}>
                        {partnerName}
                    </Text>
                    <Text style={{ fontSize: 14, color: '#94a3b8', fontWeight: '600' }}>
                        {partnerRole}
                    </Text>
                    <Text style={{ fontSize: 15, color: callStatus === 'connected' ? '#34d399' : '#f59e0b', fontWeight: '700', marginTop: 4 }}>
                        {callStatus === 'connected' ? formatDuration(callDuration) : 'Đang đổ chuông...'}
                    </Text>
                </View>

                {/* Avatar & Wave Animation */}
                <View style={{ position: 'relative', width: 220, height: 220, justifyContent: 'center', alignItems: 'center' }}>
                    <Animated.View
                        style={{
                            position: 'absolute',
                            width: 200,
                            height: 200,
                            borderRadius: 100,
                            backgroundColor: 'rgba(37, 99, 235, 0.15)',
                            transform: [{ scale: waveAnim1 }],
                        }}
                    />
                    <Animated.View
                        style={{
                            position: 'absolute',
                            width: 160,
                            height: 160,
                            borderRadius: 80,
                            backgroundColor: 'rgba(59, 130, 246, 0.2)',
                            transform: [{ scale: waveAnim2 }],
                        }}
                    />

                    <LinearGradient
                        colors={['#1d4ed8', '#2563eb']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{ width: 110, height: 110, borderRadius: 55, padding: 3, justifyContent: 'center', alignItems: 'center' }}
                    >
                        <View style={{ width: '100%', height: '100%', borderRadius: 55, backgroundColor: '#1e293b', justifyContent: 'center', alignItems: 'center' }}>
                            <User size={54} color="#ffffff" />
                        </View>
                    </LinearGradient>
                </View>

                {/* Call Control Buttons */}
                <View style={{ width: '100%', gap: 24, alignItems: 'center' }}>
                    {/* Tùy chọn chuyển sang gọi SIM di động (Text Button - Section 4) */}
                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={handleSwitchToCellular}
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 8,
                            paddingHorizontal: 16,
                            paddingVertical: 10,
                            backgroundColor: 'transparent',
                        }}
                    >
                        <PhoneForwarded size={16} color="#60a5fa" />
                        <Text style={{ color: '#60a5fa', fontSize: 13, fontWeight: '700', textDecorationLine: 'underline' }}>
                            Mạng yếu? Chuyển sang gọi SĐT thường ({partnerPhone})
                        </Text>
                    </TouchableOpacity>

                    {/* Hàng nút Mic, Loa, Ngắt cuộc gọi */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', width: '100%', paddingHorizontal: 20 }}>
                        {/* Nút Mute Mic (Toggle - Section 5) */}
                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => setIsMuted(!isMuted)}
                            style={{
                                width: 56,
                                height: 56,
                                borderRadius: 28,
                                backgroundColor: isMuted ? '#eff6ff' : 'rgba(255, 255, 255, 0.12)',
                                borderWidth: 1.5,
                                borderColor: isMuted ? '#2563eb' : 'rgba(255, 255, 255, 0.2)',
                                justifyContent: 'center',
                                alignItems: 'center',
                            }}
                        >
                            {isMuted ? <MicOff size={24} color="#2563eb" /> : <Mic size={24} color="#ffffff" />}
                        </TouchableOpacity>

                        {/* Nút Ngắt cuộc gọi (Destructive Button - Section 3) */}
                        <TouchableOpacity
                            activeOpacity={0.9}
                            onPress={handleEndCall}
                            style={{
                                width: 72,
                                height: 72,
                                borderRadius: 36,
                                backgroundColor: '#ef4444',
                                justifyContent: 'center',
                                alignItems: 'center',
                                shadowColor: '#ef4444',
                                shadowOffset: { width: 0, height: 6 },
                                shadowOpacity: 0.5,
                                shadowRadius: 16,
                                elevation: 8,
                            }}
                        >
                            <PhoneOff size={32} color="#ffffff" />
                        </TouchableOpacity>

                        {/* Nút Bật Loa Ngoài (Toggle - Section 5) */}
                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => setIsSpeaker(!isSpeaker)}
                            style={{
                                width: 56,
                                height: 56,
                                borderRadius: 28,
                                backgroundColor: isSpeaker ? '#eff6ff' : 'rgba(255, 255, 255, 0.12)',
                                borderWidth: 1.5,
                                borderColor: isSpeaker ? '#2563eb' : 'rgba(255, 255, 255, 0.2)',
                                justifyContent: 'center',
                                alignItems: 'center',
                            }}
                        >
                            {isSpeaker ? <Volume2 size={24} color="#2563eb" /> : <VolumeX size={24} color="#ffffff" />}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
}
