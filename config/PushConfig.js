import PushNotification from 'react-native-push-notification'
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEVICE_TOKEN, DEVICE_OS } from './config';
import NavigationService from '../services/NavigationService';

PushNotification.configure({
  onRegister: async ({token, os}) => {
    //dispatch(setNotificationId(token, os));
    await AsyncStorage.setItem(
      DEVICE_TOKEN,
      token
    );
    await AsyncStorage.setItem(
      DEVICE_OS,
      os
    );
  },

  onNotification: (notification) => {
    NavigationService.navigate(notification.custom.nav,notification.custom.params)
  }

});