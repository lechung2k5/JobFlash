import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Linking, Platform, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { MapPin, Navigation, ExternalLink } from 'lucide-react-native';
import { GoongService } from '../services/goongService';
import { useAppTheme } from '../constants/theme';
import { useI18n } from '../i18n';

interface GoongMapCardProps {
    latitude: number;
    longitude: number;
    address?: string;
    title?: string;
    height?: number;
    showDirectionsButton?: boolean;
}

export default function GoongMapCard({
    latitude,
    longitude,
    address,
    title,
    height = 180,
    showDirectionsButton = true,
}: GoongMapCardProps) {
    const { colors, isDark } = useAppTheme();
    const { language } = useI18n();
    const [isLoading, setIsLoading] = useState(true);

    const mapUrl = GoongService.getStaticMapUrl(latitude, longitude, 15, 600, Math.round(height * 2));

    const handleOpenMap = () => {
        const query = `${latitude},${longitude}`;
        const url = Platform.select({
            ios: `maps:0,0?q=${encodeURIComponent(address || title || 'Vị trí')}&ll=${query}`,
            android: `geo:0,0?q=${query}(${encodeURIComponent(address || title || 'Vị trí')})`,
            default: `https://maps.google.com/?q=${query}`,
        });

        if (url) {
            Linking.openURL(url).catch(() => {
                Linking.openURL(`https://maps.google.com/?q=${query}`);
            });
        }
    };

    return (
        <View
            style={{
                width: '100%',
                borderRadius: 20,
                overflow: 'hidden',
                backgroundColor: colors.surfaceContainer,
                borderWidth: 1,
                borderColor: colors.border,
                marginVertical: 10,
            }}
        >
            {/* Vùng bản đồ Goong Maps */}
            <View style={{ width: '100%', height, position: 'relative', backgroundColor: colors.surface }}>
                <Image
                    source={{ uri: mapUrl }}
                    style={{ width: '100%', height: '100%' }}
                    contentFit="cover"
                    transition={250}
                    onLoadEnd={() => setIsLoading(false)}
                />

                {isLoading && (
                    <View
                        style={{
                            position: 'absolute',
                            inset: 0,
                            justifyContent: 'center',
                            alignItems: 'center',
                            backgroundColor: colors.surfaceContainer,
                        }}
                    >
                        <ActivityIndicator size="small" color={colors.primary} />
                        <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 6, fontWeight: '600' }}>
                            {language === 'vi' ? 'Đang tải bản đồ Goong...' : 'Loading Goong Map...'}
                        </Text>
                    </View>
                )}

                {/* Huy hiệu Goong Map */}
                <View
                    style={{
                        position: 'absolute',
                        top: 10,
                        left: 10,
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: isDark ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255, 255, 255, 0.92)',
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: colors.border,
                    }}
                >
                    <Navigation size={12} color={colors.primary} style={{ marginRight: 4 }} />
                    <Text style={{ fontSize: 10, fontWeight: '800', color: colors.primary, letterSpacing: 0.5 }}>
                        GOONG MAPS
                    </Text>
                </View>

                {/* Tọa độ GPS */}
                <View
                    style={{
                        position: 'absolute',
                        top: 10,
                        right: 10,
                        backgroundColor: isDark ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255, 255, 255, 0.92)',
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: colors.border,
                    }}
                >
                    <Text style={{ fontSize: 10, fontWeight: '700', color: colors.textSecondary }}>
                        {latitude.toFixed(4)}, {longitude.toFixed(4)}
                    </Text>
                </View>
            </View>

            {/* Chi tiết địa chỉ và nút chỉ đường */}
            <View style={{ padding: 14 }}>
                {title && (
                    <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: 4 }}>
                        {title}
                    </Text>
                )}
                {address && (
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 }}>
                        <MapPin size={14} color={colors.primary} style={{ marginTop: 2, marginRight: 6 }} />
                        <Text style={{ flex: 1, fontSize: 12, color: colors.textSecondary, lineHeight: 17 }} numberOfLines={2}>
                            {address}
                        </Text>
                    </View>
                )}

                {showDirectionsButton && (
                    <TouchableOpacity
                        onPress={handleOpenMap}
                        activeOpacity={0.8}
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: colors.surface,
                            paddingVertical: 8,
                            paddingHorizontal: 12,
                            borderRadius: 12,
                            borderWidth: 1,
                            borderColor: colors.border,
                            marginTop: 4,
                        }}
                    >
                        <ExternalLink size={13} color={colors.primary} style={{ marginRight: 6 }} />
                        <Text style={{ fontSize: 12, fontWeight: '700', color: colors.primary }}>
                            {language === 'vi' ? 'Xem trên ứng dụng Bản đồ' : 'Open in Maps'}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}
