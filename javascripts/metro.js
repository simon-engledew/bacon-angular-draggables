/*jslint indent: 2, browser: true, unparam: true */

(function (angular) {
  'use strict';

  angular.module('bacon', []).factory('Bacon', ['$window', function ($window) {
    return $window.Bacon;
  }]);
  angular.module('jquery', []).factory('jQuery', ['$window', function ($window) {
    return $window.jQuery;
  }]);

  angular.
    module('metro', ['bacon', 'jquery']).
    controller('MapController', ['$scope', 'Bacon', '$window', '$http', function ($scope, $Bacon, $window, $http) {
      this.selected = null;
      this.stations = [];

      var self = this,
        canvas = $window.document.querySelector('.tracks'),
        ctx = canvas.getContext('2d');

      $http.get('/data/stations.json').success(function (data) {
        self.stations = data;
      });

      $scope.$on('station:selected', function (event, data) {
        self.selected = data;
      });

      (function draw() {
        ctx.canvas.width = $window.innerWidth;
        ctx.canvas.height = $window.innerHeight;
        ctx.beginPath();
        ctx.strokeStyle = '#56CDFC';
        ctx.lineWidth = 5;
        $Bacon.fromArray(self.stations).slidingWindow(2).onValue(function (stations) {
          if (stations[0]) {
            ctx.moveTo(stations[0].position.x, stations[0].position.y);
          }
          if (stations[1]) {
            ctx.lineTo(stations[1].position.x, stations[1].position.y);
          }
        });
        ctx.stroke();
        $window.requestAnimationFrame(draw);
      }());
    }]).
    //
    directive('station', ['$document', 'jQuery', function ($document, $jQuery) {
      function pointFromEvent(v) {
        return {
          x: v.clientX,
          y: v.clientY
        };
      }

      return {
        restrict: 'E',
        templateUrl: '/views/station.html',
        link: function (scope, element, attrs) {
          var mousedowns = $jQuery(element).asEventStream('mousedown'),
            mouseups = $jQuery(element).asEventStream('mouseup'),
            mousemoves = $jQuery($document).asEventStream('mousemove').map(pointFromEvent).skipDuplicates(),
            drags = mousedowns.flatMap(function () {
              return mousemoves.takeUntil(mouseups);
            });

          mousedowns.onValue(function (point) {
            scope.$emit('station:selected', scope.station);
          });

          drags.onValue(function (point) {
            scope.$emit('station:position', point);
          });
        },
        controller: ['$scope', function ($scope) {
          $scope.$on('station:position', function (event, data) {
            $scope.$apply(function () {
              $scope.station.position.x = data.x;
              $scope.station.position.y = data.y;
            });
          });
        }],
        controllerAs: 'stationController'
      };
    }]);
}(window.angular));