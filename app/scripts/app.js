'use strict';
angular.module('clmApp', ['ui.router', 'oc.lazyLoad', 'ui.bootstrap', 'ui-notification', 'ngStorage', 'angular-loading-bar', 'ui.tinymce', 'ngIdle', 'checklist-model', 'monospaced.qrcode', 'routes', 'ngAnimate', 'ngFileUpload', 'ui.select2'])
    .config(['$locationProvider', function ($locationProvider) {
        $locationProvider.html5Mode(true);
    }])
    .run(['$localStorage', function ($localStorage) {

    }]);