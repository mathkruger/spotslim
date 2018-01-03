/*jslint browser: true*/
/*global SpotifyWebApi, Spotify, window, ons*/

var spotslim = (function () {
    'use strict';
    if (typeof SpotifyWebApi !== 'function') {
        throw 'spotify-web-api-js is not loaded.';
    }

    var spotify = new SpotifyWebApi();
    var myDevice;
    var curTracks = [];
    var infinityScrollCallback;
    var albumList;

    function getToken(callback) {
        var token = window.location.hash.substr(1).split('&')[0].split('=')[1];
        if (token) {
            if (callback) {
                callback(token);
            }
            return token;
        }
        window.location = 'https://accounts.spotify.com/authorize/?client_id=b7b9dd79c3fb44f2896a676b293e1e01&redirect_uri=' + window.location + '&response_type=token&scope=streaming%20user-read-birthdate%20user-read-email%20user-read-private%20user-library-read';

        return undefined;
    }

    function playTrack(e) {
        spotify.play(
            {
                context_uri: e.currentTarget.dataset.uri,
                device_id: myDevice.device_id
            }
        );
    }

    function addTrackItem(item, i, array) {
        var listItem = ons.createElement(
            '<ons-list-item tappable data-uri="' + item.album.uri + '">' +
                '<div class="left"><img class="list-item__thumbnail" src="' + item.album.images[0].url + '"></div>' +
                '<div class="center"><span class="list-item__title">' + item.album.name + '</span><span class="list-item__subtitle">' + item.album.artists[0].name + '</div>' +
            '</ons-list-item>'
        );
        listItem.addEventListener('click', playTrack, false);
        albumList.appendChild(listItem);
        if (infinityScrollCallback && i === array.length - 1) {
            infinityScrollCallback();
            infinityScrollCallback = null;
        }
    }

    function listAlbums(error, data) {
        if (!error) {
            curTracks = curTracks.concat(data.items);
            data.items.forEach(addTrackItem);
        }
    }

    function loadMoreAlbums(callback) {
        infinityScrollCallback = callback;
        spotify.getMySavedAlbums({offset: curTracks.length}, listAlbums);
    }

    function initApi(device) {
        myDevice = device;
        spotify.setAccessToken(getToken());
        spotify.getMySavedAlbums(null, listAlbums);
    }

    function updatePlayer(playbackState) {
        document.getElementById('player-title').textContent = playbackState.track_window.current_track.name + ' - ' + playbackState.track_window.current_track.artists[0].name;
    }

    function initPlayer() {
        var player = new Spotify.Player({
            name: 'SpotSlim',
            getOAuthToken: getToken
        });

        player.on('ready', initApi);
        player.on('player_state_changed', updatePlayer);

        player.connect();
    }

    function init() {
        albumList = document.getElementById('album-list');
        window.onSpotifyWebPlaybackSDKReady = initPlayer;
    }

    return {
        init: init,
        loadData: loadMoreAlbums
    };
}());

if (typeof ons === 'object') {
    ons.ready(spotslim.init);
} else {
    throw 'Onsen is not loaded';
}
