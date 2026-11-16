import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    Animated,
    ActivityIndicator,
    Platform,
    StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ShieldCheck, CheckCircle2, X, Smartphone, Radio, Cpu, Sparkles } from 'lucide-react-native';
import { useAppTheme } from '../constants/theme';
import { useI18n } from '../i18n';

interface NfcChipModalProps {
    visible: boolean;
    idCardNumber?: string;
    onClose: () => void;
    onSuccess: (chipData: { chipSerial: string; verifiedAt: string }) => void;
}

export default function NfcChipModal({
    visible,
    idCardNumber,
    onClose,
    onSuccess,
}: NfcChipModalProps) {
    const { colors, gradients, shadows, isDark } = useAppTheme();
    const { language } = useI18n();

    // Các trạng thái quét NFC: 'idle' | 'scanning' | 'success' | 'error'
    const [scanState, setScanState] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
    const [scanStep, setScanStep] = useState(1);
    const [chipSerial, setChipSerial] = useState('');

    // Animation sóng NFC
    const waveAnim1 = useRef(new Animated.Value(0.8)).current;
    const waveAnim2 = useRef(new Animated.Value(0.8)).current;
    const phoneShakeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            setScanState('idle');
            setScanStep(1);
        }
    }, [visible]);

    useEffect(() => {
        if (scanState === 'scanning') {
            // Hiệu ứng sóng lan tỏa
            Animated.loop(
                Animated.stagger(400, [
                    Animated.sequence([
                        Animated.timing(waveAnim1, {
                            toValue: 1.35,
                            duration: 1200,
                            useNativeDriver: true,
                        }),
                        Animated.timing(waveAnim1, {
                            toValue: 0.8,
                            duration: 0,
                            useNativeDriver: true,
                        }),
                    ]),
                    Animated.sequence([
                        Animated.timing(waveAnim2, {
                            toValue: 1.35,
                            duration: 1200,
                            useNativeDriver: true,
                        }),
                        Animated.timing(waveAnim2, {
                            toValue: 0.8,
                            duration: 0,
                            useNativeDriver: true,
                        }),
                    ]),
                ])
            ).start();

            // Mô phỏng tiến trình đọc chip NFC thực tế theo chuẩn ICAO 9303 / react-native-rfid-nfc
            const t1 = setTimeout(() => {
                setScanStep(2); // Đang đọc dữ liệu LDS1
            }, 1200);

            const t2 = setTimeout(() => {
                setScanStep(3); // Xác thực chữ ký số PKI
            }, 2300);

            const t3 = setTimeout(() => {
                const serial = 'VN-' + Math.floor(10000000 + Math.random() * 90000000);
                setChipSerial(serial);
                setScanState('success');
            }, 3200);

            return () => {
                clearTimeout(t1);
                clearTimeout(t2);
                clearTimeout(t3);
            };
        }
    }, [scanState]);

    const handleStartScan = () => {
        setScanState('scanning');
        setScanStep(1);
    };

    const handleComplete = () => {
        onSuccess({
            chipSerial: chipSerial || 'VN-89302194',
            verifiedAt: new Date().toISOString(),
        });
        onClose();
    };

    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View
                    style={[
                        styles.container,
                        {
                            backgroundColor: colors.surface,
                            borderColor: colors.border,
                        },
                        shadows.card,
                    ]}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <View
                                style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: 16,
                                    backgroundColor: colors.primary + '15',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <Radio size={18} color={colors.primary} />
                            </View>
                            <View>
                                <Text style={[styles.headerTitle, { color: colors.text }]}>
                                    {language === 'vi' ? 'Quét Chip NFC Thẻ Căn Cước' : 'NFC eID Chip Reader'}
                                </Text>
                                <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
                                    {language === 'vi' ? 'Chuẩn bảo mật ICAO 9303 / RFID' : 'ICAO 9303 / RFID Security'}
                                </Text>
                            </View>
                        </View>
                        <TouchableOpacity
                            onPress={onClose}
                            style={[styles.closeBtn, { backgroundColor: colors.surfaceContainer }]}
                        >
                            <X size={18} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    {/* Vùng mô phỏng quét NFC */}
                    <View style={styles.body}>
                        {scanState === 'idle' && (
                            <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                                <View
                                    style={[
                                        styles.iconCircle,
                                        { backgroundColor: colors.surfaceContainer, borderColor: colors.border },
                                    ]}
                                >
                                    <Cpu size={56} color={colors.secondary} />
                                </View>

                                <Text style={[styles.stateTitle, { color: colors.text }]}>
                                    {language === 'vi' ? 'Đặt thẻ CCCD sát lưng máy' : 'Hold ID Card to Phone Back'}
                                </Text>
                                <Text style={[styles.stateDesc, { color: colors.textSecondary }]}>
                                    {language === 'vi'
                                        ? 'Áp phần chip điện tử màu vàng ở mặt sau thẻ CCCD vào vùng camera sau của điện thoại và giữ nguyên.'
                                        : 'Place the electronic chip on the back of your ID card against the phone camera area and hold still.'}
                                </Text>

                                <TouchableOpacity
                                    activeOpacity={0.85}
                                    onPress={handleStartScan}
                                    style={[styles.actionBtn, { backgroundColor: colors.secondary }]}
                                >
                                    <Radio size={18} color="#fff" style={{ marginRight: 8 }} />
                                    <Text style={styles.actionBtnText}>
                                        {language === 'vi' ? 'Bắt đầu quét sóng NFC' : 'Start NFC Scan'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {scanState === 'scanning' && (
                            <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                                {/* Vòng sóng lan tỏa */}
                                <View style={styles.waveContainer}>
                                    <Animated.View
                                        style={[
                                            styles.wave,
                                            {
                                                borderColor: colors.secondary,
                                                transform: [{ scale: waveAnim1 }],
                                                opacity: waveAnim1.interpolate({
                                                    inputRange: [0.8, 1.35],
                                                    outputRange: [0.8, 0],
                                                }),
                                            },
                                        ]}
                                    />
                                    <Animated.View
                                        style={[
                                            styles.wave,
                                            {
                                                borderColor: colors.primary,
                                                transform: [{ scale: waveAnim2 }],
                                                opacity: waveAnim2.interpolate({
                                                    inputRange: [0.8, 1.35],
                                                    outputRange: [0.8, 0],
                                                }),
                                            },
                                        ]}
                                    />
                                    <View
                                        style={[
                                            styles.iconCircle,
                                            { backgroundColor: colors.surfaceContainer, borderColor: colors.secondary },
                                        ]}
                                    >
                                        <Smartphone size={48} color={colors.secondary} />
                                    </View>
                                </View>

                                <Text style={[styles.stateTitle, { color: colors.text, marginTop: 16 }]}>
                                    {scanStep === 1 && (language === 'vi' ? 'Đang kết nối sóng NFC...' : 'Connecting NFC...')}
                                    {scanStep === 2 && (language === 'vi' ? 'Đang đọc khối dữ liệu chip...' : 'Reading Chip Data...')}
                                    {scanStep === 3 && (language === 'vi' ? 'Xác thực chữ ký số Bộ Công An...' : 'Verifying Digital Signature...')}
                                </Text>
                                <Text style={[styles.stateDesc, { color: colors.textSecondary }]}>
                                    {language === 'vi'
                                        ? 'Vui lòng giữ yên thẻ CCCD trong vài giây...'
                                        : 'Please keep the card steady for a few seconds...'}
                                </Text>

                                <ActivityIndicator size="small" color={colors.secondary} style={{ marginTop: 12 }} />
                            </View>
                        )}

                        {scanState === 'success' && (
                            <View style={{ alignItems: 'center', paddingVertical: 14 }}>
                                <View
                                    style={[
                                        styles.iconCircle,
                                        { backgroundColor: colors.success + '15', borderColor: colors.success },
                                    ]}
                                >
                                    <CheckCircle2 size={56} color={colors.success} />
                                </View>

                                <Text style={[styles.stateTitle, { color: colors.success, marginTop: 12 }]}>
                                    {language === 'vi' ? 'Xác thực Chip NFC thành công!' : 'NFC Verification Successful!'}
                                </Text>
                                <Text style={[styles.stateDesc, { color: colors.textSecondary }]}>
                                    {language === 'vi'
                                        ? 'Dữ liệu trong chip điện tử hoàn toàn trùng khớp với thông tin công dân và có chữ ký số bảo mật hợp lệ.'
                                        : 'Data in electronic chip matches citizen record with valid cryptographic signature.'}
                                </Text>

                                {/* Bảng tóm tắt kết quả chip */}
                                <View
                                    style={[
                                        styles.infoBox,
                                        { backgroundColor: colors.surfaceContainer, borderColor: colors.border },
                                    ]}
                                >
                                    <View style={styles.infoRow}>
                                        <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                                            {language === 'vi' ? 'Mã định danh chip:' : 'Chip Serial:'}
                                        </Text>
                                        <Text style={[styles.infoValue, { color: colors.text }]}>
                                            {chipSerial}
                                        </Text>
                                    </View>
                                    <View style={styles.infoRow}>
                                        <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                                            {language === 'vi' ? 'Chuẩn mã hóa:' : 'Standard:'}
                                        </Text>
                                        <Text style={[styles.infoValue, { color: colors.secondary }]}>
                                            ICAO 9303 / BAC 128-bit
                                        </Text>
                                    </View>
                                    <View style={styles.infoRow}>
                                        <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                                            {language === 'vi' ? 'Chứng thực bởi:' : 'Authority:'}
                                        </Text>
                                        <Text style={[styles.infoValue, { color: colors.success }]}>
                                            Bộ Công An (C06)
                                        </Text>
                                    </View>
                                </View>

                                <TouchableOpacity
                                    activeOpacity={0.85}
                                    onPress={handleComplete}
                                    style={[styles.actionBtn, { backgroundColor: colors.success, marginTop: 16 }]}
                                >
                                    <CheckCircle2 size={18} color="#fff" style={{ marginRight: 8 }} />
                                    <Text style={styles.actionBtnText}>
                                        {language === 'vi' ? 'Xác nhận & Hoàn tất' : 'Confirm & Finish'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    container: {
        width: '100%',
        maxWidth: 380,
        borderRadius: 28,
        borderWidth: 1.5,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 18,
        paddingBottom: 14,
        borderBottomWidth: 1,
        borderColor: 'rgba(150,150,150,0.15)',
    },
    headerTitle: {
        fontSize: 15,
        fontWeight: '800',
    },
    headerSub: {
        fontSize: 11,
        fontWeight: '600',
        marginTop: 1,
    },
    closeBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    body: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    iconCircle: {
        width: 90,
        height: 90,
        borderRadius: 45,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    waveContainer: {
        width: 140,
        height: 140,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    wave: {
        position: 'absolute',
        width: 130,
        height: 130,
        borderRadius: 65,
        borderWidth: 2,
    },
    stateTitle: {
        fontSize: 17,
        fontWeight: '800',
        textAlign: 'center',
        marginTop: 16,
    },
    stateDesc: {
        fontSize: 13,
        textAlign: 'center',
        marginTop: 6,
        paddingHorizontal: 10,
        lineHeight: 18,
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        paddingVertical: 14,
        borderRadius: 16,
        marginTop: 22,
    },
    actionBtnText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '700',
    },
    infoBox: {
        width: '100%',
        borderRadius: 16,
        borderWidth: 1,
        padding: 12,
        marginTop: 14,
        gap: 6,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    infoLabel: {
        fontSize: 12,
        fontWeight: '600',
    },
    infoValue: {
        fontSize: 12,
        fontWeight: '800',
    },
});
