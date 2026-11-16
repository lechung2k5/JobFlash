import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowLeft, Star, ThumbsUp } from 'lucide-react-native';
import { useAppTheme } from '../../constants/theme';
import { useI18n } from '../../i18n';
import GlassBottomBar from '../../components/GlassBottomBar';

export default function RequesterRatingScreen() {
    const router = useRouter();
    const { colors, gradients, shadows } = useAppTheme();
    const { t, language } = useI18n();

    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState(
        language === 'vi'
            ? 'Thợ làm việc rất nhiệt tình, đúng giờ và hoàn thành tốt nhiệm vụ!'
            : 'The workers were very enthusiastic, punctual and did a great job!'
    );

    const handleSubmit = () => {
        Alert.alert(
            language === 'vi' ? 'Cảm ơn bạn!' : 'Thank you!',
            language === 'vi'
                ? 'Đánh giá của bạn đã được ghi nhận để hoàn tất cuốc việc.'
                : 'Your feedback has been recorded to finalize the gig.',
            [{ text: language === 'vi' ? 'Về trang chủ' : 'Home', onPress: () => router.replace('/(requester)') }]
        );
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <View style={{ flex: 1, justifyContent: 'space-between', padding: 24 }}>
                <View>
                    <TouchableOpacity
                        onPress={() => {
                            if (router.canGoBack()) {
                                router.back();
                            } else {
                                router.replace('/(requester)');
                            }
                        }}
                        style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surfaceContainer, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <ArrowLeft size={20} color={colors.text} />
                    </TouchableOpacity>

                    <Text style={{ fontSize: 26, fontWeight: '800', color: colors.text }}>
                        {language === 'vi' ? 'Đánh giá chất lượng thợ' : 'Rate Your Workers'}
                    </Text>
                    <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 4, lineHeight: 18 }}>
                        {language === 'vi'
                            ? 'Phản hồi thực tế của bạn giúp duy trì dịch vụ uy tín và an tâm trên JobFlash.'
                            : 'Your honest feedback helps maintain high service standards on JobFlash.'}
                    </Text>

                    {/* Khối sao đánh giá */}
                    <View
                        style={[
                            {
                                marginTop: 24,
                                padding: 24,
                                borderRadius: 24,
                                backgroundColor: colors.surface,
                                borderWidth: 1,
                                borderColor: colors.border,
                                alignItems: 'center',
                            },
                            shadows.card,
                        ]}
                    >
                        <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 14 }}>
                            {language === 'vi' ? 'Mức độ hài lòng của bạn' : 'Your Satisfaction'}
                        </Text>
                        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <TouchableOpacity
                                    key={star}
                                    activeOpacity={0.8}
                                    onPress={() => setRating(star)}
                                    style={{ padding: 4 }}
                                >
                                    <Star
                                        size={36}
                                        color="#f59e0b"
                                        fill={star <= rating ? '#f59e0b' : 'transparent'}
                                    />
                                </TouchableOpacity>
                            ))}
                        </View>
                        <Text style={{ fontSize: 13, fontWeight: '700', color: colors.primary }}>
                            {rating === 5
                                ? (language === 'vi' ? 'Tuyệt vời, vượt mong đợi!' : 'Excellent!')
                                : (language === 'vi' ? `Hài lòng (${rating}/5 sao)` : `Good (${rating}/5 stars)`)}
                        </Text>
                    </View>

                    {/* Ô nhận xét */}
                    <View style={{ marginTop: 20 }}>
                        <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: 8 }}>
                            {language === 'vi' ? 'Nhận xét chi tiết (không bắt buộc)' : 'Detailed Feedback (Optional)'}
                        </Text>
                        <TextInput
                            value={comment}
                            onChangeText={setComment}
                            multiline
                            numberOfLines={4}
                            placeholder={language === 'vi' ? 'Chia sẻ trải nghiệm làm việc cùng thợ...' : 'Share your experience with the workers...'}
                            placeholderTextColor={colors.placeholder}
                            style={{
                                width: '100%',
                                padding: 16,
                                backgroundColor: colors.surface,
                                borderRadius: 18,
                                borderWidth: 1.5,
                                borderColor: colors.border,
                                color: colors.text,
                                fontSize: 14,
                                height: 110,
                                textAlignVertical: 'top',
                            }}
                        />
                    </View>
                </View>

                {/* Nút gửi đánh giá */}
                <View style={{ paddingTop: 20 }}>
                    <TouchableOpacity
                        activeOpacity={0.88}
                        onPress={handleSubmit}
                        style={[
                            {
                                width: '100%',
                                borderRadius: 16,
                                overflow: 'hidden',
                                marginBottom: 70,
                            },
                            shadows.electricGlow,
                        ]}
                    >
                        <LinearGradient
                            colors={gradients.electric}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={{ paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                        >
                            <ThumbsUp size={18} color="#ffffff" />
                            <Text style={{ color: '#ffffff', fontSize: 15, fontWeight: '800' }}>
                                {language === 'vi' ? 'GỬI ĐÁNH GIÁ & VỀ TRANG CHỦ' : 'SUBMIT & RETURN HOME'}
                            </Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

                {/* Thanh menu cố định ở dưới */}
                <GlassBottomBar />
            </View>
        </SafeAreaView>
    );
}
