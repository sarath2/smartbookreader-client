'use strict';

var server = {
	mode: 'local',
	url: 'http://localhost:3000'
};
// var server = {mode: 'server', url: 'http://smart-read-api.aws.af.cm'};
chrome.storage.local.set({
	'server': server
}, function () {});

var mainApp = angular.module('mainApp', ['service.api', 'service.session', 'service.outsider', 'service.analysis', 'service.utility', 'service.options', 'ui.bootstrap', 'highcharts-ng', 'ngCookies', 'ngRoute', 'googleOauth', 'flow','ngTable']);

mainApp.config(function ($routeProvider, $httpProvider) {

	//================================================
	// Add an interceptor for AJAX errors
	//================================================
	$httpProvider.responseInterceptors.push(function ($q, $location) {
		return function (promise) {
			return promise.then(
				// Success: just return the response
				function (response) {
					return response;
				},
				// Error: check the error status to get only the 401
				function (response) {
					var requestedUrl = response.config.url;

					if (response.status === 401)
						$location.url('/login');

					else if (response.status === 500) {
						mainApp.INTERCEPTOR_ERROR = response;
						$location.url('/error/internal');
					} else if (response.status === 404 && requestedUrl.indexOf(server.url) != -1) {
						mainApp.INTERCEPTOR_ERROR = response;
						$location.url('/error/server-down');
					}

					return $q.reject(response);
				}
			);
		}
	});
	//================================================

	$httpProvider.defaults.withCredentials = true;

	$routeProvider
		.when('/admin', {
			templateUrl: 'views/admin.html',
			controller: 'adminCtrl',
			resolve: {
				user: mainApp.resolveUser
			}
		})	
		.when('/dashboard', {
			templateUrl: 'views/dashboard.html',
			controller: 'DashboardCtrl',
			resolve: {
				user: mainApp.resolveUser
			}
		})
		.when('/games', {
			templateUrl: 'views/games.html',
			controller: 'GamesCtrl',
			resolve: {
				user: mainApp.resolveUser
			}
		})
		.when('/contact', {
			templateUrl: 'views/contact.html',
			controller: 'ContactCtrl',
			resolve: {
				user: mainApp.resolveUser
			}
		})
		.when('/word-lookup', {
			templateUrl: 'views/word-lookup.html',
			controller: 'WordLookupCtrl',
			resolve: {
				user: mainApp.resolveUser
			}
		})
		.when('/gdrive-upload', {
			templateUrl: 'views/gdrive-upload.html',
			controller: 'GDriveReadCtrl',
			resolve: {
				user: mainApp.resolveUser
			}
		})
		.when('/gdrive-read', {
			templateUrl: 'views/gdrive-files.html',
			controller: 'GDriveReadCtrl',
			resolve: {
				user: mainApp.resolveUser
			}
		})
		.when('/games/word-lookup-quiz', {
			templateUrl: 'views/games/word-lookup-quiz.html',
			controller: 'WordLookupQuizCtrl',
			resolve: {
				user: mainApp.resolveUser
			}
		})
		.when('/games/synonyma', {
			templateUrl: 'views/games/synonyma.html',
			controller: 'SynonymaCtrl',
			resolve: {
				user: mainApp.resolveUser
			}
		})


	.when('/login', {
		templateUrl: 'views/member/login.html',
		controller: 'LoginCtrl'
	})
		.when('/logout', {
			templateUrl: 'views/member/logout.html',
			controller: 'LogoutCtrl'
		})
		.when('/register', {
			templateUrl: 'views/member/register.html',
			controller: 'RegisterCtrl'
		})
		.when('/forgot', {
			templateUrl: 'views/member/forgot.html',
			controller: 'ForgotCtrl'
		})

	.when('/error/:type', {
		templateUrl: 'views/error.html',
		controller: 'ErrorCtrl',
		resolve: {
			user: mainApp.resolveUser
		}
	})

	.otherwise({
		redirectTo: '/dashboard'
	});
});

// EXTEND Classes here
mainApp.config(function ($routeProvider) {

	// check if dates are the same
	// it only checks: (day, month and year)
	Date.prototype.sameDateAs = function (pDate) {
		return ((this.getFullYear() == pDate.getFullYear()) && (this.getMonth() == pDate.getMonth()) && (this.getDate() == pDate.getDate()));
	}

});

mainApp.run(function ($rootScope) {
	$rootScope.server = server;
});

mainApp.resolveUser = function ($q, $route, $rootScope, $location, session) {
	var defer = $q.defer();

	// if already have $rootScope.user, just return it
	if ($rootScope.user) {
		defer.resolve($rootScope.user);
	}

	// otherwise check if chrome storage has user session info
	else {
		session.check(function (user) {
			// if it has, then return it
			if (user)
				defer.resolve(user);

			// otherwise, redirect to login
			else {
				defer.reject();
				$location.path('/login');
			}
		});
	}

	return defer.promise;
};

mainApp.filter('oneZeroToYesNo', function () {
	return function (input) {
		return input == 1 ? 'Yes' : 'No';
	};
});

mainApp.filter('oneZeroToSuccessFail', function () {
	return function (input) {
		return input == 1 ? 'Success' : 'Fail';
	};
});
// Google Oauth config
mainApp.config(function (TokenProvider) {
	TokenProvider.extendConfig({
		accessType: 'online',
		clientId: '849237012838-10la8vn95sudo06v2ch6d8gc3jlf9fva.apps.googleusercontent.com',
		redirectUri: server.url + '/googleauth',
		scopes: ["https://www.googleapis.com/auth/userinfo.email", "https://www.googleapis.com/auth/plus.me", "https://www.googleapis.com/auth/drive.file"],
		state: 'smart-reader',
		responseType: 'code',
		prompt :'select_account'
	});
});

// File upload config
mainApp.config(['flowFactoryProvider',
	function (flowFactoryProvider) {
		flowFactoryProvider.defaults = {
			target: server.url + '/uploadtodrive',
			permanentErrors: [404, 500, 501],
			maxChunkRetries: 1,
			chunkRetryInterval: 500000,
			simultaneousUploads: 4
		};
		flowFactoryProvider.on('catchAll', function (event) {
			console.log('catchAll', arguments);
		});
}]);