import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, Linking } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowLeft, MessageSquare, Phone, MapPin, Flag, Star, Navigation } from 'lucide-react-native';
import { useAppTheme } from '../../constants/theme';
import { useI18n } from '../../i18n';
import { GoongService } from '../../services/goongService';
import GlassBottomBar from '../../components/GlassBottomBar';

export default function RequesterTrackingScreen() {
    const router = useRouter();
    const { colors, gradients, shadows } = useAppTheme();
    const { t, language } = useI18n();

    const workers = [
        { name: 'Lê Chung', star: '5.0', status: language === 'vi' ? 'Đang di chuyển (500m)' : 'En route (500m)', statusColor: '#d97706', phone: '0912345678', initials: 'LC' },
        { name: 'Trần Nam', star: '4.9', status: language === 'vi' ? 'Đã có mặt tại địa điểm' : 'Arrived at location', statusColor: '#16a34a', phone: '0987654321', initials: 'TN' },
        { name: 'Hoàng Huy', star: '5.0', status: language === 'vi' ? 'Đang làm việc tại sảnh' : 'Working on site', statusColor: colors.primary, phone: '0901234567', initials: 'HH' },
    ];

    const handleCall = (worker: typeof workers[0]) => {
        Alert.alert(
            t('chat.callOptionTitle'),
            `${t('chat.callOptionSubtitle')} (${worker.name})`,
            [
                {
                    text: t('chat.appCall'),
                    onPress: () => router.push({
                        pathname: '/(shared)/call',
                        params: { name: worker.name, role: 'Đối Tác Thợ', phone: worker.phone },
                    }),
                },
                {
                    text: t('chat.phoneCall'),
                    onPress: () => Linking.openURL(`tel:${worker.phone}`),
                },
                { text: t('common.cancel'), style: 'cancel' },
            ]
        );
    };

    const handleFinishJob = () => {
        Alert.alert(
            language === 'vi' ? 'Nghiệm thu ca việc' : 'Complete Gig',
            language === 'vi' ? 'Bạn có muốn đánh giá chất lượng thợ không?' : 'Would you like to rate the workers?',
            [
                { text: language === 'vi' ? 'Để sau' : 'Later', onPress: () => router.replace('/(requester)') },
                { text: language === 'vi' ? 'Đánh giá ngay' : 'Rate now', onPress: () => router.push('/(requester)/rating') },
            ]
        );
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <View style={{ flex: 1, justifyContent: 'space-between' }}>
                {/* Top Header */}
                <View
                    style={{
                        padding: 16,
                        borderBottomWidth: 1,
                        borderColor: colors.border,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: colors.surface,
                        zIndex: 10,
                    }}
                >
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
                    <View style={{ alignItems: 'center' }}>
                        <Text style={{ fontSize: 16, fontWeight: '800', color: colors.text }}>
                            {language === 'vi' ? 'Tiến độ thực hiện công việc' : 'Gig Progress Tracking'}
                        </Text>
                        <Text style={{ fontSize: 11, color: '#16a34a', fontWeight: '700' }}>
                            {language === 'vi' ? 'Đang diễn ra • 3 nhân sự' : 'In Progress • 3 workers'}
                        </Text>
                    </View>
                    <TouchableOpacity
                        onPress={() => router.push('/(shared)/chat')}
                        style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: colors.surfaceContainer, alignItems: 'center', justifyContent: 'center' }}
                    >
                        <MessageSquare size={18} color={colors.primary} />
                    </TouchableOpacity>
                </View>

                {/* Bản đồ Goong Maps & Vị trí thợ thời gian thực */}
                <View style={{ flex: 1, backgroundColor: colors.surfaceContainer, position: 'relative', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
                    <Image
                        source={{ uri: GoongService.getStaticMapUrl(10.8031, 106.6784, 15, 800, 600) }}
                        style={{ position: 'absolute', inset: 0, opacity: 0.88 }}
                        contentFit="cover"
                    />

                    {/* Huy hiệu Goong Maps */}
                    <View
                        style={{
                            position: 'absolute',
                            top: 14,
                            left: 14,
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: 'rgba(15, 23, 42, 0.85)',
                            paddingHorizontal: 10,
                            paddingVertical: 5,
                            borderRadius: 10,
                            borderWidth: 1,
                            borderColor: 'rgba(255,255,255,0.15)',
                        }}
                    >
                        <Navigation size={12} color="#38bdf8" style={{ marginRight: 5 }} />
                        <Text style={{ fontSize: 10, fontWeight: '800', color: '#38bdf8', letterSpacing: 0.6 }}>
                            GOONG MAPS LIVE
                        </Text>
                    </View>

                    {/* Destination Marker */}
                    <View style={{ alignItems: 'center', marginTop: -40 }}>
                        <View style={[{ padding: 12, borderRadius: 18, backgroundColor: colors.secondary }, shadows.electricGlow]}>
                            <Flag size={22} color="#ffffff" />
                        </View>
                        <View style={{ paddingHorizontal: 10, paddingVertical: 4, marginTop: 6, borderRadius: 8, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}>
                            <Text style={{ fontSize: 11, color: colors.text, fontWeight: '700' }}>
                                Sảnh Diamond, White Palace
                            </Text>
                        </View>
                    </View>

                    {/* Thợ di chuyển 1 */}
                    <View style={{ position: 'absolute', top: '54%', left: 42, alignItems: 'center' }}>
                        <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: colors.primary, borderWidth: 2.5, borderColor: '#ffffff', alignItems: 'center', justifyContent: 'center' }}>
                            <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '800' }}>LC</Text>
                        </View>
                        <View style={{ backgroundColor: colors.surface, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginTop: 3, borderWidth: 1, borderColor: colors.border }}>
                            <Text style={{ fontSize: 10, color: colors.primary, fontWeight: '700' }}>500m</Text>
                        </View>
                    </View>

                    {/* Thợ di chuyển 2 */}
                    <View style={{ position: 'absolute', top: '42%', right: 46, alignItems: 'center' }}>
                        <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: '#10b981', borderWidth: 2.5, borderColor: '#ffffff', alignItems: 'center', justifyContent: 'center' }}>
                            <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '800' }}>TN</Text>
                        </View>
                        <View style={{ backgroundColor: colors.surface, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginTop: 3, borderWidth: 1, borderColor: colors.border }}>
                            <Text style={{ fontSize: 10, color: '#16a34a', fontWeight: '700' }}>
                                {language === 'vi' ? 'Có mặt' : 'Arrived'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Bottom Sheet List Workers */}
                <View
                    style={[
                        {
                            padding: 22,
                            borderTopLeftRadius: 32,
                            borderTopRightRadius: 32,
                            backgroundColor: colors.surface,
                            borderTopWidth: 1,
                            borderColor: colors.border,
                            gap: 14,
                            zIndex: 10,
                        },
                        shadows.floating,
                    ]}
                >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ fontSize: 14, fontWeight: '800', color: colors.text }}>
                            {language === 'vi' ? 'Danh sách nhân sự (3 người)' : 'Worker Team (3 people)'}
                        </Text>
                        <Text style={{ fontSize: 13, color: colors.primary, fontWeight: '800' }}>
                            1.050.000 {t('common.currency')}
                        </Text>
                    </View>

                    {/* Danh sách thợ */}
                    <View style={{ gap: 8 }}>
                        {workers.map((w, idx) => (
                            <View
                                key={idx}
                                style={{
                                    padding: 14,
                                    borderRadius: 16,
                                    backgroundColor: colors.surfaceContainer,
                                    borderWidth: 1,
                                    borderColor: colors.border,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                }}
                            >
                                <View>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                        <Text style={{ fontSize: 14, fontWeight: '800', color: colors.text }}>{w.name}</Text>
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <Star size={12} color="#d97706" fill="#d97706" />
                                            <Text style={{ fontSize: 11, color: '#d97706', fontWeight: '700', marginLeft: 2 }}>{w.star}</Text>
                                        </View>
                                    </View>
                                    <Text style={{ fontSize: 12, fontWeight: '600', marginTop: 2, color: w.statusColor }}>
                                        {w.status}
                                    </Text>
                                </View>

                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <TouchableOpacity
                                        activeOpacity={0.8}
                                        onPress={() => handleCall(w)}
                                        style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#dcfce7', alignItems: 'center', justifyContent: 'center' }}
                                    >
                                        <Phone size={15} color="#16a34a" />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        activeOpacity={0.8}
                                        onPress={() => router.push('/(shared)/chat')}
                                        style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }}
                                    >
                                        <MessageSquare size={15} color={colors.primary} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}
                    </View>

                    {/* Nút Nghiệm thu & Hoàn tất */}
                    <TouchableOpacity
                        activeOpacity={0.88}
                        onPress={handleFinishJob}
                        style={[
                            {
                                width: '100%',
                                borderRadius: 16,
                                overflow: 'hidden',
                                marginTop: 4,
                                marginBottom: 70,
                            },
                            shadows.electricGlow,
                        ]}
                    >
                        <LinearGradient
                            colors={gradients.electric}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={{ paddingVertical: 14, alignItems: 'center', borderRadius: 16 }}
                        >
                            <Text style={{ color: colors.onPrimary, fontSize: 15, fontWeight: '800' }}>
                                {language === 'vi' ? 'Nghiệm thu ca việc & Đánh giá' : 'Approve Work & Rate'}
                            </Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

                {/* Thanh menu cố định ở dưới */}
                <GlassBottomBar />
            </View>
        </SafeAreaView>
    );
}
