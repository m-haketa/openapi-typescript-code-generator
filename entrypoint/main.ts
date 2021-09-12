import * as fs from "fs";

import { CodeGenerator } from "../src/";
import * as Templates from "../src/templates";
import type * as Types from "../src/types";

const main = () => {
  const codeGenerator = new CodeGenerator("./entrypoint/api-schema.yml");

  const apiClientGeneratorTemplate: Types.CodeGenerator.CustomGenerator<Templates.ApiClient.Option> = {
    generator: Templates.ApiClient.generator,
    option: {},
  };

  const typeDefCode = codeGenerator.generateTypeDefinition();
  const apiClientCode = codeGenerator.generateCode([
    {
      generator: () => {
        return [
          `import { Schemas } from "./types";`,
          `type GetParameters<T> = (T extends {parameter: unknown} ? T['parameter'] : {}) &
                         (T extends {requestBody: unknown} ? T['requestBody'] : {});`];
      },
    },
    codeGenerator.getAdditionalTypeDefinitionCustomCodeGenerator(),
    apiClientGeneratorTemplate,
  ]);

  fs.writeFileSync("./entrypoint/__generated__/types.ts", typeDefCode, {
    encoding: "utf-8",
  });
  fs.writeFileSync("./entrypoint/__generated__/apiClient.ts", apiClientCode, {
    encoding: "utf-8",
  });
};

main();
