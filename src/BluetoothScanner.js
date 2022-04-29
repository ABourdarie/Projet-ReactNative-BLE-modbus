import { List } from 'native-base';
import { Buffer } from 'buffer';
import React, { useState, useEffect } from 'react';
import { Platform, PlatformIOSStatic } from 'react-native'
import { View, Text, FlatList, TouchableHighlight, SafeAreaView, Alert, Button, PermissionsAndroid } from 'react-native';
import { BleManager } from 'react-native-ble-plx';
import { TouchableOpacity } from 'react-native-web';
import HTMLtoPDF from './Alerts';


export const manager = new BleManager();

const requestPermission = async () => {
  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION, {
      title: "Request for Location Permission",
      message: "Bluetooth Scanner requires access to Fine Location Permission",
      buttonNeutral: "Ask Me Later",
      buttonNegative: "Cancel",
      buttonPositive: "OK"
    }
  );
  return (granted === PermissionsAndroid.RESULTS.GRANTED);
}



  const getItem = (name, id) => {

    Alert.alert(name + " / " + id);

  }

  const checkco = () => {
    if(manager.isDeviceConnected("00:1E:AC:03:33:49")){
      console.log("l'appareil est déjà connecté")
    } else {
      console.log("l'appareil n'est pas connecté")
    }

  }


  function connectDevice(selectedDevice) {

    manager.stopDeviceScan();
    alert("fonction de connexion");

    manager.connectToDevice(selectedDevice.id)
    .then( async (selectedDevice) => {
      console.log("co réussie");
        return await selectedDevice.discoverAllServicesAndCharacteristics()
    })
    .then( async (selectedDevice) => {
       // Do work on device with services and characteristics
       console.log('Services and characteristics découverts');
        //return this.testChar(device)
        const services = await selectedDevice.services()
        console.log(services)
        console.log("au dessus les services et dessous les caractéristiques")
        services.forEach( async (service) => {
          console.log("début caracteristique\n")
          const readCharacteristic = await manager.characteristicsForDevice(selectedDevice.id, service.uuid)

          readCharacteristic.forEach( async (characteristic) => {
            
            if(characteristic.isReadable) {
              console.log(characteristic.uuid)
              selectedDevice.readCharacteristicForService(service.uuid, characteristic.uuid)
              .then((characteristic) => { 
                console.log(Buffer.from(characteristic.value.toString(), 'base64').readUIntBE(3, 4))
                const timestamp = new Date(Buffer.from(characteristic.value.toString(), 'base64').readUIntBE(3, 4))

                // Create a new JavaScript Date object based on the timestamp
                // multiplied by 1000 so that the argument is in milliseconds, not seconds.
                var date = new Date(timestamp * 1000);
                var year = date.getFullYear();
                var month =  "0" +date.getMonth();
                var day =  "0" +date.getDay();
                // Hours part from the timestamp
                var hours = date.getHours();
                // Minutes part from the timestamp
                var minutes = "0" + date.getMinutes();
                // Seconds part from the timestamp
                var seconds = "0" + date.getSeconds();

                //C'est pas la bonne date
                var formattedTime = year + '/' + month + '/' + day + " / " + hours + ':' + minutes + ':' + seconds;

                console.log(formattedTime);
              })
              }
          })
        })
        // this.info("Setting notifications")
        //return this.setupNotifications(device)
    })
    .catch((error) => {
        // Handle errors
    });


    checkco()
    
    console.log("fin de co")
    
  }


  

 

// BlueetoothScanner does:
// - access/enable bluetooth module
// - scan bluetooth devices in the area
// - list the scanned devices
const BluetoothScanner = () => {
  const [logData, setLogData] = useState([]);
  const [logCount, setLogCount] = useState(0);
  const [scannedDevices, setScannedDevices] = useState({});
  const [deviceCount, setDeviceCount] = useState(0);
  const [selectedDevice, setSelectedDevice] = useState({});


 

  useEffect(() => {
    manager.onStateChange((state) => {
      const subscription = manager.onStateChange(async (state) => {
        console.log(state);
        const newLogData = logData;
        newLogData.push(state);
        await setLogCount(newLogData.length);
        await setLogData(newLogData);
        subscription.remove();
      }, true);
      return () => subscription.remove();
    });
  }, [manager]);

  return (
    <><HTMLtoPDF /><View style={{ flex: 1, padding: 10 }}>
      <View style={{ flex: 1, padding: 10, width: 200 }}>
        <Text style={{ fontWeight: "bold" }}>Bluetooth Log ({logCount})</Text>
        <FlatList
          data={logData}
          renderItem={({ item }) => {
            return (<Text>{item}</Text>);
          } } />
        <Button
          title="Turn On Bluetooth"
          width="2000px"
          onPress={async () => {
            const btState = await manager.state();
            // test is bluetooth is supported
            if (btState === "Unsupported") {
              alert("Bluetooth is not supported");
              return (false);
            }
            // enable if it is not powered on
            if (btState !== "PoweredOn") {
              await manager.enable();
            } else {
              await manager.disable();
            }
            return (true);
          } } />
      </View>

      <SafeAreaView style={{ flex: 2, padding: 10 }}>
        <Text style={{ fontWeight: "bold" }}>Scanned Devices ({deviceCount})</Text>

        <FlatList
          data={Object.values(scannedDevices)}
          renderItem={({ item }) => {
            return (
              <TouchableHighlight
                onPress={() => { getItem(item.name, item.id), setSelectedDevice(item); } }
                underlayColor={"#ffffff"}
              >
                <Text>{`${item.name} (${item.id})`}</Text>
              </TouchableHighlight>
            );
          } }
          ItemSeparatorComponent={ItemDivider} />

        <Button
          title="Scan Devices"
          onPress={async () => {
            const btState = await manager.state();
            // test if bluetooth is powered on
            if (btState !== "PoweredOn") {
              alert("Bluetooth is not powered on");
              return (false);
            }
            // explicitly ask for user's permission
            var permission = false;
            if (Platform.OS === 'ios') {
              permission = true;
            }
            else {
              permission = await requestPermission();
            }
            if (permission) {
              manager.startDeviceScan(null, null, async (error, device) => {
                // error handling
                if (error) {
                  console.log(error);
                  return;
                }


                var tempName = null
                if (device.name != null) {
                  tempName = device.name.substring(0,4)
                } else {
                  tempName = null
                }
                // found a bluetooth device
                if (device && (tempName === "Lide" || tempName === "LIDE")) {
                  console.log(`${device.name} (${device.id})}`);
                  const newScannedDevices = scannedDevices;
                  newScannedDevices[device.id] = device;
                  await setDeviceCount(Object.keys(newScannedDevices).length);
                  await setScannedDevices(scannedDevices);
                }

                // Partie de test
                //   if (device.name === "MY_DEVICE_NAME") {
                //     manager
                //         .connectToDevice(device.id, {
                //             autoconnect: true,
                //             timeout: BLUETOOTH_TIMEOUT
                //         })
                //     // ............
                // }
                // fin de partie de test 
              });
            }
            return (true);
          } } />
      </SafeAreaView>

      <View style={{ flex: 3, padding: 10 }}>

        <Text style={{ fontWeight: "bold" }}> ({selectedDevice.name}) / ({selectedDevice.id})</Text>


        <Button
          title="Connect"
          onPress={async () => {
            connectDevice(selectedDevice);
          } } />


      </View>

      <View style={{
        flex: 4,
        padding: 10
      }}>

        <Button
          title="disconnect"
          onPress={async () => {
            const btState = await manager.state();
            checkco;
            //on arrete le scan et on reset l'appareil selectionné   
            manager.cancelDeviceConnection(selectedDevice.id);
            alert("arret du scan et fin de selection");
            checkco;
            return (true);
          } } />

      </View>




    </View></>
  );
};


const ItemDivider = () => {
  return (
    <View
      style={{
        height: 1,
        width: "100%",
        backgroundColor: "#607D8B",
      }}
    />
  );
}

export default BluetoothScanner;