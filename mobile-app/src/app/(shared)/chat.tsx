import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Modal,
    Linking,
    Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
    ArrowLeft,
    Phone,
    Paperclip,
    Send,
    Camera,
    PhoneCall,
    Globe,
    X,
    CheckCheck
} from 'lucide-react-native';
import { useAuthStore } from '../../store/useAuthStore';
import { THEME } from '../../constants/theme';

interface MessageItem {
    id: number;
    sender: 'worker' | 'requester';
    text?: string;
    imageUrl?: string;
    time: string;
}

export default function ChatScreen() {
    const router = useRouter();
    const userRole = useAuthStore((state) => state.userRole);

    const partner = {
        name: userRole === 'worker' ? 'Hoàng Long' : 'Lê Chung',
        role: userRole === 'worker' ? 'Người Thuê Việc' : 'Đối Tác Thợ',
        phone: '0912 345 678',
        initials: userRole === 'worker' ? 'HL' : 'LC',
    };

    const [messages, setMessages] = useState<MessageItem[]>([
        {
            id: 1,
            sender: 'worker',
            text: 'Chào anh, em đang chạy tới địa điểm bốc xếp đây ạ!',
            time: '14:20',
        },
        {
            id: 2,
            sender: 'requester',
            text: 'Ok em nhé, cổng số 2 đường Nguyễn Hữu Thọ, tới alo anh.',
            time: '14:21',
        },
        {
            id: 3,
            sender: 'worker',
            text: 'Em đã tới cổng số 2 và chụp ảnh vị trí đứng đây anh xem đúng chưa nhé:',
            time: '14:25',
        },
        {
            id: 4,
            sender: 'worker',
            imageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&auto=format&fit=crop&q=80',
            time: '14:25',
        },
    ]);

    const [inputMsg, setInputMsg] = useState('');
    const [showCallModal, setShowCallModal] = useState(false);

    // Gửi tin nhắn văn bản
    const handleSendText = () => {
        if (!inputMsg.trim()) return;
        const newMsg: MessageItem = {
            id: Date.now(),
            sender: userRole === 'worker' ? 'worker' : 'requester',
            text: inputMsg,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, newMsg]);
        setInputMsg('');
    };

    // Mô phỏng đính kèm gửi ảnh (chuẩn bị cho S3 Upload)
    const handlePickAndSendImage = () => {
        Alert.alert(
            'Gửi hình ảnh',
            'Chọn nguồn tải ảnh hiện trường lên lưu trữ S3:',
            [
                {
                    text: 'Chụp ảnh từ Camera',
                    onPress: () => {
                        const newImgMsg: MessageItem = {
                            id: Date.now(),
                            sender: userRole === 'worker' ? 'worker' : 'requester',
                            imageUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb186156f?w=600&auto=format&fit=crop&q=80',
                            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        };
                        setMessages((prev) => [...prev, newImgMsg]);
                    },
                },
                {
                    text: 'Chọn từ Thư viện ảnh',
                    onPress: () => {
                        const newImgMsg: MessageItem = {
                            id: Date.now(),
                            sender: userRole === 'worker' ? 'worker' : 'requester',
                            imageUrl: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=600&auto=format&fit=crop&q=80',
                            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        };
                        setMessages((prev) => [...prev, newImgMsg]);
                    },
                },
                { text: 'Hủy', style: 'cancel' },
            ]
        );
    };

    // Tùy chọn 1: Gọi qua App (Internet VoIP)
    const handleStartInAppCall = () => {
        setShowCallModal(false);
        router.push({
            pathname: '/(shared)/call',
            params: {
                name: partner.name,
                role: partner.role,
                phone: partner.phone,
            },
        });
    };

    // Tùy chọn 2: Gọi qua SĐT di động thường (SIM)
    const handleStartCellularCall = () => {
        setShowCallModal(false);
        const cleanPhone = partner.phone.replace(/\s+/g, '');
        Linking.openURL(`tel:${cleanPhone}`).catch(() => {
            Alert.alert('Lỗi', 'Không thể khởi động trình quay số điện thoại.');
        });
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#faf8fc' }}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1, justifyContent: 'space-between' }}
            >
                {/* Header */}
                <View
                    style={{
                        paddingHorizontal: 16,
                        paddingVertical: 12,
                        borderBottomWidth: 1,
                        borderBottomColor: '#e2e8f0',
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: '#ffffff',
                    }}
                >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <TouchableOpacity
                            onPress={() => {
                                if (router.canGoBack()) {
                                    router.back();
                                } else {
                                    router.replace(userRole === 'worker' ? '/(worker)' : '/(requester)');
                                }
                            }}
                            style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' }}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <ArrowLeft size={18} color="#0f172a" />
                        </TouchableOpacity>

                        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#2563eb', alignItems: 'center', justifyContent: 'center' }}>
                            <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 13 }}>{partner.initials}</Text>
                        </View>

                        <View>
                            <Text style={{ fontSize: 14, fontWeight: '800', color: '#0f172a' }}>{partner.name}</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#10b981' }} />
                                <Text style={{ fontSize: 11, color: '#059669', fontWeight: '700' }}>Đang trực tuyến</Text>
                            </View>
                        </View>
                    </View>

                    {/* Nút Gọi điện - Bật Modal 2 kiểu gọi */}
                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => setShowCallModal(true)}
                        style={{
                            width: 38,
                            height: 38,
                            borderRadius: 19,
                            backgroundColor: '#d1fae5',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Phone size={18} color="#059669" />
                    </TouchableOpacity>
                </View>

                {/* Danh sách tin nhắn */}
                <ScrollView contentContainerStyle={{ padding: 16 }} style={{ flex: 1 }}>
                    {messages.map((msg) => {
                        const isMe =
                            (userRole === 'worker' && msg.sender === 'worker') ||
                            (userRole !== 'worker' && msg.sender === 'requester');

                        return (
                            <View
                                key={msg.id}
                                style={{
                                    flexDirection: 'row',
                                    marginBottom: 12,
                                    justifyContent: isMe ? 'flex-end' : 'flex-start',
                                }}
                            >
                                {isMe ? (
                                    <LinearGradient
                                        colors={['#1d4ed8', '#2563eb']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                        style={{
                                            maxWidth: '78%',
                                            paddingHorizontal: 16,
                                            paddingVertical: 12,
                                            borderRadius: 20,
                                            borderBottomRightRadius: 4,
                                            shadowColor: '#2563eb',
                                            shadowOffset: { width: 0, height: 2 },
                                            shadowOpacity: 0.2,
                                            shadowRadius: 6,
                                        }}
                                    >
                                        {msg.text && (
                                            <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '500', lineHeight: 18 }}>
                                                {msg.text}
                                            </Text>
                                        )}
                                        {msg.imageUrl && (
                                            <Image
                                                source={{ uri: msg.imageUrl }}
                                                style={{ width: 220, height: 160, borderRadius: 14, marginTop: 4 }}
                                                contentFit="cover"
                                            />
                                        )}
                                        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 4, gap: 4 }}>
                                            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10 }}>{msg.time}</Text>
                                            <CheckCheck size={12} color="#ffffff" />
                                        </View>
                                    </LinearGradient>
                                ) : (
                                    <View
                                        style={[
                                            {
                                                maxWidth: '78%',
                                                paddingHorizontal: 16,
                                                paddingVertical: 12,
                                                borderRadius: 20,
                                                borderBottomLeftRadius: 4,
                                                backgroundColor: '#ffffff',
                                                borderWidth: 1,
                                                borderColor: '#e2e8f0',
                                            },
                                            THEME.shadows.card,
                                        ]}
                                    >
                                        {msg.text && (
                                            <Text style={{ color: '#0f172a', fontSize: 13, fontWeight: '500', lineHeight: 18 }}>
                                                {msg.text}
                                            </Text>
                                        )}
                                        {msg.imageUrl && (
                                            <Image
                                                source={{ uri: msg.imageUrl }}
                                                style={{ width: 220, height: 160, borderRadius: 14, marginTop: 4 }}
                                                contentFit="cover"
                                            />
                                        )}
                                        <Text style={{ color: '#94a3b8', fontSize: 10, marginTop: 4 }}>{msg.time}</Text>
                                    </View>
                                )}
                            </View>
                        );
                    })}
                </ScrollView>

                {/* Input Bar với gửi Text & Gửi Ảnh */}
                <View
                    style={{
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                        borderTopWidth: 1,
                        borderTopColor: '#e2e8f0',
                        backgroundColor: '#ffffff',
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 8,
                    }}
                >
                    <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={handlePickAndSendImage}
                        style={{ padding: 6 }}
                    >
                        <Camera size={22} color="#2563eb" />
                    </TouchableOpacity>

                    <TextInput
                        value={inputMsg}
                        onChangeText={setInputMsg}
                        placeholder="Nhắn tin cho đối tác..."
                        placeholderTextColor="#94a3b8"
                        style={{
                            flex: 1,
                            paddingHorizontal: 16,
                            paddingVertical: 10,
                            backgroundColor: '#f8fafc',
                            borderRadius: 9999,
                            borderWidth: 1,
                            borderColor: '#cbd5e1',
                            fontSize: 13,
                            color: '#0f172a',
                        }}
                    />

                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={handleSendText}
                        style={{
                            width: 40,
                            height: 40,
                            borderRadius: 20,
                            backgroundColor: '#2563eb',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Send size={16} color="#ffffff" />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>

            {/* Modal Lựa chọn 2 Hình thức Gọi điện */}
            <Modal
                visible={showCallModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowCallModal(false)}
            >
                <View style={{ flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'flex-end', padding: 16 }}>
                    <View
                        style={{
                            backgroundColor: '#ffffff',
                            borderRadius: 28,
                            padding: 24,
                            gap: 16,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 8 },
                            shadowOpacity: 0.25,
                            shadowRadius: 20,
                        }}
                    >
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text style={{ fontSize: 18, fontWeight: '800', color: '#0f172a' }}>
                                Liên hệ với {partner.name}
                            </Text>
                            <TouchableOpacity onPress={() => setShowCallModal(false)}>
                                <X size={20} color="#64748b" />
                            </TouchableOpacity>
                        </View>

                        <Text style={{ fontSize: 13, color: '#64748b' }}>
                            Chọn phương thức gọi phù hợp với điều kiện mạng của bạn:
                        </Text>

                        {/* Kiểu 1: Gọi Internet qua App */}
                        <TouchableOpacity
                            activeOpacity={0.9}
                            onPress={handleStartInAppCall}
                            style={{
                                padding: 16,
                                borderRadius: 20,
                                backgroundColor: '#eff6ff',
                                borderWidth: 1.5,
                                borderColor: '#93c5fd',
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 14,
                            }}
                        >
                            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#2563eb', alignItems: 'center', justifyContent: 'center' }}>
                                <Globe size={22} color="#ffffff" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 14, fontWeight: '700', color: '#1e40af' }}>
                                    Gọi trực tiếp qua Ứng dụng (Internet)
                                </Text>
                                <Text style={{ fontSize: 11, color: '#1d4ed8', marginTop: 2 }}>
                                    Miễn phí, chất lượng âm thanh HD (Khuyên dùng khi có Wi-Fi/4G)
                                </Text>
                            </View>
                        </TouchableOpacity>

                        {/* Kiểu 2: Gọi qua SIM điện thoại */}
                        <TouchableOpacity
                            activeOpacity={0.9}
                            onPress={handleStartCellularCall}
                            style={{
                                padding: 16,
                                borderRadius: 20,
                                backgroundColor: '#ecfdf5',
                                borderWidth: 1.5,
                                borderColor: '#6ee7b7',
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 14,
                            }}
                        >
                            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#059669', alignItems: 'center', justifyContent: 'center' }}>
                                <PhoneCall size={22} color="#ffffff" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 14, fontWeight: '700', color: '#065f46' }}>
                                    Gọi qua số điện thoại thường (SIM)
                                </Text>
                                <Text style={{ fontSize: 11, color: '#047857', marginTop: 2 }}>
                                    Quay số {partner.phone} trực tiếp (Dành cho lúc mạng yếu/mất sóng)
                                </Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => setShowCallModal(false)}
                            style={{ paddingVertical: 12, alignItems: 'center' }}
                        >
                            <Text style={{ fontSize: 13, fontWeight: '700', color: '#64748b' }}>Hủy bỏ</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}
