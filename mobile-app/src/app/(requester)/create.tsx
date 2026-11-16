import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
    ArrowLeft,
    MapPin,
    Radar,
    ShieldCheck,
    Navigation,
    Truck,
    Sparkles,
    Package,
    Wrench,
    Utensils,
    HeartHandshake,
    Briefcase,
    LayoutGrid,
} from 'lucide-react-native';
import { GoongService, GoongPlacePrediction } from '../../services/goongService';
import GoongMapCard from '../../components/GoongMapCard';
import { useAppTheme } from '../../constants/theme';
import { useI18n } from '../../i18n';
import GlassBottomBar from '../../components/GlassBottomBar';

export default function CreateJobScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { colors, gradients, shadows } = useAppTheme();
    const { t, language } = useI18n();

    const categories = [
        { label: language === 'vi' ? 'Vận chuyển' : 'Delivery', icon: Truck },
        { label: language === 'vi' ? 'Vệ sinh dọn dẹp' : 'Cleaning', icon: Sparkles },
        { label: language === 'vi' ? 'Việc nặng' : 'Heavy Lifting', icon: Package },
        { label: language === 'vi' ? 'Sửa chữa' : 'Repair', icon: Wrench },
        { label: language === 'vi' ? 'Phục vụ' : 'Service', icon: Utensils },
        { label: language === 'vi' ? 'Chăm sóc' : 'Care', icon: HeartHandshake },
        { label: language === 'vi' ? 'Chuyên môn' : 'Professional', icon: Briefcase },
        { label: language === 'vi' ? 'Khác' : 'Others', icon: LayoutGrid },
    ];

    const [title, setTitle] = useState('');
    const [selectedCat, setSelectedCat] = useState(0);
    const [workerCount, setWorkerCount] = useState(1);
    const [wageType, setWageType] = useState<'package' | 'hourly'>('package');
    const [wagePerWorker, setWagePerWorker] = useState(250000);
    const [location, setLocation] = useState('');
    const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(null);

    // Đồng bộ tham số truyền từ trang chủ
    useEffect(() => {
        if (params.categoryIndex !== undefined) {
            const idx = Number(params.categoryIndex);
            if (!isNaN(idx) && idx >= 0 && idx < categories.length) {
                setSelectedCat(idx);
            }
        }
        if (params.initialTitle && typeof params.initialTitle === 'string') {
            setTitle(params.initialTitle);
        }
        if (params.initialLocation && typeof params.initialLocation === 'string') {
            setLocation(params.initialLocation);
        }
    }, [params.categoryIndex, params.initialTitle, params.initialLocation]);

    // Goong Autocomplete
    const [locationPredictions, setLocationPredictions] = useState<GoongPlacePrediction[]>([]);
    const [isSearchingLocation, setIsSearchingLocation] = useState(false);
    const searchTimerRef = useRef<any>(null);

    const handleLocationChange = (text: string) => {
        setLocation(text);
        if (text.trim().length >= 2) {
            setIsSearchingLocation(true);
            if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
            searchTimerRef.current = setTimeout(async () => {
                const results = await GoongService.searchPlaces(text);
                setLocationPredictions(results);
                setIsSearchingLocation(false);
            }, 300);
        } else {
            setLocationPredictions([]);
            setIsSearchingLocation(false);
        }
    };

    const handleSelectLocationPrediction = async (item: GoongPlacePrediction) => {
        setLocation(item.description);
        setLocationPredictions([]);
        const detail = await GoongService.getPlaceDetail(item.placeId);
        if (detail) {
            setSelectedCoords({ lat: detail.latitude, lng: detail.longitude });
        }
    };



    const totalEstimate = workerCount * wagePerWorker;

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
                    <Text style={{ fontSize: 17, fontWeight: '800', color: colors.text }}>
                        {t('requester.createJobTitle')}
                    </Text>
                    <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 9999, backgroundColor: colors.surfaceContainer }}>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: colors.primary }}>
                            {language === 'vi' ? 'Đăng tin nhanh' : 'Quick Post'}
                        </Text>
                    </View>
                </View>

                {/* Form Fields */}
                <ScrollView contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
                    {/* Tiêu đề */}
                    <View style={{ marginBottom: 16 }}>
                        <Text style={{ fontSize: 13, color: colors.text, fontWeight: '700', marginBottom: 6 }}>
                            {t('requester.jobTitleLabel')}
                        </Text>
                        <TextInput
                            value={title}
                            onChangeText={setTitle}
                            placeholder={t('requester.jobTitlePlaceholder')}
                            placeholderTextColor={colors.placeholder}
                            style={{
                                width: '100%',
                                paddingHorizontal: 16,
                                paddingVertical: 14,
                                backgroundColor: colors.surface,
                                borderRadius: 16,
                                borderWidth: 1.5,
                                borderColor: colors.border,
                                color: colors.text,
                                fontWeight: '700',
                                fontSize: 15,
                            }}
                        />
                    </View>

                    {/* Ngành nghề 2x2 grid */}
                    <View style={{ marginBottom: 16 }}>
                        <Text style={{ fontSize: 13, color: colors.text, fontWeight: '700', marginBottom: 8 }}>
                            {language === 'vi' ? 'Nhóm công việc' : 'Category'}
                        </Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10 }}>
                            {categories.map((cat, idx) => {
                                const IconComp = cat.icon;
                                const isSelected = selectedCat === idx;
                                return (
                                    <TouchableOpacity
                                        key={idx}
                                        activeOpacity={0.8}
                                        onPress={() => setSelectedCat(idx)}
                                        style={{
                                            width: '48%',
                                            paddingVertical: 12,
                                            paddingHorizontal: 12,
                                            borderRadius: 16,
                                            borderWidth: 1.5,
                                            borderColor: isSelected ? colors.primary : colors.border,
                                            backgroundColor: isSelected ? colors.surfaceContainer : colors.surface,
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            gap: 8,
                                        }}
                                    >
                                        <IconComp
                                            size={18}
                                            color={isSelected ? colors.primary : colors.textSecondary}
                                        />
                                        <Text
                                            numberOfLines={1}
                                            style={{
                                                fontSize: 12.5,
                                                fontWeight: '700',
                                                color: isSelected ? colors.primary : colors.text,
                                                flex: 1,
                                            }}
                                        >
                                            {cat.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    {/* Số lượng thợ cần Stepper */}
                    <View
                        style={[
                            {
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: 16,
                                borderRadius: 18,
                                backgroundColor: colors.surface,
                                borderWidth: 1,
                                borderColor: colors.border,
                                marginBottom: 16,
                            },
                            shadows.card,
                        ]}
                    >
                        <View>
                            <Text style={{ fontSize: 14, fontWeight: '800', color: colors.text }}>
                                {t('requester.workersCountLabel')}
                            </Text>
                            <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                                {language === 'vi' ? 'Cần bao nhiêu người làm việc?' : 'How many workers needed?'}
                            </Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                            <TouchableOpacity
                                activeOpacity={0.8}
                                onPress={() => setWorkerCount(Math.max(1, workerCount - 1))}
                                style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceContainer, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }}
                            >
                                <Text style={{ color: colors.primary, fontWeight: '800', fontSize: 18 }}>-</Text>
                            </TouchableOpacity>

                            <Text style={{ fontSize: 18, fontWeight: '800', color: colors.primary, width: 24, textAlign: 'center' }}>
                                {workerCount}
                            </Text>

                            <TouchableOpacity
                                activeOpacity={0.8}
                                onPress={() => setWorkerCount(workerCount + 1)}
                                style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceContainer, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }}
                            >
                                <Text style={{ color: colors.primary, fontWeight: '800', fontSize: 18 }}>+</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Hình thức trả thù lao */}
                    <View style={{ marginBottom: 16 }}>
                        <Text style={{ fontSize: 13, color: colors.text, fontWeight: '700', marginBottom: 6 }}>
                            {t('requester.wageTypeLabel')}
                        </Text>
                        <View style={{ flexDirection: 'row', padding: 4, borderRadius: 16, backgroundColor: colors.surfaceContainer }}>
                            <TouchableOpacity
                                activeOpacity={0.8}
                                onPress={() => setWageType('package')}
                                style={{
                                    flex: 1,
                                    paddingVertical: 12,
                                    borderRadius: 12,
                                    alignItems: 'center',
                                    backgroundColor: wageType === 'package' ? colors.surface : 'transparent',
                                    borderWidth: 1.5,
                                    borderColor: wageType === 'package' ? colors.primary : 'transparent',
                                }}
                            >
                                <Text
                                    style={{
                                        fontSize: 13,
                                        fontWeight: '700',
                                        color: wageType === 'package' ? colors.primary : colors.textSecondary,
                                    }}
                                >
                                    {t('requester.wagePackage')}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                activeOpacity={0.8}
                                onPress={() => setWageType('hourly')}
                                style={{
                                    flex: 1,
                                    paddingVertical: 12,
                                    borderRadius: 12,
                                    alignItems: 'center',
                                    backgroundColor: wageType === 'hourly' ? colors.surface : 'transparent',
                                    borderWidth: 1.5,
                                    borderColor: wageType === 'hourly' ? colors.primary : 'transparent',
                                }}
                            >
                                <Text
                                    style={{
                                        fontSize: 13,
                                        fontWeight: '700',
                                        color: wageType === 'hourly' ? colors.primary : colors.textSecondary,
                                    }}
                                >
                                    {t('requester.wageHourly')}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Mức thù lao / thợ */}
                    <View style={{ marginBottom: 16 }}>
                        <Text style={{ fontSize: 13, color: colors.text, fontWeight: '700', marginBottom: 6 }}>
                            {t('requester.wagePerWorkerLabel')} ({t('common.currency')})
                        </Text>
                        <TextInput
                            value={wagePerWorker.toString()}
                            onChangeText={(val) => setWagePerWorker(Number(val) || 0)}
                            keyboardType="number-pad"
                            style={{
                                width: '100%',
                                paddingHorizontal: 16,
                                paddingVertical: 14,
                                backgroundColor: colors.surface,
                                borderRadius: 16,
                                borderWidth: 1.5,
                                borderColor: colors.border,
                                color: colors.primary,
                                fontWeight: '800',
                                fontSize: 16,
                            }}
                        />
                    </View>

                    {/* Địa điểm tập kết (Goong.io Autocomplete) */}
                    <View style={{ marginBottom: 20, zIndex: 50 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                            <Text style={{ fontSize: 13, color: colors.text, fontWeight: '700' }}>
                                {t('requester.locationLabel')}
                            </Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                <Navigation size={11} color={colors.primary} />
                                <Text style={{ fontSize: 11, fontWeight: '700', color: colors.primary }}>
                                    Goong Maps
                                </Text>
                            </View>
                        </View>
                        <View style={{ position: 'relative', justifyContent: 'center' }}>
                            <MapPin size={18} color={colors.secondary} style={{ position: 'absolute', left: 14, zIndex: 10 }} />
                            <TextInput
                                value={location}
                                onChangeText={handleLocationChange}
                                placeholder={t('requester.locationPlaceholder')}
                                placeholderTextColor={colors.placeholder}
                                style={{
                                    width: '100%',
                                    paddingLeft: 42,
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
                            {isSearchingLocation && (
                                <View style={{ position: 'absolute', right: 14, zIndex: 10 }}>
                                    <ActivityIndicator size="small" color={colors.primary} />
                                </View>
                            )}
                        </View>

                        {/* Dropdown gợi ý từ Goong */}
                        {locationPredictions.length > 0 && (
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
                                {locationPredictions.map((pred, idx) => (
                                    <TouchableOpacity
                                        key={pred.placeId || idx}
                                        activeOpacity={0.8}
                                        onPress={() => handleSelectLocationPrediction(pred)}
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            paddingHorizontal: 14,
                                            paddingVertical: 12,
                                            borderBottomWidth: idx < locationPredictions.length - 1 ? 1 : 0,
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

                        {/* Bản đồ Goong Maps xem trước địa điểm tập kết */}
                        {selectedCoords && (
                            <GoongMapCard
                                latitude={selectedCoords.lat}
                                longitude={selectedCoords.lng}
                                address={location}
                                title={language === 'vi' ? 'Bản đồ vị trí tập kết (Goong Maps)' : 'Gathering Point Map (Goong Maps)'}
                                height={150}
                            />
                        )}
                    </View>
                </ScrollView>

                {/* Sticky Bottom Cost & Submit */}
                <View
                    style={[
                        {
                            padding: 20,
                            borderTopWidth: 1,
                            borderColor: colors.border,
                            backgroundColor: colors.surface,
                        },
                        shadows.floating,
                    ]}
                >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                        <View>
                            <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                                {t('requester.totalEstimate')} ({workerCount} {language === 'vi' ? 'người' : 'workers'})
                            </Text>
                            <Text style={{ fontSize: 22, fontWeight: '800', color: colors.text, marginTop: 2 }}>
                                {totalEstimate.toLocaleString('vi-VN')} {t('common.currency')}
                            </Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 9999, backgroundColor: '#dcfce7' }}>
                            <ShieldCheck size={14} color="#16a34a" />
                            <Text style={{ fontSize: 11, color: '#16a34a', fontWeight: '700' }}>
                                {language === 'vi' ? 'Thanh toán an toàn' : 'Secure Payment'}
                            </Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        activeOpacity={0.88}
                        onPress={() => router.push('/(requester)/radar')}
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
                            colors={gradients.electric}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={{ paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                        >
                            <Radar size={18} color="#ffffff" />
                            <Text style={{ color: '#ffffff', fontSize: 15, fontWeight: '800' }}>
                                {t('requester.postJobBtn')}
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
