import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Users, Wrench, ChevronRight, ShieldCheck, Globe, Moon, Sun } from 'lucide-react-native';
import { useAuthStore } from '../../store/useAuthStore';
import { useAppTheme } from '../../constants/theme';
import { useI18n } from '../../i18n';

export default function RoleSelectScreen() {
    const router = useRouter();
    const setRole = useAuthStore((state) => state.setRole);

    const { colors, shadows, isDark, toggleTheme } = useAppTheme();
    const { t, language, toggleLanguage } = useI18n();

    const handleSelectRole = (role: 'requester' | 'worker') => {
        setRole(role);
        router.push('/(auth)/login');
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <ScrollView
                contentContainerStyle={{
                    flexGrow: 1,
                    justifyContent: 'space-between',
                    padding: 24,
                }}
                showsVerticalScrollIndicator={false}
            >
                {/* Header Controls */}
                <View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                paddingHorizontal: 12,
                                paddingVertical: 6,
                                borderRadius: 9999,
                                backgroundColor: colors.surfaceContainer,
                                borderWidth: 1,
                                borderColor: colors.border,
                            }}
                        >
                            <ShieldCheck size={14} color={colors.primary} />
                            <Text style={{ color: colors.primary, fontWeight: '800', fontSize: 11, marginLeft: 6, letterSpacing: 0.5 }}>
                                {language === 'vi' ? 'BƯỚC 1: CHỌN VAI TRÒ' : 'STEP 1: SELECT ROLE'}
                            </Text>
                        </View>

                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            <TouchableOpacity
                                onPress={toggleLanguage}
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    backgroundColor: colors.surfaceContainer,
                                    paddingHorizontal: 10,
                                    paddingVertical: 6,
                                    borderRadius: 12,
                                }}
                            >
                                <Globe size={14} color={colors.primary} />
                                <Text style={{ marginLeft: 4, fontSize: 12, fontWeight: '700', color: colors.primary }}>
                                    {language.toUpperCase()}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={toggleTheme}
                                style={{
                                    backgroundColor: colors.surfaceContainer,
                                    padding: 8,
                                    borderRadius: 12,
                                }}
                            >
                                {isDark ? <Sun size={15} color={colors.warning} /> : <Moon size={15} color={colors.textSecondary} />}
                            </TouchableOpacity>
                        </View>
                    </View>

                    <Text style={{ fontSize: 28, fontWeight: '800', color: colors.text, lineHeight: 36 }}>
                        {t('auth.selectRoleTitle')}
                    </Text>
                    <Text style={{ fontSize: 15, color: colors.textSecondary, marginTop: 6, lineHeight: 22 }}>
                        {t('auth.selectRoleSubtitle')}
                    </Text>
                </View>

                {/* 2 Thẻ Vai Trò chính */}
                <View style={{ paddingVertical: 20, gap: 16 }}>
                    {/* Thẻ 1: Requester */}
                    <TouchableOpacity
                        activeOpacity={0.88}
                        onPress={() => handleSelectRole('requester')}
                        style={[
                            {
                                borderRadius: 24,
                                padding: 22,
                                backgroundColor: colors.surface,
                                borderWidth: 2,
                                borderColor: colors.border,
                            },
                            shadows.card,
                        ]}
                    >
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                            <View style={{ width: 50, height: 50, borderRadius: 16, backgroundColor: colors.surfaceContainer, alignItems: 'center', justifyContent: 'center' }}>
                                <Users size={26} color={colors.primary} />
                            </View>
                            <View style={{ paddingHorizontal: 12, paddingVertical: 4, borderRadius: 9999, backgroundColor: colors.surfaceContainer, borderWidth: 1, borderColor: colors.border }}>
                                <Text style={{ fontSize: 12, fontWeight: '700', color: colors.primary }}>
                                    {language === 'vi' ? 'Cá nhân & Doanh nghiệp' : 'Individual & Business'}
                                </Text>
                            </View>
                        </View>

                        <Text style={{ fontSize: 19, fontWeight: '800', color: colors.text }}>
                            {t('auth.iWantToHire')}
                        </Text>
                        <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 6, lineHeight: 20 }}>
                            {t('auth.iWantToHireDesc')}
                        </Text>

                        <View style={{ marginTop: 16, flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '700', marginRight: 4 }}>
                                {language === 'vi' ? 'Chọn vai trò Người Thuê' : 'Choose Customer Role'}
                            </Text>
                            <ChevronRight size={16} color={colors.primary} />
                        </View>
                    </TouchableOpacity>

                    {/* Thẻ 2: Worker */}
                    <TouchableOpacity
                        activeOpacity={0.88}
                        onPress={() => handleSelectRole('worker')}
                        style={[
                            {
                                borderRadius: 24,
                                padding: 22,
                                backgroundColor: colors.surface,
                                borderWidth: 2,
                                borderColor: colors.border,
                            },
                            shadows.card,
                        ]}
                    >
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                            <View style={{ width: 50, height: 50, borderRadius: 16, backgroundColor: colors.surfaceContainer, alignItems: 'center', justifyContent: 'center' }}>
                                <Wrench size={26} color={colors.secondary} />
                            </View>
                            <View style={{ paddingHorizontal: 12, paddingVertical: 4, borderRadius: 9999, backgroundColor: colors.surfaceContainer, borderWidth: 1, borderColor: colors.border }}>
                                <Text style={{ fontSize: 12, fontWeight: '700', color: colors.secondary }}>
                                    {language === 'vi' ? 'Thu nhập tức thì' : 'Instant Earnings'}
                                </Text>
                            </View>
                        </View>

                        <Text style={{ fontSize: 19, fontWeight: '800', color: colors.text }}>
                            {t('auth.iWantToWork')}
                        </Text>
                        <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 6, lineHeight: 20 }}>
                            {t('auth.iWantToWorkDesc')}
                        </Text>

                        <View style={{ marginTop: 16, flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={{ color: colors.secondary, fontSize: 13, fontWeight: '700', marginRight: 4 }}>
                                {language === 'vi' ? 'Chọn vai trò Người Làm' : 'Choose Worker Role'}
                            </Text>
                            <ChevronRight size={16} color={colors.secondary} />
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Footer */}
                <View style={{ paddingTop: 8 }}>
                    <Text style={{ textAlign: 'center', fontSize: 12, color: colors.textSecondary, lineHeight: 18 }}>
                        {language === 'vi' ? 'Bằng việc tiếp tục, bạn đồng ý với Điều khoản dịch vụ JobFlash.' : 'By continuing, you agree to JobFlash Terms of Service.'}
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
