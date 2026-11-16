import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Radar, Wallet, BellRing, ArrowRight, ShieldCheck, CheckCircle2, LogOut } from 'lucide-react-native';
import GlassBottomBar from '../../components/GlassBottomBar';
import { useAuthStore } from '../../store/useAuthStore';
import { useAppTheme } from '../../constants/theme';
import { useI18n } from '../../i18n';

export default function WorkerHomeScreen() {
    const router = useRouter();
    const currentUser = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);
    const { colors, gradients, shadows, isDark } = useAppTheme();
    const { t, language } = useI18n();
    const [workerOnline, setWorkerOnline] = useState(true);

    // Ràng buộc bảo mật & An toàn: Thợ bắt buộc phải cập nhật CCCD rõ nét 2 mặt mới được vào nhận việc
    useEffect(() => {
        const hasWorkerCCCD = Boolean(
            currentUser?.workerProfile?.idCardFrontUrl && currentUser?.workerProfile?.idCardBackUrl
        );
        if (!hasWorkerCCCD) {
            Alert.alert(
                language === 'vi' ? 'Yêu cầu cập nhật CCCD' : 'ID Verification Required',
                language === 'vi'
                    ? 'Để bảo đảm quyền lợi và an toàn khi nhận việc, Đối tác thợ cần cập nhật ảnh CCCD rõ nét 2 mặt trước khi vào nhận việc.'
                    : 'Worker partners must verify both sides of ID card before accepting gigs.',
                [
                    {
                        text: language === 'vi' ? 'Cập nhật ngay' : 'Update Now',
                        onPress: () => router.replace('/(auth)/profile-setup'),
                    },
                ]
            );
        }
    }, [currentUser]);

    const handleLogout = () => {
        Alert.alert(
            language === 'vi' ? 'Đăng xuất tài khoản' : 'Log Out',
            language === 'vi' ? 'Bạn có muốn đăng xuất khỏi ứng dụng không?' : 'Do you want to log out?',
            [
                { text: t('common.cancel'), style: 'cancel' },
                {
                    text: language === 'vi' ? 'Đăng xuất' : 'Log Out',
                    style: 'destructive',
                    onPress: () => {
                        logout();
                        router.replace('/(auth)/role-select');
                    },
                },
            ]
        );
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <View style={{ flex: 1, position: 'relative' }}>
                <ScrollView contentContainerStyle={{ paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
                    {/* Header Coral-Rose Gradient */}
                    <LinearGradient
                        colors={gradients.worker}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={[
                            {
                                paddingHorizontal: 24,
                                paddingTop: 20,
                                paddingBottom: 28,
                                borderBottomLeftRadius: 36,
                                borderBottomRightRadius: 36,
                            },
                            shadows.card,
                        ]}
                    >
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <View style={{ flex: 1, paddingRight: 8 }}>
                                <Text style={{ color: '#ffe4e6', fontSize: 13, fontWeight: '600' }}>
                                    {language === 'vi' ? 'Đối tác thợ:' : 'Partner:'}
                                </Text>
                                <Text style={{ color: '#ffffff', fontSize: 20, fontWeight: '800' }} numberOfLines={1}>
                                    {currentUser?.fullName && currentUser.fullName !== 'Người dùng mới'
                                        ? currentUser.fullName
                                        : (language === 'vi' ? 'Đối tác thợ' : 'Worker Partner')} ⚡
                                </Text>
                            </View>

                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                {/* Nút bật/tắt nhận việc */}
                                <TouchableOpacity
                                    activeOpacity={0.8}
                                    onPress={() => setWorkerOnline(!workerOnline)}
                                    style={{
                                        paddingHorizontal: 12,
                                        paddingVertical: 7,
                                        borderRadius: 9999,
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        gap: 6,
                                        backgroundColor: workerOnline ? '#10b981' : 'rgba(255,255,255,0.2)',
                                        borderWidth: 1,
                                        borderColor: workerOnline ? '#059669' : 'rgba(255,255,255,0.3)',
                                    }}
                                >
                                    <View
                                        style={{
                                            width: 8,
                                            height: 8,
                                            borderRadius: 4,
                                            backgroundColor: '#ffffff',
                                        }}
                                    />
                                    <Text style={{ color: '#ffffff', fontSize: 11, fontWeight: '700' }}>
                                        {workerOnline ? (language === 'vi' ? 'SẴN SÀNG' : 'ONLINE') : (language === 'vi' ? 'TẠM NGHỈ' : 'OFFLINE')}
                                    </Text>
                                </TouchableOpacity>

                                {/* Nút Đăng xuất */}
                                <TouchableOpacity
                                    activeOpacity={0.8}
                                    onPress={handleLogout}
                                    style={{
                                        width: 36,
                                        height: 36,
                                        borderRadius: 18,
                                        backgroundColor: 'rgba(255,255,255,0.2)',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        borderWidth: 1,
                                        borderColor: 'rgba(255,255,255,0.3)',
                                    }}
                                >
                                    <LogOut size={16} color="#ffffff" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Thẻ thu nhập hôm nay */}
                        <View
                            style={[
                                {
                                    marginTop: 20,
                                    padding: 18,
                                    borderRadius: 22,
                                    backgroundColor: colors.surface,
                                    flexDirection: 'row',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                },
                                shadows.card,
                            ]}
                        >
                            <View>
                                <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                                    {t('worker.todayEarnings')}
                                </Text>
                                <Text style={{ fontSize: 24, fontWeight: '800', color: colors.text, marginTop: 2 }}>
                                    350.000 {t('common.currency')}
                                </Text>
                                <Text style={{ fontSize: 11, color: '#16a34a', fontWeight: '700', marginTop: 4 }}>
                                    {language === 'vi' ? '1 ca việc hoàn thành • Phí 10%: 35.000đ' : '1 gig finished • 10% Fee: 35.000đ'}
                                </Text>
                            </View>

                            <TouchableOpacity
                                activeOpacity={0.8}
                                onPress={() => router.push('/(worker)/wallet')}
                                style={{
                                    paddingHorizontal: 14,
                                    paddingVertical: 10,
                                    borderRadius: 14,
                                    backgroundColor: colors.surfaceContainer,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    gap: 6,
                                }}
                            >
                                <Wallet size={16} color={colors.secondary} />
                                <Text style={{ fontSize: 13, fontWeight: '700', color: colors.secondary }}>
                                    {language === 'vi' ? 'Ví tiền' : 'Wallet'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </LinearGradient>

                    {/* Khối trạng thái Nhận việc gần nhất */}
                    <View style={{ paddingHorizontal: 16, marginTop: 20, gap: 14 }}>
                        <View
                            style={[
                                {
                                    padding: 20,
                                    borderRadius: 22,
                                    backgroundColor: colors.surface,
                                    borderWidth: 1,
                                    borderColor: colors.border,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    gap: 16,
                                },
                                shadows.card,
                            ]}
                        >
                            <View
                                style={{
                                    width: 48,
                                    height: 48,
                                    borderRadius: 16,
                                    backgroundColor: colors.surfaceContainer,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <Radar size={24} color={colors.secondary} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 15, fontWeight: '800', color: colors.text }}>
                                    {language === 'vi' ? 'Đang sẵn sàng kết nối việc' : 'Listening for Near Gigs'}
                                </Text>
                                <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 3, lineHeight: 18 }}>
                                    {language === 'vi' ? 'Hệ thống tự động thông báo ngay khi có người thuê việc trong bán kính 10km quanh bạn.' : 'Notifying automatically when clients post gigs within 10km.'}
                                </Text>
                            </View>
                        </View>

                        {/* Thẻ mô phỏng nổ cuốc nhận việc */}
                        <View
                            style={{
                                padding: 20,
                                borderRadius: 22,
                                backgroundColor: colors.surfaceContainer,
                                borderWidth: 1.5,
                                borderColor: colors.secondary,
                                alignItems: 'center',
                                gap: 10,
                            }}
                        >
                            <Text style={{ fontSize: 13, fontWeight: '800', color: colors.secondary, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                                {language === 'vi' ? 'THỬ NGHIỆM: NHẬN CUỐC VIỆC' : 'DEMO: RECEIVE GIG ALERT'}
                            </Text>
                            <Text style={{ fontSize: 13, color: colors.textSecondary, textAlign: 'center', lineHeight: 18 }}>
                                {language === 'vi' ? 'Bấm nút dưới để xem giao diện chuông cảnh báo việc mới với đầy đủ mức lương và khoảng cách.' : 'Tap below to simulate an incoming job alert with wage details and distance.'}
                            </Text>

                            <TouchableOpacity
                                activeOpacity={0.88}
                                onPress={() => router.push('/(worker)/alert')}
                                style={[
                                    {
                                        width: '100%',
                                        borderRadius: 16,
                                        overflow: 'hidden',
                                        marginTop: 6,
                                    },
                                    shadows.electricGlow,
                                ]}
                            >
                                <LinearGradient
                                    colors={gradients.worker}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={{ paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                                >
                                    <BellRing size={18} color="#ffffff" />
                                    <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '800' }}>
                                        {language === 'vi' ? 'MÔ PHỎNG: CÓ VIỆC MỚI NỔ CHUÔNG 🔔' : 'SIMULATE: INCOMING JOB ALERT 🔔'}
                                    </Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>

                {/* Floating Bottom Navigation */}
                <GlassBottomBar />
            </View>
        </SafeAreaView>
    );
}
