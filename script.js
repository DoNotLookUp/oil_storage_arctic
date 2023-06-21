/** WEBMAP CONFIGURATION */
let MAP_CENTER_LAT = 62.941038954260556; // latitude
let MAP_CENTER_LON = 94.37245917063447; // longitude
let MAP_ZOOM = 3; // zoom level
let MAP_LEGEND_POSITION = "topleft";
let MAP_ZOOM_CONTROLS_POSITION = "topright";

map = L.map("map", {
  center: [MAP_CENTER_LAT, MAP_CENTER_LON],
  minZoom: 2,
  zoom: MAP_ZOOM,
  zoomControl: false
});

L.control.zoom({
  position: MAP_ZOOM_CONTROLS_POSITION
}).addTo(map);

map.createPane('points');
map.getPane('points').style.zIndex = 410;

addLayerControls();
addInfoButton();

addBasemap("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", "Схема");
addBasemap("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", "Спутник");

addShapefile("./data/arctic_zone.zip", "Арктическая зона", {
  "color": "grey", // border color
  "opacity": 0.6, // border transparency
  "weight": 2, // border width
  "fillColor": "lightgrey", // inner polygon color
  "fillOpacity": 0.2 // inner polygon transparency
}, () => {
  hideSpinner();
});

addGeoJSON({
  fileName: "./data/objects.geojson",
  layerName: "Нефтехранилища",
  pointToLayer: (feature, latlng) => {
    return L.circleMarker(latlng, {
      pane: "points",
      radius: 6,
      fillColor: "purple",
      color: "white",
      weight: 2,
      opacity: 1,
      fillOpacity: 1
    });
  },
  onEachFeature: (feature, layer) => {
    let properties = feature.properties;
    if (properties) {
      let html = popupContent(properties);
      layer.bindPopup(html);
    }
  }
})


/** 
  Adding layer control
*/
function addLayerControls() {
  let layerControlButton = L.Control.extend({
    options: { position: MAP_LEGEND_POSITION },
    onAdd: function(map) {
      let container = L.DomUtil.create('input');
      container.type = 'button';
      container.className = 'layer-control-open control-btn';
      container.onclick = function() {
        document.querySelector('.leaflet-control-layers').style.display = 'block';
        document.querySelector('.layer-control-open').style.display = 'none';
      }
      return container;
    }
  });
  map.addControl(new layerControlButton());

  // mofidying layer control
  L.Control.Custom = L.Control.Layers.extend({
    onAdd: function() {
      this._initLayout();
      this._addButton();
      this._update();
      return this._container;
    },
    _addButton: function() {
      let elements = this._container.getElementsByClassName('leaflet-control-layers-list');
      let button = L.DomUtil.create('button', 'layer-control-close', elements[0]);
      L.DomEvent.on(button, 'click', function(e) {
        document.querySelector('.leaflet-control-layers').style.display = 'none';
        document.querySelector('.layer-control-open').style.display = 'block';
      }, this);
    }
  });
  layerControl = new L.Control.Custom({}, {}, {
    collapsed: false,
    position: MAP_LEGEND_POSITION
  }).addTo(map);
}

/** 
  Add XYZ or Mapbox basemaps
*/
function addBasemap(url, layerName) {
  let basemap = new L.tileLayer(url);
  if (isFirst()) basemap.addTo(map);
  layerControl.addBaseLayer(basemap, layerName);
}


/** 
  Add a custom geojson file
*/
function addGeoJSON(props) {
  const { fileName, layerName, style, pointToLayer, onEachFeature } = props;

  let p = {};
  if (style) p.style = style;
  if (pointToLayer) p.pointToLayer = pointToLayer;
  if (onEachFeature) p.onEachFeature = onEachFeature;

  fetch(fileName).then(r => r.json()).then(data => {
    let layer = L.geoJSON(data, p).addTo(map);
    layerControl.addOverlay(layer, layerName);
  })
}

/** 
  Add a custom shapefile file
*/
function addShapefile(fileName, layerName, style, onLoad) {
  let shpfile = new L.Shapefile(fileName, {
    style: style,
    interactive: false
  });
  shpfile.addTo(map);
  shpfile.once("data:loaded", function() {
    layerControl.addOverlay(shpfile, layerName);
    onLoad();
  });
}

/** 
  Creating popup content
*/
function popupContent(properties) {
  return `
    <strong>Местонахождение:</strong> ${properties.name}</br>
    <strong>Содержание:</strong> ${properties.content2}</br>
  `;
}

/**
  Other helper functions
*/
function hideSpinner() {
  document.getElementById('loader').classList.add('hidden');
}

function isFirst() {
  return (layerControl._layers.filter(el => !el.overlay).length === 0);
}

function isImage(url) {
  return /\.(jpg|jpeg|png|webp|avif|gif|svg)$/.test(url);
}

function isGoogleLink(url) {
  return /drive.google.com\/file\/d\/([A-z0-9-]+)\/view/g.test(url);
}

function getGoogleImage(url) {
  const regex = /drive.google.com\/file\/d\/([A-z0-9-]+)\/view/g;
  const found = url.match(regex);
  const id = found[0].split('/')[3];
  return `https://drive.google.com/uc?id=${id}&export=download`
}

// add info button + add modal
function addInfoButton() {
  // instanciate new modal
  let modal = new tingle.modal({
    footer: false,
    stickyFooter: false,
    closeMethods: ['overlay', 'button', 'escape'],
    closeLabel: "Close",
    cssClass: ['custom-class-1', 'custom-class-2'],
    beforeClose: function() {
      return true; // close the modal
    }
  });

  // create infobtn control
  L.Control.InfoButton = L.Control.extend({
    onAdd: function(map) {
      let el = L.DomUtil.create('div', 'control-btn control-info');
      el.onclick = function() {
        let title = document.querySelector('#modal');
        modal.setContent(title.innerHTML);
        modal.open();
      }
      return el;
    },
    onRemove: function(map) {
      // Nothing to do here
    }
  });

  new L.Control.InfoButton({
    position: 'topright'
  }).addTo(map);
}