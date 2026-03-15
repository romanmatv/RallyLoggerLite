//import gpxParser from 'gpxparser';
import helper from './helper';
import rGlobal, {racePoint, trackPoint} from './rglobal';
import gpxParser from '../modules/GPXParser';
import moment from 'moment';

const tagSpeed = "osmand:speed";

/**@type {HTMLInputElement} */
const inputRace = document.getElementById('inputRace')
const btnLoadRace = document.getElementById('btnLoadRace');
const raceLoadedFileText = document.getElementById('race-loaded-file-text')

raceLoadedFileText.textContent = "Ничего не загружено";

btnLoadRace.addEventListener('click', e=>{
    inputRace.value = "";
    inputRace.click()
});


inputRace.addEventListener('change', e=>{
    let rawFile = Array.from(inputRace.files)[0] ;

    if (rawFile){
        raceLoadedFileText.textContent = rawFile.name

        helper.asyncRead(rawFile).then(readed=>{
            let gpx = new gpxParser()
            gpx.parse(readed);

            rGlobal.raceGPX = gpx;

            //console.log('tracks:', gpx.tracks)

            const track = gpx.tracks[0];

            let raceArray = [];

            if (track){
                for (const point of track.points){
                    /**@type {typeof racePoint} */
                    let p = {
                        lat: point.lat,
                        lng: point.lon,
                        ele: point.ele | 0,
                        time: moment(point.time),
                        dist: 0,
                        speed: 0,
                        asmSpeed: 0,
                    };

                    let prew = raceArray[raceArray.length-1];
                    if (prew){
                        let curDist = helper.distance(p, prew)
                        p.dist = prew.dist + curDist


                        //let km = p.dist / 1000;
                        let time = Math.abs(p.time - prew.time) / 1000;
                        let speed = curDist / time;

                        if (curDist==0 || time==0){
                            p.speed = prew.speed;
                        }else{
                            p.speed = speed * 3.6;
                            if (isNaN(p.speed) || p.speed == Infinity) p.speed = 0
                        }
                    }

                    if (point.extensions && point.extensions[tagSpeed]){
                        p.asmSpeed = parseFloat(point.extensions[tagSpeed])
                    }
                    raceArray.push(p);
                }
            }else{
                rGlobal.toast.append('Пустой заезд')
            }

            //console.log('raceArray', raceArray)

            rGlobal.raceArray = raceArray;

            rGlobal.autoTrimRace();
            rGlobal.buildRace();
        }).catch(e=>{
            console.error('ERROR read', e)
            rGlobal.toast.append("Ошибка чтения файла")
        });
    }else{
        rGlobal.toast.append("Нет файла")
    }
});