import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, usePathname } from 'expo-router';
import { Compass, FileText, Radar, User, Wallet } from 'lucide-react-native';
import { useAuthStore } from '../store/useAuthStore';
import { useAppTheme } from '../constants/theme';
import { useI18n } from '../i18n';

export default function GlassBottomBar() {
    const router = useRouter();
    const pathname = usePathname();
    const insets = useSafeAreaInsets();
    const userRole = useAuthStore((state) => state.userRole);
    const { colors, shadows, isDark } = useAppTheme();
    const { language } = useI18n();

    const isRequester = userRole === 'requester';

    // Xác định tab nào đang hoạt động dựa trên đường dẫn hiện tại
    const isHomeActive =
        pathname === '/(requester)' ||
        pathname === '/(worker)' ||
        pathname === '/(requester)/' ||
        pathname === '/(worker)/';

    const isActivityActive =
        pathname.includes('tracking') ||
        pathname.includes('wallet');

    const isPulseActive =
        pathname.includes('radar') ||
        pathname.includes('alert') ||
        pathname.includes('create') ||
        pathname.includes('onduty');

    const isProfileActive =
        pathname.includes('profile') && !pathname.includes('setup');

    const tabs = [
        {
            key: 'home',
            label: language === 'vi' ? 'Khám phá' : 'Explore',
            icon: Compass,
            route: isRequester ? '/(requester)' : '/(worker)',
            active: isHomeActive,
        },
        {
            key: 'activity',
            label: isRequester
                ? (language === 'vi' ? 'Tiến độ' : 'Tracking')
                : (language === 'vi' ? 'Ví tiền' : 'Wallet'),
            icon: isRequester ? FileText : Wallet,
            route: isRequester ? '/(requester)/tracking' : '/(worker)/wallet',
            active: isActivityActive,
        },
        {
            key: 'pulse',
            label: isRequester
                ? (language === 'vi' ? 'Tìm thợ' : 'Find Workers')
                : (language === 'vi' ? 'Nhận việc' : 'Gigs'),
            icon: Radar,
            route: isRequester ? '/(requester)/radar' : '/(worker)',
            active: isPulseActive,
        },
        {
            key: 'profile',
            label: language === 'vi' ? 'Tài khoản' : 'Account',
            icon: User,
            route: '/(shared)/profile',
            active: isProfileActive,
        },
    ];

    return (
        <View
            style={[
                styles.container,
                {
                    backgroundColor: isDark
                        ? 'rgba(15, 23, 42, 0.92)'
                        : 'rgba(255, 255, 255, 0.92)',
                    borderTopColor: isDark
                        ? 'rgba(255, 255, 255, 0.12)'
                        : colors.border,
                    paddingBottom: insets.bottom > 0 ? insets.bottom : 10,
                },
                shadows.floating,
            ]}
        >
            {tabs.map((tab) => {
                const IconComponent = tab.icon;
                const isActive = tab.active;
                const activeColor = userRole === 'worker' ? colors.secondary : colors.primary;
                const inactiveColor = colors.textSecondary;

                return (
                    <TouchableOpacity
                        key={tab.key}
                        activeOpacity={0.75}
                        onPress={() => {
                            if (!isActive) {
                                router.replace(tab.route as any);
                            }
                        }}
                        style={[
                            styles.tabButton,
                            isActive && {
                                backgroundColor: isDark
                                    ? 'rgba(255, 255, 255, 0.08)'
                                    : (userRole === 'worker' ? colors.secondaryContainer + '20' : colors.primaryContainer + '20'),
                            },
                        ]}
                    >
                        {/* Biểu tượng Icon */}
                        <IconComponent
                            size={20}
                            color={isActive ? activeColor : inactiveColor}
                            strokeWidth={isActive ? 2.5 : 1.8}
                        />

                        {/* Văn bản nhãn Text */}
                        <Text
                            numberOfLines={1}
                            style={[
                                styles.tabLabel,
                                {
                                    color: isActive ? activeColor : inactiveColor,
                                    fontWeight: isActive ? '800' : '600',
                                },
                            ]}
                        >
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        borderTopWidth: 1,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingTop: 8,
        paddingHorizontal: 8,
        zIndex: 99999,
        elevation: 25,
    },
    tabButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 6,
        paddingHorizontal: 4,
        borderRadius: 14,
        marginHorizontal: 3,
    },
    tabLabel: {
        fontSize: 11,
        marginTop: 3,
        letterSpacing: 0.2,
        textAlign: 'center',
    },
});
