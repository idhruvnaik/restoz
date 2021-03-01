'use strict';
angular.module('clmApp').controller('mainCtrl', ['$scope', '$rootScope', '$state', '$localStorage', '$uibModal', 'Idle', function ($scope, $rootScope, $state, $localStorage, $uibModal, Idle) {
    $scope.accountData = {};
    $scope.isAuthenticate = function () {
        if ($localStorage.api_key) {
            return true;
        }
        return false;
    };
    $scope.isAdmin = function () {
        if ($localStorage.user && $localStorage.user.is_head_nutritionist) {
            return true;
        } else {
            return false;
        }
    };
    $scope.isUserChanged = function () {
        if ($localStorage.selectedUser) {
            return true;
        }
        return false;
    }

    $scope.loadMasters = function () {
        if ($localStorage.api_key) {
            Data.getMastersData(function (result) {
                $scope.accountData = result.contents;
            }, function (error) {
                console.log(error);
            });
        }
    };
    $scope.loadMasters();
    $rootScope.$on('LOGIN', function (event, options) {
        $scope.loadMasters();
    });
    $scope.loginModal = function () {
        $uibModal.open({
            animation: true,
            keyboard: false,
            placement: 'bottom',
            windowClass: 'login-modal',
            size: 'lg',
            backdrop: 'static',
            templateUrl: 'views/loginModal.html',
            controller: 'AuthCtrl'
        }).result.then(function (result) {
            $rootScope.$broadcast('LOGIN');
            //                console.log(result);
            if (result.sign_in_count == 1) {
                $state.go('app.nutrical_tutorial');
            } else {
                $state.go('app.dashboard');
            }

        }, function () {

        });
    };

    $scope.signupModal = function () {
        $uibModal.open({
            animation: true,
            keyboard: false,
            placement: 'bottom',
            windowClass: 'login-modal',
            size: 'lg',
            backdrop: 'static',
            templateUrl: 'views/signupModal.html',
            controller: 'AuthCtrl'
        }).result.then(function () {

        }, function () {

        });
    };
    $scope.logout = function () {
        $localStorage.$reset();
        $state.go('app.home');
    };

    $rootScope.$watch(function () {
        return $localStorage.api_key ? true : false;
    }, function (newVal, oldVal) {
        if (newVal === true) {
            Idle.watch();
        } else if (newVal === false) {
            Idle.unwatch();
        }
    }, true);
    $scope.$on('IdleTimeout', function () {
        $scope.logout();
    });
    //------------service worker injection -----------------------//
    var protocol = window.location.protocol.replace(/:/g, '');
    window.addEventListener('load', function () {
        if (protocol === 'https' && navigator.serviceWorker) {
            navigator.serviceWorker.ready.then(function (registration) {
                console.log('Service Worker Ready');
            });
            navigator.serviceWorker.register('/service-worker.js').then(function (registration) {
                registration.onupdatefound = function () {
                    var installingWorker = registration.installing;
                    installingWorker.onstatechange = function () {
                        if (installingWorker.state === 'installed') {
                            if (navigator.serviceWorker.controller) {
                                console.log('New content is available; please refresh.');
                                location.reload();
                            } else {
                                console.log('Content is cached for offline use.');
                            }
                        }
                    };
                };
            }).catch(function (error) {
                console.error('Error during service worker registration:', error);
            });
        }

    });
}]).controller('AuthCtrl', ['$scope', '$uibModalInstance', 'Data', 'Notification', '$localStorage', function ($scope, $uibModalInstance, Data, Notification, $localStorage) {
    $scope.loginObj = {};
    $scope.signUpObj = {};
    $scope.requestAccess = function () {
        $scope.isProgress = true;
        Data.getUserLogin($scope.loginObj, function (result) {
            window.localStorage.clear();
            $localStorage.$reset();
            if (result.status == 'success') {
                $localStorage.user = result.contents;
                $localStorage.api_key = result.contents.api_key;
                window.localStorage.loggedInTime = new Date();
                $localStorage.account_Id = result.contents.account_id;
                $localStorage.currency = result.contents.currency;
                $uibModalInstance.close(result.contents);
            } else {
                //                    alert(result.message);
                $scope.isProgress = false;
            }

        }, function (error) {
            //                alert(error);
            $scope.isProgress = false;
        }
        );
    };
    $scope.signRestaurant = function () {
        $scope.isProgress = true;
        Data.signupRestaurant($scope.signUpObj, function (result) {
            $scope.isProgress = true;
        }, function (error) {
            console.log('error:', error);
        });
    };
}]);