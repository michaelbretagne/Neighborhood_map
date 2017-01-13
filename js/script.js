function app() {

    // Declare variables
    var map, marker, rating;
    var infowindow = new google.maps.InfoWindow();
    var previousInfoWindow = false;
    var location = "San francsico"
    var coordinate = [37.77, -122.44]; // Map location by default

    // Model
    // Object for the places with a method "makerMethod" which create a marker and an info windows
    // and also a method "deleteMarker" which delete the marker.
    class placeObj {
        constructor(name, street, city, latitude, longitude) {
            this.name = name,
            this.street = street,
            this.city = city,
            this.latitude = latitude,
            this.longitude = longitude;
            // Where the marker is stored when it is created
            this.marker = "";
        }

        markerMethod() {
            //Create a new marker
            marker = new google.maps.Marker({
                    position: new google.maps.LatLng(this.latitude, this.longitude),
                    map: map,
                    animation: google.maps.Animation.DROP
                    });

                this.marker = marker;

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
            }

            // Delete the marker
            deleteMarker() {
                this.marker.setMap(null);
            }


        }

    // Array containing all the parks informations
     var places = [];
    //              [new placeObj("Huntington Park", "California St & Cushman St",
    //                            "San Francisco", 37.792173, -122.412157),
    //               new placeObj("Lafayette Park", "Gough St and Sacremento St",
    //                            "San Francisco", 37.791629, -122.427536),
    //               new placeObj("Washington Square Park", "Union St and Stockton St",
    //                            "San Francisco", 37.800798, -122.410096),
    //               new placeObj("Alamo Square Park", "Hayes St and Steiner St",
    //                            "San Francisco", 37.776344, -122.434595),
    //               new placeObj("Alta Plaza Park", "Jackson St & Steiner St",
    //                            "San Francisco", 37.791202, -122.437657)];

    // Init function
    function initMap() {
        console.log("map");
        yelpInfo();
    }

    // View Model
    function ViewModel() {
        console.log("ViewModel");
        var self = this;

        // var viewModel = ko.mapping.fromJS(data);

        // Observable of the array places
        self.places = ko.observableArray([]);
        self.places(places);

        // Observable of the query from the search bar
        self.query = ko.observable("");

        // Computed observable to filter the parks
        self.filteredData = ko.computed(function() {
            var filter = self.query().toLowerCase();
            var data = self.places();
            // console.log(data);

            // If no filter, render all the places
            if (!filter) {
                data.forEach(el => el.markerMethod());
                return self.places();
            // If filter, render the places matching the inputed letter
            } else {
              return ko.utils.arrayFilter(self.places(), function(item) {
                var bool = item.name.toLowerCase().indexOf(filter) !== -1;
                if (bool === false) {
                    item.deleteMarker();
                }
                return bool;
              });
            }
          });

        //Open info window when a marker is clicked from the HTML DOM list
        this.placeInfoBox = function(clickedPark) {
        // Close the last opened info window if there is one open
        closeInfoWindow();
        // Open the info window and set content on the marker
        infowindow.setContent(clickedPark.name);
        infowindow.open(map, clickedPark.marker);
        // Declare that a info window is open
        previousInfoWindow = infowindow;
        };
    }

    function yelpInfo() {
        // Uses OAuth 1.0a signature generator
        // Bower package installed at https://github.com/bettiolo/oauth-signature-js

        // Use the GET method for the request
        var httpMethod = 'GET';

        // Yelp API request url
        var yelpURL = 'http://api.yelp.com/v2/search/';

        // Return a nonce
        var nonce = function() {
            return (Math.floor(Math.random() * 1e12).toString());
        };

        // Set parameters for the authentication and the search
        var parameters = {
          oauth_consumer_key: 'DgdYz5Ok9hKgaDDC0_-LRQ',
          oauth_token: 'PWjDu-crzWrIEN7b2kQ3ly-em5-H5g3x',
          oauth_nonce: nonce(),
          oauth_timestamp: Math.floor(Date.now() / 1000),
          oauth_signature_method: 'HMAC-SHA1',
          oauth_version: '1.0',
          callback: 'cb',
          term: 'park',
          location: location,
          limit: 10
        };

        // Generate the OAuth signature
        var EncodedSignature = oauthSignature.generate(httpMethod, yelpURL, parameters, 'vP92U9WyYFBwbOnCN_bkL9d1T3M', '4ZSzDmfHZF7fjFG-6uom9-rCZqs');

        // Add signature to list of parameters
        parameters.oauth_signature = EncodedSignature;

        // Set up the ajax settings
        var ajaxSettings = {
          url: yelpURL,
          data: parameters,
          cache: true,
          dataType: 'jsonp',
          success: function(response) {
            // console.log(response);
            var yelpData = response.businesses;
            console.log(yelpData);
            for (i = 0; i < yelpData.length; i++) {
                var parkName = yelpData[i].name;
                var street = yelpData[i].location.address[0];
                var city = yelpData[i].location.city;
                var lat = yelpData[i].location.coordinate.latitude;
                var long = yelpData[i].location.coordinate.longitude;
                coordinate = [lat, long];
                displayNewLocation(coordinate[0], coordinate[1]);
                places.push(new placeObj(parkName, street, city, lat, long));
                places[0].markerMethod();
            };
            // ko.mapping.fromJS(data, viewModel);
            ko.applyBindings(new ViewModel());
            },
          error: function() {
            console.log("fail response");
            }
        };
        // Send off the ajaz request to Yelp
        $.ajax(ajaxSettings);
    }

    // View
    function setupEventListener() {

        document.querySelector('#newLocation').addEventListener('keypress', function(event) {
             if (event.keycode === 13 || event.which === 13) {
                location = this.value;
                places = [];
                yelpInfo();
             }
         });
    }

    function displayNewLocation(lat, long) {
        var mapCenter = new google.maps.LatLng(lat, long);

        // Create the map
        map = new google.maps.Map(document.getElementById('map'), {
            center: mapCenter,
            scrollwheel: true,
            zoom: 12
        });
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
       setupEventListener();
       // ko.applyBindings(new ViewModel());
    }

    // Start application
    startApp();
}


