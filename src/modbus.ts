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
    return (buffer.from(await (await this.manager.readCharacteristicForDevice(this.deviceId, this.service, this.carateristiqueLect.uuid)).value.toString(), 'base64')).toString('hex')
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
     *
     * @param {number} registreDuParametreAModifier registre du paramètre que l'on veut modifier dans la config.
     * @param {number} nombreDeRegistreAEcrire Le nombre de registre correspondant a ce parametre.
     * @param {Array} valeursEnTableau les nouvelles valeurs sous forme de tableau(Array).
     *
     */
   public async writeConfigReg ( registreDuParametreAModifier: number, nombreDeRegistreAEcrire: number, valeursEnBuff: Buffer){

    const DEBUTDUREGISTRECONF = 3000
    const NOMBREDEREGISTRE = 107;

    const premiereValeurAEcrire = 6 + (registreDuParametreAModifier - DEBUTDUREGISTRECONF)*2

    let config = await this.readHoldingRegisters(DEBUTDUREGISTRECONF,NOMBREDEREGISTRE)
    //let arr = Array.prototype.slice.call(config, 0)
    //resultat = arr;
    let buffEntier = config.toString('hex');
    
    console.log(buffEntier);
    console.log(buffEntier[1]);
    console.log(buffEntier[3]);
    console.log(buffEntier[14]);

    let chaineSansDebEtCrc = buffEntier.slice(6,-4)
    console.log(chaineSansDebEtCrc)

    let valeurACopier = new Buffer.from(valeursEnBuff, 'hex')

    let chainePreValeur =  new Buffer.from(buffEntier.slice(6, premiereValeurAEcrire * 2 - 6), 'hex')
    let chainePostValeur =  new Buffer.from(buffEntier.slice(premiereValeurAEcrire * 2 - 6 + nombreDeRegistreAEcrire * 2 , -4), 'hex')

    console.log(chainePreValeur)
    console.log(chainePostValeur)

    let arrCompte = new Array(valeursEnBuff.toString('hex'))

    console.log("taille du mot : " + arrCompte[0].length);

    const array = new Array((nombreDeRegistreAEcrire * 2 - arrCompte[0].length) / 2 - 1).fill(0);

    console.log("nombre de zero : " + array.length)

    console.log("Taille totale : " + array.length + "*2 + " + arrCompte[0].length + "/50")
    let bufRemplissage = new Buffer.from(array, 'hex' );

    console.log("Buffer de remplissage " + bufRemplissage.toString('hex'))
    let tabBuffer = new Array(chainePreValeur, valeurACopier, bufRemplissage, new Buffer.from([0]), chainePostValeur)

    console.log(tabBuffer)

    var buffATransferer =  Buffer.concat(tabBuffer)

    console.log(buffATransferer)

    this.writeFC16(DEBUTDUREGISTRECONF,buffATransferer.toString('hex'))
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