import GEO from "./geoConstants"

export const helper = {

    /**
     * Returns a random integer between min (inclusive) and max (inclusive).
     * The value is no lower than min (or the next integer greater than min
     * if min isn't an integer) and no greater than max (or the next integer
     * lower than max if max isn't an integer).
     * Using Math.round() will give you a non-uniform distribution!
     * @param {number} max
     * @param {number} min  
     */
    getRandomInt(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    /**
     *
     * @param {Blob} file
     * @returns {Promise<string>}
     */
    async asyncRead(file) {
        // Always return a Promise
        return new Promise((resolve, reject) => {
            let content = '';
            const reader = new FileReader();
            // Wait till complete
            reader.onloadend = function(e) {
                content = e.target.result;
                //const result = content.split(/\r\n|\n/);
                resolve(content);
            };
            // Make sure to handle error states
            reader.onerror = function(e) {
                reject(e);
            };
            reader.readAsText(file);
        });
    },

    /**
     *
     * @param {L.LatLng} LatLng
     * @returns
     */
    getMetersFromDegree(LatLng) {
        let latM = 111111;
        let lngM = Math.cos(LatLng.lat * 3.1415 / 180) * latM;
        lngM = Math.round(lngM);

        return { latM: latM, lngM: lngM }
    },

    /**
     *
     * @param {L.LatLng} point1
     * @param {L.LatLng} point2
     * @returns
     */
    getAverPoint(point1, point2){
        return {
            lat: (point1.lat + point2.lat) / 2,
            lng: (point1.lng + point2.lng) / 2
        };
    },

    /**
     *
     * @param {L.LatLng} startLatLng
     * @param {L.LatLng} endLatLng
     * @returns
     */
    distance(startLatLng, endLatLng) {
        if (!startLatLng || !endLatLng) return 0;
        let a_lat = startLatLng.lat * GEO.PI / 180;
        let a_lng = startLatLng.lng * GEO.PI / 180;

        let b_lat = endLatLng.lat * GEO.PI / 180;
        let b_lng = endLatLng.lng * GEO.PI / 180;

        let distance = GEO.EARTH_RADIUS * Math.acos(
            Math.sin(a_lat) * Math.sin(b_lat)
            + Math.cos(a_lat) * Math.cos(b_lat) * Math.cos(b_lng - a_lng)
        );

        if (distance<0) distance *= -1;
        if (isNaN(distance)) distance = 0;

        return distance;
    },

    /**
     *
     * @param {L.Point} point0
     * @param {L.Point} point1
     * @returns
     */
    distanceXY(point0, point1) {
        let Ax, Ay, Bx, By;
        Ax = point0.x;
        Ay = point0.y;
        Bx = point1.x;
        By = point1.y;

        return Math.sqrt (
            (Bx - Ax)*(Bx - Ax)
            + (By - Ay)*(By - Ay)
        );
    },

    /**
     *
     * @param {L.LatLng} point
     * @param {L.LatLng} circle
     * @param {number} radius
     * @returns {boolean}
     */
    inRadius(point, circle, radius){
        let dist = this.distance(point, circle)
        return dist <= radius;
    },

    /**
     *
     * @param {L.LatLng} latlng
     * @param {{min:L.LatLng, max:L.LatLng, _northEast:L.LatLng, _southWest:L.LatLng}} bound
     * @returns
     */
    inBound(latlng, bound){
        if (!bound) return false;
        /**@type {L.LatLng} */
        let min, max;
        if (bound.min && bound.max){
            min = bound.min;
            max = bound.max;
        }
        if (bound._southWest && bound._northEast){
            min = bound._southWest;
            max = bound._northEast;
        }
        if (bound[0] && bound[1]){
            min = bound[0];
            max = bound[1];
        }
        if (min.lat && min.lng && max.lat && max.lng){
            //Значит проверяем
            if (latlng.lat >= min.lat && latlng.lng >= min.lng
                && latlng.lat <= max.lat && latlng.lng <= max.lng){
                    return true;
                }else{
                    return false;
                }
        }else{
            console.warn('inBound error - bound is not valid');
            return false;
        }
    },

    radian(alfa){
        return alfa * GEO.PI / 180;
    },

    /**
     * Конвертированеие числа из дапазона в диапазон
     * @param {Number} value значение
     * @param {Number} old_min стар.диапазон мин
     * @param {Number} old_max стар.диапазон макс
     * @param {Number} new_min нов.диапазон мин
     * @param {Number} new_max нов.диапазон макс
     * @returns {Number} значение в новом диапазоне
     */
    convertDiapazone(value, old_min, old_max, new_min, new_max){
        let old_range = old_max - old_min
        let new_range = new_max - new_min
        return ((value - old_min) * new_range / old_range) + new_min
    },

    /**
     * 
     * @param {*} content 
     * @param {string} fileName 
     * @param {string} contentType 
     */
    download(content, fileName, contentType) {
        let a = document.createElement("a");
        let file = new Blob([content], {type: contentType});
        a.href = URL.createObjectURL(file);
        a.download = fileName;
        a.click();
    },

}

export default helper;