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
import * as ImagePicker from 'expo-image-picker';
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
    Wrench,
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
    Cpu,
    Hammer,
    ShieldCheck,
    Zap,
    Camera,
    AlertTriangle,
    AlertCircle,
} from 'lucide-react-native';
import { GoongService, GoongPlacePrediction, GOONG_MAPTILES_KEY } from '../../../services/goongService';
import { useAppTheme } from '../../../constants/theme';
import { useI18n } from '../../../i18n';
import GlassBottomBar from '../../../components/GlassBottomBar';

const CATE_ICON = require('../../../../assets/icon-cate/chuyen-mon.png');

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
        code: 'CHUYENMON30K',
        title: 'Trợ giá thợ kỹ thuật 30.000đ',
        description: 'Áp dụng cho đơn kỹ thuật từ 200.000đ',
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
        title: 'Giảm 50.000đ công trình',
        description: 'Áp dụng cho đơn thợ kỹ thuật từ 400.000đ',
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

// Các lĩnh vực kỹ thuật
export const SPECIALTIES = [
    { id: 'network', label: 'Mạng LAN & Camera' },
    { id: 'furniture', label: 'Lắp ráp nội thất gỗ' },
    { id: 'welding', label: 'Cơ khí & Hàn xì' },
    { id: 'painting', label: 'Sơn bả & Thạch cao' },
    { id: 'other', label: 'Lĩnh vực khác' },
];

// 2 Cấp độ tay nghề
export const SKILL_TIERS = [
    { id: 'standard', label: 'Thợ lành nghề' },
    { id: 'expert', label: 'Chuyên gia lâu năm' },
];

export interface TechTaskItem {
    id: string;
    label: string;
    specialtyId: 'network' | 'furniture' | 'welding' | 'painting' | 'other';
}

// Danh mục đầu việc kỹ thuật phân theo lĩnh vực (Mục 1 FormChuyenMon.md)
export const ALL_TECH_TASKS: TechTaskItem[] = [
    // 1. Mạng LAN & Camera (network)
    { id: 'lan_pull', label: 'Kéo dây mạng LAN, luồn nẹp gen bảo vệ', specialtyId: 'network' },
    { id: 'lan_crimp', label: 'Bấm đầu cáp RJ45, kiểm tra thông mạng test tín hiệu', specialtyId: 'network' },
    { id: 'wifi_setup', label: 'Lắp đặt, cấu hình Router Wifi & bộ kích sóng', specialtyId: 'network' },
    { id: 'cctv_install', label: 'Lắp camera an ninh (IP/Wifi), đi dây thẩm mỹ', specialtyId: 'network' },
    { id: 'cctv_config', label: 'Cài đặt đầu ghi NVR/DVR, kết nối xem từ xa trên điện thoại', specialtyId: 'network' },
    { id: 'rack_patch', label: 'Gom tủ rack mạng, patch panel & đánh số cổng mạng', specialtyId: 'network' },

    // 2. Lắp ráp nội thất gỗ (furniture)
    { id: 'wood_assembly', label: 'Lắp ráp giường ngủ, tủ áo, bàn ghế gỗ MDF/tự nhiên', specialtyId: 'furniture' },
    { id: 'cabinet_mount', label: 'Khoan bắt tủ bếp, tủ tivi, kệ treo tường chịu lực', specialtyId: 'furniture' },
    { id: 'hinge_repair', label: 'Cân chỉnh bản lề cánh tủ, thay ray trượt hộc kéo', specialtyId: 'furniture' },
    { id: 'wood_disassemble', label: 'Tháo dỡ đồ gỗ nội thất, bảo quản dọn nhà', specialtyId: 'furniture' },
    { id: 'wood_cut_adjust', label: 'Cắt gọt, bo cạnh, khoét lỗ ổ điện mặt bàn gỗ', specialtyId: 'furniture' },
    { id: 'lock_install', label: 'Lắp khóa tủ bàn làm việc, tay nắm cửa gỗ', specialtyId: 'furniture' },

    // 3. Cơ khí & Hàn xì (welding)
    { id: 'iron_welding', label: 'Hàn cửa sắt, gia cố khung sắt, thay bản lề cổng', specialtyId: 'welding' },
    { id: 'roof_welding', label: 'Hàn gia cố khung sắt mái che, bắn vít tôn chống dột', specialtyId: 'welding' },
    { id: 'fence_stair', label: 'Hàn lan can, cầu thang sắt, chuồng cọp ban công', specialtyId: 'welding' },
    { id: 'iron_cutting', label: 'Cắt kết cấu sắt cũ, mài phẳng mối hàn gỉ sét', specialtyId: 'welding' },
    { id: 'lock_hasp', label: 'Hàn pát khóa chống trộm, gia cố bát khóa cửa sắt', specialtyId: 'welding' },

    // 4. Sơn bả & Thạch cao (painting)
    { id: 'wall_repair', label: 'Dặm vá tường nứt, trét bột bả matit láng mịn', specialtyId: 'painting' },
    { id: 'ceiling_paint', label: 'Sơn mới trần nhà, tường phòng ngủ, phòng khách', specialtyId: 'painting' },
    { id: 'waterproof_paint', label: 'Sơn lót kháng kiềm, lăn sơn chống thấm tường ngoài', specialtyId: 'painting' },
    { id: 'drywall_patch', label: 'Vá lỗ khoét trần thạch cao, dán băng keo lưới mối nối', specialtyId: 'painting' },
    { id: 'door_paint', label: 'Sơn dầu chống gỉ khung sắt, sơn bóng cửa gỗ', specialtyId: 'painting' },
];

export const TECH_TASKS = ALL_TECH_TASKS;

export default function ChuyenMonJobScreen() {
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
    const [siteDetail, setSiteDetail] = useState('');

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

    // 2. Chuyên ngành & Cấp độ tay nghề
    const [selectedSpecialty, setSelectedSpecialty] = useState('network');
    const [customSpecialty, setCustomSpecialty] = useState('');
    const [selectedTier, setSelectedTier] = useState('standard');

    // 3. Danh mục đầu việc lọc động theo lĩnh vực (Mục 1 FormChuyenMon.md)
    const filteredTasks = useMemo(() => {
        return ALL_TECH_TASKS.filter((task) => task.specialtyId === selectedSpecialty);
    }, [selectedSpecialty]);

    const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
    const [customTaskDetail, setCustomTaskDetail] = useState('');

    // Đính kèm hình ảnh / bản vẽ phác thảo (Mục 3 FormChuyenMon.md)
    const [attachments, setAttachments] = useState<{ uri: string; type: 'image' }[]>([]);

    // Tùy chọn phương án vật tư thi công (Mục 2 FormChuyenMon.md)
    const [materialOption, setMaterialOption] = useState<'customer_has_materials' | 'worker_buy_materials'>('customer_has_materials');

    // Tự động đồng bộ checklist khi đổi lĩnh vực kỹ thuật
    useEffect(() => {
        const validTaskIds = filteredTasks.map((t) => t.id);
        const existing = selectedTasks.filter((id) => validTaskIds.includes(id));
        setSelectedTasks(existing);
    }, [selectedSpecialty]);

    const toggleTask = (taskId: string) => {
        setSelectedTasks((prev) =>
            prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
        );
    };

    // Mô tả máy móc & đồ nghề linh hoạt theo lĩnh vực (Mục 4 FormChuyenMon.md)
    const toolDescriptionBySpecialty = useMemo(() => {
        switch (selectedSpecialty) {
            case 'network':
                return 'Kìm bấm cáp, máy test mạng, thang nhôm, máy khoan...';
            case 'furniture':
                return 'Máy vặn vít pin, cưa lọng, búa cao su, thước cân thủy...';
            case 'welding':
                return 'Máy hàn điện tử, mặt nạ hàn, máy cắt sắt, que hàn...';
            case 'painting':
                return 'Cọ lăn, khay sơn, bàn chà nhám, thang chữ A, bay trét...';
            case 'other':
                return 'Thợ tự trang bị máy móc & đồ nghề kỹ thuật phù hợp với yêu cầu';
            default:
                return 'Máy móc & đồ nghề kỹ thuật chuyên dụng theo ngành';
        }
    }, [selectedSpecialty]);

    // Media Picker Handlers cho bản vẽ / hình ảnh
    const handleTakePhoto = async () => {
        try {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Cần cấp quyền', 'Vui lòng cho phép ứng dụng truy cập máy ảnh để chụp bản vẽ / hiện trạng.');
                return;
            }
            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ['images'],
                allowsEditing: false,
                quality: 0.7,
            });
            if (!result.canceled && result.assets && result.assets.length > 0) {
                const asset = result.assets[0];
                setAttachments((prev) => [...prev, { uri: asset.uri, type: 'image' as const }].slice(0, 5));
            }
        } catch (err: any) {
            Alert.alert('Lỗi', err?.message || 'Không thể chụp ảnh');
        }
    };

    const handlePickFromLibrary = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Cần cấp quyền', 'Vui lòng cho phép ứng dụng truy cập thư viện ảnh để chọn bản vẽ / hình ảnh.');
                return;
            }
            const remaining = 5 - attachments.length;
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsMultipleSelection: true,
                selectionLimit: remaining,
                quality: 0.7,
            });
            if (!result.canceled && result.assets && result.assets.length > 0) {
                const newItems = result.assets.map((asset) => ({
                    uri: asset.uri,
                    type: 'image' as const,
                }));
                setAttachments((prev) => [...prev, ...newItems].slice(0, 5));
            }
        } catch (err: any) {
            Alert.alert('Lỗi', err?.message || 'Không thể chọn tệp từ thư viện.');
        }
    };

    const handlePickMediaPrompt = () => {
        if (attachments.length >= 5) {
            Alert.alert('Đã đạt giới hạn', 'Bạn chỉ có thể đính kèm tối đa 5 hình ảnh hoặc bản vẽ.');
            return;
        }
        Alert.alert(
            'Đính kèm hình ảnh / bản vẽ',
            'Chọn nguồn ảnh hiện trạng hoặc bản vẽ phác thảo để thợ kỹ thuật đánh giá:',
            [
                { text: 'Chụp ảnh ngay', onPress: handleTakePhoto },
                { text: 'Chọn từ thư viện máy', onPress: handlePickFromLibrary },
                { text: 'Hủy', style: 'cancel' },
            ]
        );
    };

    const handleRemoveAttachment = (index: number) => {
        setAttachments((prev) => prev.filter((_, i) => i !== index));
    };

    // 4. Hình thức thuê & Mức thù lao (MẶC ĐỊNH THỜI LƯỢNG VÀ SỐ LƯỢNG LÀ 1)
    const [pricingMode, setPricingMode] = useState<'hourly' | 'fixed'>('fixed');
    const [hours, setHours] = useState(1);
    const [workersCount, setWorkersCount] = useState(1);
    const [hourlyWage, setHourlyWage] = useState('120.000');
    const [fixedPrice, setFixedPrice] = useState('250.000');

    // 5. Máy móc thiết bị & Ghi chú
    const [workerBringsTools, setWorkerBringsTools] = useState(true);
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

    // THUẬT TOÁN GỢI Ý MỨC TIỀN HỢP LÝ THEO CHUYÊN MÔN VÀ ĐẦU VIỆC
    const suggestedRecommendation = useMemo(() => {
        let baseWagePerHour = 100000;
        if (selectedSpecialty === 'welding') baseWagePerHour = 130000;
        else if (selectedSpecialty === 'network') baseWagePerHour = 110000;
        else if (selectedSpecialty === 'furniture') baseWagePerHour = 110000;
        else if (selectedSpecialty === 'painting') baseWagePerHour = 100000;
        else if (selectedSpecialty === 'other') baseWagePerHour = 110000;

        if (selectedTier === 'expert') baseWagePerHour += 40000;

        let recH = 2;
        const taskExtra = Math.min(2, selectedTasks.length * 0.5);
        recH = Math.max(1, Math.round((recH + taskExtra) * 2) / 2);

        const recHourlyWageFormatted = baseWagePerHour.toLocaleString('vi-VN');
        const recHourlyTotal = recH * baseWagePerHour * workersCount;
        const recFixed = Math.round(recHourlyTotal / 10000) * 10000;

        return {
            hours: recH,
            hourlyWage: baseWagePerHour,
            hourlyWageFormatted: recHourlyWageFormatted,
            hourlyTotalFormatted: recHourlyTotal.toLocaleString('vi-VN'),
            fixedPrice: Math.max(200000, recFixed),
            fixedPriceFormatted: Math.max(200000, recFixed).toLocaleString('vi-VN'),
        };
    }, [selectedSpecialty, selectedTier, selectedTasks, workersCount]);

    // Các chip giá khoán gợi ý linh hoạt
    const dynamicFixedChips = useMemo(() => {
        const center = suggestedRecommendation.fixedPrice;
        const c1 = Math.max(150000, center - 60000);
        const c2 = center;
        const c3 = center + 60000;
        const c4 = center + 150000;
        return [c1, c2, c3, c4].map((v) => v.toLocaleString('vi-VN'));
    }, [suggestedRecommendation.fixedPrice]);

    // Các chip thù lao theo giờ gợi ý linh hoạt
    const dynamicHourlyChips = useMemo(() => {
        const center = suggestedRecommendation.hourlyWage;
        const c1 = Math.max(70000, center - 20000);
        const c2 = center;
        const c3 = center + 20000;
        const c4 = center + 40000;
        return [c1, c2, c3, c4].map((v) => v.toLocaleString('vi-VN'));
    }, [suggestedRecommendation.hourlyWage]);

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
    const toolsAllowance = workerBringsTools ? 30000 * workersCount : 0;

    const baseWage =
        pricingMode === 'hourly'
            ? Math.round(hours * workersCount * parsedHourlyWage)
            : parsedFixedPrice * workersCount;

    const subtotal = baseWage + toolsAllowance;
    const voucherDiscount = selectedVoucher ? calculateVoucherDiscount(selectedVoucher, subtotal) : 0;
    const grandTotal = Math.max(0, subtotal - voucherDiscount);

    // Kiểm tra xem đã điền đầy đủ các mục cần nhập và chọn hay chưa
    const isFormComplete = useMemo(() => {
        if (!address.trim()) return false;
        if (selectedSpecialty === 'other' && !customSpecialty.trim()) return false;
        if (selectedTasks.length === 0 && !customTaskDetail.trim() && !specialNotes.trim()) return false;
        if (pricingMode === 'hourly' && parsedHourlyWage <= 0) return false;
        if (pricingMode === 'fixed' && parsedFixedPrice <= 0) return false;
        return true;
    }, [address, selectedSpecialty, customSpecialty, selectedTasks, customTaskDetail, specialNotes, pricingMode, parsedHourlyWage, parsedFixedPrice]);

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

    // Đăng việc thợ kỹ thuật
    const handleSubmit = () => {
        if (!address.trim()) {
            Alert.alert(t('common.error'), 'Vui lòng nhập hoặc chọn địa chỉ nơi cần làm việc.');
            return;
        }
        if (selectedSpecialty === 'other' && !customSpecialty.trim()) {
            Alert.alert(t('common.error'), 'Vui lòng nhập tên lĩnh vực chuyên môn cụ thể.');
            return;
        }
        if (selectedTasks.length === 0 && !customTaskDetail.trim() && !specialNotes.trim()) {
            Alert.alert(t('common.error'), 'Vui lòng chọn ít nhất 1 đầu việc hoặc viết ghi chú mô tả công việc.');
            return;
        }
        if (pricingMode === 'hourly' && parsedHourlyWage <= 0) {
            Alert.alert(t('common.error'), 'Vui lòng nhập mức thù lao/giờ cho thợ kỹ thuật.');
            return;
        }
        if (pricingMode === 'fixed' && parsedFixedPrice <= 0) {
            Alert.alert(t('common.error'), 'Vui lòng nhập mức thù lao trọn gói theo công việc.');
            return;
        }

        const specObj = SPECIALTIES.find((s) => s.id === selectedSpecialty);
        const specialtyTitle = selectedSpecialty === 'other' && customSpecialty.trim()
            ? `Khác: ${customSpecialty.trim()}`
            : specObj?.label || 'Kỹ thuật';
        const tierObj = SKILL_TIERS.find((t) => t.id === selectedTier);
        const materialLabel =
            materialOption === 'customer_has_materials'
                ? 'Khách đã có sẵn vật tư'
                : 'Thợ khảo sát, báo giá & mua giúp';

        const pricingSummary =
            pricingMode === 'hourly'
                ? `${hours}h × ${workersCount} thợ (${parsedHourlyWage.toLocaleString('vi-VN')} đ/h)`
                : `Thuê trọn gói (${parsedFixedPrice.toLocaleString('vi-VN')} đ × ${workersCount} thợ)`;

        const summaryLines = [
            `Địa điểm: ${address}${siteDetail ? ` (${siteDetail})` : ''}`,
            `Lĩnh vực: ${specialtyTitle} (${tierObj?.label})`,
            `Hình thức: ${pricingSummary}`,
            `Thời gian: Thợ nhận việc & có mặt ngay (trong 30 - 60 phút)`,
            `Máy móc: ${workerBringsTools ? 'Thợ tự mang đồ nghề (+30.000đ)' : 'Chủ nhà có sẵn thiết bị'}`,
            `Phương án vật tư: ${materialLabel}`,
            `Số đầu việc: ${selectedTasks.length} việc`,
            attachments.length > 0 ? `Đính kèm: ${attachments.length} ảnh/bản vẽ` : null,
            selectedVoucher && voucherDiscount > 0 ? `Ưu đãi (${selectedVoucher.code}): -${voucherDiscount.toLocaleString('vi-VN')} đ` : null,
            customTaskDetail.trim() ? `Mô tả: ${customTaskDetail.trim()}` : null,
            specialNotes.trim() ? `Ghi chú: ${specialNotes.trim()}` : null,
        ].filter(Boolean).join('\n• ');

        Alert.alert(
            'Xác nhận đăng việc Thợ Kỹ Thuật',
            `Tổng chi phí thù lao ước tính: ${grandTotal.toLocaleString('vi-VN')} đ\n\n• ${summaryLines}`,
            [
                { text: 'Chỉnh sửa', style: 'cancel' },
                {
                    text: 'Tìm thợ kỹ thuật ngay',
                    onPress: () => {
                        Alert.alert('Thành công', 'Yêu cầu của bạn đã được phát sóng tới các thợ chuyên môn giỏi nhất gần đây!');
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
                            Thợ Chuyên Môn Kỹ Thuật
                        </Text>
                    </View>

                    <View style={{ width: 40 }} />
                </View>

                <ScrollView
                    contentContainerStyle={{ padding: 16, paddingBottom: 110 }}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* KHỐI 1: ĐỊA ĐIỂM TRIỂN KHAI */}
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
                                Địa điểm triển khai kỹ thuật
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
                                placeholder="Nhập địa chỉ nhà riêng, công trình, văn phòng..."
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
                                Số nhà, số tầng, phòng làm việc (nếu có)
                            </Text>
                            <TextInput
                                value={siteDetail}
                                onChangeText={setSiteDetail}
                                placeholder="Ví dụ: Tầng 3 - Phòng Kế toán, Nhà riêng ngõ 12..."
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
                                Tìm thợ kỹ thuật đến ngay lập tức • Có mặt trong 30 - 60 phút
                            </Text>
                        </View>
                    </View>

                    {/* KHỐI 2: CHUYÊN NGÀNH & CẤP ĐỘ TAY NGHỀ */}
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
                            <Wrench size={16} color={colors.primary} />
                            <Text style={{ fontSize: 14, fontWeight: '800', color: colors.text }}>
                                Lĩnh vực chuyên môn
                            </Text>
                        </View>

                        {/* Nhóm chuyên ngành */}
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                            {SPECIALTIES.map((spec) => {
                                const isSelected = selectedSpecialty === spec.id;
                                const isOther = spec.id === 'other';
                                return (
                                    <TouchableOpacity
                                        key={spec.id}
                                        onPress={() => setSelectedSpecialty(spec.id)}
                                        style={{
                                            width: isOther ? '100%' : '48.5%',
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
                                            {spec.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        {/* Input nhập cụ thể khi chọn Lĩnh vực khác */}
                        {selectedSpecialty === 'other' && (
                            <View style={{ marginBottom: 12 }}>
                                <Text style={{ fontSize: 12, fontWeight: '700', color: colors.text, marginBottom: 6 }}>
                                    Nhập lĩnh vực chuyên môn cụ thể:
                                </Text>
                                <TextInput
                                    value={customSpecialty}
                                    onChangeText={setCustomSpecialty}
                                    placeholder="Ví dụ: Thợ may rèm cửa, Kỹ thuật hồ cá, Điện tử vi mạch..."
                                    placeholderTextColor={colors.placeholder}
                                    style={{
                                        backgroundColor: colors.surfaceContainerLow,
                                        borderRadius: 12,
                                        paddingHorizontal: 12,
                                        height: 48,
                                        fontSize: 14,
                                        fontWeight: '600',
                                        color: colors.text,
                                        borderWidth: 1.5,
                                        borderColor: customSpecialty.trim() ? colors.primary : colors.border,
                                    }}
                                />
                            </View>
                        )}

                        {/* Cấp độ thợ */}
                        <Text style={{ fontSize: 12, fontWeight: '700', color: colors.text, marginBottom: 6 }}>
                            Cấp độ tay nghề yêu cầu
                        </Text>
                        <View style={{ flexDirection: 'row', gap: 6 }}>
                            {SKILL_TIERS.map((tier) => {
                                const isSelected = selectedTier === tier.id;
                                return (
                                    <TouchableOpacity
                                        key={tier.id}
                                        onPress={() => setSelectedTier(tier.id)}
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
                                            {tier.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    {/* KHỐI 3: DANH MỤC ĐẦU VIỆC KỸ THUẬT */}
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
                                {filteredTasks.length > 0
                                    ? `Đầu việc kỹ thuật (${selectedTasks.length}/${filteredTasks.length})`
                                    : 'Mô tả đầu việc kỹ thuật'}
                            </Text>
                            {filteredTasks.length > 0 && (
                                <TouchableOpacity
                                    onPress={() => {
                                        if (selectedTasks.length === filteredTasks.length) {
                                            setSelectedTasks([]);
                                        } else {
                                            setSelectedTasks(filteredTasks.map((t) => t.id));
                                        }
                                    }}
                                >
                                    <Text style={{ fontSize: 11, fontWeight: '700', color: colors.primary }}>
                                        {selectedTasks.length === filteredTasks.length ? 'Bỏ chọn hết' : 'Chọn tất cả'}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {filteredTasks.length > 0 ? (
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
                        ) : (
                            <View style={{ padding: 12, borderRadius: 12, backgroundColor: colors.surfaceContainerLow, borderWidth: 1, borderColor: colors.border, marginTop: 4 }}>
                                <Text style={{ fontSize: 12.5, color: colors.textSecondary, fontStyle: 'italic', textAlign: 'center' }}>
                                    Lĩnh vực khác không có checklist cố định. Vui lòng ghi chi tiết công việc cần làm ở ô mô tả bên dưới.
                                </Text>
                            </View>
                        )}

                        <View style={{ marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderColor: colors.border }}>
                            <Text style={{ fontSize: 12, fontWeight: '700', color: colors.text, marginBottom: 5 }}>
                                Mô tả chi tiết bản vẽ / thiết bị thi công:
                            </Text>
                            <TextInput
                                value={customTaskDetail}
                                onChangeText={setCustomTaskDetail}
                                placeholder="Ví dụ: Cần bấm 4 đầu mạng cat6, khoan bắt tủ tivi tường thạch cao..."
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

                        {/* ĐÍNH KÈM HÌNH ẢNH / BẢN VẼ */}
                        <View style={{ marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderColor: colors.border }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                <Text style={{ fontSize: 12, fontWeight: '700', color: colors.text }}>
                                    Đính kèm bản vẽ / hình ảnh ({attachments.length}/5):
                                </Text>
                                <TouchableOpacity
                                    onPress={handlePickMediaPrompt}
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        gap: 4,
                                        paddingHorizontal: 8,
                                        paddingVertical: 4,
                                        borderRadius: 8,
                                        backgroundColor: colors.primary + '15',
                                    }}
                                >
                                    <Camera size={13} color={colors.primary} />
                                    <Text style={{ fontSize: 11, fontWeight: '700', color: colors.primary }}>
                                        + Thêm ảnh
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {attachments.length > 0 && (
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
                                    {attachments.map((att, idx) => (
                                        <View
                                            key={`${att.uri}-${idx}`}
                                            style={{
                                                width: 72,
                                                height: 72,
                                                borderRadius: 10,
                                                overflow: 'hidden',
                                                borderWidth: 1,
                                                borderColor: colors.border,
                                                position: 'relative',
                                            }}
                                        >
                                            <Image source={{ uri: att.uri }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                                            <TouchableOpacity
                                                onPress={() => handleRemoveAttachment(idx)}
                                                style={{
                                                    position: 'absolute',
                                                    top: 3,
                                                    right: 3,
                                                    width: 20,
                                                    height: 20,
                                                    borderRadius: 10,
                                                    backgroundColor: 'rgba(0,0,0,0.65)',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                }}
                                            >
                                                <X size={12} color="#ffffff" />
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                </ScrollView>
                            )}

                            {attachments.length === 0 && (
                                <TouchableOpacity
                                    onPress={handlePickMediaPrompt}
                                    activeOpacity={0.7}
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: 8,
                                        paddingVertical: 10,
                                        paddingHorizontal: 12,
                                        borderRadius: 10,
                                        borderWidth: 1,
                                        borderStyle: 'dashed',
                                        borderColor: colors.primary,
                                        backgroundColor: colors.primary + '08',
                                    }}
                                >
                                    <Camera size={16} color={colors.primary} />
                                    <Text style={{ fontSize: 12, fontWeight: '700', color: colors.primary }}>
                                        Đính kèm hình ảnh / Bản vẽ phác thảo (Tùy chọn)
                                    </Text>
                                </TouchableOpacity>
                            )}
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

                        {/* 2 Tab: Thuê trọn gói vs Theo giờ */}
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
                                    Thuê trọn gói
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
                                        Gợi ý theo độ phức tạp:
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
                                        <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text }}>Số lượng thợ kỹ thuật</Text>
                                        <Text style={{ fontSize: 11, color: colors.textSecondary }}>Mặc định 1 thợ</Text>
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
                                            onPress={() => setWorkersCount((prev) => Math.min(6, prev + 1))}
                                            style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceContainer, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }}
                                        >
                                            <Plus size={16} color={colors.text} />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                <Text style={{ fontSize: 12, fontWeight: '700', color: colors.text, marginTop: 4 }}>
                                    Tiền công thuê trọn gói (VNĐ / thợ):
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
                                    <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textSecondary }}>VNĐ / thợ</Text>
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
                        ) : (
                            <View style={{ gap: 14 }}>
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
                                            onPress={() => setHours((prev) => Math.min(10, prev + 0.5))}
                                            style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceContainer, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }}
                                        >
                                            <Plus size={16} color={colors.text} />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <View>
                                        <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text }}>Số lượng thợ kỹ thuật</Text>
                                        <Text style={{ fontSize: 11, color: colors.textSecondary }}>Mặc định 1 thợ</Text>
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
                                            onPress={() => setWorkersCount((prev) => Math.min(6, prev + 1))}
                                            style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceContainer, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }}
                                        >
                                            <Plus size={16} color={colors.text} />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                <View style={{ paddingTop: 10, borderTopWidth: 1, borderColor: colors.border }}>
                                    <Text style={{ fontSize: 12, fontWeight: '700', color: colors.text, marginBottom: 6 }}>
                                        Mức thù lao theo giờ (VNĐ / giờ / thợ)
                                    </Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 9, borderRadius: 12, backgroundColor: colors.surfaceContainerLow, borderWidth: 1, borderColor: colors.border, marginBottom: 8 }}>
                                        <TextInput
                                            value={hourlyWage}
                                            onChangeText={handleHourlyWageChange}
                                            keyboardType="numeric"
                                            placeholder="120.000"
                                            placeholderTextColor={colors.placeholder}
                                            style={{ flex: 1, fontSize: 16, fontWeight: '800', color: colors.primary }}
                                        />
                                        <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textSecondary }}>VNĐ / thợ / h</Text>
                                    </View>

                                    <View style={{ flexDirection: 'row', gap: 6 }}>
                                        {dynamicHourlyChips.map((val, idx) => (
                                            <TouchableOpacity
                                                key={`${val}-${idx}`}
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

                    {/* KHỐI 5: MÁY MÓC ĐỒ NGHỀ & GHI CHÚ */}
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
                            <Hammer size={16} color={colors.primary} />
                            <Text style={{ fontSize: 14, fontWeight: '800', color: colors.text }}>
                                Máy móc & Đồ nghề kỹ thuật
                            </Text>
                        </View>

                        {/* 2 Lựa chọn Máy móc & Đồ nghề kỹ thuật */}
                        <View style={{ gap: 8, marginBottom: 12 }}>
                            {/* Lựa chọn 1: Thợ mang trọn gói đồ nghề */}
                            <TouchableOpacity
                                onPress={() => setWorkerBringsTools(true)}
                                activeOpacity={0.7}
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    padding: 12,
                                    borderRadius: 12,
                                    backgroundColor: workerBringsTools ? colors.primary + '12' : colors.surfaceContainerLow,
                                    borderWidth: 1.5,
                                    borderColor: workerBringsTools ? colors.primary : colors.border,
                                    gap: 10,
                                }}
                            >
                                <View
                                    style={{
                                        width: 18,
                                        height: 18,
                                        borderRadius: 9,
                                        borderWidth: 2,
                                        borderColor: workerBringsTools ? colors.primary : colors.textSecondary,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    {workerBringsTools && (
                                        <View style={{ width: 9, height: 9, borderRadius: 4.5, backgroundColor: colors.primary }} />
                                    )}
                                </View>
                                <View style={{ flex: 1 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text }}>
                                            Thợ mang trọn gói đồ nghề
                                        </Text>
                                        <View style={{ backgroundColor: isDark ? '#064e3b30' : '#dcfce7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                                            <Text style={{ fontSize: 11, fontWeight: '800', color: '#059669' }}>
                                                +30.000 đ/thợ
                                            </Text>
                                        </View>
                                    </View>
                                    <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 3 }}>
                                        {toolDescriptionBySpecialty}
                                    </Text>
                                </View>
                            </TouchableOpacity>

                            {/* Lựa chọn 2: Chủ nhà có sẵn máy móc thiết bị */}
                            <TouchableOpacity
                                onPress={() => setWorkerBringsTools(false)}
                                activeOpacity={0.7}
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    padding: 12,
                                    borderRadius: 12,
                                    backgroundColor: !workerBringsTools ? colors.primary + '12' : colors.surfaceContainerLow,
                                    borderWidth: 1.5,
                                    borderColor: !workerBringsTools ? colors.primary : colors.border,
                                    gap: 10,
                                }}
                            >
                                <View
                                    style={{
                                        width: 18,
                                        height: 18,
                                        borderRadius: 9,
                                        borderWidth: 2,
                                        borderColor: !workerBringsTools ? colors.primary : colors.textSecondary,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    {!workerBringsTools && (
                                        <View style={{ width: 9, height: 9, borderRadius: 4.5, backgroundColor: colors.primary }} />
                                    )}
                                </View>
                                <View style={{ flex: 1 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text }}>
                                            Chủ nhà có sẵn máy móc & thiết bị
                                        </Text>
                                        <View style={{ backgroundColor: colors.surfaceContainer, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                                            <Text style={{ fontSize: 11, fontWeight: '800', color: colors.primary }}>
                                                Miễn phí
                                            </Text>
                                        </View>
                                    </View>
                                    <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 3 }}>
                                        Gia đình hoặc công trình đã có sẵn đầy đủ máy móc & đồ nghề cần thiết
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        </View>

                        <View style={{ paddingTop: 10, borderTopWidth: 1, borderColor: colors.border }}>
                            <Text style={{ fontSize: 12, fontWeight: '700', color: colors.text, marginBottom: 5 }}>
                                Ghi chú thêm cho thợ kỹ thuật:
                            </Text>
                            <TextInput
                                value={specialNotes}
                                onChangeText={setSpecialNotes}
                                placeholder="Ví dụ: Thi công ngoài trời, có nguồn điện 220V sẵn..."
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

                    {/* KHỐI VẬT TƯ & LINH KIỆN THI CÔNG */}
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
                            <Cpu size={16} color={colors.primary} />
                            <Text style={{ fontSize: 14, fontWeight: '800', color: colors.text }}>
                                Phương án vật tư & Linh kiện thi công
                            </Text>
                        </View>

                        <View style={{ gap: 8 }}>
                            <TouchableOpacity
                                onPress={() => setMaterialOption('customer_has_materials')}
                                activeOpacity={0.7}
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    padding: 12,
                                    borderRadius: 12,
                                    backgroundColor: materialOption === 'customer_has_materials' ? colors.primary + '12' : colors.surfaceContainerLow,
                                    borderWidth: 1.5,
                                    borderColor: materialOption === 'customer_has_materials' ? colors.primary : colors.border,
                                    gap: 10,
                                }}
                            >
                                <View
                                    style={{
                                        width: 18,
                                        height: 18,
                                        borderRadius: 9,
                                        borderWidth: 2,
                                        borderColor: materialOption === 'customer_has_materials' ? colors.primary : colors.textSecondary,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    {materialOption === 'customer_has_materials' && (
                                        <View style={{ width: 9, height: 9, borderRadius: 4.5, backgroundColor: colors.primary }} />
                                    )}
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text }}>
                                        Khách đã chuẩn bị sẵn vật tư
                                    </Text>
                                    <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>
                                        Chủ nhà có sẵn vật tư (dây mạng, ốc vít, bản lề, que hàn, bột bả...)
                                    </Text>
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => setMaterialOption('worker_buy_materials')}
                                activeOpacity={0.7}
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    padding: 12,
                                    borderRadius: 12,
                                    backgroundColor: materialOption === 'worker_buy_materials' ? colors.primary + '12' : colors.surfaceContainerLow,
                                    borderWidth: 1.5,
                                    borderColor: materialOption === 'worker_buy_materials' ? colors.primary : colors.border,
                                    gap: 10,
                                }}
                            >
                                <View
                                    style={{
                                        width: 18,
                                        height: 18,
                                        borderRadius: 9,
                                        borderWidth: 2,
                                        borderColor: materialOption === 'worker_buy_materials' ? colors.primary : colors.textSecondary,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    {materialOption === 'worker_buy_materials' && (
                                        <View style={{ width: 9, height: 9, borderRadius: 4.5, backgroundColor: colors.primary }} />
                                    )}
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text }}>
                                        Thợ khảo sát, báo giá & mua giúp
                                    </Text>
                                    <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>
                                        Thợ khảo sát khối lượng, mua vật tư hộ và nghiệm thu theo hóa đơn thực tế
                                    </Text>
                                </View>
                            </TouchableOpacity>
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
                                {isFormComplete ? 'Tổng thù lao thợ kỹ thuật dự kiến' : 'Vui lòng hoàn tất thông tin'}
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
                                    <Wrench size={13} color={colors.primary} />
                                    <Text style={{ fontSize: 12, fontWeight: '700', color: colors.text }}>
                                        {pricingMode === 'fixed'
                                            ? `Khoán việc: ${baseWage.toLocaleString('vi-VN')} đ`
                                            : `Công giờ: ${baseWage.toLocaleString('vi-VN')} đ (${hours}h × ${workersCount} thợ)`}
                                    </Text>
                                </View>

                                {workerBringsTools && (
                                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: colors.border, gap: 6 }}>
                                        <Hammer size={13} color="#059669" />
                                        <Text style={{ fontSize: 12, fontWeight: '700', color: '#059669' }}>
                                            Máy móc: +{toolsAllowance.toLocaleString('vi-VN')} đ
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
                                    Vui lòng nhập địa chỉ, lĩnh vực và chọn đầu việc để tính giá
                                </Text>
                            </View>
                        )}

                        {/* Lưu ý chi phí vật tư */}
                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 6,
                                marginTop: 12,
                                paddingVertical: 8,
                                paddingHorizontal: 10,
                                borderRadius: 10,
                                backgroundColor: isDark ? '#78350f25' : '#fffbeb',
                                borderWidth: 1,
                                borderColor: isDark ? '#b45309' : '#fef3c7',
                            }}
                        >
                            <AlertTriangle size={14} color="#d97706" />
                            <Text style={{ fontSize: 11.5, color: '#b45309', fontWeight: '600', flex: 1 }}>
                                Lưu ý: Tiền công chưa bao gồm chi phí vật tư, linh kiện thay thế/thi công.
                            </Text>
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
                                    Tìm thợ kỹ thuật ngay
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
                        <Text style={{ fontSize: 16, fontWeight: '800', color: colors.text }}>Chọn địa điểm thi công</Text>
                        <View style={{ width: 40 }} />
                    </View>

                    <View style={{ padding: 12, backgroundColor: colors.surface, borderBottomWidth: 1, borderColor: colors.border }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceContainerLow, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 8, borderWidth: 1, borderColor: colors.border }}>
                            <Search size={16} color={colors.textSecondary} style={{ marginRight: 8 }} />
                            <TextInput
                                value={pickerSearchText}
                                onChangeText={handlePickerSearchText}
                                placeholder="Gõ tên đường, khu công nghiệp để nhảy tới..."
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
                                { name: 'Khu CNC Quận 9', lat: 10.8544, lng: 106.7865 },
                                { name: 'KCN Tân Bình', lat: 10.8248, lng: 106.6192 },
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
                                        placeholder="Ví dụ: FLASH20K, CHUYENMON30K..."
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
