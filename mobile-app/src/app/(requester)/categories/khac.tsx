import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
    Modal,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { WebView } from 'react-native-webview';
import {
    ArrowLeft,
    MapPin,
    Navigation,
    Sparkles,
    Clock,
    Briefcase,
    X,
    Search,
    Plus,
    Minus,
    ChevronRight,
    ZoomIn,
    ZoomOut,
    Crosshair,
    Ticket,
    Tag,
    Check,
    Users,
    Layers,
    FileText,
} from 'lucide-react-native';
import { GoongService, GoongPlacePrediction, GOONG_MAPTILES_KEY } from '../../../services/goongService';
import { useAppTheme } from '../../../constants/theme';
import { useI18n } from '../../../i18n';
import GlassBottomBar from '../../../components/GlassBottomBar';

const CATE_ICON = require('../../../../assets/icon-cate/khac.png');

interface Coords {
    lat: number;
    lng: number;
}

export interface VoucherItem {
    code: string;
    title: string;
    description: string;
    discountType: 'fixed' | 'percent';
    discountValue: number;
    maxDiscount?: number;
    minOrderValue: number;
    expiryText: string;
}

export const AVAILABLE_VOUCHERS: VoucherItem[] = [
    {
        code: 'FLASH20K',
        title: 'Giảm 20.000đ đơn đầu',
        description: 'Áp dụng cho mọi yêu cầu từ 100.000đ',
        discountType: 'fixed',
        discountValue: 20000,
        minOrderValue: 100000,
        expiryText: 'HSD: 30/11/2026',
    },
    {
        code: 'LINHHOAT30K',
        title: 'Trợ giá việc tự do 30.000đ',
        description: 'Áp dụng cho đơn thuê từ 180.000đ',
        discountType: 'fixed',
        discountValue: 30000,
        minOrderValue: 180000,
        expiryText: 'HSD: 25/11/2026',
    },
    {
        code: 'GIAM10',
        title: 'Giảm 10% tổng hóa đơn',
        description: 'Giảm 10% tối đa 50.000đ cho đơn từ 150.000đ',
        discountType: 'percent',
        discountValue: 10,
        maxDiscount: 50000,
        minOrderValue: 150000,
        expiryText: 'HSD: 31/12/2026',
    },
    {
        code: 'VIP50K',
        title: 'Giảm 50.000đ gói lớn',
        description: 'Áp dụng cho đơn thuê từ 400.000đ',
        discountType: 'fixed',
        discountValue: 50000,
        minOrderValue: 400000,
        expiryText: 'HSD: 31/12/2026',
    },
];

export function calculateVoucherDiscount(voucher: VoucherItem, subtotal: number): number {
    if (subtotal < voucher.minOrderValue) return 0;
    if (voucher.discountType === 'fixed') {
        return Math.min(subtotal, voucher.discountValue);
    }
    const percentAmount = Math.round((subtotal * voucher.discountValue) / 100);
    return voucher.maxDiscount ? Math.min(voucher.maxDiscount, percentAmount) : percentAmount;
}

// 4 Nhóm công việc phổ biến (Ngắn gọn)
export const TASK_TYPES = [
    { id: 'chores', label: 'Việc vặt gia đình' },
    { id: 'queue', label: 'Xếp hàng giữ chỗ' },
    { id: 'flyer', label: 'Phát tờ rơi / Biển' },
    { id: 'helper', label: 'Phụ kho / Sự kiện' },
];

// 3 Cường độ thể lực
export const EFFORT_LEVELS = [
    { id: 'light', label: 'Việc nhẹ nhàng' },
    { id: 'mobile', label: 'Cần đi lại nhiều' },
    { id: 'heavy', label: 'Cần thể lực tốt' },
];

// 5 Gợi ý đầu việc nhanh (Gọn gàng, full width, 1 dòng)
export const QUICK_TASKS = [
    { id: 'queue_ticket', label: 'Xếp hàng mua vé, lấy số thứ tự, nhận đồ' },
    { id: 'distribute_flyer', label: 'Phát tờ rơi tận nơi, phát tại ngã tư' },
    { id: 'warehouse_clean', label: 'Phụ dọn dẹp kho bãi, sắp xếp bao bì hàng' },
    { id: 'store_watch', label: 'Trông coi cửa hàng, hỗ trợ dắt xe tạm thời' },
    { id: 'errands_buy', label: 'Chạy việc vặt, mua sắm đồ đạc theo yêu cầu' },
];

export default function KhacJobScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { colors, gradients, shadows, isDark } = useAppTheme();
    const { t } = useI18n();

    // 1. Tên công việc & Địa điểm làm việc
    const [jobTitle, setJobTitle] = useState('');
    const [address, setAddress] = useState('');
    const [coords, setCoords] = useState<Coords | null>(null);
    const [addressPredictions, setAddressPredictions] = useState<GoongPlacePrediction[]>([]);
    const [isSearchingAddress, setIsSearchingAddress] = useState(false);
    const [isLocatingAddress, setIsLocatingAddress] = useState(false);
    const [locationDetail, setLocationDetail] = useState('');

    // Modal Goong Maps
    const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);
    const [pickerCoords, setPickerCoords] = useState<Coords>({ lat: 10.7769, lng: 106.7009 });
    const initialMapCoordsRef = useRef<Coords>({ lat: 10.7769, lng: 106.7009 });
    const [isMapLoading, setIsMapLoading] = useState(false);
    const [pickerAddress, setPickerAddress] = useState('');
    const [isPickerResolving, setIsPickerResolving] = useState(false);
    const [pickerSearchText, setPickerSearchText] = useState('');
    const [pickerPredictions, setPickerPredictions] = useState<GoongPlacePrediction[]>([]);

    const webViewRef = useRef<any>(null);
    const userLocationCacheRef = useRef<Coords | null>(null);
    const searchTimerRef = useRef<any>(null);
    const modalSearchTimerRef = useRef<any>(null);

    // 2. Nhóm công việc & Cường độ
    const [selectedTaskType, setSelectedTaskType] = useState('chores');
    const [selectedEffort, setSelectedEffort] = useState('light');

    // 3. Danh mục đầu việc gợi ý nhanh (Mặc định chọn 1 việc)
    const [selectedTasks, setSelectedTasks] = useState<string[]>(['queue_ticket']);
    const [customTaskDetail, setCustomTaskDetail] = useState('');

    const toggleTask = (taskId: string) => {
        setSelectedTasks((prev) =>
            prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
        );
    };

    // 4. Hình thức thuê & Mức thù lao (MẶC ĐỊNH THỜI LƯỢNG VÀ SỐ LƯỢNG LÀ 1)
    const [pricingMode, setPricingMode] = useState<'hourly' | 'fixed'>('fixed');
    const [hours, setHours] = useState(1);
    const [workersCount, setWorkersCount] = useState(1);
    const [hourlyWage, setHourlyWage] = useState('50.000');
    const [fixedPrice, setFixedPrice] = useState('150.000');

    // 5. Yêu cầu phương tiện / Ghi chú
    const [needMotorbike, setNeedMotorbike] = useState(false);
    const [specialNotes, setSpecialNotes] = useState('');

    // 6. Voucher
    const [selectedVoucher, setSelectedVoucher] = useState<VoucherItem | null>(null);
    const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
    const [voucherInputCode, setVoucherInputCode] = useState('');

    // Pre-cache tọa độ người dùng
    useEffect(() => {
        (async () => {
            try {
                const loc = await GoongService.getCurrentLocation();
                if (loc && loc.latitude && loc.longitude) {
                    userLocationCacheRef.current = { lat: loc.latitude, lng: loc.longitude };
                    if (!coords) {
                        setPickerCoords({ lat: loc.latitude, lng: loc.longitude });
                        initialMapCoordsRef.current = { lat: loc.latitude, lng: loc.longitude };
                    }
                }
            } catch {
                // Tiếp tục
            }
        })();
    }, []);

    // THUẬT TOÁN GỢI Ý MỨC TIỀN HỢP LÝ THEO CƯỜNG ĐỘ VÀ TÍNH CHẤT
    const suggestedRecommendation = useMemo(() => {
        let baseWagePerHour = 45000;
        if (selectedTaskType === 'queue') baseWagePerHour = 45000;
        else if (selectedTaskType === 'flyer') baseWagePerHour = 50000;
        else if (selectedTaskType === 'helper') baseWagePerHour = 60000;
        else if (selectedTaskType === 'chores') baseWagePerHour = 45000;

        if (selectedEffort === 'heavy') baseWagePerHour += 15000;
        else if (selectedEffort === 'mobile') baseWagePerHour += 5000;

        let recH = 2;
        const recHourlyWageFormatted = baseWagePerHour.toLocaleString('vi-VN');
        const recHourlyTotal = recH * baseWagePerHour;
        const recFixed = Math.round(recHourlyTotal / 10000) * 10000;

        return {
            hours: recH,
            hourlyWage: baseWagePerHour,
            hourlyWageFormatted: recHourlyWageFormatted,
            hourlyTotalFormatted: recHourlyTotal.toLocaleString('vi-VN'),
            fixedPrice: Math.max(100000, recFixed),
            fixedPriceFormatted: Math.max(100000, recFixed).toLocaleString('vi-VN'),
        };
    }, [selectedTaskType, selectedEffort, selectedTasks]);

    // Các chip giá khoán gợi ý linh hoạt
    const dynamicFixedChips = useMemo(() => {
        const center = suggestedRecommendation.fixedPrice;
        const c1 = Math.max(100000, center - 40000);
        const c2 = center;
        const c3 = center + 50000;
        const c4 = center + 100000;
        return [c1, c2, c3, c4].map((v) => v.toLocaleString('vi-VN'));
    }, [suggestedRecommendation.fixedPrice]);

    const handleApplySuggestedPrice = () => {
        if (pricingMode === 'hourly') {
            setHours(suggestedRecommendation.hours);
            setHourlyWage(suggestedRecommendation.hourlyWageFormatted);
        } else {
            setFixedPrice(suggestedRecommendation.fixedPriceFormatted);
        }
    };

    const handleHourlyWageChange = (text: string) => {
        const raw = text.replace(/\D/g, '');
        const num = parseInt(raw, 10) || 0;
        setHourlyWage(num > 0 ? num.toLocaleString('vi-VN') : '');
    };

    const handleFixedPriceChange = (text: string) => {
        const raw = text.replace(/\D/g, '');
        const num = parseInt(raw, 10) || 0;
        setFixedPrice(num > 0 ? num.toLocaleString('vi-VN') : '');
    };

    // Tìm kiếm địa chỉ với gợi ý Goong
    const handleSearchLocation = (text: string) => {
        setAddress(text);
        if (text.trim().length >= 2) {
            setIsSearchingAddress(true);
            if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
            searchTimerRef.current = setTimeout(async () => {
                const results = await GoongService.searchPlaces(text);
                setAddressPredictions(results);
                setIsSearchingAddress(false);
            }, 450);
        } else {
            setAddressPredictions([]);
            setIsSearchingAddress(false);
        }
    };

    const handleSelectPrediction = async (item: GoongPlacePrediction) => {
        setAddress(item.description);
        setAddressPredictions([]);
        const detail = await GoongService.getPlaceDetail(item.placeId);
        if (detail && detail.latitude && detail.longitude) {
            setCoords({ lat: detail.latitude, lng: detail.longitude });
        }
    };

    // GPS 1 chạm
    const handleUseCurrentLocation = async () => {
        setIsLocatingAddress(true);
        try {
            const loc = await GoongService.getCurrentLocation();
            if (loc) {
                setAddress(loc.address);
                setCoords({ lat: loc.latitude, lng: loc.longitude });
                setAddressPredictions([]);
            }
        } catch {
            Alert.alert(t('common.error'), 'Không thể lấy vị trí hiện tại.');
        } finally {
            setIsLocatingAddress(false);
        }
    };

    // Modal bản đồ Goong
    const handleOpenMapPicker = () => {
        setIsMapPickerOpen(true);
        if (coords) {
            setPickerCoords(coords);
            initialMapCoordsRef.current = coords;
            setPickerAddress(address || 'Đang tải địa chỉ...');
        } else if (userLocationCacheRef.current) {
            setPickerCoords(userLocationCacheRef.current);
            initialMapCoordsRef.current = userLocationCacheRef.current;
        }
        setIsMapLoading(true);
    };

    const resolvePickerAddress = async (lat: number, lng: number) => {
        setIsPickerResolving(true);
        try {
            const addr = await GoongService.reverseGeocode(lat, lng);
            if (addr) setPickerAddress(addr);
        } catch {
            setPickerAddress(`Vị trí đã chọn (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
        } finally {
            setIsPickerResolving(false);
        }
    };

    const flyToLocation = (lat: number, lng: number) => {
        setPickerCoords({ lat, lng });
        resolvePickerAddress(lat, lng);
        if (webViewRef.current) {
            webViewRef.current.injectJavaScript(`if (window.moveTo) { window.moveTo(${lat}, ${lng}, 16); } true;`);
        }
    };

    const handleLocateOnMap = async () => {
        try {
            const loc = await GoongService.getCurrentLocation();
            if (loc) flyToLocation(loc.latitude, loc.longitude);
        } catch {}
    };

    const zoomInMap = () => {
        if (webViewRef.current) webViewRef.current.injectJavaScript(`if (window.map) { window.map.zoomIn(); } true;`);
    };

    const zoomOutMap = () => {
        if (webViewRef.current) webViewRef.current.injectJavaScript(`if (window.map) { window.map.zoomOut(); } true;`);
    };

    const handlePickerSearchText = (text: string) => {
        setPickerSearchText(text);
        if (modalSearchTimerRef.current) clearTimeout(modalSearchTimerRef.current);
        if (text.trim().length >= 2) {
            modalSearchTimerRef.current = setTimeout(async () => {
                const results = await GoongService.searchPlaces(text);
                setPickerPredictions(results);
            }, 400);
        } else {
            setPickerPredictions([]);
        }
    };

    const handleConfirmMapPicker = () => {
        setCoords(pickerCoords);
        setAddress(pickerAddress || 'Vị trí đã chọn trên bản đồ');
        setAddressPredictions([]);
        setIsMapPickerOpen(false);
    };

    // Memoize HTML bản đồ Goong
    const goongMapHtml = useMemo(() => {
        const initLat = initialMapCoordsRef.current.lat;
        const initLng = initialMapCoordsRef.current.lng;
        return `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin />
    <link rel="preconnect" href="https://tiles.goong.io" crossorigin />
    <script src="https://cdn.jsdelivr.net/npm/maplibre-gl@2.4.0/dist/maplibre-gl.js"></script>
    <link href="https://cdn.jsdelivr.net/npm/maplibre-gl@2.4.0/dist/maplibre-gl.css" rel="stylesheet" />
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; -webkit-touch-callout: none; -webkit-user-select: none; user-select: none; }
        body, html { width: 100%; height: 100%; overflow: hidden; background-color: ${isDark ? '#0f172a' : '#f1f5f9'}; }
        #map { position: absolute; top: 0; bottom: 0; left: 0; right: 0; width: 100%; height: 100%; }
        .center-pin { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -100%); z-index: 100; pointer-events: none; display: flex; flex-direction: column; align-items: center; }
        .pin-shadow { width: 14px; height: 6px; background: rgba(0,0,0,0.28); border-radius: 50%; margin-top: -3px; }
    </style>
</head>
<body>
    <div id="map"></div>
    <div class="center-pin" id="pin">
        <svg width="44" height="44" viewBox="0 0 24 24" fill="#0284c7" stroke="#ffffff" stroke-width="1.8">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
            <circle cx="12" cy="9" r="2.8" fill="#ffffff"/>
        </svg>
        <div class="pin-shadow"></div>
    </div>
    <script>
        const styleUrl = '${isDark ? 'https://tiles.goong.io/assets/goong_map_dark.json' : 'https://tiles.goong.io/assets/goong_map_web.json'}?api_key=${GOONG_MAPTILES_KEY}';
        const map = new maplibregl.Map({ container: 'map', style: styleUrl, center: [${initLng}, ${initLat}], zoom: 15, attributionControl: false });
        window.map = map;
        var debounceTimer = null;
        window.moveTo = function(lat, lng, zoom) { if (map) { map.flyTo({ center: [lng, lat], zoom: zoom || 16, essential: true }); } };
        map.on('moveend', function() {
            if (debounceTimer) clearTimeout(debounceTimer);
            debounceTimer = setTimeout(function() {
                var center = map.getCenter();
                if (window.ReactNativeWebView) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'LOCATION_CHANGED', lat: center.lat, lng: center.lng }));
                }
            }, 600);
        });
        map.on('load', function() { if (window.ReactNativeWebView) { window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'MAP_LOADED' })); } });
    </script>
</body>
</html>`;
    }, [isDark]);

    // Tính toán chi phí
    const parsedHourlyWage = parseInt(hourlyWage.replace(/\D/g, ''), 10) || 0;
    const parsedFixedPrice = parseInt(fixedPrice.replace(/\D/g, ''), 10) || 0;
    const bikeAllowance = needMotorbike ? 20000 * workersCount : 0;

    const baseWage =
        pricingMode === 'hourly'
            ? Math.round(hours * workersCount * parsedHourlyWage)
            : parsedFixedPrice * workersCount;

    const subtotal = baseWage + bikeAllowance;
    const voucherDiscount = selectedVoucher ? calculateVoucherDiscount(selectedVoucher, subtotal) : 0;
    const grandTotal = Math.max(0, subtotal - voucherDiscount);

    // Voucher Handlers
    const handleApplyVoucherCode = () => {
        const code = voucherInputCode.trim().toUpperCase();
        if (!code) {
            Alert.alert('Chưa nhập mã', 'Vui lòng nhập mã ưu đãi để áp dụng.');
            return;
        }
        const found = AVAILABLE_VOUCHERS.find((v) => v.code.toUpperCase() === code);
        if (!found) {
            Alert.alert('Mã không hợp lệ', `Mã "${code}" không tồn tại hoặc đã hết hạn.`);
            return;
        }
        if (subtotal > 0 && subtotal < found.minOrderValue) {
            Alert.alert(
                'Chưa đủ điều kiện',
                `Mã ${found.code} yêu cầu giá trị đơn từ ${found.minOrderValue.toLocaleString('vi-VN')} đ.`
            );
            return;
        }
        setSelectedVoucher(found);
        setIsVoucherModalOpen(false);
        setVoucherInputCode('');
        Alert.alert('Áp dụng thành công', `Đã áp dụng mã "${found.code}": ${found.title}`);
    };

    const handleSelectVoucherItem = (voucher: VoucherItem) => {
        if (subtotal > 0 && subtotal < voucher.minOrderValue) {
            Alert.alert('Chưa đủ điều kiện', `Mã ${voucher.code} yêu cầu đơn từ ${voucher.minOrderValue.toLocaleString('vi-VN')} đ.`);
            return;
        }
        setSelectedVoucher(voucher);
        setIsVoucherModalOpen(false);
    };

    const handleRemoveVoucher = () => {
        setSelectedVoucher(null);
    };

    // Đăng việc linh hoạt khác
    const handleSubmit = () => {
        if (!jobTitle.trim()) {
            Alert.alert(t('common.error'), 'Vui lòng nhập tên công việc cần thuê.');
            return;
        }
        if (!address.trim()) {
            Alert.alert(t('common.error'), 'Vui lòng nhập hoặc chọn địa chỉ làm việc.');
            return;
        }
        if (selectedTasks.length === 0 && !customTaskDetail.trim()) {
            Alert.alert(t('common.error'), 'Vui lòng chọn hoặc mô tả đầu việc cần làm.');
            return;
        }
        if (pricingMode === 'hourly' && parsedHourlyWage <= 0) {
            Alert.alert(t('common.error'), 'Vui lòng nhập mức thù lao/giờ.');
            return;
        }
        if (pricingMode === 'fixed' && parsedFixedPrice <= 0) {
            Alert.alert(t('common.error'), 'Vui lòng nhập mức thù lao khoán.');
            return;
        }

        const taskTypeObj = TASK_TYPES.find((t) => t.id === selectedTaskType);
        const effortObj = EFFORT_LEVELS.find((e) => e.id === selectedEffort);

        const pricingSummary =
            pricingMode === 'hourly'
                ? `${hours}h × ${workersCount} người (${parsedHourlyWage.toLocaleString('vi-VN')} đ/h)`
                : `Khoán trọn gói (${parsedFixedPrice.toLocaleString('vi-VN')} đ × ${workersCount} người)`;

        const summaryLines = [
            `Tên việc: ${jobTitle.trim()}`,
            `Địa điểm: ${address}${locationDetail ? ` (${locationDetail})` : ''}`,
            `Phân loại: ${taskTypeObj?.label} - ${effortObj?.label}`,
            `Hình thức: ${pricingSummary}`,
            `Thời gian: Nhận việc & có mặt ngay (trong 30 - 60 phút)`,
            `Phương tiện: ${needMotorbike ? 'Yêu cầu có xe máy đi lại (+20.000đ)' : 'Không cần xe'}`,
            selectedVoucher && voucherDiscount > 0 ? `Ưu đãi (${selectedVoucher.code}): -${voucherDiscount.toLocaleString('vi-VN')} đ` : null,
            specialNotes.trim() ? `Ghi chú: ${specialNotes.trim()}` : null,
        ].filter(Boolean).join('\n• ');

        Alert.alert(
            'Xác nhận đăng việc Linh Hoạt Khác',
            `Tổng chi phí thù lao ước tính: ${grandTotal.toLocaleString('vi-VN')} đ\n\n• ${summaryLines}`,
            [
                { text: 'Chỉnh sửa', style: 'cancel' },
                {
                    text: 'Đăng việc ngay',
                    onPress: () => {
                        Alert.alert('Thành công', 'Công việc linh hoạt của bạn đã được đăng thành công và thông báo tới người lao động!');
                        router.replace('/(requester)');
                    },
                },
            ]
        );
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
            <View style={{ flex: 1 }}>
                {/* Header Top Bar */}
                <View
                    style={{
                        paddingHorizontal: 16,
                        paddingVertical: 12,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderBottomWidth: 1,
                        borderColor: isDark ? colors.border : '#ebdffa',
                        backgroundColor: colors.surface,
                    }}
                >
                    <TouchableOpacity
                        onPress={() => (router.canGoBack() ? router.back() : router.replace('/(requester)'))}
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

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Image source={CATE_ICON} style={{ width: 28, height: 28 }} contentFit="contain" />
                        <Text style={{ fontSize: 17, fontWeight: '800', color: colors.text }}>
                            Công Việc Linh Hoạt Khác
                        </Text>
                    </View>

                    <View style={{ width: 40 }} />
                </View>

                <ScrollView
                    contentContainerStyle={{ padding: 16, paddingBottom: 110 }}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* THÔNG BÁO THỜI GIAN NHẬN VIỆC HỎA TỐC */}
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingHorizontal: 12,
                            paddingVertical: 9,
                            borderRadius: 12,
                            backgroundColor: isDark ? '#1e1b4b35' : '#f5f3ff',
                            borderWidth: 1,
                            borderColor: isDark ? colors.border : '#e9d5ff',
                            marginBottom: 14,
                            gap: 8,
                        }}
                    >
                        <Clock size={15} color={colors.primary} />
                        <Text style={{ fontSize: 12, fontWeight: '700', color: colors.text, flex: 1 }} numberOfLines={1}>
                            Thợ nhận việc và có mặt ngay (trong 30 - 60 phút)
                        </Text>
                    </View>

                    {/* KHỐI 1: TÊN VIỆC & ĐỊA ĐIỂM */}
                    <View
                        style={[
                            {
                                padding: 16,
                                borderRadius: 20,
                                backgroundColor: colors.surface,
                                borderWidth: 1,
                                borderColor: isDark ? colors.border : '#ebdffa',
                                marginBottom: 16,
                            },
                            shadows.card,
                        ]}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                            <Briefcase size={16} color={colors.primary} />
                            <Text style={{ fontSize: 14, fontWeight: '800', color: colors.text }}>
                                Tiêu đề công việc & Địa điểm
                            </Text>
                        </View>

                        {/* Ô nhập tên công việc */}
                        <View style={{ marginBottom: 12 }}>
                            <Text style={{ fontSize: 12, fontWeight: '700', color: colors.text, marginBottom: 4 }}>
                                Tên việc cần thuê
                            </Text>
                            <TextInput
                                value={jobTitle}
                                onChangeText={setJobTitle}
                                placeholder="Ví dụ: Xếp hàng mua vé, Phụ dọn kho hàng..."
                                placeholderTextColor={colors.placeholder}
                                style={{
                                    backgroundColor: colors.surfaceContainerLow,
                                    borderRadius: 12,
                                    paddingHorizontal: 12,
                                    paddingVertical: 10,
                                    fontSize: 13,
                                    fontWeight: '700',
                                    color: colors.text,
                                    borderWidth: 1,
                                    borderColor: colors.border,
                                }}
                            />
                        </View>

                        {/* Ô tìm địa chỉ */}
                        <Text style={{ fontSize: 12, fontWeight: '700', color: colors.text, marginBottom: 4 }}>
                            Địa điểm làm việc
                        </Text>
                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                paddingHorizontal: 12,
                                paddingVertical: 10,
                                borderRadius: 12,
                                backgroundColor: colors.surfaceContainerLow,
                                borderWidth: 1,
                                borderColor: isDark ? colors.border : '#ebdffa',
                                marginBottom: 8,
                            }}
                        >
                            <TextInput
                                value={address}
                                onChangeText={handleSearchLocation}
                                placeholder="Nhập số nhà, tên đường, khu vực..."
                                placeholderTextColor={colors.placeholder}
                                style={{ flex: 1, fontSize: 13, color: colors.text }}
                            />
                            {isSearchingAddress && <ActivityIndicator size="small" color={colors.primary} style={{ marginLeft: 6 }} />}
                            {address.length > 0 && !isSearchingAddress && (
                                <TouchableOpacity onPress={() => { setAddress(''); setCoords(null); setAddressPredictions([]); }}>
                                    <X size={16} color={colors.textSecondary} />
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Gợi ý địa chỉ */}
                        {addressPredictions.length > 0 && (
                            <View style={{ marginBottom: 10, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' }}>
                                {addressPredictions.slice(0, 4).map((item, i) => (
                                    <TouchableOpacity
                                        key={i}
                                        onPress={() => handleSelectPrediction(item)}
                                        style={{
                                            padding: 12,
                                            borderBottomWidth: i < addressPredictions.length - 1 ? 1 : 0,
                                            borderColor: colors.border,
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            gap: 8,
                                        }}
                                    >
                                        <MapPin size={14} color={colors.primary} />
                                        <View style={{ flex: 1 }}>
                                            <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text }}>{item.mainText}</Text>
                                            <Text style={{ fontSize: 11, color: colors.textSecondary }} numberOfLines={1}>{item.secondaryText}</Text>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}

                        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                            <TouchableOpacity
                                onPress={handleUseCurrentLocation}
                                activeOpacity={0.75}
                                style={{
                                    flex: 1,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    paddingVertical: 9,
                                    paddingHorizontal: 8,
                                    borderRadius: 10,
                                    backgroundColor: isDark ? colors.surfaceContainer : '#f3e8ff',
                                    borderWidth: 1,
                                    borderColor: isDark ? colors.border : '#e9d5ff',
                                    gap: 6,
                                }}
                            >
                                {isLocatingAddress ? (
                                    <ActivityIndicator size="small" color={colors.primary} />
                                ) : (
                                    <>
                                        <Navigation size={14} color={colors.primary} />
                                        <Text style={{ fontSize: 12, fontWeight: '700', color: colors.primary }}>
                                            Vị trí hiện tại
                                        </Text>
                                    </>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={handleOpenMapPicker}
                                activeOpacity={0.75}
                                style={{
                                    flex: 1,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    paddingVertical: 9,
                                    paddingHorizontal: 8,
                                    borderRadius: 10,
                                    backgroundColor: isDark ? colors.surfaceContainer : '#fdf2f8',
                                    borderWidth: 1,
                                    borderColor: isDark ? colors.border : '#fbcfe8',
                                    gap: 6,
                                }}
                            >
                                <MapPin size={14} color={colors.secondary} />
                                <Text style={{ fontSize: 12, fontWeight: '700', color: colors.secondary }}>
                                    Chọn trên bản đồ
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <View style={{ paddingTop: 10, borderTopWidth: 1, borderColor: colors.border }}>
                            <Text style={{ fontSize: 12, fontWeight: '700', color: colors.text, marginBottom: 4 }}>
                                Chi tiết địa điểm hoặc chỉ dẫn đường vào
                            </Text>
                            <TextInput
                                value={locationDetail}
                                onChangeText={setLocationDetail}
                                placeholder="Ví dụ: Cửa số 2, Cổng vòm, Đi vào hẻm rẽ trái..."
                                placeholderTextColor={colors.placeholder}
                                style={{
                                    backgroundColor: colors.surfaceContainerLow,
                                    borderRadius: 10,
                                    paddingHorizontal: 12,
                                    paddingVertical: 8,
                                    fontSize: 12.5,
                                    color: colors.text,
                                    borderWidth: 1,
                                    borderColor: colors.border,
                                }}
                            />
                        </View>
                    </View>

                    {/* KHỐI 2: PHÂN LOẠI & CƯỜNG ĐỘ CÔNG VIỆC */}
                    <View
                        style={[
                            {
                                padding: 16,
                                borderRadius: 20,
                                backgroundColor: colors.surface,
                                borderWidth: 1,
                                borderColor: isDark ? colors.border : '#ebdffa',
                                marginBottom: 16,
                            },
                            shadows.card,
                        ]}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                            <Layers size={16} color={colors.primary} />
                            <Text style={{ fontSize: 14, fontWeight: '800', color: colors.text }}>
                                Phân loại & Cường độ
                            </Text>
                        </View>

                        {/* 4 Nhóm công việc */}
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                            {TASK_TYPES.map((type) => {
                                const isSelected = selectedTaskType === type.id;
                                return (
                                    <TouchableOpacity
                                        key={type.id}
                                        onPress={() => setSelectedTaskType(type.id)}
                                        style={{
                                            width: '48.5%',
                                            paddingVertical: 10,
                                            paddingHorizontal: 6,
                                            borderRadius: 12,
                                            borderWidth: 1.5,
                                            borderColor: isSelected ? colors.primary : colors.border,
                                            backgroundColor: isSelected ? colors.primary + '12' : colors.surfaceContainerLow,
                                            alignItems: 'center',
                                        }}
                                    >
                                        <Text style={{ fontSize: 13, fontWeight: '800', color: isSelected ? colors.primary : colors.text }}>
                                            {type.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        {/* Cường độ thể lực */}
                        <Text style={{ fontSize: 12, fontWeight: '700', color: colors.text, marginBottom: 6 }}>
                            Yêu cầu cường độ
                        </Text>
                        <View style={{ flexDirection: 'row', gap: 6 }}>
                            {EFFORT_LEVELS.map((eff) => {
                                const isSelected = selectedEffort === eff.id;
                                return (
                                    <TouchableOpacity
                                        key={eff.id}
                                        onPress={() => setSelectedEffort(eff.id)}
                                        style={{
                                            flex: 1,
                                            paddingVertical: 9,
                                            paddingHorizontal: 2,
                                            borderRadius: 10,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            borderWidth: 1.5,
                                            borderColor: isSelected ? colors.primary : colors.border,
                                            backgroundColor: isSelected ? colors.primary + '15' : colors.surfaceContainerLow,
                                        }}
                                    >
                                        <Text style={{ fontSize: 12, fontWeight: '800', color: isSelected ? colors.primary : colors.text }}>
                                            {eff.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    {/* KHỐI 3: DANH MỤC ĐẦU VIỆC GỢI Ý NHANH */}
                    <View
                        style={[
                            {
                                padding: 16,
                                borderRadius: 20,
                                backgroundColor: colors.surface,
                                borderWidth: 1,
                                borderColor: isDark ? colors.border : '#ebdffa',
                                marginBottom: 16,
                            },
                            shadows.card,
                        ]}
                    >
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                            <Text style={{ fontSize: 14, fontWeight: '800', color: colors.text }}>
                                Đầu việc nhanh ({selectedTasks.length})
                            </Text>
                            <TouchableOpacity
                                onPress={() => {
                                    if (selectedTasks.length === QUICK_TASKS.length) setSelectedTasks([]);
                                    else setSelectedTasks(QUICK_TASKS.map((t) => t.id));
                                }}
                            >
                                <Text style={{ fontSize: 11, fontWeight: '700', color: colors.primary }}>
                                    {selectedTasks.length === QUICK_TASKS.length ? 'Bỏ chọn hết' : 'Chọn tất cả'}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <View style={{ gap: 7, marginTop: 4 }}>
                            {QUICK_TASKS.map((item) => {
                                const isChecked = selectedTasks.includes(item.id);
                                return (
                                    <TouchableOpacity
                                        key={item.id}
                                        onPress={() => toggleTask(item.id)}
                                        activeOpacity={0.7}
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            paddingVertical: 10,
                                            paddingHorizontal: 12,
                                            borderRadius: 12,
                                            backgroundColor: isChecked ? (isDark ? '#064e3b20' : '#f0fdf4') : colors.surfaceContainerLow,
                                            borderWidth: 1,
                                            borderColor: isChecked ? '#10b981' : colors.border,
                                            gap: 10,
                                        }}
                                    >
                                        <View
                                            style={{
                                                width: 18,
                                                height: 18,
                                                borderRadius: 5,
                                                backgroundColor: isChecked ? '#10b981' : colors.surface,
                                                borderWidth: 1.5,
                                                borderColor: isChecked ? '#10b981' : colors.border,
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            {isChecked && <Check size={12} color="#ffffff" strokeWidth={3} />}
                                        </View>
                                        <Text
                                            style={{ fontSize: 13, fontWeight: isChecked ? '700' : '600', color: colors.text, flex: 1 }}
                                            numberOfLines={1}
                                        >
                                            {item.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        <View style={{ marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderColor: colors.border }}>
                            <Text style={{ fontSize: 12, fontWeight: '700', color: colors.text, marginBottom: 5 }}>
                                Mô tả chi tiết việc cần làm:
                            </Text>
                            <TextInput
                                value={customTaskDetail}
                                onChangeText={setCustomTaskDetail}
                                placeholder="Ví dụ: Giữ chỗ từ 6h sáng tại cổng số 1, gọi điện báo khi đến lượt..."
                                placeholderTextColor={colors.placeholder}
                                style={{
                                    backgroundColor: colors.surfaceContainerLow,
                                    borderRadius: 10,
                                    paddingHorizontal: 12,
                                    paddingVertical: 8,
                                    fontSize: 12,
                                    color: colors.text,
                                    borderWidth: 1,
                                    borderColor: colors.border,
                                }}
                            />
                        </View>
                    </View>

                    {/* KHỐI 4: HÌNH THỨC THUÊ & GỢI Ý MỨC TIỀN HỢP LÝ */}
                    <View
                        style={[
                            {
                                padding: 16,
                                borderRadius: 20,
                                backgroundColor: colors.surface,
                                borderWidth: 1,
                                borderColor: isDark ? colors.border : '#ebdffa',
                                marginBottom: 16,
                            },
                            shadows.card,
                        ]}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                            <Tag size={16} color={colors.primary} />
                            <Text style={{ fontSize: 14, fontWeight: '800', color: colors.text }}>
                                Thù lao & Tiền công đề xuất
                            </Text>
                        </View>

                        {/* 2 Tab: Khoán trọn gói vs Theo giờ */}
                        <View
                            style={{
                                flexDirection: 'row',
                                backgroundColor: colors.surfaceContainerLow,
                                borderRadius: 12,
                                padding: 4,
                                marginBottom: 12,
                                borderWidth: 1,
                                borderColor: colors.border,
                            }}
                        >
                            <TouchableOpacity
                                onPress={() => setPricingMode('fixed')}
                                style={{
                                    flex: 1,
                                    paddingVertical: 8,
                                    borderRadius: 10,
                                    alignItems: 'center',
                                    backgroundColor: pricingMode === 'fixed' ? colors.surface : 'transparent',
                                    borderWidth: pricingMode === 'fixed' ? 1 : 0,
                                    borderColor: colors.border,
                                }}
                            >
                                <Text style={{ fontSize: 13, fontWeight: '800', color: pricingMode === 'fixed' ? colors.primary : colors.textSecondary }}>
                                    Khoán trọn gói
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => setPricingMode('hourly')}
                                style={{
                                    flex: 1,
                                    paddingVertical: 8,
                                    borderRadius: 10,
                                    alignItems: 'center',
                                    backgroundColor: pricingMode === 'hourly' ? colors.surface : 'transparent',
                                    borderWidth: pricingMode === 'hourly' ? 1 : 0,
                                    borderColor: colors.border,
                                }}
                            >
                                <Text style={{ fontSize: 13, fontWeight: '800', color: pricingMode === 'hourly' ? colors.primary : colors.textSecondary }}>
                                    Thuê theo giờ
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* KHUNG GỢI Ý TIỀN HỢP LÝ */}
                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                backgroundColor: isDark ? '#064e3b22' : '#ecfdf5',
                                paddingHorizontal: 12,
                                paddingVertical: 10,
                                borderRadius: 12,
                                borderWidth: 1,
                                borderColor: '#10b981',
                                marginBottom: 14,
                            }}
                        >
                            <View style={{ flex: 1, marginRight: 8 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                                    <Sparkles size={14} color="#059669" />
                                    <Text style={{ fontSize: 12, fontWeight: '800', color: '#059669' }}>
                                        Gợi ý theo tính chất việc:
                                    </Text>
                                </View>
                                <Text style={{ fontSize: 13, fontWeight: '800', color: colors.text, marginTop: 2 }}>
                                    {pricingMode === 'fixed'
                                        ? `Khoán việc khoảng ${suggestedRecommendation.fixedPriceFormatted} đ`
                                        : `Ước tính ${suggestedRecommendation.hours}h (~${suggestedRecommendation.hourlyTotalFormatted} đ)`}
                                </Text>
                            </View>

                            <TouchableOpacity
                                onPress={handleApplySuggestedPrice}
                                style={{ backgroundColor: '#10b981', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}
                            >
                                <Text style={{ fontSize: 11, fontWeight: '800', color: '#ffffff' }}>Áp dụng</Text>
                            </TouchableOpacity>
                        </View>

                        {pricingMode === 'fixed' ? (
                            <View style={{ gap: 10 }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <View>
                                        <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text }}>Số lượng người làm</Text>
                                        <Text style={{ fontSize: 11, color: colors.textSecondary }}>Mặc định 1 người</Text>
                                    </View>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                        <TouchableOpacity
                                            onPress={() => setWorkersCount((prev) => Math.max(1, prev - 1))}
                                            style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceContainer, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }}
                                        >
                                            <Minus size={16} color={colors.text} />
                                        </TouchableOpacity>
                                        <Text style={{ fontSize: 16, fontWeight: '800', color: colors.primary, minWidth: 26, textAlign: 'center' }}>
                                            {workersCount}
                                        </Text>
                                        <TouchableOpacity
                                            onPress={() => setWorkersCount((prev) => Math.min(10, prev + 1))}
                                            style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceContainer, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }}
                                        >
                                            <Plus size={16} color={colors.text} />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                <Text style={{ fontSize: 12, fontWeight: '700', color: colors.text, marginTop: 4 }}>
                                    Tiền công khoán trọn gói (VNĐ / người):
                                </Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, backgroundColor: colors.surfaceContainerLow, borderWidth: 1, borderColor: colors.border }}>
                                    <TextInput
                                        value={fixedPrice}
                                        onChangeText={handleFixedPriceChange}
                                        keyboardType="numeric"
                                        placeholder="150.000"
                                        placeholderTextColor={colors.placeholder}
                                        style={{ flex: 1, fontSize: 18, fontWeight: '900', color: colors.primary }}
                                    />
                                    <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textSecondary }}>VNĐ / người</Text>
                                </View>

                                {/* Các chip giá khoán gợi ý linh hoạt */}
                                <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
                                    {dynamicFixedChips.map((val) => (
                                        <TouchableOpacity
                                            key={val}
                                            onPress={() => setFixedPrice(val)}
                                            style={{
                                                flex: 1,
                                                paddingVertical: 7,
                                                borderRadius: 8,
                                                backgroundColor: fixedPrice === val ? colors.primary + '18' : colors.surfaceContainer,
                                                borderWidth: 1,
                                                borderColor: fixedPrice === val ? colors.primary : colors.border,
                                                alignItems: 'center',
                                            }}
                                        >
                                            <Text style={{ fontSize: 11, fontWeight: '700', color: fixedPrice === val ? colors.primary : colors.textSecondary }}>
                                                {val} đ
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        ) : (
                            <View style={{ gap: 14 }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <View>
                                        <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text }}>Thời lượng làm việc</Text>
                                        <Text style={{ fontSize: 11, color: colors.textSecondary }}>Mặc định 1 giờ</Text>
                                    </View>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                        <TouchableOpacity
                                            onPress={() => setHours((prev) => Math.max(1, prev - 1))}
                                            style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceContainer, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }}
                                        >
                                            <Minus size={16} color={colors.text} />
                                        </TouchableOpacity>
                                        <Text style={{ fontSize: 16, fontWeight: '800', color: colors.primary, minWidth: 36, textAlign: 'center' }}>
                                            {hours}h
                                        </Text>
                                        <TouchableOpacity
                                            onPress={() => setHours((prev) => Math.min(12, prev + 1))}
                                            style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceContainer, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }}
                                        >
                                            <Plus size={16} color={colors.text} />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <View>
                                        <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text }}>Số lượng người làm</Text>
                                        <Text style={{ fontSize: 11, color: colors.textSecondary }}>Mặc định 1 người</Text>
                                    </View>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                        <TouchableOpacity
                                            onPress={() => setWorkersCount((prev) => Math.max(1, prev - 1))}
                                            style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceContainer, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }}
                                        >
                                            <Minus size={16} color={colors.text} />
                                        </TouchableOpacity>
                                        <Text style={{ fontSize: 16, fontWeight: '800', color: colors.primary, minWidth: 26, textAlign: 'center' }}>
                                            {workersCount}
                                        </Text>
                                        <TouchableOpacity
                                            onPress={() => setWorkersCount((prev) => Math.min(10, prev + 1))}
                                            style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceContainer, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }}
                                        >
                                            <Plus size={16} color={colors.text} />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                <View style={{ paddingTop: 10, borderTopWidth: 1, borderColor: colors.border }}>
                                    <Text style={{ fontSize: 12, fontWeight: '700', color: colors.text, marginBottom: 6 }}>
                                        Mức thù lao theo giờ (VNĐ / giờ / người)
                                    </Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 9, borderRadius: 12, backgroundColor: colors.surfaceContainerLow, borderWidth: 1, borderColor: colors.border, marginBottom: 8 }}>
                                        <TextInput
                                            value={hourlyWage}
                                            onChangeText={handleHourlyWageChange}
                                            keyboardType="numeric"
                                            placeholder="50.000"
                                            placeholderTextColor={colors.placeholder}
                                            style={{ flex: 1, fontSize: 16, fontWeight: '800', color: colors.primary }}
                                        />
                                        <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textSecondary }}>VNĐ / người / h</Text>
                                    </View>

                                    <View style={{ flexDirection: 'row', gap: 6 }}>
                                        {['40.000', '50.000', '60.000', '80.000'].map((val) => (
                                            <TouchableOpacity
                                                key={val}
                                                onPress={() => setHourlyWage(val)}
                                                style={{
                                                    flex: 1,
                                                    paddingVertical: 6,
                                                    borderRadius: 8,
                                                    backgroundColor: hourlyWage === val ? colors.primary + '18' : colors.surfaceContainer,
                                                    borderWidth: 1,
                                                    borderColor: hourlyWage === val ? colors.primary : colors.border,
                                                    alignItems: 'center',
                                                }}
                                            >
                                                <Text style={{ fontSize: 11, fontWeight: '700', color: hourlyWage === val ? colors.primary : colors.textSecondary }}>
                                                    {val} đ
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                            </View>
                        )}
                    </View>

                    {/* KHỐI 5: YÊU CẦU XE CỘ & GHI CHÚ */}
                    <View
                        style={[
                            {
                                padding: 16,
                                borderRadius: 20,
                                backgroundColor: colors.surface,
                                borderWidth: 1,
                                borderColor: isDark ? colors.border : '#ebdffa',
                                marginBottom: 16,
                            },
                            shadows.card,
                        ]}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                            <FileText size={16} color={colors.primary} />
                            <Text style={{ fontSize: 14, fontWeight: '800', color: colors.text }}>
                                Yêu cầu thêm & Ghi chú
                            </Text>
                        </View>

                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                            <View style={{ flex: 1, paddingRight: 8 }}>
                                <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text }}>Yêu cầu có xe máy đi lại</Text>
                                <Text style={{ fontSize: 11, color: colors.textSecondary }}>Hỗ trợ xăng xe di chuyển giữa các địa điểm</Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => setNeedMotorbike(!needMotorbike)}
                                style={{
                                    paddingHorizontal: 12,
                                    paddingVertical: 6,
                                    borderRadius: 12,
                                    backgroundColor: needMotorbike ? '#dcfce7' : colors.surfaceContainer,
                                    borderWidth: 1,
                                    borderColor: needMotorbike ? '#10b981' : colors.border,
                                }}
                            >
                                <Text style={{ fontSize: 11.5, fontWeight: '800', color: needMotorbike ? '#059669' : colors.textSecondary }}>
                                    {needMotorbike ? 'Đã bật (+20k)' : 'Không cần xe'}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <View style={{ paddingTop: 10, borderTopWidth: 1, borderColor: colors.border }}>
                            <Text style={{ fontSize: 12, fontWeight: '700', color: colors.text, marginBottom: 5 }}>
                                Ghi chú thêm cho người nhận việc:
                            </Text>
                            <TextInput
                                value={specialNotes}
                                onChangeText={setSpecialNotes}
                                placeholder="Ví dụ: Mang theo CCCD làm thủ tục, điện thoại có 4G..."
                                placeholderTextColor={colors.placeholder}
                                multiline
                                numberOfLines={2}
                                style={{
                                    backgroundColor: colors.surfaceContainerLow,
                                    borderRadius: 10,
                                    padding: 10,
                                    fontSize: 12,
                                    color: colors.text,
                                    minHeight: 55,
                                    textAlignVertical: 'top',
                                    borderWidth: 1,
                                    borderColor: colors.border,
                                }}
                            />
                        </View>
                    </View>

                    {/* KHỐI ƯU ĐÃI VOUCHER */}
                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => setIsVoucherModalOpen(true)}
                        style={[
                            {
                                padding: 14,
                                borderRadius: 18,
                                backgroundColor: selectedVoucher ? (isDark ? '#064e3b25' : '#ecfdf5') : colors.surface,
                                borderWidth: 1,
                                borderColor: selectedVoucher ? '#10b981' : (isDark ? colors.border : '#ebdffa'),
                                marginBottom: 16,
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                            },
                            shadows.card,
                        ]}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                            <View
                                style={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: 12,
                                    backgroundColor: selectedVoucher ? '#10b98120' : colors.primary + '15',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <Ticket size={20} color={selectedVoucher ? '#10b981' : colors.primary} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                    <Text style={{ fontSize: 14, fontWeight: '800', color: colors.text }}>
                                        {selectedVoucher ? `Mã: ${selectedVoucher.code}` : 'Mã giảm giá & Khuyến mãi'}
                                    </Text>
                                    {selectedVoucher && (
                                        <View style={{ backgroundColor: '#10b981', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                                            <Text style={{ fontSize: 10, fontWeight: '800', color: '#ffffff' }}>ĐÃ ÁP DỤNG</Text>
                                        </View>
                                    )}
                                </View>
                                <Text style={{ fontSize: 12, color: selectedVoucher ? '#059669' : colors.textSecondary, marginTop: 2 }} numberOfLines={1}>
                                    {selectedVoucher
                                        ? `${selectedVoucher.title} (Giảm ${voucherDiscount.toLocaleString('vi-VN')} đ)`
                                        : 'Chọn mã có sẵn hoặc nhập mã voucher'}
                                </Text>
                            </View>
                        </View>

                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            {selectedVoucher ? (
                                <TouchableOpacity
                                    onPress={(e) => {
                                        e.stopPropagation();
                                        handleRemoveVoucher();
                                    }}
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                    style={{ paddingHorizontal: 6, paddingVertical: 4 }}
                                >
                                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#ef4444' }}>Bỏ chọn</Text>
                                </TouchableOpacity>
                            ) : (
                                <Text style={{ fontSize: 13, fontWeight: '700', color: colors.primary }}>
                                    Chọn mã
                                </Text>
                            )}
                            <ChevronRight size={18} color={selectedVoucher ? '#10b981' : colors.textSecondary} />
                        </View>
                    </TouchableOpacity>

                    {/* KHỐI 6: TỔNG TIỀN & ĐĂNG VIỆC */}
                    <View
                        style={[
                            {
                                padding: 16,
                                borderRadius: 20,
                                backgroundColor: colors.surfaceContainerLow,
                                borderWidth: 1,
                                borderColor: isDark ? colors.border : '#eaddfb',
                                marginBottom: 16,
                            },
                            shadows.card,
                        ]}
                    >
                        <View style={{ marginBottom: 10 }}>
                            <Text style={{ fontSize: 12, color: colors.textSecondary, fontWeight: '600' }}>
                                Tổng thù lao ước tính
                            </Text>
                            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 10, marginTop: 3 }}>
                                <Text style={{ fontSize: 24, fontWeight: '900', color: colors.primary }}>
                                    {grandTotal.toLocaleString('vi-VN')} đ
                                </Text>
                                {selectedVoucher && voucherDiscount > 0 && (
                                    <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textSecondary, textDecorationLine: 'line-through' }}>
                                        {subtotal.toLocaleString('vi-VN')} đ
                                    </Text>
                                )}
                            </View>
                        </View>

                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingTop: 10, borderTopWidth: 1, borderColor: isDark ? colors.border : '#e9d5ff' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: colors.border, gap: 6 }}>
                                <Users size={13} color={colors.primary} />
                                <Text style={{ fontSize: 12, fontWeight: '700', color: colors.text }}>
                                    {pricingMode === 'fixed'
                                        ? `Khoán việc: ${baseWage.toLocaleString('vi-VN')} đ`
                                        : `Công giờ: ${baseWage.toLocaleString('vi-VN')} đ (${hours}h × ${workersCount} người)`}
                                </Text>
                            </View>

                            {needMotorbike && (
                                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: colors.border, gap: 6 }}>
                                    <Briefcase size={13} color="#059669" />
                                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#059669' }}>
                                        Xe máy: +{bikeAllowance.toLocaleString('vi-VN')} đ
                                    </Text>
                                </View>
                            )}

                            {selectedVoucher && voucherDiscount > 0 && (
                                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: isDark ? '#064e3b30' : '#dcfce7', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: '#10b981', gap: 6 }}>
                                    <Tag size={13} color="#10b981" />
                                    <Text style={{ fontSize: 12, fontWeight: '800', color: '#059669' }}>
                                        Mã {selectedVoucher.code}: -{voucherDiscount.toLocaleString('vi-VN')} đ
                                    </Text>
                                </View>
                            )}
                        </View>

                        <TouchableOpacity
                            activeOpacity={0.88}
                            onPress={handleSubmit}
                            style={{ borderRadius: 14, overflow: 'hidden', marginTop: 14 }}
                        >
                            <LinearGradient
                                colors={gradients.electric}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={{ paddingVertical: 14, alignItems: 'center', justifyContent: 'center' }}
                            >
                                <Text style={{ fontSize: 15, fontWeight: '800', color: '#ffffff' }}>
                                    Đăng việc linh hoạt ngay
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </ScrollView>

                <GlassBottomBar />
            </View>

            {/* MODAL BẢN ĐỒ GOONG */}
            <Modal
                visible={isMapPickerOpen}
                animationType="slide"
                transparent={false}
                onRequestClose={() => setIsMapPickerOpen(false)}
                statusBarTranslucent={false}
            >
                <View style={{ flex: 1, backgroundColor: colors.surface, paddingTop: insets.top }}>
                    <View style={{ height: 54, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderColor: colors.border, backgroundColor: colors.surface }}>
                        <TouchableOpacity
                            onPress={() => setIsMapPickerOpen(false)}
                            style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surfaceContainer, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <ArrowLeft size={20} color={colors.text} />
                        </TouchableOpacity>
                        <Text style={{ fontSize: 16, fontWeight: '800', color: colors.text }}>Chọn địa điểm làm việc</Text>
                        <View style={{ width: 40 }} />
                    </View>

                    <View style={{ padding: 12, backgroundColor: colors.surface, borderBottomWidth: 1, borderColor: colors.border }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceContainerLow, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 8, borderWidth: 1, borderColor: colors.border }}>
                            <Search size={16} color={colors.textSecondary} style={{ marginRight: 8 }} />
                            <TextInput
                                value={pickerSearchText}
                                onChangeText={handlePickerSearchText}
                                placeholder="Gõ tên đường, địa điểm để nhảy tới..."
                                placeholderTextColor={colors.placeholder}
                                style={{ flex: 1, fontSize: 13, color: colors.text }}
                            />
                            {pickerSearchText.length > 0 && (
                                <TouchableOpacity onPress={() => { setPickerSearchText(''); setPickerPredictions([]); }}>
                                    <X size={16} color={colors.textSecondary} />
                                </TouchableOpacity>
                            )}
                        </View>

                        {pickerPredictions.length > 0 && (
                            <View style={{ marginTop: 6, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' }}>
                                {pickerPredictions.slice(0, 3).map((item, i) => (
                                    <TouchableOpacity
                                        key={i}
                                        onPress={async () => {
                                            setPickerSearchText(item.description);
                                            setPickerPredictions([]);
                                            const detail = await GoongService.getPlaceDetail(item.placeId);
                                            if (detail && detail.latitude && detail.longitude) {
                                                flyToLocation(detail.latitude, detail.longitude);
                                            }
                                        }}
                                        style={{ padding: 10, borderBottomWidth: i < 2 ? 1 : 0, borderColor: colors.border }}
                                    >
                                        <Text style={{ fontSize: 12, color: colors.text }}>{item.description}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}

                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginTop: 8 }}>
                            {[
                                { name: 'Chợ Bến Thành', lat: 10.7725, lng: 106.6980 },
                                { name: 'Landmark 81', lat: 10.7950, lng: 106.7219 },
                                { name: 'Hồ Con Rùa', lat: 10.7827, lng: 106.6958 },
                                { name: 'Phố Đi Bộ', lat: 10.7738, lng: 106.7047 },
                            ].map((lm) => (
                                <TouchableOpacity
                                    key={lm.name}
                                    onPress={() => flyToLocation(lm.lat, lm.lng)}
                                    style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: colors.surfaceContainer, borderWidth: 1, borderColor: colors.border }}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                        <MapPin size={11} color={colors.primary} />
                                        <Text style={{ fontSize: 11, fontWeight: '600', color: colors.text }}>{lm.name}</Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    <View style={{ flex: 1, position: 'relative', backgroundColor: isDark ? '#0f172a' : '#f8fafc', overflow: 'hidden' }}>
                        <WebView
                            ref={webViewRef}
                            originWhitelist={['*']}
                            source={{ html: goongMapHtml }}
                            style={{ flex: 1, backgroundColor: 'transparent' }}
                            javaScriptEnabled={true}
                            domStorageEnabled={true}
                            scrollEnabled={false}
                            onMessage={(event) => {
                                try {
                                    const data = JSON.parse(event.nativeEvent.data);
                                    if (data.type === 'LOCATION_CHANGED') {
                                        setPickerCoords({ lat: data.lat, lng: data.lng });
                                        resolvePickerAddress(data.lat, data.lng);
                                    } else if (data.type === 'MAP_LOADED') {
                                        setIsMapLoading(false);
                                    }
                                } catch (e) {
                                    console.warn('WebView parse error:', e);
                                }
                            }}
                        />

                        {isMapLoading && (
                            <View style={{ position: 'absolute', top: 14, left: 14, flexDirection: 'row', alignItems: 'center', backgroundColor: isDark ? 'rgba(15,23,42,0.92)' : 'rgba(255,255,255,0.95)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1, borderColor: colors.border, gap: 6, zIndex: 10 }}>
                                <ActivityIndicator size="small" color={colors.primary} />
                                <Text style={{ fontSize: 10, fontWeight: '700', color: colors.text }}>Đang tải bản đồ...</Text>
                            </View>
                        )}

                        <TouchableOpacity
                            onPress={handleLocateOnMap}
                            style={{ position: 'absolute', bottom: 20, right: 16, width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', zIndex: 10, ...shadows.soft }}
                        >
                            <Crosshair size={22} color={colors.primary} />
                        </TouchableOpacity>

                        <View style={{ position: 'absolute', bottom: 76, right: 16, backgroundColor: isDark ? 'rgba(15,23,42,0.92)' : 'rgba(255,255,255,0.95)', borderRadius: 12, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', zIndex: 10, ...shadows.soft }}>
                            <TouchableOpacity onPress={zoomInMap} style={{ padding: 10, borderBottomWidth: 1, borderColor: colors.border }}>
                                <ZoomIn size={18} color={colors.text} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={zoomOutMap} style={{ padding: 10 }}>
                                <ZoomOut size={18} color={colors.text} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={{ padding: 16, paddingBottom: (insets.bottom > 0 ? insets.bottom : 12) + 8, backgroundColor: colors.surface, borderTopWidth: 1, borderColor: colors.border, ...shadows.floating }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                            <MapPin size={18} color={colors.primary} />
                            <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textSecondary }}>Địa chỉ tại vị trí ghim</Text>
                            {isPickerResolving && <ActivityIndicator size="small" color={colors.primary} />}
                        </View>
                        <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 12 }} numberOfLines={2}>
                            {pickerAddress || 'Đang xác định địa chỉ...'}
                        </Text>
                        <TouchableOpacity activeOpacity={0.88} onPress={handleConfirmMapPicker} style={{ borderRadius: 14, overflow: 'hidden' }}>
                            <LinearGradient colors={gradients.electric} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingVertical: 14, alignItems: 'center', justifyContent: 'center' }}>
                                <Text style={{ fontSize: 15, fontWeight: '800', color: '#ffffff' }}>Xác nhận vị trí này</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* MODAL VOUCHER */}
            <Modal
                visible={isVoucherModalOpen}
                animationType="slide"
                transparent={false}
                onRequestClose={() => setIsVoucherModalOpen(false)}
                statusBarTranslucent={false}
            >
                <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top }}>
                    <View style={{ height: 54, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderColor: colors.border, backgroundColor: colors.surface }}>
                        <TouchableOpacity
                            onPress={() => setIsVoucherModalOpen(false)}
                            style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surfaceContainer, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <ArrowLeft size={20} color={colors.text} />
                        </TouchableOpacity>
                        <Text style={{ fontSize: 16, fontWeight: '800', color: colors.text }}>Mã ưu đãi & Khuyến mãi</Text>
                        <View style={{ width: 40 }} />
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: (insets.bottom > 0 ? insets.bottom : 16) + 20 }}>
                        <View style={[{ padding: 14, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: isDark ? colors.border : '#ebdffa', marginBottom: 20 }, shadows.card]}>
                            <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: 8 }}>Nhập mã ưu đãi của bạn</Text>
                            <View style={{ flexDirection: 'row', gap: 8 }}>
                                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: colors.surfaceContainerLow, borderWidth: 1, borderColor: colors.border }}>
                                    <Tag size={16} color={colors.textSecondary} style={{ marginRight: 8 }} />
                                    <TextInput
                                        value={voucherInputCode}
                                        onChangeText={setVoucherInputCode}
                                        placeholder="Ví dụ: FLASH20K, LINHHOAT30K..."
                                        placeholderTextColor={colors.placeholder}
                                        autoCapitalize="characters"
                                        style={{ flex: 1, fontSize: 13, fontWeight: '700', color: colors.text }}
                                    />
                                    {voucherInputCode.length > 0 && (
                                        <TouchableOpacity onPress={() => setVoucherInputCode('')}>
                                            <X size={16} color={colors.textSecondary} />
                                        </TouchableOpacity>
                                    )}
                                </View>
                                <TouchableOpacity onPress={handleApplyVoucherCode} style={{ backgroundColor: colors.primary, paddingHorizontal: 18, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
                                    <Text style={{ fontSize: 13, fontWeight: '800', color: '#ffffff' }}>Áp dụng</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={{ marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Text style={{ fontSize: 14, fontWeight: '800', color: colors.text }}>Mã khuyến mãi dành cho bạn</Text>
                            <Text style={{ fontSize: 12, color: colors.textSecondary }}>{AVAILABLE_VOUCHERS.length} mã khả dụng</Text>
                        </View>

                        <View style={{ gap: 12 }}>
                            {AVAILABLE_VOUCHERS.map((v) => {
                                const isCurrentSelected = selectedVoucher?.code === v.code;
                                const isEligible = subtotal === 0 || subtotal >= v.minOrderValue;
                                return (
                                    <View
                                        key={v.code}
                                        style={[{ borderRadius: 16, backgroundColor: isCurrentSelected ? (isDark ? '#064e3b20' : '#f0fdf4') : colors.surface, borderWidth: 1.5, borderColor: isCurrentSelected ? '#10b981' : (isDark ? colors.border : '#ebdffa'), padding: 14, opacity: isEligible ? 1 : 0.65 }, shadows.card]}
                                    >
                                        <View style={{ flexDirection: 'row', gap: 12 }}>
                                            <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: isCurrentSelected ? '#10b98125' : (isDark ? colors.surfaceContainer : '#f3e8ff'), alignItems: 'center', justifyContent: 'center' }}>
                                                <Ticket size={22} color={isCurrentSelected ? '#10b981' : colors.primary} />
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                                    <View style={{ backgroundColor: colors.primary + '18', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                                                        <Text style={{ fontSize: 12, fontWeight: '800', color: colors.primary }}>{v.code}</Text>
                                                    </View>
                                                    {isCurrentSelected && (
                                                        <View style={{ backgroundColor: '#10b981', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                                                            <Text style={{ fontSize: 10, fontWeight: '800', color: '#ffffff' }}>ĐANG CHỌN</Text>
                                                        </View>
                                                    )}
                                                </View>
                                                <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 2 }}>{v.title}</Text>
                                                <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 6 }}>{v.description}</Text>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                                                    <Text style={{ fontSize: 11, color: colors.textSecondary }}>{v.expiryText}</Text>
                                                    {isCurrentSelected ? (
                                                        <TouchableOpacity onPress={handleRemoveVoucher} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: '#fee2e2', borderWidth: 1, borderColor: '#fca5a5' }}>
                                                            <Text style={{ fontSize: 11, fontWeight: '700', color: '#dc2626' }}>Bỏ chọn</Text>
                                                        </TouchableOpacity>
                                                    ) : isEligible ? (
                                                        <TouchableOpacity onPress={() => handleSelectVoucherItem(v)} style={{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8, backgroundColor: colors.primary }}>
                                                            <Text style={{ fontSize: 11, fontWeight: '800', color: '#ffffff' }}>Dùng ngay</Text>
                                                        </TouchableOpacity>
                                                    ) : (
                                                        <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: colors.surfaceContainer }}>
                                                            <Text style={{ fontSize: 10, fontWeight: '600', color: colors.textSecondary }}>Đơn từ {v.minOrderValue.toLocaleString('vi-VN')} đ</Text>
                                                        </View>
                                                    )}
                                                </View>
                                                {!isEligible && subtotal > 0 && (
                                                    <Text style={{ fontSize: 11, color: '#f59e0b', marginTop: 6, fontWeight: '600' }}>
                                                        Cần thêm {(v.minOrderValue - subtotal).toLocaleString('vi-VN')} đ để dùng mã này
                                                    </Text>
                                                )}
                                            </View>
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    </ScrollView>

                    <View style={{ padding: 16, paddingBottom: (insets.bottom > 0 ? insets.bottom : 12) + 8, backgroundColor: colors.surface, borderTopWidth: 1, borderColor: colors.border }}>
                        <TouchableOpacity
                            onPress={() => setIsVoucherModalOpen(false)}
                            style={{ paddingVertical: 12, borderRadius: 12, backgroundColor: colors.surfaceContainer, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border }}
                        >
                            <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>
                                {selectedVoucher ? 'Hoàn tất & Áp dụng' : 'Đóng'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}
