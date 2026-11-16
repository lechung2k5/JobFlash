import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowLeft, Camera, CheckSquare, Square, CheckCircle2 } from 'lucide-react-native';
import { useAppTheme } from '../../constants/theme';
import { useI18n } from '../../i18n';
import GlassBottomBar from '../../components/GlassBottomBar';

export default function WorkerProofScreen() {
    const router = useRouter();
    const { colors, gradients, shadows } = useAppTheme();
    const { t, language } = useI18n();

    const [confirmed, setConfirmed] = useState(true);
    const [photoTaken, setPhotoTaken] = useState(false);

    const handleSubmit = () => {
        Alert.alert(
            t('common.success'),
            language === 'vi'
                ? 'Nghiệm thu hoàn tất! Đã ghi nhận thu nhập 350.000đ và trích 10% phí dịch vụ (35.000đ) vào mục công nợ.'
                : 'Job completed! 350,000 VND earned, 10% platform fee (35,000 VND) logged to service fee debt.',
            [{ text: 'OK', onPress: () => router.replace('/(worker)') }]
        );
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <View style={{ flex: 1, justifyContent: 'space-between', padding: 24 }}>
                <View>
                    <TouchableOpacity
                        onPress={() => {
                            if (router.canGoBack()) {
                                router.back();
                            } else {
                                router.replace('/(worker)');
                            }
                        }}
                        style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surfaceContainer, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <ArrowLeft size={20} color={colors.text} />
                    </TouchableOpacity>

                    <Text style={{ fontSize: 26, fontWeight: '800', color: colors.text }}>
                        {t('worker.proofTitle')}
                    </Text>
                    <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 4, lineHeight: 18 }}>
                        {t('worker.proofSubtitle')}
                    </Text>

                    {/* Khung chụp ảnh nghiệm thu */}
                    <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={() => setPhotoTaken(true)}
                        style={[
                            {
                                marginTop: 24,
                                padding: 28,
                                borderRadius: 24,
                                borderWidth: 2,
                                borderStyle: 'dashed',
                                borderColor: photoTaken ? '#10b981' : colors.secondary,
                                backgroundColor: photoTaken ? '#f0fdf4' : colors.surface,
                                alignItems: 'center',
                                justifyContent: 'center',
                            },
                            shadows.card,
                        ]}
                    >
                        <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: photoTaken ? '#dcfce7' : colors.surfaceContainer, alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                            {photoTaken ? (
                                <CheckCircle2 size={32} color="#16a34a" />
                            ) : (
                                <Camera size={32} color={colors.secondary} />
                            )}
                        </View>
                        <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>
                            {photoTaken
                                ? (language === 'vi' ? '✓ Đã chụp ảnh kết quả hiện trường' : '✓ Photo captured')
                                : (language === 'vi' ? 'Chạm để chụp hoặc tải ảnh lên' : 'Tap to take or upload photo')}
                        </Text>
                        <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }}>
                            {language === 'vi' ? 'Ảnh rõ nét không gian sau khi hoàn thành công việc' : 'Clear photo of the completed workspace'}
                        </Text>
                    </TouchableOpacity>

                    {/* Checkbox xác nhận */}
                    <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={() => setConfirmed(!confirmed)}
                        style={[
                            {
                                marginTop: 20,
                                padding: 16,
                                borderRadius: 18,
                                backgroundColor: colors.surface,
                                borderWidth: 1,
                                borderColor: colors.border,
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 12,
                            },
                            shadows.card,
                        ]}
                    >
                        {confirmed ? (
                            <CheckSquare size={20} color={colors.secondary} />
                        ) : (
                            <Square size={20} color={colors.textSecondary} />
                        )}
                        <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text, flex: 1, lineHeight: 18 }}>
                            {language === 'vi' ? 'Người thuê đã kiểm tra và đồng ý hoàn thành tại hiện trường.' : 'The client has inspected and approved completion on site.'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Nút gửi & hoàn thành */}
                <View style={{ paddingTop: 20, marginBottom: 70 }}>
                    <TouchableOpacity
                        activeOpacity={0.88}
                        onPress={handleSubmit}
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
                            style={{ paddingVertical: 14, alignItems: 'center', borderRadius: 16 }}
                        >
                            <Text style={{ color: '#ffffff', fontSize: 15, fontWeight: '800' }}>
                                {t('worker.confirmCompleteBtn')} (350.000 {t('common.currency')})
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
