/**
 * This file will automatically be loaded by webpack and run in the "renderer" context.
 * To learn more about the differences between the "main" and the "renderer" context in
 * Electron, visit:
 *
 * https://electronjs.org/docs/tutorial/process-model
 *
 * By default, Node.js integration in this file is disabled. When enabling Node.js integration
 * in a renderer process, please be aware of potential security implications. You can read
 * more about security risks here:
 *
 * https://electronjs.org/docs/tutorial/security
 *
 * To enable Node.js integration in this file, open up `main.js` and enable the `nodeIntegration`
 * flag:
 *
 * ```
 *  // Create the browser window.
 *  mainWindow = new BrowserWindow({
 *    width: 800,
 *    height: 600,
 *    webPreferences: {
 *      nodeIntegration: true
 *    }
 *  });
 * ```
 */

//import './index.css';
import '../scss/app.scss';

import "../images/start.png"
import "../images/flag.png"

import * as L from 'leaflet';
import rGlobal from './rglobal';
import './bootstrap.init';
import teoToast from './bootstrap.toast.init';
import * as ruler from 'leaflet-ruler'

import "./trackLoader";
import "./raceLoader";


const YA_TILES_API = process.env.YA_TILES_API;
const MAPBOX_URL = process.env.MAPBOX_URL;


const lmap = document.querySelector('body');

function switchGraph(show = true){
    if (show){
        raceGraph.classList.remove('hide')
        tdsRaceSelect.classList.remove('hide')
        bTableInfo.classList.remove('hide')
    }else{
        raceGraph.classList.add('hide')
        tdsRaceSelect.classList.add('hide')
        bTableInfo.classList.add('hide')
    }

    localStorage.setItem('showGraph', show);
}

const btnSwitchGraph = document.getElementById('btnSwitchGraph')
const raceGraph = document.getElementById('raceGraph')
const tdsRaceSelect = document.getElementById('tdsRaceSelect')
const bTableInfo = document.querySelector(".bTableInfo")

switchGraph(localStorage.getItem('showGraph')=="true")

btnSwitchGraph.addEventListener('click', e=>{
    switchGraph(raceGraph.classList.contains('hide'));
});

const btnResetGraphZoom = document.getElementById('btnResetGraphZoom')

btnResetGraphZoom.addEventListener('click', e=>{
    rGlobal.raceGraph.resetZoom();
})

rGlobal.map = L.map('lMap', {
    zoomSnap: 0.5, 
    center: rGlobal.defaultGeo, 
    zoom: 15, 
    boxZoom: false, 
    keyboard: false, 
    preferCanvas: true
});


const mapboxTile = L.tileLayer(MAPBOX_URL, {
    attribution: 'Tiles &copy; <a href="https://www.mapbox.com/about/maps/">MapBox</a>',
    maxZoom: 22
});

const osmTile = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}
)

const yaTile = L.tileLayer('https://tiles.api-maps.yandex.ru/v1/tiles/?x={x}&y={y}&z={z}&lang=ru_RU&l=map&apikey={YA_API_KEY}&maptype={map_type}&projection={projection}', {
  YA_API_KEY: YA_TILES_API,
  projection: "web_mercator",
  map_type: "future_map", //future_map//driving//map
  attribution: '&copy; <a href="https://yandex.ru/maps">Яндекс</a>',
  tileSize: 256
})

rGlobal.map.baseLayers = {
  "MapBox Спутник": mapboxTile,
  "OSM Схема": osmTile,
  "Яндекс Схема": yaTile,
};
rGlobal.map.overLayers = {
    //"ОФП Росреестр": rosreestr_ofp,
}
let tileLayers = L.control.layers(rGlobal.map.baseLayers, rGlobal.map.overLayers, {position: 'bottomright'}).addTo(rGlobal.map);

osmTile.addTo(rGlobal.map);

let rulerOptions = {
    position: 'topleft',         // Leaflet control position option
    circleMarker: {               // Leaflet circle marker options for points used in this plugin
        color: 'red',
        radius: 2
    },
    lineStyle: {                  // Leaflet polyline options for lines used in this plugin
        color: 'red',
        dashArray: '1,6'
    },
    lengthUnit: {                 // You can use custom length units. Default unit is kilometers.
        display: 'км',              // This is the display value will be shown on the screen. Example: 'meters'
        decimal: 2,                 // Distance result will be fixed to this value.
        factor: null,               // This value will be used to convert from kilometers. Example: 1000 (from kilometers to meters)
        label: ('Дистанция:')
    },
    angleUnit: {
        display: ('&deg;'),           // This is the display value will be shown on the screen. Example: 'Gradian'
        decimal: 2,                 // Bearing result will be fixed to this value.
        factor: null,                // This option is required to customize angle unit. Specify solid angle value for angle unit. Example: 400 (for gradian).
        label: ('Угол:')
    }
};

let rulerControl = L.control.ruler(rulerOptions);
rulerControl.addTo(rGlobal.map);

const spnLat = document.getElementById('spnLat')
const spnLng = document.getElementById('spnLng')
rGlobal.map.on('mousemove', e=>{
    let curPos = e.latlng;

    spnLat.textContent = curPos.lat.toFixed(6)
    spnLng.textContent = curPos.lng.toFixed(6)
})
