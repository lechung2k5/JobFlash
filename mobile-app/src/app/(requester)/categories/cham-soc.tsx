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
    HeartHandshake,
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
    ShieldCheck,
    UserCheck,
    Stethoscope,
    AlertTriangle,
    AlertCircle,
    Zap,
} from 'lucide-react-native';
import { GoongService, GoongPlacePrediction, GOONG_MAPTILES_KEY } from '../../../services/goongService';
import { useAppTheme } from '../../../constants/theme';
import { useI18n } from '../../../i18n';
import GlassBottomBar from '../../../components/GlassBottomBar';

const CATE_ICON = require('../../../../assets/icon-cate/cham-soc.png');

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
        code: 'CHAMSOC30K',
        title: 'Trợ giá chăm sóc 30.000đ',
        description: 'Áp dụng cho đơn thuê chăm sóc từ 200.000đ',
        discountType: 'fixed',
        discountValue: 30000,
        minOrderValue: 200000,
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
        title: 'Giảm 50.000đ ca dài',
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

// 4 Đối tượng chăm sóc (Ngắn gọn)
export const RECIPIENT_TYPES = [
    { id: 'elderly', label: 'Người cao tuổi' },
    { id: 'patient', label: 'Bệnh nhân' },
    { id: 'child', label: 'Trẻ nhỏ' },
    { id: 'pet', label: 'Thú cưng' },
];

// 3 Tình trạng sinh hoạt
export const MOBILITY_STATUSES = [
    { id: 'independent', label: 'Tự đi lại được' },
    { id: 'assisted', label: 'Cần hỗ trợ dìu đi' },
    { id: 'bedridden', label: 'Nằm tại chỗ' },
];

// Ưu tiên giới tính người chăm sóc (Mục 1 FormChamSoc.md)
export const GENDER_OPTIONS = [
    { id: 'male', label: 'Nam' },
    { id: 'female', label: 'Nữ' },
    { id: 'any', label: 'Bất kỳ' },
];

export interface CareTaskItem {
    id: string;
    label: string;
    targetTypes: Array<'elderly' | 'patient' | 'child' | 'pet'>;
}

// Đầu việc chăm sóc lọc động theo đối tượng (Mục 2 FormChamSoc.md)
export const ALL_CARE_TASKS: CareTaskItem[] = [
    // Người cao tuổi & Bệnh nhân
    { id: 'feed_med', label: 'Hỗ trợ ăn uống, uống thuốc đúng giờ', targetTypes: ['elderly', 'patient'] },
    { id: 'hygiene', label: 'Vệ sinh cá nhân, tắm gội, thay bỉm', targetTypes: ['elderly', 'patient'] },
    { id: 'walk_talk', label: 'Trò chuyện, tâm sự, dìu đi dạo nhẹ', targetTypes: ['elderly', 'patient'] },
    { id: 'vital_signs', label: 'Đo huyết áp, đo đường huyết & theo dõi sinh hiệu', targetTypes: ['elderly', 'patient'] },
    { id: 'cook_meal', label: 'Nấu cháo súp, thức ăn dinh dưỡng', targetTypes: ['elderly', 'patient'] },
    { id: 'rehab_assist', label: 'Hỗ trợ tập phục hồi chức năng, xoa bóp nhẹ', targetTypes: ['elderly', 'patient'] },

    // Trẻ nhỏ
    { id: 'child_supervision', label: 'Trông giữ, theo dõi & bảo đảm an toàn cho bé', targetTypes: ['child'] },
    { id: 'child_feeding', label: 'Pha sữa, cho bé ăn uống, dỗ ăn', targetTypes: ['child'] },
    { id: 'child_hygiene', label: 'Tắm bé, thay tã bỉm, vệ sinh cho bé', targetTypes: ['child'] },
    { id: 'child_play', label: 'Chơi cùng bé, đọc truyện, kể chuyện', targetTypes: ['child'] },
    { id: 'child_sleep', label: 'Dỗ bé ngủ trưa / ngủ tối đúng giờ', targetTypes: ['child'] },
    { id: 'child_cook', label: 'Nấu cháo, đồ ăn dặm dinh dưỡng cho bé', targetTypes: ['child'] },

    // Thú cưng
    { id: 'pet_feeding', label: 'Cho thú cưng ăn, uống nước theo khẩu phần', targetTypes: ['pet'] },
    { id: 'pet_walk', label: 'Dắt chó đi dạo, cho vận động ngoài trời', targetTypes: ['pet'] },
    { id: 'pet_litter', label: 'Dọn khay vệ sinh, dọn chuồng, thay cát', targetTypes: ['pet'] },
    { id: 'pet_bath', label: 'Tắm rửa, sấy lông, vệ sinh tai móng cơ bản', targetTypes: ['pet'] },
    { id: 'pet_medication', label: 'Cho uống thuốc / bôi thuốc theo đơn', targetTypes: ['pet'] },
];

export const CARE_TASKS = ALL_CARE_TASKS;

export default function ChamSocJobScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { colors, gradients, shadows, isDark } = useAppTheme();
    const { t } = useI18n();

    // 1. Địa điểm làm việc
    const [address, setAddress] = useState('');
    const [coords, setCoords] = useState<Coords | null>(null);
    const [addressPredictions, setAddressPredictions] = useState<GoongPlacePrediction[]>([]);
    const [isSearchingAddress, setIsSearchingAddress] = useState(false);
    const [isLocatingAddress, setIsLocatingAddress] = useState(false);
    const [houseDetail, setHouseDetail] = useState('');

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

    // 2. Đối tượng, Tình trạng sinh hoạt & Giới tính ưu tiên (Mục 1 FormChamSoc.md)
    const [selectedRecipient, setSelectedRecipient] = useState('elderly');
    const [selectedMobility, setSelectedMobility] = useState('assisted');
    const [preferredGender, setPreferredGender] = useState<'male' | 'female' | 'any'>('any');

    // Tình trạng sinh hoạt chỉ áp dụng cho Người cao tuổi và Bệnh nhân (ẩn khi chọn Trẻ nhỏ hoặc Thú cưng)
    const isMobilityApplicable = selectedRecipient === 'elderly' || selectedRecipient === 'patient';

    // 3. Danh mục đầu việc lọc động theo đối tượng (Mục 2 FormChamSoc.md)
    const filteredTasks = useMemo(() => {
        return ALL_CARE_TASKS.filter((task) => task.targetTypes.includes(selectedRecipient as any));
    }, [selectedRecipient]);

    const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
    const [customConditionDetail, setCustomConditionDetail] = useState('');

    // Tự động đồng bộ checklist khi đổi nhóm đối tượng chăm sóc
    useEffect(() => {
        const validTaskIds = filteredTasks.map((t) => t.id);
        const existing = selectedTasks.filter((id) => validTaskIds.includes(id));
        setSelectedTasks(existing);
    }, [selectedRecipient]);

    const toggleTask = (taskId: string) => {
        setSelectedTasks((prev) =>
            prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
        );
    };

    // 4. Hình thức thuê & Mức thù lao (MẶC ĐỊNH THỜI LƯỢNG VÀ SỐ LƯỢNG LÀ 1)
    const [pricingMode, setPricingMode] = useState<'hourly' | 'fixed'>('hourly');
    const [hours, setHours] = useState(1);
    const [workersCount, setWorkersCount] = useState(1);
    const [hourlyWage, setHourlyWage] = useState('70.000');
    const [fixedPrice, setFixedPrice] = useState('300.000');

    // 5. Yêu cầu chuyên môn y tế & Ghi chú
    const [needNursingSkill, setNeedNursingSkill] = useState(false);
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

    // THUẬT TOÁN GỢI Ý MỨC TIỀN HỢP LÝ THEO ĐỐI TƯỢNG VÀ TÌNH TRẠNG VẬN ĐỘNG
    const suggestedRecommendation = useMemo(() => {
        let baseWagePerHour = 70000;
        if (selectedRecipient === 'patient') baseWagePerHour = 85000;
        else if (selectedRecipient === 'elderly') baseWagePerHour = 75000;
        else if (selectedRecipient === 'child') baseWagePerHour = 65000;
        else if (selectedRecipient === 'pet') baseWagePerHour = 50000;

        // Chỉ cộng phụ cấp tình trạng sinh hoạt đối với Người cao tuổi & Bệnh nhân
        if (isMobilityApplicable) {
            if (selectedMobility === 'bedridden') baseWagePerHour += 15000;
            else if (selectedMobility === 'assisted') baseWagePerHour += 5000;
        }

        let recH = 4;
        if (selectedRecipient === 'pet') recH = 2;
        const recHourlyWageFormatted = baseWagePerHour.toLocaleString('vi-VN');
        const recHourlyTotal = recH * baseWagePerHour * workersCount;
        const recFixed = Math.round(recHourlyTotal / 10000) * 10000;

        return {
            hours: recH,
            hourlyWage: baseWagePerHour,
            hourlyWageFormatted: recHourlyWageFormatted,
            hourlyTotalFormatted: recHourlyTotal.toLocaleString('vi-VN'),
            fixedPrice: recFixed,
            fixedPriceFormatted: recFixed.toLocaleString('vi-VN'),
        };
    }, [selectedRecipient, selectedMobility, isMobilityApplicable, selectedTasks, workersCount]);

    // Các chip gợi ý thù lao theo giờ tự động cập nhật
    const dynamicHourlyChips = useMemo(() => {
        const center = suggestedRecommendation.hourlyWage;
        const c1 = Math.max(40000, center - 15000);
        const c2 = center;
        const c3 = center + 15000;
        const c4 = center + 30000;
        return [c1, c2, c3, c4].map((v) => v.toLocaleString('vi-VN'));
    }, [suggestedRecommendation.hourlyWage]);

    // Các chip giá khoán gợi ý linh hoạt
    const dynamicFixedChips = useMemo(() => {
        const center = suggestedRecommendation.fixedPrice;
        const c1 = Math.max(150000, center - 60000);
        const c2 = center;
        const c3 = center + 60000;
        const c4 = center + 120000;
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
    const nursingAllowance = needNursingSkill ? 50000 * workersCount : 0;

    const baseWage =
        pricingMode === 'hourly'
            ? Math.round(hours * workersCount * parsedHourlyWage)
            : parsedFixedPrice * workersCount;

    const subtotal = baseWage + nursingAllowance;
    const voucherDiscount = selectedVoucher ? calculateVoucherDiscount(selectedVoucher, subtotal) : 0;
    const grandTotal = Math.max(0, subtotal - voucherDiscount);

    // Kiểm tra xem đã điền đầy đủ các mục cần nhập và chọn hay chưa
    const isFormComplete = useMemo(() => {
        if (!address.trim()) return false;
        if (selectedTasks.length === 0 && !customConditionDetail.trim() && !specialNotes.trim()) return false;
        if (pricingMode === 'hourly' && parsedHourlyWage <= 0) return false;
        if (pricingMode === 'fixed' && parsedFixedPrice <= 0) return false;
        return true;
    }, [address, selectedTasks, customConditionDetail, specialNotes, pricingMode, parsedHourlyWage, parsedFixedPrice]);

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

    // Đăng việc chăm sóc
    const handleSubmit = () => {
        if (!address.trim()) {
            Alert.alert(t('common.error'), 'Vui lòng nhập hoặc chọn địa chỉ nơi cần chăm sóc.');
            return;
        }
        if (selectedTasks.length === 0 && !customConditionDetail.trim() && !specialNotes.trim()) {
            Alert.alert(t('common.error'), 'Vui lòng chọn ít nhất 1 đầu việc hoặc viết ghi chú mô tả công việc.');
            return;
        }
        if (pricingMode === 'hourly' && parsedHourlyWage <= 0) {
            Alert.alert(t('common.error'), 'Vui lòng nhập mức thù lao/giờ cho người chăm sóc.');
            return;
        }
        if (pricingMode === 'fixed' && parsedFixedPrice <= 0) {
            Alert.alert(t('common.error'), 'Vui lòng nhập mức thù lao thuê trọn gói.');
            return;
        }

        const recObj = RECIPIENT_TYPES.find((r) => r.id === selectedRecipient);
        const mobObj = MOBILITY_STATUSES.find((m) => m.id === selectedMobility);
        const genderObj = GENDER_OPTIONS.find((g) => g.id === preferredGender);

        const pricingSummary =
            pricingMode === 'hourly'
                ? `${hours}h × ${workersCount} người (${parsedHourlyWage.toLocaleString('vi-VN')} đ/h)`
                : `Thuê trọn gói (${parsedFixedPrice.toLocaleString('vi-VN')} đ × ${workersCount} người)`;

        const summaryLines = [
            `Địa điểm: ${address}${houseDetail ? ` (${houseDetail})` : ''}`,
            `Đối tượng: ${recObj?.label}${isMobilityApplicable ? ` - ${mobObj?.label}` : ''}`,
            `Ưu tiên giới tính: ${genderObj?.label || 'Bất kỳ'}`,
            `Hình thức: ${pricingSummary}`,
            `Thời gian: Nhận việc & có mặt ngay (trong 30 - 60 phút)`,
            `Chuyên môn: ${needNursingSkill ? 'Cần nghiệp vụ điều dưỡng (+50.000đ)' : 'Chăm sóc cơ bản (không cần bằng cấp)'}`,
            `Số đầu việc: ${selectedTasks.length} việc`,
            selectedVoucher && voucherDiscount > 0 ? `Ưu đãi (${selectedVoucher.code}): -${voucherDiscount.toLocaleString('vi-VN')} đ` : null,
            customConditionDetail.trim() ? `Lưu ý sinh hoạt/bệnh lý: ${customConditionDetail.trim()}` : null,
            specialNotes.trim() ? `Ghi chú: ${specialNotes.trim()}` : null,
        ].filter(Boolean).join('\n• ');

        Alert.alert(
            'Xác nhận đăng việc Chăm sóc',
            `Tổng chi phí thù lao ước tính: ${grandTotal.toLocaleString('vi-VN')} đ\n\n• ${summaryLines}`,
            [
                { text: 'Chỉnh sửa', style: 'cancel' },
                {
                    text: 'Tìm người chăm sóc ngay',
                    onPress: () => {
                        Alert.alert('Thành công', 'Yêu cầu của bạn đã được kết nối tới người chăm sóc tận tâm gần nhất!');
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
                        borderColor: isDark ? colors.border : '#e2e8f0',
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
                            Thuê Người Chăm Sóc
                        </Text>
                    </View>

                    <View style={{ width: 40 }} />
                </View>

                <ScrollView
                    contentContainerStyle={{ padding: 16, paddingBottom: 110 }}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* KHỐI 1: ĐỊA ĐIỂM CHĂM SÓC */}
                    <View
                        style={[
                            {
                                padding: 16,
                                borderRadius: 20,
                                backgroundColor: colors.surface,
                                borderWidth: 1,
                                borderColor: isDark ? colors.border : '#e2e8f0',
                                marginBottom: 16,
                            },
                            shadows.card,
                        ]}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                            <MapPin size={16} color={colors.primary} />
                            <Text style={{ fontSize: 14, fontWeight: '800', color: colors.text }}>
                                Địa điểm nơi cần chăm sóc
                            </Text>
                        </View>

                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                paddingHorizontal: 12,
                                paddingVertical: 10,
                                borderRadius: 12,
                                backgroundColor: colors.surfaceContainerLow,
                                borderWidth: 1,
                                borderColor: isDark ? colors.border : '#e2e8f0',
                                marginBottom: 8,
                            }}
                        >
                            <TextInput
                                value={address}
                                onChangeText={handleSearchLocation}
                                placeholder="Nhập địa chỉ nhà riêng, bệnh viện, viện dưỡng lão..."
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
                                    backgroundColor: isDark ? colors.surfaceContainer : '#eff6ff',
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
                                Số phòng, số khoa hoặc chỉ dẫn đường vào
                            </Text>
                            <TextInput
                                value={houseDetail}
                                onChangeText={setHouseDetail}
                                placeholder="Ví dụ: Khoa Ngoại Lầu 3 - Giường 12, Căn 204..."
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

                    {/* THÔNG BÁO THỜI GIAN LÀM VIỆC NỔI BẬT: NGAY BÂY GIỜ */}
                    <View
                        style={[
                            {
                                flexDirection: 'row',
                                alignItems: 'center',
                                padding: 14,
                                borderRadius: 16,
                                backgroundColor: isDark ? colors.surfaceContainer : '#eff6ff',
                                borderWidth: 1.5,
                                borderColor: isDark ? '#3b82f6' : '#bfdbfe',
                                marginBottom: 16,
                                gap: 12,
                            },
                            shadows.card,
                        ]}
                    >
                        <View
                            style={{
                                width: 40,
                                height: 40,
                                borderRadius: 12,
                                backgroundColor: colors.primary,
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <Zap size={20} color="#ffffff" fill="#ffffff" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <Text style={{ fontSize: 14, fontWeight: '900', color: colors.primary }}>
                                    Thời gian làm việc: Ngay bây giờ
                                </Text>
                                <View
                                    style={{
                                        backgroundColor: '#dcfce7',
                                        paddingHorizontal: 6,
                                        paddingVertical: 2,
                                        borderRadius: 6,
                                    }}
                                >
                                    <Text style={{ fontSize: 10, fontWeight: '800', color: '#16a34a' }}>HỎA TỐC</Text>
                                </View>
                            </View>
                            <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                                Tìm nhân sự chăm sóc đến ngay lập tức • Có mặt trong 30 - 60 phút
                            </Text>
                        </View>
                    </View>

                    {/* KHỐI 2: ĐỐI TƯỢNG & TÌNH TRẠNG SINH HOẠT */}
                    <View
                        style={[
                            {
                                padding: 16,
                                borderRadius: 20,
                                backgroundColor: colors.surface,
                                borderWidth: 1,
                                borderColor: isDark ? colors.border : '#e2e8f0',
                                marginBottom: 16,
                            },
                            shadows.card,
                        ]}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                            <HeartHandshake size={16} color={colors.primary} />
                            <Text style={{ fontSize: 14, fontWeight: '800', color: colors.text }}>
                                Đối tượng chăm sóc
                            </Text>
                        </View>

                        {/* 4 Nhóm đối tượng */}
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: isMobilityApplicable ? 12 : 4 }}>
                            {RECIPIENT_TYPES.map((rec) => {
                                const isSelected = selectedRecipient === rec.id;
                                return (
                                    <TouchableOpacity
                                        key={rec.id}
                                        onPress={() => setSelectedRecipient(rec.id)}
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
                                            {rec.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        {/* Tình trạng sinh hoạt (Chỉ hiển thị cho Người cao tuổi & Bệnh nhân, tắt khi chọn Trẻ nhỏ hoặc Thú cưng) */}
                        {isMobilityApplicable && (
                            <>
                                <Text style={{ fontSize: 12, fontWeight: '700', color: colors.text, marginBottom: 6 }}>
                                    Tình trạng sinh hoạt
                                </Text>
                                <View style={{ flexDirection: 'row', gap: 6 }}>
                                    {MOBILITY_STATUSES.map((m) => {
                                        const isSelected = selectedMobility === m.id;
                                        return (
                                            <TouchableOpacity
                                                key={m.id}
                                                onPress={() => setSelectedMobility(m.id)}
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
                                                <Text style={{ fontSize: 12, fontWeight: '800', color: isSelected ? colors.primary : colors.text, textAlign: 'center' }}>
                                                    {m.label}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </>
                        )}

                        {/* Ưu tiên giới tính người chăm sóc (Mục 1 FormChamSoc.md) */}
                        <Text style={{ fontSize: 12, fontWeight: '700', color: colors.text, marginTop: isMobilityApplicable ? 12 : 8, marginBottom: 6 }}>
                            Ưu tiên giới tính người chăm sóc
                        </Text>
                        <View style={{ flexDirection: 'row', gap: 6 }}>
                            {GENDER_OPTIONS.map((g) => {
                                const isSelected = preferredGender === g.id;
                                return (
                                    <TouchableOpacity
                                        key={g.id}
                                        onPress={() => setPreferredGender(g.id as any)}
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
                                        <Text style={{ fontSize: 12.5, fontWeight: '800', color: isSelected ? colors.primary : colors.text, textAlign: 'center' }}>
                                            {g.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    {/* KHỐI 3: DANH MỤC ĐẦU VIỆC CHĂM SÓC (LỌC ĐỘNG THEO ĐỐI TƯỢNG) */}
                    <View
                        style={[
                            {
                                padding: 16,
                                borderRadius: 20,
                                backgroundColor: colors.surface,
                                borderWidth: 1,
                                borderColor: isDark ? colors.border : '#e2e8f0',
                                marginBottom: 16,
                            },
                            shadows.card,
                        ]}
                    >
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                            <Text style={{ fontSize: 14, fontWeight: '800', color: colors.text }}>
                                Đầu việc cần hỗ trợ ({selectedTasks.length})
                            </Text>
                            <TouchableOpacity
                                onPress={() => {
                                    if (selectedTasks.length === filteredTasks.length) setSelectedTasks([]);
                                    else setSelectedTasks(filteredTasks.map((t) => t.id));
                                }}
                            >
                                <Text style={{ fontSize: 11, fontWeight: '700', color: colors.primary }}>
                                    {selectedTasks.length === filteredTasks.length ? 'Bỏ chọn hết' : 'Chọn tất cả'}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <View style={{ gap: 7, marginTop: 4 }}>
                            {filteredTasks.map((item) => {
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
                                {selectedRecipient === 'child'
                                    ? 'Lưu ý tính cách / thói quen của bé:'
                                    : selectedRecipient === 'pet'
                                    ? 'Lưu ý thói quen / tập tính thú cưng:'
                                    : 'Lưu ý thói quen sinh hoạt / bệnh lý nền:'}
                            </Text>
                            <TextInput
                                value={customConditionDetail}
                                onChangeText={setCustomConditionDetail}
                                placeholder={
                                    selectedRecipient === 'child'
                                        ? 'Ví dụ: Bé hiếu động, dị ứng sữa hạt, hay quấy khóc khi ngủ...'
                                        : selectedRecipient === 'pet'
                                        ? 'Ví dụ: Cún nhát người lạ, cần rọ mõm khi ra ngoài, không ăn đồ ngọt...'
                                        : 'Ví dụ: Ăn nhạt kiêng đường, có bệnh lý cao huyết áp, cần cẩn thận khi dìu đi...'
                                }
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
                                borderColor: isDark ? colors.border : '#e2e8f0',
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

                        {/* 2 Tab: Theo giờ vs Thuê trọn gói */}
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
                                    Thuê trọn gói
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
                                        Gợi ý theo đối tượng:
                                    </Text>
                                </View>
                                <Text style={{ fontSize: 13, fontWeight: '800', color: colors.text, marginTop: 2 }}>
                                    {pricingMode === 'hourly'
                                        ? `Nên thuê ${suggestedRecommendation.hours}h (${suggestedRecommendation.hourlyWageFormatted} đ/h ~${suggestedRecommendation.hourlyTotalFormatted} đ)`
                                        : `Khoán khoảng ${suggestedRecommendation.fixedPriceFormatted} đ`}
                                </Text>
                            </View>

                            <TouchableOpacity
                                onPress={handleApplySuggestedPrice}
                                style={{ backgroundColor: '#10b981', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}
                            >
                                <Text style={{ fontSize: 11, fontWeight: '800', color: '#ffffff' }}>Áp dụng</Text>
                            </TouchableOpacity>
                        </View>

                        {pricingMode === 'hourly' ? (
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
                                            onPress={() => setHours((prev) => Math.min(24, prev + 1))}
                                            style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceContainer, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }}
                                        >
                                            <Plus size={16} color={colors.text} />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <View>
                                        <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text }}>Số lượng người chăm sóc</Text>
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
                                            onPress={() => setWorkersCount((prev) => Math.min(5, prev + 1))}
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
                                            placeholder="70.000"
                                            placeholderTextColor={colors.placeholder}
                                            style={{ flex: 1, fontSize: 16, fontWeight: '800', color: colors.primary }}
                                        />
                                        <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textSecondary }}>VNĐ / người / h</Text>
                                    </View>

                                    <View style={{ flexDirection: 'row', gap: 6 }}>
                                        {dynamicHourlyChips.map((val) => (
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
                        ) : (
                            <View style={{ gap: 10 }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <View>
                                        <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text }}>Số lượng người chăm sóc</Text>
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
                                            onPress={() => setWorkersCount((prev) => Math.min(5, prev + 1))}
                                            style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceContainer, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }}
                                        >
                                            <Plus size={16} color={colors.text} />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                <Text style={{ fontSize: 12, fontWeight: '700', color: colors.text, marginTop: 4 }}>
                                    Thù lao thuê trọn gói (VNĐ / người):
                                </Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, backgroundColor: colors.surfaceContainerLow, borderWidth: 1, borderColor: colors.border }}>
                                    <TextInput
                                        value={fixedPrice}
                                        onChangeText={handleFixedPriceChange}
                                        keyboardType="numeric"
                                        placeholder="300.000"
                                        placeholderTextColor={colors.placeholder}
                                        style={{ flex: 1, fontSize: 18, fontWeight: '900', color: colors.primary }}
                                    />
                                    <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textSecondary }}>VNĐ / người</Text>
                                </View>

                                {/* Các chip giá khoán gợi ý linh hoạt */}
                                <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
                                    {dynamicFixedChips.map((val, idx) => (
                                        <TouchableOpacity
                                            key={`${val}-${idx}`}
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
                        )}
                    </View>

                    {/* KHỐI 5: KỸ NĂNG ĐIỀU DƯỠNG & GHI CHÚ */}
                    <View
                        style={[
                            {
                                padding: 16,
                                borderRadius: 20,
                                backgroundColor: colors.surface,
                                borderWidth: 1,
                                borderColor: isDark ? colors.border : '#e2e8f0',
                                marginBottom: 16,
                            },
                            shadows.card,
                        ]}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                            <Stethoscope size={16} color={colors.primary} />
                            <Text style={{ fontSize: 14, fontWeight: '800', color: colors.text }}>
                                Chuyên môn y tế & Kỹ năng
                            </Text>
                        </View>

                        {/* 2 Lựa chọn Chuyên môn y tế theo mục 3 FormChamSoc.md */}
                        <View style={{ gap: 8, marginBottom: 12 }}>
                            <TouchableOpacity
                                onPress={() => setNeedNursingSkill(false)}
                                activeOpacity={0.75}
                                style={{
                                    paddingVertical: 10,
                                    paddingHorizontal: 12,
                                    borderRadius: 12,
                                    borderWidth: 1.5,
                                    borderColor: !needNursingSkill ? colors.primary : colors.border,
                                    backgroundColor: !needNursingSkill ? colors.primary + '12' : colors.surfaceContainerLow,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                }}
                            >
                                <View style={{ flex: 1, marginRight: 8 }}>
                                    <Text style={{ fontSize: 13, fontWeight: !needNursingSkill ? '800' : '600', color: !needNursingSkill ? colors.primary : colors.text }}>
                                        Chăm sóc cơ bản (Không cần bằng cấp y tế)
                                    </Text>
                                    <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>
                                        Hỗ trợ ăn uống, trò chuyện, vệ sinh cá nhân, dìu đi dạo
                                    </Text>
                                </View>
                                <View
                                    style={{
                                        width: 20,
                                        height: 20,
                                        borderRadius: 10,
                                        borderWidth: 2,
                                        borderColor: !needNursingSkill ? colors.primary : colors.border,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    {!needNursingSkill && (
                                        <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary }} />
                                    )}
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => setNeedNursingSkill(true)}
                                activeOpacity={0.75}
                                style={{
                                    paddingVertical: 10,
                                    paddingHorizontal: 12,
                                    borderRadius: 12,
                                    borderWidth: 1.5,
                                    borderColor: needNursingSkill ? colors.primary : colors.border,
                                    backgroundColor: needNursingSkill ? colors.primary + '12' : colors.surfaceContainerLow,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                }}
                            >
                                <View style={{ flex: 1, marginRight: 8 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                        <Text style={{ fontSize: 13, fontWeight: needNursingSkill ? '800' : '600', color: needNursingSkill ? colors.primary : colors.text }}>
                                            Cần nghiệp vụ điều dưỡng (Tiêm, truyền, thay băng...)
                                        </Text>
                                    </View>
                                    <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>
                                        Thực hiện thủ thuật y tế theo y lệnh (+50.000đ/người)
                                    </Text>
                                </View>
                                <View
                                    style={{
                                        width: 20,
                                        height: 20,
                                        borderRadius: 10,
                                        borderWidth: 2,
                                        borderColor: needNursingSkill ? colors.primary : colors.border,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    {needNursingSkill && (
                                        <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary }} />
                                    )}
                                </View>
                            </TouchableOpacity>
                        </View>

                        {/* Cảnh báo chuyên môn y tế khi chọn Cần nghiệp vụ điều dưỡng */}
                        {needNursingSkill && (
                            <View
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    backgroundColor: isDark ? '#451a0335' : '#fffbeb',
                                    borderWidth: 1,
                                    borderColor: '#f59e0b',
                                    borderRadius: 10,
                                    paddingHorizontal: 10,
                                    paddingVertical: 8,
                                    marginBottom: 10,
                                    gap: 8,
                                }}
                            >
                                <AlertTriangle size={15} color="#d97706" />
                                <Text style={{ fontSize: 11.5, color: '#b45309', fontWeight: '600', flex: 1, lineHeight: 16 }}>
                                    Hệ thống sẽ ưu tiên ghép nối bạn với các đối tác có chứng chỉ/bằng cấp y tế. Chi phí thù lao có thể cao hơn mức bình thường.
                                </Text>
                            </View>
                        )}

                        <View style={{ paddingTop: 10, borderTopWidth: 1, borderColor: colors.border }}>
                            <Text style={{ fontSize: 12, fontWeight: '700', color: colors.text, marginBottom: 5 }}>
                                Ghi chú thêm cho người chăm sóc:
                            </Text>
                            <TextInput
                                value={specialNotes}
                                onChangeText={setSpecialNotes}
                                placeholder="Ví dụ: Cần người vui vẻ kiên nhẫn, mang theo máy đo huyết áp..."
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
                                borderColor: selectedVoucher ? '#10b981' : (isDark ? colors.border : '#e2e8f0'),
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
                        <View style={{ marginBottom: isFormComplete ? 10 : 0 }}>
                            <Text style={{ fontSize: 12, color: colors.textSecondary, fontWeight: '600' }}>
                                {isFormComplete ? 'Tổng thù lao chăm sóc dự kiến' : 'Vui lòng hoàn tất thông tin'}
                            </Text>
                            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 10, marginTop: 3 }}>
                                <Text style={{ fontSize: isFormComplete ? 24 : 18, fontWeight: '900', color: isFormComplete ? colors.primary : colors.textSecondary }}>
                                    {isFormComplete ? `${grandTotal.toLocaleString('vi-VN')} đ` : 'Chờ điền đủ thông tin'}
                                </Text>
                                {isFormComplete && selectedVoucher && voucherDiscount > 0 && (
                                    <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textSecondary, textDecorationLine: 'line-through' }}>
                                        {subtotal.toLocaleString('vi-VN')} đ
                                    </Text>
                                )}
                            </View>
                        </View>

                        {isFormComplete ? (
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingTop: 10, borderTopWidth: 1, borderColor: isDark ? colors.border : '#e9d5ff' }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: colors.border, gap: 6 }}>
                                    <HeartHandshake size={13} color={colors.primary} />
                                    <Text style={{ fontSize: 12, fontWeight: '700', color: colors.text }}>
                                        {pricingMode === 'fixed'
                                            ? `Khoán việc: ${baseWage.toLocaleString('vi-VN')} đ`
                                            : `Công giờ: ${baseWage.toLocaleString('vi-VN')} đ (${hours}h × ${workersCount} người)`}
                                    </Text>
                                </View>

                                {needNursingSkill && (
                                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: colors.border, gap: 6 }}>
                                        <Stethoscope size={13} color="#059669" />
                                        <Text style={{ fontSize: 12, fontWeight: '700', color: '#059669' }}>
                                            Điều dưỡng: +{nursingAllowance.toLocaleString('vi-VN')} đ
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
                        ) : (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: 10, borderTopWidth: 1, borderColor: isDark ? colors.border : '#e9d5ff' }}>
                                <AlertCircle size={14} color={colors.textSecondary} />
                                <Text style={{ fontSize: 12, color: colors.textSecondary, flex: 1 }}>
                                    Vui lòng nhập địa chỉ và chọn đầu việc để tính giá
                                </Text>
                            </View>
                        )}

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
                                    Tìm người chăm sóc ngay
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
                        <Text style={{ fontSize: 16, fontWeight: '800', color: colors.text }}>Chọn địa điểm cần chăm sóc</Text>
                        <View style={{ width: 40 }} />
                    </View>

                    <View style={{ padding: 12, backgroundColor: colors.surface, borderBottomWidth: 1, borderColor: colors.border }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceContainerLow, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 8, borderWidth: 1, borderColor: colors.border }}>
                            <Search size={16} color={colors.textSecondary} style={{ marginRight: 8 }} />
                            <TextInput
                                value={pickerSearchText}
                                onChangeText={handlePickerSearchText}
                                placeholder="Gõ tên đường, bệnh viện để nhảy tới..."
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
                                { name: 'BV Chợ Rẫy', lat: 10.7578, lng: 106.6595 },
                                { name: 'BV Đại Học Y Dược', lat: 10.7554, lng: 106.6631 },
                                { name: 'Landmark 81', lat: 10.7950, lng: 106.7219 },
                                { name: 'Hồ Con Rùa', lat: 10.7827, lng: 106.6958 },
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
                        <View style={[{ padding: 14, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: isDark ? colors.border : '#e2e8f0', marginBottom: 20 }, shadows.card]}>
                            <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: 8 }}>Nhập mã ưu đãi của bạn</Text>
                            <View style={{ flexDirection: 'row', gap: 8 }}>
                                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: colors.surfaceContainerLow, borderWidth: 1, borderColor: colors.border }}>
                                    <Tag size={16} color={colors.textSecondary} style={{ marginRight: 8 }} />
                                    <TextInput
                                        value={voucherInputCode}
                                        onChangeText={setVoucherInputCode}
                                        placeholder="Ví dụ: FLASH20K, CHAMSOC30K..."
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
                                        style={[{ borderRadius: 16, backgroundColor: isCurrentSelected ? (isDark ? '#064e3b20' : '#f0fdf4') : colors.surface, borderWidth: 1.5, borderColor: isCurrentSelected ? '#10b981' : (isDark ? colors.border : '#e2e8f0'), padding: 14, opacity: isEligible ? 1 : 0.65 }, shadows.card]}
                                    >
                                        <View style={{ flexDirection: 'row', gap: 12 }}>
                                            <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: isCurrentSelected ? '#10b98125' : (isDark ? colors.surfaceContainer : '#eff6ff'), alignItems: 'center', justifyContent: 'center' }}>
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
