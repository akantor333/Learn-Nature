var environments = {
    staging: {
      FIREBASE_API_KEY: 'AIzaSyCY18_vzyFQWNxuPbhtVZUnIdmIgNkbBiI',
      FIREBASE_AUTH_DOMAIN: 'learn-nature.firebaseapp.com',
      FIREBASE_DATABASE_URL: 'https://learn-nature.firebaseio.com',
      FIREBASE_PROJECT_ID: 'learn-nature',
      FIREBASE_STORAGE_BUCKET: 'learn-nature.appspot.com',
      FIREBASE_MESSAGING_SENDER_ID: '963787113555',
      GOOGLE_CLOUD_VISION_API_KEY: 'AIzaSyDQz1ekYdGiAwMTXan6V0_ZEfBEoxcZ8NU'
    },
    production: {
      // Warning: This file still gets included in your native binary and is not a secure way to store secrets if you build for the app stores. Details: https://github.com/expo/expo/issues/83
    }
  };
  
  function getReleaseChannel() {
      return 'staging';
  }
  function getEnvironment(env) {
    console.log('Release Channel: ', getReleaseChannel());
    return environments[env];
  }
  var Environment = getEnvironment(getReleaseChannel());
  export default Environment;