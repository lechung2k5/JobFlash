import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowLeft, Globe, Moon, Sun } from 'lucide-react-native';
import { useAuthStore } from '../../store/useAuthStore';
import { JobFlashAPI, API_BASE_URL } from '../../services/apiClient';
import { useAppTheme } from '../../constants/theme';
import { useI18n } from '../../i18n';

export default function LoginScreen() {
    const router = useRouter();
    const userRole = useAuthStore((state) => state.userRole);
    const setAuth = useAuthStore((state) => state.setAuth);

    const { colors, gradients, shadows, isDark, toggleTheme } = useAppTheme();
    const { t, language, toggleLanguage } = useI18n();

    const [phone, setPhone] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    // Mã OTP chuẩn 6 chữ số
    const [otpValues, setOtpValues] = useState<string[]>(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);

    // Chuyển về màn hình chọn vai trò nếu chưa chọn vai trò
    useEffect(() => {
        if (!userRole) {
            router.replace('/(auth)/role-select');
        }
    }, [userRole]);

    // Refs để tự động nhảy con trỏ giữa 6 ô nhập mã
    const inputRefs = useRef<any[]>([]);

    const handleSendOtp = async () => {
        const cleanPhone = phone.trim().replace(/\s+/g, '');
        if (!cleanPhone || cleanPhone.length < 9) {
            Alert.alert(
                t('common.error'),
                language === 'vi'
                    ? 'Vui lòng nhập số điện thoại của bạn (từ 9 đến 10 chữ số).'
                    : 'Please enter a valid phone number (9-10 digits).'
            );
            return;
        }

        setLoading(true);
        try {
            const res = await JobFlashAPI.auth.sendOtp(cleanPhone);
            setOtpSent(true);
            Alert.alert(
                language === 'vi' ? 'Đã gửi mã xác nhận' : 'OTP Sent',
                language === 'vi'
                    ? `Mã OTP 6 số đã được in ra trực tiếp tại Terminal Backend để bạn kiểm tra!`
                    : `6-digit OTP has been printed directly to Backend Terminal for testing!`
            );
        } catch (e: any) {
            console.warn('Lỗi kết nối Backend:', e);
            setOtpSent(true);
            Alert.alert(
                language === 'vi' ? 'Thông báo kết nối' : 'Connection Notice',
                language === 'vi'
                    ? `Không kết nối được tới máy chủ (${e.message}). Bạn có thể nhập 123456 để tiếp tục thử nghiệm.`
                    : `Cannot reach server (${e.message}). You can use 123456 to continue.`
            );
        } finally {
            setLoading(false);
        }
    };

    const handleOtpChange = (text: string, index: number) => {
        const nextOtp = [...otpValues];
        // Chỉ nhận ký tự số
        const cleanChar = text.replace(/[^0-9]/g, '');
        nextOtp[index] = cleanChar ? cleanChar[cleanChar.length - 1] : '';
        setOtpValues(nextOtp);

        // Tự động nhảy sang ô tiếp theo nếu vừa nhập xong
        if (cleanChar && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpKeyPress = (e: any, index: number) => {
        // Tự động lùi về ô trước khi bấm Backspace ở ô trống
        if (e.nativeEvent.key === 'Backspace' && !otpValues[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleConfirmOtp = async () => {
        const fullOtp = otpValues.join('');
        if (fullOtp.length < 6) {
            Alert.alert(
                t('common.error'),
                language === 'vi' ? 'Vui lòng nhập đủ 6 chữ số mã xác nhận OTP.' : 'Please enter all 6 digits of the OTP.'
            );
            return;
        }

        const cleanPhone = phone.trim().replace(/\s+/g, '');
        setLoading(true);
        try {
            const res = await JobFlashAPI.auth.verifyOtp(cleanPhone, fullOtp, userRole || 'requester');
            setAuth(res.accessToken, res.user);

            // Nhận diện tài khoản & Ràng buộc CCCD đối với bên Thợ
            const isBasicProfileComplete =
                res.user?.fullName &&
                res.user.fullName !== 'Người dùng mới' &&
                res.user?.address;

            const targetRole = userRole || res.user.activeRole || 'requester';
            const hasWorkerCCCD = Boolean(
                res.user?.workerProfile?.idCardFrontUrl && res.user?.workerProfile?.idCardBackUrl
            );

            if (!isBasicProfileComplete) {
                router.replace('/(auth)/profile-setup');
                return;
            }

            // BẮT BUỘC: Nếu tài khoản chưa cập nhật CCCD khi qua bên Thợ thì phải cập nhật mới cho vào app
            if (targetRole === 'worker' && !hasWorkerCCCD) {
                router.replace('/(auth)/profile-setup');
                return;
            }

            router.replace(targetRole === 'worker' ? '/(worker)' : '/(requester)');
        } catch (e: any) {
            // Kiểm tra nếu là mã dev 123456
            if (fullOtp === '123456') {
                const devUser = {
                    phone: phone,
                    fullName: 'Người dùng mới',
                    activeRole: userRole || 'requester',
                };
                setAuth('dev-session-token', devUser);
                router.replace('/(auth)/profile-setup');
            } else {
                Alert.alert(
                    t('common.error'),
                    e.message || (language === 'vi' ? 'Mã OTP không hợp lệ hoặc đã hết hạn.' : 'Invalid OTP code.')
                );
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={{
                        flexGrow: 1,
                        justifyContent: 'space-between',
                        padding: 24,
                    }}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="on-drag"
                    showsVerticalScrollIndicator={false}
                >
                <View>
                    {/* Header Controls: Nút Back + Switch Theme + Switch Lang */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                        <TouchableOpacity
                            onPress={() => router.replace('/(auth)/role-select')}
                            style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surfaceContainer, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <ArrowLeft color={colors.text} size={20} />
                        </TouchableOpacity>

                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                            {/* Nút đổi ngôn ngữ VIE / ENG */}
                            <TouchableOpacity
                                onPress={toggleLanguage}
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    backgroundColor: colors.surfaceContainer,
                                    paddingHorizontal: 10,
                                    paddingVertical: 6,
                                    borderRadius: 12,
                                }}
                            >
                                <Globe size={15} color={colors.primary} />
                                <Text style={{ marginLeft: 4, fontSize: 12, fontWeight: '700', color: colors.primary }}>
                                    {language.toUpperCase()}
                                </Text>
                            </TouchableOpacity>

                            {/* Nút đổi giao diện Sáng / Tối */}
                            <TouchableOpacity
                                onPress={toggleTheme}
                                style={{
                                    backgroundColor: colors.surfaceContainer,
                                    padding: 8,
                                    borderRadius: 12,
                                }}
                            >
                                {isDark ? <Sun size={16} color={colors.warning} /> : <Moon size={16} color={colors.textSecondary} />}
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Tiêu đề & Vai trò */}
                    <View style={{ marginTop: 8 }}>
                        <Text style={{ fontSize: 13, fontWeight: '700', color: colors.primary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>
                            {userRole === 'requester' ? t('auth.requesterRoleTitle') : t('auth.workerRoleTitle')}
                        </Text>
                        <Text style={{ fontSize: 28, fontWeight: '800', color: colors.text, lineHeight: 36 }}>
                            {t('auth.welcomeTitle')}
                        </Text>
                        <Text style={{ fontSize: 15, color: colors.textSecondary, marginTop: 6, lineHeight: 22 }}>
                            {t('auth.welcomeSubtitle')}
                        </Text>
                    </View>

                    {/* Ô nhập Số điện thoại */}
                    <View style={{ marginTop: 32 }}>
                        <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 8 }}>
                            {t('auth.phoneLabel')} (+84)
                        </Text>
                        <View style={{ position: 'relative', justifyContent: 'center' }}>
                            <Text style={{ position: 'absolute', left: 16, zIndex: 10, fontSize: 15, fontWeight: '600', color: colors.textSecondary }}>
                                🇻🇳 +84
                            </Text>
                            <TextInput
                                value={phone}
                                onChangeText={setPhone}
                                keyboardType="phone-pad"
                                placeholder={t('auth.phonePlaceholder')}
                                placeholderTextColor={colors.placeholder}
                                editable={!otpSent}
                                style={{
                                    width: '100%',
                                    paddingLeft: 84,
                                    paddingRight: 16,
                                    paddingVertical: 14,
                                    backgroundColor: colors.surface,
                                    borderRadius: 16,
                                    borderWidth: 1.5,
                                    borderColor: colors.border,
                                    color: colors.text,
                                    fontWeight: '700',
                                    fontSize: 16,
                                    opacity: otpSent ? 0.75 : 1,
                                }}
                            />
                        </View>

                        {/* Nút Gửi OTP hoặc Nhập 6 ô OTP */}
                        {!otpSent ? (
                            <TouchableOpacity
                                activeOpacity={0.88}
                                disabled={loading}
                                onPress={handleSendOtp}
                                style={[
                                    {
                                        marginTop: 24,
                                        borderRadius: 16,
                                        backgroundColor: colors.surface,
                                        borderWidth: 1.5,
                                        borderColor: colors.primary,
                                        paddingVertical: 16,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    },
                                    shadows.card,
                                ]}
                            >
                                {loading ? (
                                    <ActivityIndicator color={colors.primary} />
                                ) : (
                                    <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 16 }}>
                                        {t('auth.sendOtpBtn')}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        ) : (
                            <View style={{ marginTop: 24 }}>
                                <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 14 }}>
                                    {t('auth.enterOtpLabel')}
                                </Text>

                                {/* Hàng 6 ô nhập OTP */}
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
                                    {otpValues.map((val, idx) => (
                                        <TextInput
                                            key={idx}
                                            ref={(el) => {
                                                inputRefs.current[idx] = el;
                                            }}
                                            value={val}
                                            maxLength={1}
                                            keyboardType="number-pad"
                                            onChangeText={(text) => handleOtpChange(text, idx)}
                                            onKeyPress={(e) => handleOtpKeyPress(e, idx)}
                                            style={{
                                                width: 46,
                                                height: 56,
                                                backgroundColor: colors.surface,
                                                borderRadius: 14,
                                                borderWidth: 2,
                                                borderColor: val ? colors.primary : colors.border,
                                                color: colors.text,
                                                textAlign: 'center',
                                                fontSize: 22,
                                                fontWeight: '800',
                                            }}
                                        />
                                    ))}
                                </View>

                                <TouchableOpacity
                                    activeOpacity={0.88}
                                    disabled={loading}
                                    onPress={handleConfirmOtp}
                                    style={[{ borderRadius: 16, overflow: 'hidden' }, shadows.electricGlow]}
                                >
                                    <LinearGradient
                                        colors={gradients.electric}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                        style={{ paddingVertical: 16, alignItems: 'center', borderRadius: 16 }}
                                    >
                                        {loading ? (
                                            <ActivityIndicator color={colors.onPrimary} />
                                        ) : (
                                            <Text style={{ color: colors.onPrimary, fontWeight: '700', fontSize: 16 }}>
                                                {t('auth.confirmOtpBtn')}
                                            </Text>
                                        )}
                                    </LinearGradient>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={handleSendOtp}
                                    style={{ marginTop: 16, alignItems: 'center' }}
                                >
                                    <Text style={{ fontSize: 13, fontWeight: '600', color: colors.primary }}>
                                        {t('auth.resendOtp')}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>

                {/* Khoảng trống tinh tế dưới cùng (Đã bỏ dòng bảo mật an toàn theo yêu cầu) */}
                <View style={{ paddingBottom: 16 }} />
            </ScrollView>
        </KeyboardAvoidingView>
    </SafeAreaView>
);
}
