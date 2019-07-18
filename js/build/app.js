'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

(function ($, Drupal) {

  var MY_ID = 'web.com.ramsalt.koosha-local';
  var my_domain = 'koosha-local.ramsalt.com';

  // So that PHPStorm doesn't realize it's g() I'm calling, as it shows strange
  // lint warnings/hints and stuff not applicable to apple.
  // noinspection JSUnresolvedVariable
  var fff = {
    g: window.safari.pushNotification.requestPermission
  }[String.fromCharCode(103)]; // 103 = ascii g

  // noinspection JSUnresolvedVariable
  var ggg = function ggg() {
    return window.safari.pushNotification.permission(MY_ID);
  };

  var _dummy = function _dummy() {
    return Drupal.behaviors.webPushApp.dummy;
  };
  var _then = function _then(callback) {
    stack++;
    if (stack > 100) {
      console.log('fuck', new Error('fuck1err'));
      throw new Error('fuck');
    }
    if (isApple() && callback) {
      if ({}.toString.call(callback) === '[object Function]') {
        try {
          callback(_dummy());
        } catch (e) {
          console.warn('err: ', e);
          _dummy()._err.push(e);
          _dummy()._catch();
        }
      } else {
        console.warn('not callable', callback);
      }
    }
    return _dummy();
  };
  var dummy = {
    _err: [],
    _catcher: null,
    _catch: function _catch() {
      stack++;
      if (!_dummy()._catcher) {
        console.warn('no catcher yet');
      } else if (stack > 100) {
        console.log('fuck2', new Error('fuck2err'));
      } else {
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
          for (var _iterator = _dummy()._err[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var e = _step.value;

            _dummy()._catcher(e);
          }
        } catch (err) {
          _didIteratorError = true;
          _iteratorError = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion && _iterator.return) {
              _iterator.return();
            }
          } finally {
            if (_didIteratorError) {
              throw _iteratorError;
            }
          }
        }
      }
    },
    register: function register(c) {
      return _then(c, 'dummy navigator.serviceWorker.register()');
    },
    getSubscription: function getSubscription(c) {
      return _then(c, 'dummy pushManager.getSubscription()');
    },
    then: function then(c) {
      return _then(c, 'dummy navigator.serviceWorker.ready.then()');
    },
    catch: function _catch(c) {
      console.log('dummy catch()');
      _dummy()._catcher = c;
      return _dummy();
    }
  };
  dummy.ready = dummy;
  dummy.pushManager = dummy;

  function isApple() {
    return 'safari' in window && 'pushNotification' in window.safari;
  }

  function hasServiceWorker() {
    return isApple() || navigator && 'serviceWorker' in navigator && 'PushManager' in window;
  }

  function serviceWorker() {
    return navigator && navigator.serviceWorker ? navigator.serviceWorker : null;
  }

  function appleCheckRemotePermission() {
    var callback = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
    var permissionData = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

    if (!permissionData) {
      permissionData = ggg();
    }
    console.log(permissionData);
    switch (permissionData.permission) {
      case 'default':
        console.log('asking apple', MY_ID, 'https://' + my_domain + '/push');
        window.safari.pushNotification.requestPermission('https://' + my_domain + '/push', MY_ID, {
          "data": "foo"
        }, console.log);
        break;

      case 'denied':
        console.log('no apple', permissionData);
        if (typeof callback === 'function') {
          callback(false);
        } else {
          console.warn('callback is not function: ', callback);
        }
        break;

      case 'granted':
        console.log('ok apple', permissionData);
        callback(true);
        break;

      default:
        console.log('wtf?');
    }
  }

  Drupal.behaviors.webPushApp = {
    dummy: dummy,
    hasServiceWorker: hasServiceWorker,
    serviceWorker: serviceWorker,
    isApple: isApple,
    appleCheckRemotePermission: appleCheckRemotePermission,

    attach: function attach(context, settings) {
      if (isApple()) {
        $('h1.page-title').click(function () {
          appleCheckRemotePermission({ permission: 'default' });
        });
      }

      if (!hasServiceWorker()) {
        console.debug('The client does not have service worker enabled, disabling all push messages');
        return;
      }

      this.state = 'unknown';

      // Initialize the application server key
      if (!this.initializeApplicationServerKey()) {
        console.debug('no application key');
        return;
      }

      // Initialize the available properties.
      this.initializeProperties();

      // Initialize the available subscription buttons.
      this.initializeSubscriptionButtons();

      // Initialize variable.
      this.isPushEnabled = false;

      // If the features are not supported by the browser, stop here.
      if (this.unsupportedFeatures()) {
        return;
      }

      // Check the current Notification permission.
      // If its denied, the button should appears as such, until the user
      // changes the permission manually
      if (Notification.permission === 'denied') {
        console.warn(Drupal.t('Notifications are denied by the user'));
        this.updateWebpushState('userdenied');
        return;
      }

      // Register the service worker.
      var that = this;

      if (isApple()) {}

      if (!isApple() && serviceWorker()) {
        serviceWorker().register('/webpush/serviceworker/js', { scope: '/' }).then(function () {
          console.log(Drupal.t('[SW] Service worker has been registered'));
          that.push_updateSubscription();
        }, function (e) {
          console.error(Drupal.t('[SW] Service worker registration failed'), e);
          that.updateWebpushState('incompatible');
        });
      }
    },

    isPushEnabled: false,

    applicationServerKey: false,

    initializeApplicationServerKey: function initializeApplicationServerKey() {
      this.applicationServerKey = 'webpush' in Drupal.settings ? Drupal.settings.webpush.applicationServerKey : false;
      return this.applicationServerKey;
    },

    subscriptionButtons: [],

    initializeSubscriptionButtons: function initializeSubscriptionButtons() {
      var availableButtons = 'webpush' in Drupal.settings ? Drupal.settings.webpush.buttons : false;
      if (availableButtons) {
        for (var k in availableButtons) {
          if (availableButtons.hasOwnProperty(k)) {
            var $button = $('#' + availableButtons[k]);
            if ($button.length) {
              // Make sure that the button is actually on the page.
              this.subscriptionButtons.push($button);
            }
          }
        }
      }
      return this.subscriptionButtons;
    },

    properties: [],

    initializeProperties: function initializeProperties() {
      this.properties = 'webpush' in Drupal.settings ? Drupal.settings.webpush.properties : false;
      return this.properties;
    },

    unsupportedFeatures: function unsupportedFeatures() {
      if (isApple()) {
        return false;
      }

      if (!('serviceWorker' in navigator)) {
        console.warn(Drupal.t("Service workers are not supported by this browser"));
        this.updateWebpushState('incompatible');
        return true;
      }

      if (!('PushManager' in window)) {
        console.warn(Drupal.t('Push notifications are not supported by this browser'));
        this.updateWebpushState('incompatible');
        return true;
      }

      if (!('showNotification' in ServiceWorkerRegistration.prototype)) {
        console.warn(Drupal.t('Notifications are not supported by this browser'));
        this.updateWebpushState('incompatible');
        return true;
      }
      return false;
    },

    urlBase64ToUint8Array: function urlBase64ToUint8Array(base64String) {
      var padding = '='.repeat((4 - base64String.length % 4) % 4);
      var base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

      var rawData = window.atob(base64);
      var outputArray = new Uint8Array(rawData.length);

      for (var i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
      }
      return outputArray;
    },

    push_sendSubscriptionToServer: function push_sendSubscriptionToServer(subscription, method, data) {
      var that = this;
      var key = subscription.getKey('p256dh');
      var token = subscription.getKey('auth');
      var contentEncoding = (PushManager.supportedContentEncodings || ['aesgcm'])[0];

      var d = new Date();
      var a = fetch('/webpush/subscription-registration?' + d.getTime(), {
        method: method,
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          publicKey: key ? btoa(String.fromCharCode.apply(null, new Uint8Array(key))) : null,
          authToken: token ? btoa(String.fromCharCode.apply(null, new Uint8Array(token))) : null,
          contentEncoding: contentEncoding,
          data: data
        })
      });
      var b = a.then(function (resultA) {
        return resultA.json().then(function (responseJSON) {
          return responseJSON;
        });
      });
      return Promise.all([a, b]).then(function (_ref) {
        var _ref2 = _slicedToArray(_ref, 2),
            response = _ref2[0],
            drupalJson = _ref2[1];

        if (drupalJson !== false) {
          // noinspection JSUnresolvedVariable
          var _data = drupalJson.webpush.data;
          for (var k in _data) {
            if (_data.hasOwnProperty(k)) {
              that.setLocalData(k, _data[k]);
            }
          }
          // noinspection JSUnresolvedVariable
          if (drupalJson.webpush.entity_id !== undefined) {
            // noinspection JSUnresolvedVariable
            that.setLocalData('entity_id', drupalJson.webpush.entity_id);
          } else {
            that.setLocalData('entity_id', false);
          }
        }

        return {
          'subscription': subscription,
          'drupalJson': drupalJson
        };
      });
    },

    getWebpushState: function getWebpushState() {
      return this.state;
    },

    updateWebpushState: function updateWebpushState(state) {
      this.state = state;

      var message = '';
      switch (state) {
        case 'enabled':
          message = Drupal.t('Disable Push notifications');
          this.isPushEnabled = true;
          break;
        case 'disabled':
          message = Drupal.t('Enable Push notifications');
          this.isPushEnabled = false;
          break;
        case 'computing':
          message = Drupal.t('Loading...');
          break;
        case 'incompatible':
          message = Drupal.t('Push notifications are not compatible with this browser');
          break;
        case 'userdenied':
          message = Drupal.t('The user has denied push notifications');
          break;
        default:
          console.error('Unhandled push button state', state);
          message = 'Unknown push notifications state';
          state = 'unknown';
          break;
      }

      this.stateMessage = message;

      // And now update the buttons.
      var $subscriptionButtons = this.subscriptionButtons;
      if (!$subscriptionButtons.length) {
        return;
      }

      for (var i = 0, len = $subscriptionButtons.length; i < len; i++) {
        var $button = $subscriptionButtons[i];
        $button.attr('data-webpush-state', state);
        $button.attr('data-webpush-message', message);
        $button[0].dispatchEvent(new CustomEvent("webpush-state-update", {
          detail: {
            state: state,
            message: message
          }
        }));
      }
    },

    state: 'unknown',

    stateMessage: '',

    push_updateSubscription: function push_updateSubscription() {

      var that = this;
      serviceWorker().ready.then(function (serviceWorkerRegistration) {
        return serviceWorkerRegistration.pushManager ? serviceWorkerRegistration.pushManager.getSubscription() : _dummy().getSubscription();
      }).then(function (subscription) {
        that.updateWebpushState('disabled');

        if (!subscription) {
          // We aren't subscribed to push, so set UI to allow the user to
          // enable push
          return;
        }

        /*
          If we reached here, it means that the client has updated their
          (already existing) subscription. This might have happened
          because the user manually unregistered the SW, or changed the
          configuration of his browser, or for other reasons.
           As a result, the client has a new endpoint, a totally different
          PushSubscription object
          (@see https://developer.mozilla.org/en-US/docs/Web/API/PushSubscription)
          which is not related to the old one.
           Until now, I couldn't find any way to relate those two
          PushSubscription objects; if you, dear developer who reads these
          comments, know any way, PLEASE open a new task in the module's
          issue queue
          (@see https://www.drupal.org/project/issues/webpush)
           The new endpoint must be sent to our server. We'll try to look
          into the local storage, to see if we have any info.
           If the user has also cleared his local cache, then we have no info.
         */

        var localData = {};
        // Ask the app to provide all the expected properties (for example
        // "webpush_topics", if that module is enabled.)
        var properties = that.properties;
        // Iterate through the expected properties
        var _iteratorNormalCompletion2 = true;
        var _didIteratorError2 = false;
        var _iteratorError2 = undefined;

        try {
          for (var _iterator2 = properties[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            var i = _step2.value;

            var localValue = that.getLocalData(properties[i]);
            // If any of these is missing from the local storage...
            if (localValue === null) {
              // ...the user must be notified, and asked to re-subscribe.
              // Because of that, we stop here and do not do anything further.
              that.notifyUser();
              return;
            }
            // ... or else, add this property to the object that will be sent
            // to the server.
            else {
                localData[properties[i]] = localValue;
              }
          }

          // Check also if the drupal entity ID is stored locally.
        } catch (err) {
          _didIteratorError2 = true;
          _iteratorError2 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion2 && _iterator2.return) {
              _iterator2.return();
            }
          } finally {
            if (_didIteratorError2) {
              throw _iteratorError2;
            }
          }
        }

        var entity_id = that.getLocalData('entity_id');
        if (entity_id) {
          localData['entity_id'] = entity_id;
        }

        return that.push_sendSubscriptionToServer(subscription, 'PUT', localData);
      }).then(function (response) {
        return response && response.subscription && that.updateWebpushState('enabled');
      }) // Set your UI to show they have subscribed for push messages
      .catch(function (e) {
        console.error(Drupal.t('Error when updating the subscription'), e);
      });
    },

    notifyUser: function notifyUser() {
      var notifyUserMessage = Drupal.t('You have been unsubscribed from push notifications because you cleared your local cache, or because the service was updated.', {}, { context: "webpush" });
      var $notifyUserMessage = $('<div class="webpush-notify-user"/>').html(notifyUserMessage);
      $notifyUserMessage.appendTo('body');
    },

    getLocalData: function getLocalData(key) {
      var currentStorage = this.getAllLocalData();
      if (currentStorage === null) {
        return null;
      }
      if (key in currentStorage) {
        return currentStorage[key];
      } else {
        return null;
      }
    },

    getAllLocalData: function getAllLocalData() {
      return JSON.parse(localStorage.getItem('webpush'));
    },

    setLocalData: function setLocalData(key, value) {
      var store = {};
      var currentStorage = localStorage.getItem('webpush');
      if (currentStorage !== null) {
        // There are already stored values in our bin, we should not lose them.
        store = JSON.parse(currentStorage);
      }
      store[key] = value;
      localStorage.setItem('webpush', JSON.stringify(store));
      return true;
    },

    clearLocalData: function clearLocalData() {
      localStorage.removeItem('webpush');
    },

    push_subscribe: function push_subscribe(data) {
      var that = this;
      this.updateWebpushState('computing');

      serviceWorker().ready.then(function (serviceWorkerRegistration) {
        return serviceWorkerRegistration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: that.urlBase64ToUint8Array(that.applicationServerKey)
        });
      }).then(function (subscription) {
        // Subscription was successful
        // create subscription on your server
        return that.push_sendSubscriptionToServer(subscription, 'POST', data);
      }).then(function (response) {
        return response.subscription && that.updateWebpushState('enabled');
      }) // update your UI
      .catch(function (e) {
        if (Notification.permission === 'denied') {
          // The user denied the notification permission which
          // means we failed to subscribe and the user will need
          // to manually change the notification permission to
          // subscribe to push messages
          console.warn(Drupal.t('Notifications are denied by the user.'));
          that.updateWebpushState('userdenied');
        } else {
          // A problem occurred with the subscription; common reasons
          // include network errors or the user skipped the permission
          console.error(Drupal.t('Impossible to subscribe to push notifications'), e);
          that.updateWebpushState('disabled');
        }
      });
    },

    push_unsubscribe: function push_unsubscribe(data) {
      var that = this;
      this.updateWebpushState('computing');

      // To unsubscribe from push messaging, you need to get the subscription
      // object
      serviceWorker().ready.then(function (serviceWorkerRegistration) {
        return serviceWorkerRegistration.pushManager.getSubscription();
      }).then(function (subscription) {
        // Check that we have a subscription to unsubscribe
        if (!subscription) {
          // No subscription object, so set the state
          // to allow the user to subscribe to push
          that.updateWebpushState('disabled');
          return;
        }

        // We have a subscription, unsubscribe
        // Remove push subscription from server
        return that.push_sendSubscriptionToServer(subscription, 'DELETE');
      }).then(function (response) {
        return response.subscription.unsubscribe();
      }).then(function () {
        return that.clearLocalData();
      }).then(function () {
        return that.updateWebpushState('disabled');
      }).catch(function (e) {
        // We failed to unsubscribe, this can lead to
        // an unusual state, so  it may be best to remove
        // the users data from your data store and
        // inform the user that you have done so
        console.error(Drupal.t('Error when unsubscribing the user'), e);
        that.updateWebpushState('disabled');
      });
    }

  };
})(jQuery, Drupal);