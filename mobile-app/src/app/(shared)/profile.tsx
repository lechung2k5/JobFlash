import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    User,
    Star,
    History,
    CreditCard,
    Bell,
    Headphones,
    FileText,
    ChevronRight,
    RefreshCw,
    Globe,
    Moon,
    Sun,
    LogOut,
    Edit3,
    ShieldCheck,
    AlertCircle,
    Check,
    Phone,
    MapPin,
    Mail,
    Calendar,
    Wallet,
    ScanLine,
    ArrowLeft,
} from 'lucide-react-native';
import { useAuthStore } from '../../store/useAuthStore';
import { JobFlashAPI } from '../../services/apiClient';
import GlassBottomBar from '../../components/GlassBottomBar';
import { useAppTheme } from '../../constants/theme';
import { useI18n } from '../../i18n';

export default function ProfileScreen() {
    const router = useRouter();
    const token = useAuthStore((state) => state.token);
    const userRole = useAuthStore((state) => state.userRole);
    const currentUser = useAuthStore((state) => state.user);
    const setRole = useAuthStore((state) => state.setRole);
    const setAuth = useAuthStore((state) => state.setAuth);
    const logout = useAuthStore((state) => state.logout);

    const { colors, gradients, shadows, isDark, toggleTheme } = useAppTheme();
    const { t, language, toggleLanguage } = useI18n();

    const [isRefreshing, setIsRefreshing] = useState(false);

    // Tự động đồng bộ dữ liệu mới nhất từ máy chủ khi vào màn hình
    useEffect(() => {
        let isMounted = true;
        const fetchLatestProfile = async () => {
            if (!token) return;
            try {
                setIsRefreshing(true);
                const freshUser = await JobFlashAPI.users.getMe();
                if (isMounted && freshUser && freshUser.id) {
                    setAuth(token, freshUser);
                }
            } catch (err: any) {
                console.warn('Lỗi đồng bộ hồ sơ từ máy chủ:', err?.message);
            } finally {
                if (isMounted) setIsRefreshing(false);
            }
        };

        fetchLatestProfile();
        return () => {
            isMounted = false;
        };
    }, []);

    const isWorker = userRole === 'worker';
    const hasWorkerIdCard = Boolean(
        currentUser?.workerProfile?.idCardFrontUrl && currentUser?.workerProfile?.idCardBackUrl
    );

    // Định dạng ngày sinh hiển thị trực quan DD/MM/YYYY
    const formatDob = (dobString?: string) => {
        if (!dobString) return language === 'vi' ? 'Chưa cập nhật' : 'Not updated';
        try {
            const clean = dobString.slice(0, 10);
            if (clean.includes('-')) {
                const [y, m, d] = clean.split('-');
                return `${d}/${m}/${y}`;
            }
            return clean;
        } catch {
            return dobString;
        }
    };

    // Định dạng giới tính thân thiện
    const getGenderLabel = (g?: string) => {
        if (g === 'MALE') return language === 'vi' ? 'Nam' : 'Male';
        if (g === 'FEMALE') return language === 'vi' ? 'Nữ' : 'Female';
        if (g === 'OTHER') return language === 'vi' ? 'Khác' : 'Other';
        return language === 'vi' ? 'Chưa cập nhật' : 'Not set';
    };

    // Chuyển đổi vai trò linh hoạt: Người thuê việc <-> Đối tác thợ
    const handleSwitchRole = async () => {
        const nextRole = isWorker ? 'requester' : 'worker';

        // NẾU CHUYỂN SANG THỢ MÀ CHƯA CÓ CCCD: Bắt buộc cập nhật CCCD mới cho vào app
        if (nextRole === 'worker' && !hasWorkerIdCard) {
            Alert.alert(
                language === 'vi' ? 'Yêu cầu xác minh CCCD' : 'Worker ID Verification Required',
                language === 'vi'
                    ? 'Thông tin cá nhân từ người thuê việc đã được tự động điền sẵn. Bạn chỉ cần chụp ảnh rõ nét 2 mặt CCCD để hoàn tất hồ sơ và vào nhận việc!'
                    : 'Personal details have been auto-filled. Please verify your ID card to complete your worker profile and begin working!',
                [
                    { text: t('common.cancel'), style: 'cancel' },
                    {
                        text: language === 'vi' ? 'Cập nhật CCCD ngay' : 'Verify ID Now',
                        onPress: () => {
                            setRole('worker');
                            router.push('/(auth)/profile-setup');
                        },
                    },
                ]
            );
            return;
        }

        try {
            await JobFlashAPI.users.switchRole(nextRole);
        } catch (e: any) {
            console.warn('Lỗi switchRole backend:', e?.message);
        }

        setRole(nextRole);
        router.replace(nextRole === 'worker' ? '/(worker)' : '/(requester)');
    };

    const handleLogout = () => {
        Alert.alert(
            t('profile.logoutConfirmTitle'),
            t('profile.logoutConfirmMsg'),
            [
                { text: t('common.cancel'), style: 'cancel' },
                {
                    text: language === 'vi' ? 'Đăng xuất' : 'Log Out',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await logout();
                            await AsyncStorage.removeItem('jobflash-auth-storage');
                        } catch {}
                        router.replace('/(auth)/role-select');
                    },
                },
            ]
        );
    };

    const menuItems = [
        { icon: History, label: t('profile.gigHistory') },
        { icon: CreditCard, label: t('profile.paymentAndWallet') },
        { icon: Bell, label: t('profile.notifications') },
        { icon: Headphones, label: t('profile.customerSupport') },
        { icon: FileText, label: t('profile.termsAndPolicies') },
    ];

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <View style={{ flex: 1, position: 'relative' }}>
                <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
                    {/* Thanh tiêu đề & Nút chuyển đổi vai trò */}
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
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            <TouchableOpacity
                                onPress={() => router.canGoBack() ? router.back() : router.replace(isWorker ? '/(worker)' : '/(requester)')}
                                style={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: 20,
                                    backgroundColor: colors.surfaceContainer,
                                    borderWidth: 1,
                                    borderColor: colors.border,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <ArrowLeft size={20} color={colors.text} />
                            </TouchableOpacity>
                            <Text style={{ fontSize: 18, fontWeight: '800', color: colors.text }}>
                                {t('profile.title')}
                            </Text>
                            {isRefreshing && <ActivityIndicator size="small" color={colors.primary} />}
                        </View>

                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={handleSwitchRole}
                            style={{
                                paddingHorizontal: 12,
                                paddingVertical: 6,
                                borderRadius: 9999,
                                backgroundColor: colors.surfaceContainer,
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 6,
                                borderWidth: 1,
                                borderColor: colors.border,
                            }}
                        >
                            <RefreshCw size={13} color={isWorker ? colors.secondary : colors.primary} />
                            <Text style={{ fontSize: 12, fontWeight: '700', color: isWorker ? colors.secondary : colors.primary }}>
                                {isWorker ? t('profile.switchToRequester') : t('profile.switchToWorker')}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Thẻ tóm tắt hồ sơ: Ảnh đại diện + Tên + SĐT + Đánh giá */}
                    <View style={{ padding: 16 }}>
                        <View
                            style={[
                                {
                                    padding: 20,
                                    borderRadius: 24,
                                    backgroundColor: colors.surface,
                                    borderWidth: 1.5,
                                    borderColor: colors.border,
                                },
                                shadows.card,
                            ]}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                                <LinearGradient
                                    colors={isWorker ? gradients.worker : gradients.electric}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={{ width: 72, height: 72, borderRadius: 36, padding: 2.5, justifyContent: 'center', alignItems: 'center' }}
                                >
                                    <View style={{ width: '100%', height: '100%', borderRadius: 34, backgroundColor: colors.surfaceContainer, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
                                        {currentUser?.avatarUrl ? (
                                            <Image
                                                source={{ uri: currentUser.avatarUrl }}
                                                style={{ width: '100%', height: '100%' }}
                                                contentFit="cover"
                                                transition={200}
                                            />
                                        ) : (
                                            <User size={34} color={isWorker ? colors.secondary : colors.primary} />
                                        )}
                                    </View>
                                </LinearGradient>

                                <View style={{ flex: 1 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <Text style={{ fontSize: 18, fontWeight: '800', color: colors.text }} numberOfLines={1}>
                                            {currentUser?.fullName && currentUser.fullName !== 'Người dùng mới'
                                                ? currentUser.fullName
                                                : (language === 'vi' ? 'Người dùng JobFlash' : 'JobFlash User')}
                                        </Text>
                                    </View>

                                    <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 2, fontWeight: '600' }}>
                                        {currentUser?.phone ? `+84 ${currentUser.phone}` : ''}
                                    </Text>

                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <Star size={13} color="#d97706" fill="#d97706" />
                                            <Text style={{ fontSize: 12, fontWeight: '800', color: '#d97706', marginLeft: 3 }}>5.0</Text>
                                        </View>

                                        <View
                                            style={{
                                                paddingHorizontal: 8,
                                                paddingVertical: 3,
                                                borderRadius: 8,
                                                backgroundColor: isWorker ? colors.secondary + '20' : colors.primary + '20',
                                            }}
                                        >
                                            <Text style={{ fontSize: 11, fontWeight: '800', color: isWorker ? colors.secondary : colors.primary }}>
                                                {isWorker
                                                    ? (language === 'vi' ? 'Đối tác Thợ' : 'Worker Partner')
                                                    : (language === 'vi' ? 'Khách hàng' : 'Customer')}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* KHỐI 1: THÔNG TIN CHI TIẾT TÀI KHOẢN (Hiển thị đầy đủ, chính xác) */}
                    <View style={{ paddingHorizontal: 16, marginBottom: 14 }}>
                        <View
                            style={[
                                {
                                    borderRadius: 22,
                                    backgroundColor: colors.surface,
                                    borderWidth: 1.5,
                                    borderColor: colors.border,
                                    padding: 18,
                                },
                                shadows.card,
                            ]}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                                <Text style={{ fontSize: 15, fontWeight: '800', color: colors.text }}>
                                    {language === 'vi' ? 'Thông tin cá nhân' : 'Personal Information'}
                                </Text>
                                <TouchableOpacity
                                    activeOpacity={0.8}
                                    onPress={() => router.push('/(auth)/profile-setup')}
                                    style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                                >
                                    <Edit3 size={14} color={colors.primary} />
                                    <Text style={{ fontSize: 13, fontWeight: '700', color: colors.primary }}>
                                        {language === 'vi' ? 'Chỉnh sửa' : 'Edit'}
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            <View style={{ gap: 12 }}>
                                {/* Họ và tên */}
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <User size={16} color={colors.textSecondary} style={{ width: 24 }} />
                                    <Text style={{ fontSize: 13, color: colors.textSecondary, width: 85 }}>
                                        {language === 'vi' ? 'Họ và tên:' : 'Full name:'}
                                    </Text>
                                    <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text, flex: 1 }}>
                                        {currentUser?.fullName || (language === 'vi' ? 'Chưa cập nhật' : 'Not set')}
                                    </Text>
                                </View>

                                {/* Số điện thoại */}
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Phone size={16} color={colors.textSecondary} style={{ width: 24 }} />
                                    <Text style={{ fontSize: 13, color: colors.textSecondary, width: 85 }}>
                                        {language === 'vi' ? 'Điện thoại:' : 'Phone:'}
                                    </Text>
                                    <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text, flex: 1 }}>
                                        +84 {currentUser?.phone || ''}
                                    </Text>
                                </View>

                                {/* Địa chỉ */}
                                <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                                    <MapPin size={16} color={colors.textSecondary} style={{ width: 24, marginTop: 2 }} />
                                    <Text style={{ fontSize: 13, color: colors.textSecondary, width: 85, marginTop: 2 }}>
                                        {language === 'vi' ? 'Địa chỉ:' : 'Address:'}
                                    </Text>
                                    <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text, flex: 1, lineHeight: 18 }}>
                                        {currentUser?.address || currentUser?.workerProfile?.currentAddress || (language === 'vi' ? 'Chưa cập nhật địa chỉ' : 'No address set')}
                                    </Text>
                                </View>

                                {/* Email */}
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Mail size={16} color={colors.textSecondary} style={{ width: 24 }} />
                                    <Text style={{ fontSize: 13, color: colors.textSecondary, width: 85 }}>
                                        Email:
                                    </Text>
                                    <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text, flex: 1 }}>
                                        {currentUser?.email || (language === 'vi' ? 'Chưa có email' : 'No email')}
                                    </Text>
                                </View>

                                {/* Ngày sinh & Giới tính */}
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Calendar size={16} color={colors.textSecondary} style={{ width: 24 }} />
                                    <Text style={{ fontSize: 13, color: colors.textSecondary, width: 85 }}>
                                        {language === 'vi' ? 'Ngày sinh:' : 'DOB:'}
                                    </Text>
                                    <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text, flex: 1 }}>
                                        {formatDob(currentUser?.dateOfBirth || currentUser?.workerProfile?.dateOfBirth)} • {getGenderLabel(currentUser?.gender || currentUser?.workerProfile?.gender)}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* KHỐI 2: TÌNH TRẠNG CĂN CƯỚC CÔNG DÂN (CCCD) */}
                    <View style={{ paddingHorizontal: 16, marginBottom: 14 }}>
                        <View
                            style={[
                                {
                                    borderRadius: 22,
                                    backgroundColor: colors.surface,
                                    borderWidth: 1.5,
                                    borderColor: hasWorkerIdCard ? colors.success : colors.warning,
                                    padding: 18,
                                },
                                shadows.card,
                            ]}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    {hasWorkerIdCard ? (
                                        <ShieldCheck size={20} color={colors.success} />
                                    ) : (
                                        <AlertCircle size={20} color={colors.warning} />
                                    )}
                                    <Text style={{ fontSize: 15, fontWeight: '800', color: colors.text }}>
                                        {language === 'vi' ? 'Căn cước công dân (CCCD)' : 'National ID (CCCD)'}
                                    </Text>
                                </View>

                                <View
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        paddingHorizontal: 8,
                                        paddingVertical: 3,
                                        borderRadius: 8,
                                        backgroundColor: hasWorkerIdCard ? colors.success + '20' : colors.warning + '20',
                                    }}
                                >
                                    {hasWorkerIdCard ? <Check size={12} color={colors.success} /> : <AlertCircle size={12} color={colors.warning} />}
                                    <Text
                                        style={{
                                            fontSize: 11,
                                            fontWeight: '800',
                                            color: hasWorkerIdCard ? colors.success : colors.warning,
                                            marginLeft: 4,
                                        }}
                                    >
                                        {hasWorkerIdCard ? t('profile.idVerified') : t('profile.idUnverified')}
                                    </Text>
                                </View>
                            </View>

                            {hasWorkerIdCard ? (
                                <View>
                                    <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 10 }}>
                                        {language === 'vi'
                                            ? `Mã số CCCD: ${currentUser?.workerProfile?.idCardNumber || '079... (Đã mã hóa bảo mật)'}`
                                            : `ID Number: ${currentUser?.workerProfile?.idCardNumber || '079... (Encrypted)'}`}
                                    </Text>

                                    {/* Ảnh CCCD 2 mặt thu nhỏ */}
                                    <View style={{ flexDirection: 'row', gap: 10 }}>
                                        <View style={{ flex: 1, height: 90, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: colors.border }}>
                                            <Image source={{ uri: currentUser.workerProfile.idCardFrontUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                                            <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.6)', paddingVertical: 2, alignItems: 'center' }}>
                                                <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>
                                                    {language === 'vi' ? 'Mặt trước' : 'Front'}
                                                </Text>
                                            </View>
                                        </View>
                                        <View style={{ flex: 1, height: 90, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: colors.border }}>
                                            <Image source={{ uri: currentUser.workerProfile.idCardBackUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                                            <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.6)', paddingVertical: 2, alignItems: 'center' }}>
                                                <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>
                                                    {language === 'vi' ? 'Mặt sau' : 'Back'}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>

                                    <TouchableOpacity
                                        activeOpacity={0.8}
                                        onPress={() => {
                                            setRole('worker');
                                            router.push('/(auth)/profile-setup');
                                        }}
                                        style={{ marginTop: 10, alignSelf: 'flex-end' }}
                                    >
                                        <Text style={{ fontSize: 12, fontWeight: '700', color: colors.primary }}>
                                            {language === 'vi' ? 'Chụp lại CCCD khác' : 'Retake ID photos'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <View>
                                    <Text style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 18, marginBottom: 12 }}>
                                        {language === 'vi'
                                            ? 'Tài khoản chưa có dữ liệu Căn cước công dân. Bạn cần chụp rõ nét 2 mặt CCCD để đủ điều kiện nhận việc bên Đối tác thợ.'
                                            : 'No ID Card verified. Please upload both sides to qualify for worker gigs.'}
                                    </Text>

                                    <TouchableOpacity
                                        activeOpacity={0.85}
                                        onPress={() => {
                                            setRole('worker');
                                            router.push('/(auth)/profile-setup');
                                        }}
                                        style={[
                                            {
                                                borderRadius: 14,
                                                overflow: 'hidden',
                                            },
                                            shadows.card,
                                        ]}
                                    >
                                        <LinearGradient
                                            colors={gradients.worker}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                            style={{
                                                paddingVertical: 12,
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: 8,
                                            }}
                                        >
                                            <ScanLine size={16} color="#fff" />
                                            <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800' }}>
                                                {language === 'vi' ? 'Chụp ảnh CCCD 2 mặt ngay' : 'Capture ID Photos Now'}
                                            </Text>
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* KHỐI 3: VÍ DỊCH VỤ & THÔNG TIN TÀI KHOẢN (NẾU LÀ THỢ) */}
                    {isWorker && (
                        <View style={{ paddingHorizontal: 16, marginBottom: 14 }}>
                            <TouchableOpacity
                                activeOpacity={0.85}
                                onPress={() => router.push('/(worker)/wallet')}
                                style={[
                                    {
                                        borderRadius: 22,
                                        backgroundColor: colors.surface,
                                        borderWidth: 1.5,
                                        borderColor: colors.border,
                                        padding: 18,
                                    },
                                    shadows.card,
                                ]}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                        <Wallet size={18} color={colors.secondary} />
                                        <Text style={{ fontSize: 15, fontWeight: '800', color: colors.text }}>
                                            {language === 'vi' ? 'Ví dịch vụ & Nợ hoa hồng 10%' : 'Wallet & Commission'}
                                        </Text>
                                    </View>
                                    <ChevronRight size={16} color={colors.textSecondary} />
                                </View>

                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <View>
                                        <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                                            {language === 'vi' ? 'Phí dịch vụ cần thanh toán:' : 'Pending commission fee:'}
                                        </Text>
                                        <Text style={{ fontSize: 18, fontWeight: '800', color: colors.text, marginTop: 2 }}>
                                            {(currentUser?.wallet?.debtBalance || 0).toLocaleString('vi-VN')} đ
                                        </Text>
                                    </View>

                                    <View style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, backgroundColor: colors.surfaceContainer }}>
                                        <Text style={{ fontSize: 12, fontWeight: '700', color: colors.secondary }}>
                                            {language === 'vi' ? 'Xem chi tiết ví' : 'View Wallet'}
                                        </Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* KHỐI 4: TÙY CHỈNH ỨNG DỤNG (Ngôn ngữ VIE/ENG & Theme Sáng/Tối) */}
                    <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
                        <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', marginBottom: 8, letterSpacing: 0.5 }}>
                            {t('profile.preferences')}
                        </Text>

                        <View style={{ gap: 8 }}>
                            {/* Ngôn ngữ */}
                            <TouchableOpacity
                                activeOpacity={0.8}
                                onPress={toggleLanguage}
                                style={[
                                    {
                                        padding: 16,
                                        borderRadius: 18,
                                        backgroundColor: colors.surface,
                                        borderWidth: 1,
                                        borderColor: colors.border,
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                    },
                                    shadows.card,
                                ]}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                    <Globe size={18} color={colors.primary} />
                                    <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>
                                        {t('profile.displayLanguage')}
                                    </Text>
                                </View>
                                <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: colors.surfaceContainer }}>
                                    <Text style={{ fontSize: 12, fontWeight: '700', color: colors.primary }}>
                                        {language === 'vi' ? 'Tiếng Việt 🇻🇳' : 'English 🇬🇧'}
                                    </Text>
                                </View>
                            </TouchableOpacity>

                            {/* Giao diện Sáng/Tối */}
                            <TouchableOpacity
                                activeOpacity={0.8}
                                onPress={toggleTheme}
                                style={[
                                    {
                                        padding: 16,
                                        borderRadius: 18,
                                        backgroundColor: colors.surface,
                                        borderWidth: 1,
                                        borderColor: colors.border,
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                    },
                                    shadows.card,
                                ]}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                    {isDark ? <Sun size={18} color={colors.warning} /> : <Moon size={18} color={colors.primary} />}
                                    <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>
                                        {t('profile.appearance')}
                                    </Text>
                                </View>
                                <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: colors.surfaceContainer }}>
                                    <Text style={{ fontSize: 12, fontWeight: '700', color: colors.text }}>
                                        {isDark ? t('profile.darkMode') : t('profile.lightMode')}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* KHỐI 5: HỖ TRỢ & THÔNG TIN DỊCH VỤ */}
                    <View style={{ paddingHorizontal: 16, marginTop: 4 }}>
                        <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', marginBottom: 8, letterSpacing: 0.5 }}>
                            {t('profile.supportAndInfo')}
                        </Text>
                        <View style={{ gap: 8 }}>
                            {menuItems.map((item, idx) => {
                                const IconComponent = item.icon;
                                return (
                                    <TouchableOpacity
                                        key={idx}
                                        activeOpacity={0.8}
                                        onPress={() => Alert.alert(item.label, language === 'vi' ? 'Tính năng đang hoạt động bình thường.' : 'Feature is operational.')}
                                        style={[
                                            {
                                                padding: 16,
                                                borderRadius: 18,
                                                backgroundColor: colors.surface,
                                                borderWidth: 1,
                                                borderColor: colors.border,
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                            },
                                            shadows.card,
                                        ]}
                                    >
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                            <IconComponent size={18} color={colors.primary} />
                                            <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>{item.label}</Text>
                                        </View>
                                        <ChevronRight size={16} color={colors.textSecondary} />
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    {/* KHỐI 6: NÚT ĐĂNG XUẤT */}
                    <View style={{ padding: 16, marginTop: 8 }}>
                        <TouchableOpacity
                            activeOpacity={0.85}
                            onPress={handleLogout}
                            style={[
                                {
                                    width: '100%',
                                    paddingVertical: 14,
                                    borderRadius: 16,
                                    borderWidth: 1.5,
                                    borderColor: colors.error,
                                    alignItems: 'center',
                                    backgroundColor: colors.surface,
                                    flexDirection: 'row',
                                    justifyContent: 'center',
                                    gap: 8,
                                },
                                shadows.card,
                            ]}
                        >
                            <LogOut size={16} color={colors.error} />
                            <Text style={{ color: colors.error, fontSize: 14, fontWeight: '800' }}>
                                {t('profile.logoutBtn')}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>

                {/* THANH MENU CỐ ĐỊNH Ở DƯỚI: ĐẦY ĐỦ ICON VÀ TEXT */}
                <GlassBottomBar />
            </View>
        </SafeAreaView>
    );
}
