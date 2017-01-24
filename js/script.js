// script.js
// Neighborhood_map developped by Michael Donal

// Start app if no error from Google API
function googleSuccess() {
            app();
        }
// Set a screenshot as a background with an error message
function gm_authFailure() {
    document.getElementById('background-error').style.display= 'block';
}

// Application starter
function app() {

    // Declare variables
    var vm;
    var location = 'San francsico';
    var term = 'parks';
    var map, marker, rating;
    var iconBase = 'https://maps.google.com/mapfiles/kml/shapes/';
    var infowindow = new google.maps.InfoWindow();
    var previousInfoWindow = false;


    // Model
    // Object of the place with marker and an info windows
    class PlaceObj {
        constructor(name='n/a', street='n/a', city='n/a', latitude='n/a',
                    longitude='n/a', url='n/a', rating='n/a',
                    ratingImg='n/a', reviewNum='n/a', image='n/a', text='n/a',
                    term='n/a', letter='n/a') {
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
            this.term = term;
            this.letter =letter;
            this.iconSrc = "";

            // Set the marker colors
            var markerColor;
            if (this.term === 'parks') {
                markerColor = 'green';
            } else if (this.term === 'playgrounds'){
                markerColor = 'yellow';
            } else {
                markerColor = 'brown';
            }

            // Set icons scr
            var icons = `ressources/GoogleMapsMarkers/${markerColor}_Marker${this.letter}.png`;
            this.iconSrc = icons;

            //Create a new marker
            this.marker = new google.maps.Marker({
                    position: new google.maps.LatLng(this.latitude, this.longitude),
                    map: map,
                    icon: icons,
                    animation: google.maps.Animation.DROP
                    });

            // Create a new info window
            var infowindowMarker = new google.maps.InfoWindow({
                content: `<div class='iw-title'>${this.name}</div>
                          <div class='iw-address'>${this.street}</div>
                          <div class='iw-address'>${this.city}</div>`
            });

            // Open the info window when the marker is clicked
            google.maps.event.addListener(this.marker, 'click', function() {

                // Close the last opened info window if there is one open
                closeInfoWindow();
                // Open the info window on the marker
                infowindowMarker.open(map, this);
                // Declare that a info window is open
                previousInfoWindow = infowindowMarker;

                vm.displayDetails(false);

                // Bounce marker on click
                if (this.getAnimation() !== null) {
                    this.setAnimation(null);
                } else {
                    this.setAnimation(google.maps.Animation.BOUNCE);
                    this.setAnimation(4);
              }

            });
        }
    }

    // Object for the weather info
    class currentWeather {
        constructor(weatherIcon='n/a', temperature='n/a') {
            this.weatherIcon = weatherIcon;
            this.temperature = temperature;
            this.icon = '';

            // Set icons depending on the weather
            if (this.weatherIcon === 'clear-day') {
                this.icon = 'ressources/weatherIcons/sunny.png';
            } else if (this.weatherIcon === 'clear-night') {
                this.icon = 'ressources/weatherIcons/clear-night.png';
            } else if (this.weatherIcon === 'cloudy') {
                this.icon = 'ressources/weatherIcons/cloudy.png';
            } else if (this.weatherIcon === 'fog') {
                this.icon = 'ressources/weatherIcons/fog.png';
            } else if (this.weatherIcon === 'partly-cloudy-day') {
                this.icon = 'ressources/weatherIcons/partly-cloudy-day.png';
            } else if (this.weatherIcon === 'partly-cloudy-night') {
                this.icon = 'ressources/weatherIcons/partly-cloudy-night.png';
            } else if (this.weatherIcon === 'rain') {
                this.icon = 'ressources/weatherIcons/rain.png';
            } else if (this.weatherIcon === 'snow') {
                this.icon = 'ressources/weatherIcons/light-snow.png';
            } else {
                this.icon = 'ressources/weatherIcons/sunny.png';
            }
        }
    }


    // View Model
    function ViewModel() {
        var self = this;

        yelpInfo();

        // Title observabables
        self.city = ko.observable();
        self.terms = ko.observable();
        self.title = ko.computed(function() {
             return `Top 10 ${self.terms()} in ${self.city()}`;
         });

        // New location input observable
        self.input = ko.observable();
        // Set the new location and fetch data from yelp
        self.newLocation = function() {
            location = self.input();
            self.displayDetails(false);
            self.placesList([]);
            self.weathers([]);
            yelpInfo();
        };

        // Observable array of the weather information
        self.weathers = ko.observableArray([]);

        // Call API for best parks
        self.parkTerm = function() {
            term = 'parks';
            self.displayDetails(false);
            self.placesList([]);
            self.weathers([]);
            yelpInfo();
        };
        // Call API for best playgrounds
        self.playgroundTerm = function() {
            term = 'playgrounds';
            self.displayDetails(false);
            self.placesList([]);
            self.weathers([]);
            yelpInfo();
        };
        // Call API for best hikes
        self.hikingTerm = function() {
            term = 'hikes';
            self.displayDetails(false);
            self.placesList([]);
            self.weathers([]);
            yelpInfo();
        };

        // Observable array of all the places
        self.placesList = ko.observableArray([]);

        // Observable of the query from the search bar
        self.query = ko.observable('');

        // Computed observable to filter the parks
        self.filteredData = ko.computed(function() {
            var filter = self.query().toLowerCase();

            // Set all the markers as visible
            self.placesList().forEach(el => el.marker.setVisible(true));

            if (!filter) {
                // If the filter is not activate it return all the places
                return self.placesList();
            } else {
                // Only marker matching filter input of the park name will be visible
                return ko.utils.arrayFilter(self.placesList(), function(item) {
                var bool = item.name.toLowerCase().indexOf(filter) !== -1;
                if (bool === false) {
                    item.marker.setVisible(false);
                    closeInfoWindow();
                }
                return bool;
                });
              }
          });

        // Display or hide the parks list box
        self.displayList = ko.observable(true);

        // Display or hide the details of a selected park
        self.displayDetails = ko.observable(false);

        // Parks's details observable
        self.park = ko.observable();
        self.text = ko.observable();
        self.image = ko.observable();
        self.url = ko.observable();

        // Open info window when a marker is clicked from the HTML DOM list
        self.placeInfoBox = function(clickedPark) {

            // Format content for the info windows
            var formattedContent = `<div class='iw-title'>${clickedPark.name}</div>
                                    <div class='iw-address'>${clickedPark.street}</div>
                                    <div class='iw-address'>${clickedPark.city}</div>`;

            // Close the last opened info window if there is one open
            closeInfoWindow();
            // Open the info window and set content on the marker
            infowindow.setContent(formattedContent);
            infowindow.open(map, clickedPark.marker);

            // Bounce marker
            clickedPark.marker.setAnimation(4);

            // Declare that a info window is open
            previousInfoWindow = infowindow;

            // Center map on marker click
            map.setCenter(clickedPark.marker.getPosition());

            // Pass data into observables
            self.park(clickedPark.name);
            self.text(clickedPark.text);
            self.image(clickedPark.image);
            self.url(clickedPark.url);

            // Display the details of a place
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
                    // Set the center of the map and display the location
                    latMap = response.region.center.latitude;
                    longMap = response.region.center.longitude;
                    displayNewLocation(latMap, longMap);
                    // Display the weather
                    weatherInfo(latMap, longMap);

                    // Possible assignement letters
                    var letterArr = ['A','B','C','D','E','F','G','H','I','J'];

                    // Populate the PlaceObj with the relevant data
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
                        var image = yelpData[i].snippet_image_url;
                        var text = yelpData[i].snippet_text;

                        // Assign letter for each elements
                        var letter = letterArr.shift();

                        // Push the data into a observable array
                        self.placesList.push(new PlaceObj(parkName, street,
                            city, markerLat, markerLong, url, rating,
                            ratingImg, reviewNum, image, text, term, letter));

                        // Set data to a observable for the title computed observable
                        self.city(city);
                        self.terms(term);
                    }
                },
                error: function() {
                    // Set a screenshot as a background with an error message
                    document.getElementById('background-error').style.display= 'block';
                }
            };
            // Send off the ajax request to Yelp
            $.ajax(ajaxSettings);
        }

        // Get the current waether from Dark Sky API (https://darksky.net)
        function weatherInfo(latitude, longitude) {

            // Use the GET method for the request
            var httpMethod = 'GET';
            // API request url
            var darkSkyURL = `https://api.darksky.net/forecast/1b3811d9b82e836d5238991f3108fc90/${latitude},${longitude}`;

            // Ajax call
            $.ajax({
                url: darkSkyURL,
                dataType: "jsonp",
                    }).done(function(data) {

                    var weather = data.currently.icon;
                    var temp = data.currently.temperature;

                    // Push a new object currentWeather into the weather observable array
                    self.weathers.push(new currentWeather(weather, temp));
                });
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
