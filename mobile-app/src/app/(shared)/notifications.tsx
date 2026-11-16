import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, CheckCircle2, Tag, ShieldCheck } from 'lucide-react-native';
import { useAuthStore } from '../../store/useAuthStore';
import { useAppTheme } from '../../constants/theme';
import { useI18n } from '../../i18n';
import GlassBottomBar from '../../components/GlassBottomBar';

export default function NotificationsScreen() {
    const router = useRouter();
    const userRole = useAuthStore((state) => state.userRole);
    const { colors, shadows } = useAppTheme();
    const { t, language } = useI18n();

    const handleBack = () => {
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace(userRole === 'worker' ? '/(worker)' : '/(requester)');
        }
    };

    const notifications = [
        {
            icon: CheckCircle2,
            iconColor: '#16a34a',
            bgColor: '#dcfce7',
            title: language === 'vi' ? 'Nghiệm thu hoàn tất' : 'Job Completed',
            desc: language === 'vi' ? 'Ca việc #892 đã được hoàn thành tốt đẹp!' : 'Gig #892 has been marked completed!',
            time: language === 'vi' ? '10 phút trước' : '10m ago',
        },
        {
            icon: Tag,
            iconColor: colors.primary,
            bgColor: colors.surfaceContainer,
            title: language === 'vi' ? 'Ưu đãi phí dịch vụ' : 'Promotion',
            desc: language === 'vi' ? 'Hỗ trợ kết nối miễn phí cho 3 cuốc việc đầu tiên trong tuần.' : 'Free matching for first 3 jobs this week.',
            time: language === 'vi' ? '2 giờ trước' : '2h ago',
        },
        {
            icon: ShieldCheck,
            iconColor: '#d97706',
            bgColor: '#fef3c7',
            title: language === 'vi' ? 'Xác thực hồ sơ thành công' : 'Verification Approved',
            desc: language === 'vi' ? 'Giấy tờ của bạn đã được kiểm duyệt an toàn trên JobFlash.' : 'Your identity has been verified on JobFlash.',
            time: language === 'vi' ? '1 ngày trước' : '1d ago',
        },
    ];

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <View style={{ flex: 1 }}>
                {/* Top Bar */}
                <View
                    style={{
                        padding: 16,
                        borderBottomWidth: 1,
                        borderColor: colors.border,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: colors.surface,
                    }}
                >
                    <TouchableOpacity
                        onPress={handleBack}
                        style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surfaceContainer, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <ArrowLeft size={20} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={{ fontSize: 17, fontWeight: '800', color: colors.text }}>
                        {language === 'vi' ? 'Thông báo' : 'Notifications'}
                    </Text>
                    <TouchableOpacity>
                        <Text style={{ fontSize: 13, color: colors.primary, fontWeight: '700' }}>
                            {language === 'vi' ? 'Đã đọc hết' : 'Mark read'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Notifications List */}
                <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 110, gap: 10 }} showsVerticalScrollIndicator={false}>
                    {notifications.map((n, idx) => {
                        const IconComponent = n.icon;
                        return (
                            <View
                                key={idx}
                                style={[
                                    {
                                        padding: 16,
                                        borderRadius: 20,
                                        backgroundColor: colors.surface,
                                        borderWidth: 1,
                                        borderColor: colors.border,
                                        flexDirection: 'row',
                                        gap: 14,
                                        alignItems: 'flex-start',
                                    },
                                    shadows.card,
                                ]}
                            >
                                <View style={{ padding: 10, borderRadius: 14, backgroundColor: n.bgColor, marginTop: 2 }}>
                                    <IconComponent size={20} color={n.iconColor} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontSize: 15, fontWeight: '800', color: colors.text }}>{n.title}</Text>
                                    <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 4, lineHeight: 18 }}>
                                        {n.desc}
                                    </Text>
                                    <Text style={{ fontSize: 11, color: colors.placeholder, marginTop: 6 }}>
                                        {n.time}
                                    </Text>
                                </View>
                            </View>
                        );
                    })}
                </ScrollView>

                {/* Thanh menu cố định ở dưới */}
                <GlassBottomBar />
            </View>
        </SafeAreaView>
    );
}
