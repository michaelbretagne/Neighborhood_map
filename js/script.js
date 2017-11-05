// script.js
// Neighborhood_map developped by Michael Donal

// Sets a screenshot as a background with an error message
function googleError() {
    document.getElementById('background-error').style.display = 'block';
    console.log(`Sorry, something went wrong with Google Map API`);
}

// Initialization of the application
function initMap() {

    // Sets the center of Google Map
    const mapCenter = new google.maps.LatLng(37.773972, -122.431297);
    // Map style
    const styleArray = [{
        featureType: 'all',
        stylers: [{
            saturation: -30
        }]
    }, {
        featureType: 'road.arterial',
        elementType: 'geometry',
        stylers: [{
            hue: '#00ffee'
        }, {
            saturation: 20
        }]
    }];

    // Creates the map
    const map = new google.maps.Map(document.getElementById('map'), {
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

    // Declares variables
    let vm;
    let previousInfoWindow = false;


    // Model
    // Object of the place with marker and an info windows
    class PlaceObj {
        constructor(data) {
            this.id = data.id || 'n/a';
            this.name = data.name || 'n/a';
            this.street = data.street || 'n/a';
            this.city = data.city || 'n/a';
            this.latitude = data.latitude || 'n/a';
            this.longitude = data.longitude || 'n/a';
            this.url = data.url || 'n/a';
            this.rating = data.rating || 'n/a';
            this.ratingImg = data.ratingImg || 'n/a';
            this.reviewNum = data.reviewNum || 'n/a';
            
            this.userImage = data.userImage || 'n/a';
            this.userName = data.userName || 'n/a';
            this.text = data.text || 'n/a';

            this.term = data.term || 'n/a';
            this.letter = data.letter || 'n/a';

            // Sets the marker colors
            let markerColor;
            if (this.term === 'parks') {
                markerColor = 'green';
            } else if (this.term === 'playgrounds') {
                markerColor = 'yellow';
            } else {
                markerColor = 'brown';
            }

            // Sets icons scr
            this.iconSrc = `resources/GoogleMapsMarkers/${markerColor}_Marker${this.letter}.png`;

            //Creates a new marker
            this.marker = new google.maps.Marker({
                position: new google.maps.LatLng(this.latitude, this.longitude),
                map: map,
                icon: this.iconSrc,
                animation: google.maps.Animation.DROP
            });

            this.marker.addListener('click', () => this.handleClick());

        }

        // Method that handle clicks
        handleClick() {

            // Formats content for the info windows
            const formattedContent = `<div class='iw-title'>${this.name}</div>
                                        <div class='iw-address'>${this.street}</div>
                                        <div class='iw-address'>${this.city}</div>`;

            // Creates a new info window and set content
            const infowindow = new google.maps.InfoWindow({
                content: formattedContent
            });

            // Closes the last opened info window if there is one open
            closeInfoWindow();
            // Open the info window on the marker
            infowindow.open(map, this.marker);
            // Declares that a info window is open
            previousInfoWindow = infowindow;
            // Sets observable of the parks details to non visible
            vm.displayDetails(false);

            // Bounces marker on click
            if (this.marker.getAnimation() !== null) {
                this.marker.setAnimation(null);
            } else {
                this.marker.setAnimation(google.maps.Animation.BOUNCE);
                this.marker.setAnimation(4);
            }

        }
    }

    // Object for the weather info
    class currentWeather {
        constructor(data) {
            this.weatherIcon = data.weatherIcon || 'n/a';
            this.temperature = data.temperature || 'n/a';
            this.icon = '';

            // Sets icons depending on the weather
            if (this.weatherIcon === 'clear-day') {
                this.icon = 'resources/weatherIcons/sunny.png';
            } else if (this.weatherIcon === 'clear-night') {
                this.icon = 'resources/weatherIcons/clear-night.png';
            } else if (this.weatherIcon === 'cloudy') {
                this.icon = 'resources/weatherIcons/cloudy.png';
            } else if (this.weatherIcon === 'fog') {
                this.icon = 'resources/weatherIcons/fog.png';
            } else if (this.weatherIcon === 'partly-cloudy-day') {
                this.icon = 'resources/weatherIcons/partly-cloudy-day.png';
            } else if (this.weatherIcon === 'partly-cloudy-night') {
                this.icon = 'resources/weatherIcons/partly-cloudy-night.png';
            } else if (this.weatherIcon === 'rain') {
                this.icon = 'resources/weatherIcons/rain.png';
            } else if (this.weatherIcon === 'snow') {
                this.icon = 'resources/weatherIcons/light-snow.png';
            } else {
                this.icon = 'resources/weatherIcons/sunny.png';
            }
        }
    }

    // View Model
    function ViewModel() {
        const self = this;

        // Default value when loading the page
        yelpInfo('parks', 'San francsico');

        // Title observabables
        self.city = ko.observable();
        self.terms = ko.observable();
        self.title = ko.computed(() => `Top 10 ${this.terms()} in ${this.city()}`, this);

        // Observable of the current location
        self.activeLocation = ko.observable();

        // New location input observable
        self.input = ko.observable();

        // Set the new location and fetch data from yelp
        self.newLocation = function() {
            let location = self.input();
            self.activeLocation(location);
            yelpInfo('parks', self.activeLocation());
        };

        // Observable array of the weather information
        self.weathers = ko.observableArray([]);

        // Calls API for best parks
        self.parkTerm = function() {
            term = 'parks';
            yelpInfo(term, self.activeLocation());
        };

        // Calls API for best playgrounds
        self.playgroundTerm = function() {
            term = 'playgrounds';
            yelpInfo(term, self.activeLocation());
        };
        // Calls API for best hikes
        self.hikingTerm = function() {
            term = 'hikes';
            yelpInfo(term, self.activeLocation());
        };

        // Observable array of all the places
        self.placesList = ko.observableArray([]);

        // Observable of the query from the search bar
        self.query = ko.observable('');

        // Computed observable to filter the parks
        self.filteredData = ko.computed(function() {
            let filter = self.query().toLowerCase();

            // Sets all the markers as visible
            self.placesList().forEach(el => el.marker.setVisible(true));

            if (!filter) {
                // If the filter is not activate it return all the places
                return self.placesList();
            } else {
                // Only markers matching filter input of the park name will be visible
                return ko.utils.arrayFilter(self.placesList(), function(item) {
                    let nameMatch = item.name.toLowerCase().indexOf(filter) !== -1;
                    if (nameMatch === false) {
                        item.marker.setVisible(false);
                        closeInfoWindow();
                    }
                    return nameMatch;
                });
            }
        });

        // Displays or hides the parks list box
        self.displayList = ko.observable(true);

        // Displays or hides the details of a selected park
        self.displayDetails = ko.observable(false);

        // Parks's details info observable array
        self.detailsInfo = ko.observableArray([]);

        // Open info window and other details when a place is clicked from the HTML DOM list
        self.placeInfoBox = function(clickedPark) {

            // Open info window and bounce marker by calling method on placeObj
            clickedPark.handleClick();

            // Center map on marker click
            map.setCenter(clickedPark.marker.getPosition());

            // yelpDetails(clickedPark.id);

            // Empty detailsInfo observable array
            self.detailsInfo([]);
            // Pass data into observable array
            self.detailsInfo.push({
                name: clickedPark.name,
                text: clickedPark.text,
                image: clickedPark.userImage,
                url: clickedPark.url
            });

            // Displays the details of a place
            self.displayDetails(true);
        };

        // Gets data from yelp API
        function yelpInfo(term, location) {

            var cors_anywhere_url = 'https://cors-anywhere.herokuapp.com/';
            var yelp_url = `${cors_anywhere_url}https://api.yelp.com/v3/businesses/search?limit=10&term=${term}&location=${location}`;
            $.ajax({
                url: yelp_url,
                method: "GET",
                headers: {
                    "authorization": "Bearer [YELP API AUTHORIZATION TOKEN]",
                    "cache-control": "no-cache",
                    "postman-token": "855372a6-f97e-ea80-01e5-d526c86b54b2"
                },
            }).done(function(response){

                // Previous markers not visible and empty observables
                self.placesList().forEach(el => el.marker.setVisible(false));
                self.displayDetails(false);
                self.placesList([]);
                self.weathers([]);
                closeInfoWindow();

                // Sets the center of the map
                latMap = response.region.center.latitude;
                longMap = response.region.center.longitude;
                map.setCenter({
                    lat: latMap,
                    lng: longMap
                });
                // Declares the active location
                self.activeLocation(location);

                // Displays the weather
                weatherInfo(latMap, longMap);

                // Possible assignement letters
                const letterArr = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

                // Populates the PlaceObj with the relevant data
                const yelpData = response.businesses;
                
                for (i = 0; i < yelpData.length; i++) {
                    let id = yelpData[i].id;
                    let parkName = yelpData[i].name;
                    let street = yelpData[i].location.address1;
                    let city = yelpData[i].location.city;
                    let markerLat = yelpData[i].coordinates.latitude;
                    let markerLong = yelpData[i].coordinates.longitude;
                    let url = yelpData[i].url;
                    let rating = yelpData[i].rating;
                    let ratingImg = `./resources/ratingStars/small_${rating}.png`;
                    let reviewNum = yelpData[i].review_count;

                    // Assigns letter for each elements
                    let letter = letterArr.shift();

                    // Get reviews from yelp api for each business
                    yelpDetails(id, function(callback) {
                        let reviews = callback;
                        
                        console.log(reviews[0].userImage);

                        // Push object data into an observable array
                        self.placesList.push(new PlaceObj({
                            id: id,
                            name: parkName,
                            street: street,
                            city: city,
                            latitude: markerLat,
                            longitude: markerLong,
                            url: url,
                            rating: rating,
                            ratingImg: ratingImg,
                            reviewNum: reviewNum,
                            userName: reviews[0].userName,
                            userImage: reviews[0].userImage,
                            text: reviews[0].text,
                            term: term,
                            letter: letter
                        }));

                    });
                    // Sets data to a observable for the title computed observable
                    self.city(city);
                    self.terms(term);
                }
            }).fail(function(error){
                console.log("An error occured in getting Yelp data!");
            });
        }

            // Get yelp data by id
        function yelpDetails(businessId, callback) {
            var cors_anywhere_url = 'https://cors-anywhere.herokuapp.com/';
            var yelp_url = `${cors_anywhere_url}https://api.yelp.com/v3/businesses/${businessId}/reviews`;
            $.ajax({
                url: yelp_url,
                method: "GET",
                headers: {
                    "authorization": "Bearer iV2UxDakAzm43zMLyq_wPYJcwlOEbBkh4qBFf7nhIBFK1qlwaGh03naAecibIzIWcwzZKNcm4LE2UMCCcX-hEoNlLeAmH9-yrHoa7066MgC7HfDxA-NFEnFenO38WXYx",
                    "cache-control": "no-cache",
                    "postman-token": "855372a6-f97e-ea80-01e5-d526c86b54b2"
                }
            }).done(function(response){
                const yelpData = response.reviews;
                var data = [];
                
                for (i = 0; i < yelpData.length; i++) {
                    let userImage = yelpData[i].user.image_url;
                    let userName = yelpData[i].user.name;
                    let text = yelpData[i].text;

                    var obj = {
                        userImage,
                        userName,
                        text
                    }

                    data.push(obj);
                }
                // Return data
                callback(data);

            }).fail(function(error){
                console.log("An error occured in getting Yelp data!");
            });
        }
        

        // Gets the current waether from Dark Sky API (https://darksky.net)
        function weatherInfo(latitude, longitude) {

            // Uses the GET method for the request
            const httpMethod = 'GET';
            // API request url
            const darkSkyURL = `https://api.darksky.net/forecast/1b3811d9b82e836d5238991f3108fc90/${latitude},${longitude}`;

            // Ajax call
            $.ajax({
                url: darkSkyURL,
                dataType: "jsonp",
                timeout: 5000,
                success: function(response) {
                    let weather = response.currently.icon;
                    let temp = response.currently.temperature;

                    // Push a new object currentWeather into the weather observable array
                    self.weathers.push(new currentWeather({
                        weatherIcon: weather,
                        temperature: temp
                    }));
                },
                error: function(jqXHR, exception) {
                    // In case of error the temperature and icon are not displayed in the UI
                    document.getElementById('weather-display').style.display = 'none';
                    console.log(`Sorry, the current weather is not available right now. ${exception}: ${jqXHR.status}`);
                }
            });
        }
    } // End of ViewModel

    // View
    // Closes info window if one is already open
    function closeInfoWindow() {
        if (previousInfoWindow) {
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