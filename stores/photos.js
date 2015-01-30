var PHOTO_PATH = 'https://api.flickr.com/services/rest/?method=flickr.photosets.getPhotos&api_key=efc8796c7f772d7c7855d7e88caf0e41&photoset_id=72157626579923453&extras=url_m%2C+url_l&per_page=9&format=json&nojsoncallback=1&api_sig=8040ec52c354fa072371ba63e690b661';

function mapResponse (res) {
    res.photo.map(function (photo) {
        return {
            title: photo.title,
            lrg: {
                url: photo.url_l,
                height: photo.height_l,
                width: photo.width_l
            },
            med: {
                url: photo.url_m,
                height: photo.height_m,
                width: photo.width_m
            }
        }
    });
}

function fetchPhotos (callback) {
    var req = new XMLHttpRequest();

    // Feature detection for CORS
    if ('withCredentials' in req) {
        req.open('GET', PHOTO_PATH, true);
        // Just like regular ol' XHR
        req.onreadystatechange = function() {
            if (req.readyState === 4) {
                if (req.status >= 200 && req.status < 400) {
                    callback(
                        null,
                        mapResponse(JSON.parse(req.responseText)))
                    );
                } else {
                    callback(req.status);
                }
            }
        };
        req.send();
    }
}
