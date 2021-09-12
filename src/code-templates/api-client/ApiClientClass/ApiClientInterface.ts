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

const createSuccessResponsesTypeAlias = (typeName: string, factory: TsGenerator.Factory.Type, errorResponseNames: string[]) => {
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

  const createResponsesTypeAlias = (factory: TsGenerator.Factory.Type, responseNames: string[]) => {
    if (responseNames.length === 0) {
      return ts.factory.createToken(ts.SyntaxKind.VoidKeyword);
    }

    const union = factory.UnionTypeNode.create({
        typeNodes: responseNames.map(name => {
          return factory.IndexedAccessTypeNode.create({
            objectType: factory.TypeReferenceNode.create({
              name,
            }),
            indexType: factory.TypeOperatorNode.create({
              syntaxKind: "keyof",
              type: factory.TypeReferenceNode.create({
                name,
              }),
            }) 
          }
          )
        }),
      });

    return union;
  };

  const generateParams = (factory: TsGenerator.Factory.Type, convertedParams: CodeGenerator.ConvertedParams) => {
    const hasParamsArguments =
    convertedParams.hasParameter ||
    convertedParams.hasRequestBody ||
    convertedParams.has2OrMoreSuccessResponseContentTypes ||
    convertedParams.has2OrMoreRequestContentTypes;

    if (!hasParamsArguments) {
      return ts.factory.createToken(ts.SyntaxKind.VoidKeyword);
    }

    const typeArguments: ts.TypeNode[] = [];
    if (convertedParams.has2OrMoreRequestContentTypes) {
      if (convertedParams.requestContentTypes.includes('application/json') ) {
        typeArguments.push(
          factory.LiteralTypeNode.create({
            value: "application/json",
          }),
        );
      }

      //typeArguments.push(
      //  factory.UnionTypeNode.create({
      //    typeNodes: convertedParams.requestContentTypes.map( value => 
      //      factory.LiteralTypeNode.create({value})
      //    )
      //  })

      //typeArguments.push(
      //  factory.TypeReferenceNode.create({
      //    name: "RequestContentType",
      //  }),
      //);
    }
    if (convertedParams.has2OrMoreSuccessResponseContentTypes) {
      typeArguments.push(
        factory.UnionTypeNode.create({
          typeNodes: convertedParams.successResponseContentTypes.map( value => 
            factory.LiteralTypeNode.create({value})
          )
        })
      );

      //typeArguments.push(
      //  factory.TypeReferenceNode.create({
      //    name: "ResponseContentType",
      //  }),
      //);
    }
    return factory.TypeReferenceNode.create({
        name: convertedParams.argumentParamsTypeDeclaration,
        typeArguments,
    });
  };

  const ParameterAndResponse = factory.TypeAliasDeclaration.create({
    export: true,
    name: "ParametersAndResponse",
    type: factory.TypeLiteralNode.create({
      members: list.map(item => factory.PropertySignature.create({
        name: item.convertedParams.escapedOperationId,
        optional: false,
        type: factory.TypeLiteralNode.create({
          members: [
            factory.PropertySignature.create({
              name: 'parameters',
              optional: false,
              type: generateParams(factory, item.convertedParams)
            }),
            factory.PropertySignature.create({
              name: 'response',
              optional: false,
              type: createResponsesTypeAlias(factory,item.convertedParams.responseSuccessNames)   
            }),
          ]
        })
      })
      )
    })
  })

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
    ParameterAndResponse,
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
