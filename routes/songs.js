var express = require('express');
var _ = require('lodash');
var router = express.Router();
var SongService = require('../services/songs');
var UserService = require('../services/users');
var RatingService = require('../services/rating');

var verifyIsAdmin = function(req, res, next) {
    if (req.isAuthenticated() && req.user.username === 'admin') {
        return next();
    }
    else {
        res.status(403).send({err: 'Current user can not access to this operation'});
    }
};

router.get('/', function(req, res) {
    if (req.accepts('text/html') || req.accepts('application/json')) {

        var result = {};

        if(req.query.category || req.query.keywords){
            switch(req.query.category){
                case 'title':
                result = {title: req.query.keywords};
                break;
                case 'album':
                result = {album: req.query.keywords};
                break;
                case 'artist':
                result = {artist: req.query.keywords};
                break;
                case 'year':
                result = {year: req.query.keywords};
                break;
                case 'bpm':
                result = {bpm: req.query.keywords};
                break;
            }
        }

        SongService.find(result)
            .then(function(songs) {
                if (req.accepts('text/html')) {
                    return res.render('songs', {songs: songs});
                }
                if (req.accepts('application/json')) {
                    res.status(200).send(songs);
                }
            })
        ;
    }
    else {
        res.status(406).send({err: 'Not valid type for asked ressource'});
    }
});

router.get('/add', function(req, res) {
    var song = (req.session.song) ? req.session.song : {};
    var err = (req.session.err) ? req.session.err : null;
    if (req.accepts('text/html')) {
        req.session.song = null;
        req.session.err = null;
        return res.render('newSong', {song: song, err: err});
    }
    else {
        res.status(406).send({err: 'Not valid type for asked ressource'});
    }
});

router.post('/:id/rating', function(req, res) {
    // var addRating = {
    //     song_id: req.params.id,
    //     user_name: req.user.username,
    //     rating: req.query.rating,
    // }
    req.body.song_id = req.params.id;
    req.body.user_username = res.locals.user_name;

    RatingService.createRating(req.body)
        .then(function(rating) {
            if (req.accepts('text/html')) {
                return res.redirect('/songs/' + rating.song_id);
            }
            if (req.accepts('application/json')) {
                return res.status(201).send(song);
            }
        })
        .catch(function(err) {
            res.status(500).send(err);
        })
    ;
});

router.post('/:id/favorites', function(req, res) {
    UserService.addFavoritesToUser(req.user._id, req.params.id)
        .then(function(user) {
            req.logIn(user, function(error) {
                if (!error) {
                    if (req.accepts('text/html')) {
                        return res.redirect("/songs/" + req.params.id);
                    }
                    if (req.accepts('application/json')) {
                        res.status(201).send(user);
                    }
                }
            });
        })
        .catch(function(err) {
            res.status(500).send(err);
        })
    ;
});

router.get('/:id', function(req, res) {
    if (req.accepts('text/html') || req.accepts('application/json')) {
        SongService.findOneByQuery({_id: req.params.id})
            .then(function(song) {
                if (!song) {
                    res.status(404).send({err: 'No song found with id' + req.params.id});
                    return;
                }
                if (req.accepts('text/html')) {
                    var favorites = (req.user.favoriteSongs.indexOf(String(song._id)) >= 0);
                    RatingService.findOneByQuery({song_id: song._id, user_username: res.locals.user_name})
                        .then(function(rating){
                            if (!rating) {
                                return res.render('song', {song: song, rating: 0, favorites: favorites});
                            }
                            if (req.accepts('text/html')) {
                                return res.render('song', {song: song, rating: rating, favorites: favorites});
                            }
                            if (req.accepts('application/json')) {
                                return res.send(200, song);
                            }
                        })
                        .catch(function(err) {
                            return render('song', {song: song, rating: 0, favorites: favorites});
                        })
                    ;
                    return;
                }
                if (req.accepts('application/json')) {
                    return res.send(200, song);
                }
            })
            .catch(function(err) {
                console.log(err);
                res.status(500).send(err);
            })
        ;
    }
    else {
        res.status(406).send({err: 'Not valid type for asked ressource'});
    }
});

router.get('/artist/:artist', function(req, res) {
    SongService.find({artist: {$regex: req.params.artist, $options: 'i'}})
        .then(function(songs) {
            res.status(200).send(songs);
        })
        .catch(function(err) {
            console.log(err);
            res.status(500).send(err);
        })
    ;
});

var songBodyVerification = function(req, res, next) {
    var attributes = _.keys(req.body);
    var mandatoryAttributes = ['title', 'album', 'artist'];
    var missingAttributes = _.difference(mandatoryAttributes, attributes);
    if (missingAttributes.length) {
        res.status(400).send({err: missingAttributes.toString()});
    }
    else {
        if (req.body.title && req.body.album && req.body.artist) {
            next();
        }
        else {
            var error = mandatoryAttributes.toString() + ' are mandatory';
            if (req.accepts('text/html')) {
                req.session.err = error;
                req.session.song = req.body;
                res.redirect('/songs/add');
            }
            else {
                res.status(400).send({err: error});
            }
        }
    }
};

router.post('/', verifyIsAdmin, songBodyVerification, function(req, res) {
    SongService.create(req.body)
        .then(function(song) {
            if (req.accepts('text/html')) {
                return res.redirect('/songs/' + song._id);
            }
            if (req.accepts('application/json')) {
                return res.status(201).send(song);
            }
        })
        .catch(function(err) {
            res.status(500).send(err);
        })
    ;
});

router.delete('/', verifyIsAdmin, function(req, res) {
    SongService.deleteAll()
        .then(function(songs) {
            res.status(200).send(songs);
        })
        .catch(function(err) {
            res.status(500).send(err);
        })
    ;
});

router.get('/edit/:id', verifyIsAdmin, function(req, res) {
    var song = (req.session.song) ? req.session.song : {};
    var err = (req.session.err) ? req.session.err : null;
    if (req.accepts('text/html')) {
        SongService.findOneByQuery({_id: req.params.id})
            .then(function(song) {
                if (!song) {
                    res.status(404).send({err: 'No song found with id' + req.params.id});
                    return;
                }
                return res.render('editSong', {song: song, err: err});
            })
        ;
    }
    else {
        res.status(406).send({err: 'Not valid type for asked ressource'});
    }
});

router.put('/:id', verifyIsAdmin, function(req, res) {
    SongService.updateSongById(req.params.id, req.body)
        .then(function (song) {
            if (!song) {
                res.status(404).send({err: 'No song found with id' + req.params.id});
                return;
            }
            if (req.accepts('text/html')) {
                return res.redirect('/songs/' + song._id);
            }
            if (req.accepts('application/json')) {
                res.status(200).send(song);
            }
        })
        .catch(function (err) {
            res.status(500).send(err);
        })
    ;
});

router.delete('/:id', verifyIsAdmin, function(req, res) {
    SongService.removeAsync({_id: req.params.id})
        .then(function() {
            res.status(204);
        })
        .catch(function(err) {
            res.status(500).send(err);
        })
    ;
});

module.exports = router;