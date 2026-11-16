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
    PanResponder,
    Animated,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { WebView } from 'react-native-webview';
import {
    ArrowLeft,
    MapPin,
    Navigation,
    Truck,
    Package,
    ShieldCheck,
    CheckCircle2,
    Users,
    X,
    Search,
    Plus,
    Minus,
    ChevronUp,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ZoomIn,
    ZoomOut,
    Route,
    Crosshair,
    FileText,
    Ticket,
    Tag,
    Check,
} from 'lucide-react-native';
import { GoongService, GoongPlacePrediction, GOONG_MAPTILES_KEY } from '../../../services/goongService';
import { useAppTheme } from '../../../constants/theme';
import { useI18n } from '../../../i18n';
import GlassBottomBar from '../../../components/GlassBottomBar';

const CATE_ICON = require('../../../../assets/icon-cate/van-chuyen.png');

// 7 Icon phương tiện vận chuyển đồ họa từ thư mục icon-delivery
const DELIVERY_ICONS = {
    bike: require('../../../../assets/icon-delivery/01_xe_may.svg'),
    pickup: require('../../../../assets/icon-delivery/02_xe_ban_tai.svg'),
    van: require('../../../../assets/icon-delivery/03_xe_van.svg'),
    truck_small: require('../../../../assets/icon-delivery/04_xe_tai_nho.svg'),
    truck_medium: require('../../../../assets/icon-delivery/05_xe_tai_trung.svg'),
    truck_heavy: require('../../../../assets/icon-delivery/06_xe_tai_lon.svg'),
    truck_super: require('../../../../assets/icon-delivery/07_xe_tai_sieu_trong.svg'),
};

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
        description: 'Áp dụng cho mọi chuyến vận chuyển từ 100.000đ',
        discountType: 'fixed',
        discountValue: 20000,
        minOrderValue: 100000,
        expiryText: 'HSD: 30/11/2026',
    },
    {
        code: 'FREESHIP15K',
        title: 'Hỗ trợ 15.000đ cước xe',
        description: 'Trừ trực tiếp vào cước xe từ 80.000đ',
        discountType: 'fixed',
        discountValue: 15000,
        minOrderValue: 80000,
        expiryText: 'HSD: 25/11/2026',
    },
    {
        code: 'CHUYENNHA10',
        title: 'Ưu đãi dọn nhà - Giảm 10%',
        description: 'Giảm 10% tổng đơn, tối đa 50.000đ',
        discountType: 'percent',
        discountValue: 10,
        maxDiscount: 50000,
        minOrderValue: 150000,
        expiryText: 'HSD: 31/12/2026',
    },
    {
        code: 'TROGIA30K',
        title: 'Trợ giá thợ bốc xếp 30.000đ',
        description: 'Áp dụng cho đơn thuê xe có thợ phụ bốc vác từ 200.000đ',
        discountType: 'fixed',
        discountValue: 30000,
        minOrderValue: 200000,
        expiryText: 'HSD: 30/11/2026',
    },
];

// Tính khoảng cách Haversine làm phương án dự phòng tức thì
function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 1.35 * 10) / 10;
}

// Tính số tiền được khấu trừ từ mã Voucher
export function calculateVoucherDiscount(voucher: VoucherItem, subtotal: number): number {
    if (subtotal < voucher.minOrderValue) return 0;
    if (voucher.discountType === 'fixed') {
        return Math.min(subtotal, voucher.discountValue);
    }
    const percentAmount = Math.round((subtotal * voucher.discountValue) / 100);
    return voucher.maxDiscount ? Math.min(voucher.maxDiscount, percentAmount) : percentAmount;
}

export default function VanChuyenJobScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { colors, gradients, shadows, isDark } = useAppTheme();
    const { t, language } = useI18n();

    // Điểm bốc hàng (Điểm A)
    const [pickupAddress, setPickupAddress] = useState('');
    const [pickupCoords, setPickupCoords] = useState<Coords | null>(null);
    const [pickupPredictions, setPickupPredictions] = useState<GoongPlacePrediction[]>([]);
    const [isSearchingPickup, setIsSearchingPickup] = useState(false);
    const [isLocatingPickup, setIsLocatingPickup] = useState(false);

    // Điểm hạ hàng (Điểm B)
    const [dropoffAddress, setDropoffAddress] = useState('');
    const [dropoffCoords, setDropoffCoords] = useState<Coords | null>(null);
    const [dropoffPredictions, setDropoffPredictions] = useState<GoongPlacePrediction[]>([]);
    const [isSearchingDropoff, setIsSearchingDropoff] = useState(false);
    const [isLocatingDropoff, setIsLocatingDropoff] = useState(false);

    // Lộ trình & Khoảng cách km
    const [distanceKm, setDistanceKm] = useState<number>(0);
    const [durationMin, setDurationMin] = useState<number>(0);
    const [isCalculatingDistance, setIsCalculatingDistance] = useState(false);
    const [isRouteMapLoading, setIsRouteMapLoading] = useState(false);
    const [routeMapError, setRouteMapError] = useState(false);

    // Modal chọn trên bản đồ (Map Picker)
    const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);
    const [pickerTarget, setPickerTarget] = useState<'pickup' | 'dropoff'>('pickup');
    const [pickerCoords, setPickerCoords] = useState<Coords>({ lat: 10.7769, lng: 106.7009 });
    const initialMapCoordsRef = useRef<Coords>({ lat: 10.7769, lng: 106.7009 });
    const [pickerZoom, setPickerZoom] = useState(15);
    const [isMapLoading, setIsMapLoading] = useState(false);
    const [mapError, setMapError] = useState(false);
    const [pickerAddress, setPickerAddress] = useState('');
    const [isPickerResolving, setIsPickerResolving] = useState(false);
    const [pickerSearchText, setPickerSearchText] = useState('');
    const [pickerPredictions, setPickerPredictions] = useState<GoongPlacePrediction[]>([]);

    const searchTimerRef = useRef<any>(null);
    const modalSearchTimerRef = useRef<any>(null);

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

    // Tùy chọn tải trọng cho Xe Van (500kg hoặc 1 tấn)
    const [vanCapacity, setVanCapacity] = useState<'500kg' | '1ton'>('500kg');

    // 7 Loại phương tiện vận chuyển tối ưu chuẩn logistics
    const VEHICLE_OPTIONS = [
        {
            id: 'bike',
            label: 'Xe máy',
            weightLimit: 'Tối đa 30kg',
            sub: 'Giao hỏa tốc bưu phẩm, đồ ăn, tài liệu nhỏ gọn.',
            iconAsset: DELIVERY_ICONS.bike,
            baseKm: 2,
            basePrice: 25000,
            pricePerKm: 6000,
            calculateFare: (km: number) => {
                if (km <= 0) return 0;
                if (km <= 2) return 25000;
                return 25000 + Math.round((km - 2) * 6000);
            },
        },
        {
            id: 'pickup',
            label: 'Xe bán tải',
            weightLimit: 'Tối đa 500kg',
            sub: 'Chở hàng vừa phải, đồ đạc ít, chạy linh hoạt.',
            iconAsset: DELIVERY_ICONS.pickup,
            baseKm: 3,
            basePrice: 120000,
            pricePerKm: 14000,
            calculateFare: (km: number) => {
                if (km <= 0) return 0;
                if (km <= 3) return 120000;
                return 120000 + Math.round((km - 3) * 14000);
            },
        },
        {
            id: 'van',
            label: 'Xe Van',
            weightLimit: '500kg – 1 tấn',
            sub: 'Thùng kín, chạy được giờ cấm tải nội thành.',
            iconAsset: DELIVERY_ICONS.van,
            hasSubOption: true,
            baseKm: 3,
            basePrice: vanCapacity === '500kg' ? 140000 : 180000,
            pricePerKm: vanCapacity === '500kg' ? 15000 : 17000,
            calculateFare: (km: number) => {
                if (km <= 0) return 0;
                if (vanCapacity === '500kg') {
                    if (km <= 3) return 140000;
                    return 140000 + Math.round((km - 3) * 15000);
                } else {
                    if (km <= 3) return 180000;
                    return 180000 + Math.round((km - 3) * 17000);
                }
            },
        },
        {
            id: 'truck_small',
            label: 'Xe tải nhỏ',
            weightLimit: '500kg – 1 tấn',
            sub: 'Chuyển trọ, chở tủ lạnh, máy giặt, hàng hóa nội thành.',
            iconAsset: DELIVERY_ICONS.truck_small,
            baseKm: 4,
            basePrice: 220000,
            pricePerKm: 18000,
            calculateFare: (km: number) => {
                if (km <= 0) return 0;
                if (km <= 4) return 220000;
                return 220000 + Math.round((km - 4) * 18000);
            },
        },
        {
            id: 'truck_medium',
            label: 'Xe tải trung',
            weightLimit: '1.5 tấn – 2.5 tấn',
            sub: 'Chuyển nhà trọn gói, chở nội thất lớn, hàng đại lý.',
            iconAsset: DELIVERY_ICONS.truck_medium,
            baseKm: 4,
            basePrice: 380000,
            pricePerKm: 24000,
            calculateFare: (km: number) => {
                if (km <= 0) return 0;
                if (km <= 4) return 380000;
                return 380000 + Math.round((km - 4) * 24000);
            },
        },
        {
            id: 'truck_heavy',
            label: 'Xe tải lớn',
            weightLimit: '3.5 tấn – 8 tấn',
            sub: 'Chở hàng công nghiệp, nông sản số lượng lớn, chạy liên tỉnh.',
            iconAsset: DELIVERY_ICONS.truck_heavy,
            baseKm: 5,
            basePrice: 650000,
            pricePerKm: 32000,
            calculateFare: (km: number) => {
                if (km <= 0) return 0;
                if (km <= 5) return 650000;
                return 650000 + Math.round((km - 5) * 32000);
            },
        },
        {
            id: 'truck_super',
            label: 'Xe tải siêu trọng',
            weightLimit: '10 tấn – 18 tấn',
            sub: 'Chở máy móc nặng, hàng khối lượng cực lớn đường dài.',
            iconAsset: DELIVERY_ICONS.truck_super,
            baseKm: 10,
            basePrice: 1200000,
            pricePerKm: 45000,
            calculateFare: (km: number) => {
                if (km <= 0) return 0;
                if (km <= 10) return 1200000;
                return 1200000 + Math.round((km - 10) * 45000);
            },
        },
    ];
    const [selectedVehicle, setSelectedVehicle] = useState('truck_small');

    // Số lượng thợ phụ và tiền công (Mặc định 0 người phụ)
    const [helpersCount, setHelpersCount] = useState(0);
    const [helperWagePerPerson, setHelperWagePerPerson] = useState('150.000');

    // Trạng thái Mã giảm giá & Ưu đãi (Voucher)
    const [selectedVoucher, setSelectedVoucher] = useState<VoucherItem | null>(null);
    const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
    const [voucherInputCode, setVoucherInputCode] = useState('');

    const handleHelperWageChange = (text: string) => {
        const raw = text.replace(/\D/g, '');
        const num = parseInt(raw, 10) || 0;
        setHelperWagePerPerson(num > 0 ? num.toLocaleString('vi-VN') : '');
    };

    // Ghi chú địa hình, thang máy, lầu cao
    const [transportNote, setTransportNote] = useState('');

    // Tự động tính cước quãng đường khi cả 2 điểm đều có tọa độ (có cơ chế Debounce 500ms)
    const routeDebounceRef = useRef<any>(null);
    useEffect(() => {
        if (pickupCoords && dropoffCoords) {
            if (routeDebounceRef.current) clearTimeout(routeDebounceRef.current);
            routeDebounceRef.current = setTimeout(() => {
                calculateRoute(pickupCoords, dropoffCoords);
            }, 500);
        } else {
            setDistanceKm(0);
            setDurationMin(0);
        }
        return () => {
            if (routeDebounceRef.current) clearTimeout(routeDebounceRef.current);
        };
    }, [pickupCoords?.lat, pickupCoords?.lng, dropoffCoords?.lat, dropoffCoords?.lng]);

    // Tự động tính lại lộ trình khi đổi phương tiện (ví dụ: xe máy vs xe tải)
    useEffect(() => {
        if (pickupCoords && dropoffCoords) {
            if (routeDebounceRef.current) clearTimeout(routeDebounceRef.current);
            routeDebounceRef.current = setTimeout(() => {
                calculateRoute(pickupCoords, dropoffCoords);
            }, 300);
        }
    }, [selectedVehicle]);

    const calculateRoute = async (pCoord: Coords, dCoord: Coords) => {
        setIsCalculatingDistance(true);
        setRouteMapError(false);
        try {
            // Lộ trình xe thực tế (xe máy 'bike', xe tải 'truck', hoặc ô tô/van 'car')
            const vehicleMode = selectedVehicle === 'bike' ? 'bike' : (selectedVehicle.startsWith('truck') ? 'truck' : 'car');
            const dir = await GoongService.getDirection(pCoord.lat, pCoord.lng, dCoord.lat, dCoord.lng, vehicleMode);
            if (dir && dir.distanceKm > 0) {
                setDistanceKm(dir.distanceKm);
                setDurationMin(dir.durationMin);
            } else {
                const est = calculateHaversineDistance(pCoord.lat, pCoord.lng, dCoord.lat, dCoord.lng);
                setDistanceKm(est);
                setDurationMin(Math.max(10, Math.round(est * 3)));
            }
        } catch {
            const est = calculateHaversineDistance(pCoord.lat, pCoord.lng, dCoord.lat, dCoord.lng);
            setDistanceKm(est);
            setDurationMin(Math.max(10, Math.round(est * 3)));
        } finally {
            setIsCalculatingDistance(false);
        }
    };

    // Tìm kiếm địa chỉ với gợi ý Goong Autocomplete (Debounce 450ms)
    const handleSearchLocation = (text: string, isPickup: boolean) => {
        if (isPickup) setPickupAddress(text);
        else setDropoffAddress(text);

        if (text.trim().length >= 2) {
            if (isPickup) setIsSearchingPickup(true);
            else setIsSearchingDropoff(true);

            if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
            searchTimerRef.current = setTimeout(async () => {
                const results = await GoongService.searchPlaces(text);
                if (isPickup) {
                    setPickupPredictions(results);
                    setIsSearchingPickup(false);
                } else {
                    setDropoffPredictions(results);
                    setIsSearchingDropoff(false);
                }
            }, 450);
        } else {
            if (isPickup) {
                setPickupPredictions([]);
                setIsSearchingPickup(false);
            } else {
                setDropoffPredictions([]);
                setIsSearchingDropoff(false);
            }
        }
    };

    // Khi chọn một địa chỉ từ danh sách gợi ý Goong
    const handleSelectPrediction = async (item: GoongPlacePrediction, isPickup: boolean) => {
        if (isPickup) {
            setPickupAddress(item.description);
            setPickupPredictions([]);
        } else {
            setDropoffAddress(item.description);
            setDropoffPredictions([]);
        }

        const detail = await GoongService.getPlaceDetail(item.placeId);
        if (detail && detail.latitude && detail.longitude) {
            if (isPickup) {
                setPickupCoords({ lat: detail.latitude, lng: detail.longitude });
            } else {
                setDropoffCoords({ lat: detail.latitude, lng: detail.longitude });
            }
        }
    };

    // Tự động nhận diện tọa độ khi người dùng nhập xong (Debounce 600ms, không kích hoạt tùy tiện)
    const autoGeocodeTimerRef = useRef<any>(null);
    const handleAutoGeocode = (text: string, isPickup: boolean) => {
        const query = text.trim();
        if (query.length < 5) return;

        if (isPickup && pickupCoords) return;
        if (!isPickup && dropoffCoords) return;

        if (autoGeocodeTimerRef.current) clearTimeout(autoGeocodeTimerRef.current);
        autoGeocodeTimerRef.current = setTimeout(async () => {
            try {
                const detail = await GoongService.geocode(query);
                if (detail && detail.latitude && detail.longitude) {
                    if (isPickup) {
                        setPickupCoords({ lat: detail.latitude, lng: detail.longitude });
                    } else {
                        setDropoffCoords({ lat: detail.latitude, lng: detail.longitude });
                    }
                }
            } catch {
                // Không làm gián đoạn người dùng
            }
        }, 600);
    };

    // 1. Chức năng Lấy Vị Trí Hiện Tại qua expo-location
    const handleUseCurrentLocation = async (isPickup: boolean) => {
        if (isPickup) setIsLocatingPickup(true);
        else setIsLocatingDropoff(true);

        try {
            // Xin quyền GPS điện thoại
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert(
                    'Cần quyền truy cập vị trí',
                    'Vui lòng cấp quyền truy cập vị trí trong cài đặt điện thoại để ứng dụng tự động điền địa chỉ nơi bạn đang đứng.',
                    [{ text: 'Đóng', style: 'cancel' }]
                );
                return;
            }

            // Lấy GPS chính xác từ thiết bị
            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
            });

            const lat = location.coords.latitude;
            const lng = location.coords.longitude;

            // Dùng Goong Reverse Geocoding để giải mã địa chỉ chính xác
            const address = await GoongService.reverseGeocode(lat, lng);
            const formatted = address || `Vị trí GPS (${lat.toFixed(4)}, ${lng.toFixed(4)})`;

            if (isPickup) {
                setPickupAddress(formatted);
                setPickupCoords({ lat, lng });
                setPickupPredictions([]);
            } else {
                setDropoffAddress(formatted);
                setDropoffCoords({ lat, lng });
                setDropoffPredictions([]);
            }
        } catch (error) {
            console.warn('Lỗi định vị expo-location:', error);
            // Fallback qua dịch vụ định vị mạng
            try {
                const loc = await GoongService.getCurrentLocation();
                if (isPickup) {
                    setPickupAddress(loc.address);
                    setPickupCoords({ lat: loc.latitude, lng: loc.longitude });
                    setPickupPredictions([]);
                } else {
                    setDropoffAddress(loc.address);
                    setDropoffCoords({ lat: loc.latitude, lng: loc.longitude });
                    setDropoffPredictions([]);
                }
            } catch {
                Alert.alert('Không thể định vị', 'Vui lòng kiểm tra kết nối mạng và bật GPS trên thiết bị.');
            }
        } finally {
            if (isPickup) setIsLocatingPickup(false);
            else setIsLocatingDropoff(false);
        }
    };

    // Bộ nhớ đệm vị trí GPS người dùng (tự động nạp sẵn trong nền ngay khi mở màn hình)
    const userLocationCacheRef = useRef<Coords | null>(null);

    useEffect(() => {
        (async () => {
            try {
                const { status } = await Location.getForegroundPermissionsAsync();
                if (status === 'granted') {
                    const last = await Location.getLastKnownPositionAsync();
                    if (last) {
                        userLocationCacheRef.current = { lat: last.coords.latitude, lng: last.coords.longitude };
                    }
                    Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }).then((loc) => {
                        if (loc) {
                            userLocationCacheRef.current = { lat: loc.coords.latitude, lng: loc.coords.longitude };
                        }
                    }).catch(() => {});
                }
            } catch {
                // chạy ngầm không gây trở ngại
            }
        })();
    }, []);

    // 2. Chức năng Mở Bản Đồ Chọn Điểm - Mở tức thì 0ms, không bắt người dùng chờ GPS
    const webViewRef = useRef<WebView>(null);

    const handleOpenMapPicker = (target: 'pickup' | 'dropoff') => {
        setPickerTarget(target);
        setPickerSearchText('');
        setPickerPredictions([]);

        // 1. Lấy tọa độ khởi điểm ngay lập tức (0ms)
        const existingCoord = target === 'pickup' ? pickupCoords : dropoffCoords;
        const initial = existingCoord || userLocationCacheRef.current || pickupCoords || { lat: 10.7769, lng: 106.7009 };

        initialMapCoordsRef.current = initial;
        setPickerCoords(initial);

        // 2. MỞ MODAL NGAY TỨC THÌ (0ms)
        setIsMapPickerOpen(true);
        setIsMapLoading(true);

        // 3. Giải mã địa chỉ tại vị trí xuất phát
        resolvePickerAddress(initial.lat, initial.lng);

        // 4. Điều hướng bản đồ bay tới điểm (nếu WebView đã nạp)
        setTimeout(() => {
            flyToLocation(initial.lat, initial.lng);
        }, 150);

        // 5. Nếu chưa có vị trí GPS sẵn, cập nhật GPS nhanh trong nền và bay tới
        if (!existingCoord && !userLocationCacheRef.current) {
            Location.requestForegroundPermissionsAsync().then(({ status }) => {
                if (status === 'granted') {
                    Location.getLastKnownPositionAsync().then((last) => {
                        if (last) {
                            const cur = { lat: last.coords.latitude, lng: last.coords.longitude };
                            userLocationCacheRef.current = cur;
                            flyToLocation(cur.lat, cur.lng);
                        }
                    }).catch(() => {});

                    Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }).then((loc) => {
                        if (loc) {
                            const cur = { lat: loc.coords.latitude, lng: loc.coords.longitude };
                            userLocationCacheRef.current = cur;
                            flyToLocation(cur.lat, cur.lng);
                        }
                    }).catch(() => {});
                }
            }).catch(() => {});
        }
    };

    // Điều hướng bản đồ Goong bay tới tọa độ mới mượt mà
    const flyToLocation = (lat: number, lng: number) => {
        setPickerCoords({ lat, lng });
        resolvePickerAddress(lat, lng);
        webViewRef.current?.injectJavaScript(`
            if (typeof window.moveTo === 'function') {
                window.moveTo(${lat}, ${lng}, 16);
            } else if (window.map) {
                window.map.flyTo({ center: [${lng}, ${lat}], zoom: 16 });
            }
            true;
        `);
    };

    const zoomInMap = () => {
        webViewRef.current?.injectJavaScript(`
            if (window.map) { window.map.zoomIn(); }
            true;
        `);
    };

    const zoomOutMap = () => {
        webViewRef.current?.injectJavaScript(`
            if (window.map) { window.map.zoomOut(); }
            true;
        `);
    };

    const lastResolvedCoordRef = useRef<{ lat: number; lng: number } | null>(null);
    const reverseGeocodeDebounceTimerRef = useRef<any>(null);

    const resolvePickerAddress = (lat: number, lng: number) => {
        // Nếu tọa độ di chuyển chưa tới ~15 mét thì không gọi lại API
        if (
            lastResolvedCoordRef.current &&
            Math.abs(lastResolvedCoordRef.current.lat - lat) < 0.00015 &&
            Math.abs(lastResolvedCoordRef.current.lng - lng) < 0.00015
        ) {
            return;
        }

        setIsPickerResolving(true);
        if (reverseGeocodeDebounceTimerRef.current) clearTimeout(reverseGeocodeDebounceTimerRef.current);
        reverseGeocodeDebounceTimerRef.current = setTimeout(async () => {
            try {
                const addr = await GoongService.reverseGeocode(lat, lng);
                if (addr) {
                    lastResolvedCoordRef.current = { lat, lng };
                    setPickerAddress(addr);
                } else {
                    setPickerAddress(`Tọa độ: ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
                }
            } catch {
                setPickerAddress(`Tọa độ: ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
            } finally {
                setIsPickerResolving(false);
            }
        }, 300);
    };

    // Định vị vị trí của tôi trên Goong Map
    const handleLocateOnMap = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
                const location = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.High,
                });
                flyToLocation(location.coords.latitude, location.coords.longitude);
                return;
            }
        } catch (e) {
            console.warn('Lỗi định vị trên bản đồ:', e);
        }
        try {
            const loc = await GoongService.getCurrentLocation();
            flyToLocation(loc.latitude, loc.longitude);
        } catch {
            Alert.alert('Không thể định vị', 'Vui lòng kiểm tra quyền truy cập vị trí và kết nối mạng.');
        }
    };

    // Mã HTML nhúng Goong Vector Map WebGL chính thức
    // Dùng React.useMemo với [isDark] để HTML giữ nguyên trong bộ nhớ đệm WebView, mở tức thì 0ms
    const goongMapHtml = React.useMemo(() => {
        const initLat = initialMapCoordsRef.current.lat;
        const initLng = initialMapCoordsRef.current.lng;
        return `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin />
    <link rel="preconnect" href="https://tiles.goong.io" crossorigin />
    <link rel="dns-prefetch" href="https://tiles.goong.io" />
    <link href="https://cdn.jsdelivr.net/npm/maplibre-gl@3.6.2/dist/maplibre-gl.css" rel="stylesheet" />
    <script src="https://cdn.jsdelivr.net/npm/maplibre-gl@3.6.2/dist/maplibre-gl.js"></script>
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
        <svg width="44" height="44" viewBox="0 0 24 24" fill="#df1875" stroke="#ffffff" stroke-width="1.8">
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
            // Chỉ gửi thông điệp tính toán sau khi ngón tay đã DỪNG HẲN 600ms
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

        map.on('error', function(err) {
            if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'MAP_ERROR',
                    message: (err && err.error && err.error.message) || 'Lỗi tải bản đồ'
                }));
            }
        });
    </script>
</body>
</html>`;
    }, [isDark]);

    // Xác nhận vị trí từ bản đồ
    const handleConfirmMapPicker = () => {
        if (pickerTarget === 'pickup') {
            setPickupCoords(pickerCoords);
            setPickupAddress(pickerAddress || 'Vị trí đã chọn trên bản đồ');
            setPickupPredictions([]);
        } else {
            setDropoffCoords(pickerCoords);
            setDropoffAddress(pickerAddress || 'Vị trí đã chọn trên bản đồ');
            setDropoffPredictions([]);
        }
        setIsMapPickerOpen(false);
    };

    // Tính toán cước phí & Giảm giá ưu đãi
    const currentVehicle = VEHICLE_OPTIONS.find((v) => v.id === selectedVehicle) || VEHICLE_OPTIONS[1];
    const vehiclePrice = distanceKm > 0 ? currentVehicle.calculateFare(distanceKm) : 0;
    const parsedHelperWage = parseInt(helperWagePerPerson.replace(/\D/g, ''), 10) || 0;
    const helperTotalFee = helpersCount * parsedHelperWage;
    const subtotal = vehiclePrice + helperTotalFee;
    const voucherDiscount = selectedVoucher ? calculateVoucherDiscount(selectedVoucher, subtotal) : 0;
    const grandTotal = Math.max(0, subtotal - voucherDiscount);

    // Xử lý áp dụng mã Voucher nhập tay
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

    // Chọn voucher có sẵn từ danh sách
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

    // Hủy áp dụng voucher
    const handleRemoveVoucher = () => {
        setSelectedVoucher(null);
    };

    const handleSubmit = () => {
        if (!pickupAddress.trim()) {
            Alert.alert(t('common.error'), 'Vui lòng nhập hoặc chọn Điểm bốc hàng (Điểm A)');
            return;
        }
        if (!dropoffAddress.trim()) {
            Alert.alert(t('common.error'), 'Vui lòng nhập hoặc chọn Điểm giao hàng (Điểm B)');
            return;
        }
        if (distanceKm <= 0) {
            Alert.alert('Chưa có khoảng cách', 'Vui lòng chọn hoặc nhấp vào gợi ý địa chỉ để xác định khoảng cách quãng đường.');
            return;
        }

        const vehicleDisplayLabel =
            currentVehicle.id === 'van'
                ? `Xe Van (${vanCapacity === '500kg' ? '500kg' : '1 tấn'})`
                : `${currentVehicle.label} (${currentVehicle.weightLimit})`;

        const summaryLines = [
            `Điểm đi (A): ${pickupAddress}`,
            `Điểm đến (B): ${dropoffAddress}`,
            `Khoảng cách: ${distanceKm} km (~${durationMin} phút di chuyển)`,
            `Phương tiện: ${vehicleDisplayLabel} (${vehiclePrice.toLocaleString('vi-VN')} đ)`,
            `Phụ bốc xếp: ${helpersCount === 0 ? 'Tự khiêng (0 đ)' : `${helpersCount} người (${helperTotalFee.toLocaleString('vi-VN')} đ)`}`,
            selectedVoucher && voucherDiscount > 0 ? `Ưu đãi (${selectedVoucher.code}): -${voucherDiscount.toLocaleString('vi-VN')} đ` : null,
            transportNote.trim() ? `Ghi chú: ${transportNote.trim()}` : null,
        ].filter(Boolean).join('\n• ');

        Alert.alert(
            'Xác nhận đăng việc Vận chuyển',
            `Tổng chi phí ước tính: ${grandTotal.toLocaleString('vi-VN')} đ\n\n• ${summaryLines}`,
            [
                { text: 'Chỉnh sửa', style: 'cancel' },
                {
                    text: 'Tìm xe & thợ ngay',
                    onPress: () => {
                        Alert.alert('Thành công', 'Yêu cầu vận chuyển của bạn đã được phát sóng tới các tài xế quanh khu vực!');
                        router.replace('/(requester)');
                    },
                },
            ]
        );
    };

    // URL bản đồ hành trình Goong chính thức
    const routeMapVehicle = selectedVehicle === 'bike' ? 'bike' : 'car';
    const routePreviewMapUrl =
        pickupCoords && dropoffCoords
            ? GoongService.getStaticRouteMapUrl(pickupCoords.lat, pickupCoords.lng, dropoffCoords.lat, dropoffCoords.lng, routeMapVehicle, 600, 280)
            : null;

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
            <View style={{ flex: 1 }}>
                {/* Header Top Bar - Icon Only Back Button */}
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
                            Thuê Thợ Vận Chuyển
                        </Text>
                    </View>

                    <View style={{ width: 40 }} />
                </View>

                {/* Form cuộn nội dung */}
                <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
                    {/* KHỐI 1: TUYẾN ĐƯỜNG VẬN CHUYỂN */}
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
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <MapPin size={16} color={colors.primary} />
                                <Text style={{ fontSize: 14, fontWeight: '800', color: colors.text }}>
                                    Tuyến đường vận chuyển
                                </Text>
                            </View>
                            {distanceKm > 0 && (
                                <View
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        backgroundColor: isDark ? '#2e1065' : '#eff6ff',
                                        paddingHorizontal: 10,
                                        paddingVertical: 4,
                                        borderRadius: 20,
                                        borderWidth: 1,
                                        borderColor: colors.primary,
                                        gap: 4,
                                    }}
                                >
                                    <Route size={14} color={colors.primary} />
                                    <Text style={{ fontSize: 12, fontWeight: '800', color: colors.primary }}>
                                        {distanceKm} km (~{durationMin} phút)
                                    </Text>
                                </View>
                            )}
                        </View>

                        {/* 1.1 ĐIỂM BỐC HÀNG (ĐIỂM A) */}
                        <View style={{ marginBottom: 16 }}>
                            <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: 6 }}>
                                Điểm bốc hàng (Điểm A) *
                            </Text>

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
                                }}
                            >
                                <MapPin size={18} color="#16a34a" style={{ marginRight: 8 }} />
                                <TextInput
                                    value={pickupAddress}
                                    onChangeText={(t) => handleSearchLocation(t, true)}
                                    onSubmitEditing={() => handleAutoGeocode(pickupAddress, true)}
                                    returnKeyType="done"
                                    placeholder="Nhập địa chỉ nhà, căn hộ cần bốc đồ..."
                                    placeholderTextColor={colors.placeholder}
                                    style={{ flex: 1, fontSize: 13, color: colors.text }}
                                />
                                {isSearchingPickup && <ActivityIndicator size="small" color={colors.primary} style={{ marginRight: 6 }} />}
                                {pickupAddress.length > 0 && (
                                    <TouchableOpacity onPress={() => { setPickupAddress(''); setPickupCoords(null); setPickupPredictions([]); }}>
                                        <X size={16} color={colors.textSecondary} />
                                    </TouchableOpacity>
                                )}
                            </View>

                            {/* Gợi ý địa chỉ từ Goong Autocomplete */}
                            {pickupPredictions.length > 0 && (
                                <View style={{ marginTop: 6, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' }}>
                                    {pickupPredictions.slice(0, 4).map((item, i) => (
                                        <TouchableOpacity
                                            key={i}
                                            onPress={() => handleSelectPrediction(item, true)}
                                            style={{
                                                padding: 12,
                                                borderBottomWidth: i < pickupPredictions.length - 1 ? 1 : 0,
                                                borderColor: colors.border,
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                gap: 8,
                                            }}
                                        >
                                            <MapPin size={14} color="#16a34a" />
                                            <View style={{ flex: 1 }}>
                                                <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text }}>{item.mainText}</Text>
                                                <Text style={{ fontSize: 11, color: colors.textSecondary }} numberOfLines={1}>{item.secondaryText}</Text>
                                            </View>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}

                            {/* 2 NÚT HÀNH ĐỘNG CỐ ĐỊNH TRONG CARD */}
                            <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                                <TouchableOpacity
                                    onPress={() => handleUseCurrentLocation(true)}
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
                                    {isLocatingPickup ? (
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
                                    onPress={() => handleOpenMapPicker('pickup')}
                                    activeOpacity={0.75}
                                    style={{
                                        flex: 1,
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        paddingVertical: 9,
                                        paddingHorizontal: 8,
                                        borderRadius: 10,
                                        backgroundColor: isDark ? colors.surfaceContainer : '#ecfdf5',
                                        borderWidth: 1,
                                        borderColor: isDark ? colors.border : '#a7f3d0',
                                        gap: 6,
                                    }}
                                >
                                    <MapPin size={14} color="#059669" />
                                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#059669' }}>
                                        Chọn trên bản đồ
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* 1.2 ĐIỂM GIAO HÀNG (ĐIỂM B) */}
                        <View>
                            <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: 6 }}>
                                Điểm hạ hàng (Điểm B) *
                            </Text>

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
                                }}
                            >
                                <MapPin size={18} color={colors.secondary} style={{ marginRight: 8 }} />
                                <TextInput
                                    value={dropoffAddress}
                                    onChangeText={(t) => handleSearchLocation(t, false)}
                                    onSubmitEditing={() => handleAutoGeocode(dropoffAddress, false)}
                                    returnKeyType="done"
                                    placeholder="Nhập địa chỉ nhà mới, kho bãi chuyển đến..."
                                    placeholderTextColor={colors.placeholder}
                                    style={{ flex: 1, fontSize: 13, color: colors.text }}
                                />
                                {isSearchingDropoff && <ActivityIndicator size="small" color={colors.primary} style={{ marginRight: 6 }} />}
                                {dropoffAddress.length > 0 && (
                                    <TouchableOpacity onPress={() => { setDropoffAddress(''); setDropoffCoords(null); setDropoffPredictions([]); }}>
                                        <X size={16} color={colors.textSecondary} />
                                    </TouchableOpacity>
                                )}
                            </View>

                            {/* Gợi ý địa chỉ từ Goong Autocomplete */}
                            {dropoffPredictions.length > 0 && (
                                <View style={{ marginTop: 6, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' }}>
                                    {dropoffPredictions.slice(0, 4).map((item, i) => (
                                        <TouchableOpacity
                                            key={i}
                                            onPress={() => handleSelectPrediction(item, false)}
                                            style={{
                                                padding: 12,
                                                borderBottomWidth: i < dropoffPredictions.length - 1 ? 1 : 0,
                                                borderColor: colors.border,
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                gap: 8,
                                            }}
                                        >
                                            <MapPin size={14} color={colors.secondary} />
                                            <View style={{ flex: 1 }}>
                                                <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text }}>{item.mainText}</Text>
                                                <Text style={{ fontSize: 11, color: colors.textSecondary }} numberOfLines={1}>{item.secondaryText}</Text>
                                            </View>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}

                            {/* 2 NÚT HÀNH ĐỘNG CỐ ĐỊNH TRONG CARD */}
                            <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                                <TouchableOpacity
                                    onPress={() => handleUseCurrentLocation(false)}
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
                                    {isLocatingDropoff ? (
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
                                    onPress={() => handleOpenMapPicker('dropoff')}
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
                        </View>

                        {/* Xem trước bản đồ tuyến đường A -> B chính thức */}
                        {pickupCoords && dropoffCoords && (
                            <View
                                style={{
                                    marginTop: 16,
                                    borderRadius: 16,
                                    overflow: 'hidden',
                                    borderWidth: 1,
                                    borderColor: isDark ? colors.border : '#e2e8f0',
                                    backgroundColor: colors.surfaceContainerLow,
                                }}
                            >
                                {/* Header của Card xem trước lộ trình */}
                                <View
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        paddingHorizontal: 12,
                                        paddingVertical: 10,
                                        backgroundColor: colors.surface,
                                        borderBottomWidth: 1,
                                        borderColor: isDark ? colors.border : '#e2e8f0',
                                    }}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                                        <Route size={16} color={colors.primary} />
                                        <Text style={{ fontSize: 13, fontWeight: '800', color: colors.text }}>
                                            Xem trước tuyến đường di chuyển
                                        </Text>
                                    </View>
                                    {isCalculatingDistance ? (
                                        <ActivityIndicator size="small" color={colors.primary} />
                                    ) : (
                                        <View style={{ backgroundColor: '#16a34a15', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                                            <Text style={{ fontSize: 11, fontWeight: '800', color: '#16a34a' }}>
                                                {distanceKm > 0 ? `${distanceKm} km` : 'Đang tính'}
                                            </Text>
                                        </View>
                                    )}
                                </View>

                                {/* Nội dung bản đồ / Loading / Fallback đồ họa tuyến đường */}
                                {isCalculatingDistance ? (
                                    <View style={{ height: 140, alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                        <ActivityIndicator size="large" color={colors.primary} />
                                        <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textSecondary }}>
                                            Đang tính lộ trình xe chạy thực tế...
                                        </Text>
                                    </View>
                                ) : !routeMapError && routePreviewMapUrl ? (
                                    <View style={{ height: 160, position: 'relative', backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }}>
                                        <Image
                                            source={{ uri: routePreviewMapUrl }}
                                            style={{ width: '100%', height: 160 }}
                                            contentFit="cover"
                                            onLoadStart={() => setIsRouteMapLoading(true)}
                                            onLoadEnd={() => setIsRouteMapLoading(false)}
                                            onError={() => {
                                                setIsRouteMapLoading(false);
                                                setRouteMapError(true);
                                            }}
                                        />
                                        {isRouteMapLoading && (
                                            <View
                                                style={{
                                                    position: 'absolute',
                                                    top: 0,
                                                    left: 0,
                                                    right: 0,
                                                    bottom: 0,
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    backgroundColor: isDark ? 'rgba(15,23,42,0.6)' : 'rgba(255,255,255,0.7)',
                                                    gap: 6,
                                                }}
                                            >
                                                <ActivityIndicator size="small" color={colors.primary} />
                                                <Text style={{ fontSize: 11, fontWeight: '600', color: colors.textSecondary }}>
                                                    Đang tải bản đồ tuyến đường...
                                                </Text>
                                            </View>
                                        )}
                                        <View
                                            style={{
                                                position: 'absolute',
                                                bottom: 8,
                                                left: 8,
                                                right: 8,
                                                backgroundColor: isDark ? 'rgba(15,23,42,0.9)' : 'rgba(255,255,255,0.94)',
                                                paddingHorizontal: 10,
                                                paddingVertical: 5,
                                                borderRadius: 8,
                                                borderWidth: 1,
                                                borderColor: colors.border,
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                            }}
                                        >
                                            <Text style={{ fontSize: 11, fontWeight: '700', color: colors.text }}>
                                                {distanceKm} km xe chạy • ~{durationMin} phút di chuyển
                                            </Text>
                                            <Text style={{ fontSize: 10, fontWeight: '700', color: '#16a34a' }}>
                                                Đường bộ thực tế
                                            </Text>
                                        </View>
                                    </View>
                                ) : (
                                    /* Đồ họa lộ trình dự phòng khi không tải được ảnh tĩnh từ máy chủ */
                                    <View style={{ padding: 16, backgroundColor: colors.surfaceContainerLow, gap: 10 }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#10b981' }} />
                                            <Text style={{ fontSize: 12, fontWeight: '700', color: colors.text, flex: 1 }} numberOfLines={1}>
                                                Điểm A: {pickupAddress || 'Điểm bốc hàng'}
                                            </Text>
                                        </View>
                                        <View style={{ marginLeft: 4, height: 16, borderLeftWidth: 2, borderLeftColor: colors.primary, borderStyle: 'dashed' }} />
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#f43f5e' }} />
                                            <Text style={{ fontSize: 12, fontWeight: '700', color: colors.text, flex: 1 }} numberOfLines={1}>
                                                Điểm B: {dropoffAddress || 'Điểm giao hàng'}
                                            </Text>
                                        </View>
                                        <View style={{ backgroundColor: colors.surface, padding: 8, borderRadius: 8, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', justifyContent: 'space-between' }}>
                                            <Text style={{ fontSize: 12, fontWeight: '700', color: colors.primary }}>
                                                Quãng đường: {distanceKm} km (đường bộ xe chạy)
                                            </Text>
                                            <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                                                Thời gian: ~{durationMin} phút
                                            </Text>
                                        </View>
                                    </View>
                                )}
                            </View>
                        )}
                    </View>

                    {/* KHỐI 2: CHỌN LOẠI XE - TÍNH THEO QUÃNG ĐƯỜNG THỰC TẾ */}
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
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <Truck size={16} color={colors.primary} />
                                <Text style={{ fontSize: 14, fontWeight: '800', color: colors.text }}>
                                    Chọn loại xe phù hợp
                                </Text>
                            </View>
                            {isCalculatingDistance ? (
                                <ActivityIndicator size="small" color={colors.primary} />
                            ) : distanceKm > 0 ? (
                                <Text style={{ fontSize: 12, fontWeight: '700', color: '#16a34a' }}>
                                    Đã tính cước {distanceKm} km
                                </Text>
                            ) : (
                                <Text style={{ fontSize: 11, color: colors.textSecondary }}>
                                    Nhập 2 điểm để tính giá
                                </Text>
                            )}
                        </View>

                        <View style={{ gap: 10 }}>
                            {VEHICLE_OPTIONS.map((v) => {
                                const isSelected = selectedVehicle === v.id;
                                const calculatedPrice = distanceKm > 0 ? v.calculateFare(distanceKm) : 0;

                                return (
                                    <TouchableOpacity
                                        key={v.id}
                                        activeOpacity={0.85}
                                        onPress={() => setSelectedVehicle(v.id)}
                                        style={{
                                            padding: 14,
                                            borderRadius: 16,
                                            borderWidth: 1.5,
                                            borderColor: isSelected ? colors.primary : colors.border,
                                            backgroundColor: isSelected ? (isDark ? '#2e1065' : '#fcfaff') : colors.surface,
                                            ...shadows.soft,
                                        }}
                                    >
                                        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                                            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, flex: 1 }}>
                                                <View
                                                    style={{
                                                        width: 50,
                                                        height: 50,
                                                        borderRadius: 14,
                                                        backgroundColor: isSelected
                                                            ? (isDark ? '#172554' : '#eff6ff')
                                                            : (isDark ? colors.surfaceContainer : '#f8fafc'),
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        borderWidth: 1.5,
                                                        borderColor: isSelected ? colors.primary : (isDark ? colors.border : '#e2e8f0'),
                                                        marginTop: 2,
                                                    }}
                                                >
                                                    <Image
                                                        source={v.iconAsset}
                                                        style={{ width: 40, height: 40 }}
                                                        contentFit="contain"
                                                    />
                                                </View>
                                                <View style={{ flex: 1 }}>
                                                    {/* Tên xe & Huy hiệu tải trọng */}
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                                        <Text style={{ fontSize: 15, fontWeight: '800', color: isSelected ? colors.primary : colors.text }}>
                                                            {v.label}
                                                        </Text>
                                                        <View
                                                            style={{
                                                                backgroundColor: isSelected ? colors.primary + '20' : colors.surfaceContainer,
                                                                paddingHorizontal: 8,
                                                                paddingVertical: 2,
                                                                borderRadius: 6,
                                                                borderWidth: 1,
                                                                borderColor: isSelected ? colors.primary + '40' : colors.border,
                                                            }}
                                                        >
                                                            <Text
                                                                style={{
                                                                    fontSize: 11,
                                                                    fontWeight: '700',
                                                                    color: isSelected ? colors.primary : colors.textSecondary,
                                                                }}
                                                            >
                                                                {v.id === 'van' ? (vanCapacity === '500kg' ? 'Tải 500kg' : 'Tải 1 tấn') : v.weightLimit}
                                                            </Text>
                                                        </View>
                                                    </View>

                                                    {/* Mô tả nghiệp vụ chuyên biệt */}
                                                    <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4, lineHeight: 17 }}>
                                                        {v.sub}
                                                    </Text>

                                                    {/* Thông tin đơn giá */}
                                                    <Text style={{ fontSize: 11, color: isSelected ? colors.primary : colors.textTertiary, marginTop: 6, fontWeight: '600' }}>
                                                        Mở cửa {v.baseKm}km đầu: {v.basePrice.toLocaleString('vi-VN')}đ • Thêm {v.pricePerKm.toLocaleString('vi-VN')}đ/km
                                                    </Text>
                                                </View>
                                            </View>

                                            {/* Giá cước tính theo km */}
                                            <View style={{ alignItems: 'flex-end', marginLeft: 10 }}>
                                                {distanceKm > 0 ? (
                                                    <Text style={{ fontSize: 16, fontWeight: '800', color: colors.primary }}>
                                                        {calculatedPrice.toLocaleString('vi-VN')} đ
                                                    </Text>
                                                ) : (
                                                    <View style={{ backgroundColor: colors.surfaceContainerLow, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                                                        <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textSecondary }}>
                                                            Từ {v.basePrice.toLocaleString('vi-VN')} đ
                                                        </Text>
                                                    </View>
                                                )}
                                            </View>
                                        </View>

                                        {/* TÙY CHỌN RIÊNG CHO XE VAN: 500KG HOẶC 1 TẤN */}
                                        {v.id === 'van' && isSelected && (
                                            <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderColor: colors.border }}>
                                                <Text style={{ fontSize: 12, fontWeight: '700', color: colors.text, marginBottom: 8 }}>
                                                    Chọn tải trọng Xe Van:
                                                </Text>
                                                <View style={{ flexDirection: 'row', gap: 8 }}>
                                                    <TouchableOpacity
                                                        onPress={() => setVanCapacity('500kg')}
                                                        style={{
                                                            flex: 1,
                                                            paddingVertical: 8,
                                                            paddingHorizontal: 10,
                                                            borderRadius: 10,
                                                            backgroundColor: vanCapacity === '500kg' ? colors.primary : colors.surfaceContainer,
                                                            borderWidth: 1.5,
                                                            borderColor: vanCapacity === '500kg' ? colors.primary : colors.border,
                                                            alignItems: 'center',
                                                        }}
                                                    >
                                                        <Text
                                                            style={{
                                                                fontSize: 12,
                                                                fontWeight: '800',
                                                                color: vanCapacity === '500kg' ? '#ffffff' : colors.text,
                                                            }}
                                                        >
                                                            Van 500kg (Tải nhẹ)
                                                        </Text>
                                                        <Text
                                                            style={{
                                                                fontSize: 10,
                                                                color: vanCapacity === '500kg' ? '#eff6ff' : colors.textSecondary,
                                                                marginTop: 2,
                                                            }}
                                                        >
                                                            Chạy 24/24 trong phố
                                                        </Text>
                                                    </TouchableOpacity>

                                                    <TouchableOpacity
                                                        onPress={() => setVanCapacity('1ton')}
                                                        style={{
                                                            flex: 1,
                                                            paddingVertical: 8,
                                                            paddingHorizontal: 10,
                                                            borderRadius: 10,
                                                            backgroundColor: vanCapacity === '1ton' ? colors.primary : colors.surfaceContainer,
                                                            borderWidth: 1.5,
                                                            borderColor: vanCapacity === '1ton' ? colors.primary : colors.border,
                                                            alignItems: 'center',
                                                        }}
                                                    >
                                                        <Text
                                                            style={{
                                                                fontSize: 12,
                                                                fontWeight: '800',
                                                                color: vanCapacity === '1ton' ? '#ffffff' : colors.text,
                                                            }}
                                                        >
                                                            Van 1 tấn (Thùng rộng)
                                                        </Text>
                                                        <Text
                                                            style={{
                                                                fontSize: 10,
                                                                color: vanCapacity === '1ton' ? '#eff6ff' : colors.textSecondary,
                                                                marginTop: 2,
                                                            }}
                                                        >
                                                            Chở đồ nhiều, thùng kín
                                                        </Text>
                                                    </TouchableOpacity>
                                                </View>
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    {/* KHỐI 3: NGƯỜI PHỤ BỐC XẾP - TÙY CHỌN SỐ LƯỢNG & TỰ NHẬP TIỀN CÔNG */}
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
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 }}>
                            <Users size={16} color={colors.primary} />
                            <Text style={{ fontSize: 14, fontWeight: '800', color: colors.text }}>
                                Người phụ bốc xếp
                            </Text>
                        </View>

                        {/* 3.1 Bộ chọn số lượng người (0 đến 10) */}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <View>
                                <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text }}>
                                    Số thợ phụ bốc vác
                                </Text>
                                <Text style={{ fontSize: 11, color: colors.textSecondary }}>
                                    {helpersCount === 0 ? 'Tự khiêng / Bác tài hỗ trợ nhẹ' : `Cần ${helpersCount} người phụ khiêng vác`}
                                </Text>
                            </View>

                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                <TouchableOpacity
                                    onPress={() => setHelpersCount((prev) => Math.max(0, prev - 1))}
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
                                    {helpersCount}
                                </Text>

                                <TouchableOpacity
                                    onPress={() => setHelpersCount((prev) => Math.min(10, prev + 1))}
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

                        {/* 3.2 Nhập tiền công cho mỗi người phụ */}
                        {helpersCount > 0 && (
                            <View style={{ paddingTop: 12, borderTopWidth: 1, borderColor: colors.border }}>
                                <Text style={{ fontSize: 12, fontWeight: '700', color: colors.text, marginBottom: 6 }}>
                                    Mức tiền công cho mỗi thợ phụ
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
                                        borderColor: isDark ? colors.border : '#e2e8f0',
                                        marginBottom: 10,
                                    }}
                                >
                                    <TextInput
                                        value={helperWagePerPerson}
                                        onChangeText={handleHelperWageChange}
                                        keyboardType="numeric"
                                        placeholder="150.000"
                                        placeholderTextColor={colors.placeholder}
                                        style={{ flex: 1, fontSize: 15, fontWeight: '700', color: colors.primary }}
                                    />
                                    <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textSecondary }}>VNĐ / người</Text>
                                </View>

                                {/* Các mức giá gợi ý nhanh */}
                                <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                                    {['100.000', '150.000', '200.000', '250.000'].map((val) => (
                                        <TouchableOpacity
                                            key={val}
                                            onPress={() => setHelperWagePerPerson(val)}
                                            style={{
                                                paddingHorizontal: 12,
                                                paddingVertical: 6,
                                                borderRadius: 8,
                                                backgroundColor: helperWagePerPerson === val ? colors.primary + '15' : colors.surfaceContainer,
                                                borderWidth: 1,
                                                borderColor: helperWagePerPerson === val ? colors.primary : colors.border,
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    fontSize: 11,
                                                    fontWeight: '700',
                                                    color: helperWagePerPerson === val ? colors.primary : colors.textSecondary,
                                                }}
                                            >
                                                {val} đ
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        )}
                    </View>

                    {/* KHỐI 4: GHI CHÚ VẬN CHUYỂN, THANG MÁY, LẦU CAO, ĐỒ CỒNG KỀNH */}
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
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                            <FileText size={16} color={colors.primary} />
                            <Text style={{ fontSize: 14, fontWeight: '800', color: colors.text }}>
                                Ghi chú vận chuyển & địa hình
                            </Text>
                        </View>
                        <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 10 }}>
                            Ghi rõ thông tin lầu cao, thang máy, đồ nặng cồng kềnh hoặc ngõ hẹp xe vào...
                        </Text>
                        <TextInput
                            value={transportNote}
                            onChangeText={setTransportNote}
                            placeholder="Ví dụ: Điểm A lầu 3 thang máy rộng, đồ gồm 1 tủ lạnh 2 cánh, 1 đệm lò xo. Điểm B nhà trệt hẻm xe tải vào tận cửa..."
                            placeholderTextColor={colors.placeholder}
                            multiline
                            numberOfLines={4}
                            style={{
                                backgroundColor: colors.surfaceContainerLow,
                                borderRadius: 14,
                                padding: 12,
                                fontSize: 13,
                                color: colors.text,
                                textAlignVertical: 'top',
                                minHeight: 85,
                                borderWidth: 1,
                                borderColor: isDark ? colors.border : '#e2e8f0',
                            }}
                        />
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

                    {/* KHỐI 5: TỔNG DỰ TOÁN CƯỚC PHÍ & NÚT ĐĂNG VIỆC */}
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
                        <View style={{ marginBottom: distanceKm > 0 ? 10 : 0 }}>
                            <Text style={{ fontSize: 12, color: colors.textSecondary, fontWeight: '600' }}>
                                {distanceKm > 0 ? `Tổng cước ước tính (${distanceKm} km)` : 'Vui lòng chọn tuyến đường'}
                            </Text>
                            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 10, marginTop: 3 }}>
                                <Text style={{ fontSize: 24, fontWeight: '900', color: colors.primary }}>
                                    {distanceKm > 0 ? `${grandTotal.toLocaleString('vi-VN')} đ` : 'Chưa có khoảng cách'}
                                </Text>
                                {selectedVoucher && voucherDiscount > 0 && distanceKm > 0 && (
                                    <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textSecondary, textDecorationLine: 'line-through' }}>
                                        {subtotal.toLocaleString('vi-VN')} đ
                                    </Text>
                                )}
                            </View>
                        </View>

                        {/* Chi tiết cước Xe & Thợ & Giảm giá (không bị tràn màn hình, tự động xuống dòng linh hoạt) */}
                        {distanceKm > 0 && (
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
                                    <Truck size={13} color={colors.primary} />
                                    <Text style={{ fontSize: 12, fontWeight: '700', color: colors.text }}>
                                        Xe: {vehiclePrice.toLocaleString('vi-VN')} đ
                                    </Text>
                                </View>

                                {helpersCount > 0 && (
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
                                        <Users size={13} color={colors.secondary} />
                                        <Text style={{ fontSize: 12, fontWeight: '700', color: colors.text }}>
                                            Thợ ({helpersCount} người): {helperTotalFee.toLocaleString('vi-VN')} đ
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
                                    {distanceKm > 0 ? 'Tìm xe & thợ vận chuyển ngay' : 'Chọn điểm đón & trả để tiếp tục'}
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </ScrollView>

                <GlassBottomBar />
            </View>

            {/* MODAL CHỌN TRÊN BẢN ĐỒ - CHUẨN SAFE AREA TOÀN DIỆN CHO TAI THỎ & HOME BAR */}
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
                    {/* Header Modal - Được đẩy xuống dưới tai thỏ / Dynamic Island 100% */}
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
                            {pickerTarget === 'pickup' ? 'Chọn Điểm bốc hàng (A)' : 'Chọn Điểm hạ hàng (B)'}
                        </Text>

                        <View style={{ width: 40 }} />
                    </View>

                    {/* Thanh tìm kiếm nhanh địa danh trên bản đồ */}
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

                    {/* VÙNG BẢN ĐỒ VECTOR GOONG MAPS TƯƠNG TÁC CHÍNH THỨC */}
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

                        {/* Nút định vị GPS vị trí hiện tại của tôi trên bản đồ */}
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

                        {/* Nút Phóng to / Thu nhỏ (Zoom In / Zoom Out) */}
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

                    {/* Bottom Card: Hiển thị địa chỉ đã giải mã từ Goong & Nút xác nhận */}
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
                    {/* Header Modal - Safe Area Top */}
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
                                        placeholder="Ví dụ: FLASH20K, TROGIA30K..."
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
                                            {/* Icon bên trái */}
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

                                            {/* Chi tiết mã */}
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

                                                    {/* Nút hành động */}
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

                    {/* Footer Modal - Safe Area Bottom */}
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
