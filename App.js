// In App.js in a new project

import * as React from 'react';
import { Button, View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BluetoothScanner from './src/BluetoothScanner';
import ChartView from './src/Chart';

function HomeScreen({ navigation }) {
  return (
    <View style={{ flex: 2, alignItems: 'center', justifyContent: 'center' }}>
      <Text>Home Screen</Text>
      <Button
        title="Go to Details"
        onPress={() => {
          /* 1. Navigate to the Details route with params */
          navigation.navigate('Details', {
            itemId: 86,
            otherParam: 'anything you want here',
          });
        }}
      />
      <Button
        title="Scanning menu"
        onPress={() => {
          navigation.navigate('Scan', {
            itemId: 86,
            otherParam: 'anything you want here',
          });
        }}
      />
      <Button
        title="chart view"
        onPress={() => {
          navigation.navigate('Chart', {
            itemId: 86,
            otherParam: 'anything you want here',
          });
        }}
      />
    </View>
  );
}

function DetailsScreen({ route, navigation }) {
  /* 2. Get the param */
  const { itemId, otherParam } = route.params;
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>Details Screen</Text>
      <Text>itemId: {JSON.stringify(itemId)}</Text>
      <Text>otherParam: {JSON.stringify(otherParam)}</Text>
      <Button
        title="Go to Details... again"
        onPress={() =>
          navigation.push('Details', {
            itemId: Math.floor(Math.random() * 100),
          })
        }
      />
      <Button title="Go to Home" onPress={() => navigation.navigate('Home')} />
      <Button title="Go back" onPress={() => navigation.goBack()} />
    </View>
  );
}

const Stack = createNativeStackNavigator();

function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'Overview' }}
      />
        <Stack.Screen name="Details" component={DetailsScreen} />
        <Stack.Screen name="Scan" component={BluetoothScanner} />
        <Stack.Screen name="Chart" component={ChartView} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;