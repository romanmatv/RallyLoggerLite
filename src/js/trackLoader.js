import rGlobal, {racePoint, trackPoint} from './rglobal';
//import { GPX } from 'leaflet-gpx';
import gpxParser from '../modules/GPXParser';
import helper from './helper';
import * as gpxBuilder from 'gpx-builder'
import moment from 'moment';

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


btnLoadTrack.addEventListener('click', e=>{
    inputTrack.value = "";
    inputTrack.click()
});


inputTrack.addEventListener('change', e=>{
    let rawFile = Array.from(inputTrack.files)[0] ;

    if (rawFile){

        helper.asyncRead(rawFile).then(readed=>{
            let gpx = new gpxParser()
            let parsed = gpx.parse(readed);

            const parser = new DOMParser();
            const doc = parser.parseFromString(readed, "application/xml");
            let tl = doc.querySelector('gpx').attributes.getNamedItem('trackLength')

            if (tl){
                rGlobal.trackLength = parseInt(tl.value);
                document.getElementById('inputTrackLength').value = parseInt(tl.value)
            }

            if (gpx.waypoints.length>1){
                trackLoadedFileText.textContent = rawFile.name
                rGlobal.trackGPX = gpx;

                const points = gpx.waypoints;

                let outarr = [];
                for (const point of points){
                    /**@type {typeof trackPoint} */
                    let p = {
                        lat: point.lat,
                        lng: point.lon,
                        text: point.name,
                        marker: null,
                        circle: null,
                        accepted: -1
                    }
                    outarr.push(p);
                }

                rGlobal.trackArray = outarr;
                rGlobal.buildTrack();

                rGlobal.map.fitBounds(rGlobal.featureTrack.getBounds());
            }else{
                rGlobal.toast.append("В загруженном файле нет waypoints")
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
        rGlobal.toast.append("Трек пустой")
        return;
    }
    //gpxBuilder.BaseBuilder.MODELS.Point
    const { Point } = gpxBuilder.BaseBuilder.MODELS;

    let gpPoints = [];
    rGlobal.trackArray.forEach(tp=>{
        gpPoints.push(new Point(tp.lat, tp.lng,{
            extensions: {},
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
    let xml = gpxBuilder.buildGPX(obj);

    helper.download(xml, `track-${moment().format("YYYY-MM-dd-HH:mm:ss")}.gpx`, "content/gpx")
})