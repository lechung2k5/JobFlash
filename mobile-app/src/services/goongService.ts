// ==============================================================================
// GOONG.IO MAP & PLACES AUTOCOMPLETE SERVICE
// Keys được quản lý qua biến môi trường EXPO_PUBLIC_* (.env)
// ==============================================================================

import * as Location from 'expo-location';

export const GOONG_API_KEY = process.env.EXPO_PUBLIC_GOONG_API_KEY || '';
export const GOONG_MAPTILES_KEY = process.env.EXPO_PUBLIC_GOONG_MAPTILES_KEY || '';

if (__DEV__ && !GOONG_MAPTILES_KEY) {
    console.warn('[GoongService] Chưa nạp được EXPO_PUBLIC_GOONG_MAPTILES_KEY từ file .env. Vui lòng dừng terminal và khởi động lại với: npx expo start -c');
}

export interface GoongPlacePrediction {
    placeId: string;
    description: string;
    mainText: string;
    secondaryText: string;
}

export interface GoongPlaceDetail {
    formattedAddress: string;
    latitude: number;
    longitude: number;
}

export const GoongService = {
    /**
     * Gợi ý địa chỉ tự động (Places Autocomplete) theo thời gian thực
     */
    async searchPlaces(input: string): Promise<GoongPlacePrediction[]> {
        const query = input.trim();
        if (!query || query.length < 2) return [];

        try {
            const url = `https://rsapi.goong.io/Place/AutoComplete?api_key=${GOONG_API_KEY}&input=${encodeURIComponent(
                query
            )}&limit=5`;

            const res = await fetch(url);
            const data = await res.json();

            if (data?.status === 'OK' && Array.isArray(data.predictions)) {
                return data.predictions.map((p: any) => ({
                    placeId: p.place_id,
                    description: p.description,
                    mainText: p.structured_formatting?.main_text || p.description,
                    secondaryText: p.structured_formatting?.secondary_text || '',
                }));
            }
            return [];
        } catch (error) {
            console.warn('[GoongService] Lỗi tìm kiếm địa chỉ:', error);
            return [];
        }
    },

    /**
     * Lấy tọa độ kinh độ/vĩ độ chi tiết từ place_id
     */
    async getPlaceDetail(placeId: string): Promise<GoongPlaceDetail | null> {
        if (!placeId) return null;

        try {
            const url = `https://rsapi.goong.io/Place/Detail?api_key=${GOONG_API_KEY}&place_id=${placeId}`;
            const res = await fetch(url);
            const data = await res.json();

            if (data?.status === 'OK' && data.result) {
                const result = data.result;
                return {
                    formattedAddress: result.formatted_address || '',
                    latitude: result.geometry?.location?.lat || 0,
                    longitude: result.geometry?.location?.lng || 0,
                };
            }
            return null;
        } catch (error) {
            console.warn('[GoongService] Lỗi lấy chi tiết địa điểm:', error);
            return null;
        }
    },

    /**
     * Chuyển địa chỉ dạng text thành tọa độ GPS (Geocoding)
     */
    async geocode(address: string): Promise<GoongPlaceDetail | null> {
        const query = address.trim();
        if (!query) return null;

        try {
            const url = `https://rsapi.goong.io/geocode?address=${encodeURIComponent(query)}&api_key=${GOONG_API_KEY}`;
            const res = await fetch(url);
            const data = await res.json();

            if (data?.status === 'OK' && Array.isArray(data.results) && data.results.length > 0) {
                const first = data.results[0];
                return {
                    formattedAddress: first.formatted_address || query,
                    latitude: first.geometry?.location?.lat || 0,
                    longitude: first.geometry?.location?.lng || 0,
                };
            }

            // Fallback qua Places Autocomplete
            const predictions = await this.searchPlaces(query);
            if (predictions.length > 0) {
                return await this.getPlaceDetail(predictions[0].placeId);
            }
            return null;
        } catch (error) {
            console.warn('[GoongService] Lỗi Geocoding address:', error);
            return null;
        }
    },

    /**
     * Chuyển tọa độ GPS thành địa chỉ văn bản thực tế (Reverse Geocoding)
     */
    async reverseGeocode(lat: number, lng: number): Promise<string | null> {
        try {
            const url = `https://rsapi.goong.io/Geocode?latlng=${lat},${lng}&api_key=${GOONG_API_KEY}`;
            const res = await fetch(url);
            const data = await res.json();
            if (data?.status === 'OK' && Array.isArray(data.results) && data.results.length > 0) {
                return data.results[0].formatted_address || null;
            }
            return null;
        } catch (error) {
            console.warn('[GoongService] Lỗi Geocoding:', error);
            return null;
        }
    },

    /**
     * Lấy URL ảnh bản đồ tuyến đường Goong Static Map (chuẩn API Goong)
     */
    getStaticRouteMapUrl(
        originLat: number,
        originLng: number,
        destLat: number,
        destLng: number,
        vehicle: string = 'car',
        width: number = 600,
        height: number = 280
    ): string {
        return `https://rsapi.goong.io/staticmap/route?origin=${originLat},${originLng}&destination=${destLat},${destLng}&vehicle=${vehicle}&width=${width}&height=${height}&api_key=${GOONG_API_KEY}`;
    },

    /**
     * Lấy URL ảnh bản đồ tĩnh tại 1 điểm tọa độ (Static Map)
     */
    getStaticMapUrl(
        latitude: number,
        longitude: number,
        zoom: number = 15,
        width: number = 600,
        height: number = 360
    ): string {
        return `https://rsapi.goong.io/staticmap/route?origin=${latitude},${longitude}&destination=${latitude},${longitude}&vehicle=car&width=${width}&height=${height}&api_key=${GOONG_API_KEY}`;
    },

    /**
     * Lấy URL Goong Map Tiles
     */
    getTileUrl(): string {
        return `https://tiles.goong.io/assets/tiles/{z}/{x}/{y}.png?api_key=${GOONG_MAPTILES_KEY}`;
    },

    getMapStyleUrl(): string {
        return `https://tiles.goong.io/assets/goong_map_web.json?api_key=${GOONG_MAPTILES_KEY}`;
    },

    /**
     * Tìm đường đi và khoảng cách lộ trình thực tế giữa 2 điểm (Goong Direction API V2 / V1 & OSRM)
     * Đảm bảo tính theo mạng lưới đường xe chạy thực tế (không phải đường chim bay)
     */
    async getDirection(
        originLat: number,
        originLng: number,
        destLat: number,
        destLng: number,
        vehicle: 'bike' | 'car' | 'taxi' | 'truck' = 'car'
    ): Promise<{ distanceKm: number; durationMin: number; polyline?: string } | null> {
        const fetchGoong = async (veh: string) => {
            // 1.1 Goong V2
            try {
                const v2Url = `https://rsapi.goong.io/v2/direction?origin=${originLat},${originLng}&destination=${destLat},${destLng}&vehicle=${veh}&api_key=${GOONG_API_KEY}`;
                const res = await fetch(v2Url);
                const data = await res.json();
                if (data?.status === 'OK' && Array.isArray(data.routes) && data.routes.length > 0) {
                    const leg = data.routes[0].legs?.[0];
                    if (leg && typeof leg.distance?.value === 'number') {
                        const distanceKm = Math.round((leg.distance.value / 1000) * 10) / 10;
                        const durationMin = leg.duration?.value ? Math.ceil(leg.duration.value / 60) : Math.ceil(distanceKm * 2.5);
                        return { distanceKm, durationMin, polyline: data.routes[0].overview_polyline?.points };
                    }
                }
            } catch (error) {
                console.warn('[GoongService] V2 error for vehicle', veh, error);
            }

            // 1.2 Goong V1
            try {
                const v1Url = `https://rsapi.goong.io/direction?origin=${originLat},${originLng}&destination=${destLat},${destLng}&vehicle=${veh}&api_key=${GOONG_API_KEY}`;
                const res = await fetch(v1Url);
                const data = await res.json();
                if (data?.status === 'OK' && Array.isArray(data.routes) && data.routes.length > 0) {
                    const leg = data.routes[0].legs?.[0];
                    if (leg && typeof leg.distance?.value === 'number') {
                        const distanceKm = Math.round((leg.distance.value / 1000) * 10) / 10;
                        const durationMin = leg.duration?.value ? Math.ceil(leg.duration.value / 60) : Math.ceil(distanceKm * 2.5);
                        return { distanceKm, durationMin, polyline: data.routes[0].overview_polyline?.points };
                    }
                }
            } catch (error) {
                console.warn('[GoongService] V1 error for vehicle', veh, error);
            }

            return null;
        };

        // Bước 1: Thử phương tiện yêu cầu qua Goong
        let result = await fetchGoong(vehicle);
        if (result && result.distanceKm > 0) return result;

        // Bước 2: Nếu xe tải hoặc taxi không ra lộ trình trên Goong, thử lại với ô tô ('car') trên Goong
        if (vehicle !== 'car') {
            result = await fetchGoong('car');
            if (result && result.distanceKm > 0) return result;
        }

        // Bước 3: Dự phòng mạng lưới đường bộ thực tế qua OSRM Driving Router (Đường bộ ô tô xe máy thực tế)
        try {
            const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${originLng},${originLat};${destLng},${destLat}?overview=false`;
            const osrmRes = await fetch(osrmUrl);
            const osrmData = await osrmRes.json();
            if (osrmData?.code === 'Ok' && Array.isArray(osrmData.routes) && osrmData.routes.length > 0) {
                const r = osrmData.routes[0];
                const distanceKm = Math.round((r.distance / 1000) * 10) / 10;
                const durationMin = Math.ceil(r.duration / 60);
                return { distanceKm, durationMin };
            }
        } catch (error) {
            console.warn('[GoongService] OSRM fallback error:', error);
        }

        return null;
    },

    /**
     * Lấy vị trí thiết bị chuẩn xác qua expo-location (Hỗ trợ xin quyền GPS + Fallback IP + Goong Reverse Geocode)
     */
    async getCurrentLocation(): Promise<{ latitude: number; longitude: number; address: string }> {
        // 1. Thử xin quyền & lấy GPS chuẩn xác từ expo-location
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
                const loc = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Balanced,
                });
                const lat = loc.coords.latitude;
                const lng = loc.coords.longitude;
                const address = await this.reverseGeocode(lat, lng);
                return {
                    latitude: lat,
                    longitude: lng,
                    address: address || `Vị trí GPS (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
                };
            }
        } catch (error) {
            console.warn('[GoongService] Không thể lấy GPS từ expo-location:', error);
        }

        // 2. Dự phòng bằng IP Geolocation (khi người dùng tắt GPS)
        try {
            const ipRes = await fetch('https://ipapi.co/json/');
            const ipData = await ipRes.json();
            if (ipData && typeof ipData.latitude === 'number' && typeof ipData.longitude === 'number') {
                const lat = ipData.latitude;
                const lng = ipData.longitude;
                const address = await this.reverseGeocode(lat, lng);
                return {
                    latitude: lat,
                    longitude: lng,
                    address: address || `${ipData.city || 'TP. Hồ Chí Minh'}, Việt Nam`,
                };
            }
        } catch {
            // Tiếp tục fallback
        }

        // 3. Fallback mặc định trung tâm Sài Gòn (Chợ Bến Thành, Quận 1)
        const defaultLat = 10.7725;
        const defaultLng = 106.6980;
        const address = await this.reverseGeocode(defaultLat, defaultLng);
        return {
            latitude: defaultLat,
            longitude: defaultLng,
            address: address || 'Chợ Bến Thành, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh',
        };
    },
};
