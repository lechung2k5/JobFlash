import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowLeft, Zap, Clock, MapPin } from 'lucide-react-native';
import { useAppTheme } from '../../constants/theme';
import { useI18n } from '../../i18n';

export default function WorkerAlertScreen() {
    const router = useRouter();
    const { colors, gradients, shadows } = useAppTheme();
    const { t, language } = useI18n();
    const [secondsLeft, setSecondsLeft] = useState(30);

    useEffect(() => {
        if (secondsLeft <= 0) {
            router.replace('/(worker)');
            return;
        }
        const timer = setInterval(() => {
            setSecondsLeft((prev) => prev - 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [secondsLeft]);

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.75)', justifyContent: 'space-between', padding: 20 }}>
            {/* Top Bar with Back Button */}
            <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                    if (router.canGoBack()) {
                        router.back();
                    } else {
                        router.replace('/(worker)');
                    }
                }}
                style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255, 255, 255, 0.2)', alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-start' }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
                <ArrowLeft size={20} color="#ffffff" />
            </TouchableOpacity>

            {/* Card thông báo nổi bật */}
            <View
                style={[
                    {
                        padding: 24,
                        borderRadius: 32,
                        backgroundColor: colors.surface,
                        borderWidth: 2,
                        borderColor: colors.secondary,
                        gap: 16,
                    },
                    shadows.floating,
                ]}
            >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.secondary }} />
                        <Text style={{ fontSize: 13, fontWeight: '800', color: colors.secondary, letterSpacing: 0.5 }}>
                            {t('worker.newJobAlert')}
                        </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 9999, backgroundColor: colors.surfaceContainer }}>
                        <Clock size={13} color={colors.textSecondary} />
                        <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textSecondary }}>
                            {secondsLeft}s
                        </Text>
                    </View>
                </View>

                <View>
                    <Text style={{ fontSize: 20, fontWeight: '800', color: colors.text }}>
                        Bốc xếp bàn ghế tiệc cưới
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                        <MapPin size={14} color={colors.secondary} />
                        <Text style={{ fontSize: 13, color: colors.secondary, fontWeight: '700' }}>
                            {language === 'vi' ? 'Cách bạn 1.8km • White Palace Phú Nhuận' : '1.8km away • White Palace'}
                        </Text>
                    </View>
                </View>

                {/* Thù lao & 10% Phí hoa hồng */}
                <View style={{ padding: 16, borderRadius: 18, backgroundColor: colors.surfaceContainer, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View>
                        <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                            {language === 'vi' ? 'Mức lương thỏa thuận' : 'Agreed Wage'}
                        </Text>
                        <Text style={{ fontSize: 22, fontWeight: '800', color: colors.secondary, marginTop: 2 }}>
                            350.000 {t('common.currency')}
                        </Text>
                        <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>
                            {language === 'vi' ? 'Phí dịch vụ 10%: 35.000đ' : '10% Service Fee: 35.000đ'}
                        </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ fontSize: 11, color: colors.textSecondary }}>
                            {language === 'vi' ? 'Hình thức' : 'Type'}
                        </Text>
                        <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text, marginTop: 2 }}>
                            {language === 'vi' ? 'Trọn gói ca' : 'Fixed Gig'}
                        </Text>
                    </View>
                </View>

                {/* Các nút hành động */}
                <View style={{ gap: 8, paddingTop: 4 }}>
                    <TouchableOpacity
                        activeOpacity={0.88}
                        onPress={() => router.replace('/(worker)/onduty')}
                        style={[
                            {
                                width: '100%',
                                borderRadius: 16,
                                overflow: 'hidden',
                            },
                            shadows.electricGlow,
                        ]}
                    >
                        <LinearGradient
                            colors={gradients.worker}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={{ paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                        >
                            <Zap size={18} color="#ffffff" fill="#ffffff" />
                            <Text style={{ color: '#ffffff', fontSize: 15, fontWeight: '800' }}>
                                {t('worker.acceptJobBtn')}
                            </Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => router.replace('/(worker)')}
                        style={{ width: '100%', paddingVertical: 12, alignItems: 'center' }}
                    >
                        <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textSecondary }}>
                            {t('worker.rejectJobBtn')}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}
