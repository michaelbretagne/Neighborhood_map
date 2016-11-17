var places = [
    {
        name: "Huntington Park",
        street: "California St & Cushman St",
        city : "San Francisco"
    },
    {
        name: "Lafayette Park",
        street: "Gough and Sacremento St",
        city: "San Francisco"
    }];

var park = function(data) {
    this.name = ko.observable(data.name);
};

var ViewModel = function() {
    var self = this;

    this.parkList = ko.observableArray([]);

    places.forEach(function(place) {
        self.parkList.push(new park(place));
    });

};

ko.applyBindings(new ViewModel());