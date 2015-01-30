var PHOTO_PATH = 'https://api.flickr.com/services/rest/?method=flickr.photosets.getPhotos&api_key=efc8796c7f772d7c7855d7e88caf0e41&photoset_id=72157626579923453&extras=url_m%2C+url_l&per_page=9&format=json&nojsoncallback=1&api_sig=d02684deb150e314c092a5666a7727d4';

function mapResponse (res) {
    return res.photoset.photo.map(function (photo) {
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
                        mapResponse(JSON.parse(req.responseText))
                    );
                } else {
                    callback(req.status);
                }
            }
        };
        req.send();
    }
}

function listHtml (photos) {
    var container = document.createElement('div');
    var li = document.createElement('li');
    var anchor = document.createElement('a');
    var img = document.createElement('img');

    container.appendChild(li);
    li.appendChild(anchor);
    anchor.appendChild(img);

    return photos.map(function (p) {
        anchor.href = p.lrg.url;
        img.src = p.med.url;
        return container.innerHTML;
    }).join('\n');
}


fetchPhotos(function (err, photos) {
    if (err) console.error('Error fetching photos.');

    var list = document.getElementById('photo-list');
    list.innerHTML = listHtml(photos);
});
