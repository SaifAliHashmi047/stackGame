import { Platform } from 'react-native';
import { TestIds } from 'react-native-google-mobile-ads';

/**
 * Ad unit IDs.
 * In development (__DEV__) we always use Google's official test IDs so no
 * real impressions are served and policy violations are avoided.
 * Replace the placeholder strings below with your real unit IDs before release.
 */

export const BANNER_AD_UNIT_ID = __DEV__
  ? TestIds.ADAPTIVE_BANNER
  : Platform.select({
      ios: 'ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY',
      android: 'ca-app-pub-XXXXXXXXXXXXXXXX/ZZZZZZZZZZ',
    })!;

export const INTERSTITIAL_AD_UNIT_ID = __DEV__
  ? TestIds.INTERSTITIAL
  : Platform.select({
      ios: 'ca-app-pub-XXXXXXXXXXXXXXXX/AAAAAAAAAA',
      android: 'ca-app-pub-XXXXXXXXXXXXXXXX/BBBBBBBBBB',
    })!;
