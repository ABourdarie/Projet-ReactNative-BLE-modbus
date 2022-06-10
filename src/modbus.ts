import Debug from 'debug'; const debug = Debug('modbus-client')

import * as Stream from 'stream'
import {CRC} from './crc';

import {
  ReadCoilsRequestBody,
  ReadDiscreteInputsRequestBody,
  ReadHoldingRegistersRequestBody,
  ReadInputRegistersRequestBody,
  WriteMultipleCoilsRequestBody,
  WriteMultipleRegistersRequestBody,
  WriteSingleCoilRequestBody,
  WriteSingleRegisterRequestBody
} from '../node_modules/jsmodbus/dist/request'

import ModbusAbstractRequest from '../node_modules/jsmodbus/dist/abstract-request.js'
import ModbusAbstractResponse from '../node_modules/jsmodbus/dist/abstract-response.js'
import MBClientRequestHandler from '../node_modules/jsmodbus/dist/client-request-handler.js'
import MBClientResponseHandler from '../node_modules/jsmodbus/dist/client-response-handler.js'
import { UserRequestError } from '../node_modules/jsmodbus/dist/errors'
import { CastRequestBody } from '../node_modules/jsmodbus/dist/request-response-map'
import { WriteMultipleCoilsResponseBody } from '../node_modules/jsmodbus/dist/response'
import { PromiseUserRequest } from '../node_modules/jsmodbus/dist/user-request.js'
import { BleManager, NativeCharacteristic  } from 'react-native-ble-plx';
import { EventEmitter } from 'react-native';
import base64 from 'react-native-base64';


var Buffer = require('buffer/').Buffer  // note: the trailing slash is important!

/** Common Modbus Client
 * @abstract
 */
export default class modbusBleRtu {
  manager: BleManager;
  service: string;
  carateristiqueEcri: string;
  carateristiqueLect: NativeCharacteristic ;
  deviceId: string;


  /** Creates a new Modbus client object.
   * @param {BleManager} manager The ble manager
   */
  constructor ( manager: BleManager, deviceId: string, service: string, carateristiqueEcri: string, carateristiqueLect: NativeCharacteristic) {
   
    this.manager = manager;
    this.deviceId = deviceId;
    this.service = service;
    this.carateristiqueEcri = carateristiqueEcri;
    this.carateristiqueLect = carateristiqueLect;

  }

  /** Execute ReadCoils Request (Function Code 0x01)
   * @param {number} start Start Address.
   * @param {number} count Coil Quantity.
   * @returns {Promise}
   * @example
   * client.readCoils(0, 10).then(function (res) {
   *   console.log(res.response, res.request)
   * }).catch(function (err) {
   *   ...
   * })
   */
  public readCoils (start: number, count: number) {
    debug('issuing new read coils request')
    let request

    try {
      request = new ReadCoilsRequestBody(start, count)
    } catch (e) {
      debug('unknown request error occurred')
      return Promise.reject(e)
    }

    return (request)
  }

  /** Execute ReadDiscreteInputs Request (Function Code 0x02)
   * @param {number} start Start Address.
   * @param {number} count Coil Quantity.
   * @example
   * client.readDiscreteInputs(0, 10).then(function (res) {
   *   console.log(res.response, res.request)
   * }).catch(function (err) {
   *   ...
   * })
   */
  public readDiscreteInputs (start: number, count: number) {
    debug('issuing new read discrete inputs request')
    let request
    try {
      request = new ReadDiscreteInputsRequestBody(start, count)
    } catch (e) {
      debug('unknown request error occurred')
      return Promise.reject(e)
    }

    return (request)
  }

  //MOD

  /** Execute ReadHoldingRegisters Request (Function Code 0x03)
   * @param {number} start Start Address.
   * @param {number} count Coil Quantity.
   * @example
   * client.readHoldingRegisters(0, 10).then(function (res) {
   *   console.log(res.response, res.request)
   * }).catch(function (err) {
   *   ...
   * })
   */
  public async readHoldingRegisters (start: number, count: number) {

    await this.readInputRegisters(start, count)

    const buffer = Buffer;
    
    if (count <= 10){
      return (buffer.from(await (await this.manager.readCharacteristicForDevice(this.deviceId, this.service, this.carateristiqueLect.uuid)).value.toString(), 'base64').readUIntBE(3, count * 2))
    }
    
    //Verfication du checksum
    if (swap16(CRC(buffer.from(await (await this.manager.readCharacteristicForDevice(this.deviceId, this.service, this.carateristiqueLect.uuid)).value, 'base64').slice(0,-2))).toString(16)
    == (buffer.from(await (await this.manager.readCharacteristicForDevice(this.deviceId, this.service, this.carateristiqueLect.uuid)).value, 'base64').slice(-2).readUIntLE(0).toString(16) + buffer.from(await (await this.manager.readCharacteristicForDevice(this.deviceId, this.service, this.carateristiqueLect.uuid)).value.toString(), 'base64').slice(-2).readUIntLE(1).toString(16))) {

      return this.base64ToArrayBuffer(buffer.from(await (await this.manager.readCharacteristicForDevice(this.deviceId, this.service, this.carateristiqueLect.uuid)).value.toString()))
    } else {
      console.log(swap16(CRC(buffer.from(await (await this.manager.readCharacteristicForDevice(this.deviceId, this.service, this.carateristiqueLect.uuid)).value, 'base64').slice(0,-2))).toString(16))
      console.log(buffer.from(await (await this.manager.readCharacteristicForDevice(this.deviceId, this.service, this.carateristiqueLect.uuid)).value, 'base64').slice(-2).readUIntLE(0).toString(16) + buffer.from(await (await this.manager.readCharacteristicForDevice(this.deviceId, this.service, this.carateristiqueLect.uuid)).value, 'base64').slice(-2).readUIntLE(1).toString(16))
      return "Mauvais checksum"
    }
  
    

    function swap16(val) {
      return ((val & 0xFF) << 8)
             | ((val >> 8) & 0xFF);
    }  
  
  }

  
  /** Execute ReadInputRegisters Request (Function Code 0x04)
   * @param {number} start Start Address.
   * @param {number} count Coil Quantity.
   * @example
   * client.readInputRegisters(0, 10).then(function (res) {
   *   console.log(res.response, res.request)
   * }).catch(function (err) {
   *   ...
   * })
   */
  public async readInputRegisters (start: number, count: number) {


      // sanity check
      if (typeof start === "undefined") {
          return;
      }

      // function code defaults to 4
      let code = 4;


      const codeLength = 6;
      const buf = Buffer.alloc(codeLength + 2); // add 2 crc bytes

      buf.writeUInt8(1, 0);
      buf.writeUInt8(code, 1);
      buf.writeUInt16BE(start, 2);
      buf.writeUInt16BE(count, 4);

      // add crc bytes to buffer
      buf.writeUInt16LE(CRC(buf.slice(0, -2)), codeLength);

      // write buffer to characteristic
      await this.manager.writeCharacteristicWithResponseForDevice(this.deviceId, this.service, this.carateristiqueEcri, buf.toString('base64'));
  }

   /**
     * Write a Modbus "Preset Multiple Registers" (FC=16).
     *
     * @param {number} start the Data Address of the first register.
     * @param {Array} array the array of values to write to registers.
     */
    public async writeFC16 ( start: number, array: Buffer){

      // sanity check
      if (typeof start === "undefined") {
        return;
      }

      let valueBuf = new Buffer.from(array, 'hex');

      const code = 16;


      let dataLength = valueBuf.length;
      if (Buffer.isBuffer(valueBuf)) {
          // if valueBuf is a buffer it has double length
          dataLength = valueBuf.length / 2;
      }

      const codeLength = 7 + 2 * dataLength;
      const buf = Buffer.alloc(codeLength + 2); // add 2 crc bytes

      buf.writeUInt8(1, 0);
      buf.writeUInt8(code, 1);
      buf.writeUInt16BE(start, 2);
      buf.writeUInt16BE(dataLength, 4);
      buf.writeUInt8(dataLength * 2, 6);

      // copy content of valueBuf to buf
      if (Buffer.isBuffer(valueBuf)) {
        valueBuf.copy(buf, 7);
      } else {
          for (let i = 0; i < dataLength; i++) {
              buf.writeUInt16BE(valueBuf[i], 7 + 2 * i);
          }
      }

      // add crc bytes to buffer
      buf.writeUInt16LE(CRC(buf.slice(0, -2)), codeLength);
      console.log(buf.toString('hex'))

      //write buffer to charac
      console.log(buf.toString('base64'));

      const tailleDuMessage = 20;

      if (buf.toString('hex').length > tailleDuMessage) {

        let newBuffer = new Buffer.from(buf ,'hex')
        let actualSlice;
        let count = 0;
        let tailleRestante = newBuffer.length;
        
        while (tailleRestante > tailleDuMessage) {
          newBuffer = new Buffer.from(buf ,'hex')
          actualSlice = newBuffer.slice(0 + count,tailleDuMessage + count)
          console.log(actualSlice.toString('base64'));
          await this.manager.writeCharacteristicWithResponseForDevice(this.deviceId, this.service, this.carateristiqueEcri, actualSlice.toString('base64'))
          .catch((error) => {
            console.log(error)
              console.log("impossible d'écrire sur la characteristique la partie du buffer de configuration")
            throw error;
          } )
          count = count + tailleDuMessage;
          tailleRestante = tailleRestante - tailleDuMessage;
        }
        
        newBuffer = new Buffer.from(buf ,'hex')
        actualSlice = newBuffer.slice(0 + count, newBuffer.length)
        console.log(actualSlice.toString('base64'))
        await this.manager.writeCharacteristicWithResponseForDevice(this.deviceId, this.service, this.carateristiqueEcri, actualSlice.toString('base64'))


      } else {
        await this.manager.writeCharacteristicWithResponseForDevice(this.deviceId, this.service, this.carateristiqueEcri, buf.toString('base64'));
      }

      

  }

  /**
     * Fonction suplémentaire avant FC=16 "Formater des elements de config".
     * Elles ont pour but de modifier la configuration d'un seul coup avec un tableau contenant les modifications
     *
     * @param {number} debutDuRegConf adresse du premier registre que l'on veut modifier dans la config.
     * @param {number} nombreDeRegistre Le nombre de registre correspondant a cette configuration.
     * @param {number} registreDuParametreAModifier Numero du premier registre à modifier
     * @param {number} nombreDeRegistreAEcrire Le nombre de registre correspondant à la valeur
     * @param {Buffer} valeursEnBuff La nouvelle valeur pour ces registres
     * @param {Buffer} bufferInitial Le buffer qui doit être modifié
     * @return {promise} Le nouveau buffer
     *
     */
   public async writeConfigReg (debutDuRegConf:number, nombreDeRegistre:number, registreDuParametreAModifier: number, nombreDeRegistreAEcrire: number, valeursEnBuff: any, bufferInitial: Buffer){

    console.log("debut writeConfigReg")

    const premiereValeurAEcrire =  (registreDuParametreAModifier - debutDuRegConf) * 2

    console.log("position de la première valeur a écrire : " + premiereValeurAEcrire)
    

    let buffSansEnteteEtCrc = new Buffer(bufferInitial);

    console.log("buffer entier : " + new Uint8Array(buffSansEnteteEtCrc))

    let chainePreValeur =  new Buffer.from(buffSansEnteteEtCrc.slice(0, premiereValeurAEcrire))
    let chainePostValeur =  new Buffer.from(buffSansEnteteEtCrc.slice(premiereValeurAEcrire + nombreDeRegistreAEcrire * 2))

    console.log("chaine debut : " + new Uint8Array(chainePreValeur))
    console.log("chaine de fin : " + new Uint8Array(chainePostValeur))

    // console.log(typeof valeursEnBuff.toString('hex'))

    let valeurACopier

    let tabBuffer;

    let buffATransferer;

    if( typeof valeursEnBuff == 'string') {

      // valeursEnBuff = this.ascii_to_hex(valeursEnBuff)
      valeursEnBuff = base64.encode(valeursEnBuff)
      valeursEnBuff = new Buffer(this.base64ToArrayBuffer(valeursEnBuff))

      console.log("nouveau nom du lide : " + new Uint8Array(valeursEnBuff))

      console.log("testPremiereFonc")
    
      let arrCompte = new Uint8Array(valeursEnBuff)
    
      console.log("taille du mot : " + valeursEnBuff.length);

      const array = new Uint8Array(nombreDeRegistreAEcrire * 2 - arrCompte.length).fill(0);

      console.log("nombre de zero : " + array.length)

      console.log("Taille totale : " + array.length + " + " + arrCompte.length + "/" + nombreDeRegistreAEcrire * 2 )
     
      let bufRemplissage = (new Buffer.from(array));

      console.log("Buffer de remplissage " + bufRemplissage)

      console.log(typeof chainePreValeur)
      console.log(typeof valeursEnBuff)
      console.log(typeof bufRemplissage)
      console.log(typeof chainePostValeur)

      tabBuffer = new Array(chainePreValeur, valeursEnBuff, bufRemplissage, chainePostValeur)

      buffATransferer =  Buffer.concat(tabBuffer)

      console.log("buffer final : " + buffATransferer.toString())

    } else {
      console.log("test deuxième fonc")

      console.log(valeursEnBuff)

      valeurACopier = valeursEnBuff

      console.log(valeurACopier)

      buffATransferer = buffSansEnteteEtCrc;

      console.log(buffATransferer)

      buffATransferer.writeUIntBE(valeurACopier, premiereValeurAEcrire, 2);


    }

    return buffATransferer;

}




/**
     * Fonction a appeler avec un tableau qui consigne toutes les modifications. Cette fonction va toutes les appliquer
     *
     * @param {number} registreDuParametreAModifier registre du paramètre que l'on veut modifier dans la config.
     * @param {number} nombreDeRegistreAEcrire Le nombre de registre correspondant a ce parametre.
     * @param {Array} TableauDesModifs toutes les modification a effectuer.
     *
     */
 public async changeWholeConfig (debutDuRegConf:number, nombreDeRegistre:number, TableauDesModifs){

  let registreActuel = await this.readHoldingRegisters(debutDuRegConf,nombreDeRegistre);

  console.log("test1 :::: " + registreActuel)

  registreActuel = registreActuel.slice(3,-2);
  console.log(registreActuel)

  function Modifications(valeur, registreInital, nombreDeRegistre){
    this.valeur = valeur;
    this.registreInital = registreInital;
    this.nombreDeRegistre = nombreDeRegistre;
  }
  
  var TabDeModifs = [
    new Modifications("Frigo2", 4001, 12),
    new Modifications(1, 4062, 1),
    new Modifications(312, 4064, 1),
  ]

  //Il faudra remplacer le tableau de modif par celui passé en parametre
  for (let index = 0; index < TabDeModifs.length; index++) {
    const element = await TabDeModifs[index];
    registreActuel = await this.writeConfigReg(debutDuRegConf, nombreDeRegistre, element.registreInital, element.nombreDeRegistre, element.valeur, registreActuel)
  }

  await this.writeFC16(debutDuRegConf,registreActuel.toString('hex'))
} 

public base64ToArrayBuffer(stringb64) {
  let binaryString = base64.decode(stringb64);
  let binaryLength = binaryString.length;
  let bytes = new Uint8Array(binaryLength);

  for (let i = 0; i < binaryLength; i++) {
      let ascii = binaryString.charCodeAt(i);
      bytes[i] = ascii;
  }
  return bytes;
}

private ascii_to_hex(str)
  {
	var arr1 = [];
	for (var n = 0, l = str.length; n < l; n ++) 
     {
		var hex = Number(str.charCodeAt(n)).toString(16);
		arr1.push(hex);
	 }
	return arr1.join('');
   }

  


  /** Execute WriteSingleCoil Request (Function Code 0x05)
   * @param {number} address Address.
   * @param {boolean | 0 | 1} value Value.
   * @example
   * client.writeSingleCoil(10, true).then(function (res) {
   *   console.log(res.response, res.request)
   * }).catch(function (err) {
   *   ...
   * })
   */
  public writeSingleCoil (address: number, value: boolean | 0 | 1) {
    debug('issuing new write single coil request')

    let request
    try {
      request = new WriteSingleCoilRequestBody(address, value)
    } catch (e) {
      debug('unknown request error occurred')
      return Promise.reject(e)
    }

    return (request)
  }

  /** Execute WriteSingleRegister Request (Function Code 0x06)
   * @param {number} address Address.
   * @param {number} value Value.
   * @example
   * client.writeSingleRegister(10, 1234).then(function (res) {
   *   console.log(res.response, res.request)
   * }).catch(function (err) {
   *   ...
   * })
   */
  public writeSingleRegister (address: number, value: number) {
    debug('issuing new write single register request')
    let request
    try {
      request = new WriteSingleRegisterRequestBody(address, value)
    } catch (e) {
      debug('unknown request error occurred')
      return Promise.reject(e)
    }

    return (request)
  }

}