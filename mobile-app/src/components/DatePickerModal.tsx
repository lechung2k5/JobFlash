import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Calendar, X, Check } from 'lucide-react-native';
import { useAppTheme } from '../constants/theme';
import { useI18n } from '../i18n';

interface DatePickerModalProps {
    visible: boolean;
    initialDate?: string; // YYYY-MM-DD
    onClose: () => void;
    onSelectDate: (isoDate: string, displayDate: string) => void;
}

export default function DatePickerModal({
    visible,
    initialDate,
    onClose,
    onSelectDate,
}: DatePickerModalProps) {
    const { colors, gradients, shadows } = useAppTheme();
    const { language } = useI18n();

    // Parse ngày ban đầu
    const parseInitial = () => {
        if (initialDate && initialDate.includes('-')) {
            const parts = initialDate.split('-');
            if (parts.length === 3) {
                return {
                    year: parseInt(parts[0], 10) || 1996,
                    month: parseInt(parts[1], 10) || 5,
                    day: parseInt(parts[2], 10) || 15,
                };
            }
        }
        return { year: 1996, month: 5, day: 15 };
    };

    const initial = parseInitial();
    const [selectedDay, setSelectedDay] = useState(initial.day);
    const [selectedMonth, setSelectedMonth] = useState(initial.month);
    const [selectedYear, setSelectedYear] = useState(initial.year);

    useEffect(() => {
        if (visible) {
            const parsed = parseInitial();
            setSelectedDay(parsed.day);
            setSelectedMonth(parsed.month);
            setSelectedYear(parsed.year);
        }
    }, [visible, initialDate]);

    // Danh sách ngày (1-31), tháng (1-12), năm (1950 - 2008)
    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const months = Array.from({ length: 12 }, (_, i) => i + 1);
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 60 }, (_, i) => currentYear - 16 - i); // Độ tuổi từ 16 đến 75

    // Tính số tuổi
    const age = currentYear - selectedYear;

    const handleConfirm = () => {
        // Đảm bảo ngày không vượt quá số ngày trong tháng
        const validDay = Math.min(selectedDay, daysInMonth);
        const dayStr = validDay < 10 ? `0${validDay}` : `${validDay}`;
        const monthStr = selectedMonth < 10 ? `0${selectedMonth}` : `${selectedMonth}`;
        const iso = `${selectedYear}-${monthStr}-${dayStr}`;
        const display = `${dayStr}/${monthStr}/${selectedYear}`;
        onSelectDate(iso, display);
        onClose();
    };

    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={styles.overlay}>
                <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Calendar size={20} color={colors.primary} />
                            <Text style={[styles.title, { color: colors.text }]}>
                                {language === 'vi' ? 'Chọn ngày tháng năm sinh' : 'Select Date of Birth'}
                            </Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <X size={20} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    {/* Preview kết quả đang chọn & Tuổi */}
                    <View style={[styles.previewBox, { backgroundColor: colors.surfaceContainer, borderColor: colors.border }]}>
                        <Text style={[styles.previewDate, { color: colors.primary }]}>
                            {selectedDay < 10 ? `0${selectedDay}` : selectedDay} /{' '}
                            {selectedMonth < 10 ? `0${selectedMonth}` : selectedMonth} / {selectedYear}
                        </Text>
                        <View style={[styles.ageBadge, { backgroundColor: colors.primary }]}>
                            <Text style={styles.ageText}>
                                {language === 'vi' ? `${age} tuổi` : `${age} yrs old`}
                            </Text>
                        </View>
                    </View>

                    {/* 3 Cột chọn: Ngày, Tháng, Năm */}
                    <View style={styles.columnsContainer}>
                        {/* Cột Ngày */}
                        <View style={styles.column}>
                            <Text style={[styles.columnLabel, { color: colors.textSecondary }]}>
                                {language === 'vi' ? 'NGÀY' : 'DAY'}
                            </Text>
                            <ScrollView
                                showsVerticalScrollIndicator={false}
                                style={[styles.columnList, { backgroundColor: colors.surfaceDim, borderColor: colors.border }]}
                            >
                                {days.map((d) => {
                                    const isSelected = selectedDay === d;
                                    return (
                                        <TouchableOpacity
                                            key={d}
                                            activeOpacity={0.7}
                                            onPress={() => setSelectedDay(d)}
                                            style={[
                                                styles.itemBtn,
                                                isSelected && { backgroundColor: colors.primary },
                                            ]}
                                        >
                                            <Text
                                                style={[
                                                    styles.itemText,
                                                    { color: isSelected ? colors.onPrimary : colors.text },
                                                    isSelected && { fontWeight: '800' },
                                                ]}
                                            >
                                                {d < 10 ? `0${d}` : d}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        </View>

                        {/* Cột Tháng */}
                        <View style={styles.column}>
                            <Text style={[styles.columnLabel, { color: colors.textSecondary }]}>
                                {language === 'vi' ? 'THÁNG' : 'MONTH'}
                            </Text>
                            <ScrollView
                                showsVerticalScrollIndicator={false}
                                style={[styles.columnList, { backgroundColor: colors.surfaceDim, borderColor: colors.border }]}
                            >
                                {months.map((m) => {
                                    const isSelected = selectedMonth === m;
                                    return (
                                        <TouchableOpacity
                                            key={m}
                                            activeOpacity={0.7}
                                            onPress={() => setSelectedMonth(m)}
                                            style={[
                                                styles.itemBtn,
                                                isSelected && { backgroundColor: colors.primary },
                                            ]}
                                        >
                                            <Text
                                                style={[
                                                    styles.itemText,
                                                    { color: isSelected ? colors.onPrimary : colors.text },
                                                    isSelected && { fontWeight: '800' },
                                                ]}
                                            >
                                                {language === 'vi' ? `Tháng ${m}` : `M ${m}`}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        </View>

                        {/* Cột Năm */}
                        <View style={styles.column}>
                            <Text style={[styles.columnLabel, { color: colors.textSecondary }]}>
                                {language === 'vi' ? 'NĂM' : 'YEAR'}
                            </Text>
                            <ScrollView
                                showsVerticalScrollIndicator={false}
                                style={[styles.columnList, { backgroundColor: colors.surfaceDim, borderColor: colors.border }]}
                            >
                                {years.map((y) => {
                                    const isSelected = selectedYear === y;
                                    return (
                                        <TouchableOpacity
                                            key={y}
                                            activeOpacity={0.7}
                                            onPress={() => setSelectedYear(y)}
                                            style={[
                                                styles.itemBtn,
                                                isSelected && { backgroundColor: colors.primary },
                                            ]}
                                        >
                                            <Text
                                                style={[
                                                    styles.itemText,
                                                    { color: isSelected ? colors.onPrimary : colors.text },
                                                    isSelected && { fontWeight: '800' },
                                                ]}
                                            >
                                                {y}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        </View>
                    </View>

                    {/* Nút Xác nhận */}
                    <TouchableOpacity
                        activeOpacity={0.88}
                        onPress={handleConfirm}
                        style={[{ marginTop: 20, borderRadius: 16, overflow: 'hidden' }, shadows.electricGlow]}
                    >
                        <LinearGradient
                            colors={gradients.electric}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.confirmBtn}
                        >
                            <Check size={18} color={colors.onPrimary} />
                            <Text style={[styles.confirmText, { color: colors.onPrimary }]}>
                                {language === 'vi' ? 'Xác nhận ngày sinh' : 'Confirm Date'}
                            </Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end',
    },
    container: {
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: 24,
        borderWidth: 1,
        maxHeight: '75%',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    title: {
        fontSize: 17,
        fontWeight: '800',
    },
    closeBtn: {
        padding: 4,
    },
    previewBox: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 16,
    },
    previewDate: {
        fontSize: 17,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    ageBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 9999,
    },
    ageText: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: '700',
    },
    columnsContainer: {
        flexDirection: 'row',
        gap: 10,
        height: 200,
    },
    column: {
        flex: 1,
    },
    columnLabel: {
        fontSize: 11,
        fontWeight: '800',
        textAlign: 'center',
        marginBottom: 6,
        letterSpacing: 0.5,
    },
    columnList: {
        flex: 1,
        borderRadius: 16,
        borderWidth: 1,
        padding: 4,
    },
    itemBtn: {
        paddingVertical: 10,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 10,
        marginVertical: 2,
    },
    itemText: {
        fontSize: 14,
        fontWeight: '600',
    },
    confirmBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        gap: 8,
        borderRadius: 16,
    },
    confirmText: {
        fontSize: 16,
        fontWeight: '700',
    },
});
