<?php

/**
 * Webpush_subscription entity class extending the Entity class
 */

class WebpushSubscription extends Entity {

}

/**
 * Extending the EntityAPIController for the webpush_subscription entity.
 */
class WebpushSubscriptionController extends EntityAPIController {

}

function _webpush_entity_info() {
  $info = [];

  $info['webpush_subscription'] = [
    'label' => 'WebPush subscription',
    'entity class' => 'WebpushSubscription',
    'controller class' => 'WebpushSubscriptionController',
    'views controller class' => 'EntityDefaultViewsController',
    'base table' => 'webpush_subscription',
    'entity keys' => [
      'id' => 'id',
    ],
    'access callback' => 'webpush_subscription_access_callback',
    //    'uri callback' => 'entity_class_uri',
    'admin ui' => [
      'path' => 'admin/webpush-subscription',
      'controller class' => 'EntityDefaultUIController',
    ],
    'module' => 'webpush',
    'fieldable' => TRUE,
    'bundles' => [
      'webpush_subscription' => [
        'label' => 'WebPush subscription',
        'admin' => [
          'path' => 'admin/structure/webpush-subscription/manage',
          'access arguments' => ['administer webpush'],
        ],
      ],
    ],

  ];

  return $info;
}

function _webpush_entity_property_info() {
  $info = [];

  $info['webpush_subscription']['properties']['subscription'] = [
    'label' => t('Subscription'),
    'description' => t('The serialized subscription object (\Minishlink\WebPush\Subscription)'),
    'type' => 'text',
    'schema field' => 'subscription',
  ];

  return $info;
}

function _webpush_subscription_menu() {
  $items = [];

  $items['admin/structure/webpush-subscription/manage'] = [
    'title' => 'WebPush subscriptions',
    'page callback' => 'webpush_subscription__overview',
    'file' => 'includes/webpush_subscription.inc',
    'access arguments' => ['administer webpush'],
  ];

  $items['admin/structure/webpush-subscription/manage/list'] = [
    'title' => 'Overview',
    'type' => MENU_DEFAULT_LOCAL_TASK,
    'access arguments' => ['send push notifications'],
  ];

  return $items;
}

function webpush_subscription__overview() {
  $count = webpush_subscription__count();
  $content[] = [
    '#markup' => t('You have !number push notification subscriptions.', ['!number' => $count]),
  ];
  return $content;
}