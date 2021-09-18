import ts from "typescript";

import type { TsGenerator } from "../../../api";
import type { CodeGenerator } from "../../../types";
import type { Option } from "../types";

const httpMethodList: string[] = ["GET", "PUT", "POST", "DELETE", "OPTIONS", "HEAD", "PATCH", "TRACE"];

const createErrorResponsesTypeAlias = (typeName: string, factory: TsGenerator.Factory.Type, errorResponseNames: string[]) => {
  if (errorResponseNames.length === 0) {
    return factory.TypeAliasDeclaration.create({
      export: true,
      name: typeName,
      type: ts.factory.createToken(ts.SyntaxKind.VoidKeyword),
    });
  }
  return factory.TypeAliasDeclaration.create({
    export: true,
    name: typeName,
    type: factory.UnionTypeNode.create({
      typeNodes: errorResponseNames.map(name => {
        return factory.TypeReferenceNode.create({
          name,
        });
      }),
    }),
  });
};

const createSuccessResponseTypeAlias = (typeName: string, factory: TsGenerator.Factory.Type, successResponseNames: string[]) => {
  if (successResponseNames.length === 0) {
    return factory.TypeAliasDeclaration.create({
      export: true,
      name: typeName,
      type: ts.factory.createToken(ts.SyntaxKind.VoidKeyword),
    });
  }
  return factory.TypeAliasDeclaration.create({
    export: true,
    name: typeName,
    type: factory.UnionTypeNode.create({
      typeNodes: successResponseNames.map(name => {
        return factory.TypeReferenceNode.create({
          name,
        });
      }),
    }),
  });
};

const createHttpMethod = (factory: TsGenerator.Factory.Type) => {
  return factory.TypeAliasDeclaration.create({
    export: true,
    name: "HttpMethod",
    type: factory.TypeNode.create({ type: "string", enum: httpMethodList }),
  });
};

const createQueryParamsDeclarations = (factory: TsGenerator.Factory.Type) => {
  const queryParameterDeclaration = factory.InterfaceDeclaration.create({
    export: true,
    name: "QueryParameter",
    members: [
      factory.PropertySignature.create({
        name: "value",
        optional: false,
        type: factory.TypeNode.create({ type: "any" }),
      }),
      factory.PropertySignature.create({
        name: "style",
        optional: true,
        type: factory.TypeNode.create({ type: "string", enum: ["form", "spaceDelimited", "pipeDelimited", "deepObject"] }),
      }),
      factory.PropertySignature.create({
        name: "explode",
        optional: false,
        type: factory.TypeNode.create({ type: "boolean" }),
      }),
    ],
  });
  const queryParametersDeclaration = factory.InterfaceDeclaration.create({
    export: true,
    name: "QueryParameters",
    members: [
      factory.IndexSignatureDeclaration.create({
        name: "key",
        type: factory.TypeReferenceNode.create({ name: "QueryParameter" }),
      }),
    ],
  });

  return [queryParameterDeclaration, queryParametersDeclaration];
};

const createObjectLikeInterface = (factory: TsGenerator.Factory.Type) => {
  return factory.InterfaceDeclaration.create({
    export: true,
    name: "ObjectLike",
    members: [
      factory.IndexSignatureDeclaration.create({
        name: "key",
        type: factory.TypeNode.create({ type: "any" }),
      }),
    ],
  });
};

export const create = (factory: TsGenerator.Factory.Type, list: CodeGenerator.Params[], option: Option): ts.Statement[] => {
  const objectLikeOrAnyType = factory.UnionTypeNode.create({
    typeNodes: [
      factory.TypeReferenceNode.create({
        name: "ObjectLike",
      }),
      factory.TypeNode.create({
        type: "any",
      }),
    ],
  });

  const httpMethod = factory.ParameterDeclaration.create({
    name: "httpMethod",
    type: factory.TypeReferenceNode.create({
      name: "HttpMethod",
    }),
  });
  const url = factory.ParameterDeclaration.create({
    name: "url",
    type: factory.TypeNode.create({ type: "string" }),
  });
  const headers = factory.ParameterDeclaration.create({
    name: "headers",
    type: objectLikeOrAnyType,
  });
  const requestBody = factory.ParameterDeclaration.create({
    name: "requestBody",
    type: objectLikeOrAnyType,
  });
  const queryParameters = factory.ParameterDeclaration.create({
    name: "queryParameters",
    type: factory.UnionTypeNode.create({
      typeNodes: [
        factory.TypeReferenceNode.create({
          name: "QueryParameters",
        }),
        factory.TypeNode.create({ type: "undefined" }),
      ],
    }),
  });
  const options = factory.ParameterDeclaration.create({
    name: "options",
    optional: true,
    type: factory.TypeReferenceNode.create({
      name: "RequestOption",
    }),
  });

  const successResponseNames = list.map(item => item.convertedParams.responseSuccessNames).flat();

  const errorResponseNamespace = factory.Namespace.create({
    export: true,
    name: "ErrorResponse",
    statements: list.map(item => {
      return createErrorResponsesTypeAlias(`${item.convertedParams.escapedOperationId}`, factory, item.convertedParams.responseErrorNames);
    }),
  });

  /*
  const successResponseNamespace = factory.Namespace.create({
    export: true,
    name: "SuccessResponse",
    statements: list.map(item => {
      return createSuccessResponsesTypeAlias(`${item.convertedParams.escapedOperationId}`, factory, item.convertedParams.responseSuccessNames);
    }),
  });
  
      members: list.map(item => factory.PropertySignature.create({
      name: item.convertedParams.escapedOperationId,
      optional: false,
      type: factory.TypeNode.create({})  
  */
  const Name_KeyofName =  (factory: TsGenerator.Factory.Type, name: string) => 
  factory.IndexedAccessTypeNode.create({
    objectType: factory.TypeReferenceNode.create({
      name,
    }),
    indexType: factory.TypeOperatorNode.create({
      syntaxKind: "keyof",
      type: factory.TypeReferenceNode.create({
        name,
      }),
    }),
  });


  const responseType = (factory: TsGenerator.Factory.Type, convertedParams: CodeGenerator.ConvertedParams) => {
    if (convertedParams.responseSuccessNames.length === 0) {
      return ts.factory.createToken(ts.SyntaxKind.NeverKeyword);  
    }
    
    if (!convertedParams.successResponseContentTypes.includes('application/json')) {
      return ts.factory.createToken(ts.SyntaxKind.NeverKeyword);  
    }

    const union = factory.UnionTypeNode.create({
      typeNodes: convertedParams.responseSuccessNames.map(name => 
        factory.IndexedAccessTypeNode.create({
          objectType: factory.TypeReferenceNode.create({
            name,
          }),
          indexType: factory.TypeReferenceNode.create({
            name: `"application/json"`,
          }),
        })
      ),
    });

    return union;
  };

  const parametersType = (factory: TsGenerator.Factory.Type, convertedParams: CodeGenerator.ConvertedParams) => {
    const hasParamsArguments =
      convertedParams.hasParameter ||
      convertedParams.hasRequestBody ||
      convertedParams.has2OrMoreSuccessResponseContentTypes ||
      convertedParams.has2OrMoreRequestContentTypes;

    if (!hasParamsArguments) {
      return ts.factory.createToken(ts.SyntaxKind.UndefinedKeyword);
    }

    const typeArguments: ts.TypeNode[] = [];
    if (convertedParams.has2OrMoreRequestContentTypes) {
      if (convertedParams.requestContentTypes.includes("application/json")) {
        typeArguments.push(
          factory.LiteralTypeNode.create({
            value: "application/json",
          }),
        );
      }
    }
    if (convertedParams.has2OrMoreSuccessResponseContentTypes) {
      typeArguments.push(
        factory.UnionTypeNode.create({
          typeNodes: convertedParams.successResponseContentTypes.map(value => factory.LiteralTypeNode.create({ value })),
        }),
      );
    }

    const paramType = factory.TypeReferenceNode.create({
      name: convertedParams.argumentParamsTypeDeclaration,
      typeArguments,
    });

    return factory.TypeReferenceNode.create({
      name: 'GetParameters',
      typeArguments: [paramType],
    });
  };

  const responseContentTypes = (factory: TsGenerator.Factory.Type, convertedParams: CodeGenerator.ConvertedParams) => {
    if (convertedParams.successResponseContentTypes.length === 0) {
      return ts.factory.createToken(ts.SyntaxKind.UndefinedKeyword);
      //return factory.LiteralTypeNode.create({value : ""});
    }

    return factory.UnionTypeNode.create({
      typeNodes: convertedParams.successResponseContentTypes.map(value => factory.LiteralTypeNode.create({ value })),
    });
  };

  const errorResponseType = (factory: TsGenerator.Factory.Type, errorResponseNames: string[]) => {
    if (errorResponseNames.length === 0) {
      return ts.factory.createToken(ts.SyntaxKind.VoidKeyword);
    }

    return factory.TypeLiteralNode.create({
        members: errorResponseNames.map(name => {
            const nameSplitted = name.split('$');
            return factory.PropertySignature.create({
              name: nameSplitted[nameSplitted.length - 1],
              optional: false,
              type: Name_KeyofName(factory, name)
            })
          }
        )
      });
  };

  const parametersAndResponseNode = (item: CodeGenerator.Params) =>
    factory.PropertySignature.create({
      name: item.convertedParams.escapedOperationId,
      optional: false,
      type: factory.TypeLiteralNode.create({
        members: [
          factory.PropertySignature.create({
            name: "parameters",
            optional: false,
            type: parametersType(factory, item.convertedParams),
          }),
          factory.PropertySignature.create({
            name: "response",
            optional: false,
            type: responseType(factory, item.convertedParams),
          }),
          //factory.PropertySignature.create({
          //  name: "errorResponse",
          //  optional: false,
          //  type: errorResponseType(factory, item.convertedParams.responseErrorNames),
          //}),
          factory.PropertySignature.create({
            name: "method",
            optional: false,
            type: factory.LiteralTypeNode.create({
              value: item.operationParams.httpMethod,
            }),
          }),
          factory.PropertySignature.create({
            name: "requestUri",
            optional: false,
            type: factory.LiteralTypeNode.create({
              value: item.operationParams.requestUri,
            }),
          }),
          factory.PropertySignature.create({
            name: "responseContentTypes",
            optional: false,
            type: responseContentTypes(factory, item.convertedParams),
          }),
        ],
      }),
    });

  const APIType = factory.TypeAliasDeclaration.create({
    export: true,
    name: "ParametersAndResponse",
    type: factory.TypeLiteralNode.create({
      members: list.map(parametersAndResponseNode),
    }),
  });

  const returnType = option.sync
    ? factory.TypeReferenceNode.create({
        name: "T",
      })
    : factory.TypeReferenceNode.create({
        name: "Promise",
        typeArguments: [
          factory.TypeReferenceNode.create({
            name: "T",
          }),
        ],
      });

  const functionType = factory.FunctionTypeNode.create({
    typeParameters: [
      factory.TypeParameterDeclaration.create({
        name: "T",
        defaultType: factory.TypeReferenceNode.create({
          name: "SuccessResponses",
        }),
      }),
    ],
    parameters: [httpMethod, url, headers, requestBody, queryParameters, options],
    type: returnType,
  });

  const requestFunction = factory.PropertySignature.create({
    name: "request",
    optional: false,
    type: functionType,
  });

  return [
    createHttpMethod(factory),
    createObjectLikeInterface(factory),
    ...createQueryParamsDeclarations(factory),
    createSuccessResponseTypeAlias("SuccessResponses", factory, successResponseNames),
    APIType,
    errorResponseNamespace,
    factory.InterfaceDeclaration.create({
      export: true,
      name: "ApiClient",
      members: [requestFunction],
      typeParameters: [
        factory.TypeParameterDeclaration.create({
          name: "RequestOption",
        }),
      ],
    }),
  ];
};
