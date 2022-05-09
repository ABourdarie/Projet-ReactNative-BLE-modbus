import { List } from 'native-base';
import { convertAbsoluteToRem } from 'native-base/lib/typescript/theme/tools';
import React, { useState, useEffect } from 'react';
import { Platform, PlatformIOSStatic } from 'react-native'
import { View, Text, FlatList, TouchableHighlight, SafeAreaView, Alert, Button, PermissionsAndroid } from 'react-native';
import { BleManager } from 'react-native-ble-plx';
import { TouchableOpacity } from 'react-native-web';
import HTMLtoPDF from './Alerts';
import modbusBleRtu from './modbus';



export const manager = new BleManager();
var Buffer = require('buffer/').Buffer  // note: the trailing slash is important!

require('./modbus');

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


  function connectDevice(selectedDevice) {

    let serviceSelect;
    let caracLect;
    let caracErci;

    manager.stopDeviceScan();
    alert("fonction de connexion");

    manager.connectToDevice(selectedDevice.id)
    .then( async (selectedDevice) => {
      console.log("co réussie");
        return await manager.discoverAllServicesAndCharacteristicsForDevice(selectedDevice.id)
    })
    .then( async (selectedDevice) => {
       // Do work on device with services and characteristics
       console.log('Services and characteristiques découverts');
        //return this.testChar(device)
        const services = await selectedDevice.services()
        console.log(services)
        console.log("au dessus les services et dessous les caractéristiques")

        services.forEach( async (service) => {
          console.log("début caracteristique\n")
          
          serviceSelect = service;

          const readCharacteristic = await manager.characteristicsForDevice(selectedDevice.id, service.uuid)

          readCharacteristic.forEach( async (characteristic) => {

            console.log(characteristic.uuid)

            if ( characteristic.isWritableWithResponse) {
              caracErci = characteristic;
              console.log(characteristic.uuid);
              const bufR = Buffer.from([0x01, 0x04, 0x01, 0xF4, 0x00, 0x02, 0x31, 0xC5 ]).toString('base64');
              console.log(bufR);
              characteristic.writeWithResponse(bufR);
            }

            if (characteristic.isReadable) {
              caracLect = characteristic;

              const readChar = await characteristic.read();
        
              console.log(characteristic.uuid)
              
              await manager.readCharacteristicForDevice(selectedDevice.id, service.uuid, readChar.uuid)
              .then(async (characteristic) => { 
                console.log(characteristic.deviceID)
                console.log(characteristic.value)
                console.log(Buffer.from(characteristic.value.toString(), 'base64'))
                const DateDuLide = new Date(Buffer.from(characteristic.value.toString(), 'base64').readUIntBE(3, 4) * 1000)
                console.log(DateDuLide.toLocaleString());
              })

              if (typeof caracLect !== "undefined") {
                console.log(selectedDevice.id);
                console.log(serviceSelect.uuid);
                console.log(caracErci.uuid);
                console.log(caracLect.uuid);
                  let modbusManager = await new modbusBleRtu(manager, selectedDevice.id, serviceSelect.uuid, caracErci.uuid, caracLect);
                    await modbusManager.readHoldingRegisters(500,2)
                    .then(async (timestamp) => {
                      const DeuxiemeDateDuLide = new Date(timestamp * 1000)
                      console.log(DeuxiemeDateDuLide.toLocaleString());
                    })
                    await modbusManager.readHoldingRegisters(502,1)
                    .then(async (nbVoies) => {
                      console.log("Nombre de voies : " + nbVoies)
                    })
                    await modbusManager.readHoldingRegisters(503,1)
                    .then(async (nbVoiesMax) => {
                      console.log("Nombre de voies Maximum : " + nbVoiesMax)
                    })
                    await modbusManager.readHoldingRegisters(504,1)
                    .then(async (modele) => {
                      console.log("Numero de modèle : " + modele)
                    })
                    await modbusManager.readHoldingRegisters(3000,107)
                    .then(async (config) => {
                      console.log("configuration buffer " + config)
                    })

                
              }

            }

          })
        })
        // this.info("Setting notifications")
        //return this.setupNotifications(device)
    })
    .catch((error) => {
      console.log(error)
        console.log("impossible de se connecter")
        throw error;
    });
    
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
            //on arrete le scan et on reset l'appareil selectionné   
           await manager.cancelDeviceConnection(selectedDevice.id);
            alert("arret du scan et fin de selection");
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