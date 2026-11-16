import React, { useRef, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Animated,
    useWindowDimensions,
    ScrollView,
    Modal,
    Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
    Plus,
    ArrowRight,
    Bell,
    ShieldCheck,
    Sparkles,
    Ticket,
    ChevronRight,
    X,
    Copy,
    Check,
    Gift,
    BadgePercent,
} from 'lucide-react-native';
import GlassBottomBar from '../../components/GlassBottomBar';
import { useAuthStore } from '../../store/useAuthStore';
import { useAppTheme } from '../../constants/theme';
import { useI18n } from '../../i18n';

// 8 Icon danh mục chuẩn từ thư mục assets/icon-cate
const CATE_ICONS: Record<string, any> = {
    'van-chuyen': require('../../../assets/icon-cate/van-chuyen.png'),
    've-sinh-don-dep': require('../../../assets/icon-cate/ve-sinh-don-dep.png'),
    'viec-nang': require('../../../assets/icon-cate/viec-nang.png'),
    'sua-chua': require('../../../assets/icon-cate/sua-chua.png'),
    'phuc-vu': require('../../../assets/icon-cate/phuc-vu.png'),
    'cham-soc': require('../../../assets/icon-cate/cham-soc.png'),
    'chuyen-mon': require('../../../assets/icon-cate/chuyen-mon.png'),
    'khac': require('../../../assets/icon-cate/khac.png'),
};

// 4 Banner Giới thiệu dịch vụ từ thư mục assets/banner-introduce (Tỉ lệ ngang 3:1)
const INTRODUCE_BANNERS = [
    {
        id: 'intro-1',
        image: require('../../../assets/banner-introduce/banner-1.png'),
        title: 'Thợ nhanh JobFlash',
        subtitle: 'Có mặt ngay trong 30 - 60 phút',
        actionRoute: '/(requester)/create',
    },
    {
        id: 'intro-2',
        image: require('../../../assets/banner-introduce/banner-2.png'),
        title: 'Bảo hiểm FlashCare',
        subtitle: 'Thợ xác minh NFC - Đổi thợ trong 15p nếu không hài lòng',
        actionRoute: '/(requester)/create',
    },
    {
        id: 'intro-3',
        image: require('../../../assets/banner-introduce/banner-3.png'),
        title: 'Đa dạng ngành nghề',
        subtitle: '8 nhóm dịch vụ phục vụ mọi nhu cầu gia đình và công việc',
        actionRoute: '/(requester)/create',
    },
    {
        id: 'intro-4',
        image: require('../../../assets/banner-introduce/banner-4.png'),
        title: 'Kết nối tức thì',
        subtitle: 'Đăng việc 30 giây - Hàng ngàn thợ sẵn sàng nhận việc',
        actionRoute: '/(requester)/create',
    },
];

// 5 Banner Khuyến mãi từ thư mục assets/banner-khuyenmai (Card dọc phong cách Grab, Be, Xanh SM)
interface PromoItem {
    id: string;
    image: any;
    title: string;
    description: string;
    code: string;
    badge: string;
    badgeColor: string;
    discountText: string;
    expiryText: string;
}

const PROMO_BANNERS: PromoItem[] = [
    {
        id: 'promo-1',
        image: require('../../../assets/banner-khuyenmai/ng-thue-moi.png'),
        title: 'Ưu đãi người thuê mới',
        description: 'Giảm ngay 20.000đ cho yêu cầu đầu tiên trên JobFlash',
        code: 'FLASH20K',
        badge: 'MỚI',
        badgeColor: '#ec4899',
        discountText: 'Giảm 20K',
        expiryText: 'HSD: 30/11/2026',
    },
    {
        id: 'promo-2',
        image: require('../../../assets/banner-khuyenmai/gioi-thieu.png'),
        title: 'Giới thiệu bạn bè',
        description: 'Tặng voucher 50.000đ khi mời người thân tải và đặt thợ',
        code: 'BANMOI50K',
        badge: 'QUÀ TẶNG',
        badgeColor: '#8b5cf6',
        discountText: 'Tặng 50K',
        expiryText: 'HSD: 31/12/2026',
    },
    {
        id: 'promo-3',
        image: require('../../../assets/banner-khuyenmai/ng-moi.png'),
        title: 'Quà chào bạn mới',
        description: 'Giảm 10% tối đa 50.000đ cho mọi đơn từ 150.000đ',
        code: 'GIAM10',
        badge: 'ƯU ĐÃI',
        badgeColor: '#10b981',
        discountText: 'Giảm 10%',
        expiryText: 'HSD: 31/12/2026',
    },
    {
        id: 'promo-4',
        image: require('../../../assets/banner-khuyenmai/lam-du.png'),
        title: 'Tích điểm thợ ruột',
        description: 'Hoàn tiền lên tới 50.000đ khi hoàn tất từ 3 ca trong tháng',
        code: 'VIP50K',
        badge: 'HOÀN TIỀN',
        badgeColor: '#f59e0b',
        discountText: 'Hoàn 50K',
        expiryText: 'HSD: 31/12/2026',
    },
    {
        id: 'promo-5',
        image: require('../../../assets/banner-khuyenmai/tai-app.png'),
        title: 'Đặc quyền ứng dụng',
        description: 'Nhận trọn bộ mã giảm giá dịch vụ sửa chữa và dọn nhà',
        code: 'TAIAPP',
        badge: 'HOT',
        badgeColor: '#ef4444',
        discountText: 'Trọn bộ quà',
        expiryText: 'HSD: 31/12/2026',
    },
];

export default function RequesterHomeScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const currentUser = useAuthStore((state) => state.user);
    const { colors, gradients, shadows, isDark } = useAppTheme();
    const { t, language } = useI18n();
    const { width: SCREEN_WIDTH } = useWindowDimensions();

    // Hiệu ứng cuộn theo dõi vị trí Scroll
    const scrollY = useRef(new Animated.Value(0)).current;

    // Quản lý Carousel Banner Giới Thiệu
    const [activeBannerIdx, setActiveBannerIdx] = useState(0);

    // Modal Chi tiết Ưu đãi / Banner
    const [selectedPromo, setSelectedPromo] = useState<PromoItem | null>(null);
    const [isCopied, setIsCopied] = useState(false);
    const [showAllPromos, setShowAllPromos] = useState(false);

    // Chiều cao chuẩn của Header Gradient hiển thị trên màn hình
    const VISIBLE_BG_HEIGHT = insets.top + 170;
    // Đệm 500px phía trên đỉnh: Cố định cứng, kéo cỡ nào cũng không bị khoảng trắng
    const OVER_PULL_BUFFER = 500;

    // Khi kéo/vuốt xuống (scrollY < 0): Background tự động dài ra theo cử chỉ kéo
    const dynamicBgHeight = scrollY.interpolate({
        inputRange: [-400, 0],
        outputRange: [VISIBLE_BG_HEIGHT + OVER_PULL_BUFFER + 400, VISIBLE_BG_HEIGHT + OVER_PULL_BUFFER],
        extrapolateRight: 'clamp',
    });

    // Khi lướt lên (scrollY > 0): Cả background trôi lên theo ngón tay cuộn 1:1 cùng dòng chữ chào & thẻ đăng việc
    const dynamicBgTranslateY = scrollY.interpolate({
        inputRange: [-1, 0, 1],
        outputRange: [0, 0, -1],
    });

    // Tính toán kích thước 4 cột danh mục vừa vặn mọi màn hình
    const CARD_GAP = 10;
    const HORIZONTAL_PADDING = 16;
    const CARD_WIDTH = (SCREEN_WIDTH - HORIZONTAL_PADDING * 2 - CARD_GAP * 3) / 4;

    // Chiều rộng slide banner giới thiệu: chiếm đúng 3/4 (75%) chiều ngang màn hình
    const INTRO_BANNER_WIDTH = Math.round(SCREEN_WIDTH * 0.75);
    const INTRO_BANNER_GAP = 12;
    // Tỉ lệ chuẩn 3:1 của ảnh banner (2172 x 724)
    const INTRO_BANNER_HEIGHT = Math.round(INTRO_BANNER_WIDTH / 3);

    // Kích thước card khuyến mãi: layout 2 card / hàng và xuống dòng (Grid 2 cột)
    const PROMO_GRID_GAP = 12;
    const PROMO_CARD_WIDTH = Math.floor((SCREEN_WIDTH - HORIZONTAL_PADDING * 2 - PROMO_GRID_GAP) / 2);
    const PROMO_CARD_IMG_HEIGHT = Math.round(PROMO_CARD_WIDTH * 0.92);
    const displayedPromos = showAllPromos ? PROMO_BANNERS : PROMO_BANNERS.slice(0, 4);

    // 8 Danh mục tương ứng đúng 100% với file png trong assets/icon-cate
    const CATEGORIES = [
        { key: 'van-chuyen', name: language === 'vi' ? 'Vận chuyển' : 'Delivery', icon: CATE_ICONS['van-chuyen'], index: 0 },
        { key: 've-sinh-don-dep', name: language === 'vi' ? 'Vệ sinh' : 'Cleaning', icon: CATE_ICONS['ve-sinh-don-dep'], index: 1 },
        { key: 'viec-nang', name: language === 'vi' ? 'Việc nặng' : 'Heavy Lifting', icon: CATE_ICONS['viec-nang'], index: 2 },
        { key: 'sua-chua', name: language === 'vi' ? 'Sửa chữa' : 'Repair', icon: CATE_ICONS['sua-chua'], index: 3 },
        { key: 'phuc-vu', name: language === 'vi' ? 'Phục vụ' : 'Service', icon: CATE_ICONS['phuc-vu'], index: 4 },
        { key: 'cham-soc', name: language === 'vi' ? 'Chăm sóc' : 'Care', icon: CATE_ICONS['cham-soc'], index: 5 },
        { key: 'chuyen-mon', name: language === 'vi' ? 'Chuyên môn' : 'Professional', icon: CATE_ICONS['chuyen-mon'], index: 6 },
        { key: 'khac', name: language === 'vi' ? 'Khác' : 'Others', icon: CATE_ICONS['khac'], index: 7 },
    ];

    const handleSelectCategory = (cat: typeof CATEGORIES[0]) => {
        router.push(`/(requester)/categories/${cat.key}` as any);
    };

    const handleOpenPromoDetail = (promo: PromoItem) => {
        setSelectedPromo(promo);
        setIsCopied(false);
    };

    const handleCopyPromoCode = () => {
        if (!selectedPromo) return;
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <StatusBar style="light" />

            {/* 1. HEADER BACKGROUND: TỰ DÀI RA KHI KÉO XUỐNG, LƯỚT LÊN THÌ TRÔI THEO VÀ MỜ NHẸ Ở BOTTOM */}
            <Animated.View
                style={{
                    position: 'absolute',
                    top: -OVER_PULL_BUFFER,
                    left: 0,
                    right: 0,
                    height: dynamicBgHeight,
                    transform: [{ translateY: dynamicBgTranslateY }],
                    zIndex: 0,
                    overflow: 'hidden',
                }}
            >
                <LinearGradient
                    colors={gradients.electric}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ flex: 1, position: 'relative' }}
                >
                    {/* Họa tiết vòng tròn kính mờ nghệ thuật */}
                    <View
                        pointerEvents="none"
                        style={{
                            position: 'absolute',
                            top: OVER_PULL_BUFFER - 40,
                            right: -40,
                            width: 250,
                            height: 250,
                            borderRadius: 125,
                            borderWidth: 30,
                            borderColor: 'rgba(255, 255, 255, 0.16)',
                        }}
                    />
                    <View
                        pointerEvents="none"
                        style={{
                            position: 'absolute',
                            top: OVER_PULL_BUFFER + insets.top,
                            left: -60,
                            width: 210,
                            height: 210,
                            borderRadius: 105,
                            borderWidth: 22,
                            borderColor: 'rgba(255, 255, 255, 0.12)',
                        }}
                    />

                    {/* LỚP ĐỠ MỜ NHẸ Ở BOTTOM (FADE OUT MỊN VÀO NỀN NỘI DUNG) */}
                    <LinearGradient
                        colors={['rgba(255, 255, 255, 0)', colors.background]}
                        style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: 54,
                        }}
                    />
                </LinearGradient>
            </Animated.View>

            {/* 2. NỘI DUNG CUỘN CHÍNH */}
            <Animated.ScrollView
                contentContainerStyle={{
                    paddingTop: insets.top + 8,
                    paddingBottom: 110,
                }}
                bounces={true}
                overScrollMode="always"
                showsVerticalScrollIndicator={false}
                scrollEventThrottle={16}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: false }
                )}
                style={{ zIndex: 10, flex: 1 }}
            >
                {/* DÒNG CHỮ CHÀO & NÚT THÔNG BÁO */}
                <View
                    style={{
                        paddingHorizontal: 16,
                        paddingBottom: 16,
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}
                >
                    <View style={{ flex: 1, paddingRight: 10 }}>
                        <Text
                            style={{
                                fontSize: 22,
                                fontWeight: '800',
                                color: '#ffffff',
                                letterSpacing: -0.4,
                            }}
                            numberOfLines={1}
                        >
                            Chào {currentUser?.fullName && currentUser.fullName !== 'Người dùng mới'
                                ? currentUser.fullName
                                : 'Lê Công Chung'}
                        </Text>
                        <Text style={{ fontSize: 13, color: '#dbeafe', fontWeight: '600', marginTop: 2 }}>
                            {language === 'vi' ? 'Hôm nay bạn cần thuê thợ gì?' : 'Find reliable workers for your gigs'}
                        </Text>
                    </View>

                    {/* Chuông thông báo */}
                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => router.push('/(shared)/notifications')}
                        style={{
                            width: 40,
                            height: 40,
                            borderRadius: 20,
                            backgroundColor: 'rgba(255, 255, 255, 0.22)',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderWidth: 1,
                            borderColor: 'rgba(255, 255, 255, 0.35)',
                        }}
                    >
                        <Bell size={18} color="#ffffff" />
                    </TouchableOpacity>
                </View>

                {/* THẺ ĐĂNG VIỆC NỔI BẬT (HERO ACTION CARD) */}
                <View style={{ paddingHorizontal: 16 }}>
                    <TouchableOpacity
                        activeOpacity={0.88}
                        onPress={() => router.push('/(requester)/create')}
                        style={[
                            {
                                borderRadius: 22,
                                backgroundColor: colors.surface,
                                borderWidth: 1.5,
                                borderColor: colors.border,
                                paddingVertical: 16,
                                paddingHorizontal: 18,
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                            },
                            shadows.card,
                        ]}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1, paddingRight: 10 }}>
                            <View
                                style={{
                                    width: 46,
                                    height: 46,
                                    borderRadius: 23,
                                    backgroundColor: colors.surfaceContainer,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <Plus size={24} color={colors.primary} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 16, fontWeight: '800', color: colors.text }}>
                                    {language === 'vi' ? 'Đăng việc cần thợ ngay' : 'Post a Job Request'}
                                </Text>
                                <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 3 }}>
                                    {language === 'vi' ? 'Kết nối nhanh thợ uy tín quanh bạn trong 30 giây' : 'Connect with trusted local workers in 30s'}
                                </Text>
                            </View>
                        </View>

                        <View
                            style={{
                                width: 34,
                                height: 34,
                                borderRadius: 17,
                                backgroundColor: colors.primary,
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <ArrowRight size={17} color="#ffffff" />
                        </View>
                    </TouchableOpacity>
                </View>

                {/* LƯỚI 8 DANH MỤC CÔNG VIỆC CHUẨN TỪ ICON-CATE */}
                <View style={{ paddingHorizontal: HORIZONTAL_PADDING, marginTop: 22 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                        <Text style={{ fontSize: 17, fontWeight: '800', color: colors.text }}>
                            {language === 'vi' ? 'Chọn loại thợ bạn cần' : 'Select Worker Category'}
                        </Text>
                        <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textSecondary }}>
                            8 nhóm ngành
                        </Text>
                    </View>

                    <View
                        style={{
                            flexDirection: 'row',
                            flexWrap: 'wrap',
                            justifyContent: 'space-between',
                            rowGap: 12,
                        }}
                    >
                        {CATEGORIES.map((cat) => (
                            <TouchableOpacity
                                key={cat.key}
                                activeOpacity={0.78}
                                onPress={() => handleSelectCategory(cat)}
                                style={[
                                    {
                                        width: CARD_WIDTH,
                                        paddingVertical: 12,
                                        paddingHorizontal: 4,
                                        borderRadius: 18,
                                        backgroundColor: colors.surface,
                                        borderWidth: 1,
                                        borderColor: colors.border,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    },
                                    shadows.card,
                                ]}
                            >
                                <Image
                                    source={cat.icon}
                                    style={{ width: 44, height: 44 }}
                                    contentFit="contain"
                                />
                                <Text
                                    numberOfLines={2}
                                    style={{
                                        fontSize: 11.5,
                                        fontWeight: '700',
                                        color: colors.text,
                                        textAlign: 'center',
                                        marginTop: 6,
                                        lineHeight: 15,
                                    }}
                                >
                                    {cat.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* SECTION 1: CAROUSEL BANNER GIỚI THIỆU DỊCH VỤ (VUỐT NGANG HERO CAROUSEL) */}
                <View style={{ marginTop: 22 }}>
                    <View
                        style={{
                            paddingHorizontal: 16,
                            marginBottom: 10,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                        }}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Sparkles size={16} color={colors.primary} />
                            <Text style={{ fontSize: 16, fontWeight: '800', color: colors.text }}>
                                {language === 'vi' ? 'Khám phá dịch vụ JobFlash' : 'Explore JobFlash Services'}
                            </Text>
                        </View>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textSecondary }}>
                            {activeBannerIdx + 1} / {INTRODUCE_BANNERS.length}
                        </Text>
                    </View>

                    {/* ScrollView Vuốt Ngang Banner Giới Thiệu (Thẻ chiếm 3/4 màn hình, không viền/background thừa) */}
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        decelerationRate="fast"
                        snapToInterval={INTRO_BANNER_WIDTH + INTRO_BANNER_GAP}
                        snapToAlignment="start"
                        contentContainerStyle={{ paddingHorizontal: 16, gap: INTRO_BANNER_GAP }}
                        onMomentumScrollEnd={(e) => {
                            const offset = e.nativeEvent.contentOffset.x;
                            const idx = Math.min(
                                INTRODUCE_BANNERS.length - 1,
                                Math.max(0, Math.round(offset / (INTRO_BANNER_WIDTH + INTRO_BANNER_GAP)))
                            );
                            setActiveBannerIdx(idx);
                        }}
                    >
                        {INTRODUCE_BANNERS.map((banner) => (
                            <TouchableOpacity
                                key={banner.id}
                                activeOpacity={0.88}
                                onPress={() => router.push(banner.actionRoute as any)}
                                style={{
                                    width: INTRO_BANNER_WIDTH,
                                    height: INTRO_BANNER_HEIGHT,
                                    borderRadius: 14,
                                    overflow: 'hidden',
                                }}
                            >
                                <Image
                                    source={banner.image}
                                    style={{ width: '100%', height: '100%' }}
                                    contentFit="cover"
                                    transition={200}
                                />
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {/* Pagination Dots */}
                    <View
                        style={{
                            flexDirection: 'row',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: 6,
                            marginTop: 10,
                        }}
                    >
                        {INTRODUCE_BANNERS.map((_, idx) => (
                            <View
                                key={idx}
                                style={{
                                    width: activeBannerIdx === idx ? 22 : 6,
                                    height: 5,
                                    borderRadius: 3,
                                    backgroundColor: activeBannerIdx === idx ? colors.primary : colors.border,
                                }}
                            />
                        ))}
                    </View>
                </View>

                {/* SECTION 2: CARD ƯU ĐÃI & KHUYẾN MÃI - BỐ CỤC 2 ROW VÀ XUỐNG DÒNG (GRID 2 CỘT) */}
                <View style={{ marginTop: 22, paddingHorizontal: 16 }}>
                    <View
                        style={{
                            marginBottom: 12,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                        }}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Gift size={17} color={colors.primary} />
                            <Text style={{ fontSize: 17, fontWeight: '800', color: colors.text }}>
                                {language === 'vi' ? 'Ưu đãi & Khuyến mãi hot' : 'Exclusive Promotions'}
                            </Text>
                        </View>
                        <TouchableOpacity
                            onPress={() => setShowAllPromos(!showAllPromos)}
                            activeOpacity={0.7}
                            style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}
                        >
                            <Text style={{ fontSize: 12, fontWeight: '700', color: colors.primary }}>
                                {showAllPromos
                                    ? (language === 'vi' ? 'Thu gọn' : 'Collapse')
                                    : (language === 'vi' ? 'Xem tất cả (5)' : 'View all (5)')}
                            </Text>
                            <ChevronRight size={14} color={colors.primary} />
                        </TouchableOpacity>
                    </View>

                    {/* Lưới 2 thẻ / hàng và tự động xuống dòng (flexWrap wrap) */}
                    <View
                        style={{
                            flexDirection: 'row',
                            flexWrap: 'wrap',
                            justifyContent: 'space-between',
                            rowGap: 12,
                        }}
                    >
                        {displayedPromos.map((promo) => (
                            <TouchableOpacity
                                key={promo.id}
                                activeOpacity={0.88}
                                onPress={() => handleOpenPromoDetail(promo)}
                                style={[
                                    {
                                        width: PROMO_CARD_WIDTH,
                                        borderRadius: 16,
                                        backgroundColor: colors.surface,
                                        borderWidth: 1,
                                        borderColor: colors.border,
                                        overflow: 'hidden',
                                    },
                                    shadows.card,
                                ]}
                            >
                                {/* Ảnh Vuông Banner 1:1 */}
                                <View style={{ width: '100%', height: PROMO_CARD_IMG_HEIGHT, position: 'relative' }}>
                                    <Image
                                        source={promo.image}
                                        style={{ width: '100%', height: '100%' }}
                                        contentFit="cover"
                                        transition={200}
                                    />

                                    {/* Huy hiệu Badge Tag góc trên */}
                                    <View
                                        style={{
                                            position: 'absolute',
                                            top: 8,
                                            left: 8,
                                            backgroundColor: promo.badgeColor,
                                            paddingHorizontal: 7,
                                            paddingVertical: 3,
                                            borderRadius: 6,
                                        }}
                                    >
                                        <Text style={{ fontSize: 9.5, fontWeight: '900', color: '#ffffff' }}>
                                            {promo.badge}
                                        </Text>
                                    </View>
                                </View>

                                {/* Phần Thông Tin Card Dọc */}
                                <View style={{ padding: 10 }}>
                                    <Text
                                        numberOfLines={1}
                                        style={{
                                            fontSize: 13,
                                            fontWeight: '800',
                                            color: colors.text,
                                            lineHeight: 17,
                                        }}
                                    >
                                        {promo.title}
                                    </Text>
                                    <Text
                                        numberOfLines={1}
                                        style={{
                                            fontSize: 11,
                                            color: colors.textSecondary,
                                            marginTop: 3,
                                            lineHeight: 14,
                                        }}
                                    >
                                        {promo.description}
                                    </Text>

                                    {/* Hàng Mã Giảm & Nút Dùng Ngay */}
                                    <View
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            marginTop: 8,
                                            paddingTop: 8,
                                            borderTopWidth: 1,
                                            borderColor: colors.border,
                                        }}
                                    >
                                        <View
                                            style={{
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                gap: 4,
                                                backgroundColor: isDark ? colors.surfaceContainer : '#eff6ff',
                                                paddingHorizontal: 6,
                                                paddingVertical: 2.5,
                                                borderRadius: 6,
                                            }}
                                        >
                                            <Ticket size={11} color={colors.primary} />
                                            <Text
                                                style={{
                                                    fontSize: 10,
                                                    fontWeight: '800',
                                                    color: colors.primary,
                                                }}
                                            >
                                                {promo.code}
                                            </Text>
                                        </View>

                                        <View
                                            style={{
                                                backgroundColor: colors.primary,
                                                paddingHorizontal: 8,
                                                paddingVertical: 3,
                                                borderRadius: 6,
                                            }}
                                        >
                                            <Text style={{ fontSize: 10, fontWeight: '800', color: '#ffffff' }}>
                                                Dùng
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Nút Xem thêm / Thu gọn khi ở chế độ 2 row */}
                    {!showAllPromos ? (
                        <TouchableOpacity
                            onPress={() => setShowAllPromos(true)}
                            activeOpacity={0.75}
                            style={{
                                alignItems: 'center',
                                justifyContent: 'center',
                                paddingVertical: 9,
                                marginTop: 10,
                                borderRadius: 12,
                                backgroundColor: isDark ? colors.surfaceContainer : '#f5f3ff',
                                borderWidth: 1,
                                borderColor: isDark ? colors.border : '#e9d5ff',
                            }}
                        >
                            <Text style={{ fontSize: 12, fontWeight: '700', color: colors.primary }}>
                                Xem thêm 1 ưu đãi khác ▾
                            </Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            onPress={() => setShowAllPromos(false)}
                            activeOpacity={0.75}
                            style={{
                                alignItems: 'center',
                                justifyContent: 'center',
                                paddingVertical: 9,
                                marginTop: 10,
                                borderRadius: 12,
                                backgroundColor: colors.surfaceContainer,
                                borderWidth: 1,
                                borderColor: colors.border,
                            }}
                        >
                            <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textSecondary }}>
                                Thu gọn về 2 hàng ▴
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* SECTION 3: THẺ CAM KẾT BẢO HIỂM CHẤT LƯỢNG FLASHCARE */}
                <View style={{ paddingHorizontal: 16, marginTop: 22 }}>
                    <View
                        style={[
                            {
                                padding: 14,
                                borderRadius: 18,
                                backgroundColor: colors.surfaceContainerLow,
                                borderWidth: 1,
                                borderColor: isDark ? colors.border : '#eaddfb',
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 12,
                            },
                            shadows.card,
                        ]}
                    >
                        <View
                            style={{
                                width: 38,
                                height: 38,
                                borderRadius: 19,
                                backgroundColor: colors.surfaceContainer,
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <ShieldCheck size={22} color={colors.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 13, fontWeight: '800', color: colors.text }}>
                                Cam kết thợ uy tín & Bảo hiểm việc làm
                            </Text>
                            <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2, lineHeight: 15 }}>
                                Thợ đã xác thực căn cước NFC • Hỗ trợ đổi thợ trong 15p nếu không hài lòng
                            </Text>
                        </View>
                    </View>
                </View>
            </Animated.ScrollView>

            {/* THANH ĐIỀU HƯỚNG ĐÁY BLUR KÍNH MỜ */}
            <GlassBottomBar />

            {/* MODAL CHI TIẾT ƯU ĐÃI KHUYẾN MÃI (BOTTOM SHEET POPUP CHUẨN APP GRAB/BE) */}
            <Modal
                visible={selectedPromo !== null}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setSelectedPromo(null)}
                statusBarTranslucent={true}
            >
                <View
                    style={{
                        flex: 1,
                        backgroundColor: 'rgba(0, 0, 0, 0.65)',
                        justifyContent: 'flex-end',
                    }}
                >
                    <TouchableOpacity
                        style={{ flex: 1 }}
                        activeOpacity={1}
                        onPress={() => setSelectedPromo(null)}
                    />

                    <View
                        style={{
                            backgroundColor: colors.surface,
                            borderTopLeftRadius: 26,
                            borderTopRightRadius: 26,
                            paddingHorizontal: 20,
                            paddingTop: 16,
                            paddingBottom: (insets.bottom > 0 ? insets.bottom : 16) + 10,
                            borderTopWidth: 1,
                            borderColor: colors.border,
                        }}
                    >
                        {/* Thanh gạt trang trí */}
                        <View
                            style={{
                                width: 44,
                                height: 4,
                                borderRadius: 2,
                                backgroundColor: colors.border,
                                alignSelf: 'center',
                                marginBottom: 16,
                            }}
                        />

                        {selectedPromo && (
                            <View>
                                {/* Nút đóng */}
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                        <BadgePercent size={18} color={colors.primary} />
                                        <Text style={{ fontSize: 17, fontWeight: '800', color: colors.text }}>
                                            Chi tiết ưu đãi
                                        </Text>
                                    </View>
                                    <TouchableOpacity
                                        onPress={() => setSelectedPromo(null)}
                                        style={{
                                            width: 32,
                                            height: 32,
                                            borderRadius: 16,
                                            backgroundColor: colors.surfaceContainer,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <X size={16} color={colors.textSecondary} />
                                    </TouchableOpacity>
                                </View>

                                {/* Ảnh Banner Khuyến Mãi Lớn */}
                                <View
                                    style={{
                                        width: '100%',
                                        height: 190,
                                        borderRadius: 16,
                                        overflow: 'hidden',
                                        marginBottom: 14,
                                        backgroundColor: colors.surfaceContainer,
                                    }}
                                >
                                    <Image
                                        source={selectedPromo.image}
                                        style={{ width: '100%', height: '100%' }}
                                        contentFit="contain"
                                    />
                                </View>

                                {/* Tiêu đề & Nội dung ưu đãi */}
                                <Text style={{ fontSize: 18, fontWeight: '900', color: colors.text, marginBottom: 4 }}>
                                    {selectedPromo.title}
                                </Text>
                                <Text style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 19, marginBottom: 14 }}>
                                    {selectedPromo.description}
                                </Text>

                                {/* Ô Mã Khuyến Mãi Có Nút Sao Chép */}
                                <View
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        paddingHorizontal: 14,
                                        paddingVertical: 12,
                                        borderRadius: 14,
                                        backgroundColor: isDark ? colors.surfaceContainer : '#f5f3ff',
                                        borderWidth: 1.5,
                                        borderColor: isDark ? colors.border : '#ddd6fe',
                                        marginBottom: 16,
                                    }}
                                >
                                    <View>
                                        <Text style={{ fontSize: 11, color: colors.textSecondary, fontWeight: '600' }}>
                                            Mã voucher ({selectedPromo.expiryText})
                                        </Text>
                                        <Text style={{ fontSize: 16, fontWeight: '900', color: colors.primary, marginTop: 2 }}>
                                            {selectedPromo.code}
                                        </Text>
                                    </View>

                                    <TouchableOpacity
                                        activeOpacity={0.8}
                                        onPress={handleCopyPromoCode}
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            gap: 6,
                                            backgroundColor: isCopied ? '#10b981' : colors.primary,
                                            paddingHorizontal: 14,
                                            paddingVertical: 8,
                                            borderRadius: 10,
                                        }}
                                    >
                                        {isCopied ? (
                                            <>
                                                <Check size={14} color="#ffffff" strokeWidth={3} />
                                                <Text style={{ fontSize: 12, fontWeight: '800', color: '#ffffff' }}>Đã chép</Text>
                                            </>
                                        ) : (
                                            <>
                                                <Copy size={14} color="#ffffff" />
                                                <Text style={{ fontSize: 12, fontWeight: '800', color: '#ffffff' }}>Sao chép</Text>
                                            </>
                                        )}
                                    </TouchableOpacity>
                                </View>

                                {/* Nút Áp Dụng Đăng Việc Ngay */}
                                <TouchableOpacity
                                    activeOpacity={0.88}
                                    onPress={() => {
                                        setSelectedPromo(null);
                                        router.push('/(requester)/create');
                                    }}
                                    style={{ borderRadius: 14, overflow: 'hidden' }}
                                >
                                    <LinearGradient
                                        colors={gradients.electric}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                        style={{ paddingVertical: 14, alignItems: 'center', justifyContent: 'center' }}
                                    >
                                        <Text style={{ fontSize: 15, fontWeight: '800', color: '#ffffff' }}>
                                            Đăng việc áp dụng ưu đãi ngay
                                        </Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
}
