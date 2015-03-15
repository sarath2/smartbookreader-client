'use strict';

var api = angular.module('service.api', []);


api.factory('userService', function ($http, serverOptions) {
	return {
		activity: function (callback) {
			$http({
				method: 'GET',
				url: serverOptions.getUrl() + '/user/activity'
			}).success(function (response, status, headers, config) {
				callback(response.result);
			});
		},
		books: function (callback) {
			$http({
				method: 'GET',
				url: serverOptions.getUrl() + '/user/word-lookup/books'
			}).success(function (response, status, headers, config) {
				callback(response.result);
			});
		},
		wordLookups: function (callback) {
			$http({
				method: 'GET',
				url: serverOptions.getUrl() + '/user/word-lookup'
			}).success(function (response, status, headers, config) {
				callback(response.result);
			});
		}
	}
});

api.factory('dictionaryService', function ($http, serverOptions) {
	return {
		definition: function (word, callback) {
			$http({
				method: 'GET',
				url: serverOptions.getUrl() + '/dictionary/' + word
			}).success(function (response, status, headers, config) {
				callback(response);
			});
		}
	}
});

api.factory('statsService', function ($http, serverOptions) {
	return {
		played: function (game, callback) {
			$http({
				method: 'POST',
				url: serverOptions.getUrl() + '/games/stats/played/' + game
			}).success(function (response, status, headers, config) {
				callback(response);
			});
		},
		getPlayed: function (game, callback) {
			$http({
				method: 'GET',
				url: serverOptions.getUrl() + '/games/stats/played/' + game
			}).success(function (response, status, headers, config) {
				callback(response);
			});
		}
	}
});

api.factory('synonymaService', function ($http, serverOptions) {
	return {
		getQuestions: function (level, count, callback) {
			$http({
				method: 'GET',
				url: serverOptions.getUrl() + '/games/synonyma/question/' + level + '/' + count
			}).success(function (response, status, headers, config) {
				callback(response);
			});
		},
		saveQuestion: function (word, time, result, callback) {
			$http({
				url: serverOptions.getUrl() + '/games/synonyma/response',
				method: "POST",
				data: {
					word: word,
					time: time,
					result: result
				}
			}).
			success(function (response) {
				callback(true, response);
			}).error(function (response) {
				callback(false, response);
			});
		}
	}
});

api.factory('wordLookupService', function ($http, serverOptions) {
	return {
		save: function (word, callback) {
			$http({
				url: serverOptions.getUrl() + "/word-lookup/" + word.word_lookup_id,
				method: "POST",
				data: word
			}).success(function (data, status, headers, config) {
				callback(true);
			});
		},
		delete: function (id, callback) {
			$http({
				method: 'DELETE',
				url: serverOptions.getUrl() + '/word-lookup/' + id
			}).success(function (response, status, headers, config) {
				callback(response);
			});
		}
	}
});

api.factory('member', function ($http, serverOptions) {
	return {
		login: function (user, callback) {
			$http({
				url: serverOptions.getUrl() + '/member/login',
				method: "POST",
				data: user
			}).
			success(function (response) {
				callback(true, response);
			}).error(function (response) {
				callback(false, response);
			});
		},
		logout: function (callback) {
			$http({
				url: serverOptions.getUrl() + '/member/logout',
				method: "POST"
			}).
			success(function (response) {
				callback(true, response);
			}).error(function (response) {
				callback(false, response);
			});
		},
		register: function (user, callback) {
			$http({
				url: serverOptions.getUrl() + '/member/register',
				method: "POST",
				data: user
			}).
			success(function (response) {
				callback(true, response);
			}).error(function (response) {
				callback(false, response);
			});
		},
		forgot: function (email, callback) {
			$http({
				url: serverOptions.getUrl() + '/member/forgot',
				method: "POST",
				data: {
					user_email: email
				}
			}).
			success(function (response) {
				callback(true, response);
			}).error(function (response) {
				callback(false, response);
			});
		},
		getOaut: function (data, callback) {
			$http({
				url: serverOptions.getUrl() + '/member/getOaut',
				method: "POST",
				data: data
			}).
			success(function (response) {
				callback(true, response);
			}).error(function (response) {
				callback(false, response);
			});
		},
		loginoauth: function (data, callback) {
			$http({
				url: serverOptions.getUrl() + '/member/loginoauth',
				method: "POST",
				data: data
			}).
			success(function (response) {
				callback(true, response);
			}).error(function (response) {
				callback(false, response);
			});
		}
	};
});
api.factory('gDriveReadService', function ($http, serverOptions) {
	return {
		list: function (callback) {
			$http({
				method: 'GET',
				url: serverOptions.getUrl() + '/readGdrive'
			}).success(function (response, status, headers, config) {
				callback(response);
			});
		},
		download: function (data, callback) {
			$http({
				method: 'POST',
				url: serverOptions.getUrl() + '/downloadGdrive',
				data: data
			}).success(function (response, status, headers, config) {
				callback(response);
			});
		}
	}
});
api.factory('categoryService', function ($http, serverOptions) {
	return {
		getTrendingCategories: function (callback) {
			$http({
				method: 'GET',
				url: serverOptions.getUrl() + '/trending-category'
			}).success(function (response, status, headers, config) {
				callback(response.result);
			});
		},
		getMyPopularCategories: function (callback) {
			$http({
				method: 'GET',
				url: serverOptions.getUrl() + '/my-populer-category'
			}).success(function (response, status, headers, config) {
				callback(response.result);
			});
		},
		usersForCategories: function (callback) {
			$http({
				method: 'GET',
				url: serverOptions.getUrl() + '/category-users'
			}).success(function (response, status, headers, config) {
				callback(response.result);
			});
		},
		usersForCategoriesNAge: function (callback) {
			$http({
				method: 'GET',
				url: serverOptions.getUrl() + '/category-age-levels'
			}).success(function (response, status, headers, config) {
				callback(response.result);
			});
		},
		userTimeSpentCategoryAge: function (callback) {
			$http({
				method: 'GET',
				url: serverOptions.getUrl() + '/timespent-age-levels'
			}).success(function (response, status, headers, config) {
				callback(response.result);
			});
		},
		wordLookupsTimeSpent: function (callback) {
			$http({
				method: 'GET',
				url: serverOptions.getUrl() + '/word-lookups-timespent'
			}).success(function (response, status, headers, config) {
				callback(response.result);
			});
		}
	}
});
api.factory('adminService', function ($http, serverOptions) {
	return {
		userInfo: function (callback) {
			$http({
				method: 'GET',
				url: serverOptions.getUrl() + '/admin'
			}).success(function (response, status, headers, config) {
				callback(response.result);
			});
		}
	}
});