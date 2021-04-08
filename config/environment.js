var environments = {
    staging: {
      PLANTID_API_KEY: '1t4Yqkj9dIF828nEDVfEfFZGasVmoYXklvLDWPdmui7b8iAHnU',
      TREFLE_API_KEY: 'SbxAJkzyV5uH8kILcWsksXIsv1BwtbdEdycACxqhz0A'
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