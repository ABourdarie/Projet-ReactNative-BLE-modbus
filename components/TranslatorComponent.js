import React, { useState } from 'react';
import { Text, TextInput, View } from 'react-native';

const Translator = () => {
  const [text, setText] = useState('');
  return (
    <View style={{padding: 10}}>
      <TextInput
        style={{height: 40}}
        placeholder="Ecrire ici"
        onChangeText={newText => setText(newText)}
        defaultValue={text}
      />
      <Text style={{padding: 10, fontSize: 42}}>
        {text.split(' ').map((word) => word && '🌡️').join(' ')}
      </Text>
    </View>
  );
}

export default Translator;