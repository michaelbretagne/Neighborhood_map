function app() {

    // Declare variables
    var map, marker;
    var infowindow = new google.maps.InfoWindow();
    var previousInfoWindow = false;
    var nameArr = [];

    // Model
    // Create the object "placeObj" with a method "makerMethod" to create his marker and his info windows
    class placeObj {
        constructor(name, street, city, latitude, longitude) {
            this.name = name,
            this.street = street,
            this.city = city,
            this.latitude = latitude,
            this.longitude = longitude;
            // Insert the name of the park in a array for later use in the search filter
            nameArr.push(name);
        }



        markerMethod() {
            //Create a new marker
            marker = new google.maps.Marker({
                    position: new google.maps.LatLng(this.latitude, this.longitude),
                    map: map,
                    animation: google.maps.Animation.DROP
                  });

                // Create a new info window
                var infowindow = new google.maps.InfoWindow({
                    content: this.name
                });

                // Open the info window when the marker is clicked
                google.maps.event.addListener(marker, 'click', function() {

                    // Close the last opened info window if there is one open
                    closeInfoWindow();
                    // Open the info window on the marker
                    infowindow.open(map, this);
                    // Declare that a info window is open
                    previousInfoWindow = infowindow;
                });
            return marker;
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
        this.marker = data.markerMethod();

    }

    function ViewModel() {
        console.log("ViewModel");
        var self = this;

        // Observable array of the list of Park
        this.parkList = ko.observableArray([]);

        // Create the list of parks in the HTML DOM
        places.forEach(function(data) {
            self.parkList.push(new location(data));
        });

        // Open info window when a marker is clicked from the HTML DOM list
        this.placeInfoBox = function(clickedPark) {
            // Close the last opened info window if there is one open
            closeInfoWindow();
            // Open the info window and set content on the marker
            infowindow.setContent(clickedPark.name());
            infowindow.open(map, clickedPark.marker);
            // Declare that a info window is open
            previousInfoWindow = infowindow;
        };
    }

    // View
    // Function that display all the markers
    function displayAllMarkers() {
        createMarker(places);
    }

    // Close info window if one is already open
    function closeInfoWindow() {
        if( previousInfoWindow) {
            previousInfoWindow.close();
        }
    }

    // Function that starts the application
    function startApp() {
       initMap();
       ko.applyBindings(new ViewModel());
    }

    // Start application
    startApp();
}


