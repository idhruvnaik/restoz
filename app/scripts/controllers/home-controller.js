/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

'use strict';
angular.module('clmApp').controller('homeCtrl', ['$scope', '$state', function ($scope, $state) {
    var preloaderFadeOutTime = 1500;
    function hidePreloader() {
        var preloader = $('.spinner-wrapper');
        setTimeout(function () {
            preloader.hide();
        }, 1500);
    }
    hidePreloader();

    $(window).on('scroll load', function () {
        if ($('.navbar').offset().top > 20) {
            $('.fixed-top').addClass('top-nav-collapse');
        } else {
            $('.fixed-top').removeClass('top-nav-collapse');
        }
    });

    $('.navbar-nav li a').on('click', function (event) {
        if (!$(this).parent().hasClass('dropdown'))
            $('.navbar-collapse').collapse('hide');
    });

    $('input, textarea').keyup(function () {
        if ($(this).val() != '') {
            $(this).addClass('notEmpty');
        } else {
            $(this).removeClass('notEmpty');
        }
    });

    $('#js-rotating').Morphext({
        // The [in] animation type. Refer to Animate.css for a list of available animations.
        animation: 'fadeIn',
        // An array of phrases to rotate are created based on this separator. Change it if you wish to separate the phrases differently (e.g. So Simple | Very Doge | Much Wow | Such Cool).
        separator: ',',
        // The delay between the changing of each phrase in milliseconds.
        speed: 2000,
        complete: function () {
            // Called after the entrance animation is executed.
        }
    });

    $(document).on('click', 'a.page-scroll', function (event) {
        var $anchor = $(this);
        $('html, body').stop().animate({
            scrollTop: $($anchor.attr('href')).offset().top
        }, 600, 'easeInOutExpo');
        event.preventDefault();
    });

    $('.navbar-nav li a').on('click', function (event) {
        if (!$(this).parent().hasClass('dropdown'))
            $('.navbar-collapse').collapse('hide');
    });

    $('.button, a, button').mouseup(function () {
        $(this).blur();
    });

    $('body').prepend('<a href="body" class="back-to-top page-scroll">Back to Top</a>');
}]);