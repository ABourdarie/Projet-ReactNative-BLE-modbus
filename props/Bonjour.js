import React from 'react';
import { Text, View, Image } from 'react-native';

const MicroApp = () => {

  return (
    <View>
      <Image
        source= {require( '../images/logo_MICROLIDE.png')}
        //source={{uri: "https://reactnative.dev/docs/assets/p_cat1.png"}}
        style={{width: 235, height: 96}}
      />
      <Text>Bonjour Microlide</Text>
    </View>
  );
}

export default MicroApp;