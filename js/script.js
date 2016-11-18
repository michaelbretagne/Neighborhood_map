var places = [{
    name: "Huntington Park",
    street: "California St & Cushman St",
    city: "San Francisco",
    latitude: 37.792173,
    longitude: -122.412157
}, {
    name: "Lafayette Park",
    street: "Gough St and Sacremento St",
    city: "San Francisco",
    latitude: 37.791629,
    longitude: -122.427536
}, {
    name: "Washington Square Park",
    street: "Union St and Stockton St",
    city: "San Francisco",
    latitude: 37.800798,
    longitude: -122.410096
}, {
    name: "Alamo Square Park",
    street: "Hayes St and Steiner St",
    city: "San Francisco",
    latitude: 37.776344,
    longitude: -122.434595
}, {
    name: "Alta Plaza Park",
    street: "Jackson St & Steiner St",
    city: "San Francisco",
    latitude: 37.791202,
    longitude: -122.437657
}];

var park = function(data) {
    this.name = ko.observable(data.name);
};

var ViewModel = function() {
    var self = this;

    this.parkList = ko.observableArray([]);

    this.parks = ko.observable(this.parkList());

    places.forEach(function(place) {
        self.parkList.push(new park(place));
    });

    this.placeInfoBox = function(clickedPark) {
        alert("Clicked");
    };

};

ko.applyBindings(new ViewModel());


// Google map
function initMap() {
    var mapCenter = new google.maps.LatLng(37.77, -122.44);

    var map = new google.maps.Map(document.getElementById('map'), {
        center: mapCenter,
        scrollwheel: true,
        zoom: 12
    });

    var infowindow = new google.maps.InfoWindow();

    for (i = 0; i < places.length; i++) {
        marker = new google.maps.Marker({
            position: new google.maps.LatLng(places[i].latitude, places[i].longitude),
            map: map,
            animation: google.maps.Animation.DROP,
        });

        google.maps.event.addListener(marker, 'click', (function(marker, i) {
            return function() {
                infowindow.setContent(places[i].name);
                infowindow.open(map, marker);
            };
        })(marker, i));
    }
};

