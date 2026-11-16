import React from 'react';
import { View, Text, TouchableOpacity, Alert, Linking } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowLeft, MessageSquare, Phone, Navigation, CheckCircle2 } from 'lucide-react-native';
import { useAppTheme } from '../../constants/theme';
import { useI18n } from '../../i18n';
import { GoongService } from '../../services/goongService';
import GlassBottomBar from '../../components/GlassBottomBar';

export default function WorkerOnDutyScreen() {
    const router = useRouter();
    const { colors, gradients, shadows } = useAppTheme();
    const { t, language } = useI18n();

    const handleCallCustomer = () => {
        Alert.alert(
            t('chat.callOptionTitle'),
            t('chat.callOptionSubtitle'),
            [
                {
                    text: t('chat.appCall'),
                    onPress: () => router.push({
                        pathname: '/(shared)/call',
                        params: { name: 'Nguyễn Văn An (Người Thuê)', role: 'Người Thuê Việc', phone: '0912345678' },
                    }),
                },
                {
                    text: t('chat.phoneCall'),
                    onPress: () => Linking.openURL('tel:0912345678'),
                },
                { text: t('common.cancel'), style: 'cancel' },
            ]
        );
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <View style={{ flex: 1, justifyContent: 'space-between' }}>
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
                        zIndex: 10,
                    }}
                >
                    <TouchableOpacity
                        onPress={() => {
                            if (router.canGoBack()) {
                                router.back();
                            } else {
                                router.replace('/(worker)');
                            }
                        }}
                        style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surfaceContainer, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <ArrowLeft size={20} color={colors.text} />
                    </TouchableOpacity>
                    <View style={{ alignItems: 'center' }}>
                        <Text style={{ fontSize: 16, fontWeight: '800', color: colors.text }}>
                            {t('worker.onDutyTitle')}
                        </Text>
                        <Text style={{ fontSize: 11, color: colors.secondary, fontWeight: '700' }}>
                            {language === 'vi' ? 'Mã cuốc việc #JF-892' : 'Gig Code #JF-892'}
                        </Text>
                    </View>
                    <TouchableOpacity
                        onPress={() => router.push('/(shared)/chat')}
                        style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: colors.surfaceContainer, alignItems: 'center', justifyContent: 'center' }}
                    >
                        <MessageSquare size={18} color={colors.primary} />
                    </TouchableOpacity>
                </View>

                {/* Khối định vị di chuyển Goong Maps */}
                <View style={{ flex: 1, backgroundColor: colors.surfaceContainer, justifyContent: 'center', alignItems: 'center', padding: 24, position: 'relative', overflow: 'hidden' }}>
                    <Image
                        source={{ uri: GoongService.getStaticMapUrl(10.8031, 106.6784, 15, 800, 600) }}
                        style={{ position: 'absolute', inset: 0, opacity: 0.8 }}
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
                        <Navigation size={12} color={colors.secondary} style={{ marginRight: 5 }} />
                        <Text style={{ fontSize: 10, fontWeight: '800', color: colors.secondary, letterSpacing: 0.6 }}>
                            GOONG MAPS DẪN ĐƯỜNG
                        </Text>
                    </View>

                    <View style={[{ width: 88, height: 88, borderRadius: 44, backgroundColor: colors.surface, borderWidth: 3, borderColor: colors.secondary, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }, shadows.electricGlow]}>
                        <Navigation size={40} color={colors.secondary} />
                    </View>
                    <View style={{ backgroundColor: colors.surface, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: colors.border }}>
                        <Text style={{ fontSize: 20, fontWeight: '800', color: colors.text }}>
                            {language === 'vi' ? 'Cách điểm hẹn 1.2 km' : '1.2 km to meeting point'}
                        </Text>
                    </View>
                    <View style={{ backgroundColor: colors.surface, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8, marginTop: 6, borderWidth: 1, borderColor: colors.border }}>
                        <Text style={{ fontSize: 12, color: colors.textSecondary, fontWeight: '600' }}>
                            {language === 'vi' ? 'Dự kiến có mặt trong khoảng 5 phút' : 'Estimated arrival in 5 minutes'}
                        </Text>
                    </View>

                    <View style={{ marginTop: 16, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 9999, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: colors.border }}>
                        <CheckCircle2 size={15} color="#10b981" />
                        <Text style={{ fontSize: 13, color: '#10b981', fontWeight: '700' }}>
                            {language === 'vi' ? 'Đang trên đường đến địa điểm làm' : 'En route to work location'}
                        </Text>
                    </View>
                </View>

                {/* Bottom Sheet thông tin khách & nghiệm thu */}
                <View
                    style={[
                        {
                            padding: 24,
                            borderTopLeftRadius: 32,
                            borderTopRightRadius: 32,
                            backgroundColor: colors.surface,
                            borderTopWidth: 1,
                            borderColor: colors.border,
                            gap: 16,
                            zIndex: 10,
                        },
                        shadows.floating,
                    ]}
                >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <View>
                            <Text style={{ fontSize: 16, fontWeight: '800', color: colors.text }}>
                                {language === 'vi' ? 'Người thuê: Nguyễn Văn An' : 'Client: Nguyen Van An'}
                            </Text>
                            <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>
                                White Palace, Hoàng Văn Thụ, Q.Phú Nhuận
                            </Text>
                        </View>
                        <TouchableOpacity
                            activeOpacity={0.85}
                            onPress={handleCallCustomer}
                            style={{
                                paddingHorizontal: 14,
                                paddingVertical: 10,
                                borderRadius: 14,
                                backgroundColor: '#dcfce7',
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 6,
                            }}
                        >
                            <Phone size={15} color="#16a34a" />
                            <Text style={{ fontSize: 13, fontWeight: '700', color: '#16a34a' }}>
                                {t('worker.callCustomerBtn')}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        activeOpacity={0.88}
                        onPress={() => router.push('/(worker)/proof')}
                        style={[
                            {
                                width: '100%',
                                borderRadius: 16,
                                overflow: 'hidden',
                                marginBottom: 70,
                            },
                            shadows.electricGlow,
                        ]}
                    >
                        <LinearGradient
                            colors={gradients.worker}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={{ paddingVertical: 14, alignItems: 'center', borderRadius: 16 }}
                        >
                            <Text style={{ color: '#ffffff', fontSize: 15, fontWeight: '800' }}>
                                {t('worker.finishJobBtn')} & {language === 'vi' ? 'Gửi ảnh nghiệm thu' : 'Submit Proof'}
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
