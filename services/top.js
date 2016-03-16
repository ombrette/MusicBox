var Promise = require( 'bluebird' );
var Notes = Promise.promisifyAll(require('../database/rating'));
var Songs = Promise.promisifyAll(require('../database/songs'));
var _= require('lodash');

exports.getTop5SongsByNotes = function(){
	var notesSongs = [];
	return Notes.aggregateAsync([
			{$group: {_id: "$song_id", avgNote: { $avg: "$rating"}}},
			{$sort: {avgNote: -1}},
			{$limit: 5}
		])
		. then(function(notes){
			var ids = _.map (notes, '_id');
			notesSongs = notes;
			return Songs.find ({_id: {$in: ids}});
		})
		. then(function(songs){
			return _.map(notesSongs, function(n){
				var note = _.clone (n);
				note.song = _.find (songs, {_id: n._id});
				return note;
			});
		})
	;
};

