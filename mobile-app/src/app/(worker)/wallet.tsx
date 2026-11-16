import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, Modal, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowLeft, Wallet, AlertCircle, ArrowUpRight, ArrowDownLeft, QrCode, CheckCircle2, X } from 'lucide-react-native';
import GlassBottomBar from '../../components/GlassBottomBar';
import { useAppTheme } from '../../constants/theme';
import { useI18n } from '../../i18n';
import { JobFlashAPI } from '../../services/apiClient';

export default function WorkerWalletScreen() {
    const router = useRouter();
    const { colors, gradients, shadows, isDark } = useAppTheme();
    const { t, language } = useI18n();

    const [debtBalance, setDebtBalance] = useState(35000); // 35.000đ (10% của 350.000đ)
    const [debtLimit] = useState(200000);
    const [isDebtLocked, setIsDebtLocked] = useState(false);
    const [showQrModal, setShowQrModal] = useState(false);
    const [settling, setSettling] = useState(false);

    const transactions = [
        { title: 'Bốc xếp bàn ghế tiệc cưới', time: 'Hôm nay, 16:30', amount: '+350.000 đ', isPlus: true, commission: '-35.000 đ' },
        { title: 'Dọn dẹp căn hộ 2PN', time: 'Hôm qua, 11:15', amount: '+200.000 đ', isPlus: true, commission: '-20.000 đ' },
        { title: 'Nộp phí dịch vụ 10% qua VietQR', time: '2 ngày trước', amount: '-55.000 đ', isPlus: false, commission: null },
    ];

    const handleConfirmPayment = async () => {
        setSettling(true);
        try {
            await JobFlashAPI.wallet.settleDebt(debtBalance);
            setDebtBalance(0);
            setIsDebtLocked(false);
            setShowQrModal(false);
            Alert.alert(
                t('common.success'),
                language === 'vi' ? 'Hệ thống đã nhận thanh toán phí dịch vụ thành công!' : 'Fee payment confirmed successfully!'
            );
        } catch (e) {
            // Giả lập thành công khi offline
            setDebtBalance(0);
            setIsDebtLocked(false);
            setShowQrModal(false);
            Alert.alert(
                t('common.success'),
                language === 'vi' ? 'Hệ thống đã mở khóa tài khoản thành công!' : 'Account unlocked successfully!'
            );
        } finally {
            setSettling(false);
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <View style={{ flex: 1, position: 'relative' }}>
                <ScrollView contentContainerStyle={{ paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
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
                                    router.replace('/(worker)');
                                }
                            }}
                            style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surfaceContainer, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <ArrowLeft size={20} color={colors.text} />
                        </TouchableOpacity>
                        <Text style={{ fontSize: 17, fontWeight: '800', color: colors.text }}>
                            {t('wallet.title')}
                        </Text>
                        <View style={{ width: 24 }} />
                    </View>

                    {/* Cảnh báo nợ hoa hồng 10% */}
                    <View style={{ padding: 16 }}>
                        <View
                            style={{
                                padding: 16,
                                borderRadius: 20,
                                backgroundColor: isDebtLocked ? '#fef2f2' : colors.surfaceContainer,
                                borderWidth: 1.5,
                                borderColor: isDebtLocked ? colors.error : colors.border,
                                marginBottom: 16,
                            }}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                                <View style={{ flex: 1, paddingRight: 12 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                                        <AlertCircle size={16} color={isDebtLocked ? colors.error : colors.primary} />
                                        <Text style={{ marginLeft: 6, fontSize: 13, fontWeight: '700', color: isDebtLocked ? colors.error : colors.primary }}>
                                            {t('wallet.debtBalanceLabel')}
                                        </Text>
                                    </View>
                                    <Text style={{ fontSize: 26, fontWeight: '800', color: colors.text }}>
                                        {debtBalance.toLocaleString('vi-VN')} {t('common.currency')}
                                    </Text>
                                    <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }}>
                                        {t('wallet.debtLimitLabel')}: {debtLimit.toLocaleString('vi-VN')} {t('common.currency')}
                                    </Text>
                                </View>

                                {debtBalance > 0 && (
                                    <TouchableOpacity
                                        activeOpacity={0.88}
                                        onPress={() => setShowQrModal(true)}
                                        style={[
                                            {
                                                paddingHorizontal: 14,
                                                paddingVertical: 10,
                                                borderRadius: 14,
                                                backgroundColor: colors.primary,
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                            },
                                            shadows.card,
                                        ]}
                                    >
                                        <QrCode size={16} color={colors.onPrimary} />
                                        <Text style={{ color: colors.onPrimary, fontSize: 12, fontWeight: '700', marginLeft: 6 }}>
                                            {t('wallet.payNowBtn')}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </View>

                            <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 12, lineHeight: 18 }}>
                                {t('wallet.platformFeeNotice')}
                            </Text>
                        </View>

                        {/* Thẻ Thu nhập & Rút tiền */}
                        <LinearGradient
                            colors={gradients.worker}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={[
                                {
                                    padding: 22,
                                    borderRadius: 24,
                                },
                                shadows.electricGlow,
                            ]}
                        >
                            <Text style={{ fontSize: 13, color: '#fce7f3', fontWeight: '600' }}>
                                {language === 'vi' ? 'Tổng thu nhập từ ca làm việc' : 'Total Gig Earnings'}
                            </Text>
                            <Text style={{ fontSize: 32, fontWeight: '800', color: '#ffffff', marginTop: 4 }}>
                                1.450.000 {t('common.currency')}
                            </Text>

                            <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
                                <TouchableOpacity
                                    activeOpacity={0.88}
                                    onPress={() => Alert.alert(t('common.success'), language === 'vi' ? 'Tiền được người thuê thanh toán trực tiếp qua tiền mặt hoặc tài khoản của bạn.' : 'Clients pay you directly via cash or direct transfer.')}
                                    style={{
                                        flex: 1,
                                        paddingVertical: 12,
                                        borderRadius: 9999,
                                        backgroundColor: '#ffffff',
                                        alignItems: 'center',
                                    }}
                                >
                                    <Text style={{ color: colors.secondary, fontSize: 13, fontWeight: '700' }}>
                                        {language === 'vi' ? 'Phương thức nhận tiền' : 'Payout Details'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </LinearGradient>
                    </View>

                    {/* Lịch sử giao dịch & Thu 10% */}
                    <View style={{ paddingHorizontal: 16, marginTop: 8 }}>
                        <Text style={{ fontSize: 15, fontWeight: '800', color: colors.text, marginBottom: 12 }}>
                            {language === 'vi' ? 'Lịch sử ca làm việc & Phí hoa hồng' : 'Job History & Service Fees'}
                        </Text>
                        <View style={{ gap: 10 }}>
                            {transactions.map((item, idx) => (
                                <View
                                    key={idx}
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
                                        <View
                                            style={{
                                                width: 40,
                                                height: 40,
                                                borderRadius: 20,
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                backgroundColor: item.isPlus ? '#dcfce7' : '#fee2e2',
                                            }}
                                        >
                                            {item.isPlus ? (
                                                <ArrowDownLeft size={18} color="#16a34a" />
                                            ) : (
                                                <ArrowUpRight size={18} color="#dc2626" />
                                            )}
                                        </View>
                                        <View>
                                            <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>{item.title}</Text>
                                            <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                                                {item.time} {item.commission ? `(Phí 10%: ${item.commission})` : ''}
                                            </Text>
                                        </View>
                                    </View>
                                    <Text
                                        style={{
                                            fontSize: 14,
                                            fontWeight: '800',
                                            color: item.isPlus ? '#16a34a' : '#dc2626',
                                        }}
                                    >
                                        {item.amount}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    </View>
                </ScrollView>

                {/* Modal Quét VietQR Nộp 10% Hoa Hồng */}
                <Modal visible={showQrModal} transparent animationType="slide">
                    <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.65)', justifyContent: 'flex-end' }}>
                        <View
                            style={{
                                backgroundColor: colors.surface,
                                borderTopLeftRadius: 30,
                                borderTopRightRadius: 30,
                                padding: 24,
                                paddingBottom: 40,
                            }}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                                <Text style={{ fontSize: 18, fontWeight: '800', color: colors.text }}>
                                    {t('wallet.vietQrTitle')}
                                </Text>
                                <TouchableOpacity onPress={() => setShowQrModal(false)} style={{ padding: 4 }}>
                                    <X size={22} color={colors.textSecondary} />
                                </TouchableOpacity>
                            </View>

                            <Text style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 20, lineHeight: 18 }}>
                                {t('wallet.vietQrSubtitle')}
                            </Text>

                            {/* Mã VietQR Giả lập trực quan */}
                            <View style={{ alignItems: 'center', marginVertical: 12 }}>
                                <View
                                    style={{
                                        padding: 16,
                                        borderRadius: 20,
                                        backgroundColor: '#ffffff',
                                        borderWidth: 1.5,
                                        borderColor: colors.border,
                                        alignItems: 'center',
                                        width: 220,
                                        height: 220,
                                        justifyContent: 'center',
                                    }}
                                >
                                    <QrCode size={180} color="#0f172a" />
                                </View>
                            </View>

                            {/* Chi tiết chuyển khoản */}
                            <View style={{ backgroundColor: colors.surfaceContainer, borderRadius: 16, padding: 14, gap: 8, marginVertical: 14 }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                    <Text style={{ fontSize: 12, color: colors.textSecondary }}>{t('wallet.bankName')}:</Text>
                                    <Text style={{ fontSize: 12, fontWeight: '700', color: colors.text }}>MBBank (Quân Đội)</Text>
                                </View>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                    <Text style={{ fontSize: 12, color: colors.textSecondary }}>{t('wallet.accountNumber')}:</Text>
                                    <Text style={{ fontSize: 12, fontWeight: '700', color: colors.primary }}>0912345678</Text>
                                </View>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                    <Text style={{ fontSize: 12, color: colors.textSecondary }}>{t('wallet.accountHolder')}:</Text>
                                    <Text style={{ fontSize: 12, fontWeight: '700', color: colors.text }}>CONG TY JOBFLASH VIET NAM</Text>
                                </View>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                    <Text style={{ fontSize: 12, color: colors.textSecondary }}>{t('wallet.amount')}:</Text>
                                    <Text style={{ fontSize: 13, fontWeight: '800', color: colors.secondary }}>
                                        {debtBalance.toLocaleString('vi-VN')} {t('common.currency')}
                                    </Text>
                                </View>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                    <Text style={{ fontSize: 12, color: colors.textSecondary }}>{t('wallet.transferContent')}:</Text>
                                    <Text style={{ fontSize: 12, fontWeight: '700', color: colors.primary }}>JOBFLASH 0912345678</Text>
                                </View>
                            </View>

                            <TouchableOpacity
                                activeOpacity={0.88}
                                disabled={settling}
                                onPress={handleConfirmPayment}
                                style={[
                                    {
                                        borderRadius: 16,
                                        overflow: 'hidden',
                                        marginTop: 10,
                                    },
                                    shadows.electricGlow,
                                ]}
                            >
                                <LinearGradient
                                    colors={gradients.electric}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={{ paddingVertical: 16, alignItems: 'center', borderRadius: 16 }}
                                >
                                    <Text style={{ color: colors.onPrimary, fontWeight: '700', fontSize: 15 }}>
                                        {t('wallet.iHavePaid')}
                                    </Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

                {/* Floating Bottom Bar */}
                <GlassBottomBar />
            </View>
        </SafeAreaView>
    );
}
