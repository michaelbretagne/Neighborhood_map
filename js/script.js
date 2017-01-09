function app() {

    // Declare variables
    var map, marker;
    var infowindow = new google.maps.InfoWindow();

    // Model
    // Create the object "placeObj" with a method "makerMethod" to create his marker and his info windows
    class placeObj {
        constructor(name, street, city, latitude, longitude) {
            this.name = name,
            this.street = street,
            this.city = city,
            this.latitude = latitude,
            this.longitude = longitude
        }

        markerMethod() {
            marker = new google.maps.Marker({
                    position: new google.maps.LatLng(this.latitude, this.longitude),
                    map: map,
                    animation: google.maps.Animation.DROP
                  });

                  // Callback function to show info windows on click
                  google.maps.event.addListener(marker, 'click', (function(marker) {
                    return function() {
                      infowindow.setContent(this.name);
                      infowindow.open(map, marker);
                    };
                  })(marker));
            }
        }

    // Array of all the places
    var places = [new placeObj("Huntington Park", "California St & Cushman St",
                               "San Francisco", 37.792173, -122.412157),
                  new placeObj("Lafayette Park", "Gough St and Sacremento St",
                               "San Francisco", 37.791629, -122.427536),
                  new placeObj("Washington Square Park", "Union St and Stockton St",
                               "San Francisco", 37.800798, -122.410096),
                  new placeObj("Alamo Square Park", "Hayes St and Steiner St",
                               "San Francisco", 37.776344, -122.434595),
                  new placeObj("Alta Plaza Park", "Jackson St & Steiner St",
                               "San Francisco", 37.791202, -122.437657)];

    // Init function
    function initMap() {
        console.log("map");

        // Set up the center of the map
        var mapCenter = new google.maps.LatLng(37.77, -122.44);

        // Create the map
        map = new google.maps.Map(document.getElementById('map'), {
            center: mapCenter,
            scrollwheel: true,
            zoom: 12
        });

        // Display all the marker during initialization
        displayAllMarkers();
    }

    // View Model
    // Function that create the markers
    function createMarker(data) {
        data.forEach(el => el.markerMethod());
    }

    function location(data) {
        this.name = ko.observable(data.name);
        this.latitude = ko.observable(data.latitude);
        this.longitude = ko.observable(data.longitude);
    }

    function ViewModel() {
        console.log("ViewModel");
        var self = this;

        this.parkList = ko.observableArray([]);

        places.forEach(function(place) {
            self.parkList.push(new location(place));
        });

        this.placeInfoBox = function(clickedPark) {
            infowindow.setContent(clickedPark.name());
            infowindow.open(map, marker);
            console.log(clickedPark);
        };
    }

    // View
    function displayAllMarkers() {
        createMarker(places);
    }

    function startApp() {
       initMap();
       ko.applyBindings(new ViewModel());
    }

    // Start application
    startApp();
}


