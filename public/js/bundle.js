/**
 * Environment variable object
 */
var env = {
    FLICKR_KEY: '47cd2133406a258aa24cf785547ffac5',
    FLICKR_HOST: 'https://api.flickr.com',

    PHOTOSET: '72157626579923453',
    PER_PAGE: 9,

    currentIndex: 0,
    photoSet: []
};

/**
 * Normalize response in to standard object incase I want to mess
 * around with other APIs.
 *
 * @param {object} res – XMLHttpRequest response object.
 */
function mapResponse (res) {
    return res.photoset.photo.map(function (photo, i) {
        return {
            index: i,
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

var PHOTO_API_PATH =
    env.FLICKR_HOST +
    '/services/rest/?method=flickr.photosets.getPhotos&' +
    'api_key=' + env.FLICKR_KEY + '&' +
    'photoset_id=' + env.PHOTOSET + '&extras=url_m%2C+url_l&' +
    'per_page=' + env.PER_PAGE + '&format=json&nojsoncallback=1&';

/**
 * Async request to photo API.
 *
 * @prop {function} callback - Called w/ err, photos.
 */
function fetchPhotos (callback) {
    var req = new XMLHttpRequest();

    function onResponse (req) {
        if (req.status >= 200 && req.status < 400) {
            callback(
                null,
                mapResponse(JSON.parse(req.responseText))
            );
        } else {
            callback(req.status);
        }
    }

    // Feature detection for CORS
    if ('withCredentials' in req) {
        req.open('GET', PHOTO_API_PATH, true);
        // Just like regular ol' XHR
        req.onreadystatechange = function() {
            if (req.readyState === 4) onResponse(req);
        };

        req.onerror = onResponse; // error handled in onResponse

        req.send();
    }
}

function loadImg (src, callback) {
    callback = (typeof callback === 'function') ? callback : function () {};

    var el = new Image();

    el.onload = function () { callback(null, el); }
    el.onerror = function (err) { callback(err, el); }

    el.src = src;
}

/**
 * Render list of photos. Each photo object is mapped to
 * `li` elements.
 *
 * @param {array} photos - Array of photos from `fetchPhotots`.
 */
function listHtml (photos) {
    var container = document.createElement('div');
    var li = document.createElement('li');
    var anchor = document.createElement('a');
    var img = document.createElement('img');

    container.appendChild(li);
    li.appendChild(anchor);
    anchor.appendChild(img);

    return photos.map(function (p) {
        li.dataset.index = p.index;
        anchor.href = p.lrg.url;
        img.src = p.med.url;
        return container.innerHTML;
    }).join('\n');
}

/**
 * Initializes lightbox with provided img.
 *
 * @param {object} img - Image object to initialize with.
 */
var lightbox = (function lightbox () {
    var ACTIVE_CLASS = 'is-active';
    var LOADING_CLASS = 'is-loading';

    var el = document.getElementById('lightbox');
    var activeImg = document.getElementById('active-photo-img');
    var activeTitle = document.getElementById('active-photo-title');

    el.addEventListener('click', function (e) {
        if (e.target.classList.contains('js-close-lightbox')) {
            el.classList.remove(ACTIVE_CLASS);
            setTimeout(function () {
                activeImg.src = '/images/blank.gif'; // prevent invalid img border
                activeTitle.innerText = '';
                el.classList.remove(LOADING_CLASS);
            }, 80);
        }
    });

    return function (img) {
        env.currentIndex = img.index;

        loadImg(img.lrg.url, function (err, _img) {
            activeTitle.innerText = img.title;
            activeImg.src = _img.src;

            setTimeout(function () {
                el.classList.remove(LOADING_CLASS);
            }, 80);
        });

        el.classList.add(LOADING_CLASS, ACTIVE_CLASS);
    }
})();

/**
 * Photo list view that handles img selection.
 *
 * @param {object} el - View root element. Should contain `ul.photo-list`.
 * @param {object} opts - View options.
 *   - onSelect: Callback triggered when an image is selected. A img object is
 *               the only argument passed in.
 */
function photoList (el, opts) {
    var list = document.getElementById('photo-list');
    list.innerHTML = listHtml(opts.photos);

    el.addEventListener('click', function (e) {
        var index = e.target.parentNode.parentNode.dataset.index;

        if (typeof opts.onSelect === 'function') {
            opts.onSelect(opts.photos[index]);
        }

        e.preventDefault();
    }, true);
}

/**
 * Blastoff
 */
fetchPhotos(function (err, photos) {
    if (err) console.error('Error fetching photos.');

    env.photoSet = photos;

    photoList(document.getElementById('photos'), {
        photos: photos,
        onSelect: function (img) { lightbox(img); }
    });
});
