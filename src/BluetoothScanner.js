import { List } from 'native-base';
import { convertAbsoluteToRem } from 'native-base/lib/typescript/theme/tools';
import React, { useState, useEffect } from 'react';
import { Platform, PlatformIOSStatic } from 'react-native'
import { View, Text, FlatList, TouchableHighlight, SafeAreaView, Alert, Button, PermissionsAndroid } from 'react-native';
import { BleManager } from 'react-native-ble-plx';
import { TouchableOpacity } from 'react-native-web';
import HTMLtoPDF from './Alerts';
import modbusBleRtu from './modbus';
import moment from 'moment'; 
import { EventRegister } from 'react-native-event-listeners'
import base64 from 'react-native-base64';




export const manager = new BleManager();
var Buffer = require('buffer/').Buffer  // note: the trailing slash is important!
export let modBManager = new modbusBleRtu();
 
let serviceSelect;
let caracLect;
let caracErci;
let caracRecep;
let caracEnv;
let tablLideEnreg = [];

let enCours = false;
let refreshIntervalId;
moment.locale('fr');
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

  function sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  async function getTime() {
    console.log("test date"); 
      let time = await modBManager.readHoldingRegisters(500,2);
      console.log(time)
      console.log(new Date(time * 1000).toLocaleString())
      return (new Date(time * 1000).toLocaleString())
  }


  async function getInfos() {
    console.log(tablLideEnreg)
    for (let indexgetInfos = 0; indexgetInfos < tablLideEnreg.length; indexgetInfos++) {
      try {
        const element = tablLideEnreg[indexgetInfos];
        console.log(1)
        await connectDevice(element);
        console.log(2)
        await testModbus(element); 
        console.log(3)
        await manager.cancelDeviceConnection(element.id);
      } catch (error) {
        console.log(error + " impossible de se connecter")
      }
    }
  }

  function Mesure(indice, nMesure,timeStamp, valeurV1, valeurV2){
    this.indice = indice;
    this.nMesure = nMesure;
    this.timeStamp = timeStamp;
    this.valeurV1 = valeurV1;
    this.valeurV2 = valeurV2;
  }

  async function searchForST(adresseLide,premiereMesure,nbMesures) {

    let demande = "C:" + premiereMesure.toString() + ":" + nbMesures.toString();

    const commande = await (new Buffer(demande)).toString('base64');

    // console.log(commande)

    // console.log(caracEnv.uuid)
    // console.log(caracRecep.uuid)

    await caracEnv.writeWithResponse(commande);

    const caracteristique = await caracRecep.read()
    
    let valeurFinale = await caracteristique.value;

    // console.log(typeof valeurFinale)

    valeurFinale = base64.decode(valeurFinale);

    return (valeurFinale)

  }

  async function monitorValues(adresseLide, premiereMesure, nbMesures) {
    // const [Donnees, setDonnees] = useState([]);
    let Donnees =[];
    
    console.log("début de fonction")

    let demande = "M:" + premiereMesure.toString() + ":" + nbMesures.toString();

    
    await connectDevice(adresseLide)

    console.log(moment(new Date()).format("mm-ss-ms"))
    

    console.log(caracEnv.uuid)
    console.log(caracRecep.uuid)

    let charValue;

    const subscrpition = caracRecep.monitor((error, char) => {
      try {
        charValue = char.value;
      } catch (error) {
        console.log("la fonction est a l'arret")
      }
      // console.log("erreur de monitor " + error);
      // console.log("valeur monitor " + base64ToArrayBuffer(new Buffer(char.value)));
      let indice = (new Buffer(base64ToArrayBuffer(new Buffer(charValue)).slice(0,2))).readUInt16BE(0)
      let nMesure = (new Buffer(base64ToArrayBuffer(new Buffer(charValue)).slice(2,6))).readUInt32BE(0)
      let timeStamp = (new Buffer(base64ToArrayBuffer(new Buffer(charValue)).slice(6,10))).readUInt32BE(0)
      // let timeStamp = new Date((new Buffer(base64ToArrayBuffer(new Buffer(charValue)).slice(6,10))).readUInt32BE(0) * 1000).toLocaleString()
      let valeurV1 = (new Buffer(base64ToArrayBuffer(new Buffer(charValue)).slice(10,12))).readUInt16BE(0)/10
      let valeurV2 = (new Buffer(base64ToArrayBuffer(new Buffer(charValue)).slice(12,14))).readUInt16BE(0)/10
      // console.log(indice + "/" + nMesure + "/" + timeStamp + "/" + valeurV1 + "/" + valeurV2)
      Donnees.push(new Mesure(indice,nMesure,timeStamp,valeurV1,valeurV2))
    })

    const commande = await (new Buffer(demande)).toString('base64');
     
    console.log(subscrpition)
    console.log("envoi de " + commande)
    
    await caracEnv.writeWithResponse(commande)
    
    console.log("fin de fonction")

    let dernierNombre = 999;

    while (Donnees.length != nbMesures && Donnees.length != dernierNombre ) {
      dernierNombre = Donnees.length
      // await console.log(Donnees.length)
      // await console.log(nbMesures)
      await sleep(100)
    }

    subscrpition.remove()
  
    return Donnees
  }

  function base64ToArrayBuffer(stringb64) {
    let binaryString = base64.decode(stringb64);
    let binaryLength = binaryString.length;
    let bytes = new Uint8Array(binaryLength);

    for (let i = 0; i < binaryLength; i++) {
        let ascii = binaryString.charCodeAt(i);
        bytes[i] = ascii;
    }
    return bytes;
}

  /** Fonction Modbus qui va créer un nouveau manager modbus et executer les requetes
   * @param {DeviceBLE} selectedDevice L'appareil sur lequel on veut lire des informations.
   * @example 
   * testModbus(tablLideEnreg[0])
   * @return rien
   * fait de l'affichage en console mais peut être utilisé par l'application
   */
  async function testModbus(selectedDevice) {

    modBManager = await new modbusBleRtu(manager, selectedDevice.id, serviceSelect.uuid, caracErci.uuid, caracLect);
                 console.log("le modbus manager est crée")
                    await modBManager.readHoldingRegisters(500,2)
                    .then(async (timestamp) => {
                      const DeuxiemeDateDuLide = new Date(timestamp * 1000)
                      console.log(DeuxiemeDateDuLide.toLocaleString());
                    })
                    await modBManager.readHoldingRegisters(502,1)
                    .then(async (nbVoies) => {
                      console.log("Nombre de voies : " + new Buffer(nbVoies))
                    })
                    await modBManager.readHoldingRegisters(503,1)
                    .then(async (nbVoiesMax) => {
                      console.log("Nombre de voies Maximum : " + nbVoiesMax)
                    })
                    await modBManager.readHoldingRegisters(504,1)
                    .then(async (modele) => {
                      console.log("Numero de modèle : " + modele)
                    })
                    await modBManager.readHoldingRegisters(3000,107)
                    .then(async (config) => {
                      console.log("Configuration Générale : " + config)
                    })
                    await modBManager.readHoldingRegisters(596,67)
                    .then(async (valeursVoies) => {
                      console.log("Valeurs des voies : " + valeursVoies)
                    })
                    await modBManager.readHoldingRegisters(1100,63)
                    .then(async (etatAlarme) => {
                      console.log("Etat des alarmes : " + etatAlarme)
                    })
                    await modBManager.readHoldingRegisters(4000,75)
                    .then(async (Voies) => {
                      console.log("Config voies " + Voies)
                    })
                    await modBManager.changeWholeConfig(4000, 75, 0)
                    // await modBManager.readHoldingRegisters(3000,107)
                    // .then(async (config) => {
                    //   console.log("configuration buffer " + config)
                    //   var arr = Array.prototype.slice.call(config, 0)
                    //   console.log(arr.length)
                    //   console.log(arr)
                    //   let NouveauNom = "LIDE 2V Alexandre";
                    //   let AncienNom = "LIDE 2V Alex";
                    //   console.log(NouveauNom + "/" + AncienNom)
                    //   // await modbusManager.writeConfigReg(3000, 107, 3013, 25, NouveauNom)
                    //   // .then( async () => {
                    //   //   console.log("Timing ?")
                    //   //   await modbusManager.changeWholeConfig(4000, 75, 0)
                    //   // })
                    // })
  }



  /** Fonction BLE qui se charge de se connecter et de découvrir les caractéristiques
   * @param {DeviceBLE} selectedDevice L'appareil sur lequel on veut se connecter.
   * @example 
   * connectDevice(tablLideEnreg[0])
   * @return rien
   * établit la connexion et change les paramètres globaux (caracLect etc...)
   */
  async function connectDevice(selectedDevice) {

    manager.stopDeviceScan();

    await manager.connectToDevice(selectedDevice.id)
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

        for (let index = 0; index < services.length; index++) {
          const service = services[index];
        
          console.log("début caracteristique\n")
          
          serviceSelect = service;

          const readCharacteristic = await manager.characteristicsForDevice(selectedDevice.id, service.uuid)

          for (let index2 = 0; index2 < readCharacteristic.length; index2++) {
            const characteristic = readCharacteristic[index2];

            console.log(characteristic.uuid)
            console.log(characteristic.uuid.toString().slice(7,8))

            if (characteristic.uuid.toString().slice(7,8) == 2) {
              caracErci = characteristic;
              console.log("Ecriture : " + characteristic.uuid);
              // const bufR = Buffer.from([0x01, 0x04, 0x01, 0xF4, 0x00, 0x02, 0x31, 0xC5 ]).toString('base64');
              // console.log(bufR);
              // characteristic.writeWithResponse(bufR);
            }

            if (characteristic.uuid.toString().slice(7,8) == 3) {
              caracLect = characteristic;
        
              console.log("Lecture : " + characteristic.uuid)
              
              // exemple de lecture pour la date de l'appareil
              // await manager.readCharacteristicForDevice(selectedDevice.id, service.uuid, readChar.uuid)
              // .then(async (characteristic) => { 
              //   console.log(characteristic.deviceID)
              //   console.log(characteristic.value)
              //   console.log(Buffer.from(characteristic.value.toString(), 'base64'))
              //   const DateDuLide = new Date(Buffer.from(characteristic.value.toString(), 'base64').readUIntBE(3, 4) * 1000)
              //   console.log(DateDuLide.toLocaleString());
              // })

              
            }

             // if (typeof caracLect !== "undefined") {
              //   console.log(selectedDevice.id);
              //   console.log(serviceSelect.uuid);
              //   console.log(caracErci.uuid);
              //   console.log(caracLect.uuid);     
                
              // } 

            if (characteristic.uuid.toString().slice(7,8) == 4) {
              
              caracEnv = characteristic;
              console.log("Notifiable : " + caracEnv.uuid)
            }

            if (characteristic.uuid.toString().slice(7,8) == 5) {
  
              caracRecep = characteristic;
              console.log("Notifie : " + caracRecep.uuid)
            }
            
          }

          
        }
        
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
  const [buttonColor, setButtonColor] = useState(false);

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
    <>
    <View style={{ flex: 1, padding: 10 }}>
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
              });
            }
            return (true);
          } } />
      </SafeAreaView>

      <View style={{ flex: 3, padding: 10 }}>

        <Text style={{ fontWeight: "bold" }}> ({selectedDevice.name}) / ({selectedDevice.id})       ({tablLideEnreg.length})</Text>


        <Button
          title="add"
          onPress={async () => {
            alert("ajout de Lide");
            tablLideEnreg.unshift(selectedDevice)
            // connectDevice(selectedDevice);
          } } />

        <Button
          title="disconnect"
          onPress={async () => {
            
            //on arrete le scan et on reset l'appareil selectionné  
            if (selectedDevice.id != null && manager.isDeviceConnected(selectedDevice.id)) {
              try {
                await manager.cancelDeviceConnection(selectedDevice.id);
                setSelectedDevice({})
              } catch (error) {
                console.log(error)
              }
              
            } 

           tablLideEnreg = [];

            alert("arret du scan et fin de selection");
            return (true);
          } } />
          
          <Button
          title="MiniTrame BLE Microlide"
          color="#458951"
          onPress={async () => {

            await connectDevice(tablLideEnreg[0])

            console.log(moment(new Date()).format("mm-ss-ms"));

            for(let i=0; i<= 100; i++) {
              const result1 = await searchForST(tablLideEnreg[0],0,1)
              console.log(" valeur de retour : " + result1)
            }

            console.log(moment(new Date()).format("mm-ss-ms"));

            await manager.cancelDeviceConnection(tablLideEnreg[0].id)
            } 
          } />

          <Button
          title="START"
          onPress={async () => {
            clearInterval(refreshIntervalId)
            refreshIntervalId = setInterval(async () => {
              if (!enCours) {
                enCours = true;
                await getInfos();
                enCours = false;
              }
            } , 100);
            
          } } />    

          <Button
          title="STOP"
          color="#841584"
          onPress={async () => {
            clearInterval(refreshIntervalId)
            } 
          } />

          <Button
          title="Alerte"
          color="#841584"
          onPress={async () => {
            if (buttonColor) {
              setButtonColor(false)
              Alert.alert('Interaction 1')
            }
             else {
              setButtonColor(true)
              Alert.alert('Interaction 2')
            }
            } 
          } />

          <Button
          title="surveillance"
          color="#841584"
          onPress={async () => {
            const result = await monitorValues(tablLideEnreg[0],0,400)
            console.log(" valeur de retour : " + result.toString())
            console.log(" taille Du tableau : " + result.length)
            console.log(moment(new Date()).format("mm-ss-ms"))
            await manager.cancelDeviceConnection(tablLideEnreg[0].id)
            } 
          } />

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