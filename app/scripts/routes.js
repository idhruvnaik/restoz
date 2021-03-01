'use strict';
angular.module('routes', [])
    .config(['$stateProvider', '$urlRouterProvider', function ($stateProvider, $urlRouterProvider) {
        $stateProvider
            .state('app', {
                url: '',
                views: {
                    '': {
                        controller: ['$scope', function ($scope) { }],
                        templateUrl: 'views/main.html'
                    }
                }
            })
            .state('app.home', {
                url: '/',
                controller: 'homeCtrl',
                templateUrl: 'views/home.html',
                resolve: {
                    loadMyCtrl: ['$ocLazyLoad', function ($ocLazyLoad) {
                        return $ocLazyLoad.load('scripts/controllers/home-controller.js');
                    }]
                }
            });
        $urlRouterProvider.otherwise('/');
    }]);
