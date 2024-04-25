import { Converter } from "./Converter";
import { IBasicType, IValue } from "../types";
import { Buffer } from "../Buffer";
import { decodeUTF8, encodeUTF8 } from "../utils/utf8";


export class BasicConverter extends Converter {
  constructor(private config: BasicTypesConfig) {
    super(config.name);
    
  }
  
  serialize(value: IValue, buffer: Buffer) {
    const size = this.config.write(buffer.dataView, buffer.offset, value);
    buffer.offset += size;
  }
  
  size(value: IValue): number {
    return this.config.size(value)
  }
  
  deserialize(buffer: Buffer): IValue {
    let result = this.config.read(buffer.dataView, buffer.offset);
    buffer.offset += this.config.size(result);
    return result;
  }
  
  static fromGlobalConfigs(): [IBasicType, Converter][] {
    return basicTypes.reduce<[IBasicType, Converter][]>((acc, config) => {
      acc.push([config.name,
        new BasicConverter(config)
      ]);
      return acc;
    }, [])
  }
}


export type BasicTypesConfig = {
  name: IBasicType;
  size: (value: any) => number;
  read: (v: DataView, byteOffset: number) => IValue;
  write: (v: DataView, byteOffset: number, value: IValue) => number;
};


export const IS_LITTLE_ENDIAN = true; // todo check
/**
 *
 * Read function returns value from byte array.
 * Write function returns type byte size.
 */
export const basicTypes = [
  {
    name: "int8",
    size: () => 1,
    read: (v, s) => v.getInt8(s),
    write: (v, s, a) => {
      v.setInt8(s, a);
      return 1;
    }
  }, {
    name: "uint8",
    size: () => 1,
    read: (v, s) => v.getUint8(s),
    write: (v, s, a) => {
      v.setUint8(s, a);
      return 1;
    }
  }, {
    name: "int16",
    size: () => 2,
    read: (v, s) => v.getInt16(s, IS_LITTLE_ENDIAN),
    write: (v, s, a) => {
      v.setInt16(s, a, IS_LITTLE_ENDIAN);
      return 2;
    }
  }, {
    name: "uint16",
    size: () => 2,
    read: (v, s) => v.getUint16(s, IS_LITTLE_ENDIAN),
    write: (v, s, a) => {
      v.setUint16(s, a, IS_LITTLE_ENDIAN);
      return 2;
    }
  }, {
    name: "int32",
    size: () => 4,
    read: (v, s) => v.getInt32(s, IS_LITTLE_ENDIAN),
    write: (v, s, a) => {
      v.setInt32(s, a, IS_LITTLE_ENDIAN);
      return 4;
    }
  }, {
    name: "uint32",
    size: () => 4,
    read: (v, s) => v.getUint32(s, IS_LITTLE_ENDIAN),
    write: (v, s, a) => {
      v.setUint32(s, a, IS_LITTLE_ENDIAN);
      return 4;
    }
  }, {
    name: "int64",
    size: () => 8,
    read: function (v, s) {
      return v.getBigInt64(s, IS_LITTLE_ENDIAN);
    },
    write: (v, s, a) => {
      v.setBigInt64(s, BigInt(a), IS_LITTLE_ENDIAN);
      return 8;
    }
  }, {
    name: "uint64",
    size: () => 8,
    read: (v, s) => {
      
      return v.getBigUint64(s, IS_LITTLE_ENDIAN);
    },
    write: (v, s, a) => {
      v.setBigUint64(s, BigInt(a), IS_LITTLE_ENDIAN);
      return 8;
    }
  }, {
    //   name: "float",
    //   size: () => 4,
    //   read: (v, s) => v.getFloat32(s, IS_LITTLE_ENDIAN),
    //   write: (v, s, a) => {
    //     v.setFloat32(s, a, IS_LITTLE_ENDIAN);
    //     return 4;
    //   }
    // }, {
    name: "float32",
    size: () => 4,
    read: (v, s) => v.getFloat32(s, IS_LITTLE_ENDIAN),
    write: (v, s, a) => {
      v.setFloat32(s, a, IS_LITTLE_ENDIAN);
      return 4;
    }
  }, {
    name: "float64",
    size: () => 8,
    read: (v, s) => v.getFloat64(s, IS_LITTLE_ENDIAN),
    write: (v, s, a) => {
      v.setFloat64(s, a, IS_LITTLE_ENDIAN);
      return 8;
    }
  }, {
    name: "char",
    size: () => 1,
    read: (v, s) => String.fromCharCode(v.getInt8(s)),
    write: (v, s, a) => {
      v.setInt8(s, a ? a.toString().charCodeAt(0) : 0);
      return 1;
    }
  }, {
    name: "bool",
    size: () => 1,
    read: (v, s) => Boolean(v.getInt8(s)),
    write: (v, s, a) => {
      v.setInt8(s, a ? 1 : 0);
      return 1;
    }
  }, {
    name: "string",
    size: (value: string) => value.length + 4,
    read: (v, s) => {
      return decodeUTF8(new Uint8Array(v.buffer, s + 4, v.getUint32(s, IS_LITTLE_ENDIAN)));
    },
    write: (v, s, a: string) => {
      let size = a.length;
      v.setUint32(s, size, IS_LITTLE_ENDIAN);
      
      let uint8View = new Uint8Array(v.buffer, v.byteOffset, v.byteLength);
      const encode = encodeUTF8(a)
      
      uint8View.set(encode, s + 4);
      
      return size + 4;
    }
  }, {
    name: 'bytes',
    size: (value: Uint8Array) => value.length + 4,
    read: (v, s) => {
      return new Uint8Array(v.buffer, s + 4, v.getUint32(s, IS_LITTLE_ENDIAN));
    },
    write: (v, s, a: Uint8Array) => {
      let size = a.length;
      v.setUint32(s, size, IS_LITTLE_ENDIAN);
      
      let uint8View = new Uint8Array(v.buffer, v.byteOffset, v.byteLength);
      uint8View.set(a, s + 4);
      
      return size + 4;
    }
  }
] satisfies BasicTypesConfig[]