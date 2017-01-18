function app() {

    // Declare variables
    var map, marker, rating;
    var infowindow = new google.maps.InfoWindow();
    var previousInfoWindow = false;
    var location = "San francsico";
    var coordinate = []; // Latitude and longitude of the map center by default
    var binding = false;
    var places = [];


    // Model

    // Object for the places with a method "makerMethod" which create a marker and an info windows
    // and also a method "deleteMarker" which delete the marker.
    class placeObj {
        constructor(name, street, city, latitude, longitude, url, rating, ratingImg, reviewNum) {
            this.name = name;
            this.street = street;
            this.city = city;
            this.latitude = latitude;
            this.longitude = longitude;
            this.url = url;
            this.rating = rating;
            this.ratingImg = ratingImg;
            this.reviewNum = reviewNum;
            // Where the marker is stored when it is created
            this.marker = [];
        }

        markerMethod() {
            //Create a new marker
            marker = new google.maps.Marker({
                    position: new google.maps.LatLng(this.latitude, this.longitude),
                    map: map,
                    animation: google.maps.Animation.DROP
                    });
                // Store marker
                this.marker = marker;
                // console.log(this.marker);
                // Create a new info window
                var infowindow = new google.maps.InfoWindow({
                    content: `<div class="iw-title">${this.name}</div>
                              <div class="iw-address">${this.street}</div>
                              <div class="iw-address">${this.city}</div>`
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
        }

    // Array containing parks informations if the request from Yelp API fail
    var backUpPlaces = [new placeObj("Huntington Park", "California St & Cushman St",
                                    "San Francisco", 37.792173, -122.412157),
                        new placeObj("Lafayette Park", "Gough St and Sacremento St",
                                    "San Francisco", 37.791629, -122.427536),
                        new placeObj("Washington Square Park", "Union St and Stockton St",
                                    "San Francisco", 37.800798, -122.410096),
                        new placeObj("Alamo Square Park", "Hayes St and Steiner St",
                                    "San Francisco", 37.776344, -122.434595),
                        new placeObj("Alta Plaza Park", "Jackson St & Steiner St",
                                    "San Francisco", 37.791202, -122.437657)];


    // View Model

    function ViewModel() {
        var self = this;

        // New location input observable
        self.input = ko.observable();
        // Set the new location and fetch data from yelp
        self.newLocation = function() {
            location = self.input();
            places.splice(0, 9);
            yelpInfo();

        };

        // Observable of the list who get the filtered list from ko.computed
        self.placesList = ko.observableArray([]);

        // Observable of the array places
        self.placesArr = ko.observableArray(places);

        // Create a marker for each places
        self.placesArr().forEach(el => el.markerMethod());

        // Observable of the query from the search bar
        self.query = ko.observable("");

        // Computed observable to filter the parks
        self.filteredData = ko.computed(function() {
            var filter = self.query().toLowerCase();

            self.placesList.removeAll();

            self.placesArr().forEach(function(element) {
                element.marker.setVisible(false);

                if (element.name.toLowerCase().indexOf(filter) !== -1) {
                    element.marker.setVisible(true);
                    self.placesList.push(element);
                }
            });
          }, self);

        //Open info window when a marker is clicked from the HTML DOM list
        this.placeInfoBox = function(clickedPark) {
        // Close the last opened info window if there is one open
        closeInfoWindow();
        // Format content
        var formattedContent = `<div class="iw-title">${clickedPark.name}</div>
                                <div class="iw-address">${clickedPark.street}</div>
                                <div class="iw-address">${clickedPark.city}</div>`;
        // Open the info window and set content on the marker
        infowindow.setContent(formattedContent);
        infowindow.open(map, clickedPark.marker);
        // Declare that a info window is open
        previousInfoWindow = infowindow;
        };
    }

    // Get data from yelp API
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
          limit: 5
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
                // Set the center of the map
                var latMap = response.region.center.latitude;
                var longMap = response.region.center.longitude;
                displayNewLocation(latMap, longMap);

                // Populate the placeObj with the relevant data
                var yelpData = response.businesses;
                for (i = 0; i < yelpData.length; i++) {
                    var parkName = yelpData[i].name;
                    var street = yelpData[i].location.address[0];
                    var city = yelpData[i].location.city;
                    var markerLat = yelpData[i].location.coordinate.latitude;
                    var markerLong = yelpData[i].location.coordinate.longitude;
                    var url = yelpData[i].url;
                    var rating =yelpData[i].rating;
                    var ratingImg = yelpData[i].rating_img_url_small;
                    var reviewNum =yelpData[i].review_count;
                    // ViewModel.placesList.push(new placeObj(parkName, street, city, markerLat, markerLong, url, rating, ratingImg, reviewNum));
                    places.push(new placeObj(parkName, street, city, markerLat, markerLong, url, rating, ratingImg, reviewNum));
                }
            },
            error: function() {
                places = backUpPlaces;
                displayNewLocation(37.77, -122.44);
                }
        };
        // Update View model after getting all the data from Yelp API
        setTimeout(function(){ ViewModel(); }, 1500);

        // Send off the ajax request to Yelp
        $.ajax(ajaxSettings);
    }


    // View

    // Display the new map when users enter a new location
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
        ko.applyBindings(new ViewModel());
        yelpInfo();
    }

    // Start application
    startApp();
}
