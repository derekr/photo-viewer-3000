/**
 * Environment variable object
 */
var env = {
    FLICKR_KEY: '47cd2133406a258aa24cf785547ffac5',
    FLICKR_HOST: 'https://api.flickr.com',

    PHOTOSET: '72157626579923453',
    PER_PAGE: 9,

    currentIndex: 0,
    photoSet: [],
    lightboxActive: false
};

/**
 * Proxy for updating history. Really this just updates the url hash
 * since this is being hosted on github pages and I can't do server
 * side routing.
 *
 * @param {number} index - Index of requested photo.
 */
function pushState (index) {
    location.hash = index;
}

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

/**
 * Prefetches src and fires callback when image is loaded.
 *
 * @param {string} src - Path to image resource.
 * @param {function} callback - Fired when image loads w/ [err, img].
 */
function loadImg (src, callback) {
    callback = (typeof callback === 'function') ? callback : function () {};

    var el = new Image();

    el.onload = function () { callback(null, el); }
    el.onerror = function (err) { callback(err, el); }

    el.src = src;
}

/**
 * Load all image paths and fire callback once all have loaded.
 *
 * @param {array} images - Array of image path strings.
 * @param {function} callback - Fired when all images have loaded [err, img].
 */
function loadAllImg (images, callback) {
    var total = images.length;
    var result = [];

    for (i = 0; i < total; i++) {
        loadImg(images[i], function (err, img) {
            if (err) return callback(err);
            result.push(img);
            if (i === total) {
                setTimeout(function () {
                    callback(null, result);
                }, 200)
            }
        });
    }
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

    var loadingMsgDelay = 80;
    var loadingImgDelay = 100;

    return photos.map(function (p, i) {
        li.dataset.index = p.index;
        anchor.href = p.lrg.url;
        img.src = p.med.url;
        anchor.style.transitionDelay = loadingMsgDelay + (loadingImgDelay * i) + 'ms';
        return container.innerHTML;
    }).join('\n');
}

/**
 * Will update the current light box photo from the current index
 * based on the provided step. If the provided step is out of bounds
 * the calculated index will wrap within available photoSet.
 *
 * ex stepLightbox(1) // moves forward one photo in the set
 * ex stepLightbox(-2) // moves back two photos in the set
 *
 * @param {number} step - Positive or negative desired offset.
 */
function stepLightbox (step) {
    step = parseInt(step, 10);
    var targetIndex = env.currentIndex + step;
    var lastIndex = env.photoSet.length - 1;
    if (targetIndex < 0) targetIndex = lastIndex;
    if (targetIndex > lastIndex) targetIndex = 0;

    lightbox(env.photoSet[targetIndex]);
}

/**
 * Binds event listener on document body and handles arrow key navigation
 * for the photo lightbox.
 */
function bindArrowStep () {
    var keyMap = {
        37: -1,
        39: 1
    };
    document.body.addEventListener('keyup', function (e) {
        var step = keyMap[e.which];
        if (typeof step === 'undefined') return;

        stepLightbox(step);
    });
}

/**
 * Initializes lightbox with provided img.
 *
 * @param {object} img - Image object to initialize with.
 */
var lightbox = (function createLightboxFn () {
    var ACTIVE_CLASS = 'is-active';
    var LOADING_CLASS = 'is-loading';

    var el = document.getElementById('lightbox');
    var activeImg = document.getElementById('active-photo-img');
    var activeTitle = document.getElementById('active-photo-title');

    el.addEventListener('click', function (e) {
        if (!e.target.classList.contains('js-close-lightbox')) return;

        el.classList.remove(ACTIVE_CLASS);
        env.lightboxActive = false;
        setTimeout(function () {
            activeImg.src = '/images/blank.gif'; // prevent invalid img border
            activeTitle.innerHTML = '';
            el.classList.remove(LOADING_CLASS);
        }, 80);
    });

    el.addEventListener('click', function (e) {
        if (!e.target.classList.contains('js-photo-nav')) return;
        e.preventDefault();
        stepLightbox(e.target.dataset.step);
    });

    return function _lightbox (img) {
        env.currentIndex = img.index;

        loadImg(img.lrg.url, function (err, _img) {
            if (err) return console.error('Error loading lightbox ', err);

            activeTitle.innerHTML = img.title;
            activeImg.src = _img.src;

            pushState(img.index);

            setTimeout(function () {
                el.classList.remove(LOADING_CLASS);
                env.lightboxActive = true;
            }, 80);
        });

        el.classList.add(ACTIVE_CLASS);
        if (!env.lightboxActive) el.classList.add(LOADING_CLASS);
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
    var LOADING_CLASS = 'is-loading';

    var list = document.getElementById('photo-list');
    el.classList.add(LOADING_CLASS);
    loadAllImg(opts.photos.map(function (img) {
        return img.med.url;
    }), function (err, imgs) {
        if (err) return console.error('Error fetching images: ', err);

        list.innerHTML = listHtml(opts.photos);
        setTimeout(function () {
            el.classList.remove(LOADING_CLASS);
        }, 80);
    });

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
bindArrowStep();

fetchPhotos(function (err, photos) {
    if (err || typeof photos === 'undefined') {
        return console.error('Error fetching photos.');
    }

    env.photoSet = photos;

    photoList(document.getElementById('photos'), {
        photos: photos,
        onSelect: function (img) { lightbox(img); }
    });

    var index = location.hash.replace(/^#/, '');
    if (index) stepLightbox(index);
});
