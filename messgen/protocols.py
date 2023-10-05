import os
import yaml

# Protocols map structure:
# {
#   proto_name: {
#     proto_id: <proto_id>   // optional
#     types: {
#       <type_name>: <type_definition>,
#       ...
#     }
#     messages: {
#       <msg_id>: <type_name>,
#     }
#   }
# }
#
# Type definition structure:
# {
#   type_class: <class>,   // enum, struct, external, alias
#   size: <size>,          // optional, only for fixed-size types, total serialized size in bytes
#   comment: <comment>,    // optional
#
#   // type-dependent fields:
#
#   // - enum
#   base_type: <base_type>,   // scalar integer type, e.g. uint8, uint32
#   values: {
#     <item_0>: {
#       value: <value_0>,
#       comment: <comment_0>,   // optional
#     },
#     <item_1>: {
#       ...
#     },
#     ...
#   }
#
#   // - struct
#   fields: [
#     {
#       name: <name_0>,
#       type: <type_0>,
#       comment: <comment_0>,   // optional
#     },
#     {
#       ...
#     },
#     ...
#   ]
# }
#
# Field type structure:
# - scalar:
#   e.g. "uint8"
# - enum:
#   e.g. "my_enum"
# - array:
#   e.g. "uint8[4]"
# - vector:
#   e.g. "uint8[]"

CONFIG_EXT = ".yaml"
PROTOCOL_ITEM = "_protocol"

_SCALAR_TYPES_INFO = {
    "char": {"size": 1},
    "int8": {"size": 1},
    "uint8": {"size": 1},
    "int16": {"size": 2},
    "uint16": {"size": 2},
    "int32": {"size": 4},
    "uint32": {"size": 4},
    "int64": {"size": 8},
    "uint64": {"size": 8},
    "float32": {"size": 4},
    "float64": {"size": 8},
}


class Protocols:
    proto_map: dict[str, dict] = {}

    def load(self, base_dirs: list[str], proto_list: list[str]):
        for proto_name in proto_list:
            loaded = False
            for base_dir in base_dirs:
                proto_path = base_dir + os.path.sep + proto_name

                if os.path.exists(proto_path):
                    print("Loading protocol: %s from %s" % (proto_name, base_dir))
                    self.proto_map[proto_name] = self._load_protocol(proto_path)
                    loaded = True
            if not loaded:
                print("Protocol %s not found in base directories (%s)" % (proto_name, base_dirs))

    def get_type(self, curr_proto_name, type_name) -> dict:
        # Scalar
        t = _SCALAR_TYPES_INFO.get(type_name)
        if t:
            return {
                "type": type_name,
                "type_class": "scalar",
                "size": t["size"]
            }

        if len(type_name) > 2:
            # Vector
            if type_name.endswith("[]"):
                return {
                    "type": type_name,
                    "type_class": "vector",
                    "element_type": type_name[:-2]
                }

            # Array
            if type_name.endswith("]"):
                p = type_name[:-1].split("[")
                el_type = "[".join(p[:-1])
                array_size = int(p[-1])
                res = {
                    "type": type_name,
                    "type_class": "array",
                    "element_type": el_type,
                    "array_size": array_size,
                }
                el_type_def = self.get_type(curr_proto_name, el_type)
                sz = el_type_def.get("size")
                if sz is not None:
                    res["size"] = sz * array_size
                return res

            # Map
            if type_name.endswith("}"):
                p = type_name[:-1].split("{")
                value_type = "{".join(p[:-1])
                key_type = p[-1]
                return {
                    "type": type_name,
                    "type_class": "map",
                    "key_type": key_type,
                    "value_type": value_type,
                }

        if type_name == "string":
            return {
                "type": type_name,
                "type_class": "string",
            }

        # Type from current protocol
        t = self.proto_map[curr_proto_name]["types"].get(type_name)
        if t:
            t["type"] = type_name
            if t["type_class"] == "enum":
                t["size"] = self.get_type(curr_proto_name, t["base_type"])["size"]
            elif t["type_class"] == "struct":
                sz = 0
                fixed_size = True
                for i in t["fields"]:
                    it = self.get_type(curr_proto_name, i["type"])
                    isz = it.get("size")
                    if isz is not None:
                        sz += isz
                    else:
                        fixed_size = False
                        break
                if fixed_size:
                    t["size"] = sz
            return t

        raise RuntimeError("Type not found: %s, current protocol: %s" % (type_name, curr_proto_name))

    def _load_protocol(self, proto_path: str) -> dict:
        proto = {
            "proto_id": None,
            "types": {},
            "messages": {},
        }
        for fn in os.listdir(proto_path):
            file_path = proto_path + os.path.sep + fn

            if not (os.path.isfile(file_path) and fn.endswith(CONFIG_EXT)):
                continue

            item_name = fn.replace(CONFIG_EXT, "")
            print("  - %s" % item_name)

            with open(file_path, "r") as f:
                item = yaml.safe_load(f)
                if item_name == PROTOCOL_ITEM:
                    if "proto_id" in item:
                        proto["proto_id"] = item["proto_id"]
                else:
                    proto["types"][item_name] = item
        return proto
