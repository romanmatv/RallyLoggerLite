import rGlobal, {racePoint, trackPoint} from './rglobal';
//import { GPX } from 'leaflet-gpx';
import gpxParser from '../modules/GPXParser';
import helper from './helper';
import * as gpxBuilder from 'gpx-builder'
import moment from 'moment';
import Swal from 'sweetalert2';

/**@type {HTMLInputElement} */
const inputTrack = document.getElementById('inputTrack')
const btnLoadTrack = document.getElementById('btnLoadTrack');
const trackLoadedFileText = document.getElementById('track-loaded-file-text')

/**@type {HTMLInputElement} */
const chkbDrawTrackLine = document.getElementById('chkbDrawTrackLine')
/**@type {HTMLInputElement} */
const inputTrackAcceptRadius = document.getElementById('inputTrackAcceptRadius');
/**@type {HTMLInputElement} */
const inputTrackLength = document.getElementById('inputTrackLength')

trackLoadedFileText.textContent = "Ничего не загружено";
chkbDrawTrackLine.checked = rGlobal.drawingTrackLine;
inputTrackAcceptRadius.value = rGlobal.acceptRadius;

/**@type {HTMLInputElement} */
const inputGlobalSpeedLimit = document.getElementById('inputGlobalSpeedLimit');
/**@type {HTMLInputElement} */
const inputTimeSpeedStartFine = document.getElementById('inputTimeSpeedStartFine');
/**@type {HTMLInputElement} */
const inputTimeSpeedRepeatFine = document.getElementById('inputTimeSpeedRepeatFine');
inputGlobalSpeedLimit.value = rGlobal.globalSpeedLimit;
inputTimeSpeedStartFine.value = rGlobal.timeSpeedStartFine;
inputTimeSpeedRepeatFine.value = rGlobal.timeSpeedRepeatFine;

const rn2NoteElement = {
    "name": "Speed Limit 50",
    "id": "53cb2146-c977-41ec-8132-b648cf87fa78",
    "legacy_id": 51,
    "src": "/icons/53cb2146-c977-41ec-8132-b648cf87fa78.svg",
    "gpx_tags": "<speed>50</speed>",
    "disabled": false,
    "system": true,
    "eId": "8a69ae7c-05b8-4bd7-b5f0-1598c35e5764",
    "type": "Icon",
    "angle": 0,
    "w": 50,
    "x": 86,
    "y": 60,
    "rerender": false
}


btnLoadTrack.addEventListener('click', e=>{
    inputTrack.value = "";
    inputTrack.click()
});

/**
 * 
 * @param {File} rawFile 
 */
function loadTrackFromRN(rawFile){
    let allVisible = false;
    const numRegex = /\d+/gm;

    Swal.fire({
        theme: 'bootstrap-5',
        title: "Парсить все видимые точки или контрольные?",
        showDenyButton: true,
        confirmButtonText: "Видимые",
        denyButtonText: "Контрольные",
        cancelButtonText: "Отмена",
        showCancelButton: true,
    }).then(result => {
        if (result.isDismissed){
            return;
        }
        if (result.isConfirmed) {
            allVisible = true;
        } else if (result.isDenied) {
            allVisible = false;
        }

        try{
            helper.asyncRead(rawFile).then(readed=>{
                let obj = JSON.parse(readed);
                /**@type {Array} */
                let waypoints = obj.route.waypoints;

                let outarr = [];
                let i=1;
                let trackKilometers = 0;
                let lastPoint = null;
                let lastAddedPoint = null;

                waypoints.forEach(wp=>{
                    if (lastPoint){
                        trackKilometers += helper.distance({lat: lastPoint.lat, lng: lastPoint.lon}, {lat: wp.lat, lng: wp.lon})
                    }
                    lastPoint = wp;
                    if (wp.show){
                        if (allVisible || wp.waypointIcon){
                            let speedLimit = -1;

                            if (wp.waypointIcon){
                                if (wp.waypointIcon.name == "Start Speed Limit"){
                                    //speedLimit = parseInt(wp.waypointIcon.value)
                                    //Попытка найти какое ограничение скорости
                                    if (wp.notes && wp.notes.elements){
                                        /**@type {typeof rn2NoteElement} */
                                        let speedNote = wp.notes.elements.find(el=>el.name.toLowerCase().startsWith("speed limit"))
                                        let match = numRegex.exec(speedNote.name);
                                        let speed = parseInt(match[0]);
                                        if (isNaN(speed)){
                                            match = numRegex.exec(speedNote.gpx_tags);
                                            speed = parseInt(match[0]);
                                        }

                                        if (!isNaN(speed)){
                                            speedLimit = speed;
                                        }
                                    }
                                }

                                if (wp.waypointIcon.name == "Finish Speed Limit"){
                                    speedLimit = 0;
                                }
                            }

                            /**@type {typeof trackPoint} */
                            let p = {
                                lat: wp.lat,
                                lng: wp.lon,
                                text: i,
                                marker: null,
                                circle: null,
                                accepted: -1,
                                speedLimit: speedLimit,
                            }
                            outarr.push(p);
                            lastAddedPoint = wp;
                            i++;
                        }
                    }
                });

                if (lastAddedPoint!=waypoints[waypoints.length-1]){
                    const wp = waypoints[waypoints.length-1];
                    /**@type {typeof trackPoint} */
                    let p = {
                        lat: wp.lat,
                        lng: wp.lon,
                        text: i,
                        marker: null,
                        circle: null,
                        accepted: -1,
                        speedLimit: -1,
                    }
                    outarr.push(p);
                }

                rGlobal.trackLength = parseInt(trackKilometers);
                inputTrackLength.value = parseInt(trackKilometers)
                trackLoadedFileText.textContent = rawFile.name

                rGlobal.trackArray = outarr;
                rGlobal.buildTrack();

                rGlobal.map.fitBounds(rGlobal.featureTrack.getBounds());
            });
        }catch(e){
            Swal.fire({
                theme: 'bootstrap-5',
                title: 'Ошибка при загрузки трека из RN2 файла',
                icon: "error"
            });
        }
    });
}


inputTrack.addEventListener('change', e=>{
    let rawFile = Array.from(inputTrack.files)[0] ;

    if (rawFile){

        if (rawFile.name.toLowerCase().endsWith('.rn2')){
            loadTrackFromRN(rawFile);
            return;
        }

        helper.asyncRead(rawFile).then(readed=>{
            let gpx = new gpxParser()
            let parsed = gpx.parse(readed);

            const parser = new DOMParser();
            const doc = parser.parseFromString(readed, "application/xml");
            let tl = doc.querySelector('gpx').attributes.getNamedItem('trackLength')

            if (tl){
                rGlobal.trackLength = parseInt(tl.value);
                inputTrackLength.value = parseInt(tl.value)
            }

            let globalSpeedLimit = doc.querySelector('gpx').attributes.getNamedItem('globalSpeedLimit')
            if (globalSpeedLimit){
                rGlobal.globalSpeedLimit = parseInt(globalSpeedLimit.value);
                inputGlobalSpeedLimit.value = parseInt(globalSpeedLimit.value)
            }

            let timeSpeedStartFine = doc.querySelector('gpx').attributes.getNamedItem('timeSpeedStartFine')
            if (timeSpeedStartFine){
                rGlobal.timeSpeedStartFine = parseInt(timeSpeedStartFine.value);
                inputTimeSpeedStartFine.value = parseInt(timeSpeedStartFine.value)
            }

            let timeSpeedRepeatFine = doc.querySelector('gpx').attributes.getNamedItem('timeSpeedRepeatFine')
            if (timeSpeedRepeatFine){
                rGlobal.timeSpeedRepeatFine = parseInt(timeSpeedRepeatFine.value);
                inputTimeSpeedRepeatFine.value = parseInt(timeSpeedRepeatFine.value)
            }

            if (gpx.waypoints.length>1){
                trackLoadedFileText.textContent = rawFile.name

                const points = gpx.waypoints;

                let outarr = [];
                for (const point of points){
                    //console.log('point', point)
                    let speedLimit = -1;
                    if (point.extensions && point.extensions.speedLimit!==undefined){
                        speedLimit = parseInt(point.extensions.speedLimit)
                    }
                    /**@type {typeof trackPoint} */
                    let p = {
                        lat: point.lat,
                        lng: point.lon,
                        text: point.name,
                        marker: null,
                        circle: null,
                        accepted: -1,
                        speedLimit: speedLimit,
                    }
                    outarr.push(p);
                }

                rGlobal.trackArray = outarr;
                rGlobal.buildTrack();

                rGlobal.map.fitBounds(rGlobal.featureTrack.getBounds());
            }else{
                Swal.fire({
                    theme: 'bootstrap-5',
                    title: 'В загруженном файле нет waypoints',
                    icon: "error"
                });
            }


        }).catch(e=>{
            console.error('Error read file', e);
            rGlobal.toast.append("Ошибка чтения файла")
        })
        
    }
})

chkbDrawTrackLine.addEventListener('click', e=>{
    rGlobal.drawingTrackLine = !chkbDrawTrackLine.checked
    rGlobal.drawTrackLine(rGlobal.drawingTrackLine)
    localStorage.setItem('drawingTrackLine', rGlobal.drawingTrackLine)
})

let radiusChengeInterval = null;

inputTrackAcceptRadius.addEventListener('keyup', e=>{
    if (radiusChengeInterval) clearTimeout(radiusChengeInterval);

    radiusChengeInterval = setTimeout(e=>{
        radiusChengeInterval = null;
        let val = parseInt(inputTrackAcceptRadius.value);
        if (isNaN(val) || val===null || val===undefined){
            console.warn('Error - input is corrupted', val, inputTrackAcceptRadius.value)
            return;
        }
        rGlobal.acceptRadius = val
        localStorage.setItem('acceptRadius', rGlobal.acceptRadius)
        rGlobal.drawTrackLine()
        rGlobal.buildRace();
    }, 400)
})

inputGlobalSpeedLimit.addEventListener('change', e=>{
    rGlobal.globalSpeedLimit = parseInt(inputGlobalSpeedLimit.value)
    localStorage.setItem('globalSpeedLimit', rGlobal.globalSpeedLimit)
    rGlobal.buildRace();
})
inputTimeSpeedStartFine.addEventListener('change', e=>{
    rGlobal.timeSpeedStartFine = parseInt(inputTimeSpeedStartFine.value)
    localStorage.setItem('timeSpeedStartFine', rGlobal.timeSpeedStartFine)
    rGlobal.buildRace();
})
inputTimeSpeedRepeatFine.addEventListener('change', e=>{
    rGlobal.timeSpeedRepeatFine = parseInt(inputTimeSpeedRepeatFine.value)
    localStorage.setItem('timeSpeedRepeatFine', rGlobal.timeSpeedRepeatFine)
    rGlobal.buildRace();
})

inputTrackLength.addEventListener('change', e=>{
    rGlobal.trackLength = parseInt(inputTrackLength.value)
    rGlobal.buildRace();
})

//startTrimType
let startTrimTypeElements = document.querySelectorAll("input[name='startTrimType']")
startTrimTypeElements.forEach(elem=>{
    elem.addEventListener('change', e=>{
        rGlobal.startTrimType = document.querySelector("input[name='startTrimType']:checked").value
        localStorage.setItem('startTrimType', rGlobal.startTrimType)
    })
})
//endTrimType
/*let endTrimTypeElements = document.querySelectorAll("input[name='endTrimType']")
endTrimTypeElements.forEach(elem=>{
    elem.addEventListener('change', e=>{
        rGlobal.endTrimType = document.querySelector("input[name='endTrimType']:checked").value
        localStorage.setItem('endTrimType', rGlobal.endTrimType)
    })
})*/


const btnSaveTrackGpx = document.getElementById('btnSaveTrackGpx')
btnSaveTrackGpx.addEventListener('click', e=>{
    if (rGlobal.trackArray.length==0){
        Swal.fire({
            theme: 'bootstrap-5',
            title: 'Трек пустой',
            icon: "error"
        });
        return;
    }

    try{
        //gpxBuilder.BaseBuilder.MODELS.Point
        const { Point } = gpxBuilder.BaseBuilder.MODELS;

        let gpPoints = [];
        rGlobal.trackArray.forEach(tp=>{
            gpPoints.push(new Point(tp.lat, tp.lng,{
                extensions: {
                    speedLimit: tp.speedLimit
                },
                name: tp.text
            }))
        })

        let builder = new gpxBuilder.BaseBuilder()
        builder.setWayPoints(gpPoints)

        let obj = builder.toObject();
        /*obj.extensions['rlg'] = {
            'trackLength': rGlobal.trackLength
        }*/
        obj.attributes['trackLength'] = rGlobal.trackLength;
        obj.attributes['globalSpeedLimit'] = rGlobal.globalSpeedLimit;
        obj.attributes['timeSpeedStartFine'] = rGlobal.timeSpeedStartFine;
        obj.attributes['timeSpeedRepeatFine'] = rGlobal.timeSpeedRepeatFine;
        let xml = gpxBuilder.buildGPX(obj);

        helper.download(xml, `track-${moment().format("YYYY-MM-dd-HH:mm:ss")}.gpx`, "content/gpx")

        Swal.fire({
            theme: 'bootstrap-5',
            title: 'Трек сохранён',
            icon: "success"
        });
    }catch(e){
        Swal.fire({
            theme: 'bootstrap-5',
            title: 'Ошибка при сохранении трека',
            icon: "error"
        });
    }
})