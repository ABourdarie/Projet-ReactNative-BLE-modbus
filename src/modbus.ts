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
    public async writeFC16 ( start: number, array){

      // sanity check
      if (typeof start === "undefined") {
        return;
      }

      const code = 16;

      let dataLength = array.length;
      if (Buffer.isBuffer(array)) {
          // if array is a buffer it has double length
          dataLength = array.length / 2;
      }

      const codeLength = 7 + 2 * dataLength;
      const buf = Buffer.alloc(codeLength + 2); // add 2 crc bytes

      buf.writeUInt8(1, 0);
      buf.writeUInt8(code, 1);
      buf.writeUInt16BE(start, 2);
      buf.writeUInt16BE(dataLength, 4);
      buf.writeUInt8(dataLength * 2, 6);

      // copy content of array to buf
      if (Buffer.isBuffer(array)) {
          array.copy(buf, 7);
      } else {
          for (let i = 0; i < dataLength; i++) {
              buf.writeUInt16BE(array[i], 7 + 2 * i);
          }
      }

      // add crc bytes to buffer
      buf.writeUInt16LE(CRC(buf.slice(0, -2)), codeLength);

      // write buffer to characteristic
      await this.manager.writeCharacteristicWithResponseForDevice(this.deviceId, this.service, this.carateristiqueEcri, buf.toString('base64'));

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