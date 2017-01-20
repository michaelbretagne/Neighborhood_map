function app() {

    // Declare variables
    var vm
    var location = "San francsico";
    var term = "parks";
    var map, marker, rating;
    var infowindow = new google.maps.InfoWindow();
    var previousInfoWindow = false;


    // Model
    // Object for the places with a method "markerMethod" which create a marker and an info windows
    // and also a method "deleteMarker" which delete the marker.
    class placeObj {
        constructor(name, street, city, latitude, longitude, url, rating,
                    ratingImg, reviewNum, image, text) {
            this.name = name;
            this.street = street;
            this.city = city;
            this.latitude = latitude;
            this.longitude = longitude;
            this.url = url;
            this.rating = rating;
            this.ratingImg = ratingImg;
            this.reviewNum = reviewNum;
            this.image = image;
            this.text = text;

            //Create a new marker
            this.marker = new google.maps.Marker({
                    position: new google.maps.LatLng(this.latitude, this.longitude),
                    map: map,
                    animation: google.maps.Animation.DROP
                    });

            // Create a new info window
            var infowindowMarker = new google.maps.InfoWindow({
                content: `<div class="iw-title">${this.name}</div>
                          <div class="iw-address">${this.street}</div>
                          <div class="iw-address">${this.city}</div>`
            });

            // Open the info window when the marker is clicked
            google.maps.event.addListener(this.marker, 'click', function() {

                // Bounce marker
              //   if (this.getAnimation() !== null) {
              //   this.setAnimation(null);
              // } else {
              //   this.setAnimation(google.maps.Animation.BOUNCE);
              // }

                // Center the map around the clicked marker
                // map.setCenter(this.getPosition());
                // Close the last opened info window if there is one open
                closeInfoWindow();
                // Open the info window on the marker
                infowindowMarker.open(map, this);
                // Declare that a info window is open
                previousInfoWindow = infowindowMarker;

                vm.displayDetails(false);
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

        yelpInfo(location);

        // Title observabables
        self.city = ko.observable();
        self.terms = ko.observable();
        self.title = ko.computed(function() {
             return `Top 10 ${self.terms()} in ${self.city()}`;
         })

        // New location input observable
        self.input = ko.observable();
        // Set the new location and fetch data from yelp
        self.newLocation = function() {
            location = self.input();
            self.displayDetails(false);
            self.placesList([]);
            yelpInfo();
        };
        // Call API for best parks
        self.parkTerm = function() {
            term = "parks";
            self.displayDetails(false);
            self.placesList([]);
            yelpInfo();
        };
        // Call API for best playgrounds
        self.playgroundTerm = function() {
            term = "playgrounds";
            self.displayDetails(false);
            self.placesList([]);
            yelpInfo();
        };
        // Call API for best hikes
        self.hikingTerm = function() {
            term = "hikes";
            self.displayDetails(false);
            self.placesList([]);
            yelpInfo();
        };

        // Observable of the list who get the filtered list from ko.computed
        self.placesList = ko.observableArray([]);

        // Observable of the query from the search bar
        self.query = ko.observable("");

        // Computed observable to filter the parks
        self.filteredData = ko.computed(function() {
            var filter = self.query().toLowerCase();

        self.placesList().forEach(el => el.marker.setVisible(true));

            if (!filter) {
                // If the filter is not activate all markers are visible
                return self.placesList();
            } else {
                return ko.utils.arrayFilter(self.placesList(), function(item) {
                var bool = item.name.toLowerCase().indexOf(filter) !== -1;
                if (bool === false) {
                    // Only marker matching filter input of the park name will be visible
                    item.marker.setVisible(false);
                    closeInfoWindow();
                }
                return bool;
                });
              }
          });

        // Display/hide the parks list box
        self.displayList = ko.observable(true);
        // Display/hide the details of a selected park
        self.displayDetails = ko.observable(false);
        // Parks's details observable
        self.park = ko.observable();
        self.text = ko.observable();
        self.image = ko.observable();
        self.url = ko.observable();

        // Open info window when a marker is clicked from the HTML DOM list
        self.placeInfoBox = function(clickedPark) {
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
            // Center map on marker click
            map.setCenter(clickedPark.marker.getPosition());
            // Pass data into observable
            self.park(clickedPark.name)
            self.text(clickedPark.text);
            self.image(clickedPark.image);
            self.url(clickedPark.url);
            // Display the details
            self.displayDetails(true);
        };

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
              term: term,
              location: location,
              limit: 10
            };

            // Generate the OAuth signature
            var EncodedSignature = oauthSignature.generate(httpMethod, yelpURL,
                parameters, 'vP92U9WyYFBwbOnCN_bkL9d1T3M',
                '4ZSzDmfHZF7fjFG-6uom9-rCZqs');

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
                        var image = yelpData[i].snippet_image_url
                        var text = yelpData[i].snippet_text

                        // Push the data into a observable array
                        self.placesList.push(new placeObj(parkName, street,
                            city, markerLat, markerLong, url, rating,
                            ratingImg, reviewNum, image, text));

                        // Set data to a observable for the title computed observable
                        self.city(city);
                        self.terms(term);
                    }
                },
                error: function() {
                    displayNewLocation(37.77, -122.44);
                    // Display hard coded places
                    for (i = 0; i < backUpPlaces.length; i++) {
                        self.placesList.push(backUpPlaces[i]);
                    }
                }
            };
            // Send off the ajax request to Yelp
            $.ajax(ajaxSettings);
        }
    } // End of ViewModel

    // View
    // Display the new map when users enter a new location
    function displayNewLocation(lat, long) {
        var mapCenter = new google.maps.LatLng(lat, long);

        // Map style
        var styleArray = [
            {
              featureType: 'all',
              stylers: [
                { saturation: -30 }
              ]
            },{
              featureType: 'road.arterial',
              elementType: 'geometry',
              stylers: [
                { hue: '#00ffee' },
                { saturation: 20 }
              ]
            }
          ];

        // Create the map
        map = new google.maps.Map(document.getElementById('map'), {
            center: mapCenter,
            scrollwheel: true,
            zoom: 12,
            styles: styleArray,

            mapTypeControl: true,
            mapTypeControlOptions: {
                style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
                position: google.maps.ControlPosition.BOTTOM_CENTER
            },
            zoomControl: true,
            zoomControlOptions: {
                position: google.maps.ControlPosition.RIGHT_BOTTOM
            },
            scaleControl: true,
            streetViewControl: true,
            streetViewControlOptions: {
                position: google.maps.ControlPosition.RIGHT_BOTTOM
            }
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
        // Create a new viewModel
        vm = new ViewModel();
        ko.applyBindings(vm);
    }

    // Start application
    startApp();
}
