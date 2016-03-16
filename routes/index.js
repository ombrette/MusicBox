var express = require('express');
var router = express.Router();
var SongService = require('../services/songs');
var TopService = require('../services/top');


/* GET home page. */
router.get('/', function(req, res, next) {
  if (req.accepts('text/html') || req.accepts('application/json')) {
        TopService.getTop5SongsByNotes(req.query || {})
            .then(function(songs) {
                if (req.accepts('text/html')) {
                    return res.render('index', {top: songs});
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

module.exports = router;
