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
    ShieldCheck,
    Package,
    Weight,
    Zap,
    AlertTriangle,
    AlertCircle,
} from 'lucide-react-native';
import { GoongService, GoongPlacePrediction, GOONG_MAPTILES_KEY } from '../../../services/goongService';
import { JobFlashAPI } from '../../../services/apiClient';
import { useAppTheme } from '../../../constants/theme';
import { useI18n } from '../../../i18n';
import GlassBottomBar from '../../../components/GlassBottomBar';

const CATE_ICON = require('../../../../assets/icon-cate/viec-nang.png');

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
        code: 'BOCVAC30K',
        title: 'Trợ giá bốc vác 30.000đ',
        description: 'Áp dụng cho đơn bốc xếp từ 200.000đ',
        discountType: 'fixed',
        discountValue: 30000,
        minOrderValue: 200000,
        expiryText: 'HSD: 25/11/2026',
    },
    {
        code: 'GIAM10',
        title: 'Ưu đãi bốc xếp - Giảm 10%',
        description: 'Giảm 10% tổng đơn, tối đa 50.000đ',
        discountType: 'percent',
        discountValue: 10,
        maxDiscount: 50000,
        minOrderValue: 150000,
        expiryText: 'HSD: 31/12/2026',
    },
    {
        code: 'VIP50K',
        title: 'Giảm 50.000đ đơn hàng lớn',
        description: 'Áp dụng cho đơn bốc dỡ kho từ 500.000đ',
        discountType: 'fixed',
        discountValue: 50000,
        minOrderValue: 500000,
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

// 4 Loại hàng bốc vác (Đã làm rõ từ vựng theo mục 1.4 FormBocVac&ViecNang.md)
export const CARGO_TYPES = [
    { id: 'box', label: 'Thùng hàng' },
    { id: 'material', label: 'Vật liệu' },
    { id: 'furniture', label: 'Nội thất nặng' },
    { id: 'container', label: 'Rút/Đóng hàng Container' },
];

// Khối lượng ước tính
export interface WeightTier {
    id: string;
    label: string;
    baseHours: number;
    minKg: number;
    maxKg: number;
    defaultKg: number;
    rangeText: string;
}

export const WEIGHT_TIERS: WeightTier[] = [
    { id: 'under_500', label: '100-500kg', baseHours: 1, minKg: 100, maxKg: 500, defaultKg: 300, rangeText: 'từ 100 kg đến 500 kg' },
    { id: '500_1000', label: '501kg - 1T', baseHours: 2, minKg: 501, maxKg: 1000, defaultKg: 750, rangeText: 'từ 501 kg đến 1.000 kg' },
    { id: '1000_3000', label: '1.01 - 3 Tấn', baseHours: 3, minKg: 1010, maxKg: 3000, defaultKg: 2000, rangeText: 'từ 1.010 kg đến 3.000 kg' },
    { id: 'over_3000', label: '3.01 - 20 Tấn', baseHours: 5, minKg: 3010, maxKg: 20000, defaultKg: 3500, rangeText: 'từ 3.010 kg đến 20.000 kg' },
];

// Địa hình khuân vác
export const TERRAIN_TYPES = [
    { id: 'flat', label: 'Mặt đất bằng' },
    { id: 'elevator', label: 'Có thang máy' },
    { id: 'stairs', label: 'Lên lầu bộ' },
    { id: 'slope', label: 'Hầm dốc' },
];

// Danh mục đầu việc bốc vác
export const WORK_TASKS = [
    { id: 'unloading_boxes', label: 'Bốc dỡ thùng hàng, kiện carton' },
    { id: 'lifting_materials', label: 'Khuân vác xi măng, gạch, cát đá', isHeavy: true },
    { id: 'moving_furniture', label: 'Khiêng tủ lạnh, máy giặt, đồ gỗ', isHeavy: true },
    { id: 'unloading_truck_container', label: 'Bốc dỡ hàng xe tải / container', isHeavy: true },
    { id: 'warehouse_sorting', label: 'Sắp xếp, đảo kho hàng hóa' },
    { id: 'rubble_cleanup', label: 'Khuân vác xà bần, dọn phế thải', isHeavy: true },
];

export default function ViecNangJobScreen() {
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
    const [warehouseDetail, setWarehouseDetail] = useState('');

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

    // 2. Loại hàng & Khối lượng & Địa hình
    const [selectedCargo, setSelectedCargo] = useState('box');
    const [selectedWeight, setSelectedWeight] = useState('500_1000');
    const [exactWeight, setExactWeight] = useState('750');
    const [selectedTerrain, setSelectedTerrain] = useState('flat');
    const [stairsFloors, setStairsFloors] = useState(1); // Số tầng lầu khi chọn "Lên lầu bộ"

    const currentWeightTier = useMemo(() => {
        return WEIGHT_TIERS.find((w) => w.id === selectedWeight) || WEIGHT_TIERS[1];
    }, [selectedWeight]);

    const parsedExactWeight = useMemo(() => {
        return parseInt(exactWeight.replace(/\D/g, ''), 10) || 0;
    }, [exactWeight]);

    const exactWeightFormatted = useMemo(() => {
        if (!exactWeight) return '';
        const num = parseInt(exactWeight.replace(/\D/g, ''), 10) || 0;
        return num > 0 ? num.toLocaleString('vi-VN') : '';
    }, [exactWeight]);

    const isExactWeightValid = useMemo(() => {
        if (!exactWeight.trim()) return false;
        const num = parseInt(exactWeight.replace(/\D/g, ''), 10) || 0;
        return num >= currentWeightTier.minKg && num <= currentWeightTier.maxKg;
    }, [exactWeight, currentWeightTier]);

    const handleSelectWeightTier = (tierId: string) => {
        setSelectedWeight(tierId);
        const tier = WEIGHT_TIERS.find((w) => w.id === tierId);
        if (tier) {
            const num = parseInt(exactWeight.replace(/\D/g, ''), 10) || 0;
            if (num < tier.minKg || num > tier.maxKg) {
                setExactWeight(tier.defaultKg.toString());
            }
        }
    };

    const handleExactWeightChange = (text: string) => {
        const raw = text.replace(/\D/g, '');
        setExactWeight(raw);
    };

    // 3. Danh mục đầu việc (Mặc định không chọn trước)
    const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
    const [customTaskNote, setCustomTaskNote] = useState('');

    const toggleTask = (taskId: string) => {
        setSelectedTasks((prev) =>
            prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
        );
    };

    // Logic ràng buộc số lượng thợ tối thiểu (An toàn lao động theo FormBocVac&ViecNangBoSung.md)
    const minWorkersRequired = useMemo(() => {
        let minW = 1;

        // 1. Dựa theo Loại hàng bốc dỡ: Nội thất nặng -> tối thiểu 2 thợ
        if (selectedCargo === 'furniture') {
            minW = Math.max(minW, 2);
        }

        // 2. Dựa theo Khối lượng ước tính: 1.01 - 3 Tấn -> 2 thợ, 3.01 - 20 Tấn -> 4 thợ
        if (selectedWeight === '1000_3000') {
            minW = Math.max(minW, 2);
        } else if (selectedWeight === 'over_3000') {
            minW = Math.max(minW, 4);
        }

        // 3. Dựa theo Địa hình Lên lầu bộ & Khối lượng > 500kg: Tầng >= 3 -> tối thiểu 2 thợ
        const isOver500kg = selectedWeight !== 'under_500';
        if (selectedTerrain === 'stairs' && stairsFloors >= 3 && isOver500kg) {
            minW = Math.max(minW, 2);
        }

        return minW;
    }, [selectedCargo, selectedWeight, selectedTerrain, stairsFloors]);

    // Diễn giải lý do cảnh báo an toàn lao động
    const safetyWarningReason = useMemo(() => {
        if (selectedWeight === 'over_3000') {
            return 'Khối lượng 3.01 - 20 Tấn bắt buộc tối thiểu 4 thợ để đảm bảo tiến độ và an toàn lao động.';
        }
        const isOver500kg = selectedWeight !== 'under_500';
        if (selectedTerrain === 'stairs' && stairsFloors >= 3 && isOver500kg) {
            return 'Khuân vác nặng lên từ lầu 3 trở lên cần tối thiểu 2 thợ để hỗ trợ đổi tay và đảm bảo an toàn.';
        }
        if (selectedCargo === 'furniture' && selectedWeight === '1000_3000') {
            return 'Nội thất nặng và khối lượng 1.01 - 3 Tấn cần tối thiểu 2 thợ để khiêng vác an toàn.';
        }
        if (selectedCargo === 'furniture') {
            return 'Nội thất nặng (tủ lạnh, giường tủ, két sắt...) cần tối thiểu 2 thợ để khiêng đỡ an toàn.';
        }
        if (selectedWeight === '1000_3000') {
            return 'Khối lượng 1.01 - 3 Tấn cần tối thiểu 2 thợ để đảm bảo an toàn lao động.';
        }
        return '';
    }, [selectedCargo, selectedWeight, selectedTerrain, stairsFloors]);

    // 4. Hình thức thuê & Tiền công (MẶC ĐỊNH THỜI LƯỢNG VÀ SỐ THỢ LÀ 1, TỰ ĐỘNG KHÓA TỐI THIỂU NẾU HÀNG NẶNG)
    const [pricingMode, setPricingMode] = useState<'hourly' | 'fixed'>('hourly');
    const [hours, setHours] = useState(1);
    const [workersCount, setWorkersCount] = useState(1);
    const [hourlyWage, setHourlyWage] = useState('100.000'); // Khách tự điều chỉnh
    const [fixedPrice, setFixedPrice] = useState('250.000');

    // Tự động nâng số lượng thợ lên mức tối thiểu an toàn khi người dùng chọn thuộc tính hạng nặng / lầu cao
    useEffect(() => {
        if (workersCount < minWorkersRequired) {
            setWorkersCount(minWorkersRequired);
        }
    }, [minWorkersRequired, workersCount]);

    // 5. Trang bị hỗ trợ & Ghi chú (Đã tách rõ ràng theo mục 1.3 & 2 FormBocVac&ViecNang.md)
    const [needBelts, setNeedBelts] = useState(false); // Dây đai & găng tay bảo hộ (false: Có sẵn, true: Thợ mang +20k)
    const [needTrolley, setNeedTrolley] = useState(false); // Xe kéo / Xe đẩy hàng (false: Có sẵn, true: Thợ mang +30k)
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

    // THUẬT TOÁN GỢI Ý MỨC TIỀN HỢP LÝ THEO KHỐI LƯỢNG VÀ ĐỊA HÌNH
    const suggestedRecommendation = useMemo(() => {
        let baseH = 1;
        if (selectedWeight === 'under_500') baseH = 1;
        else if (selectedWeight === '500_1000') baseH = 2;
        else if (selectedWeight === '1000_3000') baseH = 3;
        else if (selectedWeight === 'over_3000') baseH = 5;

        // Địa hình: Lên lầu bộ tính theo số tầng lầu (mỗi tầng +0.3h), hầm dốc +0.5h
        let terrainExtra = 0;
        if (selectedTerrain === 'stairs') {
            terrainExtra = Math.min(3, 0.3 * stairsFloors);
        } else if (selectedTerrain === 'slope') {
            terrainExtra = 0.5;
        }

        // Hàng container hoặc vật liệu nặng:
        let cargoExtra = 0;
        if (selectedCargo === 'container') cargoExtra = 1.0;
        if (selectedCargo === 'material') cargoExtra = 0.5;
        if (selectedCargo === 'furniture') cargoExtra = 0.5;

        const rawHours = baseH + terrainExtra + cargoExtra;
        const recHours = Math.max(1, Math.min(8, Math.round(rawHours * 2) / 2));
        const recHourlyWage = 100000;
        const recHourlyTotal = recHours * recHourlyWage * workersCount;
        const recFixed = Math.round(recHourlyTotal / 10000) * 10000;

        return {
            hours: recHours,
            hourlyWageFormatted: '100.000',
            hourlyTotalFormatted: recHourlyTotal.toLocaleString('vi-VN'),
            fixedPrice: Math.max(150000, recFixed),
            fixedPriceFormatted: Math.max(150000, recFixed).toLocaleString('vi-VN'),
        };
    }, [selectedWeight, selectedTerrain, stairsFloors, selectedCargo, selectedTasks, workersCount]);

    // Các chip gợi ý giá khoán tự động cập nhật
    const dynamicFixedChips = useMemo(() => {
        const center = suggestedRecommendation.fixedPrice;
        const c1 = Math.max(120000, center - 60000);
        const c2 = center;
        const c3 = center + 80000;
        const c4 = center + 150000;
        return [c1, c2, c3, c4].map((v) => v.toLocaleString('vi-VN'));
    }, [suggestedRecommendation.fixedPrice]);

    const handleApplySuggestedPrice = () => {
        if (pricingMode === 'hourly') {
            setHours(suggestedRecommendation.hours);
            setHourlyWage('100.000');
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
            webViewRef.current.injectJavaScript(`if (window.map) { window.map.zoomIn(); } true;`);
        }
    };

    const zoomOutMap = () => {
        if (webViewRef.current) {
            webViewRef.current.injectJavaScript(`if (window.map) { window.map.zoomOut(); } true;`);
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
        <svg width="44" height="44" viewBox="0 0 24 24" fill="#f59e0b" stroke="#ffffff" stroke-width="1.8">
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
    const beltsFee = needBelts ? 20000 : 0;
    const trolleyFee = needTrolley ? 30000 : 0;
    const equipmentFee = beltsFee + trolleyFee;

    const baseWage =
        pricingMode === 'hourly'
            ? Math.round(hours * workersCount * parsedHourlyWage)
            : parsedFixedPrice;

    const subtotal = baseWage + equipmentFee;
    const voucherDiscount = selectedVoucher ? calculateVoucherDiscount(selectedVoucher, subtotal) : 0;
    const grandTotal = Math.max(0, subtotal - voucherDiscount);

    // Kiểm tra xem đã điền đầy đủ các mục cần nhập và chọn hay chưa
    const isFormComplete = useMemo(() => {
        if (!address.trim()) return false;
        if (selectedTasks.length === 0 && !customTaskNote.trim() && !specialNotes.trim()) return false;
        if (!exactWeight.trim() || !isExactWeightValid) return false;
        if (workersCount < minWorkersRequired) return false;
        if (pricingMode === 'hourly' && parsedHourlyWage <= 0) return false;
        if (pricingMode === 'fixed' && parsedFixedPrice <= 0) return false;
        return true;
    }, [address, selectedTasks, customTaskNote, specialNotes, exactWeight, isExactWeightValid, workersCount, minWorkersRequired, pricingMode, parsedHourlyWage, parsedFixedPrice]);

    // Xử lý Voucher
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

    // Đăng việc bốc vác hỏa tốc (Tự động gán booking_time & chuyển sang Radar tìm thợ)
    const handleSubmit = async () => {
        if (!address.trim()) {
            Alert.alert(t('common.error'), 'Vui lòng nhập hoặc chọn địa chỉ kho bãi/công trình.');
            return;
        }
        if (selectedTasks.length === 0 && !customTaskNote.trim() && !specialNotes.trim()) {
            Alert.alert(t('common.error'), 'Vui lòng chọn ít nhất 1 đầu việc hoặc viết ghi chú mô tả công việc.');
            return;
        }
        if (!exactWeight.trim() || !isExactWeightValid) {
            Alert.alert(
                t('common.error'),
                `Vui lòng nhập khối lượng cụ thể hợp lệ (${currentWeightTier.rangeText}).`
            );
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
        if (workersCount < minWorkersRequired) {
            Alert.alert(
                'Yêu cầu an toàn lao động',
                `Với tính chất công việc hiện tại, hệ thống yêu cầu tối thiểu ${minWorkersRequired} thợ để đảm bảo an toàn lao động.`
            );
            return;
        }

        const cargoObj = CARGO_TYPES.find((c) => c.id === selectedCargo);
        const weightObj = WEIGHT_TIERS.find((w) => w.id === selectedWeight);
        const terrainObj = TERRAIN_TYPES.find((t) => t.id === selectedTerrain);

        const currentBookingTime = new Date().toISOString();

        const jobPayload = {
            category: 'viec-nang',
            title: `Thuê thợ bốc vác & việc nặng (${cargoObj?.label || 'Hàng hóa'})`,
            address,
            warehouseDetail,
            latitude: coords?.lat || 10.7769,
            longitude: coords?.lng || 106.7009,
            cargoType: selectedCargo,
            cargoLabel: cargoObj?.label,
            weightTier: selectedWeight,
            weightLabel: weightObj?.label,
            exactWeightKg: parsedExactWeight,
            terrainType: selectedTerrain,
            terrainLabel: terrainObj?.label,
            stairsFloors: selectedTerrain === 'stairs' ? stairsFloors : undefined,
            selectedTasks,
            customTaskNote,
            pricingMode,
            hours: pricingMode === 'hourly' ? hours : undefined,
            workersCount,
            hourlyWage: parsedHourlyWage,
            fixedPrice: parsedFixedPrice,
            needBelts,
            needTrolley,
            specialNotes,
            voucherCode: selectedVoucher?.code,
            discountAmount: voucherDiscount,
            totalAmount: grandTotal,
            booking_time: currentBookingTime,
        };

        try {
            await JobFlashAPI.jobs.createJob(jobPayload).catch((err) => {
                console.log('[ViecNang] Local fallback: job created', err?.message);
            });
        } catch {
            // Tiếp tục
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
                            Bốc Vác & Việc Nặng
                        </Text>
                    </View>

                    <View style={{ width: 40 }} />
                </View>

                <ScrollView
                    contentContainerStyle={{ padding: 16, paddingBottom: 110 }}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* KHỐI 1: ĐỊA ĐIỂM KHO BÃI / CÔNG TRÌNH */}
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
                                Địa điểm bốc xếp
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
                                placeholder="Nhập địa chỉ kho bãi, số nhà, ngõ hẻm..."
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
                                Số kho, cửa dỡ hàng, vị trí cụ thể (nếu có)
                            </Text>
                            <TextInput
                                value={warehouseDetail}
                                onChangeText={setWarehouseDetail}
                                placeholder="Ví dụ: Kho A3, Cửa số 2, Cảng Cát Lái..."
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

                    {/* KHỐI 2: LOẠI HÀNG, KHỐI LƯỢNG & ĐỊA HÌNH (GỌN GÀNG) */}
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
                            <Package size={16} color={colors.primary} />
                            <Text style={{ fontSize: 14, fontWeight: '800', color: colors.text }}>
                                Đặc tính hàng hóa
                            </Text>
                        </View>

                        {/* 4 Loại hàng */}
                        <Text style={{ fontSize: 12, fontWeight: '700', color: colors.text, marginBottom: 6 }}>
                            Loại hàng bốc dỡ
                        </Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                            {CARGO_TYPES.map((c) => {
                                const isSelected = selectedCargo === c.id;
                                return (
                                    <TouchableOpacity
                                        key={c.id}
                                        onPress={() => setSelectedCargo(c.id)}
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
                                        <Text
                                            style={{
                                                fontSize: 12.5,
                                                fontWeight: '800',
                                                color: isSelected ? colors.primary : colors.text,
                                                textAlign: 'center',
                                            }}
                                            numberOfLines={1}
                                        >
                                            {c.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        {/* Khối lượng ước tính */}
                        <Text style={{ fontSize: 12, fontWeight: '700', color: colors.text, marginBottom: 6 }}>
                            Khối lượng ước tính
                        </Text>
                        <View style={{ flexDirection: 'row', gap: 6, marginBottom: 12 }}>
                            {WEIGHT_TIERS.map((w) => {
                                const isSelected = selectedWeight === w.id;
                                return (
                                    <TouchableOpacity
                                        key={w.id}
                                        onPress={() => handleSelectWeightTier(w.id)}
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
                                        <Text
                                            style={{ fontSize: 11, fontWeight: '800', color: isSelected ? colors.primary : colors.text }}
                                            numberOfLines={1}
                                            adjustsFontSizeToFit
                                        >
                                            {w.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        {/* Input cụ thể khối lượng */}
                        <View style={{ marginBottom: 14 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                                <Text style={{ fontSize: 12, fontWeight: '700', color: colors.text }}>
                                    Khối lượng cụ thể ({currentWeightTier.rangeText})
                                </Text>
                                {isExactWeightValid && (
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: isDark ? '#064e3b30' : '#dcfce7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                                        <Check size={12} color="#10b981" strokeWidth={3} />
                                        <Text style={{ fontSize: 11, fontWeight: '700', color: '#059669' }}>Hợp lệ</Text>
                                    </View>
                                )}
                            </View>

                            <View
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    borderWidth: 1.5,
                                    borderColor: !isExactWeightValid && exactWeight.length > 0
                                        ? '#ef4444'
                                        : isExactWeightValid
                                            ? '#10b981'
                                            : colors.border,
                                    borderRadius: 12,
                                    backgroundColor: colors.surfaceContainerLow,
                                    paddingHorizontal: 12,
                                    height: 48,
                                }}
                            >
                                <Weight size={18} color={isExactWeightValid ? '#10b981' : colors.textSecondary} style={{ marginRight: 8 }} />
                                <TextInput
                                    style={{
                                        flex: 1,
                                        fontSize: 15,
                                        fontWeight: '700',
                                        color: colors.text,
                                        paddingVertical: 0,
                                    }}
                                    keyboardType="numeric"
                                    value={exactWeightFormatted}
                                    onChangeText={handleExactWeightChange}
                                    placeholder={`Ví dụ: ${currentWeightTier.defaultKg.toLocaleString('vi-VN')}`}
                                    placeholderTextColor={colors.textSecondary}
                                />
                                <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textSecondary, marginLeft: 8 }}>
                                    kg
                                </Text>
                            </View>

                            {!isExactWeightValid && exactWeight.length > 0 && (
                                <Text style={{ fontSize: 11.5, color: '#ef4444', fontWeight: '600', marginTop: 4 }}>
                                    ⚠️ Khối lượng phải nằm trong khoảng {currentWeightTier.rangeText}.
                                </Text>
                            )}
                            {exactWeight.length === 0 && (
                                <Text style={{ fontSize: 11.5, color: '#ef4444', fontWeight: '600', marginTop: 4 }}>
                                    ⚠️ Vui lòng nhập khối lượng cụ thể ({currentWeightTier.rangeText}).
                                </Text>
                            )}
                        </View>

                        {/* Địa hình khuân vác */}
                        <Text style={{ fontSize: 12, fontWeight: '700', color: colors.text, marginBottom: 6 }}>
                            Địa hình khuân vác
                        </Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                            {TERRAIN_TYPES.map((t) => {
                                const isSelected = selectedTerrain === t.id;
                                return (
                                    <TouchableOpacity
                                        key={t.id}
                                        onPress={() => setSelectedTerrain(t.id)}
                                        style={{
                                            width: '48.5%',
                                            paddingVertical: 8,
                                            paddingHorizontal: 6,
                                            borderRadius: 10,
                                            alignItems: 'center',
                                            borderWidth: 1.5,
                                            borderColor: isSelected ? colors.primary : colors.border,
                                            backgroundColor: isSelected ? colors.primary + '12' : colors.surfaceContainerLow,
                                        }}
                                    >
                                        <Text style={{ fontSize: 12, fontWeight: '700', color: isSelected ? colors.primary : colors.text }}>
                                            {t.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        {/* DYNAMIC STEPPER SỐ TẦNG LẦU KHI CHỌN LÊN LẦU BỘ THEO MỤC 2 FormBocVac&ViecNangBoSung.md */}
                        {selectedTerrain === 'stairs' && (
                            <View style={{ marginTop: 10, gap: 8 }}>
                                <View
                                    style={{
                                        padding: 12,
                                        borderRadius: 12,
                                        backgroundColor: isDark ? '#1e3a8a25' : '#eff6ff',
                                        borderWidth: 1.5,
                                        borderColor: isDark ? '#3b82f6' : '#bfdbfe',
                                        flexDirection: 'row',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                    }}
                                >
                                    <View>
                                        <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text }}>
                                            Số tầng lầu: [ {stairsFloors} ]
                                        </Text>
                                        <Text style={{ fontSize: 11, color: colors.textSecondary }}>
                                            Tầng càng cao công sức thợ càng lớn
                                        </Text>
                                    </View>

                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                        <TouchableOpacity
                                            onPress={() => setStairsFloors((p) => Math.max(1, p - 1))}
                                            disabled={stairsFloors <= 1}
                                            style={{
                                                width: 32,
                                                height: 32,
                                                borderRadius: 16,
                                                backgroundColor: stairsFloors <= 1 ? (isDark ? '#33415550' : '#f1f5f9') : colors.surface,
                                                borderWidth: 1,
                                                borderColor: colors.border,
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                opacity: stairsFloors <= 1 ? 0.35 : 1,
                                            }}
                                        >
                                            <Minus size={14} color={colors.text} />
                                        </TouchableOpacity>
                                        <Text style={{ fontSize: 15, fontWeight: '800', color: colors.primary, minWidth: 44, textAlign: 'center' }}>
                                            Lầu {stairsFloors}
                                        </Text>
                                        <TouchableOpacity
                                            onPress={() => setStairsFloors((p) => Math.min(10, p + 1))}
                                            style={{
                                                width: 32,
                                                height: 32,
                                                borderRadius: 16,
                                                backgroundColor: colors.surface,
                                                borderWidth: 1,
                                                borderColor: colors.border,
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            <Plus size={14} color={colors.text} />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                {/* Cảnh báo an toàn khi vác nặng > 500kg lên từ lầu 3 trở lên */}
                                {stairsFloors >= 3 && selectedWeight !== 'under_500' && (
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
                                            gap: 8,
                                        }}
                                    >
                                        <AlertTriangle size={15} color="#d97706" />
                                        <Text style={{ fontSize: 11.5, color: '#b45309', fontWeight: '600', flex: 1, lineHeight: 16 }}>
                                            Khuân vác nặng lên từ lầu 3 trở lên cần tối thiểu 2 thợ để hỗ trợ đổi tay và đảm bảo an toàn.
                                        </Text>
                                    </View>
                                )}
                            </View>
                        )}
                    </View>

                    {/* KHỐI 3: DANH MỤC ĐẦU VIỆC BỐC VÁC */}
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
                                Đầu việc cần làm ({selectedTasks.length})
                            </Text>
                            <TouchableOpacity
                                onPress={() => {
                                    if (selectedTasks.length === WORK_TASKS.length) setSelectedTasks([]);
                                    else setSelectedTasks(WORK_TASKS.map((t) => t.id));
                                }}
                            >
                                <Text style={{ fontSize: 11, fontWeight: '700', color: colors.primary }}>
                                    {selectedTasks.length === WORK_TASKS.length ? 'Bỏ chọn hết' : 'Chọn tất cả'}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <View style={{ gap: 7, marginTop: 4 }}>
                            {WORK_TASKS.map((item) => {
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
                                Ghi chú thêm về hàng hóa:
                            </Text>
                            <TextInput
                                value={customTaskNote}
                                onChangeText={setCustomTaskNote}
                                placeholder="Ghi chú thêm về hàng nặng, máy móc..."
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

                        {/* KHUNG GỢI Ý MỨC TIỀN HỢP LÝ */}
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
                                style={{ backgroundColor: '#10b981', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}
                            >
                                <Text style={{ fontSize: 11, fontWeight: '800', color: '#ffffff' }}>Áp dụng</Text>
                            </TouchableOpacity>
                        </View>

                        {pricingMode === 'hourly' ? (
                            <View style={{ gap: 14 }}>
                                {/* Số giờ làm việc (MẶC ĐỊNH LÀ 1) */}
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <View>
                                        <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text }}>Thời lượng làm việc</Text>
                                        <Text style={{ fontSize: 11, color: colors.textSecondary }}>Mặc định 1 giờ</Text>
                                    </View>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                        <TouchableOpacity
                                            onPress={() => setHours((prev) => Math.max(1, prev - 0.5))}
                                            style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceContainer, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }}
                                        >
                                            <Minus size={16} color={colors.text} />
                                        </TouchableOpacity>
                                        <Text style={{ fontSize: 16, fontWeight: '800', color: colors.primary, minWidth: 36, textAlign: 'center' }}>
                                            {hours}h
                                        </Text>
                                        <TouchableOpacity
                                            onPress={() => setHours((prev) => Math.min(8, prev + 0.5))}
                                            style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceContainer, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }}
                                        >
                                            <Plus size={16} color={colors.text} />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                {/* Số lượng thợ (MẶC ĐỊNH LÀ 1, TỰ ĐỘNG KHÓA THEO MỤC 1 & 2 FormBocVac&ViecNangBoSung.md) */}
                                <View>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <View>
                                            <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text }}>Số lượng thợ</Text>
                                            <Text style={{ fontSize: 11, color: colors.textSecondary }}>
                                                {minWorkersRequired > 1 ? `Tối thiểu ${minWorkersRequired} người (an toàn)` : 'Mặc định 1 người'}
                                            </Text>
                                        </View>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                            <TouchableOpacity
                                                disabled={workersCount <= minWorkersRequired}
                                                onPress={() => setWorkersCount((prev) => Math.max(minWorkersRequired, prev - 1))}
                                                style={{
                                                    width: 36,
                                                    height: 36,
                                                    borderRadius: 18,
                                                    backgroundColor: workersCount <= minWorkersRequired ? (isDark ? '#33415550' : '#f1f5f9') : colors.surfaceContainer,
                                                    borderWidth: 1,
                                                    borderColor: colors.border,
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    opacity: workersCount <= minWorkersRequired ? 0.35 : 1,
                                                }}
                                            >
                                                <Minus size={16} color={colors.text} />
                                            </TouchableOpacity>
                                            <Text style={{ fontSize: 16, fontWeight: '800', color: colors.primary, minWidth: 26, textAlign: 'center' }}>
                                                {workersCount}
                                            </Text>
                                            <TouchableOpacity
                                                onPress={() => setWorkersCount((prev) => Math.min(8, prev + 1))}
                                                style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceContainer, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }}
                                            >
                                                <Plus size={16} color={colors.text} />
                                            </TouchableOpacity>
                                        </View>
                                    </View>

                                    {/* Dòng ghi chú nhỏ cảnh báo an toàn lao động khi hàng nặng / lầu cao */}
                                    {minWorkersRequired > 1 && !!safetyWarningReason && (
                                        <View
                                            style={{
                                                flexDirection: 'row',
                                                alignItems: 'center',
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
                                            <AlertTriangle size={14} color="#d97706" />
                                            <Text style={{ fontSize: 11.5, color: '#b45309', fontWeight: '600', flex: 1, lineHeight: 16 }}>
                                                {safetyWarningReason}
                                            </Text>
                                        </View>
                                    )}
                                </View>

                                {/* Tiền công theo giờ */}
                                <View style={{ paddingTop: 10, borderTopWidth: 1, borderColor: colors.border }}>
                                    <Text style={{ fontSize: 12, fontWeight: '700', color: colors.text, marginBottom: 6 }}>
                                        Tiền công đề xuất (VNĐ / giờ / người)
                                    </Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 9, borderRadius: 12, backgroundColor: colors.surfaceContainerLow, borderWidth: 1, borderColor: colors.border, marginBottom: 8 }}>
                                        <TextInput
                                            value={hourlyWage}
                                            onChangeText={handleHourlyWageChange}
                                            keyboardType="numeric"
                                            placeholder="100.000"
                                            placeholderTextColor={colors.placeholder}
                                            style={{ flex: 1, fontSize: 16, fontWeight: '800', color: colors.primary }}
                                        />
                                        <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textSecondary }}>VNĐ / người / h</Text>
                                    </View>
                                    <View style={{ flexDirection: 'row', gap: 6 }}>
                                        {['80.000', '100.000', '120.000', '150.000'].map((val) => (
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
                            <View style={{ gap: 14 }}>
                                {/* Số lượng thợ (cho thuê việc trọn gói) */}
                                <View>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <View>
                                            <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text }}>Số lượng thợ</Text>
                                            <Text style={{ fontSize: 11, color: colors.textSecondary }}>
                                                {minWorkersRequired > 1 ? `Tối thiểu ${minWorkersRequired} người (an toàn)` : 'Mặc định 1 người'}
                                            </Text>
                                        </View>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                            <TouchableOpacity
                                                disabled={workersCount <= minWorkersRequired}
                                                onPress={() => setWorkersCount((prev) => Math.max(minWorkersRequired, prev - 1))}
                                                style={{
                                                    width: 36,
                                                    height: 36,
                                                    borderRadius: 18,
                                                    backgroundColor: workersCount <= minWorkersRequired ? (isDark ? '#33415550' : '#f1f5f9') : colors.surfaceContainer,
                                                    borderWidth: 1,
                                                    borderColor: colors.border,
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    opacity: workersCount <= minWorkersRequired ? 0.35 : 1,
                                                }}
                                            >
                                                <Minus size={16} color={colors.text} />
                                            </TouchableOpacity>
                                            <Text style={{ fontSize: 16, fontWeight: '800', color: colors.primary, minWidth: 26, textAlign: 'center' }}>
                                                {workersCount}
                                            </Text>
                                            <TouchableOpacity
                                                onPress={() => setWorkersCount((prev) => Math.min(8, prev + 1))}
                                                style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceContainer, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }}
                                            >
                                                <Plus size={16} color={colors.text} />
                                            </TouchableOpacity>
                                        </View>
                                    </View>

                                    {/* Cảnh báo an toàn lao động trong chế độ khoán */}
                                    {minWorkersRequired > 1 && !!safetyWarningReason && (
                                        <View
                                            style={{
                                                flexDirection: 'row',
                                                alignItems: 'center',
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
                                            <AlertTriangle size={14} color="#d97706" />
                                            <Text style={{ fontSize: 11.5, color: '#b45309', fontWeight: '600', flex: 1, lineHeight: 16 }}>
                                                {safetyWarningReason}
                                            </Text>
                                        </View>
                                    )}
                                </View>

                                <View style={{ paddingTop: 10, borderTopWidth: 1, borderColor: colors.border }}>
                                    <Text style={{ fontSize: 12, fontWeight: '700', color: colors.text, marginBottom: 6 }}>
                                        Số tiền thuê trọn gói mong muốn:
                                    </Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, backgroundColor: colors.surfaceContainerLow, borderWidth: 1, borderColor: colors.border }}>
                                        <TextInput
                                            value={fixedPrice}
                                            onChangeText={handleFixedPriceChange}
                                            keyboardType="numeric"
                                            placeholder="250.000"
                                            placeholderTextColor={colors.placeholder}
                                            style={{ flex: 1, fontSize: 18, fontWeight: '900', color: colors.primary }}
                                        />
                                        <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textSecondary }}>VNĐ trọn gói</Text>
                                    </View>

                                    {/* Các mức giá khoán gợi ý linh hoạt */}
                                    <View style={{ flexDirection: 'row', gap: 6, marginTop: 8 }}>
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
                            </View>
                        )}
                    </View>

                    {/* KHỐI 5: TRANG BỊ & YÊU CẦU THỢ */}
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
                                Trang bị & Yêu cầu thợ
                            </Text>
                        </View>

                        {/* 5.1 Dây đai & Găng tay bảo hộ (2 lựa chọn rõ ràng theo mục 2 FormBocVac&ViecNang.md) */}
                        <View style={{ marginBottom: 14 }}>
                            <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: 4 }}>
                                Dây đai & Găng tay bảo hộ
                            </Text>
                            <Text style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 8 }}>
                                Đai khiêng đồ trợ lực tải trọng, găng tay hạt bám chống trượt
                            </Text>
                            <View style={{ flexDirection: 'row', gap: 8 }}>
                                <TouchableOpacity
                                    onPress={() => setNeedBelts(false)}
                                    activeOpacity={0.75}
                                    style={{
                                        flex: 1,
                                        paddingVertical: 10,
                                        paddingHorizontal: 8,
                                        borderRadius: 12,
                                        borderWidth: 1.5,
                                        borderColor: !needBelts ? colors.primary : colors.border,
                                        backgroundColor: !needBelts ? colors.primary + '12' : colors.surfaceContainerLow,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <Text
                                        style={{
                                            fontSize: 12,
                                            fontWeight: !needBelts ? '800' : '600',
                                            color: !needBelts ? colors.primary : colors.text,
                                            textAlign: 'center',
                                        }}
                                    >
                                        Tôi đã có sẵn đồ bảo hộ
                                    </Text>
                                    <Text
                                        style={{
                                            fontSize: 11,
                                            fontWeight: '700',
                                            color: !needBelts ? colors.primary : '#16a34a',
                                            marginTop: 2,
                                        }}
                                    >
                                        (Miễn phí)
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={() => setNeedBelts(true)}
                                    activeOpacity={0.75}
                                    style={{
                                        flex: 1,
                                        paddingVertical: 10,
                                        paddingHorizontal: 8,
                                        borderRadius: 12,
                                        borderWidth: 1.5,
                                        borderColor: needBelts ? colors.primary : colors.border,
                                        backgroundColor: needBelts ? colors.primary + '12' : colors.surfaceContainerLow,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <Text
                                        style={{
                                            fontSize: 12,
                                            fontWeight: needBelts ? '800' : '600',
                                            color: needBelts ? colors.primary : colors.text,
                                            textAlign: 'center',
                                        }}
                                    >
                                        Yêu cầu thợ mang theo
                                    </Text>
                                    <Text
                                        style={{
                                            fontSize: 11,
                                            fontWeight: '700',
                                            color: needBelts ? colors.primary : colors.textSecondary,
                                            marginTop: 2,
                                        }}
                                    >
                                        (+20.000đ)
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* 5.2 Xe kéo / Xe đẩy hàng (Trang bị thiết yếu theo mục 3 FormBocVac&ViecNangBoSung.md) */}
                        <View style={{ paddingTop: 10, borderTopWidth: 1, borderColor: colors.border, marginBottom: 14 }}>
                            <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: 4 }}>
                                Xe kéo / Xe đẩy hàng
                            </Text>
                            <Text style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 8 }}>
                                Hỗ trợ đẩy hàng kiện, thùng nặng di chuyển nhanh không tốn sức
                            </Text>
                            <View style={{ flexDirection: 'row', gap: 8 }}>
                                <TouchableOpacity
                                    onPress={() => setNeedTrolley(false)}
                                    activeOpacity={0.75}
                                    style={{
                                        flex: 1,
                                        paddingVertical: 10,
                                        paddingHorizontal: 8,
                                        borderRadius: 12,
                                        borderWidth: 1.5,
                                        borderColor: !needTrolley ? colors.primary : colors.border,
                                        backgroundColor: !needTrolley ? colors.primary + '12' : colors.surfaceContainerLow,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <Text
                                        style={{
                                            fontSize: 12,
                                            fontWeight: !needTrolley ? '800' : '600',
                                            color: !needTrolley ? colors.primary : colors.text,
                                            textAlign: 'center',
                                        }}
                                    >
                                        Tôi có sẵn xe kéo/đẩy
                                    </Text>
                                    <Text
                                        style={{
                                            fontSize: 11,
                                            fontWeight: '700',
                                            color: !needTrolley ? colors.primary : '#16a34a',
                                            marginTop: 2,
                                        }}
                                    >
                                        (Miễn phí)
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={() => setNeedTrolley(true)}
                                    activeOpacity={0.75}
                                    style={{
                                        flex: 1,
                                        paddingVertical: 10,
                                        paddingHorizontal: 8,
                                        borderRadius: 12,
                                        borderWidth: 1.5,
                                        borderColor: needTrolley ? colors.primary : colors.border,
                                        backgroundColor: needTrolley ? colors.primary + '12' : colors.surfaceContainerLow,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <Text
                                        style={{
                                            fontSize: 12,
                                            fontWeight: needTrolley ? '800' : '600',
                                            color: needTrolley ? colors.primary : colors.text,
                                            textAlign: 'center',
                                        }}
                                    >
                                        Yêu cầu thợ mang xe kéo/đẩy
                                    </Text>
                                    <Text
                                        style={{
                                            fontSize: 11,
                                            fontWeight: '700',
                                            color: needTrolley ? colors.primary : colors.textSecondary,
                                            marginTop: 2,
                                        }}
                                    >
                                        (+30.000đ)
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Ghi chú thêm */}
                        <View style={{ paddingTop: 10, borderTopWidth: 1, borderColor: colors.border }}>
                            <Text style={{ fontSize: 12, fontWeight: '700', color: colors.text, marginBottom: 5 }}>
                                Ghi chú thêm cho thợ:
                            </Text>
                            <TextInput
                                value={specialNotes}
                                onChangeText={setSpecialNotes}
                                placeholder="Ví dụ: Xe nâng hàng, cần 2 người khiêng máy phát điện..."
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
                                {isFormComplete ? 'Tổng tiền công ước tính' : 'Vui lòng hoàn tất thông tin'}
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
                                    <Clock size={13} color={colors.primary} />
                                    <Text style={{ fontSize: 12, fontWeight: '700', color: colors.text }}>
                                        {pricingMode === 'hourly'
                                            ? `Công thợ: ${baseWage.toLocaleString('vi-VN')} đ (${hours}h)`
                                            : `Thuê trọn gói: ${baseWage.toLocaleString('vi-VN')} đ`}
                                    </Text>
                                </View>

                                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: colors.border, gap: 6 }}>
                                    <Weight size={13} color={colors.primary} />
                                    <Text style={{ fontSize: 12, fontWeight: '700', color: colors.text }}>
                                        Khối lượng: {parsedExactWeight > 0 ? parsedExactWeight.toLocaleString('vi-VN') : '0'} kg
                                    </Text>
                                </View>

                                {needBelts && (
                                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: colors.border, gap: 6 }}>
                                        <ShieldCheck size={13} color={colors.secondary} />
                                        <Text style={{ fontSize: 12, fontWeight: '700', color: colors.text }}>
                                            Bảo hộ: 20.000 đ
                                        </Text>
                                    </View>
                                )}

                                {needTrolley && (
                                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: colors.border, gap: 6 }}>
                                        <ShieldCheck size={13} color={colors.primary} />
                                        <Text style={{ fontSize: 12, fontWeight: '700', color: colors.text }}>
                                            Xe đẩy: 30.000 đ
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
                                    Vui lòng nhập địa chỉ, khối lượng và chọn đầu việc để tính giá
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
                                    Tìm thợ bốc vác ngay
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
                        <Text style={{ fontSize: 16, fontWeight: '800', color: colors.text }}>Chọn địa điểm bốc xếp</Text>
                        <View style={{ width: 40 }} />
                    </View>

                    <View style={{ padding: 12, backgroundColor: colors.surface, borderBottomWidth: 1, borderColor: colors.border }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceContainerLow, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 8, borderWidth: 1, borderColor: colors.border }}>
                            <Search size={16} color={colors.textSecondary} style={{ marginRight: 8 }} />
                            <TextInput
                                value={pickerSearchText}
                                onChangeText={handlePickerSearchText}
                                placeholder="Gõ tên kho bãi, đường để nhảy tới..."
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
                                { name: 'Cảng Cát Lái', lat: 10.7583, lng: 106.7865 },
                                { name: 'Khu CN Tân Bình', lat: 10.8252, lng: 106.6231 },
                                { name: 'Chợ Đầu Mối Thủ Đức', lat: 10.8687, lng: 106.7381 },
                                { name: 'Bến Xe Miền Đông', lat: 10.8164, lng: 106.7118 },
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
                                        placeholder="Ví dụ: FLASH20K, BOCVAC30K..."
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
