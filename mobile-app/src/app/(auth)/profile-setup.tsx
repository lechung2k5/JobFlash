import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
    Modal,
    Platform,
    KeyboardAvoidingView,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
    User,
    Camera,
    ShieldCheck,
    CheckCircle2,
    Globe,
    Moon,
    Sun,
    MapPin,
    Mail,
    Calendar,
    Phone,
    AlertCircle,
    Check,
    X,
    ImageIcon,
    Sparkles,
    ChevronRight,
    Navigation,
    RefreshCw,
    ScanLine,
    ArrowLeft,
    Radio,
    Cpu,
} from 'lucide-react-native';
import { useAuthStore } from '../../store/useAuthStore';
import { JobFlashAPI } from '../../services/apiClient';
import { GoongService, GoongPlacePrediction } from '../../services/goongService';
import DatePickerModal from '../../components/DatePickerModal';
import GoongMapCard from '../../components/GoongMapCard';
import NfcChipModal from '../../components/NfcChipModal';
import { useAppTheme } from '../../constants/theme';
import { useI18n } from '../../i18n';

// Nạp an toàn module expo-image-picker tránh crash bundle nếu chưa cài
const getImagePicker = () => {
    try {
        const pkg = 'expo-image-picker';
        return require(pkg);
    } catch {
        return null;
    }
};

// Regex kiểm tra tên tiếng Việt chuẩn: Tối thiểu 2 từ, chỉ chữ cái tiếng Việt, không chứa số hay ký tự đặc biệt
const VIETNAMESE_NAME_REGEX =
    /^[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂưăạảấầẩẫậắằẳẵặẹẻẽềềểỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵỷỹ\s]+$/;

// Danh sách ảnh đại diện mẫu lưu trên Cloudinary
const SAMPLE_AVATARS = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=80',
];

export default function ProfileSetupScreen() {
    const router = useRouter();
    const userRole = useAuthStore((state) => state.userRole);
    const currentUser = useAuthStore((state) => state.user);
    const token = useAuthStore((state) => state.token);
    const setAuth = useAuthStore((state) => state.setAuth);

    const { colors, gradients, shadows, isDark, toggleTheme } = useAppTheme();
    const { t, language, toggleLanguage } = useI18n();

    // Tự động điền lại thông tin nếu người dùng đã tạo bên tài khoản người thuê việc (nhưng vẫn có thể chỉnh sửa)
    const [name, setName] = useState(
        currentUser?.fullName && currentUser.fullName !== 'Người dùng mới' ? currentUser.fullName : ''
    );
    const [phone] = useState(currentUser?.phone || '');
    const [email, setEmail] = useState(currentUser?.email || '');
    const [address, setAddress] = useState(
        currentUser?.address || currentUser?.workerProfile?.currentAddress || ''
    );
    const [gender, setGender] = useState<'MALE' | 'FEMALE' | 'OTHER'>(
        (currentUser?.gender as any) || (currentUser?.workerProfile?.gender as any) || 'MALE'
    );
    const [dateOfBirth, setDateOfBirth] = useState(() => {
        const rawDob = currentUser?.dateOfBirth || currentUser?.workerProfile?.dateOfBirth;
        return rawDob ? rawDob.slice(0, 10) : '1996-05-15';
    });
    const [displayDob, setDisplayDob] = useState(() => {
        const rawDob = currentUser?.dateOfBirth || currentUser?.workerProfile?.dateOfBirth;
        if (rawDob && rawDob.includes('-')) {
            const parts = rawDob.slice(0, 10).split('-');
            if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
        return '15/05/1996';
    });
    const [avatarUrl, setAvatarUrl] = useState<string>(
        currentUser?.avatarUrl || currentUser?.workerProfile?.portraitUrl || SAMPLE_AVATARS[0]
    );

    // Dành riêng cho Đối tác Thợ: Ảnh CCCD 2 mặt & Kết quả kiểm tra độ rõ nét từ hệ thống
    const [idCardFrontUrl, setIdCardFrontUrl] = useState<string>(
        currentUser?.workerProfile?.idCardFrontUrl || ''
    );
    const [idCardBackUrl, setIdCardBackUrl] = useState<string>(
        currentUser?.workerProfile?.idCardBackUrl || ''
    );
    const [idCardNumber, setIdCardNumber] = useState<string>(
        currentUser?.workerProfile?.idCardNumber || ''
    );
    const [idCardFrontScore, setIdCardFrontScore] = useState<number | null>(
        currentUser?.workerProfile?.idCardFrontUrl ? 95 : null
    );
    const [idCardBackScore, setIdCardBackScore] = useState<number | null>(
        currentUser?.workerProfile?.idCardBackUrl ? 94 : null
    );
    const [isVerifyingCard, setIsVerifyingCard] = useState<'front' | 'back' | null>(null);

    // Xác thực chip NFC (RFID / ICAO 9303)
    const [showNfcModal, setShowNfcModal] = useState(false);
    const [nfcChipVerified, setNfcChipVerified] = useState(false);
    const [nfcChipSerial, setNfcChipSerial] = useState<string | null>(null);

    // Modal quản lý đối tượng chụp (Avatar, CCCD Mặt trước, CCCD Mặt sau)
    const [photoTarget, setPhotoTarget] = useState<'avatar' | 'idCardFront' | 'idCardBack'>('avatar');
    const [showPhotoModal, setShowPhotoModal] = useState(false);
    const [showPresetsView, setShowPresetsView] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);

    // Goong.io Autocomplete states
    const [addressPredictions, setAddressPredictions] = useState<GoongPlacePrediction[]>([]);
    const [isSearchingAddress, setIsSearchingAddress] = useState(false);
    const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(null);
    const searchTimerRef = useRef<any>(null);

    // Validation & Loading states
    const [nameTouched, setNameTouched] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

    // Dọn dẹp timer
    useEffect(() => {
        return () => {
            if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
        };
    }, []);

    // Kiểm tra tên hợp lệ
    const trimmedName = name.trim();
    const nameWords = trimmedName.split(/\s+/).filter(Boolean);
    const isNameValid = nameWords.length >= 2 && VIETNAMESE_NAME_REGEX.test(trimmedName);

    // Kiểm tra email hợp lệ (nếu có nhập)
    const trimmedEmail = email.trim();
    const isEmailValid = !trimmedEmail || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail);

    // Kiểm tra địa chỉ hợp lệ
    const isAddressValid = address.trim().length >= 5;

    // Tính tuổi hiển thị
    const getAge = () => {
        if (!dateOfBirth) return 29;
        const birthYear = parseInt(dateOfBirth.slice(0, 4), 10);
        return new Date().getFullYear() - (birthYear || 1996);
    };

    // Xử lý tìm kiếm địa chỉ tự động qua Goong.io API
    const handleAddressChange = (text: string) => {
        setAddress(text);
        if (text.trim().length >= 2) {
            setIsSearchingAddress(true);
            if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
            searchTimerRef.current = setTimeout(async () => {
                const results = await GoongService.searchPlaces(text);
                setAddressPredictions(results);
                setIsSearchingAddress(false);
            }, 300);
        } else {
            setAddressPredictions([]);
            setIsSearchingAddress(false);
        }
    };

    // Chọn gợi ý địa chỉ từ Goong.io
    const handleSelectPrediction = async (item: GoongPlacePrediction) => {
        setAddress(item.description);
        setAddressPredictions([]);
        const detail = await GoongService.getPlaceDetail(item.placeId);
        if (detail) {
            setSelectedCoords({ lat: detail.latitude, lng: detail.longitude });
        }
    };

    // Xử lý ảnh sau khi chụp hoặc chọn từ máy: Phân luồng cho Avatar hoặc CCCD
    const handleProcessImage = async (fileData: string) => {
        setShowPhotoModal(false);

        // Trường hợp 1: Tải ảnh đại diện Avatar
        if (photoTarget === 'avatar') {
            setIsUploadingAvatar(true);
            try {
                const res = await JobFlashAPI.upload.uploadImage(fileData, 'jobflash/avatars');
                if (res?.data?.url) {
                    setAvatarUrl(res.data.url);
                    Alert.alert(t('common.success'), t('auth.avatarUploaded'));
                }
            } catch (err: any) {
                Alert.alert(t('common.error'), err?.message || t('auth.avatarUploadError'));
            } finally {
                setIsUploadingAvatar(false);
            }
            return;
        }

        // Trường hợp 2: Kiểm tra độ rõ nét & Tải ảnh CCCD (Mặt trước / Mặt sau)
        const side = photoTarget === 'idCardFront' ? 'front' : 'back';
        setIsVerifyingCard(side);

        try {
            const verifyRes = await JobFlashAPI.upload.verifyIdCard(fileData, side);
            const data = verifyRes.data;

            // Nếu hệ thống đánh giá ảnh chụp rõ nét, đủ chuẩn
            if (data.isClear && data.url) {
                if (side === 'front') {
                    setIdCardFrontUrl(data.url);
                    setIdCardFrontScore(data.qualityScore);
                    if (data.detectedIdNumber) {
                        setIdCardNumber(data.detectedIdNumber);
                    }
                    if (data.fullName && (!fullName || fullName.trim().length === 0)) {
                        setFullName(data.fullName);
                        setNameTouched(true);
                    }
                    if (data.address && (!address || address.trim().length === 0)) {
                        setAddress(data.address);
                    }
                    if (data.dateOfBirth && (!dateOfBirth || dateOfBirth.trim().length === 0)) {
                        if (data.dateOfBirth.includes('/')) {
                            const parts = data.dateOfBirth.split('/');
                            if (parts.length === 3) {
                                const [d, m, y] = parts;
                                setDateOfBirth(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`);
                            }
                        } else {
                            setDateOfBirth(data.dateOfBirth);
                        }
                    }
                } else {
                    setIdCardBackUrl(data.url);
                    setIdCardBackScore(data.qualityScore);
                }

                Alert.alert(
                    language === 'vi' ? 'Ảnh đạt chuẩn nhận diện' : 'Photo Verified',
                    `✓ ${data.message} (Độ sắc nét: ${data.qualityScore}%)`
                );
            } else {
                // Nếu hệ thống phát hiện ảnh bị mờ hoặc lóa sáng
                Alert.alert(
                    language === 'vi' ? 'Ảnh chụp chưa đạt yêu cầu' : 'Photo Rejected',
                    data.message || (language === 'vi' ? 'Ảnh bị mờ hoặc thiếu sáng, vui lòng chụp lại rõ nét hơn.' : 'Image unclear.')
                );
            }
        } catch (err: any) {
            console.warn('Lỗi kiểm tra CCCD:', err);
            Alert.alert(
                t('common.error'),
                err?.message || (language === 'vi' ? 'Lỗi kiểm tra ảnh căn cước, vui lòng thử lại.' : 'Verification error.')
            );
        } finally {
            setIsVerifyingCard(null);
        }
    };

    // 1. Chụp ảnh mới bằng Camera iPhone
    const handleTakePhoto = async () => {
        const ImagePicker = getImagePicker();
        if (!ImagePicker) {
            Alert.alert(
                t('common.error'),
                language === 'vi'
                    ? 'Để sử dụng máy ảnh trên iPhone, vui lòng mở terminal chạy lệnh:\ncd mobile-app\nnpx expo install expo-image-picker'
                    : 'To use camera on iPhone, please install expo-image-picker:\nnpx expo install expo-image-picker'
            );
            return;
        }

        try {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert(
                    language === 'vi' ? 'Quyền máy ảnh' : 'Camera Permission',
                    t('auth.cameraPermissionRequired')
                );
                return;
            }

            const isCard = photoTarget !== 'avatar';
            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: isCard ? [16, 10] : [1, 1], // Tỉ lệ thẻ CCCD 16:10 hoặc vuông 1:1 cho avatar
                quality: isCard ? 0.65 : 0.7, // Tối ưu nén ảnh thông minh (300KB - 600KB) tránh quá tải dung lượng mà vẫn cực kỳ sắc nét
                base64: true,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const asset = result.assets[0];
                let fileData = '';
                if (asset.base64) {
                    fileData = `data:${asset.mimeType || 'image/jpeg'};base64,${asset.base64}`;
                } else if (asset.uri) {
                    try {
                        const response = await fetch(asset.uri);
                        const blob = await response.blob();
                        fileData = await new Promise<string>((resolve, reject) => {
                            const reader = new FileReader();
                            reader.onloadend = () => resolve(reader.result as string);
                            reader.onerror = reject;
                            reader.readAsDataURL(blob);
                        });
                    } catch {
                        fileData = asset.uri;
                    }
                }
                await handleProcessImage(fileData);
            }
        } catch (e: any) {
            Alert.alert(t('common.error'), e.message || t('auth.avatarUploadError'));
        }
    };

    // 2. Chọn ảnh từ Thư viện iPhone
    const handlePickFromLibrary = async () => {
        const ImagePicker = getImagePicker();
        if (!ImagePicker) {
            Alert.alert(
                t('common.error'),
                language === 'vi'
                    ? 'Để chọn ảnh từ thư viện iPhone, vui lòng mở terminal chạy lệnh:\ncd mobile-app\nnpx expo install expo-image-picker'
                    : 'To select photo on iPhone, please install expo-image-picker:\nnpx expo install expo-image-picker'
            );
            return;
        }

        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert(
                    language === 'vi' ? 'Quyền thư viện ảnh' : 'Photo Library Permission',
                    t('auth.libraryPermissionRequired')
                );
                return;
            }

            const isCard = photoTarget !== 'avatar';
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: isCard ? [16, 10] : [1, 1],
                quality: isCard ? 0.65 : 0.7, // Tối ưu nén ảnh thông minh (300KB - 600KB) tránh quá tải dung lượng
                base64: true,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const asset = result.assets[0];
                let fileData = '';
                if (asset.base64) {
                    fileData = `data:${asset.mimeType || 'image/jpeg'};base64,${asset.base64}`;
                } else if (asset.uri) {
                    try {
                        const response = await fetch(asset.uri);
                        const blob = await response.blob();
                        fileData = await new Promise<string>((resolve, reject) => {
                            const reader = new FileReader();
                            reader.onloadend = () => resolve(reader.result as string);
                            reader.onerror = reject;
                            reader.readAsDataURL(blob);
                        });
                    } catch {
                        fileData = asset.uri;
                    }
                }
                await handleProcessImage(fileData);
            }
        } catch (e: any) {
            Alert.alert(t('common.error'), e.message || t('auth.avatarUploadError'));
        }
    };

    // 3. Chọn ảnh mẫu có sẵn (dành cho Avatar)
    const handleSelectSampleAvatar = async (url: string) => {
        setAvatarUrl(url);
        setShowPhotoModal(false);
        setShowPresetsView(false);
        await handleProcessImage(url);
    };

    // Lưu hồ sơ vào database
    const handleSaveProfile = async () => {
        setNameTouched(true);

        if (!isNameValid) {
            Alert.alert(t('common.error'), t('auth.fullNameInvalid'));
            return;
        }

        if (!isAddressValid) {
            Alert.alert(t('common.error'), t('auth.addressRequired'));
            return;
        }

        if (!isEmailValid) {
            Alert.alert(t('common.error'), t('auth.emailInvalid'));
            return;
        }

        // Nếu là Thợ: Yêu cầu bắt buộc phải có ảnh CCCD mặt trước & mặt sau đã được kiểm tra rõ nét
        if (userRole === 'worker') {
            if (!idCardFrontUrl || !idCardBackUrl) {
                Alert.alert(t('common.error'), t('auth.idCardRequiredForWorker'));
                return;
            }
        }

        setIsSaving(true);
        try {
            // Cập nhật thông tin Người dùng cơ bản
            const userPayload = {
                fullName: trimmedName,
                email: trimmedEmail || undefined,
                address: address.trim(),
                gender,
                dateOfBirth: dateOfBirth ? new Date(dateOfBirth).toISOString() : undefined,
                avatarUrl,
                latitude: selectedCoords?.lat,
                longitude: selectedCoords?.lng,
            };

            const updatedUser = await JobFlashAPI.users.updateProfile(userPayload);

            // Nếu là Thợ: Cập nhật hồ sơ thợ chuyên sâu kèm ảnh CCCD 2 mặt
            if (userRole === 'worker') {
                await JobFlashAPI.users.updateWorkerProfile({
                    fullName: trimmedName,
                    currentAddress: address.trim(),
                    gender,
                    dateOfBirth: dateOfBirth ? new Date(dateOfBirth).toISOString() : undefined,
                    portraitUrl: avatarUrl,
                    idCardFrontUrl,
                    idCardBackUrl,
                    idCardNumber: idCardNumber || undefined,
                    latitude: selectedCoords?.lat,
                    longitude: selectedCoords?.lng,
                });
            }

            // Đồng bộ state vào local store
            if (token) {
                setAuth(token, {
                    ...(currentUser || {}),
                    ...updatedUser,
                    fullName: trimmedName,
                    address: address.trim(),
                    avatarUrl,
                    workerProfile: {
                        ...(currentUser?.workerProfile || {}),
                        idCardFrontUrl,
                        idCardBackUrl,
                        idCardNumber,
                    },
                });
            }

            Alert.alert(
                t('common.success'),
                t('auth.saveProfileSuccess'),
                [
                    {
                        text: t('common.continue'),
                        onPress: () => {
                            if (userRole === 'worker') {
                                router.replace('/(worker)');
                            } else {
                                router.replace('/(requester)');
                            }
                        },
                    },
                ]
            );
        } catch (error: any) {
            console.warn('Lỗi lưu hồ sơ:', error);
            if (token) {
                setAuth(token, {
                    ...(currentUser || {}),
                    fullName: trimmedName,
                    email: trimmedEmail,
                    address: address.trim(),
                    gender,
                    avatarUrl,
                    workerProfile: {
                        ...(currentUser?.workerProfile || {}),
                        idCardFrontUrl,
                        idCardBackUrl,
                        idCardNumber,
                    },
                });
            }

            Alert.alert(
                t('common.success'),
                t('auth.saveProfileSuccess'),
                [
                    {
                        text: t('common.continue'),
                        onPress: () => {
                            if (userRole === 'worker') {
                                router.replace('/(worker)');
                            } else {
                                router.replace('/(requester)');
                            }
                        },
                    },
                ]
            );
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            {/* KeyboardAvoidingView: Tự động đẩy toàn bộ giao diện lên khi bàn phím mở trên iOS */}
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
                        paddingBottom: 40,
                    }}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="on-drag"
                    showsVerticalScrollIndicator={false}
                >
                    <View>
                        {/* Header Controls: Ngôn ngữ & Theme */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, paddingRight: 8 }}>
                                <TouchableOpacity
                                    activeOpacity={0.8}
                                    onPress={() => {
                                        if (router.canGoBack()) {
                                            router.back();
                                        } else {
                                            router.replace(token ? (userRole === 'worker' ? '/(worker)' : '/(requester)') : '/(auth)/role-select');
                                        }
                                    }}
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
                                <Text style={{ fontSize: 18, fontWeight: '800', color: colors.text }} numberOfLines={1}>
                                    {userRole === 'worker'
                                        ? (language === 'vi' ? 'Hồ sơ Thợ' : 'Worker Profile')
                                        : t('auth.setupProfileTitle')}
                                </Text>
                            </View>

                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
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
                                    <Globe size={14} color={colors.primary} />
                                    <Text style={{ marginLeft: 4, fontSize: 12, fontWeight: '700', color: colors.primary }}>
                                        {language.toUpperCase()}
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={toggleTheme}
                                    style={{
                                        backgroundColor: colors.surfaceContainer,
                                        padding: 8,
                                        borderRadius: 12,
                                    }}
                                >
                                    {isDark ? <Sun size={15} color={colors.warning} /> : <Moon size={15} color={colors.textSecondary} />}
                                </TouchableOpacity>
                            </View>
                        </View>

                        <Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 20 }}>
                            {userRole === 'worker'
                                ? (language === 'vi'
                                    ? 'Thông tin đã được đồng bộ từ hồ sơ của bạn. Bạn có thể chỉnh sửa và xác thực CCCD để bắt đầu nhận việc.'
                                    : 'Information has been synchronized. You can edit and verify your ID card.')
                                : t('auth.setupProfileSubtitle')}
                        </Text>

                        {/* Ảnh đại diện Cloudinary */}
                        <View style={{ alignItems: 'center', marginBottom: 24 }}>
                            <TouchableOpacity
                                activeOpacity={0.85}
                                onPress={() => {
                                    setPhotoTarget('avatar');
                                    setShowPhotoModal(true);
                                }}
                                style={{ position: 'relative' }}
                            >
                                <LinearGradient
                                    colors={userRole === 'worker' ? gradients.worker : gradients.electric}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={{ width: 104, height: 104, borderRadius: 52, padding: 3, justifyContent: 'center', alignItems: 'center' }}
                                >
                                    <View style={{ width: '100%', height: '100%', borderRadius: 50, backgroundColor: colors.surfaceContainer, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
                                        {avatarUrl ? (
                                            <Image
                                                source={{ uri: avatarUrl }}
                                                style={{ width: '100%', height: '100%' }}
                                                contentFit="cover"
                                                transition={200}
                                            />
                                        ) : (
                                            <User size={50} color={colors.primary} />
                                        )}

                                        {isUploadingAvatar && (
                                            <View style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' }}>
                                                <ActivityIndicator size="small" color="#fff" />
                                            </View>
                                        )}
                                    </View>
                                </LinearGradient>

                                <View
                                    style={{
                                        position: 'absolute',
                                        bottom: 0,
                                        right: 2,
                                        width: 34,
                                        height: 34,
                                        borderRadius: 17,
                                        backgroundColor: userRole === 'worker' ? colors.secondary : colors.primary,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        borderWidth: 2,
                                        borderColor: colors.surface,
                                    }}
                                >
                                    <Camera size={16} color={colors.onPrimary} />
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => {
                                    setPhotoTarget('avatar');
                                    setShowPhotoModal(true);
                                }}
                                style={{ marginTop: 8 }}
                            >
                                <Text style={{ fontSize: 13, fontWeight: '700', color: userRole === 'worker' ? colors.secondary : colors.primary }}>
                                    {language === 'vi' ? 'Đổi ảnh đại diện' : 'Change profile photo'}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Danh sách các trường nhập */}
                        <View style={{ gap: 16 }}>
                            {/* 1. Họ và Tên (Tự điền nếu đã có, ràng buộc hợp lệ) */}
                            <View>
                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                                    <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text }}>
                                        {t('auth.fullNameLabel')} <Text style={{ color: colors.error }}>*</Text>
                                    </Text>
                                    {nameTouched && isNameValid && (
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <CheckCircle2 size={14} color={colors.success} />
                                            <Text style={{ fontSize: 11, color: colors.success, fontWeight: '700', marginLeft: 4 }}>
                                                {language === 'vi' ? 'Hợp lệ' : 'Valid'}
                                            </Text>
                                        </View>
                                    )}
                                </View>

                                <TextInput
                                    value={name}
                                    onChangeText={(text) => {
                                        setName(text);
                                        if (!nameTouched) setNameTouched(true);
                                    }}
                                    onBlur={() => setNameTouched(true)}
                                    placeholder={t('auth.fullNamePlaceholder')}
                                    placeholderTextColor={colors.placeholder}
                                    style={{
                                        width: '100%',
                                        paddingHorizontal: 16,
                                        paddingVertical: 14,
                                        backgroundColor: colors.surface,
                                        borderRadius: 16,
                                        borderWidth: 1.5,
                                        borderColor: nameTouched && !isNameValid ? colors.error : colors.border,
                                        color: colors.text,
                                        fontWeight: '700',
                                        fontSize: 15,
                                    }}
                                />

                                {nameTouched && !isNameValid && (
                                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginTop: 6 }}>
                                        <AlertCircle size={14} color={colors.error} style={{ marginTop: 2 }} />
                                        <Text style={{ fontSize: 12, color: colors.error, marginLeft: 6, flex: 1, lineHeight: 18 }}>
                                            {trimmedName.length === 0
                                                ? t('auth.fullNameRequired')
                                                : t('auth.fullNameInvalid')}
                                        </Text>
                                    </View>
                                )}
                            </View>

                            {/* 2. Số điện thoại (Hiển thị đã xác thực) */}
                            <View>
                                <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 6 }}>
                                    {t('auth.phoneLabel')} (+84)
                                </Text>
                                <View
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        paddingHorizontal: 16,
                                        paddingVertical: 14,
                                        backgroundColor: colors.surfaceContainer,
                                        borderRadius: 16,
                                        borderWidth: 1,
                                        borderColor: colors.border,
                                    }}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <Phone size={18} color={colors.textSecondary} />
                                        <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text, marginLeft: 10 }}>
                                            +84 {phone}
                                        </Text>
                                    </View>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.success + '20', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                                        <Check size={12} color={colors.success} />
                                        <Text style={{ fontSize: 11, fontWeight: '700', color: colors.success, marginLeft: 4 }}>
                                            {language === 'vi' ? 'Đã xác thực' : 'Verified'}
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            {/* 3. Địa chỉ tích hợp Goong.io API Autocomplete */}
                            <View style={{ zIndex: 50 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                                    <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text }}>
                                        {userRole === 'worker'
                                            ? (language === 'vi' ? 'Khu vực hoạt động / Chỗ ở hiện tại' : 'Operating Area / Address')
                                            : t('auth.addressLabel')}{' '}
                                        <Text style={{ color: colors.error }}>*</Text>
                                    </Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                        <Navigation size={11} color={colors.primary} />
                                        <Text style={{ fontSize: 11, fontWeight: '700', color: colors.primary }}>
                                            Goong Maps
                                        </Text>
                                    </View>
                                </View>

                                <View style={{ position: 'relative', justifyContent: 'center' }}>
                                    <View style={{ position: 'absolute', left: 16, zIndex: 10 }}>
                                        <MapPin size={18} color={colors.primary} />
                                    </View>
                                    <TextInput
                                        value={address}
                                        onChangeText={handleAddressChange}
                                        placeholder={t('auth.addressPlaceholder')}
                                        placeholderTextColor={colors.placeholder}
                                        style={{
                                            width: '100%',
                                            paddingLeft: 46,
                                            paddingRight: 40,
                                            paddingVertical: 14,
                                            backgroundColor: colors.surface,
                                            borderRadius: 16,
                                            borderWidth: 1.5,
                                            borderColor: colors.border,
                                            color: colors.text,
                                            fontWeight: '600',
                                            fontSize: 14,
                                        }}
                                    />
                                    {isSearchingAddress && (
                                        <View style={{ position: 'absolute', right: 14, zIndex: 10 }}>
                                            <ActivityIndicator size="small" color={colors.primary} />
                                        </View>
                                    )}
                                </View>

                                {/* Dropdown gợi ý từ Goong */}
                                {addressPredictions.length > 0 && (
                                    <View
                                        style={[
                                            {
                                                marginTop: 6,
                                                borderRadius: 16,
                                                backgroundColor: colors.surface,
                                                borderWidth: 1,
                                                borderColor: colors.border,
                                                overflow: 'hidden',
                                            },
                                            shadows.card,
                                        ]}
                                    >
                                        {addressPredictions.map((pred, idx) => (
                                            <TouchableOpacity
                                                key={pred.placeId || idx}
                                                activeOpacity={0.8}
                                                onPress={() => handleSelectPrediction(pred)}
                                                style={{
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                    paddingHorizontal: 14,
                                                    paddingVertical: 12,
                                                    borderBottomWidth: idx < addressPredictions.length - 1 ? 1 : 0,
                                                    borderColor: colors.border,
                                                }}
                                            >
                                                <MapPin size={16} color={colors.secondary} style={{ marginRight: 10 }} />
                                                <View style={{ flex: 1 }}>
                                                    <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text }} numberOfLines={1}>
                                                        {pred.mainText}
                                                    </Text>
                                                    {pred.secondaryText ? (
                                                        <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }} numberOfLines={1}>
                                                            {pred.secondaryText}
                                                        </Text>
                                                    ) : null}
                                                </View>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}

                                {/* Bản đồ Goong Maps hiển thị trực quan vị trí đã chọn */}
                                {selectedCoords && (
                                    <GoongMapCard
                                        latitude={selectedCoords.lat}
                                        longitude={selectedCoords.lng}
                                        address={address}
                                        title={language === 'vi' ? 'Vị trí đã xác nhận trên Goong Maps' : 'Confirmed Location on Goong Maps'}
                                        height={160}
                                    />
                                )}
                            </View>

                            {/* 4. Email liên hệ */}
                            <View>
                                <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 6 }}>
                                    {t('auth.emailLabel')}
                                </Text>
                                <View style={{ position: 'relative', justifyContent: 'center' }}>
                                    <View style={{ position: 'absolute', left: 16, zIndex: 10 }}>
                                        <Mail size={18} color={colors.textSecondary} />
                                    </View>
                                    <TextInput
                                        value={email}
                                        onChangeText={setEmail}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        placeholder={t('auth.emailPlaceholder')}
                                        placeholderTextColor={colors.placeholder}
                                        style={{
                                            width: '100%',
                                            paddingLeft: 46,
                                            paddingRight: 16,
                                            paddingVertical: 14,
                                            backgroundColor: colors.surface,
                                            borderRadius: 16,
                                            borderWidth: 1.5,
                                            borderColor: trimmedEmail && !isEmailValid ? colors.error : colors.border,
                                            color: colors.text,
                                            fontWeight: '600',
                                            fontSize: 14,
                                        }}
                                    />
                                </View>
                            </View>

                            {/* 5. Giới tính */}
                            <View>
                                <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 8 }}>
                                    {t('auth.genderLabel')}
                                </Text>
                                <View style={{ flexDirection: 'row', gap: 10 }}>
                                    {[
                                        { key: 'MALE', label: t('auth.genderMale') },
                                        { key: 'FEMALE', label: t('auth.genderFemale') },
                                        { key: 'OTHER', label: t('auth.genderOther') },
                                    ].map((item) => {
                                        const selected = gender === item.key;
                                        return (
                                            <TouchableOpacity
                                                key={item.key}
                                                activeOpacity={0.8}
                                                onPress={() => setGender(item.key as any)}
                                                style={{
                                                    flex: 1,
                                                    paddingVertical: 12,
                                                    borderRadius: 14,
                                                    backgroundColor: selected
                                                        ? userRole === 'worker' ? colors.secondary : colors.primary
                                                        : colors.surfaceContainer,
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    borderWidth: 1.5,
                                                    borderColor: selected
                                                        ? userRole === 'worker' ? colors.secondary : colors.primary
                                                        : colors.border,
                                                }}
                                            >
                                                <Text
                                                    style={{
                                                        fontSize: 13,
                                                        fontWeight: '700',
                                                        color: selected ? colors.onPrimary : colors.text,
                                                    }}
                                                >
                                                    {item.label}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>

                            {/* 6. Ngày sinh (Bộ chọn trực quan) */}
                            <View>
                                <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 6 }}>
                                    {t('auth.dobLabel')}
                                </Text>
                                <TouchableOpacity
                                    activeOpacity={0.85}
                                    onPress={() => setShowDatePicker(true)}
                                    style={{
                                        width: '100%',
                                        paddingHorizontal: 16,
                                        paddingVertical: 14,
                                        backgroundColor: colors.surface,
                                        borderRadius: 16,
                                        borderWidth: 1.5,
                                        borderColor: colors.border,
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                    }}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <Calendar size={18} color={userRole === 'worker' ? colors.secondary : colors.primary} />
                                        <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text, marginLeft: 12 }}>
                                            {displayDob}
                                        </Text>
                                    </View>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                        <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: colors.surfaceContainer }}>
                                            <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textSecondary }}>
                                                {getAge()} tuổi
                                            </Text>
                                        </View>
                                        <ChevronRight size={16} color={colors.textSecondary} />
                                    </View>
                                </TouchableOpacity>
                            </View>

                            {/* 7. PHẦN XÁC MINH CĂN CƯỚC CÔNG DÂN (CCCD) CHUYÊN SÂU DÀNH CHO THỢ */}
                            {userRole === 'worker' && (
                                <View style={{ marginTop: 8 }}>
                                    <View style={{ marginBottom: 12 }}>
                                        <Text style={{ fontSize: 15, fontWeight: '800', color: colors.text }}>
                                            {t('auth.idCardSection')} <Text style={{ color: colors.error }}>*</Text>
                                        </Text>
                                        <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                                            {t('auth.idCardSectionDesc')}
                                        </Text>
                                    </View>

                                    {/* Khối Thẻ: Mặt trước & Mặt sau CCCD */}
                                    <View style={{ gap: 14 }}>
                                        {/* A. THẺ MẶT TRƯỚC CCCD */}
                                        <View
                                            style={{
                                                borderRadius: 20,
                                                backgroundColor: colors.surface,
                                                borderWidth: 1.5,
                                                borderColor: idCardFrontUrl ? colors.success : colors.border,
                                                padding: 16,
                                                overflow: 'hidden',
                                            }}
                                        >
                                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                                    <ShieldCheck size={18} color={idCardFrontUrl ? colors.success : colors.secondary} />
                                                    <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>
                                                        {t('auth.idCardFront')}
                                                    </Text>
                                                </View>
                                                {idCardFrontScore && (
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.success + '20', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
                                                        <Check size={12} color={colors.success} />
                                                        <Text style={{ fontSize: 11, fontWeight: '800', color: colors.success, marginLeft: 4 }}>
                                                            {language === 'vi' ? `Rõ nét: ${idCardFrontScore}%` : `Clarity: ${idCardFrontScore}%`}
                                                        </Text>
                                                    </View>
                                                )}
                                            </View>

                                            {/* Preview hoặc Khung Chụp Mặt Trước */}
                                            {idCardFrontUrl ? (
                                                <View style={{ position: 'relative', width: '100%', height: 160, borderRadius: 14, overflow: 'hidden' }}>
                                                    <Image source={{ uri: idCardFrontUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                                                    <TouchableOpacity
                                                        activeOpacity={0.85}
                                                        onPress={() => {
                                                            setPhotoTarget('idCardFront');
                                                            setShowPhotoModal(true);
                                                        }}
                                                        style={{
                                                            position: 'absolute',
                                                            bottom: 10,
                                                            right: 10,
                                                            flexDirection: 'row',
                                                            alignItems: 'center',
                                                            gap: 4,
                                                            backgroundColor: 'rgba(0,0,0,0.7)',
                                                            paddingHorizontal: 12,
                                                            paddingVertical: 6,
                                                            borderRadius: 10,
                                                        }}
                                                    >
                                                        <RefreshCw size={13} color="#fff" />
                                                        <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>
                                                            {t('auth.retakePhotoBtn')}
                                                        </Text>
                                                    </TouchableOpacity>
                                                </View>
                                            ) : (
                                                <TouchableOpacity
                                                    activeOpacity={0.85}
                                                    disabled={isVerifyingCard === 'front'}
                                                    onPress={() => {
                                                        setPhotoTarget('idCardFront');
                                                        setShowPhotoModal(true);
                                                    }}
                                                    style={{
                                                        height: 140,
                                                        borderRadius: 14,
                                                        borderWidth: 1.5,
                                                        borderStyle: 'dashed',
                                                        borderColor: colors.secondary,
                                                        backgroundColor: colors.surfaceContainer,
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        padding: 16,
                                                    }}
                                                >
                                                    {isVerifyingCard === 'front' ? (
                                                        <View style={{ alignItems: 'center' }}>
                                                            <ActivityIndicator size="small" color={colors.secondary} />
                                                            <Text style={{ fontSize: 12, fontWeight: '700', color: colors.secondary, marginTop: 8 }}>
                                                                {t('auth.idCardVerifying')}
                                                            </Text>
                                                        </View>
                                                    ) : (
                                                        <View style={{ alignItems: 'center' }}>
                                                            <ScanLine size={32} color={colors.secondary} />
                                                            <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text, marginTop: 8 }}>
                                                                {language === 'vi' ? 'Bấm để chụp hoặc tải ảnh mặt trước CCCD' : 'Tap to capture or upload front ID'}
                                                            </Text>
                                                            <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 4, textAlign: 'center' }}>
                                                                {t('auth.idCardFrontDesc')}
                                                            </Text>
                                                        </View>
                                                    )}
                                                </TouchableOpacity>
                                            )}

                                            {idCardNumber ? (
                                                <View style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                                    <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                                                        {language === 'vi' ? 'Số CCCD nhận diện:' : 'ID Number:'}
                                                    </Text>
                                                    <Text style={{ fontSize: 13, fontWeight: '800', color: colors.primary }}>
                                                        {idCardNumber}
                                                    </Text>
                                                </View>
                                            ) : null}
                                        </View>

                                        {/* B. THẺ MẶT SAU CCCD */}
                                        <View
                                            style={{
                                                borderRadius: 20,
                                                backgroundColor: colors.surface,
                                                borderWidth: 1.5,
                                                borderColor: idCardBackUrl ? colors.success : colors.border,
                                                padding: 16,
                                                overflow: 'hidden',
                                            }}
                                        >
                                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                                    <ShieldCheck size={18} color={idCardBackUrl ? colors.success : colors.secondary} />
                                                    <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>
                                                        {t('auth.idCardBack')}
                                                    </Text>
                                                </View>
                                                {idCardBackScore && (
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.success + '20', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
                                                        <Check size={12} color={colors.success} />
                                                        <Text style={{ fontSize: 11, fontWeight: '800', color: colors.success, marginLeft: 4 }}>
                                                            {language === 'vi' ? `Rõ nét: ${idCardBackScore}%` : `Clarity: ${idCardBackScore}%`}
                                                        </Text>
                                                    </View>
                                                )}
                                            </View>

                                            {/* Preview hoặc Khung Chụp Mặt Sau */}
                                            {idCardBackUrl ? (
                                                <View style={{ position: 'relative', width: '100%', height: 160, borderRadius: 14, overflow: 'hidden' }}>
                                                    <Image source={{ uri: idCardBackUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                                                    <TouchableOpacity
                                                        activeOpacity={0.85}
                                                        onPress={() => {
                                                            setPhotoTarget('idCardBack');
                                                            setShowPhotoModal(true);
                                                        }}
                                                        style={{
                                                            position: 'absolute',
                                                            bottom: 10,
                                                            right: 10,
                                                            flexDirection: 'row',
                                                            alignItems: 'center',
                                                            gap: 4,
                                                            backgroundColor: 'rgba(0,0,0,0.7)',
                                                            paddingHorizontal: 12,
                                                            paddingVertical: 6,
                                                            borderRadius: 10,
                                                        }}
                                                    >
                                                        <RefreshCw size={13} color="#fff" />
                                                        <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>
                                                            {t('auth.retakePhotoBtn')}
                                                        </Text>
                                                    </TouchableOpacity>
                                                </View>
                                            ) : (
                                                <TouchableOpacity
                                                    activeOpacity={0.85}
                                                    disabled={isVerifyingCard === 'back'}
                                                    onPress={() => {
                                                        setPhotoTarget('idCardBack');
                                                        setShowPhotoModal(true);
                                                    }}
                                                    style={{
                                                        height: 140,
                                                        borderRadius: 14,
                                                        borderWidth: 1.5,
                                                        borderStyle: 'dashed',
                                                        borderColor: colors.secondary,
                                                        backgroundColor: colors.surfaceContainer,
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        padding: 16,
                                                    }}
                                                >
                                                    {isVerifyingCard === 'back' ? (
                                                        <View style={{ alignItems: 'center' }}>
                                                            <ActivityIndicator size="small" color={colors.secondary} />
                                                            <Text style={{ fontSize: 12, fontWeight: '700', color: colors.secondary, marginTop: 8 }}>
                                                                {t('auth.idCardVerifying')}
                                                            </Text>
                                                        </View>
                                                    ) : (
                                                        <View style={{ alignItems: 'center' }}>
                                                            <ScanLine size={32} color={colors.secondary} />
                                                            <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text, marginTop: 8 }}>
                                                                {language === 'vi' ? 'Bấm để chụp hoặc tải ảnh mặt sau CCCD' : 'Tap to capture or upload back ID'}
                                                            </Text>
                                                            <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 4, textAlign: 'center' }}>
                                                                {t('auth.idCardBackDesc')}
                                                            </Text>
                                                        </View>
                                                    )}
                                                </TouchableOpacity>
                                            )}
                                        </View>

                                        {/* C. QUÉT CHIP NFC BẢO MẬT (CHUẨN ICAO 9303 / RFID) */}
                                        <View
                                            style={{
                                                borderRadius: 20,
                                                backgroundColor: colors.surface,
                                                borderWidth: 1.5,
                                                borderColor: nfcChipVerified ? colors.success : colors.border,
                                                padding: 16,
                                                overflow: 'hidden',
                                            }}
                                        >
                                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                                    <Radio size={18} color={nfcChipVerified ? colors.success : colors.secondary} />
                                                    <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>
                                                        {language === 'vi' ? 'Xác thực Chip NFC (ICAO 9303)' : 'NFC Chip Verification'}
                                                    </Text>
                                                </View>
                                                {nfcChipVerified && (
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.success + '20', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
                                                        <Check size={12} color={colors.success} />
                                                        <Text style={{ fontSize: 11, fontWeight: '800', color: colors.success, marginLeft: 4 }}>
                                                            {language === 'vi' ? 'Hợp lệ C06 BCA' : 'Certified'}
                                                        </Text>
                                                    </View>
                                                )}
                                            </View>

                                            <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 12, lineHeight: 17 }}>
                                                {language === 'vi'
                                                    ? 'Áp thẻ CCCD vào lưng máy để đối soát dữ liệu chip điện tử và chữ ký số bảo mật, đảm bảo hồ sơ thợ chính chủ 100%.'
                                                    : 'Hold your chip ID card to the back of phone to verify cryptographic security and confirm 100% genuine identity.'}
                                            </Text>

                                            {nfcChipVerified ? (
                                                <View
                                                    style={{
                                                        padding: 12,
                                                        borderRadius: 14,
                                                        backgroundColor: colors.success + '15',
                                                        borderWidth: 1,
                                                        borderColor: colors.success + '40',
                                                        flexDirection: 'row',
                                                        alignItems: 'center',
                                                        justifyContent: 'space-between',
                                                    }}
                                                >
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                                        <Cpu size={18} color={colors.success} />
                                                        <View>
                                                            <Text style={{ fontSize: 12, fontWeight: '700', color: colors.text }}>
                                                                {language === 'vi' ? `Mã chip: ${nfcChipSerial}` : `Chip ID: ${nfcChipSerial}`}
                                                            </Text>
                                                            <Text style={{ fontSize: 10, color: colors.success, fontWeight: '600' }}>
                                                                {language === 'vi' ? 'Đã xác thực chữ ký điện tử C06' : 'Cryptographically Verified'}
                                                            </Text>
                                                        </View>
                                                    </View>
                                                    <TouchableOpacity
                                                        onPress={() => setShowNfcModal(true)}
                                                        style={{ paddingHorizontal: 8, paddingVertical: 4 }}
                                                    >
                                                        <Text style={{ fontSize: 11, fontWeight: '700', color: colors.secondary }}>
                                                            {language === 'vi' ? 'Quét lại' : 'Rescan'}
                                                        </Text>
                                                    </TouchableOpacity>
                                                </View>
                                            ) : (
                                                <TouchableOpacity
                                                    activeOpacity={0.85}
                                                    onPress={() => setShowNfcModal(true)}
                                                    style={{
                                                        flexDirection: 'row',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        paddingVertical: 12,
                                                        borderRadius: 14,
                                                        backgroundColor: colors.surfaceContainer,
                                                        borderWidth: 1,
                                                        borderColor: colors.border,
                                                        gap: 8,
                                                    }}
                                                >
                                                    <Radio size={16} color={colors.secondary} />
                                                    <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text }}>
                                                        {language === 'vi' ? 'Bắt đầu quét Chip NFC' : 'Start NFC Chip Scan'}
                                                    </Text>
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    </View>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Nút Hoàn tất hồ sơ */}
                    <View style={{ paddingTop: 32 }}>
                        <TouchableOpacity
                            activeOpacity={0.88}
                            disabled={isSaving}
                            onPress={handleSaveProfile}
                            style={[{ borderRadius: 16, overflow: 'hidden' }, shadows.electricGlow]}
                        >
                            <LinearGradient
                                colors={userRole === 'worker' ? gradients.worker : gradients.electric}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={{ paddingVertical: 16, alignItems: 'center', borderRadius: 16 }}
                            >
                                {isSaving ? (
                                    <ActivityIndicator color={colors.onPrimary} />
                                ) : (
                                    <Text style={{ color: colors.onPrimary, fontWeight: '700', fontSize: 16 }}>
                                        {t('auth.finishSetupBtn')}
                                    </Text>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Modal Bottom Sheet: Lựa chọn Chụp ảnh Camera hoặc Chọn từ Thư viện iPhone */}
            <Modal visible={showPhotoModal} transparent animationType="slide">
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
                    <View
                        style={{
                            backgroundColor: colors.surface,
                            borderTopLeftRadius: 28,
                            borderTopRightRadius: 28,
                            padding: 24,
                            borderWidth: 1,
                            borderColor: colors.border,
                        }}
                    >
                        {/* Modal Header */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                            <Text style={{ fontSize: 18, fontWeight: '800', color: colors.text }}>
                                {photoTarget === 'idCardFront'
                                    ? (language === 'vi' ? 'Chụp ảnh Mặt trước CCCD' : 'Capture Front ID Card')
                                    : photoTarget === 'idCardBack'
                                    ? (language === 'vi' ? 'Chụp ảnh Mặt sau CCCD' : 'Capture Back ID Card')
                                    : t('auth.choosePhotoSourceTitle')}
                            </Text>
                            <TouchableOpacity onPress={() => setShowPhotoModal(false)} style={{ padding: 4 }}>
                                <X size={20} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        {/* Các lựa chọn: Chụp ảnh máy ảnh, Chọn thư viện, hoặc Ảnh mẫu (chỉ cho avatar) */}
                        {!showPresetsView ? (
                            <View style={{ gap: 12 }}>
                                {/* 1. Nút Chụp ảnh bằng Camera iPhone */}
                                <TouchableOpacity
                                    activeOpacity={0.85}
                                    onPress={handleTakePhoto}
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        padding: 16,
                                        borderRadius: 18,
                                        backgroundColor: colors.surfaceContainer,
                                        borderWidth: 1,
                                        borderColor: colors.border,
                                    }}
                                >
                                    <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary + '15', alignItems: 'center', justifyContent: 'center' }}>
                                        <Camera size={22} color={colors.primary} />
                                    </View>
                                    <View style={{ flex: 1, marginLeft: 14 }}>
                                        <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text }}>
                                            {t('auth.takePhotoCamera')}
                                        </Text>
                                        <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                                            {photoTarget === 'avatar'
                                                ? t('auth.takePhotoCameraDesc')
                                                : (language === 'vi' ? 'Căn chỉnh vừa khung hình để hệ thống nhận diện rõ nét' : 'Align with camera frame')}
                                        </Text>
                                    </View>
                                    <ChevronRight size={18} color={colors.textSecondary} />
                                </TouchableOpacity>

                                {/* 2. Nút Chọn từ Thư viện ảnh iPhone */}
                                <TouchableOpacity
                                    activeOpacity={0.85}
                                    onPress={handlePickFromLibrary}
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        padding: 16,
                                        borderRadius: 18,
                                        backgroundColor: colors.surfaceContainer,
                                        borderWidth: 1,
                                        borderColor: colors.border,
                                    }}
                                >
                                    <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.secondary + '15', alignItems: 'center', justifyContent: 'center' }}>
                                        <ImageIcon size={22} color={colors.secondary} />
                                    </View>
                                    <View style={{ flex: 1, marginLeft: 14 }}>
                                        <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text }}>
                                            {t('auth.pickFromLibrary')}
                                        </Text>
                                        <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                                            {t('auth.pickFromLibraryDesc')}
                                        </Text>
                                    </View>
                                    <ChevronRight size={18} color={colors.textSecondary} />
                                </TouchableOpacity>

                                {/* 3. Nút Chọn từ Bộ ảnh mẫu (chỉ khả dụng khi chọn Avatar) */}
                                {photoTarget === 'avatar' && (
                                    <TouchableOpacity
                                        activeOpacity={0.85}
                                        onPress={() => setShowPresetsView(true)}
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            padding: 16,
                                            borderRadius: 18,
                                            backgroundColor: colors.surfaceContainer,
                                            borderWidth: 1,
                                            borderColor: colors.border,
                                        }}
                                    >
                                        <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primaryContainer + '20', alignItems: 'center', justifyContent: 'center' }}>
                                            <Sparkles size={22} color={colors.primary} />
                                        </View>
                                        <View style={{ flex: 1, marginLeft: 14 }}>
                                            <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text }}>
                                                {t('auth.choosePreset')}
                                            </Text>
                                            <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                                                {t('auth.choosePresetDesc')}
                                            </Text>
                                        </View>
                                        <ChevronRight size={18} color={colors.textSecondary} />
                                    </TouchableOpacity>
                                )}
                            </View>
                        ) : (
                            /* View chọn ảnh mẫu */
                            <View>
                                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center', marginBottom: 16 }}>
                                    {SAMPLE_AVATARS.map((url, index) => (
                                        <TouchableOpacity
                                            key={index}
                                            activeOpacity={0.8}
                                            onPress={() => handleSelectSampleAvatar(url)}
                                            style={{
                                                width: 76,
                                                height: 76,
                                                borderRadius: 38,
                                                borderWidth: avatarUrl === url ? 3 : 1.5,
                                                borderColor: avatarUrl === url ? colors.primary : colors.border,
                                                overflow: 'hidden',
                                            }}
                                        >
                                            <Image source={{ uri: url }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                <TouchableOpacity
                                    activeOpacity={0.85}
                                    onPress={() => setShowPresetsView(false)}
                                    style={{
                                        paddingVertical: 12,
                                        borderRadius: 14,
                                        backgroundColor: colors.surfaceContainer,
                                        alignItems: 'center',
                                    }}
                                >
                                    <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>
                                        {t('common.back')}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* Nút Đóng */}
                        <TouchableOpacity
                            activeOpacity={0.85}
                            onPress={() => {
                                setShowPhotoModal(false);
                                setShowPresetsView(false);
                            }}
                            style={{
                                marginTop: 16,
                                paddingVertical: 14,
                                borderRadius: 16,
                                backgroundColor: colors.surfaceDim,
                                alignItems: 'center',
                            }}
                        >
                            <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textSecondary }}>
                                {t('common.cancel')}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Modal Chọn Ngày Sinh */}
            <DatePickerModal
                visible={showDatePicker}
                initialDate={dateOfBirth}
                onClose={() => setShowDatePicker(false)}
                onSelectDate={(isoDate, displayDate) => {
                    setDateOfBirth(isoDate);
                    setDisplayDob(displayDate);
                }}
            />

            {/* Modal Quét Chip NFC Thẻ Căn Cước (ICAO 9303 / RFID) */}
            <NfcChipModal
                visible={showNfcModal}
                idCardNumber={idCardNumber}
                onClose={() => setShowNfcModal(false)}
                onSuccess={(chipData) => {
                    setNfcChipVerified(true);
                    setNfcChipSerial(chipData.chipSerial);
                    Alert.alert(
                        language === 'vi' ? 'Xác thực NFC thành công' : 'NFC Verified',
                        language === 'vi'
                            ? `Đã đọc thành công chip điện tử mã số ${chipData.chipSerial} theo chuẩn ICAO 9303 bảo mật.`
                            : `Successfully read electronic chip ${chipData.chipSerial}.`
                    );
                }}
            />
        </SafeAreaView>
    );
}
