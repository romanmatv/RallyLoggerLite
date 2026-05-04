import * as L from 'leaflet';
import * as bootstrap from 'bootstrap';
import teoToast from "./bootstrap.toast.init";
import GpxParser from 'gpxparser';
import Chart from 'chart.js/auto';
import * as ChartHelpers from 'chart.js/helpers';
import zoomPlugin from 'chartjs-plugin-zoom';
import draggableSelectRangePlugin from 'chartjs-plugin-draggable-selectrange';
import annotationPlugin from 'chartjs-plugin-annotation';
import 'chartjs-adapter-moment';
import moment from 'moment';
import helper from './helper';
import Swal from 'sweetalert2';
//import ChartJSEnhancements from '../modules/chartjs-plugin-zoom-pan-select';

//let enhancer = new ChartJSEnhancements(chartjs_object);

let speedFinesMap = new Map();

let distFormat = new Intl.NumberFormat('ru-ru', {
    'maximumFractionDigits': 0,
    minimumIntegerDigits: 5
});

const iconSize = 24;
let startIcon = L.icon({
    iconUrl: '../compiled/images/src/images/start.png',
    iconSize: [iconSize,iconSize],
    iconAnchor: [iconSize/2, iconSize/2],
})
let finishIcon = L.icon({
    iconUrl: '../compiled/images/src/images/flag.png',
    iconSize: [iconSize,iconSize],
    iconAnchor: [iconSize/2, iconSize/2],
})

moment.locale('ru');

const raceGraphCtx = document.getElementById('raceGraph').getContext('2d')
Chart.register(zoomPlugin);
Chart.register(draggableSelectRangePlugin);
//Chart.register(ChartDataLabels);
Chart.register(annotationPlugin);

/**@type {[import('moment').Moment, import('moment').Moment]} */
let selectedRange = null;

function getRacePointByDataX(dataX){
    /**@type {typeof racePoint} */
    let point = null;
    if (rGlobal.raceArray.length>0){
        let hoverTime = moment(dataX);
        if (hoverTime>=rGlobal.raceArray[0].time && hoverTime<=rGlobal.raceArray[rGlobal.raceArray.length-1].time){
            for (let i=0; i<rGlobal.raceArray.length; i++){
                if (rGlobal.raceArray[i].time>hoverTime){
                    if (i==0){
                        point = rGlobal.raceArray[i];
                        break;
                    }
                    if ((rGlobal.raceArray[i].time-hoverTime)<(hoverTime-rGlobal.raceArray[i-1].time)){
                        point = rGlobal.raceArray[i]
                        break;
                    }else{
                        point = rGlobal.raceArray[i-1]
                        break;
                    }
                }
            }
        }
    }
    return point;
}

/**@type {typeof trackPoint} */
let contextPoint = null;

let dblClickGraphCounter = 0;
/**@type {Chart.ChartOptions} */
let graphConfig = {
    type: 'line',
    locale: "ru-RU",
    data: {
        labels: [],
        datasets: [{
            label: "Скорость",
            data: [],
            fill: true,
            tension: 0,
            fill: true,
            pointStyle: 'circle',
            pointRadius: 3,
            //parsing: false,
            
        }]
    },
    options: {
        //color: "white",
        //borderColor: "white",
        //radius: 0,
        //indexAxis: 'x',
        onHover: (e)=>{
            const canvasPosition = ChartHelpers.getRelativePosition(e, e.chart);

            // Substitute the appropriate scale IDs
            const dataX = e.chart.scales.x.getValueForPixel(canvasPosition.x);
            //const dataY = e.chart.scales.y.getValueForPixel(canvasPosition.y);
            //let labelX = rGlobal.raceGraph.scales.x.getLabelForValue(dataX)

            //console.log('x', dataX, labelX)

            if (rGlobal.raceArray.length>0){
                //let hoverTime = moment(dataX);
                /**@type {typeof racePoint} */
                let point = getRacePointByDataX(dataX)

                if (point){
                    if (rGlobal.hoverMarker){
                        rGlobal.hoverMarker.setLatLng(point);
                    }else{
                        rGlobal.hoverMarker = L.circleMarker(point, {
                            radius: 6,
                            color: "#8B008B"
                        });
                    }
                    rGlobal.hoverMarker.addTo(rGlobal.map);
                }else{
                    if (rGlobal.hoverMarker) rGlobal.hoverMarker.remove();
                }
            }else{
                if (rGlobal.hoverMarker) rGlobal.hoverMarker.remove();
            }
        },
        onClick: (e)=>{
            dblClickGraphCounter++;
            if (dblClickGraphCounter>1){
                dblClickGraphCounter = 0;
                //isDoubleClick
                const canvasPosition = ChartHelpers.getRelativePosition(e, e.chart);

                // Substitute the appropriate scale IDs
                const dataX = e.chart.scales.x.getValueForPixel(canvasPosition.x);

                let point = getRacePointByDataX(dataX)

                if (point){
                    rGlobal.map.setView(point, 16);
                }
            }
            setTimeout(e=>{
                dblClickGraphCounter = 0;
            }, 250)
        },
        interaction: {
            //intersect: true,
            //includeInvisible: false,
            mode: 'index',
            intersect: false,
        },
        scales: {
            x: {
                type: "time",
                time: {
                    tooltipFormat: 'HH:mm:ss',
                    displayFormat: "HH:mm:ss",
                    displayFormats: {
                        quarter: 'HH:mm',
                        day: "HH:mm",
                        hour: "HH:mm",
                        minute: "HH:mm",
                        second: "HH:mm:ss",
                        millisecond: "HH:mm:ss.zzz",
                    }
                },
                title: {
                    display: true,
                    text: "Время",
                    //tooltipFormat: "HH:mm"
                }
            },
            y: {
                title: {
                    display: true,
                    text: 'Скорость'
                },
                grid: {
                    display: true,
                    drawOnChartArea: true,
                    drawTicks: true,
                    color: '#ffffffbb',
                    tickColor: 'white'
                },
                ticks: {
                    display: true,
                }
            },
        },
        plugins: {
            zoom: {
                pan: {
                    // pan options and/or events
                    enabled: true,
                    threshold: 1,
                    mode: 'x',
                    modifierKey: 'shift',
                    onPan: (e)=>{
                        if (selectedRange){
                            draggableSelectRangePlugin.clearDraw(rGlobal.raceGraph)
                            selectedRange = null;
                            calcResultsForBound();
                        }
                    }
                },
                limits: {
                    // axis limits
                },
                zoom: {
                    // zoom options and/or events
                    wheel: {
                        enabled: true,
                    },
                    pinch: {
                        enabled: false,
                    },
                    drag:{
                        enabled: false,
                    },
                    mode: 'x',
                    onZoom: (e)=>{
                        if (selectedRange){
                            draggableSelectRangePlugin.clearDraw(rGlobal.raceGraph)
                            selectedRange = null;
                            calcResultsForBound();
                        }
                    }
                },
                wheel: {
                    enabled: true,
                }
            },
            annotation: {
                annotations: {}
            },
            legend: {
                display: false,
            },
            /*decimation: {
                enabled: false,
                algorithm: 'lttb',
                samples: 30,
                //threshold: 30
            },*/
            draggableSelectRange: {
                enable: true,
                modifierKey: "ctrl",
                    
                text:
                {
                    enable: true,
                    
                    //offset: -15,
                    //padding: 1
                },
                onSelect: (event)=>{
                    selectedRange = [
                        moment(event.range[0]),
                        moment(event.range[1])
                    ];
                    calcResultsForBound(event.range[0], event.range[1])
                }
            },
            tooltip: {
                callbacks: {
                    footer: (tooltipItems) => {
                        /*let sum = 0;

                        tooltipItems.forEach(function(tooltipItem) {
                            sum += tooltipItem.parsed.y;
                        });*/
                        let time = moment(tooltipItems[0].parsed.x);
                        /**@type {typeof racePoint} */
                        let point = null;
                        //console.log('tooltipItems', tooltipItems)
                        for (const p of rGlobal.raceArray){
                            if (time<=p.time){
                                point = p;
                                break;
                            }
                        }
                        if (point){
                            let footer = `Высота: ${point.ele.toFixed(2)} м`;
                            footer += `\r\nДистанция: ${distFormat.format(point.dist)} м`;
                            //footer += `\r\nosmSpeed: ${point.asmSpeed} км/ч`;
                            //footer += `\r\n`;

                            return footer;
                        }
                        return '';
                    },
                }
            },
        }
    },
    plugins: []
};

export const trackPoint = {
    /**@type {number} */
    lat: null,
    /**@type {number} */
    lng: null,
    text: "",
    /**@type {L.Marker} */
    marker: null,
    /**@type {L.Circle} */
    circle: null,
    /**
     * -1 = не назначено
     * 0 = не взято
     * 1 = взято
     */
    accepted: -1,
    /**
     * -1 = по умолчанию, следовать последнему ограничению
     * 0 = сбросить ограничение до глобального
     * >1 = установить начало локального ограничения
     */
    speedLimit: -1,
}

export const racePoint = {
    lat: 0,
    lng: 0,
    ele: 0,
    /**@type {import('moment').Moment} */
    time: 0,
    dist: 0,
    speed: 0,
    asmSpeed: 0,
}

/**
 * 
 * @param {import('moment').Moment} from 
 * @param {import('moment').Moment} to 
 */
function calcResultsForBound(from, to){
    //console.log('calcResultsForBound: from:',from,'; to:',to)
    const tdSelectRaceStart = document.getElementById('tdSelectRaceStart')
    const tdSelectRaceEnd = document.getElementById('tdSelectRaceEnd')
    const tdSelectRaceTime = document.getElementById('tdSelectRaceTime')
    const tdSelectRaceMaxSpeed = document.getElementById('tdSelectRaceMaxSpeed')
    const tdSelectRaceAvgSpeed = document.getElementById('tdSelectRaceAvgSpeed')
    const tdSelectRaceGoAvgSpeed = document.getElementById('tdSelectRaceGoAvgSpeed')
    const tdSelectRaceDist = document.getElementById('tdSelectRaceDist')

    tdSelectRaceTime.textContent = 'n/a'

    tdSelectRaceStart.textContent = 'n/a'
    tdSelectRaceEnd.textContent = 'n/a'

    tdSelectRaceMaxSpeed.textContent = 'n/a'
    tdSelectRaceAvgSpeed.textContent = 'n/a'
    tdSelectRaceGoAvgSpeed.textContent = 'n/a'
    tdSelectRaceDist.textContent = 'n/a'

    if (rGlobal.selectLineRace) rGlobal.selectLineRace.remove();

    btnResetGraphSelect.setAttribute('disabled', 'disabled')
    btnDeleteSelect.setAttribute('disabled', 'disabled')
    btnSetOnlySelect.setAttribute('disabled', 'disabled')

    if (!from || !to){
        selectedRange = null;
        return;
    }

    //from = moment(from)
    //to = moment(to)
    if (!from.isValid){
        from = moment(from)
    }
    if ( !to.isValid){
        to = moment(to)
    }

    if (rGlobal.raceArray.length<2 || from == to || !from || !to || !from.isValid() || !to.isValid()){
        selectedRange = null;
        return;
    }

    btnResetGraphSelect.removeAttribute('disabled')
    btnDeleteSelect.removeAttribute('disabled')
    btnSetOnlySelect.removeAttribute('disabled')

    let line = L.polyline([], {
        color: "red",
        weight: 5
    })

    let maxSpeed = 0;
    let avgSpeed = 0;
    let goAvgSpeeds = 0;
    let counts = 0;
    let distFrom = null;
    let distTo = null;

    for (let i=0; i<rGlobal.raceArray.length; i++){
        const rp = rGlobal.raceArray[i];
        if (rp.time>to) break;
        if (rp.time>=from){
            counts++;
            if (rp.speed>0){
                if (rp.speed>maxSpeed) maxSpeed = rp.speed;
                avgSpeed += rp.speed;
                goAvgSpeeds++;
            }
            line.addLatLng(rp);

            if (distFrom===null){
                distFrom = rp.dist;
            }
            distTo = rp.dist;
        }
    }

    console.log('distFrom:',distFrom, 'distTo:',distTo)
    let dist = distTo - distFrom;
    console.log('dist:', dist)

    rGlobal.selectLineRace = line;
    line.addTo(rGlobal.map);

    let raceTime = Math.abs(from.diff(to))
    tdSelectRaceTime.textContent = `${moment(raceTime).utc().format('HH:mm:ss')}`

    tdSelectRaceStart.textContent = from.format("HH:mm:ss")
    tdSelectRaceEnd.textContent = to.format("HH:mm:ss")

    tdSelectRaceMaxSpeed.textContent = maxSpeed.toFixed(1)
    tdSelectRaceAvgSpeed.textContent = (avgSpeed/counts).toFixed(1)
    tdSelectRaceGoAvgSpeed.textContent = (avgSpeed/goAvgSpeeds).toFixed(1)
    tdSelectRaceDist.textContent = (dist/1000).toFixed(2)
}

/**
 * 
 * @param {{accepted: -1, index: number, text: string, speedLimit: number}} options 
 */
function getMarkerIcon(options = {}){
    let dClass = ["","error","accepted"];
    let acc = options&&options.accepted!=undefined?options.accepted:-1;
    let dz = options&&options.speedLimit!=undefined?options.speedLimit:-1;
    let dzText = "";
    if (dz>0){
        dzText = ` <span class='speed'>DZ: ${dz}</span>`;
    }
    if (dz==0){
        dzText = " <span class='speed speed-end'>FZ</span>";
    }
    let myIcon = L.divIcon({
    className: 'my-div-icon',
    iconSize: null,
    html: '<div class="my-div-icon-wrap">'
        + '<div class="my-div-icon-number '+dClass[acc+1]+'">i'+ (options?.index|"") +'</div>'
        + '<div class="my-div-icon-label">'+ (options&&options.text?options.text:"") + dzText + '</div>'
        + '</div>'
    });
    return myIcon;
}

/**
 * 
 * @param {boolean} draw рисовать ли линию
 */
function drawTrackLine(draw = true){
    if (rGlobal.featureTrack && rGlobal.trackArray){
        if (draw){
            //нарисовать линию
            if (rGlobal.lineTrack){
                rGlobal.lineTrack.setLatLngs(rGlobal.trackArray)
            }else{
                rGlobal.lineTrack = L.polyline(rGlobal.trackArray, {
                    opacity: 0.8,
                    dashArray: "4"
                }).addTo(rGlobal.map);
            }
        }else{
            if (rGlobal.lineTrack) rGlobal.lineTrack.remove()
        }
    }
}

/**
 * Функция билда трека на карте
 */
function buildTrack(){
    if (rGlobal.trackArray.length>0){
        const points = rGlobal.trackArray

        if (rGlobal.featureTrack){
            rGlobal.featureTrack.remove()
            rGlobal.featureTrack = null;
        }

        const fg = L.featureGroup();

        let i=1;
        for (const point of points){
            point.accepted = -1;

            /*if (i==3){
                point.speedLimit = 30;
            }
            if (i==4){
                point.speedLimit = 0;
            }*/

            if (point.circle){
                point.circle.remove()
            }
            point.circle = L.circle(point, {radius: rGlobal.acceptRadius})
            fg.addLayer(point.circle);

            if (point.marker){
                point.marker.remove()
            }
            point.marker = L.marker(point, {
                icon: getMarkerIcon({accepted: point.accepted, index: i , text: point.text, speedLimit: point.speedLimit}),
                draggable: true
            })
            fg.addLayer(point.marker);

            point.marker.on('dragend', e=>{
                point.lat = point.marker.getLatLng().lat;
                point.lng = point.marker.getLatLng().lng;

                point.circle.setLatLng(point.marker.getLatLng())

                if (rGlobal.drawingTrackLine){
                    drawTrackLine(rGlobal.drawingTrackLine);
                }

                buildRace();
            })

            point.marker.on('contextmenu', e=>{
                contextPoint = point;
                window.electronAPI.markerContextMenu()
            })

            i++;
        }

        rGlobal.featureTrack = fg;

        rGlobal.featureTrack.addTo(rGlobal.map);

        drawTrackLine(rGlobal.drawingTrackLine);

        //autoTrimRace();
        buildRace();
    }else{
        rGlobal.toast.append("Нет трека")
    }
}

function recalcDist(){
    for (let i=0; i<rGlobal.raceArray.length; i++){
        let p = rGlobal.raceArray[i];
        let prew = rGlobal.raceArray[i-1];
        if (prew){
            let curDist = helper.distance(p, prew)
            p.dist = prew.dist + curDist
        }else{
            p.dist = 0;
        }
    }
}

/**
 * Функция билда заезда на карте
 * Построение общей статистики и графика скорости
 */
function buildRace(){
    ////Обновление данных графика
    //graph.data.labels = labels;
    //graph.data.datasets[0].data = speeds;
    //graph.data.datasets[1].data = elevetions;
    //graph.update();

    if (rGlobal.raceArray.length>0){
        if (rGlobal.lineRace){
            rGlobal.lineRace.setLatLngs(rGlobal.raceArray);
        }else{
            rGlobal.lineRace = L.polyline(rGlobal.raceArray, {
                color: "blueviolet"
            })
        }
        rGlobal.lineRace.addTo(rGlobal.map);

        if (rGlobal.startRaceMarker){
            rGlobal.startRaceMarker.setLatLng(rGlobal.raceArray[0])
        }else{
            rGlobal.startRaceMarker = L.marker(rGlobal.raceArray[0], {icon: startIcon})
        }
        rGlobal.startRaceMarker.addTo(rGlobal.map);

        if (rGlobal.finishRaceMarker){
            rGlobal.finishRaceMarker.setLatLng(rGlobal.raceArray[rGlobal.raceArray.length-1])
        }else{
            rGlobal.finishRaceMarker = L.marker(rGlobal.raceArray[rGlobal.raceArray.length-1], {icon: finishIcon})
        }
        rGlobal.finishRaceMarker.addTo(rGlobal.map);

        checkRaceOnTrack();
    }else{
        if (rGlobal.lineRace) rGlobal.lineRace.remove();
        if (rGlobal.startRaceMarker) rGlobal.startRaceMarker.remove();
        if (rGlobal.finishRaceMarker) rGlobal.finishRaceMarker.remove();
    }

    rGlobal.raceGraph.data.labels = rGlobal.raceArray.map(e=>{return moment(e.time)})
    rGlobal.raceGraph.data.datasets[0].data = rGlobal.raceArray.map(e=>{return e.speed});
    rGlobal.raceGraph.data.datasets[0].borderColor = (ctx)=>{
        try{
            if (ctx?.parsed?.x && speedFinesMap.has(ctx?.parsed?.x)){
                return "#FE3535"
            }else{
                return "#3566FE"
            }
        }catch(e){  
            return "#3566FE"
        }
    };
    rGlobal.raceGraph.update()
}

/**
 * Функция автоподрезки заезда (выделает точки, которые стоит удалить)
 */
function autoTrimRace(){
    console.log('START TRIM')
    let start = 0;
    let end = rGlobal.raceArray.length - 1;
    //let prewPoint = rGlobal.raceArray[0]

    const firstRadius = rGlobal.acceptRadius - (rGlobal.acceptRadius/2)
    //console.log('firstRadius',firstRadius, 'rGlobal.acceptRadius', rGlobal.acceptRadius)
    for (let i=0; i<rGlobal.raceArray.length; i++){
        if (rGlobal.startTrimType=="speed"){
            if (rGlobal.raceArray[i].speed>10){
                start = i;
                break;
            }
        } else if (rGlobal.startTrimType=="radius"){
            const dist = helper.distance(rGlobal.raceArray[i], rGlobal.trackArray[0])
            if (dist>=firstRadius){
                start = i;
                break;
            }
        }
        //prewPoint = rGlobal.raceArray[i];
    }

    const lastPoint = rGlobal.trackArray[rGlobal.trackArray.length-1]
    if (lastPoint){
        let minDist = helper.distance(rGlobal.raceArray[rGlobal.raceArray.length-1], lastPoint);
        for (let i=rGlobal.raceArray.length-1; i>rGlobal.raceArray.length/2; i--){
            const dist = helper.distance(rGlobal.raceArray[i], lastPoint)

            //console.log(rGlobal.raceArray[i].time.format("HH:mm:ss"), 'i', i,'dist',dist, 'minDist', minDist)

            if (dist<minDist){
                console.log('setMinDist')
                minDist = dist;
                end = i+1;
            }
            if (dist>rGlobal.acceptRadius && minDist<rGlobal.acceptRadius){
                break;
            }
        }

        if (end<10){
            end = rGlobal.raceArray.length - 1;
        }
    }

    console.log('rGlobal.startTrimType', rGlobal.startTrimType)
    console.log('start:',start,', end:',end)
    console.log('split start', rGlobal.raceArray.slice(0, start))
    console.log('split end', rGlobal.raceArray.slice(end, rGlobal.raceArray.length-1))

    rGlobal.raceArray = rGlobal.raceArray.slice(start, end);

    console.log('END TRIM')

    recalcDist();
}

/**
 * Функция установки одного типа взятия на все маркеры
 * @param {-1|0|1} acc 
 */
function setAllMarkersAccepted(acc){
    for (let j=0; j<rGlobal.trackArray.length; j++){
        let tp = rGlobal.trackArray[j];
        tp.accepted = acc
        tp.marker.setIcon(getMarkerIcon({accepted: tp.accepted, index: j+1 , text: tp.text, speedLimit: tp.speedLimit}))
    }
}

/**
 * Функция проверки точек Трассы и Заезда
 * Заезд должен пройти по каждой токе Трассы
 * Если точка пропущена, то закрасить ее красным, если задета - зеленым
 */
function checkRaceOnTrack(){

    const tdRaceTime = document.getElementById('tdRaceTime')
    const tdRaceMaxSpeed = document.getElementById('tdRaceMaxSpeed')
    const tdRaceAvgSpeed = document.getElementById('tdRaceAvgSpeed')
    const tdRaceGoAvgSpeed = document.getElementById('tdRaceGoAvgSpeed')
    const tdRaceStart = document.getElementById('tdRaceStart')
    const tdRaceEnd = document.getElementById('tdRaceEnd')

    const spnFinesSpeed = document.getElementById('spnFinesSpeed')
    const spnFinesPoints = document.getElementById('spnFinesPoints')

    const tdRaceDist = document.getElementById('tdRaceDist')
    const tdSelectRaceDist = document.getElementById('tdSelectRaceDist')

    rGlobal.overSpeedLineRaces.forEach(line=>{
        line.remove();
    });
    rGlobal.overSpeedLineRaces = [];

    if (rGlobal.raceArray.length==0){
        setAllMarkersAccepted(-1);

        let na = `n/a`;
        tdRaceTime.textContent = na

        tdRaceStart.textContent = na
        tdRaceEnd.textContent = na

        tdRaceMaxSpeed.textContent = na
        tdRaceAvgSpeed.textContent = na
        tdRaceGoAvgSpeed.textContent = na

        tdRaceDist.textContent = na;
        tdSelectRaceDist.textContent = na;

        return
    }
    setAllMarkersAccepted(0);

    let maxSpeed = 0;
    let avgSpeed = 0;
    let goAvgSpeeds = 0;

    rGlobal.raceGraph.config.options.plugins.annotation.annotations = {};

    let currentSpeedLimit = rGlobal.globalSpeedLimit;
    let overSpeedStart = 0;
    let overSpeedEnd = 0;
    let maxOverSpeed = 0;
    /**@type {typeof racePoint?} */
    let overSpeedPointStart = null;
    /**@type {typeof racePoint?} */
    let overSpeedPointEnd = null;

    let overSpeedFines = 0;
    let overPointFines = 0;

    /**@type {typeof racePoint[]} */
    let overSpeedPoints = [];

    speedFinesMap.clear();
    let speedTimes = [];
    for (let i=0; i<rGlobal.raceArray.length; i++){
        const rp = rGlobal.raceArray[i];
        //getMarkerIcon({accepted: point.accepted, index: i , text: point.text})

        if (rp.speed>0){
            if (rp.speed>maxSpeed) maxSpeed = rp.speed;
            avgSpeed += rp.speed;
            //goAvgSpeed += rp.speed;
            goAvgSpeeds++;
        }

        for (let j=0; j<rGlobal.trackArray.length; j++){
            const tp = rGlobal.trackArray[j];
            const metres = helper.distance(rp, tp);
            if (metres<=rGlobal.acceptRadius){
                if (tp.accepted!=1){
                    tp.accepted = 1;
                    tp.marker.setIcon(getMarkerIcon({accepted: tp.accepted, index: j+1 , text: tp.text, speedLimit: tp.speedLimit}))
                }                    

                if (rGlobal.raceGraph.config.options.plugins.annotation.annotations[`point_${j}`]===undefined || 
                    rGlobal.raceGraph.config.options.plugins.annotation.annotations[`point_${j}`].dist>metres
                ){
                    rGlobal.raceGraph.config.options.plugins.annotation.annotations[`point_${j}`] =
                    {
                        type: 'line',
                        xMin: rp.time,
                        xMax: rp.time,
                        borderColor: 'rgb(255, 99, 132)',
                        borderWidth: 2,
                        dist: metres,
                        label: {
                            content: tp.text,
                            display: true,
                            rotation: -90
                        }
                    }
                }

                if (tp.speedLimit>0){
                    currentSpeedLimit = tp.speedLimit;
                }
                if (tp.speedLimit==0){
                    currentSpeedLimit = rGlobal.globalSpeedLimit;
                }
            }
        }

        if (rp.speed>currentSpeedLimit && overSpeedStart===0){
            overSpeedStart = rp.time;
            overSpeedPointStart = rp;
        }
        if (overSpeedStart!==0 && overSpeedEnd===0){
            speedTimes.push(rp.time.unix()*1000)
            if (rp.speed>maxOverSpeed) maxOverSpeed = rp.speed;
            overSpeedPoints.push(rp);
        }
        if (overSpeedStart!==0 && rp.speed<=currentSpeedLimit){
            overSpeedEnd = rp.time;
            overSpeedPointEnd = rp;
        }

        if (overSpeedStart!==0 && overSpeedEnd!==0){
            //Промежуток нарушения кончился, считаем
            let time = (overSpeedEnd - overSpeedStart) / 1000;
            if (time>rGlobal.timeSpeedStartFine){
                time = (time-rGlobal.timeSpeedStartFine)
                let fines = 1;
                if (time>rGlobal.timeSpeedRepeatFine){
                    fines = Math.round(Math.abs(time/rGlobal.timeSpeedRepeatFine));
                }

                overSpeedFines += fines;

                let line = L.polyline(overSpeedPoints, {
                    color: 'red',
                    weight: 4.5,
                    dashArray: "4 1"
                });
                let fineTooltip = L.popup({
                    content: `Штрафных санкций: ${fines}<br>
                    Время превышения: ${moment((overSpeedEnd - overSpeedStart)).utc().format('mm:ss')}<br>
                    Максимальная скорость: ${maxOverSpeed.toFixed(1)} км/ч`
                })
                line.bindPopup(fineTooltip);
                line.addTo(rGlobal.map);
                rGlobal.overSpeedLineRaces.push(line);

                speedTimes.forEach(t=>{
                    speedFinesMap.set(t, 1)
                });
            }
            overSpeedStart = 0;
            overSpeedEnd = 0;
            speedTimes = [];
            maxOverSpeed = 0;
            overSpeedPoints = [];
        }
    }

    overPointFines =rGlobal.trackArray.filter(tp=>tp.accepted==0).length;

    let raceTime = Math.abs(moment(rGlobal.raceArray[0].time).diff(rGlobal.raceArray[rGlobal.raceArray.length-1].time))
    tdRaceTime.textContent = `${moment(raceTime).utc().format('HH:mm:ss')}`

    tdRaceStart.textContent = moment(rGlobal.raceArray[0].time).format("HH:mm:ss")
    tdRaceEnd.textContent = moment(rGlobal.raceArray[rGlobal.raceArray.length-1].time).format("HH:mm:ss")

    tdRaceMaxSpeed.textContent = maxSpeed.toFixed(1)
    tdRaceAvgSpeed.textContent = (avgSpeed/rGlobal.raceArray.length).toFixed(1)
    tdRaceGoAvgSpeed.textContent = (avgSpeed/goAvgSpeeds).toFixed(1)

    spnFinesSpeed.textContent = overSpeedFines.toFixed(0);
    spnFinesPoints.textContent = overPointFines.toFixed(0);

    let dist = rGlobal.raceArray[rGlobal.raceArray.length-1].dist;
    if (rGlobal.trackLength>100){
        let toProc = 100 / rGlobal.trackLength;

        let proc = toProc * dist;
        let delt = proc - 100;

        tdRaceDist.textContent = `${(rGlobal.trackLength/1000).toFixed(2)} / ${(dist/1000).toFixed(2)} (${delt>=0?("+"+delt.toFixed(2)):delt.toFixed(2)} %)`;
    }else{
        tdRaceDist.textContent = (dist/1000).toFixed(2);
    }
}

export const rGlobal = {
    /**@type {L.Map} */
    map: null,
    defaultGeo: [42.86412, 74.605404],

    toast: new teoToast(),

    /**Радиус взятия точки, м */
    acceptRadius: 100,

    /**Эталонная дистанция трека, м */
    trackLength: 0,

    /**Глобальное ограничение скорости */
    globalSpeedLimit: 65,
    /**Время в сек. начала отсчета штрафа */
    timeSpeedStartFine: 2,
    /**Время в сек. повторного штрафа непрерывного превышения */
    timeSpeedRepeatFine: 20,

    drawingTrackLine: true,

    /**@type {Array<typeof trackPoint>} */
    trackArray: [],
    /**@type {Array<typeof racePoint>} */
    raceArray: [],

    /**@type {GpxParser} */
    raceGPX: null,

    /**@type {"speed"|"radius"} */
    startTrimType: "speed",
    /**@ type {"radius"|"center"} */
    //endTrimType: "radius",

    /**@type {L.FeatureGroup} */
    featureTrack: null,
    /**@type {L.Polyline} */
    lineTrack: null,
    /**@type {L.Polyline} */
    lineRace: null,
    /**@type {L.Marker} */
    startRaceMarker: null,
    /**@type {L.Marker} */
    finishRaceMarker: null,
    /**@type {L.Polyline} */
    selectLineRace: null,
    /**@type {Array<L.Polyline>} */
    overSpeedLineRaces: [],
    /**@type {L.CircleMarker} */
    hoverMarker: null,

    raceGraph: new Chart(raceGraphCtx, graphConfig),
    /**@type {ChartJSEnhancements} */
    raceGraphZoomPanSelect: null,

    buildTrack: buildTrack,
    buildRace: buildRace,
    autoTrimRace: autoTrimRace,
    checkRaceOnTrack: checkRaceOnTrack,
    drawTrackLine: drawTrackLine,
};



///READ SETTINGS
if (localStorage.getItem('acceptRadius')){
    rGlobal.acceptRadius = parseInt(localStorage.getItem('acceptRadius'));
}
if (localStorage.getItem('globalSpeedLimit')){
    rGlobal.globalSpeedLimit = parseInt(localStorage.getItem('globalSpeedLimit'));
}
if (localStorage.getItem('timeSpeedStartFine')){
    rGlobal.timeSpeedStartFine = parseInt(localStorage.getItem('timeSpeedStartFine'));
}
if (localStorage.getItem('timeSpeedRepeatFine')){
    rGlobal.timeSpeedRepeatFine = parseInt(localStorage.getItem('timeSpeedRepeatFine'));
}

if (localStorage.getItem('startTrimType')){
    rGlobal.startTrimType = localStorage.getItem("startTrimType")

    document.querySelector(`input[name='startTrimType'][value='${rGlobal.startTrimType}']`).checked = true
}

/*if (localStorage.getItem('endTrimType')){
    rGlobal.endTrimType = localStorage.getItem("endTrimType")

    document.querySelector(`input[name='endTrimType'][value='${rGlobal.endTrimType}']`).checked = true
}*/

if (localStorage.getItem("drawingTrackLine")!==null){
    rGlobal.drawingTrackLine = localStorage.getItem("drawingTrackLine")=="true";
}

/*rGlobal.raceGraph.canvas.addEventListener('mousedown', e=>{
    //console.log('mousedown', e, e.buttons, e.ctrlKey);
    let toSelect = e.ctrlKey;
    rGlobal.raceGraph.config.options.plugins.zoom.pan.enabled = !toSelect
})*/

rGlobal.raceGraph.canvas.addEventListener('dblclick', e=>{
    draggableSelectRangePlugin.clearDraw(rGlobal.raceGraph)
    selectedRange = null;
    calcResultsForBound();
})

const btnResetGraphSelect = document.getElementById('btnResetGraphSelect')
btnResetGraphSelect.addEventListener('click', e=>{
    draggableSelectRangePlugin.clearDraw(rGlobal.raceGraph)
    selectedRange = null;
    calcResultsForBound();
})


document.addEventListener('insertMarkerBefore', e=>{
    if (contextPoint){
        let index = rGlobal.trackArray.indexOf(contextPoint);
        if (index>=0){
            /**@type {typeof trackPoint} */
            let np = {}

            let prewPoint = rGlobal.trackArray[index-1];
            if (prewPoint===undefined) prewPoint = rGlobal.trackArray[rGlobal.trackArray.length-1];

            let nnll = helper.getAverPoint(contextPoint, prewPoint)
            np.lat = nnll.lat;
            np.lng = nnll.lng;
            np.accepted = -1;
            np.text = `${contextPoint.text}-1`;

            //rGlobal.trackArray;
            rGlobal.trackArray.splice(index, 0, np);

            buildTrack();
        }
    }
})
document.addEventListener('insertMarkerAfter', e=>{
    if (contextPoint){
        let index = rGlobal.trackArray.indexOf(contextPoint);
        if (index>=0){
            /**@type {typeof trackPoint} */
            let np = {}

            let prewPoint = rGlobal.trackArray[index+1];
            if (prewPoint===undefined) prewPoint = rGlobal.trackArray[0];

            let nnll = helper.getAverPoint(contextPoint, prewPoint)
            np.lat = nnll.lat;
            np.lng = nnll.lng;
            np.accepted = -1;
            np.text = `${contextPoint.text}-1`;

            //rGlobal.trackArray;
            rGlobal.trackArray.splice(index+1, 0, np);

            buildTrack();
        }
    }
})

document.addEventListener('setSpeedLimit', e=>{
    if (contextPoint){
        Swal.fire({
            theme: 'bootstrap-5',
            title: 'Скоростное ограничение',
            input: 'number',
            inputLabel: '-1 - ничего не делать (используется последнее значение).\r\n0 - сбросить ограничение до глобального.',
            inputValue: contextPoint.speedLimit,
            showCancelButton: true,
            cancelButtonText: 'Отмена',
            inputValidator: (value) => {
                if (value === '') {
                    return 'Пожалуйста, введите значение';
                }
                if (isNaN(value) || parseInt(value)<-1) {
                    return 'Пожалуйста, введите число больше или равное -1';
                }
                return null;
            }
        }).then((result) => {
            if (result.isConfirmed) {
                let speed = parseInt(result.value);
                if (isNaN(speed) || speed<0) speed = -1;
                contextPoint.speedLimit = parseInt(speed);
                buildTrack();
            }
        });
    }
})

document.addEventListener('deleteMarker', e=>{
    if (contextPoint){
        let index = rGlobal.trackArray.indexOf(contextPoint);
        if (index>=0){
            rGlobal.trackArray.splice(index, 1);
            buildTrack();
        }
    }
})

const btnDeleteSelect = document.getElementById('btnDeleteSelect');
const btnSetOnlySelect = document.getElementById('btnSetOnlySelect')
//recalcDist();

function getStartEndRange(){
    let start = -1;
    let end = -1;

    if (selectedRange){
        for (let i=0; i<rGlobal.raceArray.length; i++){
            let p = rGlobal.raceArray[i];
            if (start==-1 && p.time>=selectedRange[0]){
                start = i;
            }
            if (end==-1 && p.time==selectedRange[1]){
                end = i;
            }
            if (end==-1 && p.time>selectedRange[1]){
                end = i-1;
            }

            if (start!=-1 && end!=-1){
                break;
            }
        }
    }

    return {
        start: start,
        end: end
    }
}

//Удалить выбранные элементы
btnDeleteSelect.addEventListener('click', e=>{
    let {start, end} = getStartEndRange();

    rGlobal.raceArray.splice(start, end-start+1);

    recalcDist();
    buildRace();

    draggableSelectRangePlugin.clearDraw(rGlobal.raceGraph)
    selectedRange = null;
    calcResultsForBound();

    rGlobal.raceGraph.resetZoom();
})

//Оставить только выбранное, подойдет функция rGlobal.raceArray.slice(start, end)
btnSetOnlySelect.addEventListener('click', e=>{
    let {start, end} = getStartEndRange();

    rGlobal.raceArray = rGlobal.raceArray.slice(start, end)

    recalcDist();
    buildRace();

    draggableSelectRangePlugin.clearDraw(rGlobal.raceGraph)
    selectedRange = null;
    calcResultsForBound();

    rGlobal.raceGraph.resetZoom();
})

export default rGlobal;