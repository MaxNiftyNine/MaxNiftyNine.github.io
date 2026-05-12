var map;
var marker;
var latLng;

function initializeMap(latLng) {
    map = L.map('map').setView([latLng.lat, latLng.lng], 10);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
    }).addTo(map);

    marker = L.marker([latLng.lat, latLng.lng], {
        draggable: true
    }).addTo(map);
}

function flipIt() {
    var oppositeLat = -marker.getLatLng().lat;
    var oppositeLng = marker.getLatLng().lng > 0 ? marker.getLatLng().lng - 180 : marker.getLatLng().lng + 180;

    var oppositeLatLng = { lat: oppositeLat, lng: oppositeLng };
    map.setView([oppositeLat, oppositeLng]);
    marker.setLatLng(oppositeLatLng);

    document.getElementById('result').textContent = 'The opposite of ' + marker.getLatLng().lat.toFixed(2) + ',' + marker.getLatLng().lng.toFixed(2) + ' on earth is ' + oppositeLat.toFixed(2) + ',' + oppositeLng.toFixed(2);
}

$(document).ready(function() {
    $.getJSON('https://ipinfo.io/json', function(data) {
        var coords = data.loc.split(',');
        latLng = { lat: parseFloat(coords[0]), lng: parseFloat(coords[1]) };
        initializeMap(latLng);
    });
});
