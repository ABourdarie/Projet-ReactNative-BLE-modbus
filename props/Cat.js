import React, { useState } from "react";
import { Button, Text, View } from "react-native";

const Cat = (props) => {
  const [isHungry, setIsHungry] = useState(true);

  return (
    <View>
      <Text>
        Je suis {props.name}, et je suis {isHungry ? "Désactivé" : "activé"}!
      </Text>
      <Button
        onPress={() => {
          setIsHungry(false);
        }}
        disabled={!isHungry}
        title={isHungry ? "Clique ici" : "Merci"}
      />
    </View>
  );
}

const Cafe = () => {
  return (
    <>
      <Cat name="La permière action" />
      <Cat name="La deuxième action" />
    </>
  );
}

export default Cafe;