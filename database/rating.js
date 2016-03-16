'use strict'
var mongoose = require('mongoose');

var ratingSchema = mongoose.Schema({
    rating: {type: Number, required: true},
    song_id: {type: mongoose.Schema.Types.ObjectId, required: true},
    user_username: {type: String, required: true}
});

module.exports = mongoose.model('rating', ratingSchema);