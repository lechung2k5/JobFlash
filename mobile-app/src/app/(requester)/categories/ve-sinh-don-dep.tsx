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
    Home,
    Clock,
    Users,
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
    Brush,
    ShieldCheck,
    Zap,
    AlertTriangle,
    AlertCircle,
} from 'lucide-react-native';
import { GoongService, GoongPlacePrediction, GOONG_MAPTILES_KEY } from '../../../services/goongService';
import { JobFlashAPI } from '../../../services/apiClient';
import { useAppTheme } from '../../../constants/theme';
import { useI18n } from '../../../i18n';
import GlassBottomBar from '../../../components/GlassBottomBar';

const CATE_ICON = require('../../../../assets/icon-cate/ve-sinh-don-dep.png');

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
        description: 'Áp dụng cho mọi yêu cầu dọn dẹp từ 100.000đ',
        discountType: 'fixed',
        discountValue: 20000,
        minOrderValue: 100000,
        expiryText: 'HSD: 30/11/2026',
    },
    {
        code: 'VESINH30K',
        title: 'Trợ giá dọn nhà 30.000đ',
        description: 'Áp dụng cho dịch vụ dọn dẹp từ 200.000đ',
        discountType: 'fixed',
        discountValue: 30000,
        minOrderValue: 200000,
        expiryText: 'HSD: 25/11/2026',
    },
    {
        code: 'GIAM10',
        title: 'Ưu đãi cuối tuần - Giảm 10%',
        description: 'Giảm 10% tổng đơn, tối đa 50.000đ',
        discountType: 'percent',
        discountValue: 10,
        maxDiscount: 50000,
        minOrderValue: 150000,
        expiryText: 'HSD: 31/12/2026',
    },
    {
        code: 'FREEDUNGCU',
        title: 'Miễn phí dụng cụ 30.000đ',
        description: 'Trừ trực tiếp tiền dụng cụ hóa chất từ 180.000đ',
        discountType: 'fixed',
        discountValue: 30000,
        minOrderValue: 180000,
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

// Danh mục đầu việc dọn dẹp (Ngắn gọn, không tràn thẻ)
export interface CleaningTaskItem {
    id: string;
    label: string;
    isHeavy?: boolean;
}

export const CLEANING_TASKS: CleaningTaskItem[] = [
    { id: 'sweep_mop', label: 'Quét & lau sàn nhà' },
    { id: 'dust_furniture', label: 'Lau bụi bàn ghế, kệ tủ' },
    { id: 'vacuum_floor', label: 'Hút bụi sàn & thảm' },
    { id: 'change_bedsheets', label: 'Thay ga giường, gấp chăn' },
    { id: 'tidy_rooms', label: 'Thu dọn sắp xếp đồ đạc' },
    { id: 'wash_dishes', label: 'Rửa bát đĩa & dọn bồn rửa' },
    { id: 'clean_stove', label: 'Cọ mặt bếp nấu & tường' },
    { id: 'clean_microwave_fridge', label: 'Lau ngoài tủ lạnh, lò vi sóng' },
    { id: 'take_out_trash', label: 'Thu gom & đổ rác' },
    { id: 'scrub_toilet', label: 'Cọ rửa bồn cầu & khử khuẩn' },
    { id: 'clean_glass_mirror', label: 'Lau gương kính & vách tắm' },
    { id: 'scrub_tiles_floor', label: 'Chà sàn gạch & cọ lavabo' },
    { id: 'laundry_machine', label: 'Giặt máy & phơi quần áo' },
    { id: 'fold_clothes', label: 'Thu đồ & gấp quần áo' },
    { id: 'iron_clothes', label: 'Ủi / là phẳng đồ' },
    { id: 'clean_windows', label: 'Lau cửa kính, cửa sổ', isHeavy: true },
    { id: 'clean_balcony', label: 'Quét dọn ban công, hành lang' },
    { id: 'post_renovation', label: 'Dọn rác thô sau xây dựng / chuyển nhà', isHeavy: true },
];

export const HOME_TYPES = [
    { id: 'apartment', label: 'Chung cư' },
    { id: 'house', label: 'Nhà phố' },
    { id: 'studio', label: 'Phòng trọ' },
    { id: 'office', label: 'Văn phòng' },
];

export const AREA_RANGES = [
    { id: 'under_40', label: '< 40 m²', baseHours: 1 },
    { id: '40_70', label: '40 - 70 m²', baseHours: 2 },
    { id: '70_100', label: '70 - 100 m²', baseHours: 3 },
    { id: 'over_100', label: '> 100 m²', baseHours: 4 },
];

// Tình trạng không gian (Mức độ bẩn theo yêu cầu FormVeSinh.md)
export type SpaceConditionType = 'standard' | 'deep_clean' | 'post_construction';

export interface SpaceConditionItem {
    id: SpaceConditionType;
    label: string;
    description: string;
    badge?: string;
    hoursExtra: number;
}

export const SPACE_CONDITIONS: SpaceConditionItem[] = [
    {
        id: 'standard',
        label: 'Dọn dẹp tiêu chuẩn',
        description: 'Nhà đang ở, dọn thường xuyên',
        badge: 'Phổ biến',
        hoursExtra: 0,
    },
    {
        id: 'deep_clean',
        label: 'Tổng vệ sinh',
        description: 'Nhà lâu ngày không dọn',
        badge: 'Kỹ lưỡng',
        hoursExtra: 1,
    },
    {
        id: 'post_construction',
        label: 'Vệ sinh sau xây dựng',
        description: 'Nhiều bụi bẩn, sơn, xi măng...',
        badge: 'Chuyên sâu',
        hoursExtra: 1.5,
    },
];

export default function VeSinhDonDepJobScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { colors, gradients, shadows, isDark } = useAppTheme();
    const { t } = useI18n();

    // 1. Địa điểm dọn dẹp
    const [address, setAddress] = useState('');
    const [coords, setCoords] = useState<Coords | null>(null);
    const [addressPredictions, setAddressPredictions] = useState<GoongPlacePrediction[]>([]);
    const [isSearchingAddress, setIsSearchingAddress] = useState(false);
    const [isLocatingAddress, setIsLocatingAddress] = useState(false);
    const [unitDetail, setUnitDetail] = useState('');

    // Modal chọn vị trí trên bản đồ Goong
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

    // 2. Quy mô không gian & Tình trạng
    const [selectedHomeType, setSelectedHomeType] = useState('apartment');
    const [selectedArea, setSelectedArea] = useState('40_70');
    const [spaceCondition, setSpaceCondition] = useState<SpaceConditionType>('standard');

    // 3. Danh mục đầu việc (Mặc định không chọn trước)
    const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
    const [customTaskNote, setCustomTaskNote] = useState('');

    const toggleTask = (taskId: string) => {
        setSelectedTasks((prev) =>
            prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
        );
    };

    // 4. Hình thức tính tiền & Thù lao (MẶC ĐỊNH SỐ GIỜ VÀ SỐ THỢ LÀ 1)
    const [pricingMode, setPricingMode] = useState<'hourly' | 'fixed'>('hourly');
    const [hours, setHours] = useState(1);
    const [workersCount, setWorkersCount] = useState(1);
    const [hourlyWage, setHourlyWage] = useState('80.000');
    const [fixedPrice, setFixedPrice] = useState('200.000');

    // 5. Dụng cụ & Yêu cầu riêng
    const [needTools, setNeedTools] = useState(false); // Khách có sẵn dụng cụ (Miễn phí) mặc định
    const [genderPref, setGenderPref] = useState<'female' | 'male' | 'any'>('any');
    const [hasPets, setHasPets] = useState(false);
    const [specialNotes, setSpecialNotes] = useState('');

    // 6. Voucher & Khuyến mãi
    const [selectedVoucher, setSelectedVoucher] = useState<VoucherItem | null>(null);
    const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
    const [voucherInputCode, setVoucherInputCode] = useState('');

    // Pre-cache tọa độ người dùng khi vào màn hình
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
                // Tiếp tục bình thường
            }
        })();
    }, []);

    // TÍNH TOÁN GỢI Ý MỨC TIỀN HỢP LÝ DỰA TRÊN DIỆN TÍCH, TÌNH TRẠNG KHÔNG GIAN, ĐẦU VIỆC
    const suggestedRecommendation = useMemo(() => {
        let baseH = 1;
        if (selectedArea === 'under_40') baseH = 1;
        else if (selectedArea === '40_70') baseH = 2;
        else if (selectedArea === '70_100') baseH = 3;
        else if (selectedArea === 'over_100') baseH = 4;

        const conditionItem = SPACE_CONDITIONS.find((c) => c.id === spaceCondition);
        const conditionExtra = conditionItem ? conditionItem.hoursExtra : 0;
        const taskExtra = Math.min(2, selectedTasks.length * 0.15);
        const hasHeavy = selectedTasks.includes('post_renovation') || selectedTasks.includes('clean_windows');
        const heavyExtra = hasHeavy ? 0.5 : 0;

        const rawHours = baseH + conditionExtra + taskExtra + heavyExtra;
        const recHours = Math.max(1, Math.min(8, Math.round(rawHours * 2) / 2));
        const recHourlyWage = 80000;
        const recHourlyTotal = recHours * recHourlyWage;
        const recFixed = Math.round(recHourlyTotal / 10000) * 10000;

        return {
            hours: recHours,
            hourlyWageFormatted: '80.000',
            hourlyTotalFormatted: recHourlyTotal.toLocaleString('vi-VN'),
            fixedPrice: Math.max(120000, recFixed),
            fixedPriceFormatted: Math.max(120000, recFixed).toLocaleString('vi-VN'),
        };
    }, [selectedArea, spaceCondition, selectedTasks]);

    // Rule kiểm tra (validate) cảnh báo thiếu giờ làm việc theo mục 3 FormVeSinh.md
    const isDurationTooShort = useMemo(() => {
        if (pricingMode !== 'hourly') return false;
        // Kiểm tra nếu chọn nhiều việc, diện tích lớn, hoặc tình trạng nặng nhưng giờ lại quá thấp (<= 1h hoặc <= 1.5h)
        if (selectedTasks.length >= 5 && hours <= 1.5) return true;
        if (selectedTasks.length >= 3 && hours === 1) return true;
        if ((selectedArea === '70_100' || selectedArea === 'over_100') && hours <= 1.5) return true;
        if (spaceCondition === 'post_construction' && hours <= 2) return true;
        if (spaceCondition === 'deep_clean' && hours <= 1) return true;
        if (suggestedRecommendation.hours - hours >= 1.5 && hours <= 1.5) return true;
        return false;
    }, [pricingMode, hours, selectedTasks.length, selectedArea, spaceCondition, suggestedRecommendation.hours]);

    // Các chip gợi ý giá khoán tự động cập nhật linh hoạt theo công việc đã chọn
    const dynamicFixedChips = useMemo(() => {
        const center = suggestedRecommendation.fixedPrice;
        const c1 = Math.max(100000, center - 60000);
        const c2 = center;
        const c3 = center + 60000;
        const c4 = center + 120000;
        return [c1, c2, c3, c4].map((v) => v.toLocaleString('vi-VN'));
    }, [suggestedRecommendation.fixedPrice]);

    const handleApplySuggestedPrice = () => {
        if (pricingMode === 'hourly') {
            setHours(suggestedRecommendation.hours);
            setHourlyWage('80.000');
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

    // Tìm kiếm địa chỉ với gợi ý Goong Autocomplete
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

    // Định vị GPS 1 chạm
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
            Alert.alert(t('common.error'), 'Không thể lấy vị trí hiện tại. Vui lòng bật định vị GPS trong cài đặt máy.');
        } finally {
            setIsLocatingAddress(false);
        }
    };

    // Mở modal bản đồ Goong
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
            webViewRef.current.injectJavaScript(`
                if (window.moveTo) { window.moveTo(${lat}, ${lng}, 16); }
                true;
            `);
        }
    };

    const handleLocateOnMap = async () => {
        try {
            const loc = await GoongService.getCurrentLocation();
            if (loc) {
                flyToLocation(loc.latitude, loc.longitude);
            }
        } catch {
            // Không làm gián đoạn
        }
    };

    const zoomInMap = () => {
        if (webViewRef.current) {
            webViewRef.current.injectJavaScript(`
                if (window.map) { window.map.zoomIn(); }
                true;
            `);
        }
    };

    const zoomOutMap = () => {
        if (webViewRef.current) {
            webViewRef.current.injectJavaScript(`
                if (window.map) { window.map.zoomOut(); }
                true;
            `);
        }
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

    // Memoize HTML bản đồ Goong Vector Map
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
        .center-pin {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -100%);
            z-index: 100;
            pointer-events: none;
            display: flex;
            flex-direction: column;
            align-items: center;
            transition: transform 0.16s ease-out;
        }
        .center-pin.dragging {
            transform: translate(-50%, -120%);
        }
        .pin-shadow {
            width: 14px;
            height: 6px;
            background: rgba(0,0,0,0.28);
            border-radius: 50%;
            margin-top: -3px;
            transition: transform 0.16s ease-out, opacity 0.16s ease-out;
        }
        .center-pin.dragging .pin-shadow {
            transform: scale(0.6);
            opacity: 0.4;
        }
    </style>
</head>
<body>
    <div id="map"></div>
    <div class="center-pin" id="pin">
        <svg width="44" height="44" viewBox="0 0 24 24" fill="#10b981" stroke="#ffffff" stroke-width="1.8">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
            <circle cx="12" cy="9" r="2.8" fill="#ffffff"/>
        </svg>
        <div class="pin-shadow"></div>
    </div>
    <script>
        const styleUrl = '${isDark ? 'https://tiles.goong.io/assets/goong_map_dark.json' : 'https://tiles.goong.io/assets/goong_map_web.json'}?api_key=${GOONG_MAPTILES_KEY}';
        const map = new maplibregl.Map({
            container: 'map',
            style: styleUrl,
            center: [${initLng}, ${initLat}],
            zoom: 15,
            attributionControl: false,
            dragPan: true,
            touchZoomRotate: true
        });

        window.map = map;
        const pin = document.getElementById('pin');
        var debounceTimer = null;

        window.moveTo = function(lat, lng, zoom) {
            if (map) {
                map.flyTo({ center: [lng, lat], zoom: zoom || map.getZoom() || 16, essential: true });
            }
        };

        map.on('movestart', function() {
            pin.classList.add('dragging');
            if (debounceTimer) {
                clearTimeout(debounceTimer);
                debounceTimer = null;
            }
        });

        map.on('move', function() {
            if (debounceTimer) {
                clearTimeout(debounceTimer);
                debounceTimer = null;
            }
        });

        map.on('moveend', function() {
            pin.classList.remove('dragging');
            if (debounceTimer) {
                clearTimeout(debounceTimer);
            }
            debounceTimer = setTimeout(function() {
                var center = map.getCenter();
                if (window.ReactNativeWebView) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'LOCATION_CHANGED',
                        lat: center.lat,
                        lng: center.lng
                    }));
                }
            }, 600);
        });

        map.on('load', function() {
            if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'MAP_LOADED' }));
            }
        });
    </script>
</body>
</html>`;
    }, [isDark]);

    // Tính toán chi phí
    const parsedHourlyWage = parseInt(hourlyWage.replace(/\D/g, ''), 10) || 0;
    const parsedFixedPrice = parseInt(fixedPrice.replace(/\D/g, ''), 10) || 0;
    const toolsFee = needTools ? 30000 : 0;

    const baseWage =
        pricingMode === 'hourly'
            ? Math.round(hours * workersCount * parsedHourlyWage)
            : parsedFixedPrice;

    const subtotal = baseWage + toolsFee;
    const voucherDiscount = selectedVoucher ? calculateVoucherDiscount(selectedVoucher, subtotal) : 0;
    const grandTotal = Math.max(0, subtotal - voucherDiscount);

    // Kiểm tra xem đã điền đầy đủ các mục cần nhập và chọn hay chưa
    const isFormComplete = useMemo(() => {
        if (!address.trim()) return false;
        if (selectedTasks.length === 0 && !customTaskNote.trim() && !specialNotes.trim()) return false;
        if (pricingMode === 'hourly' && parsedHourlyWage <= 0) return false;
        if (pricingMode === 'fixed' && parsedFixedPrice <= 0) return false;
        return true;
    }, [address, selectedTasks, customTaskNote, specialNotes, pricingMode, parsedHourlyWage, parsedFixedPrice]);

    // Áp dụng voucher
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
                `Mã ${found.code} yêu cầu giá trị đơn từ ${found.minOrderValue.toLocaleString('vi-VN')} đ.\nGiá trị tạm tính hiện tại: ${subtotal.toLocaleString('vi-VN')} đ.`
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
            Alert.alert(
                'Chưa đủ điều kiện',
                `Mã ${voucher.code} áp dụng cho đơn từ ${voucher.minOrderValue.toLocaleString('vi-VN')} đ.\nGiá trị tạm tính hiện tại: ${subtotal.toLocaleString('vi-VN')} đ.`
            );
            return;
        }
        setSelectedVoucher(voucher);
        setIsVoucherModalOpen(false);
    };

    const handleRemoveVoucher = () => {
        setSelectedVoucher(null);
    };

    // Đăng yêu cầu tìm thợ tức thì (Tự động gán booking_time hiện tại & chuyển sang Radar tìm thợ)
    const handleSubmit = async () => {
        if (!address.trim()) {
            Alert.alert(t('common.error'), 'Vui lòng nhập hoặc chọn địa chỉ cần dọn dẹp.');
            return;
        }
        if (selectedTasks.length === 0 && !customTaskNote.trim() && !specialNotes.trim()) {
            Alert.alert(t('common.error'), 'Vui lòng chọn ít nhất 1 đầu việc hoặc viết ghi chú mô tả công việc.');
            return;
        }
        if (pricingMode === 'hourly' && parsedHourlyWage <= 0) {
            Alert.alert(t('common.error'), 'Vui lòng nhập mức tiền công/giờ cho thợ.');
            return;
        }
        if (pricingMode === 'fixed' && parsedFixedPrice <= 0) {
            Alert.alert(t('common.error'), 'Vui lòng nhập mức giá thuê trọn gói mong muốn.');
            return;
        }

        const homeTypeObj = HOME_TYPES.find((h) => h.id === selectedHomeType);
        const areaObj = AREA_RANGES.find((a) => a.id === selectedArea);
        const conditionObj = SPACE_CONDITIONS.find((c) => c.id === spaceCondition);

        // Gán booking_time bằng thời gian thực theo đúng yêu cầu FormVeSinh.md
        const currentBookingTime = new Date().toISOString();

        const jobPayload = {
            category: 've-sinh-don-dep',
            title: `Thuê thợ vệ sinh dọn dẹp (${homeTypeObj?.label || 'Nhà ở'})`,
            address,
            unitDetail,
            latitude: coords?.lat || 10.7769,
            longitude: coords?.lng || 106.7009,
            homeType: selectedHomeType,
            areaRange: selectedArea,
            spaceCondition,
            spaceConditionLabel: conditionObj?.label,
            selectedTasks,
            customTaskNote,
            pricingMode,
            hours: pricingMode === 'hourly' ? hours : undefined,
            workersCount,
            hourlyWage: parsedHourlyWage,
            fixedPrice: parsedFixedPrice,
            needTools,
            genderPref,
            hasPets,
            specialNotes,
            voucherCode: selectedVoucher?.code,
            discountAmount: voucherDiscount,
            totalAmount: grandTotal,
            booking_time: currentBookingTime,
        };

        try {
            await JobFlashAPI.jobs.createJob(jobPayload).catch((err) => {
                console.log('[VeSinhDonDep] Local fallback: job created', err?.message);
            });
        } catch {
            // Tiếp tục bình thường
        }

        // Chuyển thẳng giao diện sang màn hình Radar Tìm thợ
        router.push('/(requester)/radar');
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
                            Thuê Thợ Vệ Sinh Dọn Dẹp
                        </Text>
                    </View>

                    <View style={{ width: 40 }} />
                </View>

                <ScrollView
                    contentContainerStyle={{ padding: 16, paddingBottom: 110 }}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* KHỐI 1: ĐỊA ĐIỂM & CHI TIẾT NHÀ */}
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
                                Địa điểm cần dọn dẹp
                            </Text>
                        </View>

                        {/* Ô nhập địa chỉ */}
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
                                placeholder="Nhập số nhà, tên đường, chung cư..."
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
                            <View
                                style={{
                                    marginBottom: 10,
                                    borderRadius: 12,
                                    backgroundColor: colors.surface,
                                    borderWidth: 1,
                                    borderColor: colors.border,
                                    overflow: 'hidden',
                                }}
                            >
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

                        {/* 2 Nút: Vị trí hiện tại + Chọn trên bản đồ */}
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

                        {/* Chi tiết căn hộ */}
                        <View style={{ paddingTop: 10, borderTopWidth: 1, borderColor: colors.border }}>
                            <Text style={{ fontSize: 12, fontWeight: '700', color: colors.text, marginBottom: 4 }}>
                                Căn hộ, tầng, tòa nhà (nếu có)
                            </Text>
                            <TextInput
                                value={unitDetail}
                                onChangeText={setUnitDetail}
                                placeholder="Ví dụ: Căn 12.08, Tòa Landmark 3..."
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

                    {/* THÔNG BÁO THỜI GIAN LÀM VIỆC NỔI BẬT: NGAY BÂY GIỜ (NGAY DƯỚI KHỐI ĐỊA ĐIỂM) */}
                    <View
                        style={[
                            {
                                flexDirection: 'row',
                                alignItems: 'center',
                                padding: 14,
                                borderRadius: 16,
                                backgroundColor: isDark ? '#1e3a8a30' : '#eff6ff',
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
                                borderRadius: 20,
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
                                Tìm thợ đến ngay lập tức • Thợ có mặt trong 30 - 60 phút
                            </Text>
                        </View>
                    </View>

                    {/* KHỐI 2: KHÔNG GIAN & DIỆN TÍCH (GỌN GÀNG, KHÔNG TRÀN CHỮ) */}
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
                            <Home size={16} color={colors.primary} />
                            <Text style={{ fontSize: 14, fontWeight: '800', color: colors.text }}>
                                Quy mô không gian
                            </Text>
                        </View>

                        {/* 4 Loại hình nhà ở (Gọn gàng, không ghi thừa) */}
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                            {HOME_TYPES.map((h) => {
                                const isSelected = selectedHomeType === h.id;
                                return (
                                    <TouchableOpacity
                                        key={h.id}
                                        onPress={() => setSelectedHomeType(h.id)}
                                        style={{
                                            width: '48.5%',
                                            paddingVertical: 10,
                                            paddingHorizontal: 6,
                                            borderRadius: 12,
                                            borderWidth: 1.5,
                                            borderColor: isSelected ? colors.primary : colors.border,
                                            backgroundColor: isSelected ? colors.primary + '12' : colors.surfaceContainerLow,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <Text style={{ fontSize: 13, fontWeight: '800', color: isSelected ? colors.primary : colors.text }}>
                                            {h.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        {/* Diện tích (Gọn gàng, không tràn chữ) */}
                        <Text style={{ fontSize: 12, fontWeight: '700', color: colors.text, marginBottom: 8 }}>
                            Khoảng diện tích mặt sàn
                        </Text>
                        <View style={{ flexDirection: 'row', gap: 6, marginBottom: 14 }}>
                            {AREA_RANGES.map((a) => {
                                const isSelected = selectedArea === a.id;
                                return (
                                    <TouchableOpacity
                                        key={a.id}
                                        onPress={() => setSelectedArea(a.id)}
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
                                            {a.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        {/* Tình trạng không gian (Radio buttons theo yêu cầu FormVeSinh.md) */}
                        <View style={{ paddingTop: 10, borderTopWidth: 1, borderColor: colors.border }}>
                            <Text style={{ fontSize: 12, fontWeight: '700', color: colors.text, marginBottom: 8 }}>
                                Tình trạng không gian (Mức độ bẩn)
                            </Text>
                            <View style={{ gap: 8 }}>
                                {SPACE_CONDITIONS.map((cond) => {
                                    const isSelected = spaceCondition === cond.id;
                                    return (
                                        <TouchableOpacity
                                            key={cond.id}
                                            onPress={() => setSpaceCondition(cond.id)}
                                            activeOpacity={0.7}
                                            style={{
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                padding: 12,
                                                borderRadius: 12,
                                                backgroundColor: isSelected ? (isDark ? '#1e3a8a25' : '#eff6ff') : colors.surfaceContainerLow,
                                                borderWidth: 1.5,
                                                borderColor: isSelected ? colors.primary : colors.border,
                                                gap: 10,
                                            }}
                                        >
                                            {/* Custom Radio Circle */}
                                            <View
                                                style={{
                                                    width: 20,
                                                    height: 20,
                                                    borderRadius: 10,
                                                    borderWidth: 2,
                                                    borderColor: isSelected ? colors.primary : (isDark ? colors.border : '#94a3b8'),
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    backgroundColor: colors.surface,
                                                }}
                                            >
                                                {isSelected && (
                                                    <View
                                                        style={{
                                                            width: 10,
                                                            height: 10,
                                                            borderRadius: 5,
                                                            backgroundColor: colors.primary,
                                                        }}
                                                    />
                                                )}
                                            </View>

                                            <View style={{ flex: 1 }}>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                                    <Text
                                                        style={{
                                                            fontSize: 13,
                                                            fontWeight: isSelected ? '800' : '700',
                                                            color: isSelected ? colors.primary : colors.text,
                                                        }}
                                                    >
                                                        {cond.label}
                                                    </Text>
                                                    {cond.badge && (
                                                        <View
                                                            style={{
                                                                backgroundColor: isSelected ? colors.primary + '20' : colors.surfaceContainer,
                                                                paddingHorizontal: 6,
                                                                paddingVertical: 1.5,
                                                                borderRadius: 6,
                                                            }}
                                                        >
                                                            <Text
                                                                style={{
                                                                    fontSize: 10,
                                                                    fontWeight: '700',
                                                                    color: isSelected ? colors.primary : colors.textSecondary,
                                                                }}
                                                            >
                                                                {cond.badge}
                                                            </Text>
                                                        </View>
                                                    )}
                                                </View>
                                                <Text style={{ fontSize: 11.5, color: colors.textSecondary, marginTop: 2 }}>
                                                    {cond.description}
                                                </Text>
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>
                    </View>

                    {/* KHỐI 3: DANH MỤC ĐẦU VIỆC (KHÔNG BỊ CHÈN BADGE TRÀN CHỮ) */}
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
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <Brush size={16} color={colors.primary} />
                                <Text style={{ fontSize: 14, fontWeight: '800', color: colors.text }}>
                                    Đầu việc cần làm ({selectedTasks.length})
                                </Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => {
                                    if (selectedTasks.length === CLEANING_TASKS.length) {
                                        setSelectedTasks([]);
                                    } else {
                                        setSelectedTasks(CLEANING_TASKS.map((t) => t.id));
                                    }
                                }}
                            >
                                <Text style={{ fontSize: 11, fontWeight: '700', color: colors.primary }}>
                                    {selectedTasks.length === CLEANING_TASKS.length ? 'Bỏ chọn hết' : 'Chọn tất cả'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                        <Text style={{ fontSize: 11.5, color: colors.textSecondary, marginBottom: 10 }}>
                            Tick chọn các việc bạn muốn thợ tập trung làm:
                        </Text>

                        {/* Danh sách các task (Full chiều ngang, không sợ tràn chữ) */}
                        <View style={{ gap: 7 }}>
                            {CLEANING_TASKS.map((item) => {
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
                                            style={{
                                                fontSize: 13,
                                                fontWeight: isChecked ? '700' : '600',
                                                color: colors.text,
                                                flex: 1,
                                            }}
                                            numberOfLines={1}
                                        >
                                            {item.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        {/* Ô nhập việc khác */}
                        <View style={{ marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderColor: colors.border }}>
                            <Text style={{ fontSize: 12, fontWeight: '700', color: colors.text, marginBottom: 5 }}>
                                Việc khác cần lưu ý thêm cho thợ (nếu có):
                            </Text>
                            <TextInput
                                value={customTaskNote}
                                onChangeText={setCustomTaskNote}
                                placeholder="Ghi chú thêm công việc..."
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

                    {/* KHỐI 4: HÌNH THỨC THUÊ & GỢI Ý MỨC GIÁ HỢP LÝ */}
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
                                Tiền công & Thù lao đề xuất
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

                        {/* KHUNG GỢI Ý MỨC TIỀN HỢP LÝ DỰA TRÊN KHỐI LƯỢNG VIỆC ĐÃ CHỌN */}
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
                                        Gợi ý theo khối lượng việc:
                                    </Text>
                                </View>
                                <Text style={{ fontSize: 13, fontWeight: '800', color: colors.text, marginTop: 2 }}>
                                    {pricingMode === 'hourly'
                                        ? `Nên thuê ${suggestedRecommendation.hours}h (~${suggestedRecommendation.hourlyTotalFormatted} đ)`
                                        : `Khoán khoảng ${suggestedRecommendation.fixedPriceFormatted} đ`}
                                </Text>
                            </View>

                            <TouchableOpacity
                                onPress={handleApplySuggestedPrice}
                                style={{
                                    backgroundColor: '#10b981',
                                    paddingHorizontal: 12,
                                    paddingVertical: 6,
                                    borderRadius: 8,
                                }}
                            >
                                <Text style={{ fontSize: 11, fontWeight: '800', color: '#ffffff' }}>
                                    Áp dụng
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {pricingMode === 'hourly' ? (
                            /* CƠ CHẾ A: THUÊ THEO GIỜ */
                            <View style={{ gap: 14 }}>
                                {/* 4.1 Bộ chọn số giờ làm việc (MẶC ĐỊNH LÀ 1) */}
                                <View>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <View>
                                            <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text }}>Thời lượng làm việc</Text>
                                            <Text style={{ fontSize: 11, color: colors.textSecondary }}>Mặc định 1 giờ</Text>
                                        </View>

                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                            <TouchableOpacity
                                                onPress={() => setHours((prev) => Math.max(1, prev - 0.5))}
                                                style={{
                                                    width: 36,
                                                    height: 36,
                                                    borderRadius: 18,
                                                    backgroundColor: colors.surfaceContainer,
                                                    borderWidth: 1,
                                                    borderColor: colors.border,
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                }}
                                            >
                                                <Minus size={16} color={colors.text} />
                                            </TouchableOpacity>

                                            <Text style={{ fontSize: 16, fontWeight: '800', color: colors.primary, minWidth: 36, textAlign: 'center' }}>
                                                {hours}h
                                            </Text>

                                            <TouchableOpacity
                                                onPress={() => setHours((prev) => Math.min(8, prev + 0.5))}
                                                style={{
                                                    width: 36,
                                                    height: 36,
                                                    borderRadius: 18,
                                                    backgroundColor: colors.surfaceContainer,
                                                    borderWidth: 1,
                                                    borderColor: colors.border,
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                }}
                                            >
                                                <Plus size={16} color={colors.text} />
                                            </TouchableOpacity>
                                        </View>
                                    </View>

                                    {/* Dòng cảnh báo thiếu giờ theo mục 3 FormVeSinh.md */}
                                    {isDurationTooShort && (
                                        <View
                                            style={{
                                                flexDirection: 'row',
                                                alignItems: 'flex-start',
                                                backgroundColor: isDark ? '#451a0335' : '#fffbeb',
                                                borderWidth: 1,
                                                borderColor: '#f59e0b',
                                                borderRadius: 10,
                                                paddingHorizontal: 10,
                                                paddingVertical: 7,
                                                marginTop: 8,
                                                gap: 7,
                                            }}
                                        >
                                            <AlertTriangle size={14} color="#d97706" style={{ marginTop: 2 }} />
                                            <Text style={{ fontSize: 11.5, color: '#b45309', fontWeight: '600', flex: 1, lineHeight: 16 }}>
                                                Lưu ý: Thời gian quá ngắn so với khối lượng công việc, thợ có thể sẽ không hoàn thành kịp toàn bộ.
                                            </Text>
                                        </View>
                                    )}
                                </View>

                                {/* 4.2 Số lượng thợ dọn (MẶC ĐỊNH LÀ 1) */}
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <View>
                                        <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text }}>Số lượng thợ</Text>
                                        <Text style={{ fontSize: 11, color: colors.textSecondary }}>Mặc định 1 người</Text>
                                    </View>

                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                        <TouchableOpacity
                                            onPress={() => setWorkersCount((prev) => Math.max(1, prev - 1))}
                                            style={{
                                                width: 36,
                                                height: 36,
                                                borderRadius: 18,
                                                backgroundColor: colors.surfaceContainer,
                                                borderWidth: 1,
                                                borderColor: colors.border,
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            <Minus size={16} color={colors.text} />
                                        </TouchableOpacity>

                                        <Text style={{ fontSize: 16, fontWeight: '800', color: colors.primary, minWidth: 26, textAlign: 'center' }}>
                                            {workersCount}
                                        </Text>

                                        <TouchableOpacity
                                            onPress={() => setWorkersCount((prev) => Math.min(4, prev + 1))}
                                            style={{
                                                width: 36,
                                                height: 36,
                                                borderRadius: 18,
                                                backgroundColor: colors.surfaceContainer,
                                                borderWidth: 1,
                                                borderColor: colors.border,
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            <Plus size={16} color={colors.text} />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                {/* 4.3 Nhập hoặc chọn mức tiền công/giờ */}
                                <View style={{ paddingTop: 10, borderTopWidth: 1, borderColor: colors.border }}>
                                    <Text style={{ fontSize: 12, fontWeight: '700', color: colors.text, marginBottom: 6 }}>
                                        Tiền công đề xuất (VNĐ / giờ)
                                    </Text>
                                    <View
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            paddingHorizontal: 12,
                                            paddingVertical: 9,
                                            borderRadius: 12,
                                            backgroundColor: colors.surfaceContainerLow,
                                            borderWidth: 1,
                                            borderColor: colors.border,
                                            marginBottom: 8,
                                        }}
                                    >
                                        <TextInput
                                            value={hourlyWage}
                                            onChangeText={handleHourlyWageChange}
                                            keyboardType="numeric"
                                            placeholder="80.000"
                                            placeholderTextColor={colors.placeholder}
                                            style={{ flex: 1, fontSize: 16, fontWeight: '800', color: colors.primary }}
                                        />
                                        <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textSecondary }}>VNĐ / người / h</Text>
                                    </View>

                                    {/* Mức giá gợi ý nhanh */}
                                    <View style={{ flexDirection: 'row', gap: 6 }}>
                                        {['70.000', '80.000', '90.000', '100.000'].map((val) => (
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
                            /* CƠ CHẾ B: THUÊ TRỌN GÓI THEO CÔNG VIỆC */
                            <View style={{ gap: 10 }}>
                                <Text style={{ fontSize: 12, fontWeight: '700', color: colors.text }}>
                                    Số tiền thuê trọn gói mong muốn:
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
                                        borderColor: colors.border,
                                    }}
                                >
                                    <TextInput
                                        value={fixedPrice}
                                        onChangeText={handleFixedPriceChange}
                                        keyboardType="numeric"
                                        placeholder="200.000"
                                        placeholderTextColor={colors.placeholder}
                                        style={{ flex: 1, fontSize: 18, fontWeight: '900', color: colors.primary }}
                                    />
                                    <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textSecondary }}>VNĐ trọn gói</Text>
                                </View>

                                {/* Các mức giá khoán gợi ý thông minh dựa trên việc đã chọn */}
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

                    {/* KHỐI 5: DỤNG CỤ & YÊU CẦU ĐỐI VỚI THỢ */}
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
                            <ShieldCheck size={16} color={colors.primary} />
                            <Text style={{ fontSize: 14, fontWeight: '800', color: colors.text }}>
                                Dụng cụ & Yêu cầu thợ
                            </Text>
                        </View>

                        {/* 5.1 Dụng cụ lau dọn (2 Lựa chọn rõ ràng theo mục 4 FormVeSinh.md) */}
                        <View style={{ marginBottom: 14 }}>
                            <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: 4 }}>
                                Dụng cụ & Hóa chất lau dọn
                            </Text>
                            <Text style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 8 }}>
                                Cây lau sàn, khăn lau, xô chậu và nước lau chuyên dụng
                            </Text>

                            <View style={{ flexDirection: 'row', gap: 8 }}>
                                <TouchableOpacity
                                    onPress={() => setNeedTools(false)}
                                    activeOpacity={0.75}
                                    style={{
                                        flex: 1,
                                        paddingVertical: 10,
                                        paddingHorizontal: 8,
                                        borderRadius: 12,
                                        borderWidth: 1.5,
                                        borderColor: !needTools ? colors.primary : colors.border,
                                        backgroundColor: !needTools ? colors.primary + '12' : colors.surfaceContainerLow,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <Text
                                        style={{
                                            fontSize: 12,
                                            fontWeight: !needTools ? '800' : '600',
                                            color: !needTools ? colors.primary : colors.text,
                                            textAlign: 'center',
                                        }}
                                    >
                                        Khách có sẵn dụng cụ
                                    </Text>
                                    <Text
                                        style={{
                                            fontSize: 11,
                                            fontWeight: '700',
                                            color: !needTools ? colors.primary : '#16a34a',
                                            marginTop: 2,
                                        }}
                                    >
                                        (Miễn phí)
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={() => setNeedTools(true)}
                                    activeOpacity={0.75}
                                    style={{
                                        flex: 1,
                                        paddingVertical: 10,
                                        paddingHorizontal: 8,
                                        borderRadius: 12,
                                        borderWidth: 1.5,
                                        borderColor: needTools ? colors.primary : colors.border,
                                        backgroundColor: needTools ? colors.primary + '12' : colors.surfaceContainerLow,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <Text
                                        style={{
                                            fontSize: 12,
                                            fontWeight: needTools ? '800' : '600',
                                            color: needTools ? colors.primary : colors.text,
                                            textAlign: 'center',
                                        }}
                                    >
                                        Yêu cầu thợ mang theo
                                    </Text>
                                    <Text
                                        style={{
                                            fontSize: 11,
                                            fontWeight: '700',
                                            color: needTools ? colors.primary : colors.textSecondary,
                                            marginTop: 2,
                                        }}
                                    >
                                        (+30.000đ)
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* 5.2 Ưu tiên giới tính thợ (3 Lựa chọn rõ ràng: Thợ nam, Thợ nữ, Bất kỳ) */}
                        <View style={{ paddingTop: 10, borderTopWidth: 1, borderColor: colors.border, marginBottom: 14 }}>
                            <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: 8 }}>
                                Ưu tiên giới tính thợ
                            </Text>
                            <View style={{ flexDirection: 'row', gap: 8 }}>
                                {[
                                    { id: 'female', label: 'Thợ nữ' },
                                    { id: 'male', label: 'Thợ nam' },
                                    { id: 'any', label: 'Bất kỳ' },
                                ].map((item) => {
                                    const isSelected = genderPref === item.id;
                                    return (
                                        <TouchableOpacity
                                            key={item.id}
                                            onPress={() => setGenderPref(item.id as any)}
                                            style={{
                                                flex: 1,
                                                paddingVertical: 8,
                                                borderRadius: 10,
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                backgroundColor: isSelected ? colors.primary + '18' : colors.surfaceContainerLow,
                                                borderWidth: 1.5,
                                                borderColor: isSelected ? colors.primary : colors.border,
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    fontSize: 12,
                                                    fontWeight: isSelected ? '800' : '600',
                                                    color: isSelected ? colors.primary : colors.text,
                                                }}
                                            >
                                                {item.label}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>

                        {/* 5.3 Nhà có thú cưng & Rule hiển thị động nhắc nhở an toàn */}
                        <View style={{ paddingTop: 10, borderTopWidth: 1, borderColor: colors.border, marginBottom: 12 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <View style={{ flex: 1, paddingRight: 8 }}>
                                    <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text }}>Nhà có thú cưng (chó/mèo)</Text>
                                    <Text style={{ fontSize: 11, color: colors.textSecondary }}>Để ghép nối thợ không bị dị ứng</Text>
                                </View>
                                <View style={{ flexDirection: 'row', gap: 6 }}>
                                    <TouchableOpacity
                                        onPress={() => setHasPets(false)}
                                        style={{
                                            paddingHorizontal: 12,
                                            paddingVertical: 6,
                                            borderRadius: 8,
                                            backgroundColor: !hasPets ? colors.primary + '18' : colors.surfaceContainerLow,
                                            borderWidth: 1.5,
                                            borderColor: !hasPets ? colors.primary : colors.border,
                                        }}
                                    >
                                        <Text style={{ fontSize: 11.5, fontWeight: !hasPets ? '800' : '600', color: !hasPets ? colors.primary : colors.textSecondary }}>
                                            Không có
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => setHasPets(true)}
                                        style={{
                                            paddingHorizontal: 12,
                                            paddingVertical: 6,
                                            borderRadius: 8,
                                            backgroundColor: hasPets ? '#fef3c7' : colors.surfaceContainerLow,
                                            borderWidth: 1.5,
                                            borderColor: hasPets ? '#f59e0b' : colors.border,
                                        }}
                                    >
                                        <Text style={{ fontSize: 11.5, fontWeight: hasPets ? '800' : '600', color: hasPets ? '#b45309' : colors.textSecondary }}>
                                            Có (chó/mèo)
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Dòng nhắc nhở an toàn thú cưng hiển thị động khi chọn Có */}
                            {hasPets && (
                                <View
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        backgroundColor: isDark ? '#451a0335' : '#fffbeb',
                                        borderWidth: 1,
                                        borderColor: '#f59e0b',
                                        borderRadius: 10,
                                        paddingHorizontal: 12,
                                        paddingVertical: 8,
                                        marginTop: 10,
                                        gap: 8,
                                    }}
                                >
                                    <AlertCircle size={15} color="#d97706" />
                                    <Text style={{ fontSize: 11.5, color: '#b45309', fontWeight: '600', flex: 1, lineHeight: 16 }}>
                                        Vui lòng xích/nhốt thú cưng trong thời gian thợ làm việc để đảm bảo an toàn.
                                    </Text>
                                </View>
                            )}
                        </View>

                        {/* Ghi chú */}
                        <View style={{ paddingTop: 10, borderTopWidth: 1, borderColor: colors.border }}>
                            <Text style={{ fontSize: 12, fontWeight: '700', color: colors.text, marginBottom: 5 }}>
                                Ghi chú thêm cho thợ:
                            </Text>
                            <TextInput
                                value={specialNotes}
                                onChangeText={setSpecialNotes}
                                placeholder="Ví dụ: Cẩn thận đồ dễ vỡ, nhà có trẻ nhỏ..."
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

                    {/* KHỐI ƯU ĐÃI & MÃ GIẢM GIÁ (VOUCHER) */}
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

                    {/* KHỐI 6: TỔNG DỰ TOÁN CƯỚC PHÍ & NÚT ĐĂNG VIỆC */}
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
                        {/* Tiêu đề & Tổng tiền nổi bật */}
                        <View style={{ marginBottom: isFormComplete ? 10 : 0 }}>
                            <Text style={{ fontSize: 12, color: colors.textSecondary, fontWeight: '600' }}>
                                {isFormComplete ? 'Tổng tiền công dự kiến' : 'Vui lòng hoàn tất thông tin'}
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

                        {/* Phân bổ chi tiết (Không bị tràn màn hình) */}
                        {isFormComplete ? (
                            <View
                                style={{
                                    flexDirection: 'row',
                                    flexWrap: 'wrap',
                                    gap: 8,
                                    paddingTop: 10,
                                    borderTopWidth: 1,
                                    borderColor: isDark ? colors.border : '#e9d5ff',
                                }}
                            >
                                <View
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        backgroundColor: colors.surface,
                                        paddingHorizontal: 10,
                                        paddingVertical: 5,
                                        borderRadius: 8,
                                        borderWidth: 1,
                                        borderColor: colors.border,
                                        gap: 6,
                                    }}
                                >
                                    <Clock size={13} color={colors.primary} />
                                    <Text style={{ fontSize: 12, fontWeight: '700', color: colors.text }}>
                                        {pricingMode === 'hourly'
                                            ? `Công thợ: ${baseWage.toLocaleString('vi-VN')} đ (${hours}h)`
                                            : `Khoán việc: ${baseWage.toLocaleString('vi-VN')} đ`}
                                    </Text>
                                </View>

                                {needTools && (
                                    <View
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            backgroundColor: colors.surface,
                                            paddingHorizontal: 10,
                                            paddingVertical: 5,
                                            borderRadius: 8,
                                            borderWidth: 1,
                                            borderColor: colors.border,
                                            gap: 6,
                                        }}
                                    >
                                        <Brush size={13} color={colors.secondary} />
                                        <Text style={{ fontSize: 12, fontWeight: '700', color: colors.text }}>
                                            Dụng cụ: 30.000 đ
                                        </Text>
                                    </View>
                                )}

                                {selectedVoucher && voucherDiscount > 0 && (
                                    <View
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            backgroundColor: isDark ? '#064e3b30' : '#dcfce7',
                                            paddingHorizontal: 10,
                                            paddingVertical: 5,
                                            borderRadius: 8,
                                            borderWidth: 1,
                                            borderColor: '#10b981',
                                            gap: 6,
                                        }}
                                    >
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
                                    Tìm thợ dọn dẹp ngay
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </ScrollView>

                <GlassBottomBar />
            </View>

            {/* MODAL CHỌN TRÊN BẢN ĐỒ */}
            <Modal
                visible={isMapPickerOpen}
                animationType="slide"
                transparent={false}
                onRequestClose={() => setIsMapPickerOpen(false)}
                statusBarTranslucent={false}
            >
                <View
                    style={{
                        flex: 1,
                        backgroundColor: colors.surface,
                        paddingTop: insets.top,
                    }}
                >
                    {/* Header Modal */}
                    <View
                        style={{
                            height: 54,
                            paddingHorizontal: 16,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            borderBottomWidth: 1,
                            borderColor: colors.border,
                            backgroundColor: colors.surface,
                        }}
                    >
                        <TouchableOpacity
                            onPress={() => setIsMapPickerOpen(false)}
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

                        <Text style={{ fontSize: 16, fontWeight: '800', color: colors.text }}>
                            Chọn địa điểm dọn dẹp
                        </Text>

                        <View style={{ width: 40 }} />
                    </View>

                    {/* Thanh tìm kiếm nhanh */}
                    <View style={{ padding: 12, backgroundColor: colors.surface, borderBottomWidth: 1, borderColor: colors.border }}>
                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                backgroundColor: colors.surfaceContainerLow,
                                borderRadius: 12,
                                paddingHorizontal: 10,
                                paddingVertical: 8,
                                borderWidth: 1,
                                borderColor: colors.border,
                            }}
                        >
                            <Search size={16} color={colors.textSecondary} style={{ marginRight: 8 }} />
                            <TextInput
                                value={pickerSearchText}
                                onChangeText={handlePickerSearchText}
                                placeholder="Gõ tên đường, tòa nhà để nhảy tới..."
                                placeholderTextColor={colors.placeholder}
                                style={{ flex: 1, fontSize: 13, color: colors.text }}
                            />
                            {pickerSearchText.length > 0 && (
                                <TouchableOpacity onPress={() => { setPickerSearchText(''); setPickerPredictions([]); }}>
                                    <X size={16} color={colors.textSecondary} />
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Gợi ý tìm kiếm */}
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

                        {/* Phím tắt vị trí nổi tiếng */}
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginTop: 8 }}>
                            {[
                                { name: 'Chợ Bến Thành', lat: 10.7725, lng: 106.6980 },
                                { name: 'Landmark 81', lat: 10.7950, lng: 106.7219 },
                                { name: 'Sân bay TSN', lat: 10.8185, lng: 106.6588 },
                                { name: 'Hồ Hoàn Kiếm', lat: 21.0285, lng: 105.8542 },
                                { name: 'Cầu Rồng ĐN', lat: 16.0610, lng: 108.2270 },
                            ].map((lm) => (
                                <TouchableOpacity
                                    key={lm.name}
                                    onPress={() => flyToLocation(lm.lat, lm.lng)}
                                    style={{
                                        paddingHorizontal: 10,
                                        paddingVertical: 5,
                                        borderRadius: 8,
                                        backgroundColor: colors.surfaceContainer,
                                        borderWidth: 1,
                                        borderColor: colors.border,
                                    }}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                        <MapPin size={11} color={colors.primary} />
                                        <Text style={{ fontSize: 11, fontWeight: '600', color: colors.text }}>{lm.name}</Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    {/* VÙNG BẢN ĐỒ VECTOR GOONG MAPS */}
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

                        {/* Hướng dẫn thao tác ghim vị trí */}
                        <View
                            pointerEvents="none"
                            style={{
                                position: 'absolute',
                                top: 14,
                                alignSelf: 'center',
                                backgroundColor: isDark ? 'rgba(15,23,42,0.88)' : 'rgba(255,255,255,0.92)',
                                paddingHorizontal: 14,
                                paddingVertical: 6,
                                borderRadius: 20,
                                borderWidth: 1,
                                borderColor: colors.border,
                                zIndex: 10,
                                ...shadows.soft,
                            }}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <Navigation size={12} color={colors.primary} />
                                <Text style={{ fontSize: 11, fontWeight: '700', color: colors.primary }}>
                                    Kéo bản đồ để chọn vị trí chính xác
                                </Text>
                            </View>
                        </View>

                        {/* Loading khi đang tải bản đồ */}
                        {isMapLoading && (
                            <View
                                style={{
                                    position: 'absolute',
                                    top: 48,
                                    left: 14,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    backgroundColor: isDark ? 'rgba(15,23,42,0.92)' : 'rgba(255,255,255,0.95)',
                                    paddingHorizontal: 10,
                                    paddingVertical: 5,
                                    borderRadius: 10,
                                    borderWidth: 1,
                                    borderColor: colors.border,
                                    gap: 6,
                                    zIndex: 10,
                                    ...shadows.soft,
                                }}
                            >
                                <ActivityIndicator size="small" color={colors.primary} />
                                <Text style={{ fontSize: 10, fontWeight: '700', color: colors.text }}>Đang tải bản đồ...</Text>
                            </View>
                        )}

                        {/* Nút định vị GPS vị trí hiện tại */}
                        <TouchableOpacity
                            onPress={handleLocateOnMap}
                            style={{
                                position: 'absolute',
                                bottom: 20,
                                right: 16,
                                width: 44,
                                height: 44,
                                borderRadius: 22,
                                backgroundColor: colors.surface,
                                borderWidth: 1,
                                borderColor: colors.border,
                                alignItems: 'center',
                                justifyContent: 'center',
                                zIndex: 10,
                                ...shadows.soft,
                            }}
                        >
                            <Crosshair size={22} color={colors.primary} />
                        </TouchableOpacity>

                        {/* Nút Phóng to / Thu nhỏ */}
                        <View
                            style={{
                                position: 'absolute',
                                bottom: 76,
                                right: 16,
                                backgroundColor: isDark ? 'rgba(15,23,42,0.92)' : 'rgba(255,255,255,0.95)',
                                borderRadius: 12,
                                borderWidth: 1,
                                borderColor: colors.border,
                                overflow: 'hidden',
                                zIndex: 10,
                                ...shadows.soft,
                            }}
                        >
                            <TouchableOpacity
                                onPress={zoomInMap}
                                style={{ padding: 10, borderBottomWidth: 1, borderColor: colors.border }}
                            >
                                <ZoomIn size={18} color={colors.text} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={zoomOutMap}
                                style={{ padding: 10 }}
                            >
                                <ZoomOut size={18} color={colors.text} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Bottom Card */}
                    <View
                        style={{
                            padding: 16,
                            paddingBottom: (insets.bottom > 0 ? insets.bottom : 12) + 8,
                            backgroundColor: colors.surface,
                            borderTopWidth: 1,
                            borderColor: colors.border,
                            ...shadows.floating,
                        }}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                            <MapPin size={18} color={colors.primary} />
                            <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textSecondary }}>
                                Địa chỉ tại vị trí ghim
                            </Text>
                            {isPickerResolving && <ActivityIndicator size="small" color={colors.primary} />}
                        </View>

                        <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 12 }} numberOfLines={2}>
                            {pickerAddress || 'Đang xác định địa chỉ...'}
                        </Text>

                        <TouchableOpacity
                            activeOpacity={0.88}
                            onPress={handleConfirmMapPicker}
                            style={{ borderRadius: 14, overflow: 'hidden' }}
                        >
                            <LinearGradient
                                colors={gradients.electric}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={{ paddingVertical: 14, alignItems: 'center', justifyContent: 'center' }}
                            >
                                <Text style={{ fontSize: 15, fontWeight: '800', color: '#ffffff' }}>
                                    Xác nhận vị trí này
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* MODAL MÃ GIẢM GIÁ & ƯU ĐÃI (VOUCHER) */}
            <Modal
                visible={isVoucherModalOpen}
                animationType="slide"
                transparent={false}
                onRequestClose={() => setIsVoucherModalOpen(false)}
                statusBarTranslucent={false}
            >
                <View
                    style={{
                        flex: 1,
                        backgroundColor: colors.background,
                        paddingTop: insets.top,
                    }}
                >
                    {/* Header Modal */}
                    <View
                        style={{
                            height: 54,
                            paddingHorizontal: 16,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            borderBottomWidth: 1,
                            borderColor: colors.border,
                            backgroundColor: colors.surface,
                        }}
                    >
                        <TouchableOpacity
                            onPress={() => setIsVoucherModalOpen(false)}
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

                        <Text style={{ fontSize: 16, fontWeight: '800', color: colors.text }}>
                            Mã ưu đãi & Khuyến mãi
                        </Text>

                        <View style={{ width: 40 }} />
                    </View>

                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ padding: 16, paddingBottom: (insets.bottom > 0 ? insets.bottom : 16) + 20 }}
                    >
                        {/* Ô NHẬP MÃ TAY */}
                        <View
                            style={[
                                {
                                    padding: 14,
                                    borderRadius: 16,
                                    backgroundColor: colors.surface,
                                    borderWidth: 1,
                                    borderColor: isDark ? colors.border : '#e2e8f0',
                                    marginBottom: 20,
                                },
                                shadows.card,
                            ]}
                        >
                            <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: 8 }}>
                                Nhập mã ưu đãi của bạn
                            </Text>
                            <View style={{ flexDirection: 'row', gap: 8 }}>
                                <View
                                    style={{
                                        flex: 1,
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        paddingHorizontal: 12,
                                        paddingVertical: 8,
                                        borderRadius: 12,
                                        backgroundColor: colors.surfaceContainerLow,
                                        borderWidth: 1,
                                        borderColor: colors.border,
                                    }}
                                >
                                    <Tag size={16} color={colors.textSecondary} style={{ marginRight: 8 }} />
                                    <TextInput
                                        value={voucherInputCode}
                                        onChangeText={setVoucherInputCode}
                                        placeholder="Ví dụ: FLASH20K, VESINH30K..."
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

                                <TouchableOpacity
                                    onPress={handleApplyVoucherCode}
                                    style={{
                                        backgroundColor: colors.primary,
                                        paddingHorizontal: 18,
                                        borderRadius: 12,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <Text style={{ fontSize: 13, fontWeight: '800', color: '#ffffff' }}>
                                        Áp dụng
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* DANH SÁCH VOUCHER CÓ SẴN */}
                        <View style={{ marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Text style={{ fontSize: 14, fontWeight: '800', color: colors.text }}>
                                Mã khuyến mãi dành cho bạn
                            </Text>
                            <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                                {AVAILABLE_VOUCHERS.length} mã khả dụng
                            </Text>
                        </View>

                        <View style={{ gap: 12 }}>
                            {AVAILABLE_VOUCHERS.map((v) => {
                                const isCurrentSelected = selectedVoucher?.code === v.code;
                                const isEligible = subtotal === 0 || subtotal >= v.minOrderValue;

                                return (
                                    <View
                                        key={v.code}
                                        style={[
                                            {
                                                borderRadius: 16,
                                                backgroundColor: isCurrentSelected
                                                    ? (isDark ? '#064e3b20' : '#f0fdf4')
                                                    : colors.surface,
                                                borderWidth: 1.5,
                                                borderColor: isCurrentSelected
                                                    ? '#10b981'
                                                    : (isDark ? colors.border : '#e2e8f0'),
                                                padding: 14,
                                                opacity: isEligible ? 1 : 0.65,
                                            },
                                            shadows.card,
                                        ]}
                                    >
                                        <View style={{ flexDirection: 'row', gap: 12 }}>
                                            <View
                                                style={{
                                                    width: 44,
                                                    height: 44,
                                                    borderRadius: 12,
                                                    backgroundColor: isCurrentSelected
                                                        ? '#10b98125'
                                                        : (isDark ? colors.surfaceContainer : '#eff6ff'),
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                }}
                                            >
                                                <Ticket size={22} color={isCurrentSelected ? '#10b981' : colors.primary} />
                                            </View>

                                            <View style={{ flex: 1 }}>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                                    <View
                                                        style={{
                                                            backgroundColor: colors.primary + '18',
                                                            paddingHorizontal: 8,
                                                            paddingVertical: 2,
                                                            borderRadius: 6,
                                                        }}
                                                    >
                                                        <Text style={{ fontSize: 12, fontWeight: '800', color: colors.primary }}>
                                                            {v.code}
                                                        </Text>
                                                    </View>
                                                    {isCurrentSelected && (
                                                        <View style={{ backgroundColor: '#10b981', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                                                            <Text style={{ fontSize: 10, fontWeight: '800', color: '#ffffff' }}>ĐANG CHỌN</Text>
                                                        </View>
                                                    )}
                                                </View>

                                                <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 2 }}>
                                                    {v.title}
                                                </Text>
                                                <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 6 }}>
                                                    {v.description}
                                                </Text>

                                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                                                    <Text style={{ fontSize: 11, color: colors.textSecondary }}>
                                                        {v.expiryText}
                                                    </Text>

                                                    {isCurrentSelected ? (
                                                        <TouchableOpacity
                                                            onPress={handleRemoveVoucher}
                                                            style={{
                                                                paddingHorizontal: 12,
                                                                paddingVertical: 6,
                                                                borderRadius: 8,
                                                                backgroundColor: '#fee2e2',
                                                                borderWidth: 1,
                                                                borderColor: '#fca5a5',
                                                            }}
                                                        >
                                                            <Text style={{ fontSize: 11, fontWeight: '700', color: '#dc2626' }}>
                                                                Bỏ chọn
                                                            </Text>
                                                        </TouchableOpacity>
                                                    ) : isEligible ? (
                                                        <TouchableOpacity
                                                            onPress={() => handleSelectVoucherItem(v)}
                                                            style={{
                                                                paddingHorizontal: 14,
                                                                paddingVertical: 6,
                                                                borderRadius: 8,
                                                                backgroundColor: colors.primary,
                                                            }}
                                                        >
                                                            <Text style={{ fontSize: 11, fontWeight: '800', color: '#ffffff' }}>
                                                                Dùng ngay
                                                            </Text>
                                                        </TouchableOpacity>
                                                    ) : (
                                                        <View
                                                            style={{
                                                                paddingHorizontal: 10,
                                                                paddingVertical: 4,
                                                                borderRadius: 8,
                                                                backgroundColor: colors.surfaceContainer,
                                                            }}
                                                        >
                                                            <Text style={{ fontSize: 10, fontWeight: '600', color: colors.textSecondary }}>
                                                                Đơn từ {v.minOrderValue.toLocaleString('vi-VN')} đ
                                                            </Text>
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

                    {/* Footer Modal */}
                    <View
                        style={{
                            padding: 16,
                            paddingBottom: (insets.bottom > 0 ? insets.bottom : 12) + 8,
                            backgroundColor: colors.surface,
                            borderTopWidth: 1,
                            borderColor: colors.border,
                        }}
                    >
                        <TouchableOpacity
                            onPress={() => setIsVoucherModalOpen(false)}
                            style={{
                                paddingVertical: 12,
                                borderRadius: 12,
                                backgroundColor: colors.surfaceContainer,
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderWidth: 1,
                                borderColor: colors.border,
                            }}
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
