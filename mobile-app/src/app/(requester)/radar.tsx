import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowLeft, Compass, Zap, MapPin } from 'lucide-react-native';
import { useAppTheme } from '../../constants/theme';
import { useI18n } from '../../i18n';
import GlassBottomBar from '../../components/GlassBottomBar';

export default function RequesterRadarScreen() {
    const router = useRouter();
    const { colors, gradients, shadows, isDark } = useAppTheme();
    const { t, language } = useI18n();

    const rotateAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(0.95)).current;

    useEffect(() => {
        // Vòng quay radar
        Animated.loop(
            Animated.timing(rotateAnim, {
                toValue: 1,
                duration: 4000,
                useNativeDriver: true,
            })
        ).start();

        // Hiệu ứng sóng radar phập phồng
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.15,
                    duration: 1500,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 0.95,
                    duration: 1500,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    const spin = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <View style={{ flex: 1, justifyContent: 'space-between', alignItems: 'center', padding: 24 }}>
                {/* Header */}
                <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
                    <TouchableOpacity
                        onPress={() => {
                            if (router.canGoBack()) {
                                router.back();
                            } else {
                                router.replace('/(requester)');
                            }
                        }}
                        style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surfaceContainer, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <ArrowLeft size={20} color={colors.text} />
                    </TouchableOpacity>

                    <View style={{ paddingHorizontal: 12, paddingVertical: 5, borderRadius: 9999, backgroundColor: colors.surfaceContainer, borderWidth: 1, borderColor: colors.border }}>
                        <Text style={{ fontSize: 11, fontWeight: '800', color: colors.secondary, letterSpacing: 0.8 }}>
                            {language === 'vi' ? 'GOONG MAPS • RADAR QUÉT THỢ' : 'GOONG MAPS • RADAR'}
                        </Text>
                    </View>
                </View>

                {/* Vòng quay Radar đồng tâm (OSM Coordinate Scanning) */}
                <View style={{ position: 'relative', width: 280, height: 280, alignItems: 'center', justifyContent: 'center' }}>
                    {/* Vòng ngoài cùng */}
                    <Animated.View
                        style={{
                            position: 'absolute',
                            width: 260,
                            height: 260,
                            borderRadius: 130,
                            borderWidth: 1.5,
                            borderColor: colors.border,
                            backgroundColor: colors.surfaceContainer,
                            opacity: 0.4,
                            transform: [{ scale: pulseAnim }],
                        }}
                    />

                    {/* Vòng giữa */}
                    <View
                        style={{
                            position: 'absolute',
                            width: 190,
                            height: 190,
                            borderRadius: 95,
                            borderWidth: 1.5,
                            borderColor: colors.primary,
                            opacity: 0.25,
                        }}
                    />

                    {/* Vòng trong */}
                    <View
                        style={{
                            position: 'absolute',
                            width: 120,
                            height: 120,
                            borderRadius: 60,
                            borderWidth: 1.5,
                            borderColor: colors.secondary,
                            opacity: 0.4,
                        }}
                    />

                    {/* Vệt quét radar xoay tròn */}
                    <Animated.View
                        style={{
                            position: 'absolute',
                            width: 190,
                            height: 190,
                            borderRadius: 95,
                            borderTopWidth: 2,
                            borderColor: colors.secondary,
                            opacity: 0.7,
                            transform: [{ rotate: spin }],
                        }}
                    />

                    {/* Điểm trung tâm phát sóng */}
                    <LinearGradient
                        colors={gradients.electric}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={[
                            {
                                width: 64,
                                height: 64,
                                borderRadius: 32,
                                alignItems: 'center',
                                justifyContent: 'center',
                                zIndex: 10,
                            },
                            shadows.electricGlow,
                        ]}
                    >
                        <Compass size={32} color="#ffffff" />
                    </LinearGradient>

                    {/* Thợ gần nhất được phát hiện trên bản đồ */}
                    <View style={{ position: 'absolute', top: 40, right: 55, width: 14, height: 14, borderRadius: 7, backgroundColor: '#10b981', borderWidth: 2, borderColor: '#ffffff' }} />
                    <View style={{ position: 'absolute', bottom: 50, left: 45, width: 14, height: 14, borderRadius: 7, backgroundColor: colors.primary, borderWidth: 2, borderColor: '#ffffff' }} />
                </View>

                {/* Thẻ trạng thái & nút kịch bản */}
                <View style={{ width: '100%', gap: 12, zIndex: 10 }}>
                    <View
                        style={[
                            {
                                padding: 20,
                                borderRadius: 24,
                                backgroundColor: colors.surface,
                                borderWidth: 1,
                                borderColor: colors.border,
                                alignItems: 'center',
                            },
                            shadows.card,
                        ]}
                    >
                        <Text style={{ fontSize: 16, fontWeight: '800', color: colors.text, textAlign: 'center' }}>
                            {t('requester.radarScanning')}
                        </Text>
                        <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 4, textAlign: 'center', lineHeight: 18 }}>
                            {language === 'vi' ? 'Bản đồ số Goong.io • Quét bán kính 10km • Đang tìm thợ online gần nhất' : 'Goong.io Real-time Map • 10km radius • Scanning nearest active workers'}
                        </Text>
                        <View style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#10b981' }} />
                            <Text style={{ fontSize: 13, fontWeight: '700', color: colors.primary }}>
                                {language === 'vi' ? 'Đã nhận: 1 / 3 thợ' : 'Accepted: 1 / 3 workers'}
                            </Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        activeOpacity={0.88}
                        onPress={() => router.push('/(requester)/tracking')}
                        style={[
                            {
                                width: '100%',
                                paddingVertical: 14,
                                borderRadius: 16,
                                backgroundColor: '#10b981',
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 8,
                                marginBottom: 70,
                            },
                            shadows.card,
                        ]}
                    >
                        <Zap size={18} color="#ffffff" fill="#ffffff" />
                        <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '800' }}>
                            {language === 'vi' ? 'Mô phỏng: Đã đủ thợ nhận cuốc 🎉' : 'Demo: All workers confirmed 🎉'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Thanh menu cố định ở dưới */}
                <GlassBottomBar />
            </View>
        </SafeAreaView>
    );
}
