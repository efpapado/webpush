<?php

function _webpush_subscription_apple_log($a, $tag) {
  $s = function () {
    return '<pre>' . json_encode(func_get_args(), JSON_PRETTY_PRINT) . '</pre>';
  };
  $d = $s(file_get_contents("php://input")) . $s($a);
  watchdog('webpush', '!t => !d', ['!d' => $d, '!t' => $tag], WATCHDOG_ERROR);
}

function _webpush_subscription_apple_package($a) {
  _webpush_subscription_apple_log(func_get_args(), 'packages');
  $v = in_array('v1', $a, TRUE) ? '1' : '2';
  $path = __DIR__ . "/push_$v.zip";
  header('Access-Control-Allow-Origin', '*');
  header("Content-type: application/zip");
  echo file_get_contents($path);
  die;
}

function _webpush_subscription_apple_device() {
  _webpush_subscription_apple_log(func_get_args(), 'devices');
}

function _webpush_subscription_apple() {
  if (in_array('packages', func_get_args(), TRUE) || in_array('pushPackages', func_get_args(), TRUE)) {
    _webpush_subscription_apple_package(func_get_args());
  }
  if (in_array('devices', func_get_args(), TRUE)) {
    _webpush_subscription_apple_device(func_get_args());
  }
  else {
    _webpush_subscription_apple_log(func_get_args(), 'logit');
  }
  return ['#markup' => 'halo'];
}

function _webpush_subscription_apple_menu() {
  $items["push"] = [
    'title' => 'Apple WebPush Subscriptions / Logging',
    'description' => 'Endpoint to register to push messages for apple family of devices / Logging',
    'page callback' => '_webpush_subscription_apple',
    'file' => 'apple.inc',
    'access callback' => TRUE,
  ];
  return $items;
}
