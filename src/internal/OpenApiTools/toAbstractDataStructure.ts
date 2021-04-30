import type { OpenApi } from "../../types";
import type * as ADS from "../AbstractDataStructure";
import { UnSupportError, UnsetTypeError } from "../Exception";
import * as Logger from "../Logger";
import * as Reference from "./components2/Reference";

import * as Guard from "./Guard";
import * as InferredType from "./InferredType";
import { ObjectSchemaWithAdditionalProperties } from "./types";
import { Payload, Convert, Option } from "./types/tmp";


export const generateMultiTypeNode = (
  payload: Payload,
  schemas: OpenApi.JSONSchema[],
  convert: Convert,
  multiType: "oneOf" | "allOf" | "anyOf",
): ADS.Struct => {
  const value = schemas.map(schema => convert(payload, schema));
  if (multiType === "oneOf") {
    return {
      kind: "union",
      structs: value,
    };
  }
  if (multiType === "allOf") {
    return {
      kind: "intersection",
      structs: value,
    };
  }
  // TODO Feature Development: Calculate intersection types
  return {
    kind: "never",
  };
};

const nullable = (schemaType: ADS.Struct, nullable: boolean): ADS.Struct => {
  if (nullable) {
    return {
      kind: "union",
      structs: [
        schemaType,
        {
          kind: "null",
        },
      ],
    };
  }
  return schemaType;
};

export const convert: Convert = (
  payload: Payload,
  schema: OpenApi.Schema | OpenApi.Reference | OpenApi.JSONSchemaDefinition,
  option?: Option,
): ADS.Struct => {
  const { context, currentPoint, converterContext } = payload;
  if (typeof schema === "boolean") {
    // https://swagger.io/docs/specification/data-models/dictionaries/#free-form
    return {
      kind: "object",
      properties: [],
    };
  }
  if (Guard.isReference(schema)) {
    const reference = Reference.generate<OpenApi.Schema | OpenApi.JSONSchemaDefinition>(payload, schema);
    if (reference.type === "local") {
      // Type Aliasを作成 (or すでにある場合は作成しない)
      context.setReferenceHandler(currentPoint, reference);
      const { maybeResolvedName } = context.resolveReferencePath(currentPoint, reference.path);
      return {
        kind: "reference",
        name: converterContext.escapeDeclarationText(maybeResolvedName),
      };
    }
    // サポートしているディレクトリに対して存在する場合
    if (reference.componentName) {
      // Type AliasもしくはInterfaceを作成
      context.setReferenceHandler(currentPoint, reference);
      // Aliasを貼る
      return {
        kind: "reference",
        name: context.resolveReferencePath(currentPoint, reference.path).name,
      };
    }
    // サポートしていないディレクトリに存在する場合、直接Interface、もしくはTypeAliasを作成
    return convert({ ...payload, currentPoint: reference.referencePoint }, reference.data, { parent: schema });
  }

  if (Guard.isOneOfSchema(schema)) {
    return generateMultiTypeNode(payload, schema.oneOf, convert, "oneOf");
  }
  if (Guard.isAllOfSchema(schema)) {
    return generateMultiTypeNode(payload, schema.allOf, convert, "allOf");
  }
  if (Guard.isAnyOfSchema(schema)) {
    return generateMultiTypeNode(payload, schema.anyOf, convert, "anyOf");
  }

  if (Guard.isHasNoMembersObject(schema)) {
    return {
      kind: "object",
      properties: [],
    };
  }

  // schema.type
  if (!schema.type) {
    const inferredSchema = InferredType.getInferredType(schema);
    if (inferredSchema) {
      return convert(payload, inferredSchema, { parent: schema });
    }
    // typeを指定せずに、nullableのみを指定している場合に type object変換する
    if (typeof schema.nullable === "boolean") {
      return nullable({ kind: "any" }, schema.nullable);
    }
    if (option && option.parent) {
      Logger.info("Parent Schema:");
      Logger.info(JSON.stringify(option.parent));
    }
    // Logger.showFilePosition(entryPoint, currentPoint);
    throw new UnsetTypeError("Please set 'type' or '$ref' property \n" + JSON.stringify(schema));
  }
  switch (schema.type) {
    case "boolean": {
      return nullable({ kind: "boolean" }, !!schema.nullable);
    }
    case "null": {
      return {
        kind: "null",
      };
    }
    case "integer":
    case "number": {
      const items = schema.enum;
      let typeNode: ADS.Struct;
      if (items && Guard.isNumberArray(items)) {
        typeNode = {
          kind: "number",
          enum: items,
        };
      } else {
        typeNode = {
          kind: "number",
        };
      }
      return nullable(typeNode, !!schema.nullable);
    }
    case "string": {
      const items = schema.enum;
      let typeNode: ADS.Struct;
      if (items && Guard.isStringArray(items)) {
        typeNode = {
          kind: "string",
          enum: items,
        };
      } else {
        typeNode = {
          kind: "string",
        };
      }
      return nullable(typeNode, !!schema.nullable);
    }
    case "array": {
      if (Array.isArray(schema.items) || typeof schema.items === "boolean") {
        throw new UnSupportError(`schema.items = ${JSON.stringify(schema.items)}`);
      }
      const typeNode: ADS.Struct = {
        kind: "array",
        struct: schema.items
          ? convert(payload, schema.items, { parent: schema })
          : {
              kind: "undefined",
            },
      };
      return nullable(typeNode, !!schema.nullable);
    }
    case "object": {
      const required: string[] = schema.required || [];
      // // https://swagger.io/docs/specification/data-models/dictionaries/#free-form
      if (schema.additionalProperties === true) {
        return {
          kind: "object",
          properties: [],
        };
      }
      const value: ADS.PropertySignatureStruct[] = Object.entries(schema.properties || {}).map(([name, jsonSchema]) => {
        return {
          kind: "PropertySignature",
          name: converterContext.escapePropertySignatureName(name),
          struct: convert(payload, jsonSchema, { parent: schema.properties }),
          optional: !required.includes(name),
          comment: typeof jsonSchema !== "boolean" ? jsonSchema.description : undefined,
        };
      });
      if (schema.additionalProperties) {
        const additionalProperties: ADS.IndexSignatureStruct = {
          kind: "IndexSignature",
          name: "key",
          struct: convert(payload, schema.additionalProperties, {
            parent: schema.properties,
          }),
        };
        return {
          kind: "object",
          properties: [...value, additionalProperties],
        };
      }
      const typeNode: ADS.Struct = {
        kind: "object",
        properties: value,
      };
      return nullable(typeNode, !!schema.nullable);
    }
    default:
      return {
        kind: "any",
      };
    // throw new UnknownError("what is this? \n" + JSON.stringify(schema, null, 2));
  }
};

export const convertAdditionalProperties = (payload: Payload, schema: ObjectSchemaWithAdditionalProperties): ADS.IndexSignatureStruct => {
  // // https://swagger.io/docs/specification/data-models/dictionaries/#free-form
  if (schema.additionalProperties === true) {
    // TODO バグってそう
    // factory.TypeNode.create({
    //   type: schema.type,
    //   value: [],
    // });
  }
  const additionalProperties: ADS.IndexSignatureStruct = {
    kind: "IndexSignature",
    name: "key",
    struct: convert(payload, schema.additionalProperties, {
      parent: schema.properties,
    }),
  };
  return additionalProperties;
};
