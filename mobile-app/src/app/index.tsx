import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    ImageBackground,
    Animated,
    StyleSheet,
    TouchableOpacity,
    useWindowDimensions
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../store/useAuthStore';
import { JobFlashAPI } from '../services/apiClient';

const splashPoster = require('../../assets/images/splash-poster.png');

export default function SplashScreen() {
    const router = useRouter();
    const { token, userRole, setAuth, logout } = useAuthStore();
    const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useWindowDimensions();

    // Animation tiến trình tải (Progress Bar) & Hiệu ứng mờ dần (Fade In)
    const progressAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0.4)).current;
    const textPulseAnim = useRef(new Animated.Value(0.8)).current;

    useEffect(() => {
        // Animation hiện màn hình mượt mà
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
        }).start();

        // Hiệu ứng chữ "Đang tải ứng dụng..." thở nhẹ
        Animated.loop(
            Animated.sequence([
                Animated.timing(textPulseAnim, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(textPulseAnim, {
                    toValue: 0.5,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ])
        ).start();

        // Chạy thanh tiến trình tải từ 0% đến 100% trong 2.4 giây
        Animated.timing(progressAnim, {
            toValue: 1,
            duration: 2400,
            useNativeDriver: false,
        }).start(() => {
            handleAppRouting();
        });
    }, []);

    // Nhận diện người mới tải app vs người đã đăng nhập
    const handleAppRouting = async () => {
        // 1. Trường hợp người mới tải app (chưa có token đăng nhập)
        if (!token) {
            if (!userRole) {
                router.replace('/(auth)/role-select');
            } else {
                router.replace('/(auth)/login');
            }
            return;
        }

        // 2. Trường hợp đã có session: Kiểm tra với Backend thật
        try {
            const freshUser = await JobFlashAPI.users.getMe();
            if (freshUser && freshUser.id) {
                // Cập nhật thông tin mới nhất vào store
                setAuth(token, freshUser);

                // Kiểm tra hồ sơ cơ bản đã hoàn thiện chưa
                const isBasicProfileComplete =
                    freshUser.fullName &&
                    freshUser.fullName !== 'Người dùng mới' &&
                    freshUser.address;

                const targetRole = freshUser.activeRole || userRole || 'requester';
                const hasWorkerCCCD = Boolean(
                    freshUser.workerProfile?.idCardFrontUrl && freshUser.workerProfile?.idCardBackUrl
                );

                if (!isBasicProfileComplete) {
                    router.replace('/(auth)/profile-setup');
                    return;
                }

                // BẮT BUỘC: Nếu là Đối tác Thợ, phải cập nhật đầy đủ CCCD 2 mặt mới cho vào ứng dụng!
                if (targetRole === 'worker' && !hasWorkerCCCD) {
                    router.replace('/(auth)/profile-setup');
                    return;
                }

                if (targetRole === 'worker') {
                    router.replace('/(worker)');
                } else {
                    router.replace('/(requester)');
                }
                return;
            }
        } catch (e: any) {
            console.warn('[Splash] Token không hợp lệ hoặc server không phản hồi:', e?.message);
        }

        // Nếu token hết hạn hoặc lỗi xác thực -> Reset session về màn hình chọn vai trò
        logout();
        router.replace('/(auth)/role-select');
    };

    const progressWidth = progressAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 130],
    });

    return (
        <View style={styles.container}>
            <StatusBar style="light" translucent backgroundColor="transparent" />

            {/* Poster hình nền nghệ thuật JobFlash theo đúng thiết kế */}
            <TouchableOpacity
                activeOpacity={0.98}
                onPress={handleAppRouting}
                style={StyleSheet.absoluteFillObject}
            >
                <Animated.View style={[StyleSheet.absoluteFillObject, { opacity: fadeAnim }]}>
                    <ImageBackground
                        source={splashPoster}
                        style={styles.backgroundImage}
                        resizeMode="cover"
                    >
                        {/* Khu vực thanh tải thời gian thực phủ khớp ở chân màn hình */}
                        <View style={styles.bottomLoaderContainer}>
                            <View style={styles.progressBarTrack}>
                                <Animated.View style={[styles.progressBarFill, { width: progressWidth }]} />
                            </View>

                            <Animated.Text style={[styles.loadingText, { opacity: textPulseAnim }]}>
                                Đang tải ứng dụng...
                            </Animated.Text>
                        </View>
                    </ImageBackground>
                </Animated.View>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1b0735', // Gam màu tím thẫm hòa quyện liền mạch với poster
    },
    backgroundImage: {
        width: '100%',
        height: '100%',
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    bottomLoaderContainer: {
        alignItems: 'center',
        paddingBottom: 42,
        width: '100%',
    },
    progressBarTrack: {
        width: 130,
        height: 3.5,
        borderRadius: 2,
        backgroundColor: 'rgba(255, 255, 255, 0.22)',
        overflow: 'hidden',
        marginBottom: 10,
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#ffffff',
        borderRadius: 2,
    },
    loadingText: {
        fontSize: 12,
        fontWeight: '500',
        color: 'rgba(235, 225, 255, 0.85)',
        letterSpacing: 0.4,
    },
});
